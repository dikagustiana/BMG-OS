"use server";
import { revalidatePath } from "next/cache";
import { FS_LINE_BY_CODE, fsSign } from "@bmg/engine";
import { parseNumber, pick, TAG_POOLS, TAGS } from "@bmg/parsers";
import { requireViewer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase";
import { assertModule } from "@/lib/modules-server";
import { can } from "@/lib/roles";
import { monthParam } from "@/lib/month";
import { WriteError } from "@/lib/write";

type S = { ok?: string; error?: string };

const POOLS = ["A", "KUPAS", "B", "C", "D", "E", "MATERIAL", "OPEX_PABRIK", "THR", "BPJS", "PAYROLL_SPLIT", "NONE"];

async function guard(area: "upload_finance" | "coa_map") {
  const v = await requireViewer();
  await assertModule("b1_ingest");
  if (!can(v.role, area)) throw new WriteError("Peran Anda tidak boleh mengubah data ini");
  return v;
}

function monthOfForm(form: FormData): string {
  const m = monthParam(String(form.get("month") ?? ""));
  if (!m) throw new WriteError("Bulan tidak valid");
  return m;
}

const run = async (fn: () => Promise<string>): Promise<S> => {
  try {
    return { ok: await fn() };
  } catch (e) {
    return { error: (e as Error).message };
  }
};

/** Add one voucher tag (BIAYA BERSAMA bagian 8) by hand. */
export async function addTag(_: S, form: FormData): Promise<S> {
  return run(async () => {
    await guard("upload_finance");
    const month = monthOfForm(form);
    const voucher = String(form.get("voucher") ?? "").trim(), account = String(form.get("account") ?? "").trim();
    const tag = pick(String(form.get("tag") ?? ""), TAGS as unknown as Record<keyof typeof TAGS, string[]>);
    const pool = pick(String(form.get("target_pool") ?? ""), TAG_POOLS as unknown as Record<keyof typeof TAG_POOLS, string[]>);
    const amount = parseNumber(String(form.get("amount") ?? ""));
    const line = String(form.get("target_line") ?? "").trim() || null;
    if (!voucher || !/^\d{4}-\d{3}$/.test(account)) throw new WriteError("Voucher dan akun (9999-999) wajib diisi");
    if (!tag || !pool || amount === null) throw new WriteError("Tag, pool tujuan, dan jumlah wajib diisi");
    if (pool === "MATERIAL" && !line) throw new WriteError("Pool MATERIAL perlu lini (mis. FCC)");
    const sb = await supabaseServer();
    const { error } = await sb.from("gl_voucher_tag").insert({
      month, voucher, account, amount, tag, target_pool: pool, target_line: line, note: String(form.get("note") ?? "").trim() || null,
      line_key: `${voucher}|${account}|${tag}|manual-${crypto.randomUUID().slice(0, 8)}`, source: "Manual",
    });
    if (error) throw new WriteError(error.message);
    revalidatePath(`/m/${month}/input`);
    return `Tag ${tag} untuk ${voucher} / ${account} ditambahkan`;
  });
}

/** Remove a voucher tag (soft delete). */
export async function removeTag(_: S, form: FormData): Promise<S> {
  return run(async () => {
    const v = await guard("upload_finance");
    const month = monthOfForm(form);
    const sb = await supabaseServer();
    const { error, count } = await sb.from("gl_voucher_tag").update({ deleted_at: new Date().toISOString(), deleted_by: v.email }, { count: "exact" })
      .eq("id", String(form.get("id") ?? "")).eq("month", month).is("deleted_at", null);
    if (error) throw new WriteError(error.message);
    if (!count) throw new WriteError("Tag tidak ditemukan");
    revalidatePath(`/m/${month}/input`);
    return "Tag dihapus";
  });
}

/** Confirm a draft account mapping (coa_pool_map.confirmed; D10, B44). */
export async function confirmMapping(_: S, form: FormData): Promise<S> {
  return run(async () => {
    await guard("coa_map");
    const month = monthOfForm(form);
    const sb = await supabaseServer();
    const { error, count } = await sb.from("coa_pool_map").update({ confirmed: true }, { count: "exact" }).eq("id", String(form.get("id") ?? "")).eq("confirmed", false);
    if (error) throw new WriteError(error.message);
    if (!count) throw new WriteError("Mapping tidak ditemukan atau sudah dikonfirmasi");
    revalidatePath(`/m/${month}/input`);
    return "Mapping dikonfirmasi";
  });
}

/** Add a mapping for an account that has none in this month (effective from the month start). */
export async function addMapping(_: S, form: FormData): Promise<S> {
  return run(async () => {
    await guard("coa_map");
    const month = monthOfForm(form);
    const account = String(form.get("account") ?? "").trim();
    const pool = String(form.get("pool") ?? "");
    if (!/^\d{4}-\d{3}$/.test(account)) throw new WriteError("Akun harus berformat 9999-999");
    if (!POOLS.includes(pool)) throw new WriteError("Pool tidak dikenal");
    const sb = await supabaseServer();
    const { error } = await sb.from("coa_pool_map").insert({
      account, account_name: String(form.get("account_name") ?? "").trim() || null, effective_from: month, pool,
      fixed_flag: form.get("fixed") === "1", confirmed: true, note: String(form.get("note") ?? "").trim() || "Ditambahkan di Input bulanan",
      source: "Manual",
    });
    if (error) throw new WriteError(error.code === "23505" ? `Mapping ${account} mulai ${month} sudah ada` : error.message);
    revalidatePath(`/m/${month}/input`);
    return `Mapping ${account} → ${pool} mulai ${month} ditambahkan`;
  });
}

/** Add an account → FS line mapping (coa_fs_map; F07) effective from the month start. */
export async function addFsMapping(_: S, form: FormData): Promise<S> {
  return run(async () => {
    await guard("coa_map");
    const month = monthOfForm(form);
    const account = String(form.get("account") ?? "").trim();
    const code = String(form.get("fs_line_code") ?? "");
    const def = FS_LINE_BY_CODE.get(code);
    if (!/^\d{4}(-[0-9A-Za-z]+)?$|^\d{6}$/.test(account)) throw new WriteError("Nomor akun tidak dikenali");
    if (!def || def.kind !== "leaf") throw new WriteError("Pilih baris neraca atau laba rugi");
    const sb = await supabaseServer();
    const { error } = await sb.from("coa_fs_map").insert({
      account, account_name: String(form.get("account_name") ?? "").trim() || null, effective_from: month, fs_line_code: code,
      sign: fsSign(code), confirmed: true, note: "Ditambahkan di Input bulanan", source: "Manual",
    });
    if (error) throw new WriteError(error.code === "23505" ? `Mapping ${account} mulai ${month} sudah ada` : error.message);
    revalidatePath(`/m/${month}/input`);
    return `${account} → ${def.label_id} mulai ${month}`;
  });
}

/** Confirm a draft FS mapping (coa_fs_map.confirmed). */
export async function confirmFsMapping(_: S, form: FormData): Promise<S> {
  return run(async () => {
    await guard("coa_map");
    const month = monthOfForm(form);
    const sb = await supabaseServer();
    const { error, count } = await sb.from("coa_fs_map").update({ confirmed: true }, { count: "exact" }).eq("id", String(form.get("id") ?? "")).eq("confirmed", false);
    if (error) throw new WriteError(error.message);
    if (!count) throw new WriteError("Mapping tidak ditemukan atau sudah dikonfirmasi");
    revalidatePath(`/m/${month}/input`);
    return "Mapping dikonfirmasi";
  });
}

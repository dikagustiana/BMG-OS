import "server-only";
import { D, b01, b02, leavesFromTb, mappingGaps, monthLabel, sum, type CoaFsMapRow, type CoaMapping } from "@bmg/engine";
import { kindParser, type KindParser, type ParseCtx, type Sheet } from "@bmg/parsers";
import type { Supa } from "./supabase";
import type { Viewer } from "./session";
import { fetchAll } from "./write";
import { emptyTarget, fieldsOf, planByKey, planReplacePeriod, type PlanTarget } from "./plan";
import { rebuildFsAll } from "./rebuild-fs";

/**
 * Upload handlers of module B1 (PRD §5): parse with @bmg/parsers, then plan the database changes. Monthly kinds
 * replace the rows of the month (matched on line_key); budget_bp fills one BP version and locks it; std_master
 * creates a new draft standard version. Blockers stop the commit (re-checked at commit time).
 */

type Row = Record<string, unknown>;

export interface StagedSet { target: string; rows: Row[] }
export interface Plan { targets: PlanTarget[]; issues: string[]; blockers: string[] }

export interface UploadHandler {
  parser: KindParser;
  /**
   * Inserts into this table are written in chunks of `size` rows (each its own RLS-checked transaction) before the
   * final apply_upload, because one statement must finish within the API statement_timeout (8 s). Only for targets
   * whose rows stay invisible until the final transaction marks them (budget_bp: a version counts once imported_at
   * is set); a failed chunk leaves the upload planned and a retry inserts only the rows still missing.
   */
  chunk?: { table: string; size: number };
  parse(sheets: Sheet[], ctx: ParseCtx): ReturnType<KindParser["parse"]>;
  plan(sb: Supa, period: string, sets: StagedSet[], viewer: Viewer): Promise<Plan>;
  /** Runs after a successful commit (rebuild of the data marts the upload feeds); returns a line for the user. */
  after?(sb: Supa, period: string, viewer: Viewer): Promise<string>;
}

export const TABLE_LABEL: Record<string, string> = {
  gl_month: "GL per voucher", gl_voucher_tag: "Tag voucher", payroll_month: "Payroll per kelompok", payroll_journal: "Jurnal payroll",
  inventory_valuation: "Inventory Valuation", sales_by_item: "Sales by Item", average_price: "Average Price", cogm_card: "Kartu CoGM — kuantitas",
  cogm_material: "Kartu CoGM — material", driver_month: "Driver bulanan", fs_control: "Angka kontrol LK", budget_version: "Versi budget",
  budget_line: "Baris budget", budget_pool_map: "Mapping pool budget (draft)", std_version: "Versi standar (draft)", bom_line: "BOM",
  output_mix: "Komposisi output", routing: "Routing", rate_card: "Tarif", capacity: "Kapasitas",
  tb_month: "Neraca saldo per akun", history_fs_line: "Riwayat neraca dan laba rugi (aktual BP)", budget_fs_line: "Neraca dan laba rugi BP",
};

const ok = (): { issues: string[]; blockers: string[] } => ({ issues: [], blockers: [] });
const rp = (v: unknown) => D(String(v ?? 0)).toFixed(2);

async function mappingsAll(sb: Supa): Promise<CoaMapping[]> {
  return fetchAll<CoaMapping>((f, t) => sb.from("coa_pool_map").select("account, effective_from, effective_to, pool, confirmed").is("deleted_at", null).range(f, t));
}
async function monthRows<T>(sb: Supa, table: string, cols: string, period: string): Promise<T[]> {
  type Page = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
  return fetchAll<T>((f, t) => sb.from(table).select(cols).eq("month", period).is("deleted_at", null).range(f, t) as unknown as Page);
}

/** Monthly kind: replace the month's rows of every target the file carries; `extra` adds kind checks. */
function monthly(kind: Parameters<typeof kindParser>[0], extra?: (sb: Supa, period: string, sets: StagedSet[]) => Promise<{ issues: string[]; blockers: string[] }>): UploadHandler {
  const parser = kindParser(kind);
  return {
    parser,
    parse: (sheets, ctx) => parser.parse(sheets, ctx),
    async plan(sb, period, sets) {
      const targets: PlanTarget[] = [];
      for (const s of sets) {
        if (!s.rows.length) continue; // a section missing from the file leaves the stored rows alone
        targets.push(await planReplacePeriod(sb, s.target, TABLE_LABEL[s.target] ?? s.target, period, s.rows));
      }
      const x = extra ? await extra(sb, period, sets) : ok();
      return { targets, ...x };
    },
  };
}

const rowsOf = (sets: StagedSet[], t: string) => sets.find((s) => s.target === t)?.rows ?? [];

/** B44 at upload time: GL accounts (and tagged accounts) need an active mapping; missing ones block the commit. */
async function glChecks(sb: Supa, period: string, sets: StagedSet[]) {
  const gl = rowsOf(sets, "gl_month");
  const [maps, tags] = await Promise.all([mappingsAll(sb), monthRows<{ account: string }>(sb, "gl_voucher_tag", "account", period)]);
  const g = mappingGaps(period, [...new Set(gl.map((r) => String(r.account)))], tags.map((t) => t.account), maps);
  const fs = await monthRows<{ key: string; amount: string }>(sb, "fs_control", "key, amount", period);
  const c = b01(period, gl.map((r) => ({ account: String(r.account), net: String(r.net) })), maps, fs);
  return {
    blockers: g.missing.length ? [`B44: akun tanpa mapping aktif di ${monthLabel(period)}: ${g.missing.join(", ")}. Tambahkan mapping di Input bulanan → Mapping akun, lalu simpan lagi.`] : [],
    issues: [
      ...(g.draft.length ? [`B44 PERIKSA — mapping draft belum dikonfirmasi: ${g.draft.join(", ")}`] : []),
      ...(c.status === "GAGAL" ? [`B01: Σ GL konversi ≠ LK (selisih ${c.value!.toFixed(2)}; ${c.note})`] : []),
    ],
  };
}

async function tagChecks(sb: Supa, period: string, sets: StagedSet[]) {
  const tags = rowsOf(sets, "gl_voucher_tag");
  const gl = await monthRows<{ voucher: string | null; account: string }>(sb, "gl_month", "voucher, account", period);
  const maps = await mappingsAll(sb);
  const g = mappingGaps(period, [], [...new Set(tags.map((t) => String(t.account)))], maps);
  const known = new Set(gl.map((r) => `${r.voucher ?? ""}|${r.account}`));
  const missing = gl.length ? tags.filter((t) => !known.has(`${t.voucher}|${t.account}`)).map((t) => `${t.voucher} / ${t.account}`) : [];
  return {
    blockers: g.missing.length ? [`B44: akun bertag tanpa mapping aktif: ${g.missing.join(", ")}`] : [],
    issues: [
      ...(gl.length ? [] : ["GL bulan ini belum diunggah; voucher tag belum bisa dicocokkan"]),
      ...(missing.length ? [`Voucher/akun tidak ada di GL bulan ini (${missing.length}): ${missing.slice(0, 10).join("; ")}`] : []),
    ],
  };
}

async function payrollChecks(sb: Supa, period: string, sets: StagedSet[]) {
  const gl = await monthRows<{ account: string; net: string }>(sb, "gl_month", "account, net", period);
  const c = b02(period, gl, await mappingsAll(sb), rowsOf(sets, "payroll_journal").map((r) => ({ kind: String(r.kind), amount: String(r.amount) })));
  return { blockers: [], issues: c.status === "GAGAL" ? [`B02: GL 5101-002 ≠ jurnal (selisih ${c.value!.toFixed(2)}; ${c.note})`] : c.status === "BELUM_DIISI" ? [`B02 belum bisa dihitung: ${c.note}`] : [] };
}

async function salesChecks(sb: Supa, period: string, sets: StagedSet[]) {
  const fs = await monthRows<{ key: string; amount: string }>(sb, "fs_control", "key, amount", period);
  const lk = fs.find((f) => f.key === "revenue_4101_007");
  const total = sum(rowsOf(sets, "sales_by_item").map((r) => D(String(r.amount))));
  if (!lk) return { blockers: [], issues: [`Σ Sales by Item ${total.toFixed(2)}; angka LK pendapatan belum diunggah`] };
  const diff = total.minus(D(lk.amount));
  return { blockers: [], issues: diff.abs().gt(1) ? [`Σ Sales by Item ≠ LK 4101-007: ${total.toFixed(2)} vs ${rp(lk.amount)} (selisih ${diff.toFixed(2)})`] : [] };
}

async function fsChecks(sb: Supa, period: string, sets: StagedSet[]) {
  const gl = await monthRows<{ account: string; net: string }>(sb, "gl_month", "account, net", period);
  const c = b01(period, gl, await mappingsAll(sb), rowsOf(sets, "fs_control").map((r) => ({ key: String(r.key), amount: String(r.amount) })));
  return { blockers: [], issues: c.status === "GAGAL" ? [`B01: Σ GL konversi ≠ LK (selisih ${c.value!.toFixed(2)}; ${c.note})`] : [] };
}

/** budget_bp: period = version name. A new name creates the version; an imported (locked) version is never changed. */
const budgetBp: UploadHandler = {
  parser: kindParser("budget_bp"),
  chunk: { table: "budget_line", size: 2500 },
  parse: (sheets, ctx) => kindParser("budget_bp").parse(sheets, ctx),
  async plan(sb, period, sets) {
    const { data: v } = await sb.from("budget_version").select("id, status, imported_at").eq("name", period).maybeSingle();
    if (v?.imported_at) {
      return { targets: [], issues: [], blockers: [`Versi budget "${period}" sudah diimpor (${String(v.imported_at).slice(0, 10)}) dan terkunci; impor sebagai versi baru dengan nama lain (D9).`] };
    }
    const id = (v?.id as string | undefined) ?? crypto.randomUUID();
    const targets: PlanTarget[] = [];
    if (!v) targets.push({ ...emptyTarget("budget_version", "Versi budget baru"), inserts: [{ id, name: period, status: "locked", note: "Impor budget_bp" }] });
    const lines = rowsOf(sets, "budget_line").map((r) => ({ ...r, budget_version_id: id }));
    const pools = rowsOf(sets, "budget_pool_map").map((r) => ({ ...r, budget_version_id: id }));
    const existing = v ? await fetchAll<Row>((f, t) => sb.from("budget_line").select("*").eq("budget_version_id", id).is("deleted_at", null).range(f, t)) : [];
    const existingPool = v ? await fetchAll<Row>((f, t) => sb.from("budget_pool_map").select("*").eq("budget_version_id", id).is("deleted_at", null).range(f, t)) : [];
    targets.push(await planByKey("budget_line", TABLE_LABEL.budget_line, existing, lines, (r) => String(r.driver_code), fieldsOf(lines, [])));
    targets.push(await planByKey("budget_pool_map", TABLE_LABEL.budget_pool_map, existingPool, pools, (r) => String(r.bp_row_code), fieldsOf(pools, [])));
    targets.push({ ...emptyTarget("budget_version", "Kunci versi (imported_at)"), updates: [{ id, imported_at: new Date().toISOString(), status: "locked" }] });
    return {
      targets,
      issues: [
        `Setelah disimpan, versi "${period}" terkunci: barisnya tidak bisa diubah lagi (Q4).`,
        ...(existing.length && !v?.imported_at ? [`Impor sebelumnya belum selesai: ${existing.length} baris sudah ada; hanya baris yang belum ada yang ditambahkan.`] : []),
      ],
      blockers: [],
    };
  },
};

/** std_master: a new draft version (id made here so its lines can reference it in the same transaction). */
const stdMaster: UploadHandler = {
  parser: kindParser("std_master"),
  parse: (sheets, ctx) => kindParser("std_master").parse(sheets, ctx),
  async plan(sb, _period, sets) {
    const ver = rowsOf(sets, "std_version")[0];
    if (!ver) return { targets: [], issues: [], blockers: ['Tanggal "Berlaku mulai" belum diisi di template'] };
    const { data: ex } = await sb.from("std_version").select("status").eq("code", String(ver.code)).maybeSingle();
    if (ex) return { targets: [], issues: [], blockers: [`Kode versi ${String(ver.code)} sudah ada (${String(ex.status)}); pakai kode baru — versi standar tidak ditimpa`] };
    const id = crypto.randomUUID();
    const targets: PlanTarget[] = [{ ...emptyTarget("std_version", TABLE_LABEL.std_version), inserts: [{ id, ...ver }] }];
    for (const t of ["bom_line", "output_mix", "routing", "rate_card"]) {
      const rows = rowsOf(sets, t).map((r) => ({ ...r, std_version_id: id }));
      if (rows.length) targets.push({ ...emptyTarget(t, TABLE_LABEL[t]), inserts: rows });
    }
    const cap = rowsOf(sets, "capacity");
    if (cap.length) {
      const weeks = [...new Set(cap.map((r) => String(r.week_start)))];
      const existing = await fetchAll<Row>((f, t) => sb.from("capacity").select("*").in("week_start", weeks).is("deleted_at", null).range(f, t));
      targets.push(await planByKey("capacity", TABLE_LABEL.capacity, existing, cap, (r) => `${r.week_start}|${r.dept}`, fieldsOf(cap, []), true));
    }
    return { targets, issues: [], blockers: [] };
  },
};

/** F07 at upload time: every TB account with an amount needs an active coa_fs_map row; missing ones block. */
async function tbChecks(sb: Supa, period: string, sets: StagedSet[]) {
  const maps = await fetchAll<CoaFsMapRow>((f, t) => sb.from("coa_fs_map").select("account, effective_from, effective_to, fs_line_code, sign, confirmed").is("deleted_at", null).range(f, t));
  const rows = rowsOf(sets, "tb_month").map((r) => ({
    account: String(r.account), balance_open: r.balance_open === null || r.balance_open === undefined ? null : D(String(r.balance_open)),
    debit: D(String(r.debit ?? 0)), credit: D(String(r.credit ?? 0)), balance_close: D(String(r.balance_close ?? 0)),
  }));
  const t = leavesFromTb(period, rows, maps);
  return {
    blockers: t.unmapped.length ? [`Akun tanpa baris neraca/laba rugi di ${monthLabel(period)}: ${t.unmapped.join(", ")}. Tambahkan di Input bulanan → Mapping akun, lalu simpan lagi.`] : [],
    issues: t.draft.length ? [`Mapping draft belum dikonfirmasi: ${t.draft.join(", ")}`] : [],
  };
}

const fsAfter = async (sb: Supa, _period: string, viewer: Viewer) => rebuildFsAll(sb, viewer, "upload");

/** bp_fs: period = budget version name. History (Actual) replaces the months it carries; the BP lines fill the version once. */
const bpFs: UploadHandler = {
  parser: kindParser("bp_fs"),
  chunk: { table: "budget_fs_line", size: 2500 },
  parse: (sheets, ctx) => kindParser("bp_fs").parse(sheets, ctx),
  async plan(sb, period, sets) {
    const { data: v } = await sb.from("budget_version").select("id, fs_imported_at").eq("name", period).maybeSingle();
    if (v?.fs_imported_at) {
      return { targets: [], issues: [], blockers: [`Neraca dan laba rugi versi "${period}" sudah diimpor (${String(v.fs_imported_at).slice(0, 10)}); impor sebagai versi baru dengan nama lain.`] };
    }
    const id = (v?.id as string | undefined) ?? crypto.randomUUID();
    const targets: PlanTarget[] = [];
    if (!v) targets.push({ ...emptyTarget("budget_version", "Versi budget baru"), inserts: [{ id, name: period, status: "locked", note: "Impor bp_fs" }] });
    const hist = rowsOf(sets, "history_fs_line");
    const months = [...new Set(hist.map((r) => String(r.month)))];
    const existingHist = months.length ? await fetchAll<Row>((f, t) => sb.from("history_fs_line").select("*").in("month", months).is("deleted_at", null).range(f, t)) : [];
    targets.push(await planByKey("history_fs_line", TABLE_LABEL.history_fs_line, existingHist, hist, (r) => `${String(r.month).slice(0, 10)}|${r.line_key}`, fieldsOf(hist)));
    const bud = rowsOf(sets, "budget_fs_line").map((r) => ({ ...r, budget_version_id: id }));
    const existingBud = v ? await fetchAll<Row>((f, t) => sb.from("budget_fs_line").select("*").eq("budget_version_id", id).is("deleted_at", null).range(f, t)) : [];
    targets.push(await planByKey("budget_fs_line", TABLE_LABEL.budget_fs_line, existingBud, bud, (r) => `${String(r.month).slice(0, 10)}|${r.line_key}`, fieldsOf(bud, ["line_key"])));
    targets.push({ ...emptyTarget("budget_version", "Kunci neraca versi ini"), updates: [{ id, fs_imported_at: new Date().toISOString() }] });
    return {
      targets,
      issues: [`Setelah disimpan, neraca dan laba rugi BP versi "${period}" terkunci; riwayat aktual bulan ${months.map((m) => m.slice(0, 7)).join(", ")} diganti dengan isi file.`],
      blockers: [],
    };
  },
  after: fsAfter,
};

export const HANDLERS: UploadHandler[] = [
  monthly("gl_month", glChecks), monthly("gl_voucher_tag", tagChecks), monthly("payroll_month", payrollChecks),
  monthly("inventory_valuation"), monthly("sales_by_item", salesChecks), monthly("average_price"), monthly("cogm_card"),
  monthly("fs_control", fsChecks), budgetBp, stdMaster,
  { ...monthly("tb_month", tbChecks), after: fsAfter }, bpFs,
];

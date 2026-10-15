import "server-only";
import { createHash } from "node:crypto";
import { readWorkbook, type Mapping, type Masters, type UploadKind, type KindDef } from "@bmg/parsers";
import type { Role } from "./roles";
import type { Supa } from "./supabase";
import type { Viewer } from "./session";
import { applyChanges, applyUpload, fetchAll, WriteError, type TableChanges } from "./write";
import { HANDLERS, type Plan, type UploadHandler } from "./upload-handlers";

/**
 * Upload wizard (PRD v1 §5): file → stage (parse, issues per row, plan of changes) → commit (apply_upload: every target
 * table and the upload status in one RLS-checked transaction). Re-uploading the same period is idempotent: rows are
 * matched on line_key, changed rows are updated, rows no longer in the file are soft-deleted. Blockers (e.g. B44: an
 * account without mapping) stop the commit; the plan is computed again at commit time.
 */

type Row = Record<string, unknown>;

export function kindsFor(role: Role): KindDef[] {
  return HANDLERS.filter((h) => h.parser.def.roles.includes(role)).map((h) => h.parser.def);
}

function handlerFor(kind: string): UploadHandler {
  const h = HANDLERS.find((x) => x.parser.def.kind === kind);
  if (!h) throw new WriteError(`Jenis upload belum tersedia: ${kind}`);
  return h;
}

/** Reference lists the parsers check against (small master tables). */
export async function loadMasters(sb: Supa): Promise<Masters> {
  const [pg, mi, og, sk] = await Promise.all([
    sb.from("payroll_group").select("code, name, dept").is("deleted_at", null),
    sb.from("material_item").select("code, name").is("deleted_at", null),
    sb.from("others_group").select("code").is("deleted_at", null),
    sb.from("sku").select("code").is("deleted_at", null),
  ]);
  return {
    payrollGroups: (pg.data ?? []) as Masters["payrollGroups"],
    materialItems: (mi.data ?? []) as Masters["materialItems"],
    lines: ["FCC", "UU", "UO", "PABRIK", "LAIN", ...(og.data ?? []).map((g) => String(g.code)), ...(sk.data ?? []).map((s) => String(s.code))],
  };
}

export interface StageResult {
  uploadId: string;
  kind: UploadKind;
  period: string;
  fileName: string;
  sha: string;
  parse: {
    issues: string[];
    columns: string[];
    mapping: Mapping | null;
    headerRow: number | null;
    sheet: string | null;
    rowCount: number;
    badRows: { rowNo: number; issues: string[] }[];
    sample: Row[];
  };
  fields: { field: string; label: string; required: boolean }[];
  plan: { table: string; label: string; inserts: number; updates: number; deletes: number; supersede: number; unchanged: number; notes: string[] }[];
  blockers: string[];
}

const summary = (p: Plan) => p.targets.map((t) => ({
  table: t.table, label: t.label, inserts: t.inserts.length, updates: t.updates.length, deletes: t.deletes.length,
  supersede: t.supersede.length, unchanged: t.unchanged, notes: t.notes,
}));

const clean = (r: Row) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("_")));

/** Parse the file from storage, plan the changes and stage the upload. Nothing is written to input tables. */
export async function stageUpload(
  sb: Supa, viewer: Viewer, kind: UploadKind, period: string, path: string, fileName: string, opts: { mapping?: Mapping } = {},
): Promise<StageResult> {
  const h = handlerFor(kind);
  if (!h.parser.def.roles.includes(viewer.role)) throw new WriteError("Peran Anda tidak boleh mengunggah jenis ini");
  const dl = await sb.storage.from("uploads").download(path);
  if (dl.error || !dl.data) throw new WriteError(`File tidak terbaca dari storage: ${dl.error?.message}`);
  const bytes = new Uint8Array(await dl.data.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");
  let res;
  try {
    res = h.parse(readWorkbook(bytes, fileName), { period, mapping: opts.mapping, masters: await loadMasters(sb), role: viewer.role });
  } catch (e) {
    throw new WriteError(`File tidak bisa dibaca sebagai ${h.parser.def.label}: ${(e as Error).message}`);
  }
  const uploadPeriod = res.period ?? period;
  const plan = res.sets.some((s) => s.rows.length) ? await h.plan(sb, uploadPeriod, res.sets, viewer) : { targets: [], issues: [], blockers: [] };
  const issues = [...res.issues, ...plan.issues];
  const ins = await sb.from("upload").insert({
    kind, period: uploadPeriod, file_name: fileName, sha256: sha, file_path: path, uploaded_by: viewer.email, uploaded_by_name: viewer.fullName, status: "planned",
    row_count: res.rows.length, issues: [...plan.blockers.map((b) => `DIBLOK: ${b}`), ...issues], mapping: res.detected?.mapping ?? null,
    plan: { targets: summary(plan), blockers: plan.blockers },
  }).select("id").single();
  if (ins.error) throw new WriteError(ins.error.message);
  const uploadId = (ins.data as { id: string }).id;
  const staged = res.sets.flatMap((s) => s.rows.map((r) => ({ target: s.target, data: r })));
  for (let i = 0; i < staged.length; i += 1000) {
    const part = staged.slice(i, i + 1000).map((s, j) => ({ upload_id: uploadId, row_no: i + j + 1, target: s.target, data: s.data }));
    const e = await sb.from("upload_row").insert(part);
    if (e.error) throw new WriteError(`staging: ${e.error.message}`);
  }
  return {
    uploadId, kind, period: uploadPeriod, fileName, sha,
    parse: {
      issues, columns: res.detected?.columns ?? [], mapping: res.detected?.mapping ?? null, headerRow: res.detected?.headerRow ?? null,
      sheet: res.detected?.sheet ?? null, rowCount: res.rows.length,
      badRows: res.rows.filter((r) => r.issues.length).slice(0, 50).map((r) => ({ rowNo: r.rowNo, issues: r.issues })),
      sample: (res.sets.find((s) => s.rows.length)?.rows ?? []).slice(0, 25).map(clean),
    },
    fields: res.fields.map((f) => ({ field: f.field, label: f.label, required: !!f.required })),
    plan: summary(plan),
    blockers: plan.blockers,
  };
}

/** Only the uploader or Admin may commit or reject an upload (the database checks it again in apply_upload). */
function assertOwner(viewer: Viewer, uploadedBy: unknown): void {
  if (viewer.role !== "admin" && uploadedBy !== viewer.email) throw new WriteError("Hanya pengunggah atau Admin yang bisa memproses upload ini");
}

/** Commit a planned upload: re-plan against the current data, then apply every target in one transaction. */
export async function commitUpload(sb: Supa, viewer: Viewer, uploadId: string): Promise<string> {
  const { data: up, error } = await sb.from("upload").select("*").eq("id", uploadId).single();
  if (error || !up) throw new WriteError("Upload tidak ditemukan");
  assertOwner(viewer, up.uploaded_by);
  if (up.status !== "planned" && up.status !== "staged") throw new WriteError(`Upload sudah ${up.status}`);
  const h = handlerFor(String(up.kind));
  if (!h.parser.def.roles.includes(viewer.role)) throw new WriteError("Peran Anda tidak boleh mengunggah jenis ini");
  const rows = await fetchAll<{ target: string; data: Row }>((f, t) => sb.from("upload_row").select("target, data").eq("upload_id", uploadId).order("row_no").range(f, t));
  const sets = new Map<string, Row[]>();
  for (const r of rows) sets.set(r.target, [...(sets.get(r.target) ?? []), r.data]);
  const plan = await h.plan(sb, String(up.period), [...sets.entries()].map(([target, rs]) => ({ target, rows: rs })), viewer);
  if (plan.blockers.length) throw new WriteError(`Belum bisa disimpan: ${plan.blockers.join(" · ")}`);
  const changes: TableChanges[] = plan.targets.map((t) => ({
    table: t.table,
    inserts: t.inserts.map((r) => ({ ...clean(r), upload_id: uploadId, source: (r.source as string | undefined) ?? h.parser.def.source })),
    updates: t.updates, softDeletes: t.deletes, supersede: t.supersede,
  }));
  let pre = 0;
  if (h.chunk) {
    for (const c of changes.filter((x) => x.table === h.chunk!.table && x.inserts.length > h.chunk!.size)) {
      for (let i = 0; i < c.inserts.length; i += h.chunk.size) {
        pre += (await applyChanges(sb, c.table, c.inserts.slice(i, i + h.chunk.size))).inserted;
      }
      c.inserts = [];
    }
  }
  const counts = await applyUpload(sb, uploadId, changes);
  if (pre) await sb.from("upload").update({ inserted: counts.inserted + pre, message: `${pre} baris ditulis bertahap sebelum transaksi akhir` }).eq("id", uploadId);
  const saved = `Disimpan: ${counts.inserted + pre} baris baru, ${counts.updated} diubah, ${counts.deleted} dihapus.`;
  if (!h.after) return saved;
  try {
    return `${saved} ${await h.after(sb, String(up.period), viewer)}`;
  } catch (e) {
    return `${saved} Hitung ulang gagal: ${(e as Error).message}. Ulangi dari tombol Hitung ulang.`;
  }
}

/** Drop a staged/planned upload (status rejected; staged rows removed). */
export async function rejectUpload(sb: Supa, viewer: Viewer, uploadId: string): Promise<void> {
  const { data: up, error: e } = await sb.from("upload").select("uploaded_by").eq("id", uploadId).single();
  if (e || !up) throw new WriteError("Upload tidak ditemukan");
  assertOwner(viewer, up.uploaded_by);
  await sb.from("upload_row").delete().eq("upload_id", uploadId);
  const { error } = await sb.from("upload").update({ status: "rejected" }).eq("id", uploadId).in("status", ["staged", "planned"]);
  if (error) throw new WriteError(error.message);
}

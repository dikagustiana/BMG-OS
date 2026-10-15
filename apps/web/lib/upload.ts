import "server-only";
import { createHash } from "node:crypto";
import { D } from "@bmg/engine";
import { readWorkbook, type Detected, type KindDef, type Mapping, type ParsedRow, type Sheet, type UploadKind } from "@bmg/parsers";
import type { Role } from "./roles";
import type { Supa } from "./supabase";
import type { Viewer } from "./session";
import { applyChanges, fetchAll, WriteError, type ChangeCounts } from "./write";

/**
 * Upload wizard (PRD v1 §5): file → stage (parse, issues per row, plan of changes) → commit (one RLS-checked
 * apply_changes call per target table). Re-uploading the same period is idempotent: rows are matched on line_key,
 * changed rows are updated, rows no longer in the file are soft-deleted.
 *
 * Parsers live in @bmg/parsers; each upload kind registers a handler here in the phase that ships it (Fase 1+).
 */

type Row = Record<string, unknown>;

export interface StagedSet {
  target: string;
  rows: Row[];
}

export interface ParseOutcome {
  detected: Detected | null;
  rows: ParsedRow[];
  sets: StagedSet[];
  issues: string[];
}

export interface PlanTarget {
  table: string;
  label: string;
  inserts: Row[];
  updates: Row[];
  deletes: string[];
  supersede: string[];
  unchanged: number;
  notes: string[];
}

export interface Plan {
  targets: PlanTarget[];
  issues: string[];
}

export interface UploadHandler {
  def: KindDef;
  parse(sheets: Sheet[], opts: { period: string; mapping?: Mapping }): ParseOutcome;
  plan(sb: Supa, period: string, sets: StagedSet[]): Promise<Plan>;
}

/** Registered upload handlers. Empty in Fase 0. */
const HANDLERS: UploadHandler[] = [];

export function kindsFor(role: Role): KindDef[] {
  return HANDLERS.filter((h) => h.def.roles.includes(role)).map((h) => h.def);
}

function handlerFor(kind: string): UploadHandler {
  const h = HANDLERS.find((x) => x.def.kind === kind);
  if (!h) throw new WriteError(`Jenis upload belum tersedia: ${kind}`);
  return h;
}

const blank = (v: unknown) => (v === undefined || v === "" ? null : v);

/** Value equality across DB numerics (strings) and parsed values (decimal strings); numbers compare as decimals. */
export function same(a: unknown, b: unknown): boolean {
  const na = blank(a), nb = blank(b);
  if (na === null || nb === null) return na === nb;
  const num = /^-?\d+(\.\d+)?$/;
  if (num.test(String(na)) && num.test(String(nb))) return D(String(na)).equals(D(String(nb)));
  return String(na) === String(nb);
}

/**
 * Plan for a period-scoped input table: staged rows carry `line_key`; existing active rows of the period are matched
 * on it. Matched + changed → update; new → insert; old rows not in the file → soft delete.
 */
export async function planReplacePeriod(
  sb: Supa, table: string, label: string, periodColumn: string, period: string, staged: Row[], fields: string[],
): Promise<PlanTarget> {
  const t: PlanTarget = { table, label, inserts: [], updates: [], deletes: [], supersede: [], unchanged: 0, notes: [] };
  const existing = await fetchAll<Row>((f, to) => sb.from(table).select("*").eq(periodColumn, period).is("deleted_at", null).range(f, to));
  const byKey = new Map(existing.map((e) => [String(e.line_key), e]));
  const seen = new Set<string>();
  for (const r of staged) {
    const old = byKey.get(String(r.line_key));
    if (!old) { t.inserts.push(r); continue; }
    seen.add(String(old.id));
    const patch: Row = {};
    for (const f of fields) if (f in r && !same(old[f], r[f])) patch[f] = r[f] ?? null;
    if (Object.keys(patch).length) t.updates.push({ id: old.id, ...patch });
    else t.unchanged++;
  }
  t.deletes.push(...existing.filter((e) => !seen.has(String(e.id))).map((e) => String(e.id)));
  return t;
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
  if (!h.def.roles.includes(viewer.role)) throw new WriteError("Peran Anda tidak boleh mengunggah jenis ini");
  const dl = await sb.storage.from("uploads").download(path);
  if (dl.error || !dl.data) throw new WriteError(`File tidak terbaca dari storage: ${dl.error?.message}`);
  const bytes = new Uint8Array(await dl.data.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");
  const res = h.parse(readWorkbook(bytes, fileName), { period, mapping: opts.mapping });
  const plan = res.sets.length ? await h.plan(sb, period, res.sets) : { targets: [], issues: [] };
  const issues = [...res.issues, ...plan.issues];
  const ins = await sb.from("upload").insert({
    kind, period, file_name: fileName, sha256: sha, file_path: path, uploaded_by: viewer.email, status: "planned",
    row_count: res.rows.length, issues, mapping: res.detected?.mapping ?? null, plan: { targets: summary(plan) },
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
    uploadId, kind, period, fileName, sha,
    parse: {
      issues, columns: res.detected?.columns ?? [], mapping: res.detected?.mapping ?? null, headerRow: res.detected?.headerRow ?? null,
      sheet: res.detected?.sheet ?? null, rowCount: res.rows.length,
      badRows: res.rows.filter((r) => r.issues.length).slice(0, 50).map((r) => ({ rowNo: r.rowNo, issues: r.issues })),
      sample: (res.sets[0]?.rows ?? []).slice(0, 25).map(clean),
    },
    fields: h.def.fields.map((f) => ({ field: f.field, label: f.label, required: !!f.required })),
    plan: summary(plan),
  };
}

/** Commit a planned upload: re-plan against the current data, then apply every target. */
export async function commitUpload(sb: Supa, viewer: Viewer, uploadId: string): Promise<string> {
  const { data: up, error } = await sb.from("upload").select("*").eq("id", uploadId).single();
  if (error || !up) throw new WriteError("Upload tidak ditemukan");
  if (up.status !== "planned" && up.status !== "staged") throw new WriteError(`Upload sudah ${up.status}`);
  const h = handlerFor(String(up.kind));
  if (!h.def.roles.includes(viewer.role)) throw new WriteError("Peran Anda tidak boleh mengunggah jenis ini");
  const rows = await fetchAll<{ target: string; data: Row }>((f, t) => sb.from("upload_row").select("target, data").eq("upload_id", uploadId).order("row_no").range(f, t));
  const sets = new Map<string, Row[]>();
  for (const r of rows) sets.set(r.target, [...(sets.get(r.target) ?? []), r.data]);
  const plan = await h.plan(sb, String(up.period), [...sets.entries()].map(([target, rs]) => ({ target, rows: rs })));
  let counts: ChangeCounts = { inserted: 0, updated: 0, deleted: 0, superseded: 0 };
  for (const t of plan.targets) {
    const ins = t.inserts.map((r) => ({ ...clean(r), upload_id: uploadId, source: (r.source as string | undefined) ?? h.def.source }));
    const r = await applyChanges(sb, t.table, ins, t.updates, t.deletes, t.supersede);
    counts = { inserted: counts.inserted + r.inserted, updated: counts.updated + r.updated, deleted: counts.deleted + r.deleted, superseded: counts.superseded + r.superseded };
  }
  const done = await sb.from("upload").update({
    status: "committed", committed_at: new Date().toISOString(), inserted: counts.inserted, updated: counts.updated, deleted: counts.deleted,
  }).eq("id", uploadId);
  if (done.error) throw new WriteError(done.error.message);
  return `Disimpan: ${counts.inserted} baris baru, ${counts.updated} diubah, ${counts.deleted} dihapus (soft).`;
}

/** Drop a staged/planned upload (status rejected; staged rows removed). */
export async function rejectUpload(sb: Supa, uploadId: string): Promise<void> {
  await sb.from("upload_row").delete().eq("upload_id", uploadId);
  const { error } = await sb.from("upload").update({ status: "rejected" }).eq("id", uploadId).in("status", ["staged", "planned"]);
  if (error) throw new WriteError(error.message);
}

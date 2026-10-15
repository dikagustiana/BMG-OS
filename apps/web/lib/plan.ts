import "server-only";
import { D } from "@bmg/engine";
import type { Supa } from "./supabase";
import { fetchAll } from "./write";

/** Planning helpers for uploads: compare staged rows with the active rows in the database. */

type Row = Record<string, unknown>;

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

export function emptyTarget(table: string, label: string): PlanTarget {
  return { table, label, inserts: [], updates: [], deletes: [], supersede: [], unchanged: 0, notes: [] };
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

/** Columns a staged set writes (everything but the period and the key). */
export function fieldsOf(rows: Row[], skip: string[] = ["month", "line_key"]): string[] {
  return [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => !skip.includes(k));
}

/**
 * Match staged rows with existing active rows on a key: new → insert, changed → update, unchanged → count,
 * existing rows missing from the file → soft delete (unless `keepMissing`).
 */
export async function planByKey(
  table: string, label: string, existing: Row[], staged: Row[], key: (r: Row) => string, fields: string[], keepMissing = false,
): Promise<PlanTarget> {
  const t = emptyTarget(table, label);
  const byKey = new Map(existing.map((e) => [key(e), e]));
  const seen = new Set<string>();
  for (const r of staged) {
    const old = byKey.get(key(r));
    if (!old) { t.inserts.push(r); continue; }
    seen.add(String(old.id));
    const patch: Row = {};
    for (const f of fields) if (f in r && !same(old[f], r[f])) patch[f] = r[f] ?? null;
    if (Object.keys(patch).length) t.updates.push({ id: old.id, ...patch });
    else t.unchanged++;
  }
  if (!keepMissing) t.deletes.push(...existing.filter((e) => !seen.has(String(e.id))).map((e) => String(e.id)));
  return t;
}

/** Period-scoped input table (B1 inputs): rows of the month matched on line_key; rows not in the file are soft-deleted. */
export async function planReplacePeriod(sb: Supa, table: string, label: string, period: string, staged: Row[]): Promise<PlanTarget> {
  const existing = await fetchAll<Row>((f, to) => sb.from(table).select("*").eq("month", period).is("deleted_at", null).range(f, to));
  return planByKey(table, label, existing, staged, (r) => String(r.line_key), fieldsOf(staged));
}

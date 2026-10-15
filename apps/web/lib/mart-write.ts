import "server-only";
import { D } from "@bmg/engine";
import type { Supa } from "./supabase";
import { applyChanges, fetchAll, WriteError } from "./write";

/**
 * Writes the data-mart rows of one month (PRD v2 §5.4): upsert on line_key, rows no longer produced are soft-deleted.
 * Marts are derived and rebuilt whole, so chunks may commit separately; a failed rebuild is simply run again.
 * Compares jsonb and array columns by value (planByKey's text compare would call every object equal).
 */

type Row = Record<string, unknown>;
const CHUNK = 500;

function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v as Row).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Row)[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}

const NUM = /^-?\d+(\.\d+)?$/;

export function sameValue(a: unknown, b: unknown): boolean {
  const x = a === undefined || a === "" ? null : a, y = b === undefined || b === "" ? null : b;
  if (x === null || y === null) return x === y;
  if (typeof x === "object" || typeof y === "object") return stable(x) === stable(y);
  if (NUM.test(String(x)) && NUM.test(String(y))) return D(String(x)).equals(D(String(y)));
  return String(x) === String(y);
}

export interface MartWrite { table: string; inserted: number; updated: number; deleted: number }

export async function replaceMonthRows(sb: Supa, table: string, month: string, rows: Row[]): Promise<MartWrite> {
  const existing = await fetchAll<Row>((f, t) => sb.from(table).select("*").eq("month", month).is("deleted_at", null).range(f, t));
  const byKey = new Map(existing.map((e) => [String(e.line_key), e]));
  const seen = new Set<string>();
  const inserts: Row[] = [], updates: Row[] = [];
  for (const r of rows) {
    const old = byKey.get(String(r.line_key));
    if (!old) { inserts.push(r); continue; }
    seen.add(String(old.id));
    const patch: Row = {};
    for (const [k, v] of Object.entries(r)) if (k !== "month" && k !== "line_key" && !sameValue(old[k], v)) patch[k] = v;
    if (Object.keys(patch).length) updates.push({ id: old.id, ...patch });
  }
  const deletes = existing.filter((e) => !seen.has(String(e.id))).map((e) => String(e.id));
  try {
    for (let i = 0; i < inserts.length; i += CHUNK) await applyChanges(sb, table, inserts.slice(i, i + CHUNK));
    for (let i = 0; i < updates.length; i += CHUNK) await applyChanges(sb, table, [], updates.slice(i, i + CHUNK));
    for (let i = 0; i < deletes.length; i += CHUNK) await applyChanges(sb, table, [], [], deletes.slice(i, i + CHUNK));
  } catch (e) {
    throw new WriteError(`Hitung ulang ${table} gagal: ${(e as Error).message}`);
  }
  return { table, inserted: inserts.length, updated: updates.length, deleted: deletes.length };
}

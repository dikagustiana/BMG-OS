import "server-only";
import type { Supa } from "./supabase";

type Row = Record<string, unknown>;

/** A write that the user should see as a message (permission, validation, module off). */
export class WriteError extends Error {}

export function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** PostgREST returns at most 1000 rows per request; page through everything. */
export async function fetchAll<T = Row>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  size = 1000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw new WriteError(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return out;
}

export async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>, what: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new WriteError(`${what}: ${error.message}`);
  return data;
}

export interface ChangeCounts {
  inserted: number;
  updated: number;
  deleted: number;
  superseded: number;
}

/**
 * One RLS-checked transaction per call (RPC `apply_changes`, security invoker): inserts + updates + soft deletes
 * + supersedes. Only tables listed in `public.upload_tables()` are accepted.
 */
export async function applyChanges(
  sb: Supa, table: string, inserts: Row[], updates: Row[] = [], softDeletes: string[] = [], supersede: string[] = [],
): Promise<ChangeCounts> {
  const total: ChangeCounts = { inserted: 0, updated: 0, deleted: 0, superseded: 0 };
  // keep every key present on every insert row (jsonb_populate_recordset uses the first row's keys)
  const keys = [...new Set(inserts.flatMap((r) => Object.keys(r)))];
  const norm = inserts.map((r) => Object.fromEntries(keys.map((k) => [k, r[k] ?? null])));
  const insChunks = chunk(norm, 800);
  const updChunks = chunk(updates, 400);
  const n = Math.max(insChunks.length, updChunks.length, 1);
  for (let i = 0; i < n; i++) {
    const { data, error } = await sb.rpc("apply_changes", {
      p_table: table,
      p_inserts: insChunks[i] ?? [],
      p_updates: updChunks[i] ?? [],
      p_soft_deletes: i === 0 ? softDeletes : [],
      p_supersede: i === 0 ? supersede : [],
    });
    if (error) throw new WriteError(`${table}: ${error.message}`);
    const d = data as ChangeCounts;
    total.inserted += d.inserted; total.updated += d.updated; total.deleted += d.deleted; total.superseded += d.superseded;
  }
  return total;
}

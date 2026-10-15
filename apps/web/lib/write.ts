import "server-only";
import type { Supa } from "./supabase";

type Row = Record<string, unknown>;

/** A write that the user should see as a message (permission, validation, module off). */
export class WriteError extends Error {}

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
 * One RLS-checked transaction (RPC `apply_changes`, security invoker): inserts + updates + soft deletes + supersedes
 * on one table. Only tables listed in `public.upload_tables()` are accepted. Not chunked: a chunked loop would commit
 * each chunk separately and leave a half-applied table when a later chunk fails.
 */
export async function applyChanges(
  sb: Supa, table: string, inserts: Row[], updates: Row[] = [], softDeletes: string[] = [], supersede: string[] = [],
): Promise<ChangeCounts> {
  const { data, error } = await sb.rpc("apply_changes", {
    p_table: table, p_inserts: normaliseInserts(inserts), p_updates: updates, p_soft_deletes: softDeletes, p_supersede: supersede,
  });
  if (error) throw new WriteError(`${table}: ${error.message}`);
  return data as ChangeCounts;
}

export interface TableChanges {
  table: string;
  inserts: Row[];
  updates: Row[];
  softDeletes: string[];
  supersede: string[];
}

/**
 * Commit an upload atomically (RPC `apply_upload`): every target table and the upload's status change in one
 * transaction. Only the uploader or Admin may commit (checked in the database too); on any error nothing is written.
 */
export async function applyUpload(sb: Supa, uploadId: string, changes: TableChanges[]): Promise<ChangeCounts> {
  const { data, error } = await sb.rpc("apply_upload", {
    p_upload_id: uploadId,
    p_changes: changes.map((c) => ({
      table: c.table, inserts: normaliseInserts(c.inserts), updates: c.updates, soft_deletes: c.softDeletes, supersede: c.supersede,
    })),
  });
  if (error) throw new WriteError(error.message);
  return data as ChangeCounts;
}

/** Keep every key present on every insert row (jsonb_populate_recordset takes the column list from the first row). */
function normaliseInserts(inserts: Row[]): Row[] {
  const keys = [...new Set(inserts.flatMap((r) => Object.keys(r)))];
  return inserts.map((r) => Object.fromEntries(keys.map((k) => [k, r[k] ?? null])));
}

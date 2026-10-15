import "server-only";

/**
 * Reads of data marts and inputs that may not exist yet on the production database: migrations of Fase ≥ 2 are applied
 * by Dika after merge (CLAUDE.md gate E), so a page reads "missing" instead of failing until its tables are there.
 */
export type MartState = "ok" | "missing" | "error";
export interface MartRead<T> { rows: T[]; state: MartState; message?: string }

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>;

const isMissing = (e: { message: string; code?: string }) =>
  e.code === "PGRST205" || e.code === "42P01" || /schema cache|does not exist/i.test(e.message);

/** All rows of a query, paged by 1000; never throws. */
export async function readAll<T>(page: (from: number, to: number) => Page<T>, size = 1000): Promise<MartRead<T>> {
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) return { rows: [], state: isMissing(error) ? "missing" : "error", message: error.message };
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return { rows: out, state: "ok" };
}

/** Combined state of several reads: missing wins over error over ok. */
export function stateOf(...reads: { state: MartState }[]): MartState {
  if (reads.some((r) => r.state === "missing")) return "missing";
  if (reads.some((r) => r.state === "error")) return "error";
  return "ok";
}

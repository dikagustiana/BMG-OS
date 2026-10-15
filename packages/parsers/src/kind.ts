/**
 * One parser per upload kind (PRD v1 §5). A parser is pure: workbook sheets + context in, rows for the target tables
 * out, with issues. Row-level problems (missing key, bad number) exclude the row; warnings (unmapped item, Σ ≠ LK)
 * keep the row and are listed for the uploader. The web handler plans the database changes from `sets`.
 */
import { D, type Role } from "@bmg/engine";
import { detect, extract, lineKeys, type Detected, type FieldDef, type KindDef, type Mapping, type ParsedRow } from "./tables";
import type { Sheet } from "./workbook";
import { norm } from "./values";

/** Reference data the parsers check against (loaded by the web handler; empty in pure tests unless given). */
export interface Masters {
  payrollGroups?: { code: string; name: string; dept: string | null }[];
  materialItems?: { code: string | null; name: string }[];
  /** Valid CoGM card lines: FCC/UU/UO, others_group codes, SKU codes, PABRIK, LAIN. */
  lines?: string[];
}

export interface ParseCtx {
  /** YYYY-MM-01 for monthly kinds; the version code / name for version kinds. */
  period: string;
  /** Column override for the primary table (wizard "Pemetaan kolom"). */
  mapping?: Mapping;
  masters?: Masters;
  role?: Role;
}

export type DbRow = Record<string, unknown>;

export interface ParsedSet {
  target: string;
  rows: DbRow[];
}

export interface KindResult {
  /** Detection of the primary table (shown in the wizard). */
  detected: Detected | null;
  /** Fields of the primary table (mapping editor). */
  fields: FieldDef[];
  /** All parsed rows, every section; rows with issues are not in `sets`. */
  rows: ParsedRow[];
  sets: ParsedSet[];
  /** File-level issues and warnings. */
  issues: string[];
  /** The upload's period when the file names it (std_master: the version code). */
  period?: string;
}

export interface KindParser {
  def: KindDef;
  parse(sheets: Sheet[], ctx: ParseCtx): KindResult;
}

/** Monthly kinds belong to a month start. */
export function assertMonth(period: string): string {
  if (!/^\d{4}-\d{2}-01$/.test(period)) throw new Error(`Periode harus awal bulan (YYYY-MM-01): ${period}`);
  return period;
}

/** Detect and extract one table, optionally only on sheets whose name matches. */
export function table(
  sheets: Sheet[], fields: FieldDef[], opts: { mapping?: Mapping; sheet?: RegExp } = {},
): { detected: Detected | null; rows: ParsedRow[] } {
  const pool = opts.sheet ? sheets.filter((s) => opts.sheet!.test(s.name)) : sheets;
  const found = detect(pool.length ? pool : sheets, { fields });
  if (!found) return { detected: null, rows: [] };
  const detected = opts.mapping ? { ...found, mapping: { ...found.mapping, ...opts.mapping } } : found;
  return { detected, rows: extract(pool.length ? pool : sheets, { fields }, detected) };
}

/** Rows without issues. */
export const good = (rows: ParsedRow[]) => rows.filter((r) => r.issues.length === 0);

/** Round a decimal string to the column scale (PostgreSQL numeric rounds half away from zero, like ROUND_HALF_UP). */
export function scale(v: string | null | undefined, places: number): string | null {
  if (v === null || v === undefined || v === "") return null;
  return D(v).toDecimalPlaces(places).toFixed();
}

/** Attach `line_key` (stable per file) and the month to each row. */
export function keyed<T>(rows: T[], key: (r: T) => string, build: (r: T) => DbRow, month?: string): DbRow[] {
  const keys = lineKeys(rows, key);
  return rows.map((r, i) => ({ ...(month ? { month } : {}), ...build(r), line_key: keys[i] }));
}

/** Map free text to one of the allowed codes via normalised aliases; null when blank, undefined when unknown. */
export function pick<T extends string>(v: string | null, table: Record<T, string[]>): T | null | undefined {
  if (v === null || v.trim() === "") return null;
  const n = norm(v);
  for (const [code, aliases] of Object.entries(table) as [T, string[]][]) {
    if (norm(code) === n || aliases.some((a) => norm(a) === n)) return code;
  }
  return undefined;
}

/** Warnings with row numbers, capped so a bad file does not flood the wizard. */
export function warnRows(label: string, rows: { rowNo: number; text: string }[], cap = 15): string[] {
  if (!rows.length) return [];
  const shown = rows.slice(0, cap).map((r) => `baris ${r.rowNo}: ${r.text}`).join("; ");
  return [`${label} (${rows.length}): ${shown}${rows.length > cap ? "; …" : ""}`];
}

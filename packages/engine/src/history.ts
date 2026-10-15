/**
 * History and budget of the financial statements from the BP sheet "BMG Business Plan" (PRD v2 §4.11, D13–D14):
 * column Actual (Jan–Agu 2026) → history_fs_line, column BP (Sep-26–Des-27) → budget_fs_line. Pure: the parser
 * (or a test) hands in the sheet rows; amounts are Rp juta in the sheet and Rp here.
 */
import { D, Decimal } from "./decimal";
import { FS_LINES, type FsLineDef } from "./fs-lines";
import type { Lines } from "./fs";

export interface BpSheetRow {
  /** Sheet row number. */
  r: number;
  /** Texts of columns A–G joined with " | ". */
  label: string;
  /** 'YYYY-MM' → amount in Rp juta (decimal string). */
  values: Record<string, string>;
}

export interface BpSheetColumn {
  /** First day of the month. */
  month: string;
  kind: "actual" | "bp" | string;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export interface BpMatch {
  matched: { def: FsLineDef; row: BpSheetRow }[];
  missing: FsLineDef[];
}

/**
 * Find each fs_line in the sheet by its label, in sheet order: the search for a line starts after the row of the
 * previous line, so repeated labels ("Raw Materials" under FCC, UU, UO and in the balance sheet) resolve by position.
 */
export function matchBpRows(rows: readonly BpSheetRow[]): BpMatch {
  const sorted = [...rows].sort((a, b) => a.r - b.r);
  const defs = [...FS_LINES].sort((a, b) => a.bp_row - b.bp_row);
  const matched: BpMatch["matched"] = [];
  const missing: FsLineDef[] = [];
  let i = 0;
  for (const def of defs) {
    const want = norm(def.source_label);
    let j = i;
    while (j < sorted.length && norm(sorted[j].label) !== want) j++;
    if (j === sorted.length) {
      missing.push(def);
      continue;
    }
    matched.push({ def, row: sorted[j] });
    i = j + 1;
  }
  return { matched, missing };
}

const MIO = D(1_000_000);

/** Rp juta (sheet) → Rp, at the scale of a money column. */
export const fromJuta = (v: string): Decimal => D(v).times(MIO).toDecimalPlaces(2);

export interface BpFsHistory {
  /** month → lines (all statements) for column kind Actual. */
  actual: Map<string, Lines>;
  /** month → lines for column kind BP. */
  bp: Map<string, Lines>;
  /** month|code → "BMG Business Plan!<col><row>" for SourceTrace. */
  cells: Map<string, string>;
  missing: FsLineDef[];
}

/** Column letter of a 1-based index. */
export function colLetter(n: number): string {
  let s = "";
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  return s;
}

/**
 * Split the matched rows by column kind. `columnIndex` maps 'YYYY-MM' to the sheet column (1-based) for SourceTrace;
 * leave it empty when unknown.
 */
export function bpFsHistory(rows: readonly BpSheetRow[], columns: readonly BpSheetColumn[], columnIndex: ReadonlyMap<string, number> = new Map()): BpFsHistory {
  const { matched, missing } = matchBpRows(rows);
  const actual = new Map<string, Lines>();
  const bp = new Map<string, Lines>();
  const cells = new Map<string, string>();
  for (const col of columns) {
    const ym = col.month.slice(0, 7);
    const target = col.kind === "actual" ? actual : col.kind === "bp" ? bp : null;
    if (!target) continue;
    const lines: Lines = new Map();
    for (const { def, row } of matched) {
      const v = row.values[ym];
      if (v === undefined) continue;
      lines.set(def.code, fromJuta(v));
      const c = columnIndex.get(ym);
      if (c) cells.set(`${col.month}|${def.code}`, `BMG Business Plan!${colLetter(c)}${row.r}`);
    }
    if (lines.size) target.set(col.month, lines);
  }
  return { actual, bp, cells, missing };
}

/** Split a month's imported lines into statement lines and cash flow lines. */
export function splitCf(lines: Lines): { statements: Lines; cf: Lines } {
  const statements: Lines = new Map();
  const cf: Lines = new Map();
  for (const [k, v] of lines) (k.startsWith("cf.") ? cf : statements).set(k, v);
  return { statements, cf };
}

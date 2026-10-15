/**
 * Golden comparison helpers (PRD v1 §8: golden numbers come from WP cells, not from engine output).
 * Pure: callers load the cells (fixtures.ts) and pass them in.
 */
import { D, Decimal } from "./decimal";

/** One WP cell from fixtures/<period>/cells.csv. */
export interface WpCell {
  sheet: string;
  cell: string;
  type: "n" | "s" | "b" | "e" | "d";
  value: string;
  formula: string | null;
}

export type CellIndex = Map<string, WpCell>;

export const cellKey = (sheet: string, cell: string) => `${sheet}!${cell}`;

/** A number a module (or the PRD) claims for a WP cell. */
export interface GoldenTarget {
  id: string;
  label: string;
  sheet: string;
  cell: string;
  expected: string;
  /** Absolute tolerance (Rp 1 for money, 0,0001 for pp / ratios, 0,01 for kg). */
  tolerance: string;
  source: string;
}

export interface GoldenResult {
  target: GoldenTarget;
  actual: string | null;
  diff: Decimal | null;
  ok: boolean;
  reason?: string;
}

export function checkTarget(cells: CellIndex, t: GoldenTarget): GoldenResult {
  const c = cells.get(cellKey(t.sheet, t.cell));
  if (!c) return { target: t, actual: null, diff: null, ok: false, reason: "sel tidak ada di cells.csv" };
  if (c.type !== "n") return { target: t, actual: c.value, diff: null, ok: false, reason: `sel bukan angka (${c.type})` };
  const diff = D(c.value).minus(D(t.expected));
  return { target: t, actual: c.value, diff, ok: diff.abs().lessThanOrEqualTo(D(t.tolerance)) };
}

export function checkTargets(cells: CellIndex, targets: GoldenTarget[]): GoldenResult[] {
  return targets.map((t) => checkTarget(cells, t));
}

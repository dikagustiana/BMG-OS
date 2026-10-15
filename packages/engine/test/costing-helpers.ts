/** Shared golden-month fixtures for the B2 costing tests: inputs at full WP precision and the computed month. */
import { expect } from "vitest";
import { D, type Decimal } from "../src/decimal";
import { loadCells } from "../src/fixtures";
import { goldenMonthRows } from "../src/fixtures-month";
import { checkSourceRefs, type RefCheck } from "../src/golden-costing";
import { monthInputsFromRows, type InputRows, type MonthInputs } from "../src/inputs";
import { computeMonth } from "../src/monthly-costing";

export const cells = loadCells("month-2026-09");
export const goldenRows = (): InputRows => goldenMonthRows(cells);
export const goldenInputs = (): MonthInputs => monthInputsFromRows(goldenRows());
export const goldenMonth = computeMonth(goldenInputs());

/** WP cell value as Decimal ("Sheet!A1"). */
export function wp(ref: string): Decimal {
  const c = cells.get(ref);
  if (!c) throw new Error(`sel tidak ada: ${ref}`);
  return D(c.value);
}

/** |actual − WP cell| ≤ tolerance. */
export function expectCell(actual: Decimal, ref: string, tol: string | number = 1): void {
  const diff = actual.minus(wp(ref));
  expect(diff.abs().lte(D(tol)), `${ref}: engine ${actual.toFixed()} vs WP ${wp(ref).toFixed()} (selisih ${diff.toSignificantDigits(6).toFixed()})`).toBe(true);
}

/** Every source_refs entry of the rows ties to its WP cell; returns how many cells were compared. */
export function expectRefs(table: string, rows: readonly object[], key: (r: Record<string, unknown>) => string, strict = true): number {
  const res: RefCheck[] = checkSourceRefs(cells, table, rows as unknown as Record<string, unknown>[], key, strict);
  const bad = res.filter((r) => !r.ok).map((r) => `${r.target.id} ${r.target.sheet}!${r.target.cell}: engine ${r.target.expected} vs WP ${r.actual} ${r.reason ?? ""}`);
  expect(bad).toEqual([]);
  return res.length;
}

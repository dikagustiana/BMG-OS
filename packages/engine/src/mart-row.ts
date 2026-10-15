/**
 * Trace columns that every v2 data-mart row carries (PRD v2 §5.4): `rule_id` (engine function + rule version),
 * `inputs` (the named operands with their value and where they came from) and `source_ref` (the WP template cell
 * of the number — for the golden month this is the cell the golden test checks).
 * Pure helpers; used by recon.ts, reasonableness.ts, variance.ts and bridge.ts (Fase 3–4).
 */
import { Decimal } from "./decimal";
import type { ControlResult } from "./types";

/** One operand of a data-mart number. `ref` = WP cell for the golden month ("REKON & KONTROL!C45"), or "table:id" in production. */
export interface TraceInput {
  value: string | null;
  ref: string | null;
}

export type TraceInputs = Record<string, TraceInput>;

export interface MartTrace {
  /** Engine function and rule version, e.g. "recon.reconHpp@v1". */
  rule_id: string;
  /** Named operands of the row (PRD v2 §5.4 `inputs jsonb`). */
  inputs: TraceInputs;
  /** WP template cell (sheet!cell) that holds the same number; null when the WP has no such cell. */
  source_ref: string | null;
}

/** Optional source reference per input field (field name → "Sheet!Cell" or "table:id"). */
export type Refs = Readonly<Record<string, string | undefined>>;

export function ruleId(fn: string, version = 1): string {
  return `${fn}@v${version}`;
}

/** Full-precision decimal string (no exponent). */
export function dstr(v: Decimal | null | undefined): string | null {
  return v === null || v === undefined ? null : v.toFixed();
}

/** Build `inputs` from named operands; refs are looked up by the same names (missing → null). */
export function traceInputs(values: Record<string, Decimal | null | undefined>, refs?: Refs): TraceInputs {
  const out: TraceInputs = {};
  for (const k of Object.keys(values)) out[k] = { value: dstr(values[k]), ref: refs?.[k] ?? null };
  return out;
}

export function trace(rule: string, sourceRef: string | null, values: Record<string, Decimal | null | undefined>, refs?: Refs): MartTrace {
  return { rule_id: rule, inputs: traceInputs(values, refs), source_ref: sourceRef };
}

/** A `control_month` row (PRD v1 §4.4 + v2 §5.4 trace columns). */
export interface TracedControl extends ControlResult, MartTrace {
  month: string;
}

/** Excel ABS(x) <= tol. */
export function within(x: Decimal | null, tol: Decimal): boolean {
  return x !== null && x.abs().lte(tol);
}

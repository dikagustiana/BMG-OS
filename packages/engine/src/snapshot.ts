/**
 * Deterministic snapshots: the same inputs give byte-identical JSON (golden tests, `snapshot:diff`, releases).
 * Decimals are fixed-scale strings; object keys are sorted so that the order of construction does not matter.
 */
import { createHash } from "node:crypto";
import { Decimal, toFixedString } from "./decimal";

export function canonical(v: unknown, dp = 6): unknown {
  if (v === null || v === undefined) return null;
  if (v instanceof Decimal) return toFixedString(v, dp);
  if (Array.isArray(v)) return v.map((x) => canonical(x, dp));
  if (v instanceof Map) return canonical(Object.fromEntries(v), dp);
  if (typeof v === "function") return undefined;
  if (typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      const y = canonical((v as Record<string, unknown>)[k], dp);
      if (y !== undefined) out[k] = y;
    }
    return out;
  }
  return v;
}

export function canonicalJson(v: unknown, dp = 6): string {
  return JSON.stringify(canonical(v, dp), null, 1) + "\n";
}

export function sha256(text: string | Uint8Array): string {
  return createHash("sha256").update(text).digest("hex");
}

/** Shared engine types (PRD v1 §4.6, §4.7). Domain modules add their own input/output types in their own files. */
import type { Decimal } from "./decimal";

export const ENGINE_VERSION = "0.1.0";

/** Control status, as in the WP (LULUS/GAGAL) plus the platform states (PRD §4.6). */
export type ControlStatus = "LULUS" | "GAGAL" | "PERIKSA" | "BELUM_DIISI";

export interface ControlResult {
  /** B01..B45 */
  code: string;
  label: string;
  value: Decimal | null;
  tolerance: Decimal | null;
  status: ControlStatus;
  note?: string;
}

/** Product lines with a process card (PRD §4.1 product.code). */
export type ProductCode = "FCC" | "UU" | "UO";

/** Conversion pools (BIAYA BERSAMA bagian 3). */
export type PoolCode = "A" | "KUPAS" | "B" | "C" | "D" | "E";

/** Allocation targets of the pools (BIAYA BERSAMA bagian 6). */
export type LineCode = ProductCode | "LAIN";

/** Roles of PRD §2 — shared by the web app and the RLS test. */
export const ROLES = [
  "admin", "finance", "cost_accounting", "ppic", "production", "warehouse", "engineering", "purchasing", "sales", "management",
] as const;
export type Role = (typeof ROLES)[number];

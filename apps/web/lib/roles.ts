/**
 * Roles and what each may write (PRD v1 §2). Server actions check this; RLS enforces it again in the database
 * (supabase/migrations, tested by supabase/tests/rls_roles.sql).
 */
import { ROLES, type Role } from "@bmg/engine";

export { ROLES, type Role };

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  finance: "Finance",
  cost_accounting: "Cost Accounting",
  ppic: "PPIC",
  production: "Produksi",
  warehouse: "Gudang",
  engineering: "Engineering",
  purchasing: "Purchasing",
  sales: "Sales",
  management: "Manajemen",
};

export const ROLE_HELP: Record<Role, string> = {
  admin: "Semua; flag modul; approve versi standar; pengguna",
  finance: "Upload GL, Inventory Valuation, Sales, Average Price, payroll; cost pool; true-up; rilis bulanan; mapping budget",
  cost_accounting: "Upload kartu CoGM; jalankan costing bulanan; lihat semua rekon (tidak bisa rilis)",
  ppic: "Master BOM/komposisi/routing/kapasitas (draft); rencana produksi; approve downgrade",
  production: "Form produksi per shift, jam kerja, kunci hari, koreksi",
  warehouse: "Bon material",
  engineering: "Meter kWh, jam mesin, downtime",
  purchasing: "Harga material mingguan, rencana beli",
  sales: "Forecast jual mingguan",
  management: "Baca saja (tanpa halaman input)",
};

/** Write areas (PRD §2 "Hak tulis per area"; §5 roles per upload kind). */
export type Area =
  | "users" | "module_flags" | "rebuild" | "reopen_month"
  | "master" | "coa_map" | "assumption" | "budget"
  | "std_draft" | "std_approve" | "capacity"
  | "upload_finance" | "upload_cogm" | "upload_ppic" | "upload_sales" | "upload_purchasing" | "upload_plant"
  | "day_lock" | "correction" | "trueup" | "release";

const W: Record<Area, Role[]> = {
  users: ["admin"],
  module_flags: ["admin"],
  rebuild: ["admin", "finance", "cost_accounting"],
  reopen_month: ["admin"],
  master: ["admin", "finance"],
  coa_map: ["admin", "finance"],
  assumption: ["admin", "finance"],
  budget: ["admin", "finance"],
  std_draft: ["admin", "finance", "ppic"],
  std_approve: ["admin", "finance"],
  capacity: ["admin", "ppic"],
  upload_finance: ["admin", "finance"],
  upload_cogm: ["admin", "cost_accounting"],
  upload_ppic: ["admin", "ppic", "finance"],
  upload_sales: ["admin", "sales"],
  upload_purchasing: ["admin", "purchasing"],
  upload_plant: ["admin", "production", "warehouse", "engineering"],
  day_lock: ["admin", "production"],
  correction: ["admin", "production", "finance"],
  trueup: ["admin", "finance"],
  release: ["admin", "finance"],
};

export function can(role: Role | null | undefined, area: Area): boolean {
  return !!role && W[area].includes(role);
}

export function rolesFor(area: Area): readonly Role[] {
  return W[area];
}

/** Management sees no input pages. */
export function seesInputs(role: Role | null | undefined): boolean {
  return !!role && role !== "management";
}

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

export function roleLabel(v: unknown): string {
  return isRole(v) ? ROLE_LABEL[v] : String(v ?? "");
}

export function roleHelp(v: unknown): string {
  return isRole(v) ? ROLE_HELP[v] : "";
}

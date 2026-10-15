/**
 * Module flags (PRD v1 §4.7, prompt rule 6). Each module is off by default in `app_setting`. A page of a module that
 * is off answers notFound(); a server action of a module that is off throws WriteError (modules-server.ts); the nav
 * shows a module's pages only when it is on and the viewer's role may see them.
 * Pure (no server imports) so it can be unit-tested.
 */
import type { Role } from "./roles";

export const MODULE_KEYS = [
  "b1_ingest", "b2_costing", "b3_recon", "b4_analysis", "b5_plan", "b5_weekly", "b5_forms", "b6_closing", "b6_management", "b7_outlook",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export interface NavItem {
  /** Route; `[month]` / `[week]` are filled from the current period. */
  href: string;
  label: string;
  roles: Role[] | "all";
}

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  phase: string;
  description: string;
  /** Pages of the module that exist in this build (added by the phase that ships them). */
  nav: NavItem[];
}

export const MODULES: ModuleDef[] = [
  { key: "b1_ingest", label: "B1 Ingest dan master", phase: "Fase 1", description: "Upload GL, Inventory Valuation, Sales by Item, Average Price, kartu CoGM, payroll, BP; mapping akun bertanggal; master standar berversi.", nav: [
    { href: "/m/[month]/input", label: "Input bulanan", roles: ["admin", "finance", "cost_accounting"] },
    { href: "/standar", label: "Standar", roles: ["admin", "finance", "ppic"] },
  ] },
  { key: "b2_costing", label: "B2 Costing bulanan", phase: "Fase 2", description: "Pool konversi → alokasi → kartu proses → barang jadi → Lain-lain per SKU (reproduksi WP).", nav: [] },
  { key: "b3_recon", label: "B3 Rekon dan kontrol", phase: "Fase 3", description: "Rekon HPP, material per item, persediaan K1–K6, kontrol ke GL/LK.", nav: [] },
  { key: "b4_analysis", label: "B4 Kewajaran, varian, bridge", phase: "Fase 4", description: "Cek kewajaran 8 bulan, varian per komponen vs flex budget BP, bridge margin 17 bar.", nav: [] },
  { key: "b5_plan", label: "B5a Standar dan rencana mingguan", phase: "Fase 5a", description: "Versi standar, forecast → rencana produksi, bahan, jam, HPP standar.", nav: [] },
  { key: "b5_weekly", label: "B5b Aktual dan varian mingguan", phase: "Fase 5b", description: "Input harian pabrik (template), biaya aktual provisional, varian, serapan biaya tetap.", nav: [] },
  { key: "b5_forms", label: "B5 Form harian web", phase: "Fase 5b+", description: "Form input harian di web (pengganti template xlsx).", nav: [] },
  { key: "b6_closing", label: "B6 Tutup bulan", phase: "Fase 6", description: "True-up ke GL, kalibrasi standar, rilis bulanan (snapshot + SHA + PDF).", nav: [] },
  { key: "b6_management", label: "B6 Tampilan manajemen", phase: "Fase 6", description: "Headline manajemen: margin, bridge, HPP/kg minggu, varian terbesar, outlook.", nav: [] },
  { key: "b7_outlook", label: "B7 Outlook dan kas", phase: "Fase 7", description: "Outlook bulan berjalan vs BP, kas harian per rekening, 13 minggu.", nav: [] },
];

export type Flags = Record<ModuleKey, boolean>;

export function isModuleKey(v: unknown): v is ModuleKey {
  return typeof v === "string" && (MODULE_KEYS as readonly string[]).includes(v);
}

/** app_setting rows → flags; anything missing or not exactly `true` is off. */
export function parseFlags(rows: { key: string; value: unknown }[]): Flags {
  const flags = Object.fromEntries(MODULE_KEYS.map((k) => [k, false])) as Flags;
  for (const r of rows) if (isModuleKey(r.key)) flags[r.key] = r.value === true;
  return flags;
}

/** A nav route with its period filled in ("/m/[month]/input" → "/m/2026-09-01/input"). */
export function hrefFor(href: string, month: string): string {
  return href.replace("[month]", month);
}

/** Nav items the viewer sees: module on, page shipped, role allowed. */
export function navFor(role: Role, flags: Flags, modules: ModuleDef[] = MODULES): (NavItem & { module: ModuleKey })[] {
  return modules
    .filter((m) => flags[m.key])
    .flatMap((m) => m.nav.map((n) => ({ ...n, module: m.key })))
    .filter((n) => n.roles === "all" || n.roles.includes(role));
}

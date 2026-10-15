/**
 * Module flags and navigation (PRD v2 §2, §5.6, §7 "Navigasi"). Each module is off by default in `app_setting`.
 * A page shows in the menu and answers only when one of its modules is on and the viewer's role may see it; the
 * management role additionally needs `b6_management` (PRD v2 D15: management pages open to non-admin readers only
 * after the WP is verified). Pure (no server imports) so it can be unit-tested.
 */
import type { Role } from "./roles";

export const MODULE_KEYS = [
  "b1_ingest", "b2_costing", "b3_recon", "b4_analysis", "b5_plan", "b5_weekly", "b5_forms", "b6_closing", "b6_management", "b7_outlook", "b8_fs",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  description: string;
}

/** Labels for Pengaturan → Modul (no phase names or table names on screen, PRD v2 §0 prinsip 4). */
export const MODULES: ModuleDef[] = [
  { key: "b1_ingest", label: "Input bulanan dan master", description: "Upload GL, Inventory Valuation, Sales by Item, Average Price, kartu CoGM, payroll, BP; mapping akun; versi standar." },
  { key: "b8_fs", label: "Neraca, laba rugi, dan kas", description: "Neraca dan laba rugi dari neraca saldo Accurate dan BP, modal kerja, arus kas, cek neraca." },
  { key: "b2_costing", label: "Costing bulanan", description: "Pool konversi, alokasi, kartu proses, barang jadi, Lain-lain per SKU." },
  { key: "b3_recon", label: "Rekonsiliasi", description: "HPP kartu ke GL, persediaan WP ke Accurate, material per item." },
  { key: "b4_analysis", label: "Kinerja, kewajaran, bridge", description: "Tren KPI, cek kewajaran, varian per komponen vs BP, bridge margin." },
  { key: "b5_plan", label: "Rencana minggu", description: "Forecast jual, harga material, rencana produksi, bahan dan jam dari standar." },
  { key: "b5_weekly", label: "Biaya dan varian mingguan", description: "Biaya aktual sementara dari grid shift, varian, serapan biaya tetap." },
  { key: "b5_forms", label: "Grid shift pabrik", description: "Input per shift untuk Produksi, Gudang, Engineering; kunci hari; koreksi berpasangan." },
  { key: "b6_closing", label: "Tutup bulan", description: "True-up ke GL, kalibrasi standar, gate rilis, PDF bulanan." },
  { key: "b6_management", label: "Halaman direksi untuk peran Manajemen", description: "Membuka halaman laporan untuk pengguna berperan Manajemen (Admin, Finance, Cost Accounting selalu bisa)." },
  { key: "b7_outlook", label: "Outlook dan kas", description: "Outlook bulan berjalan vs BP, kas harian per rekening, proyeksi 13 minggu." },
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

// ------------------------------------------------------------------------------------------------ pages

export type UserType = "direksi" | "pabrik" | "perencana" | "penyusun" | "admin";
export type NavGroup = "laporan" | "bulanan" | "pabrik" | "perencanaan" | "pengaturan";

export const GROUP_LABEL: Record<NavGroup, string> = {
  laporan: "Laporan", bulanan: "Kerja bulanan", pabrik: "Pabrik", perencanaan: "Perencanaan", pengaturan: "Pengaturan",
};

export interface PageDef {
  key: string;
  /** Route; `[month]` / `[week]` are filled from the current period. */
  href: string;
  label: string;
  group: NavGroup;
  /** Visible when any of these modules is on (empty = always). */
  modules: ModuleKey[];
  roles: Role[];
  /** Management-facing report page: the management role also needs b6_management. */
  report?: boolean;
}

const READERS: Role[] = ["admin", "management", "finance", "cost_accounting"];
const PLANNERS: Role[] = ["ppic", "purchasing", "sales"];
const PLANT: Role[] = ["production", "warehouse", "engineering"];

export const PAGES: PageDef[] = [
  { key: "kinerja", href: "/m/[month]/kinerja", label: "Kinerja", group: "laporan", modules: ["b4_analysis", "b8_fs"], roles: [...READERS, ...PLANNERS], report: true },
  { key: "biaya", href: "/m/[month]/biaya", label: "Biaya per kg", group: "laporan", modules: ["b2_costing"], roles: READERS, report: true },
  { key: "lain", href: "/m/[month]/lain-lain", label: "Lain-lain & SKU", group: "laporan", modules: ["b2_costing"], roles: READERS, report: true },
  { key: "neraca", href: "/m/[month]/neraca", label: "Neraca & BP", group: "laporan", modules: ["b8_fs"], roles: READERS, report: true },
  { key: "kas", href: "/m/[month]/kas", label: "Modal kerja & kas", group: "laporan", modules: ["b8_fs"], roles: READERS, report: true },
  { key: "cek", href: "/m/[month]/cek", label: "Cek & kewajaran", group: "laporan", modules: ["b1_ingest", "b4_analysis", "b8_fs"], roles: READERS, report: true },
  { key: "rekon", href: "/m/[month]/rekon", label: "Rekonsiliasi", group: "laporan", modules: ["b3_recon"], roles: READERS, report: true },
  { key: "mingguan", href: "/w/[week]/mingguan", label: "Mingguan & outlook", group: "laporan", modules: ["b5_weekly", "b7_outlook"], roles: [...READERS, ...PLANNERS], report: true },
  { key: "input", href: "/m/[month]/input", label: "Input bulanan", group: "bulanan", modules: ["b1_ingest"], roles: ["admin", "finance", "cost_accounting"] },
  { key: "tutup", href: "/m/[month]/tutup", label: "Tutup bulan", group: "bulanan", modules: ["b6_closing"], roles: ["admin", "finance", "cost_accounting"] },
  { key: "shift", href: "/shift", label: "Shift hari ini", group: "pabrik", modules: ["b5_forms"], roles: ["admin", ...PLANT] },
  { key: "hari", href: "/hari", label: "Penyelesaian hari", group: "pabrik", modules: ["b5_forms"], roles: ["admin", "finance", ...PLANT] },
  { key: "rencana", href: "/w/[week]/rencana", label: "Rencana minggu", group: "perencanaan", modules: ["b5_plan"], roles: ["admin", "finance", ...PLANNERS] },
  { key: "standar", href: "/standar", label: "Versi standar", group: "perencanaan", modules: ["b1_ingest"], roles: ["admin", "finance", "ppic"] },
  { key: "audit", href: "/pengaturan/audit", label: "Audit", group: "pengaturan", modules: [], roles: ["admin", "finance", "cost_accounting"] },
  { key: "pengaturan", href: "/pengaturan", label: "Pengaturan", group: "pengaturan", modules: [], roles: ["admin"] },
];

export const PAGE_BY_KEY: ReadonlyMap<string, PageDef> = new Map(PAGES.map((p) => [p.key, p]));

export function userType(role: Role): UserType {
  if (role === "admin") return "admin";
  if (role === "management") return "direksi";
  if (role === "finance" || role === "cost_accounting") return "penyusun";
  if (PLANNERS.includes(role)) return "perencana";
  return "pabrik";
}

/** Whether the viewer may open the page now. */
export function pageAllowed(page: PageDef, role: Role, flags: Flags): boolean {
  if (!page.roles.includes(role)) return false;
  if (page.modules.length && !page.modules.some((m) => flags[m])) return false;
  if (page.report && role === "management" && !flags.b6_management) return false;
  return true;
}

/** Menu order per user type (PRD v2 §7 Navigasi). */
const ORDER: Record<UserType, string[]> = {
  direksi: ["kinerja", "biaya", "lain", "neraca", "kas", "cek", "rekon", "mingguan"],
  pabrik: ["shift", "hari"],
  perencana: ["rencana", "standar", "kinerja", "mingguan"],
  penyusun: ["input", "tutup", "kinerja", "biaya", "lain", "neraca", "kas", "cek", "rekon", "mingguan", "rencana", "standar", "hari", "audit"],
  admin: ["kinerja", "biaya", "lain", "neraca", "kas", "cek", "rekon", "mingguan", "input", "tutup", "shift", "hari", "rencana", "standar", "pengaturan", "audit"],
};

export const HOME_KEY: Record<UserType, string> = { direksi: "kinerja", pabrik: "shift", perencana: "rencana", penyusun: "input", admin: "pengaturan" };

/** Pages in menu order for the viewer, with their group. */
export function navFor(role: Role, flags: Flags): PageDef[] {
  return ORDER[userType(role)].map((k) => PAGE_BY_KEY.get(k)!).filter((p) => pageAllowed(p, role, flags));
}

/** A nav route with its period filled in ("/m/[month]/input" → "/m/2026-09-01/input"). */
export function hrefFor(href: string, month: string, week?: string): string {
  return href.replace("[month]", month).replace("[week]", week ?? month);
}

/** The landing page of the viewer: the type's home when open, else the first open page, else null. */
export function homeFor(role: Role, flags: Flags): PageDef | null {
  const home = PAGE_BY_KEY.get(HOME_KEY[userType(role)])!;
  if (pageAllowed(home, role, flags)) return home;
  return navFor(role, flags)[0] ?? null;
}

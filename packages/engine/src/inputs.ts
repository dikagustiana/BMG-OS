/**
 * Input contract of the monthly costing engine (B2).
 *
 * `InputRows` = rows of the B1 input tables and masters as the database returns them (decimal strings, snake_case).
 * `monthInputsFromRows` turns them into the typed `MonthInputs` the modules read. Pure: no I/O, no clock.
 * The web layer (rebuildMonth) passes the rows of one month; nothing else is needed.
 *
 * Tables read (PRD v1 §4.1–§4.2, v2 §5.1–§5.2): gl_month, gl_voucher_tag, payroll_month, payroll_journal,
 * inventory_valuation, sales_by_item, cogm_card, cogm_material, driver_month, fs_control; masters product,
 * product_item, others_group, sku, payroll_group, coa_pool_map, assumption, capacity. New in Fase 2 (see
 * docs/v2/F2-engine-notes.md): wp_opening (opening WP values when no prior month mart exists), cogm_legacy
 * (old-card totals for B10/B11), product_item (product ↔ Accurate item codes).
 */
import { activeMapping, type CoaMapping } from "./controls";
import { D, Dn, ZERO, type Decimal } from "./decimal";
import type { PoolCode, ProductCode } from "./types";

/** Decimal string as stored in PostgreSQL numeric, or a JS number from a JSON fixture. */
export type NumStr = string | number;

/** Columns every input row may carry. `id` (uuid) when read from the database; `line_key` from the parser. */
export interface BaseRow {
  id?: string | null;
  line_key?: string | null;
  month?: string | null;
  deleted_at?: string | null;
}

export interface GlMonthRow extends BaseRow { account: string; net: NumStr; voucher?: string | null; account_name?: string | null }
export interface GlVoucherTagRow extends BaseRow {
  voucher: string; account: string; amount: NumStr; tag: string; target_pool: string; target_line?: string | null; note?: string | null;
}
export interface PayrollMonthRow extends BaseRow { payroll_group_code: string; amount: NumStr }
export interface PayrollJournalRow extends BaseRow { kind: string; voucher?: string | null; amount: NumStr }
export interface InventoryValuationRow extends BaseRow {
  item_code: string; item_name?: string | null; account?: string | null;
  qty_open?: NumStr | null; value_open?: NumStr | null; qty_in?: NumStr | null; value_in?: NumStr | null;
  qty_out_sale?: NumStr | null; value_out_sale?: NumStr | null; qty_out_transfer?: NumStr | null; value_out_transfer?: NumStr | null;
  qty_adj?: NumStr | null; value_adj?: NumStr | null; qty_close?: NumStr | null; value_close?: NumStr | null;
}
export interface SalesByItemRow extends BaseRow {
  item_code?: string | null; item_name: string; unit?: string | null; qty?: NumStr | null; amount: NumStr; customer_group?: string | null;
}
export interface CogmCardRow extends BaseRow { line: string; row_kind: string; qty: NumStr; unit?: string | null }
export interface CogmMaterialRow extends BaseRow {
  line: string; item_name: string; item_code?: string | null; material_group?: string | null; qty?: NumStr | null; unit?: string | null;
  price_card?: NumStr | null; value_card: NumStr;
}
export interface DriverMonthRow extends BaseRow { line: string; driver: string; value: NumStr; estimated?: boolean | null }
export interface FsControlRow extends BaseRow { key: string; amount: NumStr }
/** Opening balances valued on the WP (new card), per process line (WIP) or FG item (new table, Fase 2). */
export interface WpOpeningRow extends BaseRow {
  line: string; kind: string; item_code?: string | null; qty: NumStr; value: NumStr; unit?: string | null;
}
/** Old CoGM card totals per process line (new table, Fase 2): material, upah_kupas, direct_labour, overhead, total. */
export interface CogmLegacyRow extends BaseRow { line: string; component: string; amount: NumStr }

export interface ProductRow {
  code: string; name?: string | null; fg_item_code?: string | null; kw2_nrv_per_kg?: NumStr | null; wip_completion_pct?: NumStr | null;
  sort_order?: number | null;
}
/** Product ↔ Accurate item (new master, Fase 2): role fg | wip | sales | kw2_sales. */
export interface ProductItemRow { product: string; role: string; item_code: string }
export interface OthersGroupRow { code: string; name: string; main_line?: string | null; fg_unit?: string | null; wp_row?: number | null; sort_order?: number | null }
export interface SkuRow {
  code: string; others_group_code: string; name: string; fg_unit?: string | null; kg_per_unit?: NumStr | null; wp_sheet?: string | null;
  sort_order?: number | null;
}
export interface PayrollGroupRow { code: string; name?: string | null; dept?: string | null; kind: string; pool: string }
export interface CoaPoolMapRow {
  account: string; effective_from: string; effective_to: string | null; pool: string; fixed_flag?: boolean | null; confirmed?: boolean | null;
}
export interface AssumptionRow { key: string; value_num?: NumStr | null; value_text?: string | null; effective_from?: string | null }
/** Approved capacity rows (std_version approved) of the weeks of the month; only Unit I is read. */
export interface CapacityRow { week_start: string; dept: string; normal_capacity_hours?: NumStr | null }

/** Previous month's mart rows, for the roll-forward of opening values (used when wp_opening has no row). */
export interface PriorMonthRows {
  process_card_month?: { product: string; wip_close_kg: NumStr; wip_close_value: NumStr; id?: string | null }[];
  fg_month?: { product_or_sku: string; item_code?: string | null; line?: string | null; qty_close_accurate: NumStr; value_close: NumStr; unit?: string | null; id?: string | null }[];
}

export interface InputRows {
  /** YYYY-MM-01 */
  month: string;
  gl_month: GlMonthRow[];
  gl_voucher_tag: GlVoucherTagRow[];
  payroll_month: PayrollMonthRow[];
  payroll_journal: PayrollJournalRow[];
  inventory_valuation: InventoryValuationRow[];
  sales_by_item: SalesByItemRow[];
  cogm_card: CogmCardRow[];
  cogm_material: CogmMaterialRow[];
  driver_month: DriverMonthRow[];
  fs_control?: FsControlRow[];
  wp_opening?: WpOpeningRow[];
  cogm_legacy?: CogmLegacyRow[];
  product: ProductRow[];
  product_item?: ProductItemRow[];
  others_group: OthersGroupRow[];
  sku: SkuRow[];
  payroll_group: PayrollGroupRow[];
  coa_pool_map: CoaPoolMapRow[];
  assumption: AssumptionRow[];
  capacity?: CapacityRow[];
  prior?: PriorMonthRows;
  /** Attach WP Sep26_4 cell references to the mart rows (golden month). */
  wp_template?: "sep26_4" | null;
}

// ------------------------------------------------------------------------------------------------ domain inputs

export type Ref = string;
export type TagKind = "reklas_opex" | "thr_swap" | "tali_asih_cutoff" | "ongkir_singkong" | "pisau_urschel";
export type PayrollKind = "operator" | "support" | "kupas" | "staf";
export type JournalKind = "upah_harian" | "gaji_staf" | "tali_asih";
export type DriverKind = "man_hour" | "hours_paid" | "kg_peeled" | "kwh" | "machine_hour";

export interface GlAmount { ref: Ref; account: string; amount: Decimal }
/** Mapping of an account active in the month (coa_pool_map, effective dates resolved). */
export interface CoaRule { ref: Ref; account: string; pool: string; fixed: boolean | null; confirmed: boolean }
export interface VoucherTag { ref: Ref; voucher: string; account: string; amount: Decimal; tag: TagKind; targetPool: string; targetLine: string | null }
export interface PayrollGroup { ref: Ref; code: string; kind: PayrollKind; pool: PoolCode }
export interface PayrollAmount { ref: Ref; groupCode: string; amount: Decimal }
export interface PayrollJournal { ref: Ref; kind: JournalKind; amount: Decimal }

export interface ProductMaster {
  ref: Ref;
  code: ProductCode;
  fgItemCode: string | null;
  wipItemCode: string | null;
  salesItemCodes: string[];
  kw2SalesItemCodes: string[];
  kw2NrvPerKg: Decimal;
  wipCompletionPct: Decimal;
}

export interface CardQty {
  line: ProductCode;
  wipOpenKg: Decimal;
  inputKg: Decimal;
  kw2Kg: Decimal;
  wasteKg: Decimal;
  wipCloseKg: Decimal;
  /** Premium as reported on the card; the engine derives premium as the residual (WP) and checks this (B06). */
  premiumKg: Decimal | null;
  refs: Ref[];
}

export interface MaterialLine {
  ref: Ref;
  line: string;
  itemName: string;
  /** Card group: Raw materials | Oil | CNG | Material-others (process lines); FCC | KW2 | KW2UBI | EXT (Lain-lain). */
  group: string;
  qty: Decimal | null;
  unit: string | null;
  price: Decimal | null;
  value: Decimal;
}

export interface Driver { ref: Ref; line: string; driver: DriverKind; value: Decimal; estimated: boolean }

export interface InventoryItem {
  ref: Ref;
  itemCode: string;
  qtyOpen: Decimal | null; valueOpen: Decimal | null;
  qtyIn: Decimal | null; valueIn: Decimal | null;
  qtyOutSale: Decimal | null; valueOutSale: Decimal | null;
  qtyOutTransfer: Decimal | null; valueOutTransfer: Decimal | null;
  qtyClose: Decimal | null; valueClose: Decimal | null;
}

export interface SalesLine { ref: Ref; itemCode: string | null; itemName: string; qty: Decimal; amount: Decimal; customerGroup: string | null }

export interface Opening { ref: Ref; line: string; kind: "wip" | "fg"; itemCode: string | null; qty: Decimal; value: Decimal }

export interface OthersGroupMaster { ref: Ref; code: string; name: string; mainLine: string | null; fgUnit: string; wpRow: number | null; sortOrder: number }
export interface SkuMaster { ref: Ref; code: string; groupCode: string; name: string; fgUnit: string; kgPerUnit: Decimal | null; wpSheet: string | null; sortOrder: number }

/** Quantities of a Lain-lain card (SKU sheet / KOPERASI column): kg and FG units. */
export interface SkuCard { line: string; outputKg: Decimal; outputFg: Decimal | null; sampleKg: Decimal; sampleFg: Decimal; refs: Ref[] }

export interface LegacyCard { ref: Ref; line: string; component: string; amount: Decimal }

export interface Assumptions {
  /** BIAYA BERSAMA C46 / Q17: kupas joins the THR & BPJS split (1) or not (0). */
  kupasThrBpjs: Decimal;
  /** BIAYA BERSAMA C110 / D2: idle Unit I labour charged to the period (1) or absorbed by products (0). */
  idleToPeriod: Decimal;
  /** Normal capacity of Unit I in hours (capacity, PPIC). Null = hours paid (Q9). */
  normalCapacityHours: Decimal | null;
  /** Fallback NRV KW 2 when product.kw2_nrv_per_kg is empty (ASUMSI no. 5). */
  nrvKw2: Decimal;
  /** LAIN-LAIN C7: value of KW 2 ubi as Lain-lain material (ASUMSI no. 7). */
  kw2UbiValue: Decimal;
  /** m³ per MMBTU (ASUMSI no. 6, Q18), for the CNG quantity shown on the card. */
  cngM3PerMmbtu: Decimal;
  /** B34 threshold: WIP open > ratio × production (D3). */
  wipOpenOverProductionRatio: Decimal;
  refs: Record<string, Ref>;
}

export interface MonthInputs {
  month: string;
  gl: GlAmount[];
  coa: CoaRule[];
  /** All mappings (for the B44 scope check), unresolved. */
  coaMappings: CoaMapping[];
  tags: VoucherTag[];
  payrollGroups: PayrollGroup[];
  payroll: PayrollAmount[];
  journals: PayrollJournal[];
  products: ProductMaster[];
  cards: CardQty[];
  materials: MaterialLine[];
  drivers: Driver[];
  inventory: InventoryItem[];
  sales: SalesLine[];
  opening: Opening[];
  othersGroups: OthersGroupMaster[];
  skus: SkuMaster[];
  skuCards: SkuCard[];
  legacy: LegacyCard[];
  fsControl: { ref: Ref; key: string; amount: Decimal }[];
  assumptions: Assumptions;
  wpTemplate: "sep26_4" | null;
  /** Problems found while reading the rows (shown with the controls; never silently dropped). */
  issues: string[];
}

// ------------------------------------------------------------------------------------------------ adapter

const PRODUCTS: ProductCode[] = ["FCC", "UU", "UO"];
const POOLS: PoolCode[] = ["A", "KUPAS", "B", "C", "D", "E"];
const TAG_KINDS: TagKind[] = ["reklas_opex", "thr_swap", "tali_asih_cutoff", "ongkir_singkong", "pisau_urschel"];
const PAYROLL_KINDS: PayrollKind[] = ["operator", "support", "kupas", "staf"];
const JOURNAL_KINDS: JournalKind[] = ["upah_harian", "gaji_staf", "tali_asih"];
const DRIVER_KINDS: DriverKind[] = ["man_hour", "hours_paid", "kg_peeled", "kwh", "machine_hour"];

/** Reference of an input row: its uuid, else `<table>:<line_key>`. */
export function rowRef(table: string, r: BaseRow, fallback?: string): Ref {
  if (r.id) return `${table}:${r.id}`;
  return `${table}:${r.line_key ?? fallback ?? "?"}`;
}

const live = <T extends BaseRow>(rows: readonly T[] | undefined, month: string): T[] =>
  (rows ?? []).filter((r) => !r.deleted_at && (!r.month || r.month === month));

const num = (v: NumStr | null | undefined): Decimal => D(v === null || v === undefined ? null : typeof v === "number" ? String(v) : v);
const numN = (v: NumStr | null | undefined): Decimal | null => Dn(v === null || v === undefined ? null : typeof v === "number" ? String(v) : v);

function assumptionValue(rows: AssumptionRow[], key: string, month: string): { value: Decimal | null; ref: Ref | null } {
  const hits = rows.filter((r) => r.key === key && (!r.effective_from || r.effective_from <= month));
  hits.sort((a, b) => ((a.effective_from ?? "") < (b.effective_from ?? "") ? 1 : -1));
  const h = hits[0];
  if (!h) return { value: null, ref: null };
  return { value: numN(h.value_num ?? null), ref: `master:assumption:${key}` };
}

/** Roll-forward: closing balances of the previous month's mart become this month's opening (WP valuation). */
export function openingFromPrior(prior: PriorMonthRows): Opening[] {
  const out: Opening[] = [];
  for (const r of prior.process_card_month ?? []) {
    out.push({ ref: `process_card_month:${r.id ?? r.product}`, line: r.product, kind: "wip", itemCode: null, qty: num(r.wip_close_kg), value: num(r.wip_close_value) });
  }
  for (const r of prior.fg_month ?? []) {
    out.push({
      ref: `fg_month:${r.id ?? r.product_or_sku}`, line: r.product_or_sku, kind: "fg", itemCode: r.item_code ?? r.product_or_sku,
      qty: num(r.qty_close_accurate), value: num(r.value_close),
    });
  }
  return out;
}

export function monthInputsFromRows(rows: InputRows): MonthInputs {
  const month = rows.month;
  if (!/^\d{4}-\d{2}-01$/.test(month)) throw new Error(`Bulan harus YYYY-MM-01: ${month}`);
  const issues: string[] = [];

  // GL and account map
  const gl: GlAmount[] = live(rows.gl_month, month).map((r) => ({ ref: rowRef("gl_month", r), account: r.account, amount: num(r.net) }));
  const coaMappings: CoaMapping[] = rows.coa_pool_map.map((m) => ({
    account: m.account, effective_from: m.effective_from, effective_to: m.effective_to, pool: m.pool, confirmed: m.confirmed !== false,
  }));
  const accounts = [...new Set([...gl.map((g) => g.account), ...live(rows.gl_voucher_tag, month).map((t) => t.account)])].sort();
  const coa: CoaRule[] = [];
  for (const a of accounts) {
    const m = activeMapping(coaMappings, a, month);
    if (!m) continue;
    const raw = rows.coa_pool_map.find((x) => x.account === a && x.effective_from === m.effective_from);
    coa.push({ ref: `master:coa_pool_map:${a}@${m.effective_from}`, account: a, pool: m.pool, fixed: raw?.fixed_flag ?? null, confirmed: m.confirmed });
  }

  // voucher tags
  const tags: VoucherTag[] = [];
  for (const r of live(rows.gl_voucher_tag, month)) {
    if (!TAG_KINDS.includes(r.tag as TagKind)) { issues.push(`Tag voucher tidak dikenal: ${r.tag} (${r.voucher})`); continue; }
    tags.push({ ref: rowRef("gl_voucher_tag", r), voucher: r.voucher, account: r.account, amount: num(r.amount), tag: r.tag as TagKind,
      targetPool: r.target_pool, targetLine: r.target_line ?? null });
  }

  // payroll
  const payrollGroups: PayrollGroup[] = [];
  for (const g of rows.payroll_group) {
    if (!PAYROLL_KINDS.includes(g.kind as PayrollKind) || !POOLS.includes(g.pool as PoolCode)) {
      issues.push(`Kelompok payroll ${g.code}: jenis/pool tidak dikenal (${g.kind}/${g.pool})`);
      continue;
    }
    payrollGroups.push({ ref: `master:payroll_group:${g.code}`, code: g.code, kind: g.kind as PayrollKind, pool: g.pool as PoolCode });
  }
  const payroll: PayrollAmount[] = live(rows.payroll_month, month).map((r) => ({ ref: rowRef("payroll_month", r), groupCode: r.payroll_group_code, amount: num(r.amount) }));
  for (const p of payroll) if (!payrollGroups.some((g) => g.code === p.groupCode)) issues.push(`Payroll: kelompok ${p.groupCode} tidak ada di master`);
  const journals: PayrollJournal[] = [];
  for (const r of live(rows.payroll_journal, month)) {
    if (!JOURNAL_KINDS.includes(r.kind as JournalKind)) { issues.push(`Jurnal payroll jenis tidak dikenal: ${r.kind}`); continue; }
    journals.push({ ref: rowRef("payroll_journal", r), kind: r.kind as JournalKind, amount: num(r.amount) });
  }

  // assumptions
  const as = (key: string, dflt: string) => {
    const a = assumptionValue(rows.assumption, key, month);
    if (a.value === null) issues.push(`Asumsi ${key} tidak ada; default ${dflt} dipakai`);
    return { value: a.value ?? D(dflt), ref: a.ref ?? `default:${key}` };
  };
  const kupas = as("kupas_thr_bpjs", "0"), idle = as("idle_to_period", "0"), nrv = as("nrv_kw2", "0"), kw2Ubi = as("kw2_ubi_value", "0");
  const cng = as("cng_m3_per_mmbtu", "1"), wipRatio = as("wip_open_over_production_ratio", "3");
  const capRows = (rows.capacity ?? []).filter((c) => c.week_start.slice(0, 7) === month.slice(0, 7) && /^unit\s*i$/i.test(c.dept.trim()));
  const normalCapacityHours = capRows.length ? capRows.reduce((s, c) => s.plus(num(c.normal_capacity_hours ?? 0)), ZERO) : null;
  const assumptions: Assumptions = {
    kupasThrBpjs: kupas.value, idleToPeriod: idle.value, normalCapacityHours, nrvKw2: nrv.value, kw2UbiValue: kw2Ubi.value,
    cngM3PerMmbtu: cng.value, wipOpenOverProductionRatio: wipRatio.value,
    refs: { kupas_thr_bpjs: kupas.ref, idle_to_period: idle.ref, nrv_kw2: nrv.ref, kw2_ubi_value: kw2Ubi.ref, cng_m3_per_mmbtu: cng.ref,
      wip_open_over_production_ratio: wipRatio.ref, ...(capRows.length ? { capacity: "master:capacity:Unit I" } : {}) },
  };

  // products and their Accurate items
  const items = rows.product_item ?? [];
  const products: ProductMaster[] = [];
  for (const code of PRODUCTS) {
    const p = rows.product.find((x) => x.code === code);
    if (!p) { issues.push(`Master produk ${code} tidak ada`); continue; }
    const role = (r: string) => items.filter((i) => i.product === code && i.role === r).map((i) => i.item_code);
    const sales = role("sales");
    if (!sales.length) issues.push(`Produk ${code}: kode barang penjualan (product_item role sales) belum diisi; pendapatan dan penjualan = 0`);
    const nrvP = numN(p.kw2_nrv_per_kg ?? null);
    products.push({
      ref: `master:product:${code}`, code, fgItemCode: role("fg")[0] ?? p.fg_item_code ?? null, wipItemCode: role("wip")[0] ?? null,
      salesItemCodes: sales, kw2SalesItemCodes: role("kw2_sales"), kw2NrvPerKg: nrvP ?? (code === "FCC" ? assumptions.nrvKw2 : ZERO),
      wipCompletionPct: numN(p.wip_completion_pct ?? null) ?? D(1),
    });
  }

  // CoGM card: process lines
  const card = live(rows.cogm_card, month);
  const cards: CardQty[] = [];
  for (const code of PRODUCTS) {
    const rs = card.filter((r) => r.line === code);
    if (!rs.length) { issues.push(`Kartu CoGM ${code}: kuantitas belum diunggah`); continue; }
    const q = (k: string) => rs.filter((r) => r.row_kind === k).reduce((s, r) => s.plus(num(r.qty)), ZERO);
    const has = (k: string) => rs.some((r) => r.row_kind === k);
    cards.push({
      line: code, wipOpenKg: q("wip_open"), inputKg: q("input"), kw2Kg: q("kw2"), wasteKg: q("waste"), wipCloseKg: q("wip_close"),
      premiumKg: has("premium") ? q("premium") : null, refs: rs.map((r) => rowRef("cogm_card", r)),
    });
  }

  // materials and drivers
  const materials: MaterialLine[] = live(rows.cogm_material, month).map((r) => ({
    ref: rowRef("cogm_material", r), line: r.line, itemName: r.item_name, group: (r.material_group ?? "").trim(), qty: numN(r.qty ?? null),
    unit: r.unit ?? null, price: numN(r.price_card ?? null), value: num(r.value_card),
  }));
  const drivers: Driver[] = [];
  for (const r of live(rows.driver_month, month)) {
    if (!DRIVER_KINDS.includes(r.driver as DriverKind)) { issues.push(`Driver tidak dikenal: ${r.line}/${r.driver}`); continue; }
    drivers.push({ ref: rowRef("driver_month", r), line: r.line, driver: r.driver as DriverKind, value: num(r.value), estimated: !!r.estimated });
  }

  // Lain-lain masters and cards
  const othersGroups: OthersGroupMaster[] = rows.others_group.map((g, i) => ({
    ref: `master:others_group:${g.code}`, code: g.code, name: g.name, mainLine: g.main_line ?? null, fgUnit: g.fg_unit ?? "kg",
    wpRow: g.wp_row ?? null, sortOrder: g.sort_order ?? i + 1,
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  const skus: SkuMaster[] = rows.sku.map((s, i) => ({
    ref: `master:sku:${s.code}`, code: s.code, groupCode: s.others_group_code, name: s.name, fgUnit: s.fg_unit ?? "kg",
    kgPerUnit: numN(s.kg_per_unit ?? null), wpSheet: s.wp_sheet ?? null, sortOrder: s.sort_order ?? i + 1,
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  const unitCodes = new Set([...skus.map((s) => s.code), ...othersGroups.map((g) => g.code)]);
  const skuCards: SkuCard[] = [];
  for (const line of [...new Set(card.filter((r) => unitCodes.has(r.line)).map((r) => r.line))]) {
    const rs = card.filter((r) => r.line === line);
    const q = (k: string) => rs.filter((r) => r.row_kind === k).reduce((s, r) => s.plus(num(r.qty)), ZERO);
    skuCards.push({
      line, outputKg: q("output"), outputFg: rs.some((r) => r.row_kind === "output_fg") ? q("output_fg") : null, sampleKg: q("sample"),
      sampleFg: q("sample_fg"), refs: rs.map((r) => rowRef("cogm_card", r)),
    });
  }
  for (const d of drivers) {
    if (d.line === "LAIN" && d.driver !== "hours_paid") {
      issues.push(`Driver ${d.driver} di lini LAIN tidak bisa dibagi ke SKU; isi per SKU atau kelompok (contoh: jam mesin Ubi putih ACE pada SKU-nya)`);
    }
  }

  const inventory: InventoryItem[] = live(rows.inventory_valuation, month).map((r) => ({
    ref: rowRef("inventory_valuation", r), itemCode: r.item_code,
    qtyOpen: numN(r.qty_open), valueOpen: numN(r.value_open), qtyIn: numN(r.qty_in), valueIn: numN(r.value_in),
    qtyOutSale: numN(r.qty_out_sale), valueOutSale: numN(r.value_out_sale), qtyOutTransfer: numN(r.qty_out_transfer),
    valueOutTransfer: numN(r.value_out_transfer), qtyClose: numN(r.qty_close), valueClose: numN(r.value_close),
  }));
  const sales: SalesLine[] = live(rows.sales_by_item, month).map((r) => ({
    ref: rowRef("sales_by_item", r), itemCode: r.item_code ?? null, itemName: r.item_name, qty: num(r.qty ?? null), amount: num(r.amount),
    customerGroup: r.customer_group ?? null,
  }));

  // opening balances: uploaded wp_opening rows win; otherwise the previous month's mart
  const uploaded: Opening[] = [];
  for (const r of live(rows.wp_opening, month)) {
    if (r.kind !== "wip" && r.kind !== "fg") { issues.push(`Saldo awal WP jenis tidak dikenal: ${r.kind}`); continue; }
    uploaded.push({ ref: rowRef("wp_opening", r), line: r.line, kind: r.kind, itemCode: r.item_code ?? null, qty: num(r.qty), value: num(r.value) });
  }
  const fromPrior = rows.prior ? openingFromPrior(rows.prior) : [];
  const key = (o: Opening) => `${o.kind}|${o.kind === "wip" ? o.line : o.itemCode ?? o.line}`;
  const seen = new Set(uploaded.map(key));
  const opening = [...uploaded, ...fromPrior.filter((o) => !seen.has(key(o)))];

  const legacy: LegacyCard[] = live(rows.cogm_legacy, month).map((r) => ({ ref: rowRef("cogm_legacy", r), line: r.line, component: r.component, amount: num(r.amount) }));
  const fsControl = live(rows.fs_control, month).map((r) => ({ ref: rowRef("fs_control", r), key: r.key, amount: num(r.amount) }));

  return {
    month, gl, coa, coaMappings, tags, payrollGroups, payroll, journals, products, cards, materials, drivers, inventory, sales, opening,
    othersGroups, skus, skuCards, legacy, fsControl, assumptions, wpTemplate: rows.wp_template ?? null, issues,
  };
}

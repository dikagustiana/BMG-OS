/**
 * Data mart rows of B2 costing (PRD v1 §4.4 + PRD v2 §5.4). Every row carries its provenance:
 * - `rule_id`: engine function + version (e.g. `pool.buildPools@1`);
 * - `inputs`: references of the input rows used (`<table>:<id or line_key>` or `master:<table>:<key>`);
 * - `source_ref` / `source_refs`: WP cells (`Sheet!A1`, suffix ` (Rp jt)` when the WP shows Rp juta) for the
 *   golden month template (WP Sep26_4). `source_refs` maps a field of the row to its cell; `source_ref` is the cell
 *   of the row's headline number.
 * Money, kg and ratios are Decimal in memory and decimal strings when serialised (`serializeMart`). Never `number`.
 */
import type { Decimal } from "./decimal";
import { canonical } from "./snapshot";
import type { ControlStatus, LineCode, PoolCode, ProductCode } from "./types";

export interface Provenance {
  rule_id: string;
  inputs: string[];
  source_ref: string | null;
  source_refs: Record<string, string>;
}

/** One line of a pool (BIAYA BERSAMA bagian 3 and the bagian 8 lines that land in the pool). */
export interface PoolComponent {
  key: string;
  label: string;
  amount: Decimal;
  fixed: boolean;
  /** "gl" = from the 16 GL accounts (incl. the payroll split); "adjustment" = voucher tags of bagian 8. */
  origin: "gl" | "adjustment";
  inputs: string[];
}

export interface PoolMonthRow extends Provenance {
  month: string;
  pool: PoolCode;
  gl_amount: Decimal;
  adjustment: Decimal;
  total: Decimal;
  fixed: Decimal;
  variable: Decimal;
  components: PoolComponent[];
}

/** Unit I labour capacity (BIAYA BERSAMA bagian 5; PSAK 202). */
export interface IdleMonthRow extends Provenance {
  month: string;
  hours_paid: Decimal;
  hours_to_product: Decimal;
  idle_hours: Decimal;
  idle_pct: Decimal;
  rate_per_hour: Decimal;
  idle_cost: Decimal;
  normal_capacity_hours: Decimal;
  idle_to_period: Decimal;
  period_charge: Decimal;
}

export type AllocationMethod = "actual" | "budget_compare";
export type DriverCode = "man_hour" | "kg_peeled" | "kwh" | "machine_hour" | "material_value" | "volume";

export interface AllocationMonthRow extends Provenance {
  month: string;
  pool: PoolCode;
  line: LineCode;
  method: AllocationMethod;
  driver: DriverCode;
  driver_value: Decimal;
  driver_share: Decimal;
  amount: Decimal;
  /** Grup D actual: machine-hour share, bagging share (Lain-lain) and the Lain-lain split bagging / machine hours. */
  detail: Record<string, Decimal>;
}

export interface MaterialItemValue {
  item_name: string;
  group: string;
  qty: Decimal | null;
  unit: string | null;
  price: Decimal | null;
  value: Decimal;
  ref: string;
}

/** Material of a process card by card group (Raw materials, Oil, CNG, Material-others) + item lines. */
export interface ProcessMaterial {
  raw_materials: Decimal;
  /** Ongkos kirim singkong booked to the line's material (BIAYA BERSAMA bagian 8, tag MATERIAL). */
  freight_in: Decimal;
  oil: Decimal;
  cng: Decimal;
  cng_mmbtu: Decimal;
  others: Decimal;
  /** Σ card lines (= allocation driver "nilai material", without freight). */
  card_total: Decimal;
  total: Decimal;
  items: MaterialItemValue[];
}

export interface ProcessConversion {
  kupas: Decimal;
  A: Decimal;
  B: Decimal;
  C: Decimal;
  D: Decimal;
  E: Decimal;
  foh: Decimal;
  total: Decimal;
}

export interface ProcessCardMonthRow extends Provenance {
  month: string;
  product: ProductCode;
  kg_input: Decimal;
  kg_premium: Decimal;
  kg_kw2: Decimal;
  kg_waste: Decimal;
  wip_open_kg: Decimal;
  wip_close_kg: Decimal;
  wip_completion_pct: Decimal;
  material: ProcessMaterial;
  conversion: ProcessConversion;
  total_cost: Decimal;
  cost_per_kg_input: Decimal;
  wip_open_value: Decimal;
  kw2_nrv_per_kg: Decimal;
  kw2_nrv_credit: Decimal;
  cost_to_account: Decimal;
  equivalent_kg: Decimal;
  rate_per_kg: Decimal;
  premium_value: Decimal;
  waste_value: Decimal;
  wip_close_value: Decimal;
  /** Premium, KW 2 and waste as a share of kg input (rendemen = premium_pct). */
  premium_pct: Decimal;
  kw2_pct: Decimal;
  waste_pct: Decimal;
  /** Rp per kg of input by card line (WP column F): raw_materials (with freight), oil, cng, others, material, kupas, A–E, foh, conversion, total. */
  per_kg: Record<string, Decimal>;
}

export interface FgMonthRow extends Provenance {
  month: string;
  /** FCC | UU | UO for process products; LAIN for Lain-lain SKUs. */
  line: LineCode;
  product_or_sku: string;
  item_code: string | null;
  unit: string;
  qty_open: Decimal;
  value_open: Decimal;
  /** WP opening value carried without quantity (does not enter the average; ASUMSI no. 12). */
  value_open_residual: Decimal;
  qty_in: Decimal;
  value_in: Decimal;
  avg_rate: Decimal;
  qty_sold: Decimal;
  cogs_sold: Decimal;
  qty_transfer: Decimal;
  value_transfer: Decimal;
  qty_close_accurate: Decimal;
  value_close: Decimal;
  qty_diff: Decimal;
  cogs_qty_diff: Decimal;
  cogs_waste: Decimal;
  qty_kw2_sold: Decimal;
  cogs_kw2_sold: Decimal;
  cogs_total: Decimal;
  revenue: Decimal;
  gross_margin: Decimal;
  gross_margin_pct: Decimal;
  /** Memo from Accurate (book values; label "buku"). Null when the Inventory Valuation row is missing. */
  accurate: {
    qty_open: Decimal | null;
    value_open: Decimal | null;
    qty_in: Decimal | null;
    value_in: Decimal | null;
    qty_out_sale: Decimal | null;
    value_out_sale: Decimal | null;
    qty_transfer: Decimal | null;
    value_close: Decimal | null;
  };
}

export type OthersRowKind = "sku" | "group" | "no_card";

export interface OthersMonthRow extends Provenance {
  month: string;
  row_kind: OthersRowKind;
  others_group: string | null;
  sku: string | null;
  fg_unit: string;
  kg_out: Decimal;
  units_out: Decimal;
  sample_kg: Decimal;
  fcc_in_kg: Decimal;
  kw2_in_kg: Decimal;
  kw2_ubi_in_kg: Decimal;
  man_hour: Decimal;
  kwh: Decimal;
  machine_hour: Decimal;
  fcc_value: Decimal;
  kw2_value: Decimal;
  ext_material: Decimal;
  dl: Decimal;
  foh_b: Decimal;
  foh_cd: Decimal;
  foh_e: Decimal;
  foh: Decimal;
  total: Decimal;
  per_kg: Decimal;
  fg_value_open: Decimal;
  fg_value_close: Decimal;
  cogs: Decimal;
  revenue: Decimal;
  margin: Decimal;
  margin_pct: Decimal;
}

/** Per line totals (REKON & KONTROL bagian 1, RINGKASAN bagian 1). */
export interface SummaryMonthRow extends Provenance {
  month: string;
  line: LineCode | "TOTAL";
  kg_production: Decimal;
  material_ext: Decimal;
  material_interproduct: Decimal;
  kupas: Decimal;
  dl: Decimal;
  foh: Decimal;
  total_cost: Decimal;
  cost_per_kg: Decimal;
  cogs: Decimal;
  revenue: Decimal;
  gross_margin: Decimal;
  gross_margin_pct: Decimal;
}

export interface ControlMonthRow extends Provenance {
  month: string;
  code: string;
  /** FCC / UU / UO / LAIN / a SKU code, or null for a plant-wide control. */
  scope: string | null;
  label: string;
  value: Decimal | null;
  tolerance: Decimal | null;
  status: ControlStatus;
  note: string;
  /** Sub-checks folded into this control (e.g. B05: budget compare, Grup D portions), with their values. */
  detail: Record<string, Decimal>;
}

/** JSON-ready copy of mart rows: decimals as fixed-scale strings (10 decimals), keys sorted. */
export function serializeMart<T>(rows: T, dp = 10): unknown {
  return canonical(rows, dp);
}

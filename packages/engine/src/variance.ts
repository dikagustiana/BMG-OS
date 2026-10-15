/**
 * B4 varian vs flex budget — `variance.ts` (PRD v2 §4.8 "Varian vs flex budget (BP v1)"; PRD v1 §4.5 "Flex budget",
 * §4.6 B42–B43; PLAN v1 Fase 4).
 *
 * Per product FCC/UU/UO and per component (rows of WP FCC bagian 4, UU/UO bagian 4) in Rp per kg masuk proses:
 *   selisih (H) = aktual (F) − budget (G) = harga/belanja (I) + pemakaian/yield (J) + volume (K) + metode alokasi (L); cek (M) = 0.
 *   Material: I = (P_akt − P_bud) × Q/kg_akt; J = (Q/kg_akt − Q/kg_bud) × P_bud.
 *   Pool konversi: flex = budget variabel × kg_akt/kg_bud + budget tetap; I = (alokasi metode budget − flex)/kg_akt;
 *   K = flex/kg_akt − budget/kg_bud (= tetap/kg_bud × (kg_bud − kg_akt)/kg_akt); L = (alokasi aktual − alokasi metode budget)/kg_akt.
 * With the whole conversion budget treated as fixed (fixed share 1) the formulas are exactly the WP's.
 * Lain-lain: total only (PRD v2 §4.8, D8/D9).
 *
 * Budget source: BP v1 `budget_line` rows of the month keyed by `driver_code` (D12) through `BP_V1_MAP`, and
 * `budget_pool_map` for the pool totals of B43. The WP Sep26_4 BUDGET sheet is empty ("dikosongkan sementara"), so the
 * golden test runs with an empty budget; the BP v1 run is checked by B42 (Σ komponen = biaya produksi BP) and B43.
 */
import { D, Decimal, ZERO, div, sum, type Num } from "./decimal";
import { monthOf } from "./dates";
import { ruleId, trace, within, type ControlMonthRow, type MartTrace, type Refs } from "./mart-row";
import type { ControlStatus } from "./types";

export type VarianceProduct = "FCC" | "UU" | "UO";
export const VARIANCE_PRODUCTS: readonly VarianceProduct[] = ["FCC", "UU", "UO"];

export type VarianceGroup = "raw_materials" | "oil" | "cng" | "material_others" | "peeling" | "direct_labour" | "factory_overhead";
export type MaterialComponent =
  | "cassava_peel" | "cassava_flesh" | "ubi_ungu" | "ubi_orange" | "olein" | "cng" | "ammonium"
  | "hdpe_003" | "hdpe_005" | "hdpe_006" | "hdpe_007" | "carton" | "other" | "peeling";
export type PoolComponent = "pool_a" | "pool_b" | "pool_c" | "pool_d" | "pool_e";
export type VarianceComponent = MaterialComponent | PoolComponent;

export const GROUP_LABEL: Record<VarianceGroup, string> = {
  raw_materials: "Bahan baku", oil: "Minyak", cng: "CNG", material_others: "Material lain", peeling: "Upah kupas",
  direct_labour: "Tenaga kerja langsung", factory_overhead: "Overhead pabrik",
};
export const COMPONENT_LABEL: Record<VarianceComponent, string> = {
  cassava_peel: "Singkong kulit premium", cassava_flesh: "Singkong daging premium", ubi_ungu: "Ubi ungu", ubi_orange: "Ubi orange",
  olein: "Minyak olein", cng: "CNG (MMBTU)", ammonium: "Amonium bicarbonate", hdpe_003: "HDPE 0,03", hdpe_005: "HDPE 0,05", hdpe_006: "HDPE 0,06",
  hdpe_007: "HDPE 0,07", carton: "Kemasan IFM (karton)", other: "Biaya lain (plakban, tali, label, plastik)", peeling: "Upah kupas (kg dikupas)",
  pool_a: "Grup A – DL operator", pool_b: "Grup B – IDL", pool_c: "Grup C – energi & utilitas", pool_d: "Grup D – mesin", pool_e: "Grup E – pabrik umum",
};

/** Row layout of bagian 4 per product: groups in order, components per group, WP rows (golden source_ref). */
export interface VarianceLayout {
  sheet: string;
  groups: { group: VarianceGroup; row: number; items: { component: VarianceComponent; row: number }[] }[];
  totalRow: number;
}

const g = (group: VarianceGroup, row: number, items: [VarianceComponent, number][]) => ({ group, row, items: items.map(([component, r]) => ({ component, row: r })) });

export const VARIANCE_LAYOUT: Record<VarianceProduct, VarianceLayout> = {
  FCC: {
    sheet: "FCC", totalRow: 133, groups: [
      g("raw_materials", 112, [["cassava_peel", 110], ["cassava_flesh", 111]]), g("oil", 114, [["olein", 113]]), g("cng", 116, [["cng", 115]]),
      g("material_others", 123, [["ammonium", 117], ["hdpe_003", 118], ["hdpe_005", 119], ["hdpe_007", 120], ["carton", 121], ["other", 122]]),
      g("peeling", 125, [["peeling", 124]]), g("direct_labour", 127, [["pool_a", 126]]),
      g("factory_overhead", 132, [["pool_b", 128], ["pool_c", 129], ["pool_d", 130], ["pool_e", 131]]),
    ],
  },
  UU: {
    sheet: "UU", totalRow: 126, groups: [
      g("raw_materials", 105, [["ubi_ungu", 104]]), g("oil", 107, [["olein", 106]]), g("cng", 109, [["cng", 108]]),
      g("material_others", 116, [["ammonium", 110], ["hdpe_003", 111], ["hdpe_006", 112], ["hdpe_007", 113], ["carton", 114], ["other", 115]]),
      g("peeling", 118, [["peeling", 117]]), g("direct_labour", 120, [["pool_a", 119]]),
      g("factory_overhead", 125, [["pool_b", 121], ["pool_c", 122], ["pool_d", 123], ["pool_e", 124]]),
    ],
  },
  UO: {
    sheet: "UO", totalRow: 122, groups: [
      g("raw_materials", 101, [["ubi_orange", 100]]), g("oil", 103, [["olein", 102]]), g("cng", 105, [["cng", 104]]),
      g("material_others", 112, [["ammonium", 106], ["hdpe_003", 107], ["hdpe_005", 108], ["hdpe_007", 109], ["carton", 110], ["other", 111]]),
      g("peeling", 114, [["peeling", 113]]), g("direct_labour", 116, [["pool_a", 115]]),
      g("factory_overhead", 121, [["pool_b", 117], ["pool_c", 118], ["pool_d", 119], ["pool_e", 120]]),
    ],
  },
};

const POOLS: readonly PoolComponent[] = ["pool_a", "pool_b", "pool_c", "pool_d", "pool_e"];
const isPool = (c: VarianceComponent): c is PoolComponent => (POOLS as readonly string[]).includes(c);

// ---------------------------------------------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------------------------------------------

/** Actual material (or upah kupas) of one component — Fase 2 process_card_month.material[] (qty, price, value) and the KUPAS allocation (kg dikupas, Rp/kg, value). */
export interface ActualMaterial {
  component: MaterialComponent;
  /** Qty in the card unit (kg, MMBTU, pcs, kg dikupas); null for "other" (Rp only). FCC!B41 … */
  qty: Num | null;
  /** Price per unit (FCC!D41 …); null for "other". */
  price: Num | null;
  /** Value Rp (FCC!E41 …). */
  value: Num;
}

/** Actual pool allocation to the product — allocation_month method 'actual' and method 'budget_compare' (BIAYA BERSAMA 6 and 6b). */
export interface ActualPool {
  component: PoolComponent;
  /** allocation_month (method actual) — FCC!E59…E63 = BIAYA BERSAMA C115, C117…C120 */
  allocated: Num;
  /** allocation_month (method budget_compare, volume) — BIAYA BERSAMA C125, C127…C130 */
  budgetMethodAllocated: Num;
}

export interface VarianceActual {
  product: VarianceProduct;
  /** process_card_month.kg_input (FCC!B30, UU!B32, UO!B28) */
  kgInput: Num;
  materials: ActualMaterial[];
  pools: ActualPool[];
  refs?: Refs;
}

/** Budget of one component for the month: qty (materials) and amount in Rp. */
export interface BudgetComponent {
  component: VarianceComponent;
  qty: Num | null;
  amount: Num;
  /** Pools only: share of the budget that does not move with volume (budget_pool_map.fixed_pct; default: pool_month fixed ÷ total). */
  fixedShare?: Num | null;
}

export interface VarianceBudget {
  product: VarianceProduct;
  /** e.g. "BP Okt-26 v1"; null = no budget (WP Sep26_4 BUDGET sheet is empty) */
  version: string | null;
  /** Budget production volume, kg (BP "Target output Produksi") */
  kg: Num;
  components: BudgetComponent[];
  /** BP total production cost of the product (B42); null when unknown */
  totalProductionCost: Num | null;
  refs?: Refs;
}

// ---------------------------------------------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------------------------------------------

export interface VarianceRowResult {
  product: VarianceProduct;
  level: "item" | "group" | "total";
  group: VarianceGroup | null;
  component: VarianceComponent | null;
  label: string;
  /** B, C, D, E (items only) */
  qtyPerKgAct: Decimal | null;
  qtyPerKgBud: Decimal | null;
  priceAct: Decimal | null;
  priceBud: Decimal | null;
  /** F … M */
  actualPerKg: Decimal;
  budgetPerKg: Decimal;
  diff: Decimal;
  price: Decimal;
  usage: Decimal;
  volume: Decimal;
  method: Decimal;
  check: Decimal;
  source_ref: string;
}

export interface ProductVarianceResult {
  product: VarianceProduct;
  month: string;
  budgetVersion: string | null;
  kgAct: Decimal;
  kgBud: Decimal;
  rows: VarianceRowResult[];
  total: VarianceRowResult;
  /** max |cek| over item rows */
  maxCheck: Decimal;
}

const sumRows = (rows: VarianceRowResult[], k: "actualPerKg" | "budgetPerKg" | "diff" | "price" | "usage" | "volume" | "method" | "check") => sum(rows.map((r) => r[k]));

/** FCC/UU/UO bagian 4 for one product. Components absent from the actual or the budget count as 0. */
export function productVariance(month: string, actual: VarianceActual, budget: VarianceBudget | null): ProductVarianceResult {
  const product = actual.product;
  const layout = VARIANCE_LAYOUT[product];
  const kgAct = D(actual.kgInput);
  const kgBud = budget ? D(budget.kg) : ZERO;
  const bud = new Map((budget?.components ?? []).map((c) => [c.component, c]));
  const mat = new Map(actual.materials.map((m) => [m.component, m]));
  const pools = new Map(actual.pools.map((p) => [p.component, p]));
  const ref = (row: number) => `${layout.sheet}!H${row}`;

  const item = (component: VarianceComponent, group: VarianceGroup, row: number): VarianceRowResult => {
    const b = bud.get(component);
    const budAmt = b ? D(b.amount) : ZERO;
    const G = div(budAmt, kgBud);
    if (isPool(component)) {
      const p = pools.get(component);
      const alloc = p ? D(p.allocated) : ZERO, bm = p ? D(p.budgetMethodAllocated) : ZERO;
      const f = b?.fixedShare === null || b?.fixedShare === undefined ? new Decimal(1) : D(b.fixedShare);
      // flex budget at actual volume: the variable part moves with kg, the fixed part does not (no budget volume → no flex)
      const flex = kgBud.isZero() ? budAmt : budAmt.times(new Decimal(1).minus(f)).times(kgAct).div(kgBud).plus(budAmt.times(f));
      const F = div(alloc, kgAct);
      const I = div(bm.minus(flex), kgAct);
      const K = kgAct.isZero() ? ZERO.minus(G) : flex.div(kgAct).minus(G);
      const L = div(alloc.minus(bm), kgAct);
      const H = F.minus(G);
      return {
        product, level: "item", group, component, label: COMPONENT_LABEL[component], qtyPerKgAct: null, qtyPerKgBud: null, priceAct: null, priceBud: null,
        actualPerKg: F, budgetPerKg: G, diff: H, price: I, usage: ZERO, volume: K, method: L, check: H.minus(I).minus(K).minus(L), source_ref: ref(row),
      };
    }
    const a = mat.get(component as MaterialComponent);
    const F = div(a ? D(a.value) : ZERO, kgAct);
    const H = F.minus(G);
    if (component === "other") {
      return {
        product, level: "item", group, component, label: COMPONENT_LABEL[component], qtyPerKgAct: null, qtyPerKgBud: null, priceAct: null, priceBud: null,
        actualPerKg: F, budgetPerKg: G, diff: H, price: ZERO, usage: H, volume: ZERO, method: ZERO, check: ZERO, source_ref: ref(row),
      };
    }
    const B = div(a?.qty === null || a?.qty === undefined ? ZERO : D(a.qty), kgAct);
    const budQty = b?.qty === null || b?.qty === undefined ? ZERO : D(b.qty);
    const C = div(budQty, kgBud);
    const Dp = a?.price === null || a?.price === undefined ? ZERO : D(a.price);
    const E = div(budAmt, budQty);
    const I = Dp.minus(E).times(B);
    const J = B.minus(C).times(E);
    return {
      product, level: "item", group, component, label: COMPONENT_LABEL[component], qtyPerKgAct: B, qtyPerKgBud: C, priceAct: Dp, priceBud: E,
      actualPerKg: F, budgetPerKg: G, diff: H, price: I, usage: J, volume: ZERO, method: ZERO, check: H.minus(I).minus(J), source_ref: ref(row),
    };
  };

  const rows: VarianceRowResult[] = [];
  const groupRows: VarianceRowResult[] = [];
  for (const gr of layout.groups) {
    const items = gr.items.map((it) => item(it.component, gr.group, it.row));
    rows.push(...items);
    const gRow: VarianceRowResult = {
      product, level: "group", group: gr.group, component: null, label: GROUP_LABEL[gr.group], qtyPerKgAct: null, qtyPerKgBud: null, priceAct: null, priceBud: null,
      actualPerKg: sumRows(items, "actualPerKg"), budgetPerKg: sumRows(items, "budgetPerKg"), diff: sumRows(items, "diff"), price: sumRows(items, "price"),
      usage: sumRows(items, "usage"), volume: sumRows(items, "volume"), method: sumRows(items, "method"), check: sumRows(items, "check"), source_ref: ref(gr.row),
    };
    rows.push(gRow);
    groupRows.push(gRow);
  }
  const total: VarianceRowResult = {
    product, level: "total", group: null, component: null, label: "Total", qtyPerKgAct: null, qtyPerKgBud: null, priceAct: null, priceBud: null,
    actualPerKg: sumRows(groupRows, "actualPerKg"), budgetPerKg: sumRows(groupRows, "budgetPerKg"), diff: sumRows(groupRows, "diff"), price: sumRows(groupRows, "price"),
    usage: sumRows(groupRows, "usage"), volume: sumRows(groupRows, "volume"), method: sumRows(groupRows, "method"), check: sumRows(groupRows, "check"), source_ref: ref(layout.totalRow),
  };
  rows.push(total);
  const maxCheck = rows.filter((r) => r.level === "item").reduce((m, r) => (r.check.abs().gt(m) ? r.check.abs() : m), ZERO);
  return { product, month: monthOf(month), budgetVersion: budget?.version ?? null, kgAct, kgBud, rows, total, maxCheck };
}

/** Lain-lain at total level (no component split until BP v2). */
export interface OthersVarianceInputs {
  /** Σ others_month.kg_out (LAIN-LAIN!C43) and Σ others_month.total (LAIN-LAIN!G68) */
  actualKg: Num;
  actualCost: Num;
  /** BP: Lain-lain "Volume Premium" and "Total Cost of Manufacturing" of the month */
  budgetKg: Num;
  budgetCost: Num;
  version: string | null;
}

export interface OthersVarianceResult {
  actualKg: Decimal;
  actualCost: Decimal;
  budgetKg: Decimal;
  budgetCost: Decimal;
  actualPerKg: Decimal;
  budgetPerKg: Decimal;
  diffPerKg: Decimal;
  diffAmount: Decimal;
}

export function othersVariance(i: OthersVarianceInputs): OthersVarianceResult {
  const actualKg = D(i.actualKg), actualCost = D(i.actualCost), budgetKg = D(i.budgetKg), budgetCost = D(i.budgetCost);
  const actualPerKg = div(actualCost, actualKg), budgetPerKg = div(budgetCost, budgetKg);
  return { actualKg, actualCost, budgetKg, budgetCost, actualPerKg, budgetPerKg, diffPerKg: actualPerKg.minus(budgetPerKg), diffAmount: actualCost.minus(budgetCost) };
}

// ---------------------------------------------------------------------------------------------------------------
// BP v1 → budget (driver codes, D12)
// ---------------------------------------------------------------------------------------------------------------

/** A budget_line of one version (any month); `driver_code` = driver_code_base + '|' + 'YYYY-MM'. */
export interface BudgetLineInput {
  driver_code: string;
  value: Num | null;
}

/** budget_pool_map row (fixtures/budget-v1/budget_pool_map.json). */
export interface BudgetPoolMapInput {
  bp_row_code: string;
  pool: string;
  fixed_pct: Num | null;
}

interface BpComponentMap { qty?: string; amount: string }
interface BpProductMap {
  /** "Target output Produksi" (kg masuk proses equivalent) */
  kg: string;
  /** "Total Production Cost" (B42) */
  total: string;
  /** Driver C (volume produksi) of the product — share for the aligned Grup A/B */
  driverC: string;
  components: Partial<Record<VarianceComponent, BpComponentMap>>;
}

/**
 * Driver codes of BP v1 ("Business Plan - Model Details") per product and component. Taken from the WP Sep26_4 BUDGET
 * sheet (column A "Baris MD" = bp_row) and the variance formulas of FCC/UU/UO bagian 4; MD rows in comments.
 * Grup A/B are not read from the product rows (MD485/486…) but re-aligned like BUDGET rows 87–88 (`BP_V1_SHARED`).
 */
export const BP_V1_MAP: Record<VarianceProduct, BpProductMap> = {
  FCC: {
    kg: "ALL|6.1.2.target_output_produksi.kg", // MD421
    total: "ALL|6.3.1.total_production_cost.idr_mio", // MD507
    driverC: "FCC|4.4_basis_alokasi_driver_per_produk.driver_c_volume_produksi_flat_chip_cassava.kg", // MD203
    components: {
      cassava_peel: { qty: "ALL|6.2.1.raw_materials.kg_wet", amount: "ALL|6.2.1.total_singkong_kulit_premium_input.idr_mio" }, // MD429, MD431
      cassava_flesh: { qty: "ALL|6.2.1.raw_materials.kg_wet#2", amount: "ALL|6.2.1.total_singkong_daging.idr_mio" }, // MD435, MD437
      olein: { qty: "ALL|6.2.2.raw_materials.kg", amount: "ALL|6.2.2.oil.idr_mio" }, // MD442, MD444
      cng: { qty: "ALL|6.2.3.raw_materials.mmbtu", amount: "ALL|6.2.3.cng.idr_mio" }, // MD447, MD449
      ammonium: { qty: "ALL|6.2.4.raw_materials.kg", amount: "ALL|6.2.4.amonium_bicarbonate.idr_mio" }, // MD452, MD454
      hdpe_003: { qty: "ALL|6.2.5.raw_materials.kg", amount: "ALL|6.2.5.hdpe_0_03.idr_mio" }, // MD457, MD459
      hdpe_005: { qty: "ALL|6.2.6.raw_materials.kg", amount: "ALL|6.2.6.hdpe_0_05.idr_mio" }, // MD462, MD464
      hdpe_007: { qty: "ALL|6.2.7.raw_materials.kg", amount: "ALL|6.2.7.hdpe_0_07.idr_mio" }, // MD467, MD469
      carton: { qty: "ALL|6.2.8.raw_materials.pcs", amount: "ALL|6.2.8.ifm_packaging.idr_mio" }, // MD472, MD474
      other: { amount: "ALL|6.2.9.total_cost.idr_mio" }, // MD477
      peeling: { qty: "ALL|6.2.10.dikupas.kg", amount: "ALL|6.2.10.total_upah_kupas.idr_mio" }, // MD481, MD483
      pool_c: { amount: "ALL|6.2.11.grup_c_energi_dan_utilitas_pabrik.idr_mio" }, // MD487
      pool_d: { amount: "ALL|6.2.11.grup_d_pemeliharaan_dan_penyusutan_mesin.idr_mio" }, // MD488
      pool_e: { amount: "ALL|6.2.11.grup_e_pabrik_umum_dan_penyusutan_inventaris.idr_mio" }, // MD489
    },
  },
  UU: {
    kg: "ALL|7.1.2.target_output_produksi.kg", // MD582
    total: "ALL|7.3.1.total_production_cost.idr_mio", // MD663
    driverC: "UU|4.4_basis_alokasi_driver_per_produk.driver_c_volume_produksi_ubi_ungu.kg", // MD204
    components: {
      ubi_ungu: { qty: "ALL|7.2.1.raw_materials.kg_wet", amount: "UU|7.2.1.total_ubi_ungu.idr_mio" }, // MD587, MD589
      olein: { qty: "ALL|7.2.2.raw_materials.kg", amount: "ALL|7.2.2.oil.idr_mio" }, // MD598, MD600
      cng: { qty: "ALL|7.2.3.raw_materials.mmbtu", amount: "ALL|7.2.3.cng.idr_mio" }, // MD603, MD605
      ammonium: { qty: "ALL|7.2.4.raw_materials.kg", amount: "ALL|7.2.4.amonium_bicarbonate.idr_mio" }, // MD608, MD610
      hdpe_003: { qty: "ALL|7.2.5.raw_materials.kg", amount: "ALL|7.2.5.hdpe_0_03.idr_mio" }, // MD613, MD615
      hdpe_006: { qty: "ALL|7.2.6.raw_materials.kg", amount: "ALL|7.2.6.hdpe_0_06.idr_mio" }, // MD618, MD620
      hdpe_007: { qty: "ALL|7.2.7.raw_materials.kg", amount: "ALL|7.2.7.hdpe_0_07.idr_mio" }, // MD623, MD625
      carton: { qty: "ALL|7.2.8.raw_materials.pcs", amount: "ALL|7.2.8.ifm_packaging.idr_mio" }, // MD628, MD630
      other: { amount: "ALL|7.2.9.total_cost.pcs" }, // MD633 (unit label "pcs" in BP; value is Rp)
      peeling: { qty: "ALL|7.2.10.dikupas.kg", amount: "ALL|7.2.10.upah_kupas.idr_mio" }, // MD637, MD639
      pool_c: { amount: "ALL|7.2.11.grup_c_energi_dan_utilitas_pabrik.idr_mio" }, // MD643
      pool_d: { amount: "ALL|7.2.11.grup_d_pemeliharaan_dan_penyusutan_mesin.idr_mio" }, // MD644
      pool_e: { amount: "ALL|7.2.11.grup_e_pabrik_umum_dan_penyusutan_inventaris.idr_mio" }, // MD645
    },
  },
  UO: {
    kg: "ALL|8.1.2.target_output_produksi.kg", // MD745
    total: "ALL|8.3.1.total_production_cost.idr_mio", // MD827
    driverC: "UO|4.4_basis_alokasi_driver_per_produk.driver_c_volume_produksi_ubi_orange.kg", // MD205
    components: {
      ubi_orange: { qty: "ALL|8.2.1.raw_materials.kg_wet", amount: "UO|8.2.1.total_ubi_orange.idr_mio" }, // MD751, MD753
      olein: { qty: "ALL|8.2.2.raw_materials.kg", amount: "ALL|8.2.2.oil.idr_mio" }, // MD762, MD764
      cng: { qty: "ALL|8.2.3.raw_materials.mmbtu", amount: "ALL|8.2.3.cng.idr_mio" }, // MD767, MD769
      ammonium: { qty: "ALL|8.2.4.raw_materials.kg", amount: "ALL|8.2.4.amonium_bicarbonate.idr_mio" }, // MD772, MD774
      hdpe_003: { qty: "ALL|8.2.5.raw_materials.kg", amount: "ALL|8.2.5.hdpe_0_03.idr_mio" }, // MD777, MD779
      hdpe_005: { qty: "ALL|8.2.6.raw_materials.kg", amount: "ALL|8.2.6.hdpe_0_05.idr_mio" }, // MD782, MD784
      hdpe_007: { qty: "ALL|8.2.7.raw_materials.kg", amount: "ALL|8.2.7.hdpe_0_07.idr_mio" }, // MD787, MD789
      carton: { qty: "ALL|8.2.8.raw_materials.pcs", amount: "ALL|8.2.8.ifm_packaging.idr_mio" }, // MD792, MD794
      other: { amount: "ALL|8.2.9.total_cost.pcs" }, // MD797 (unit label "pcs" in BP; value is Rp)
      peeling: { qty: "ALL|8.4.10_upah_kupas.dikupas.kg", amount: "ALL|8.4.10_upah_kupas.upah_kupas.idr_mio" }, // MD801, MD803
      pool_c: { amount: "ALL|8.2.11.grup_c_energi_dan_utilitas_pabrik.idr_mio" }, // MD807
      pool_d: { amount: "ALL|8.2.11.grup_d_pemeliharaan_dan_penyusutan_mesin.idr_mio" }, // MD808
      pool_e: { amount: "ALL|8.2.11.grup_e_pabrik_umum_dan_penyusutan_inventaris.idr_mio" }, // MD809
    },
  },
};

/** BP rows of the re-aligned Grup A/B (WP BUDGET rows 87–88) and the Lain-lain / pool totals. */
export const BP_V1_SHARED = {
  /** MD102 DL operator monthly cost */ dlMonthly: "ALL|4.1_pool_biaya_pabrik_per_laba_rugi_akun.monthly_coast.idr_mil",
  /** MD117 support daily workers monthly cost */ supportMonthly: "ALL|4.1_pool_biaya_pabrik_per_laba_rugi_akun.monthly_coast.idr_mil#2",
  /** MD134 staff monthly cost */ staffMonthly: "ALL|4.1_pool_biaya_pabrik_per_laba_rugi_akun.monthly_coast.idr_mil#3",
  /** MD138 indirect labour (bonus) */ indirectLabour: "ALL|4.1_pool_biaya_pabrik_per_laba_rugi_akun.indirect_labour.idr_mil",
  /** MD142 BPJS direct labour */ bpjsDirect: "ALL|4.1_pool_biaya_pabrik_per_laba_rugi_akun.direct_labour.idr_mil#2",
  /** MD143 BPJS indirect labour */ bpjsIndirect: "ALL|4.1_pool_biaya_pabrik_per_laba_rugi_akun.indirect_labour.idr_mil#2",
  /** MD202 driver C total */ driverCTotal: "ALL|4.4_basis_alokasi_driver_per_produk.driver_c_volume_produksi.kg",
  /** MD900 Lain-lain volume premium */ othersKg: "ALL|rantai_volume_rendemen_dan_kebutuhan_bahan_baku.volume_premium.kg",
  /** MD949 Lain-lain total cost of manufacturing */ othersCost: "ALL|total_cost_of_manufacturing.idr_mil",
  /** MD222/227/232/237/242 Lain-lain pool allocation A–E */
  othersPools: {
    pool_a: "LAIN|4.4_alokasi_pool_ke_produk_per_grup.grup_a_tenaga_kerja_langsung_lain_lain.idr_mil",
    pool_b: "LAIN|4.4_alokasi_pool_ke_produk_per_grup.grup_b_tenaga_kerja_tidak_langsung_dan_benefit_lain_lain.idr_mil",
    pool_c: "LAIN|4.4_alokasi_pool_ke_produk_per_grup.grup_c_energi_dan_utilitas_pabrik_lain_lain.idr_mil",
    pool_d: "LAIN|4.4_alokasi_pool_ke_produk_per_grup.grup_d_pemeliharaan_dan_penyusutan_mesin_lain_lain.idr_mil",
    pool_e: "LAIN|4.4_alokasi_pool_ke_produk_per_grup.grup_e_pabrik_umum_dan_penyusutan_inventaris_lain_lain.idr_mil",
  } as Record<PoolComponent, string>,
} as const;

/** Pool letter of budget_pool_map → component. */
const POOL_OF: Record<string, PoolComponent> = { A: "pool_a", B: "pool_b", C: "pool_c", D: "pool_d", E: "pool_e" };

/** Index of budget lines of one month by driver_code_base. */
export function budgetLineIndex(lines: readonly BudgetLineInput[], month: string): Map<string, Decimal | null> {
  const ym = monthOf(month).slice(0, 7);
  const out = new Map<string, Decimal | null>();
  const suffix = `|${ym}`;
  for (const l of lines) {
    if (!l.driver_code.endsWith(suffix)) continue;
    out.set(l.driver_code.slice(0, -suffix.length), l.value === null || l.value === undefined || l.value === "" ? null : D(l.value));
  }
  return out;
}

export interface BpBudget {
  version: string;
  products: Record<VarianceProduct, VarianceBudget>;
  others: { kg: Decimal; cost: Decimal; pools: Record<PoolComponent, Decimal> };
  /** Pool totals of BP section 4.3 from budget_pool_map (rows whose code starts with "4.3_"). */
  poolTotals: Record<PoolComponent, Decimal>;
  /** Codes that were looked up but absent from the month (→ treated as 0). */
  missing: string[];
}

/**
 * Builds the month's budget from BP v1 lines. `poolFixedShare` = default fixed share per pool when budget_pool_map has
 * no fixed_pct (decision V-02: the month's actual pool_month fixed ÷ total, BRIDGE GP FS_A…FS_E).
 */
export function budgetFromBp(lines: readonly BudgetLineInput[], poolMap: readonly BudgetPoolMapInput[], month: string, version: string,
  poolFixedShare: Partial<Record<PoolComponent, Num>> = {}): BpBudget {
  const idx = budgetLineIndex(lines, month);
  const missing: string[] = [];
  const get = (code: string): Decimal => {
    const v = idx.get(code);
    if (v === undefined) { missing.push(code); return ZERO; }
    return v ?? ZERO;
  };
  const sh = BP_V1_SHARED;
  const poolTotals: Record<PoolComponent, Decimal> = { pool_a: ZERO, pool_b: ZERO, pool_c: ZERO, pool_d: ZERO, pool_e: ZERO };
  const fixedPct: Partial<Record<PoolComponent, Decimal>> = {};
  for (const r of poolMap) {
    if (!r.bp_row_code.startsWith("4.3_")) continue; // 4.1 rows are the account detail of the same totals
    const pc = POOL_OF[r.pool];
    if (!pc) continue;
    const code = ["ALL", "FCC", "UU", "UO", "LAIN"].map((p) => `${p}|${r.bp_row_code}`).find((c) => idx.has(c));
    poolTotals[pc] = poolTotals[pc].plus(code ? idx.get(code) ?? ZERO : ZERO);
    if (!code) missing.push(`*|${r.bp_row_code}`);
    if (r.fixed_pct !== null && r.fixed_pct !== undefined && r.fixed_pct !== "") fixedPct[pc] = D(r.fixed_pct);
  }
  const shareOf = (pc: PoolComponent): Decimal | null => fixedPct[pc] ?? (poolFixedShare[pc] === undefined ? null : D(poolFixedShare[pc]));
  const thr = new Decimal(1).plus(new Decimal(1).div(12));
  const alignedABase = get(sh.dlMonthly).times(thr).plus(get(sh.bpjsDirect));
  const alignedBBase = get(sh.supportMonthly).times(thr).plus(get(sh.staffMonthly)).plus(get(sh.indirectLabour)).plus(get(sh.bpjsIndirect));
  const driverCTotal = get(sh.driverCTotal);

  const products = {} as Record<VarianceProduct, VarianceBudget>;
  for (const p of VARIANCE_PRODUCTS) {
    const map = BP_V1_MAP[p];
    const share = div(get(map.driverC), driverCTotal);
    const components: BudgetComponent[] = [];
    for (const [comp, m] of Object.entries(map.components) as [VarianceComponent, BpComponentMap][]) {
      components.push({ component: comp, qty: m.qty ? get(m.qty) : null, amount: get(m.amount), fixedShare: isPool(comp) ? shareOf(comp) : null });
    }
    components.push({ component: "pool_a", qty: null, amount: alignedABase.times(share), fixedShare: shareOf("pool_a") });
    components.push({ component: "pool_b", qty: null, amount: alignedBBase.times(share), fixedShare: shareOf("pool_b") });
    products[p] = { product: p, version, kg: get(map.kg), components, totalProductionCost: get(map.total) };
  }
  const othersPools = Object.fromEntries(POOLS.map((pc) => [pc, get(sh.othersPools[pc])])) as Record<PoolComponent, Decimal>;
  return { version, products, others: { kg: get(sh.othersKg), cost: get(sh.othersCost), pools: othersPools }, poolTotals, missing };
}

// ---------------------------------------------------------------------------------------------------------------
// Month: products + Lain-lain + B42/B43 + rows
// ---------------------------------------------------------------------------------------------------------------

export interface VarianceMonthInputs {
  month: string;
  actual: Record<VarianceProduct, VarianceActual>;
  /** null = no budget for the month (WP Sep26_4: BUDGET sheet empty) */
  budget: BpBudget | null;
  others: { actualKg: Num; actualCost: Num };
}

export interface VarianceMonthResult {
  month: string;
  products: Record<VarianceProduct, ProductVarianceResult>;
  others: OthersVarianceResult;
  controls: ControlMonthRow[];
  rows: VarianceMonthRow[];
}

/** One `variance_month` row (PRD v1 §4.4 + proposed columns). */
export interface VarianceMonthRow extends MartTrace {
  month: string;
  product: VarianceProduct | "LAIN";
  component: string;
  level: "item" | "group" | "total";
  group: VarianceGroup | null;
  label: string;
  budget_version: string | null;
  qty_per_kg_act: Decimal | null;
  qty_per_kg_bud: Decimal | null;
  price_act: Decimal | null;
  price_bud: Decimal | null;
  actual_per_kg: Decimal;
  budget_per_kg: Decimal;
  diff: Decimal;
  price: Decimal | null;
  usage: Decimal | null;
  volume: Decimal | null;
  method: Decimal | null;
  check: Decimal | null;
  kg_act: Decimal;
  kg_bud: Decimal;
  actual_amount: Decimal | null;
  budget_amount: Decimal | null;
}

const RULE_PRODUCT = ruleId("variance.productVariance");
const RULE_OTHERS = ruleId("variance.othersVariance");
const RULE_CTL = ruleId("variance.varianceMonth");
const RP1 = new Decimal(1);

export function varianceMonth(inp: VarianceMonthInputs): VarianceMonthResult {
  const month = monthOf(inp.month);
  const products = {} as Record<VarianceProduct, ProductVarianceResult>;
  for (const p of VARIANCE_PRODUCTS) products[p] = productVariance(month, inp.actual[p], inp.budget?.products[p] ?? null);
  const b = inp.budget;
  const others = othersVariance({ actualKg: inp.others.actualKg, actualCost: inp.others.actualCost, budgetKg: b?.others.kg ?? ZERO, budgetCost: b?.others.cost ?? ZERO, version: b?.version ?? null });

  const controls: ControlMonthRow[] = [];
  if (!b) {
    controls.push({ month, code: "B42", label: "Budget: Rp/kg × kg = total biaya produksi BP", value: null, tolerance: RP1, status: "BELUM_DIISI", note: "Versi budget bulan ini belum ada", ...trace(RULE_CTL, null, {}) });
    controls.push({ month, code: "B43", label: "Σ pool budget per produk = pool BP", value: null, tolerance: RP1, status: "BELUM_DIISI", note: "Versi budget bulan ini belum ada", ...trace(RULE_CTL, null, {}) });
  } else {
    const diffs = VARIANCE_PRODUCTS.map((p) => {
      const vb = b.products[p];
      const comp = sum(products[p].rows.filter((r) => r.level === "item").map((r) => r.budgetPerKg.times(D(vb.kg))));
      return { p, comp, total: vb.totalProductionCost === null ? null : D(vb.totalProductionCost) };
    });
    const worst = diffs.reduce((m, d) => (d.total === null ? m : d.comp.minus(d.total).abs().gt(m.abs()) ? d.comp.minus(d.total) : m), ZERO);
    const anyMissing = diffs.some((d) => d.total === null);
    const st: ControlStatus = anyMissing ? "BELUM_DIISI" : within(worst, RP1) ? "LULUS" : "GAGAL";
    controls.push({
      month, code: "B42", label: "Budget: Rp/kg × kg = total biaya produksi BP", value: worst, tolerance: RP1, status: st,
      note: diffs.map((d) => `${d.p}: Σ komponen ${d.comp.toFixed(2)} vs BP ${d.total?.toFixed(2) ?? "—"}`).join("; "),
      ...trace(RULE_CTL, null, Object.fromEntries(diffs.flatMap((d) => [[`${d.p}Components`, d.comp], [`${d.p}BpTotal`, d.total]]))),
    });
    const poolBudget = sum(VARIANCE_PRODUCTS.flatMap((p) => b.products[p].components.filter((c) => isPool(c.component)).map((c) => D(c.amount))))
      .plus(sum(POOLS.map((pc) => b.others.pools[pc])));
    const bpPool = sum(POOLS.map((pc) => b.poolTotals[pc]));
    const v43 = poolBudget.minus(bpPool);
    controls.push({
      month, code: "B43", label: "Σ pool budget per produk (FCC, UU, UO, Lain-lain) = pool BP", value: v43, tolerance: RP1,
      status: bpPool.isZero() ? "BELUM_DIISI" : within(v43, RP1) ? "LULUS" : "GAGAL",
      note: `Σ pool per produk ${poolBudget.toFixed(2)} vs pool BP (bagian 4.3) ${bpPool.toFixed(2)}; Grup A/B diselaraskan per produk (A + B tetap = BP)`,
      ...trace(RULE_CTL, null, { poolBudget, bpPool }),
    });
  }
  return { month, products, others, controls, rows: varianceRows(month, products, others, b?.version ?? null, inp.actual) };
}

export function varianceRows(month: string, products: Record<VarianceProduct, ProductVarianceResult>, others: OthersVarianceResult, version: string | null,
  actual?: Record<VarianceProduct, VarianceActual>): VarianceMonthRow[] {
  const out: VarianceMonthRow[] = [];
  for (const p of VARIANCE_PRODUCTS) {
    const pr = products[p];
    for (const r of pr.rows) {
      out.push({
        month, product: p, component: r.component ?? r.group ?? "total", level: r.level, group: r.group, label: r.label, budget_version: version,
        qty_per_kg_act: r.qtyPerKgAct, qty_per_kg_bud: r.qtyPerKgBud, price_act: r.priceAct, price_bud: r.priceBud,
        actual_per_kg: r.actualPerKg, budget_per_kg: r.budgetPerKg, diff: r.diff, price: r.price, usage: r.usage, volume: r.volume, method: r.method, check: r.check,
        kg_act: pr.kgAct, kg_bud: pr.kgBud, actual_amount: r.actualPerKg.times(pr.kgAct), budget_amount: r.budgetPerKg.times(pr.kgBud),
        ...trace(RULE_PRODUCT, r.source_ref, { actualPerKg: r.actualPerKg, budgetPerKg: r.budgetPerKg, kgAct: pr.kgAct, kgBud: pr.kgBud }, actual?.[p].refs),
      });
    }
  }
  out.push({
    month, product: "LAIN", component: "total", level: "total", group: null, label: "Lain-lain (total)", budget_version: version,
    qty_per_kg_act: null, qty_per_kg_bud: null, price_act: null, price_bud: null, actual_per_kg: others.actualPerKg, budget_per_kg: others.budgetPerKg,
    diff: others.diffPerKg, price: null, usage: null, volume: null, method: null, check: null, kg_act: others.actualKg, kg_bud: others.budgetKg,
    actual_amount: others.actualCost, budget_amount: others.budgetCost,
    ...trace(RULE_OTHERS, "LAIN-LAIN!G68", { actualCost: others.actualCost, actualKg: others.actualKg, budgetCost: others.budgetCost, budgetKg: others.budgetKg }),
  });
  return out;
}

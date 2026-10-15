/**
 * WP Sep26_4 → engine inputs of Fase 3–4 (recon, reasonableness, variance, bridge), for golden tests and snapshots.
 * Pure: reads a `CellIndex` (fixtures/<month>/cells.csv, loaded by the caller). Every number comes from a WP cell; nothing
 * is hard-coded. In production the same input fields are filled from the Fase 2 data mart and the B1 tables (see the field
 * doc comments in recon.ts, reasonableness.ts, variance.ts, bridge.ts and docs/v2/F34-engine-notes.md).
 */
import { D, Decimal, sum, type Num } from "./decimal";
import { cellKey, type CellIndex } from "./golden";
import type { InventoryItemInput, MaterialItemInput, ReconInputs, WpItemValue, ReconMaterialLine } from "./recon";
import type { KpiHistoryMonth, MomKpiCode, MomSourceInputs, TrendKpiCode } from "./reasonableness";
import { MOM_KPIS, TREND_KPIS } from "./reasonableness";
import type { ActualMaterial, ActualPool, MaterialComponent, VariancePool, VarianceActual, VarianceProduct } from "./variance";
import type { BridgeInputCode, BridgeMonthInputs, BridgeSources } from "./bridge";
import { addMonths } from "./dates";

export const GOLDEN_MONTH = "2026-09-01";
const MILLION = new Decimal(1_000_000);

/** "REKON & KONTROL!C45" → cell. */
export function wpReader(cells: CellIndex) {
  const split = (ref: string): [string, string] => {
    const i = ref.lastIndexOf("!");
    return [ref.slice(0, i), ref.slice(i + 1)];
  };
  const get = (ref: string) => cells.get(cellKey(...split(ref)));
  return {
    /** numeric cell (throws when absent or not a number) */
    n(ref: string): string {
      const c = get(ref);
      if (!c) throw new Error(`Sel ${ref} tidak ada`);
      if (c.type !== "n") throw new Error(`Sel ${ref} bukan angka (${c.type}: ${c.value})`);
      return c.value;
    },
    /** numeric cell or 0 when blank */
    n0(ref: string): string {
      const c = get(ref);
      return c && c.type === "n" ? c.value : "0";
    },
    /** Rp juta cell → Rp */
    jt(ref: string): Decimal {
      return D(this.n(ref)).times(MILLION);
    },
    s(ref: string): string | null {
      return get(ref)?.value ?? null;
    },
    f(ref: string): string | null {
      return get(ref)?.formula ?? null;
    },
    has(ref: string): boolean {
      return !!get(ref);
    },
  };
}
export type WpReader = ReturnType<typeof wpReader>;

/** material_item rows (fixtures/master/material_item.json) used to classify olein (K2). */
export interface MaterialMasterRow {
  name: string;
  code: string | null;
  category: string;
}

// ---------------------------------------------------------------------------------------------------------------
// Recon (B3)
// ---------------------------------------------------------------------------------------------------------------

/** LAIN-LAIN B22:B42 text → material line of REKON & KONTROL B25:B27 (SUMIF "Ubi Ungu*", "Ubi Orange", rest singkong). */
export function othersMainLine(text: string): ReconMaterialLine {
  const t = text.trim().toLowerCase();
  if (t.startsWith("ubi ungu")) return "LAIN_UBI_UNGU";
  if (t === "ubi orange") return "LAIN_UBI_ORANGE";
  return "LAIN_SINGKONG";
}

export function reconInputsFromWp(cells: CellIndex, materials: readonly MaterialMasterRow[]): ReconInputs {
  const w = wpReader(cells);
  const othersByLine: Record<"LAIN_SINGKONG" | "LAIN_UBI_UNGU" | "LAIN_UBI_ORANGE", Decimal> = { LAIN_SINGKONG: D(0), LAIN_UBI_UNGU: D(0), LAIN_UBI_ORANGE: D(0) };
  for (let r = 22; r <= 42; r++) {
    const line = othersMainLine(w.s(`LAIN-LAIN!B${r}`) ?? "") as keyof typeof othersByLine;
    othersByLine[line] = othersByLine[line].plus(D(w.n0(`LAIN-LAIN!G${r}`)));
  }
  const hppRefs = {
    poolTotal: "BIAYA BERSAMA!C87", idlePeriodCharge: "BIAYA BERSAMA!C111", glMaterialUsage: "REKON & KONTROL!B29", hppGl: "REKON & KONTROL!C45",
    glRevenue: "REKON & KONTROL!C73", ongkirToMaterial: "BIAYA BERSAMA!C159", conversionCards: "REKON & KONTROL!F9:F11", materialExternal: "REKON & KONTROL!F7",
    revenueLines: "REKON & KONTROL!F15", materialVariance: "REKON & KONTROL!B30", hppRecon: "REKON & KONTROL!C44",
  };
  const category = new Map(materials.map((m) => [m.name.trim().toLowerCase(), m.category]));

  const materialItems: MaterialItemInput[] = [];
  for (let r = 7; r <= 60; r++) {
    const name = w.s(`REKON MATERIAL!A${r}`);
    if (!name) continue;
    const note = w.s(`REKON MATERIAL!O${r}`) ?? "";
    materialItems.push({
      name, code: /BB-\d+/.exec(note)?.[0] ?? null, unit: w.s(`REKON MATERIAL!B${r}`), qtyCard: w.n0(`REKON MATERIAL!C${r}`),
      cardByLine: { FCC: w.n0(`REKON MATERIAL!D${r}`), UU: w.n0(`REKON MATERIAL!E${r}`), UO: w.n0(`REKON MATERIAL!F${r}`), LAIN: w.n0(`REKON MATERIAL!G${r}`) },
      accOpen: w.n0(`REKON MATERIAL!I${r}`), accIn: w.n0(`REKON MATERIAL!J${r}`),
      accClose: w.f(`REKON MATERIAL!K${r}`) ? null : w.n0(`REKON MATERIAL!K${r}`), wpRow: r,
    });
  }

  const items: InventoryItemInput[] = [];
  const wpItems: WpItemValue[] = [];
  for (let r = 55; r <= 135; r++) {
    const code = w.s(`REKON PERSEDIAAN!A${r}`);
    if (!code) continue;
    const name = w.s(`REKON PERSEDIAAN!B${r}`);
    items.push({
      code, name, account: w.s(`REKON PERSEDIAAN!C${r}`),
      accQtyOpen: w.n0(`REKON PERSEDIAAN!E${r}`), accValueOpen: w.n0(`REKON PERSEDIAAN!F${r}`),
      accQtyClose: w.n0(`REKON PERSEDIAAN!G${r}`), accValueClose: w.n0(`REKON PERSEDIAAN!H${r}`),
      movement: (w.s(`REKON PERSEDIAAN!I${r}`) ?? "").trim().toLowerCase() === "ya",
      materialCategory: name ? category.get(name.trim().toLowerCase()) ?? null : null,
      oldCardRatePerKg: w.n0(`REKON PERSEDIAAN!R${r}`), wpRow: r,
    });
    // WP scope (K1) = rows whose WP columns link to a product/SKU sheet
    if (w.f(`REKON PERSEDIAAN!K${r}`) || w.f(`REKON PERSEDIAAN!M${r}`)) {
      wpItems.push({
        code, qtyOpen: w.n0(`REKON PERSEDIAAN!J${r}`), valueOpen: w.n0(`REKON PERSEDIAAN!K${r}`),
        qtyClose: w.n0(`REKON PERSEDIAAN!L${r}`), valueClose: w.n0(`REKON PERSEDIAAN!M${r}`),
      });
    }
  }

  return {
    month: GOLDEN_MONTH,
    hpp: {
      month: GOLDEN_MONTH,
      hppCard: { FCC: w.n("FCC!E104"), UU: w.n("UU!E98"), UO: w.n("UO!E94"), LAIN: w.n("LAIN-LAIN!G93") },
      revenue: { FCC: w.n("FCC!C211"), UU: w.n("UU!C207"), UO: w.n("UO!C203"), LAIN: w.n("REKON & KONTROL!C74") },
      materialExternal: { FCC: w.n("FCC!E56"), UU: w.n("UU!G218"), UO: w.n("UO!G214"), LAIN: w.n("LAIN-LAIN!D68") },
      conversion: {
        FCC: { kupas: w.n("FCC!E58"), directLabour: w.n("FCC!E59"), overhead: w.n("FCC!E64") },
        UU: { kupas: w.n("UU!E58"), directLabour: w.n("UU!E59"), overhead: w.n("UU!E64") },
        UO: { kupas: w.n("UO!E54"), directLabour: w.n("UO!E55"), overhead: w.n("UO!E60") },
        LAIN: { kupas: "0", directLabour: w.n("LAIN-LAIN!E68"), overhead: w.n("LAIN-LAIN!F68") },
      },
      materialCard: { FCC: w.n("BIAYA BERSAMA!C94"), UU: w.n("BIAYA BERSAMA!D94"), UO: w.n("BIAYA BERSAMA!E94"), ...othersByLine },
      glMaterialUsage: w.jt("REKON & KONTROL!B29"),
      inventory: {
        FCC: { wipOpen: w.n("FCC!E72"), wipClose: w.n("FCC!E79"), fgOpen: w.n("FCC!E86"), fgClose: w.n("FCC!E92") },
        UU: { wipOpen: w.n("UU!E70"), wipClose: w.n("UU!E77"), fgOpen: w.n("UU!E84"), fgClose: w.n("UU!E89") },
        UO: { wipOpen: w.n("UO!E66"), wipClose: w.n("UO!E73"), fgOpen: w.n("UO!E80"), fgClose: w.n("UO!E85") },
        LAIN: { wipOpen: "0", wipClose: "0", fgOpen: w.n("LAIN-LAIN!E93"), fgClose: w.n("LAIN-LAIN!F93") },
      },
      glInventoryMovement: { wip: w.n("REKON & KONTROL!C75"), fg: w.n("REKON & KONTROL!C76") },
      kw2: { kgProduced: w.n("FCC!B33"), kgToOthers: w.n("LAIN-LAIN!E43"), kgSold: w.n("FCC!C208"), nrvPerKg: w.n("FCC!C209") },
      section8: { toPools: w.n("BIAYA BERSAMA!C157"), toThr: w.n("BIAYA BERSAMA!C158"), toMaterial: w.n("BIAYA BERSAMA!C159") },
      pool: { total: w.n("BIAYA BERSAMA!C87"), idlePeriodCharge: w.n("BIAYA BERSAMA!C111") },
      glRevenue: w.n("REKON & KONTROL!C73"),
      hppGl: w.jt("REKON & KONTROL!C45"),
      refs: hppRefs,
    },
    material: {
      items: materialItems,
      gl: { open: w.n("REKON MATERIAL!C67"), receipts: w.n("REKON MATERIAL!C68"), usage: w.n("REKON MATERIAL!C69") },
      lkPlHpp: { open: w.n("REKON MATERIAL!E67"), receipts: w.n("REKON MATERIAL!E68"), usage: w.n("REKON MATERIAL!E69"), close: w.n("REKON MATERIAL!E70") },
    },
    inventory: { items, wpItems, tolerance: w.n("REKON PERSEDIAAN!E29"), oldCardLimit: w.n("REKON PERSEDIAAN!E41") },
    glConversion: w.n("BIAYA BERSAMA!C23"),
    lk: {
      revenue: w.n("RINGKASAN!B58"), materialUsage: w.n("RINGKASAN!B59"), conversion: w.n("RINGKASAN!B60"), cogs: w.n("RINGKASAN!B61"),
      inv1106001Close: w.n("RINGKASAN!B62"), inv1106002Open: w.n("RINGKASAN!B63"), inv1106002Close: w.n("RINGKASAN!B64"),
      inv1106003Open: w.n("RINGKASAN!B65"), inv1106003Close: w.n("RINGKASAN!B66"),
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Reasonableness (B4)
// ---------------------------------------------------------------------------------------------------------------

const col = (first: string, i: number) => String.fromCharCode(first.charCodeAt(0) + i);

/** CEK KEWAJARAN bagian 3 (rows 42–57, Jan–Sep in columns B–J) → KpiHistoryMonth[]. */
export function kpiHistoryFromWp(cells: CellIndex): KpiHistoryMonth[] {
  const w = wpReader(cells);
  const fields: [keyof KpiHistoryMonth, number][] = [
    ["inputKg", 42], ["kw2Kg", 43], ["wasteKg", 44], ["premiumKg", 45], ["cassavaPeelKg", 46], ["cassavaPeelRp", 47], ["cassavaFleshKg", 48],
    ["cassavaFleshRp", 49], ["oleinKg", 50], ["oleinRp", 51], ["cngM3", 52], ["cngRp", 53], ["cartonPcs", 54], ["dlHours", 55],
    ["oldCardMaterialRp", 56], ["oldCardCostAddedRp", 57],
  ];
  return Array.from({ length: 9 }, (_, i) => {
    const c = col("B", i);
    const h: Record<string, unknown> = { month: addMonths("2026-01-01", i) };
    const refs: Record<string, string> = {};
    for (const [f, r] of fields) {
      h[f] = w.n(`CEK KEWAJARAN!${c}${r}`);
      refs[f] = `CEK KEWAJARAN!${c}${r}`;
    }
    h.refs = refs;
    return h as unknown as KpiHistoryMonth;
  });
}

/** CEK KEWAJARAN N6:N20 → notes per KPI (golden month). */
export function trendNotesFromWp(cells: CellIndex): Partial<Record<TrendKpiCode, string>> {
  const w = wpReader(cells);
  const out: Partial<Record<TrendKpiCode, string>> = {};
  for (const k of TREND_KPIS) {
    const t = w.s(`CEK KEWAJARAN!N${k.wpRow}`);
    if (t) out[k.code] = t;
  }
  return out;
}

/** Sources of bagian 2 column C (Fase 2 outputs of the golden month). */
export function momSourceFromWp(cells: CellIndex): MomSourceInputs {
  const w = wpReader(cells);
  return {
    fccInputKg: w.n("FCC!B30"), fccProductionCost: w.n("FCC!E66"), fccMaterial: w.n("FCC!E56"), fccConversion: w.n("FCC!E65"),
    fccPoolB: w.n("FCC!E60"), fccPoolD: w.n("FCC!E62"), fccPoolE: w.n("FCC!E63"), fccOtherMaterial: w.n("FCC!E55"),
    uuInputKg: w.n("UU!B32"), uuProductionCost: w.n("UU!E66"), uoInputKg: w.n("UO!B28"), uoProductionCost: w.n("UO!E62"),
    othersOutputKg: w.n("LAIN-LAIN!C43"), othersProductionCost: w.n("LAIN-LAIN!G68"),
    poolFixed: w.n("BIAYA BERSAMA!D87"), poolVariable: w.n("BIAYA BERSAMA!E87"), poolA: w.n("BIAYA BERSAMA!C81"), manHours: w.n("BIAYA BERSAMA!G91"),
  };
}

/** Bagian 2 previous month (column B, typed from WP Agu26_6), limits (E) and explanations (G). */
export function momPriorFromWp(cells: CellIndex) {
  const w = wpReader(cells);
  const prior: Partial<Record<MomKpiCode, string>> = {}, thresholds: Partial<Record<MomKpiCode, string>> = {}, explanations: Partial<Record<MomKpiCode, string>> = {};
  for (const k of MOM_KPIS) {
    prior[k.code] = w.n(`CEK KEWAJARAN!B${k.wpRow}`);
    thresholds[k.code] = w.n(`CEK KEWAJARAN!E${k.wpRow}`);
    const g = w.s(`CEK KEWAJARAN!G${k.wpRow}`);
    if (g) explanations[k.code] = g;
  }
  return { prior, thresholds, explanations };
}

// ---------------------------------------------------------------------------------------------------------------
// Variance (B4)
// ---------------------------------------------------------------------------------------------------------------

interface ActualRows {
  sheet: string;
  kg: string;
  bbColumn: string;
  materials: [MaterialComponent, number][];
  other: number;
  peeling: number;
  pools: [VariancePool, number][];
}

/** Section 2b rows of each product sheet (the cells the bagian 4 formulas read). */
export const VARIANCE_ACTUAL_ROWS: Record<VarianceProduct, ActualRows> = {
  FCC: {
    sheet: "FCC", kg: "B30", bbColumn: "C",
    materials: [["cassava_peel", 41], ["cassava_flesh", 42], ["olein", 46], ["cng", 47], ["ammonium", 49], ["hdpe_003", 50], ["hdpe_005", 51], ["hdpe_007", 52], ["carton", 53]],
    other: 54, peeling: 58, pools: [["pool_a", 59], ["pool_b", 60], ["pool_c", 61], ["pool_d", 62], ["pool_e", 63]],
  },
  UU: {
    sheet: "UU", kg: "B32", bbColumn: "D",
    materials: [["ubi_ungu", 43], ["olein", 46], ["cng", 47], ["ammonium", 49], ["hdpe_003", 50], ["hdpe_006", 51], ["hdpe_007", 52], ["carton", 53]],
    other: 54, peeling: 58, pools: [["pool_a", 59], ["pool_b", 60], ["pool_c", 61], ["pool_d", 62], ["pool_e", 63]],
  },
  UO: {
    sheet: "UO", kg: "B28", bbColumn: "E",
    materials: [["ubi_orange", 39], ["olein", 42], ["cng", 43], ["ammonium", 45], ["hdpe_003", 46], ["hdpe_005", 47], ["hdpe_007", 48], ["carton", 49]],
    other: 50, peeling: 54, pools: [["pool_a", 55], ["pool_b", 56], ["pool_c", 57], ["pool_d", 58], ["pool_e", 59]],
  },
};

/** Budget-method allocation rows of BIAYA BERSAMA bagian 6b per pool. */
const BB_METHOD_ROW: Record<VariancePool, number> = { pool_a: 125, pool_b: 127, pool_c: 128, pool_d: 129, pool_e: 130 };

export function varianceActualFromWp(cells: CellIndex, product: VarianceProduct): VarianceActual {
  const w = wpReader(cells);
  const a = VARIANCE_ACTUAL_ROWS[product];
  const s = a.sheet;
  const materials: ActualMaterial[] = a.materials.map(([component, r]) => ({ component, qty: w.n0(`${s}!B${r}`), price: w.n0(`${s}!D${r}`), value: w.n0(`${s}!E${r}`) }));
  materials.push({ component: "other", qty: null, price: null, value: w.n0(`${s}!E${a.other}`) });
  materials.push({ component: "peeling", qty: w.n0(`${s}!B${a.peeling}`), price: w.n0(`${s}!D${a.peeling}`), value: w.n0(`${s}!E${a.peeling}`) });
  const pools: ActualPool[] = a.pools.map(([component, r]) => ({
    component, allocated: w.n(`${s}!E${r}`), budgetMethodAllocated: w.n(`BIAYA BERSAMA!${a.bbColumn}${BB_METHOD_ROW[component]}`),
  }));
  return { product, kgInput: w.n(`${s}!${a.kg}`), materials, pools, refs: { kgAct: `${s}!${a.kg}` } };
}

/** Pool fixed share of the month (pool_month fixed ÷ total) — default of the BP flex budget (decision V-02). */
export function poolFixedShareFromWp(cells: CellIndex): Record<VariancePool, Decimal> {
  const w = wpReader(cells);
  const share = (r: number) => {
    const t = D(w.n(`BIAYA BERSAMA!C${r}`));
    return t.isZero() ? D(0) : D(w.n(`BIAYA BERSAMA!D${r}`)).div(t);
  };
  return { pool_a: share(81), pool_b: share(83), pool_c: share(84), pool_d: share(85), pool_e: share(86) };
}

// ---------------------------------------------------------------------------------------------------------------
// Bridge (B4)
// ---------------------------------------------------------------------------------------------------------------

/** BRIDGE GP column D (current month, Rp juta) → BridgeMonthInputs. */
export function bridgeCurrentFromWp(cells: CellIndex): BridgeMonthInputs {
  const w = wpReader(cells);
  const out: Record<string, unknown> = {};
  const refs: Record<string, string> = {};
  for (let r = 7; r <= 77; r++) {
    const code = w.s(`BRIDGE GP!A${r}`) as BridgeInputCode;
    out[code] = w.n(`BRIDGE GP!D${r}`);
    refs[code] = `BRIDGE GP!D${r}`;
  }
  out.refs = refs;
  return out as unknown as BridgeMonthInputs;
}

/** fixtures/month-2026-08/bridge_input.json (WP Agu26_6 values in BRIDGE GP column C) → BridgeMonthInputs. */
export function bridgePriorFromFixture(json: { inputs: { code: string; aug: string; row: number }[] }): BridgeMonthInputs {
  const out: Record<string, unknown> = {};
  const refs: Record<string, string> = {};
  for (const i of json.inputs) {
    out[i.code] = i.aug;
    refs[i.code] = `BRIDGE GP!C${i.row}`;
  }
  out.refs = refs;
  return out as unknown as BridgeMonthInputs;
}

/** Fase 2/3 sources of the current month for `bridgeMonthInputs` (Rp), read from the WP product and pool sheets. */
export function bridgeSourcesFromWp(cells: CellIndex, recon: { steps: { key: string; amount: Decimal }[]; hppCardTotal: Decimal; hppGl: Decimal }, oleinHeldDelta: Num): BridgeSources {
  const w = wpReader(cells);
  const pool = (r: number, alloc: number) => ({
    total: w.n(`BIAYA BERSAMA!C${r}`), fixed: w.n(`BIAYA BERSAMA!D${r}`),
    allocated: { FCC: w.n(`BIAYA BERSAMA!C${alloc}`), UU: w.n(`BIAYA BERSAMA!D${alloc}`), UO: w.n(`BIAYA BERSAMA!E${alloc}`), LAIN: w.n(`BIAYA BERSAMA!F${alloc}`) },
  });
  const step = (k: string) => recon.steps.find((s) => s.key === k)!.amount;
  const s8 = (...rows: number[]) => sum(rows.map((r) => D(w.n(`BIAYA BERSAMA!C${r}`))));
  return {
    revenue: { FCC: w.n("FCC!C211"), UU: w.n("UU!C207"), UO: w.n("UO!C203"), LAIN: w.n("REKON & KONTROL!C74") },
    qtySold: { FCC: D(w.n("FCC!C203")).plus(D(w.n("FCC!C208"))), UU: w.n("UU!C203"), UO: w.n("UO!C199") },
    kgProduced: { FCC: w.n("FCC!B30"), UU: w.n("UU!B32"), UO: w.n("UO!B28"), LAIN: w.n("LAIN-LAIN!C43") },
    materialExternal: { FCC: w.n("FCC!E56"), UU: w.n("UU!G218"), UO: w.n("UO!G214"), LAIN: w.n("LAIN-LAIN!D68") },
    fccMaterial: {
      cassava: D(w.n("FCC!E41")).plus(D(w.n("FCC!E42"))), ongkir: w.n("FCC!E43"), olein: w.n("FCC!E46"), cng: w.n("FCC!E47"), other: w.n("FCC!E55"),
    },
    pools: { A: pool(81, 115), KUPAS: pool(82, 116), B: pool(83, 117), C: pool(84, 118), D: pool(85, 119), E: pool(86, 120) },
    hppCard: recon.hppCardTotal, hppGl: recon.hppGl,
    reconSteps: {
      materialVariance: step("material_variance"), invIncreaseWp: step("inv_increase_wp"), invIncreaseGl: step("inv_increase_gl"),
      kw2Nrv: step("kw2_nrv"), section8: step("section8"), idlePeriod: step("idle_period"),
    },
    oleinHeldDelta,
    section8ByTag: { reklasOpex: s8(144, 145, 146, 147), thrSwap: s8(148, 149), taliAsih: s8(150, 151), ongkir: s8(152, 153), pisau: s8(154, 155) },
  };
}

/** Code → Sep-26 cell of BRIDGE GP column D (for golden targets of the assembly). */
export function bridgeCurrentRefs(cells: CellIndex): Record<string, string> {
  const w = wpReader(cells);
  const out: Record<string, string> = {};
  for (let r = 7; r <= 77; r++) out[w.s(`BRIDGE GP!A${r}`) ?? ""] = `BRIDGE GP!D${r}`;
  return out;
}

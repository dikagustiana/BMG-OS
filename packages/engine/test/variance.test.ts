/** B4 variance.ts — flex budget vs BP v1 (cek = 0, B42, B43) and rule tests per branch. Golden (WP, empty budget) is in f4-analysis. */
import { describe, expect, it } from "vitest";
import { D, Decimal } from "../src/decimal";
import { readFixtureJson } from "../src/fixtures";
import { runF34 } from "../src/golden-f34";
import {
  BP_V1_MAP, VARIANCE_PRODUCTS, budgetFromBp, budgetLineIndex, othersVariance, productVariance, varianceMonth,
  type BudgetLineInput, type BudgetPoolMapInput, type VarianceActual, type VarianceBudget,
} from "../src/variance";
import { poolFixedShareFromWp, varianceActualFromWp, wpReader } from "../src/wp-f34";

const { f4 } = runF34();
const w = wpReader(f4.cells);
const SEP = "2026-09-01";
const bl = readFixtureJson<{ rows: { driver_code_base: string; values: Record<string, string> }[] }>("budget-v1", "budget_line.json").rows;
const lines: BudgetLineInput[] = bl.flatMap((r) => Object.entries(r.values).map(([m, v]) => ({ driver_code: `${r.driver_code_base}|${m}`, value: v })));
const poolMap = readFixtureJson<{ rows: BudgetPoolMapInput[] }>("budget-v1", "budget_pool_map.json").rows;
const line = (base: string, month = "2026-09") => D(bl.find((r) => r.driver_code_base === base)!.values[month]);

describe("variance vs BP v1, Sep-26", () => {
  const v = f4.varianceBp;

  it("cek = 0 on every row for FCC, UU and UO (|cek| < Rp 0,000001 per kg)", () => {
    for (const p of VARIANCE_PRODUCTS) {
      expect(v.products[p].maxCheck.lt("0.000001"), p).toBe(true);
      const t = v.products[p].total;
      expect(t.diff.minus(t.price).minus(t.usage).minus(t.volume).minus(t.method).abs().lt("0.000001"), p).toBe(true);
    }
  });

  it("budget per kg = BP COGM per kg; actual per kg = WP bagian 4 total (no ongkir, as in the WP)", () => {
    expect(v.products.FCC.total.budgetPerKg.minus(line("ALL|6.3.1.cogm_per_kg.idr")).abs().lt("0.000001")).toBe(true);
    expect(v.products.FCC.total.actualPerKg.minus(D(w.n("FCC!F133"))).abs().lt("0.0001")).toBe(true);
    // ongkos kirim singkong per kg is the gap between bagian 4 and the card cost per kg
    expect(D(w.n("FCC!F66")).minus(v.products.FCC.total.actualPerKg).minus(D(w.n("FCC!F43"))).abs().lt("0.0001")).toBe(true);
  });

  it("B42 (Σ komponen = biaya produksi BP) and B43 (Σ pool per produk = pool BP) LULUS; no BP code missing", () => {
    expect(v.controls.map((c) => [c.code, c.status])).toEqual([["B42", "LULUS"], ["B43", "LULUS"]]);
    const bud = budgetFromBp(lines, poolMap, SEP, "BP Okt-26 v1", poolFixedShareFromWp(f4.cells));
    expect(bud.missing).toEqual([]);
    expect(bud.poolTotals.pool_a.plus(bud.poolTotals.pool_b).plus(bud.poolTotals.pool_c).plus(bud.poolTotals.pool_d).plus(bud.poolTotals.pool_e)
      .minus(line("ALL|total_pool_biaya_pabrik.idr_mil")).abs().lt("0.01")).toBe(true);
  });

  it("aligned Grup A + B per product = BP product rows Grup A + B (WP BUDGET row 89 check)", () => {
    const bud = budgetFromBp(lines, poolMap, SEP, "BP Okt-26 v1");
    const ab = (c: VarianceBudget) => c.components.filter((x) => x.component === "pool_a" || x.component === "pool_b").reduce((a, x) => a.plus(D(x.amount)), D(0));
    expect(ab(bud.products.FCC).minus(line("ALL|6.2.11.grup_a_tenaga_kerja_langsung.idr_mio").plus(line("ALL|6.2.11.grup_b_tenaga_kerja_tidak_langsung_dan_benefit.idr_mio"))).abs().lt("0.01")).toBe(true);
  });

  it("Lain-lain at total level: actual vs BP total cost of manufacturing", () => {
    const lain = v.rows.find((r) => r.product === "LAIN")!;
    expect(lain.actual_amount!.toFixed(2)).toBe(D(w.n("LAIN-LAIN!G68")).toFixed(2));
    expect(lain.budget_amount!.minus(line("ALL|total_cost_of_manufacturing.idr_mil")).isZero()).toBe(true);
    expect(lain.price).toBeNull();
  });

  it("rows: items, groups and total per product + Lain-lain; budget_version on every row", () => {
    expect(v.rows.filter((r) => r.product === "FCC")).toHaveLength(16 + 7 + 1);
    expect(v.rows.every((r) => r.budget_version === "BP Okt-26 v1")).toBe(true);
    expect(v.rows.find((r) => r.product === "FCC" && r.component === "olein")!.source_ref).toBe("FCC!H113");
  });

  it("WP run (BUDGET sheet empty): B42/B43 BELUM_DIISI, every variance = actual", () => {
    expect(f4.varianceWp.controls.map((c) => c.status)).toEqual(["BELUM_DIISI", "BELUM_DIISI"]);
    for (const p of VARIANCE_PRODUCTS) expect(f4.varianceWp.products[p].total.diff.equals(f4.varianceWp.products[p].total.actualPerKg)).toBe(true);
  });
});

describe("productVariance rules", () => {
  const actual: VarianceActual = {
    product: "FCC", kgInput: 1000,
    materials: [{ component: "cassava_peel", qty: 3000, price: 3, value: 9000 }, { component: "other", qty: null, price: null, value: 500 }],
    pools: [{ component: "pool_b", allocated: 4000, budgetMethodAllocated: 3500 }],
  };
  const budget = (fixedShare: string | null): VarianceBudget => ({
    product: "FCC", version: "T", kg: 800, totalProductionCost: null,
    components: [
      { component: "cassava_peel", qty: 2000, amount: 5000, fixedShare: null },
      { component: "other", qty: null, amount: 400, fixedShare: null },
      { component: "pool_b", qty: null, amount: 2400, fixedShare },
    ],
  });
  const row = (res: ReturnType<typeof productVariance>, c: string) => res.rows.find((r) => r.component === c)!;

  it("material: price = (P_akt − P_bud) × Q/kg_akt; usage = (Q/kg_akt − Q/kg_bud) × P_bud", () => {
    const m = row(productVariance(SEP, actual, budget(null)), "cassava_peel");
    // P_bud = 5000/2000 = 2,5; Q/kg_bud = 2,5; Q/kg_akt = 3; F = 9; G = 6,25
    expect([m.priceBud, m.qtyPerKgBud, m.qtyPerKgAct, m.actualPerKg, m.budgetPerKg].map((x) => x!.toString())).toEqual(["2.5", "2.5", "3", "9", "6.25"]);
    expect(m.price.toString()).toBe("1.5");
    expect(m.usage.toString()).toBe("1.25");
    expect(m.check.isZero()).toBe(true);
  });

  it("other cost: everything is usage", () => {
    const o = row(productVariance(SEP, actual, budget(null)), "other");
    expect(o.diff.toString()).toBe("0");
    expect(o.usage.equals(o.diff) && o.price.isZero()).toBe(true);
  });

  it("pool fully fixed (WP formula): volume = budget/kg_akt − budget/kg_bud; method = (actual − budget method)/kg_akt", () => {
    const p = row(productVariance(SEP, actual, budget("1")), "pool_b");
    expect(p.volume.toString()).toBe(new Decimal(2400).div(1000).minus(new Decimal(2400).div(800)).toString());
    expect(p.method.toString()).toBe("0.5");
    expect(p.price.toString()).toBe(new Decimal(3500 - 2400).div(1000).toString());
    expect(p.check.isZero()).toBe(true);
  });

  it("pool fully variable: no volume variance, spending absorbs the flex", () => {
    const p = row(productVariance(SEP, actual, budget("0")), "pool_b");
    expect(p.volume.isZero()).toBe(true);
    // flex = 2400 × 1000/800 = 3000; price = (3500 − 3000)/1000
    expect(p.price.toString()).toBe("0.5");
    expect(p.check.isZero()).toBe(true);
  });

  it("no budget volume: budget per kg 0 (Excel IF(kg=0,0,…)) and the check still closes", () => {
    const res = productVariance(SEP, actual, { ...budget("0.5"), kg: 0 });
    expect(res.rows.every((r) => r.budgetPerKg.isZero())).toBe(true);
    expect(res.maxCheck.lt("0.0000001")).toBe(true);
  });

  it("no actual volume: per-kg actuals are 0; volume variance carries −budget per kg", () => {
    const res = productVariance(SEP, { ...actual, kgInput: 0 }, budget("1"));
    const p = row(res, "pool_b");
    expect(p.actualPerKg.isZero() && p.volume.equals(p.budgetPerKg.neg())).toBe(true);
  });

  it("othersVariance: per kg 0 when no budget volume", () => {
    const o = othersVariance({ actualKg: 100, actualCost: 2000, budgetKg: 0, budgetCost: 500, version: "T" });
    expect([o.actualPerKg.toString(), o.budgetPerKg.toString(), o.diffAmount.toString()]).toEqual(["20", "0", "1500"]);
  });
});

describe("BP mapping", () => {
  it("budgetLineIndex keeps only the month; blank values are null", () => {
    const idx = budgetLineIndex([{ driver_code: "A|x|2026-09", value: "5" }, { driver_code: "A|x|2026-10", value: "6" }, { driver_code: "A|y|2026-09", value: "" }], SEP);
    expect(idx.get("A|x")!.toString()).toBe("5");
    expect(idx.get("A|y")).toBeNull();
    expect(idx.has("A|x|2026-10")).toBe(false);
  });

  it("every mapped driver code exists in BP v1 for Sep-26 … Des-27", () => {
    const codes = new Set(bl.map((r) => r.driver_code_base));
    for (const p of VARIANCE_PRODUCTS) {
      const m = BP_V1_MAP[p];
      for (const c of [m.kg, m.total, m.driverC, ...Object.values(m.components).flatMap((x) => [x!.amount, ...(x!.qty ? [x!.qty] : [])])]) expect(codes.has(c), c).toBe(true);
    }
  });

  it("a missing BP line is reported and fails B42", () => {
    const drop = BP_V1_MAP.FCC.components.olein!.amount;
    const bud = budgetFromBp(lines.filter((l) => !l.driver_code.startsWith(`${drop}|`)), poolMap, SEP, "T");
    expect(bud.missing).toContain(drop);
    const actual = { FCC: varianceActualFromWp(f4.cells, "FCC"), UU: varianceActualFromWp(f4.cells, "UU"), UO: varianceActualFromWp(f4.cells, "UO") };
    const v = varianceMonth({ month: SEP, actual, budget: bud, others: { actualKg: 1, actualCost: 1 } });
    expect(v.controls.find((c) => c.code === "B42")!.status).toBe("GAGAL");
  });

  it("budget_pool_map fixed_pct, when set, overrides the pool_month default", () => {
    const map = poolMap.map((r) => (r.pool === "C" && r.bp_row_code.startsWith("4.3_") ? { ...r, fixed_pct: "0.25" } : r));
    const bud = budgetFromBp(lines, map, SEP, "T", { pool_c: "0.9" });
    expect(D(bud.products.FCC.components.find((c) => c.component === "pool_c")!.fixedShare!).toString()).toBe("0.25");
  });
});

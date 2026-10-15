/** B4 reasonableness.ts — CEK KEWAJARAN bagian 1–2 statuses and texts vs WP, kpi_series, B33, rule tests. */
import { describe, expect, it } from "vitest";
import { D } from "../src/decimal";
import { checkTargets } from "../src/golden";
import { f4Targets, runF34 } from "../src/golden-f34";
import {
  MOM_KPIS, TREND_KPIS, kpiSeries, monthOverMonth, statusText, trendKpis, usageMonthsFromHistory, usageRatioControl,
  type KpiHistoryMonth, type MomKpiCode,
} from "../src/reasonableness";
import { kpiHistoryFromWp, wpReader } from "../src/wp-f34";

const { f4 } = runF34();
const w = wpReader(f4.cells);
const history = kpiHistoryFromWp(f4.cells);

describe("golden Sep-26: CEK KEWAJARAN", () => {
  it("every number of bagian 1–2, FCC/UU/UO bagian 4, RINGKASAN bagian 2 and BRIDGE GP equals its WP cell", () => {
    const bad = checkTargets(f4.cells, f4Targets(f4)).filter((x) => !x.ok).map((x) => `${x.target.id} ${x.target.sheet}!${x.target.cell}: ${x.actual} vs ${x.target.expected}`);
    expect(bad).toEqual([]);
  });

  it("bagian 1 has 15 KPIs in the sheet (PRD v2 says 14); statuses and notes as in column M and N", () => {
    expect(f4.trend).toHaveLength(15);
    for (const k of f4.trend) {
      const row = TREND_KPIS.find((d) => d.code === k.code)!.wpRow;
      expect(w.s(`CEK KEWAJARAN!A${row}`)).toBe(k.label);
      expect(statusText(k.status), k.code).toBe(w.s(`CEK KEWAJARAN!M${row}`));
      expect(k.note, k.code).toBe(w.s(`CEK KEWAJARAN!N${row}`));
    }
    expect(f4.trend.filter((k) => k.status === "DI_LUAR_RENTANG").map((k) => k.code)).toEqual([
      "input_ton", "cassava_peel_price", "cassava_flesh_price", "cassava_per_kg_input", "olein_price", "carton_per_ton", "old_card_material_per_kg_input", "old_card_cost_per_good_kg",
    ]);
  });

  it("bagian 2: 6 CEK (konversi FCC, Grup B, D, E, material lain, pool variabel) with the WP explanation carried; statuses = column F", () => {
    for (const m of f4.mom) {
      const row = MOM_KPIS.find((d) => d.code === m.code)!.wpRow;
      expect(m.status, m.code).toBe(w.s(`CEK KEWAJARAN!F${row}`));
      expect(m.explanation ?? null, m.code).toBe(w.s(`CEK KEWAJARAN!G${row}`));
    }
    const cek = f4.mom.filter((m) => m.status === "CEK");
    expect(cek.map((m) => m.code)).toEqual(["fcc_conversion_per_kg", "fcc_pool_b_per_kg", "fcc_pool_d_per_kg", "fcc_pool_e_per_kg", "fcc_other_material_per_kg", "pool_variable_jt"]);
    expect(cek.every((m) => !m.explanationMissing)).toBe(true);
  });

  it("kpi_series: 9 months × 15 KPIs; only Sep-26 has a full 8-month window (status = bagian 1)", () => {
    expect(f4.series).toHaveLength(9 * 15);
    const withStatus = f4.series.filter((s) => s.status !== null);
    expect(new Set(withStatus.map((s) => s.month))).toEqual(new Set(["2026-09-01"]));
    for (const s of withStatus) expect(s.status).toBe(f4.trend.find((t) => t.code === s.kpi_code)!.status);
    const jan = f4.series.find((s) => s.month === "2026-01-01" && s.kpi_code === "input_ton")!;
    expect(jan.source_ref).toBe("CEK KEWAJARAN!B6");
    expect(jan.inputs.inputKg.ref).toBe("CEK KEWAJARAN!B42");
    expect(f4.series.find((s) => s.month === "2026-09-01" && s.kpi_code === "old_card_cost_per_good_kg")!.note).toBe(w.s("CEK KEWAJARAN!N20"));
  });

  it("reasonableness rows: 15 trend + 13 month-over-month; CEK rows require an explanation", () => {
    expect(f4.reasonableness.filter((r) => r.part === "trend")).toHaveLength(15);
    expect(f4.reasonableness.filter((r) => r.part === "mom")).toHaveLength(13);
    expect(f4.reasonableness.filter((r) => r.explanation_required).map((r) => r.kpi)).toHaveLength(6);
    const conv = f4.reasonableness.find((r) => r.kpi === "fcc_conversion_per_kg")!;
    expect(conv.source_ref).toBe("CEK KEWAJARAN!F27");
    expect(conv.compare_value!.toString()).toBe(w.n("CEK KEWAJARAN!B27"));
  });
});

describe("trendKpis rules", () => {
  const sep = history.find((h) => h.month === "2026-09-01")!;
  const minus = (h: KpiHistoryMonth, months: number): KpiHistoryMonth => ({ ...h, month: `2026-${String(9 - months).padStart(2, "0")}-01` });

  it("no range without all 8 preceding months", () => {
    const t = trendKpis(history.filter((h) => h.month !== "2026-03-01"), "2026-09-01");
    expect(t.every((k) => k.min === null && k.max === null && k.status === null)).toBe(true);
  });

  it("a value equal to the minimum is DALAM RENTANG (inclusive bounds); above the max is DI LUAR", () => {
    const flat = Array.from({ length: 8 }, (_, i) => minus(sep, 8 - i));
    expect(trendKpis([...flat, sep], "2026-09-01").every((k) => k.status === "DALAM_RENTANG")).toBe(true);
    const higher = { ...sep, inputKg: D(sep.inputKg).plus(1) };
    expect(trendKpis([...flat, higher], "2026-09-01").find((k) => k.code === "input_ton")!.status).toBe("DI_LUAR_RENTANG");
  });

  it("zero denominators give 0 like Excel IF(x=0,0,…); kartu lama per kg barang baik 0 when no good kg", () => {
    const z: KpiHistoryMonth = { ...sep, inputKg: 0, cassavaFleshKg: 0, kw2Kg: 0, wasteKg: 0 };
    const vals = Object.fromEntries(TREND_KPIS.map((k) => [k.code, k.value(z)]));
    expect(vals.premium_ratio.isZero() && vals.carton_per_ton.isZero() && vals.cassava_flesh_price.isZero() && vals.old_card_cost_per_good_kg.isZero()).toBe(true);
  });

  it("duplicate or missing months are rejected", () => {
    expect(() => trendKpis([...history, sep], "2026-09-01")).toThrow(/ganda/);
    expect(() => trendKpis(history, "2026-10-01")).toThrow(/tidak ada/);
  });

  it("kpiSeries works month by month (Oct-26 judged against Feb–Sep)", () => {
    const okt = { ...sep, month: "2026-10-01" };
    const s = kpiSeries([...history, okt]).filter((x) => x.month === "2026-10-01");
    expect(s).toHaveLength(15);
    expect(s.every((x) => x.status !== null)).toBe(true);
    expect(s.find((x) => x.kpi_code === "input_ton")!.source_ref).toBeNull();
  });
});

describe("monthOverMonth rules", () => {
  const cur = Object.fromEntries(MOM_KPIS.map((k) => [k.code, "110"])) as Record<MomKpiCode, string>;

  it("|Δ| > 10% → CEK; exactly 10% → WAJAR; prior 0 → Δ 0 (WAJAR); no prior → no status", () => {
    const prior: Partial<Record<MomKpiCode, string | null>> = { fcc_cost_per_kg: "100", fcc_material_per_kg: "99.9", fcc_conversion_per_kg: "0", fcc_pool_b_per_kg: null };
    const res = Object.fromEntries(monthOverMonth(cur, prior).map((m) => [m.code, m]));
    expect(res.fcc_cost_per_kg.status).toBe("WAJAR");
    expect(res.fcc_material_per_kg.status).toBe("CEK");
    expect(res.fcc_conversion_per_kg.deltaPct!.isZero() && res.fcc_conversion_per_kg.status === "WAJAR").toBe(true);
    expect(res.fcc_pool_b_per_kg.status).toBeNull();
  });

  it("CEK without explanation is flagged; a per-KPI threshold overrides 10%", () => {
    const res = monthOverMonth(cur, { fcc_cost_per_kg: "100" }, { thresholds: { fcc_cost_per_kg: "0.05" } });
    const m = res.find((x) => x.code === "fcc_cost_per_kg")!;
    expect(m.status).toBe("CEK");
    expect(m.explanationMissing).toBe(true);
    const ok = monthOverMonth(cur, { fcc_cost_per_kg: "100" }, { thresholds: { fcc_cost_per_kg: "0.05" }, explanations: { fcc_cost_per_kg: "Volume turun" } });
    expect(ok.find((x) => x.code === "fcc_cost_per_kg")!.explanationMissing).toBe(false);
  });
});

describe("B33 usage ratio vs 3 months", () => {
  it("Sep-26: karton far below the Jun–Aug average → PERIKSA (D5); olein within ±15%; HDPE has no 3-month data", () => {
    const { control, items } = usageRatioControl(usageMonthsFromHistory(history), "2026-09-01");
    expect(control.status).toBe("PERIKSA");
    const it = Object.fromEntries(items.map((i) => [i.item, i]));
    expect(it.carton.status).toBe("PERIKSA");
    expect(it.olein.status).toBe("LULUS");
    expect(it.hdpe.status).toBe("BELUM_DIISI");
    const ratio = (c: string) => D(w.n(`CEK KEWAJARAN!${c}17`));
    const avg = ratio("G").plus(ratio("H")).plus(ratio("I")).div(3);
    expect(it.carton.deviation!.minus(ratio("J").div(avg).minus(1)).abs().lt("0.0000001")).toBe(true);
    expect(it.carton.months).toEqual(["2026-06-01", "2026-07-01", "2026-08-01"]);
  });

  it("LULUS when every item is within the band; BELUM_DIISI when only data is missing", () => {
    const flat = ["2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01"].map((month) => ({ month, inputKg: 1000, carton: 10, olein: 250, hdpe: 5 }));
    expect(usageRatioControl(flat, "2026-09-01").control.status).toBe("LULUS");
    const noHdpe = flat.map((m, i) => (i === 0 ? { ...m, hdpe: null } : m));
    expect(usageRatioControl(noHdpe, "2026-09-01").control.status).toBe("BELUM_DIISI");
  });
});

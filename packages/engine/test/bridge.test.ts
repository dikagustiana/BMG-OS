/** B4 bridge.ts — BRIDGE GP Agu → Sep: 17 bars, B31/B32, display grouping, input assembly, rule tests. Golden numbers are in f4-analysis. */
import { describe, expect, it } from "vitest";
import { D } from "../src/decimal";
import { readFixtureJson } from "../src/fixtures";
import { runF34 } from "../src/golden-f34";
import {
  BRIDGE_INPUT_CODES, bridgeDisplayBars, bridgeMonthRows, bridgeWaterfallWp, computeBridge, type BridgeInputs, type BridgeMonthInputs,
} from "../src/bridge";
import { bridgeCurrentFromWp, bridgePriorFromFixture, wpReader } from "../src/wp-f34";

const { f4 } = runF34();
const b = f4.bridge;
const w = wpReader(f4.cells);
const prior = bridgePriorFromFixture(readFixtureJson("month-2026-08", "bridge_input.json"));
const current = bridgeCurrentFromWp(f4.cells);
const inputs = (): BridgeInputs => ({
  month: "2026-09-01", prior: { ...prior }, current: { ...current },
  lk: { revenue: w.n("RINGKASAN!D40"), cogs: w.n("RINGKASAN!D43") }, glRevenue: w.n("RINGKASAN!C40"),
});

describe("BRIDGE GP Agu-26 → Sep-26", () => {
  it("17 bars, each within 1e-9 pp of C118:C134; start C117 and end C135", () => {
    expect(b.bars).toHaveLength(17);
    b.bars.forEach((bar, i) => expect(bar.pp.minus(D(w.n(`BRIDGE GP!C${118 + i}`))).abs().lt("0.000000001"), bar.code).toBe(true));
    expect(b.start.minus(D(w.n("BRIDGE GP!C117"))).abs().lt("0.000000001")).toBe(true);
    expect(b.end.minus(D(w.n("BRIDGE GP!C135"))).abs().lt("0.000000001")).toBe(true);
  });

  it("Σ bars = end − start; Σ bars = Δ margin within 1e-6 pp (B31); B32 komponen = HPP GL, tetap = Σ pool tetap", () => {
    expect(b.bars.reduce((a, x) => a.plus(x.pp), D(0)).minus(b.end.minus(b.start)).abs().lt("1e-30")).toBe(true);
    expect(b.controls.map((c) => [c.code, c.status])).toEqual([["B31", "LULUS"], ["B32", "LULUS"]]);
    for (const c of b.checks) expect(c.status, c.key).toBe(w.s(c.source_ref.replace("!C", "!D")));
    expect(w.s("BRIDGE GP!C3")).toBe("LULUS");
  });

  it("direksi view: b2 + b12 merged into one bar 'Volume, mix, dan persediaan' (= WP B163), 16 bars between the two margins", () => {
    const d = bridgeDisplayBars(b);
    expect(d.filter((x) => x.kind === "bar")).toHaveLength(16);
    const merged = d.find((x) => x.code === "b2_b12")!;
    expect(merged.label).toBe("Volume, mix, dan persediaan");
    expect(merged.components.map((c) => c.code)).toEqual(["b2", "b12"]);
    expect(merged.pp.minus(D(w.n("BRIDGE GP!B163"))).abs().lt("0.000000001")).toBe(true);
    expect(d[0].label).toBe("Margin GL Agustus 2026");
    expect(d.at(-1)!.cumulative.equals(b.end)).toBe(true);
    expect(d.at(-2)!.cumulative.minus(b.end).abs().lt("0.000000001")).toBe(true);
  });

  it("WP waterfall (bagian 5): 8 grouped bars, cumulative = column G", () => {
    const wf = bridgeWaterfallWp(b);
    expect(wf).toHaveLength(10);
    wf.forEach((x, i) => expect(x.cumulative.minus(D(w.n(`BRIDGE GP!G${161 + i}`))).abs().lt("0.000000001"), x.code).toBe(true));
  });

  it("current month inputs assembled from Fase 2 / recon outputs = BRIDGE GP column D (71 codes)", () => {
    expect(BRIDGE_INPUT_CODES).toHaveLength(71);
    for (const code of BRIDGE_INPUT_CODES) expect(D(f4.bridgeAssembled[code]).minus(D(current[code])).abs().lt("0.000000001"), code).toBe(true);
  });

  it("bridge_month rows: 19 bar rows (start, 17, end), 6 groups, 18 display, 10 WP waterfall", () => {
    const rows = bridgeMonthRows(b);
    const count = (v: string) => rows.filter((r) => r.view === v).length;
    expect([count("bar"), count("group"), count("display"), count("wp_waterfall")]).toEqual([19, 6, 18, 10]);
    expect(rows.every((r) => r.compare_month === "2026-08-01" && r.rule_id === "bridge.computeBridge@v1")).toBe(true);
    expect(rows.find((r) => r.view === "bar" && r.bar_code === "b5")!.source_ref).toBe("BRIDGE GP!C122");
  });
});

describe("computeBridge rules", () => {
  it("B32 GAGAL when the current HPP GL no longer equals the components; B31 GAGAL when LK margin differs", () => {
    const i = inputs();
    i.current = { ...i.current, HPP_GL: D(i.current.HPP_GL).plus("0.01") } as BridgeMonthInputs;
    expect(computeBridge(i).controls.find((c) => c.code === "B32")!.status).toBe("GAGAL");
    const j = inputs();
    j.lk = { revenue: j.lk.revenue, cogs: D(j.lk.cogs).plus(1) };
    expect(computeBridge(j).controls.find((c) => c.code === "B31")!.status).toBe("GAGAL");
  });

  it("no production last month: volume/mix uses this month's variable cost, the rate bar uses 0 (Excel IF(P=0,…))", () => {
    const i = inputs();
    i.prior = { ...i.prior, P_U: 0 } as BridgeMonthInputs;
    const r = computeBridge(i);
    const vU = r.currentComponents.variable.U;
    const b9base = computeBridge(inputs()).bars.find((x) => x.code === "b9")!.pp;
    // with P_U(A) = 0 the UU part of b9 is −V_U(S)/Ra; the rest of b9 is unchanged
    const partUU = vU.div(r.revenueAtPriorPrice).times(100).neg();
    const prevPartUU = vU.minus(b.priorComponents.variable.U.div(D(prior.P_U)).times(D(current.P_U))).div(b.revenueAtPriorPrice).times(100).neg();
    expect(r.bars.find((x) => x.code === "b9")!.pp.minus(b9base.minus(prevPartUU).plus(partUU)).abs().lt("0.000000001")).toBe(true);
    expect(r.end.minus(r.start).minus(r.bars.reduce((a, x) => a.plus(x.pp), D(0))).abs().lt("1e-30")).toBe(true);
  });

  it("the bridge is unit-free: scaling all money of both months by 10^6 leaves every bar unchanged", () => {
    const scale = (m: BridgeMonthInputs): BridgeMonthInputs => {
      const out: Record<string, unknown> = {};
      for (const k of BRIDGE_INPUT_CODES) out[k] = k.startsWith("Q_") || k.startsWith("P_") ? m[k] : D(m[k]).times(1e6);
      return out as unknown as BridgeMonthInputs;
    };
    const i = inputs();
    const r = computeBridge({ ...i, prior: scale(i.prior), current: scale(i.current), lk: { revenue: D(i.lk.revenue).times(1e6), cogs: D(i.lk.cogs).times(1e6) }, glRevenue: D(i.glRevenue).times(1e6) });
    r.bars.forEach((x, k) => expect(x.pp.minus(b.bars[k].pp).abs().lt("1e-20"), x.code).toBe(true));
  });
});

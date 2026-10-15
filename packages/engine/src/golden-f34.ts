/**
 * Golden suites and snapshot runs of Fase 3–4 (B3 recon, B4 kewajaran / varian / bridge) on the golden month.
 * Node only (reads fixtures). Inputs come from WP cells through wp-f34.ts; each target compares an engine output with
 * the WP cell that holds the same number (tolerance ±Rp 1 for money, ±0,0001 for pp / ratios / Rp per kg, ±0,01 kg).
 */
import { D, Decimal, type Num } from "./decimal";
import { checkTargets, type CellIndex, type GoldenResult, type GoldenTarget } from "./golden";
import { loadCells, readFixtureJson } from "./fixtures";
import { reconMonth, type ReconMonthResult } from "./recon";
import {
  MOM_KPIS, TREND_KPIS, kpiSeries, monthOverMonth, momValues, reasonablenessRows, trendKpis, usageMonthsFromHistory, usageRatioControl,
  type KpiSeriesRow, type MomKpiResult, type ReasonablenessRow, type TrendKpiResult,
} from "./reasonableness";
import { VARIANCE_PRODUCTS, budgetFromBp, varianceMonth, type BudgetLineInput, type BudgetPoolMapInput, type VarianceMonthResult } from "./variance";
import {
  BRIDGE_INPUT_CODES, bridgeDisplayBars, bridgeMonthInputs, bridgeMonthRows, bridgeWaterfallWp, computeBridge,
  type BridgeComponents, type BridgeMonthInputs, type BridgeResult,
} from "./bridge";
import {
  GOLDEN_MONTH, bridgeCurrentFromWp, bridgeCurrentRefs, bridgePriorFromFixture, bridgeSourcesFromWp, kpiHistoryFromWp, momPriorFromWp,
  momSourceFromWp, poolFixedShareFromWp, reconInputsFromWp, trendNotesFromWp, varianceActualFromWp, wpReader, type MaterialMasterRow,
} from "./wp-f34";
import type { TracedControl } from "./mart-row";

export const F34_FIXTURE = "month-2026-09";
const MILLION = new Decimal(1_000_000);
const TOL = { rp: "1", jt: "0.000001", kg: "0.01", ratio: "0.0001", pp: "0.0001", count: "0" } as const;

// ---------------------------------------------------------------------------------------------------------------
// Runs (shared by golden suites, snapshot modules and tests)
// ---------------------------------------------------------------------------------------------------------------

export interface F3Run {
  cells: CellIndex;
  recon: ReconMonthResult;
}

export interface F4Run {
  cells: CellIndex;
  trend: TrendKpiResult[];
  series: KpiSeriesRow[];
  mom: MomKpiResult[];
  reasonableness: ReasonablenessRow[];
  b33: TracedControl;
  /** WP budget (BUDGET sheet empty) */
  varianceWp: VarianceMonthResult;
  /** BP v1 */
  varianceBp: VarianceMonthResult;
  bridge: BridgeResult;
  /** current month bridge inputs assembled from the Fase 2 / recon sources */
  bridgeAssembled: BridgeMonthInputs;
}

const cache = new Map<string, { f3: F3Run; f4: F4Run }>();

export function runF34(fixture = F34_FIXTURE): { f3: F3Run; f4: F4Run } {
  const hit = cache.get(fixture);
  if (hit) return hit;
  const cells = loadCells(fixture);
  const w = wpReader(cells);
  const materials = readFixtureJson<{ rows: MaterialMasterRow[] }>("master", "material_item.json").rows;
  const recon = reconMonth(reconInputsFromWp(cells, materials));

  const history = kpiHistoryFromWp(cells);
  const notes = trendNotesFromWp(cells);
  const trend = trendKpis(history, GOLDEN_MONTH, notes);
  const series = kpiSeries(history, { [GOLDEN_MONTH]: notes });
  const pr = momPriorFromWp(cells);
  const mom = monthOverMonth(momValues(momSourceFromWp(cells)), pr.prior, { thresholds: pr.thresholds, explanations: pr.explanations });
  const reasonableness = reasonablenessRows(GOLDEN_MONTH, trend, mom);
  const b33 = usageRatioControl(usageMonthsFromHistory(history), GOLDEN_MONTH).control;

  const actual = { FCC: varianceActualFromWp(cells, "FCC"), UU: varianceActualFromWp(cells, "UU"), UO: varianceActualFromWp(cells, "UO") };
  const others = { actualKg: w.n("LAIN-LAIN!C43"), actualCost: w.n("LAIN-LAIN!G68") };
  const varianceWp = varianceMonth({ month: GOLDEN_MONTH, actual, budget: null, others });
  const bl = readFixtureJson<{ budget_version: { name: string }; rows: { driver_code_base: string; values: Record<string, string> }[] }>("budget-v1", "budget_line.json");
  const lines: BudgetLineInput[] = bl.rows.flatMap((r) => Object.entries(r.values).map(([m, v]) => ({ driver_code: `${r.driver_code_base}|${m}`, value: v })));
  const poolMap = readFixtureJson<{ rows: BudgetPoolMapInput[] }>("budget-v1", "budget_pool_map.json").rows;
  const varianceBp = varianceMonth({ month: GOLDEN_MONTH, actual, budget: budgetFromBp(lines, poolMap, GOLDEN_MONTH, bl.budget_version.name, poolFixedShareFromWp(cells)), others });

  const prior = bridgePriorFromFixture(readFixtureJson("month-2026-08", "bridge_input.json"));
  const bridge = computeBridge({
    month: GOLDEN_MONTH, prior, current: bridgeCurrentFromWp(cells),
    lk: { revenue: w.n("RINGKASAN!D40"), cogs: w.n("RINGKASAN!D43") }, glRevenue: w.n("RINGKASAN!C40"),
  });
  const bridgeAssembled = bridgeMonthInputs(bridgeSourcesFromWp(cells, recon.hpp, recon.inventory.table.k2.wipDelta));

  const out = { f3: { cells, recon }, f4: { cells, trend, series, mom, reasonableness, b33, varianceWp, varianceBp, bridge, bridgeAssembled } };
  cache.set(fixture, out);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------------------------------------------

class Targets {
  list: GoldenTarget[] = [];
  constructor(private source: string) {}
  /** value in engine units; `scale` divides it into the WP unit (10^6 for Rp juta cells) */
  add(id: string, label: string, ref: string, value: Num | Decimal | null, tolerance: string, scale: Decimal | number = 1) {
    if (value === null) return;
    const i = ref.lastIndexOf("!");
    this.list.push({ id, label, sheet: ref.slice(0, i), cell: ref.slice(i + 1), expected: D(value).div(D(scale)).toFixed(), tolerance, source: this.source });
  }
}

export function f3Targets(run: F3Run): GoldenTarget[] {
  const t = new Targets("engine recon.ts (Fase 3)");
  const r = run.recon;
  const w = wpReader(run.cells);
  // REKON & KONTROL bagian 3 — HPP waterfall (Rp juta)
  for (const s of r.hpp.steps) t.add(`B3.hpp.${s.key}`, s.label, s.source_ref, s.amount, TOL.jt, MILLION);
  t.add("B3.hpp.inventory_gap", "Selisih kenaikan persediaan kartu baru vs GL", "REKON & KONTROL!C47", r.hpp.inventoryGap, TOL.jt, MILLION);
  // bagian 2 — material variance per line / account
  t.add("B3.mat.card_total", "Total material kartu", "REKON & KONTROL!B28", r.hpp.materialCardTotal, TOL.jt, MILLION);
  t.add("B3.mat.variance", "Varian material GL − kartu", "REKON & KONTROL!B30", r.hpp.materialVariance, TOL.jt, MILLION);
  const lineRow = { FCC: 22, UU: 23, UO: 24, LAIN_SINGKONG: 25, LAIN_UBI_UNGU: 26, LAIN_UBI_ORANGE: 27 } as const;
  for (const l of r.hpp.materialVarianceByLine) {
    t.add(`B3.mat.share.${l.line}`, `Porsi material ${l.line}`, `REKON & KONTROL!C${lineRow[l.line]}`, l.share, TOL.ratio);
    t.add(`B3.mat.var.${l.line}`, `Varian material ${l.line}`, `REKON & KONTROL!D${lineRow[l.line]}`, l.variance, TOL.jt, MILLION);
  }
  t.add("B3.mat.var.total", "Σ varian material per lini", "REKON & KONTROL!D28", r.hpp.materialVarianceByLine.reduce((a, b) => a.plus(b.variance), D(0)), TOL.jt, MILLION);
  (["5101-301", "5101-302", "5101-303"] as const).forEach((a, i) => t.add(`B3.mat.acc.${a}`, `Varian akun ${a}`, `REKON & KONTROL!D${31 + i}`, r.hpp.materialVarianceByAccount[a], TOL.jt, MILLION));
  // bagian 4 — KW 2 flow
  r.hpp.kw2Flow.forEach((k, i) => {
    t.add(`B3.kw2.${k.key}.kg`, `${k.label} (kg)`, `REKON & KONTROL!C${52 + i}`, k.kg, TOL.kg);
    t.add(`B3.kw2.${k.key}.rp`, `${k.label} (Rp juta)`, `REKON & KONTROL!D${52 + i}`, k.amount, TOL.jt, MILLION);
  });
  // bagian 5 — controls B17–B20 and the Lain-lain line check
  const ctl = (code: string) => r.controls.find((c) => c.code === code)!;
  t.add("B3.B17", "B17 konversi kartu = pool − idle", "REKON & KONTROL!C59", ctl("B17").value, TOL.jt, MILLION);
  t.add("B3.B18", "B18 material + varian = GL", "REKON & KONTROL!C60", ctl("B18").value, TOL.jt, MILLION);
  t.add("B3.B19", "B19 sisa rekonsiliasi HPP", "REKON & KONTROL!C61", ctl("B19").value, TOL.jt, MILLION);
  t.add("B3.others_material", "Lini Lain-lain = material Lain-lain", "REKON & KONTROL!C62", r.hpp.checks[0].value, TOL.jt, MILLION);
  t.add("B3.B20", "B20 pendapatan = GL", "REKON & KONTROL!C63", ctl("B20").value, TOL.jt, MILLION);
  // RINGKASAN bagian 4
  const step = (k: string) => r.hpp.steps.find((s) => s.key === k)!.amount;
  t.add("B3.sum.hpp_card", "HPP kartu", "RINGKASAN!B29", step("hpp_card"), TOL.jt, MILLION);
  t.add("B3.sum.material_variance", "Varian material", "RINGKASAN!B30", step("material_variance"), TOL.jt, MILLION);
  t.add("B3.sum.inventory_gap", "Selisih kenaikan persediaan", "RINGKASAN!B31", r.hpp.inventoryGap, TOL.jt, MILLION);
  t.add("B3.sum.kw2", "KW 2 pada NRV", "RINGKASAN!B32", step("kw2_nrv"), TOL.jt, MILLION);
  t.add("B3.sum.idle", "Jam menganggur", "RINGKASAN!B33", step("idle_period"), TOL.jt, MILLION);
  t.add("B3.sum.hpp_gl", "HPP GL", "RINGKASAN!B34", step("hpp_gl"), TOL.jt, MILLION);
  t.add("B3.sum.residual", "Sisa", "RINGKASAN!B35", step("residual"), TOL.jt, MILLION);
  // RINGKASAN bagian 5 — WP / GL / LK / selisih / dijelaskan / sisa / GL − LK
  const rowOf: Record<string, number> = { revenue: 40, material_usage: 41, conversion: 42, cogs: 43, gross_profit: 44, inv_1106_001: 46, inv_1106_002: 47, inv_1106_003: 48, inv_wip_fg_delta: 49 };
  for (const row of r.summary.rows) {
    const key = row.line_key.replace("summary.", "");
    const n = rowOf[key];
    const cols: [string, Decimal | null][] = [["B", row.wp_amount], ["C", row.gl_amount], ["D", row.lk_amount], ["E", row.difference], ["F", row.explained?.total ?? null], ["G", row.residual], ["H", row.gl_lk_diff]];
    for (const [c, v] of cols) t.add(`B3.bs.${key}.${c}`, `${row.label} (${c})`, `RINGKASAN!${c}${n}`, v, TOL.jt, MILLION);
  }
  // REKON MATERIAL
  for (const m of r.material.rows) {
    const rr = m.rounding ? 61 : Number(m.source_ref?.split("!A")[1]);
    if (!rr) continue;
    t.add(`B3.rm.${rr}.H`, `${m.name}: total kartu`, `REKON MATERIAL!H${rr}`, m.cardTotal, TOL.rp);
    if (w.f(`REKON MATERIAL!K${rr}`)) t.add(`B3.rm.${rr}.K`, `${m.name}: saldo akhir (implisit / pembulatan)`, `REKON MATERIAL!K${rr}`, m.accClose, TOL.rp);
    t.add(`B3.rm.${rr}.L`, `${m.name}: pemakaian Accurate`, `REKON MATERIAL!L${rr}`, m.accUsage, TOL.rp);
    t.add(`B3.rm.${rr}.M`, `${m.name}: selisih Accurate − kartu`, `REKON MATERIAL!M${rr}`, m.diff, TOL.rp);
    t.add(`B3.rm.${rr}.N`, `${m.name}: saldo akhir implisit kartu`, `REKON MATERIAL!N${rr}`, m.wpClose, TOL.rp);
  }
  const mt = r.material.totals;
  const tot: [string, Decimal][] = [["D", mt.cardByLine.FCC], ["E", mt.cardByLine.UU], ["F", mt.cardByLine.UO], ["G", mt.cardByLine.LAIN], ["H", mt.cardTotal],
    ["I", mt.accOpen], ["J", mt.accIn], ["K", mt.accClose], ["L", mt.accUsage], ["M", mt.diff], ["N", mt.wpClose]];
  for (const [c, v] of tot) t.add(`B3.rm.total.${c}`, `REKON MATERIAL total ${c}`, `REKON MATERIAL!${c}62`, v, TOL.rp);
  t.add("B3.rm.gl_close", "Saldo akhir 1106-001 GL", "REKON MATERIAL!C70", r.material.gl.close, TOL.rp);
  t.add("B3.rm.gl_lk.receipts", "Penerimaan GL − LK", "REKON MATERIAL!F68", r.material.glVsLk.receipts, TOL.rp);
  t.add("B3.rm.gl_lk.usage", "Pemakaian GL − LK", "REKON MATERIAL!F69", r.material.glVsLk.usage, TOL.rp);
  t.add("B3.rm.gl_lk.close", "Saldo akhir GL − LK", "REKON MATERIAL!F70", r.material.glVsLk.close, TOL.rp);
  r.material.checks.forEach((c, i) => t.add(`B3.rm.check.${c.key}`, c.label, c.source_ref ?? `REKON MATERIAL!C${75 + i}`, c.value, TOL.rp));
  // REKON PERSEDIAAN bagian 1 (table), memo, bagian 2 checks, item columns
  const it = r.inventory;
  const rows: Record<string, number> = { gl: 7, iv: 8, subledgerGap: 9, wp: 10, wpMinusGl: 11, k1: 13, k1QtyDiff: 14, k1ResidualNoQty: 15, k1Rate: 16, k2: 17, k3: 18, k4: 19, k5: 20, k6: 21, subledgerReversal: 22, explained: 23, residual: 24 };
  const cols = { wipOpen: "C", wipClose: "D", wipDelta: "E", fgOpen: "F", fgClose: "G", fgDelta: "H" } as const;
  for (const [blk, rowN] of Object.entries(rows)) {
    for (const [p, c] of Object.entries(cols)) t.add(`B3.rp.${blk}.${p}`, `REKON PERSEDIAAN ${blk} ${p}`, `REKON PERSEDIAAN!${c}${rowN}`, it.table[blk as keyof typeof it.table][p as keyof typeof cols], TOL.rp);
  }
  t.add("B3.rp.delta_sum", "Σ Δ (WP − GL) WIP + FG", "REKON PERSEDIAAN!E25", it.deltaSum, TOL.rp);
  for (const c of it.wpChecks) t.add(`B3.rp.check.${c.ref.split("!")[1]}`, c.label, c.ref, c.value, TOL.rp);
  for (const row of it.rows) {
    const rr = Number(row.source_ref?.split("!A")[1]);
    const add = (c: string, v: Decimal, tol: string) => t.add(`B3.rp.item.${row.code}.${c}`, `${row.code} kolom ${c}`, `REKON PERSEDIAAN!${c}${rr}`, v, tol);
    add("N", row.diffClose, TOL.rp);
    add("O", row.diffDelta, TOL.rp);
    add("P", row.rateAcc, TOL.ratio);
    add("Q", row.rateWp, TOL.ratio);
    add("S", row.oldCardRatio, TOL.ratio);
    add("U", row.qtyDiffValueClose, TOL.rp);
    add("V", row.qtyDiffValueOpen, TOL.rp);
  }
  t.add("B3.k2_wip_close", "K2 olein di WIP-022, saldo akhir Accurate", "REKON PERSEDIAAN!H58", it.rows.find((x) => x.code === "WIP-022")!.accValueClose, TOL.rp);
  return t.list;
}

const bridgeComponentCells = (c: BridgeComponents, col: "C" | "D"): [string, Decimal][] => [
  [`${col}81`, c.fixedShare.A], [`${col}82`, c.fixedShare.K], [`${col}83`, c.fixedShare.B], [`${col}84`, c.fixedShare.C], [`${col}85`, c.fixedShare.D], [`${col}86`, c.fixedShare.E],
  [`${col}87`, c.variableConversion.F], [`${col}88`, c.fixedConversion.F], [`${col}89`, c.variable.F],
  [`${col}90`, c.variableConversion.U], [`${col}91`, c.fixedConversion.U], [`${col}92`, c.variable.U],
  [`${col}93`, c.variableConversion.O], [`${col}94`, c.fixedConversion.O], [`${col}95`, c.variable.O],
  [`${col}96`, c.variableConversion.L], [`${col}97`, c.fixedConversion.L], [`${col}98`, c.variable.L],
  [`${col}99`, c.variableTotal], [`${col}100`, c.fixedTotal], [`${col}101`, c.inventory],
  [`${col}102`, c.glItems[0]], [`${col}103`, c.glItems[1]], [`${col}104`, c.glItems[2]], [`${col}105`, c.glItems[3]], [`${col}106`, c.glItems[4]], [`${col}107`, c.check],
];

export function f4Targets(run: F4Run): GoldenTarget[] {
  const t = new Targets("engine reasonableness.ts / variance.ts / bridge.ts (Fase 4)");
  // CEK KEWAJARAN bagian 1 (Sep, min, max) and kpi_series Jan–Sep
  for (const k of run.trend) {
    const row = TREND_KPIS.find((d) => d.code === k.code)!.wpRow;
    t.add(`B4.trend.${k.code}.min`, `${k.label}: min Jan–Agu`, `CEK KEWAJARAN!K${row}`, k.min, TOL.ratio);
    t.add(`B4.trend.${k.code}.max`, `${k.label}: maks Jan–Agu`, `CEK KEWAJARAN!L${row}`, k.max, TOL.ratio);
  }
  for (const s of run.series) if (s.source_ref) t.add(`B4.kpi.${s.kpi_code}.${s.month.slice(0, 7)}`, `${s.label} ${s.month.slice(0, 7)}`, s.source_ref, s.value, TOL.ratio);
  // bagian 2
  for (const m of run.mom) {
    const row = MOM_KPIS.find((d) => d.code === m.code)!.wpRow;
    t.add(`B4.mom.${m.code}.value`, `${m.label}: Sep`, `CEK KEWAJARAN!C${row}`, m.current, TOL.ratio);
    t.add(`B4.mom.${m.code}.delta`, `${m.label}: Δ %`, `CEK KEWAJARAN!D${row}`, m.deltaPct, TOL.ratio);
  }
  // varian per komponen (WP: budget kosong) + RINGKASAN bagian 2
  const colOf = { actualPerKg: "F", budgetPerKg: "G", diff: "H", price: "I", usage: "J", volume: "K", method: "L", check: "M", qtyPerKgAct: "B", qtyPerKgBud: "C", priceAct: "D", priceBud: "E" } as const;
  for (const p of VARIANCE_PRODUCTS) {
    for (const r of run.varianceWp.products[p].rows) {
      const [sheet, cell] = r.source_ref.split("!");
      const rowN = cell.slice(1);
      for (const [k, c] of Object.entries(colOf)) {
        const v = r[k as keyof typeof colOf];
        if (v === null) continue;
        t.add(`B4.var.${p}.${r.component ?? r.group ?? "total"}.${c}`, `${p} ${r.label} (${c})`, `${sheet}!${c}${rowN}`, v, TOL.ratio);
      }
    }
    const tot = run.varianceWp.products[p].total;
    const sr = { FCC: 16, UU: 17, UO: 18 }[p];
    const sum: [string, Decimal][] = [["B", tot.actualPerKg], ["C", tot.budgetPerKg], ["D", tot.diff], ["E", tot.price], ["F", tot.usage], ["G", tot.volume], ["H", tot.method]];
    for (const [c, v] of sum) t.add(`B4.var.summary.${p}.${c}`, `RINGKASAN varian ${p} (${c})`, `RINGKASAN!${c}${sr}`, v, TOL.ratio);
  }
  // BRIDGE GP
  const b = run.bridge;
  t.add("B4.bridge.RA", "Pendapatan Agu", "BRIDGE GP!C111", b.revenuePrior, TOL.jt);
  t.add("B4.bridge.RS", "Pendapatan Sep", "BRIDGE GP!C112", b.revenueCurrent, TOL.jt);
  t.add("B4.bridge.Ra", "Pendapatan Sep pada harga Agu", "BRIDGE GP!C113", b.revenueAtPriorPrice, TOL.jt);
  t.add("B4.bridge.mA", "Margin GL Agu", "BRIDGE GP!C114", b.marginPrior, "0.000001");
  t.add("B4.bridge.mS", "Margin GL Sep", "BRIDGE GP!C115", b.marginCurrent, "0.000001");
  t.add("B4.bridge.start", "Margin GL Agustus 2026 (pp)", "BRIDGE GP!C117", b.start, TOL.pp);
  for (const bar of b.bars) t.add(`B4.bridge.${bar.code}`, bar.label, bar.source_ref, bar.pp, TOL.pp);
  t.add("B4.bridge.end", "Margin GL September 2026 (pp)", "BRIDGE GP!C135", b.end, TOL.pp);
  for (const g of b.groups) t.add(`B4.bridge.group.${g.group}`, `Kelompok ${g.group}`, g.source_ref, g.pp, TOL.pp);
  t.add("B4.bridge.total_change", "Total perubahan margin", "BRIDGE GP!C144", b.groups.reduce((a, x) => a.plus(x.pp), D(0)), TOL.pp);
  for (const c of b.checks) t.add(`B4.bridge.check.${c.key}`, c.label, c.source_ref, c.value, c.tolerance.toFixed());
  for (const [cell, v] of bridgeComponentCells(b.priorComponents, "C")) t.add(`B4.bridge.comp.${cell}`, `Komponen HPP Agu ${cell}`, `BRIDGE GP!${cell}`, v, TOL.jt);
  for (const [cell, v] of bridgeComponentCells(b.currentComponents, "D")) t.add(`B4.bridge.comp.${cell}`, `Komponen HPP Sep ${cell}`, `BRIDGE GP!${cell}`, v, TOL.jt);
  bridgeWaterfallWp(b).forEach((d, i) => {
    t.add(`B4.bridge.wf.${d.code}`, `Waterfall ${d.label}`, `BRIDGE GP!B${161 + i}`, d.pp, TOL.pp);
    t.add(`B4.bridge.wf.${d.code}.cum`, `Waterfall kumulatif ${d.label}`, `BRIDGE GP!G${161 + i}`, d.cumulative, TOL.pp);
  });
  const merged = bridgeDisplayBars(b).find((d) => d.code === "b2_b12")!;
  t.add("B4.bridge.display.b2_b12", "Volume, mix, dan persediaan (b2 + b12)", "BRIDGE GP!B163", merged.pp, TOL.pp);
  // bridge inputs of the current month assembled from Fase 2 / recon outputs = BRIDGE GP column D
  const refs = bridgeCurrentRefs(run.cells);
  for (const code of BRIDGE_INPUT_CODES) t.add(`B4.bridge.input.${code}`, `Input bridge ${code} (dirakit dari keluaran Fase 2/3)`, refs[code], run.bridgeAssembled[code] as Num, code.startsWith("Q_") || code.startsWith("P_") ? TOL.kg : TOL.jt);
  return t.list;
}

export const F34_SUITES = [
  {
    id: "f3-recon", phase: "F3",
    description: "B3 rekon dan kontrol (recon.ts) = sel WP: REKON & KONTROL bagian 2–5, REKON MATERIAL, REKON PERSEDIAAN, RINGKASAN bagian 4–5",
    run: (fixture: string): GoldenResult[] => (fixture === F34_FIXTURE ? checkTargets(loadCells(fixture), f3Targets(runF34(fixture).f3)) : []),
  },
  {
    id: "f4-analysis", phase: "F4",
    description: "B4 kewajaran, varian (budget WP kosong), bridge GP (reasonableness.ts, variance.ts, bridge.ts) = sel WP: CEK KEWAJARAN, FCC/UU/UO bagian 4, RINGKASAN bagian 2, BRIDGE GP",
    run: (fixture: string): GoldenResult[] => (fixture === F34_FIXTURE ? checkTargets(loadCells(fixture), f4Targets(runF34(fixture).f4)) : []),
  },
];

/** Snapshot payload (mart rows without the `inputs` operands, which repeat values already in the row). */
function slim<T extends { inputs?: unknown }>(rows: readonly T[]): Omit<T, "inputs">[] {
  return rows.map(({ inputs: _inputs, ...rest }) => rest);
}

export function f3Snapshot(fixture = F34_FIXTURE) {
  const r = runF34(fixture).f3.recon;
  return { status: r.status, controls: slim(r.controls), recon_month: slim(r.reconMonthRows), inventory_recon: slim(r.inventoryReconRows) };
}

export function f4Snapshot(fixture = F34_FIXTURE) {
  const f = runF34(fixture).f4;
  return {
    reasonableness: slim(f.reasonableness), kpi_series: slim(f.series), b33: (({ inputs: _i, ...rest }) => rest)(f.b33),
    variance_wp: slim(f.varianceWp.rows), variance_bp_v1: slim(f.varianceBp.rows), variance_controls: slim(f.varianceBp.controls),
    bridge_month: slim(bridgeMonthRows(f.bridge)), bridge_controls: slim(f.bridge.controls),
  };
}

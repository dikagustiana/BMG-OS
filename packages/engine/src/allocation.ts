/**
 * Allocation of the conversion pools to the lines FCC, UU, UO and Lain-lain (WP BIAYA BERSAMA bagian 4, 6, 6b, 10).
 * PRD v2 §4.3.
 *
 * Actual: A (minus the idle period charge) and B per man-hour; Kupas per kg peeled; C per kWh; E per material value;
 * D per frying machine hour after the bagging share (bagging kWh ÷ total kWh) goes to Lain-lain:
 *   portion_i = (1 − bag) × mh_i / Σ mh   (+ bag for Lain-lain).
 * Budget compare (method column of the variance, Fase 4): A, B, C per production volume; Kupas per kg peeled;
 * D per kWh; E per material value.
 * Lain-lain bagging kWh = kWh of Lain-lain units without frying machine hours (Sep-26: all but Ubi putih ACE).
 */
import { div, sum, ZERO, type Decimal } from "./decimal";
import type { Ref } from "./inputs";
import type { AllocationMethod, AllocationMonthRow, DriverCode, PoolMonthRow } from "./mart";
import type { LineCode, PoolCode } from "./types";

export const ALLOCATION_RULE = "allocation.allocatePools@1";
export const LINES: LineCode[] = ["FCC", "UU", "UO", "LAIN"];
const WP_COL: Record<LineCode, string> = { FCC: "C", UU: "D", UO: "E", LAIN: "F" };
const WP_ROW_ACTUAL: Record<PoolCode, number> = { A: 115, KUPAS: 116, B: 117, C: 118, D: 119, E: 120 };
const WP_ROW_COMPARE: Record<PoolCode, number> = { A: 125, KUPAS: 126, B: 127, C: 128, D: 129, E: 130 };
const WP_DRIVER_ROW: Record<DriverCode, number> = { man_hour: 91, kg_peeled: 92, kwh: 93, material_value: 94, volume: 95, machine_hour: 171 };
const WP_SHARE_ROW: Partial<Record<DriverCode, number>> = { man_hour: 97, kg_peeled: 98, kwh: 99, material_value: 100, volume: 101 };

export interface LineDrivers {
  line: LineCode;
  manHour: Decimal;
  kgPeeled: Decimal;
  kwh: Decimal;
  /** Σ card material of the line, without freight (BIAYA BERSAMA row 94). */
  materialValue: Decimal;
  /** Production volume for the budget method (kg into process; Lain-lain 0, BIAYA BERSAMA F95). */
  volume: Decimal;
  /** Frying machine hours (BIAYA BERSAMA row 171). */
  machineHour: Decimal;
  /** Lain-lain only: kWh of units without frying machine hours (BIAYA BERSAMA F172). */
  baggingKwh: Decimal;
  refs: Ref[];
}

export interface LainAllocation {
  A: Decimal; KUPAS: Decimal; B: Decimal; C: Decimal; D: Decimal; E: Decimal;
  /** Grup D to Lain-lain: bagging part (F176, per kWh) and frying part (F177, per machine hour). */
  dBagging: Decimal;
  dMachine: Decimal;
}

export interface AllocationChecks {
  /** BIAYA BERSAMA I121 / C137: allocated − pool (actual). */
  actualResidual: Decimal;
  /** I131 / C138: same for the budget compare. */
  compareResidual: Decimal;
  /** C184: Σ Grup D portions − 1. */
  dPortionResidual: Decimal;
  /** C185: Grup D allocated − pool D. */
  dResidual: Decimal;
}

export interface AllocationResult {
  rows: AllocationMonthRow[];
  /** Actual allocation per line and pool. */
  actual: Record<LineCode, Record<PoolCode, Decimal>>;
  lain: LainAllocation;
  bagShare: Decimal;
  checks: AllocationChecks;
}

export interface AllocationInput {
  month: string;
  pools: PoolMonthRow[];
  /** Idle Unit I hours charged to the period (BIAYA BERSAMA C111); comes off pool A. */
  periodCharge: Decimal;
  drivers: LineDrivers[];
  inputs: Ref[];
  wpTemplate: "sep26_4" | null;
}

const zeroRec = (): Record<PoolCode, Decimal> => ({ A: ZERO, KUPAS: ZERO, B: ZERO, C: ZERO, D: ZERO, E: ZERO });

export function allocatePools(x: AllocationInput): AllocationResult {
  const wp = x.wpTemplate === "sep26_4";
  const pool = (p: PoolCode) => x.pools.find((r) => r.pool === p)?.total ?? ZERO;
  const drv = (l: LineCode) => x.drivers.find((d) => d.line === l) ?? null;
  const value = (l: LineCode, d: DriverCode): Decimal => {
    const r = drv(l);
    if (!r) return ZERO;
    return { man_hour: r.manHour, kg_peeled: r.kgPeeled, kwh: r.kwh, material_value: r.materialValue, volume: r.volume, machine_hour: r.machineHour }[d];
  };
  const total = (d: DriverCode) => sum(LINES.map((l) => value(l, d)));
  const share = (l: LineCode, d: DriverCode) => div(value(l, d), total(d));

  // Grup D portions (bagian 10)
  const kwhTotal = total("kwh");
  const baggingKwh = drv("LAIN")?.baggingKwh ?? ZERO;
  const bag = div(baggingKwh, kwhTotal);
  const mhTotal = total("machine_hour");
  const dPortion = (l: LineCode) => {
    const p = ZERO.plus(1).minus(bag).times(div(value(l, "machine_hour"), mhTotal));
    return l === "LAIN" ? p.plus(bag) : p;
  };

  const rows: AllocationMonthRow[] = [];
  const actual: Record<LineCode, Record<PoolCode, Decimal>> = { FCC: zeroRec(), UU: zeroRec(), UO: zeroRec(), LAIN: zeroRec() };
  const target = (p: PoolCode) => (p === "A" ? pool("A").minus(x.periodCharge) : pool(p));
  const refsOf = (l: LineCode) => [...(drv(l)?.refs ?? []), ...x.inputs];

  const plan: { pool: PoolCode; method: AllocationMethod; driver: DriverCode }[] = [
    { pool: "A", method: "actual", driver: "man_hour" }, { pool: "KUPAS", method: "actual", driver: "kg_peeled" },
    { pool: "B", method: "actual", driver: "man_hour" }, { pool: "C", method: "actual", driver: "kwh" },
    { pool: "D", method: "actual", driver: "machine_hour" }, { pool: "E", method: "actual", driver: "material_value" },
    { pool: "A", method: "budget_compare", driver: "volume" }, { pool: "KUPAS", method: "budget_compare", driver: "kg_peeled" },
    { pool: "B", method: "budget_compare", driver: "volume" }, { pool: "C", method: "budget_compare", driver: "volume" },
    { pool: "D", method: "budget_compare", driver: "kwh" }, { pool: "E", method: "budget_compare", driver: "material_value" },
  ];
  let residualActual = ZERO, residualCompare = ZERO;
  for (const p of plan) {
    const t = target(p.pool);
    let allocated = ZERO;
    for (const l of LINES) {
      const isD = p.pool === "D" && p.method === "actual";
      const s = isD ? dPortion(l) : share(l, p.driver);
      const amount = t.times(s);
      allocated = allocated.plus(amount);
      if (p.method === "actual") actual[l][p.pool] = amount;
      const row = (p.method === "actual" ? WP_ROW_ACTUAL : WP_ROW_COMPARE)[p.pool];
      const shareRow = isD ? 174 : WP_SHARE_ROW[p.driver];
      const detail: Record<string, Decimal> = {};
      if (isD) {
        detail.machine_hour_share = div(value(l, "machine_hour"), mhTotal);
        detail.bag_share = l === "LAIN" ? bag : ZERO;
        if (l === "LAIN") {
          detail.d_bagging = pool("D").times(bag);
          detail.d_machine = amount.minus(detail.d_bagging);
          detail.bagging_kwh = baggingKwh;
        }
      }
      const c = WP_COL[l];
      rows.push({
        month: x.month, pool: p.pool, line: l, method: p.method, driver: p.driver, driver_value: value(l, p.driver), driver_share: s, amount, detail,
        rule_id: ALLOCATION_RULE, inputs: refsOf(l),
        source_ref: wp ? `BIAYA BERSAMA!${c}${row}` : null,
        source_refs: wp ? {
          amount: `BIAYA BERSAMA!${c}${row}`,
          driver_value: `BIAYA BERSAMA!${c}${WP_DRIVER_ROW[p.driver]}`,
          ...(shareRow ? { driver_share: `BIAYA BERSAMA!${c}${shareRow}` } : {}),
          ...(isD && l === "LAIN" ? { "detail.d_bagging": "BIAYA BERSAMA!F176", "detail.d_machine": "BIAYA BERSAMA!F177", "detail.bagging_kwh": "BIAYA BERSAMA!F172", "detail.bag_share": "BIAYA BERSAMA!G173" } : {}),
        } : {},
      });
    }
    if (p.method === "actual") residualActual = residualActual.plus(allocated.minus(t));
    else residualCompare = residualCompare.plus(allocated.minus(t));
  }

  const dPortionSum = sum(LINES.map(dPortion));
  const dAllocated = sum(LINES.map((l) => actual[l].D));
  const dBagging = pool("D").times(bag);
  return {
    rows, actual, bagShare: bag,
    lain: { ...actual.LAIN, dBagging, dMachine: actual.LAIN.D.minus(dBagging) },
    checks: {
      actualResidual: residualActual, compareResidual: residualCompare,
      dPortionResidual: dPortionSum.minus(1), dResidual: dAllocated.minus(pool("D")),
    },
  };
}

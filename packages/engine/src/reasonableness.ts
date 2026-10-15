/**
 * B4 kewajaran — `reasonableness.ts` (PRD v2 §4.8 "Kewajaran", §1 "Tren FCC Jan–Sep", §5.4 `kpi_series`;
 * PRD v1 §4.4 `reasonableness`, §4.6 B33; PLAN v1 Fase 4).
 *
 * Reproduces sheet CEK KEWAJARAN:
 *   - bagian 1 (`trendKpis`): 15 FCC KPIs of the old card for the month vs min–max of the 8 preceding months
 *     → DALAM / DI LUAR RENTANG, with the explanation text (WP column N) carried through;
 *   - bagian 2 (`monthOverMonth`): all products, previous month vs this month, |Δ| > 10% → CEK;
 *   - `kpiSeries`: the `kpi_series` rows (month × KPI) behind the trend table of PRD v2 §1;
 *   - `usageRatioControl`: B33 (usage per kg vs the 3 preceding months, karton/HDPE/olein → PERIKSA).
 *
 * Bagian 1 reads the old FCC card (kartu lama) month by month — `KpiHistoryMonth` (CEK KEWAJARAN bagian 3).
 * Kewajaran is not a control (PRD v2 §5.5): every CEK needs an explanation before release.
 */
import { D, Decimal, ZERO, div, type Num } from "./decimal";
import { addMonths, monthOf } from "./dates";
import { ruleId, trace, type ControlMonthRow, type MartTrace, type Refs } from "./mart-row";
import type { ControlStatus } from "./types";

const RULE = {
  trend: ruleId("reasonableness.trendKpis"),
  mom: ruleId("reasonableness.monthOverMonth"),
  series: ruleId("reasonableness.kpiSeries"),
  b33: ruleId("reasonableness.usageRatioControl"),
};

// ---------------------------------------------------------------------------------------------------------------
// Input: the old FCC card per month (CEK KEWAJARAN bagian 3)
// ---------------------------------------------------------------------------------------------------------------

/**
 * One month of the old FCC card ("kartu lama", CoGM file sheet FCCmm26). Production source:
 *   - Jan–Aug 2026 (before the platform): upload `kpi_history` (one row per month × field, see docs/v2/F34-engine-notes.md);
 *   - from Sep-26: the same fields can be read from the B1 old-card upload `cogm_card` / `cogm_material` (line FCC) once
 *     the old card layout is parsed (open-questions B-011); until then they keep coming through `kpi_history`.
 */
export interface KpiHistoryMonth {
  /** 'YYYY-MM-01' */
  month: string;
  /** Masuk proses kg — "Current Process" (CEK KEWAJARAN row 42). */
  inputKg: Num;
  /** KW 2 kg — "Second Grade" (row 43). */
  kw2Kg: Num;
  /** Waste kg — "Waste Product" (row 44). */
  wasteKg: Num;
  /** Barang jadi premium kg — "Finished Goods Accounted For" (row 45). */
  premiumKg: Num;
  /** Singkong kulit kg / Rp (rows 46–47). */
  cassavaPeelKg: Num;
  cassavaPeelRp: Num;
  /** Singkong daging kg / Rp (rows 48–49). */
  cassavaFleshKg: Num;
  cassavaFleshRp: Num;
  /** Olein kg / Rp (rows 50–51). */
  oleinKg: Num;
  oleinRp: Num;
  /** CNG m³ / Rp (rows 52–53). */
  cngM3: Num;
  cngRp: Num;
  /** Karton pcs (row 54). */
  cartonPcs: Num;
  /** Direct labour hours (row 55). */
  dlHours: Num;
  /** Material kartu lama Rp — "B.1. Material Cost" (row 56). */
  oldCardMaterialRp: Num;
  /** Biaya ditambahkan kartu lama Rp — "Current Cost Added" (row 57). */
  oldCardCostAddedRp: Num;
  /** HDPE kg (0,03 + 0,05 + 0,07) on the FCC card — not in the WP history; only for B33. */
  hdpeKg?: Num | null;
  refs?: Refs;
}

export type TrendKpiCode =
  | "input_ton" | "premium_ratio" | "kw2_ratio" | "waste_ratio" | "cassava_peel_price" | "cassava_flesh_price"
  | "cassava_per_kg_input" | "olein_per_kg_input" | "olein_price" | "cng_per_kg_input" | "cng_price"
  | "carton_per_ton" | "dl_hours_per_ton" | "old_card_material_per_kg_input" | "old_card_cost_per_good_kg";

export interface TrendKpiDef {
  code: TrendKpiCode;
  label: string;
  unit: string;
  /** Row of the KPI in CEK KEWAJARAN bagian 1 (golden layout). */
  wpRow: number;
  value: (h: KpiHistoryMonth) => Decimal;
}

const n = (x: Num) => D(x);
/** Excel IF(den=0, 0, num/den) */
const ratio = (num: Num, den: Num) => div(n(num), n(den));

/** The 15 KPIs of CEK KEWAJARAN bagian 1, in sheet order, with the WP formulas. */
export const TREND_KPIS: readonly TrendKpiDef[] = [
  { code: "input_ton", label: "Masuk proses (ton)", unit: "ton", wpRow: 6, value: (h) => n(h.inputKg).div(1000) },
  { code: "premium_ratio", label: "Barang jadi premium ÷ masuk proses", unit: "rasio", wpRow: 7, value: (h) => ratio(h.premiumKg, h.inputKg) },
  { code: "kw2_ratio", label: "KW 2 ÷ masuk proses", unit: "rasio", wpRow: 8, value: (h) => ratio(h.kw2Kg, h.inputKg) },
  { code: "waste_ratio", label: "Waste ÷ masuk proses", unit: "rasio", wpRow: 9, value: (h) => ratio(h.wasteKg, h.inputKg) },
  { code: "cassava_peel_price", label: "Harga singkong kulit (Rp/kg)", unit: "Rp/kg", wpRow: 10, value: (h) => ratio(h.cassavaPeelRp, h.cassavaPeelKg) },
  { code: "cassava_flesh_price", label: "Harga singkong daging (Rp/kg)", unit: "Rp/kg", wpRow: 11, value: (h) => ratio(h.cassavaFleshRp, h.cassavaFleshKg) },
  { code: "cassava_per_kg_input", label: "Singkong (kulit + daging) per kg masuk proses", unit: "kg/kg", wpRow: 12, value: (h) => ratio(n(h.cassavaPeelKg).plus(n(h.cassavaFleshKg)), h.inputKg) },
  { code: "olein_per_kg_input", label: "Olein per kg masuk proses (kg)", unit: "kg/kg", wpRow: 13, value: (h) => ratio(h.oleinKg, h.inputKg) },
  { code: "olein_price", label: "Harga olein (Rp/kg)", unit: "Rp/kg", wpRow: 14, value: (h) => ratio(h.oleinRp, h.oleinKg) },
  { code: "cng_per_kg_input", label: "CNG per kg masuk proses (m³)", unit: "m³/kg", wpRow: 15, value: (h) => ratio(h.cngM3, h.inputKg) },
  { code: "cng_price", label: "Harga CNG (Rp/m³)", unit: "Rp/m³", wpRow: 16, value: (h) => ratio(h.cngRp, h.cngM3) },
  { code: "carton_per_ton", label: "Karton per ton masuk proses (pcs)", unit: "pcs/ton", wpRow: 17, value: (h) => (n(h.inputKg).isZero() ? ZERO : n(h.cartonPcs).div(n(h.inputKg)).times(1000)) },
  { code: "dl_hours_per_ton", label: "Direct labour per ton (jam)", unit: "jam/ton", wpRow: 18, value: (h) => (n(h.inputKg).isZero() ? ZERO : n(h.dlHours).div(n(h.inputKg)).times(1000)) },
  { code: "old_card_material_per_kg_input", label: "Material kartu lama per kg masuk proses (Rp)", unit: "Rp/kg", wpRow: 19, value: (h) => ratio(h.oldCardMaterialRp, h.inputKg) },
  {
    code: "old_card_cost_per_good_kg", label: "Kartu lama per kg barang baik (Rp)", unit: "Rp/kg", wpRow: 20,
    value: (h) => {
      const good = n(h.inputKg).minus(n(h.kw2Kg)).minus(n(h.wasteKg));
      return good.lte(0) ? ZERO : n(h.oldCardCostAddedRp).div(good);
    },
  },
];

export type TrendStatus = "DALAM_RENTANG" | "DI_LUAR_RENTANG";
export type MomStatus = "WAJAR" | "CEK";

/** WP text of a status code ("DI_LUAR_RENTANG" → "DI LUAR RENTANG"). */
export const statusText = (s: string | null) => (s === null ? null : s.replace(/_/g, " "));

/** Golden layout of CEK KEWAJARAN bagian 1: Jan-26 in column B … Sep-26 in column J. */
export const WP_TREND_LAYOUT = { firstMonth: "2026-01-01", firstColumn: "B", months: 9, minColumn: "K", maxColumn: "L", statusColumn: "M", noteColumn: "N" } as const;

function wpTrendRef(month: string, row: number): string | null {
  const first = WP_TREND_LAYOUT.firstMonth;
  for (let i = 0; i < WP_TREND_LAYOUT.months; i++) {
    if (addMonths(first, i) === month) return `CEK KEWAJARAN!${String.fromCharCode(WP_TREND_LAYOUT.firstColumn.charCodeAt(0) + i)}${row}`;
  }
  return null;
}

/** Default window of the range: the 8 months before the month (CEK KEWAJARAN K:L = MIN/MAX Jan–Agu). */
export const TREND_WINDOW = 8;

export interface TrendKpiResult {
  code: TrendKpiCode;
  label: string;
  unit: string;
  month: string;
  value: Decimal;
  /** Values of the window months (oldest first). */
  window: { month: string; value: Decimal }[];
  min: Decimal | null;
  max: Decimal | null;
  status: TrendStatus | null;
  note: string | null;
}

function byMonth(history: readonly KpiHistoryMonth[]): Map<string, KpiHistoryMonth> {
  const m = new Map<string, KpiHistoryMonth>();
  for (const h of history) {
    const k = monthOf(h.month);
    if (m.has(k)) throw new Error(`Riwayat KPI ganda untuk bulan ${k}`);
    m.set(k, h);
  }
  return m;
}

/**
 * CEK KEWAJARAN bagian 1 for `month`: each KPI vs MIN/MAX of the `window` preceding months.
 * The range (and status) is null unless all `window` preceding months are in the history.
 * `notes` (kpi code → text) are the explanations (WP column N for the golden month; `reasonableness.explanation` later).
 */
export function trendKpis(history: readonly KpiHistoryMonth[], month: string, notes: Partial<Record<TrendKpiCode, string>> = {}, window = TREND_WINDOW): TrendKpiResult[] {
  const hm = byMonth(history);
  const m = monthOf(month);
  const cur = hm.get(m);
  if (!cur) throw new Error(`Riwayat kartu lama bulan ${m} tidak ada`);
  const prior = Array.from({ length: window }, (_, i) => addMonths(m, i - window)).map((pm) => ({ pm, h: hm.get(pm) }));
  const full = prior.every((p) => p.h);
  return TREND_KPIS.map((k) => {
    const value = k.value(cur);
    const win = prior.filter((p) => p.h).map((p) => ({ month: p.pm, value: k.value(p.h!) }));
    const min = full && win.length ? win.reduce((a, b) => (b.value.lt(a) ? b.value : a), win[0].value) : null;
    const max = full && win.length ? win.reduce((a, b) => (b.value.gt(a) ? b.value : a), win[0].value) : null;
    const status: TrendStatus | null = min === null || max === null ? null : value.gte(min) && value.lte(max) ? "DALAM_RENTANG" : "DI_LUAR_RENTANG";
    return { code: k.code, label: k.label, unit: k.unit, month: m, value, window: win, min, max, status, note: notes[k.code] ?? null };
  });
}

// ---------------------------------------------------------------------------------------------------------------
// kpi_series (PRD v2 §5.4) — month × KPI for the trend screens
// ---------------------------------------------------------------------------------------------------------------

export interface KpiSeriesRow extends MartTrace {
  month: string;
  product: "FCC";
  kpi_code: TrendKpiCode;
  label: string;
  unit: string;
  value: Decimal;
  min_8m: Decimal | null;
  max_8m: Decimal | null;
  status: TrendStatus | null;
  note: string | null;
}

/**
 * One row per month in `history` × KPI. Each month is judged against its own 8 preceding months; with Jan–Sep 2026 as
 * history only Sep has a full window (the other months carry the value only, as in PRD v2 §1).
 * `notes` per month (YYYY-MM-01 → kpi → text).
 */
export function kpiSeries(history: readonly KpiHistoryMonth[], notes: Record<string, Partial<Record<TrendKpiCode, string>>> = {}, window = TREND_WINDOW): KpiSeriesRow[] {
  const hm = byMonth(history);
  const months = [...hm.keys()].sort();
  const out: KpiSeriesRow[] = [];
  for (const m of months) {
    const h = hm.get(m)!;
    for (const r of trendKpis(history, m, notes[m] ?? {}, window)) {
      const def = TREND_KPIS.find((k) => k.code === r.code)!;
      out.push({
        month: m, product: "FCC", kpi_code: r.code, label: r.label, unit: r.unit, value: r.value, min_8m: r.min, max_8m: r.max, status: r.status, note: r.note,
        ...trace(RULE.series, wpTrendRef(m, def.wpRow), kpiOperands(def.code, h), h.refs),
      });
    }
  }
  return out;
}

/** The history fields a KPI reads (for `inputs`). */
function kpiOperands(code: TrendKpiCode, h: KpiHistoryMonth): Record<string, Decimal> {
  const f: Record<TrendKpiCode, (keyof KpiHistoryMonth)[]> = {
    input_ton: ["inputKg"], premium_ratio: ["premiumKg", "inputKg"], kw2_ratio: ["kw2Kg", "inputKg"], waste_ratio: ["wasteKg", "inputKg"],
    cassava_peel_price: ["cassavaPeelRp", "cassavaPeelKg"], cassava_flesh_price: ["cassavaFleshRp", "cassavaFleshKg"],
    cassava_per_kg_input: ["cassavaPeelKg", "cassavaFleshKg", "inputKg"], olein_per_kg_input: ["oleinKg", "inputKg"], olein_price: ["oleinRp", "oleinKg"],
    cng_per_kg_input: ["cngM3", "inputKg"], cng_price: ["cngRp", "cngM3"], carton_per_ton: ["cartonPcs", "inputKg"], dl_hours_per_ton: ["dlHours", "inputKg"],
    old_card_material_per_kg_input: ["oldCardMaterialRp", "inputKg"], old_card_cost_per_good_kg: ["oldCardCostAddedRp", "inputKg", "kw2Kg", "wasteKg"],
  };
  return Object.fromEntries(f[code].map((k) => [k, D(h[k] as Num)]));
}

// ---------------------------------------------------------------------------------------------------------------
// Bagian 2 — previous month vs this month, all products
// ---------------------------------------------------------------------------------------------------------------

export type MomKpiCode =
  | "fcc_cost_per_kg" | "fcc_material_per_kg" | "fcc_conversion_per_kg" | "fcc_pool_b_per_kg" | "fcc_pool_d_per_kg" | "fcc_pool_e_per_kg"
  | "fcc_other_material_per_kg" | "uu_cost_per_kg" | "uo_cost_per_kg" | "others_cost_per_kg" | "pool_fixed_jt" | "pool_variable_jt" | "pool_a_per_man_hour";

/** Fase 2 outputs of one month that bagian 2 reads (column C of CEK KEWAJARAN rows 25–37 for the golden month). */
export interface MomSourceInputs {
  /** process_card_month FCC kg_input (FCC!B30) */
  fccInputKg: Num;
  /** process_card_month FCC total_cost (FCC!E66) */
  fccProductionCost: Num;
  /** process_card_month FCC material total incl. ongkir (FCC!E56) */
  fccMaterial: Num;
  /** process_card_month FCC conversion total (FCC!E65) */
  fccConversion: Num;
  /** allocation_month pool B / D / E → FCC (FCC!E60, E62, E63) */
  fccPoolB: Num;
  fccPoolD: Num;
  fccPoolE: Num;
  /** process_card_month FCC material "others" subtotal (FCC!E55) */
  fccOtherMaterial: Num;
  /** process_card_month UU kg_input and total_cost (UU!B32, UU!E66) */
  uuInputKg: Num;
  uuProductionCost: Num;
  /** process_card_month UO kg_input and total_cost (UO!B28, UO!E62) */
  uoInputKg: Num;
  uoProductionCost: Num;
  /** others_month Σ kg_out and Σ total (LAIN-LAIN!C43, G68) */
  othersOutputKg: Num;
  othersProductionCost: Num;
  /** pool_month Σ fixed and Σ variable (BIAYA BERSAMA D87, E87) */
  poolFixed: Num;
  poolVariable: Num;
  /** pool_month A total (C81) and Σ man-hours to products (driver_month man_hour, G91) */
  poolA: Num;
  manHours: Num;
  refs?: Refs;
}

export interface MomKpiDef {
  code: MomKpiCode;
  label: string;
  unit: string;
  wpRow: number;
  value: (s: MomSourceInputs) => Decimal;
}

const MILLION = new Decimal(1_000_000);

/** The 13 KPIs of CEK KEWAJARAN bagian 2, in sheet order, with the WP formulas of column C. */
export const MOM_KPIS: readonly MomKpiDef[] = [
  { code: "fcc_cost_per_kg", label: "FCC biaya produksi per kg masuk proses (Rp)", unit: "Rp/kg", wpRow: 25, value: (s) => ratio(s.fccProductionCost, s.fccInputKg) },
  { code: "fcc_material_per_kg", label: "FCC material per kg (Rp)", unit: "Rp/kg", wpRow: 26, value: (s) => ratio(s.fccMaterial, s.fccInputKg) },
  { code: "fcc_conversion_per_kg", label: "FCC konversi per kg (Rp)", unit: "Rp/kg", wpRow: 27, value: (s) => ratio(s.fccConversion, s.fccInputKg) },
  { code: "fcc_pool_b_per_kg", label: "FCC Grup B per kg (Rp)", unit: "Rp/kg", wpRow: 28, value: (s) => ratio(s.fccPoolB, s.fccInputKg) },
  { code: "fcc_pool_d_per_kg", label: "FCC Grup D per kg (Rp)", unit: "Rp/kg", wpRow: 29, value: (s) => ratio(s.fccPoolD, s.fccInputKg) },
  { code: "fcc_pool_e_per_kg", label: "FCC Grup E per kg (Rp)", unit: "Rp/kg", wpRow: 30, value: (s) => ratio(s.fccPoolE, s.fccInputKg) },
  { code: "fcc_other_material_per_kg", label: "FCC material lain per kg (Rp)", unit: "Rp/kg", wpRow: 31, value: (s) => ratio(s.fccOtherMaterial, s.fccInputKg) },
  { code: "uu_cost_per_kg", label: "Ubi Ungu biaya per kg (Rp)", unit: "Rp/kg", wpRow: 32, value: (s) => ratio(s.uuProductionCost, s.uuInputKg) },
  { code: "uo_cost_per_kg", label: "Ubi Orange biaya per kg (Rp)", unit: "Rp/kg", wpRow: 33, value: (s) => ratio(s.uoProductionCost, s.uoInputKg) },
  { code: "others_cost_per_kg", label: "Lain-lain biaya per kg output (Rp)", unit: "Rp/kg", wpRow: 34, value: (s) => ratio(s.othersProductionCost, s.othersOutputKg) },
  { code: "pool_fixed_jt", label: "Pool tetap (Rp juta)", unit: "Rp juta", wpRow: 35, value: (s) => n(s.poolFixed).div(MILLION) },
  { code: "pool_variable_jt", label: "Pool variabel dan semi-variabel (Rp juta)", unit: "Rp juta", wpRow: 36, value: (s) => n(s.poolVariable).div(MILLION) },
  { code: "pool_a_per_man_hour", label: "Grup A per man-hour tercatat (Rp)", unit: "Rp/jam", wpRow: 37, value: (s) => ratio(s.poolA, s.manHours) },
];

/** This month's values of bagian 2 from the Fase 2 outputs (also used for the previous month: run it on that month's outputs). */
export function momValues(s: MomSourceInputs): Record<MomKpiCode, Decimal> {
  return Object.fromEntries(MOM_KPIS.map((k) => [k.code, k.value(s)])) as Record<MomKpiCode, Decimal>;
}

/** Default |Δ| limit of bagian 2 (CEK KEWAJARAN E25:E37). */
export const MOM_THRESHOLD = new Decimal("0.1");

export interface MomKpiResult {
  code: MomKpiCode;
  label: string;
  unit: string;
  prior: Decimal | null;
  current: Decimal;
  /** IF(prior=0, 0, current/prior − 1); null without a prior value */
  deltaPct: Decimal | null;
  threshold: Decimal;
  status: MomStatus | null;
  explanation: string | null;
  /** CEK without explanation blocks the release gate (PRD v2 §5.5). */
  explanationMissing: boolean;
}

/**
 * CEK KEWAJARAN bagian 2. `prior` = previous month's `momValues` (or the WP Agu input for the golden month);
 * `explanations` = text per KPI (WP column G; `reasonableness.explanation` in the app).
 */
export function monthOverMonth(
  current: Record<MomKpiCode, Num>, prior: Partial<Record<MomKpiCode, Num | null>>,
  opts: { thresholds?: Partial<Record<MomKpiCode, Num>>; explanations?: Partial<Record<MomKpiCode, string>> } = {},
): MomKpiResult[] {
  return MOM_KPIS.map((k) => {
    const cur = D(current[k.code]);
    const p = prior[k.code];
    const pr = p === null || p === undefined ? null : D(p);
    const threshold = opts.thresholds?.[k.code] === undefined ? MOM_THRESHOLD : D(opts.thresholds[k.code]);
    const deltaPct = pr === null ? null : pr.isZero() ? ZERO : cur.div(pr).minus(1);
    const status: MomStatus | null = deltaPct === null ? null : deltaPct.abs().gt(threshold) ? "CEK" : "WAJAR";
    const explanation = opts.explanations?.[k.code]?.trim() || null;
    return { code: k.code, label: k.label, unit: k.unit, prior: pr, current: cur, deltaPct, threshold, status, explanation, explanationMissing: status === "CEK" && !explanation };
  });
}

// ---------------------------------------------------------------------------------------------------------------
// reasonableness rows (PRD v1 §4.4 + proposed columns)
// ---------------------------------------------------------------------------------------------------------------

export interface ReasonablenessRow extends MartTrace {
  month: string;
  /** 'trend' = bagian 1, 'mom' = bagian 2 */
  part: "trend" | "mom";
  kpi: string;
  label: string;
  unit: string;
  value: Decimal;
  /** bagian 2: previous month */
  compare_value: Decimal | null;
  min_8m: Decimal | null;
  max_8m: Decimal | null;
  delta_pct: Decimal | null;
  threshold: Decimal | null;
  status: TrendStatus | MomStatus | null;
  explanation: string | null;
  explanation_required: boolean;
}

export function reasonablenessRows(month: string, trend: readonly TrendKpiResult[], mom: readonly MomKpiResult[], momRefs?: Refs): ReasonablenessRow[] {
  const m = monthOf(month);
  const t: ReasonablenessRow[] = trend.map((r) => {
    const def = TREND_KPIS.find((k) => k.code === r.code)!;
    return {
      month: m, part: "trend", kpi: r.code, label: r.label, unit: r.unit, value: r.value, compare_value: null, min_8m: r.min, max_8m: r.max,
      delta_pct: null, threshold: null, status: r.status, explanation: r.note, explanation_required: false,
      ...trace(RULE.trend, `CEK KEWAJARAN!M${def.wpRow}`, { value: r.value, min: r.min, max: r.max }, {
        value: wpTrendRef(m, def.wpRow) ?? undefined, min: `CEK KEWAJARAN!K${def.wpRow}`, max: `CEK KEWAJARAN!L${def.wpRow}`,
      }),
    };
  });
  const mm: ReasonablenessRow[] = mom.map((r) => {
    const def = MOM_KPIS.find((k) => k.code === r.code)!;
    return {
      month: m, part: "mom", kpi: r.code, label: r.label, unit: r.unit, value: r.current, compare_value: r.prior, min_8m: null, max_8m: null,
      delta_pct: r.deltaPct, threshold: r.threshold, status: r.status, explanation: r.explanation, explanation_required: r.status === "CEK",
      ...trace(RULE.mom, `CEK KEWAJARAN!F${def.wpRow}`, { current: r.current, prior: r.prior }, { current: momRefs?.[r.code] ?? `CEK KEWAJARAN!C${def.wpRow}`, prior: `CEK KEWAJARAN!B${def.wpRow}` }),
    };
  });
  return [...t, ...mm];
}

// ---------------------------------------------------------------------------------------------------------------
// B33 — usage ratio per kg vs the 3 preceding months
// ---------------------------------------------------------------------------------------------------------------

export type UsageItem = "carton" | "hdpe" | "olein";

/** Usage of one month on the FCC card. Karton and olein come with the old-card history; HDPE needs card data per month. */
export interface UsageMonth {
  month: string;
  inputKg: Num;
  carton?: Num | null;
  hdpe?: Num | null;
  olein?: Num | null;
}

export function usageMonthsFromHistory(history: readonly KpiHistoryMonth[]): UsageMonth[] {
  return history.map((h) => ({ month: monthOf(h.month), inputKg: h.inputKg, carton: h.cartonPcs, olein: h.oleinKg, hdpe: h.hdpeKg ?? null }));
}

export interface UsageRatioItem {
  item: UsageItem;
  ratio: Decimal | null;
  average: Decimal | null;
  /** ratio ÷ average − 1 */
  deviation: Decimal | null;
  status: "LULUS" | "PERIKSA" | "BELUM_DIISI";
  months: string[];
}

/** Default band ±15% (PRD Q13 `assumption.bom_band_pct`), 3 preceding months. */
export const USAGE_BAND = new Decimal("0.15");

/**
 * B33: usage per kg masuk proses of karton, HDPE and olein vs the average of the 3 preceding months; outside ±band → PERIKSA.
 * An item without all 3 preceding months (or without this month) is BELUM_DIISI; the control is PERIKSA when any item is,
 * else BELUM_DIISI when any item lacks data, else LULUS.
 */
export function usageRatioControl(months: readonly UsageMonth[], month: string, opts: { band?: Num; window?: number; refs?: Refs } = {}): { control: ControlMonthRow; items: UsageRatioItem[] } {
  const band = opts.band === undefined ? USAGE_BAND : D(opts.band);
  const window = opts.window ?? 3;
  const m = monthOf(month);
  const bm = new Map(months.map((u) => [monthOf(u.month), u]));
  const prior = Array.from({ length: window }, (_, i) => addMonths(m, i - window));
  const perKg = (u: UsageMonth | undefined, item: UsageItem): Decimal | null => {
    const q = u?.[item];
    if (!u || q === null || q === undefined || D(u.inputKg).isZero()) return null;
    return D(q).div(D(u.inputKg));
  };
  const items: UsageRatioItem[] = (["carton", "hdpe", "olein"] as const).map((item) => {
    const cur = perKg(bm.get(m), item);
    const hist = prior.map((p) => perKg(bm.get(p), item));
    if (cur === null || hist.some((x) => x === null)) return { item, ratio: cur, average: null, deviation: null, status: "BELUM_DIISI", months: prior };
    const average = hist.reduce<Decimal>((a, b) => a.plus(b ?? ZERO), ZERO).div(window);
    const deviation = average.isZero() ? null : cur.div(average).minus(1);
    const status = deviation === null ? "BELUM_DIISI" : deviation.abs().gt(band) ? "PERIKSA" : "LULUS";
    return { item, ratio: cur, average, deviation, status, months: prior };
  });
  const status: ControlStatus = items.some((i) => i.status === "PERIKSA") ? "PERIKSA" : items.some((i) => i.status === "BELUM_DIISI") ? "BELUM_DIISI" : "LULUS";
  const worst = items.filter((i) => i.deviation !== null).reduce<UsageRatioItem | null>((a, b) => (!a || b.deviation!.abs().gt(a.deviation!.abs()) ? b : a), null);
  const label: Record<UsageItem, string> = { carton: "karton", hdpe: "HDPE", olein: "olein" };
  const note = items.map((i) => `${label[i.item]}: ${i.status === "BELUM_DIISI" ? "data 3 bulan belum ada" : `${i.deviation!.times(100).toFixed(1)}% vs rata-rata 3 bulan`}`).join("; ");
  const operands: Record<string, Decimal | null> = {};
  for (const i of items) { operands[`${i.item}Ratio`] = i.ratio; operands[`${i.item}Average`] = i.average; }
  return {
    items,
    control: {
      month: m, code: "B33", label: "Rasio pemakaian per kg (karton, HDPE, olein) vs rata-rata 3 bulan", value: worst?.deviation ?? null, tolerance: band, status, note,
      ...trace(RULE.b33, null, operands, opts.refs),
    },
  };
}

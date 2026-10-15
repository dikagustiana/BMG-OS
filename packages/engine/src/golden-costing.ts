/**
 * Golden check of the costing mart against the WP: every `source_refs` entry of every mart row is compared with its
 * WP cell (PRD v2 §5.4; CLAUDE.md "golden dari sel WP"). Pure: the caller passes the cells.
 * Ref format: `Sheet!A1`, optionally ` (Rp jt)` (the WP shows the value ÷ 10^6) or ` (−)` (the WP shows it negated).
 * Tolerance by field (CLAUDE.md): Rp 1 for money (Rp/kg included), 0,01 for kg / hours / units, 0,0001 for ratios.
 * `strict` also holds Rp per kg / per unit to 0,0001 (exact WP inputs reach it; the upload path stores money in cents).
 */
import { D, sum, type Decimal } from "./decimal";
import { cellKey, type CellIndex, type GoldenResult } from "./golden";
import type { MonthOutputs } from "./monthly-costing";

export interface RefCheck extends GoldenResult {
  table: string;
  rowKey: string;
  field: string;
}

const RATIO = /(pct|share|_ratio)$|^detail\.(bag_share|machine_hour_share)$/;
const QTY = /(^kg_|_kg$|qty|units|hours|man_hour|kwh|machine_hour|driver_value|equivalent_kg|bagging_kwh|cng_mmbtu)/;
const PER_KG = /(rate|per_kg|cost_per_kg_input)/;

export function toleranceFor(field: string, scaled: boolean, row: Record<string, unknown> = {}, strict = false): Decimal {
  const money = field === "driver_value" && row.driver === "material_value";
  let t = RATIO.test(field) ? D("0.0001") : !money && QTY.test(field) ? D("0.01") : strict && PER_KG.test(field) ? D("0.0001") : D(1);
  if (scaled) t = t.div(1_000_000);
  return t;
}

function getPath(o: unknown, path: string): unknown {
  let cur: unknown = o;
  for (const k of path.split(".")) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

export function parseRef(ref: string): { sheet: string; cell: string; scale: "jt" | null; negate: boolean } {
  const m = /^(.*)!([A-Z]+\d+)( \(Rp jt\)| \(−\))?$/.exec(ref);
  if (!m) throw new Error(`Rujukan sel tidak valid: ${ref}`);
  return { sheet: m[1], cell: m[2], scale: m[3] === " (Rp jt)" ? "jt" : null, negate: m[3] === " (−)" };
}

/** Compare every source_refs entry of the rows with the WP cells. */
export function checkSourceRefs(cells: CellIndex, table: string, rows: readonly Record<string, unknown>[], rowKey: (r: Record<string, unknown>) => string,
  strict = false): RefCheck[] {
  const out: RefCheck[] = [];
  for (const r of rows) {
    const refs = (r.source_refs ?? {}) as Record<string, string>;
    for (const [field, ref] of Object.entries(refs)) {
      const p = parseRef(ref);
      const v = getPath(r, field);
      const c = cells.get(cellKey(p.sheet, p.cell));
      const tol = toleranceFor(field, p.scale === "jt", r, strict);
      const target = { id: `${table}:${rowKey(r)}:${field}`, label: `${table} ${rowKey(r)} ${field}`, sheet: p.sheet, cell: p.cell, expected: "", tolerance: tol.toFixed(), source: "engine" };
      if (v === undefined || v === null) {
        out.push({ table, rowKey: rowKey(r), field, target, actual: c?.value ?? null, diff: null, ok: false, reason: "nilai engine kosong" });
        continue;
      }
      let eng = D(v as Decimal);
      if (p.negate) eng = eng.neg();
      if (p.scale === "jt") eng = eng.div(1_000_000);
      target.expected = eng.toDecimalPlaces(8).toFixed();
      if (!c) { out.push({ table, rowKey: rowKey(r), field, target, actual: null, diff: null, ok: false, reason: "sel tidak ada di cells.csv" }); continue; }
      if (c.type !== "n") { out.push({ table, rowKey: rowKey(r), field, target, actual: c.value, diff: null, ok: false, reason: `sel bukan angka (${c.type})` }); continue; }
      const diff = eng.minus(D(c.value));
      out.push({ table, rowKey: rowKey(r), field, target, actual: c.value, diff, ok: diff.abs().lte(tol) });
    }
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ whole month

/** The mart tables of a month with a readable key per row (for reports and failure messages). */
export function martTables(out: MonthOutputs): { table: string; rows: Record<string, unknown>[]; key: (r: Record<string, unknown>) => string }[] {
  const R = (rows: readonly object[]) => rows as unknown as Record<string, unknown>[];
  return [
    { table: "pool_month", rows: R(out.pool_month), key: (r) => String(r.pool) },
    { table: "idle_month", rows: R([out.idle_month]), key: () => "Unit I" },
    { table: "allocation_month", rows: R(out.allocation_month), key: (r) => `${r.pool}/${r.line}/${r.method}` },
    { table: "process_card_month", rows: R(out.process_card_month), key: (r) => String(r.product) },
    { table: "fg_month", rows: R(out.fg_month), key: (r) => String(r.product_or_sku) },
    { table: "others_month", rows: R(out.others_month), key: (r) => `${r.row_kind}/${r.sku ?? r.others_group ?? "-"}` },
    { table: "summary_month", rows: R(out.summary_month), key: (r) => String(r.line) },
    { table: "control_month", rows: R(out.control_month), key: (r) => `${r.code}/${r.scope ?? "-"}` },
  ];
}

export function checkMart(cells: CellIndex, out: MonthOutputs, strict = false): RefCheck[] {
  return martTables(out).flatMap((t) => checkSourceRefs(cells, t.table, t.rows, t.key, strict));
}

export interface EngineTarget { id: string; label: string; sheet: string; cell: string; value: Decimal; tolerance: string }

/**
 * PRD v2 §10.1 row B2 (and the B2-related cells of fixtures/month-2026-09/prd_targets.json): the engine's number for
 * each target cell. The golden compares them with the WP cell, not with the PRD text.
 */
export function b2TargetValues(out: MonthOutputs): EngineTarget[] {
  const pool = (p: string) => out.pool_month.find((r) => r.pool === p)!;
  const alloc = (l: string) => sum(out.allocation_month.filter((r) => r.line === l && r.method === "actual").map((r) => r.amount));
  const card = (p: string) => out.process_card_month.find((r) => r.product === p)!;
  const fg = (k: string) => out.fg_month.find((r) => r.product_or_sku === k)!;
  const group = (g: string) => out.others_month.find((r) => r.row_kind === "group" && r.others_group === g)!;
  const line = (l: string) => out.summary_month.find((r) => r.line === l)!;
  const T = (id: string, label: string, ref: string, value: Decimal, tolerance = "1"): EngineTarget => {
    const [sheet, cell] = ref.split("!");
    return { id, label, sheet, cell, value, tolerance };
  };
  const RP = "0.0001";
  return [
    T("B2.pool_total", "Total pool konversi", "BIAYA BERSAMA!C87", sum(out.pool_month.map((r) => r.total))),
    ...["A", "KUPAS", "B", "C", "D", "E"].map((p, i) => T(`B2.pool_${p}`, `Pool ${p}`, `BIAYA BERSAMA!C${81 + i}`, pool(p).total)),
    T("B2.pool_fixed", "Pool tetap", "BIAYA BERSAMA!D87", sum(out.pool_month.map((r) => r.fixed))),
    T("B2.pool_variable", "Pool variabel", "BIAYA BERSAMA!E87", sum(out.pool_month.map((r) => r.variable))),
    T("B2.alloc_FCC", "Alokasi ke FCC", "BIAYA BERSAMA!C121", alloc("FCC")),
    T("B2.alloc_UU", "Alokasi ke UU", "BIAYA BERSAMA!D121", alloc("UU")),
    T("B2.alloc_UO", "Alokasi ke UO", "BIAYA BERSAMA!E121", alloc("UO")),
    T("B2.alloc_LAIN", "Alokasi ke Lain-lain", "BIAYA BERSAMA!F121", alloc("LAIN")),
    T("B2.fcc_cost", "FCC biaya produksi", "FCC!E66", card("FCC").total_cost),
    T("B2.fcc_cost_per_kg", "FCC biaya produksi per kg", "FCC!F66", card("FCC").cost_per_kg_input, RP),
    T("B2.fcc_rate", "FCC biaya rata-rata tertimbang per kg", "FCC!D76", card("FCC").rate_per_kg, RP),
    T("B2.fcc_hpp", "FCC HPP", "FCC!E104", fg("FCC").cogs_total),
    T("B2.fcc_transfer", "FCC transfer ke Lain-lain", "FCC!E91", fg("FCC").value_transfer),
    T("B2.uu_hpp", "UU HPP", "UU!E98", fg("UU").cogs_total),
    T("B2.uo_hpp", "UO HPP", "UO!E94", fg("UO").cogs_total),
    T("B2.others_cost", "Lain-lain biaya produksi", "LAIN-LAIN!G68", line("LAIN").total_cost),
    T("B2.cemcem_ori_cost", "Cem-cem ORI biaya produksi", "LAIN-LAIN!G47", group("CEMCEM_ORI").total),
    T("B2.others_hpp", "HPP Lain-lain", "LAIN-LAIN!G93", line("LAIN").cogs),
    T("B2.idle_hours", "Jam menganggur Unit I", "BIAYA BERSAMA!C107", out.idle_month.idle_hours, "0.01"),
    T("B2.idle_cost", "Biaya jam menganggur", "BIAYA BERSAMA!C109", out.idle_month.idle_cost),
    T("B2.idle_period", "Jam menganggur ke beban periode", "BIAYA BERSAMA!C111", out.idle_month.period_charge),
    T("B2.b21_card", "B21 FG masuk kartu (kg)", "FCC!B87", fg("FCC").qty_in, "0.01"),
    T("B2.b21_accurate", "B21 FG masuk Accurate (kg)", "FCC!C206", fg("FCC").accurate.qty_in ?? D(0), "0.01"),
    T("B2.b22_card", "B22 transfer kartu (kg)", "FCC!B91", fg("FCC").qty_transfer, "0.01"),
    T("B2.b22_accurate", "B22 transfer Accurate (kg)", "FCC!C207", fg("FCC").accurate.qty_transfer ?? D(0), "0.01"),
    T("B2.production_kg", "Produksi total (kg)", "RINGKASAN!F7", line("TOTAL").kg_production, "0.01"),
    T("B2.cost_total", "Total biaya produksi (Rp jt)", "REKON & KONTROL!F12", line("TOTAL").total_cost.div(1_000_000), "0.000001"),
    T("B2.hpp_total", "HPP kartu semua produk (Rp jt)", "RINGKASAN!B29", line("TOTAL").cogs.div(1_000_000), "0.000001"),
    T("B2.revenue_total", "Pendapatan (Rp jt)", "RINGKASAN!F11", line("TOTAL").revenue.div(1_000_000), "0.000001"),
  ];
}

/** Engine number vs WP cell for every B2 target. `target.expected` = engine, `actual` = WP. */
export function checkB2Targets(cells: CellIndex, out: MonthOutputs): GoldenResult[] {
  return b2TargetValues(out).map((t) => {
    const target = { id: t.id, label: t.label, sheet: t.sheet, cell: t.cell, expected: t.value.toDecimalPlaces(8).toFixed(), tolerance: t.tolerance, source: "engine" };
    const c = cells.get(cellKey(t.sheet, t.cell));
    if (!c || c.type !== "n") return { target, actual: c?.value ?? null, diff: null, ok: false, reason: "sel WP tidak ada / bukan angka" };
    const diff = t.value.minus(D(c.value));
    return { target, actual: c.value, diff, ok: diff.abs().lte(D(t.tolerance)) };
  });
}

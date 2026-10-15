import type { ParsedRow } from "../tables";
import { scale, type DbRow, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";
import { cell, sheetByName, type Sheet } from "../workbook";
import { numberToString, serialToISO } from "../values";
import type { Cell } from "../values";

/**
 * BP "Business Plan - Model Details" → budget_line (one per row × month) and the draft budget_pool_map.
 * Same rules as scripts/extract_fixtures.py extract_budget (Fase 0); its output fixtures/budget-v1 is the golden.
 */
export const def: KindDef = {
  kind: "budget_bp", label: "Business Plan (BP) — Model Details", source: "BP", target: "budget_line, budget_pool_map",
  description: "Workbook BP asli. Setiap baris angka × 24 bulan → budget_line (driver_code = produk|komponen|YYYY-MM); baris pool 4.1/4.3 → budget_pool_map draft. Periode = nama versi budget.",
  roles: ["admin", "finance"], cadence: "version",
  fields: [F("component", "Komponen", "text", [])],
};

const SHEET = "Business Plan - Model Details";
const PRODUCT_WORDS: [string, RegExp][] = [
  ["FCC", /flat chip cassava|\bfcc\b/i], ["UU", /ubi ungu/i], ["UO", /ubi orange/i], ["LAIN", /lain-lain|\bothers?\b/i],
];
const POOL_IN_LABEL = /\bGrup ([A-E])\b/;

export interface BpRow {
  bp_row: number;
  product: string | null;
  component: string;
  unit: string | null;
  maps_to: "qty" | "price" | "amount" | null;
  driver_code_base: string;
  bp_label: string;
  values: Record<string, string>;
}
export interface BpPoolRow { bp_row_code: string; bp_label: string; pool: string; fixed_pct: null; bp_row: number }
export interface BpMonth { month: string; column_kind: "actual" | "plan" }

export function slug(s: string): string {
  return s.toLowerCase().replace(/&/g, " dan ").replace(/%/g, " pct ").replace(/[^a-z0-9.]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}

function productOf(text: string): string | null {
  for (const [code, rx] of PRODUCT_WORDS) if (rx.test(text)) return code;
  return null;
}

const isNum = (v: Cell): v is number => typeof v === "number" && Number.isFinite(v);
const str = (v: Cell): string => (typeof v === "number" ? numberToString(v) : String(v));
const blank = (v: Cell) => v === null || v === "";

/** Parse the Model Details sheet exactly like the Fase 0 extractor. */
export function parseBp(sheets: Sheet[]): { months: BpMonth[]; rows: BpRow[]; poolMap: BpPoolRow[] } {
  const ws = sheetByName(sheets, SHEET);
  if (!ws) throw new Error(`Sheet "${SHEET}" tidak ditemukan`);
  const months: { col: number; month: string; kind: "actual" | "plan" }[] = [];
  for (let c = 10; c < 34; c++) {
    const h = cell(ws, 4, c);
    if (!isNum(h)) throw new Error(`Judul bulan BP baris 4 kolom ${c} bukan tanggal: ${String(h)}`);
    const kind = String(cell(ws, 3, c) ?? "").trim().toLowerCase() === "actual" ? "actual" : "plan";
    months.push({ col: c, month: serialToISO(h).slice(0, 7), kind });
  }
  let L1: string | null = null, L2: string | null = null, L3: string | null = null;
  const rows: BpRow[] = [];
  const pool = new Map<string, BpPoolRow>();
  const seen = new Map<string, number>();
  for (let r = 5; r <= ws.rows.length; r++) {
    const labels = new Map<number, Cell>();
    for (let c = 1; c <= 8; c++) { const v = cell(ws, r, c); if (!blank(v)) labels.set(c, v); }
    const unit = cell(ws, r, 9);
    const nums = months.map((m) => ({ ...m, v: cell(ws, r, m.col) })).filter((m) => isNum(m.v));
    const after = (from: number) => [...labels.keys()].filter((c) => c > from).sort((a, b) => a - b).map((c) => str(labels.get(c)!).trim());
    let label: string | null;
    if (labels.has(1)) {
      L1 = `${str(labels.get(1)!)} ${labels.has(2) ? str(labels.get(2)!) : ""}`.trim();
      L2 = L3 = null;
      label = null;
    } else if (labels.has(3)) {
      L2 = labels.has(2) ? `${str(labels.get(2)!)} ${str(labels.get(3)!)}`.trim() : str(labels.get(3)!).trim();
      L3 = null;
      label = after(3).join(" / ") || null;
    } else if (labels.has(4)) {
      const d = str(labels.get(4)!);
      const rest = after(4).join(" / ");
      if (d.startsWith(" ") && L3) label = `${L3} / ${d.trim()}`;
      else { L3 = rest ? `${d.trim()} / ${rest}` : d.trim(); label = L3; }
    } else if (labels.size) {
      label = [...labels.keys()].sort((a, b) => a - b).map((c) => str(labels.get(c)!).trim()).join(" / ");
    } else label = null;
    if (!nums.length) continue;
    const name = label || L3 || L2 || L1 || `row ${r}`;
    const path: string[] = [];
    for (const p of [L1, L2, name]) if (p && (!path.length || p !== path[path.length - 1])) path.push(p);
    const u = blank(unit) ? "" : str(unit!).trim();
    let component = (path.length > 1 ? path.slice(1) : path).map(slug).join(".") + (blank(unit) ? "" : `.${slug(str(unit!))}`);
    const product = label ? productOf(name) : null;
    let base = `${product ?? "ALL"}|${component}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    if (n > 1) { component = `${component}#${n}`; base = `${product ?? "ALL"}|${component}`; }
    const uu = u.toUpperCase();
    const maps_to = ["KG", "KWH", "MMBTU", "JAM", "PEOPLE"].includes(uu) ? "qty" : ["IDR/KG", "IDR"].includes(uu) ? "price"
      : ["IDR MIL", "IDR MIO"].includes(uu) ? "amount" : null;
    rows.push({
      bp_row: r, product, component, unit: u || null, maps_to, driver_code_base: base, bp_label: path.join(" > "),
      values: Object.fromEntries(nums.map((m) => [m.month, numberToString(m.v as number)])),
    });
    const mp = POOL_IN_LABEL.exec(name);
    if (mp && (L2 ?? "").match(/^(4\.1|4\.3)/)) pool.set(component, { bp_row_code: component, bp_label: path.join(" > "), pool: mp[1], fixed_pct: null, bp_row: r });
  }
  return {
    months: months.map((m) => ({ month: `${m.month}-01`, column_kind: m.kind })),
    rows,
    poolMap: [...pool.values()].sort((a, b) => a.bp_row - b.bp_row),
  };
}

/** One budget_line per (row, month). Money in the BP is full Rupiah despite the "IDR Mil" label (B-005). */
export function expandBp(bp: ReturnType<typeof parseBp>): DbRow[] {
  const kindOf = new Map(bp.months.map((m) => [m.month.slice(0, 7), m.column_kind]));
  const out: DbRow[] = [];
  for (const r of bp.rows) {
    for (const [m, v] of Object.entries(r.values)) {
      out.push({
        month: `${m}-01`, product: r.product, component: r.component, unit: r.unit, value: scale(v, 10),
        qty: r.maps_to === "qty" ? scale(v, 4) : null, price: r.maps_to === "price" ? scale(v, 4) : null,
        amount: r.maps_to === "amount" ? scale(v, 2) : null, driver_code: `${r.driver_code_base}|${m}`,
        bp_column_kind: kindOf.get(m) ?? null, bp_row: r.bp_row, bp_label: r.bp_label,
      });
    }
  }
  return out;
}

export const budgetBp: KindParser = {
  def,
  parse(sheets, ctx) {
    const bp = parseBp(sheets);
    const lines = expandBp(bp);
    const rows: ParsedRow[] = bp.rows.map((r) => ({ rowNo: r.bp_row, values: { component: r.component }, issues: [] }));
    return {
      detected: { sheet: SHEET, headerRow: 4, columns: [], mapping: {}, score: 1 }, fields: def.fields, rows,
      sets: [
        { target: "budget_line", rows: lines },
        { target: "budget_pool_map", rows: bp.poolMap.map((p) => ({ bp_row_code: p.bp_row_code, bp_label: p.bp_label, pool: p.pool, fixed_pct: null, confirmed: false })) },
      ],
      issues: [`${bp.rows.length} baris BP × ${bp.months.length} bulan → ${lines.length} baris budget untuk versi "${ctx.period}"`],
    };
  },
};

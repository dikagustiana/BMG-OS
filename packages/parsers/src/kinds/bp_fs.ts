import { bpFsHistory, type BpSheetColumn, type BpSheetRow } from "@bmg/engine";
import type { KindParser } from "../kind";
import type { ParsedRow } from "../tables";
import { F, type KindDef } from "../tables";
import { cell, sheetByName, type Sheet } from "../workbook";
import { numberToString, serialToISO, type Cell } from "../values";

/**
 * BP sheet "BMG Business Plan" (PRD v2 §6.1 `bp_fs`, D13): laba rugi, modal kerja, arus kas, neraca. Column Actual
 * (Jan–Agu 2026) → history_fs_line; column BP (Sep-26–Des-27) → budget_fs_line of the version named as the period.
 * Rows are found by label in sheet order (engine `matchBpRows`), so inserted rows in a later BP do not shift lines.
 */
export const def: KindDef = {
  kind: "bp_fs", label: "Business Plan — neraca, laba rugi, arus kas", source: "BP", target: "history_fs_line, budget_fs_line",
  description: "Workbook BP, sheet \"BMG Business Plan\". Kolom Actual menjadi riwayat neraca dan laba rugi; kolom BP menjadi pembanding versi budget ini. Periode = nama versi budget.",
  roles: ["admin", "finance"], cadence: "version",
  fields: [F("line", "Baris", "text", [])],
};

const SHEET = "BMG Business Plan";
const isNum = (v: Cell): v is number => typeof v === "number" && Number.isFinite(v);
const blank = (v: Cell) => v === null || v === "";

export function readBpFsSheet(sheets: Sheet[]): { rows: BpSheetRow[]; columns: BpSheetColumn[]; columnIndex: Map<string, number> } {
  const ws = sheetByName(sheets, SHEET);
  if (!ws) throw new Error(`Sheet "${SHEET}" tidak ditemukan`);
  const columns: BpSheetColumn[] = [];
  const columnIndex = new Map<string, number>();
  const width = Math.max(...ws.rows.slice(0, 6).map((r) => r?.length ?? 0));
  for (let c = 1; c <= width; c++) {
    const h = cell(ws, 5, c);
    const kind = String(cell(ws, 4, c) ?? "").trim().toLowerCase();
    if (!isNum(h) || (kind !== "actual" && kind !== "bp")) continue;
    const month = `${serialToISO(h).slice(0, 7)}-01`;
    columns.push({ month, kind });
    columnIndex.set(month.slice(0, 7), c);
  }
  if (!columns.length) throw new Error(`Sheet "${SHEET}": tidak ada kolom bulan berlabel Actual/BP di baris 4–5`);
  const rows: BpSheetRow[] = [];
  for (let r = 7; r <= ws.rows.length; r++) {
    const label = [1, 2, 3, 4, 5, 6, 7].map((c) => cell(ws, r, c)).filter((v) => !blank(v)).map((v) => String(v).trim()).filter(Boolean).join(" | ");
    const values: Record<string, string> = {};
    for (const [ym, c] of columnIndex) {
      const v = cell(ws, r, c);
      if (isNum(v)) values[ym] = numberToString(v);
    }
    if (label || Object.keys(values).length) rows.push({ r, label, values });
  }
  return { rows, columns, columnIndex };
}

export const bpFs: KindParser = {
  def,
  parse(sheets, ctx) {
    const sheet = readBpFsSheet(sheets);
    const h = bpFsHistory(sheet.rows, sheet.columns, sheet.columnIndex);
    const history = [...h.actual].flatMap(([month, lines]) => [...lines].map(([code, amount]) => ({
      month, fs_line_code: code, amount: amount.toFixed(2), source: "bp_fs_actual", source_ref: h.cells.get(`${month}|${code}`) ?? null,
      line_key: `bp_fs_actual|${code}`,
    })));
    const budget = [...h.bp].flatMap(([month, lines]) => [...lines].map(([code, amount]) => ({
      month, fs_line_code: code, amount: amount.toFixed(2), source_ref: h.cells.get(`${month}|${code}`) ?? null, line_key: code,
    })));
    const rows: ParsedRow[] = sheet.rows.map((r) => ({ rowNo: r.r, values: { line: r.label }, issues: [] }));
    const months = (m: Map<string, unknown>) => [...m.keys()].sort();
    const a = months(h.actual), b = months(h.bp);
    const span = (x: string[]) => (x.length ? `${x[0].slice(0, 7)} s.d. ${x[x.length - 1].slice(0, 7)}` : "tidak ada");
    return {
      detected: { sheet: SHEET, headerRow: 5, columns: [], mapping: {}, score: 1 }, fields: def.fields, rows,
      sets: [{ target: "history_fs_line", rows: history }, { target: "budget_fs_line", rows: budget }],
      issues: [
        `Aktual ${span(a)} (${a.length} bulan) → riwayat; BP ${span(b)} (${b.length} bulan) → pembanding versi "${ctx.period}"`,
        ...(h.missing.length ? [`${h.missing.length} baris tidak ditemukan di sheet: ${h.missing.slice(0, 12).map((d) => d.label_en).join("; ")}${h.missing.length > 12 ? "; …" : ""}`] : []),
      ],
    };
  },
};

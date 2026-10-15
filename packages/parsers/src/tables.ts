/**
 * Tabular uploads (PRD v1 §5). Header rows are detected from column-name aliases (Indonesian and English
 * Accurate labels and the BMG templates' own headers); the wizard can override the detected column for any field.
 *
 * Fase 0 ships the generic machinery only: `KINDS` is empty and every parser is added with its own fixture in Fase 1
 * (gl_month, gl_voucher_tag, payroll_month, inventory_valuation, sales_by_item, average_price, cogm_card, fs_control,
 * budget_bp, std_master) and later phases (sales_forecast, material_price, plant_daily).
 */
import type { Role } from "@bmg/engine";
import type { Sheet } from "./workbook";
import { isBlank, norm, parseDate, parseNumber, text, type Cell } from "./values";

/** Upload kinds of PRD §5. A kind is only offered once its parser is registered in KINDS. */
export type UploadKind =
  | "gl_month" | "gl_voucher_tag" | "payroll_month" | "inventory_valuation" | "sales_by_item" | "average_price"
  | "cogm_card" | "fs_control" | "budget_bp" | "std_master" | "sales_forecast" | "material_price" | "plant_daily";

export interface FieldDef {
  field: string;
  label: string;
  aliases: string[];
  required?: boolean;
  type: "date" | "number" | "text";
}

export interface KindDef {
  kind: UploadKind;
  label: string;
  /** Origin of the rows (provenance column `source`). */
  source: "Accurate" | "Ops" | "Manual" | "BP";
  /** Target table(s), for the wizard text. */
  target: string;
  description: string;
  roles: Role[];
  /** Period the upload belongs to. */
  cadence: "month" | "week" | "day" | "version";
  fields: FieldDef[];
}

/** Build a field definition; the label and field name are aliases too. */
export const F = (field: string, label: string, type: FieldDef["type"], aliases: string[], required = false): FieldDef => ({
  field, label, type, aliases: [label, field, ...aliases], required,
});

/** Registered upload kinds. Empty in Fase 0. */
export const KINDS: KindDef[] = [];

export function kindDef(kind: UploadKind, kinds: KindDef[] = KINDS): KindDef {
  const k = kinds.find((x) => x.kind === kind);
  if (!k) throw new Error(`Jenis upload belum tersedia: ${kind}`);
  return k;
}

export function kindsForRole(role: Role, kinds: KindDef[] = KINDS): KindDef[] {
  return kinds.filter((k) => k.roles.includes(role));
}

export type Mapping = Record<string, number | null>;

export interface Detected {
  sheet: string;
  headerRow: number; // 1-based
  columns: string[];
  mapping: Mapping;
  score: number;
}

/** Find the header row and map fields to columns. */
export function detect(sheets: Sheet[], def: Pick<KindDef, "fields">): Detected | null {
  let best: Detected | null = null;
  for (const s of sheets) {
    const limit = Math.min(s.rows.length, 40);
    for (let r = 0; r < limit; r++) {
      const row = s.rows[r] ?? [];
      const cols = row.map((c) => norm(c));
      const mapping: Mapping = {};
      let score = 0;
      const used = new Set<number>();
      for (const f of def.fields) {
        const al = f.aliases.map(norm);
        let idx = cols.findIndex((c, i) => !used.has(i) && c !== "" && al.includes(c));
        if (idx < 0) idx = cols.findIndex((c, i) => !used.has(i) && c !== "" && al.some((a) => a.length >= 4 && c.startsWith(a)));
        mapping[f.field] = idx >= 0 ? idx : null;
        if (idx >= 0) { used.add(idx); score += f.required ? 2 : 1; }
      }
      const reqOk = def.fields.filter((f) => f.required).every((f) => mapping[f.field] !== null);
      if (reqOk && score > 0 && (!best || score > best.score)) {
        best = { sheet: s.name, headerRow: r + 1, columns: row.map((c) => text(c) ?? ""), mapping, score };
      }
    }
  }
  return best;
}

export interface ParsedRow {
  rowNo: number;
  values: Record<string, string | null>;
  issues: string[];
}

/** Extract typed records below the header using a mapping (detected or overridden by the user). */
export function extract(sheets: Sheet[], def: Pick<KindDef, "fields">, d: Detected): ParsedRow[] {
  const s = sheets.find((x) => x.name === d.sheet);
  if (!s) return [];
  const out: ParsedRow[] = [];
  let blankRun = 0;
  for (let r = d.headerRow; r < s.rows.length; r++) {
    const row = s.rows[r] ?? [];
    const cells: Record<string, Cell> = {};
    for (const f of def.fields) {
      const idx = d.mapping[f.field];
      cells[f.field] = idx === null || idx === undefined ? null : (row[idx] ?? null);
    }
    if (Object.values(cells).every(isBlank)) {
      if (++blankRun > 20) break;
      continue;
    }
    blankRun = 0;
    const values: Record<string, string | null> = {};
    const issues: string[] = [];
    for (const f of def.fields) {
      const c = cells[f.field];
      try {
        values[f.field] = f.type === "date" ? parseDate(c) : f.type === "number" ? parseNumber(c) : text(c);
      } catch (e) {
        values[f.field] = null;
        issues.push(`${f.label}: ${(e as Error).message}`);
      }
      if (f.required && values[f.field] === null && !issues.some((i) => i.startsWith(f.label))) issues.push(`${f.label} kosong`);
    }
    // total / subtotal lines in Accurate reports carry no key fields
    const label = Object.values(cells).map((c) => norm(c)).join(" ");
    if (/\b(total|subtotal|grand total|jumlah total)\b/.test(label) && issues.length > 0) continue;
    out.push({ rowNo: r + 1, values, issues });
  }
  return out;
}

/** Stable per-file line keys for idempotent re-uploads: `${key}|${occurrence}`. */
export function lineKeys<T>(rows: T[], key: (r: T) => string): string[] {
  const seen = new Map<string, number>();
  return rows.map((r) => {
    const k = key(r);
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    return `${k}|${n}`;
  });
}

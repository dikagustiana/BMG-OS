import "server-only";
import { D, FS_LINES, addMonths, type Lines } from "@bmg/engine";
import type { FsData } from "./fs-data";
import { bulan } from "./fmt";
import type { ChipItem } from "@/components/ds";

/** Helpers shared by the report pages (PRD v2 §7.1–§7.8). */

export function linesFor(fs: FsData, month: string, basis: "actual" | "bp"): Lines | null {
  const l: Lines = new Map();
  for (const def of FS_LINES) {
    const v = fs.at(month, basis, def.code);
    if (v !== null) l.set(def.code, D(v));
  }
  return l.size ? l : null;
}

/** Month chips: months with data are normal, the selected month is accent, months without data are dimmed. */
export function monthChips(path: (m: string) => string, months: string[], current: string, dim: string[] = []): ChipItem[] {
  const all = [...new Set([...months, ...dim, current])].sort();
  return all.map((m) => ({
    label: bulan(m), href: path(m), on: m === current, dim: !months.includes(m),
    title: months.includes(m) ? undefined : "Belum ada angka aktual",
  }));
}

export const prevMonth = (m: string) => addMonths(m, -1);

/** Number for drawing and display only. */
export const toNum = (v: string | null | undefined): number | null => (v === null || v === undefined ? null : Number(v));

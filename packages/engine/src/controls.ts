/**
 * B1 input controls (PRD v1 §4.6): B01 Σ conversion GL = LK, B02 payroll account = journals, B44 active account
 * mapping for every plant account of the month. Pure: callers pass the rows of the month.
 */
import { D, sum, type Num } from "./decimal";
import { monthEnd } from "./dates";
import type { ControlResult } from "./types";

export interface GlLine { account: string; net: Num }
export interface CoaMapping {
  account: string;
  effective_from: string;
  effective_to: string | null;
  pool: string;
  confirmed: boolean;
}
export interface FsFigure { key: string; amount: Num }
export interface JournalLine { kind: string; amount: Num }

/** Pools that are part of the plant conversion cost (BIAYA BERSAMA bagian 1–3). */
export const CONVERSION_POOLS = ["A", "KUPAS", "B", "C", "D", "E", "THR", "BPJS", "PAYROLL_SPLIT"];
/** LK "biaya konversi pabrik": 5101-002 s/d 5101-016 plus the two plant depreciation accounts booked under 6500. */
export const LK_CONVERSION_EXTRA = ["6500-006", "6500-007"];

/** The mapping in force for an account during a month (latest effective_from wins). */
export function activeMapping(mappings: readonly CoaMapping[], account: string, month: string): CoaMapping | null {
  const end = monthEnd(month);
  const hits = mappings.filter((m) => m.account === account && m.effective_from <= end && (m.effective_to === null || m.effective_to >= month));
  hits.sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
  return hits[0] ?? null;
}

/** An account of the LK conversion line: mapped to a conversion pool, and 5101-* or one of the 6500 plant accounts. */
export function isConversionAccount(account: string, mapping: CoaMapping | null): boolean {
  return !!mapping && CONVERSION_POOLS.includes(mapping.pool) && (account.startsWith("5101-") || LK_CONVERSION_EXTRA.includes(account));
}

const RP1 = D(1);

/** B01: Σ GL of the conversion accounts = LK conversion figure (fs_control.conversion_16), ±Rp 1. */
export function b01(month: string, gl: readonly GlLine[], mappings: readonly CoaMapping[], fs: readonly FsFigure[]): ControlResult {
  const label = "Σ GL akun biaya konversi = LK (16 akun)";
  const lk = fs.find((f) => f.key === "conversion_16");
  if (!gl.length || !lk) {
    return { code: "B01", label, value: null, tolerance: RP1, status: "BELUM_DIISI", note: !gl.length ? "GL bulan ini belum diunggah" : "Angka LK biaya konversi belum diunggah" };
  }
  const accounts = [...new Set(gl.map((g) => g.account))].filter((a) => isConversionAccount(a, activeMapping(mappings, a, month)));
  const total = sum(gl.filter((g) => accounts.includes(g.account)).map((g) => D(g.net)));
  const diff = total.minus(D(lk.amount));
  return {
    code: "B01", label, value: diff, tolerance: RP1, status: diff.abs().lte(RP1) ? "LULUS" : "GAGAL",
    note: `GL ${total.toFixed(2)} (${accounts.length} akun) − LK ${D(lk.amount).toFixed(2)}`,
  };
}

/** B02: GL of the payroll account(s) (mapping PAYROLL_SPLIT; Sep-26: 5101-002) = Σ payroll journals, ±Rp 1. */
export function b02(month: string, gl: readonly GlLine[], mappings: readonly CoaMapping[], journals: readonly JournalLine[]): ControlResult {
  const label = "GL upah pabrik (5101-002) = jurnal upah harian + gaji staf + tali asih";
  const accounts = [...new Set(gl.map((g) => g.account))].filter((a) => activeMapping(mappings, a, month)?.pool === "PAYROLL_SPLIT");
  if (!gl.length || !journals.length || !accounts.length) {
    return {
      code: "B02", label, value: null, tolerance: RP1, status: "BELUM_DIISI",
      note: !gl.length ? "GL bulan ini belum diunggah" : !journals.length ? "Jurnal payroll belum diunggah" : "Tidak ada akun ber-mapping PAYROLL_SPLIT di GL bulan ini",
    };
  }
  const glTotal = sum(gl.filter((g) => accounts.includes(g.account)).map((g) => D(g.net)));
  const jTotal = sum(journals.map((j) => D(j.amount)));
  const diff = glTotal.minus(jTotal);
  return {
    code: "B02", label, value: diff, tolerance: RP1, status: diff.abs().lte(RP1) ? "LULUS" : "GAGAL",
    note: `GL ${accounts.join(", ")} ${glTotal.toFixed(2)} − jurnal ${jTotal.toFixed(2)}`,
  };
}

export interface MappingGap { missing: string[]; draft: string[]; scope: string[] }

/** Accounts B44 covers: GL accounts starting with 5 (COGS/COGM), the 6500 plant accounts of the LK line, and every account carrying a voucher tag. */
export function mappingGaps(month: string, glAccounts: readonly string[], taggedAccounts: readonly string[], mappings: readonly CoaMapping[]): MappingGap {
  const scope = [...new Set([...glAccounts.filter((a) => a.startsWith("5") || LK_CONVERSION_EXTRA.includes(a)), ...taggedAccounts])].sort();
  const missing: string[] = [], draft: string[] = [];
  for (const a of scope) {
    const m = activeMapping(mappings, a, month);
    if (!m) missing.push(a);
    else if (!m.confirmed) draft.push(a);
  }
  return { missing, draft, scope };
}

/** B44: an active coa_pool_map row for every account in scope; draft (unconfirmed) mappings are PERIKSA. */
export function b44(month: string, glAccounts: readonly string[], taggedAccounts: readonly string[], mappings: readonly CoaMapping[]): ControlResult {
  const label = "Mapping akun aktif untuk setiap akun pabrik bulan ini";
  if (!glAccounts.length) return { code: "B44", label, value: null, tolerance: null, status: "BELUM_DIISI", note: "GL bulan ini belum diunggah" };
  const g = mappingGaps(month, glAccounts, taggedAccounts, mappings);
  if (g.missing.length) return { code: "B44", label, value: D(g.missing.length), tolerance: null, status: "GAGAL", note: `Tanpa mapping: ${g.missing.join(", ")}` };
  if (g.draft.length) return { code: "B44", label, value: D(g.draft.length), tolerance: null, status: "PERIKSA", note: `Mapping draft (belum dikonfirmasi): ${g.draft.join(", ")}` };
  return { code: "B44", label, value: D(0), tolerance: null, status: "LULUS", note: `${g.scope.length} akun ber-mapping aktif` };
}

import "server-only";
import { FS_LINES } from "@bmg/engine";
import type { Supa } from "./supabase";
import { readAll, stateOf, type MartState } from "./mart";

/** Data of the FS pages (PRD v2 §7.4–§7.5), read from the FS data marts only. */

export interface FsRow { month: string; basis: "actual" | "bp"; fs_line_code: string; amount: string; source_kind: string; source_ref: string | null; rule_id: string }
export interface NwcRow { month: string; basis: "actual" | "bp"; trade_receivables: string; inventories: string; trade_payables: string; nwc: string; delta_nwc_cash: string | null; revenue_gross: string | null; cost_of_revenue: string | null; days_in_month: number; dso: string | null; dio: string | null; dpo: string | null }
export interface CfRow { month: string; basis: "actual" | "bp"; line_code: string; amount: string; computed: boolean }
export interface CheckRow { month: string; basis: "actual" | "bp"; code: string; label: string; value: string | null; tolerance: string | null; status: string; note: string | null }

export interface FsData {
  state: MartState;
  message?: string;
  /** month → basis → code → amount */
  at: (month: string, basis: "actual" | "bp", code: string) => string | null;
  ref: (month: string, basis: "actual" | "bp", code: string) => string | null;
  /** Months that have actual / bp statements, ascending. */
  actualMonths: string[];
  bpMonths: string[];
  nwc: NwcRow[];
  cf: CfRow[];
  checks: CheckRow[];
}

/** Summary lines for every month (charts, cards) + every line of the month and the month before. */
export async function loadFs(sb: Supa, month: string, prev: string, extra: string[] = []): Promise<FsData> {
  const summary = FS_LINES.filter((l) => l.summary || l.statement === "wc").map((l) => l.code).concat(["pl.revenue_gross", "pl.net_profit", "bs.other_receivables_related"]);
  const [series, detail, nwc, cf, checks] = await Promise.all([
    readAll<FsRow>((f, t) => sb.from("fs_month").select("month, basis, fs_line_code, amount, source_kind, source_ref, rule_id").in("fs_line_code", summary).is("deleted_at", null).order("month").range(f, t)),
    readAll<FsRow>((f, t) => sb.from("fs_month").select("month, basis, fs_line_code, amount, source_kind, source_ref, rule_id").in("month", [month, prev, ...extra]).is("deleted_at", null).range(f, t)),
    readAll<NwcRow>((f, t) => sb.from("nwc_month").select("month, basis, trade_receivables, inventories, trade_payables, nwc, delta_nwc_cash, revenue_gross, cost_of_revenue, days_in_month, dso, dio, dpo").is("deleted_at", null).order("month").range(f, t)),
    readAll<CfRow>((f, t) => sb.from("cashflow_month").select("month, basis, line_code, amount, computed").eq("month", month).is("deleted_at", null).range(f, t)),
    readAll<CheckRow>((f, t) => sb.from("fs_check_month").select("month, basis, code, label, value, tolerance, status, note").eq("month", month).is("deleted_at", null).order("code").range(f, t)),
  ]);
  const map = new Map<string, FsRow>();
  for (const r of [...series.rows, ...detail.rows]) map.set(`${r.month}|${r.basis}|${r.fs_line_code}`, r);
  const months = (b: string) => [...new Set(series.rows.filter((r) => r.basis === b).map((r) => r.month))].sort();
  const state = stateOf(series, detail, nwc, cf, checks);
  return {
    state, message: [series, detail, nwc, cf, checks].find((r) => r.message)?.message,
    at: (m, b, c) => map.get(`${m}|${b}|${c}`)?.amount ?? null,
    ref: (m, b, c) => map.get(`${m}|${b}|${c}`)?.source_ref ?? null,
    actualMonths: months("actual"), bpMonths: months("bp"),
    nwc: nwc.rows, cf: cf.rows, checks: checks.rows,
  };
}

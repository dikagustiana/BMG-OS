import "server-only";
import {
  D, FS_LINES, FS_RULE, leavesFromTb, rebuildFs, type CoaFsMapRow, type FsMonthSource, type Lines, type TbRow,
} from "@bmg/engine";
import type { Supa } from "./supabase";
import type { Viewer } from "./session";
import { applyChanges, fetchAll, WriteError } from "./write";
import { planByKey } from "./plan";

/**
 * FS rebuild (PRD v2 §3 "Rebuild dan antrian", §4.11): inputs → engine rebuildFs → fs_month, nwc_month,
 * cashflow_month, fs_check_month. Runs after a bp_fs or tb_month commit and from the "Hitung ulang" button. Months
 * with a trial balance use it; Jan–Agu 2026 use the BP Actual history; BP months use the budget lines of the latest
 * version whose FS sheet is imported. Data marts are derived: rows are upserted on (month, line_key) and rows no
 * longer produced are soft-deleted. Written per table in chunks (statement_timeout 8 s, B-012).
 */

type Row = Record<string, unknown>;
const CF_CODES = new Set(FS_LINES.filter((l) => l.statement === "cf").map((l) => l.code));
const CHUNK = 2000;

export async function rebuildFsAll(sb: Supa, viewer: Viewer, reason: string): Promise<string> {
  const q = await sb.from("rebuild_queue").insert({ kind: "month", period: "2026-01-01", reason: `FS: ${reason}`, status: "running", started_at: new Date().toISOString() }).select("id").single();
  const qid = (q.data as { id: string } | null)?.id;
  try {
    const msg = await run(sb);
    if (qid) await sb.from("rebuild_queue").update({ status: "done", finished_at: new Date().toISOString() }).eq("id", qid);
    return msg;
  } catch (e) {
    if (qid) await sb.from("rebuild_queue").update({ status: "failed", error: (e as Error).message.slice(0, 500), finished_at: new Date().toISOString() }).eq("id", qid);
    throw e;
  } finally {
    void viewer;
  }
}

async function run(sb: Supa): Promise<string> {
  type H = { month: string; fs_line_code: string; amount: string; source_ref: string | null; upload_id: string | null };
  type B = H & { budget_version_id: string };
  type T = { month: string; account: string; balance_open: string | null; debit: string; credit: string; balance_close: string; upload_id: string | null };
  const [history, versions, tb, maps, asm] = await Promise.all([
    fetchAll<H>((f, t) => sb.from("history_fs_line").select("month, fs_line_code, amount, source_ref, upload_id").is("deleted_at", null).range(f, t)),
    sb.from("budget_version").select("id, name, fs_imported_at").not("fs_imported_at", "is", null).order("fs_imported_at", { ascending: false }).limit(1),
    fetchAll<T>((f, t) => sb.from("tb_month").select("month, account, balance_open, debit, credit, balance_close, upload_id").is("deleted_at", null).range(f, t)),
    fetchAll<CoaFsMapRow & { deleted_at?: null }>((f, t) => sb.from("coa_fs_map").select("account, effective_from, effective_to, fs_line_code, sign, confirmed").is("deleted_at", null).range(f, t)),
    sb.from("assumption").select("value_num").eq("key", "related_party_pct").is("deleted_at", null).order("effective_from", { ascending: false }).limit(1),
  ]);
  const version = (versions.data ?? [])[0] as { id: string; name: string } | undefined;
  const budget = version
    ? await fetchAll<B>((f, t) => sb.from("budget_fs_line").select("budget_version_id, month, fs_line_code, amount, source_ref, upload_id").eq("budget_version_id", version.id).is("deleted_at", null).range(f, t))
    : [];
  const relPct = D(String((asm.data ?? [])[0]?.value_num ?? "0.1"));

  const sources: FsMonthSource[] = [];
  const inputsOf = new Map<string, Row>();
  const byMonth = <R extends { month: string }>(rows: R[]) => {
    const m = new Map<string, R[]>();
    for (const r of rows) m.set(r.month, [...(m.get(r.month) ?? []), r]);
    return m;
  };
  const tbMonths = byMonth(tb);
  for (const [month, rows] of tbMonths) {
    const tbRows: TbRow[] = rows.map((r) => ({ account: r.account, balance_open: r.balance_open === null ? null : D(r.balance_open), debit: D(r.debit), credit: D(r.credit), balance_close: D(r.balance_close) }));
    const leaves = leavesFromTb(month, tbRows, maps);
    const ref = new Map<string, string>([...leaves.accountsByLine].map(([code, accs]) => [code, `Neraca saldo ${month.slice(0, 7)}: akun ${accs.join(", ")}`]));
    sources.push({ month, basis: "actual", source: "tb_month", lines: leaves.lines, tb: { unmapped: leaves.unmapped, draft: leaves.draft }, sourceRef: ref });
    inputsOf.set(`${month}|actual`, { tb_month_upload: [...new Set(rows.map((r) => r.upload_id))] });
  }
  for (const [month, rows] of byMonth(history)) {
    if (tbMonths.has(month)) continue;
    const lines: Lines = new Map(), cf: Lines = new Map();
    const ref = new Map<string, string>();
    for (const r of rows) {
      (CF_CODES.has(r.fs_line_code) ? cf : lines).set(r.fs_line_code, D(r.amount));
      if (r.source_ref) ref.set(r.fs_line_code, r.source_ref);
    }
    sources.push({ month, basis: "actual", source: "bp_fs_actual", lines, importedCf: cf, sourceRef: ref });
    inputsOf.set(`${month}|actual`, { history_fs_line_upload: [...new Set(rows.map((r) => r.upload_id))] });
  }
  for (const [month, rows] of byMonth(budget)) {
    const lines: Lines = new Map(), cf: Lines = new Map();
    const ref = new Map<string, string>();
    for (const r of rows) {
      (CF_CODES.has(r.fs_line_code) ? cf : lines).set(r.fs_line_code, D(r.amount));
      if (r.source_ref) ref.set(r.fs_line_code, r.source_ref);
    }
    sources.push({ month, basis: "bp", source: "bp_fs_budget", lines, importedCf: cf, budget_version_id: version!.id, sourceRef: ref });
    inputsOf.set(`${month}|bp`, { budget_version: version!.name });
  }
  if (!sources.length) return "Belum ada neraca saldo atau BP untuk dihitung.";

  const out = rebuildFs({ months: sources, relatedPartyPct: relPct });
  const fsRows: Row[] = [], nwcRows: Row[] = [], cfRows: Row[] = [], chkRows: Row[] = [];
  const rule = FS_RULE;
  for (const r of out) {
    const inputs = inputsOf.get(`${r.month}|${r.basis}`) ?? null;
    for (const [code, amount] of r.lines) {
      fsRows.push({
        month: r.month, basis: r.basis, fs_line_code: code, amount: amount.toFixed(2), source_kind: r.source, budget_version_id: r.budget_version_id,
        source_ref: r.sourceRef.get(code) ?? null, rule_id: rule, inputs, line_key: `${r.basis}|${code}`,
      });
    }
    const n = r.nwc;
    nwcRows.push({
      month: r.month, basis: r.basis, trade_receivables: n.trade_receivables.toFixed(2), inventories: n.inventories.toFixed(2), trade_payables: n.trade_payables.toFixed(2),
      nwc: n.nwc.toFixed(2), delta_nwc_cash: n.delta_nwc_cash?.toFixed(2) ?? null, revenue_gross: n.revenue_gross.toFixed(2), cost_of_revenue: n.cost_of_revenue.toFixed(2),
      days_in_month: n.days_in_month, dso: n.dso?.toDecimalPlaces(2).toFixed(2) ?? null, dio: n.dio?.toDecimalPlaces(2).toFixed(2) ?? null, dpo: n.dpo?.toDecimalPlaces(2).toFixed(2) ?? null,
      rule_id: rule, inputs, line_key: r.basis,
    });
    if (r.cf) {
      const computed = r.source === "tb_month";
      for (const [code, amount] of r.cf) cfRows.push({ month: r.month, basis: r.basis, line_code: code, amount: amount.toFixed(2), computed, rule_id: rule, inputs, line_key: `${r.basis}|${code}` });
    }
    for (const c of r.checks) {
      chkRows.push({
        month: r.month, basis: r.basis, code: c.code, label: c.label, value: c.value?.toDecimalPlaces(10).toFixed() ?? null,
        tolerance: c.tolerance?.toFixed() ?? null, status: c.status, note: c.note ?? null, rule_id: rule, inputs, line_key: `${r.basis}|${c.code}`,
      });
    }
  }
  const counts = [
    await replaceAll(sb, "fs_month", fsRows),
    await replaceAll(sb, "nwc_month", nwcRows),
    await replaceAll(sb, "cashflow_month", cfRows),
    await replaceAll(sb, "fs_check_month", chkRows),
  ];
  const changed = counts.reduce((s, c) => s + c, 0);
  const months = [...new Set(out.map((r) => r.month))].sort();
  return `Neraca dihitung ulang: ${months.length} bulan (${months[0].slice(0, 7)} s.d. ${months[months.length - 1].slice(0, 7)}), ${changed} baris berubah.`;
}

/** Upsert a derived table on (month, line_key); rows no longer produced are soft-deleted. Returns rows changed. */
async function replaceAll(sb: Supa, table: string, rows: Row[]): Promise<number> {
  const existing = await fetchAll<Row>((f, t) => sb.from(table).select("*").is("deleted_at", null).range(f, t));
  const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => k !== "month" && k !== "line_key");
  const plan = await planByKey(table, table, existing, rows, (r) => `${String(r.month).slice(0, 10)}|${String(r.line_key)}`, fields);
  try {
    for (let i = 0; i < plan.inserts.length; i += CHUNK) await applyChanges(sb, table, plan.inserts.slice(i, i + CHUNK));
    for (let i = 0; i < plan.updates.length; i += CHUNK) await applyChanges(sb, table, [], plan.updates.slice(i, i + CHUNK));
    for (let i = 0; i < plan.deletes.length; i += CHUNK) await applyChanges(sb, table, [], [], plan.deletes.slice(i, i + CHUNK));
  } catch (e) {
    throw new WriteError(`Hitung ulang ${table} gagal: ${(e as Error).message}`);
  }
  return plan.inserts.length + plan.updates.length + plan.deletes.length;
}

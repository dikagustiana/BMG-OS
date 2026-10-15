import "server-only";
import { activeMapping, b01, b02, b44, mappingGaps, type CoaMapping, type ControlResult } from "@bmg/engine";
import type { Supa } from "./supabase";
import { fetchAll } from "./write";

/** Data of the monthly input page (B1): upload status per kind, stored rows per table, controls B01/B02/B44. */

export const MONTHLY_TABLES = [
  "gl_month", "gl_voucher_tag", "payroll_month", "payroll_journal", "inventory_valuation", "sales_by_item",
  "average_price", "cogm_card", "cogm_material", "driver_month", "fs_control",
] as const;

export interface UploadInfo {
  id: string;
  kind: string;
  status: string;
  file_name: string;
  uploaded_by: string | null;
  uploaded_at: string;
  committed_at: string | null;
  row_count: number;
  inserted: number;
  updated: number;
  deleted: number;
  issues: string[];
}

export interface GapRow {
  account: string;
  name: string | null;
  state: "tanpa mapping" | "draft";
  /** Only in a GL upload that is still waiting (blocked by B44), not in the stored GL. */
  pending: boolean;
  mapping: (CoaMapping & { id: string; note: string | null }) | null;
}

export interface TagRow {
  id: string;
  voucher: string;
  account: string;
  amount: string;
  tag: string;
  target_pool: string;
  target_line: string | null;
  note: string | null;
  source: string | null;
}

export interface InputMonth {
  uploads: UploadInfo[];
  counts: Record<string, number>;
  controls: ControlResult[];
  gaps: GapRow[];
  tags: TagRow[];
}

type MapRow = CoaMapping & { id: string; note: string | null };

export async function loadInputMonth(sb: Supa, month: string): Promise<InputMonth> {
  const [uploads, maps, gl, fs, journals, tags, ...counts] = await Promise.all([
    sb.from("upload").select("id, kind, status, file_name, uploaded_by, uploaded_at, committed_at, row_count, inserted, updated, deleted, issues")
      .eq("period", month).order("uploaded_at", { ascending: false }).limit(200),
    fetchAll<MapRow>((f, t) => sb.from("coa_pool_map").select("id, account, effective_from, effective_to, pool, confirmed, note").is("deleted_at", null).range(f, t)),
    fetchAll<{ account: string; account_name: string | null; net: string }>((f, t) => sb.from("gl_month").select("account, account_name, net").eq("month", month).is("deleted_at", null).range(f, t)),
    sb.from("fs_control").select("key, amount").eq("month", month).is("deleted_at", null),
    sb.from("payroll_journal").select("kind, amount").eq("month", month).is("deleted_at", null),
    sb.from("gl_voucher_tag").select("id, voucher, account, amount, tag, target_pool, target_line, note, source").eq("month", month).is("deleted_at", null).order("account"),
    ...MONTHLY_TABLES.map((t) => sb.from(t).select("id", { count: "exact", head: true }).eq("month", month).is("deleted_at", null)),
  ]);
  // accounts of GL uploads still waiting (B44 blocks a GL whose account has no mapping: show them here to fix)
  const waiting = ((uploads.data ?? []) as UploadInfo[]).filter((u) => u.kind === "gl_month" && u.status === "planned").map((u) => u.id);
  const staged = waiting.length
    ? await fetchAll<{ data: { account?: string; account_name?: string | null } }>((f, t) => sb.from("upload_row").select("data").in("upload_id", waiting).eq("target", "gl_month").range(f, t))
    : [];
  const tagRows = (tags.data ?? []) as TagRow[];
  const fsRows = (fs.data ?? []) as { key: string; amount: string }[];
  const jRows = (journals.data ?? []) as { kind: string; amount: string }[];
  const accounts = [...new Set(gl.map((g) => g.account))];
  const pendingAccounts = [...new Set(staged.map((r) => String(r.data.account ?? "")).filter((a) => a && !accounts.includes(a)))];
  const tagged = [...new Set(tagRows.map((t) => t.account))];
  const g = mappingGaps(month, [...accounts, ...pendingAccounts], tagged, maps);
  const names = new Map([...staged.map((r) => [String(r.data.account), r.data.account_name ?? null] as const), ...gl.map((r) => [r.account, r.account_name] as const)]);
  const pend = (a: string) => pendingAccounts.includes(a);
  const gaps: GapRow[] = [
    ...g.missing.map((a) => ({ account: a, name: names.get(a) ?? null, state: "tanpa mapping" as const, pending: pend(a), mapping: null })),
    ...g.draft.map((a) => ({ account: a, name: names.get(a) ?? null, state: "draft" as const, pending: pend(a), mapping: activeMapping(maps, a, month) as MapRow | null })),
  ];
  return {
    uploads: (uploads.data ?? []) as UploadInfo[],
    counts: Object.fromEntries(MONTHLY_TABLES.map((t, i) => [t, counts[i].count ?? 0])),
    controls: [b01(month, gl, maps, fsRows), b02(month, gl, maps, jRows), b44(month, accounts, tagged, maps)],
    gaps,
    tags: tagRows,
  };
}

export interface BudgetVersionInfo { id: string; name: string; status: string; imported_at: string | null; note: string | null; lines: number }

export async function loadBudgetVersions(sb: Supa): Promise<BudgetVersionInfo[]> {
  const { data } = await sb.from("budget_version").select("id, name, status, imported_at, note").is("deleted_at", null).order("name");
  const rows = (data ?? []) as Omit<BudgetVersionInfo, "lines">[];
  const counts = await Promise.all(rows.map((v) => sb.from("budget_line").select("id", { count: "exact", head: true }).eq("budget_version_id", v.id).is("deleted_at", null)));
  return rows.map((v, i) => ({ ...v, lines: counts[i].count ?? 0 }));
}

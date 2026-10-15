import "server-only";
import { activeFsMap, activeMapping, b01, b02, b44, D, leavesFromTb, mappingGaps, type CoaFsMapRow, type CoaMapping, type ControlResult } from "@bmg/engine";
import type { Supa } from "./supabase";
import { fetchAll } from "./write";

/** Data of the monthly input page (B1): upload status per kind, stored rows per table, controls B01/B02/B44. */

export const MONTHLY_TABLES = [
  "gl_month", "gl_voucher_tag", "payroll_month", "payroll_journal", "inventory_valuation", "sales_by_item",
  "average_price", "cogm_card", "cogm_material", "driver_month", "fs_control", "tb_month",
  "wp_opening", "cogm_legacy",
] as const;

/** Tables each monthly upload kind fills (status block of Input bulanan). */
export const KIND_TABLES: Record<string, (typeof MONTHLY_TABLES)[number][]> = {
  gl_month: ["gl_month"], gl_voucher_tag: ["gl_voucher_tag"], payroll_month: ["payroll_month", "payroll_journal"],
  inventory_valuation: ["inventory_valuation"], sales_by_item: ["sales_by_item"], average_price: ["average_price"],
  cogm_card: ["cogm_card", "cogm_material", "driver_month"], fs_control: ["fs_control"], tb_month: ["tb_month"],
  wp_opening: ["wp_opening"], cogm_legacy: ["cogm_legacy"],
};

/** Monthly kinds that are not part of the "10 upload" gate: the first platform month only (opening values) or a comparison. */
export const OPTIONAL_KINDS: ReadonlySet<string> = new Set(["wp_opening", "cogm_legacy"]);

export interface UploadInfo {
  id: string;
  kind: string;
  status: string;
  file_name: string;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
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

export interface FsGapRow {
  account: string;
  name: string | null;
  state: "tanpa mapping" | "draft";
  pending: boolean;
  mapping: { id: string; fs_line_code: string } | null;
}

export interface InputMonth {
  uploads: UploadInfo[];
  counts: Record<string, number>;
  controls: ControlResult[];
  gaps: GapRow[];
  fsGaps: FsGapRow[];
  tags: TagRow[];
}

type MapRow = CoaMapping & { id: string; note: string | null };

export async function loadInputMonth(sb: Supa, month: string): Promise<InputMonth> {
  const [uploads, maps, gl, fs, journals, tags, ...counts] = await Promise.all([
    sb.from("upload").select("id, kind, status, file_name, uploaded_by, uploaded_by_name, uploaded_at, committed_at, row_count, inserted, updated, deleted, issues")
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
    fsGaps: await fsGaps(sb, month, (uploads.data ?? []) as UploadInfo[]),
    tags: tagRows,
  };
}

export interface BudgetVersionInfo { id: string; name: string; status: string; imported_at: string | null; fs_imported_at: string | null; note: string | null; lines: number }

export async function loadBudgetVersions(sb: Supa): Promise<BudgetVersionInfo[]> {
  const res = await sb.from("budget_version").select("id, name, status, imported_at, fs_imported_at, note").is("deleted_at", null).order("name");
  // fs_imported_at arrives with the FS migration; before it, read the version without it
  const data = res.error ? (await sb.from("budget_version").select("id, name, status, imported_at, note").is("deleted_at", null).order("name")).data?.map((v) => ({ ...v, fs_imported_at: null })) : res.data;
  const rows = (data ?? []) as Omit<BudgetVersionInfo, "lines">[];
  const counts = await Promise.all(rows.map((v) => sb.from("budget_line").select("id", { count: "exact", head: true }).eq("budget_version_id", v.id).is("deleted_at", null)));
  return rows.map((v, i) => ({ ...v, lines: counts[i].count ?? 0 }));
}

type TbData = { account?: string; account_name?: string | null; debit?: string; credit?: string; balance_close?: string; balance_open?: string | null };

/** F07: accounts of the stored or waiting trial balance of the month without an active FS mapping, or with a draft one. */
async function fsGaps(sb: Supa, month: string, uploads: UploadInfo[]): Promise<FsGapRow[]> {
  const waiting = uploads.filter((u) => u.kind === "tb_month" && u.status === "planned").map((u) => u.id);
  const [maps, stored, staged] = await Promise.all([
    fetchAll<CoaFsMapRow & { id: string }>((f, t) => sb.from("coa_fs_map").select("id, account, effective_from, effective_to, fs_line_code, sign, confirmed").is("deleted_at", null).range(f, t)).catch(() => []),
    fetchAll<TbData>((f, t) => sb.from("tb_month").select("account, account_name, debit, credit, balance_close, balance_open").eq("month", month).is("deleted_at", null).range(f, t)).catch(() => []),
    waiting.length ? fetchAll<{ data: TbData }>((f, t) => sb.from("upload_row").select("data").in("upload_id", waiting).eq("target", "tb_month").range(f, t)) : Promise.resolve([]),
  ]);
  const rows = [...stored.map((r) => ({ r, pending: false })), ...staged.map((s) => ({ r: s.data, pending: true }))];
  const tb = rows.map(({ r }) => ({
    account: String(r.account ?? ""), balance_open: r.balance_open ? D(r.balance_open) : null, debit: D(r.debit ?? "0"), credit: D(r.credit ?? "0"), balance_close: D(r.balance_close ?? "0"),
  }));
  const t = leavesFromTb(month, tb, maps);
  const name = new Map(rows.map(({ r }) => [String(r.account), r.account_name ?? null]));
  const pend = new Set(rows.filter((x) => x.pending).map((x) => String(x.r.account)));
  const storedSet = new Set(stored.map((r) => String(r.account)));
  return [
    ...t.unmapped.map((a) => ({ account: a, name: name.get(a) ?? null, state: "tanpa mapping" as const, pending: pend.has(a) && !storedSet.has(a), mapping: null })),
    ...t.draft.map((a) => {
      const m = activeFsMap(maps, a, month) as (CoaFsMapRow & { id: string }) | null;
      return { account: a, name: name.get(a) ?? null, state: "draft" as const, pending: pend.has(a) && !storedSet.has(a), mapping: m ? { id: m.id, fs_line_code: m.fs_line_code } : null };
    }),
  ];
}

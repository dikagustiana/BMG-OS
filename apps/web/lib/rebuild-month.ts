import "server-only";
import { addMonths, martDbRows, rebuildMonthFromRows, type InputRows } from "@bmg/engine";
import type { Supa } from "./supabase";
import type { Viewer } from "./session";
import { fetchAll } from "./write";
import { replaceMonthRows } from "./mart-write";

/**
 * Monthly costing rebuild (PRD v2 §3 "Rebuild dan antrian", §4.1–§4.6): the month's inputs and the masters from the
 * database → engine `rebuildMonthFromRows` → pool, idle, allocation, process card, FG, Lain-lain, summary, control marts.
 * Opening values come from `wp_opening` or, when absent, from the previous month's marts. Runs from the "Hitung ulang"
 * button; every number is computed in @bmg/engine, this file only moves rows.
 */

type Row = Record<string, unknown>;

const MONTH_INPUTS = [
  "gl_month", "gl_voucher_tag", "payroll_month", "payroll_journal", "inventory_valuation", "sales_by_item",
  "cogm_card", "cogm_material", "driver_month", "fs_control", "wp_opening", "cogm_legacy",
] as const;
const MASTERS = ["product", "product_item", "others_group", "sku", "payroll_group", "coa_pool_map", "assumption"] as const;

async function monthTable(sb: Supa, table: string, month: string): Promise<Row[]> {
  return fetchAll<Row>((f, t) => sb.from(table).select("*").eq("month", month).is("deleted_at", null).range(f, t));
}
async function master(sb: Supa, table: string): Promise<Row[]> {
  return fetchAll<Row>((f, t) => sb.from(table).select("*").is("deleted_at", null).range(f, t));
}

/** Capacity rows of the weeks of the month from approved standard versions (Unit I normal capacity hours). */
async function capacityOf(sb: Supa, month: string): Promise<Row[]> {
  const versions = await fetchAll<Row>((f, t) => sb.from("std_version").select("id").eq("status", "approved").is("deleted_at", null).range(f, t));
  if (!versions.length) return [];
  const ids = versions.map((v) => String(v.id));
  const end = addMonths(month, 1);
  return fetchAll<Row>((f, t) => sb.from("capacity").select("week_start, dept, normal_capacity_hours").in("std_version_id", ids)
    .gte("week_start", addMonths(month, 0)).lt("week_start", end).is("deleted_at", null).range(f, t));
}

export async function loadInputRows(sb: Supa, month: string): Promise<InputRows> {
  const [inputs, masters, capacity, priorCards, priorFg] = await Promise.all([
    Promise.all(MONTH_INPUTS.map((t) => monthTable(sb, t, month))),
    Promise.all(MASTERS.map((t) => master(sb, t))),
    capacityOf(sb, month),
    monthTable(sb, "process_card_month", addMonths(month, -1)).catch(() => []),
    monthTable(sb, "fg_month", addMonths(month, -1)).catch(() => []),
  ]);
  const rows: Row = { month };
  MONTH_INPUTS.forEach((t, i) => { rows[t] = inputs[i]; });
  MASTERS.forEach((t, i) => { rows[t] = masters[i]; });
  rows.capacity = capacity;
  rows.prior = { process_card_month: priorCards, fg_month: priorFg };
  rows.wp_template = null;
  return rows as unknown as InputRows;
}

export interface RebuildResult { message: string; issues: string[]; controls: { lulus: number; gagal: number; periksa: number; belum: number } }

export async function rebuildMonth(sb: Supa, viewer: Viewer, month: string, reason: string): Promise<RebuildResult> {
  const q = await sb.from("rebuild_queue").insert({ kind: "month", period: month, reason: `Costing: ${reason}`, status: "running", started_at: new Date().toISOString() }).select("id").single();
  const qid = (q.data as { id: string } | null)?.id;
  try {
    const out = rebuildMonthFromRows(await loadInputRows(sb, month));
    const tables: [string, readonly object[]][] = [
      ["pool_month", out.pool_month], ["idle_month", [out.idle_month]], ["allocation_month", out.allocation_month],
      ["process_card_month", out.process_card_month], ["fg_month", out.fg_month], ["others_month", out.others_month],
      ["summary_month", out.summary_month], ["control_month", out.control_month],
    ];
    let changed = 0;
    for (const [table, rows] of tables) {
      const w = await replaceMonthRows(sb, table, month, martDbRows(table, month, rows));
      changed += w.inserted + w.updated + w.deleted;
    }
    const count = (s: string) => out.control_month.filter((c) => c.status === s).length;
    if (qid) await sb.from("rebuild_queue").update({ status: "done", finished_at: new Date().toISOString() }).eq("id", qid);
    return {
      message: `Costing ${month.slice(0, 7)} dihitung ulang: ${out.process_card_month.length} kartu proses, ${out.others_month.filter((r) => r.row_kind === "sku").length} SKU Lain-lain, ${changed} baris berubah.`,
      issues: out.issues,
      controls: { lulus: count("LULUS"), gagal: count("GAGAL"), periksa: count("PERIKSA"), belum: count("BELUM_DIISI") },
    };
  } catch (e) {
    if (qid) await sb.from("rebuild_queue").update({ status: "failed", error: (e as Error).message.slice(0, 500), finished_at: new Date().toISOString() }).eq("id", qid);
    throw e;
  } finally {
    void viewer;
  }
}

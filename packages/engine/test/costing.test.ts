/**
 * B2 costing on the golden month (PRD v2 §10.1 row B2): every mart row ties to the WP cells its source_refs name, the
 * 34 B2 target cells tie, and the structural rules of each stage hold (pool → idle → allocation → card → FG → Lain-lain).
 */
import { describe, expect, it } from "vitest";
import { D, sum } from "../src/decimal";
import { checkB2Targets, checkMart, martTables } from "../src/golden-costing";
import { rebuildMonthFromRows } from "../src/monthly-costing";
import { serializeMart } from "../src/mart";
import { cells, goldenMonth, goldenRows } from "./costing-helpers";

const out = goldenMonth;

describe("B2 costing — golden month Sep-26", () => {
  it("builds without issues", () => {
    expect(out.issues).toEqual([]);
  });

  it("every source_refs entry of every mart row ties to its WP cell", () => {
    const res = checkMart(cells, out, true);
    const bad = res.filter((r) => !r.ok).map((r) => `${r.table} ${r.rowKey} ${r.field} ${r.target.sheet}!${r.target.cell}: engine ${r.target.expected} vs WP ${r.actual} ${r.reason ?? ""}`);
    expect(bad).toEqual([]);
    expect(res.length).toBeGreaterThan(1400);
  });

  it("the 34 B2 target cells tie", () => {
    const res = checkB2Targets(cells, out);
    expect(res.filter((r) => !r.ok).map((r) => r.target.id)).toEqual([]);
    expect(res).toHaveLength(34);
  });

  it("pool: six pools; fixed + variable = total; Σ pools = BIAYA BERSAMA total", () => {
    expect(out.pool_month.map((p) => p.pool).sort()).toEqual(["A", "B", "C", "D", "E", "KUPAS"]);
    for (const p of out.pool_month) {
      expect(p.fixed.plus(p.variable).minus(p.total).abs().lte(D("0.01"))).toBe(true);
      expect(sum(p.components.map((c) => c.amount)).minus(p.total).abs().lte(D("0.01"))).toBe(true);
    }
  });

  it("allocation (actual method) spreads each pool exactly: Σ lines = pool total (idle period charge aside)", () => {
    const idle = out.idle_month.period_charge;
    const alloc = sum(out.allocation_month.filter((a) => a.method === "actual").map((a) => a.amount));
    const pools = sum(out.pool_month.map((p) => p.total));
    expect(pools.minus(idle).minus(alloc).abs().lte(D(1))).toBe(true);
  });

  it("allocation shares of one pool add to 1", () => {
    for (const pool of ["A", "KUPAS", "B", "C", "D", "E"]) {
      const rows = out.allocation_month.filter((a) => a.pool === pool && a.method === "actual");
      if (!rows.length) continue;
      expect(sum(rows.map((r) => r.driver_share)).minus(1).abs().lte(D("0.0001"))).toBe(true);
    }
  });

  it("process cards: cost accounted = Σ premium + waste + WIP close values (+ KW 2 credit)", () => {
    for (const c of out.process_card_month) {
      const accounted = sum([c.premium_value, c.waste_value, c.wip_close_value]);
      expect(accounted.minus(c.cost_to_account).abs().lte(D(1)), c.product).toBe(true);
    }
  });

  it("Lain-lain: Σ SKU = line total (B15)", () => {
    const skus = out.others_month.filter((r) => r.row_kind === "sku");
    const lain = out.summary_month.find((r) => r.line === "LAIN")!;
    expect(sum(skus.map((r) => r.total)).minus(lain.total_cost).abs().lte(D(1))).toBe(true);
  });

  it("TOTAL summary line = Σ lines", () => {
    const tot = out.summary_month.find((r) => r.line === "TOTAL")!;
    const lines = out.summary_month.filter((r) => r.line !== "TOTAL");
    expect(sum(lines.map((r) => r.total_cost)).minus(tot.total_cost).abs().lte(D("0.01"))).toBe(true);
    expect(sum(lines.map((r) => r.cogs)).minus(tot.cogs).abs().lte(D("0.01"))).toBe(true);
  });

  it("controls: no GAGAL; PERIKSA only where the WP flags it (D3, D4)", () => {
    expect(out.control_month.filter((c) => c.status === "GAGAL").map((c) => `${c.code}/${c.scope}`)).toEqual([]);
    const periksa = out.control_month.filter((c) => c.status === "PERIKSA").map((c) => `${c.code}/${c.scope}`).sort();
    expect(periksa).toEqual(["B21/FCC", "B22/FCC", "B34/UU"]); // D4 (FG vs Accurate) and D3 (WIP awal UU > 3× produksi)
  });

  it("every mart row carries rule_id and inputs; output is deterministic and serialisable", () => {
    for (const t of martTables(out)) for (const r of t.rows) {
      expect(typeof r.rule_id, `${t.table} ${t.key(r)}`).toBe("string");
      expect(Array.isArray(r.inputs)).toBe(true);
    }
    const again = rebuildMonthFromRows(goldenRows());
    expect(JSON.stringify(serializeMart(again))).toBe(JSON.stringify(serializeMart(out)));
    expect(JSON.stringify(serializeMart(out))).not.toMatch(/NaN|Infinity/);
  });
});

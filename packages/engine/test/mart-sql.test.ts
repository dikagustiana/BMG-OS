/** The B2–B4 migrations are the generator's output (no hand edits), and the row mapping covers every column. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { repoRoot } from "../src/fixtures";
import { masterRows } from "../src/fixtures-month";
import { D } from "../src/decimal";
import { MART_SPECS, martDbRows, dbName } from "../src/mart-schema";
import { b2InputsSql, MART_MIGRATIONS, martMigrationSql, rlsCostingSql, type ProductItemSeed } from "../src/mart-sql";
import { goldenMonth } from "./costing-helpers";

const read = (f: string) => readFileSync(join(repoRoot(), "supabase", "migrations", f), "utf8");

describe("B2–B4 migrations", () => {
  it("20261017000100_b2_inputs.sql = b2InputsSql(product_item.json)", () => {
    expect(read("20261017000100_b2_inputs.sql")).toBe(b2InputsSql(masterRows<ProductItemSeed>("product_item")));
  });
  for (const m of MART_MIGRATIONS) {
    it(`${m.file} = martMigrationSql`, () => {
      expect(read(m.file)).toBe(martMigrationSql(m.title, m.tables));
    });
  }
  it("supabase/tests/rls_costing.sql = rlsCostingSql()", () => {
    expect(readFileSync(join(repoRoot(), "supabase", "tests", "rls_costing.sql"), "utf8")).toBe(rlsCostingSql());
  });
  it("every spec is in one migration; no reserved column names", () => {
    expect(MART_MIGRATIONS.flatMap((m) => m.tables).sort()).toEqual(MART_SPECS.map((s) => s.table).sort());
    for (const s of MART_SPECS) for (const c of s.cols) expect(["group", "check", "user", "order"]).not.toContain(dbName(c));
  });
});

describe("martDbRows (costing)", () => {
  const out = goldenMonth;
  const tables: [string, readonly object[]][] = [
    ["pool_month", out.pool_month], ["idle_month", [out.idle_month]], ["allocation_month", out.allocation_month],
    ["process_card_month", out.process_card_month], ["fg_month", out.fg_month], ["others_month", out.others_month],
    ["summary_month", out.summary_month], ["control_month", out.control_month],
  ];
  for (const [table, rows] of tables) {
    it(`${table}: maps every row, unique line_key, decimals as strings`, () => {
      const db = martDbRows(table, "2026-09-01", rows);
      expect(db).toHaveLength(rows.length);
      expect(new Set(db.map((r) => r.line_key)).size).toBe(db.length);
      for (const r of db) {
        expect(r.month).toBe("2026-09-01");
        expect(typeof r.rule_id).toBe("string");
        for (const v of Object.values(r)) expect(v instanceof Object && "toFixed" in (v as object) && (v as object).constructor?.name === "Decimal").toBe(false);
      }
    });
  }
  it("a missing required column throws", () => {
    expect(() => martDbRows("pool_month", "2026-09-01", [{ pool: "A", total: D(1) }])).toThrow(/tidak boleh kosong/);
  });
});

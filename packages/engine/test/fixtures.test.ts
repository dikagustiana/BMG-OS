import { describe, expect, it } from "vitest";
import { loadCells, readFixtureJson } from "../src/fixtures";
import { numericCellCount, SUITES } from "../src/golden-suites";

describe("fixture month-2026-09 (WP Sep26_4)", () => {
  it("has at least 2.500 numeric cells (DoD Fase 0)", () => {
    expect(numericCellCount("month-2026-09")).toBeGreaterThanOrEqual(2500);
  });

  for (const s of SUITES) {
    it(`golden suite ${s.id}: every target equals its WP cell`, () => {
      const bad = s.run("month-2026-09").filter((r) => !r.ok).map((r) => `${r.target.id} ${r.target.sheet}!${r.target.cell}: ${r.actual} vs ${r.target.expected}`);
      expect(bad).toEqual([]);
    });
  }

  it("keeps formulas next to values", () => {
    const c = loadCells("month-2026-09").get("BIAYA BERSAMA!C87");
    expect(c?.type).toBe("n");
    expect(c?.formula).toMatch(/^=/);
  });

  it("splits every WP sheet of the golden month into numbered parts", () => {
    const pool = readFixtureJson<{ sheets: Record<string, Record<string, { first_row: number; rows: unknown[] }>> }>("month-2026-09", "pool.json");
    const parts = Object.keys(pool.sheets["BIAYA BERSAMA"]);
    expect(parts).toEqual(expect.arrayContaining(["1", "2", "3", "4", "5", "6", "6b", "7", "8", "9", "10", "11"]));
    expect(pool.sheets["BIAYA BERSAMA"]["3"].first_row).toBe(54);
  });
});

describe("fixture month-2026-08 (bridge inputs, WP Agu26)", () => {
  it("carries the August bridge inputs used by the September WP", () => {
    const b = readFixtureJson<{ inputs: { code: string; aug: string }[] }>("month-2026-08", "bridge_input.json");
    expect(b.inputs.find((i) => i.code === "REV_T")?.aug).toBe("9793.125452");
    expect(b.inputs).toHaveLength(71);
  });
});

describe("master and budget fixtures", () => {
  const rows = (f: string) => readFixtureJson<{ rows: Record<string, unknown>[] }>("master", f).rows;
  it("master lists from the WP", () => {
    expect(rows("product.json").map((r) => r.code)).toEqual(["FCC", "UU", "UO"]);
    expect(rows("others_group.json")).toHaveLength(21);
    expect(rows("sku.json")).toHaveLength(20);
    expect(rows("material_item.json")).toHaveLength(54);
    expect(rows("payroll_group.json")).toHaveLength(14);
  });
  it("account map: Sep-26 confirmed from the WP, Okt-26 draft for every new account", () => {
    const coa = rows("coa_pool_map.json");
    const sep = coa.filter((r) => r.effective_from === "2026-01-01");
    const okt = coa.filter((r) => r.effective_from === "2026-10-01");
    expect(sep.every((r) => r.confirmed === true)).toBe(true);
    expect(okt.every((r) => r.confirmed === false)).toBe(true);
    for (const a of ["5101-111", "5101-121", "5101-131", "5101-141", "5101-150", "5101-017", "5101-201", "5101-303"]) {
      expect(okt.map((r) => r.account)).toContain(a);
    }
    expect(new Set(coa.map((r) => `${r.account}|${r.effective_from}`)).size).toBe(coa.length);
  });
  it("budget lines carry a driver code per product × component × month, unique", () => {
    const b = readFixtureJson<{ rows: { driver_code_base: string; values: Record<string, string> }[] }>("budget-v1", "budget_line.json");
    const codes = b.rows.flatMap((r) => Object.keys(r.values).map((m) => `${r.driver_code_base}|${m}`));
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain("FCC|3.1_volume_penjualan.ifm_fcc.kg|2026-09");
  });
});

/** Fase 1b upload kinds: bp_fs on the real BP workbook, tb_month on the synthetic Agu-26 TB (fixtures/uploads-fs). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { coaFsSeed, D, FS_LINES, leavesFromTb, sum, withTotals, type MtmAccount, type TbRow } from "@bmg/engine";
import { readFixtureJson, repoRoot } from "@bmg/engine/fixtures";
import { kindParser, readWorkbook, type DbRow } from "../src";

const root = repoRoot();
const set = (res: { sets: { target: string; rows: DbRow[] }[] }, t: string) => res.sets.find((s) => s.target === t)!.rows;
const sheet = readFixtureJson<{ rows: { r: number; values: Record<string, string> }[] }>("budget-v1", "fs_sheet.json");
const juta = (r: number, ym: string) => D(sheet.rows.find((x) => x.r === r)!.values[ym]).times(1e6).toDecimalPlaces(2);

describe("bp_fs (BP v1 sheet BMG Business Plan)", () => {
  const sheets = readWorkbook(readFileSync(join(root, "reference", "BMG_Business_Plan_-_Oct26_to_Dec27.xlsx")), "bp.xlsx");
  const res = kindParser("bp_fs").parse(sheets, { period: "BP Okt-26 v1" });
  const hist = set(res, "history_fs_line");
  const bud = set(res, "budget_fs_line");
  it("finds every fs_line; Actual Jan–Agu → history, BP Sep-26–Des-27 → budget", () => {
    expect(res.issues.join(" ")).not.toMatch(/tidak ditemukan/);
    expect(new Set(hist.map((r) => r.month))).toEqual(new Set(["2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01", "2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01"]));
    expect(new Set(bud.map((r) => r.month)).size).toBe(16);
    expect(new Set(hist.map((r) => `${r.month}|${r.line_key}`)).size).toBe(hist.length);
  });
  it("amounts = sheet × 10^6 (Agu-26 kas, NWC, ekuitas) with the cell as source", () => {
    const at = (code: string) => hist.find((r) => r.month === "2026-08-01" && r.fs_line_code === code)!;
    expect(D(at("bs.cash").amount as string).eq(juta(184, "2026-08"))).toBe(true);
    expect(D(at("wc.nwc").amount as string).eq(juta(130, "2026-08"))).toBe(true);
    expect(D(at("bs.equity").amount as string).eq(juta(262, "2026-08"))).toBe(true);
    expect(at("bs.cash").source_ref).toBe("BMG Business Plan!S184");
    const sep = bud.find((r) => r.month === "2026-09-01" && r.fs_line_code === "pl.revenue")!;
    expect(D(sep.amount as string).eq(juta(17, "2026-09"))).toBe(true);
  });
});

describe("tb_month (synthetic Neraca Saldo Agu-26 from BS/PL Actual MTM)", () => {
  const f = "tb_month.xlsx";
  const sheets = readWorkbook(readFileSync(join(root, "fixtures", "uploads-fs", "2026-08", f)), f);
  const res = kindParser("tb_month").parse(sheets, { period: "2026-08-01" });
  const rows = set(res, "tb_month");
  it("reads every account (no bad rows) with debit-positive balances", () => {
    expect(res.rows.filter((r) => r.issues.length)).toEqual([]);
    expect(rows.length).toBe(261);
    const ctbc = rows.find((r) => r.account === "1102-009")!;
    expect(ctbc.balance_close).toBe("472644312.2");
    const ap = rows.find((r) => r.account === "2101-001")!;
    expect(D(ap.balance_close as string).isNegative()).toBe(true);
  });
  it("through the seeded coa_fs_map: kas 5.222,3 jt, laba Agu = GL, no unmapped account", () => {
    const maps = coaFsSeed(readFixtureJson<{ accounts: MtmAccount[] }>("budget-v1", "coa_mtm.json").accounts).rows;
    const tb: TbRow[] = rows.map((r) => ({
      account: String(r.account), balance_open: r.balance_open === null ? null : D(r.balance_open as string), debit: D(r.debit as string),
      credit: D(r.credit as string), balance_close: D(r.balance_close as string),
    }));
    const t = leavesFromTb("2026-08-01", tb, maps);
    expect(t.unmapped).toEqual([]);
    const l = withTotals(t.lines, true);
    expect(l.get("bs.cash")!.div(1e6).toDecimalPlaces(1).toFixed(1)).toBe("5222.3");
    const gl = sum(tb.filter((r) => /^[4-8]/.test(r.account)).map((r) => r.credit.minus(r.debit)));
    expect(l.get("pl.net_profit")!.minus(gl).abs().lte(1)).toBe(true);
    expect(FS_LINES.length).toBeGreaterThan(150);
  });
  it("rejects nothing silently: a header without accounts is reported", () => {
    const bad = kindParser("tb_month").parse([{ name: "x", rows: [["foo", "bar"], [1, 2]] }], { period: "2026-08-01" });
    expect(bad.issues[0]).toMatch(/tidak ditemukan/);
  });
});

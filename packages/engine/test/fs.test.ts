/**
 * Fase 1b FS (PRD v2 §4.11, §10.1 B8) against the BP v1 sheet "BMG Business Plan" (fixtures/budget-v1/fs_sheet.json)
 * and the account sheets "BS/PL Actual MTM - Aug 26" (fixtures/budget-v1/coa_mtm.json). Golden = sheet cells.
 */
import { describe, expect, it } from "vitest";
import { D, Decimal } from "../src/decimal";
import { readFixtureJson } from "../src/fixtures";
import { FS_LINES, FS_LINE_BY_CODE } from "../src/fs-lines";
import { bpFsHistory, fromJuta, matchBpRows, splitCf, type BpSheetColumn, type BpSheetRow } from "../src/history";
import { cashflow, leavesFromTb, rebuildFs, tieDiffs, withTotals, workingCapital, type CoaFsMapRow, type Lines, type TbRow } from "../src/fs";
import { coaFsSeed, type MtmAccount } from "../src/fs-map-seed";

const sheet = readFixtureJson<{ columns: BpSheetColumn[]; rows: BpSheetRow[] }>("budget-v1", "fs_sheet.json");
const mtm = readFixtureJson<{ accounts: MtmAccount[] }>("budget-v1", "coa_mtm.json").accounts;
const hist = bpFsHistory(sheet.rows, sheet.columns);
const ACTUAL = [...hist.actual.keys()].sort();
const row = (r: number) => sheet.rows.find((x) => x.r === r)!;
const cell = (r: number, ym: string) => fromJuta(row(r).values[ym]);
const RP1 = D(1);
const near = (a: Decimal, b: Decimal, tol = RP1) => a.minus(b).abs().lte(tol);

describe("BP sheet → fs_line", () => {
  it("every fs_line is found in sheet order at its BP v1 row", () => {
    const m = matchBpRows(sheet.rows);
    expect(m.missing.map((d) => d.code)).toEqual([]);
    for (const { def, row: r } of m.matched) expect(r.r, def.code).toBe(def.bp_row);
  });
  it("Actual = Jan–Agu 2026, BP = Sep-26–Des-27 (D13, D14)", () => {
    expect(ACTUAL).toEqual(["2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01", "2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01"]);
    const bp = [...hist.bp.keys()].sort();
    expect(bp[0]).toBe("2026-09-01");
    expect(bp.at(-1)).toBe("2027-12-01");
    expect(bp).toHaveLength(16);
  });
});

describe("totals of the imported months = Σ components (BP formulas)", () => {
  for (const kind of ["actual", "bp"] as const) {
    it(`${kind}: no total differs from its components by more than Rp 1`, () => {
      for (const [m, lines] of hist[kind]) {
        const diffs = tieDiffs(splitCf(lines).statements).map((d) => `${m} ${d.code} ${d.imported.minus(d.computed).toFixed(2)}`);
        expect(diffs, m).toEqual([]);
      }
    });
  }
});

describe("cash flow from two balance sheets (BP rows 134–181)", () => {
  it("Feb–Agu 2026: every cash flow line = sheet ±Rp 1", () => {
    for (let i = 1; i < ACTUAL.length; i++) {
      const prev = splitCf(hist.actual.get(ACTUAL[i - 1])!).statements;
      const cur = splitCf(hist.actual.get(ACTUAL[i])!);
      const cf = cashflow(prev, cur.statements);
      // cf.open/cf.close: BP chains R181 (its own cash flow), the engine opens at the previous balance sheet's cash;
      // the two differ by BP's residual (B-101), so those two lines are checked through F02 instead.
      for (const def of FS_LINES.filter((l) => l.statement === "cf" && l.code !== "cf.open" && l.code !== "cf.close")) {
        const want = cur.cf.get(def.code);
        if (!want) continue;
        expect(near(cf.get(def.code)!, want), `${ACTUAL[i]} ${def.code}: ${cf.get(def.code)} vs ${want}`).toBe(true);
      }
    }
  });
  it("Agu-26: CFO 938,1 · CFI −158,0 · CFF −129,2 · net 650,9 · kas akhir 5.222,3 jt (PRD §4.11)", () => {
    const cf = cashflow(splitCf(hist.actual.get("2026-07-01")!).statements, splitCf(hist.actual.get("2026-08-01")!).statements);
    expect(near(cf.get("cf.cfo")!, cell(161, "2026-08"))).toBe(true);
    expect(near(cf.get("cf.cfi")!, cell(167, "2026-08"))).toBe(true);
    expect(near(cf.get("cf.cff")!, cell(177, "2026-08"))).toBe(true);
    expect(near(cf.get("cf.net")!, cell(179, "2026-08"))).toBe(true);
    expect(cf.get("cf.close")!.minus(cell(184, "2026-08")).abs().lt(1000)).toBe(true); // kas neraca; residu BP Rp 76 (B-101)
    expect(cf.get("cf.close")!.div(1e6).toDecimalPlaces(1).toFixed(1)).toBe("5222.3");
  });
});

describe("working capital (Q26)", () => {
  it("Agu-26: NWC = piutang dagang + persediaan − hutang dagang = row 130 (7.019,8 jt); hari piutang 25,8", () => {
    const l = splitCf(hist.actual.get("2026-08-01")!).statements;
    const w = workingCapital("2026-08-01", l, splitCf(hist.actual.get("2026-07-01")!).statements);
    expect(near(w.nwc, cell(130, "2026-08"))).toBe(true);
    expect(near(w.delta_nwc_cash!, cell(131, "2026-08"))).toBe(true);
    expect(w.nwc.div(1e6).toDecimalPlaces(1).toFixed(1)).toBe("7019.8");
    expect(w.dso!.toDecimalPlaces(1).toFixed(1)).toBe("25.8");
  });
});

describe("rebuildFs on the BP history and budget", () => {
  const months = [
    ...[...hist.actual].map(([month, l]) => ({ month, basis: "actual" as const, source: "bp_fs_actual" as const, lines: splitCf(l).statements, importedCf: splitCf(l).cf })),
    ...[...hist.bp].map(([month, l]) => ({ month, basis: "bp" as const, source: "bp_fs_budget" as const, lines: splitCf(l).statements, importedCf: splitCf(l).cf })),
  ];
  const out = rebuildFs({ months, relatedPartyPct: D("0.1") });
  const check = (m: string, basis: string, code: string) => out.find((r) => r.month === m && r.basis === basis)!.checks.find((c) => c.code === code)!;
  // PRD §10.1 B8: F01–F03 LULUS Jan–Agu at Rp 1. The BP v1 sheet itself is off by Rp 47–201 per month (its net
  // profit, from Model Details, differs from the GL; row 266 shows 0,0 only at Rp juta precision) — B-101.
  it.todo("F01–F03 LULUS ±Rp 1 Jan–Agu (B-101: BP v1 residu Rp 47–201)");
  it("F01/F03 residu BP v1 < Rp 1.000 every month; F02 BP months LULUS", () => {
    for (const r of out) {
      for (const c of ["F01", "F03"]) expect(check(r.month, r.basis, c).value!.abs().lt(1000), `${r.month} ${r.basis} ${c}`).toBe(true);
      if (r.basis === "bp") expect(check(r.month, r.basis, "F02").status, r.month).toBe("LULUS");
      else expect(check(r.month, r.basis, "F02").value!.abs().lt(1000), r.month).toBe(true);
    }
  });
  it("F05 laba tahun berjalan = Σ laba bersih: LULUS Jan–Agu", () => {
    for (const m of ACTUAL) expect(check(m, "actual", "F05").status, m).toBe("LULUS");
  });
  it("F06 piutang pihak berelasi > 10% ekuitas: PERIKSA Jul–Agu, LULUS sebelumnya (Jun 8,6%; PRD menulis Jun–Agu, B-102)", () => {
    const st = ACTUAL.map((m) => `${m.slice(5, 7)}:${check(m, "actual", "F06").status}`);
    expect(st).toEqual(["01:LULUS", "02:LULUS", "03:LULUS", "04:LULUS", "05:LULUS", "06:LULUS", "07:PERIKSA", "08:PERIKSA"]);
  });
  it("Agu-26: kas 5.222,3 · ekuitas 35.641,2 jt", () => {
    const a = out.find((r) => r.month === "2026-08-01" && r.basis === "actual")!;
    expect(a.lines.get("bs.cash")!.div(1e6).toDecimalPlaces(1).toFixed(1)).toBe("5222.3");
    expect(a.lines.get("bs.equity")!.div(1e6).toDecimalPlaces(1).toFixed(1)).toBe("35641.2");
    expect(near(a.lines.get("bs.equity")!, cell(262, "2026-08"))).toBe(true);
  });
});

describe("TB → neraca through coa_fs_map (synthetic Agu-26 TB from BS/PL Actual MTM)", () => {
  const seed = coaFsSeed(mtm);
  const maps: CoaFsMapRow[] = seed.rows.map((r) => ({ ...r }));
  // TB is debit-positive: BS MTM shows liabilities/equity credit-positive, PL MTM shows income credit-positive.
  const credit = (acc: string) => /^[2347]/.test(acc);
  const tbAug: TbRow[] = (() => {
    const out: TbRow[] = [];
    for (const a of mtm) {
      if (!a.kode && !a.mapping) continue;
      const pl = a.sheet.startsWith("PL");
      const toTb = (v: string | undefined) => (credit(a.account) ? D(v ?? "0").neg() : D(v ?? "0"));
      const close = pl ? Object.entries(a.values).filter(([m]) => m <= "2026-08").reduce((s, [, v]) => s.plus(toTb(v)), D(0)) : toTb(a.values["2026-08"]);
      const mv = pl ? toTb(a.values["2026-08"]) : toTb(a.values["2026-08"]).minus(toTb(a.values["2026-07"]));
      out.push({ account: a.account, balance_open: close.minus(mv), debit: mv.gt(0) ? mv : D(0), credit: mv.lt(0) ? mv.neg() : D(0), balance_close: close });
    }
    return out;
  })();
  const tb = leavesFromTb("2026-08-01", tbAug, maps);
  const lines: Lines = withTotals(tb.lines, true);
  const bpAug = splitCf(hist.actual.get("2026-08-01")!).statements;

  it("every account with an amount has an active mapping (F07 LULUS)", () => {
    expect(tb.unmapped).toEqual([]);
  });
  it("balance sheet leaves and totals = BP Agu-26 ±Rp 1 (equity lines: within BP's residual, B-101)", () => {
    const bad: string[] = [];
    for (const def of FS_LINES.filter((l) => l.statement === "bs" && !["bs.current_profit", "bs.equity"].includes(l.code))) {
      const want = bpAug.get(def.code) ?? D(0);
      const got = lines.get(def.code) ?? D(0);
      if (!near(got, want)) bad.push(`${def.code}: TB ${got.toFixed(2)} BP ${want.toFixed(2)}`);
    }
    expect(bad).toEqual([]);
  });
  it("TB balance sheet = GL: aset − (liabilitas + ekuitas) = Rp 1,78 as in BS MTM row 201; laba tahun berjalan 4.712,0 jt; laba bersih = GL", () => {
    // The GL export itself is off by Rp 1,7797 (BS Actual MTM - Aug 26 row 201); a real Accurate TB balances.
    expect(lines.get("bs.net_assets")!.minus(lines.get("bs.equity")!).minus(D("1.7797")).abs().lt(D("0.01"))).toBe(true);
    expect(lines.get("bs.current_profit")!.div(1e6).toDecimalPlaces(1).toFixed(1)).toBe("4712.0");
    const glProfit = tbAug.filter((r) => /^[4-8]/.test(r.account)).reduce((s, r) => s.minus(r.debit).plus(r.credit), D(0));
    expect(near(lines.get("pl.net_profit")!, glProfit)).toBe(true);
    expect(lines.get("pl.net_profit")!.minus(bpAug.get("pl.net_profit")!).abs().lt(1000)).toBe(true); // B-101
    expect(lines.get("bs.equity")!.minus(bpAug.get("bs.equity")!).abs().lt(1000)).toBe(true);
  });
  it("seed: confirmed rows come from the BP Mapping column; Okt-26 accounts are drafts", () => {
    expect(seed.rows.filter((r) => r.confirmed).length).toBeGreaterThan(150);
    const okt = seed.rows.filter((r) => r.effective_from === "2026-10-01");
    expect(okt.every((r) => !r.confirmed)).toBe(true);
    for (const r of seed.rows) expect(FS_LINE_BY_CODE.get(r.fs_line_code)?.kind, r.account).toBe("leaf");
  });
  it("an account without mapping blocks (F07): unknown account with an amount is reported", () => {
    const t = leavesFromTb("2026-09-01", [...tbAug, { account: "1105-777", balance_open: D(0), debit: D(5), credit: D(0), balance_close: D(5) }], maps);
    expect(t.unmapped).toEqual(["1105-777"]);
  });
});

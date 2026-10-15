import { describe, expect, it } from "vitest";
import {
  addMonths, canonicalJson, checkTarget, D, div, fixed, isMonth, monthEnd, monthLabel, monthOf, round0, sha256, toFixedString, type CellIndex,
} from "../src";
import { parseCsv } from "../src/fixtures";

describe("decimal", () => {
  it("money arithmetic is exact (no float drift)", () => {
    expect(D("0.1").plus("0.2").toString()).toBe("0.3");
    expect(D(5562568465.957726).toString()).toBe("5562568465.957726");
    expect(D("1572766737.19").minus("806327113.62").toString()).toBe("766439623.57");
  });
  it("div falls back on zero; round0 is half away from zero; no negative zero", () => {
    expect(div(D(1), D(0)).toString()).toBe("0");
    expect(div(D(1), D(0), D(-1)).toString()).toBe("-1");
    expect(round0(D("2.5")).toString()).toBe("3");
    expect(round0(D("-2.5")).toString()).toBe("-3");
    expect(toFixedString(D("-0.0000001"), 2)).toBe("0.00");
  });
  it("house number format", () => {
    expect(fixed(D("1572766737.19"), 2)).toBe("1.572.766.737,19");
    expect(fixed(D("-121.14819"), 4)).toBe("-121,1482");
  });
});

describe("months", () => {
  it("normalises and steps months", () => {
    expect(isMonth("2026-09")).toBe(true);
    expect(isMonth("2026-09-01")).toBe(true);
    expect(isMonth("2026-09-15")).toBe(false);
    expect(isMonth("2026-13")).toBe(false);
    expect(monthOf("2026-09-30")).toBe("2026-09-01");
    expect(addMonths("2026-09-01", -1)).toBe("2026-08-01");
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-01", -13)).toBe("2024-12-01");
    expect(monthLabel("2026-09-01")).toBe("Sep-26");
    expect(monthLabel("2026-08")).toBe("Agu-26");
    expect(monthEnd("2026-02-01")).toBe("2026-02-28");
  });
});

describe("canonical snapshot", () => {
  it("is independent of key order and serialises decimals at fixed scale", () => {
    const a = canonicalJson({ b: D("1.5"), a: [D(2), null] });
    const b = canonicalJson({ a: [D(2), undefined], b: D("1.50") });
    expect(a).toBe(b);
    expect(a).toContain('"1.500000"');
    expect(sha256(a)).toHaveLength(64);
  });
});

describe("golden helpers", () => {
  const cells: CellIndex = new Map([
    ["BIAYA BERSAMA!C87", { sheet: "BIAYA BERSAMA", cell: "C87", type: "n", value: "1572766737.19", formula: null }],
    ["RINGKASAN!A1", { sheet: "RINGKASAN", cell: "A1", type: "s", value: "RINGKASAN", formula: null }],
  ]);
  const t = { id: "x", label: "pool", sheet: "BIAYA BERSAMA", cell: "C87", expected: "1572766737.19", tolerance: "1", source: "test" };
  it("passes within tolerance, fails outside, reports missing / non-numeric cells", () => {
    expect(checkTarget(cells, t).ok).toBe(true);
    expect(checkTarget(cells, { ...t, expected: "1572766735" }).ok).toBe(false);
    expect(checkTarget(cells, { ...t, cell: "Z1" }).reason).toMatch(/tidak ada/);
    expect(checkTarget(cells, { ...t, sheet: "RINGKASAN", cell: "A1" }).reason).toMatch(/bukan angka/);
  });
  it("parses RFC 4180 CSV", () => {
    expect(parseCsv('a,b\n"x, y","he said ""hi"""\n"multi\nline",2\n')).toEqual([["a", "b"], ["x, y", 'he said "hi"'], ["multi\nline", "2"]]);
  });
});

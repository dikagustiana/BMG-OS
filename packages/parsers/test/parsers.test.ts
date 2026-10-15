import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { detect, extract, F, kindDef, KINDS, lineKeys, parseDate, parseNumber, readWorkbook, type Sheet } from "../src";

/** Build an in-memory xlsx from an array of arrays (what Accurate's "export to Excel" produces). */
function xlsx(rows: unknown[][], name = "Sheet1"): Sheet[] {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return readWorkbook(buf, "export.xlsx");
}

describe("values", () => {
  it("numbers in id-ID and en-US notation, Excel serials and text dates", () => {
    expect(parseNumber("1.234.567,89")).toBe("1234567.89");
    expect(parseNumber("1,234,567.89")).toBe("1234567.89");
    expect(parseNumber("Rp 24.600")).toBe("24600");
    expect(parseNumber("(1.500)")).toBe("-1500");
    expect(parseNumber(-3874.34)).toBe("-3874.34");
    expect(parseNumber("")).toBeNull();
    expect(() => parseNumber("abc")).toThrow();
    expect(parseDate(46296)).toBe("2026-10-01");
    expect(parseDate("30/09/2026")).toBe("2026-09-30");
    expect(parseDate("30 Sep 2026")).toBe("2026-09-30");
    expect(parseDate("1 Agu 2026")).toBe("2026-08-01");
    expect(() => parseDate("31/02/2026")).toThrow();
  });
});

describe("generic header detection", () => {
  const def = {
    fields: [
      F("account", "Akun", "text", ["no akun", "kode akun"], true),
      F("debit", "Debit", "number", ["debet"]),
      F("credit", "Kredit", "number", ["credit"]),
      F("date", "Tanggal", "date", ["tgl"]),
    ],
  };
  it("finds the header below report titles and extracts typed rows; total lines are skipped", () => {
    const sheets = xlsx([
      ["PT Boga Makmur Gracia"], ["Buku Besar"], [],
      ["Tgl", "No. Akun", "Debet", "Kredit"],
      ["01/09/2026", "5101-006", "46.657.860", ""],
      ["02/09/2026", "5101-007", "79400", null],
      ["Total", "", "46737260", ""],
    ]);
    const d = detect(sheets, def);
    expect(d?.headerRow).toBe(4);
    const rows = extract(sheets, def, d!);
    expect(rows).toHaveLength(2);
    expect(rows[0].values).toEqual({ account: "5101-006", debit: "46657860", credit: null, date: "2026-09-01" });
    expect(rows[1].issues).toEqual([]);
  });
  it("returns null when a required column is missing", () => {
    expect(detect(xlsx([["Tanggal", "Debit"], ["01/09/2026", 1]]), def)).toBeNull();
  });
  it("line keys number repeated keys", () => {
    expect(lineKeys(["a", "b", "a"], (x) => x)).toEqual(["a|1", "b|1", "a|2"]);
  });
  it("kinds are registered by Fase 1; unknown kinds are refused", () => {
    expect(KINDS.length).toBeGreaterThan(0);
    expect(() => kindDef("plant_daily")).toThrow(/belum tersedia/);
  });
});

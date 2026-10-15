/** Parsers of the Fase 2–4 inputs: opening values, old CoGM card totals, cost history; the F3 keys of fs_control. */
import { describe, expect, it } from "vitest";
import { kindParser } from "../src";
import type { Sheet } from "../src";

const sheet = (rows: (string | number | null)[][]): Sheet[] => [{ name: "Sheet1", rows }];
const ctx = { period: "2026-09-01" };

describe("wp_opening", () => {
  it("reads WIP per line and FG per item, with a stable key", () => {
    const r = kindParser("wp_opening").parse(sheet([["Lini", "Jenis", "Kode Barang", "Kuantitas", "Nilai", "Satuan"], ["FCC", "WIP", "", 100, 2500000.456, "kg"], ["FCC", "FG", "FG-001", 5000, 120000000, "kg"], ["UU", "Barang jadi", "FG-002", 10, 1000, "kg"]]), ctx);
    expect(r.issues).toEqual([]);
    const rows = r.sets[0].rows;
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ month: "2026-09-01", line: "FCC", kind: "wip", value: "2500000.46" });
    expect(rows.map((x) => x.line_key)).toEqual(["wip|FCC|1", "fg|FG-001|1", "fg|FG-002|1"]);
  });
  it("rejects an unknown kind", () => {
    const r = kindParser("wp_opening").parse(sheet([["Lini", "Jenis", "Kuantitas", "Nilai"], ["FCC", "xyz", 1, 1]]), ctx);
    expect(r.sets[0].rows).toHaveLength(0);
    expect(r.rows[0].issues.join()).toMatch(/Jenis saldo tidak dikenal/);
  });
});

describe("cogm_legacy", () => {
  it("maps component aliases and upper-cases the line", () => {
    const r = kindParser("cogm_legacy").parse(sheet([["Lini", "Komponen", "Jumlah"], ["fcc", "B.1 Material Cost", 100], ["fcc", "Current Cost Added", 50], ["UU", "Upah Kupas", 7]]), ctx);
    expect(r.sets[0].rows.map((x) => `${x.line}/${x.component}`)).toEqual(["FCC/material", "FCC/total", "UU/upah_kupas"]);
  });
  it("rejects a line without a card", () => {
    const r = kindParser("cogm_legacy").parse(sheet([["Lini", "Komponen", "Jumlah"], ["LAIN", "total", 1]]), ctx);
    expect(r.sets[0].rows).toHaveLength(0);
  });
});

describe("history_cost", () => {
  it("keeps each row's own month and rejects a mid-month date", () => {
    const r = kindParser("history_cost").parse(sheet([["Bulan", "Jenis", "Produk", "Kode", "Nilai", "Sumber"], ["2026-01-01", "kartu lama FCC", "FCC", "inputKg", 123456.5, "CEK KEWAJARAN!B42"], ["2026-02-15", "bulan lalu", "FCC", "x", 1, ""]]), { period: "riwayat" });
    expect(r.sets[0].rows).toHaveLength(1);
    expect(r.sets[0].rows[0]).toMatchObject({ month: "2026-01-01", kind: "old_card_fcc", key: "inputKg", value: "123456.5" });
    expect(r.rows[1].issues.join()).toMatch(/tanggal 1/);
  });
});

describe("fs_control (F3 keys)", () => {
  it("accepts the recon keys beside the nine LK figures and does not require them", () => {
    const nine = ["revenue_4101_007", "material_usage", "conversion_16", "cogs", "inv_1106_001_close", "inv_1106_002_open", "inv_1106_002_close", "inv_1106_003_open", "inv_1106_003_close"];
    const r = kindParser("fs_control").parse(sheet([["Kunci", "Nilai"], ...nine.map((k, i) => [k, i + 1]), ["pl_hpp_close", 99]]), ctx);
    expect(r.issues).toEqual([]);
    expect(r.sets[0].rows.map((x) => x.key)).toContain("pl_hpp_close");
  });
});

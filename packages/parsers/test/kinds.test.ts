/**
 * Upload kinds of Fase 1 against the Sep-26 upload fixtures (fixtures/uploads/2026-09, synthesized from WP Sep26_4
 * cells by scripts/make_upload_fixtures.py) and the real BP workbook in reference/. Totals are compared with the WP
 * cells they come from (fixtures/month-2026-09/cells.csv).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { D, sum, type Decimal } from "@bmg/engine";
import { loadCells, repoRoot } from "@bmg/engine/fixtures";
import { expandBp, kindParser, KINDS, parseBp, readWorkbook, type DbRow, type Masters, type Sheet } from "../src";

const root = repoRoot();
const up = (f: string) => readWorkbook(readFileSync(join(root, "fixtures", "uploads", "2026-09", f)), f);
const master = (n: string) => (JSON.parse(readFileSync(join(root, "fixtures", "master", `${n}.json`), "utf8")) as { rows: Record<string, unknown>[] }).rows;
const cells = loadCells("month-2026-09");
const wp = (sheet: string, ref: string) => D(cells.get(`${sheet}!${ref}`)?.value ?? "0");
const total = (rows: DbRow[], f: string, where: (r: DbRow) => boolean = () => true): Decimal => sum(rows.filter(where).map((r) => D(r[f] as string)));
const set = (res: { sets: { target: string; rows: DbRow[] }[] }, t: string) => res.sets.find((s) => s.target === t)!.rows;
const SEP = { period: "2026-09-01" };

const masters: Masters = {
  payrollGroups: master("payroll_group").map((g) => ({ code: String(g.code), name: String(g.name), dept: (g.dept as string | null) ?? null })),
  materialItems: master("material_item").map((m) => ({ code: (m.code as string | null) ?? null, name: String(m.name) })),
  lines: ["FCC", "UU", "UO", "PABRIK", "LAIN", ...master("others_group").map((g) => String(g.code)), ...master("sku").map((s) => String(s.code))],
};

function aoa(sheets: Record<string, unknown[][]>): Sheet[] {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  return readWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer, "t.xlsx");
}

describe("registry", () => {
  it("registers the 10 B1 kinds with PRD §5 roles", () => {
    expect(KINDS.map((k) => k.kind)).toEqual(["gl_month", "gl_voucher_tag", "payroll_month", "inventory_valuation", "sales_by_item",
      "average_price", "cogm_card", "fs_control", "budget_bp", "std_master", "tb_month", "bp_fs"]);
    expect(KINDS.find((k) => k.kind === "cogm_card")!.roles).toEqual(["admin", "cost_accounting"]);
    expect(KINDS.find((k) => k.kind === "std_master")!.roles).toEqual(["admin", "finance", "ppic"]);
  });
});

describe("gl_month", () => {
  const res = kindParser("gl_month").parse(up("gl_month.xlsx"), SEP);
  const rows = set(res, "gl_month");
  it("reads the Accurate-style GL below the report title; no bad rows", () => {
    expect(res.detected?.headerRow).toBe(5);
    expect(res.rows.filter((r) => r.issues.length)).toEqual([]);
    expect(rows).toHaveLength(24);
    expect(rows.every((r) => r.month === "2026-09-01" && typeof r.line_key === "string")).toBe(true);
  });
  it("Σ 16 conversion accounts = LK (RINGKASAN B60) and BIAYA BERSAMA C23; 5101-002 = C43", () => {
    const conv = total(rows, "net", (r) => String(r.account).startsWith("5101-") || ["6500-006", "6500-007"].includes(String(r.account)));
    expect(conv.toFixed(2)).toBe(wp("RINGKASAN", "B60").toFixed(2));
    expect(conv.toFixed(2)).toBe(wp("BIAYA BERSAMA", "C23").toFixed(2));
    expect(total(rows, "net", (r) => r.account === "5101-002").toFixed(2)).toBe(wp("BIAYA BERSAMA", "C43").toFixed(2));
  });
  it("rejects rows without a proper account and flags dates outside the month", () => {
    const r = kindParser("gl_month").parse(aoa({ GL: [["Tanggal", "No. Sumber", "No. Akun", "Debit", "Kredit"],
      ["30/09/2026", "MJ1", "5101-006", 100, 0], ["01/10/2026", "MJ2", "5101-007", 5, 0], ["30/09/2026", "MJ3", "Biaya listrik", 1, 0],
      ["Total", "", "", 106, 0]] }), SEP);
    expect(set(r, "gl_month")).toHaveLength(2);
    expect(r.rows.find((x) => x.values.voucher === "MJ3")!.issues[0]).toMatch(/9999-999/);
    expect(r.issues.join()).toMatch(/Tanggal di luar bulan upload \(1\)/);
  });
});

describe("gl_voucher_tag", () => {
  it("11 tags of BIAYA BERSAMA bagian 8; ongkir to material FCC", () => {
    const res = kindParser("gl_voucher_tag").parse(up("gl_voucher_tag.csv"), SEP);
    const rows = set(res, "gl_voucher_tag");
    expect(rows).toHaveLength(11);
    expect(total(rows, "amount").toFixed(2)).toBe(wp("BIAYA BERSAMA", "C156").toFixed(2));
    expect(rows.find((r) => r.target_pool === "MATERIAL")).toMatchObject({ tag: "ongkir_singkong", target_line: "FCC", amount: "41897465" });
  });
  it("unknown tag or pool excludes the row", () => {
    const r = kindParser("gl_voucher_tag").parse(aoa({ T: [["Voucher", "Akun", "Jumlah", "Tag", "Pool tujuan"], ["V1", "6300-1", 5, "bonus", "Grup E – pabrik"], ["V2", "6300-1", 5, "reklas", "Grup Z"]] }), SEP);
    expect(set(r, "gl_voucher_tag")).toHaveLength(0);
    expect(r.rows[0].issues.join()).toMatch(/Tag tidak dikenal/);
    expect(r.rows[1].issues.join()).toMatch(/Pool tujuan tidak dikenal/);
  });
});

describe("payroll_month", () => {
  const res = kindParser("payroll_month").parse(up("payroll_month.xlsx"), { ...SEP, masters });
  it("14 groups mapped to payroll_group; Σ = rekap BIAYA BERSAMA C42", () => {
    const pm = set(res, "payroll_month");
    expect(pm).toHaveLength(14);
    expect(total(pm, "amount").toFixed(2)).toBe(wp("BIAYA BERSAMA", "C42").toFixed(2));
    expect(pm.find((r) => r.payroll_group_code === "STAF_PABRIK")!.amount).toBe("165344478");
  });
  it("journals of 5101-002 = GL 5101-002 (B02 input)", () => {
    const pj = set(res, "payroll_journal");
    expect(pj.map((r) => r.kind)).toEqual(["upah_harian", "gaji_staf", "tali_asih", "tali_asih"]);
    expect(total(pj, "amount").toFixed(2)).toBe(wp("BIAYA BERSAMA", "C167").toFixed(2));
  });
  it("an unmapped group is an issue", () => {
    const r = kindParser("payroll_month").parse(aoa({ Rekap: [["Kelompok", "Unit / Departemen", "Jumlah"], ["Operator harian", "Unit IV", 10]] }), { ...SEP, masters });
    expect(set(r, "payroll_month")).toHaveLength(0);
    expect(r.issues.join()).toMatch(/Kelompok tak terpeta \(1\)/);
  });
});

describe("inventory_valuation", () => {
  const res = kindParser("inventory_valuation").parse(up("inventory_valuation.xlsx"), { ...SEP, masters });
  const rows = set(res, "inventory_valuation");
  it("BB items mapped to material_item; WIP/FG closing = Σ Inventory Valuation (REKON PERSEDIAAN D8, G8)", () => {
    expect(res.issues.join()).not.toMatch(/tak terpeta/);
    expect(total(rows, "value_close", (r) => r.account === "1106-002").toFixed(2)).toBe(wp("REKON PERSEDIAAN", "D8").toFixed(2));
    expect(total(rows, "value_close", (r) => r.account === "1106-003").toFixed(2)).toBe(wp("REKON PERSEDIAAN", "G8").toFixed(2));
    expect(total(rows, "value_open", (r) => r.account === "1106-002").toFixed(2)).toBe(wp("REKON PERSEDIAAN", "C8").toFixed(2));
  });
  it("derives the account from the item code and warns on an unknown raw material", () => {
    const r = kindParser("inventory_valuation").parse(aoa({ IV: [["Kode Barang", "Nama Barang", "Kts. Akhir", "Nilai Akhir"], ["BB-999", "Bahan baru", 1, 10], ["WIP-067", "FCC", 2, 20]] }), { ...SEP, masters });
    expect(set(r, "inventory_valuation").map((x) => x.account)).toEqual(["1106-001", "1106-002"]);
    expect(r.issues.join()).toMatch(/Item bahan baku tak terpeta ke material_item \(1\): baris 2: BB-999/);
  });
});

describe("sales_by_item", () => {
  it("Σ Sales by Item = GL 4101-007 = LK (REKON & KONTROL C73, RINGKASAN B58)", () => {
    const res = kindParser("sales_by_item").parse(up("sales_by_item.xlsx"), SEP);
    const rows = set(res, "sales_by_item");
    expect(res.rows.filter((r) => r.issues.length)).toEqual([]);
    expect(total(rows, "amount").minus(wp("RINGKASAN", "B58")).abs().lte(1)).toBe(true);
    expect(total(rows, "amount", (r) => !["FG-001", "FG-015", "WIP-138", "WIP-139"].includes(String(r.item_code))).minus(wp("REKON & KONTROL", "C74")).abs().lte(1)).toBe(true);
  });
  it("unknown customer group is an issue", () => {
    const r = kindParser("sales_by_item").parse(aoa({ S: [["Nama Barang", "Jumlah", "Grup Pelanggan"], ["X", 5, "Grosir"]] }), SEP);
    expect(r.rows[0].issues.join()).toMatch(/Grup pelanggan tidak dikenal/);
  });
});

describe("average_price", () => {
  it("names = master material; item code filled from the master", () => {
    const res = kindParser("average_price").parse(up("average_price.xlsx"), { ...SEP, masters });
    const rows = set(res, "average_price");
    expect(rows).toHaveLength(23);
    expect(res.issues).toEqual([]);
    expect(rows.find((r) => r.item_name === "Minyak Olein")).toMatchObject({ item_code: "BB-014" });
  });
  it("item tak terpeta is a warning; the row is kept", () => {
    const r = kindParser("average_price").parse(aoa({ AP: [["Nama Barang", "Harga Rata-rata"], ["Singkong Ajaib", 1000]] }), { ...SEP, masters });
    expect(set(r, "average_price")).toHaveLength(1);
    expect(r.issues.join()).toMatch(/Item tak terpeta ke master material \(1\)/);
  });
});

describe("cogm_card", () => {
  const res = kindParser("cogm_card").parse(up("cogm_card.xlsx"), { ...SEP, masters });
  it("three sections, all lines known", () => {
    expect(res.rows.filter((r) => r.issues.length)).toEqual([]);
    expect(res.issues).toEqual([]);
  });
  it("FCC: quantities = kartu (FCC LAMPIRAN A), material = Σ LAMPIRAN B (G229), drivers = BIAYA BERSAMA bagian 4", () => {
    const card = set(res, "cogm_card"), mat = set(res, "cogm_material"), drv = set(res, "driver_month");
    expect(card.find((r) => r.line === "FCC" && r.row_kind === "input")!.qty).toBe("236923");
    expect(card.find((r) => r.line === "FCC" && r.row_kind === "premium")!.qty).toBe("221027");
    expect(total(mat, "value_card", (r) => r.line === "FCC").minus(wp("FCC", "G229")).abs().lte(1)).toBe(true); // Rp per row, ±Rp 1
    expect(total(drv, "value", (r) => r.driver === "man_hour").toFixed(2)).toBe(wp("BIAYA BERSAMA", "G91").toFixed(2));
    expect(total(drv, "value", (r) => r.driver === "kwh").toFixed(2)).toBe(wp("BIAYA BERSAMA", "G93").toFixed(2));
    expect(drv.filter((r) => r.estimated).map((r) => `${r.line}|${r.driver}`)).toEqual(["UU|machine_hour"]); // D11 / Q16
  });
  it("Lain-lain per SKU: output and material = LAIN-LAIN bagian 2 (C43, G43)", () => {
    const sku = new Set(master("sku").map((s) => String(s.code)));
    const card = set(res, "cogm_card"), mat = set(res, "cogm_material");
    expect(total(card, "qty", (r) => sku.has(String(r.line)) && r.row_kind === "output").toFixed(2)).toBe(wp("LAIN-LAIN", "C43").toFixed(2));
    expect(total(mat, "value_card", (r) => sku.has(String(r.line)) && r.material_group === "EXT").minus(wp("LAIN-LAIN", "G43")).abs().lte(1)).toBe(true);
  });
  it("an unknown line is an issue", () => {
    const r = kindParser("cogm_card").parse(aoa({ Kuantitas: [["Lini", "Jenis", "Qty"], ["FCX", "input", 1]] }), { ...SEP, masters });
    expect(r.rows[0].issues.join()).toMatch(/Lini tidak dikenal/);
  });
});

describe("fs_control", () => {
  it("9 LK figures = RINGKASAN B58:B66", () => {
    const rows = set(kindParser("fs_control").parse(up("fs_control.csv"), SEP), "fs_control");
    expect(rows).toHaveLength(9);
    rows.forEach((r, i) => expect(D(r.amount as string).toFixed(2)).toBe(wp("RINGKASAN", `B${58 + i}`).toFixed(2)));
  });
  it("keys from LK labels; missing figures are reported", () => {
    const r = kindParser("fs_control").parse(aoa({ LK: [["Pos", "Nilai"], ["Pemakaian Bahan Baku", 10], ["Total Cost of Goods Sold", 20]] }), SEP);
    expect(set(r, "fs_control").map((x) => x.key)).toEqual(["material_usage", "cogs"]);
    expect(r.issues.join()).toMatch(/belum lengkap \(7 dari 9\)/);
  });
});

describe("budget_bp (golden: fixtures/budget-v1 from the Fase 0 extractor)", () => {
  const sheets = readWorkbook(readFileSync(join(root, "reference", "BMG_Business_Plan_-_Oct26_to_Dec27.xlsx")), "bp.xlsx");
  const golden = JSON.parse(readFileSync(join(root, "fixtures", "budget-v1", "budget_line.json"), "utf8")) as { rows: unknown[]; months: unknown[] };
  const goldenPool = JSON.parse(readFileSync(join(root, "fixtures", "budget-v1", "budget_pool_map.json"), "utf8")) as { rows: unknown[] };
  const bp = parseBp(sheets);
  it("rows, months and pool map identical to the Python extractor", () => {
    expect(bp.months).toEqual(golden.months);
    expect(bp.rows).toHaveLength(golden.rows.length);
    expect(bp.rows).toEqual(golden.rows);
    expect(bp.poolMap).toEqual(goldenPool.rows);
  });
  it("expands to one line per row × month with unique driver codes", () => {
    const lines = expandBp(bp);
    expect(lines).toHaveLength(23024);
    expect(new Set(lines.map((l) => l.driver_code)).size).toBe(23024);
  });
});

describe("std_master duplicates", () => {
  it("a repeated (product, category) row is an issue, not a database error", () => {
    const r = kindParser("std_master").parse(aoa({ BOM: [["Kode versi", "X"], ["Berlaku mulai", "2026-10-05"], [], ["Produk", "Kategori material", "Qty per kg input"], ["FCC", "olein", 0.2], ["FCC", "olein", 0.3]] }), { period: "x" });
    expect(set(r, "bom_line")).toHaveLength(1);
    expect(r.rows[1].issues.join()).toMatch(/Baris ganda/);
  });
});

describe("std_master", () => {
  it("draft version from the template header; capacity only for PPIC/Admin", () => {
    const sheets = up("std_master.xlsx");
    const asPpic = kindParser("std_master").parse(sheets, { period: "x", role: "ppic" });
    expect(set(asPpic, "std_version")).toEqual([{ code: "STD-CONTOH-SEP26", effective_from: "2026-10-05", status: "draft", note: "Upload std_master" }]);
    expect(asPpic.rows.filter((r) => r.issues.length)).toEqual([]);
    expect(set(asPpic, "output_mix")).toHaveLength(3);
    expect(set(asPpic, "rate_card")).toHaveLength(6);
    expect(set(asPpic, "capacity")).toHaveLength(1);
    const asFinance = kindParser("std_master").parse(sheets, { period: "x", role: "finance" });
    expect(set(asFinance, "capacity")).toHaveLength(0);
    expect(new Set(set(asPpic, "bom_line").map((r) => `${r.product}|${r.material_category}`)).size).toBe(set(asPpic, "bom_line").length);
    expect(asFinance.issues.join()).toMatch(/Kapasitas hanya bisa diunggah PPIC\/Admin/);
  });
});

/**
 * Golden-month input rows built straight from the WP cells (fixtures/month-2026-09/cells.csv) and the masters
 * (fixtures/master). Node only, for tests and the golden suite. The rows have the shape of the B1 input tables at full
 * WP precision (no database rounding); the upload path (parsers → rows) is tested separately in packages/parsers.
 * Same cell choices as scripts/make_upload_fixtures.py; every row's line_key names its WP cell.
 */
import { D } from "./decimal";
import type { CellIndex } from "./golden";
import { loadCells, readFixtureJson } from "./fixtures";
import type {
  AssumptionRow, CoaPoolMapRow, CogmCardRow, CogmLegacyRow, CogmMaterialRow, DriverMonthRow, FsControlRow, GlMonthRow, GlVoucherTagRow, InputRows,
  InventoryValuationRow, OthersGroupRow, PayrollGroupRow, PayrollJournalRow, PayrollMonthRow, ProductItemRow, ProductRow, SalesByItemRow, SkuRow,
  WpOpeningRow,
} from "./inputs";

const BB = "BIAYA BERSAMA";
const MONTH = "2026-09-01";

export function masterRows<T>(name: string): T[] {
  return readFixtureJson<{ rows: T[] }>("master", `${name}.json`).rows;
}

class Wp {
  constructor(private cells: CellIndex) {}
  raw(sheet: string, ref: string): string | null {
    const c = this.cells.get(`${sheet}!${ref}`);
    return c ? c.value : null;
  }
  num(sheet: string, ref: string): string {
    const c = this.cells.get(`${sheet}!${ref}`);
    if (!c) return "0";
    if (c.type !== "n") throw new Error(`${sheet}!${ref} bukan angka: ${c.value}`);
    return c.value;
  }
  text(sheet: string, ref: string): string {
    return (this.raw(sheet, ref) ?? "").trim();
  }
  /** First row in [from, to] whose column A starts with `label`. */
  row(sheet: string, label: string, from = 1, to = 400): number {
    for (let r = from; r <= to; r++) if (this.text(sheet, `A${r}`).toLowerCase().startsWith(label.toLowerCase())) return r;
    throw new Error(`${sheet}: "${label}" tidak ditemukan`);
  }
  /** Rows of a LAMPIRAN block (first data row .. last before "Total" / next block). */
  block(sheet: string, title: string): [number, number] {
    const start = this.row(sheet, title) + 2;
    let end = start;
    while (this.text(sheet, `A${end + 1}`) && !/^(Total|LAMPIRAN)/.test(this.text(sheet, `A${end + 1}`))) end++;
    return [start, end];
  }
  lampA(sheet: string, label: string): number {
    const [s, e] = this.block(sheet, "LAMPIRAN A");
    return this.row(sheet, label, s, e);
  }
}

/** Opening WP values, old-card totals, extra Inventory Valuation columns: the Fase 2 additions of the upload. */
export function goldenMonthRows(cells: CellIndex = loadCells("month-2026-09")): InputRows {
  const wp = new Wp(cells);
  const product = masterRows<ProductRow>("product");
  const productItem = masterRows<ProductItemRow>("product_item");
  const othersGroup = masterRows<OthersGroupRow>("others_group");
  const sku = masterRows<SkuRow>("sku");
  const payrollGroup = masterRows<PayrollGroupRow & { wp_row: number }>("payroll_group");
  const coa = masterRows<CoaPoolMapRow>("coa_pool_map");
  const assumption = masterRows<AssumptionRow>("assumption");
  const key = (ref: string) => ({ line_key: ref, month: MONTH });

  // GL: the 16 conversion accounts + the opex accounts reclassed in bagian 8
  const gl: GlMonthRow[] = [];
  for (let r = 7; r <= 22; r++) gl.push({ ...key(`${BB}!C${r}`), account: wp.text(BB, `A${r}`), net: wp.num(BB, `C${r}`) });
  for (const r of [144, 145, 146, 147, 148]) gl.push({ ...key(`${BB}!C${r}`), account: wp.text(BB, `A${r}`), net: wp.num(BB, `C${r}`) });

  const TAG: Record<number, string> = { 144: "reklas_opex", 145: "reklas_opex", 146: "reklas_opex", 147: "reklas_opex", 148: "thr_swap", 149: "thr_swap",
    150: "tali_asih_cutoff", 151: "tali_asih_cutoff", 152: "ongkir_singkong", 153: "ongkir_singkong", 154: "pisau_urschel", 155: "pisau_urschel" };
  const tags: GlVoucherTagRow[] = [];
  for (const [rs, tag] of Object.entries(TAG)) {
    const r = Number(rs);
    const amount = wp.num(BB, `C${r}`);
    if (amount === "0") continue;
    const target = wp.text(BB, `D${r}`).toLowerCase();
    const m = /^grup ([a-e])\b/.exec(target);
    const pool = target.startsWith("material fcc") ? "MATERIAL" : target.startsWith("thr") ? "THR" : m ? m[1].toUpperCase() : "NONE";
    tags.push({ ...key(`${BB}!A${r}:F${r}`), voucher: wp.text(BB, `F${r}`).replace(/^GL Accurate Sep 2026:\s*/, "").split(";")[0], account: wp.text(BB, `A${r}`),
      amount, tag, target_pool: pool, target_line: pool === "MATERIAL" ? "FCC" : null });
  }

  const payroll: PayrollMonthRow[] = payrollGroup.map((g) => ({ ...key(`${BB}!C${g.wp_row}`), payroll_group_code: g.code, amount: wp.num(BB, `C${g.wp_row}`) }));
  const journals: PayrollJournalRow[] = [
    { ...key(`${BB}!C164`), kind: "upah_harian", amount: wp.num(BB, "C164") },
    { ...key(`${BB}!C165`), kind: "gaji_staf", amount: wp.num(BB, "C165") },
    { ...key(`${BB}!C166`), kind: "tali_asih", amount: wp.num(BB, "C166") },
  ];

  // CoGM card: process lines (LAMPIRAN A, premium from 2a) and Lain-lain SKUs
  const card: CogmCardRow[] = [];
  const material: CogmMaterialRow[] = [];
  const driver: DriverMonthRow[] = [];
  const opening: WpOpeningRow[] = [];
  const legacy: CogmLegacyRow[] = [];
  const machineCol: Record<string, string> = { FCC: "C", UU: "D", UO: "E" };
  for (const p of ["FCC", "UU", "UO"]) {
    for (const [label, kind] of [["WIP awal (curah)", "wip_open"], ["Produksi bulan ini", "input"], ["WIP akhir (curah)", "wip_close"], ["KW 2", "kw2"], ["Keripik waste", "waste"]]) {
      const r = wp.lampA(p, label);
      card.push({ ...key(`${p}!C${r}`), line: p, row_kind: kind, qty: wp.num(p, `C${r}`), unit: "kg" });
    }
    const pr = wp.row(p, "Premium ke barang jadi");
    card.push({ ...key(`${p}!B${pr}`), line: p, row_kind: "premium", qty: wp.num(p, `B${pr}`), unit: "kg" });
    const [s, e] = wp.block(p, "LAMPIRAN B");
    for (let r = s; r <= e; r++) {
      material.push({ ...key(`${p}!A${r}:G${r}`), line: p, item_name: wp.text(p, `A${r}`), material_group: wp.text(p, `B${r}`), qty: wp.num(p, `D${r}`),
        unit: wp.text(p, `E${r}`), price_card: wp.num(p, `F${r}`), value_card: wp.num(p, `G${r}`) });
    }
    driver.push({ ...key(`${p}!C${wp.lampA(p, "Man-hour")}`), line: p, driver: "man_hour", value: wp.num(p, `C${wp.lampA(p, "Man-hour")}`) });
    driver.push({ ...key(`${p}!C${wp.lampA(p, "Pemakaian listrik")}`), line: p, driver: "kwh", value: wp.num(p, `C${wp.lampA(p, "Pemakaian listrik")}`) });
    driver.push({ ...key(`${p}!C${wp.lampA(p, "Kg ")}`), line: p, driver: "kg_peeled", value: wp.num(p, `C${wp.lampA(p, "Kg ")}`) });
    driver.push({ ...key(`${BB}!${machineCol[p]}171`), line: p, driver: "machine_hour", value: wp.num(BB, `${machineCol[p]}171`), estimated: p === "UU" });
    // opening WP values (roll-forward from the August WP)
    const wipQ = wp.lampA(p, "WIP awal (curah)"), wipV = wp.lampA(p, "Nilai WIP awal");
    opening.push({ ...key(`${p}!C${wipV}`), line: p, kind: "wip", item_code: null, qty: wp.num(p, `C${wipQ}`), value: wp.num(p, `C${wipV}`), unit: "kg" });
    const fgQ = wp.lampA(p, p === "FCC" ? "FG awal FG-001" : "FG awal"), fgV = wp.lampA(p, p === "FCC" ? "Nilai FG awal FG-001" : "Nilai FG awal");
    opening.push({ ...key(`${p}!C${fgV}`), line: p, kind: "fg", item_code: product.find((x) => x.code === p)!.fg_item_code ?? null,
      qty: wp.num(p, `C${fgQ}`), value: wp.num(p, `C${fgV}`), unit: "kg" });
    // old CoGM card totals (LAMPIRAN C)
    const lc = wp.row(p, "LAMPIRAN C") + 2;
    const comp = ["material", "upah_kupas", "direct_labour", "overhead"];
    comp.forEach((c, i) => legacy.push({ ...key(`${p}!C${lc + i}`), line: p, component: c, amount: wp.num(p, `C${lc + i}`) }));
    legacy.push({ ...key(`${p}!C${lc + 5}`), line: p, component: "total", amount: wp.num(p, `C${lc + 5}`) });
  }
  driver.push({ ...key(`${BB}!C105`), line: "PABRIK", driver: "hours_paid", value: wp.num(BB, "C105") });

  const kop = sku.filter((s) => s.wp_sheet === "KOPERASI");
  const kopCol = (s: SkuRow) => "BCDEFGHIJKL"[kop.indexOf(s)];
  for (const s of sku) {
    const sh = s.wp_sheet!;
    if (sh === "KOPERASI") {
      const c = kopCol(s);
      card.push({ ...key(`KOPERASI!${c}122`), line: s.code, row_kind: "output", qty: wp.num("KOPERASI", `${c}122`), unit: "kg" });
      driver.push({ ...key(`KOPERASI!${c}125`), line: s.code, driver: "man_hour", value: wp.num("KOPERASI", `${c}125`) });
      for (let r = 143; r <= 167; r++) {
        const q = wp.num("KOPERASI", `${c}${r}`), v = wp.num("KOPERASI", `${c}${r + 27}`);
        if (q === "0" && v === "0") continue;
        material.push({ ...key(`KOPERASI!${c}${r}`), line: s.code, item_name: wp.text("KOPERASI", `A${r}`), material_group: wp.text("KOPERASI", `N${r}`), qty: q, value_card: v });
      }
      opening.push({ ...key(`KOPERASI!${c}127`), line: s.code, kind: "fg", item_code: s.code, qty: wp.num("KOPERASI", `${c}126`), value: wp.num("KOPERASI", `${c}127`), unit: s.fg_unit });
      continue;
    }
    const out = wp.lampA(sh, "Output produksi");
    card.push({ ...key(`${sh}!C${out}`), line: s.code, row_kind: "output", qty: wp.num(sh, `C${out}`), unit: "kg" });
    card.push({ ...key(`${sh}!C${out + 1}`), line: s.code, row_kind: "output_fg", qty: wp.num(sh, `C${out + 1}`), unit: wp.text(sh, `B${out + 1}`) });
    const smp = wp.lampA(sh, "Sampel");
    card.push({ ...key(`${sh}!C${smp}`), line: s.code, row_kind: "sample", qty: wp.num(sh, `C${smp}`), unit: "kg" });
    card.push({ ...key(`${sh}!C${smp + 1}`), line: s.code, row_kind: "sample_fg", qty: wp.num(sh, `C${smp + 1}`), unit: wp.text(sh, `B${smp + 1}`) });
    driver.push({ ...key(`${sh}!C${wp.lampA(sh, "Man-hour")}`), line: s.code, driver: "man_hour", value: wp.num(sh, `C${wp.lampA(sh, "Man-hour")}`) });
    driver.push({ ...key(`${sh}!C${wp.lampA(sh, "Pemakaian listrik")}`), line: s.code, driver: "kwh", value: wp.num(sh, `C${wp.lampA(sh, "Pemakaian listrik")}`) });
    const [bs, be] = wp.block(sh, "LAMPIRAN B");
    for (let r = bs; r <= be; r++) {
      material.push({ ...key(`${sh}!A${r}:F${r}`), line: s.code, item_name: wp.text(sh, `A${r}`), material_group: wp.text(sh, `B${r}`), qty: wp.num(sh, `C${r}`),
        unit: wp.text(sh, `D${r}`), price_card: wp.num(sh, `E${r}`), value_card: wp.num(sh, `F${r}`) });
    }
    const oq = wp.lampA(sh, "Saldo awal"), ov = wp.lampA(sh, "Nilai saldo awal");
    opening.push({ ...key(`${sh}!C${ov}`), line: s.code, kind: "fg", item_code: s.code, qty: wp.num(sh, `C${oq}`), value: wp.num(sh, `C${ov}`), unit: s.fg_unit });
  }
  // frying machine hours of Lain-lain = Ubi putih ACE (BIAYA BERSAMA H171), on its SKU
  const ace = sku.find((s) => s.wp_sheet === "UBI PUTIH ACE")!;
  driver.push({ ...key(`${BB}!F171`), line: ace.code, driver: "machine_hour", value: wp.num(BB, "F171") });

  // Inventory Valuation: WIP/FG items of REKON PERSEDIAAN + FG movements the WP cites
  const inv: InventoryValuationRow[] = [];
  const RP = "REKON PERSEDIAAN";
  const end = wp.row(RP, "Total", 55);
  for (let r = 55; r < end; r++) {
    const code = wp.text(RP, `A${r}`);
    if (!code) continue;
    inv.push({ ...key(`${RP}!A${r}:H${r}`), item_code: code, account: wp.text(RP, `C${r}`), qty_open: wp.num(RP, `E${r}`), value_open: wp.num(RP, `F${r}`),
      qty_close: wp.num(RP, `G${r}`), value_close: wp.num(RP, `H${r}`) });
  }
  const iv = (code: string) => inv.find((i) => i.item_code === code)!;
  Object.assign(iv("FG-001"), { qty_in: wp.num("FCC", `C${wp.lampA("FCC", "FG-001 masuk")}`), qty_out_transfer: wp.num("FCC", `C${wp.lampA("FCC", "FG-001 transfer")}`) });
  for (const s of sku) {
    const sh = s.wp_sheet!;
    if (sh === "KOPERASI") {
      const c = kopCol(s);
      Object.assign(iv(s.code), { qty_in: wp.num(sh, `${c}129`), value_in: wp.num(sh, `${c}130`), qty_out_sale: wp.num(sh, `${c}131`), value_out_sale: wp.num(sh, `${c}132`) });
    } else {
      Object.assign(iv(s.code), {
        qty_in: wp.num(sh, `C${wp.lampA(sh, "Masuk")}`), value_in: wp.num(sh, `C${wp.lampA(sh, "Nilai masuk")}`),
        qty_out_sale: wp.num(sh, `C${wp.lampA(sh, "Keluar")}`), value_out_sale: wp.num(sh, `C${wp.lampA(sh, "Nilai pengiriman")}`),
      });
    }
  }

  // Sales by Item (FCC premium + KW 2 tawar as two items; WP keeps only their sum)
  // synthetic split like the upload fixture (KW 2 at NRV, rounded to the cent; the rest on FG-001); Σ = FCC!C211
  const kw2Kg = wp.num("FCC", "C208");
  const kw2Amt = D(kw2Kg).times(wp.num("FCC", "C209")).toDecimalPlaces(2);
  const sales: SalesByItemRow[] = [
    { ...key("FCC!C203"), item_code: "FG-001", item_name: "Keripik Singkong Tanpa Bumbu", qty: wp.num("FCC", "C203"), amount: D(wp.num("FCC", "C211")).minus(kw2Amt).toFixed(), customer_group: "IFM" },
    { ...key("FCC!C208"), item_code: "FG-015", item_name: "2nd Grade Tawar", qty: kw2Kg, amount: kw2Amt.toFixed(), customer_group: "KGS" },
    { ...key("UU!C203"), item_code: "WIP-139", item_name: "Keripik Ubi Ungu (QKSP)", qty: wp.num("UU", "C203"), amount: wp.num("UU", "C207"), customer_group: "KGS" },
    { ...key("UO!C199"), item_code: "WIP-138", item_name: "Keripik Ubi Orange (QKSO)", qty: wp.num("UO", "C199"), amount: wp.num("UO", "C203"), customer_group: "KGS" },
  ];
  for (const s of sku) {
    const sh = s.wp_sheet!;
    const [q, a] = sh === "KOPERASI" ? [wp.num(sh, `${kopCol(s)}135`), wp.num(sh, `${kopCol(s)}136`)]
      : [wp.num(sh, `C${wp.lampA(sh, "Penjualan menurut")}`), wp.num(sh, `C${wp.lampA(sh, "Pendapatan")}`)];
    if (q === "0" && a === "0") continue;
    sales.push({ ...key(`${sh}:${s.code}`), item_code: s.code, item_name: s.name, qty: q, amount: a, unit: s.fg_unit, customer_group: "retail" });
  }
  sales.push({ ...key("LAIN-LAIN!H92"), item_code: null, item_name: "Produk lain tanpa kartu bulan ini", amount: wp.num("LAIN-LAIN", "H92"), customer_group: "retail" });

  const FS = ["revenue_4101_007", "material_usage", "conversion_16", "cogs", "inv_1106_001_close", "inv_1106_002_open", "inv_1106_002_close", "inv_1106_003_open", "inv_1106_003_close"];
  const fs: FsControlRow[] = FS.map((k, i) => ({ ...key(`RINGKASAN!B${58 + i}`), key: k, amount: wp.num("RINGKASAN", `B${58 + i}`) }));

  return {
    month: MONTH, gl_month: gl, gl_voucher_tag: tags, payroll_month: payroll, payroll_journal: journals, inventory_valuation: inv, sales_by_item: sales,
    cogm_card: card, cogm_material: material, driver_month: driver, fs_control: fs, wp_opening: opening, cogm_legacy: legacy,
    product, product_item: productItem, others_group: othersGroup, sku, payroll_group: payrollGroup, coa_pool_map: coa, assumption,
    wp_template: "sep26_4",
  };
}

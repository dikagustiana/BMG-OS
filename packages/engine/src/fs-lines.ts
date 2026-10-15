/**
 * Financial statement lines (PRD v2 §4.11, §5.1 `fs_line`). One line per presentation row of the BP v1 sheet
 * "BMG Business Plan" (rows 9–181 laba rugi, modal kerja, arus kas; rows 184–262 neraca). `bp_row` and `source_label`
 * let the `bp_fs` parser find the row again in a later BP version (ordered label match); `source_label` is also the
 * value of the "Mapping" column of the sheets "BS/PL Actual MTM" that `coa_fs_map` was seeded from.
 *
 * kinds:
 * - leaf: carries an amount (from TB via coa_fs_map, or imported from BP)
 * - total: Σ of `sum` (prefix "-" subtracts); computed for TB months, imported and re-checked for BP months
 * - memo: imported from BP only (product split, card-level COGS); never part of a total computed from TB
 * - flow: cash flow / working capital line computed by fs.ts from two balance sheets and the P&L
 *
 * Signs follow the BP sheet: revenue and assets positive, costs negative, liabilities and equity positive,
 * accumulated depreciation negative.
 */

export type FsStatement = "pl" | "bs" | "wc" | "cf";
export type FsKind = "leaf" | "total" | "memo" | "flow";

export interface FsLineDef {
  code: string;
  statement: FsStatement;
  section: string;
  kind: FsKind;
  label_id: string;
  label_en: string;
  /** Row in BP v1 "BMG Business Plan" (trace only; the parser matches by label order). */
  bp_row: number;
  /** Text in column C–G of the BP row, normalised by the parser before matching. */
  source_label: string;
  /** Components of a total; "-code" subtracts. */
  sum?: string[];
  /** Display indent (0 = statement total). */
  level: number;
  /** Shown in the short P&L / balance sheet tables of the management pages. */
  summary?: boolean;
}

const L = (
  code: string, statement: FsStatement, section: string, kind: FsKind, bp_row: number, source_label: string,
  label_id: string, level: number, extra: Partial<FsLineDef> = {},
): FsLineDef => ({ code, statement, section, kind, bp_row, source_label, label_en: source_label, label_id, level, ...extra });

export const FS_LINES: FsLineDef[] = [
  // ---------------------------------------------------------------- laba rugi (rows 9–124)
  L("pl.revenue_gross", "pl", "revenue", "leaf", 9, "Revenue - Gross", "Pendapatan kotor", 1),
  L("pl.revenue.fcc", "pl", "revenue", "memo", 10, "FCC", "FCC", 2),
  L("pl.revenue.uu", "pl", "revenue", "memo", 11, "Ubi Ungu", "Ubi ungu", 2),
  L("pl.revenue.uo", "pl", "revenue", "memo", 12, "Ubi Orange", "Ubi orange", 2),
  L("pl.revenue.others", "pl", "revenue", "memo", 13, "Others (actual: retail & maklon per invoice; projection: model total operating revenue less the three products) | Others (MBS, Nutrifood, Koperasi, Lembutan, maklon & merek)", "Lain-lain", 2),
  L("pl.sales_discount_return", "pl", "revenue", "total", 14, "Sales Discount and Return", "Diskon dan retur penjualan", 1, { sum: ["pl.sales_discount", "pl.sales_return"] }),
  L("pl.sales_discount", "pl", "revenue", "leaf", 15, "Sales Discount", "Diskon penjualan", 2),
  L("pl.sales_return", "pl", "revenue", "leaf", 16, "Sales Return", "Retur penjualan", 2),
  L("pl.revenue", "pl", "revenue", "total", 17, "Revenue", "Pendapatan", 0, { sum: ["pl.revenue_gross", "pl.sales_discount_return"], summary: true }),
  L("pl.cogs_card.fcc", "pl", "cogs", "memo", 18, "FCC", "HPP FCC (kartu)", 2),
  L("pl.cogs_card.uu", "pl", "cogs", "memo", 33, "Ubi Ungu", "HPP ubi ungu (kartu)", 2),
  L("pl.cogs_card.uo", "pl", "cogs", "memo", 48, "Ubi Orange", "HPP ubi orange (kartu)", 2),
  L("pl.cogs_card.others", "pl", "cogs", "memo", 63, "COGS - Others", "HPP Lain-lain (kartu)", 2),
  // Row 64 is what BP uses for gross profit. BP's own check (row 88) keeps it equal to the blended rows 66–86 without
  // row 83, so the total is defined on those leaves. Row 83 (card vs GL variance) is a BP reconciling item: memo here;
  // the GL account 5101-015 maps to the material line (Accurate group PL 04), so a TB month's COGS equals the GL.
  L("pl.cost_of_revenue", "pl", "cogs", "total", 64, "Cost of revenue - Product Level", "Harga pokok penjualan", 0, {
    sum: ["pl.cogm_material", "pl.dl_basic", "pl.dl_thr", "pl.dl_bpjs", "pl.dl_others", "pl.idl_basic", "pl.idl_thr", "pl.idl_bpjs",
      "pl.electricity", "pl.water", "pl.factory_household", "pl.maint_machinery", "pl.maint_factory", "pl.maint_factory_equipment",
      "pl.dep_machinery", "pl.delivery_cogs", "pl.inventory_recon", "pl.cogs_others"],
    summary: true,
  }),
  L("pl.cogm_material", "pl", "cogs", "leaf", 66, "COGM Bahan Jadi", "Bahan (COGM bahan jadi)", 1),
  L("pl.dl_basic", "pl", "cogs", "leaf", 68, "DL - Basic Salary (termasuk upah harian pabrik) | DL - Basic Salary", "Upah langsung pokok", 1),
  L("pl.dl_thr", "pl", "cogs", "leaf", 69, "DL - THR And Bonus", "Upah langsung: THR dan bonus", 1),
  L("pl.dl_bpjs", "pl", "cogs", "leaf", 70, "DL - BPJS", "Upah langsung: BPJS", 1),
  L("pl.dl_others", "pl", "cogs", "leaf", 71, "DL - Others", "Upah langsung lain", 1),
  L("pl.idl_basic", "pl", "cogs", "leaf", 73, "IDL - Basic Salary (bulanan) | IDL - Basic Salary", "Gaji tidak langsung", 1),
  L("pl.idl_thr", "pl", "cogs", "leaf", 74, "IDL - THR and Bonus", "Tidak langsung: THR dan bonus", 1),
  L("pl.idl_bpjs", "pl", "cogs", "leaf", 75, "IDL - BPJS", "Tidak langsung: BPJS", 1),
  L("pl.electricity", "pl", "cogs", "leaf", 76, "Electricity", "Listrik pabrik", 1),
  L("pl.water", "pl", "cogs", "leaf", 77, "Water", "Air pabrik", 1),
  L("pl.factory_household", "pl", "cogs", "leaf", 78, "Biaya Rumah Tangga Pabrik", "Rumah tangga pabrik", 1),
  L("pl.maint_machinery", "pl", "cogs", "leaf", 79, "Maintenance - Machinery", "Pemeliharaan mesin", 1),
  L("pl.maint_factory", "pl", "cogs", "leaf", 80, "Maintenance - Factory", "Pemeliharaan pabrik", 1),
  L("pl.maint_factory_equipment", "pl", "cogs", "leaf", 81, "Maintenance - Factory Equipments", "Pemeliharaan peralatan pabrik", 1),
  L("pl.dep_machinery", "pl", "cogs", "leaf", 82, "Depreciation - Machinery", "Penyusutan mesin dan peralatan pabrik", 1),
  L("pl.production_variance", "pl", "cogs", "memo", 83, "Selisih kartu CoGM vs GL (variance produksi) | Vairance Productions | Variance Produksi (5101-015) - nihil di GL Jan-Agu; masuk matriks bila muncul", "Varian produksi (kartu vs GL)", 1),
  L("pl.delivery_cogs", "pl", "cogs", "leaf", 84, "Delivery Expenses", "Pabrikasi dan pengiriman", 1),
  L("pl.inventory_recon", "pl", "cogs", "leaf", 85, "Inventory Reconciliation to COGM | Inventory Reconciliation to COGM (KW 2, mutasi WIP & FG, penyesuaian ke GL)", "Rekonsiliasi persediaan ke COGM", 1),
  L("pl.cogs_others", "pl", "cogs", "leaf", 86, "COGS - Others | COGS - Others (sudah termasuk di baris jenis biaya di atas)", "HPP lain", 1),
  L("pl.cost_of_revenue_blended", "pl", "cogs", "memo", 87, "Cost of revenue - blended", "HPP gabungan (BP)", 1),
  L("pl.gross_profit", "pl", "gp", "total", 89, "Gross profit", "Laba kotor", 0, { sum: ["pl.revenue", "pl.cost_of_revenue"], summary: true }),
  L("pl.delivery_selling", "pl", "opex", "leaf", 95, "Delivery Expenses - SE", "Ongkos kirim penjualan", 1),
  L("pl.commission", "pl", "opex", "leaf", 96, "Commission Expenses", "Komisi", 1),
  L("pl.other_selling", "pl", "opex", "leaf", 97, "Other selling Expense", "Beban penjualan lain", 1),
  L("pl.salaries_ga", "pl", "opex", "leaf", 99, "Salaries and allowance", "Gaji dan tunjangan kantor", 1),
  L("pl.delivery_ga", "pl", "opex", "leaf", 100, "Delivery Expenses", "Ongkos kirim umum", 1),
  L("pl.maintenance_ga", "pl", "opex", "leaf", 101, "Maintenance Expenses", "Pemeliharaan", 1),
  L("pl.communication", "pl", "opex", "leaf", 102, "Communication Expenses", "Komunikasi", 1),
  L("pl.transport", "pl", "opex", "leaf", 103, "Office Transportation expenses", "Transportasi kantor", 1),
  L("pl.insurance", "pl", "opex", "leaf", 104, "Insurance Expenses", "Asuransi", 1),
  L("pl.rent", "pl", "opex", "leaf", 105, "Rent Expenses", "Sewa", 1),
  L("pl.office_supplies", "pl", "opex", "leaf", 106, "Office Supplies Expenses", "Keperluan kantor", 1),
  L("pl.representation", "pl", "opex", "leaf", 107, "Representation and Donations", "Representasi dan sumbangan", 1),
  L("pl.professional", "pl", "opex", "leaf", 108, "Professional Expenses", "Jasa profesional", 1),
  L("pl.depreciation_opex", "pl", "opex", "leaf", 109, "Depreciation Expenses", "Penyusutan non-pabrik", 1),
  L("pl.tax_permit", "pl", "opex", "leaf", 110, "Tax & Permit", "Pajak dan perizinan", 1),
  L("pl.opex", "pl", "opex", "total", 111, "OPEX", "Beban usaha", 0, {
    sum: ["pl.delivery_selling", "pl.commission", "pl.other_selling", "pl.salaries_ga", "pl.delivery_ga", "pl.maintenance_ga", "pl.communication",
      "pl.transport", "pl.insurance", "pl.rent", "pl.office_supplies", "pl.representation", "pl.professional", "pl.depreciation_opex", "pl.tax_permit"],
    summary: true,
  }),
  L("pl.operating_profit", "pl", "op", "total", 112, "Operating Profit", "Laba usaha", 0, { sum: ["pl.gross_profit", "pl.opex"], summary: true }),
  L("pl.finance_income", "pl", "other", "leaf", 113, "Finance Income", "Pendapatan keuangan", 1),
  L("pl.finance_expense", "pl", "other", "leaf", 114, "Finance Expenses", "Beban keuangan", 1),
  L("pl.other_income", "pl", "other", "leaf", 115, "Other income", "Pendapatan lain", 1),
  L("pl.other_expense", "pl", "other", "leaf", 116, "Other Expense", "Beban lain", 1),
  L("pl.gain_asset_sale", "pl", "other", "leaf", 117, "Gain (loss) from sell of fixed assets", "Laba (rugi) jual aset tetap", 1),
  L("pl.ebt", "pl", "ebt", "total", 118, "EBT", "Laba sebelum pajak", 0, {
    sum: ["pl.operating_profit", "pl.finance_income", "pl.finance_expense", "pl.other_income", "pl.other_expense", "pl.gain_asset_sale"], summary: true,
  }),
  L("pl.income_tax", "pl", "tax", "leaf", 119, "Income tax (actual: GL 8300/8100; projection: rate in row 236 x positive EBT)", "Pajak penghasilan", 1),
  L("pl.net_profit", "pl", "np", "total", 120, "Net profit", "Laba bersih", 0, { sum: ["pl.ebt", "pl.income_tax"], summary: true }),
  L("pl.ebit", "pl", "memo", "total", 122, "EBIT", "EBIT", 1, { sum: ["pl.operating_profit"] }),
  L("pl.depreciation", "pl", "memo", "total", 123, "Depreciation", "Penyusutan", 1, { sum: ["-pl.depreciation_opex", "-pl.dep_machinery"] }),
  L("pl.ebitda", "pl", "memo", "total", 124, "EBITDA", "EBITDA", 1, { sum: ["pl.ebit", "pl.depreciation"] }),

  // ---------------------------------------------------------------- modal kerja (rows 127–131; definisi Q26)
  L("wc.trade_receivables", "wc", "wc", "flow", 127, "Trade receivables, net", "Piutang dagang", 1),
  L("wc.trade_payables", "wc", "wc", "flow", 128, "Trade payables (negative)", "Hutang dagang (negatif)", 1),
  L("wc.inventories", "wc", "wc", "flow", 129, "Inventories", "Persediaan", 1),
  L("wc.nwc", "wc", "wc", "flow", 130, "Net working capital", "Modal kerja bersih", 0),
  L("wc.delta_cash", "wc", "wc", "flow", 131, "Decrease (increase) in net working capital - cash effect (Jan-26: opening not available)", "Efek kas perubahan modal kerja", 1),

  // ---------------------------------------------------------------- arus kas (rows 134–181), dihitung dari neraca dan laba rugi
  L("cf.receipts", "cf", "cfo", "flow", 134, "Cash receipts from customers", "Penerimaan dari pelanggan", 1),
  L("cf.revenue", "cf", "cfo", "flow", 135, "Revenue", "Pendapatan", 2),
  L("cf.d_trade_receivables", "cf", "cfo", "flow", 136, "(Increase) decrease in trade receivables", "(Kenaikan) penurunan piutang dagang", 2),
  L("cf.d_prepaid_tax", "cf", "cfo", "flow", 137, "(Increase) decrease in prepaid taxes", "(Kenaikan) penurunan pajak dibayar dimuka", 2),
  L("cf.d_shareholder_receivables", "cf", "cfo", "flow", 138, "(Increase) decrease in shareholders receivables", "(Kenaikan) penurunan piutang pemegang saham", 2),
  L("cf.d_customer_deposits", "cf", "cfo", "flow", 139, "Increase (decrease) in customer deposits", "Kenaikan (penurunan) deposit pelanggan", 2),
  L("cf.paid_cost_of_revenue", "cf", "cfo", "flow", 140, "Cash paid for cost of revenue", "Pembayaran harga pokok", 1),
  L("cf.cost_of_revenue", "cf", "cfo", "flow", 141, "Cost of revenue", "Harga pokok penjualan", 2),
  L("cf.addback_direct_labour", "cf", "cfo", "flow", 142, "Add back: direct labour (paid in row 102)", "Ditambah: upah (dibayar di baris gaji)", 2),
  L("cf.addback_depreciation", "cf", "cfo", "flow", 143, "Add back: depreciation and amortisation (movement in accumulated depreciation, all classes)", "Ditambah: penyusutan", 2),
  L("cf.d_deferred_tax_other", "cf", "cfo", "flow", 144, "(Increase) decrease in deferred tax and other non-current assets", "(Kenaikan) penurunan pajak tangguhan dan aset lain", 2),
  L("cf.d_other_receivables", "cf", "cfo", "flow", 145, "(Increase) decrease in other receivables", "(Kenaikan) penurunan piutang lain", 2),
  L("cf.d_inventories", "cf", "cfo", "flow", 146, "(Increase) decrease in inventories", "(Kenaikan) penurunan persediaan", 2),
  L("cf.d_advance_payments", "cf", "cfo", "flow", 147, "(Increase) decrease in advance payments", "(Kenaikan) penurunan uang muka", 2),
  L("cf.d_trade_payables", "cf", "cfo", "flow", 148, "Increase (decrease) in trade payables", "Kenaikan (penurunan) hutang dagang", 2),
  L("cf.d_other_payables", "cf", "cfo", "flow", 149, "Increase (decrease) in other payables", "Kenaikan (penurunan) hutang lain", 2),
  L("cf.paid_opex", "cf", "cfo", "flow", 150, "Cash paid for operating expenses", "Pembayaran beban usaha", 1),
  L("cf.opex", "cf", "cfo", "flow", 151, "Operating expenses", "Beban usaha", 2),
  L("cf.addback_ga_salaries", "cf", "cfo", "flow", 152, "Add back: G&A salaries and allowances (paid in row 102)", "Ditambah: gaji kantor (dibayar di baris gaji)", 2),
  L("cf.addback_dep_opex", "cf", "cfo", "flow", 153, "Add back: depreciation in operating expenses (already included in row 88)", "Ditambah: penyusutan di beban usaha", 2),
  L("cf.d_employee_benefits", "cf", "cfo", "flow", 154, "Increase (decrease) in employee benefit liabilities", "Kenaikan (penurunan) liabilitas imbalan kerja", 2),
  L("cf.d_accrued", "cf", "cfo", "flow", 155, "Increase (decrease) in accrued expenses", "Kenaikan (penurunan) biaya masih harus dibayar", 2),
  L("cf.d_prepaid_expenses", "cf", "cfo", "flow", 156, "(Increase) decrease in prepaid expenses", "(Kenaikan) penurunan biaya dibayar dimuka", 2),
  L("cf.salaries_paid", "cf", "cfo", "flow", 157, "Salaries and benefits paid (direct labour + G&A)", "Gaji dan upah dibayar", 1),
  L("cf.tax_paid", "cf", "cfo", "flow", 158, "Income tax paid (tax expense adjusted for change in tax payables)", "Pajak dibayar", 1),
  L("cf.finance_other_net", "cf", "cfo", "flow", 159, "Finance income and other income (expenses), net", "Pendapatan keuangan dan lain-lain, bersih", 1),
  L("cf.cfo", "cf", "cfo", "flow", 161, "Cash flow from operating activities", "Arus kas operasi", 0),
  L("cf.capex_machinery", "cf", "cfi", "flow", 163, "Additions of machinery and factory equipment", "Penambahan mesin dan peralatan pabrik", 1),
  L("cf.capex_vehicles", "cf", "cfi", "flow", 164, "Additions of vehicles", "Penambahan kendaraan", 1),
  L("cf.capex_buildings", "cf", "cfi", "flow", 165, "Additions of buildings", "Penambahan bangunan", 1),
  L("cf.capex_office", "cf", "cfi", "flow", 166, "Additions of office furniture and equipment", "Penambahan inventaris kantor", 1),
  L("cf.cfi", "cf", "cfi", "flow", 167, "Cash flow from investing activities", "Arus kas investasi", 0),
  L("cf.lease", "cf", "cff", "flow", 169, "Lease liability payments (actual: change in lease liability)", "Pembayaran sewa pembiayaan", 1),
  L("cf.wc_loan", "cf", "cff", "flow", 170, "Working capital loan drawdown (repayment)", "Pinjaman modal kerja (pelunasan)", 1),
  L("cf.related_party_loan", "cf", "cff", "flow", 171, "Related party loan (no balance sheet account - not used)", "Pinjaman pihak berelasi", 1),
  L("cf.shareholder_loan", "cf", "cff", "flow", 172, "Shareholder loan (no balance sheet account - not used)", "Pinjaman pemegang saham", 1),
  L("cf.bank_loan_repayment", "cf", "cff", "flow", 173, "Repayment of bank loan", "Pelunasan pinjaman bank", 1),
  L("cf.interest_paid", "cf", "cff", "flow", 174, "Interest paid", "Bunga dibayar", 1),
  L("cf.equity_movements", "cf", "cff", "flow", 175, "Capital injection and other equity movements (APIC, capital reserve, OCI)", "Setoran modal dan pergerakan ekuitas lain", 1),
  L("cf.dividends", "cf", "cff", "flow", 176, "Dividends paid", "Dividen dibayar", 1),
  L("cf.cff", "cf", "cff", "flow", 177, "Cash flow from financing activities", "Arus kas pendanaan", 0),
  L("cf.net", "cf", "net", "flow", 179, "Net cash flow", "Arus kas bersih", 0),
  L("cf.open", "cf", "net", "flow", 180, "Cash at beginning of period", "Kas awal", 0),
  L("cf.close", "cf", "net", "flow", 181, "Cash at end of period", "Kas akhir", 0),

  // ---------------------------------------------------------------- neraca (rows 184–262)
  L("bs.cash", "bs", "current_asset", "leaf", 184, "Cash and cash equivalents", "Kas dan setara kas", 1, { summary: true }),
  L("bs.trade_receivables", "bs", "current_asset", "total", 185, "Trade Receivables, net", "Piutang dagang", 1, { sum: ["bs.trade_receivables_third", "bs.trade_receivables_related"], summary: true }),
  L("bs.trade_receivables_third", "bs", "current_asset", "leaf", 186, "Trade Receivables - Third Parties", "Piutang dagang pihak ketiga", 2),
  L("bs.trade_receivables_related", "bs", "current_asset", "leaf", 187, "Trade Receivables - Related Parties", "Piutang dagang pihak berelasi", 2),
  L("bs.other_receivables", "bs", "current_asset", "total", 188, "Other receivables", "Piutang lain-lain", 1, { sum: ["bs.other_receivables_third", "bs.other_receivables_related", "bs.shareholder_receivables"], summary: true }),
  L("bs.other_receivables_third", "bs", "current_asset", "leaf", 189, "Other Receivables - third parties", "Piutang lain-lain pihak ketiga", 2),
  L("bs.other_receivables_related", "bs", "current_asset", "leaf", 190, "Other Receivables - Related Parties", "Piutang lain-lain pihak berelasi", 2),
  L("bs.shareholder_receivables", "bs", "current_asset", "leaf", 191, "Shareholders Receivables", "Piutang pemegang saham", 2),
  L("bs.inventories", "bs", "current_asset", "total", 192, "Inventories", "Persediaan", 1, { sum: ["bs.inv_raw", "bs.inv_wip", "bs.inv_fg", "bs.inv_technical"], summary: true }),
  L("bs.inv_raw", "bs", "current_asset", "leaf", 193, "Raw Materials", "Bahan baku", 2),
  L("bs.inv_wip", "bs", "current_asset", "leaf", 194, "Work in Progress", "Barang dalam proses", 2),
  L("bs.inv_fg", "bs", "current_asset", "leaf", 195, "Finished Goods", "Barang jadi", 2),
  L("bs.inv_technical", "bs", "current_asset", "leaf", 196, "Tekhnik Supplies", "Persediaan teknik", 2),
  L("bs.prepaid_expenses", "bs", "current_asset", "total", 197, "Prepaid expenses", "Biaya dibayar dimuka", 1, { sum: ["bs.prepaid_rent", "bs.prepaid_insurance", "bs.prepaid_thr", "bs.prepaid_others"] }),
  L("bs.prepaid_rent", "bs", "current_asset", "leaf", 198, "Prepaid Rent", "Sewa dibayar dimuka", 2),
  L("bs.prepaid_insurance", "bs", "current_asset", "leaf", 199, "Prepaid Insurance", "Asuransi dibayar dimuka", 2),
  L("bs.prepaid_thr", "bs", "current_asset", "leaf", 200, "Prepaid THR", "THR dibayar dimuka", 2),
  L("bs.prepaid_others", "bs", "current_asset", "leaf", 201, "Prepaid Others", "Dibayar dimuka lain", 2),
  L("bs.prepaid_tax", "bs", "current_asset", "total", 202, "Prepaid tax", "Pajak dibayar dimuka", 1, { sum: ["bs.vat_in", "bs.prepaid_art21", "bs.prepaid_art22", "bs.prepaid_art23", "bs.prepaid_art25"] }),
  L("bs.vat_in", "bs", "current_asset", "leaf", 203, "Value Added Tax - In", "PPN masukan", 2),
  L("bs.prepaid_art21", "bs", "current_asset", "leaf", 204, "Prepaid Art 21", "PPh 21 dibayar dimuka", 2),
  L("bs.prepaid_art22", "bs", "current_asset", "leaf", 205, "Prepaid Art 22", "PPh 22 dibayar dimuka", 2),
  L("bs.prepaid_art23", "bs", "current_asset", "leaf", 206, "Prepaid Art 23", "PPh 23 dibayar dimuka", 2),
  L("bs.prepaid_art25", "bs", "current_asset", "leaf", 207, "Prepaid Art 25", "PPh 25 dibayar dimuka", 2),
  L("bs.advance_payment", "bs", "current_asset", "leaf", 208, "Advance Payment", "Uang muka", 1),
  L("bs.current_assets", "bs", "current_asset", "total", 209, "Current asset", "Aset lancar", 0, {
    sum: ["bs.cash", "bs.trade_receivables", "bs.other_receivables", "bs.inventories", "bs.prepaid_expenses", "bs.prepaid_tax", "bs.advance_payment"], summary: true,
  }),
  L("bs.fa_buildings", "bs", "fixed_asset", "leaf", 212, "Buildings", "Bangunan", 2),
  L("bs.fa_vehicles", "bs", "fixed_asset", "leaf", 213, "Vehicles", "Kendaraan", 2),
  L("bs.fa_office", "bs", "fixed_asset", "leaf", 214, "Office Furniture and Equipment", "Inventaris kantor", 2),
  L("bs.fa_factory_equipment", "bs", "fixed_asset", "leaf", 215, "Factory Equipment", "Inventaris pabrik", 2),
  L("bs.fa_machinery", "bs", "fixed_asset", "leaf", 216, "Machinery", "Mesin", 2),
  L("bs.ad_buildings", "bs", "fixed_asset", "leaf", 218, "Acc. Depreciation - Buildings", "Akumulasi penyusutan bangunan", 2),
  L("bs.ad_vehicles", "bs", "fixed_asset", "leaf", 219, "Acc. Depreciation - Vehicles", "Akumulasi penyusutan kendaraan", 2),
  L("bs.ad_office", "bs", "fixed_asset", "leaf", 220, "Acc. Depreciation - Office Furniture and Equipment", "Akumulasi penyusutan inventaris kantor", 2),
  L("bs.ad_factory_equipment", "bs", "fixed_asset", "leaf", 221, "Acc. Depreciation - Factory Equipment", "Akumulasi penyusutan inventaris pabrik", 2),
  L("bs.ad_machinery", "bs", "fixed_asset", "leaf", 222, "Acc. Depreciation - Machinery", "Akumulasi penyusutan mesin", 2),
  L("bs.deferred_tax_asset", "bs", "fixed_asset", "leaf", 223, "Deferred Tax Asset", "Aset pajak tangguhan", 2),
  L("bs.other_assets", "bs", "fixed_asset", "leaf", 224, "Other assets", "Aset lain", 2),
  L("bs.noncurrent_assets", "bs", "fixed_asset", "total", 225, "Non-current asset", "Aset tidak lancar", 0, {
    sum: ["bs.fa_buildings", "bs.fa_vehicles", "bs.fa_office", "bs.fa_factory_equipment", "bs.fa_machinery", "bs.ad_buildings", "bs.ad_vehicles",
      "bs.ad_office", "bs.ad_factory_equipment", "bs.ad_machinery", "bs.deferred_tax_asset", "bs.other_assets"], summary: true,
  }),
  L("bs.assets", "bs", "total_asset", "total", 226, "Assets", "Total aset", 0, { sum: ["bs.current_assets", "bs.noncurrent_assets"], summary: true }),
  L("bs.st_bank_loans", "bs", "current_liab", "leaf", 227, "Short-term bank loans", "Hutang bank jangka pendek", 1, { summary: true }),
  L("bs.trade_payables", "bs", "current_liab", "total", 228, "Trade Payables", "Hutang dagang", 1, { sum: ["bs.trade_payables_third", "bs.trade_payables_related"], summary: true }),
  L("bs.trade_payables_third", "bs", "current_liab", "leaf", 229, "Trade Payables - Third Parties", "Hutang dagang pihak ketiga", 2),
  L("bs.trade_payables_related", "bs", "current_liab", "leaf", 230, "Trade Payables - Related Parties", "Hutang dagang pihak berelasi", 2),
  L("bs.other_payables", "bs", "current_liab", "total", 231, "Other payables", "Hutang lain-lain", 1, { sum: ["bs.other_payables_third", "bs.other_payables_related"] }),
  L("bs.other_payables_third", "bs", "current_liab", "leaf", 232, "Other Payable - Third Parties", "Hutang lain-lain pihak ketiga", 2),
  L("bs.other_payables_related", "bs", "current_liab", "leaf", 233, "Other Payable - Related Parties", "Hutang lain-lain pihak berelasi", 2),
  L("bs.tax_payables", "bs", "current_liab", "total", 234, "Tax payables", "Hutang pajak", 1, {
    sum: ["bs.tax_art21", "bs.tax_art22", "bs.tax_art23", "bs.tax_art25", "bs.vat_out", "bs.tax_final"],
  }),
  L("bs.tax_art21", "bs", "current_liab", "leaf", 235, "Tax Payable - Art 21", "Hutang PPh 21", 2),
  L("bs.tax_art22", "bs", "current_liab", "leaf", 236, "Tax Payable - Art 22", "Hutang PPh 22", 2),
  L("bs.tax_art23", "bs", "current_liab", "leaf", 237, "Tax Payable - Art 23", "Hutang PPh 23", 2),
  L("bs.tax_art25", "bs", "current_liab", "leaf", 238, "Tax Payable - Art 25", "Hutang PPh 25", 2),
  L("bs.vat_out", "bs", "current_liab", "leaf", 239, "Value added Tax - Out", "PPN keluaran", 2),
  L("bs.tax_final", "bs", "current_liab", "leaf", 240, "Final Tax Payable", "Hutang PPh final", 2),
  L("bs.deposit_payable", "bs", "current_liab", "leaf", 241, "Deposit Payable", "Deposit pelanggan", 1),
  L("bs.accrued", "bs", "current_liab", "total", 242, "Accrued expenses", "Biaya masih harus dibayar", 1, {
    sum: ["bs.accrued_bpjs", "bs.accrued_thr", "bs.accrued_bonus", "bs.accrued_utility", "bs.accrued_others"],
  }),
  L("bs.accrued_bpjs", "bs", "current_liab", "leaf", 243, "Accrued BPJS", "BPJS masih harus dibayar", 2),
  L("bs.accrued_thr", "bs", "current_liab", "leaf", 244, "Accrued THR & Bonus", "THR dan bonus masih harus dibayar", 2),
  L("bs.accrued_bonus", "bs", "current_liab", "leaf", 245, "Accrued Bonus", "Bonus masih harus dibayar", 2),
  L("bs.accrued_utility", "bs", "current_liab", "leaf", 246, "Accrued Utility", "Utilitas masih harus dibayar", 2),
  L("bs.accrued_others", "bs", "current_liab", "leaf", 247, "Accrued Others", "Lain-lain masih harus dibayar", 2),
  L("bs.current_portion", "bs", "current_liab", "total", 248, "Current portion", "Bagian lancar", 1, { sum: ["bs.lease_current"] }),
  L("bs.lease_current", "bs", "current_liab", "leaf", 249, "Current Maturities of Lease Liability", "Sewa pembiayaan jatuh tempo", 2),
  L("bs.current_liabilities", "bs", "current_liab", "total", 250, "Current liabilities", "Liabilitas lancar", 0, {
    sum: ["bs.st_bank_loans", "bs.trade_payables", "bs.other_payables", "bs.tax_payables", "bs.deposit_payable", "bs.accrued", "bs.current_portion"], summary: true,
  }),
  L("bs.employee_benefits", "bs", "noncurrent_liab", "leaf", 251, "Employee Benefit Liabilities", "Liabilitas imbalan kerja", 1),
  L("bs.noncurrent_liabilities", "bs", "noncurrent_liab", "total", 252, "Non-current liabilities", "Liabilitas jangka panjang", 0, { sum: ["bs.employee_benefits"], summary: true }),
  L("bs.liabilities", "bs", "total_liab", "total", 253, "Liabilities", "Total liabilitas", 0, { sum: ["bs.current_liabilities", "bs.noncurrent_liabilities"], summary: true }),
  L("bs.net_assets", "bs", "net_assets", "total", 254, "Net assets", "Aset bersih", 0, { sum: ["bs.assets", "-bs.liabilities"] }),
  L("bs.share_capital", "bs", "equity", "leaf", 255, "Share Capital", "Modal disetor", 1),
  L("bs.apic", "bs", "equity", "leaf", 256, "Additional paid-in capital (TA)", "Tambahan modal disetor", 1),
  L("bs.retained_earnings", "bs", "equity", "leaf", 257, "R/E", "Laba ditahan", 1),
  L("bs.current_profit", "bs", "equity", "leaf", 258, "Current profit/loss", "Laba tahun berjalan", 1, { summary: true }),
  L("bs.capital_reserve", "bs", "equity", "leaf", 259, "Capital Reserve", "Cadangan modal", 1),
  L("bs.dividend", "bs", "equity", "leaf", 260, "Dividend", "Dividen", 1),
  L("bs.oci", "bs", "equity", "leaf", 261, "OCI", "Penghasilan komprehensif lain", 1),
  L("bs.equity", "bs", "equity", "total", 262, "Shareholders' equity", "Ekuitas", 0, {
    sum: ["bs.share_capital", "bs.apic", "bs.retained_earnings", "bs.current_profit", "bs.capital_reserve", "bs.dividend", "bs.oci"], summary: true,
  }),
];

export const FS_LINE_BY_CODE: ReadonlyMap<string, FsLineDef> = new Map(FS_LINES.map((l) => [l.code, l]));

export function fsLine(code: string): FsLineDef {
  const l = FS_LINE_BY_CODE.get(code);
  if (!l) throw new Error(`Unknown fs_line ${code}`);
  return l;
}

/** Lines whose amount comes from TB accounts through coa_fs_map (every leaf except the computed current profit). */
export const TB_LEAVES = FS_LINES.filter((l) => l.kind === "leaf" && l.code !== "bs.current_profit").map((l) => l.code);

/** Totals in dependency order (a total after every total it uses). */
export const TOTALS_IN_ORDER: FsLineDef[] = (() => {
  const totals = FS_LINES.filter((l) => l.kind === "total");
  const out: FsLineDef[] = [];
  const done = new Set<string>();
  const visit = (l: FsLineDef, stack: string[]) => {
    if (done.has(l.code)) return;
    if (stack.includes(l.code)) throw new Error(`Cycle in fs_line totals at ${l.code}`);
    for (const c of l.sum ?? []) {
      const dep = FS_LINE_BY_CODE.get(c.replace(/^-/, ""));
      if (dep?.kind === "total") visit(dep, [...stack, l.code]);
    }
    done.add(l.code);
    out.push(l);
  };
  for (const t of totals) visit(t, []);
  return out;
})();

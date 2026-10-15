/**
 * Seed of `coa_fs_map` (PRD v2 §5.1, D10) from the account sheets of BP v1 ("BS/PL Actual MTM - Aug 26"): the
 * "Mapping" column names the BP row an account rolls into. Accounts the BP sheet maps are seeded confirmed; accounts
 * with an Accurate group code but no BP mapping (all zero Jan–Agu 2026) get a draft by group, and the new Okt-26
 * accounts (D10) a draft by name. Pure: the generator script and the tests pass the extracted rows in.
 */
import { FS_LINE_BY_CODE } from "./fs-lines";

export interface MtmAccount {
  sheet: string;
  account: string;
  name: string;
  kode: string | null;
  mapping: string | null;
  values: Record<string, string>;
}

export interface CoaFsSeedRow {
  account: string;
  account_name: string;
  effective_from: string;
  effective_to: string | null;
  fs_line_code: string;
  sign: number;
  accurate_code: string | null;
  confirmed: boolean;
  note: string;
  source: string;
}

/** BP "Mapping" label → fs_line (labels the BP sheet sums by name, plus the five it reads by cell). */
const BY_LABEL: Record<string, string> = {
  "Cash and cash equivalents": "bs.cash",
  "Trade Receivables - Third Parties": "bs.trade_receivables_third",
  "Trade Receivables - Related Parties": "bs.trade_receivables_related",
  "Other Receivables - third parties": "bs.other_receivables_third",
  "Other Receivables - Related Parties": "bs.other_receivables_related",
  "Shareholders Receivables": "bs.shareholder_receivables",
  "Raw Materials": "bs.inv_raw",
  "Work in Progress": "bs.inv_wip",
  "Finished Goods": "bs.inv_fg",
  "Tekhnik Supplies": "bs.inv_technical",
  "Prepaid Rent": "bs.prepaid_rent",
  "Prepaid Insurance": "bs.prepaid_insurance",
  "Prepaid THR": "bs.prepaid_thr",
  "Prepaid Others": "bs.prepaid_others",
  "Prepaid Art 21": "bs.prepaid_art21",
  "Prepaid Art 22": "bs.prepaid_art22",
  "Prepaid Art 23": "bs.prepaid_art23",
  "Prepaid Art 25": "bs.prepaid_art25",
  "Value Added Tax - In": "bs.vat_in",
  "Advance Payment": "bs.advance_payment",
  "Deferred Tax Asset": "bs.deferred_tax_asset",
  "Buildings": "bs.fa_buildings",
  "Vehicles": "bs.fa_vehicles",
  "Office Furniture and Equipment": "bs.fa_office",
  "Factory Equipment": "bs.fa_factory_equipment",
  "Machinery": "bs.fa_machinery",
  "Acc. Depreciation - Buildings": "bs.ad_buildings",
  "Acc. Depreciation - Vehicles": "bs.ad_vehicles",
  "Acc. Depreciation - Office Furniture and Equipment": "bs.ad_office",
  "Acc. Depreciation - Factory Equipment": "bs.ad_factory_equipment",
  "Acc. Depreciation - Machinery": "bs.ad_machinery",
  "Short-term bank loans": "bs.st_bank_loans",
  "Trade Payables - Third Parties": "bs.trade_payables_third",
  "Other Payable - Third Parties": "bs.other_payables_third",
  "Other Payable - Related Parties": "bs.other_payables_related",
  "Deposit Payable": "bs.deposit_payable",
  "Current Maturities of Lease Liability": "bs.lease_current",
  "Tax Payable - Art 21": "bs.tax_art21",
  "Tax Payable - Art 22": "bs.tax_art22",
  "Tax Payable - Art 23": "bs.tax_art23",
  "Tax Payable - Art 25": "bs.tax_art25",
  "Value added Tax - Out": "bs.vat_out",
  "Final Tax Payable": "bs.tax_final",
  "Accrued Utility": "bs.accrued_utility",
  "Accrued THR & Bonus": "bs.accrued_thr",
  "Employee Benefit Liabilities": "bs.employee_benefits",
  "Shareholder Equity": "bs.share_capital",
  "- Beginning retained earnings": "bs.retained_earnings",
  "- Beginning - OCI": "bs.oci",
  "Dividend": "bs.dividend",
  "Capital Reserves": "bs.capital_reserve",
  "Revenue": "pl.revenue_gross",
  "Sales Return": "pl.sales_return",
  "COGM Bahan Jadi": "pl.cogm_material",
  "DL - Basic Salary": "pl.dl_basic",
  "DL - THR And Bonus": "pl.dl_thr",
  "DL - Others": "pl.dl_others",
  "DL - BPJS": "pl.dl_bpjs",
  "Electricity": "pl.electricity",
  "Water": "pl.water",
  "Biaya Rumah Tangga Pabrik": "pl.factory_household",
  "Maintenance - Machinery": "pl.maint_machinery",
  "Maintenance - Factory": "pl.maint_factory",
  "Maintenance - Factory Equipments": "pl.maint_factory_equipment",
  "Depreciation - Machinery": "pl.dep_machinery",
  "Other selling Expense": "pl.other_selling",
  "Commission Expenses": "pl.commission",
  "Delivery Expenses - SE": "pl.delivery_selling",
  "Salaries and allowance": "pl.salaries_ga",
  "Office Transportation expenses": "pl.transport",
  "Maintenance Expenses": "pl.maintenance_ga",
  "Insurance Expenses": "pl.insurance",
  "Office Supplies Expenses": "pl.office_supplies",
  "Communication Expenses": "pl.communication",
  "Rent Expenses": "pl.rent",
  "Representation and Donations": "pl.representation",
  "Professional Expenses": "pl.professional",
  "Tax & Permit": "pl.tax_permit",
  "Finance Income": "pl.finance_income",
  "Gain (loss) from sell of fixed assets": "pl.gain_asset_sale",
  "Other income": "pl.other_income",
  "Finance Expenses": "pl.finance_expense",
  "Other Expense": "pl.other_expense",
  "Depreciation Expenses": "pl.depreciation_opex",
};

/**
 * Labels the BP sheet does not sum anywhere, resolved by decision (docs/open-questions.md §C, K2-F):
 * - "Accrued Expenses - Third Parties" (BYMHD 2101-0xx, all zero Jan–Agu) → Accrued Others;
 * - "Taxes Payable" (PPh 26, PPh 29) → Tax Payable Art 25;
 * - "Vairance Productions" (5101-015) → material: BP keeps row 83 outside its HPP total, Accurate groups the account
 *   with COGM (PL 04), and a TB month's HPP must equal the GL;
 * - "Delivery Expenses" is two BP rows: the COGS account 5101-016 → row 84, the opex accounts 6300-00x → row 100.
 */
function byDecision(a: MtmAccount): string | null {
  if (a.mapping === "Accrued Expenses - Third Parties") return "bs.accrued_others";
  if (a.mapping === "Taxes Payable") return "bs.tax_art25";
  if (a.mapping === "Vairance Productions") return "pl.cogm_material";
  if (a.mapping === "Delivery Expenses") return a.account.startsWith("5") ? "pl.delivery_cogs" : "pl.delivery_ga";
  if (["8300-001", "8100-001"].includes(a.account)) return "pl.income_tax"; // BP row 119 sums PL 82 + PL 83 by code
  return null;
}

/** Draft line for an account the BP sheet leaves unmapped (zero Jan–Agu): by Accurate group, then by account prefix. */
function draftLine(a: MtmAccount): string | null {
  const byKode: Record<string, string> = {
    "BS 04": "bs.trade_receivables_third", "BS 05": "bs.trade_receivables_related", "BS 10": "bs.trade_receivables_third",
    "BS 11": "bs.trade_receivables_third", "BS 12": "bs.other_receivables_third", "BS 13": "bs.advance_payment",
    "BS 18": "bs.inv_raw", "BS 21": "bs.advance_payment", "BS 25": "bs.trade_payables_related", "BS 29": "bs.other_payables_related",
    "BS 32": "bs.lease_current", "BS 33": "bs.tax_final", "BS 36": "bs.st_bank_loans", "BS 38": "bs.retained_earnings",
    "BS 40": "bs.ad_office",
  };
  if (a.account === "1201-010") return "bs.fa_office";
  if (a.account === "1203-002") return "bs.other_assets";
  if (a.kode && byKode[a.kode]) return byKode[a.kode];
  const p = a.account.slice(0, 2);
  const byPrefix: Record<string, string> = {
    "41": "pl.revenue_gross", "51": "pl.cogm_material", "61": "pl.other_selling", "62": "pl.salaries_ga", "63": "pl.office_supplies",
    "64": "pl.other_expense", "65": "pl.depreciation_opex", "66": "pl.tax_permit", "71": "pl.other_income", "81": "pl.income_tax",
    "82": "pl.other_expense", "83": "pl.income_tax",
  };
  return a.kode ? byPrefix[p] ?? null : null;
}

/** Sign that turns a debit-positive TB balance into the BP presentation (assets +, liabilities/equity +, costs −). */
export function fsSign(code: string): number {
  const def = FS_LINE_BY_CODE.get(code);
  if (!def) throw new Error(`Unknown fs_line ${code}`);
  return def.statement === "bs" && (def.section === "current_asset" || def.section === "fixed_asset") ? 1 : -1;
}

/** New accounts of the Okt-26 COA (D10), drafts by name (see coa_pool_map Okt-26). */
export const OKT26_DRAFTS: { account: string; name: string; code: string }[] = [
  ...["111", "121", "131", "141"].map((x) => ({ account: `5101-${x}`, name: "Upah (pecahan 5101-002)", code: "pl.dl_basic" })),
  ...["112", "113", "122", "132", "133", "142", "143"].map((x) => ({ account: `5101-${x}`, name: "THR/bonus (pecahan 5101-003)", code: "pl.dl_thr" })),
  ...["114", "124", "134", "144"].map((x) => ({ account: `5101-${x}`, name: "BPJS (pecahan 5101-005)", code: "pl.dl_bpjs" })),
  { account: "5101-150", name: "Pesangon (pecahan 5101-004)", code: "pl.dl_others" },
  { account: "5101-017", name: "Penyusutan inventaris pabrik", code: "pl.dep_machinery" },
  ...["201", "202", "203", "204", "205", "206", "207"].map((x) => ({ account: `5101-${x}`, name: "Varian/pemakaian per jenis bahan", code: "pl.cogm_material" })),
  ...["301", "302", "303"].map((x) => ({ account: `5101-${x}`, name: "Varian produksi per lini", code: "pl.cogm_material" })),
];

const SRC = "BMG_Business_Plan_-_Oct26_to_Dec27.xlsx";

export function coaFsSeed(accounts: readonly MtmAccount[]): { rows: CoaFsSeedRow[]; skipped: string[] } {
  const rows: CoaFsSeedRow[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  for (const a of accounts) {
    if (seen.has(a.account)) continue;
    const decided = byDecision(a);
    const mapped = decided ?? (a.mapping ? BY_LABEL[a.mapping] : undefined) ?? null;
    const code = mapped ?? draftLine(a);
    if (!code) {
      skipped.push(a.account);
      continue;
    }
    seen.add(a.account);
    rows.push({
      account: a.account, account_name: a.name, effective_from: "2026-01-01", effective_to: null,
      fs_line_code: code, sign: fsSign(code), accurate_code: a.kode, confirmed: !!mapped,
      note: decided ? "Keputusan K2-F (BP tidak menjumlah label ini apa adanya)" : mapped ? `BP v1 Mapping: ${a.mapping}` : "Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)",
      source: `${SRC} ${a.sheet}`,
    });
  }
  for (const d of OKT26_DRAFTS) {
    if (seen.has(d.account)) continue;
    seen.add(d.account);
    rows.push({
      account: d.account, account_name: d.name, effective_from: "2026-10-01", effective_to: null, fs_line_code: d.code,
      sign: fsSign(d.code), accurate_code: null, confirmed: false, note: "Draft COA Okt-26 (D10); konfirmasi Finance", source: "PRD v2 D10; coa_pool_map Okt-26",
    });
  }
  return { rows, skipped };
}

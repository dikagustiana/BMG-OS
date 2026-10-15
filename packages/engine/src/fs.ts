/**
 * Balance sheet, working capital, cash flow and FS checks (PRD v2 §4.11, §5.4–§5.5; Fase 1b). Pure.
 *
 * Two sources feed a month:
 * - BP v1 sheet "BMG Business Plan" (history Jan–Agu 2026 = column Actual, budget Sep-26–Des-27 = column BP): every
 *   line is imported as-is (`source = bp_fs_actual | bp_fs_budget`); the engine only fills totals that are missing.
 * - TB/LK Accurate per account (`tb_month`, Sep-26 onwards): leaves come from accounts through `coa_fs_map`; totals,
 *   working capital and the indirect cash flow are computed with the BP sheet's own formulas (rows 127–181).
 */
import { D, Decimal, sum, ZERO } from "./decimal";
import { daysInMonth } from "./dates";
import { fixed, pct } from "./format";
import { FS_LINE_BY_CODE, FS_LINES, TOTALS_IN_ORDER } from "./fs-lines";
import type { ControlResult } from "./types";

export type FsBasis = "actual" | "bp";
export type FsSource = "bp_fs_actual" | "bp_fs_budget" | "tb_month";
export type Lines = Map<string, Decimal>;

export const FS_RULE = "fs@1";

const RP1 = D(1);
const at = (l: Lines, code: string): Decimal => l.get(code) ?? ZERO;
const total = (l: Lines, codes: string[]): Decimal => sum(codes.map((c) => at(l, c)));

/** Value of a total line from its components (prefix "-" subtracts). */
export function totalOf(l: Lines, code: string): Decimal {
  const def = FS_LINE_BY_CODE.get(code);
  if (!def?.sum) throw new Error(`${code} is not a total`);
  return sum(def.sum.map((c) => (c.startsWith("-") ? at(l, c.slice(1)).neg() : at(l, c))));
}

/**
 * Fill totals. `recompute` (TB months) overwrites every total from its leaves; otherwise (BP months) an imported total
 * is kept and only missing totals are computed.
 */
export function withTotals(lines: Lines, recompute: boolean): Lines {
  const out = new Map(lines);
  for (const t of TOTALS_IN_ORDER) {
    if (recompute || !out.has(t.code)) out.set(t.code, totalOf(out, t.code));
  }
  return out;
}

/** Totals of an imported (BP) month whose value differs from the Σ of its components by more than Rp 1. */
export function tieDiffs(lines: Lines): { code: string; imported: Decimal; computed: Decimal }[] {
  const out: { code: string; imported: Decimal; computed: Decimal }[] = [];
  for (const t of TOTALS_IN_ORDER) {
    const imp = lines.get(t.code);
    if (!imp) continue;
    const comp = totalOf(lines, t.code);
    if (imp.minus(comp).abs().gt(RP1)) out.push({ code: t.code, imported: imp, computed: comp });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------- TB → leaves

export interface TbRow {
  account: string;
  /** Debit-positive (debit − credit) balances; movement of the month = debit − credit. */
  balance_open: Decimal | null;
  debit: Decimal;
  credit: Decimal;
  balance_close: Decimal;
}

export interface CoaFsMapRow {
  account: string;
  effective_from: string;
  effective_to: string | null;
  fs_line_code: string;
  sign: number;
  confirmed: boolean;
}

/** P&L accounts (revenue 4, cost 5, opex 6, other 7, tax/OCI 8): their month movement feeds the P&L; YTD balance the current profit. */
export const isPlAccount = (account: string) => /^[4-8]/.test(account);

export function activeFsMap(maps: readonly CoaFsMapRow[], account: string, month: string): CoaFsMapRow | null {
  const end = month.slice(0, 8) + String(daysInMonth(month)).padStart(2, "0");
  const hits = maps.filter((m) => m.account === account && m.effective_from <= end && (m.effective_to === null || m.effective_to >= month));
  hits.sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
  return hits[0] ?? null;
}

/** A TB row that carries nothing for the month (all zero) needs no mapping. */
const isEmptyTb = (r: TbRow) => r.debit.isZero() && r.credit.isZero() && r.balance_close.isZero() && (r.balance_open ?? ZERO).isZero();

export interface TbLeaves {
  lines: Lines;
  /** Accounts with an amount and no active mapping (F07 → blocks the upload). */
  unmapped: string[];
  /** Accounts mapped by a draft (unconfirmed) row (F07 → PERIKSA). */
  draft: string[];
  /** Accounts used per line (SourceTrace). */
  accountsByLine: Map<string, string[]>;
}

/**
 * Leaves of one month from the trial balance: balance sheet accounts at closing balance, P&L accounts at the month's
 * movement, both × sign; current profit = −Σ YTD closing balance of P&L accounts (debit-positive → profit).
 */
export function leavesFromTb(month: string, tb: readonly TbRow[], maps: readonly CoaFsMapRow[]): TbLeaves {
  const lines: Lines = new Map();
  const unmapped: string[] = [];
  const draft: string[] = [];
  const accountsByLine = new Map<string, string[]>();
  let ytdPl = ZERO;
  for (const r of tb) {
    const pl = isPlAccount(r.account);
    if (pl) ytdPl = ytdPl.plus(r.balance_close);
    if (isEmptyTb(r)) continue;
    const amount = pl ? r.debit.minus(r.credit) : r.balance_close;
    const m = activeFsMap(maps, r.account, month);
    if (!m) {
      if (!amount.isZero() || (!pl && !r.balance_close.isZero())) unmapped.push(r.account);
      continue;
    }
    if (!m.confirmed) draft.push(r.account);
    const def = FS_LINE_BY_CODE.get(m.fs_line_code);
    if (!def || def.kind !== "leaf") throw new Error(`coa_fs_map ${r.account} → ${m.fs_line_code} is not a leaf line`);
    lines.set(m.fs_line_code, at(lines, m.fs_line_code).plus(amount.times(m.sign)));
    accountsByLine.set(m.fs_line_code, [...(accountsByLine.get(m.fs_line_code) ?? []), r.account]);
  }
  lines.set("bs.current_profit", ytdPl.neg());
  return { lines, unmapped: [...new Set(unmapped)].sort(), draft: [...new Set(draft)].sort(), accountsByLine };
}

// ------------------------------------------------------------------------------------------- working capital

export interface NwcResult {
  trade_receivables: Decimal;
  inventories: Decimal;
  trade_payables: Decimal;
  nwc: Decimal;
  /** prev NWC − NWC (BP row 131); null without a previous month. */
  delta_nwc_cash: Decimal | null;
  revenue_gross: Decimal;
  cost_of_revenue: Decimal;
  days_in_month: number;
  /** Days of revenue / cost (PRD §7.5: piutang dagang ÷ pendapatan bulan × hari). Null when the base is zero. */
  dso: Decimal | null;
  dio: Decimal | null;
  dpo: Decimal | null;
}

/** NWC = piutang dagang + persediaan − hutang dagang (Q26, BP rows 127–130). */
export function workingCapital(month: string, l: Lines, prev: Lines | null): NwcResult {
  const tr = at(l, "bs.trade_receivables");
  const inv = at(l, "bs.inventories");
  const tp = at(l, "bs.trade_payables");
  const nwc = tr.plus(inv).minus(tp);
  const prevNwc = prev ? at(prev, "bs.trade_receivables").plus(at(prev, "bs.inventories")).minus(at(prev, "bs.trade_payables")) : null;
  const days = daysInMonth(month);
  const rev = at(l, "pl.revenue_gross");
  const cor = at(l, "pl.cost_of_revenue").neg();
  const per = (num: Decimal, base: Decimal) => (base.isZero() ? null : num.div(base).times(days));
  return {
    trade_receivables: tr, inventories: inv, trade_payables: tp, nwc,
    delta_nwc_cash: prevNwc ? prevNwc.minus(nwc) : null,
    revenue_gross: rev, cost_of_revenue: cor, days_in_month: days,
    dso: per(tr, rev), dio: per(inv, cor), dpo: per(tp, cor),
  };
}

export function wcLines(n: NwcResult): Lines {
  const out: Lines = new Map([
    ["wc.trade_receivables", n.trade_receivables],
    ["wc.trade_payables", n.trade_payables.neg()],
    ["wc.inventories", n.inventories],
    ["wc.nwc", n.nwc],
  ]);
  if (n.delta_nwc_cash) out.set("wc.delta_cash", n.delta_nwc_cash);
  return out;
}

// ----------------------------------------------------------------------------------------------- cash flow

const LABOUR = ["pl.dl_basic", "pl.dl_thr", "pl.dl_bpjs", "pl.dl_others", "pl.idl_basic", "pl.idl_thr", "pl.idl_bpjs"];
const ACC_DEP = ["bs.ad_buildings", "bs.ad_vehicles", "bs.ad_office", "bs.ad_factory_equipment", "bs.ad_machinery"];

/** Indirect cash flow of a month from the previous and current balance sheet and the month's P&L (BP rows 134–181). */
export function cashflow(prev: Lines, cur: Lines): Lines {
  const d = (code: string) => at(cur, code).minus(at(prev, code)); // increase
  const dec = (code: string) => d(code).neg(); // decrease
  const cf: Lines = new Map();
  const put = (code: string, v: Decimal) => { cf.set(code, v); return v; };

  const receipts = [
    put("cf.revenue", at(cur, "pl.revenue")),
    put("cf.d_trade_receivables", dec("bs.trade_receivables")),
    put("cf.d_prepaid_tax", dec("bs.prepaid_tax")),
    put("cf.d_shareholder_receivables", dec("bs.shareholder_receivables")),
    put("cf.d_customer_deposits", d("bs.deposit_payable")),
  ];
  put("cf.receipts", sum(receipts));
  const paidCor = [
    put("cf.cost_of_revenue", at(cur, "pl.cost_of_revenue")),
    put("cf.addback_direct_labour", total(cur, LABOUR).neg()),
    put("cf.addback_depreciation", total(prev, ACC_DEP).minus(total(cur, ACC_DEP))),
    put("cf.d_deferred_tax_other", total(prev, ["bs.deferred_tax_asset", "bs.other_assets"]).minus(total(cur, ["bs.deferred_tax_asset", "bs.other_assets"]))),
    put("cf.d_other_receivables", total(prev, ["bs.other_receivables_third", "bs.other_receivables_related"])
      .minus(total(cur, ["bs.other_receivables_third", "bs.other_receivables_related"]))),
    put("cf.d_inventories", dec("bs.inventories")),
    put("cf.d_advance_payments", dec("bs.advance_payment")),
    put("cf.d_trade_payables", d("bs.trade_payables")),
    put("cf.d_other_payables", d("bs.other_payables")),
  ];
  put("cf.paid_cost_of_revenue", sum(paidCor));
  const paidOpex = [
    put("cf.opex", at(cur, "pl.opex")),
    put("cf.addback_ga_salaries", at(cur, "pl.salaries_ga").neg()),
    put("cf.addback_dep_opex", ZERO),
    put("cf.d_employee_benefits", d("bs.employee_benefits")),
    put("cf.d_accrued", d("bs.accrued")),
    put("cf.d_prepaid_expenses", dec("bs.prepaid_expenses")),
  ];
  put("cf.paid_opex", sum(paidOpex));
  put("cf.salaries_paid", total(cur, LABOUR).plus(at(cur, "pl.salaries_ga")));
  put("cf.tax_paid", at(cur, "pl.income_tax").plus(d("bs.tax_payables")));
  put("cf.finance_other_net", total(cur, ["pl.finance_income", "pl.other_income", "pl.other_expense", "pl.gain_asset_sale"]));
  const cfo = put("cf.cfo", total(cf, ["cf.receipts", "cf.paid_cost_of_revenue", "cf.paid_opex", "cf.salaries_paid", "cf.tax_paid", "cf.finance_other_net"]));

  const cfi = put("cf.cfi", sum([
    put("cf.capex_machinery", total(cur, ["bs.fa_machinery", "bs.fa_factory_equipment"]).minus(total(prev, ["bs.fa_machinery", "bs.fa_factory_equipment"])).neg()),
    put("cf.capex_vehicles", d("bs.fa_vehicles").neg()),
    put("cf.capex_buildings", d("bs.fa_buildings").neg()),
    put("cf.capex_office", d("bs.fa_office").neg()),
  ]));

  const eq = ["bs.share_capital", "bs.apic", "bs.capital_reserve", "bs.oci"];
  const cff = put("cf.cff", sum([
    put("cf.lease", d("bs.lease_current")),
    put("cf.wc_loan", d("bs.st_bank_loans")),
    put("cf.related_party_loan", ZERO),
    put("cf.shareholder_loan", ZERO),
    put("cf.bank_loan_repayment", ZERO),
    put("cf.interest_paid", at(cur, "pl.finance_expense")),
    put("cf.equity_movements", total(cur, eq).minus(total(prev, eq))),
    put("cf.dividends", d("bs.dividend")),
  ]));
  const net = put("cf.net", cfo.plus(cfi).plus(cff));
  const open = put("cf.open", at(prev, "bs.cash"));
  put("cf.close", net.plus(open));
  return cf;
}

// ----------------------------------------------------------------------------------------------- FS checks

export interface FsCheckInput {
  month: string;
  lines: Lines;
  /** Cash flow of the month (imported or computed); null when no previous balance sheet exists. */
  cf: Lines | null;
  /** Σ net profit Jan..month of the same year (same basis, actual where the basis has no month); null when a month is missing. */
  ytdNetProfit: Decimal | null;
  /** Threshold for F06 (assumption.related_party_pct, Q27 default 0,10). */
  relatedPartyPct: Decimal;
  /** F04: inventory in the WP (REKON PERSEDIAAN) ± K1–K6 explanation; null until the recon module has the month. */
  inventoryRecon: { wp: Decimal; explained: Decimal } | null;
  /** F07: only for TB months. */
  tb: { unmapped: string[]; draft: string[] } | null;
}

const ok = (diff: Decimal, tol: Decimal): "LULUS" | "GAGAL" => (diff.abs().lte(tol) ? "LULUS" : "GAGAL");

export function fsChecks(i: FsCheckInput): ControlResult[] {
  const l = i.lines;
  const out: ControlResult[] = [];
  const f01 = at(l, "bs.assets").minus(at(l, "bs.liabilities").plus(at(l, "bs.equity")));
  out.push({ code: "F01", label: "Total aset = liabilitas + ekuitas", value: f01, tolerance: RP1, status: ok(f01, RP1),
    note: `Aset ${fixed(at(l, "bs.assets"), 2)} − liabilitas ${fixed(at(l, "bs.liabilities"), 2)} − ekuitas ${fixed(at(l, "bs.equity"), 2)}` });
  if (i.cf) {
    const f02 = at(i.cf, "cf.close").minus(at(l, "bs.cash"));
    out.push({ code: "F02", label: "Kas akhir arus kas = kas neraca", value: f02, tolerance: RP1, status: ok(f02, RP1),
      note: `Arus kas ${fixed(at(i.cf, "cf.close"), 2)} − neraca ${fixed(at(l, "bs.cash"), 2)}` });
  } else {
    out.push({ code: "F02", label: "Kas akhir arus kas = kas neraca", value: null, tolerance: RP1, status: "BELUM_DIISI",
      note: "Neraca bulan sebelumnya belum ada, arus kas tidak bisa dihitung" });
  }
  const f03 = at(l, "bs.net_assets").minus(at(l, "bs.equity"));
  out.push({ code: "F03", label: "Aset bersih = ekuitas", value: f03, tolerance: RP1, status: ok(f03, RP1),
    note: `Aset bersih ${fixed(at(l, "bs.net_assets"), 2)} − ekuitas ${fixed(at(l, "bs.equity"), 2)}` });
  const inv = total(l, ["bs.inv_raw", "bs.inv_wip", "bs.inv_fg"]);
  if (i.inventoryRecon) {
    const f04 = inv.minus(i.inventoryRecon.wp.plus(i.inventoryRecon.explained));
    const tol = D(1000);
    out.push({ code: "F04", label: "Persediaan neraca (bahan baku, WIP, barang jadi) = rekon persediaan WP ± K1–K6", value: f04, tolerance: tol,
      status: ok(f04, tol), note: `Neraca ${fixed(inv, 2)} − WP ${fixed(i.inventoryRecon.wp, 2)} − penjelasan ${fixed(i.inventoryRecon.explained, 2)}` });
  } else {
    out.push({ code: "F04", label: "Persediaan neraca (bahan baku, WIP, barang jadi) = rekon persediaan WP ± K1–K6", value: null, tolerance: D(1000),
      status: "BELUM_DIISI", note: "Rekon persediaan bulan ini belum dihitung" });
  }
  if (i.ytdNetProfit) {
    const f05 = at(l, "bs.current_profit").minus(i.ytdNetProfit);
    out.push({ code: "F05", label: "Laba tahun berjalan di neraca = laba bersih s.d. bulan ini", value: f05, tolerance: RP1, status: ok(f05, RP1),
      note: `Neraca ${fixed(at(l, "bs.current_profit"), 2)} − laba rugi s.d. bulan ini ${fixed(i.ytdNetProfit, 2)}` });
  } else {
    out.push({ code: "F05", label: "Laba tahun berjalan di neraca = laba bersih s.d. bulan ini", value: null, tolerance: RP1, status: "BELUM_DIISI",
      note: "Laba rugi salah satu bulan sebelumnya di tahun ini belum ada" });
  }
  const eq = at(l, "bs.equity");
  const rel = at(l, "bs.other_receivables_related");
  const ratio = eq.isZero() ? null : rel.div(eq);
  out.push({
    code: "F06", label: "Piutang lain-lain pihak berelasi ≤ batas % ekuitas", value: ratio, tolerance: i.relatedPartyPct,
    status: ratio === null ? "BELUM_DIISI" : ratio.gt(i.relatedPartyPct) ? "PERIKSA" : "LULUS",
    note: ratio === null ? "Ekuitas nol" : `${fixed(rel, 2)} = ${pct(ratio, 1)} ekuitas (batas ${pct(i.relatedPartyPct, 0)})`,
  });
  if (i.tb) {
    const status = i.tb.unmapped.length ? "BELUM_DIISI" : i.tb.draft.length ? "PERIKSA" : "LULUS";
    out.push({
      code: "F07", label: "Mapping akun ke baris neraca/laba rugi aktif untuk setiap akun TB", value: D(i.tb.unmapped.length + i.tb.draft.length),
      tolerance: null, status,
      note: i.tb.unmapped.length ? `Tanpa mapping: ${i.tb.unmapped.join(", ")}` : i.tb.draft.length ? `Mapping draft: ${i.tb.draft.join(", ")}` : "Semua akun ber-mapping aktif",
    });
  }
  return out;
}

// -------------------------------------------------------------------------------------- one month, all outputs

export interface FsMonthSource {
  month: string;
  basis: FsBasis;
  source: FsSource;
  /** Imported lines (BP) or TB leaves; Rp. */
  lines: Lines;
  /** Imported cash flow lines (BP); absent for TB months. */
  importedCf?: Lines;
  tb?: { unmapped: string[]; draft: string[] };
  budget_version_id?: string | null;
  /** SourceTrace per line: BP cell or accounts. */
  sourceRef?: Map<string, string>;
}

export interface FsMonthResult {
  month: string;
  basis: FsBasis;
  source: FsSource;
  lines: Lines;
  cf: Lines | null;
  nwc: NwcResult;
  checks: ControlResult[];
  tieDiffs: { code: string; imported: Decimal; computed: Decimal }[];
  budget_version_id: string | null;
  sourceRef: Map<string, string>;
}

export interface RebuildFsInput {
  months: FsMonthSource[];
  relatedPartyPct: Decimal;
  inventoryRecon?: Map<string, { wp: Decimal; explained: Decimal }>;
}

const prevMonth = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  const py = mo === 1 ? y - 1 : y;
  const pm = mo === 1 ? 12 : mo - 1;
  return `${py}-${String(pm).padStart(2, "0")}-01`;
};

/**
 * Every month and basis: statements with totals, working capital, cash flow (imported for BP, computed for TB when the
 * previous month's balance sheet exists in the same basis — or in actual for the first BP month), and checks.
 * Months are processed in order so a TB month can use the previous month's balance sheet.
 */
export function rebuildFs(input: RebuildFsInput): FsMonthResult[] {
  const sorted = [...input.months].sort((a, b) => (a.month === b.month ? a.basis.localeCompare(b.basis) : a.month < b.month ? -1 : 1));
  const done = new Map<string, FsMonthResult>();
  const key = (m: string, b: FsBasis) => `${m}|${b}`;
  const out: FsMonthResult[] = [];
  for (const s of sorted) {
    const recompute = s.source === "tb_month";
    const lines = withTotals(s.lines, recompute);
    const prev = done.get(key(prevMonth(s.month), s.basis)) ?? (s.basis === "bp" ? done.get(key(prevMonth(s.month), "actual")) : undefined);
    let cf: Lines | null = null;
    if (s.importedCf && s.importedCf.size) cf = s.importedCf;
    else if (prev) cf = cashflow(prev.lines, lines);
    const nwc = workingCapital(s.month, lines, prev ? prev.lines : null);
    for (const [k, v] of wcLines(nwc)) if (!lines.has(k) || recompute) lines.set(k, v);
    // YTD net profit: months Jan..this of the year, same basis, falling back to actual for months the basis lacks.
    const year = s.month.slice(0, 4);
    let ytd: Decimal | null = at(lines, "pl.net_profit");
    for (let m = `${year}-01-01`; m < s.month; m = nextMonth(m)) {
      const r = done.get(key(m, s.basis)) ?? done.get(key(m, "actual"));
      if (!r || !r.lines.has("pl.net_profit")) { ytd = null; break; }
      ytd = ytd.plus(at(r.lines, "pl.net_profit"));
    }
    const checks = fsChecks({
      month: s.month, lines, cf, ytdNetProfit: lines.has("pl.net_profit") ? ytd : null,
      relatedPartyPct: input.relatedPartyPct, inventoryRecon: input.inventoryRecon?.get(s.month) ?? null, tb: s.tb ?? null,
    });
    const res: FsMonthResult = {
      month: s.month, basis: s.basis, source: s.source, lines, cf, nwc, checks,
      tieDiffs: recompute ? [] : tieDiffs(s.lines), budget_version_id: s.budget_version_id ?? null, sourceRef: s.sourceRef ?? new Map(),
    };
    done.set(key(s.month, s.basis), res);
    out.push(res);
  }
  return out;
}

function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, "0")}-01`;
}

/** All fs_line codes in presentation order (for complete data mart rows). */
export const FS_CODES = FS_LINES.map((l) => l.code);

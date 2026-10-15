/**
 * B4 bridge margin GL — `bridge.ts` (PRD v2 §4.8 "Bridge GP Agu→Sep", 17 bars; PRD v1 §4.6 B31–B32; PLAN v1 Fase 4).
 *
 * Reproduces sheet BRIDGE GP: bagian 2 (HPP GL = variable + fixed + inventory/KW 2 + GL reconciling items), bagian 3
 * (17 bars in pp of GL margin, ratio method, sequential), bagian 4 (controls) and bagian 5 (waterfall data).
 * Both months enter through the same `BridgeMonthInputs` (BRIDGE GP bagian 1, codes REV_T … B8_PIS): the previous month
 * from its own data mart (or, for Agu-26, fixtures/month-2026-08/bridge_input.json = WP Agu26_6 values), the current month
 * from the Fase 2/3 outputs named on each field.
 */
import { D, Decimal, ZERO, div, sum, type Num } from "./decimal";
import { addMonths, monthOf } from "./dates";
import { ruleId, trace, within, type ControlMonthRow, type MartTrace, type Refs } from "./mart-row";

/**
 * BRIDGE GP bagian 1 for one month (Rp juta, kg — the WP unit; the bridge is a ratio so the unit cancels as long as both
 * months use the same one). Sources for the current month (Sep-26 cell in brackets):
 */
export interface BridgeMonthInputs {
  /** Pendapatan total = GL 4101-007 — Σ revenue per line (REKON & KONTROL F15) */
  REV_T: Num;
  /** Pendapatan FCC premium + KW 2 tawar — fg_month FCC revenue (REKON B15) */
  REV_F: Num;
  /** Pendapatan Ubi Ungu — fg_month UU revenue (REKON C15) */
  REV_U: Num;
  /** Pendapatan Ubi Orange — fg_month UO revenue (REKON D15) */
  REV_O: Num;
  /** Pendapatan Lain-lain — sales_by_item non-FCC/UU/UO (REKON E15) */
  REV_L: Num;
  /** Kg terjual FCC premium + KW 2 tawar — fg_month FCC qty_sold + KW 2 tawar sold (FCC!C203 + C208) */
  Q_F: Num;
  /** Kg terjual Ubi Ungu — fg_month UU qty_sold (UU!C203) */
  Q_U: Num;
  /** Kg terjual Ubi Orange — fg_month UO qty_sold (UO!C199) */
  Q_O: Num;
  /** Kg produksi FCC (masuk proses) — process_card_month FCC kg_input (REKON B6) */
  P_F: Num;
  /** Kg produksi Ubi Ungu — process_card_month UU kg_input (REKON C6) */
  P_U: Num;
  /** Kg produksi Ubi Orange — process_card_month UO kg_input (REKON D6) */
  P_O: Num;
  /** Kg output Lain-lain — Σ others_month kg_out (REKON E6) */
  P_L: Num;
  /** Material eksternal FCC incl. ongkos kirim — process_card_month FCC material total (REKON B7) */
  MAT_F: Num;
  /** Material eksternal Ubi Ungu — process_card_month UU material (REKON C7) */
  MAT_U: Num;
  /** Material eksternal Ubi Orange — process_card_month UO material (REKON D7) */
  MAT_O: Num;
  /** Material eksternal Lain-lain — others_month external material (REKON E7) */
  MAT_L: Num;
  /** FCC singkong kulit + daging — process_card_month FCC material (FCC!E41 + E42) */
  SGK: Num;
  /** FCC ongkos kirim singkong — gl_voucher_tag ongkir_singkong to material (FCC!E43) */
  ONG: Num;
  /** FCC minyak olein (FCC!E46) */
  OLE: Num;
  /** FCC CNG (FCC!E47) */
  CNG: Num;
  /** FCC material lain (FCC!E55) */
  OTH: Num;
  /** Pool A total / fixed part — pool_month A (BIAYA BERSAMA C81 / D81) */
  PT_A: Num;
  PF_A: Num;
  /** Allocation of pool A to FCC/UU/UO/Lain-lain — allocation_month A (BIAYA BERSAMA C115:F115) */
  AL_A_F: Num;
  AL_A_U: Num;
  AL_A_O: Num;
  AL_A_L: Num;
  /** Pool Kupas total / fixed (C82 / D82) and allocation (C116:F116) */
  PT_K: Num;
  PF_K: Num;
  AL_K_F: Num;
  AL_K_U: Num;
  AL_K_O: Num;
  AL_K_L: Num;
  /** Pool B (C83 / D83; C117:F117) */
  PT_B: Num;
  PF_B: Num;
  AL_B_F: Num;
  AL_B_U: Num;
  AL_B_O: Num;
  AL_B_L: Num;
  /** Pool C (C84 / D84; C118:F118) */
  PT_C: Num;
  PF_C: Num;
  AL_C_F: Num;
  AL_C_U: Num;
  AL_C_O: Num;
  AL_C_L: Num;
  /** Pool D (C85 / D85; C119:F119) */
  PT_D: Num;
  PF_D: Num;
  AL_D_F: Num;
  AL_D_U: Num;
  AL_D_O: Num;
  AL_D_L: Num;
  /** Pool E (C86 / D86; C120:F120) */
  PT_E: Num;
  PF_E: Num;
  AL_E_F: Num;
  AL_E_U: Num;
  AL_E_O: Num;
  AL_E_L: Num;
  /** HPP semua kartu (WP) — recon ReconHppResult.hppCardTotal (REKON F14) */
  HPP_WP: Num;
  /** HPP menurut GL — fs_control.cogs (REKON C45) */
  HPP_GL: Num;
  /** Rekon HPP items — recon steps (REKON C38 … C43) */
  L38: Num;
  L39: Num;
  L40: Num;
  L41: Num;
  L42: Num;
  L43: Num;
  /** Olein ditahan di WIP-022: Δ (WP − GL) — recon inventory table k2.wipDelta (REKON PERSEDIAAN E17) */
  OLD: Num;
  /** Bagian 8: biaya pabrik di opex — gl_voucher_tag reklas_opex (BIAYA BERSAMA C144:C147) */
  B8_OPEX: Num;
  /** Bagian 8: THR tertukar — gl_voucher_tag thr_swap (C148:C149) */
  B8_THR: Num;
  /** Bagian 8: tali asih per bulan jasa — gl_voucher_tag tali_asih_cutoff (C150:C151) */
  B8_TALI: Num;
  /** Bagian 8: ongkos kirim (keluar pool + ke material) — gl_voucher_tag ongkir_singkong (C152:C153) */
  B8_ONG: Num;
  /** Bagian 8: pisau Urschel — gl_voucher_tag pisau_urschel (C154:C155) */
  B8_PIS: Num;
  /** Optional sources per code */
  refs?: Refs;
}

export type BridgeInputCode = Exclude<keyof BridgeMonthInputs, "refs">;

/** The 71 codes in WP order (BRIDGE GP A7:A77). */
export const BRIDGE_INPUT_CODES: readonly BridgeInputCode[] = [
  "REV_T", "REV_F", "REV_U", "REV_O", "REV_L", "Q_F", "Q_U", "Q_O", "P_F", "P_U", "P_O", "P_L", "MAT_F", "MAT_U", "MAT_O", "MAT_L",
  "SGK", "ONG", "OLE", "CNG", "OTH",
  "PT_A", "PF_A", "AL_A_F", "AL_A_U", "AL_A_O", "AL_A_L", "PT_K", "PF_K", "AL_K_F", "AL_K_U", "AL_K_O", "AL_K_L",
  "PT_B", "PF_B", "AL_B_F", "AL_B_U", "AL_B_O", "AL_B_L", "PT_C", "PF_C", "AL_C_F", "AL_C_U", "AL_C_O", "AL_C_L",
  "PT_D", "PF_D", "AL_D_F", "AL_D_U", "AL_D_O", "AL_D_L", "PT_E", "PF_E", "AL_E_F", "AL_E_U", "AL_E_O", "AL_E_L",
  "HPP_WP", "HPP_GL", "L38", "L39", "L40", "L41", "L42", "L43", "OLD", "B8_OPEX", "B8_THR", "B8_TALI", "B8_ONG", "B8_PIS",
];

/** Lines in Fase 2 naming. */
export type BridgeLine = "FCC" | "UU" | "UO" | "LAIN";

/** One conversion pool of the month — pool_month (total, fixed) and allocation_month (method actual) per line. */
export interface BridgePoolSource {
  total: Num;
  fixed: Num;
  allocated: Record<BridgeLine, Num>;
}

/**
 * The current month's bridge inputs from the Fase 2 data mart and the recon (all amounts in Rp; `bridgeMonthInputs`
 * converts to the WP unit Rp juta).
 */
export interface BridgeSources {
  /** fg_month / sales_by_item revenue per line (REKON B15:E15) */
  revenue: Record<BridgeLine, Num>;
  /** fg_month qty_sold: FCC premium IFM + KW 2 tawar, UU, UO (FCC!C203 + C208, UU!C203, UO!C199) */
  qtySold: { FCC: Num; UU: Num; UO: Num };
  /** process_card_month kg_input (FCC, UU, UO) and Σ others_month kg_out (LAIN) */
  kgProduced: Record<BridgeLine, Num>;
  /** process_card_month material total incl. ongkir; others_month external material (REKON B7:E7) */
  materialExternal: Record<BridgeLine, Num>;
  /** process_card_month FCC material: singkong kulit + daging, ongkos kirim, olein, CNG, material lain (FCC!E41+E42, E43, E46, E47, E55) */
  fccMaterial: { cassava: Num; ongkir: Num; olein: Num; cng: Num; other: Num };
  /** pool_month + allocation_month per pool */
  pools: Record<"A" | "KUPAS" | "B" | "C" | "D" | "E", BridgePoolSource>;
  /** recon: HPP kartu (Σ) and HPP GL */
  hppCard: Num;
  hppGl: Num;
  /** recon ReconHppResult.steps (REKON C38:C43) */
  reconSteps: { materialVariance: Num; invIncreaseWp: Num; invIncreaseGl: Num; kw2Nrv: Num; section8: Num; idlePeriod: Num };
  /** recon inventory table k2.wipDelta (REKON PERSEDIAAN E17) */
  oleinHeldDelta: Num;
  /** Σ gl_voucher_tag by tag (BIAYA BERSAMA bagian 8) */
  section8ByTag: { reklasOpex: Num; thrSwap: Num; taliAsih: Num; ongkir: Num; pisau: Num };
}

/** Assembles BRIDGE GP bagian 1 (column D) for a month from the Fase 2 / recon outputs. Money → Rp juta, kg unchanged. */
export function bridgeMonthInputs(s: BridgeSources): BridgeMonthInputs {
  const M = new Decimal(1_000_000);
  const jt = (x: Num) => D(x).div(M);
  const lines: [Line, BridgeLine][] = [["F", "FCC"], ["U", "UU"], ["O", "UO"], ["L", "LAIN"]];
  const pools: [Pool, keyof BridgeSources["pools"]][] = [["A", "A"], ["K", "KUPAS"], ["B", "B"], ["C", "C"], ["D", "D"], ["E", "E"]];
  const out: Record<string, Decimal> = {
    REV_T: jt(sum(lines.map(([, l]) => D(s.revenue[l])))),
    REV_F: jt(s.revenue.FCC), REV_U: jt(s.revenue.UU), REV_O: jt(s.revenue.UO), REV_L: jt(s.revenue.LAIN),
    Q_F: D(s.qtySold.FCC), Q_U: D(s.qtySold.UU), Q_O: D(s.qtySold.UO),
    P_F: D(s.kgProduced.FCC), P_U: D(s.kgProduced.UU), P_O: D(s.kgProduced.UO), P_L: D(s.kgProduced.LAIN),
    MAT_F: jt(s.materialExternal.FCC), MAT_U: jt(s.materialExternal.UU), MAT_O: jt(s.materialExternal.UO), MAT_L: jt(s.materialExternal.LAIN),
    SGK: jt(s.fccMaterial.cassava), ONG: jt(s.fccMaterial.ongkir), OLE: jt(s.fccMaterial.olein), CNG: jt(s.fccMaterial.cng), OTH: jt(s.fccMaterial.other),
    HPP_WP: jt(s.hppCard), HPP_GL: jt(s.hppGl),
    L38: jt(s.reconSteps.materialVariance), L39: jt(s.reconSteps.invIncreaseWp), L40: jt(s.reconSteps.invIncreaseGl),
    L41: jt(s.reconSteps.kw2Nrv), L42: jt(s.reconSteps.section8), L43: jt(s.reconSteps.idlePeriod),
    OLD: jt(s.oleinHeldDelta),
    B8_OPEX: jt(s.section8ByTag.reklasOpex), B8_THR: jt(s.section8ByTag.thrSwap), B8_TALI: jt(s.section8ByTag.taliAsih),
    B8_ONG: jt(s.section8ByTag.ongkir), B8_PIS: jt(s.section8ByTag.pisau),
  };
  for (const [p, key] of pools) {
    out[`PT_${p}`] = jt(s.pools[key].total);
    out[`PF_${p}`] = jt(s.pools[key].fixed);
    for (const [l, bl] of lines) out[`AL_${p}_${l}`] = jt(s.pools[key].allocated[bl]);
  }
  return out as unknown as BridgeMonthInputs;
}

type Pool = "A" | "K" | "B" | "C" | "D" | "E";
type Line = "F" | "U" | "O" | "L";
const POOLS: readonly Pool[] = ["A", "K", "B", "C", "D", "E"];
const LINES: readonly Line[] = ["F", "U", "O", "L"];

/** BRIDGE GP bagian 2 for one month. */
export interface BridgeComponents {
  fixedShare: Record<Pool, Decimal>;
  variableConversion: Record<Line, Decimal>;
  fixedConversion: Record<Line, Decimal>;
  variable: Record<Line, Decimal>;
  /** V, FX, INV */
  variableTotal: Decimal;
  fixedTotal: Decimal;
  inventory: Decimal;
  /** E1 … E5 */
  glItems: [Decimal, Decimal, Decimal, Decimal, Decimal];
  /** V + FX + INV + E1..E5 − HPP GL (CHK) */
  check: Decimal;
}

const v = (m: BridgeMonthInputs, k: BridgeInputCode) => D(m[k]);

export function bridgeComponents(m: BridgeMonthInputs): BridgeComponents {
  const fixedShare = Object.fromEntries(POOLS.map((p) => [p, div(v(m, `PF_${p}` as BridgeInputCode), v(m, `PT_${p}` as BridgeInputCode))])) as Record<Pool, Decimal>;
  const al = (p: Pool, l: Line) => v(m, `AL_${p}_${l}` as BridgeInputCode);
  const variableConversion = Object.fromEntries(LINES.map((l) => [l, sum(POOLS.map((p) => al(p, l).times(new Decimal(1).minus(fixedShare[p]))))])) as Record<Line, Decimal>;
  const fixedConversion = Object.fromEntries(LINES.map((l) => [l, sum(POOLS.map((p) => al(p, l).times(fixedShare[p])))])) as Record<Line, Decimal>;
  const variable = Object.fromEntries(LINES.map((l) => [l, v(m, `MAT_${l}` as BridgeInputCode).plus(variableConversion[l])])) as Record<Line, Decimal>;
  const variableTotal = sum(LINES.map((l) => variable[l]));
  const fixedTotal = sum(LINES.map((l) => fixedConversion[l]));
  const inventory = v(m, "HPP_WP").minus(variableTotal).minus(fixedTotal);
  const e1 = v(m, "L38").plus(v(m, "OLD"));
  const e2 = v(m, "L39").plus(v(m, "L40")).minus(v(m, "OLD")).plus(v(m, "L43"));
  const e3 = v(m, "L41");
  const e4 = v(m, "B8_OPEX").neg();
  const e5 = v(m, "B8_THR").plus(v(m, "B8_TALI")).plus(v(m, "B8_ONG")).plus(v(m, "B8_PIS")).neg();
  const check = variableTotal.plus(fixedTotal).plus(inventory).plus(e1).plus(e2).plus(e3).plus(e4).plus(e5).minus(v(m, "HPP_GL"));
  return { fixedShare, variableConversion, fixedConversion, variable, variableTotal, fixedTotal, inventory, glItems: [e1, e2, e3, e4, e5], check };
}

export type BridgeGroup = "Harga" | "Volume & persediaan" | "Tarif variabel" | "Tetap" | "GL lain" | "Waktu pencatatan";
export type BridgeBarCode = "b1" | "b2" | "b3" | "b4" | "b5" | "b6" | "b7" | "b8" | "b9" | "b10" | "b11" | "b12" | "b13" | "b14" | "b15" | "b16" | "b17";

export interface BridgeBar {
  code: BridgeBarCode;
  /** PRD v2 §4.8 label (display) */
  label: string;
  pp: Decimal;
  group: BridgeGroup;
  source_ref: string;
}

/** Bars in order with the PRD v2 §4.8 labels and groups; WP rows C118:C134. */
export const BRIDGE_BARS: readonly { code: BridgeBarCode; label: string; group: BridgeGroup; row: number }[] = [
  { code: "b1", label: "Harga jual rata-rata", group: "Harga", row: 118 },
  { code: "b2", label: "Volume dan mix produksi", group: "Volume & persediaan", row: 119 },
  { code: "b3", label: "FCC: tarif singkong", group: "Tarif variabel", row: 120 },
  { code: "b4", label: "FCC: ongkos kirim singkong", group: "Tarif variabel", row: 121 },
  { code: "b5", label: "FCC: minyak olein", group: "Tarif variabel", row: 122 },
  { code: "b6", label: "FCC: CNG", group: "Tarif variabel", row: 123 },
  { code: "b7", label: "FCC: material lain", group: "Tarif variabel", row: 124 },
  { code: "b8", label: "FCC: tarif konversi variabel", group: "Tarif variabel", row: 125 },
  { code: "b9", label: "UU, UO, Lain-lain: tarif", group: "Tarif variabel", row: 126 },
  { code: "b10", label: "Biaya tetap: efek volume", group: "Tetap", row: 127 },
  { code: "b11", label: "Biaya tetap: perubahan belanja", group: "Tetap", row: 128 },
  { code: "b12", label: "Perubahan persediaan, KW 2, transfer", group: "Volume & persediaan", row: 129 },
  { code: "b13", label: "GL: material GL vs kartu", group: "GL lain", row: 130 },
  { code: "b14", label: "GL: beda penilaian persediaan WP vs Accurate", group: "GL lain", row: 131 },
  { code: "b15", label: "GL: KW 2 pada NRV", group: "GL lain", row: 132 },
  { code: "b16", label: "GL: biaya pabrik di opex", group: "GL lain", row: 133 },
  { code: "b17", label: "GL: waktu pencatatan (THR tertukar, tali asih)", group: "Waktu pencatatan", row: 134 },
];
export const BRIDGE_GROUPS: readonly BridgeGroup[] = ["Harga", "Volume & persediaan", "Tarif variabel", "Tetap", "GL lain", "Waktu pencatatan"];

export interface BridgeInputs {
  /** 'YYYY-MM-01' of the current month */
  month: string;
  /** previous month (Agu-26 for the golden month) */
  prior: BridgeMonthInputs;
  current: BridgeMonthInputs;
  /** LK of the current month for B31 (margin Sep vs LK): fs_control.revenue_4101_007 and fs_control.cogs (RINGKASAN D40, D43) */
  lk: { revenue: Num; cogs: Num };
  /** GL revenue of the current month (RINGKASAN C40 = REKON C73) for the revenue check */
  glRevenue: Num;
}

export interface BridgeCheck {
  key: "margin_prior" | "margin_current_lk" | "bars_sum" | "components_prior" | "components_current" | "fixed_vs_pools" | "revenue_vs_gl";
  label: string;
  value: Decimal;
  tolerance: Decimal;
  status: "LULUS" | "GAGAL";
  source_ref: string;
}

export interface BridgeResult {
  month: string;
  priorMonth: string;
  priorComponents: BridgeComponents;
  currentComponents: BridgeComponents;
  /** RA, RS, Ra (pendapatan Sep pada harga Agu) */
  revenuePrior: Decimal;
  revenueCurrent: Decimal;
  revenueAtPriorPrice: Decimal;
  /** margins as fractions (mA, mS) */
  marginPrior: Decimal;
  marginCurrent: Decimal;
  /** pp */
  start: Decimal;
  bars: BridgeBar[];
  /** start + Σ bars (BRIDGE GP C135) */
  end: Decimal;
  groups: { group: BridgeGroup; pp: Decimal; source_ref: string }[];
  checks: BridgeCheck[];
  controls: ControlMonthRow[];
}

const HUNDRED = new Decimal(100);
const RULE = ruleId("bridge.computeBridge");

/** BRIDGE GP bagian 2–4. */
export function computeBridge(inp: BridgeInputs): BridgeResult {
  const month = monthOf(inp.month);
  const A = inp.prior, S = inp.current;
  const ca = bridgeComponents(A), cs = bridgeComponents(S);
  const RA = v(A, "REV_T"), RS = v(S, "REV_T");
  const price = (rev: BridgeInputCode, q: BridgeInputCode) => div(v(A, rev), v(A, q));
  const Ra = v(S, "Q_F").times(price("REV_F", "Q_F")).plus(v(S, "Q_U").times(price("REV_U", "Q_U"))).plus(v(S, "Q_O").times(price("REV_O", "Q_O"))).plus(v(S, "REV_L"));
  const mA = new Decimal(1).minus(v(A, "HPP_GL").div(RA));
  const mS = new Decimal(1).minus(v(S, "HPP_GL").div(RS));
  const start = mA.times(HUNDRED);

  // variable cost of line l in the current month at the prior month's rate per kg produced (Excel IF(P_A=0, V_S, V_A/P_A×P_S))
  const atPriorRate = (aVal: Decimal, pk: BridgeInputCode, zeroFallback: Decimal) =>
    v(A, pk).isZero() ? zeroFallback : aVal.div(v(A, pk)).times(v(S, pk));
  const prodCode: Record<Line, BridgeInputCode> = { F: "P_F", U: "P_U", O: "P_O", L: "P_L" };
  const volumeMix = sum(LINES.map((l) => atPriorRate(ca.variable[l], prodCode[l], cs.variable[l])));
  const rateBar = (aVal: Decimal, sVal: Decimal, pk: BridgeInputCode) => sVal.minus(atPriorRate(aVal, pk, ZERO)).div(Ra).times(HUNDRED).neg();
  const glBar = (i: number) => cs.glItems[i].div(Ra).minus(ca.glItems[i].div(RA)).times(HUNDRED).neg();

  const values: Record<BridgeBarCode, Decimal> = {
    b1: v(S, "HPP_GL").div(Ra).minus(v(S, "HPP_GL").div(RS)).times(HUNDRED),
    b2: volumeMix.div(Ra).minus(ca.variableTotal.div(RA)).times(HUNDRED).neg(),
    b3: rateBar(v(A, "SGK"), v(S, "SGK"), "P_F"),
    b4: rateBar(v(A, "ONG"), v(S, "ONG"), "P_F"),
    b5: rateBar(v(A, "OLE"), v(S, "OLE"), "P_F"),
    b6: rateBar(v(A, "CNG"), v(S, "CNG"), "P_F"),
    b7: rateBar(v(A, "OTH"), v(S, "OTH"), "P_F"),
    b8: rateBar(ca.variableConversion.F, cs.variableConversion.F, "P_F"),
    b9: rateBar(ca.variable.U, cs.variable.U, "P_U").plus(rateBar(ca.variable.O, cs.variable.O, "P_O")).plus(rateBar(ca.variable.L, cs.variable.L, "P_L")),
    b10: ca.fixedTotal.div(Ra).minus(ca.fixedTotal.div(RA)).times(HUNDRED).neg(),
    b11: cs.fixedTotal.minus(ca.fixedTotal).div(Ra).times(HUNDRED).neg(),
    b12: cs.inventory.div(Ra).minus(ca.inventory.div(RA)).times(HUNDRED).neg(),
    b13: glBar(0), b14: glBar(1), b15: glBar(2), b16: glBar(3), b17: glBar(4),
  };
  const bars: BridgeBar[] = BRIDGE_BARS.map((b) => ({ code: b.code, label: b.label, group: b.group, pp: values[b.code], source_ref: `BRIDGE GP!C${b.row}` }));
  const end = start.plus(sum(bars.map((b) => b.pp)));
  const groups = BRIDGE_GROUPS.map((gr, i) => ({ group: gr, pp: sum(bars.filter((b) => b.group === gr).map((b) => b.pp)), source_ref: `BRIDGE GP!C${138 + i}` }));
  const totalChange = sum(groups.map((x) => x.pp));

  const fixedPools = sum(POOLS.map((p) => v(S, `PF_${p}` as BridgeInputCode)));
  const lkMargin = new Decimal(1).minus(D(inp.lk.cogs).div(D(inp.lk.revenue))).times(HUNDRED);
  const mk = (key: BridgeCheck["key"], label: string, value: Decimal, tol: string, ref: string): BridgeCheck =>
    ({ key, label, value, tolerance: new Decimal(tol), status: within(value, new Decimal(tol)) ? "LULUS" : "GAGAL", source_ref: ref });
  const checks: BridgeCheck[] = [
    mk("margin_prior", "Margin bulan lalu (bridge) = 1 − HPP GL ÷ pendapatan GL", mA.minus(new Decimal(1).minus(v(A, "HPP_GL").div(v(A, "REV_T")))), "0.0000001", "BRIDGE GP!C151"),
    mk("margin_current_lk", "Margin bulan ini (bridge) = laba rugi LK (pp)", end.minus(lkMargin), "0.000001", "BRIDGE GP!C152"),
    mk("bars_sum", "Σ bar = margin bulan ini − margin bulan lalu (pp)", totalChange.minus(mS.minus(mA).times(HUNDRED)), "0.000001", "BRIDGE GP!C153"),
    mk("components_prior", "Komponen bulan lalu = HPP GL", ca.check, "0.001", "BRIDGE GP!C154"),
    mk("components_current", "Komponen bulan ini = HPP GL", cs.check, "0.001", "BRIDGE GP!C155"),
    mk("fixed_vs_pools", "Biaya tetap bulan ini = Σ bagian tetap pool", cs.fixedTotal.minus(fixedPools), "0.001", "BRIDGE GP!C156"),
    mk("revenue_vs_gl", "Pendapatan input = GL", v(S, "REV_T").minus(D(inp.glRevenue)), "0.001", "BRIDGE GP!C157"),
  ];
  const ck = (k: BridgeCheck["key"]) => checks.find((c) => c.key === k)!;
  const b31 = [ck("bars_sum"), ck("margin_prior"), ck("margin_current_lk")];
  const b32 = [ck("components_current"), ck("components_prior"), ck("fixed_vs_pools"), ck("revenue_vs_gl")];
  const controls: ControlMonthRow[] = [
    {
      month, code: "B31", label: "Bridge: Σ bar = perubahan margin GL", value: ck("bars_sum").value, tolerance: ck("bars_sum").tolerance,
      status: b31.every((c) => c.status === "LULUS") ? "LULUS" : "GAGAL",
      note: b31.map((c) => `${c.label}: ${c.value.toSignificantDigits(4).toString()} (${c.status})`).join("; "),
      ...trace(RULE, "BRIDGE GP!C153", { barsTotal: totalChange, marginPrior: mA, marginCurrent: mS }),
    },
    {
      month, code: "B32", label: "Bridge: komponen = HPP GL; biaya tetap = Σ pool tetap", value: ck("components_current").value, tolerance: ck("components_current").tolerance,
      status: b32.every((c) => c.status === "LULUS") ? "LULUS" : "GAGAL",
      note: b32.map((c) => `${c.label}: ${c.value.toSignificantDigits(4).toString()} (${c.status})`).join("; "),
      ...trace(RULE, "BRIDGE GP!C155", { componentsCurrent: cs.check, componentsPrior: ca.check, fixedTotal: cs.fixedTotal, fixedPools }),
    },
  ];
  return {
    month, priorMonth: addMonths(month, -1), priorComponents: ca, currentComponents: cs, revenuePrior: RA, revenueCurrent: RS, revenueAtPriorPrice: Ra,
    marginPrior: mA, marginCurrent: mS, start, bars, end, groups, checks, controls,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Display: PRD v2 (b2 + b12 merged) and WP bagian 5 (grouped waterfall)
// ---------------------------------------------------------------------------------------------------------------

export interface DisplayBar {
  code: string;
  label: string;
  pp: Decimal;
  group: BridgeGroup | null;
  /** bars merged into this one (tooltip detail) */
  components: { code: BridgeBarCode; label: string; pp: Decimal }[];
  /** waterfall: running total before and after the bar */
  base: Decimal;
  cumulative: Decimal;
  kind: "start" | "bar" | "end";
}

/**
 * PRD v2 §4.8 direksi view: 17 bars with b2 and b12 merged into "Volume, mix, dan persediaan" (Sep-26 +0,1458 pp),
 * placed where b2 stands; start and end bars around them (16 bars + 2 totals).
 */
export function bridgeDisplayBars(r: BridgeResult): DisplayBar[] {
  const out: DisplayBar[] = [{ code: "start", label: `Margin GL ${monthWord(r.priorMonth)}`, pp: r.start, group: null, components: [], base: ZERO, cumulative: r.start, kind: "start" }];
  let run = r.start;
  const push = (code: string, label: string, pp: Decimal, group: BridgeGroup | null, comps: BridgeBar[]) => {
    out.push({ code, label, pp, group, components: comps.map((c) => ({ code: c.code, label: c.label, pp: c.pp })), base: run, cumulative: run.plus(pp), kind: "bar" });
    run = run.plus(pp);
  };
  const b = (c: BridgeBarCode) => r.bars.find((x) => x.code === c)!;
  for (const bar of r.bars) {
    if (bar.code === "b12") continue;
    if (bar.code === "b2") push("b2_b12", "Volume, mix, dan persediaan", b("b2").pp.plus(b("b12").pp), "Volume & persediaan", [b("b2"), b("b12")]);
    else push(bar.code, bar.label, bar.pp, bar.group, [bar]);
  }
  out.push({ code: "end", label: `Margin GL ${monthWord(r.month)}`, pp: r.end, group: null, components: [], base: ZERO, cumulative: r.end, kind: "end" });
  return out;
}

/** BRIDGE GP bagian 5 (rows 161–170): eight grouped bars between the two margins, as the WP waterfall. */
export function bridgeWaterfallWp(r: BridgeResult): DisplayBar[] {
  const b = (c: BridgeBarCode) => r.bars.find((x) => x.code === c)!;
  const spec: { code: string; label: string; bars: BridgeBarCode[] }[] = [
    { code: "price", label: "Harga jual rata-rata", bars: ["b1"] },
    { code: "volume_inventory", label: "Volume, mix dan persediaan", bars: ["b2", "b12"] },
    { code: "fcc_material", label: "Material FCC", bars: ["b3", "b4", "b5", "b6", "b7"] },
    { code: "variable_conversion", label: "Konversi variabel", bars: ["b8", "b9"] },
    { code: "fixed_volume", label: "Tetap: efek volume", bars: ["b10"] },
    { code: "fixed_spending", label: "Tetap: belanja", bars: ["b11"] },
    { code: "gl_other", label: "GL lain", bars: ["b13", "b14", "b15", "b16"] },
    { code: "timing", label: "Waktu pencatatan", bars: ["b17"] },
  ];
  const out: DisplayBar[] = [{ code: "start", label: `Margin GL ${monthWord(r.priorMonth)}`, pp: r.start, group: null, components: [], base: ZERO, cumulative: r.start, kind: "start" }];
  let run = r.start;
  for (const s of spec) {
    const comps = s.bars.map(b);
    const pp = sum(comps.map((c) => c.pp));
    out.push({ code: s.code, label: s.label, pp, group: null, components: comps.map((c) => ({ code: c.code, label: c.label, pp: c.pp })), base: run, cumulative: run.plus(pp), kind: "bar" });
    run = run.plus(pp);
  }
  out.push({ code: "end", label: `Margin GL ${monthWord(r.month)}`, pp: r.end, group: null, components: [], base: ZERO, cumulative: r.end, kind: "end" });
  return out;
}

const MONTH_WORD = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
function monthWord(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return `${MONTH_WORD[mo - 1]} ${y}`;
}

// ---------------------------------------------------------------------------------------------------------------
// bridge_month rows
// ---------------------------------------------------------------------------------------------------------------

/** One `bridge_month` row (PRD v1 §4.4 + proposed columns compare_month, view, sort_order, components). */
export interface BridgeMonthRow extends MartTrace {
  month: string;
  compare_month: string;
  /** 'bar' = the 17 bars + start/end; 'group' = 6 groups; 'display' = PRD v2 direksi (b2+b12 merged); 'wp_waterfall' = BRIDGE GP bagian 5 */
  view: "bar" | "group" | "display" | "wp_waterfall";
  bar_code: string;
  label: string;
  pp: Decimal;
  group: string | null;
  sort_order: number;
  components: string[];
}

export function bridgeMonthRows(r: BridgeResult): BridgeMonthRow[] {
  const base = (view: BridgeMonthRow["view"], i: number, code: string, label: string, pp: Decimal, group: string | null, ref: string | null, components: string[] = []): BridgeMonthRow => ({
    month: r.month, compare_month: r.priorMonth, view, bar_code: code, label, pp, group, sort_order: i, components,
    ...trace(RULE, ref, { pp }),
  });
  const rows: BridgeMonthRow[] = [base("bar", 0, "start", `Margin GL ${monthWord(r.priorMonth)}`, r.start, null, "BRIDGE GP!C117")];
  r.bars.forEach((b, i) => rows.push(base("bar", i + 1, b.code, b.label, b.pp, b.group, b.source_ref)));
  rows.push(base("bar", 18, "end", `Margin GL ${monthWord(r.month)}`, r.end, null, "BRIDGE GP!C135"));
  r.groups.forEach((gr, i) => rows.push(base("group", i, gr.group, gr.group, gr.pp, gr.group, gr.source_ref)));
  bridgeDisplayBars(r).forEach((d, i) => rows.push(base("display", i, d.code, d.label, d.pp, d.group, null, d.components.map((c) => c.code))));
  bridgeWaterfallWp(r).forEach((d, i) => rows.push(base("wp_waterfall", i, d.code, d.label, d.pp, null, `BRIDGE GP!B${161 + i}`, d.components.map((c) => c.code))));
  return rows;
}

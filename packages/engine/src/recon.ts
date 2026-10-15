/**
 * B3 rekon dan kontrol — `recon.ts` (PRD v2 §4.7; PRD v1 §4.5 "Rekon HPP", §4.6 B17–B20 and B23–B30; PLAN v1 Fase 3).
 *
 * Reproduces four WP blocks:
 *   - REKON & KONTROL bagian 2–5: material variance per line, the HPP waterfall (HPP kartu → HPP GL), KW 2 flow, B17–B20;
 *   - REKON MATERIAL: material usage per item, card vs Accurate (1106-001);
 *   - REKON PERSEDIAAN: WIP (1106-002) and FG (1106-003) per item, WP vs Accurate, categories K1–K6, B23–B30;
 *   - RINGKASAN bagian 5: nine WP vs GL vs LK lines with the explained part and the residual.
 *
 * Pure: every upstream number arrives through a named input field. Field doc comments name the Fase 2 data mart
 * (process_card_month, fg_month, others_month, pool_month, allocation_month — PRD v1 §4.4) or the B1 input table
 * (gl_month, gl_voucher_tag, fs_control, inventory_valuation, sales_by_item, material_item — PRD v1 §4.2) that provides
 * it, and the WP cell of the golden month (Sep-26). Amounts are in Rp (the WP shows Rp juta; ÷ 10^6 only for display).
 */
import { D, Decimal, ZERO, div, sum, type Num } from "./decimal";
import { ruleId, trace, within, type TracedControl, type MartTrace, type Refs } from "./mart-row";
import type { ControlStatus } from "./types";

// ---------------------------------------------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------------------------------------------

/** Lines with a card in the WP (REKON & KONTROL bagian 1 columns B–E). */
export type ReconLine = "FCC" | "UU" | "UO" | "LAIN";
export const RECON_LINES: readonly ReconLine[] = ["FCC", "UU", "UO", "LAIN"];

/** Lines of REKON & KONTROL bagian 2 (material variance; Lain-lain split by main material line of others_group). */
export type ReconMaterialLine = "FCC" | "UU" | "UO" | "LAIN_SINGKONG" | "LAIN_UBI_UNGU" | "LAIN_UBI_ORANGE";
export const MATERIAL_LINES: readonly ReconMaterialLine[] = ["FCC", "UU", "UO", "LAIN_SINGKONG", "LAIN_UBI_UNGU", "LAIN_UBI_ORANGE"];

/** Variance accounts from Okt-26 (REKON & KONTROL A31:A33): singkong, ubi ungu, ubi orange. */
export type MaterialVarianceAccount = "5101-301" | "5101-302" | "5101-303";

/** REKON PERSEDIAAN categories (bagian 3) plus 'BB' for the 1106-001 rows of REKON MATERIAL in `inventory_recon`. */
export type InventoryCategory = "K1" | "K2" | "K3" | "K4" | "K5" | "K6";

/** A WP check that has no B-code (sheet-level checks of REKON MATERIAL / REKON PERSEDIAAN / REKON & KONTROL). */
export interface ReconCheck {
  key: string;
  label: string;
  value: Decimal | null;
  tolerance: Decimal;
  status: "LULUS" | "GAGAL" | "INFO" | "CEK";
  source_ref: string | null;
}

/** Tolerance of the reconciliation controls: Rp 0,001 jt = Rp 1.000 (RINGKASAN bagian 5, REKON & KONTROL bagian 5, REKON PERSEDIAAN E29). */
export const TOL_RECON = new Decimal(1000);
const TOL_RP1 = new Decimal(1);
const TOL_RP100 = new Decimal(100);

const RULE = {
  hpp: ruleId("recon.reconHpp"),
  material: ruleId("recon.reconMaterialByItem"),
  inventory: ruleId("recon.reconInventoryByItem"),
  summary: ruleId("recon.summaryControls"),
};

const check = (key: string, label: string, value: Decimal | null, tolerance: Decimal, sourceRef: string | null): ReconCheck => ({
  key, label, value, tolerance, status: within(value, tolerance) ? "LULUS" : "GAGAL", source_ref: sourceRef,
});

const statusOf = (ok: boolean): ControlStatus => (ok ? "LULUS" : "GAGAL");

function sumRecord<K extends string>(keys: readonly K[], rec: Readonly<Record<K, Num>>): Decimal {
  return sum(keys.map((k) => D(rec[k])));
}

// ---------------------------------------------------------------------------------------------------------------
// 1. HPP waterfall (REKON & KONTROL bagian 2–5)
// ---------------------------------------------------------------------------------------------------------------

/** WP inventory of one line (Rp). Lain-lain has no WIP in the WP (0). */
export interface LineInventory {
  /** WIP awal — process_card_month.wip_open_value (Sep-26: FCC!E72, UU!E70, UO!E66). */
  wipOpen: Num;
  /** WIP akhir — process_card_month.wip_close_value (FCC!E79, UU!E77, UO!E73). */
  wipClose: Num;
  /** Barang jadi awal — fg_month.value_open (FCC!E86, UU!E84, UO!E80); Lain-lain Σ others_month FG awal per SKU (LAIN-LAIN!E93). */
  fgOpen: Num;
  /** Barang jadi akhir — fg_month.value_close (FCC!E92, UU!E89, UO!E85); Lain-lain Σ others_month FG akhir (LAIN-LAIN!F93). */
  fgClose: Num;
}

/** Conversion cost on the cards of one line (REKON & KONTROL rows 9–11). */
export interface LineConversion {
  /** Upah kupas — allocation_month pool KUPAS → line (REKON B9:E9 = FCC!E58). */
  kupas: Num;
  /** Direct labour Grup A — allocation_month pool A → line (REKON B10:E10). */
  directLabour: Num;
  /** Factory overhead Grup B–E — allocation_month pools B..E → line (REKON B11:E11). */
  overhead: Num;
}

export interface ReconHppInputs {
  /** 'YYYY-MM-01' */
  month: string;
  /** HPP per line on the new cards — fg_month.cogs_total (FCC!E104, UU!E98, UO!E94) and Σ others_month.cogs (LAIN-LAIN!G93). REKON B14:E14. */
  hppCard: Record<ReconLine, Num>;
  /** Revenue per line, grouped like the costs — sales_by_item by product (FCC!C211, UU!C207, UO!C203; Lain-lain = REKON C74). REKON B15:E15. */
  revenue: Record<ReconLine, Num>;
  /** External material per line incl. ongkos kirim singkong for FCC — process_card_month.material total (FCC!E56, UU!G218, UO!G214), others_month external material (LAIN-LAIN!D68). REKON B7:E7. */
  materialExternal: Record<ReconLine, Num>;
  /** Conversion on the cards per line. */
  conversion: Record<ReconLine, LineConversion>;
  /** Material card value per line without ongkos kirim — allocation driver E "nilai material" (BIAYA BERSAMA C94:E94) and others_month external material by others_group.main_line (LAIN-LAIN G22:G42). REKON B22:B27. */
  materialCard: Record<ReconMaterialLine, Num>;
  /** Pemakaian bahan baku menurut GL/LK — fs_control.material_usage (REKON B29). */
  glMaterialUsage: Num;
  /** WP inventory per line (Lain-lain: WIP 0). */
  inventory: Record<ReconLine, LineInventory>;
  /** GL net movement of the month — Σ gl_month.net for 1106-002 (WIP) and 1106-003 (FG) (REKON C75, C76). */
  glInventoryMovement: { wip: Num; fg: Num };
  /** KW 2 at NRV: produced on the FCC card (process_card_month FCC kg_kw2 = FCC!B33), used by Lain-lain (Σ others_month kw2_in_kg = LAIN-LAIN!E43), KW 2 tawar sold (fg_month FCC = FCC!C208), NRV per kg (product.kw2_nrv_per_kg = FCC!C209). */
  kw2: { kgProduced: Num; kgToOthers: Num; kgSold: Num; nrvPerKg: Num };
  /** BIAYA BERSAMA bagian 8 (Σ gl_voucher_tag by target): to the pools A–E (C157), to THR (C158), to material FCC = ongkos kirim (C159). */
  section8: { toPools: Num; toThr: Num; toMaterial: Num };
  /** pool_month Σ total (BIAYA BERSAMA C87) and the idle hours charged to the period (pool.ts idleCapacity().periodCharge, C111). */
  pool: { total: Num; idlePeriodCharge: Num };
  /** Revenue per GL — Σ gl_month 4101-007 (REKON C73). */
  glRevenue: Num;
  /** HPP per GL — fs_control.cogs (5101/5102/6500-006/007; REKON C45). */
  hppGl: Num;
  /** Optional source per field ("hppCard.FCC" → "FCC!E104"). */
  refs?: Refs;
}

export interface ReconStep {
  key: "hpp_card" | "material_variance" | "inv_increase_wp" | "inv_increase_gl" | "kw2_nrv" | "section8" | "idle_period" | "hpp_recon" | "hpp_gl" | "residual";
  label: string;
  amount: Decimal;
  source_ref: string;
}

export interface MaterialVarianceLine {
  line: ReconMaterialLine;
  card: Decimal;
  share: Decimal;
  variance: Decimal;
}

export interface ReconHppResult {
  month: string;
  hppCardTotal: Decimal;
  materialCardTotal: Decimal;
  /** GL − kartu (REKON B30). */
  materialVariance: Decimal;
  materialVarianceByLine: MaterialVarianceLine[];
  materialVarianceByAccount: Record<MaterialVarianceAccount, Decimal>;
  /** HPP kartu → … → HPP rekon, HPP GL, sisa (REKON C37:C46). */
  steps: ReconStep[];
  hppRecon: Decimal;
  hppGl: Decimal;
  /** HPP GL − HPP rekon (REKON C46; WP: Rp 7,21). */
  residual: Decimal;
  /** Informasi: kenaikan persediaan kartu baru − kenaikan GL (REKON C47 = RINGKASAN B31). */
  inventoryGap: Decimal;
  /** KW 2 flow at NRV (REKON bagian 4). */
  kw2Flow: { key: "in" | "to_others" | "sold" | "increase"; label: string; kg: Decimal; amount: Decimal; source_ref: string }[];
  totals: { revenue: Decimal; materialExternal: Decimal; conversion: Decimal };
  /** B17–B20 (REKON & KONTROL bagian 5). */
  controls: TracedControl[];
  checks: ReconCheck[];
}

const ACCOUNT_LINES: Record<MaterialVarianceAccount, ReconMaterialLine[]> = {
  "5101-301": ["FCC", "LAIN_SINGKONG"],
  "5101-302": ["UU", "LAIN_UBI_UNGU"],
  "5101-303": ["UO", "LAIN_UBI_ORANGE"],
};

/** HPP kartu → HPP GL (PRD v2 §4.7): HPP_GL = HPP_kartu + varian material + Δpers kartu − Δpers GL + ΔKW2 NRV − penyesuaian b8 + idle periode. */
export function reconHpp(inp: ReconHppInputs): ReconHppResult {
  const refs = inp.refs;
  const hppCardTotal = sumRecord(RECON_LINES, inp.hppCard);
  const materialCardTotal = sumRecord(MATERIAL_LINES, inp.materialCard);
  const materialVariance = D(inp.glMaterialUsage).minus(materialCardTotal);
  const materialVarianceByLine = MATERIAL_LINES.map((line) => {
    const card = D(inp.materialCard[line]);
    const share = div(card, materialCardTotal);
    return { line, card, share, variance: materialVariance.times(share) };
  });
  const varianceOf = (l: ReconMaterialLine) => materialVarianceByLine.find((x) => x.line === l)!.variance;
  const materialVarianceByAccount = Object.fromEntries(
    (Object.keys(ACCOUNT_LINES) as MaterialVarianceAccount[]).map((a) => [a, sum(ACCOUNT_LINES[a].map(varianceOf))]),
  ) as Record<MaterialVarianceAccount, Decimal>;

  const invIncreaseWp = sum(RECON_LINES.map((l) => {
    const v = inp.inventory[l];
    return D(v.wipClose).plus(D(v.fgClose)).minus(D(v.wipOpen)).minus(D(v.fgOpen));
  }));
  const invIncreaseGlMinus = D(inp.glInventoryMovement.wip).plus(D(inp.glInventoryMovement.fg)).neg();
  const nrv = D(inp.kw2.nrvPerKg);
  const kw2In = D(inp.kw2.kgProduced).times(nrv);
  const kw2Others = D(inp.kw2.kgToOthers).times(nrv).neg();
  const kw2Sold = D(inp.kw2.kgSold).times(nrv).neg();
  const kw2Increase = kw2In.plus(kw2Others).plus(kw2Sold);
  const section8Total = D(inp.section8.toPools).plus(D(inp.section8.toThr)).plus(D(inp.section8.toMaterial));
  const idle = D(inp.pool.idlePeriodCharge);
  const hppRecon = hppCardTotal.plus(materialVariance).plus(invIncreaseWp).plus(invIncreaseGlMinus).plus(kw2Increase).minus(section8Total).plus(idle);
  const hppGl = D(inp.hppGl);
  const residual = hppGl.minus(hppRecon);

  const steps: ReconStep[] = [
    { key: "hpp_card", label: "HPP kartu baru, semua produk", amount: hppCardTotal, source_ref: "REKON & KONTROL!C37" },
    { key: "material_variance", label: "Varian material (GL − kartu)", amount: materialVariance, source_ref: "REKON & KONTROL!C38" },
    { key: "inv_increase_wp", label: "Kenaikan persediaan WIP dan barang jadi menurut kartu baru", amount: invIncreaseWp, source_ref: "REKON & KONTROL!C39" },
    { key: "inv_increase_gl", label: "Dikurangi kenaikan persediaan WIP dan barang jadi menurut GL", amount: invIncreaseGlMinus, source_ref: "REKON & KONTROL!C40" },
    { key: "kw2_nrv", label: "Kenaikan persediaan KW 2 pada NRV (tidak dicatat di GL)", amount: kw2Increase, source_ref: "REKON & KONTROL!C41" },
    { key: "section8", label: "Dikurangi penyesuaian DL/FOH dan cut-off yang masuk kartu", amount: section8Total.neg(), source_ref: "REKON & KONTROL!C42" },
    { key: "idle_period", label: "Biaya jam menganggur dibebankan ke periode", amount: idle, source_ref: "REKON & KONTROL!C43" },
    { key: "hpp_recon", label: "HPP menurut rekonsiliasi", amount: hppRecon, source_ref: "REKON & KONTROL!C44" },
    { key: "hpp_gl", label: "HPP menurut GL", amount: hppGl, source_ref: "REKON & KONTROL!C45" },
    { key: "residual", label: "Sisa: HPP GL − HPP rekonsiliasi", amount: residual, source_ref: "REKON & KONTROL!C46" },
  ];

  const totals = {
    revenue: sumRecord(RECON_LINES, inp.revenue),
    materialExternal: sumRecord(RECON_LINES, inp.materialExternal),
    conversion: sum(RECON_LINES.map((l) => D(inp.conversion[l].kupas).plus(D(inp.conversion[l].directLabour)).plus(D(inp.conversion[l].overhead)))),
  };

  const m = inp.month;
  const ctl = (code: string, label: string, value: Decimal, sourceRef: string, operands: Record<string, Decimal>, note: string): TracedControl => ({
    month: m, code, label, value, tolerance: TOL_RECON, status: statusOf(within(value, TOL_RECON)), note,
    ...trace(RULE.hpp, sourceRef, operands, refs),
  });
  const poolLessIdle = D(inp.pool.total).minus(idle);
  const b17 = totals.conversion.minus(poolLessIdle);
  const b18 = totals.materialExternal.minus(D(inp.section8.toMaterial)).plus(materialVariance).minus(D(inp.glMaterialUsage));
  const b20 = totals.revenue.minus(D(inp.glRevenue));
  const controls: TracedControl[] = [
    ctl("B17", "Konversi di semua kartu = total pool − jam menganggur", b17, "REKON & KONTROL!C59",
      { conversionCards: totals.conversion, poolTotal: D(inp.pool.total), idlePeriodCharge: idle },
      "Upah kupas + DL + FOH semua kartu dibandingkan dengan pool konversi dikurangi beban periode jam menganggur"),
    ctl("B18", "Material kartu tanpa ongkos kirim singkong + varian = pemakaian GL", b18, "REKON & KONTROL!C60",
      { materialExternal: totals.materialExternal, ongkirToMaterial: D(inp.section8.toMaterial), materialVariance, glMaterialUsage: D(inp.glMaterialUsage) },
      "Material eksternal semua kartu − ongkos kirim singkong + varian material − pemakaian bahan baku GL"),
    ctl("B19", "Rekonsiliasi HPP ke GL (sisa)", residual, "REKON & KONTROL!C61",
      { hppGl, hppRecon }, "HPP GL − HPP menurut rekonsiliasi"),
    ctl("B20", "Pendapatan semua produk = pendapatan GL", b20, "REKON & KONTROL!C63",
      { revenueLines: totals.revenue, glRevenue: D(inp.glRevenue) }, "Σ pendapatan per produk − GL 4101-007"),
  ];
  const othersLines = D(inp.materialCard.LAIN_SINGKONG).plus(D(inp.materialCard.LAIN_UBI_UNGU)).plus(D(inp.materialCard.LAIN_UBI_ORANGE));
  const checks: ReconCheck[] = [
    check("others_material", "Lini Lain-lain = material eksternal Lain-lain", othersLines.minus(D(inp.materialExternal.LAIN)), TOL_RECON, "REKON & KONTROL!C62"),
  ];

  return {
    month: m, hppCardTotal, materialCardTotal, materialVariance, materialVarianceByLine, materialVarianceByAccount,
    steps, hppRecon, hppGl, residual, inventoryGap: invIncreaseWp.plus(invIncreaseGlMinus),
    kw2Flow: [
      { key: "in", label: "Masuk: KW 2 dari produksi FCC", kg: D(inp.kw2.kgProduced), amount: kw2In, source_ref: "REKON & KONTROL!D52" },
      { key: "to_others", label: "Keluar: bahan Lain-lain", kg: D(inp.kw2.kgToOthers).neg(), amount: kw2Others, source_ref: "REKON & KONTROL!D53" },
      { key: "sold", label: "Keluar: KW 2 tawar terjual (HPP pada NRV)", kg: D(inp.kw2.kgSold).neg(), amount: kw2Sold, source_ref: "REKON & KONTROL!D54" },
      { key: "increase", label: "Kenaikan persediaan KW 2", kg: D(inp.kw2.kgProduced).minus(D(inp.kw2.kgToOthers)).minus(D(inp.kw2.kgSold)), amount: kw2Increase, source_ref: "REKON & KONTROL!D55" },
    ],
    totals, controls, checks,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// 2. REKON MATERIAL — material usage per item, card vs Accurate (1106-001)
// ---------------------------------------------------------------------------------------------------------------

export interface MaterialItemInput {
  /** material_item.name (= Average Price name; natural key, open-questions B-008). */
  name: string;
  /** Accurate code (material_item.code / inventory_valuation.item_code), may be absent. */
  code?: string | null;
  unit?: string | null;
  /** Qty on all cards — Fase 2 process_card_month.material[item].qty + others_month material qty (cogm_material.qty mapped to material_item). REKON MATERIAL C. */
  qtyCard: Num;
  /** Card value per line — process_card_month.material[item].value (FCC, UU, UO) and others_month external material per item (LAIN). REKON MATERIAL D:G. */
  cardByLine: Partial<Record<ReconLine, Num>>;
  /** Saldo awal Accurate — inventory_valuation.value_open (1106-001). REKON MATERIAL I. */
  accOpen: Num;
  /** Penerimaan GL — inventory_valuation.value_in (1106-001). REKON MATERIAL J. */
  accIn: Num;
  /** Saldo akhir Accurate — inventory_valuation.value_close; null = item not in Inventory Valuation → saldo akhir = awal + terima − kartu. REKON MATERIAL K. */
  accClose: Num | null;
  /** WP row (golden month) for source_ref. */
  wpRow?: number;
}

export interface ReconMaterialInputs {
  month: string;
  items: MaterialItemInput[];
  /** GL 1106-001: saldo awal (= LK PL HPP awal in the WP), Penerimaan Barang, Penyesuaian Persediaan neto — gl_month account 1106-001 by voucher source (REKON MATERIAL C67:C69). */
  gl: { open: Num; receipts: Num; usage: Num };
  /** LK sheet PL HPP: saldo bahan baku awal, penerimaan, pemakaian, saldo akhir (REKON MATERIAL E67:E70). Not yet a B1 key — see docs/v2/F34-engine-notes.md. */
  lkPlHpp: { open: Num; receipts: Num; usage: Num; close: Num };
  /** Material value per line in the WP (REKON B22, B23, B24, B25+B26+B27) — the same numbers as ReconHppInputs.materialCard. */
  wpMaterialByLine: Record<ReconLine, Num>;
  /** Pemakaian bahan baku menurut GL (REKON B29) = ReconHppInputs.glMaterialUsage. */
  glMaterialUsage: Num;
  /** Varian material GL − kartu (REKON B30) = ReconHppResult.materialVariance. */
  materialVariance: Num;
  refs?: Refs;
}

export interface MaterialReconRow {
  name: string;
  code: string | null;
  unit: string | null;
  qtyCard: Decimal;
  cardByLine: Record<ReconLine, Decimal>;
  /** H: total kartu */
  cardTotal: Decimal;
  /** I, J, K */
  accOpen: Decimal;
  accIn: Decimal;
  accClose: Decimal;
  /** true when K was implied (item not in Inventory Valuation) */
  accCloseImplied: boolean;
  /** L = I + J − K */
  accUsage: Decimal;
  /** M = L − H (positive: Accurate issued more than the cards) */
  diff: Decimal;
  /** N = I + J − H (saldo akhir implisit kartu) */
  wpClose: Decimal;
  rounding: boolean;
  source_ref: string | null;
}

export interface ReconMaterialResult {
  month: string;
  rows: MaterialReconRow[];
  totals: Omit<MaterialReconRow, "name" | "code" | "unit" | "qtyCard" | "accCloseImplied" | "rounding" | "source_ref">;
  gl: { open: Decimal; receipts: Decimal; usage: Decimal; close: Decimal };
  glVsLk: { receipts: Decimal; usage: Decimal; close: Decimal };
  checks: ReconCheck[];
  status: "LULUS" | "GAGAL";
}

const zeroLines = (): Record<ReconLine, Decimal> => ({ FCC: ZERO, UU: ZERO, UO: ZERO, LAIN: ZERO });

/** REKON MATERIAL (sheet bagian 1–3). The rounding row closes Σ item saldo akhir to the LK PL HPP saldo akhir. */
export function reconMaterialByItem(inp: ReconMaterialInputs): ReconMaterialResult {
  const rows: MaterialReconRow[] = inp.items.map((it) => {
    const cardByLine = zeroLines();
    for (const l of RECON_LINES) cardByLine[l] = D(it.cardByLine[l]);
    const cardTotal = sum(RECON_LINES.map((l) => cardByLine[l]));
    const accOpen = D(it.accOpen), accIn = D(it.accIn);
    const implied = it.accClose === null || it.accClose === undefined;
    const accClose = implied ? accOpen.plus(accIn).minus(cardTotal) : D(it.accClose);
    const accUsage = accOpen.plus(accIn).minus(accClose);
    return {
      name: it.name, code: it.code ?? null, unit: it.unit ?? null, qtyCard: D(it.qtyCard), cardByLine, cardTotal,
      accOpen, accIn, accClose, accCloseImplied: implied, accUsage, diff: accUsage.minus(cardTotal),
      wpClose: accOpen.plus(accIn).minus(cardTotal), rounding: false,
      source_ref: it.wpRow ? `REKON MATERIAL!A${it.wpRow}` : null,
    };
  });
  const lkClose = D(inp.lkPlHpp.close);
  const roundingClose = lkClose.minus(sum(rows.map((r) => r.accClose)));
  const lastRow = Math.max(0, ...inp.items.map((i) => i.wpRow ?? 0));
  rows.push({
    name: "Pembulatan Inventory Valuation vs GL 1106-001", code: null, unit: null, qtyCard: ZERO, cardByLine: zeroLines(), cardTotal: ZERO,
    accOpen: ZERO, accIn: ZERO, accClose: roundingClose, accCloseImplied: false, accUsage: roundingClose.neg(), diff: roundingClose.neg(),
    wpClose: ZERO, rounding: true, source_ref: lastRow ? `REKON MATERIAL!A${lastRow + 1}` : null,
  });

  const tot = <K extends "cardTotal" | "accOpen" | "accIn" | "accClose" | "accUsage" | "diff" | "wpClose">(k: K) => sum(rows.map((r) => r[k]));
  const cardByLine = zeroLines();
  for (const l of RECON_LINES) cardByLine[l] = sum(rows.map((r) => r.cardByLine[l]));
  const totals = {
    cardByLine, cardTotal: tot("cardTotal"), accOpen: tot("accOpen"), accIn: tot("accIn"), accClose: tot("accClose"),
    accUsage: tot("accUsage"), diff: tot("diff"), wpClose: tot("wpClose"),
  };
  const gl = { open: D(inp.gl.open), receipts: D(inp.gl.receipts), usage: D(inp.gl.usage), close: ZERO };
  gl.close = gl.open.plus(gl.receipts).minus(gl.usage);
  const glVsLk = { receipts: gl.receipts.minus(D(inp.lkPlHpp.receipts)), usage: gl.usage.minus(D(inp.lkPlHpp.usage)), close: gl.close.minus(lkClose) };
  const wp = inp.wpMaterialByLine;
  const rounding = roundingClose.abs().lte(10000) ? ZERO : roundingClose;
  const checks: ReconCheck[] = [
    check("card_fcc", "Kartu FCC per item = material FCC di WP", cardByLine.FCC.minus(D(wp.FCC)), TOL_RP1, "REKON MATERIAL!C75"),
    check("card_uu", "Kartu UU per item = material UU di WP", cardByLine.UU.minus(D(wp.UU)), TOL_RP1, "REKON MATERIAL!C76"),
    check("card_uo", "Kartu UO per item = material UO di WP", cardByLine.UO.minus(D(wp.UO)), TOL_RP1, "REKON MATERIAL!C77"),
    check("card_lain", "Kartu Lain-lain per item = material Lain-lain di WP", cardByLine.LAIN.minus(D(wp.LAIN)), TOL_RP1, "REKON MATERIAL!C78"),
    check("open_vs_gl", "Saldo awal per item = saldo awal GL", totals.accOpen.minus(gl.open), TOL_RP1, "REKON MATERIAL!C79"),
    check("in_vs_gl", "Penerimaan per item = penerimaan GL", totals.accIn.minus(gl.receipts), TOL_RP1, "REKON MATERIAL!C80"),
    check("close_vs_lk", "Saldo akhir per item = saldo akhir LK", totals.accClose.minus(lkClose), TOL_RP1, "REKON MATERIAL!C81"),
    check("rounding_small", "Pembulatan Inventory Valuation vs GL ≤ Rp 10.000", rounding, TOL_RP1, "REKON MATERIAL!C82"),
    check("receipts_gl_lk", "Penerimaan GL = LK", glVsLk.receipts, TOL_RP100, "REKON MATERIAL!C83"),
    check("usage_gl_lk", "Pemakaian GL = LK", glVsLk.usage, TOL_RP100, "REKON MATERIAL!C84"),
    check("close_gl_lk", "Saldo akhir GL = LK", glVsLk.close, TOL_RP100, "REKON MATERIAL!C85"),
    check("usage_vs_recon", "Pemakaian Accurate (total) = pemakaian GL di rekonsiliasi HPP", totals.accUsage.minus(D(inp.glMaterialUsage)), TOL_RP1, "REKON MATERIAL!C86"),
    check("diff_vs_variance", "Selisih Accurate − kartu (total) = varian material", totals.diff.minus(D(inp.materialVariance)), TOL_RP1, "REKON MATERIAL!C87"),
  ];
  return { month: inp.month, rows, totals, gl, glVsLk, checks, status: checks.every((c) => c.status === "LULUS") ? "LULUS" : "GAGAL" };
}

// ---------------------------------------------------------------------------------------------------------------
// 3. REKON PERSEDIAAN — WIP and FG per item, WP vs Accurate, K1–K6
// ---------------------------------------------------------------------------------------------------------------

export const ACCOUNT_WIP = "1106-002";
export const ACCOUNT_FG = "1106-003";

export interface InventoryItemInput {
  /** inventory_valuation.item_code (WIP-…, FG-…). */
  code: string;
  name?: string | null;
  /** inventory_valuation.account: 1106-002 (WIP) | 1106-003 (FG); anything else → K6. */
  account: string | null;
  /** inventory_valuation qty_open / value_open / qty_close / value_close (REKON PERSEDIAAN E:H). */
  accQtyOpen: Num;
  accValueOpen: Num;
  accQtyClose: Num;
  accValueClose: Num;
  /** Sale or production this month (column I "Mutasi bulan ini"): inventory_valuation qty_in, qty_out_sale or qty_out_transfer ≠ 0 — see `ivMovement`. */
  movement: boolean;
  /** material_item.category of the item name ('olein' → K2, PRD Q19). */
  materialCategory?: string | null;
  /** Reviewer override of the default category (inventory_recon.category edited with audit). */
  categoryOverride?: InventoryCategory | null;
  /** Rp/kg barang baik of the old card for the product of a K1 item (FCC!C239 ÷ (B30 − B33 − B34)); INFO test of column R/S. */
  oldCardRatePerKg?: Num | null;
  /** WP row (golden month) for source_ref. */
  wpRow?: number;
}

/** WP value of an item in WP scope (K1). Fase 2: process_card_month (WIP-067/138/139), fg_month (FG-001/101/102), others_month per SKU (FG-1xx, KOPERASI). */
export interface WpItemValue {
  code: string;
  qtyOpen: Num;
  valueOpen: Num;
  qtyClose: Num;
  valueClose: Num;
}

export interface InventoryReconInputs {
  month: string;
  items: InventoryItemInput[];
  wpItems: WpItemValue[];
  /** Saldo GL (LK neraca) — fs_control inv_1106_002_open/close, inv_1106_003_open/close (RINGKASAN B63:B66). */
  gl: { wipOpen: Num; wipClose: Num; fgOpen: Num; fgClose: Num };
  /** Saldo WP — Σ process_card_month WIP values (FCC+UU+UO) and Σ fg_month + others_month FG values (REKON PERSEDIAAN C10:G10). */
  wp: { wipOpen: Num; wipClose: Num; fgOpen: Num; fgClose: Num };
  /** REKON C47 (kenaikan persediaan kartu baru − GL) = ReconHppResult.inventoryGap. */
  reconInventoryGap: Num;
  /** Tolerance of B23–B30 (REKON PERSEDIAAN E29, default Rp 1.000). */
  tolerance?: Num;
  /** Limit of the INFO test |Accurate ÷ kartu lama − 1| (E41, default 0,02). */
  oldCardLimit?: Num;
  refs?: Refs;
}

/** Column I of REKON PERSEDIAAN from an inventory_valuation row: any sale, production or transfer quantity this month. */
export function ivMovement(r: { qty_in?: Num | null; qty_out_sale?: Num | null; qty_out_transfer?: Num | null }): boolean {
  return [r.qty_in, r.qty_out_sale, r.qty_out_transfer].some((q) => !D(q).isZero());
}

/** Default category rules (REKON PERSEDIAAN bagian 3). */
export function classifyInventoryItem(item: InventoryItemInput, inWpScope: boolean): InventoryCategory {
  if (item.categoryOverride) return item.categoryOverride;
  if (item.account !== ACCOUNT_WIP && item.account !== ACCOUNT_FG) return "K6";
  if (inWpScope) return "K1";
  if (item.account === ACCOUNT_WIP) return item.materialCategory === "olein" ? "K2" : "K3";
  return item.movement ? "K5" : "K4";
}

export interface InventoryReconRowResult {
  code: string;
  name: string | null;
  account: string | null;
  category: InventoryCategory;
  movement: boolean;
  accQtyOpen: Decimal;
  accValueOpen: Decimal;
  accQtyClose: Decimal;
  accValueClose: Decimal;
  wpQtyOpen: Decimal;
  wpValueOpen: Decimal;
  wpQtyClose: Decimal;
  wpValueClose: Decimal;
  /** N = WP − Accurate (akhir) */
  diffClose: Decimal;
  /** K − F (awal) */
  diffOpen: Decimal;
  /** O = N − (K − F) */
  diffDelta: Decimal;
  /** P, Q: Rp/satuan Accurate and WP (akhir) */
  rateAcc: Decimal;
  rateWp: Decimal;
  /** R, S: old card Rp/kg and Accurate ÷ old card − 1 */
  rateOldCard: Decimal;
  oldCardRatio: Decimal;
  /** U: beda kuantitas akhir × Rp/satuan WP; V: awal */
  qtyDiffValueClose: Decimal;
  qtyDiffValueOpen: Decimal;
  source_ref: string | null;
}

export type InventoryPeriodKey = "wipOpen" | "wipClose" | "wipDelta" | "fgOpen" | "fgClose" | "fgDelta";
export type InventoryBlockKey =
  | "gl" | "iv" | "subledgerGap" | "wp" | "wpMinusGl" | "k1" | "k1QtyDiff" | "k1ResidualNoQty" | "k1Rate"
  | "k2" | "k3" | "k4" | "k5" | "k6" | "subledgerReversal" | "explained" | "residual";

export interface ReconInventoryResult {
  month: string;
  rows: InventoryReconRowResult[];
  /** Bagian 1: rows (gl … residual) × periods (WIP awal/akhir/Δ, FG awal/akhir/Δ). */
  table: Record<InventoryBlockKey, Record<InventoryPeriodKey, Decimal>>;
  /** Memo: Σ Δ (WP − GL) WIP + FG (E25) vs REKON C47 (H25). */
  deltaSum: Decimal;
  controls: TracedControl[];
  checks: ReconCheck[];
  /** Values of REKON PERSEDIAAN bagian 2 by WP cell (C30 … C39, C41). */
  wpChecks: { ref: string; label: string; value: Decimal }[];
  status: "LULUS" | "GAGAL";
}

/** WP column/row of every block (REKON PERSEDIAAN bagian 1). */
const INV_ROWS: Record<InventoryBlockKey, number> = {
  gl: 7, iv: 8, subledgerGap: 9, wp: 10, wpMinusGl: 11, k1: 13, k1QtyDiff: 14, k1ResidualNoQty: 15, k1Rate: 16,
  k2: 17, k3: 18, k4: 19, k5: 20, k6: 21, subledgerReversal: 22, explained: 23, residual: 24,
};
const INV_COLS: Record<InventoryPeriodKey, string> = { wipOpen: "C", wipClose: "D", wipDelta: "E", fgOpen: "F", fgClose: "G", fgDelta: "H" };
export function inventoryTableRef(block: InventoryBlockKey, period: InventoryPeriodKey): string {
  return `REKON PERSEDIAAN!${INV_COLS[period]}${INV_ROWS[block]}`;
}

export function reconInventoryByItem(inp: InventoryReconInputs): ReconInventoryResult {
  const tol = inp.tolerance === undefined ? TOL_RECON : D(inp.tolerance);
  const oldLimit = inp.oldCardLimit === undefined ? new Decimal("0.02") : D(inp.oldCardLimit);
  const wpByCode = new Map(inp.wpItems.map((w) => [w.code, w]));

  const rows: InventoryReconRowResult[] = inp.items.map((it) => {
    const w = wpByCode.get(it.code);
    const category = classifyInventoryItem(it, !!w);
    const E = D(it.accQtyOpen), F = D(it.accValueOpen), G = D(it.accQtyClose), H = D(it.accValueClose);
    const J = w ? D(w.qtyOpen) : ZERO, K = w ? D(w.valueOpen) : ZERO, L = w ? D(w.qtyClose) : ZERO, M = w ? D(w.valueClose) : ZERO;
    const N = M.minus(H);
    const P = div(H, G), Q = div(M, L);
    const R = it.oldCardRatePerKg === null || it.oldCardRatePerKg === undefined ? ZERO : D(it.oldCardRatePerKg);
    const S = G.lte(0) || R.isZero() ? ZERO : P.div(R).minus(1);
    const U = !L.isZero() ? L.minus(G).times(Q) : G.isZero() ? ZERO : H.neg();
    const V = !J.isZero() ? J.minus(E).times(K).div(J) : E.isZero() ? ZERO : F.neg();
    return {
      code: it.code, name: it.name ?? null, account: it.account, category, movement: it.movement,
      accQtyOpen: E, accValueOpen: F, accQtyClose: G, accValueClose: H, wpQtyOpen: J, wpValueOpen: K, wpQtyClose: L, wpValueClose: M,
      diffClose: N, diffOpen: K.minus(F), diffDelta: N.minus(K.minus(F)), rateAcc: P, rateWp: Q, rateOldCard: R, oldCardRatio: S,
      qtyDiffValueClose: U, qtyDiffValueOpen: V, source_ref: it.wpRow ? `REKON PERSEDIAAN!A${it.wpRow}` : null,
    };
  });

  const acct = (a: string, cat?: InventoryCategory) => rows.filter((r) => r.account === a && (!cat || r.category === cat));
  const s = (rs: InventoryReconRowResult[], f: (r: InventoryReconRowResult) => Decimal) => sum(rs.map(f));
  type Pair = { open: Decimal; close: Decimal };
  const block = (wip: Pair, fg: Pair): Record<InventoryPeriodKey, Decimal> => ({
    wipOpen: wip.open, wipClose: wip.close, wipDelta: wip.close.minus(wip.open), fgOpen: fg.open, fgClose: fg.close, fgDelta: fg.close.minus(fg.open),
  });
  const per = (f: (a: string) => Pair) => block(f(ACCOUNT_WIP), f(ACCOUNT_FG));

  const glPair = (a: string): Pair => a === ACCOUNT_WIP ? { open: D(inp.gl.wipOpen), close: D(inp.gl.wipClose) } : { open: D(inp.gl.fgOpen), close: D(inp.gl.fgClose) };
  const wpPair = (a: string): Pair => a === ACCOUNT_WIP ? { open: D(inp.wp.wipOpen), close: D(inp.wp.wipClose) } : { open: D(inp.wp.fgOpen), close: D(inp.wp.fgClose) };
  const ivPair = (a: string): Pair => ({ open: s(acct(a), (r) => r.accValueOpen), close: s(acct(a), (r) => r.accValueClose) });
  const gapPair = (a: string): Pair => {
    const g = glPair(a), i = ivPair(a);
    return { open: g.open.minus(i.open), close: g.close.minus(i.close) };
  };
  const wpGlPair = (a: string): Pair => {
    const w = wpPair(a), g = glPair(a);
    return { open: w.open.minus(g.open), close: w.close.minus(g.close) };
  };
  const k1Pair = (a: string): Pair => ({ open: s(acct(a, "K1"), (r) => r.diffOpen), close: s(acct(a, "K1"), (r) => r.diffClose) });
  const k1QtyPair = (a: string): Pair => ({ open: s(acct(a, "K1"), (r) => r.qtyDiffValueOpen), close: s(acct(a, "K1"), (r) => r.qtyDiffValueClose) });
  const k1NoQtyPair = (a: string): Pair => ({
    open: s(acct(a, "K1").filter((r) => r.accQtyOpen.isZero()), (r) => r.accValueOpen).neg(),
    close: s(acct(a, "K1").filter((r) => r.accQtyClose.isZero()), (r) => r.accValueClose).neg(),
  });
  const kPair = (cat: InventoryCategory) => (a: string): Pair => ({ open: s(acct(a, cat), (r) => r.accValueOpen).neg(), close: s(acct(a, cat), (r) => r.accValueClose).neg() });
  const sub = (x: Pair, ...ys: Pair[]): Pair => ({ open: ys.reduce((t, y) => t.minus(y.open), x.open), close: ys.reduce((t, y) => t.minus(y.close), x.close) });
  const add = (...xs: Pair[]): Pair => ({ open: sum(xs.map((x) => x.open)), close: sum(xs.map((x) => x.close)) });
  const neg = (x: Pair): Pair => ({ open: x.open.neg(), close: x.close.neg() });
  const explainedPair = (a: string): Pair => add(k1Pair(a), kPair("K2")(a), kPair("K3")(a), kPair("K4")(a), kPair("K5")(a), kPair("K6")(a), neg(gapPair(a)));

  const table: Record<InventoryBlockKey, Record<InventoryPeriodKey, Decimal>> = {
    gl: per(glPair), iv: per(ivPair), subledgerGap: per(gapPair), wp: per(wpPair), wpMinusGl: per(wpGlPair),
    k1: per(k1Pair), k1QtyDiff: per(k1QtyPair), k1ResidualNoQty: per(k1NoQtyPair),
    k1Rate: per((a) => sub(k1Pair(a), k1QtyPair(a), k1NoQtyPair(a))),
    k2: per(kPair("K2")), k3: per(kPair("K3")), k4: per(kPair("K4")), k5: per(kPair("K5")), k6: per(kPair("K6")),
    subledgerReversal: per((a) => neg(gapPair(a))), explained: per(explainedPair),
    residual: per((a) => sub(wpGlPair(a), explainedPair(a))),
  };
  // The WP takes Δ of the derived rows as (akhir − awal) of that row, which the block() helper already does.
  const deltaSum = table.wpMinusGl.wipDelta.plus(table.wpMinusGl.fgDelta);

  const m = inp.month;
  const k1Wp = (a: string, close: boolean) => s(acct(a, "K1"), (r) => (close ? r.wpValueClose : r.wpValueOpen));
  const unclassified = rows.filter((r) => (r.category === "K6" || (r.account !== ACCOUNT_WIP && r.account !== ACCOUNT_FG))
    && r.accValueOpen.abs().plus(r.accValueClose.abs()).plus(r.accQtyOpen.abs()).plus(r.accQtyClose.abs()).gt("0.005")).length;
  const worst = (...xs: Decimal[]) => xs.reduce((a, b) => (b.abs().gt(a.abs()) ? b : a), ZERO);
  const ctl = (code: string, label: string, values: Decimal[], sourceRef: string, operands: Record<string, Decimal>, note: string, tolerance = tol): TracedControl => ({
    month: m, code, label, value: worst(...values), tolerance, status: statusOf(values.every((v) => within(v, tolerance))), note,
    ...trace(RULE.inventory, sourceRef, operands, inp.refs),
  });
  const T = table;
  const c32 = k1Wp(ACCOUNT_WIP, true).minus(D(inp.wp.wipClose));
  const c33 = k1Wp(ACCOUNT_FG, true).minus(D(inp.wp.fgClose));
  const c34 = k1Wp(ACCOUNT_WIP, false).minus(D(inp.wp.wipOpen));
  const c35 = k1Wp(ACCOUNT_FG, false).minus(D(inp.wp.fgOpen));
  const c38 = deltaSum.minus(D(inp.reconInventoryGap));
  const controls: TracedControl[] = [
    ctl("B23", "Beda subledger vs GL stabil (WIP dan barang jadi, akhir − awal)", [T.subledgerGap.wipDelta, T.subledgerGap.fgDelta], "REKON PERSEDIAAN!C30",
      { wipDrift: T.subledgerGap.wipDelta, fgDrift: T.subledgerGap.fgDelta }, "WIP: REKON PERSEDIAAN C30; barang jadi: C31"),
    ctl("B24", "Σ nilai WP item K1 (WIP, akhir) = saldo WP", [c32], "REKON PERSEDIAAN!C32", { k1WpWipClose: k1Wp(ACCOUNT_WIP, true), wpWipClose: D(inp.wp.wipClose) }, "Semua nilai WP terpetakan ke item Accurate"),
    ctl("B25", "Σ nilai WP item K1 (barang jadi, akhir) = saldo WP", [c33], "REKON PERSEDIAAN!C33", { k1WpFgClose: k1Wp(ACCOUNT_FG, true), wpFgClose: D(inp.wp.fgClose) }, ""),
    ctl("B26", "Σ nilai WP item K1 (WIP, awal) = WIP awal kartu", [c34], "REKON PERSEDIAAN!C34", { k1WpWipOpen: k1Wp(ACCOUNT_WIP, false), wpWipOpen: D(inp.wp.wipOpen) }, ""),
    ctl("B27", "Σ nilai WP item K1 (barang jadi, awal) = barang jadi awal kartu", [c35], "REKON PERSEDIAAN!C35", { k1WpFgOpen: k1Wp(ACCOUNT_FG, false), wpFgOpen: D(inp.wp.fgOpen) }, ""),
    ctl("B28", "Sisa WIP dan barang jadi akhir (WP − GL − dijelaskan) = 0", [T.residual.wipClose, T.residual.fgClose], "REKON PERSEDIAAN!C36",
      { residualWipClose: T.residual.wipClose, residualFgClose: T.residual.fgClose }, "WIP: REKON PERSEDIAAN C36; barang jadi: C37"),
    ctl("B29", "Σ Δ (WP − GL) WIP + barang jadi = selisih kenaikan persediaan di rekonsiliasi HPP", [c38], "REKON PERSEDIAAN!C38",
      { deltaSum, reconInventoryGap: D(inp.reconInventoryGap) }, "Menghubungkan saldo ke pos rekonsiliasi HPP"),
    ctl("B30", "Item belum terklasifikasi (K6) dengan saldo ≠ 0", [new Decimal(unclassified)], "REKON PERSEDIAAN!C39",
      { unclassifiedItems: new Decimal(unclassified) }, "Isi kategori item yang belum terklasifikasi", new Decimal("0.5")),
  ];
  const oldCardFlagged = rows.filter((r) => !r.rateOldCard.isZero() && r.accQtyClose.gt(0) && r.oldCardRatio.abs().gt(oldLimit)).length;
  const checks: ReconCheck[] = [
    { key: "old_card_test", label: "Uji kartu lama: item dengan |Rp/kg Accurate ÷ Rp/kg kartu lama − 1| di atas batas", value: new Decimal(oldCardFlagged),
      tolerance: oldLimit, status: oldCardFlagged === 0 ? "INFO" : "CEK", source_ref: "REKON PERSEDIAAN!C41" },
  ];
  const wpChecks = [
    { ref: "REKON PERSEDIAAN!C30", label: "Beda subledger vs GL WIP stabil", value: T.subledgerGap.wipDelta },
    { ref: "REKON PERSEDIAAN!C31", label: "Beda subledger vs GL barang jadi stabil", value: T.subledgerGap.fgDelta },
    { ref: "REKON PERSEDIAAN!C32", label: "Σ WP K1 WIP akhir − saldo WP", value: c32 },
    { ref: "REKON PERSEDIAAN!C33", label: "Σ WP K1 barang jadi akhir − saldo WP", value: c33 },
    { ref: "REKON PERSEDIAAN!C34", label: "Σ WP K1 WIP awal − saldo WP", value: c34 },
    { ref: "REKON PERSEDIAAN!C35", label: "Σ WP K1 barang jadi awal − saldo WP", value: c35 },
    { ref: "REKON PERSEDIAAN!C36", label: "Sisa WIP akhir", value: T.residual.wipClose },
    { ref: "REKON PERSEDIAAN!C37", label: "Sisa barang jadi akhir", value: T.residual.fgClose },
    { ref: "REKON PERSEDIAAN!C38", label: "Σ Δ (WP − GL) − selisih kenaikan persediaan rekonsiliasi HPP", value: c38 },
    { ref: "REKON PERSEDIAAN!C39", label: "Item belum terklasifikasi", value: new Decimal(unclassified) },
    { ref: "REKON PERSEDIAAN!C41", label: "Uji kartu lama: item di atas batas", value: new Decimal(oldCardFlagged) },
  ];
  return { month: m, rows, table, deltaSum, controls, checks, wpChecks, status: controls.every((c) => c.status === "LULUS") ? "LULUS" : "GAGAL" };
}

// ---------------------------------------------------------------------------------------------------------------
// 4. RINGKASAN bagian 5 — WP vs GL vs LK (recon_month rows)
// ---------------------------------------------------------------------------------------------------------------

/** The nine LK figures — fs_control (RINGKASAN B58:B66). */
export interface LkFigures {
  /** fs_control.revenue_4101_007 */
  revenue: Num;
  /** fs_control.material_usage */
  materialUsage: Num;
  /** fs_control.conversion_16 */
  conversion: Num;
  /** fs_control.cogs */
  cogs: Num;
  /** fs_control.inv_1106_001_close */
  inv1106001Close: Num;
  /** fs_control.inv_1106_002_open / close */
  inv1106002Open: Num;
  inv1106002Close: Num;
  /** fs_control.inv_1106_003_open / close */
  inv1106003Open: Num;
  inv1106003Close: Num;
}

export interface ReconExplainedItem {
  key: string;
  label: string;
  amount: Decimal;
  source_ref: string | null;
}

export interface ReconExplained {
  total: Decimal;
  items: ReconExplainedItem[];
}

/** One `recon_month` row (PRD v1 §4.4 + proposed columns lk_amount, difference, gl_lk_diff, qty, label). */
export interface ReconMonthRow extends MartTrace {
  month: string;
  /** 'summary.<key>' (RINGKASAN bagian 5), 'hpp.<step>' (waterfall), 'material_variance.<line|account>', 'kw2.<key>' */
  line_key: string;
  label: string;
  wp_amount: Decimal | null;
  gl_amount: Decimal | null;
  lk_amount: Decimal | null;
  /** WP − GL (RINGKASAN kolom E) */
  difference: Decimal | null;
  /** Bagian dari selisih yang dijelaskan pos rekon (kolom F) */
  explained: ReconExplained | null;
  /** Sisa WP − GL − dijelaskan (kolom G) */
  residual: Decimal | null;
  /** GL − LK (kolom H) */
  gl_lk_diff: Decimal | null;
  /** kg (KW 2 flow only) */
  qty: Decimal | null;
  status: ControlStatus | null;
}

export interface SummaryControlsInputs {
  month: string;
  hppInputs: ReconHppInputs;
  hpp: ReconHppResult;
  material: ReconMaterialResult;
  inventory: ReconInventoryResult;
  /** GL Σ of the 16 conversion accounts — Σ gl_month (BIAYA BERSAMA C23; control B01). */
  glConversion: Num;
  lk: LkFigures;
  refs?: Refs;
}

/** RINGKASAN bagian 5: nine lines, each LULUS when |sisa WP − GL − dijelaskan| ≤ Rp 1.000 and |GL − LK| ≤ Rp 1.000. */
export function summaryControls(inp: SummaryControlsInputs): { rows: ReconMonthRow[]; status: "LULUS" | "GAGAL" } {
  const { hpp, hppInputs: h, material, inventory } = inp;
  const lk = inp.lk;
  const step = (k: ReconStep["key"]) => hpp.steps.find((s) => s.key === k)!;
  const reconItems = (["material_variance", "inv_increase_wp", "inv_increase_gl", "kw2_nrv", "section8", "idle_period"] as const).map(step);
  const sumRecon = sum(reconItems.map((s) => s.amount));
  const neg = (items: ReconStep[]): ReconExplainedItem[] => items.map((s) => ({ key: s.key, label: s.label, amount: s.amount.neg(), source_ref: s.source_ref }));
  const pos = (items: ReconStep[]): ReconExplainedItem[] => items.map((s) => ({ key: s.key, label: s.label, amount: s.amount, source_ref: s.source_ref }));
  const wipClose = sum((["FCC", "UU", "UO"] as const).map((l) => D(h.inventory[l].wipClose)));
  const fgClose = sum(RECON_LINES.map((l) => D(h.inventory[l].fgClose)));
  const conversionWp = hpp.totals.conversion.plus(D(h.pool.idlePeriodCharge));

  type Spec = {
    key: string; label: string; row: number; wp: Decimal; gl: Decimal; lkv: Decimal; explained: ReconExplained; extraOk?: boolean;
  };
  const one = (key: string, label: string, amount: Decimal, ref: string | null): ReconExplained => ({ total: amount, items: [{ key, label, amount, source_ref: ref }] });
  const specs: Spec[] = [
    { key: "revenue", label: "Pendapatan", row: 40, wp: hpp.totals.revenue, gl: D(h.glRevenue), lkv: D(lk.revenue), explained: { total: ZERO, items: [] } },
    { key: "material_usage", label: "Pemakaian bahan baku", row: 41, wp: hpp.materialCardTotal, gl: material.gl.usage, lkv: D(lk.materialUsage),
      explained: one("material_variance", "Varian material GL − kartu", hpp.materialVariance.neg(), "REKON & KONTROL!B30") },
    { key: "conversion", label: "Biaya konversi (DL + FOH)", row: 42, wp: conversionWp, gl: D(inp.glConversion), lkv: D(lk.conversion),
      explained: { total: D(h.section8.toPools).plus(D(h.section8.toThr)), items: [
        { key: "section8_pools", label: "Penyesuaian bagian 8 ke pool konversi", amount: D(h.section8.toPools), source_ref: "BIAYA BERSAMA!C157" },
        { key: "section8_thr", label: "Penyesuaian bagian 8 ke THR", amount: D(h.section8.toThr), source_ref: "BIAYA BERSAMA!C158" },
      ] } },
    { key: "cogs", label: "HPP", row: 43, wp: hpp.hppCardTotal, gl: hpp.hppGl, lkv: D(lk.cogs), explained: { total: sumRecon.neg(), items: neg(reconItems) } },
    { key: "gross_profit", label: "Laba kotor", row: 44, wp: hpp.totals.revenue.minus(hpp.hppCardTotal), gl: D(h.glRevenue).minus(hpp.hppGl),
      lkv: D(lk.revenue).minus(D(lk.cogs)), explained: { total: sumRecon, items: pos(reconItems) } },
    { key: "inv_1106_001", label: "Persediaan bahan baku 1106-001", row: 46, wp: material.totals.wpClose, gl: material.gl.close, lkv: D(lk.inv1106001Close),
      explained: one("material_variance", "Varian material GL − kartu", hpp.materialVariance, "REKON & KONTROL!B30") },
    { key: "inv_1106_002", label: "Persediaan barang setengah jadi 1106-002", row: 47, wp: wipClose,
      gl: D(lk.inv1106002Open).plus(D(h.glInventoryMovement.wip)), lkv: D(lk.inv1106002Close),
      explained: inventoryExplained(inventory, "wipClose"), extraOk: inventory.status === "LULUS" },
    { key: "inv_1106_003", label: "Persediaan barang jadi 1106-003", row: 48, wp: fgClose,
      gl: D(lk.inv1106003Open).plus(D(h.glInventoryMovement.fg)), lkv: D(lk.inv1106003Close),
      explained: inventoryExplained(inventory, "fgClose"), extraOk: inventory.status === "LULUS" },
    { key: "inv_wip_fg_delta", label: "Kenaikan persediaan WIP + barang jadi", row: 49, wp: step("inv_increase_wp").amount,
      gl: D(h.glInventoryMovement.wip).plus(D(h.glInventoryMovement.fg)),
      lkv: D(lk.inv1106002Close).plus(D(lk.inv1106003Close)).minus(D(lk.inv1106002Open)).minus(D(lk.inv1106003Open)),
      explained: one("inventory_gap", "Selisih kenaikan persediaan kartu baru vs GL", hpp.inventoryGap, "REKON & KONTROL!C47") },
  ];
  const rows: ReconMonthRow[] = specs.map((sp) => {
    const difference = sp.wp.minus(sp.gl);
    const residual = difference.minus(sp.explained.total);
    const glLk = sp.gl.minus(sp.lkv);
    const ok = within(residual, TOL_RECON) && within(glLk, TOL_RECON) && sp.extraOk !== false;
    return {
      month: inp.month, line_key: `summary.${sp.key}`, label: sp.label, wp_amount: sp.wp, gl_amount: sp.gl, lk_amount: sp.lkv,
      difference, explained: sp.explained, residual, gl_lk_diff: glLk, qty: null, status: statusOf(ok),
      ...trace(RULE.summary, `RINGKASAN!I${sp.row}`, { wp: sp.wp, gl: sp.gl, lk: sp.lkv, explained: sp.explained.total }, {
        wp: `RINGKASAN!B${sp.row}`, gl: `RINGKASAN!C${sp.row}`, lk: `RINGKASAN!D${sp.row}`, explained: `RINGKASAN!F${sp.row}`,
      }),
    };
  });
  return { rows, status: rows.every((r) => r.status === "LULUS") ? "LULUS" : "GAGAL" };
}

function inventoryExplained(inv: ReconInventoryResult, period: "wipClose" | "fgClose"): ReconExplained {
  const t = inv.table;
  const items: ReconExplainedItem[] = [
    { key: "K1", label: "Beda penilaian item dalam lingkup WP (kartu baru vs kartu lama)", amount: t.k1[period], source_ref: inventoryTableRef("k1", period) },
    { key: "K2", label: "Olein ditahan di WIP (Accurate)", amount: t.k2[period], source_ref: inventoryTableRef("k2", period) },
    { key: "K3", label: "Bahan, kemasan dan KW 2 di WIP (Accurate)", amount: t.k3[period], source_ref: inventoryTableRef("k3", period) },
    { key: "K4", label: "Barang jadi tanpa penjualan/produksi bulan ini (Accurate)", amount: t.k4[period], source_ref: inventoryTableRef("k4", period) },
    { key: "K5", label: "Barang jadi tanpa kartu WP yang bermutasi (Accurate)", amount: t.k5[period], source_ref: inventoryTableRef("k5", period) },
    { key: "K6", label: "Perlu klasifikasi (Accurate)", amount: t.k6[period], source_ref: inventoryTableRef("k6", period) },
    { key: "subledger", label: "Beda subledger vs GL", amount: t.subledgerReversal[period], source_ref: inventoryTableRef("subledgerReversal", period) },
  ];
  return { total: t.explained[period], items };
}

// ---------------------------------------------------------------------------------------------------------------
// 5. Orchestration and data-mart rows
// ---------------------------------------------------------------------------------------------------------------

export interface ReconInputs {
  month: string;
  hpp: ReconHppInputs;
  material: Omit<ReconMaterialInputs, "month" | "wpMaterialByLine" | "glMaterialUsage" | "materialVariance">;
  inventory: Omit<InventoryReconInputs, "month" | "gl" | "wp" | "reconInventoryGap">;
  /** GL Σ 16 conversion accounts (BIAYA BERSAMA C23). */
  glConversion: Num;
  lk: LkFigures;
}

export interface ReconMonthResult {
  month: string;
  hpp: ReconHppResult;
  material: ReconMaterialResult;
  inventory: ReconInventoryResult;
  summary: { rows: ReconMonthRow[]; status: "LULUS" | "GAGAL" };
  /** B17–B20, B23–B30 */
  controls: TracedControl[];
  /** REKON & KONTROL D69 analogue: all controls and sheet checks pass. */
  status: "LULUS" | "GAGAL";
  reconMonthRows: ReconMonthRow[];
  inventoryReconRows: InventoryReconRow[];
}

/** Full B3 for one month: material → HPP waterfall → inventory per item → RINGKASAN bagian 5 → controls and mart rows. */
export function reconMonth(inp: ReconInputs): ReconMonthResult {
  const month = inp.month;
  const hpp = reconHpp({ ...inp.hpp, month });
  const mc = inp.hpp.materialCard;
  const material = reconMaterialByItem({
    ...inp.material, month,
    wpMaterialByLine: { FCC: mc.FCC, UU: mc.UU, UO: mc.UO, LAIN: D(mc.LAIN_SINGKONG).plus(D(mc.LAIN_UBI_UNGU)).plus(D(mc.LAIN_UBI_ORANGE)) },
    glMaterialUsage: inp.hpp.glMaterialUsage, materialVariance: hpp.materialVariance,
  });
  const iv = inp.hpp.inventory;
  const lk = inp.lk;
  const inventory = reconInventoryByItem({
    ...inp.inventory, month,
    gl: { wipOpen: lk.inv1106002Open, wipClose: lk.inv1106002Close, fgOpen: lk.inv1106003Open, fgClose: lk.inv1106003Close },
    wp: {
      wipOpen: sum((["FCC", "UU", "UO"] as const).map((l) => D(iv[l].wipOpen))),
      wipClose: sum((["FCC", "UU", "UO"] as const).map((l) => D(iv[l].wipClose))),
      fgOpen: sum(RECON_LINES.map((l) => D(iv[l].fgOpen))),
      fgClose: sum(RECON_LINES.map((l) => D(iv[l].fgClose))),
    },
    reconInventoryGap: hpp.inventoryGap,
  });
  const summary = summaryControls({ month, hppInputs: inp.hpp, hpp, material, inventory, glConversion: inp.glConversion, lk });
  const controls = [...hpp.controls, ...inventory.controls];
  const ok = controls.every((c) => c.status === "LULUS") && material.status === "LULUS" && summary.status === "LULUS"
    && hpp.checks.every((c) => c.status === "LULUS");
  return {
    month, hpp, material, inventory, summary, controls, status: ok ? "LULUS" : "GAGAL",
    reconMonthRows: reconMonthRows(hpp, summary.rows, inp.hpp.refs),
    inventoryReconRows: inventoryReconRows(month, material, inventory, inp.material.refs, inp.inventory.refs),
  };
}

/** recon_month rows: RINGKASAN bagian 5 (9) + HPP waterfall (10) + material variance per line (6) and account (3) + KW 2 flow (4). */
export function reconMonthRows(hpp: ReconHppResult, summary: ReconMonthRow[], refs?: Refs): ReconMonthRow[] {
  const base = (line_key: string, label: string, amount: Decimal, sourceRef: string | null, qty: Decimal | null, operands: Record<string, Decimal>): ReconMonthRow => ({
    month: hpp.month, line_key, label, wp_amount: amount, gl_amount: null, lk_amount: null, difference: null, explained: null,
    residual: null, gl_lk_diff: null, qty, status: null, ...trace(RULE.hpp, sourceRef, operands, refs),
  });
  const rows: ReconMonthRow[] = [...summary];
  for (const s of hpp.steps) {
    const r = base(`hpp.${s.key}`, s.label, s.amount, s.source_ref, null, { amount: s.amount });
    if (s.key === "residual") r.status = statusOf(within(s.amount, TOL_RECON));
    rows.push(r);
  }
  const lineRow: Record<ReconMaterialLine, number> = { FCC: 22, UU: 23, UO: 24, LAIN_SINGKONG: 25, LAIN_UBI_UNGU: 26, LAIN_UBI_ORANGE: 27 };
  for (const l of hpp.materialVarianceByLine) {
    rows.push(base(`material_variance.${l.line}`, `Varian material sementara ${l.line}`, l.variance, `REKON & KONTROL!D${lineRow[l.line]}`, null,
      { card: l.card, share: l.share, materialVariance: hpp.materialVariance }));
  }
  const accRow: Record<MaterialVarianceAccount, number> = { "5101-301": 31, "5101-302": 32, "5101-303": 33 };
  for (const a of Object.keys(accRow) as MaterialVarianceAccount[]) {
    rows.push(base(`material_variance.${a}`, `Varian material akun ${a}`, hpp.materialVarianceByAccount[a], `REKON & KONTROL!D${accRow[a]}`, null, { amount: hpp.materialVarianceByAccount[a] }));
  }
  for (const k of hpp.kw2Flow) rows.push(base(`kw2.${k.key}`, k.label, k.amount, k.source_ref, k.kg, { kg: k.kg, amount: k.amount }));
  return rows;
}

/** One `inventory_recon` row (PRD v1 §4.4 + proposed columns; 'BB' rows carry REKON MATERIAL). */
export interface InventoryReconRow extends MartTrace {
  month: string;
  item_code: string | null;
  item_name: string | null;
  account: string;
  category: InventoryCategory | "BB";
  qty_wp: Decimal | null;
  value_wp: Decimal;
  qty_acc: Decimal | null;
  value_acc: Decimal;
  /** WP − Accurate (akhir); BB: saldo akhir implisit kartu − Accurate = pemakaian Accurate − kartu */
  diff: Decimal;
  qty_wp_open: Decimal | null;
  value_wp_open: Decimal | null;
  qty_acc_open: Decimal | null;
  value_acc_open: Decimal;
  diff_open: Decimal | null;
  diff_delta: Decimal | null;
  rate_acc: Decimal | null;
  rate_wp: Decimal | null;
  rate_old_card: Decimal | null;
  old_card_ratio: Decimal | null;
  qty_diff_value: Decimal | null;
  qty_diff_value_open: Decimal | null;
  movement: boolean | null;
  /** BB only */
  value_in: Decimal | null;
  usage_card: Decimal | null;
  usage_card_by_line: Record<ReconLine, Decimal> | null;
  usage_acc: Decimal | null;
  close_implied: boolean | null;
}

export function inventoryReconRows(month: string, material: ReconMaterialResult, inventory: ReconInventoryResult, materialRefs?: Refs, inventoryRefs?: Refs): InventoryReconRow[] {
  const bb: InventoryReconRow[] = material.rows.map((r) => ({
    month, item_code: r.code, item_name: r.name, account: "1106-001", category: "BB", qty_wp: null, value_wp: r.wpClose, qty_acc: null, value_acc: r.accClose,
    diff: r.wpClose.minus(r.accClose), qty_wp_open: null, value_wp_open: null, qty_acc_open: null, value_acc_open: r.accOpen, diff_open: null, diff_delta: null,
    rate_acc: null, rate_wp: null, rate_old_card: null, old_card_ratio: null, qty_diff_value: null, qty_diff_value_open: null, movement: null,
    value_in: r.accIn, usage_card: r.cardTotal, usage_card_by_line: r.cardByLine, usage_acc: r.accUsage, close_implied: r.accCloseImplied,
    ...trace(RULE.material, r.source_ref, { accOpen: r.accOpen, accIn: r.accIn, accClose: r.accClose, cardTotal: r.cardTotal }, materialRefs),
  }));
  const wf: InventoryReconRow[] = inventory.rows.map((r) => ({
    month, item_code: r.code, item_name: r.name, account: r.account ?? "?", category: r.category, qty_wp: r.wpQtyClose, value_wp: r.wpValueClose,
    qty_acc: r.accQtyClose, value_acc: r.accValueClose, diff: r.diffClose, qty_wp_open: r.wpQtyOpen, value_wp_open: r.wpValueOpen,
    qty_acc_open: r.accQtyOpen, value_acc_open: r.accValueOpen, diff_open: r.diffOpen, diff_delta: r.diffDelta, rate_acc: r.rateAcc, rate_wp: r.rateWp,
    rate_old_card: r.rateOldCard, old_card_ratio: r.oldCardRatio, qty_diff_value: r.qtyDiffValueClose, qty_diff_value_open: r.qtyDiffValueOpen,
    movement: r.movement, value_in: null, usage_card: null, usage_card_by_line: null, usage_acc: null, close_implied: null,
    ...trace(RULE.inventory, r.source_ref, { accValueClose: r.accValueClose, wpValueClose: r.wpValueClose }, inventoryRefs),
  }));
  return [...bb, ...wf];
}

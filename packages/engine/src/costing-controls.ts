/**
 * Controls of the monthly costing (PRD v1 §4.6): B03–B16, B21, B22, B34 computed from the B2 results, plus the
 * B1 input controls B01, B02, B44 (controls.ts) so that control_month holds every control of the month.
 * Each control names the WP check it reproduces (source_refs).
 */
import { b01, b02, b44 } from "./controls";
import { D, div, sum, ZERO, type Decimal } from "./decimal";
import type { MonthInputs } from "./inputs";
import type { AllocationChecks } from "./allocation";
import type { ControlMonthRow, FgMonthRow, ProcessCardMonthRow } from "./mart";
import type { OthersChecks } from "./others-sku";
import type { PoolChecks } from "./pool";
import type { ControlResult, ControlStatus, ProductCode } from "./types";

export const CONTROLS_RULE = "costing-controls.monthControls@1";

const RP1 = D(1);
const KG = D("0.01");
const PRODUCT_SHEET_CHECK: Record<ProductCode, Record<string, string>> = {
  FCC: { B06: "FCC!C159", B07: "FCC!C160", B08: "FCC!C161", B09: "FCC!C164", B10: "FCC!C162", B11: "FCC!C163", B12: "FCC!C167" },
  UU: { B06: "UU!C148", B07: "UU!C149", B08: "UU!C150", B09: "UU!C153", B10: "UU!C151", B11: "UU!C152", B12: "UU!C156" },
  UO: { B06: "UO!C144", B07: "UO!C145", B08: "UO!C146", B09: "UO!C149", B10: "UO!C147", B11: "UO!C148", B12: "UO!C152" },
};

export interface ProductCheck {
  product: ProductCode;
  card: ProcessCardMonthRow;
  fg: FgMonthRow;
  kgCheck: Decimal;
  costCheck: Decimal;
  valuationKgCheck: Decimal;
}

export interface ControlsInput {
  inputs: MonthInputs;
  pool: PoolChecks;
  allocation: AllocationChecks;
  products: ProductCheck[];
  others: OthersChecks;
  /** Lain-lain drivers given at line LAIN (if any) against Σ SKU (B13). */
  lainDrivers: { manHour: Decimal | null; kwh: Decimal | null; skuManHour: Decimal; skuKwh: Decimal };
}

const status = (ok: boolean, fail: ControlStatus = "GAGAL"): ControlStatus => (ok ? "LULUS" : fail);

export function monthControls(x: ControlsInput): ControlMonthRow[] {
  const { inputs: inp } = x;
  const wp = inp.wpTemplate === "sep26_4";
  const out: ControlMonthRow[] = [];
  const push = (code: string, scope: string | null, label: string, value: Decimal | null, tolerance: Decimal | null, st: ControlStatus, note: string,
    refs: string[], wpRef: string | null, detail: Record<string, [Decimal, string | null]> = {}) => {
    const sub: Record<string, string> = {};
    for (const [k, [, ref]] of Object.entries(detail)) if (ref) sub[`detail.${k}`] = ref;
    out.push({
      month: inp.month, code, scope, label, value, tolerance, status: st, note, rule_id: CONTROLS_RULE, inputs: refs,
      detail: Object.fromEntries(Object.entries(detail).map(([k, [v]]) => [k, v])),
      source_ref: wp ? wpRef : null, source_refs: wp ? { ...(wpRef && value !== null ? { value: wpRef } : {}), ...sub } : {},
    });
  };
  const fromResult = (r: ControlResult, refs: string[], wpRef: string | null = null) => push(r.code, null, r.label, r.value, r.tolerance, r.status, r.note ?? "", refs, wpRef);

  // B01, B02, B44 (input controls of Fase 1, recomputed on the month's rows)
  const gl = inp.gl.map((g) => ({ account: g.account, net: g.amount }));
  fromResult(b01(inp.month, gl, inp.coaMappings, inp.fsControl.map((f) => ({ key: f.key, amount: f.amount }))), [...inp.gl.map((g) => g.ref), ...inp.fsControl.map((f) => f.ref)]);
  fromResult(b02(inp.month, gl, inp.coaMappings, inp.journals.map((j) => ({ kind: j.kind, amount: j.amount }))), [...inp.gl.map((g) => g.ref), ...inp.journals.map((j) => j.ref)]);

  // B03 tags all have a destination; pool = GL + adjustments
  const p = x.pool;
  if (!inp.gl.length) push("B03", null, "Semua baris tag bagian 8 punya tujuan; pool = GL + penyesuaian", null, RP1, "BELUM_DIISI", "GL bulan ini belum diunggah", [], "BIAYA BERSAMA!C182");
  else push("B03", null, "Semua baris tag bagian 8 punya tujuan; pool = GL + penyesuaian", p.tagsUnassigned, RP1,
    status(p.tagsUnassigned.abs().lte(RP1) && p.tieOut.abs().lte(RP1)),
    `tag tanpa tujuan ${p.tagsUnassigned.toFixed(2)}; total pool − (GL ${p.glConversion.toFixed(2)} + tag ke pool ${p.tagsToPools.toFixed(2)} + tag ke THR/BPJS ${p.tagsToSplit.toFixed(2)}) = ${p.tieOut.toFixed(2)}`,
    inp.tags.map((t) => t.ref), "BIAYA BERSAMA!C182", { tie_out: [p.tieOut, "BIAYA BERSAMA!C135"] });

  // B04 gaji staf (rekap) = jurnal gaji staf
  push("B04", null, "Gaji staf rekap payroll = jurnal gaji staf", p.stafVsJournal, RP1,
    p.stafVsJournal === null ? "BELUM_DIISI" : status(p.stafVsJournal.abs().lte(RP1)),
    p.stafVsJournal === null ? "Rekap staf atau jurnal gaji staf belum diunggah" : `rekap − jurnal = ${p.stafVsJournal.toFixed(2)}`,
    [...inp.payroll.map((r) => r.ref), ...inp.journals.map((j) => j.ref)], "BIAYA BERSAMA!C183");

  // B05 allocation exhausted (actual and budget compare); Grup D portions = 1
  const a = x.allocation;
  const okD = a.dPortionResidual.abs().lte(D("0.000001")) && a.dResidual.abs().lte(RP1);
  push("B05", null, "Alokasi aktual dan pembanding habis; porsi Grup D = 1", a.actualResidual, RP1,
    status(a.actualResidual.abs().lte(RP1) && a.compareResidual.abs().lte(RP1) && okD),
    `aktual ${a.actualResidual.toFixed(2)}; pembanding ${a.compareResidual.toFixed(2)}; Σ porsi D − 1 = ${a.dPortionResidual.toSignificantDigits(4).toFixed()}; D teralokasi − pool D ${a.dResidual.toFixed(2)}`,
    ["mart:allocation_month", "mart:pool_month"], "BIAYA BERSAMA!C137",
    { compare: [a.compareResidual, "BIAYA BERSAMA!C138"], d_portion: [a.dPortionResidual, "BIAYA BERSAMA!C184"], d_alloc: [a.dResidual, "BIAYA BERSAMA!C185"] });

  // B06–B12, B21, B34 per process product
  for (const pc of x.products) {
    const s = pc.product, refs = PRODUCT_SHEET_CHECK[s];
    const cardRefs = [`mart:process_card_month:${s}`];
    push("B06", s, "Kartu proses: kg untuk dipertanggungjawabkan = kg dipertanggungjawabkan", pc.kgCheck, KG, status(pc.kgCheck.abs().lte(KG)),
      `WIP awal + masuk proses − (premium + KW 2 + waste + WIP akhir) = ${pc.kgCheck.toFixed()} kg`, [...pc.card.inputs], refs.B06);
    push("B07", s, "Kartu proses: biaya dipertanggungjawabkan = biaya dibebankan", pc.costCheck, RP1, status(pc.costCheck.abs().lte(RP1)),
      `selisih Rp ${pc.costCheck.toFixed(2)}`, cardRefs, refs.B07);
    push("B08", s, "Kartu proses: kg penilaian = kg kuantitas", pc.valuationKgCheck, KG, status(pc.valuationKgCheck.abs().lte(KG)),
      `selisih ${pc.valuationKgCheck.toFixed()} kg`, cardRefs, refs.B08);
    push("B09", s, "Dekomposisi selisih per komponen tertutup", null, RP1, "BELUM_DIISI", "Dihitung di modul varian (Fase 4)", [], refs.B09);
    const legacy = inp.legacy.filter((l) => l.line === s);
    const leg = (c: string) => legacy.find((l) => l.component === c) ?? null;
    if (!legacy.length) {
      push("B10", s, "Material kartu baru = kartu lama", null, RP1, "BELUM_DIISI", "Total kartu lama belum diunggah (sheet Kartu lama)", [], refs.B10);
      push("B11", s, "Kartu lama tersusun ulang = total kartu lama", null, RP1, "BELUM_DIISI", "Total kartu lama belum diunggah (sheet Kartu lama)", [], refs.B11);
    } else {
      const mat = leg("material");
      const v10 = mat ? pc.card.material.card_total.minus(mat.amount) : null;
      push("B10", s, "Material kartu baru = kartu lama", v10, RP1, v10 === null ? "BELUM_DIISI" : status(v10.abs().lte(RP1)),
        v10 === null ? "Komponen material kartu lama tidak ada" : `Σ baris material ${pc.card.material.card_total.toFixed(2)} − kartu lama ${mat!.amount.toFixed(2)}`,
        [...legacy.map((l) => l.ref), ...cardRefs], refs.B10);
      const parts = ["material", "upah_kupas", "direct_labour", "overhead"].map(leg);
      const tot = leg("total");
      const v11 = tot && parts.every((q) => q) ? sum(parts.map((q) => q!.amount)).minus(tot.amount) : null;
      push("B11", s, "Kartu lama tersusun ulang = total kartu lama", v11, RP1, v11 === null ? "BELUM_DIISI" : status(v11.abs().lte(RP1)),
        v11 === null ? "Komponen kartu lama belum lengkap (material, upah_kupas, direct_labour, overhead, total)" : `Σ komponen − total = ${v11.toFixed(2)}`,
        legacy.map((l) => l.ref), refs.B11);
    }
    // B12: lines for the BP sheet sum to −HPP (FCC bagian 5)
    const c = pc.card, f = pc.fg;
    const bp = sum([c.total_cost.neg(), c.kw2_nrv_credit, f.cogs_kw2_sold.neg(), f.value_transfer, c.wip_open_value.neg(), c.wip_close_value,
      f.value_open.neg(), f.value_close]);
    const v12 = bp.plus(f.cogs_total);
    push("B12", s, "Nilai untuk BP: Σ baris = − HPP", v12, RP1, status(v12.abs().lte(RP1)), `Σ baris BP ${bp.toFixed(2)} + HPP ${f.cogs_total.toFixed(2)}`,
      [...cardRefs, `mart:fg_month:${s}`], refs.B12);
    // B21 FG in from the card vs Accurate (D4)
    const accIn = f.accurate.qty_in;
    if (accIn === null) {
      if (s === "FCC") push("B21", s, "Barang jadi masuk: kartu vs Accurate", null, null, "BELUM_DIISI", "Kts. masuk FG di Inventory Valuation belum ada", [], "FCC!B96");
    } else {
      const v = accIn.minus(c.kg_premium), tol = c.kg_premium.abs().times("0.01");
      push("B21", s, "Barang jadi masuk: kartu vs Accurate", v, tol, status(v.abs().lte(tol), "PERIKSA"),
        `Accurate ${accIn.toFixed()} kg vs kartu ${c.kg_premium.toFixed()} kg`, [`mart:fg_month:${s}`], s === "FCC" ? "FCC!B96" : null,
        { card: [c.kg_premium, s === "FCC" ? "FCC!B87" : null], accurate: [accIn, s === "FCC" ? "FCC!C206" : null] });
    }
    // B22 transfer to Lain-lain vs Accurate transfer (FCC)
    if (s === "FCC") {
      const accT = f.accurate.qty_transfer;
      if (accT === null) push("B22", s, "Transfer ke Lain-lain: kartu vs Accurate", null, null, "BELUM_DIISI", "Kts. transfer FG-001 di Inventory Valuation belum ada", [], "FCC!B97");
      else {
        const v = accT.minus(f.qty_transfer), tol = f.qty_transfer.abs().times("0.01");
        push("B22", s, "Transfer ke Lain-lain: kartu vs Accurate", v, tol, status(v.abs().lte(tol), "PERIKSA"),
          `Accurate ${accT.toFixed()} kg vs kartu ${f.qty_transfer.toFixed()} kg`, [`mart:fg_month:${s}`, "mart:others_month"], "FCC!B97",
          { card: [f.qty_transfer, "FCC!B91"], accurate: [accT, "FCC!C207"] });
      }
    }
    // B34 WIP open > ratio × production (D3)
    const ratio = inp.assumptions.wipOpenOverProductionRatio;
    const times = div(c.wip_open_kg, c.kg_input, c.wip_open_kg.isZero() ? ZERO : D("Infinity"));
    const over = c.wip_open_kg.gt(c.kg_input.times(ratio));
    push("B34", s, "WIP awal > batas × produksi bulan", times.isFinite() ? times : null, ratio, over ? "PERIKSA" : "LULUS",
      `WIP awal ${c.wip_open_kg.toFixed()} kg vs produksi ${c.kg_input.toFixed()} kg (batas ${ratio.toFixed()}×)`,
      [...c.inputs.filter((r) => r.startsWith("cogm_card")), inp.assumptions.refs.wip_open_over_production_ratio], null);
  }

  // B13–B16 Lain-lain
  const o = x.others, ld = x.lainDrivers;
  const mhDiff = ld.manHour === null ? ZERO : ld.manHour.minus(ld.skuManHour);
  const kwhDiff = ld.kwh === null ? ZERO : ld.kwh.minus(ld.skuKwh);
  push("B13", "LAIN", "Lain-lain: man-hour dan kWh = driver pool", mhDiff, KG, status(mhDiff.abs().lte(KG) && kwhDiff.abs().lte(KG)),
    `man-hour ${ld.skuManHour.toFixed()} jam, kWh ${ld.skuKwh.toFixed()} (Σ SKU)${ld.manHour === null ? "" : `; lini LAIN ${ld.manHour.toFixed()} jam`}`,
    ["mart:others_month", "mart:allocation_month"], "LAIN-LAIN!C72", { kwh: [kwhDiff, "LAIN-LAIN!C73"] });
  push("B14", "LAIN", "Lain-lain: konversi teralokasi = pool Lain-lain", o.conversion, RP1, status(o.conversion.abs().lte(RP1)),
    `Σ DL + FOH SKU − pool Lain-lain = ${o.conversion.toFixed(2)}`, ["mart:others_month", "mart:allocation_month"], "LAIN-LAIN!C74");
  push("B15", "LAIN", "Lain-lain: Σ SKU = total per kelompok", o.groupVsSku, RP1, status(o.groupVsSku.lte(RP1) && o.totalVsGroups.abs().lte(RP1)),
    `Σ |kelompok − Σ SKU| = ${o.groupVsSku.toFixed(2)}; Σ SKU − Σ kelompok = ${o.totalVsGroups.toFixed(2)}`, ["mart:others_month"], "LAIN-LAIN!C107", { total: [o.totalVsGroups, "LAIN-LAIN!C108"] });
  push("B16", "LAIN", "Semua kartu SKU LULUS", D(o.skuFailures.length), D("0.5"), status(o.skuFailures.length === 0),
    o.skuFailures.length ? o.skuFailures.join("; ") : "Semua kartu SKU lulus", ["mart:others_month", "mart:fg_month"], "LAIN-LAIN!C109");

  // B44 mapping (Fase 1 input control)
  fromResult(b44(inp.month, [...new Set(inp.gl.map((g) => g.account))], [...new Set(inp.tags.map((t) => t.account))], inp.coaMappings),
    inp.coa.map((c) => c.ref));
  return out;
}

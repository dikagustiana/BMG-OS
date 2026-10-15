/**
 * Process cards FCC, UU, UO (WP sheets FCC/UU/UO bagian 2a–2c, Lampiran B). PRD v2 §4.4.
 *
 * Material = card lines (qty × average price, carried as the card value) by card group + freight booked to the line
 * (ongkos kirim singkong, BIAYA BERSAMA bagian 8). Conversion = the line's share of the pools (allocation).
 * Weighted average: rate = (wip_open_value + total_cost − kg_kw2 × nrv) / (kg_premium + kg_waste + kg_wip_close × pct);
 * premium = WIP open + input − KW 2 − waste − WIP close (the card's residual). Premium, waste and WIP close are valued
 * at the rate; KW 2 leaves at NRV.
 */
import { div, sum, ZERO, type Decimal } from "./decimal";
import type { CardQty, MaterialLine, Opening, ProductMaster, Ref } from "./inputs";
import type { MaterialItemValue, ProcessCardMonthRow, ProcessConversion, ProcessMaterial } from "./mart";
import type { PoolCode, ProductCode } from "./types";

export const MATERIAL_RULE = "process-card.processMaterial@1";
export const PROCESS_CARD_RULE = "process-card.processCard@1";

export type MaterialGroupKey = "raw" | "oil" | "cng" | "others";

/** Card group label → key (FCC Lampiran B column B "Kelompok BP"). Unknown groups count as material-others. */
export function materialGroupKey(group: string): MaterialGroupKey | null {
  const g = group.toLowerCase().replace(/[^a-z]/g, "");
  if (g === "rawmaterials" || g === "rawmaterial" || g === "bahanbaku") return "raw";
  if (g === "oil" || g === "minyak") return "oil";
  if (g === "cng") return "cng";
  if (g === "materialothers" || g === "materialother" || g === "materiallain") return "others";
  return null;
}

/** Rows of the WP template per product (UO sits 4 rows higher than FCC; UU differs in 2a and 2c). */
interface CardLayout {
  qty: { wipOpen: number; input: number; premium: number; kw2: number; waste: number; wipClose: number };
  mat: { raw: number; freight: number | null; oil: number; cng: number; others: number; total: number; cardTotal: string };
  conv: { kupas: number; A: number; B: number; C: number; D: number; E: number; foh: number; total: number; grand: number };
  val: { wipOpen: number; cost: number; kw2: number; toAccount: number; rate: number; premium: number; waste: number; wipClose: number };
}
const LAYOUT: Record<ProductCode, CardLayout> = {
  FCC: {
    qty: { wipOpen: 29, input: 30, premium: 32, kw2: 33, waste: 34, wipClose: 35 },
    mat: { raw: 44, freight: 43, oil: 46, cng: 47, others: 55, total: 56, cardTotal: "G229" },
    conv: { kupas: 58, A: 59, B: 60, C: 61, D: 62, E: 63, foh: 64, total: 65, grand: 66 },
    val: { wipOpen: 72, cost: 73, kw2: 74, toAccount: 75, rate: 76, premium: 77, waste: 78, wipClose: 79 },
  },
  UU: {
    qty: { wipOpen: 31, input: 32, premium: 34, kw2: 35, waste: 36, wipClose: 37 },
    mat: { raw: 44, freight: null, oil: 46, cng: 47, others: 55, total: 56, cardTotal: "G218" },
    conv: { kupas: 58, A: 59, B: 60, C: 61, D: 62, E: 63, foh: 64, total: 65, grand: 66 },
    val: { wipOpen: 70, cost: 71, kw2: 72, toAccount: 73, rate: 74, premium: 75, waste: 76, wipClose: 77 },
  },
  UO: {
    qty: { wipOpen: 27, input: 28, premium: 30, kw2: 31, waste: 32, wipClose: 33 },
    mat: { raw: 40, freight: null, oil: 42, cng: 43, others: 51, total: 52, cardTotal: "G214" },
    conv: { kupas: 54, A: 55, B: 56, C: 57, D: 58, E: 59, foh: 60, total: 61, grand: 62 },
    val: { wipOpen: 66, cost: 67, kw2: 68, toAccount: 69, rate: 70, premium: 71, waste: 72, wipClose: 73 },
  },
};

export interface MaterialResult { material: ProcessMaterial; issues: string[]; inputs: Ref[] }

/** Material of one process line: card lines by group + freight from the voucher tags. */
export function processMaterial(lines: readonly MaterialLine[], freight: Decimal, cngM3PerMmbtu: Decimal): MaterialResult {
  const issues: string[] = [];
  const by: Record<MaterialGroupKey, Decimal> = { raw: ZERO, oil: ZERO, cng: ZERO, others: ZERO };
  let cngQty = ZERO;
  const items: MaterialItemValue[] = [];
  for (const m of lines) {
    let k = materialGroupKey(m.group);
    if (!k) {
      issues.push(`Material ${m.line} "${m.itemName}": kelompok "${m.group}" tidak dikenal, dihitung sebagai material lain`);
      k = "others";
    }
    by[k] = by[k].plus(m.value);
    if (k === "cng" && m.qty) cngQty = cngQty.plus(m.qty);
    items.push({ item_name: m.itemName, group: m.group, qty: m.qty, unit: m.unit, price: m.price, value: m.value, ref: m.ref });
  }
  const cardTotal = sum(items.map((i) => i.value));
  return {
    material: {
      raw_materials: by.raw.plus(freight), freight_in: freight, oil: by.oil, cng: by.cng, cng_mmbtu: div(cngQty, cngM3PerMmbtu),
      others: by.others, card_total: cardTotal, total: cardTotal.plus(freight), items,
    },
    issues, inputs: lines.map((l) => l.ref),
  };
}

export interface ProcessCardInput {
  month: string;
  product: ProductMaster;
  card: CardQty;
  material: MaterialResult;
  /** The line's actual allocation of each pool. */
  conversion: Record<PoolCode, Decimal>;
  conversionInputs: Ref[];
  wipOpen: Opening | null;
  wpTemplate: "sep26_4" | null;
}

export interface ProcessCardResult {
  row: ProcessCardMonthRow;
  /** B06: kg to account − kg accounted, using the card's reported premium when present (0 otherwise). */
  kgCheck: Decimal;
  /** B07: cost to account − cost charged. */
  costCheck: Decimal;
  /** B08: kg valued (WIP open + input − KW 2) − Σ kg of premium, waste, WIP close. */
  valuationKgCheck: Decimal;
  issues: string[];
}

/** Rp per kg input of every card line (WP column F = column E ÷ kg input). */
function perKg(m: ProcessMaterial, c: ProcessConversion, kg: Decimal, total: Decimal): Record<string, Decimal> {
  return {
    raw_materials: div(m.raw_materials, kg), oil: div(m.oil, kg), cng: div(m.cng, kg), others: div(m.others, kg), material: div(m.total, kg),
    kupas: div(c.kupas, kg), A: div(c.A, kg), B: div(c.B, kg), C: div(c.C, kg), D: div(c.D, kg), E: div(c.E, kg), foh: div(c.foh, kg),
    conversion: div(c.total, kg), total: div(total, kg),
  };
}

const PER_KG_ROWS = (L: (typeof LAYOUT)[ProductCode]): Record<string, number> => ({
  raw_materials: L.mat.raw, oil: L.mat.oil, cng: L.mat.cng, others: L.mat.others, material: L.mat.total,
  kupas: L.conv.kupas, A: L.conv.A, B: L.conv.B, C: L.conv.C, D: L.conv.D, E: L.conv.E, foh: L.conv.foh, conversion: L.conv.total,
});

export function processCard(x: ProcessCardInput): ProcessCardResult {
  const { card, product } = x;
  const issues = [...x.material.issues];
  const premium = card.wipOpenKg.plus(card.inputKg).minus(card.kw2Kg).minus(card.wasteKg).minus(card.wipCloseKg);
  const reported = card.premiumKg ?? premium;
  const kgCheck = card.wipOpenKg.plus(card.inputKg).minus(reported.plus(card.kw2Kg).plus(card.wasteKg).plus(card.wipCloseKg));

  const c = x.conversion;
  const foh = c.B.plus(c.C).plus(c.D).plus(c.E);
  const conversion: ProcessConversion = { kupas: c.KUPAS, A: c.A, B: c.B, C: c.C, D: c.D, E: c.E, foh, total: c.KUPAS.plus(c.A).plus(foh) };
  const totalCost = x.material.material.total.plus(conversion.total);

  let wipOpenValue = ZERO;
  if (x.wipOpen) {
    wipOpenValue = x.wipOpen.value;
    if (!x.wipOpen.qty.eq(card.wipOpenKg)) issues.push(`${product.code}: kg WIP awal kartu ${card.wipOpenKg.toFixed()} ≠ saldo awal WP ${x.wipOpen.qty.toFixed()}`);
  } else if (!card.wipOpenKg.isZero()) {
    issues.push(`${product.code}: nilai WIP awal (saldo awal WP) tidak ada untuk ${card.wipOpenKg.toFixed()} kg; dinilai 0`);
  }
  const nrv = product.kw2NrvPerKg;
  const kw2Credit = card.kw2Kg.times(nrv);
  const toAccount = wipOpenValue.plus(totalCost).minus(kw2Credit);
  const pct = product.wipCompletionPct;
  const equivalent = premium.plus(card.wasteKg).plus(card.wipCloseKg.times(pct));
  const rate = div(toAccount, equivalent);
  const premiumValue = premium.times(rate), wasteValue = card.wasteKg.times(rate), wipCloseValue = card.wipCloseKg.times(pct).times(rate);
  const valuedKg = card.wipOpenKg.plus(card.inputKg).minus(card.kw2Kg);

  const L = LAYOUT[product.code];
  const s = product.code;
  const wp = x.wpTemplate === "sep26_4";
  const refs: Record<string, string> = wp ? {
    wip_open_kg: `${s}!B${L.qty.wipOpen}`, kg_input: `${s}!B${L.qty.input}`, kg_premium: `${s}!B${L.qty.premium}`, kg_kw2: `${s}!B${L.qty.kw2}`,
    kg_waste: `${s}!B${L.qty.waste}`, wip_close_kg: `${s}!B${L.qty.wipClose}`,
    "material.raw_materials": `${s}!E${L.mat.raw}`, ...(L.mat.freight ? { "material.freight_in": `${s}!E${L.mat.freight}` } : {}),
    "material.oil": `${s}!E${L.mat.oil}`, "material.cng": `${s}!E${L.mat.cng}`, "material.cng_mmbtu": `${s}!B${L.mat.cng}`,
    "material.others": `${s}!E${L.mat.others}`, "material.total": `${s}!E${L.mat.total}`, "material.card_total": `${s}!${L.mat.cardTotal}`,
    "conversion.kupas": `${s}!E${L.conv.kupas}`, "conversion.A": `${s}!E${L.conv.A}`, "conversion.B": `${s}!E${L.conv.B}`, "conversion.C": `${s}!E${L.conv.C}`,
    "conversion.D": `${s}!E${L.conv.D}`, "conversion.E": `${s}!E${L.conv.E}`, "conversion.foh": `${s}!E${L.conv.foh}`, "conversion.total": `${s}!E${L.conv.total}`,
    total_cost: `${s}!E${L.conv.grand}`, cost_per_kg_input: `${s}!F${L.conv.grand}`,
    wip_open_value: `${s}!E${L.val.wipOpen}`, kw2_nrv_credit: `${s}!E${L.val.kw2} (−)`, cost_to_account: `${s}!E${L.val.toAccount}`, equivalent_kg: `${s}!B${L.val.toAccount}`,
    ...Object.fromEntries(Object.entries(PER_KG_ROWS(L)).map(([k, r]) => [`per_kg.${k}`, `${s}!F${r}`])),
    rate_per_kg: `${s}!D${L.val.rate}`, premium_value: `${s}!E${L.val.premium}`, waste_value: `${s}!E${L.val.waste}`, wip_close_value: `${s}!E${L.val.wipClose}`,
  } : {};
  const row: ProcessCardMonthRow = {
    month: x.month, product: product.code, kg_input: card.inputKg, kg_premium: premium, kg_kw2: card.kw2Kg, kg_waste: card.wasteKg,
    wip_open_kg: card.wipOpenKg, wip_close_kg: card.wipCloseKg, wip_completion_pct: pct, material: x.material.material, conversion,
    total_cost: totalCost, cost_per_kg_input: div(totalCost, card.inputKg), wip_open_value: wipOpenValue, kw2_nrv_per_kg: nrv,
    kw2_nrv_credit: kw2Credit, cost_to_account: toAccount, equivalent_kg: equivalent, rate_per_kg: rate, premium_value: premiumValue,
    waste_value: wasteValue, wip_close_value: wipCloseValue,
    premium_pct: div(premium, card.inputKg), kw2_pct: div(card.kw2Kg, card.inputKg), waste_pct: div(card.wasteKg, card.inputKg),
    per_kg: perKg(x.material.material, conversion, card.inputKg, totalCost),
    rule_id: PROCESS_CARD_RULE,
    inputs: [...card.refs, ...x.material.inputs, ...x.conversionInputs, ...(x.wipOpen ? [x.wipOpen.ref] : []), product.ref],
    source_ref: wp ? `${s}!E${L.conv.grand}` : null, source_refs: refs,
  };
  return {
    row, kgCheck, costCheck: toAccount.minus(premiumValue.plus(wasteValue).plus(wipCloseValue)),
    valuationKgCheck: valuedKg.minus(premium.plus(card.wasteKg).plus(card.wipCloseKg)), issues,
  };
}

/**
 * Lain-lain per SKU and per group (WP LAIN-LAIN bagian 2–5, the 9 SKU sheets and KOPERASI). PRD v2 §4.6.
 *
 * Material: FCC premium × FCC FG rate (FCC!D89); KW 2 FCC × NRV; KW 2 ubi × kw2_ubi_value; external material = card
 * value. Conversion: the Lain-lain share of the pools (allocation) divided by the same drivers as the WP:
 * A and B per man-hour; C per kWh; D bagging part per bagging kWh, frying part per machine hour (Ubi putih ACE);
 * E per external material value. Group rows use the group's summed drivers (LAIN-LAIN bagian 3), SKU rows their own
 * (SKU sheets); B15 checks that both agree. FG per SKU in its FG unit (bag | kg).
 */
import { div, sum, ZERO, type Decimal } from "./decimal";
import type { Driver, InventoryItem, MaterialLine, Opening, OthersGroupMaster, Ref, SalesLine, SkuCard, SkuMaster } from "./inputs";
import type { LainAllocation } from "./allocation";
import { fgRollForward } from "./finished-goods";
import type { FgMonthRow, OthersMonthRow } from "./mart";

export const OTHERS_RULE = "others-sku.othersGroups@1";
export const OTHERS_FG_RULE = "others-sku.skuFinishedGoods@1";

/** Lain-lain material groups (SKU sheet Lampiran B column B). */
export const OTHERS_GROUPS = ["FCC", "KW2", "KW2UBI", "EXT"] as const;

/** WP Sep26_4: SKU sheets in the order of LAIN-LAIN bagian 5 (rows 82–91). */
const WP_SKU_SHEETS = ["CEM-CEM ORI", "CEM-CEM BBQ", "KOPERASI", "MCH BASRENG L0", "MCH BASRENG L5", "MCH BASRENG L10", "MCH KERIPIK LV3", "MCH KERIPIK LV10",
  "MCH KERIPIK LV5", "UBI PUTIH ACE"];
const KOPERASI_COLS = "BCDEFGHIJKL";

export interface UnitCost {
  code: string;
  outputKg: Decimal;
  unitsOut: Decimal;
  sampleKg: Decimal;
  fccKg: Decimal;
  kw2Kg: Decimal;
  kw2UbiKg: Decimal;
  ext: Decimal;
  manHour: Decimal;
  kwh: Decimal;
  machineHour: Decimal;
  baggingKwh: Decimal;
  unknownGroups: number;
  refs: Ref[];
}

export interface OthersInput {
  month: string;
  skus: SkuMaster[];
  groups: OthersGroupMaster[];
  skuCards: SkuCard[];
  materials: MaterialLine[];
  drivers: Driver[];
  inventory: InventoryItem[];
  sales: SalesLine[];
  opening: Opening[];
  lain: LainAllocation;
  allocationInputs: Ref[];
  fccFgRate: Decimal;
  nrvKw2: Decimal;
  kw2UbiValue: Decimal;
  /** Sales items of the process products (FCC, KW 2 tawar, UU, UO): the rest of Sales by Item is Lain-lain revenue. */
  productSalesItems: string[];
  inputs: Ref[];
  wpTemplate: "sep26_4" | null;
}

export interface OthersChecks {
  /** B13: Σ SKU man-hour / kWh − Lain-lain driver used in the allocation (set by the orchestrator). */
  manHour: Decimal;
  kwh: Decimal;
  /** B14: Σ SKU conversion (DL + FOH) − Lain-lain pools allocated (without kupas). */
  conversion: Decimal;
  /** B15: Σ |group row − Σ SKU rows of the group| and Σ SKU total − Σ group total. */
  groupVsSku: Decimal;
  totalVsGroups: Decimal;
  /** B16: SKUs failing their sheet checks (unknown material group, FG not balanced). */
  skuFailures: string[];
}

export interface OthersResult {
  rows: OthersMonthRow[];
  fg: FgMonthRow[];
  units: UnitCost[];
  totals: { manHour: Decimal; kwh: Decimal; baggingKwh: Decimal; machineHour: Decimal; ext: Decimal; fccKg: Decimal; kw2Kg: Decimal };
  revenue: { others: Decimal; noCard: Decimal };
  checks: OthersChecks;
  issues: string[];
}

/** Drivers and material of one Lain-lain unit (SKU code). */
export function unitCost(code: string, x: Pick<OthersInput, "skuCards" | "materials" | "drivers" | "skus">): UnitCost {
  const card = x.skuCards.find((c) => c.line === code) ?? null;
  const mats = x.materials.filter((m) => m.line === code);
  const drv = (k: Driver["driver"]) => sum(x.drivers.filter((d) => d.line === code && d.driver === k).map((d) => d.value));
  const g = (k: string) => mats.filter((m) => m.group.toUpperCase() === k);
  const sku = x.skus.find((s) => s.code === code) ?? null;
  const outputKg = card?.outputKg ?? ZERO;
  let unitsOut = card?.outputFg ?? null;
  if (unitsOut === null) unitsOut = sku?.kgPerUnit && !sku.kgPerUnit.isZero() ? outputKg.div(sku.kgPerUnit) : sku?.fgUnit === "kg" ? outputKg : ZERO;
  const machineHour = drv("machine_hour");
  const kwh = drv("kwh");
  return {
    code, outputKg, unitsOut, sampleKg: card?.sampleKg ?? ZERO,
    fccKg: sum(g("FCC").map((m) => m.qty ?? ZERO)), kw2Kg: sum(g("KW2").map((m) => m.qty ?? ZERO)), kw2UbiKg: sum(g("KW2UBI").map((m) => m.qty ?? ZERO)),
    ext: sum(g("EXT").map((m) => m.value)), manHour: drv("man_hour"), kwh, machineHour, baggingKwh: machineHour.isZero() ? kwh : ZERO,
    unknownGroups: mats.filter((m) => !(OTHERS_GROUPS as readonly string[]).includes(m.group.toUpperCase())).length,
    refs: [...(card?.refs ?? []), ...mats.map((m) => m.ref), ...x.drivers.filter((d) => d.line === code).map((d) => d.ref)],
  };
}

const addUnits = (code: string, us: UnitCost[]): UnitCost => ({
  code, outputKg: sum(us.map((u) => u.outputKg)), unitsOut: sum(us.map((u) => u.unitsOut)), sampleKg: sum(us.map((u) => u.sampleKg)),
  fccKg: sum(us.map((u) => u.fccKg)), kw2Kg: sum(us.map((u) => u.kw2Kg)), kw2UbiKg: sum(us.map((u) => u.kw2UbiKg)), ext: sum(us.map((u) => u.ext)),
  manHour: sum(us.map((u) => u.manHour)), kwh: sum(us.map((u) => u.kwh)), machineHour: sum(us.map((u) => u.machineHour)),
  baggingKwh: sum(us.map((u) => u.baggingKwh)), unknownGroups: us.reduce((s, u) => s + u.unknownGroups, 0), refs: us.flatMap((u) => u.refs),
});

interface Costed {
  fccValue: Decimal; kw2Value: Decimal; dl: Decimal; fohB: Decimal; fohCd: Decimal; fohE: Decimal; foh: Decimal; total: Decimal; perKg: Decimal;
}

export function othersGroups(x: OthersInput): OthersResult {
  const issues: string[] = [];
  const wp = x.wpTemplate === "sep26_4";
  const known = new Set(x.skus.map((s) => s.code));
  const cardLines = new Set([...x.skuCards.map((c) => c.line), ...x.materials.map((m) => m.line), ...x.drivers.map((d) => d.line)]);
  for (const g of x.groups) if (cardLines.has(g.code)) issues.push(`Lain-lain: data kartu pada kelompok ${g.code} (bukan SKU) tidak dihitung; isi per SKU`);

  const units = x.skus.map((s) => unitCost(s.code, x));
  const T = addUnits("LAIN", units);
  const L = x.lain;
  const cost = (u: UnitCost): Costed => {
    const fccValue = u.fccKg.times(x.fccFgRate);
    const kw2Value = u.kw2Kg.times(x.nrvKw2).plus(u.kw2UbiKg.times(x.kw2UbiValue));
    const mhShare = div(u.manHour, T.manHour);
    const dl = mhShare.times(L.A);
    const fohB = mhShare.times(L.B);
    const fohCd = div(u.kwh, T.kwh).times(L.C).plus(div(u.baggingKwh, T.baggingKwh).times(L.dBagging)).plus(div(u.machineHour, T.machineHour).times(L.dMachine));
    const fohE = div(u.ext, T.ext).times(L.E);
    const foh = fohB.plus(fohCd).plus(fohE);
    const total = fccValue.plus(kw2Value).plus(u.ext).plus(dl).plus(foh);
    return { fccValue, kw2Value, dl, fohB, fohCd, fohE, foh, total, perKg: div(total, u.outputKg) };
  };

  // FG per SKU
  const fg: FgMonthRow[] = [];
  const fgOf = new Map<string, FgMonthRow>();
  const skuFailures: string[] = [];
  const costs = new Map<string, Costed>();
  units.forEach((u) => costs.set(u.code, cost(u)));
  const koperasi = x.skus.filter((s) => s.wpSheet === "KOPERASI");
  for (const s of x.skus) {
    const u = units.find((v) => v.code === s.code)!;
    const c = costs.get(s.code)!;
    const inv = x.inventory.find((i) => i.itemCode === s.code) ?? null;
    const open = x.opening.find((o) => o.kind === "fg" && (o.itemCode ?? o.line) === s.code) ?? null;
    const salesLines = x.sales.filter((l) => l.itemCode === s.code);
    let qtySold = inv?.qtyOutSale ?? null;
    if (qtySold === null) {
      qtySold = sum(salesLines.map((l) => l.qty));
      if (!qtySold.isZero()) issues.push(`${s.code}: pengiriman Accurate (Inventory Valuation kts. keluar) tidak ada; dipakai kuantitas Sales by Item`);
    }
    if (!open && inv?.qtyOpen && !inv.qtyOpen.isZero()) issues.push(`${s.code}: saldo awal FG tanpa nilai WP (saldo awal WP); dinilai 0`);
    const kc = koperasi.indexOf(s);
    const sh = s.wpSheet;
    const refs: Record<string, string> = !wp || !sh ? {} : sh === "KOPERASI" ? (() => {
      const col = KOPERASI_COLS[kc];
      return { qty_open: `KOPERASI!${col}27`, value_open: `KOPERASI!${col}28`, qty_in: `KOPERASI!${col}29`, value_in: `KOPERASI!${col}30`,
        avg_rate: `KOPERASI!${col}31`, qty_sold: `KOPERASI!${col}32`, cogs_sold: `KOPERASI!${col}33`, qty_close_accurate: `KOPERASI!${col}34`,
        value_close: `KOPERASI!${col}35`, qty_diff: `KOPERASI!${col}36`, cogs_qty_diff: `KOPERASI!${col}37`, cogs_total: `KOPERASI!${col}38`,
        revenue: `KOPERASI!${col}39`, gross_margin: `KOPERASI!${col}40`, gross_margin_pct: `KOPERASI!${col}41` };
    })() : {
      qty_open: `${sh}!B47`, value_open: `${sh}!D47`, qty_in: `${sh}!B48`, value_in: `${sh}!D48`, avg_rate: `${sh}!C50`, qty_sold: `${sh}!B51`,
      cogs_sold: `${sh}!D51`, qty_close_accurate: `${sh}!B52`, value_close: `${sh}!D52`, qty_diff: `${sh}!B53`, cogs_qty_diff: `${sh}!D53`,
      cogs_total: `${sh}!D54`, revenue: `${sh}!C118`, "accurate.value_open": `${sh}!F47`, "accurate.qty_in": `${sh}!E48`, "accurate.value_in": `${sh}!F48`,
      "accurate.value_out_sale": `${sh}!F51`, "accurate.value_close": `${sh}!F52`,
    };
    const row = fgRollForward({
      month: x.month, line: "LAIN", key: s.code, itemCode: s.code, unit: s.fgUnit,
      qtyOpen: open?.qty ?? inv?.qtyOpen ?? ZERO, valueOpenWp: open?.value ?? ZERO, excludeValueWithoutQty: false,
      qtyIn: u.unitsOut, valueIn: c.total, qtySold, qtyTransfer: ZERO, qtyClose: inv?.qtyClose ?? ZERO, cogsWaste: ZERO, qtyKw2Sold: ZERO, kw2Nrv: ZERO,
      revenue: sum(salesLines.map((l) => l.amount)), accurate: inv,
      inputs: [`mart:others_month:${s.code}`, ...(open ? [open.ref] : []), ...(inv ? [inv.ref] : []), ...salesLines.map((l) => l.ref), s.ref],
      sourceRef: refs.cogs_total ?? null, sourceRefs: refs,
    });
    row.rule_id = OTHERS_FG_RULE;
    fg.push(row);
    fgOf.set(s.code, row);
    const balance = row.value_open.plus(row.value_in).minus(row.cogs_sold).minus(row.value_close).minus(row.cogs_qty_diff);
    if (u.unknownGroups > 0) skuFailures.push(`${s.code}: ${u.unknownGroups} baris material tanpa kelompok FCC/KW2/KW2UBI/EXT`);
    if (balance.abs().gt(1)) skuFailures.push(`${s.code}: barang jadi tidak seimbang (${balance.toFixed(2)})`);
  }

  const row = (kind: OthersMonthRow["row_kind"], group: string | null, sku: string | null, fgUnit: string, u: UnitCost, c: Costed,
    fgRows: FgMonthRow[], refs: Record<string, string>, inputs: Ref[]): OthersMonthRow => {
    const cogs = sum(fgRows.map((f) => f.cogs_total));
    const revenue = sum(fgRows.map((f) => f.revenue));
    return {
      month: x.month, row_kind: kind, others_group: group, sku, fg_unit: fgUnit, kg_out: u.outputKg, units_out: u.unitsOut, sample_kg: u.sampleKg,
      fcc_in_kg: u.fccKg, kw2_in_kg: u.kw2Kg, kw2_ubi_in_kg: u.kw2UbiKg, man_hour: u.manHour, kwh: u.kwh, machine_hour: u.machineHour,
      fcc_value: c.fccValue, kw2_value: c.kw2Value, ext_material: u.ext, dl: c.dl, foh_b: c.fohB, foh_cd: c.fohCd, foh_e: c.fohE, foh: c.foh,
      total: c.total, per_kg: c.perKg, fg_value_open: sum(fgRows.map((f) => f.value_open)), fg_value_close: sum(fgRows.map((f) => f.value_close)),
      cogs, revenue, margin: revenue.minus(cogs), margin_pct: div(revenue.minus(cogs), revenue),
      rule_id: OTHERS_RULE, inputs: [...new Set(inputs)], source_ref: refs.total ?? null, source_refs: refs,
    };
  };

  const rows: OthersMonthRow[] = [];
  for (const s of x.skus) {
    const u = units.find((v) => v.code === s.code)!;
    const sh = s.wpSheet;
    const kc = koperasi.indexOf(s);
    const refs: Record<string, string> = !wp || !sh ? {} : sh === "KOPERASI" ? (() => {
      const col = KOPERASI_COLS[kc];
      return { kg_out: `KOPERASI!${col}7`, units_out: `KOPERASI!${col}8`, fcc_in_kg: `KOPERASI!${col}9`, kw2_in_kg: `KOPERASI!${col}10`,
        kw2_ubi_in_kg: `KOPERASI!${col}11`, man_hour: `KOPERASI!${col}12`, fcc_value: `KOPERASI!${col}13`, kw2_value: `KOPERASI!${col}14`,
        ext_material: `KOPERASI!${col}15`, dl: `KOPERASI!${col}17`, foh_b: `KOPERASI!${col}18`, foh_cd: `KOPERASI!${col}19`, foh_e: `KOPERASI!${col}20`,
        foh: `KOPERASI!${col}21`, total: `KOPERASI!${col}22`, per_kg: `KOPERASI!${col}23`, cogs: `KOPERASI!${col}38`, revenue: `KOPERASI!${col}39`,
        margin: `KOPERASI!${col}40`, margin_pct: `KOPERASI!${col}41` };
    })() : (() => {
      const r5 = 82 + WP_SKU_SHEETS.indexOf(sh);
      return { kg_out: `${sh}!B21`, units_out: `${sh}!C21`, sample_kg: `${sh}!B22`, fcc_in_kg: `${sh}!B23`, kw2_in_kg: `${sh}!B24`, kw2_ubi_in_kg: `${sh}!B25`,
        fcc_value: `${sh}!E31`, ext_material: `${sh}!E34`, man_hour: `${sh}!B37`, kwh: `${sh}!B39`, dl: `${sh}!E37`, foh_b: `${sh}!E38`, foh_cd: `${sh}!E39`,
        foh_e: `${sh}!E40`, foh: `${sh}!E41`, total: `${sh}!E43`, per_kg: `${sh}!F43`, fg_value_open: `LAIN-LAIN!E${r5}`, fg_value_close: `LAIN-LAIN!F${r5}`,
        cogs: `LAIN-LAIN!G${r5}`, revenue: `LAIN-LAIN!H${r5}`, margin: `LAIN-LAIN!I${r5}`, margin_pct: `LAIN-LAIN!J${r5}` };
    })();
    rows.push(row("sku", s.groupCode, s.code, s.fgUnit, u, costs.get(s.code)!, [fgOf.get(s.code)!], refs,
      [...u.refs, ...x.allocationInputs, s.ref, `mart:fg_month:FCC`]));
  }

  let groupVsSku = ZERO;
  let groupsTotal = ZERO;
  for (const g of x.groups) {
    const members = x.skus.filter((s) => s.groupCode === g.code);
    const u = addUnits(g.code, units.filter((v) => members.some((m) => m.code === v.code)));
    const c = cost(u);
    groupsTotal = groupsTotal.plus(c.total);
    groupVsSku = groupVsSku.plus(c.total.minus(sum(members.map((m) => costs.get(m.code)!.total))).abs());
    const r2 = g.wpRow, r3 = g.wpRow === null ? null : g.wpRow + 25;
    const refs: Record<string, string> = !wp || r2 === null || r3 === null ? {} : {
      kg_out: `LAIN-LAIN!C${r2}`, fcc_in_kg: `LAIN-LAIN!D${r2}`, kw2_in_kg: `LAIN-LAIN!E${r2}`, kw2_ubi_in_kg: `LAIN-LAIN!F${r2}`,
      ext_material: `LAIN-LAIN!G${r2}`, man_hour: `LAIN-LAIN!H${r2}`, kwh: `LAIN-LAIN!I${r2}`,
      fcc_value: `LAIN-LAIN!B${r3}`, kw2_value: `LAIN-LAIN!C${r3}`, dl: `LAIN-LAIN!E${r3}`, foh: `LAIN-LAIN!F${r3}`, total: `LAIN-LAIN!G${r3}`, per_kg: `LAIN-LAIN!H${r3}`,
    };
    rows.push(row("group", g.code, null, g.fgUnit, u, c, members.map((m) => fgOf.get(m.code)!), refs, [...u.refs, ...x.allocationInputs, g.ref]));
  }

  // revenue of Lain-lain = Sales by Item outside the process products; products without a card carry it at zero cost
  const othersSales = x.sales.filter((l) => !l.itemCode || !x.productSalesItems.includes(l.itemCode));
  const othersRevenue = sum(othersSales.map((l) => l.amount));
  const skuRevenue = sum(fg.map((f) => f.revenue));
  const noCard = othersRevenue.minus(skuRevenue);
  const unknownSales = othersSales.filter((l) => l.itemCode && !known.has(l.itemCode));
  const zero = addUnits("NO_CARD", []);
  const nc = row("no_card", null, null, "kg", zero, { fccValue: ZERO, kw2Value: ZERO, dl: ZERO, fohB: ZERO, fohCd: ZERO, fohE: ZERO, foh: ZERO, total: ZERO, perKg: ZERO },
    [], wp ? { revenue: "LAIN-LAIN!H92", cogs: "LAIN-LAIN!G92", margin: "LAIN-LAIN!I92" } : {}, [...unknownSales, ...othersSales.filter((l) => !l.itemCode)].map((l) => l.ref));
  nc.revenue = noCard;
  nc.margin = noCard;
  nc.margin_pct = div(noCard, noCard);
  rows.push(nc);

  const skuTotal = sum(units.map((u) => costs.get(u.code)!.total));
  const conv = sum(units.map((u) => { const c = costs.get(u.code)!; return c.dl.plus(c.foh); }));
  return {
    rows, fg, units,
    totals: { manHour: T.manHour, kwh: T.kwh, baggingKwh: T.baggingKwh, machineHour: T.machineHour, ext: T.ext, fccKg: T.fccKg, kw2Kg: T.kw2Kg },
    revenue: { others: othersRevenue, noCard },
    checks: {
      manHour: ZERO, kwh: ZERO, conversion: conv.minus(L.A.plus(L.B).plus(L.C).plus(L.D).plus(L.E)),
      groupVsSku, totalVsGroups: skuTotal.minus(groupsTotal), skuFailures,
    },
    issues,
  };
}

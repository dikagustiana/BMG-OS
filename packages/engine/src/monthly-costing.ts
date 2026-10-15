/**
 * computeMonth: the monthly costing of B2 (WP Sep26_4, 14 steps up to the Lain-lain SKU cards). Orchestration only:
 * every number comes from pool.ts, allocation.ts, process-card.ts, finished-goods.ts, others-sku.ts and
 * costing-controls.ts. Order (CLAUDE.md "Urutan costing"): material per line → labour and overhead pools → idle →
 * allocation → process cards → finished goods → Lain-lain → controls.
 */
import { allocatePools, type LineDrivers } from "./allocation";
import { monthControls, type ProductCheck } from "./costing-controls";
import { div, sum, ZERO, type Decimal } from "./decimal";
import { fgProduct } from "./finished-goods";
import { monthInputsFromRows, type InputRows, type MonthInputs } from "./inputs";
import type { AllocationMonthRow, ControlMonthRow, FgMonthRow, IdleMonthRow, OthersMonthRow, PoolMonthRow, ProcessCardMonthRow, SummaryMonthRow } from "./mart";
import { othersGroups, unitCost } from "./others-sku";
import { buildPools, idleCapacity } from "./pool";
import { processCard, processMaterial } from "./process-card";
import { ENGINE_VERSION, type LineCode, type ProductCode } from "./types";

export const SUMMARY_RULE = "monthly-costing.summary@1";

export interface MonthOutputs {
  month: string;
  engine_version: string;
  pool_month: PoolMonthRow[];
  idle_month: IdleMonthRow;
  allocation_month: AllocationMonthRow[];
  process_card_month: ProcessCardMonthRow[];
  fg_month: FgMonthRow[];
  others_month: OthersMonthRow[];
  summary_month: SummaryMonthRow[];
  control_month: ControlMonthRow[];
  issues: string[];
}

const PRODUCTS: ProductCode[] = ["FCC", "UU", "UO"];
/** Lain-lain material group "FCC" is FCC premium taken out of FG-001 (FCC bagian 3, transfer). */
const PREMIUM_TRANSFER_PRODUCT: ProductCode = "FCC";
const SUMMARY_COL: Record<LineCode | "TOTAL", string> = { FCC: "B", UU: "C", UO: "D", LAIN: "E", TOTAL: "F" };

interface SummaryParts {
  kg_production: Decimal; material_ext: Decimal; material_interproduct: Decimal; kupas: Decimal; dl: Decimal; foh: Decimal; cogs: Decimal; revenue: Decimal;
}

export function computeMonth(inp: MonthInputs): MonthOutputs {
  const issues = [...inp.issues];
  const wp = inp.wpTemplate === "sep26_4";
  const drv = (line: string, k: string) => sum(inp.drivers.filter((d) => d.line === line && d.driver === k).map((d) => d.value));
  const drvRefs = (line: string) => inp.drivers.filter((d) => d.line === line).map((d) => d.ref);

  // 1. material per line (process cards) and Lain-lain units
  const pools = buildPools(inp);
  const freight = (line: string) => pools.materialFromTags.find((m) => m.line === line);
  for (const m of pools.materialFromTags) if (!PRODUCTS.includes(m.line as ProductCode)) issues.push(`Tag MATERIAL ke lini "${m.line}" tidak punya kartu proses`);
  const materials = Object.fromEntries(PRODUCTS.map((p) => {
    const f = freight(p);
    const r = processMaterial(inp.materials.filter((m) => m.line === p), f?.amount ?? ZERO, inp.assumptions.cngM3PerMmbtu);
    if (f) r.inputs.push(...f.inputs);
    return [p, r];
  })) as Record<ProductCode, ReturnType<typeof processMaterial>>;
  const units = inp.skus.map((s) => unitCost(s.code, inp));

  // 2. drivers per line (BIAYA BERSAMA bagian 4 and 10)
  const cardOf = (p: ProductCode) => inp.cards.find((c) => c.line === p) ?? null;
  const drivers: LineDrivers[] = PRODUCTS.map((p) => ({
    line: p, manHour: drv(p, "man_hour"), kgPeeled: drv(p, "kg_peeled"), kwh: drv(p, "kwh"), materialValue: materials[p].material.card_total,
    volume: cardOf(p)?.inputKg ?? ZERO, machineHour: drv(p, "machine_hour"), baggingKwh: ZERO, refs: [...drvRefs(p), ...materials[p].inputs],
  }));
  const lainUnits = units;
  drivers.push({
    line: "LAIN", manHour: sum(lainUnits.map((u) => u.manHour)), kgPeeled: sum(inp.skus.map((s) => drv(s.code, "kg_peeled"))),
    kwh: sum(lainUnits.map((u) => u.kwh)), materialValue: sum(lainUnits.map((u) => u.ext)),
    // budget method: production volume of the process products only (BIAYA BERSAMA F95 = 0)
    volume: ZERO, machineHour: sum(lainUnits.map((u) => u.machineHour)), baggingKwh: sum(lainUnits.map((u) => u.baggingKwh)),
    refs: lainUnits.flatMap((u) => u.refs),
  });

  // 3. idle Unit I labour (bagian 5)
  const hoursPaidRows = inp.drivers.filter((d) => d.driver === "hours_paid");
  const poolA = pools.pools.find((p) => p.pool === "A")!.total;
  const idle = idleCapacity({
    month: inp.month, hoursPaid: sum(hoursPaidRows.map((d) => d.value)), hoursToProduct: sum(drivers.map((d) => d.manHour)), poolA,
    normalCapacityHours: inp.assumptions.normalCapacityHours, idleToPeriod: inp.assumptions.idleToPeriod,
    inputs: [...hoursPaidRows.map((d) => d.ref), inp.assumptions.refs.idle_to_period, ...(inp.assumptions.refs.capacity ? [inp.assumptions.refs.capacity] : []), "mart:pool_month:A"],
    wpTemplate: inp.wpTemplate,
  });
  if (!hoursPaidRows.length) issues.push("Jam kerja operator dibayar (driver hours_paid) belum diunggah; jam menganggur tidak dihitung");

  // 4. allocation (bagian 6, 6b, 10)
  const alloc = allocatePools({ month: inp.month, pools: pools.pools, periodCharge: idle.period_charge, drivers, inputs: ["mart:pool_month"], wpTemplate: inp.wpTemplate });

  // 5. process cards
  const cards = PRODUCTS.flatMap((p) => {
    const card = cardOf(p);
    const product = inp.products.find((x) => x.code === p);
    if (!card || !product) return [];
    const r = processCard({
      month: inp.month, product, card, material: materials[p], conversion: alloc.actual[p], conversionInputs: [`mart:allocation_month:${p}`],
      wipOpen: inp.opening.find((o) => o.kind === "wip" && o.line === p) ?? null, wpTemplate: inp.wpTemplate,
    });
    issues.push(...r.issues);
    return [{ product: p, ...r }];
  });

  // 6. finished goods of the process products
  const transferKg = sum(lainUnits.map((u) => u.fccKg));
  const fgProducts = cards.map((c) => {
    const product = inp.products.find((x) => x.code === c.product)!;
    const items = (codes: string[]) => inp.sales.filter((l) => l.itemCode !== null && codes.includes(l.itemCode));
    const r = fgProduct({
      month: inp.month, product, card: c.row,
      opening: inp.opening.find((o) => o.kind === "fg" && (o.itemCode === product.fgItemCode || o.line === product.code)) ?? null,
      inventory: inp.inventory.find((i) => i.itemCode === product.fgItemCode) ?? null,
      sales: items(product.salesItemCodes), kw2Sales: items(product.kw2SalesItemCodes),
      transferKg: c.product === PREMIUM_TRANSFER_PRODUCT ? transferKg : ZERO,
      transferInputs: c.product === PREMIUM_TRANSFER_PRODUCT ? ["mart:others_month"] : [], wpTemplate: inp.wpTemplate,
    });
    issues.push(...r.issues);
    return { product: c.product, row: r.row };
  });
  const fccFg = fgProducts.find((f) => f.product === PREMIUM_TRANSFER_PRODUCT)?.row ?? null;
  if (!fccFg && !transferKg.isZero()) issues.push("FCC premium dipakai Lain-lain tetapi kartu FCC tidak ada; dinilai 0");

  // 7. Lain-lain
  const fcc = inp.products.find((p) => p.code === "FCC");
  const others = othersGroups({
    month: inp.month, skus: inp.skus, groups: inp.othersGroups, skuCards: inp.skuCards, materials: inp.materials, drivers: inp.drivers,
    inventory: inp.inventory, sales: inp.sales, opening: inp.opening, lain: alloc.lain, allocationInputs: ["mart:allocation_month:LAIN"],
    fccFgRate: fccFg?.avg_rate ?? ZERO, nrvKw2: fcc?.kw2NrvPerKg ?? inp.assumptions.nrvKw2, kw2UbiValue: inp.assumptions.kw2UbiValue,
    productSalesItems: inp.products.flatMap((p) => [...p.salesItemCodes, ...p.kw2SalesItemCodes]), inputs: [], wpTemplate: inp.wpTemplate,
  });
  issues.push(...others.issues);

  // 8. summary per line (REKON & KONTROL bagian 1)
  const summary: SummaryMonthRow[] = [];
  const mk = (line: LineCode | "TOTAL", v: SummaryParts, inputs: string[]): SummaryMonthRow => {
    const total = sum([v.material_ext, v.material_interproduct, v.kupas, v.dl, v.foh]);
    const margin = v.revenue.minus(v.cogs);
    const c = SUMMARY_COL[line];
    return {
      month: inp.month, line, ...v, total_cost: total, cost_per_kg: div(total, v.kg_production), gross_margin: margin, gross_margin_pct: div(margin, v.revenue),
      rule_id: SUMMARY_RULE, inputs, source_ref: wp ? `REKON & KONTROL!${c}12 (Rp jt)` : null,
      source_refs: wp ? {
        kg_production: `REKON & KONTROL!${c}6`, material_ext: `REKON & KONTROL!${c}7 (Rp jt)`, material_interproduct: `REKON & KONTROL!${c}8 (Rp jt)`,
        kupas: `REKON & KONTROL!${c}9 (Rp jt)`, dl: `REKON & KONTROL!${c}10 (Rp jt)`, foh: `REKON & KONTROL!${c}11 (Rp jt)`,
        total_cost: `REKON & KONTROL!${c}12 (Rp jt)`, cost_per_kg: `REKON & KONTROL!${c}13`, cogs: `REKON & KONTROL!${c}14 (Rp jt)`,
        revenue: `REKON & KONTROL!${c}15 (Rp jt)`, gross_margin_pct: `REKON & KONTROL!${c}16`,
      } : {},
    };
  };
  for (const c of cards) {
    const fg = fgProducts.find((f) => f.product === c.product)!.row;
    summary.push(mk(c.product, {
      kg_production: c.row.kg_input, material_ext: c.row.material.total, material_interproduct: ZERO, kupas: c.row.conversion.kupas,
      dl: c.row.conversion.A, foh: c.row.conversion.foh, cogs: fg.cogs_total, revenue: fg.revenue,
    }, [`mart:process_card_month:${c.product}`, `mart:fg_month:${c.product}`]));
  }
  const skuRows = others.rows.filter((r) => r.row_kind === "sku");
  summary.push(mk("LAIN", {
    kg_production: sum(skuRows.map((r) => r.kg_out)), material_ext: sum(skuRows.map((r) => r.ext_material)),
    material_interproduct: sum(skuRows.map((r) => r.fcc_value.plus(r.kw2_value))), kupas: ZERO, dl: sum(skuRows.map((r) => r.dl)),
    foh: sum(skuRows.map((r) => r.foh)), cogs: sum(others.rows.map((r) => r.row_kind === "group" ? ZERO : r.cogs)), revenue: others.revenue.others,
  }, ["mart:others_month"]));
  const tot = (f: (r: SummaryMonthRow) => Decimal) => sum(summary.map(f));
  summary.push(mk("TOTAL", {
    kg_production: tot((r) => r.kg_production), material_ext: tot((r) => r.material_ext), material_interproduct: tot((r) => r.material_interproduct),
    kupas: tot((r) => r.kupas), dl: tot((r) => r.dl), foh: tot((r) => r.foh), cogs: tot((r) => r.cogs), revenue: tot((r) => r.revenue),
  }, ["mart:summary_month"]));

  // 9. controls
  const productChecks: ProductCheck[] = cards.map((c) => ({
    product: c.product, card: c.row, fg: fgProducts.find((f) => f.product === c.product)!.row, kgCheck: c.kgCheck, costCheck: c.costCheck,
    valuationKgCheck: c.valuationKgCheck,
  }));
  const lainLevel = (k: string) => (inp.drivers.some((d) => d.line === "LAIN" && d.driver === k) ? drv("LAIN", k) : null);
  const controls = monthControls({
    inputs: inp, pool: pools.checks, allocation: alloc.checks, products: productChecks, others: others.checks,
    lainDrivers: { manHour: lainLevel("man_hour"), kwh: lainLevel("kwh"), skuManHour: others.totals.manHour, skuKwh: others.totals.kwh },
  });

  return {
    month: inp.month, engine_version: ENGINE_VERSION,
    pool_month: pools.pools, idle_month: idle, allocation_month: alloc.rows,
    process_card_month: cards.map((c) => c.row), fg_month: [...fgProducts.map((f) => f.row), ...others.fg],
    others_month: others.rows, summary_month: summary, control_month: controls, issues: [...new Set(issues)],
  };
}

/** The web layer's entry point: DB rows of one month → mart rows. */
export function rebuildMonthFromRows(rows: InputRows): MonthOutputs {
  return computeMonth(monthInputsFromRows(rows));
}

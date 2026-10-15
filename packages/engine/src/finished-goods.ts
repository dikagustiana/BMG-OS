/**
 * Finished goods and cost of goods sold (WP FCC/UU/UO bagian 3; SKU sheets bagian 3; KOPERASI bagian 3). PRD v2 §4.5.
 *
 * Weighted average rate = (value_open + value_in) / (qty_open + qty_in). Out: sales, transfer to Lain-lain, closing at
 * the Accurate quantity; the quantity difference goes to COGS. COGS = sales + waste + quantity difference + KW 2 sold at
 * NRV. Process products: a WP opening value without quantity stays outside the average (ASUMSI no. 12).
 */
import { div, sum, ZERO, type Decimal } from "./decimal";
import type { InventoryItem, Opening, ProductMaster, Ref, SalesLine } from "./inputs";
import type { FgMonthRow, ProcessCardMonthRow } from "./mart";
import type { LineCode, ProductCode } from "./types";

export const FG_RULE = "finished-goods.fgRollForward@1";

export interface FgRollInput {
  month: string;
  line: LineCode;
  key: string;
  itemCode: string | null;
  unit: string;
  qtyOpen: Decimal;
  /** Opening value on the WP (new card), from wp_opening or the previous month's mart. */
  valueOpenWp: Decimal;
  /** true: an opening value without quantity does not enter the average (process products, ASUMSI no. 12). */
  excludeValueWithoutQty: boolean;
  qtyIn: Decimal;
  valueIn: Decimal;
  qtySold: Decimal;
  qtyTransfer: Decimal;
  qtyClose: Decimal;
  cogsWaste: Decimal;
  qtyKw2Sold: Decimal;
  kw2Nrv: Decimal;
  revenue: Decimal;
  accurate: InventoryItem | null;
  inputs: Ref[];
  sourceRefs: Record<string, string>;
  sourceRef: string | null;
}

export function fgRollForward(x: FgRollInput): FgMonthRow {
  const valueOpen = x.excludeValueWithoutQty && x.qtyOpen.isZero() ? ZERO : x.valueOpenWp;
  const available = x.qtyOpen.plus(x.qtyIn);
  const rate = div(valueOpen.plus(x.valueIn), available);
  const qtyDiff = available.minus(x.qtySold).minus(x.qtyTransfer).minus(x.qtyClose);
  const cogsSold = x.qtySold.times(rate);
  const cogsQtyDiff = qtyDiff.times(rate);
  const cogsKw2 = x.qtyKw2Sold.times(x.kw2Nrv);
  const cogs = cogsSold.plus(x.cogsWaste).plus(cogsQtyDiff).plus(cogsKw2);
  const margin = x.revenue.minus(cogs);
  const a = x.accurate;
  return {
    month: x.month, line: x.line, product_or_sku: x.key, item_code: x.itemCode, unit: x.unit,
    qty_open: x.qtyOpen, value_open: valueOpen, value_open_residual: x.valueOpenWp.minus(valueOpen), qty_in: x.qtyIn, value_in: x.valueIn,
    avg_rate: rate, qty_sold: x.qtySold, cogs_sold: cogsSold, qty_transfer: x.qtyTransfer, value_transfer: x.qtyTransfer.times(rate),
    qty_close_accurate: x.qtyClose, value_close: x.qtyClose.times(rate), qty_diff: qtyDiff, cogs_qty_diff: cogsQtyDiff, cogs_waste: x.cogsWaste,
    qty_kw2_sold: x.qtyKw2Sold, cogs_kw2_sold: cogsKw2, cogs_total: cogs, revenue: x.revenue, gross_margin: margin, gross_margin_pct: div(margin, x.revenue),
    accurate: {
      qty_open: a?.qtyOpen ?? null, value_open: a?.valueOpen ?? null, qty_in: a?.qtyIn ?? null, value_in: a?.valueIn ?? null,
      qty_out_sale: a?.qtyOutSale ?? null, value_out_sale: a?.valueOutSale ?? null, qty_transfer: a?.qtyOutTransfer ?? null, value_close: a?.valueClose ?? null,
    },
    rule_id: FG_RULE, inputs: x.inputs, source_ref: x.sourceRef, source_refs: x.sourceRefs,
  };
}

/** Rows of the WP template per process product, bagian 3. */
const FG_LAYOUT: Record<ProductCode, { open: number; in: number; rate: number; sold: number; transfer: number | null; close: number; diff: number;
  accClose: number; residual: number; hpp: { sold: number; waste: number; diff: number; kw2: number | null; total: number }; margin: { rev: string; hpp: string; m: string; pct: string } }> = {
  FCC: { open: 86, in: 87, rate: 89, sold: 90, transfer: 91, close: 92, diff: 93, accClose: 94, residual: 95,
    hpp: { sold: 100, waste: 101, diff: 102, kw2: 103, total: 104 }, margin: { rev: "C211", hpp: "B20", m: "B22", pct: "C22" } },
  UU: { open: 84, in: 85, rate: 87, sold: 88, transfer: null, close: 89, diff: 90, accClose: 91, residual: 92,
    hpp: { sold: 95, waste: 96, diff: 97, kw2: null, total: 98 }, margin: { rev: "C207", hpp: "B20", m: "B22", pct: "C22" } },
  UO: { open: 80, in: 81, rate: 83, sold: 84, transfer: null, close: 85, diff: 86, accClose: 87, residual: 88,
    hpp: { sold: 91, waste: 92, diff: 93, kw2: null, total: 94 }, margin: { rev: "C203", hpp: "B18", m: "B20", pct: "C20" } },
};

export interface FgProductInput {
  month: string;
  product: ProductMaster;
  card: ProcessCardMonthRow;
  opening: Opening | null;
  inventory: InventoryItem | null;
  /** Sales by Item lines of the product's sales items (premium) and of its KW 2 items. */
  sales: SalesLine[];
  kw2Sales: SalesLine[];
  /** Premium kg transferred to Lain-lain (Σ Lain-lain input of this product's premium; FCC only). */
  transferKg: Decimal;
  transferInputs: Ref[];
  wpTemplate: "sep26_4" | null;
}

export interface FgProductResult {
  row: FgMonthRow;
  issues: string[];
}

export function fgProduct(x: FgProductInput): FgProductResult {
  const issues: string[] = [];
  const p = x.product;
  if (!x.opening && x.inventory?.qtyOpen && !x.inventory.qtyOpen.isZero()) {
    issues.push(`${p.code}: saldo awal FG ${p.fgItemCode} tanpa nilai WP (saldo awal WP); dinilai 0`);
  }
  if (!x.inventory) issues.push(`${p.code}: Inventory Valuation ${p.fgItemCode ?? "(kode FG kosong)"} tidak ada; saldo akhir = 0`);
  const qtyOpen = x.opening?.qty ?? x.inventory?.qtyOpen ?? ZERO;
  const L = FG_LAYOUT[p.code];
  const s = p.code;
  const wp = x.wpTemplate === "sep26_4";
  const refs: Record<string, string> = wp ? {
    qty_open: `${s}!B${L.open}`, value_open: `${s}!E${L.open}`, value_open_residual: `${s}!E${L.residual}`, qty_in: `${s}!B${L.in}`, value_in: `${s}!E${L.in}`,
    avg_rate: `${s}!D${L.rate}`, qty_sold: `${s}!B${L.sold}`, cogs_sold: `${s}!E${L.sold}`,
    ...(L.transfer ? { qty_transfer: `${s}!B${L.transfer}`, value_transfer: `${s}!E${L.transfer}` } : {}),
    qty_close_accurate: `${s}!B${L.close}`, value_close: `${s}!E${L.close}`, qty_diff: `${s}!B${L.diff}`, cogs_qty_diff: `${s}!E${L.diff}`,
    "accurate.value_close": `${s}!E${L.accClose}`, cogs_waste: `${s}!E${L.hpp.waste}`,
    ...(L.hpp.kw2 ? { qty_kw2_sold: `${s}!B${L.hpp.kw2}`, cogs_kw2_sold: `${s}!E${L.hpp.kw2}` } : {}),
    cogs_total: `${s}!E${L.hpp.total}`, revenue: `${s}!${L.margin.rev}`, gross_margin: `${s}!${L.margin.m} (Rp jt)`, gross_margin_pct: `${s}!${L.margin.pct}`,
  } : {};
  const row = fgRollForward({
    month: x.month, line: p.code, key: p.code, itemCode: p.fgItemCode, unit: "kg",
    qtyOpen, valueOpenWp: x.opening?.value ?? ZERO, excludeValueWithoutQty: true,
    qtyIn: x.card.kg_premium, valueIn: x.card.premium_value,
    qtySold: sum(x.sales.map((l) => l.qty)), qtyTransfer: x.transferKg, qtyClose: x.inventory?.qtyClose ?? ZERO,
    cogsWaste: x.card.waste_value, qtyKw2Sold: sum(x.kw2Sales.map((l) => l.qty)), kw2Nrv: p.kw2NrvPerKg,
    revenue: sum([...x.sales, ...x.kw2Sales].map((l) => l.amount)), accurate: x.inventory,
    inputs: [`mart:process_card_month:${p.code}`, ...(x.opening ? [x.opening.ref] : []), ...(x.inventory ? [x.inventory.ref] : []),
      ...x.sales.map((l) => l.ref), ...x.kw2Sales.map((l) => l.ref), ...x.transferInputs, p.ref],
    sourceRef: wp ? `${s}!E${L.hpp.total}` : null, sourceRefs: refs,
  });
  return { row, issues };
}

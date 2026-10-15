/**
 * Comparisons shown on the FS and Kinerja pages (PRD v2 §7.1, §7.4, §7.5): Δ vs previous month, Δ vs BP, % of revenue,
 * gross margin, the cash bridge and the largest balance-sheet moves. Pure; pages pass the data mart amounts in so no
 * money arithmetic happens in React.
 */
import { D, Decimal, sum, ZERO } from "./decimal";
import { FS_LINE_BY_CODE, FS_LINES, type FsLineDef, type FsStatement } from "./fs-lines";
import type { Lines } from "./fs";

export interface LineCompare {
  def: FsLineDef;
  cur: Decimal | null;
  prev: Decimal | null;
  bp: Decimal | null;
  dPrev: Decimal | null;
  dBp: Decimal | null;
  /** Share of revenue (P&L lines only). */
  pctRevenue: Decimal | null;
}

const diff = (a: Decimal | null, b: Decimal | null) => (a && b ? a.minus(b) : null);

/** Lines from a record of decimal strings (data mart rows). */
export function linesOf(rows: readonly { code: string; amount: string }[]): Lines {
  return new Map(rows.map((r) => [r.code, D(r.amount)]));
}

export function compareStatement(statement: FsStatement, cur: Lines, prev: Lines | null, bp: Lines | null, summaryOnly = false): LineCompare[] {
  const rev = cur.get("pl.revenue") ?? null;
  return FS_LINES.filter((l) => l.statement === statement && (!summaryOnly || l.summary)).map((def) => {
    const c = cur.get(def.code) ?? null;
    const p = prev?.get(def.code) ?? null;
    const b = bp?.get(def.code) ?? null;
    return {
      def, cur: c, prev: p, bp: b, dPrev: diff(c, p), dBp: diff(c, b),
      pctRevenue: statement === "pl" && c && rev && !rev.isZero() ? c.div(rev) : null,
    };
  });
}

export function ratio(a: Decimal | null | undefined, b: Decimal | null | undefined): Decimal | null {
  return a && b && !b.isZero() ? a.div(b) : null;
}

/** Gross margin on GL revenue (pl.gross_profit ÷ pl.revenue). */
export const grossMargin = (l: Lines): Decimal | null => ratio(l.get("pl.gross_profit"), l.get("pl.revenue"));

/** Relative change a/b − 1 (null without base). */
export function relChange(a: Decimal | null | undefined, b: Decimal | null | undefined): Decimal | null {
  return a && b && !b.isZero() ? a.div(b).minus(1) : null;
}

/** `value` positions the bar (running total for start/subtotal/end); `shown` is the number printed next to it. */
export interface BridgeBar { label: string; value: Decimal; kind: "start" | "delta" | "subtotal" | "end"; shown?: Decimal }

/**
 * Cash bridge of a month (PRD §7.5): kas awal → laba → penyusutan → Δ piutang → Δ persediaan → Δ hutang → pos lain
 * → arus kas operasi → investasi → pendanaan → kas akhir. "Pos lain" closes CFO exactly.
 */
export function cashBridge(l: Lines, cf: Lines): BridgeBar[] | null {
  const need = ["cf.open", "cf.cfo", "cf.cfi", "cf.cff", "cf.close"];
  if (!need.every((c) => cf.has(c))) return null;
  const profit = l.get("pl.net_profit") ?? ZERO;
  const parts: [string, Decimal][] = [
    ["Laba bersih", profit],
    ["Penyusutan", cf.get("cf.addback_depreciation") ?? ZERO],
    ["Δ piutang dagang", cf.get("cf.d_trade_receivables") ?? ZERO],
    ["Δ persediaan", cf.get("cf.d_inventories") ?? ZERO],
    ["Δ hutang dagang", cf.get("cf.d_trade_payables") ?? ZERO],
  ];
  const other = cf.get("cf.cfo")!.minus(sum(parts.map(([, v]) => v)));
  return [
    { label: "Kas awal", value: cf.get("cf.open")!, kind: "start" },
    ...parts.map(([label, value]) => ({ label, value, kind: "delta" as const })),
    { label: "Pos operasi lain", value: other, kind: "delta" },
    { label: "Arus kas operasi", value: cf.get("cf.open")!.plus(cf.get("cf.cfo")!), kind: "subtotal", shown: cf.get("cf.cfo")! },
    { label: "Investasi", value: cf.get("cf.cfi")!, kind: "delta" },
    { label: "Pendanaan", value: cf.get("cf.cff")!, kind: "delta" },
    { label: "Kas akhir", value: cf.get("cf.close")!, kind: "end" },
  ];
}

/** Balance sheet leaves with the largest absolute change between two months (PRD §10.2 uji 7.4). */
export function largestMoves(cur: Lines, base: Lines, n = 3): { def: FsLineDef; delta: Decimal }[] {
  return FS_LINES.filter((l) => l.statement === "bs" && l.kind === "leaf")
    .map((def) => ({ def, delta: (cur.get(def.code) ?? ZERO).minus(base.get(def.code) ?? ZERO) }))
    .filter((x) => !x.delta.isZero())
    .sort((a, b) => b.delta.abs().comparedTo(a.delta.abs()))
    .slice(0, n);
}

export const fsLabel = (code: string) => FS_LINE_BY_CODE.get(code)?.label_id ?? code;

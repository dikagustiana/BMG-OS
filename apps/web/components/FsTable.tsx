import type { LineCompare } from "@bmg/engine";
import { jt, pct } from "@/lib/fmt";

type Col = "cur" | "prev" | "dPrev" | "bp" | "dBp" | "pct";

const HEAD: Record<Col, (cur: string, prev: string) => string> = {
  cur: (c) => c, prev: (_, p) => p, dPrev: (_, p) => `Δ vs ${p}`, bp: () => "BP", dBp: () => "Δ vs BP", pct: () => "% pendapatan",
};

/** Statement table (DataTable pattern): labels from fs_line.label_id, totals bold, Rp juta, red only for negatives. */
export function FsTable({ rows, cols, curLabel, prevLabel, unit = "Rp juta" }: { rows: LineCompare[]; cols: readonly Col[]; curLabel: string; prevLabel: string; unit?: string }) {
  const cell = (r: LineCompare, c: Col) => {
    if (c === "pct") return r.pctRevenue ? pct(r.pctRevenue.toFixed(6)) : "";
    const v = r[c];
    return v ? jt(v.toFixed(2)).replace(" jt", "") : "";
  };
  const neg = (r: LineCompare, c: Col) => c !== "pct" && !!r[c]?.isNegative() && !r[c]!.isZero();
  return (
    <div className="tbl-wrap">
      <table className="t">
        <caption>{unit}</caption>
        <thead><tr><th>Pos</th>{cols.map((c) => <th key={c} className={`n${c === "cur" ? " sel" : ""}`}>{HEAD[c](curLabel, prevLabel)}</th>)}</tr></thead>
        <tbody>
          {rows.filter((r) => r.cur || r.prev || r.bp).map((r) => (
            <tr key={r.def.code} className={r.def.kind === "total" ? (r.def.level === 0 ? "total" : "sub") : r.def.level >= 2 ? "l2" : ""}>
              <td>{r.def.label_id}</td>
              {cols.map((c) => <td key={c} className={`n${c === "cur" ? " sel" : ""}${neg(r, c) ? " neg" : ""}`}>{cell(r, c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

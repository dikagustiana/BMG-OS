/**
 * SVG charts (PRD v2 §8.5): ColumnChart (with optional line on a right axis), Waterfall (horizontal, for long
 * labels), HBarChart. No chart library. Values arrive from data marts as numbers for drawing only; geometry is
 * the only arithmetic here.
 */
import type { ReactNode } from "react";

export interface ColumnPoint {
  label: string;
  value: number | null;
  kind?: "actual" | "bp" | "empty";
  selected?: boolean;
  title?: string;
}

const W = 720;

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

export function ColumnChart({
  points, format, height = 220, line, title, showAllValues, width = W,
}: {
  points: ColumnPoint[];
  format: (n: number) => string;
  height?: number;
  line?: { values: (number | null)[]; format: (n: number) => string; label: string };
  title: string;
  showAllValues?: boolean;
  /** viewBox width: smaller for half-width cards so text keeps its size. */
  width?: number;
}) {
  const padL = 8, padR = line ? 56 : 8, padT = 22, padB = 28;
  const vals = points.map((p) => p.value ?? 0);
  const hi = niceMax(Math.max(0, ...vals));
  const lo = Math.min(0, ...vals) < 0 ? -niceMax(-Math.min(0, ...vals)) : 0;
  const ih = height - padT - padB;
  const y = (v: number) => padT + ((hi - v) / (hi - lo)) * ih;
  const n = Math.max(points.length, 1);
  const slot = (width - padL - padR) / n;
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(width / 56))));
  const selIdx = points.findIndex((p) => p.selected);
  const showLabel = (i: number) => i === selIdx || (i % every === 0 && (every === 1 || Math.abs(i - selIdx) > 1));
  const bw = Math.min(44, slot * 0.62);
  const lv = line?.values.filter((v): v is number => v !== null) ?? [];
  const lhi = lv.length ? Math.max(...lv) : 1, llo = lv.length ? Math.min(...lv) : 0;
  const lspan = lhi - llo || Math.abs(lhi) || 1;
  const ly = (v: number) => padT + 6 + ((lhi - v) / lspan) * (ih - 12);
  const showVal = (p: ColumnPoint) => p.value !== null && (showAllValues || p.selected || points.length * 72 <= width);
  return (
    <figure>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <title>{title}</title>
        <line className="axis" x1={padL} x2={width - padR} y1={y(0)} y2={y(0)} />
        {points.map((p, i) => {
          const x = padL + slot * i + (slot - bw) / 2;
          const v = p.value ?? 0;
          const top = Math.min(y(v), y(0));
          const h = Math.max(1, Math.abs(y(v) - y(0)));
          const cls = `bar ${p.kind === "bp" ? "bp" : p.kind === "empty" || p.value === null ? "empty" : ""} ${p.selected ? "sel" : ""}`;
          return (
            <g key={p.label + i}>
              <rect className={cls} x={x} y={p.value === null ? y(0) - 2 : top} width={bw} height={p.value === null ? 2 : h} rx={2}>
                <title>{`${p.title ?? p.label}: ${p.value === null ? "belum ada" : format(v)}`}</title>
              </rect>
              {showVal(p) ? <text className={`val ${p.selected ? "sel" : ""}`} x={x + bw / 2} y={v >= 0 ? top - 6 : top + h + 14} textAnchor="middle">{format(v)}</text> : null}
              {showLabel(i) ? <text className={`lbl ${p.selected ? "sel" : ""}`} x={x + bw / 2} y={height - 8} textAnchor="middle">{p.label}</text> : null}
            </g>
          );
        })}
        {line && lv.length ? (
          <>
            <polyline className="line" points={line.values.map((v, i) => (v === null ? null : `${padL + slot * i + slot / 2},${ly(v)}`)).filter(Boolean).join(" ")} />
            {line.values.map((v, i) => (v === null ? null : (
              <circle key={i} className="pt" cx={padL + slot * i + slot / 2} cy={ly(v)} r={3}><title>{`${line.label} ${points[i]?.label}: ${line.format(v)}`}</title></circle>
            )))}
            <text x={width - padR + 6} y={ly(lhi) + 4}>{line.format(lhi)}</text>
            <text x={width - padR + 6} y={ly(llo) + 4}>{line.format(llo)}</text>
          </>
        ) : null}
      </svg>
    </figure>
  );
}

export type WfGroup = "price" | "volume" | "rate" | "fixed" | "gl" | "timing";
export const WF_GROUP_LABEL: Record<WfGroup, string> = {
  price: "Harga", volume: "Volume & persediaan", rate: "Tarif variabel", fixed: "Biaya tetap", gl: "GL lain", timing: "Waktu pencatatan",
};

export interface WfBar { label: string; value: number; kind: "start" | "end" | "delta" | "subtotal"; group?: WfGroup; detail?: string; shown?: number }

/** Horizontal waterfall: one row per bar, start/end from zero, deltas float from the running total. */
export function Waterfall({ bars, format, title, legend }: { bars: WfBar[]; format: (n: number) => string; title: string; legend?: ReactNode }) {
  const rowH = 26, labelW = 260, valW = 92, padT = 8;
  const H = padT * 2 + rowH * bars.length;
  let run = 0;
  const geo = bars.map((b) => {
    if (b.kind === "start" || b.kind === "end" || b.kind === "subtotal") { run = b.value; return { a: 0, z: b.value }; }
    const a = run; run += b.value; return { a, z: run };
  });
  const xs = geo.flatMap((g) => [g.a, g.z]);
  const lo = Math.min(0, ...xs), hi = Math.max(0, ...xs);
  const span = hi - lo || 1;
  const x0 = labelW, x1 = W - valW;
  const x = (v: number) => x0 + ((v - lo) / span) * (x1 - x0);
  return (
    <figure>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <title>{title}</title>
        <line className="axis" x1={x(0)} x2={x(0)} y1={padT} y2={H - padT} />
        {bars.map((b, i) => {
          const g = geo[i];
          const yy = padT + rowH * i;
          const left = Math.min(x(g.a), x(g.z));
          const w = Math.max(2, Math.abs(x(g.z) - x(g.a)));
          const cls = b.kind === "delta" ? (b.group ? `g-${b.group}` : b.value >= 0 ? "wf-pos" : "wf-neg") : "wf-end";
          return (
            <g key={b.label + i}>
              <text x={labelW - 8} y={yy + rowH / 2 + 4} textAnchor="end" className={b.kind === "delta" ? "" : "lbl sel"}>{b.label}</text>
              <rect className={cls} x={left} y={yy + 5} width={w} height={rowH - 10} rx={2}>
                <title>{`${b.label}: ${format(b.value)}${b.detail ? ` — ${b.detail}` : ""}`}</title>
              </rect>
              {i < bars.length - 1 ? <line className="wf-link" x1={x(g.z)} x2={x(g.z)} y1={yy + rowH - 5} y2={yy + rowH + 5} /> : null}
              <text x={W - 4} y={yy + rowH / 2 + 4} textAnchor="end" className="val">{(b.kind === "delta" || b.shown !== undefined) && (b.shown ?? b.value) > 0 ? "+" : ""}{format(b.shown ?? b.value)}</text>
            </g>
          );
        })}
      </svg>
      {legend}
    </figure>
  );
}

export function WfLegend({ groups }: { groups: WfGroup[] }) {
  return <div className="legend">{groups.map((g) => <span key={g}><i className={`g-${g}`} />{WF_GROUP_LABEL[g]}</span>)}</div>;
}

/** Horizontal bars, items in the given order, value at the end of the bar. */
export function HBarChart({ items, format, title }: { items: { label: string; value: number }[]; format: (n: number) => string; title: string }) {
  const rowH = 24, labelW = 220, valW = 80, padT = 6;
  const H = padT * 2 + rowH * items.length;
  const lo = Math.min(0, ...items.map((i) => i.value)), hi = Math.max(0, ...items.map((i) => i.value));
  const span = hi - lo || 1;
  const x = (v: number) => labelW + ((v - lo) / span) * (W - valW - labelW);
  return (
    <figure>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <title>{title}</title>
        <line className="axis" x1={x(0)} x2={x(0)} y1={padT} y2={H - padT} />
        {items.map((it, i) => {
          const yy = padT + rowH * i;
          return (
            <g key={it.label + i}>
              <text x={labelW - 8} y={yy + rowH / 2 + 4} textAnchor="end">{it.label}</text>
              <rect className={it.value < 0 ? "wf-neg" : "bar"} x={Math.min(x(0), x(it.value))} y={yy + 5} width={Math.max(2, Math.abs(x(it.value) - x(0)))} height={rowH - 10} rx={2} />
              <text x={W - 4} y={yy + rowH / 2 + 4} textAnchor="end" className="val">{format(it.value)}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export function ChartLegend({ items }: { items: { cls: "k-actual" | "k-sel" | "k-bp" | "k-line"; label: string }[] }) {
  return <div className="legend">{items.map((i) => <span key={i.label}><i className={i.cls} />{i.label}</span>)}</div>;
}

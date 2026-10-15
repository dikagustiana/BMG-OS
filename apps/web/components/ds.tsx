/**
 * Design system components (PRD v2 §8.5). Server-safe (no hooks): pages render them with values that come from data
 * marts; nothing here computes money.
 */
import Link from "next/link";
import type { ReactNode } from "react";

// ------------------------------------------------------------------------------------------- page header

export function PageHeader({ title, sub, tools, crumb }: { title: string; sub?: ReactNode; tools?: ReactNode; crumb?: ReactNode }) {
  return (
    <div className="ph">
      <div className="ph-title">
        {crumb ? <div className="crumb">{crumb}</div> : null}
        <h1>{title}</h1>
        {sub ? <div className="ph-sub">{sub}</div> : null}
      </div>
      {tools ? <div className="ph-tools">{tools}</div> : null}
    </div>
  );
}

// ------------------------------------------------------------------------------------------- period chips

export interface ChipItem { label: string; href: string; on?: boolean; dim?: boolean; title?: string }

export function PeriodChips({ items, label }: { items: ChipItem[]; label?: string }) {
  return (
    <nav className="chips" aria-label={label ?? "Periode"}>
      {label ? <span className="lbl">{label}</span> : null}
      {items.map((c) => (
        <Link key={c.href} href={c.href} className={`chip-p${c.on ? " on" : ""}${c.dim ? " dim" : ""}`} aria-current={c.on ? "page" : undefined} title={c.title}>
          {c.label}
        </Link>
      ))}
    </nav>
  );
}

export function Segmented({ items }: { items: { label: string; href: string; on: boolean }[] }) {
  return (
    <span className="seg" role="group">
      {items.map((i) => <Link key={i.href} href={i.href} className={i.on ? "on" : ""} aria-current={i.on ? "true" : undefined}>{i.label}</Link>)}
    </span>
  );
}

// ------------------------------------------------------------------------------------------- status: three axes

export type ControlStatus = "LULUS" | "GAGAL" | "PERIKSA" | "BELUM_DIISI" | "WAJAR" | "CEK";

/** Control status (filled badge). The code (B01, F02) is shown small next to the label by the caller. */
export function StatusBadge({ status }: { status: ControlStatus | string }) {
  const cls = status.replace(/_/g, "-");
  return <span className={`badge ${cls}`}>{status.replace(/_/g, " ")}</span>;
}

export type InputState = "kosong" | "draft" | "terkirim" | "terkunci" | "dikoreksi" | "tersimpan" | "menunggu";
const INPUT_LABEL: Record<InputState, string> = {
  kosong: "Kosong", draft: "Draft", terkirim: "Terkirim", terkunci: "Terkunci", dikoreksi: "Dikoreksi", tersimpan: "Tersimpan", menunggu: "Menunggu",
};

/** Input status (outlined chip): grid rows, days, uploads. */
export function InputStateChip({ state, children }: { state: InputState; children?: ReactNode }) {
  return (
    <span className={`istate ${state}`}>
      {state === "terkunci" ? <LockIcon /> : null}
      {children ?? INPUT_LABEL[state]}
    </span>
  );
}

export type NumberState = "sementara" | "direkonsiliasi" | "final";

/** Number status (text next to a figure): Final carries no label. */
export function NumberStateLabel({ state }: { state: NumberState | null | undefined }) {
  if (!state || state === "final") return null;
  return <span className={`nstate ${state}`}>{state === "sementara" ? "Sementara" : "Direkonsiliasi"}</span>;
}

/** Standard versions: Draft, Berlaku, Digantikan (PRD v2 §6.4). */
export function VersionState({ status }: { status: string }) {
  const label = status === "approved" ? "Berlaku" : status === "superseded" ? "Digantikan" : status === "draft" ? "Draft" : status === "locked" ? "Terkunci" : status;
  return <span className="vstate">{label}</span>;
}

function LockIcon() {
  return (
    <svg className="dot-lock" viewBox="0 0 10 10" aria-hidden="true">
      <rect x="1.5" y="4.5" width="7" height="5" rx="1" fill="currentColor" />
      <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

// ------------------------------------------------------------------------------------------- SourceTrace

export interface TraceItem { k: string; v: string }

/** "Dari mana angka ini": sheet!cell, upload file + row, or rule_id with its inputs (PRD v2 §8.5). */
export function SourceTrace({ items, label = "Sumber angka" }: { items: TraceItem[]; label?: string }) {
  if (!items.length) return null;
  return (
    <details className="trace">
      <summary aria-label={label} title={label}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <rect x="6.3" y="6" width="1.4" height="4.2" rx="0.7" fill="currentColor" />
          <circle cx="7" cy="4.1" r="0.85" fill="currentColor" />
        </svg>
      </summary>
      <div className="tr-pop" role="note">
        {items.map((i) => (
          <div className="tr-row" key={i.k + i.v}><span className="tr-k">{i.k}</span><span className="tr-v">{i.v}</span></div>
        ))}
      </div>
    </details>
  );
}

// ------------------------------------------------------------------------------------------- KPI card

export type Tone = "good" | "bad" | "flat";

/** Delta colour by meaning, not sign (Q25): `invert` for costs, where up is bad. */
export function toneOf(change: number | null, invert = false): Tone {
  if (change === null || Math.abs(change) < 0.0005) return "flat";
  const up = change > 0;
  return up !== invert ? "good" : "bad";
}

export interface KpiProps {
  label: string;
  basis?: string;
  value: string | null;
  unit?: string;
  deltas?: { text: string; tone: Tone }[];
  support?: ReactNode;
  trace?: TraceItem[];
  state?: NumberState | null;
  href?: string;
  empty?: string;
}

export function KpiCard(p: KpiProps) {
  const body = (
    <>
      <div className="k-l">
        <span>{p.label}{p.basis ? <span className="k-b"> · {p.basis}</span> : null}</span>
        {p.trace ? <SourceTrace items={p.trace} /> : null}
      </div>
      <div className="k-v">{p.value ?? (p.empty ?? "Belum ada")}{p.value && p.unit ? <span className="u">{p.unit}</span> : null}</div>
      {p.value ? (p.deltas ?? []).map((d) => <div key={d.text} className={`k-d ${d.tone}`}>{d.text}</div>) : null}
      {p.value && p.state && p.state !== "final" ? <div className="k-st"><NumberStateLabel state={p.state} /></div> : null}
      {p.support ? <div className="k-s">{p.support}</div> : null}
    </>
  );
  const cls = `kpi${p.value ? "" : " empty"}`;
  return p.href ? <Link href={p.href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

// ------------------------------------------------------------------------------------------- panels and states

export function Card({ title, extra, children, id }: { title?: ReactNode; extra?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="card" id={id}>
      {title || extra ? <div className="card-h">{title ? <h2>{title}</h2> : <span />}{extra ? <span className="card-x">{extra}</span> : null}</div> : null}
      {children}
    </section>
  );
}

export function NotePanel({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <aside className="note">
      <details open={open}>
        <summary>{title}</summary>
        {children}
      </details>
    </aside>
  );
}

/** Empty state: what is missing, who does what next (PRD v2 §8.6). */
export function EmptyState({ title, children, action, compact }: { title: string; children?: ReactNode; action?: { href: string; label: string } | null; compact?: boolean }) {
  return (
    <div className={`empty${compact ? " compact" : ""}`}>
      <h3>{title}</h3>
      {children ? <div className="muted">{children}</div> : null}
      {action ? <p><Link className="b sec small" href={action.href}>{action.label}</Link></p> : null}
    </div>
  );
}

export interface Gate { title: string; owner: string; status: ReactNode; detail?: ReactNode; done: boolean; href?: string }

export function GateList({ gates }: { gates: Gate[] }) {
  return (
    <ol className="gates">
      {gates.map((g) => (
        <li key={g.title} className={g.done ? "done" : ""}>
          <div>
            <div className="g-t">{g.href ? <Link href={g.href}>{g.title}</Link> : g.title}</div>
            {g.detail ? <div className="g-d">{g.detail}</div> : null}
            <div className="g-d">Pemilik: {g.owner}</div>
          </div>
          <div />
          <div>{g.status}</div>
        </li>
      ))}
    </ol>
  );
}

export function Msg({ kind = "info", children }: { kind?: "ok" | "err" | "info" | "warn"; children: ReactNode }) {
  return <div className={`msg ${kind}`} role={kind === "err" ? "alert" : "status"}>{children}</div>;
}

import { notFound, redirect } from "next/navigation";
import { compareStatement, largestMoves, relChange } from "@bmg/engine";
import { appContext, type PageProps } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { defaultMonth, monthParam } from "@/lib/month";
import { supabaseServer } from "@/lib/supabase";
import { loadFs } from "@/lib/fs-data";
import { linesFor, monthChips, prevMonth, toNum } from "@/lib/report";
import { bulan, jt, jtS, num, pct } from "@/lib/fmt";
import { can } from "@/lib/roles";
import { Shell } from "@/components/Shell";
import { Card, EmptyState, KpiCard, NotePanel, PageHeader, PeriodChips, Segmented, StatusBadge, toneOf } from "@/components/ds";
import { ChartLegend, ColumnChart } from "@/components/charts";
import { FsTable } from "@/components/FsTable";

export const dynamic = "force-dynamic";

type P = PageProps & { params: Promise<{ month: string }> };

/** Neraca & BP (PRD v2 §7.4). */
export default async function NeracaPage({ params, searchParams }: P) {
  const month = monthParam((await params).month);
  if (!month) notFound();
  const sp = await searchParams;
  const ctx = await appContext(month);
  await requirePage("neraca", ctx.viewer);
  const basis = sp.basis === "bp" ? "bp" : "actual";
  const sb = await supabaseServer();
  const base3m = prevMonth(prevMonth(prevMonth(month)));
  const fs = await loadFs(sb, month, prevMonth(month), [base3m]);
  const path = (m: string) => `/m/${m}/neraca${basis === "bp" ? "?basis=bp" : ""}`;

  if (fs.state !== "ok") {
    return (
      <Shell ctx={ctx} active="neraca">
        <PageHeader title="Neraca & BP" />
        <EmptyState title={fs.state === "missing" ? "Modul neraca belum aktif di database" : "Neraca tidak bisa dibaca"}>
          {fs.state === "missing" ? "Tabel neraca belum diterapkan ke database ini. Admin menerapkan pembaruan database, lalu halaman ini terisi setelah BP atau neraca saldo diunggah." : `Coba muat ulang halaman. Pesan: ${fs.message}`}
        </EmptyState>
      </Shell>
    );
  }
  const latest = fs.actualMonths.at(-1);
  if (!fs.actualMonths.includes(month) && basis === "actual" && latest && latest < month && month === defaultMonth()) redirect(path(latest));

  const cur = linesFor(fs, month, basis);
  const prev = linesFor(fs, prevMonth(month), "actual");
  const bp = linesFor(fs, month, "bp");
  const actual = linesFor(fs, month, "actual");
  const preparer = can(ctx.viewer.role, "upload_finance");
  const chips = monthChips(path, basis === "bp" ? fs.bpMonths : fs.actualMonths, month);
  const tools = (
    <Segmented items={[
      { label: "Aktual", href: `/m/${month}/neraca`, on: basis === "actual" },
      { label: "BP v1", href: `/m/${month}/neraca?basis=bp`, on: basis === "bp" },
    ]} />
  );
  const header = (
    <>
      <PageHeader title="Neraca & BP" sub={<>Posisi akhir {bulan(month)}, Rp juta. Aktual Jan–Agu 2026 dari kolom Actual BP v1; mulai Sep-26 dari neraca saldo Accurate. Pembanding BP mulai Sep-26.</>} tools={tools} />
      <div className="chip-row"><PeriodChips items={chips} label="Bulan" /></div>
    </>
  );
  if (!cur) {
    return (
      <Shell ctx={ctx} active="neraca">
        {header}
        <EmptyState title={basis === "actual" ? `Neraca saldo ${bulan(month)} belum diunggah` : `BP tidak punya kolom ${bulan(month)}`}
          action={basis === "actual" && preparer ? { href: `/m/${month}/input`, label: "Buka Input bulanan" } : latest ? { href: `/m/${latest}/neraca`, label: `Lihat ${bulan(latest)}` } : null}>
          {basis === "actual" ? <>Finance mengunggah neraca saldo Accurate bulan ini di Input bulanan. {bp ? "Angka BP bulan ini tersedia di tombol BP v1." : ""}</> : "Pilih bulan Sep-26 s.d. Des-27 untuk angka BP."}
        </EmptyState>
      </Shell>
    );
  }
  const c = (code: string) => cur.get(code) ?? null;
  const p = (code: string) => prev?.get(code) ?? null;
  const delta = (code: string, invert: boolean) => {
    const dv = c(code) && p(code) ? c(code)!.minus(p(code)!) : null;
    return dv ? [{ text: `${jtS(dv.toFixed(2))} vs ${bulan(prevMonth(month))}`, tone: toneOf(toNum(dv.toFixed(2)), invert) }] : [];
  };
  const vsBp = (code: string, invert: boolean) => {
    if (basis !== "actual" || !bp?.get(code) || !c(code)) return [];
    const r = relChange(c(code), bp.get(code));
    return r ? [{ text: `${pct(r.toFixed(6))} vs BP`, tone: toneOf(r.toNumber(), invert) }] : [];
  };
  const ref = (code: string) => {
    const r = fs.ref(month, basis, code);
    return r ? [{ k: "Sumber", v: r }] : [{ k: "Sumber", v: `Total dihitung engine (fs@1) dari baris di bawahnya` }];
  };
  const checks = fs.checks.filter((x) => x.basis === basis);
  const f = (code: string) => checks.find((x) => x.code === code);
  const series = [...new Set([...fs.actualMonths, ...fs.bpMonths])].sort();
  const pts = series.map((m) => {
    const isA = fs.actualMonths.includes(m);
    return { label: bulan(m), value: toNum(fs.at(m, isA ? "actual" : "bp", "bs.assets")), kind: isA ? "actual" as const : "bp" as const, selected: m === month };
  });
  const cashLine = series.map((m) => toNum(fs.at(m, fs.actualMonths.includes(m) ? "actual" : "bp", "bs.cash")));
  const base3 = linesFor(fs, base3m, "actual");
  const moves = base3 ? largestMoves(cur, base3, 3) : [];
  const stBank = series.filter((m) => fs.actualMonths.includes(m) && (toNum(fs.at(m, "actual", "bs.st_bank_loans")) ?? 0) > 0);
  const rows = compareStatement("bs", cur, basis === "actual" ? prev : null, basis === "actual" ? bp : null);
  return (
    <Shell ctx={ctx} active="neraca">
      {header}
      <div className="row" role="status">
        {["F01", "F02", "F03"].map((code) => f(code) ? (
          <span key={code} className="row"><StatusBadge status={f(code)!.status} /><span className="small">{f(code)!.label}<span className="code">{code}</span>{f(code)!.status !== "LULUS" && f(code)!.value ? ` · selisih Rp ${num(f(code)!.value, 2)}` : ""}</span></span>
        ) : null)}
      </div>
      <div className="kpis">
        <KpiCard label="Kas dan setara kas" value={jt(c("bs.cash")?.toFixed(2))} deltas={[...delta("bs.cash", false), ...vsBp("bs.cash", false)]} trace={ref("bs.cash")} />
        <KpiCard label="Piutang dagang" value={jt(c("bs.trade_receivables")?.toFixed(2))} deltas={[...delta("bs.trade_receivables", true), ...vsBp("bs.trade_receivables", true)]} trace={ref("bs.trade_receivables")} />
        <KpiCard label="Persediaan" value={jt(c("bs.inventories")?.toFixed(2))} deltas={[...delta("bs.inventories", true), ...vsBp("bs.inventories", true)]} trace={ref("bs.inventories")} />
        <KpiCard label="Liabilitas lancar" value={jt(c("bs.current_liabilities")?.toFixed(2))} deltas={delta("bs.current_liabilities", true)} trace={ref("bs.current_liabilities")} />
        <KpiCard label="Ekuitas" value={jt(c("bs.equity")?.toFixed(2))} deltas={delta("bs.equity", false)} trace={ref("bs.equity")} />
        <KpiCard label="Laba tahun berjalan" basis="YTD" value={jt(c("bs.current_profit")?.toFixed(2))} trace={ref("bs.current_profit")} />
      </div>
      <div className="with-side">
        <div>
          <Card title="Total aset dan kas" extra="Jan-26 s.d. Des-27; kolom redup = BP">
            <ColumnChart title="Total aset per bulan dengan garis kas" width={620} points={pts} format={(n) => jt(n, 0)} line={{ values: cashLine, label: "Kas", format: (n) => jt(n, 0) }} />
            <ChartLegend items={[{ cls: "k-actual", label: "Aset aktual" }, { cls: "k-sel", label: bulan(month) }, { cls: "k-bp", label: "Aset BP" }, { cls: "k-line", label: "Kas" }]} />
          </Card>
          <Card title={`Neraca ${bulan(month)}`} extra={basis === "actual" ? (bp ? "Bulan ini · bulan lalu · BP · Δ vs BP" : "Bulan ini · bulan lalu; BP mulai Sep-26") : "Angka BP v1"}>
            <FsTable rows={rows} cols={basis === "actual" ? ["cur", "prev", "dPrev", ...(bp ? ["bp", "dBp"] as const : [])] : ["cur"]} curLabel={bulan(month)} prevLabel={bulan(prevMonth(month))} />
          </Card>
        </div>
        <div>
          <NotePanel title="Catatan">
            <ul>
              {f("F06") ? <li><StatusBadge status={f("F06")!.status} /> Piutang lain-lain pihak berelasi <span className="code">F06</span>: {f("F06")!.note}</li> : null}
              {moves.length ? <li>Pos yang berubah paling besar sejak {bulan(base3m)}: {moves.map((m) => `${m.def.label_id} ${jtS(m.delta.toFixed(2))}`).join("; ")}.</li> : null}
              {stBank.length ? <li>Hutang bank jangka pendek tercatat di {stBank.map((m) => `${bulan(m)} (${jt(fs.at(m, "actual", "bs.st_bank_loans"))})`).join(", ")}.</li> : null}
              {f("F01") && f("F01")!.status !== "LULUS" ? <li><StatusBadge status={f("F01")!.status} /> Aset − liabilitas − ekuitas = Rp {num(f("F01")!.value, 2)}. Untuk bulan dari BP v1, selisih ini berasal dari BP sendiri (laba BP vs GL).</li> : null}
            </ul>
          </NotePanel>
          <NotePanel title="Cara baca" open={false}>
            <ul>
              <li>Aktual Jan–Agu 2026 diimpor dari kolom Actual sheet BMG Business Plan; mulai Sep-26 dari neraca saldo Accurate lewat mapping akun.</li>
              <li>Kolom BP hanya ada mulai Sep-26 (kolom Jan–Agu di BP adalah aktual).</li>
              <li>Angka belum final sampai bulan dirilis di Tutup bulan.</li>
            </ul>
          </NotePanel>
          {actual && basis === "bp" ? <NotePanel title="Aktual bulan ini"><p className="small">Neraca aktual {bulan(month)} tersedia di tombol Aktual.</p></NotePanel> : null}
        </div>
      </div>
    </Shell>
  );
}


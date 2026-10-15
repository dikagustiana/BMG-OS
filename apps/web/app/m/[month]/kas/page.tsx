import { notFound, redirect } from "next/navigation";
import { cashBridge, D, FS_LINES, type Lines } from "@bmg/engine";
import { appContext, type PageProps } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { defaultMonth, monthParam } from "@/lib/month";
import { supabaseServer } from "@/lib/supabase";
import { loadFs } from "@/lib/fs-data";
import { linesFor, monthChips, prevMonth, toNum } from "@/lib/report";
import { bulan, jt, jtS, num } from "@/lib/fmt";
import { Shell } from "@/components/Shell";
import { Card, EmptyState, KpiCard, NotePanel, PageHeader, PeriodChips, StatusBadge, toneOf } from "@/components/ds";
import { ChartLegend, ColumnChart, Waterfall } from "@/components/charts";

export const dynamic = "force-dynamic";

type P = PageProps & { params: Promise<{ month: string }> };

/** Modal kerja & kas (PRD v2 §7.5). */
export default async function KasPage({ params }: P) {
  const month = monthParam((await params).month);
  if (!month) notFound();
  const ctx = await appContext(month);
  await requirePage("kas", ctx.viewer);
  const sb = await supabaseServer();
  const fs = await loadFs(sb, month, prevMonth(month));
  if (fs.state !== "ok") {
    return (
      <Shell ctx={ctx} active="kas">
        <PageHeader title="Modal kerja & kas" />
        <EmptyState title={fs.state === "missing" ? "Modul neraca belum aktif di database" : "Data kas tidak bisa dibaca"}>
          {fs.state === "missing" ? "Tabel neraca belum diterapkan ke database ini." : `Coba muat ulang. Pesan: ${fs.message}`}
        </EmptyState>
      </Shell>
    );
  }
  const latest = fs.actualMonths.at(-1);
  if (!fs.actualMonths.includes(month) && latest && latest < month && month === defaultMonth()) redirect(`/m/${latest}/kas`);
  const chips = monthChips((m) => `/m/${m}/kas`, fs.actualMonths, month);
  const header = (
    <>
      <PageHeader title="Modal kerja & kas" sub={<>Modal kerja bersih = piutang dagang + persediaan − hutang dagang. Arus kas {bulan(month)} disusun dari dua neraca dan laba rugi (metode tidak langsung, sama dengan BP). Rp juta.</>} />
      <div className="chip-row"><PeriodChips items={chips} label="Bulan" /></div>
    </>
  );
  const nwc = fs.nwc.find((n) => n.month === month && n.basis === "actual");
  const cur = linesFor(fs, month, "actual");
  if (!nwc || !cur) {
    return (
      <Shell ctx={ctx} active="kas">
        {header}
        <EmptyState title={`Neraca ${bulan(month)} belum ada`} action={latest ? { href: `/m/${latest}/kas`, label: `Lihat ${bulan(latest)}` } : null}>
          Modal kerja dan arus kas dihitung setelah neraca saldo bulan ini diunggah di Input bulanan.
        </EmptyState>
      </Shell>
    );
  }
  const prevN = fs.nwc.find((n) => n.month === prevMonth(month) && n.basis === "actual");
  const cf: Lines = new Map(fs.cf.filter((r) => r.basis === "actual").map((r) => [r.line_code, D(r.amount)]));
  const bridge = cashBridge(cur, cf);
  const f02 = fs.checks.find((c) => c.code === "F02" && c.basis === "actual");
  const dNwc = prevN ? D(nwc.nwc).minus(D(prevN.nwc)) : null;
  const days = (v: string | null, label: string, prevV: string | null | undefined) => (
    <KpiCard label={label} value={v ? num(v, 1) : null} unit="hari" empty="—"
      deltas={v && prevV ? [{ text: `${num(D(v).minus(D(prevV)).toFixed(2), 1)} hari vs ${bulan(prevMonth(month))}`, tone: toneOf(Number(v) - Number(prevV), true) }] : []} />
  );
  const nwcMonths = fs.nwc.filter((n) => n.basis === "actual").map((n) => n.month);
  const pts = nwcMonths.map((m) => ({ label: bulan(m), value: toNum(fs.nwc.find((n) => n.month === m && n.basis === "actual")?.nwc), selected: m === month }));
  const cfRows = FS_LINES.filter((l) => l.statement === "cf" && cf.has(l.code));
  return (
    <Shell ctx={ctx} active="kas">
      {header}
      <div className="kpis">
        <KpiCard label="Modal kerja bersih" value={jt(nwc.nwc)} deltas={dNwc ? [{ text: `${jtS(dNwc.toFixed(2))} vs ${bulan(prevMonth(month))}`, tone: "flat" }] : []}
          support="piutang dagang + persediaan − hutang dagang" trace={[{ k: "Piutang", v: jt(nwc.trade_receivables) }, { k: "Persediaan", v: jt(nwc.inventories) }, { k: "Hutang", v: jt(nwc.trade_payables) }]} />
        {days(nwc.dso, "Hari piutang", prevN?.dso)}
        {days(nwc.dio, "Hari persediaan", prevN?.dio)}
        {days(nwc.dpo, "Hari hutang", prevN?.dpo)}
        <KpiCard label="Arus kas operasi" value={cf.get("cf.cfo") ? jt(cf.get("cf.cfo")!.toFixed(2)) : null} empty="Belum ada" />
        <KpiCard label="Kas akhir" value={jt(fs.at(month, "actual", "bs.cash"))} support={f02 ? <><StatusBadge status={f02.status} /> kas arus kas = kas neraca<span className="code">F02</span>{f02.status !== "LULUS" && f02.value ? ` · selisih Rp ${num(f02.value, 2)}` : ""}</> : undefined} />
      </div>
      <div className="with-side">
        <div>
          <Card title="Modal kerja bersih per bulan">
            <ColumnChart title="Modal kerja bersih per bulan" points={pts} format={(n) => jt(n, 0)} />
            <ChartLegend items={[{ cls: "k-actual", label: "Modal kerja bersih" }, { cls: "k-sel", label: bulan(month) }]} />
          </Card>
          <Card title={`Dari kas awal ke kas akhir, ${bulan(month)}`}>
            {bridge ? (
              <Waterfall title={`Jembatan kas ${bulan(month)}`} format={(n) => jt(n, 1)}
                bars={bridge.map((b) => ({ label: b.label, value: Number(b.value.toFixed(2)), kind: b.kind, shown: b.shown ? Number(b.shown.toFixed(2)) : undefined }))} />
            ) : <EmptyState compact title="Arus kas bulan ini belum bisa dihitung">Butuh neraca bulan sebelumnya.</EmptyState>}
          </Card>
          <Card title="Arus kas tidak langsung" extra="Rp juta; struktur baris BP 134–181">
            <div className="tbl-wrap">
              <table className="t">
                <thead><tr><th>Pos</th><th className="n sel">{bulan(month)}</th></tr></thead>
                <tbody>{cfRows.map((l) => {
                  const v = cf.get(l.code)!;
                  return <tr key={l.code} className={l.level === 0 ? "total" : l.level === 2 ? "l2" : ""}><td>{l.label_id}</td><td className={`n sel${v.isNegative() ? " neg" : ""}`}>{jt(v.toFixed(2)).replace(" jt", "")}</td></tr>;
                })}</tbody>
              </table>
            </div>
          </Card>
        </div>
        <div>
          <NotePanel title="Kas 13 minggu">
            <EmptyState compact title="Tersedia setelah modul Outlook">Kas harian per rekening dan proyeksi 13 minggu dihitung dari mutasi bank, forecast jual, rencana beli, payroll, dan jatuh tempo.</EmptyState>
          </NotePanel>
          <NotePanel title="Cara baca">
            <ul>
              <li>Hari piutang = piutang dagang ÷ pendapatan kotor bulan × jumlah hari bulan.</li>
              <li>Hari persediaan dan hari hutang memakai harga pokok penjualan bulan sebagai basis.</li>
              <li>Pos operasi lain menutup selisih antara arus kas operasi dan lima pos di atasnya (pajak, biaya dibayar dimuka, hutang lain, dan sejenisnya).</li>
            </ul>
          </NotePanel>
        </div>
      </div>
    </Shell>
  );
}

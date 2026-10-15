import { notFound, redirect } from "next/navigation";
import { compareStatement, grossMargin, relChange } from "@bmg/engine";
import { appContext, type PageProps } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { defaultMonth, monthParam } from "@/lib/month";
import { supabaseServer } from "@/lib/supabase";
import { loadFs } from "@/lib/fs-data";
import { linesFor, monthChips, prevMonth, toNum } from "@/lib/report";
import { bulan, jt, num, pct, pp } from "@/lib/fmt";
import { can } from "@/lib/roles";
import { Shell } from "@/components/Shell";
import { Card, EmptyState, KpiCard, NotePanel, PageHeader, PeriodChips, toneOf } from "@/components/ds";
import { ChartLegend, ColumnChart } from "@/components/charts";
import { FsTable } from "@/components/FsTable";

export const dynamic = "force-dynamic";

type P = PageProps & { params: Promise<{ month: string }> };

const COSTING = "Tersedia setelah costing bulanan";

/** Kinerja bulan (PRD v2 §7.1). Laba rugi dari neraca/laba rugi bulanan; KPI produksi dan bridge dari modul costing. */
export default async function KinerjaPage({ params }: P) {
  const month = monthParam((await params).month);
  if (!month) notFound();
  const ctx = await appContext(month);
  await requirePage("kinerja", ctx.viewer);
  const sb = await supabaseServer();
  const fs = await loadFs(sb, month, prevMonth(month));
  const preparer = can(ctx.viewer.role, "upload_finance") || ctx.viewer.role === "cost_accounting";
  if (fs.state === "ok" && !fs.actualMonths.includes(month) && fs.actualMonths.length && fs.actualMonths.at(-1)! < month && month === defaultMonth()) {
    redirect(`/m/${fs.actualMonths.at(-1)}/kinerja`);
  }
  const chips = monthChips((m) => `/m/${m}/kinerja`, fs.actualMonths, month, fs.bpMonths.filter((m) => m <= month));
  const cur = fs.state === "ok" ? linesFor(fs, month, "actual") : null;
  const prev = fs.state === "ok" ? linesFor(fs, prevMonth(month), "actual") : null;
  const bp = fs.state === "ok" ? linesFor(fs, month, "bp") : null;
  const gm = cur ? grossMargin(cur) : null;
  const gmPrev = prev ? grossMargin(prev) : null;
  const rev = cur?.get("pl.revenue") ?? null;
  const revBp = bp?.get("pl.revenue") ?? null;
  const revVsBp = relChange(rev, revBp);
  const revVsPrev = relChange(rev, prev?.get("pl.revenue"));
  const months = [...new Set([...fs.actualMonths, ...fs.bpMonths.filter((m) => m <= "2026-12-01")])].sort();
  const revPts = months.map((m) => {
    const a = fs.actualMonths.includes(m);
    return { label: bulan(m), value: toNum(fs.at(m, a ? "actual" : "bp", "pl.revenue")), kind: a ? "actual" as const : "bp" as const, selected: m === month };
  });
  const gmPts = fs.actualMonths.map((m) => {
    const l = linesFor(fs, m, "actual");
    const g = l ? grossMargin(l) : null;
    return { label: bulan(m), value: g ? Number(g.toFixed(6)) * 100 : null, selected: m === month };
  });
  return (
    <Shell ctx={ctx} active="kinerja">
      <PageHeader title="Kinerja bulan" sub={<>{bulan(month)}. Margin, pendapatan, dan laba rugi terhadap bulan lalu dan BP. Angka berstatus Sementara sampai bulan dirilis.</>} />
      <div className="chip-row"><PeriodChips items={chips} label="Bulan" /></div>
      {fs.state === "missing" ? (
        <EmptyState title="Modul laporan belum aktif di database">Tabel laporan belum diterapkan ke database ini. Admin menerapkan pembaruan database lebih dulu.</EmptyState>
      ) : !cur ? (
        <EmptyState title={`${bulan(month)} belum dirilis`} action={preparer ? { href: `/m/${month}/input`, label: "Buka Input bulanan" } : fs.actualMonths.length ? { href: `/m/${fs.actualMonths.at(-1)}/kinerja`, label: `Lihat ${bulan(fs.actualMonths.at(-1)!)}` } : null}>
          {preparer ? "Laba rugi bulan ini muncul setelah neraca saldo Accurate diunggah dan dihitung." : "Bulan ini belum punya angka aktual. Pilih bulan lain di atas."}
          {bp ? ` BP bulan ini: pendapatan ${jt(bp.get("pl.revenue")?.toFixed(2))}.` : ""}
        </EmptyState>
      ) : (
        <>
          <div className="kpis">
            <KpiCard label="Pendapatan" basis="GL" state="sementara" value={jt(rev?.toFixed(2))}
              deltas={[
                ...(revVsBp ? [{ text: `${pct(revVsBp.toFixed(6))} vs BP v1`, tone: toneOf(revVsBp.toNumber()) }] : []),
                ...(revVsPrev ? [{ text: `${pct(revVsPrev.toFixed(6))} vs ${bulan(prevMonth(month))}`, tone: toneOf(revVsPrev.toNumber()) }] : []),
              ]}
              trace={fs.ref(month, "actual", "pl.revenue") ? [{ k: "Sumber", v: fs.ref(month, "actual", "pl.revenue")! }] : undefined} />
            <KpiCard label="Margin kotor" basis="GL" state="sementara" value={gm ? pct(gm.toFixed(6)) : null}
              deltas={gm && gmPrev ? [{ text: `${pp(gm.minus(gmPrev).toFixed(6))} vs ${bulan(prevMonth(month))}`, tone: toneOf(gm.minus(gmPrev).toNumber()) }] : []}
              support={gmPrev ? `${bulan(prevMonth(month))} ${pct(gmPrev.toFixed(6))}` : undefined} />
            <KpiCard label="FCC masuk proses" value={null} empty={COSTING} />
            <KpiCard label="Rendemen premium" value={null} empty={COSTING} />
            <KpiCard label="Biaya produksi FCC" basis="per kg" value={null} empty={COSTING} />
            <KpiCard label="Harga singkong kulit" basis="per kg" value={null} empty={COSTING} />
          </div>
          <div className="with-side">
            <div>
              <div className="grid g2">
                <Card title="Pendapatan per bulan" extra="kolom redup = BP">
                  <ColumnChart title="Pendapatan per bulan" width={380} points={revPts} format={(n) => jt(n, 0)} />
                  <ChartLegend items={[{ cls: "k-actual", label: "Aktual" }, { cls: "k-sel", label: bulan(month) }, { cls: "k-bp", label: "BP v1" }]} />
                </Card>
                <Card title="Margin kotor GL per bulan">
                  <ColumnChart title="Margin kotor GL per bulan" width={380} points={gmPts} format={(n) => `${num(n, 1)}%`} />
                </Card>
              </div>
              <Card title={`Bridge margin ${bulan(prevMonth(month))} → ${bulan(month)}`}>
                <EmptyState compact title="Tersedia setelah modul kinerja dan bridge aktif">Bridge 15 bar (harga, volume dan persediaan, tarif variabel, biaya tetap, GL lain, waktu pencatatan) dihitung dari kartu proses bulan ini dan bulan lalu.</EmptyState>
              </Card>
              <Card title={`Laba rugi ${bulan(month)}`} extra={bp ? "Aktual · % pendapatan · bulan lalu · BP · Δ vs BP" : "BP mulai Sep-26"}>
                <FsTable rows={compareStatement("pl", cur, prev, bp, true)} cols={bp ? ["cur", "pct", "prev", "bp", "dBp"] : ["cur", "pct", "prev", "dPrev"]} curLabel={bulan(month)} prevLabel={bulan(prevMonth(month))} />
              </Card>
            </div>
            <div>
              <NotePanel title="Cara baca">
                <ul>
                  <li>Margin kotor = laba kotor ÷ pendapatan GL bulan itu.</li>
                  <li>Pembanding BP hanya ada mulai Sep-26; Jan–Agu 2026 di BP adalah angka aktual.</li>
                  <li>Status Sementara berlaku sampai Finance merilis bulan di Tutup bulan.</li>
                  <li>Rendemen = premium ÷ masuk proses (definisi WP, tanpa koreksi WIP).</li>
                </ul>
              </NotePanel>
              <NotePanel title="Catatan kewajaran bulan ini">
                <EmptyState compact title="Belum ada">Penjelasan CEK dari Cost Accounting tampil di sini setelah modul kewajaran aktif.</EmptyState>
              </NotePanel>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { addMonths } from "@bmg/engine";
import { appContext, type PageProps } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { monthParam } from "@/lib/month";
import { supabaseServer } from "@/lib/supabase";
import { loadFs } from "@/lib/fs-data";
import { loadInputMonth } from "@/lib/b1";
import { bulan } from "@/lib/fmt";
import { Shell } from "@/components/Shell";
import { Card, EmptyState, PageHeader, PeriodChips, Segmented, StatusBadge } from "@/components/ds";

export const dynamic = "force-dynamic";

type P = PageProps & { params: Promise<{ month: string }> };
type Row = { code: string; label: string; status: string; note: string | null; area: string };

/** Cek & kewajaran (PRD v2 §7.6): how far this month's numbers can be trusted, and what still needs explaining. */
export default async function CekPage({ params, searchParams }: P) {
  const month = monthParam((await params).month);
  if (!month) notFound();
  const sp = await searchParams;
  const ctx = await appContext(month);
  await requirePage("cek", ctx.viewer);
  const onlyOpen = sp.filter === "open";
  const sb = await supabaseServer();
  const preparer = ["admin", "finance", "cost_accounting"].includes(ctx.viewer.role);
  const [fs, input] = await Promise.all([loadFs(sb, month, addMonths(month, -1)), preparer && ctx.flags.b1_ingest ? loadInputMonth(sb, month) : Promise.resolve(null)]);
  const rows: Row[] = [
    ...(input?.controls ?? []).map((c) => ({ code: c.code, label: c.label, status: c.status, note: c.note ?? null, area: "Input" })),
    ...fs.checks.filter((c) => c.basis === "actual").map((c) => ({ code: c.code, label: c.label, status: c.status, note: c.note, area: "Neraca" })),
  ];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const shown = onlyOpen ? rows.filter((r) => r.status !== "LULUS") : rows;
  const months = [-2, -1, 0, 1].map((n) => addMonths(month, n));
  const q = onlyOpen ? "?filter=open" : "";
  return (
    <Shell ctx={ctx} active="cek">
      <PageHeader title="Cek & kewajaran"
        sub={<>{bulan(month)}: {count("LULUS")} LULUS · {count("PERIKSA")} PERIKSA · {count("GAGAL")} GAGAL · {count("BELUM_DIISI")} BELUM DIISI. Rilis bulanan diblok selama ada GAGAL atau CEK tanpa penjelasan.</>}
        tools={<Segmented items={[{ label: "Semua", href: `/m/${month}/cek`, on: !onlyOpen }, { label: "Hanya yang bukan LULUS", href: `/m/${month}/cek?filter=open`, on: onlyOpen }]} />} />
      <div className="chip-row"><PeriodChips items={months.map((m) => ({ label: bulan(m), href: `/m/${m}/cek${q}`, on: m === month }))} label="Bulan" /></div>
      <Card title="Kewajaran FCC Jan–bulan ini" extra="14 KPI dibanding rentang Jan–Agu">
        <EmptyState compact title="Tersedia setelah modul kewajaran aktif">Tren masuk proses, rendemen, KW 2, waste, harga singkong, dan biaya per kg per bulan dengan status DALAM/DI LUAR RENTANG dan catatan WP.</EmptyState>
      </Card>
      <Card title="Perubahan per produk vs bulan lalu" extra="|Δ| > 10% → CEK, wajib dijelaskan sebelum rilis">
        <EmptyState compact title="Tersedia setelah costing bulanan">Cost Accounting mengisi penjelasan setiap CEK langsung di baris ini.</EmptyState>
      </Card>
      <Card title="Kontrol">
        {rows.length === 0 ? (
          <EmptyState compact title={`Belum ada kontrol untuk ${bulan(month)}`} action={preparer ? { href: `/m/${month}/input`, label: "Buka Input bulanan" } : null}>
            Kontrol input muncul setelah GL bulan ini diunggah; cek neraca setelah neraca saldo atau BP diunggah.
          </EmptyState>
        ) : (
          <div className="tbl-wrap">
            <table className="t">
              <thead><tr><th>Kontrol</th><th>Bagian</th><th>Status</th><th>Keterangan</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.code}>
                    <td>{r.label}<span className="code">{r.code}</span></td><td className="muted">{r.area}</td>
                    <td><StatusBadge status={r.status} /></td><td className="small">{r.note ?? ""}</td>
                  </tr>
                ))}
                {shown.length === 0 ? <tr><td colSpan={4} className="muted">Semua kontrol bulan ini LULUS.</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">Kontrol pool, kartu proses, Lain-lain, rekon, dan bridge (B03–B45) bertambah di tabel ini saat modulnya aktif. <Link href={`/m/${month}/neraca`}>Lihat neraca</Link>.</p>
      </Card>
    </Shell>
  );
}

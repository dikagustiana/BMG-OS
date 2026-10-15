import { notFound } from "next/navigation";
import { appContext } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { monthParam } from "@/lib/month";
import { bulan } from "@/lib/fmt";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/ds";
import { ModulePending } from "@/components/Pending";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ month: string }> }) {
  const month = monthParam((await params).month);
  if (!month) notFound();
  const ctx = await appContext(month);
  await requirePage("tutup", ctx.viewer);
  return (
    <Shell ctx={ctx} active="tutup">
      <PageHeader title="Tutup bulan" sub={bulan(month)} />
      <ModulePending title="Tutup bulan belum tersedia" what="Halaman ini berisi gate rilis berurutan: upload tersimpan, costing dijalankan, kontrol LULUS atau ditinjau, CEK dijelaskan, cek neraca LULUS, true-up, lalu Rilis dengan PDF tiga halaman." needs="Gate rilis aktif bersama modul tutup bulan." />
    </Shell>
  );
}

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
  await requirePage("rekon", ctx.viewer);
  return (
    <Shell ctx={ctx} active="rekon">
      <PageHeader title="Rekonsiliasi" sub={bulan(month)} />
      <ModulePending title="Rekonsiliasi belum dihitung untuk bulan ini" what="Halaman ini menjelaskan selisih HPP kartu (manajemen) dan HPP GL (buku) dalam enam pos, persediaan WP vs Accurate, dan K1–K6 per item." needs="Angkanya datang dari modul rekonsiliasi setelah costing bulanan berjalan." />
    </Shell>
  );
}

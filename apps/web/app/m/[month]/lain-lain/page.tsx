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
  await requirePage("lain", ctx.viewer);
  return (
    <Shell ctx={ctx} active="lain">
      <PageHeader title="Lain-lain & SKU" sub={bulan(month)} />
      <ModulePending title="Margin Lain-lain belum dihitung untuk bulan ini" what="Halaman ini menunjukkan margin per kelompok Lain-lain dan per SKU, FCC premium yang diserap, dan kelompok bermargin negatif, dengan label HPP manajemen dan HPP buku." needs="Angkanya datang dari costing bulanan (kartu Lain-lain per SKU) dan Sales by Item." />
    </Shell>
  );
}

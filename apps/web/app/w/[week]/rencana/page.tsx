import { notFound } from "next/navigation";
import { appContext } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { weekParam } from "@/lib/month";
import { minggu } from "@/lib/fmt";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/ds";
import { ModulePending } from "@/components/Pending";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ week: string }> }) {
  const week = weekParam((await params).week);
  if (!week) notFound();
  const ctx = await appContext(undefined, week);
  await requirePage("rencana", ctx.viewer);
  return (
    <Shell ctx={ctx} active="rencana">
      <PageHeader title="Rencana minggu" sub={minggu(week)} />
      <ModulePending title="Rencana minggu belum tersedia" what="Halaman ini berisi forecast jual dari Sales, harga material dari Purchasing, dan rencana produksi per lini dari engine (kg masuk proses, bahan, jam terhadap kapasitas, HPP standar per kg) untuk disetujui PPIC." needs="Rencana dihitung setelah ada versi standar yang Berlaku dan forecast minggu diunggah." />
    </Shell>
  );
}

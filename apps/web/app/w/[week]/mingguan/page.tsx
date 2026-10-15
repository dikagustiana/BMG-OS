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
  await requirePage("mingguan", ctx.viewer);
  return (
    <Shell ctx={ctx} active="mingguan">
      <PageHeader title="Mingguan & outlook" sub={minggu(week)} />
      <ModulePending title="Modul mingguan belum aktif" what="Halaman ini menunjukkan HPP per kg minggu berjalan (Sementara) terhadap standar, varian terbesar dan pemiliknya, serapan biaya tetap, hari yang belum dikunci, dan outlook bulan berjalan terhadap BP." needs="Angka mingguan datang dari grid shift pabrik dan versi standar yang Berlaku." />
    </Shell>
  );
}

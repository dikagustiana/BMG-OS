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
  await requirePage("biaya", ctx.viewer);
  return (
    <Shell ctx={ctx} active="biaya">
      <PageHeader title="Biaya per kg" sub={bulan(month)} />
      <ModulePending title="Biaya per kg belum dihitung untuk bulan ini" what="Halaman ini menunjukkan biaya produksi per kg FCC, UU, dan UO dipecah per komponen (singkong, olein, CNG, material lain, Grup A, Kupas, B, C, D, E), porsi tetap dan variabel, jam menganggur, dan varian terhadap BP." needs="Angkanya datang dari costing bulanan setelah GL, payroll, tag voucher, dan kartu CoGM bulan ini tersimpan dan dihitung." />
    </Shell>
  );
}

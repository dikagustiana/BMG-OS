import { appContext } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/ds";
import { ModulePending } from "@/components/Pending";

export const dynamic = "force-dynamic";

export default async function Page() {
  const ctx = await appContext();
  await requirePage("hari", ctx.viewer);
  return (
    <Shell ctx={ctx} active="hari">
      <PageHeader title="Penyelesaian hari" />
      <ModulePending title="Penyelesaian hari belum tersedia" what="Halaman ini menunjukkan status setiap lini dan shift (Kosong, Draft, Terkirim), tombol Kunci hari untuk Produksi, dan koreksi berpasangan setelah kunci." needs="Dibuka bersama modul grid pabrik." />
    </Shell>
  );
}

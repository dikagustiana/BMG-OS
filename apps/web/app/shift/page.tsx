import { appContext } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/ds";
import { ModulePending } from "@/components/Pending";

export const dynamic = "force-dynamic";

export default async function Page() {
  const ctx = await appContext();
  await requirePage("shift", ctx.viewer);
  return (
    <Shell ctx={ctx} active="shift">
      <PageHeader title="Shift hari ini" />
      <ModulePending title="Grid shift belum tersedia" what="Halaman ini berisi grid per shift untuk Produksi, Gudang, dan Mesin: WIP awal terisi otomatis, neraca material dihitung di baris, dan tombol Kirim hanya aktif bila seimbang." needs="Grid shift dibuka bersama modul grid pabrik." />
    </Shell>
  );
}

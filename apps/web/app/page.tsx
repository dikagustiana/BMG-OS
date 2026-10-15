import { redirect } from "next/navigation";
import { appContext } from "@/lib/page";
import { Shell } from "@/components/Shell";
import { EmptyState, PageHeader } from "@/components/ds";
import { homeFor, hrefFor } from "@/lib/modules";

export const dynamic = "force-dynamic";

/** Each user type lands on its own screen (PRD v2 §2, §7 Navigasi). */
export default async function Home() {
  const ctx = await appContext();
  const home = homeFor(ctx.viewer.role, ctx.flags);
  if (home) redirect(hrefFor(home.href, ctx.month, ctx.week));
  return (
    <Shell ctx={ctx} active="home">
      <PageHeader title="BMG-OS" sub="Costing bulanan, rencana dan varian mingguan, tutup bulan — PT Boga Makmur Gracia." />
      <EmptyState title="Belum ada halaman yang dibuka untuk peran Anda">
        Halaman dibuka bertahap oleh Admin setelah angkanya cocok dengan workpaper costing. Hubungi Admin bila Anda perlu akses lebih awal.
      </EmptyState>
    </Shell>
  );
}

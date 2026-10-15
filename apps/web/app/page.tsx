import Link from "next/link";
import { appContext } from "@/lib/page";
import { Shell } from "@/components/Shell";
import { Card } from "@/components/ui";
import { MODULES, navFor } from "@/lib/modules";

export const dynamic = "force-dynamic";

export default async function Home() {
  const ctx = await appContext();
  const items = navFor(ctx.viewer.role, ctx.flags);
  const on = MODULES.filter((m) => ctx.flags[m.key]);
  const admin = ctx.viewer.role === "admin";
  return (
    <Shell ctx={ctx} active="home">
      <h1>BMG-OS</h1>
      <p className="muted">Costing bulanan, rencana dan varian mingguan, tutup bulan — PT Boga Makmur Gracia.</p>
      {items.length ? (
        <Card title="Halaman">
          <ul>{items.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}</ul>
        </Card>
      ) : (
        <Card>
          <p><b>Belum ada halaman yang dibuka untuk Anda.</b></p>
          <p className="muted">Modul dibuka bertahap setelah angkanya cocok dengan workpaper costing bulanan.{admin ? " Atur di Admin → Modul." : ""}</p>
        </Card>
      )}
      {admin ? (
        <Card title={`Modul aktif: ${on.length} dari ${MODULES.length}`}>
          <p className="muted"><Link href="/admin/modul">Kelola modul</Link></p>
        </Card>
      ) : null}
    </Shell>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { ROLE_LABEL } from "@/lib/roles";
import { navFor } from "@/lib/modules";
import type { AppCtx } from "@/lib/page";

/** App chrome: brand, viewer, module nav (only modules that are on and allowed for the role), admin group. */
export function Shell({ ctx, active, children, banner }: { ctx: AppCtx; active: string; children: ReactNode; banner?: ReactNode }) {
  const { viewer, flags } = ctx;
  const mgmt = viewer.role === "management";
  const items = navFor(viewer.role, flags);
  const admin = viewer.role === "admin";
  const audit = admin || viewer.role === "finance" || viewer.role === "cost_accounting";
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">BMG-OS</Link>
        <span className="who">PT Boga Makmur Gracia</span>
        <span className="spacer" />
        <span className="who">{mgmt ? (viewer.fullName ?? "") : (viewer.fullName ?? viewer.email)} · {ROLE_LABEL[viewer.role]}</span>
        <Link href="/akun" className="who">Akun</Link>
        <form action="/auth/signout" method="post"><button className="b sec small">Keluar</button></form>
      </header>
      {banner}
      <nav className="nav">
        <Link href="/" className={active === "home" ? "on" : ""}>Beranda</Link>
        {items.map((n) => (
          <Link key={n.href} href={n.href} className={active === n.href ? "on" : ""}>{n.label}</Link>
        ))}
        {audit ? (
          <>
            <span className="sep inputs" />
            <span className="grp">Admin</span>
            {admin ? <Link href="/admin/modul" className={`inputs ${active === "admin/modul" ? "on" : ""}`}>Modul</Link> : null}
            {admin ? <Link href="/admin/pengguna" className={`inputs ${active === "admin/pengguna" ? "on" : ""}`}>Pengguna</Link> : null}
            <Link href="/admin/audit" className={`inputs ${active === "admin/audit" ? "on" : ""}`}>Audit</Link>
          </>
        ) : null}
      </nav>
      <main data-role={viewer.role}>{children}</main>
    </>
  );
}

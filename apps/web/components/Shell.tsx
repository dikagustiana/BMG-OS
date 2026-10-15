import Link from "next/link";
import type { ReactNode } from "react";
import { ROLE_LABEL } from "@/lib/roles";
import { GROUP_LABEL, hrefFor, navFor, type NavGroup, type PageDef } from "@/lib/modules";
import { bulan } from "@/lib/fmt";
import type { AppCtx } from "@/lib/page";

/**
 * App chrome (PRD v2 §7 Navigasi): top bar with app, entity, the viewer's full name and role, Akun, Keluar; side menu
 * with only the pages that are on and allowed for the role, grouped, in the order of the viewer's user type.
 */
export function Shell({ ctx, active, children }: { ctx: AppCtx; active: string; children: ReactNode }) {
  const { viewer, flags } = ctx;
  const pages = navFor(viewer.role, flags);
  const groups: { group: NavGroup; pages: PageDef[] }[] = [];
  for (const p of pages) {
    const g = groups.find((x) => x.group === p.group);
    if (g) g.pages.push(p);
    else groups.push({ group: p.group, pages: [p] });
  }
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">BMG-OS</Link>
        <span className="entity">PT Boga Makmur Gracia</span>
        <span className="spacer" />
        <span className="who"><b>{viewer.fullName ?? ROLE_LABEL[viewer.role]}</b>{viewer.fullName ? <span className="role"> · {ROLE_LABEL[viewer.role]}</span> : null}</span>
        <Link href="/akun" className="tb-link">Akun</Link>
        <form action="/auth/signout" method="post"><button type="submit">Keluar</button></form>
      </header>
      <div className="frame">
        <nav className="side" aria-label="Menu">
          {groups.map((g) => (
            <div key={g.group} className="side-g">
              <div className="grp">{GROUP_LABEL[g.group]}</div>
              {g.pages.map((p) => (
                <Link key={p.key} href={hrefFor(p.href, ctx.month, ctx.week)} className={active === p.key ? "on" : ""} aria-current={active === p.key ? "page" : undefined}>
                  {p.label}
                </Link>
              ))}
            </div>
          ))}
          {groups.length ? <div className="period">Bulan kerja {bulan(ctx.month)}</div> : null}
        </nav>
        <main className="content" data-role={viewer.role}>{children}</main>
      </div>
    </>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { appContext, type PageProps } from "@/lib/page";
import { requireModule } from "@/lib/modules-server";
import { supabaseServer } from "@/lib/supabase";
import { kindsFor } from "@/lib/upload";
import { can } from "@/lib/roles";
import { fetchAll } from "@/lib/write";
import { Shell } from "@/components/Shell";
import { Badge, Card, N } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { UploadWizard } from "@/components/UploadWizard";
import { approveVersion } from "./actions";

export const dynamic = "force-dynamic";

type Version = { id: string; code: string; effective_from: string; status: string; approved_by: string | null; approved_at: string | null; note: string | null; created_by: string | null; created_at: string };
type Line = Record<string, unknown> & { std_version_id: string };
const CHILD = [
  { t: "bom_line", label: "BOM", cols: ["product", "material_category", "unit", "qty_per_kg_input", "band_low", "band_high"] },
  { t: "output_mix", label: "Komposisi output", cols: ["product", "premium_pct", "kw2_pct", "waste_pct", "wip_pct"] },
  { t: "routing", label: "Routing", cols: ["product", "dept", "hours_per_ton", "machine_hours_per_ton", "kwh_per_ton"] },
  { t: "rate_card", label: "Tarif", cols: ["pool", "driver", "rate_variable", "rate_fixed", "fixed_amount_month"] },
] as const;
const STATUS: Record<string, string> = { draft: "PERIKSA", approved: "LULUS", superseded: "OFF" };

export default async function StandardsPage({ searchParams }: PageProps) {
  await requireModule("b1_ingest");
  const ctx = await appContext();
  const role = ctx.viewer.role;
  if (!["admin", "finance", "ppic"].includes(role)) redirect("/");
  const sel = (await searchParams).v;
  const sb = await supabaseServer();
  const { data } = await sb.from("std_version").select("id, code, effective_from, status, approved_by, approved_at, note, created_by, created_at").is("deleted_at", null).order("effective_from", { ascending: false });
  const versions = (data ?? []) as Version[];
  const lines = Object.fromEntries(await Promise.all(CHILD.map(async (c) => [c.t, await fetchAll<Line>((f, t) => sb.from(c.t).select(["std_version_id", ...c.cols].join(", ")).is("deleted_at", null).range(f, t) as unknown as PromiseLike<{ data: Line[] | null; error: { message: string } | null }>)] as const))) as Record<string, Line[]>;
  const count = (t: string, id: string) => lines[t].filter((l) => l.std_version_id === id).length;
  const kinds = kindsFor(role).filter((k) => k.kind === "std_master");
  const current = versions.find((v) => v.id === sel) ?? null;
  return (
    <Shell ctx={ctx} active="/standar">
      <h1>Versi standar</h1>
      <p className="muted">BOM, komposisi output, routing, tarif pool, dan kapasitas berlaku per versi. Versi baru selalu draft. Finance/Admin menyetujui (approve); versi yang sudah disetujui tidak bisa diubah, jadi perubahan dibuat sebagai versi baru. Standar v1 (rata-rata aktual, Q6) dibuat di Fase 5a.</p>
      <Card title="Daftar versi">
        <table className="t">
          <thead><tr><th>Kode</th><th>Berlaku mulai</th><th>Status</th><th className="n">BOM</th><th className="n">Mix</th><th className="n">Routing</th><th className="n">Tarif</th><th>Disetujui</th><th>Dibuat</th><th /></tr></thead>
          <tbody>
            {versions.length === 0 ? <tr><td colSpan={10} className="muted">Belum ada versi standar.</td></tr> : null}
            {versions.map((v) => (
              <tr key={v.id}>
                <td><Link href={`/standar?v=${v.id}`}><b>{v.code}</b></Link></td>
                <td>{v.effective_from}</td>
                <td><Badge s={STATUS[v.status] ?? v.status}>{v.status}</Badge></td>
                {CHILD.map((c) => <td key={c.t} className="n">{count(c.t, v.id)}</td>)}
                <td className="muted">{v.approved_by ? `${v.approved_by} · ${String(v.approved_at).slice(0, 10)}` : "—"}</td>
                <td className="muted">{v.created_by ?? ""} · {v.created_at.slice(0, 10)}</td>
                <td>
                  {v.status === "draft" && can(role, "std_approve") ? (
                    <ActionForm action={approveVersion} submit="Approve" confirm={`Setujui versi ${v.code}? Setelah disetujui, versi ini tidak bisa diubah.`}>
                      <input type="hidden" name="id" value={v.id} />
                    </ActionForm>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {current ? (
        <Card title={`Rincian ${current.code} (${current.status})`} extra={<Link href="/standar" className="muted">tutup</Link>}>
          {CHILD.map((c) => {
            const rows = lines[c.t].filter((l) => l.std_version_id === current.id);
            return (
              <div key={c.t}>
                <h3>{c.label}</h3>
                <table className="t compact">
                  <thead><tr>{c.cols.map((k) => <th key={k}>{k}</th>)}</tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan={c.cols.length} className="muted">—</td></tr> : null}
                    {rows.map((r, i) => (
                      <tr key={i}>{c.cols.map((k) => (typeof r[k] === "string" && /^-?\d+(\.\d+)?$/.test(r[k] as string) ? <td key={k} className="n"><N v={r[k] as string} dp={4} /></td> : <td key={k}>{String(r[k] ?? "")}</td>))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </Card>
      ) : null}
      {kinds.length ? (
        <Card title="Upload master standar (versi draft baru)">
          <UploadWizard period="standar" kinds={kinds.map((k) => ({ kind: k.kind, label: k.label, description: k.description, target: k.target, source: k.source }))} />
        </Card>
      ) : null}
    </Shell>
  );
}

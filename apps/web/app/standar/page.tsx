import Link from "next/link";
import { appContext, type PageProps } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { supabaseServer } from "@/lib/supabase";
import { kindsFor } from "@/lib/upload";
import { can } from "@/lib/roles";
import { fetchAll } from "@/lib/write";
import { num, waktu } from "@/lib/fmt";
import { Shell } from "@/components/Shell";
import { Card, EmptyState, PageHeader, VersionState } from "@/components/ds";
import { ActionForm } from "@/components/ActionForm";
import { UploadWizard } from "@/components/UploadWizard";
import { approveVersion } from "./actions";

export const dynamic = "force-dynamic";

type Version = { id: string; code: string; effective_from: string; status: string; approved_by: string | null; approved_at: string | null; note: string | null; created_at: string };
type Line = Record<string, unknown> & { std_version_id: string };
const CHILD = [
  { t: "bom_line", label: "Bahan per kg masuk proses (BOM)", cols: [["product", "Produk"], ["material_category", "Bahan"], ["unit", "Satuan"], ["qty_per_kg_input", "Per kg"], ["band_low", "Pita bawah"], ["band_high", "Pita atas"]] },
  { t: "output_mix", label: "Komposisi output", cols: [["product", "Produk"], ["premium_pct", "Premium"], ["kw2_pct", "KW 2"], ["waste_pct", "Waste"], ["wip_pct", "WIP"]] },
  { t: "routing", label: "Jam per ton", cols: [["product", "Produk"], ["dept", "Departemen"], ["hours_per_ton", "Jam orang"], ["machine_hours_per_ton", "Jam mesin"], ["kwh_per_ton", "kWh"]] },
  { t: "rate_card", label: "Tarif pool", cols: [["pool", "Pool"], ["driver", "Driver"], ["rate_variable", "Variabel"], ["rate_fixed", "Tetap"], ["fixed_amount_month", "Tetap per bulan"]] },
] as const;

/** Versi standar: draft → approved (Berlaku) → superseded (Digantikan); approved versions never change. */
export default async function StandardsPage({ searchParams }: PageProps) {
  const ctx = await appContext();
  await requirePage("standar", ctx.viewer);
  const role = ctx.viewer.role;
  const sel = (await searchParams).v;
  const sb = await supabaseServer();
  const { data } = await sb.from("std_version").select("id, code, effective_from, status, approved_by, approved_at, note, created_at").is("deleted_at", null).order("effective_from", { ascending: false });
  const versions = (data ?? []) as Version[];
  const lines = Object.fromEntries(await Promise.all(CHILD.map(async (c) => [c.t, await fetchAll<Line>((f, t) => sb.from(c.t).select(["std_version_id", ...c.cols.map((x) => x[0])].join(", ")).is("deleted_at", null).range(f, t) as unknown as PromiseLike<{ data: Line[] | null; error: { message: string } | null }>)] as const))) as Record<string, Line[]>;
  const count = (t: string, id: string) => lines[t].filter((l) => l.std_version_id === id).length;
  const kinds = kindsFor(role).filter((k) => k.kind === "std_master");
  const current = versions.find((v) => v.id === sel) ?? null;
  return (
    <Shell ctx={ctx} active="standar">
      <PageHeader title="Versi standar" sub="BOM, komposisi output, jam per ton, tarif pool, dan kapasitas berlaku per versi. Versi baru selalu Draft; Finance atau Admin menyetujuinya menjadi Berlaku. Versi yang Berlaku tidak bisa diubah: perubahan dibuat sebagai versi baru." />
      <Card title="Daftar versi">
        {versions.length === 0 ? <EmptyState compact title="Belum ada versi standar">PPIC mengunggah template master standar di bawah. Versi pertama (rata-rata aktual Agu–Sep) dibuat bersama modul rencana minggu.</EmptyState> : (
          <div className="tbl-wrap">
            <table className="t">
              <thead><tr><th>Kode</th><th>Berlaku mulai</th><th>Status</th><th className="n">BOM</th><th className="n">Komposisi</th><th className="n">Jam</th><th className="n">Tarif</th><th>Disetujui</th><th /></tr></thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id}>
                    <td><Link href={`/standar?v=${v.id}`}><b>{v.code}</b></Link></td>
                    <td>{v.effective_from}</td>
                    <td><VersionState status={v.status} /></td>
                    {CHILD.map((c) => <td key={c.t} className="n">{count(c.t, v.id)}</td>)}
                    <td className="muted">{v.approved_at ? waktu(v.approved_at) : "—"}</td>
                    <td>
                      {v.status === "draft" && can(role, "std_approve") ? (
                        <ActionForm action={approveVersion} submit="Setujui" confirm={`Setujui versi ${v.code}? Setelah disetujui, versi ini tidak bisa diubah.`}>
                          <input type="hidden" name="id" value={v.id} />
                        </ActionForm>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {current ? (
        <Card title={`Rincian ${current.code}`} extra={<Link href="/standar">Tutup</Link>}>
          {CHILD.map((c) => {
            const rows = lines[c.t].filter((l) => l.std_version_id === current.id);
            return (
              <div key={c.t}>
                <h3>{c.label}</h3>
                {rows.length === 0 ? <p className="muted small">Tidak ada baris.</p> : (
                  <div className="tbl-wrap">
                    <table className="t compact">
                      <thead><tr>{c.cols.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
                      <tbody>{rows.map((r, i) => (
                        <tr key={i}>{c.cols.map(([k]) => (typeof r[k] === "string" && /^-?\d+(\.\d+)?$/.test(r[k] as string) ? <td key={k} className="n">{num(r[k] as string, 4)}</td> : <td key={k}>{String(r[k] ?? "")}</td>))}</tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      ) : null}
      {kinds.length ? (
        <Card title="Upload master standar sebagai versi Draft baru">
          <UploadWizard period="standar" periodLabel="versi Draft baru" kinds={kinds.map((k) => ({ kind: k.kind, label: k.label, description: k.description }))} />
        </Card>
      ) : null}
    </Shell>
  );
}

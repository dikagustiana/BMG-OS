import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addMonths, monthLabel } from "@bmg/engine";
import { KINDS, TAG_POOLS, TAGS } from "@bmg/parsers";
import { appContext } from "@/lib/page";
import { requireModule } from "@/lib/modules-server";
import { monthParam } from "@/lib/month";
import { supabaseServer } from "@/lib/supabase";
import { kindsFor } from "@/lib/upload";
import { loadBudgetVersions, loadInputMonth } from "@/lib/b1";
import { can } from "@/lib/roles";
import { Shell } from "@/components/Shell";
import { Badge, Card, N } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { UploadWizard } from "@/components/UploadWizard";
import { BpUpload } from "./BpUpload";
import { addMapping, addTag, confirmMapping, removeTag } from "./actions";

export const dynamic = "force-dynamic";

const KIND_TABLES: Record<string, string[]> = {
  gl_month: ["gl_month"], gl_voucher_tag: ["gl_voucher_tag"], payroll_month: ["payroll_month", "payroll_journal"],
  inventory_valuation: ["inventory_valuation"], sales_by_item: ["sales_by_item"], average_price: ["average_price"],
  cogm_card: ["cogm_card", "cogm_material", "driver_month"], fs_control: ["fs_control"],
};
const fmtTime = (s: string | null) => (s ? new Date(s).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) : "—");
/** "PI1, PI2, PI3, PI4 (GL Sep 2026)" → "PI1, PI2, PI3 +1"; the full list stays in the tooltip. */
const shortVouchers = (v: string) => {
  const parts = v.split(/,\s*/);
  return parts.length > 3 ? `${parts.slice(0, 3).join(", ")} +${parts.length - 3}` : v;
};
const POOL_OPTIONS = ["A", "KUPAS", "B", "C", "D", "E", "MATERIAL", "OPEX_PABRIK", "THR", "BPJS", "PAYROLL_SPLIT", "NONE"];

export default async function InputPage({ params }: { params: Promise<{ month: string }> }) {
  const month = monthParam((await params).month);
  if (!month) notFound();
  await requireModule("b1_ingest");
  const ctx = await appContext(month);
  const role = ctx.viewer.role;
  if (!["admin", "finance", "cost_accounting"].includes(role)) redirect("/");
  const sb = await supabaseServer();
  const [data, versions] = await Promise.all([loadInputMonth(sb, month), loadBudgetVersions(sb)]);
  const kinds = kindsFor(role);
  const monthly = kinds.filter((k) => k.cadence === "month");
  const editTags = can(role, "upload_finance");
  const editMap = can(role, "coa_map");
  const latest = (kind: string) => data.uploads.find((u) => u.kind === kind && u.status === "committed");
  const pending = (kind: string) => data.uploads.filter((u) => u.kind === kind && u.status === "planned").length;
  const label = monthLabel(month);
  return (
    <Shell ctx={ctx} active="/m/[month]/input">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Input bulanan — {label}</h1>
        <span className="row">
          <Link className="b sec small" href={`/m/${addMonths(month, -1)}/input`}>← {monthLabel(addMonths(month, -1))}</Link>
          <Link className="b sec small" href={`/m/${addMonths(month, 1)}/input`}>{monthLabel(addMonths(month, 1))} →</Link>
        </span>
      </div>
      <p className="muted">Sumber bulanan untuk costing: GL, tag voucher, payroll, Inventory Valuation, Sales by Item, Average Price, kartu CoGM, angka kontrol LK. Upload ulang untuk bulan yang sama menimpa baris bulan itu (baris lama yang tidak ada di file dihapus soft).</p>

      <Card title="Kontrol input">
        <table className="t">
          <thead><tr><th>Kode</th><th>Kontrol</th><th className="n">Selisih / jumlah</th><th>Status</th><th>Keterangan</th></tr></thead>
          <tbody>
            {data.controls.map((c) => (
              <tr key={c.code}>
                <td><b>{c.code}</b></td><td>{c.label}</td>
                <td className="n">{c.value === null ? "—" : <N v={c.value} dp={c.code === "B44" ? 0 : 2} />}</td>
                <td><Badge s={c.status}>{c.status.replace("_", " ")}</Badge></td>
                <td className="muted">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Status per jenis upload">
        <table className="t compact">
          <thead><tr><th>Jenis</th><th>Tabel</th><th className="n">Baris tersimpan</th><th>Upload terakhir</th><th>Oleh</th><th className="n">Baru / ubah / hapus</th><th>Menunggu</th></tr></thead>
          <tbody>
            {Object.entries(KIND_TABLES).map(([kind, tables]) => {
              const u = latest(kind);
              const def = KINDS.find((k) => k.kind === kind);
              return (
                <tr key={kind}>
                  <td>{def?.label ?? kind}</td>
                  <td><code>{tables.join(", ")}</code></td>
                  <td className="n">{tables.map((t) => data.counts[t] ?? 0).join(" / ")}</td>
                  <td>{u ? `${fmtTime(u.committed_at ?? u.uploaded_at)} · ${u.file_name}` : <span className="muted">belum ada</span>}</td>
                  <td className="muted">{u?.uploaded_by ?? ""}</td>
                  <td className="n">{u ? `${u.inserted} / ${u.updated} / ${u.deleted}` : ""}</td>
                  <td>{pending(kind) ? <Badge s="PERIKSA">{pending(kind)} pratinjau</Badge> : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {monthly.length ? (
        <Card title={`Upload ${label}`}>
          <UploadWizard period={month} kinds={monthly.map((k) => ({ kind: k.kind, label: k.label, description: k.description, target: k.target, source: k.source }))} />
        </Card>
      ) : null}

      <Card title={`Mapping akun (B44) — ${data.gaps.length ? `${data.gaps.length} akun perlu tindakan` : "lengkap"}`}>
        <p className="muted">Akun berawalan 5, akun 6500-006/007, dan akun bertag perlu mapping pool yang berlaku di bulan ini (coa_pool_map). Upload GL dengan akun tanpa mapping diblok sampai mapping ditambahkan di sini.</p>
        {data.gaps.length === 0 ? <p className="muted">Setiap akun pabrik di GL bulan ini (dan setiap akun bertag) punya mapping aktif yang sudah dikonfirmasi.</p> : (
          <table className="t compact">
            <thead><tr><th>Akun</th><th>Nama (GL)</th><th>Status</th><th>Mapping berlaku</th><th /></tr></thead>
            <tbody>
              {data.gaps.map((g) => (
                <tr key={g.account}>
                  <td><code>{g.account}</code>{g.pending ? <div className="muted">dari upload GL yang menunggu</div> : null}</td><td>{g.name ?? ""}</td>
                  <td><Badge s={g.state === "draft" ? "PERIKSA" : "GAGAL"}>{g.state}</Badge></td>
                  <td className="muted">{g.mapping ? `${g.mapping.pool} sejak ${g.mapping.effective_from}${g.mapping.note ? ` — ${g.mapping.note}` : ""}` : "—"}</td>
                  <td>
                    {editMap && g.mapping ? (
                      <ActionForm action={confirmMapping} submit="Konfirmasi">
                        <input type="hidden" name="month" value={month} /><input type="hidden" name="id" value={g.mapping.id} />
                      </ActionForm>
                    ) : null}
                    {editMap && !g.mapping ? (
                      <ActionForm action={addMapping} submit="Tambah mapping" className="row">
                        <input type="hidden" name="month" value={month} /><input type="hidden" name="account" value={g.account} />
                        <input type="hidden" name="account_name" value={g.name ?? ""} />
                        <select className="in" name="pool" defaultValue="E">{POOL_OPTIONS.map((p) => <option key={p}>{p}</option>)}</select>
                        <label className="muted"><input type="checkbox" name="fixed" value="1" /> tetap</label>
                        <input className="in" name="note" placeholder="catatan" />
                      </ActionForm>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title={`Tag voucher ${label} (BIAYA BERSAMA bagian 8)`}>
        <table className="t compact">
          <thead><tr><th>Voucher</th><th>Akun</th><th className="n">Jumlah</th><th>Tag</th><th>Pool tujuan</th><th>Lini</th><th>Catatan</th><th>Sumber</th>{editTags ? <th /> : null}</tr></thead>
          <tbody>
            {data.tags.length === 0 ? <tr><td colSpan={9} className="muted">Belum ada tag untuk bulan ini.</td></tr> : null}
            {data.tags.map((t) => (
              <tr key={t.id}>
                <td className="muted" title={t.voucher}>{shortVouchers(t.voucher)}</td><td><code>{t.account}</code></td><td className="n"><N v={t.amount} dp={2} /></td>
                <td>{t.tag}</td><td>{t.target_pool}</td><td>{t.target_line ?? ""}</td><td className="muted">{t.note ?? ""}</td><td>{t.source ?? ""}</td>
                {editTags ? (
                  <td><ActionForm action={removeTag} submit="Hapus" danger confirm="Hapus tag ini?"><input type="hidden" name="month" value={month} /><input type="hidden" name="id" value={t.id} /></ActionForm></td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {editTags ? (
          <ActionForm action={addTag} submit="Tambah tag" className="row">
            <input type="hidden" name="month" value={month} />
            <div className="field"><label>Voucher</label><input className="in" name="voucher" required /></div>
            <div className="field"><label>Akun</label><input className="in" name="account" placeholder="6300-037" required /></div>
            <div className="field"><label>Jumlah (Rp; negatif = keluar)</label><input className="in" name="amount" required /></div>
            <div className="field"><label>Tag</label><select className="in" name="tag">{Object.keys(TAGS).map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label>Pool tujuan</label><select className="in" name="target_pool">{Object.keys(TAG_POOLS).map((p) => <option key={p}>{p}</option>)}</select></div>
            <div className="field"><label>Lini (untuk MATERIAL)</label><input className="in" name="target_line" placeholder="FCC" /></div>
            <div className="field"><label>Catatan</label><input className="in" name="note" /></div>
          </ActionForm>
        ) : null}
      </Card>

      {kinds.some((k) => k.kind === "budget_bp") ? (
        <Card title="Business Plan (per versi)">
          <table className="t compact">
            <thead><tr><th>Versi</th><th>Status</th><th>Diimpor</th><th className="n">Baris</th><th>Catatan</th></tr></thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id}><td><b>{v.name}</b></td><td>{v.status}</td><td>{fmtTime(v.imported_at)}</td><td className="n"><N v={v.lines} /></td><td className="muted">{v.note ?? ""}</td></tr>
              ))}
            </tbody>
          </table>
          <BpUpload versions={versions.filter((v) => !v.imported_at).map((v) => v.name)}
            kind={kinds.filter((k) => k.kind === "budget_bp").map((k) => ({ kind: k.kind, label: k.label, description: k.description, target: k.target, source: k.source }))} />
        </Card>
      ) : null}
    </Shell>
  );
}

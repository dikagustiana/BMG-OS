import { notFound } from "next/navigation";
import { addMonths, FS_LINES } from "@bmg/engine";
import { KINDS, TAG_POOLS, TAGS } from "@bmg/parsers";
import { appContext } from "@/lib/page";
import { requirePage } from "@/lib/modules-server";
import { monthParam } from "@/lib/month";
import { supabaseServer } from "@/lib/supabase";
import { kindsFor } from "@/lib/upload";
import { KIND_TABLES, loadBudgetVersions, loadInputMonth, OPTIONAL_KINDS } from "@/lib/b1";
import { can } from "@/lib/roles";
import { bulan, num, waktu } from "@/lib/fmt";
import { Shell } from "@/components/Shell";
import { Card, EmptyState, InputStateChip, PageHeader, PeriodChips, StatusBadge, VersionState } from "@/components/ds";
import { ActionForm } from "@/components/ActionForm";
import { UploadWizard } from "@/components/UploadWizard";
import { BpUpload } from "./BpUpload";
import { addFsMapping, addMapping, addTag, confirmFsMapping, confirmMapping, removeTag } from "./actions";
import { discardPending } from "./pending";

export const dynamic = "force-dynamic";

/** "PI1, PI2, PI3, PI4" → "PI1, PI2, PI3 +1"; the full list stays in the tooltip. */
const shortVouchers = (v: string) => {
  const parts = v.split(/,\s*/);
  return parts.length > 3 ? `${parts.slice(0, 3).join(", ")} +${parts.length - 3}` : v;
};
const POOL_LABEL: Record<string, string> = {
  A: "Grup A (operator)", KUPAS: "Kupas", B: "Grup B (support)", C: "Grup C (listrik)", D: "Grup D (mesin)", E: "Grup E (lain)", MATERIAL: "Material",
  OPEX_PABRIK: "Opex pabrik", THR: "THR", BPJS: "BPJS", PAYROLL_SPLIT: "Upah dipecah per kelompok", NONE: "Bukan biaya pabrik",
};
const FS_LEAVES = FS_LINES.filter((l) => l.kind === "leaf" && l.code !== "bs.current_profit");

/** Input bulanan (PRD v2 §7.12): what is missing, which input control fails, which mapping is missing. */
export default async function InputPage({ params }: { params: Promise<{ month: string }> }) {
  const month = monthParam((await params).month);
  if (!month) notFound();
  const ctx = await appContext(month);
  const { viewer } = ctx;
  await requirePage("input", viewer);
  const sb = await supabaseServer();
  const [data, versions] = await Promise.all([loadInputMonth(sb, month), loadBudgetVersions(sb)]);
  const kinds = kindsFor(viewer.role);
  const monthly = kinds.filter((k) => k.cadence === "month");
  const versionKinds = kinds.filter((k) => k.kind === "budget_bp" || k.kind === "bp_fs");
  const editTags = can(viewer.role, "upload_finance");
  const editMap = can(viewer.role, "coa_map");
  const label = bulan(month);
  const latest = (kind: string) => data.uploads.find((u) => u.kind === kind && u.status === "committed");
  const waiting = (kind: string) => data.uploads.filter((u) => u.kind === kind && u.status === "planned");
  const months = [-3, -2, -1, 0, 1].map((n) => addMonths(month, n));
  const kindLabel = (k: string) => KINDS.find((d) => d.kind === k)?.label ?? "Upload";
  const rowsOf = (k: string) => (KIND_TABLES[k] ?? []).reduce((s, t) => s + (data.counts[t] ?? 0), 0);
  const visibleKinds = Object.keys(KIND_TABLES).filter((k) => monthly.some((m) => m.kind === k) || viewer.role === "admin");
  const required = visibleKinds.filter((k) => !OPTIONAL_KINDS.has(k));
  const stored = required.filter((k) => latest(k)).length;
  const open = data.controls.filter((c) => c.status !== "LULUS").length + data.gaps.length + data.fsGaps.length;
  return (
    <Shell ctx={ctx} active="input">
      <PageHeader title={`Input bulanan ${label}`}
        sub={<>{stored} dari {required.length} jenis data tersimpan; {open ? `${open} hal perlu tindakan di bawah` : "tidak ada kontrol atau mapping yang tertunda"}. Upload ulang untuk bulan yang sama mengganti data bulan itu.</>} />
      <div className="chip-row"><PeriodChips items={months.map((m) => ({ label: bulan(m), href: `/m/${m}/input`, on: m === month }))} label="Bulan" /></div>

      {monthly.length ? (
        <Card title={`Upload ${label}`}>
          <UploadWizard period={month} periodLabel={label} kinds={monthly.map((k) => ({ kind: k.kind, label: k.label, description: k.description }))} />
        </Card>
      ) : null}

      <div className="grid g2">
        <Card title="Status per jenis data">
          <div className="tbl-wrap">
            <table className="t compact">
              <thead><tr><th>Jenis data</th><th>Status</th><th className="n">Baris</th><th>Terakhir</th><th /></tr></thead>
              <tbody>
                {visibleKinds.map((k) => {
                  const u = latest(k);
                  const w = waiting(k);
                  return (
                    <tr key={k}>
                      <td>{kindLabel(k)}{OPTIONAL_KINDS.has(k) ? <span className="muted small"> · opsional</span> : null}</td>
                      <td>{w.length ? <InputStateChip state="menunggu">Menunggu ({w.length})</InputStateChip> : u ? <InputStateChip state="tersimpan" /> : <InputStateChip state="kosong" />}</td>
                      <td className="n">{rowsOf(k) ? num(rowsOf(k)) : ""}</td>
                      <td className="muted small">{u ? `${waktu(u.committed_at ?? u.uploaded_at)}${u.uploaded_by_name ? ` · ${u.uploaded_by_name}` : ""}` : "belum ada"}</td>
                      <td>{w.length ? (
                        <ActionForm action={discardPending} submit="Batalkan pratinjau">
                          <input type="hidden" name="month" value={month} />{w.map((x) => <input key={x.id} type="hidden" name="id" value={x.id} />)}
                        </ActionForm>
                      ) : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Kontrol input">
          <table className="t compact">
            <thead><tr><th>Kontrol</th><th>Status</th><th>Keterangan</th></tr></thead>
            <tbody>
              {data.controls.map((c) => (
                <tr key={c.code}>
                  <td>{c.label}<span className="code">{c.code}</span></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="muted small">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card title="Mapping akun" extra={data.gaps.length + data.fsGaps.length ? `${data.gaps.length + data.fsGaps.length} akun perlu tindakan` : "lengkap"}>
        <p className="muted small">Akun biaya pabrik (awalan 5, 6500-006/007, akun bertag) perlu pool biaya; setiap akun di neraca saldo perlu baris neraca atau laba rugi. Upload yang punya akun tanpa mapping tertahan sampai mapping ditambahkan di sini.</p>
        {data.gaps.length === 0 && data.fsGaps.length === 0 ? <EmptyState compact title="Semua akun bulan ini ber-mapping aktif" /> : (
          <div className="tbl-wrap">
            <table className="t compact">
              <thead><tr><th>Akun</th><th>Nama</th><th>Untuk</th><th>Status</th><th>Mapping sekarang</th><th /></tr></thead>
              <tbody>
                {data.gaps.map((g) => (
                  <tr key={`p-${g.account}`}>
                    <td>{g.account}{g.pending ? <div className="muted small">dari upload yang menunggu</div> : null}</td><td>{g.name ?? ""}</td><td>Pool biaya</td>
                    <td><StatusBadge status={g.state === "draft" ? "PERIKSA" : "BELUM_DIISI"} /></td>
                    <td className="muted">{g.mapping ? `${POOL_LABEL[g.mapping.pool] ?? g.mapping.pool} sejak ${g.mapping.effective_from}` : "—"}</td>
                    <td>
                      {editMap && g.mapping ? (
                        <ActionForm action={confirmMapping} submit="Konfirmasi"><input type="hidden" name="month" value={month} /><input type="hidden" name="id" value={g.mapping.id} /></ActionForm>
                      ) : null}
                      {editMap && !g.mapping ? (
                        <ActionForm action={addMapping} submit="Tambah" className="row">
                          <input type="hidden" name="month" value={month} /><input type="hidden" name="account" value={g.account} /><input type="hidden" name="account_name" value={g.name ?? ""} />
                          <select className="in" name="pool" defaultValue="E" aria-label="Pool">{Object.entries(POOL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                          <label className="row small"><input type="checkbox" name="fixed" value="1" /> biaya tetap</label>
                        </ActionForm>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {data.fsGaps.map((g) => (
                  <tr key={`f-${g.account}`}>
                    <td>{g.account}{g.pending ? <div className="muted small">dari upload yang menunggu</div> : null}</td><td>{g.name ?? ""}</td><td>Neraca / laba rugi<span className="code">F07</span></td>
                    <td><StatusBadge status={g.state === "draft" ? "PERIKSA" : "BELUM_DIISI"} /></td>
                    <td className="muted">{g.mapping ? FS_LINES.find((l) => l.code === g.mapping!.fs_line_code)?.label_id : "—"}</td>
                    <td>
                      {editMap && g.mapping ? (
                        <ActionForm action={confirmFsMapping} submit="Konfirmasi"><input type="hidden" name="month" value={month} /><input type="hidden" name="id" value={g.mapping.id} /></ActionForm>
                      ) : null}
                      {editMap && !g.mapping ? (
                        <ActionForm action={addFsMapping} submit="Tambah" className="row">
                          <input type="hidden" name="month" value={month} /><input type="hidden" name="account" value={g.account} /><input type="hidden" name="account_name" value={g.name ?? ""} />
                          <select className="in" name="fs_line_code" aria-label="Baris neraca atau laba rugi" defaultValue={/^[4-8]/.test(g.account) ? "pl.other_expense" : "bs.other_receivables_third"}>
                            <optgroup label="Neraca">{FS_LEAVES.filter((l) => l.statement === "bs").map((l) => <option key={l.code} value={l.code}>{l.label_id}</option>)}</optgroup>
                            <optgroup label="Laba rugi">{FS_LEAVES.filter((l) => l.statement === "pl").map((l) => <option key={l.code} value={l.code}>{l.label_id}</option>)}</optgroup>
                          </select>
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

      <Card title={`Tag voucher ${label}`} extra="penyesuaian biaya pabrik (BIAYA BERSAMA bagian 8)">
        {data.tags.length === 0 ? <EmptyState compact title="Belum ada tag untuk bulan ini">Finance mengunggah CSV tag voucher bersama GL, atau menambahkan tag satu per satu di bawah.</EmptyState> : (
          <div className="tbl-wrap">
            <table className="t compact">
              <thead><tr><th>Voucher</th><th>Akun</th><th className="n">Jumlah</th><th>Tag</th><th>Pool tujuan</th><th>Lini</th><th>Catatan</th>{editTags ? <th /> : null}</tr></thead>
              <tbody>
                {data.tags.map((t) => (
                  <tr key={t.id}>
                    <td><details><summary>{shortVouchers(t.voucher)}</summary><span className="small">{t.voucher}</span></details></td>
                    <td>{t.account}</td><td className={`n${Number(t.amount) < 0 ? " neg" : ""}`}>{num(t.amount, 2)}</td>
                    <td>{t.tag}</td><td>{POOL_LABEL[t.target_pool] ?? t.target_pool}</td><td>{t.target_line ?? ""}</td><td className="muted">{t.note ?? ""}</td>
                    {editTags ? (
                      <td><ActionForm action={removeTag} submit="Hapus" danger confirm="Hapus tag ini?"><input type="hidden" name="month" value={month} /><input type="hidden" name="id" value={t.id} /></ActionForm></td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {editTags ? (
          <details>
            <summary className="small">Tambah tag satu per satu</summary>
            <ActionForm action={addTag} submit="Tambah tag" className="row">
              <input type="hidden" name="month" value={month} />
              <div className="field"><label htmlFor="t-v">Voucher</label><input id="t-v" className="in" name="voucher" required /></div>
              <div className="field"><label htmlFor="t-a">Akun</label><input id="t-a" className="in" name="account" placeholder="6300-037" required /></div>
              <div className="field"><label htmlFor="t-j">Jumlah (Rp; negatif = keluar)</label><input id="t-j" className="in n" name="amount" required /></div>
              <div className="field"><label htmlFor="t-t">Tag</label><select id="t-t" className="in" name="tag">{Object.keys(TAGS).map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="field"><label htmlFor="t-p">Pool tujuan</label><select id="t-p" className="in" name="target_pool">{Object.keys(TAG_POOLS).map((p) => <option key={p} value={p}>{POOL_LABEL[p] ?? p}</option>)}</select></div>
              <div className="field"><label htmlFor="t-l">Lini (untuk material)</label><input id="t-l" className="in" name="target_line" placeholder="FCC" /></div>
              <div className="field"><label htmlFor="t-c">Catatan</label><input id="t-c" className="in" name="note" /></div>
            </ActionForm>
          </details>
        ) : null}
      </Card>

      {versionKinds.length ? (
        <Card title="Business Plan per versi" extra="Model Details menjadi budget; sheet BMG Business Plan menjadi neraca, laba rugi, dan riwayat Jan–Agu 2026">
          {versions.length ? (
            <table className="t compact">
              <thead><tr><th>Versi</th><th>Status</th><th>Budget diimpor</th><th className="n">Baris budget</th><th>Neraca BP diimpor</th><th>Catatan</th></tr></thead>
              <tbody>{versions.map((v) => (
                <tr key={v.id}><td><b>{v.name}</b></td><td><VersionState status={v.status} /></td><td>{v.imported_at ? waktu(v.imported_at) : "belum"}</td><td className="n">{num(v.lines)}</td><td>{v.fs_imported_at ? waktu(v.fs_imported_at) : "belum"}</td><td className="muted small">{v.note ?? ""}</td></tr>
              ))}</tbody>
            </table>
          ) : null}
          <BpUpload versions={versions.map((v) => v.name)} kinds={versionKinds.map((k) => ({ kind: k.kind, label: k.label, description: k.description }))} />
        </Card>
      ) : null}
    </Shell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { appContext, type PageProps } from "@/lib/page";
import { Shell } from "@/components/Shell";
import { ActionForm } from "@/components/ActionForm";
import { Card, EmptyState, InputStateChip, Msg, PageHeader, Segmented, StatusBadge, VersionState } from "@/components/ds";
import { supabaseServer } from "@/lib/supabase";
import { MODULES } from "@/lib/modules";
import { ROLE_LABEL, roleHelp, roleLabel } from "@/lib/roles";
import { bulan, waktu } from "@/lib/fmt";
import { readAll } from "@/lib/mart";
import { setModule } from "@/app/admin/modul/actions";
import { saveUser, setPassword, toggleActive } from "@/app/admin/pengguna/actions";
import { recalcFs } from "./actions";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "modul", label: "Modul" },
  { key: "pengguna", label: "Pengguna" },
  { key: "standar", label: "Versi standar" },
  { key: "antrian", label: "Hitung ulang" },
  { key: "bulan", label: "Buka bulan" },
] as const;

/** Pengaturan (PRD v2 §7.14): users and roles, module flags, standard versions, rebuild queue, reopen month. */
export default async function SettingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ctx = await appContext();
  if (ctx.viewer.role !== "admin") redirect("/");
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? "modul";
  const sb = await supabaseServer();
  return (
    <Shell ctx={ctx} active="pengaturan">
      <PageHeader title="Pengaturan" sub="Pengguna dan peran, modul, versi standar, hitung ulang, dan pembukaan bulan." />
      <div className="chip-row"><Segmented items={TABS.map((t) => ({ label: t.label, href: `/pengaturan?tab=${t.key}`, on: t.key === tab }))} /></div>
      {tab === "modul" ? await Modules(ctx.flags, sb) : null}
      {tab === "pengguna" ? await Users(ctx.viewer.email, sb) : null}
      {tab === "standar" ? await Standards(sb) : null}
      {tab === "antrian" ? await Queue(sb) : null}
      {tab === "bulan" ? <Reopen /> : null}
    </Shell>
  );
}

type Sb = Awaited<ReturnType<typeof supabaseServer>>;

async function Modules(flags: Record<string, boolean>, sb: Sb) {
  const { data: settings } = await sb.from("app_setting").select("key, updated_at, updated_by").order("key");
  const meta = new Map((settings ?? []).map((s) => [s.key as string, s]));
  return (
    <>
      <Msg kind="warn">Preview dan production memakai database yang sama. Menyalakan modul membuka halamannya untuk semua peran yang diizinkan, di semua alamat aplikasi.</Msg>
      <Card title="Modul">
        <div className="tbl-wrap">
          <table className="t">
            <thead><tr><th>Modul</th><th>Isi</th><th>Status</th><th>Terakhir diubah</th><th /></tr></thead>
            <tbody>
              {MODULES.map((m) => {
                const on = flags[m.key];
                const s = meta.get(m.key);
                return (
                  <tr key={m.key}>
                    <td title={m.key}><b>{m.label}</b></td>
                    <td className="muted">{m.description}</td>
                    <td><StatusBadge status={on ? "ON" : "OFF"} /></td>
                    <td className="muted">{s?.updated_at ? waktu(String(s.updated_at)) : "—"}</td>
                    <td>
                      <ActionForm action={setModule} submit={on ? "Matikan" : "Nyalakan"} danger={on}
                        confirm={on ? `Matikan ${m.label}? Halamannya hilang untuk semua pengguna.` : undefined}>
                        <input type="hidden" name="key" value={m.key} />
                        <input type="hidden" name="on" value={on ? "0" : "1"} />
                      </ActionForm>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

async function Users(me: string, sb: Sb) {
  const { data } = await sb.from("app_user").select("*").order("role").order("email");
  return (
    <>
      <div className="grid g2">
        <Card title="Tambah atau ubah pengguna">
          <ActionForm action={saveUser} submit="Simpan pengguna" className="stack">
            <div className="field"><label htmlFor="u-email">E-mail login</label><input id="u-email" className="in" name="email" type="email" required /></div>
            <div className="field"><label htmlFor="u-name">Nama lengkap (tampil di aplikasi)</label><input id="u-name" className="in" name="full_name" /></div>
            <div className="field"><label htmlFor="u-role">Peran</label><select id="u-role" className="in" name="role">{Object.entries(ROLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          </ActionForm>
        </Card>
        <Card title="Kata sandi sementara">
          <ActionForm action={setPassword} submit="Atur kata sandi sementara" className="stack">
            <div className="field"><label htmlFor="p-email">E-mail (sudah terdaftar)</label><input id="p-email" className="in" name="email" type="email" required /></div>
            <div className="field"><label htmlFor="p-pass">Kata sandi sementara, minimal 10 karakter</label><input id="p-pass" className="in" name="password" type="password" minLength={10} required autoComplete="new-password" /></div>
          </ActionForm>
          <p className="muted small">Tidak ada e-mail yang dikirim. Pengguna mengganti kata sandi sendiri di menu Akun.</p>
        </Card>
      </div>
      <Card title={`Pengguna (${data?.length ?? 0})`}>
        <div className="tbl-wrap">
          <table className="t">
            <thead><tr><th>Nama</th><th>E-mail login</th><th>Peran</th><th>Boleh mengisi</th><th>Status</th><th /></tr></thead>
            <tbody>
              {(data ?? []).map((u) => (
                <tr key={u.email} className={u.active ? "" : "dim"}>
                  <td>{u.full_name ?? <span className="muted">belum diisi</span>}</td><td>{u.email}</td><td>{roleLabel(u.role)}</td>
                  <td className="muted">{roleHelp(u.role)}</td>
                  <td>{u.active ? "Aktif" : "Nonaktif"}</td>
                  <td>{u.email !== me ? (
                    <form action={toggleActive}><input type="hidden" name="email" value={u.email} /><input type="hidden" name="active" value={u.active ? "0" : "1"} />
                      <button className={`b small ${u.active ? "danger" : "sec"}`}>{u.active ? "Nonaktifkan" : "Aktifkan"}</button></form>
                  ) : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

async function Standards(sb: Sb) {
  const { data } = await sb.from("std_version").select("id, code, status, effective_from, approved_by, approved_at, note").order("effective_from", { ascending: false });
  return (
    <Card title="Versi standar" extra={<Link href="/standar">Buka halaman Versi standar</Link>}>
      {(data ?? []).length === 0 ? (
        <EmptyState compact title="Belum ada versi standar">PPIC mengunggah master standar (BOM, komposisi, routing, tarif, kapasitas) sebagai Draft di halaman Versi standar; Finance atau Admin menyetujuinya.</EmptyState>
      ) : (
        <table className="t">
          <thead><tr><th>Kode</th><th>Status</th><th>Berlaku mulai</th><th>Disetujui</th><th>Catatan</th></tr></thead>
          <tbody>{(data ?? []).map((v) => (
            <tr key={v.id}><td><b>{v.code}</b></td><td><VersionState status={String(v.status)} /></td><td>{String(v.effective_from)}</td><td className="muted">{v.approved_at ? waktu(String(v.approved_at)) : ""}</td><td className="muted">{v.note ?? ""}</td></tr>
          ))}</tbody>
        </table>
      )}
    </Card>
  );
}

async function Queue(sb: Sb) {
  const q = await readAll<{ id: string; kind: string; period: string; reason: string | null; status: string; error: string | null; requested_at: string; finished_at: string | null }>(
    (f, t) => sb.from("rebuild_queue").select("id, kind, period, reason, status, error, requested_at, finished_at").order("requested_at", { ascending: false }).range(f, Math.min(t, 49)),
  );
  const chip = (s: string) => (s === "done" ? <InputStateChip state="tersimpan">Selesai</InputStateChip> : s === "failed" ? <StatusBadge status="GAGAL" /> : <InputStateChip state="menunggu">{s === "running" ? "Berjalan" : "Antri"}</InputStateChip>);
  return (
    <>
      <Card title="Hitung ulang neraca dan arus kas">
        <p className="muted">Menghitung ulang neraca, laba rugi, modal kerja, arus kas, dan cek neraca dari neraca saldo dan BP yang tersimpan. Berjalan otomatis setelah upload; tombol ini untuk mengulang.</p>
        <ActionForm action={recalcFs} submit="Hitung ulang sekarang" />
      </Card>
      <Card title="Riwayat hitung ulang">
        {q.rows.length === 0 ? <EmptyState compact title="Belum ada hitung ulang">Riwayat muncul setelah upload pertama atau setelah tombol di atas ditekan.</EmptyState> : (
          <table className="t compact">
            <thead><tr><th>Diminta</th><th>Isi</th><th>Status</th><th>Selesai</th><th>Pesan</th></tr></thead>
            <tbody>{q.rows.map((r) => (
              <tr key={r.id}><td>{waktu(r.requested_at)}</td><td>{r.reason ?? `${r.kind} ${bulan(r.period)}`}</td><td>{chip(r.status)}</td><td>{r.finished_at ? waktu(r.finished_at) : ""}</td><td className="neg">{r.error ?? ""}</td></tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </>
  );
}

function Reopen() {
  return (
    <Card title="Buka bulan yang sudah dirilis">
      <EmptyState compact title="Belum ada bulan yang dirilis">
        Pembukaan bulan (dengan alasan, tercatat di audit) tersedia setelah modul Tutup bulan berjalan dan bulan pertama dirilis. Sampai itu, upload bulanan bisa diulang kapan saja.
      </EmptyState>
    </Card>
  );
}

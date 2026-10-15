import { redirect } from "next/navigation";
import { appContext } from "@/lib/page";
import { Shell } from "@/components/Shell";
import { Card } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { supabaseServer } from "@/lib/supabase";
import { ROLE_LABEL, roleHelp, roleLabel } from "@/lib/roles";
import { saveUser, setPassword, toggleActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const ctx = await appContext();
  const { viewer } = ctx;
  if (viewer.role !== "admin") redirect("/");
  const sb = await supabaseServer();
  const { data } = await sb.from("app_user").select("*").order("role").order("email");
  return (
    <Shell ctx={ctx} active="admin/pengguna">
      <h1>Pengguna dan peran</h1>
      <p className="muted">Hanya e-mail di daftar ini yang bisa masuk (kata sandi, atau Google Workspace bila diaktifkan). Peran menentukan data yang boleh diisi (PRD §2); semua pengguna aktif bisa membaca.</p>
      <div className="grid2">
        <Card title="Tambah / ubah pengguna">
          <ActionForm action={saveUser} submit="Simpan pengguna" className="row">
            <div className="field"><label>E-mail</label><input className="in" name="email" type="email" required style={{ width: 240 }} /></div>
            <div className="field"><label>Nama</label><input className="in" name="full_name" style={{ width: 180 }} /></div>
            <div className="field"><label>Peran</label><select className="in" name="role">{Object.entries(ROLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          </ActionForm>
        </Card>
        <Card title="Buat login / atur ulang kata sandi">
          <ActionForm action={setPassword} submit="Atur kata sandi sementara" className="row">
            <div className="field"><label>E-mail (harus sudah di daftar)</label><input className="in" name="email" type="email" required style={{ width: 240 }} /></div>
            <div className="field"><label>Kata sandi sementara</label><input className="in" name="password" type="password" minLength={10} required autoComplete="new-password" /></div>
          </ActionForm>
          <p className="muted" style={{ fontSize: 11 }}>Tidak ada e-mail yang dikirim. Pengguna mengganti kata sandi sendiri di menu Akun setelah masuk.</p>
        </Card>
      </div>
      <Card title={`Daftar pengguna (${data?.length ?? 0})`}>
        <table className="t">
          <thead><tr><th>E-mail</th><th>Nama</th><th>Peran</th><th>Hak tulis</th><th>Status</th><th /></tr></thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.email} className={u.active ? "" : "dim"}>
                <td>{u.email}</td><td>{u.full_name}</td><td>{roleLabel(u.role)}</td><td className="muted">{roleHelp(u.role)}</td>
                <td>{u.active ? "aktif" : "nonaktif"}</td>
                <td>{u.email !== viewer.email ? (
                  <form action={toggleActive}><input type="hidden" name="email" value={u.email} /><input type="hidden" name="active" value={u.active ? "0" : "1"} />
                    <button className={`b small ${u.active ? "danger" : "sec"}`}>{u.active ? "Nonaktifkan" : "Aktifkan"}</button></form>
                ) : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}

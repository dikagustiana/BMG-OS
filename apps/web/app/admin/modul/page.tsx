import { redirect } from "next/navigation";
import { appContext } from "@/lib/page";
import { Shell } from "@/components/Shell";
import { Badge, Card } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { supabaseServer } from "@/lib/supabase";
import { MODULES } from "@/lib/modules";
import { queueRebuild, setModule } from "./actions";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const ctx = await appContext();
  if (ctx.viewer.role !== "admin") redirect("/");
  const sb = await supabaseServer();
  const [{ data: settings }, { data: queue }] = await Promise.all([
    sb.from("app_setting").select("key, value, updated_at, updated_by").order("key"),
    sb.from("rebuild_queue").select("id, kind, period, reason, status, error, requested_by, requested_at, finished_at").order("requested_at", { ascending: false }).limit(50),
  ]);
  const meta = new Map((settings ?? []).map((s) => [s.key as string, s]));
  return (
    <Shell ctx={ctx} active="admin/modul">
      <h1>Modul</h1>
      <p className="muted">Setiap modul nonaktif sampai angkanya cocok dengan workpaper dan migrasinya diterapkan. Modul nonaktif: halamannya tidak ada (404) dan aksinya ditolak. Nyalakan untuk Admin dulu, lalu peran lain.</p>
      <Card>
        <table className="t">
          <thead><tr><th>Modul</th><th>Fase</th><th>Isi</th><th>Status</th><th>Terakhir diubah</th><th /></tr></thead>
          <tbody>
            {MODULES.map((m) => {
              const on = ctx.flags[m.key];
              const s = meta.get(m.key);
              return (
                <tr key={m.key}>
                  <td><b>{m.label}</b><br /><code>{m.key}</code></td>
                  <td>{m.phase}</td>
                  <td className="muted">{m.description}</td>
                  <td><Badge s={on ? "ON" : "OFF"}>{on ? "aktif" : "nonaktif"}</Badge></td>
                  <td className="muted">{s?.updated_at ? `${new Date(s.updated_at as string).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}${s.updated_by ? ` · ${s.updated_by}` : ""}` : "—"}</td>
                  <td>
                    <ActionForm action={setModule} submit={on ? "Nonaktifkan" : "Aktifkan"} danger={on}
                      confirm={on ? `Nonaktifkan ${m.label}? Halamannya akan hilang untuk semua pengguna.` : undefined}>
                      <input type="hidden" name="key" value={m.key} />
                      <input type="hidden" name="on" value={on ? "0" : "1"} />
                    </ActionForm>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <Card title="Antrian rebuild">
        <ActionForm action={queueRebuild} submit="Masukkan ke antrian" className="row">
          <div className="field"><label>Jenis</label><select className="in" name="kind"><option value="month">bulan</option><option value="week">minggu</option><option value="day">hari</option></select></div>
          <div className="field"><label>Periode (awal bulan / Senin / tanggal)</label><input className="in" name="period" placeholder="2026-09-01" required /></div>
        </ActionForm>
        <table className="t compact" style={{ marginTop: 8 }}>
          <thead><tr><th>Diminta</th><th>Jenis</th><th>Periode</th><th>Alasan</th><th>Status</th><th>Oleh</th><th>Selesai</th><th>Error</th></tr></thead>
          <tbody>
            {(queue ?? []).length === 0 ? <tr><td colSpan={8} className="muted">Antrian kosong. Rebuild dijalankan mulai Fase 2 (costing bulanan).</td></tr> : null}
            {(queue ?? []).map((q) => (
              <tr key={q.id}>
                <td>{new Date(q.requested_at as string).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</td>
                <td>{q.kind}</td><td>{q.period}</td><td>{q.reason}</td><td>{q.status}</td><td>{q.requested_by}</td>
                <td>{q.finished_at ? new Date(q.finished_at as string).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : ""}</td>
                <td className="neg">{q.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}

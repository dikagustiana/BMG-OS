import { appContext, type PageProps } from "@/lib/page";
import { Shell } from "@/components/Shell";
import { Card, PageHeader } from "@/components/ds";
import { supabaseServer } from "@/lib/supabase";
import { requirePage } from "@/lib/modules-server";
import { restoreRow } from "@/app/admin/audit/actions";
import { RESTORABLE } from "@/lib/restore";
import { TABLE_LABEL } from "@/lib/upload-handlers";
import { waktu } from "@/lib/fmt";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  ...TABLE_LABEL, app_user: "Pengguna", app_setting: "Modul", upload: "Upload", rebuild_queue: "Hitung ulang", product: "Produk",
  others_group: "Kelompok Lain-lain", sku: "SKU", material_item: "Item material", coa_pool_map: "Mapping akun ke pool", payroll_group: "Kelompok payroll",
  assumption: "Asumsi", coa_fs_map: "Mapping akun ke neraca", fs_line: "Baris neraca dan laba rugi",
};
const OPS: Record<string, string> = { INSERT: "Tambah", UPDATE: "Ubah", SOFT_DELETE: "Hapus", RESTORE: "Pulihkan" };

function show(v: unknown): string {
  if (v === null || v === undefined) return "kosong";
  return typeof v === "string" ? v : JSON.stringify(v);
}

/** Audit (PRD v2 §6.5, §7.14): who changed what, when, old → new. Soft deletes can be restored by Admin. */
export default async function AuditPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ctx = await appContext();
  const { viewer } = ctx;
  await requirePage("audit", viewer);
  const sb = await supabaseServer();
  let q = sb.from("audit_log").select("*").order("at", { ascending: false }).limit(300);
  if (sp.table) q = q.eq("table_name", sp.table);
  if (sp.op) q = q.eq("op", sp.op);
  if (sp.actor) q = q.ilike("actor", `%${sp.actor}%`);
  if (sp.from) q = q.gte("at", sp.from);
  if (sp.inserts !== "1" && !sp.op) q = q.neq("op", "INSERT");
  const { data } = await q;
  return (
    <Shell ctx={ctx} active="audit">
      <PageHeader title="Audit" sub="Setiap perubahan pada data input, master, dan hasil hitung tercatat: siapa, kapan, nilai lama dan baru. Hapus selalu bisa dipulihkan Admin." />
      <Card>
        <form className="row" method="get">
          <div className="field"><label htmlFor="a-t">Data</label>
            <select id="a-t" className="in" name="table" defaultValue={sp.table ?? ""}>
              <option value="">Semua</option>
              {Object.entries(LABEL).map(([t, l]) => <option key={t} value={t}>{l}</option>)}
            </select></div>
          <div className="field"><label htmlFor="a-o">Perubahan</label>
            <select id="a-o" className="in" name="op" defaultValue={sp.op ?? ""}>
              <option value="">Ubah, hapus, pulihkan</option>{Object.entries(OPS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select></div>
          <div className="field"><label htmlFor="a-a">Pengguna</label><input id="a-a" className="in" name="actor" defaultValue={sp.actor ?? ""} /></div>
          <div className="field"><label htmlFor="a-f">Sejak tanggal</label><input id="a-f" className="in" name="from" type="date" defaultValue={sp.from ?? ""} /></div>
          <label className="row small"><input type="checkbox" name="inserts" value="1" defaultChecked={sp.inserts === "1"} /> tampilkan baris baru</label>
          <button className="b small">Terapkan</button>
        </form>
      </Card>
      <Card title={`${(data ?? []).length} perubahan terbaru`}>
        <div className="tbl-wrap">
          <table className="t compact">
            <thead><tr><th>Waktu</th><th>Pengguna</th><th>Data</th><th>Perubahan</th><th>Lama → baru</th><th /></tr></thead>
            <tbody>
              {(data ?? []).map((a) => (
                <tr key={a.id}>
                  <td>{waktu(a.at)}</td><td>{a.actor}</td><td title={viewer.role === "admin" ? a.table_name : undefined}>{LABEL[a.table_name] ?? a.table_name}</td><td>{OPS[a.op] ?? a.op}</td>
                  <td>
                    {a.op === "UPDATE" || a.op === "SOFT_DELETE" || a.op === "RESTORE"
                      ? Object.entries((a.changes ?? {}) as Record<string, [unknown, unknown]>).filter(([k]) => !["deleted_by", "updated_at", "updated_by"].includes(k)).map(([k, [o, n]]) => <div key={k}><b>{k}</b>: {show(o)} → {show(n)}</div>)
                      : <span className="muted">baris baru</span>}
                  </td>
                  <td>{viewer.role === "admin" && a.op === "SOFT_DELETE" && RESTORABLE.includes(a.table_name) ? (
                    <form action={restoreRow}><input type="hidden" name="table" value={a.table_name} /><input type="hidden" name="row_id" value={a.row_id ?? ""} /><button className="b sec small">Pulihkan</button></form>
                  ) : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}

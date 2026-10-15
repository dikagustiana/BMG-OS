"use client";
import { useState, useTransition } from "react";
import type { UploadKind } from "@bmg/parsers";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { commit, discard, stage } from "@/app/actions/upload";
import type { StageResult } from "@/lib/upload";
import { storagePrefix } from "@/lib/period";

type Kind = { kind: UploadKind; label: string; description: string };

const nf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 });
const show = (v: unknown) => (v === null || v === undefined ? "—" : typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) ? nf.format(Number(v)) : String(v));

/** Business titles for the sample rows (PRD v2 §7.12: no column or table names on screen). */
const COL: Record<string, string> = {
  account: "Akun", account_name: "Nama akun", txn_date: "Tanggal", voucher: "Voucher", description: "Keterangan", debit: "Debit", credit: "Kredit",
  net: "Net", amount: "Jumlah", tag: "Tag", target_pool: "Pool tujuan", target_line: "Lini", note: "Catatan", payroll_group_code: "Kelompok",
  kind: "Jenis", item_code: "Kode item", item_name: "Nama item", qty: "Kuantitas", value: "Nilai", price: "Harga", unit: "Satuan",
  line: "Lini", row_kind: "Baris kartu", driver: "Driver", key: "Angka", balance_open: "Saldo awal", balance_close: "Saldo akhir",
  fs_line_code: "Baris", source_ref: "Sel sumber", product: "Produk", component: "Komponen", qty_open: "Kuantitas awal", value_open: "Nilai awal",
  qty_in: "Masuk", value_in: "Nilai masuk", qty_out: "Keluar", value_out: "Nilai keluar", qty_close: "Kuantitas akhir", value_close: "Nilai akhir",
};
const HIDE = new Set(["month", "line_key", "upload_id", "budget_version_id", "std_version_id", "driver_code", "bp_row", "bp_label", "source", "estimated"]);

/**
 * Upload: choose kind and file → check (problems first, then the planned changes, sample folded) → save to the period.
 * The save asks for confirmation inline and messages appear next to the action, not below the data.
 */
export function UploadWizard({ period, periodLabel, kinds, long }: { period: string; periodLabel: string; kinds: Kind[]; long?: boolean }) {
  const [kind, setKind] = useState<UploadKind | "">(kinds[0]?.kind ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState<StageResult | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});
  const [asking, setAsking] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();
  const def = kinds.find((k) => k.kind === kind);

  const run = (fn: () => Promise<void>) => start(async () => { setMsg({}); try { await fn(); } catch (e) { setMsg({ error: (e as Error).message }); } });

  const preview = () => run(async () => {
    if (!file || !kind) { setMsg({ error: "Pilih jenis data dan file dulu" }); return; }
    if (file.size > 25 * 1024 * 1024) { setMsg({ error: "File lebih dari 25 MB" }); return; }
    const p = `${storagePrefix(period)}/${crypto.randomUUID()}/${file.name.replace(/[^\w.\- ]+/g, "_")}`;
    const up = await supabaseBrowser().storage.from("uploads").upload(p, file, { contentType: file.type || "application/octet-stream" });
    if (up.error) { setMsg({ error: `File gagal dikirim: ${up.error.message}` }); return; }
    setPath(p);
    const r = await stage({ period, kind, path: p, fileName: file.name });
    if ("error" in r) { setMsg({ error: r.error }); return; }
    setRes(r);
    setMapping(r.parse.mapping ?? {});
  });

  const remap = () => run(async () => {
    if (!path || !file || !res || !kind) return;
    const r = await stage({ period, kind, path, fileName: file.name, mapping, replaces: res.uploadId });
    if ("error" in r) { setMsg({ error: r.error }); return; }
    setRes(r);
  });

  const doCommit = () => run(async () => {
    if (!res) return;
    setAsking(false);
    const r = await commit(res.uploadId);
    setMsg(r);
    if (r.ok) { setRes(null); setFile(null); setPath(null); }
  });

  const cancel = () => run(async () => {
    if (res) await discard(res.uploadId);
    setRes(null); setPath(null); setAsking(false); setMsg({ ok: "Pratinjau dibatalkan; tidak ada data yang berubah" });
  });

  const totals = res?.plan.reduce((a, t) => ({ i: a.i + t.inserts, u: a.u + t.updates, d: a.d + t.deletes }), { i: 0, u: 0, d: 0 });
  const nothing = totals !== undefined && totals.i + totals.u + totals.d === 0;
  const cols = res?.parse.sample.length ? Object.keys(res.parse.sample[0]).filter((k) => !HIDE.has(k)) : [];
  const message = (
    <>
      {msg.ok ? <div className="msg ok" role="status">{msg.ok}</div> : null}
      {msg.error ? <div className="msg err" role="alert">{msg.error}</div> : null}
    </>
  );

  if (!res) {
    return (
      <div className="stack">
        <div className="steps" aria-label="Langkah"><span className="on">1. Pilih jenis dan file</span><span>2. Periksa</span><span>3. Simpan</span></div>
        <div className="row">
          <div className="field">
            <label htmlFor="w-kind">Jenis data</label>
            <select id="w-kind" className="in" value={kind} onChange={(e) => setKind(e.target.value as UploadKind)}>
              {kinds.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="w-file">File (.xlsx, .xls, .csv)</label>
            <input id="w-file" className="in" type="file" accept=".xlsx,.xls,.csv,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="field"><label>&nbsp;</label><button className="b" onClick={preview} disabled={pending || !file || !kind}>{pending ? "Membaca file…" : "Periksa file"}</button></div>
        </div>
        {def ? <p className="muted small">{def.description}</p> : null}
        {message}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="steps" aria-label="Langkah"><span>1. Pilih jenis dan file</span><span className="on">2. Periksa</span><span className={asking ? "on" : ""}>3. Simpan</span></div>
      <div className="row">
        <b>{res.fileName}</b>
        <span className="muted small">{res.parse.rowCount} baris terbaca{res.parse.sheet ? ` dari sheet "${res.parse.sheet}"` : ""}</span>
      </div>
      {res.blockers.length ? (
        <div className="msg err" role="alert"><b>Belum bisa disimpan</b><ul className="alerts">{res.blockers.map((b) => <li key={b}>{b}</li>)}</ul></div>
      ) : null}
      {res.parse.badRows.length ? (
        <div className="msg warn"><b>{res.parse.badRows.length} baris bermasalah, tidak ikut disimpan</b>
          <ul className="alerts">{res.parse.badRows.slice(0, 12).map((b) => <li key={b.rowNo}>Baris {b.rowNo}: {b.issues.join("; ")}</li>)}</ul></div>
      ) : null}
      {res.parse.issues.length ? <ul className="alerts">{res.parse.issues.map((i) => <li key={i}>{i}</li>)}</ul> : null}
      <div className="tbl-wrap">
        <table className="t compact">
          <thead><tr><th>Data</th><th className="n">Baru</th><th className="n">Diubah</th><th className="n">Dihapus</th><th className="n">Sama</th><th>Catatan</th></tr></thead>
          <tbody>
            {res.plan.map((t, i) => (
              <tr key={i}><td>{t.label}</td><td className="n">{nf.format(t.inserts)}</td><td className="n">{nf.format(t.updates)}</td><td className="n">{nf.format(t.deletes)}</td><td className="n">{nf.format(t.unchanged)}</td><td className="muted">{t.notes.join(" · ")}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {asking ? (
        <div className="msg warn row" role="alertdialog" aria-label="Konfirmasi simpan">
          <span>Simpan {totals?.i ?? 0} baris baru, {totals?.u ?? 0} diubah, {totals?.d ?? 0} dihapus ke {periodLabel}?{long ? " Proses besar bisa sampai dua menit; jangan tutup halaman." : ""}</span>
          <button className="b" onClick={doCommit} disabled={pending}>{pending ? "Menyimpan…" : "Ya, simpan"}</button>
          <button className="b sec" onClick={() => setAsking(false)} disabled={pending}>Kembali</button>
        </div>
      ) : (
        <div className="row">
          <button className="b" onClick={() => setAsking(true)} disabled={pending || res.blockers.length > 0 || nothing}>Simpan ke {periodLabel}</button>
          <button className="b sec" onClick={cancel} disabled={pending}>Batalkan</button>
          {nothing ? <span className="muted small">Tidak ada perubahan: isi file sama dengan data tersimpan.</span> : null}
        </div>
      )}
      {message}
      {res.fields.length > 1 ? (
        <details>
          <summary className="small">Atur kolom bila deteksi salah</summary>
          <div className="row">
            {res.fields.map((f) => (
              <div className="field" key={f.field}>
                <label htmlFor={`m-${f.field}`}>{f.label}{f.required ? " (wajib)" : ""}</label>
                <select id={`m-${f.field}`} className="in" value={mapping[f.field] ?? ""} onChange={(e) => setMapping({ ...mapping, [f.field]: e.target.value === "" ? null : Number(e.target.value) })}>
                  <option value="">(tidak ada)</option>
                  {res.parse.columns.map((c, i) => <option key={i} value={i}>{c || `kolom ${i + 1}`}</option>)}
                </select>
              </div>
            ))}
            <div className="field"><label>&nbsp;</label><button className="b sec" onClick={remap} disabled={pending}>Periksa ulang</button></div>
          </div>
        </details>
      ) : null}
      {cols.length ? (
        <details>
          <summary className="small">Contoh 25 baris pertama</summary>
          <div className="tbl-wrap">
            <table className="t compact">
              <thead><tr>{cols.map((k) => <th key={k}>{COL[k] ?? k.replace(/_/g, " ")}</th>)}</tr></thead>
              <tbody>{res.parse.sample.map((r, i) => <tr key={i}>{cols.map((k) => <td key={k}>{show(r[k])}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}

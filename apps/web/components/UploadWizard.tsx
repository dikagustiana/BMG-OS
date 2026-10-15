"use client";
import { useState, useTransition } from "react";
import type { UploadKind } from "@bmg/parsers";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { commit, discard, stage } from "@/app/actions/upload";
import type { StageResult } from "@/lib/upload";

type Kind = { kind: UploadKind; label: string; description: string; target: string; source: string };

const nf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 });
const show = (v: unknown) => (v === null || v === undefined ? "—" : typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) ? nf.format(Number(v)) : String(v));

/** File → pratinjau (deteksi kolom, issues per baris, rencana perubahan) → simpan. Period = month start, Monday or version. */
export function UploadWizard({ period, kinds }: { period: string; kinds: Kind[] }) {
  const [kind, setKind] = useState<UploadKind | "">(kinds[0]?.kind ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState<StageResult | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();
  const def = kinds.find((k) => k.kind === kind);

  const run = (fn: () => Promise<void>) => start(async () => { setMsg({}); try { await fn(); } catch (e) { setMsg({ error: (e as Error).message }); } });

  const preview = () => run(async () => {
    if (!file || !kind) { setMsg({ error: "Pilih jenis dan file dulu" }); return; }
    if (file.size > 25 * 1024 * 1024) { setMsg({ error: "File > 25 MB" }); return; }
    const p = `${period}/${crypto.randomUUID()}/${file.name.replace(/[^\w.\- ]+/g, "_")}`;
    const up = await supabaseBrowser().storage.from("uploads").upload(p, file, { contentType: file.type || "application/octet-stream" });
    if (up.error) { setMsg({ error: `Upload ke storage gagal: ${up.error.message}` }); return; }
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
    if (!window.confirm("Simpan perubahan ini ke database?")) return;
    const r = await commit(res.uploadId);
    setMsg(r);
    if (r.ok) { setRes(null); setFile(null); setPath(null); }
  });

  const cancel = () => run(async () => {
    if (res) await discard(res.uploadId);
    setRes(null); setPath(null); setMsg({ ok: "Pratinjau dibatalkan" });
  });

  const totals = res?.plan.reduce((a, t) => ({ i: a.i + t.inserts, u: a.u + t.updates, d: a.d + t.deletes }), { i: 0, u: 0, d: 0 });

  return (
    <div>
      {!res ? (
        <div className="card">
          <h2>1. Pilih jenis dan file</h2>
          <div className="row">
            <div className="field">
              <label>Jenis data</label>
              <select className="in" value={kind} onChange={(e) => setKind(e.target.value as UploadKind)} style={{ minWidth: 340 }}>
                {kinds.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>File (.xlsx, .xls, .csv)</label>
              <input className="in" type="file" accept=".xlsx,.xls,.csv,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <button className="b" onClick={preview} disabled={pending || !file || !kind}>{pending ? "Membaca…" : "Pratinjau"}</button>
          </div>
          {def ? <p className="muted">{def.description} → <b>{def.target}</b> (sumber: {def.source})</p> : null}
        </div>
      ) : (
        <>
          <div className="card">
            <h2>2. Pratinjau — {res.fileName}</h2>
            <p className="muted">SHA-256 {res.sha.slice(0, 16)}… · sheet &quot;{res.parse.sheet}&quot;, judul kolom baris {res.parse.headerRow}, {res.parse.rowCount} baris terbaca</p>
            {res.parse.issues.length ? <ul className="alerts">{res.parse.issues.map((i) => <li key={i}>{i}</li>)}</ul> : null}
          </div>
          <div className="card">
            <h2>Pemetaan kolom</h2>
            <div className="row" style={{ alignItems: "flex-end" }}>
              {res.fields.map((f) => (
                <div className="field" key={f.field}>
                  <label>{f.label}{f.required ? " *" : ""}</label>
                  <select className="in" value={mapping[f.field] ?? ""} onChange={(e) => setMapping({ ...mapping, [f.field]: e.target.value === "" ? null : Number(e.target.value) })}>
                    <option value="">(tidak ada)</option>
                    {res.parse.columns.map((c, i) => <option key={i} value={i}>{c || `kolom ${i + 1}`}</option>)}
                  </select>
                </div>
              ))}
              <button className="b sec" onClick={remap} disabled={pending}>Pratinjau ulang</button>
            </div>
          </div>
          <div className="card">
            <h2>3. Perubahan yang akan disimpan</h2>
            <table className="t compact">
              <thead><tr><th>Tabel</th><th className="n">Baru</th><th className="n">Diubah</th><th className="n">Dihapus (soft)</th><th className="n">Sama</th><th>Catatan</th></tr></thead>
              <tbody>
                {res.plan.map((t, i) => (
                  <tr key={i}><td>{t.label}</td><td className="n">{t.inserts}</td><td className="n">{t.updates}</td><td className="n">{t.deletes}</td><td className="n">{t.unchanged}</td><td className="muted">{t.notes.join(" · ")}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="b" onClick={doCommit} disabled={pending || (totals !== undefined && totals.i + totals.u + totals.d === 0)}>{pending ? "Menyimpan…" : "Simpan ke database"}</button>
              <button className="b sec" onClick={cancel} disabled={pending}>Batalkan</button>
            </div>
          </div>
          {res.parse.sample.length ? (
            <div className="card scroll">
              <h2>Contoh baris (25 pertama)</h2>
              <table className="t compact">
                <thead><tr>{Object.keys(res.parse.sample[0]).map((k) => <th key={k}>{k}</th>)}</tr></thead>
                <tbody>{res.parse.sample.map((r, i) => <tr key={i}>{Object.keys(res.parse.sample[0]).map((k) => <td key={k}>{show(r[k])}</td>)}</tr>)}</tbody>
              </table>
            </div>
          ) : null}
          {res.parse.badRows.length ? (
            <div className="card">
              <h2 className="warn">Baris bermasalah (tidak disimpan)</h2>
              <ul>{res.parse.badRows.map((b) => <li key={b.rowNo}>Baris {b.rowNo}: {b.issues.join("; ")}</li>)}</ul>
            </div>
          ) : null}
        </>
      )}
      {msg.ok ? <div className="msg ok">{msg.ok}</div> : null}
      {msg.error ? <div className="msg err">{msg.error}</div> : null}
    </div>
  );
}

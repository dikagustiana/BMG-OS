"use client";
import { useState } from "react";
import type { UploadKind } from "@bmg/parsers";
import { UploadWizard } from "@/components/UploadWizard";

type Kind = { kind: UploadKind; label: string; description: string; target: string; source: string };

/** BP import: the period is the budget version name (an existing, not yet imported version, or a new name). */
export function BpUpload({ versions, kind }: { versions: string[]; kind: Kind[] }) {
  const [name, setName] = useState(versions[0] ?? "");
  const [chosen, setChosen] = useState<string | null>(null);
  if (chosen) {
    return (
      <div>
        <p className="muted">Impor ke versi <b>{chosen}</b> · <button className="b sec small" onClick={() => setChosen(null)}>ganti versi</button></p>
        <UploadWizard period={chosen} kinds={kind} />
      </div>
    );
  }
  return (
    <div className="row" style={{ alignItems: "flex-end", marginTop: 8 }}>
      <div className="field">
        <label>Nama versi budget (versi yang sudah diimpor tidak bisa diubah)</label>
        <input className="in" list="bp-versions" value={name} onChange={(e) => setName(e.target.value)} placeholder="BP Okt-26 v1" style={{ minWidth: 280 }} />
        <datalist id="bp-versions">{versions.map((v) => <option key={v} value={v} />)}</datalist>
      </div>
      <button className="b" disabled={!name.trim()} onClick={() => setChosen(name.trim())}>Lanjut</button>
    </div>
  );
}

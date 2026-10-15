"use client";
import { useState } from "react";
import type { UploadKind } from "@bmg/parsers";
import { UploadWizard } from "@/components/UploadWizard";

type Kind = { kind: UploadKind; label: string; description: string };

/** BP import: the period is the budget version name (an existing version or a new name). */
export function BpUpload({ versions, kinds }: { versions: string[]; kinds: Kind[] }) {
  const [name, setName] = useState(versions[0] ?? "");
  const [chosen, setChosen] = useState<string | null>(null);
  if (chosen) {
    return (
      <div className="stack">
        <p className="muted">Versi <b>{chosen}</b> · <button className="b sec small" onClick={() => setChosen(null)}>Ganti versi</button></p>
        <UploadWizard period={chosen} periodLabel={`versi ${chosen}`} kinds={kinds} long />
      </div>
    );
  }
  return (
    <div className="row">
      <div className="field">
        <label htmlFor="bp-v">Nama versi budget</label>
        <input id="bp-v" className="in" list="bp-versions" value={name} onChange={(e) => setName(e.target.value)} placeholder="BP Okt-26 v1" />
        <datalist id="bp-versions">{versions.map((v) => <option key={v} value={v} />)}</datalist>
      </div>
      <div className="field"><label>&nbsp;</label><button className="b sec" disabled={!name.trim()} onClick={() => setChosen(name.trim())}>Pilih versi ini</button></div>
    </div>
  );
}

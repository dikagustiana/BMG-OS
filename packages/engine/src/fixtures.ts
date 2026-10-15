/** Load fixtures (fixtures/<name>/…) for tests and scripts. Node only — not part of the pure engine. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cellKey, type CellIndex, type GoldenTarget, type WpCell } from "./golden";

export function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    dir = resolve(dir, "..");
  }
  return process.cwd();
}

export function fixtureDir(name: string): string {
  const dir = join(repoRoot(), "fixtures", name);
  if (!existsSync(dir)) throw new Error(`Fixture ${name} tidak ada: ${dir}`);
  return dir;
}

export function fixtureFiles(name: string): string[] {
  return readdirSync(fixtureDir(name)).filter((f) => !f.startsWith(".")).sort();
}

export function readFixtureJson<T>(name: string, file: string): T {
  return JSON.parse(readFileSync(join(fixtureDir(name), file), "utf8")) as T;
}

/** RFC 4180 CSV (quoted fields may hold commas, quotes and newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** fixtures/<name>/cells.csv → index by "Sheet!A1". */
export function loadCells(name: string): CellIndex {
  const [head, ...rows] = parseCsv(readFileSync(join(fixtureDir(name), "cells.csv"), "utf8"));
  const col = (k: string) => head.indexOf(k);
  const [is, ic, it, iv, iff] = ["sheet", "cell", "type", "value", "formula"].map(col);
  const out: CellIndex = new Map();
  for (const r of rows) {
    if (r.length < head.length) continue;
    const c: WpCell = { sheet: r[is], cell: r[ic], type: r[it] as WpCell["type"], value: r[iv], formula: r[iff] || null };
    out.set(cellKey(c.sheet, c.cell), c);
  }
  return out;
}

export function loadTargets(name: string, file = "prd_targets.json"): GoldenTarget[] {
  return readFixtureJson<{ targets: GoldenTarget[] }>(name, file).targets;
}

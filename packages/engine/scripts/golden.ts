#!/usr/bin/env tsx
/**
 * pnpm test:golden -- --fixture month-2026-09 [--phase f0]
 * Runs every registered golden suite against the fixture (±Rp 1 per cell unless the target says otherwise) and writes
 * the report to docs/v1/golden-<phase>.md. Exit 1 when any cell fails.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../src/fixtures";
import { numericCellCount, SUITES } from "../src/golden-suites";

const args = process.argv.slice(2).filter((a) => a !== "--");
const opt = (k: string, d: string) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const fixture = opt("fixture", "month-2026-09");
const phase = opt("phase", "f0").toLowerCase();

const lines: string[] = [`# Golden ${phase.toUpperCase()} — fixture \`${fixture}\``, ""];
const nNum = numericCellCount(fixture);
lines.push(`Sel angka di \`cells.csv\`: ${nNum} (DoD Fase 0: ≥ 2.500).`, "");
let failed = 0;
for (const s of SUITES) {
  const res = s.run(fixture);
  const bad = res.filter((r) => !r.ok);
  failed += bad.length;
  lines.push(`## ${s.id} (${s.phase}) — ${res.length - bad.length}/${res.length} lulus`, "", s.description, "");
  lines.push("| ID | Pos | Sel WP | Target | Nilai WP | Selisih | Toleransi | Status |", "| --- | --- | --- | ---: | ---: | ---: | ---: | --- |");
  for (const r of res) {
    const t = r.target;
    lines.push(`| ${t.id} | ${t.label} | ${t.sheet}!${t.cell} | ${t.expected} | ${r.actual ?? "—"} | ${r.diff?.toSignificantDigits(6).toString() ?? "—"} | ${t.tolerance} | ${r.ok ? "LULUS" : `GAGAL${r.reason ? ` (${r.reason})` : ""}`} |`);
  }
  lines.push("");
}
if (nNum < 2500) failed++;
lines.push(failed ? `**${failed} sel gagal** — lihat docs/open-questions.md §B.` : "Semua sel golden lulus.", "");
const out = join(repoRoot(), "docs", "v1", `golden-${phase}.md`);
writeFileSync(out, lines.join("\n"));
console.log(lines.filter((l) => l.startsWith("#") || l.startsWith("Sel") || l.startsWith("**") || l.startsWith("Semua")).join("\n"));
console.log(`report: ${out}`);
process.exitCode = failed ? 1 : 0;

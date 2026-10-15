#!/usr/bin/env tsx
/**
 * pnpm snapshot:diff — canonical snapshot of the engine against the committed baseline (prompt rule 3).
 * The snapshot holds the SHA-256 of every fixture file and the output of every registered engine module on the
 * golden month. New modules add new keys under `modules`; existing keys must stay byte-identical.
 * pnpm snapshot:update rewrites the baseline (only when a phase adds a module key, never to hide a change).
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { canonicalJson, ENGINE_VERSION, sha256 } from "../src";
import { repoRoot } from "../src/fixtures";
import { SNAPSHOT_MODULES } from "../src/snapshot-modules";

const root = repoRoot();
const BASELINE = join(root, "tests", "snapshots", "month-2026-09.json");

function files(dir: string): string[] {
  return readdirSync(dir).sort().flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

const fixtures: Record<string, string> = {};
for (const f of files(join(root, "fixtures"))) {
  if (f.endsWith("README.md")) continue; // documentation, not data
  fixtures[relative(root, f).split("\\").join("/")] = sha256(readFileSync(f));
}
const modules: Record<string, unknown> = {};
for (const m of SNAPSHOT_MODULES) modules[m.key] = m.run("month-2026-09");
const now = canonicalJson({ engineVersion: ENGINE_VERSION, fixtures, modules });

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE, now);
  console.log(`baseline written: ${relative(root, BASELINE)}`);
} else if (!existsSync(BASELINE)) {
  console.error(`no baseline at ${relative(root, BASELINE)} — run pnpm snapshot:update once`);
  process.exitCode = 1;
} else {
  const base = readFileSync(BASELINE, "utf8");
  if (base === now) {
    console.log(`snapshot:diff EMPTY — byte-identical to ${relative(root, BASELINE)} (sha256 ${sha256(now).slice(0, 16)}…)`);
  } else {
    const a = JSON.parse(now) as { fixtures: Record<string, string>; modules: Record<string, unknown> };
    const b = JSON.parse(base) as { fixtures: Record<string, string>; modules: Record<string, unknown> };
    const keys = new Set([...Object.keys(a.fixtures), ...Object.keys(b.fixtures)]);
    const changed = [...keys].filter((k) => a.fixtures[k] !== b.fixtures[k]).map((k) => `fixture ${k}`);
    const mk = new Set([...Object.keys(a.modules), ...Object.keys(b.modules)]);
    for (const k of mk) {
      if (!(k in b.modules)) changed.push(`module ${k} (baru — jalankan snapshot:update bila memang ditambahkan fase ini)`);
      else if (JSON.stringify(a.modules[k]) !== JSON.stringify(b.modules[k])) changed.push(`module ${k}`);
    }
    console.error(`snapshot:diff: ${changed.length} perbedaan\n  ${changed.join("\n  ")}`);
    process.exitCode = 1;
  }
}

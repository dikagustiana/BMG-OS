/** The fs_line / coa_fs_map seed in the Fase 1b migration is the generator's output (no hand edits). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readFixtureJson, repoRoot } from "../src/fixtures";
import { fsSeedSql } from "../src/fs-seed-sql";
import type { MtmAccount } from "../src/fs-map-seed";

describe("20261016000100_b8_fs.sql seed", () => {
  it("equals packages/engine/scripts/fs-seed-sql.ts output", () => {
    const sql = readFileSync(join(repoRoot(), "supabase", "migrations", "20261016000100_b8_fs.sql"), "utf8");
    const start = sql.indexOf("-- >>> generated");
    expect(start).toBeGreaterThan(0);
    expect(sql.slice(start)).toBe(fsSeedSql(readFixtureJson<{ accounts: MtmAccount[] }>("budget-v1", "coa_mtm.json").accounts));
  });
});

/** The fs_line / coa_fs_map seed migrations are the generator's output (no hand edits). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readFixtureJson, repoRoot } from "../src/fixtures";
import { coaFsSeedSql, fsLineSeedSql } from "../src/fs-seed-sql";
import type { MtmAccount } from "../src/fs-map-seed";

const read = (f: string) => readFileSync(join(repoRoot(), "supabase", "migrations", f), "utf8");

describe("Fase 1b seed migrations", () => {
  it("20261016000200_b8_fs_lines.sql = fsLineSeedSql()", () => {
    expect(read("20261016000200_b8_fs_lines.sql")).toBe(fsLineSeedSql());
  });
  it("20261016000300_b8_fs_map.sql = coaFsSeedSql(coa_mtm.json)", () => {
    expect(read("20261016000300_b8_fs_map.sql")).toBe(coaFsSeedSql(readFixtureJson<{ accounts: MtmAccount[] }>("budget-v1", "coa_mtm.json").accounts));
  });
});

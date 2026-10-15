#!/usr/bin/env tsx
/**
 * SQL seeds for fs_line and coa_fs_map (PRD v2 §5.1; Fase 1b), from FS_LINES and fixtures/budget-v1/coa_mtm.json.
 * Writes supabase/migrations/20261016000200_b8_fs_lines.sql and 20261016000300_b8_fs_map.sql;
 * test/fs-seed.test.ts fails when a migration differs from this output.
 *   pnpm --filter @bmg/engine exec tsx scripts/fs-seed-sql.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { coaFsSeedSql, fsLineSeedSql } from "../src/fs-seed-sql";
import { readFixtureJson, repoRoot } from "../src/fixtures";
import type { MtmAccount } from "../src/fs-map-seed";

const dir = join(repoRoot(), "supabase", "migrations");
const accounts = readFixtureJson<{ accounts: MtmAccount[] }>("budget-v1", "coa_mtm.json").accounts;
writeFileSync(join(dir, "20261016000200_b8_fs_lines.sql"), fsLineSeedSql());
writeFileSync(join(dir, "20261016000300_b8_fs_map.sql"), coaFsSeedSql(accounts));
console.log("written 20261016000200_b8_fs_lines.sql, 20261016000300_b8_fs_map.sql");

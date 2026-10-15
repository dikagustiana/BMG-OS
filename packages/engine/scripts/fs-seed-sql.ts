#!/usr/bin/env tsx
/**
 * SQL seed for fs_line and coa_fs_map (PRD v2 §5.1; Fase 1b), from FS_LINES and fixtures/budget-v1/coa_mtm.json.
 * Prints the block that sits between the "generated" markers of supabase/migrations/20261016000100_b8_fs.sql;
 * test/fs-seed.test.ts fails when the migration and this output differ.
 *   pnpm --filter @bmg/engine exec tsx scripts/fs-seed-sql.ts
 */
import { fsSeedSql } from "../src/fs-seed-sql";
import { readFixtureJson } from "../src/fixtures";
import type { MtmAccount } from "../src/fs-map-seed";

process.stdout.write(fsSeedSql(readFixtureJson<{ accounts: MtmAccount[] }>("budget-v1", "coa_mtm.json").accounts));

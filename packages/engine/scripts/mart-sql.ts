#!/usr/bin/env tsx
/**
 * SQL of the B2–B4 migrations (inputs + data marts), from mart-schema.ts / mart-sql.ts and fixtures/master/product_item.json.
 * Writes supabase/migrations/20261017000100_b2_inputs.sql, 20261017000200_b2_marts.sql, 20261017000300_b3_b4_marts.sql;
 * test/mart-sql.test.ts fails when a migration differs from this output.
 *   pnpm --filter @bmg/engine exec tsx scripts/mart-sql.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { masterRows } from "../src/fixtures-month";
import { repoRoot } from "../src/fixtures";
import { b2InputsSql, MART_MIGRATIONS, martMigrationSql, rlsCostingSql, type ProductItemSeed } from "../src/mart-sql";

const dir = join(repoRoot(), "supabase", "migrations");
writeFileSync(join(repoRoot(), "supabase", "tests", "rls_costing.sql"), rlsCostingSql());
writeFileSync(join(dir, "20261017000100_b2_inputs.sql"), b2InputsSql(masterRows<ProductItemSeed>("product_item")));
for (const m of MART_MIGRATIONS) writeFileSync(join(dir, m.file), martMigrationSql(m.title, m.tables));
console.log("written 20261017000100_b2_inputs.sql," + MART_MIGRATIONS.map((m) => ` ${m.file}`).join(","));

/**
 * SQL of the B2–B4 data-mart migrations, generated from MART_SPECS (mart-schema.ts). The migration files are this
 * output (scripts/mart-sql.ts writes them; test/mart-sql.test.ts fails when a file differs). Idempotent and additive:
 * `create table if not exists`, `create or replace trigger`, policies guarded by `pg_policies`.
 */
import { dbName, MART_SPECS, type MartCol, type MartSpec } from "./mart-schema";

/** Roles that read a mart (PRD v2 §2: preparers, management and the planners; factory roles do not read costing). */
const READERS = ["admin", "finance", "cost_accounting", "management", "ppic", "purchasing", "sales"] as const;
/** Roles that write a mart: whoever may run the rebuild. */
const WRITERS = ["admin", "finance", "cost_accounting"] as const;

const PG_TYPE: Record<MartCol["k"], string> = {
  text: "text", num: "numeric(28,10)", int: "int", bool: "boolean", json: "jsonb", textarr: "text[]", date: "date",
};

const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
const list = (xs: readonly string[]) => xs.map(q).join(",");

function columnSql(c: MartCol): string {
  const name = dbName(c);
  const check = c.in ? ` check (${name} in (${list(c.in)}))` : "";
  const def = c.k === "json" && !c.nul ? " default '{}'::jsonb" : "";
  return `  ${name.padEnd(24)}${PG_TYPE[c.k]}${c.nul ? "" : " not null"}${def}${check}`;
}

function tableSql(m: MartSpec): string {
  const cols = m.cols.map(columnSql).join(",\n");
  return `-- ${m.note}
create table if not exists public.${m.table} (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
${cols},
  rule_id           text not null,
  inputs            jsonb,
  source_ref        text,
  source_refs       jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);`;
}

/** Keys, stamp/audit triggers, RLS and policies for the given mart tables. */
function guardsSql(tables: readonly string[]): string {
  const arr = `array[${list(tables)}]`;
  return `-------------------------------------------------------------------------------- keys, stamps, audit, RLS
do $$
declare t text;
begin
  foreach t in array ${arr} loop
    execute format('create unique index if not exists %I on public.%I (month, line_key) where deleted_at is null', t || '_line_key', t);
    execute format('create index if not exists %I on public.%I (month)', t || '_month_idx', t);
    execute format('create index if not exists %I on public.%I (upload_id)', t || '_upload_idx', t);
    execute format('create or replace trigger stamp before insert or update on public.%I for each row execute function private.tg_stamp()', t);
    execute format('create or replace trigger audit after insert or update or delete on public.%I for each row execute function private.tg_audit()', t);
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_select') then
      execute format('create policy %I on public.%I for select to authenticated using ((select public.has_role(${READERS.map((r) => `''${r}''`).join(",")})))', t || '_select', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_insert') then
      execute format('create policy %I on public.%I for insert to authenticated with check ((select public.has_role(${WRITERS.map((r) => `''${r}''`).join(",")})))', t || '_insert', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_update') then
      execute format('create policy %I on public.%I for update to authenticated using ((select public.has_role(${WRITERS.map((r) => `''${r}''`).join(",")}))) with check ((select public.has_role(${WRITERS.map((r) => `''${r}''`).join(",")})))', t || '_update', t);
    end if;
  end loop;
end $$;
`;
}

/** Migration text for the mart tables named in `tables` (a contiguous group of MART_SPECS). */
export function martMigrationSql(title: string, tables: readonly string[]): string {
  const specs = tables.map((t) => {
    const m = MART_SPECS.find((s) => s.table === t);
    if (!m) throw new Error(`Tabel mart tidak dikenal: ${t}`);
    return m;
  });
  return `-- ${title}
-- Generated from packages/engine/src/mart-schema.ts by packages/engine/scripts/mart-sql.ts (no hand edits; test/mart-sql.test.ts
-- fails when this file differs). Data marts are written by the rebuild only: one live row per (month, line_key); every row
-- carries rule_id, inputs and source_ref(s) for SourceTrace (PRD v2 §5.4). Idempotent and additive only.

${specs.map(tableSql).join("\n\n")}

${guardsSql(tables)}`;
}

/** The mart migrations: file name → tables. */
export const MART_MIGRATIONS: readonly { file: string; title: string; tables: readonly string[] }[] = [
  {
    file: "20261017000200_b2_marts.sql",
    title: "B2 costing marts (PRD v2 §5.4; Fase 2): pool, idle, allocation, process card, FG, Lain-lain, summary, control.",
    tables: ["pool_month", "idle_month", "allocation_month", "process_card_month", "fg_month", "others_month", "summary_month", "control_month"],
  },
  {
    file: "20261017000300_b3_b4_marts.sql",
    title: "B3 recon and B4 analysis marts (PRD v2 §5.4; Fase 3–4): recon, inventory recon, variance, bridge, reasonableness, KPI series.",
    tables: ["recon_month", "inventory_recon", "variance_month", "bridge_month", "reasonableness", "kpi_series"],
  },
];

// ------------------------------------------------------------------------------------------------ inputs of Fase 2–4

export interface ProductItemSeed { product: string; role: string; item_code: string; source?: string }

/** Every table `apply_changes` may write once the B2–B4 migrations are in (inputs of all phases, FS tables and marts). */
export const UPLOAD_TABLES: readonly string[] = [
  "material_item", "sku", "coa_pool_map", "assumption", "budget_version", "budget_line", "budget_pool_map",
  "std_version", "bom_line", "output_mix", "routing", "rate_card", "capacity",
  "gl_month", "gl_voucher_tag", "payroll_month", "payroll_journal", "inventory_valuation", "sales_by_item",
  "average_price", "cogm_card", "cogm_material", "driver_month", "fs_control",
  "coa_fs_map", "tb_month", "history_fs_line", "budget_fs_line",
  "fs_month", "nwc_month", "cashflow_month", "fs_check_month",
  "wp_opening", "cogm_legacy", "history_cost_line",
  "pool_month", "idle_month", "allocation_month", "process_card_month", "fg_month", "others_month", "summary_month", "control_month",
  "recon_month", "inventory_recon", "variance_month", "bridge_month", "reasonableness", "kpi_series",
];

const FS_CONTROL_KEYS = [
  "revenue_4101_007", "material_usage", "conversion_16", "cogs", "inv_1106_001_close", "inv_1106_002_open", "inv_1106_002_close",
  "inv_1106_003_open", "inv_1106_003_close",
  // F3 (docs/v2/F34-engine-notes.md): numbers the WP types as blue cells
  "gl_revenue_4101_007", "gl_1106_001_receipts", "gl_1106_001_usage", "gl_1106_002_movement", "gl_1106_003_movement",
  "pl_hpp_open", "pl_hpp_receipts", "pl_hpp_usage", "pl_hpp_close",
];

const PROV = `  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text`;

/** Migration 20261017000100: new master (product_item), new inputs (wp_opening, cogm_legacy, history_cost_line), fs_control keys, upload_tables(). */
export function b2InputsSql(items: readonly ProductItemSeed[]): string {
  const values = items.map((i) => `  (${q(i.product)}, ${q(i.role)}, ${q(i.item_code)}, ${q(i.source ?? "WP Sep26_4")})`).join(",\n");
  return `-- B2–B4 inputs (PRD v2 §5.1–§5.2; Fase 2–4): master product_item (product ↔ Accurate item), inputs wp_opening (opening WIP/FG
-- values valued on the WP, for the first platform month), cogm_legacy (old CoGM card totals), history_cost_line (old-card FCC
-- history, previous-month KPI and bridge inputs; docs/v2/F34-engine-notes.md), and the fs_control keys the F3 recon types
-- as blue cells in the WP. Generated by packages/engine/scripts/mart-sql.ts (no hand edits). Idempotent and additive only.

-------------------------------------------------------------------------------- master: product_item
create table if not exists public.product_item (
  id        uuid primary key default gen_random_uuid(),
  product   text not null references public.product(code) on update cascade,
  role      text not null check (role in ('fg','wip','sales','kw2_sales')),
  item_code text not null,
${PROV}
);
create unique index if not exists product_item_key on public.product_item (product, role, item_code) where deleted_at is null;

insert into public.product_item (product, role, item_code, source) values
${values}
on conflict do nothing;

-------------------------------------------------------------------------------- inputs
create table if not exists public.wp_opening (
  id        uuid primary key default gen_random_uuid(),
  month     date not null check (extract(day from month) = 1),
  line      text not null,                    -- FCC | UU | UO (WIP, FG) or a SKU code (FG)
  kind      text not null check (kind in ('wip','fg')),
  item_code text,
  qty       numeric(18,4) not null,
  value     numeric(18,2) not null,
  unit      text,
  line_key  text not null,
${PROV}
);

create table if not exists public.cogm_legacy (
  id        uuid primary key default gen_random_uuid(),
  month     date not null check (extract(day from month) = 1),
  line      text not null check (line in ('FCC','UU','UO')),
  component text not null check (component in ('material','upah_kupas','direct_labour','overhead','total')),
  amount    numeric(18,2) not null,
  line_key  text not null,
${PROV}
);

create table if not exists public.history_cost_line (
  id         uuid primary key default gen_random_uuid(),
  month      date not null check (extract(day from month) = 1),
  kind       text not null check (kind in ('old_card_fcc','mom_prior','bridge_prior')),
  product    text,
  key        text not null,
  value      numeric(28,10) not null,
  unit       text,
  source_ref text,
  line_key   text not null,
${PROV}
);

do $$
declare t text;
begin
  foreach t in array array['wp_opening','cogm_legacy','history_cost_line'] loop
    execute format('create unique index if not exists %I on public.%I (month, line_key) where deleted_at is null', t || '_line_key', t);
    execute format('create index if not exists %I on public.%I (month)', t || '_month_idx', t);
    execute format('create index if not exists %I on public.%I (upload_id)', t || '_upload_idx', t);
  end loop;
  foreach t in array array['product_item','wp_opening','cogm_legacy','history_cost_line'] loop
    execute format('create or replace trigger stamp before insert or update on public.%I for each row execute function private.tg_stamp()', t);
    execute format('create or replace trigger audit after insert or update or delete on public.%I for each row execute function private.tg_audit()', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
  -- readers: master — every app user; inputs — the preparers (as B1)
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_item' and policyname = 'product_item_select') then
    create policy product_item_select on public.product_item for select to authenticated using ((select public.is_app_user()));
  end if;
  foreach t in array array['wp_opening','cogm_legacy','history_cost_line'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_select') then
      execute format('create policy %I on public.%I for select to authenticated using ((select public.has_role(''admin'',''finance'',''cost_accounting'')))', t || '_select', t);
    end if;
  end loop;
  -- writers: Admin and Finance for the master; Admin and Cost Accounting for the costing inputs (as cogm_card)
  foreach t in array array['product_item','wp_opening','cogm_legacy','history_cost_line'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_insert') then
      execute format('create policy %I on public.%I for insert to authenticated with check ((select public.has_role(%s)))', t || '_insert', t,
        case when t = 'product_item' then '''admin'',''finance''' else '''admin'',''cost_accounting''' end);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_update') then
      execute format('create policy %I on public.%I for update to authenticated using ((select public.has_role(%s))) with check ((select public.has_role(%s)))', t || '_update', t,
        case when t = 'product_item' then '''admin'',''finance''' else '''admin'',''cost_accounting''' end,
        case when t = 'product_item' then '''admin'',''finance''' else '''admin'',''cost_accounting''' end);
    end if;
  end loop;
end $$;

-------------------------------------------------------------------------------- fs_control keys
-- The F3 recon types nine more GL / LK numbers in the WP (REKON MATERIAL, REKON & KONTROL); they arrive as fs_control keys.
do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.fs_control'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%revenue_4101_007%' loop
    execute format('alter table public.fs_control drop constraint %I', c);
  end loop;
  alter table public.fs_control add constraint fs_control_key_check_v2 check (key in (${list(FS_CONTROL_KEYS)}));
end $$;

-------------------------------------------------------------------------------- upload targets
-- Tables apply_changes may write (uploads and rebuilds; RLS still decides per role).
create or replace function public.upload_tables() returns text[]
language sql immutable set search_path = '' as $$
  select array[${list(UPLOAD_TABLES)}]::text[]
$$;
`;
}

// ------------------------------------------------------------------------------------------------ RLS test

const sample = (c: MartCol): string => {
  switch (c.k) {
    case "num": case "int": return "0";
    case "bool": return "false";
    case "json": return "'{}'::jsonb";
    case "textarr": return "'{}'::text[]";
    case "date": return "'2026-08-01'";
    default: return q(c.in?.[0] ?? "x");
  }
};

/** supabase/tests/rls_costing.sql: every B2–B4 table, every role, insert / update / select against the PRD v2 §2 rule. */
export function rlsCostingSql(): string {
  const marts = MART_SPECS.map((m) => {
    const req = m.cols.filter((c) => !c.nul);
    const names = ["month", "rule_id", "line_key", ...req.map(dbName)].join(", ");
    const vals = (suffix: string) => [`''2026-09-01''`, `''t''`, `''T|${suffix}''`, ...req.map((c) => sample(c).replace(/'/g, "''"))].join(", ");
    return { table: m.table, w: WRITERS, r: READERS, ins: `insert into public.${m.table} (${names}) values (${vals("%s")})`, setup: `insert into public.${m.table} (${names}) values (${vals("setup").replace(/''/g, "'")})`,
      upd: `update public.${m.table} set rule_id = rule_id where line_key = ''T|setup''` };
  });
  const inputs = [
    { table: "product_item", w: ["admin", "finance"], r: "all", ins: "insert into public.product_item (product, role, item_code) values (''FCC'', ''fg'', ''T-%s'')", setup: "", upd: "update public.product_item set source = source where item_code = ''FG-001''" },
    { table: "wp_opening", w: ["admin", "cost_accounting"], r: ["admin", "finance", "cost_accounting"], ins: "insert into public.wp_opening (month, line, kind, qty, value, line_key) values (''2026-09-01'', ''FCC'', ''wip'', 1, 1, ''T|%s'')",
      setup: "insert into public.wp_opening (month, line, kind, qty, value, line_key) values ('2026-09-01', 'FCC', 'wip', 1, 1, 'setup')", upd: "update public.wp_opening set unit = unit where line_key = ''setup''" },
    { table: "cogm_legacy", w: ["admin", "cost_accounting"], r: ["admin", "finance", "cost_accounting"], ins: "insert into public.cogm_legacy (month, line, component, amount, line_key) values (''2026-09-01'', ''FCC'', ''total'', 1, ''T|%s'')",
      setup: "insert into public.cogm_legacy (month, line, component, amount, line_key) values ('2026-09-01', 'FCC', 'total', 1, 'setup')", upd: "update public.cogm_legacy set amount = amount where line_key = ''setup''" },
    { table: "history_cost_line", w: ["admin", "cost_accounting"], r: ["admin", "finance", "cost_accounting"], ins: "insert into public.history_cost_line (month, kind, key, value, line_key) values (''2026-09-01'', ''old_card_fcc'', ''k'', 1, ''T|%s'')",
      setup: "insert into public.history_cost_line (month, kind, key, value, line_key) values ('2026-09-01', 'old_card_fcc', 'k', 1, 'setup')", upd: "update public.history_cost_line set unit = unit where line_key = ''setup''" },
  ];
  const jsonList = (xs: readonly string[] | string) => (typeof xs === "string" ? `'"${xs}"'::jsonb` : `'${JSON.stringify(xs)}'::jsonb`);
  const spec = [...marts, ...inputs].map((e) => `    ${q(e.table)}, jsonb_build_object('w', ${jsonList(e.w)}, 'r', ${jsonList(e.r)},\n      'ins', '${e.ins}',\n      'upd', '${e.upd}')`).join(",\n");
  const setups = [...marts, ...inputs].map((e) => e.setup).filter(Boolean).map((s) => `  ${s};`).join("\n");
  const tables = [...marts, ...inputs].map((e) => e.table).filter((t) => UPLOAD_TABLES.includes(t));
  return `-- Role test for the B2–B4 tables (PRD v2 §2, §5; Fase 2–4; migrations 20261017000100–300). Same method as rls_fs.sql:
-- impersonate each role through JWT claims, try insert / update / select, compare with the rule. Always rolls back. Local only.
-- Generated by packages/engine/scripts/mart-sql.ts (no hand edits; test/mart-sql.test.ts compares).
begin;

create temporary table rls_result (ok boolean, check_name text, detail text) on commit drop;
grant all on rls_result to authenticated, anon;

do $$
declare
  roles text[] := array['admin','finance','cost_accounting','ppic','production','warehouse','engineering','purchasing','sales','management'];
  r text;
  t record;
  denied boolean;
  err text;
  n int;
  spec jsonb := jsonb_build_object(
${spec}
  );
begin
  insert into public.app_user (email, role) select 't-' || x || '@x.test', x from unnest(roles) x;
${setups}

  foreach r in array roles loop
    perform set_config('request.jwt.claims', json_build_object('email', 't-' || r || '@x.test', 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    for t in select key as tbl, value as s from jsonb_each(spec) loop
      begin
        execute format(t.s ->> 'ins', r);
        denied := false; err := null;
      exception when others then denied := true; err := sqlstate || ' ' || sqlerrm;
      end;
      insert into rls_result values (denied = not ((t.s -> 'w') ? r), format('%s insert %s', r, t.tbl), coalesce('denied: ' || err, 'allowed'));
      begin
        execute t.s ->> 'upd';
        get diagnostics n = row_count;
        denied := n = 0; err := 'rows ' || n;
      exception when others then denied := true; err := sqlstate || ' ' || sqlerrm;
      end;
      insert into rls_result values (denied = not ((t.s -> 'w') ? r), format('%s update %s', r, t.tbl), err);
      execute format('select count(*) from public.%I', t.tbl) into n;
      insert into rls_result values ((n > 0) = ((t.s -> 'r') = '"all"'::jsonb or (t.s -> 'r') ? r), format('%s select %s', r, t.tbl), 'rows ' || n);
    end loop;
    execute 'reset role';
  end loop;

  execute 'reset role';
  insert into rls_result select (select bool_and(x = any(public.upload_tables())) from unnest(array[${list(tables)}]) x), 'upload_tables has every B2–B4 table', '';
  -- fs_control accepts the F3 keys, and still rejects an unknown key
  begin
    insert into public.fs_control (month, key, amount, line_key) values ('2026-09-01', 'pl_hpp_close', 1, 'T|k1');
    insert into rls_result values (true, 'fs_control accepts pl_hpp_close', '');
  exception when others then insert into rls_result values (false, 'fs_control accepts pl_hpp_close', sqlerrm);
  end;
  begin
    insert into public.fs_control (month, key, amount, line_key) values ('2026-09-01', 'bogus_key', 1, 'T|k2');
    insert into rls_result values (false, 'fs_control rejects unknown key', 'allowed');
  exception when check_violation then insert into rls_result values (true, 'fs_control rejects unknown key', '');
  end;
  -- product_item is seeded (4 products × roles from the WP)
  insert into rls_result values ((select count(*) from public.product_item where deleted_at is null) >= 8, 'product_item seeded', '');
end $$;

do $$
declare f text; n_ok int; n_bad int;
begin
  select count(*) filter (where ok), count(*) filter (where not ok) into n_ok, n_bad from rls_result;
  select string_agg(check_name || ' (' || detail || ')', E'\\n  ' order by check_name) into f from rls_result where not ok;
  if n_bad > 0 then
    raise exception E'RLS B2-B4: % passed, % FAILED:\\n  %', n_ok, n_bad, f;
  end if;
  raise notice 'RLS B2-B4: all % checks passed', n_ok;
end $$;

rollback;
`;
}

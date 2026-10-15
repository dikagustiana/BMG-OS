-- B8 FS: neraca, laba rugi, arus kas (PRD v2 §4.11, §5.1–§5.5; Fase 1b). Idempotent and additive only.
-- Inputs: tb_month (TB/LK Accurate per account), history_fs_line (BP sheet "BMG Business Plan" column Actual),
-- budget_fs_line (same sheet, column BP, per budget version). Master: fs_line (presentation lines = BP rows),
-- coa_fs_map (account → fs_line, effective-dated like coa_pool_map). Data marts written by the FS rebuild:
-- fs_month, nwc_month, cashflow_month, fs_check_month. Flag b8_fs (default off).

insert into public.app_setting (key, value, description) values
  ('b8_fs', 'false', 'B8 FS: neraca, laba rugi, arus kas, modal kerja (Fase 1b)')
on conflict (key) do nothing;

-- (fs_line and coa_fs_map are seeded by 20261016000200_b8_fs_lines.sql and 20261016000300_b8_fs_map.sql.)

-- Q27: F06 threshold (piutang lain-lain pihak berelasi ÷ ekuitas).
insert into public.assumption (key, value_num, unit, effective_from, owner, status, used_in, note, source) values
  ('related_party_pct', 0.10, 'rasio', '2026-01-01', 'finance', 'default', 'F06', 'PRD v2 Q27: > 10% ekuitas → PERIKSA', 'PRD v2 §11 Q27')
on conflict (key, effective_from) do nothing;

-------------------------------------------------------------------------------- master: fs_line, coa_fs_map
create table if not exists public.fs_line (
  code         text primary key,
  statement    text not null check (statement in ('pl','bs','wc','cf')),
  section      text not null,
  kind         text not null check (kind in ('leaf','total','memo','flow')),
  label_id     text not null,
  label_en     text not null,
  bp_row       int,
  source_label text,
  sum_codes    text[],
  level        int not null default 1,
  summary      boolean not null default false,
  sort_order   int not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

create table if not exists public.coa_fs_map (
  id             uuid primary key default gen_random_uuid(),
  account        text not null,
  account_name   text,
  effective_from date not null,
  effective_to   date,
  fs_line_code   text not null references public.fs_line(code) on update cascade,
  sign           smallint not null default 1 check (sign in (1, -1)),
  accurate_code  text,                       -- Accurate report group (BS 01 … BS 44, PL 01 …), trace only
  confirmed      boolean not null default false,
  note           text,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text,
  check (effective_to is null or effective_to >= effective_from)
);
create unique index if not exists coa_fs_map_account_from_key on public.coa_fs_map (account, effective_from);
create index if not exists coa_fs_map_line_idx on public.coa_fs_map (fs_line_code);

-- BP versions: the FS sheet of a version is imported once (bp_fs), like the Model Details lines (budget_bp).
alter table public.budget_version add column if not exists fs_imported_at timestamptz;

-------------------------------------------------------------------------------- inputs
create table if not exists public.tb_month (
  id            uuid primary key default gen_random_uuid(),
  month         date not null check (extract(day from month) = 1),
  account       text not null,
  account_name  text,
  balance_open  numeric(18,2),                -- debit-positive (debit − credit)
  debit         numeric(18,2) not null default 0,
  credit        numeric(18,2) not null default 0,
  balance_close numeric(18,2) not null,       -- debit-positive
  line_key      text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create index if not exists tb_month_month_account_idx on public.tb_month (month, account) where deleted_at is null;

create table if not exists public.history_fs_line (
  id           uuid primary key default gen_random_uuid(),
  month        date not null check (extract(day from month) = 1),
  fs_line_code text not null references public.fs_line(code) on update cascade,
  amount       numeric(18,2) not null,
  source_ref   text,                          -- "BMG Business Plan!S184"
  line_key     text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create index if not exists history_fs_line_code_idx on public.history_fs_line (fs_line_code);

create table if not exists public.budget_fs_line (
  id                uuid primary key default gen_random_uuid(),
  budget_version_id uuid not null references public.budget_version(id),
  month             date not null check (extract(day from month) = 1),
  fs_line_code      text not null references public.fs_line(code) on update cascade,
  amount            numeric(18,2) not null,
  source_ref        text,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists budget_fs_line_key on public.budget_fs_line (budget_version_id, month, line_key) where deleted_at is null;
create index if not exists budget_fs_line_version_idx on public.budget_fs_line (budget_version_id);
create index if not exists budget_fs_line_code_idx on public.budget_fs_line (fs_line_code);

-------------------------------------------------------------------------------- data marts (FS rebuild)
-- Every row: rule_id (engine function@version), inputs (ids/keys of the input rows used), source_ref (BP cell or
-- accounts) for SourceTrace (PRD v2 §5.4). basis = actual | bp.
create table if not exists public.fs_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  basis             text not null check (basis in ('actual','bp')),
  fs_line_code      text not null references public.fs_line(code) on update cascade,
  amount            numeric(18,2) not null,
  source_kind       text not null check (source_kind in ('bp_fs_actual','bp_fs_budget','tb_month')),
  budget_version_id uuid references public.budget_version(id),
  source_ref        text,
  rule_id           text not null,
  inputs            jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create index if not exists fs_month_basis_code_idx on public.fs_month (basis, fs_line_code, month) where deleted_at is null;
create index if not exists fs_month_code_idx on public.fs_month (fs_line_code);
create index if not exists fs_month_version_idx on public.fs_month (budget_version_id);

create table if not exists public.nwc_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  basis             text not null check (basis in ('actual','bp')),
  trade_receivables numeric(18,2) not null,
  inventories       numeric(18,2) not null,
  trade_payables    numeric(18,2) not null,
  nwc               numeric(18,2) not null,
  delta_nwc_cash    numeric(18,2),
  revenue_gross     numeric(18,2),
  cost_of_revenue   numeric(18,2),
  days_in_month     int not null,
  dso               numeric(10,2),
  dio               numeric(10,2),
  dpo               numeric(10,2),
  rule_id           text not null,
  inputs            jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

create table if not exists public.cashflow_month (
  id         uuid primary key default gen_random_uuid(),
  month      date not null check (extract(day from month) = 1),
  basis      text not null check (basis in ('actual','bp')),
  line_code  text not null references public.fs_line(code) on update cascade,
  amount     numeric(18,2) not null,
  computed   boolean not null default false,  -- true: engine from two balance sheets; false: imported from BP
  rule_id    text not null,
  inputs     jsonb,
  line_key   text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create index if not exists cashflow_month_code_idx on public.cashflow_month (line_code);

create table if not exists public.fs_check_month (
  id         uuid primary key default gen_random_uuid(),
  month      date not null check (extract(day from month) = 1),
  basis      text not null check (basis in ('actual','bp')),
  code       text not null check (code in ('F01','F02','F03','F04','F05','F06','F07')),
  label      text not null,
  value      numeric(28,10),
  tolerance  numeric(28,10),
  status     text not null check (status in ('LULUS','GAGAL','PERIKSA','BELUM_DIISI')),
  note       text,
  rule_id    text not null,
  inputs     jsonb,
  line_key   text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-------------------------------------------------------------------------------- keys, stamps, audit, RLS
do $$
declare t text;
begin
  -- month-keyed tables: one live row per (month, line_key); line_key carries basis and code where needed
  foreach t in array array['tb_month','history_fs_line','fs_month','nwc_month','cashflow_month','fs_check_month'] loop
    execute format('create unique index if not exists %I on public.%I (month, line_key) where deleted_at is null', t || '_line_key', t);
    execute format('create index if not exists %I on public.%I (month)', t || '_month_idx', t);
  end loop;
  foreach t in array array['fs_line','coa_fs_map','tb_month','history_fs_line','budget_fs_line','fs_month','nwc_month','cashflow_month','fs_check_month'] loop
    execute format('create index if not exists %I on public.%I (upload_id)', t || '_upload_idx', t);
    execute format('create or replace trigger stamp before insert or update on public.%I for each row execute function private.tg_stamp()', t);
    execute format('create or replace trigger audit after insert or update or delete on public.%I for each row execute function private.tg_audit()', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Readers: master — every app user; inputs — the preparers (as B1); data marts — preparers, management and the
-- planners (Kinerja, read only; PRD v2 §7 navigation). Factory staff do not read FS.
do $$
declare p record;
begin
  for p in select * from (values
    ('fs_line',         '(select public.is_app_user())'),
    ('coa_fs_map',      '(select public.is_app_user())'),
    ('tb_month',        '(select public.has_role(''admin'',''finance'',''cost_accounting''))'),
    ('history_fs_line', '(select public.has_role(''admin'',''finance'',''cost_accounting''))'),
    ('budget_fs_line',  '(select public.has_role(''admin'',''finance'',''cost_accounting''))'),
    ('fs_month',        '(select public.has_role(''admin'',''finance'',''cost_accounting'',''management'',''ppic'',''purchasing'',''sales''))'),
    ('nwc_month',       '(select public.has_role(''admin'',''finance'',''cost_accounting'',''management'',''ppic'',''purchasing'',''sales''))'),
    ('cashflow_month',  '(select public.has_role(''admin'',''finance'',''cost_accounting'',''management'',''ppic'',''purchasing'',''sales''))'),
    ('fs_check_month',  '(select public.has_role(''admin'',''finance'',''cost_accounting'',''management'',''ppic'',''purchasing'',''sales''))')
  ) as t(tbl, cond) loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = p.tbl and policyname = p.tbl || '_select') then
      execute format('create policy %I on public.%I for select to authenticated using (%s)', p.tbl || '_select', p.tbl, p.cond);
    end if;
  end loop;
end $$;

-- Writers: Finance and Admin own every FS table (uploads, mapping, and the rebuild they trigger). No hard delete.
do $$
declare t text;
begin
  foreach t in array array['fs_line','coa_fs_map','tb_month','history_fs_line','budget_fs_line','fs_month','nwc_month','cashflow_month','fs_check_month'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_insert') then
      execute format('create policy %I on public.%I for insert to authenticated with check ((select public.has_role(''admin'',''finance'')))', t || '_insert', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_update') then
      execute format('create policy %I on public.%I for update to authenticated using ((select public.has_role(''admin'',''finance''))) with check ((select public.has_role(''admin'',''finance'')))',
        t || '_update', t);
    end if;
  end loop;
end $$;

-------------------------------------------------------------------------------- BP FS lock (Q4)
-- budget_fs_line of a version changes only until its FS sheet is imported (budget_version.fs_imported_at).
create or replace function private.tg_budget_fs_line_guard() returns trigger
language plpgsql set search_path = '' as $$
declare imp timestamptz;
begin
  if tg_op = 'UPDATE' and new.budget_version_id is distinct from old.budget_version_id then
    raise exception 'Baris neraca budget tidak boleh dipindah ke versi lain';
  end if;
  select v.fs_imported_at into imp from public.budget_version v where v.id = coalesce(new.budget_version_id, old.budget_version_id);
  if imp is not null then
    raise exception 'Neraca dan arus kas versi budget ini sudah diimpor; impor sebagai versi baru' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create or replace trigger guard before insert or update or delete on public.budget_fs_line for each row execute function private.tg_budget_fs_line_guard();

-------------------------------------------------------------------------------- upload targets
-- Tables apply_changes may write (uploads and rebuilds; RLS still decides per role).
create or replace function public.upload_tables() returns text[]
language sql immutable set search_path = '' as $$
  select array['material_item','sku','coa_pool_map','assumption','budget_version','budget_line','budget_pool_map',
               'std_version','bom_line','output_mix','routing','rate_card','capacity',
               'gl_month','gl_voucher_tag','payroll_month','payroll_journal','inventory_valuation','sales_by_item',
               'average_price','cogm_card','cogm_material','driver_month','fs_control',
               'coa_fs_map','tb_month','history_fs_line','budget_fs_line',
               'fs_month','nwc_month','cashflow_month','fs_check_month']::text[]
$$;

-------------------------------------------------------------------------------- uploader's name (PRD v2 §2: identity on screen is the full name)
alter table public.upload add column if not exists uploaded_by_name text;

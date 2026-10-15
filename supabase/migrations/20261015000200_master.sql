-- BMG-OS master and reference tables (PRD v1 §4.1). Idempotent and additive only.
-- Conventions: money numeric(18,2), Rp/kg and rates numeric(18,4), kg numeric(14,3), hours numeric(12,2),
-- percentages numeric(10,8); months are stored as their first day (date, day = 1).
-- Every table: provenance (source, document_ref, upload_id, created_*, updated_*), soft delete (deleted_*),
-- stamp + audit triggers, RLS: every app user reads; writers per PRD §2; no delete policy (soft delete only).

-------------------------------------------------------------------------------- products and lines
create table if not exists public.product (
  code               text primary key check (code in ('FCC','UU','UO')),
  name               text not null,
  fg_item_code       text,
  kw2_nrv_per_kg     numeric(18,4),
  wip_completion_pct numeric(10,8) not null default 1 check (wip_completion_pct > 0 and wip_completion_pct <= 1),
  sort_order         integer not null default 0,
  active             boolean not null default true,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

create table if not exists public.others_group (
  code           text primary key,
  name           text not null,
  main_line      text check (main_line in ('singkong','ubi_ungu','ubi_orange','maklon')),
  main_line_note text,
  fg_unit        text not null default 'kg' check (fg_unit in ('kg','bag')),
  wp_row         integer,
  sort_order     integer not null default 0,
  active         boolean not null default true,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

create table if not exists public.sku (
  code              text primary key,
  others_group_code text not null references public.others_group(code) on update cascade,
  name              text not null,
  fg_unit           text not null default 'kg' check (fg_unit in ('kg','bag')),
  kg_per_unit       numeric(14,6),
  wp_sheet          text,
  sort_order        integer not null default 0,
  active            boolean not null default true,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create index if not exists sku_group_idx on public.sku (others_group_code);

create table if not exists public.material_item (
  id           uuid primary key default gen_random_uuid(),
  code         text,                          -- Accurate item code (BB-…); null until confirmed
  name         text not null,                 -- Average Price / REKON MATERIAL name (natural key)
  unit         text,
  category     text not null check (category in ('singkong_kulit','singkong_daging','olein','cng','amonium','hdpe','karton',
                 'kemasan','bumbu','ubi_ungu','ubi_orange','ubi_putih','bahan_maklon','other')),
  line_default text check (line_default in ('FCC','UU','UO','LAIN')),
  sort_order   integer not null default 0,
  active       boolean not null default true,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists material_item_name_key on public.material_item (name);
create unique index if not exists material_item_code_key on public.material_item (code) where code is not null;
create index if not exists material_item_category_idx on public.material_item (category);

-------------------------------------------------------------------------------- account → pool mapping, dated (PRD D10)
create table if not exists public.coa_pool_map (
  id             uuid primary key default gen_random_uuid(),
  account        text not null,
  account_name   text,
  effective_from date not null,
  effective_to   date,
  pool           text not null check (pool in ('A','KUPAS','B','C','D','E','MATERIAL','OPEX_PABRIK','THR','BPJS','PAYROLL_SPLIT','NONE')),
  fixed_flag     boolean,
  confirmed      boolean not null default false,
  note           text,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text,
  check (effective_to is null or effective_to >= effective_from)
);
create unique index if not exists coa_pool_map_account_from_key on public.coa_pool_map (account, effective_from);
create index if not exists coa_pool_map_pool_idx on public.coa_pool_map (pool, effective_from);

create table if not exists public.payroll_group (
  code       text primary key,
  name       text not null,
  dept       text not null,
  kind       text not null check (kind in ('operator','support','kupas','staf')),
  pool       text not null check (pool in ('A','KUPAS','B')),
  unit       text check (unit in ('I','II','III')),
  wp_row     integer,
  sort_order integer not null default 0,
  active     boolean not null default true,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-------------------------------------------------------------------------------- assumptions (PRD D7)
create table if not exists public.assumption (
  id             uuid primary key default gen_random_uuid(),
  key            text not null,
  value_num      numeric(28,10),
  value_text     text,
  unit           text,
  effective_from date not null,
  owner          text,
  status         text,
  used_in        text,
  note           text,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists assumption_key_from_key on public.assumption (key, effective_from);

-------------------------------------------------------------------------------- budget (PRD D8, D9, D12)
create table if not exists public.budget_version (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  status      text not null default 'draft' check (status in ('draft','locked')),
  imported_at timestamptz,
  note        text,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists budget_version_name_key on public.budget_version (name);

create table if not exists public.budget_line (
  id                uuid primary key default gen_random_uuid(),
  budget_version_id uuid not null references public.budget_version(id),
  month             date not null check (extract(day from month) = 1),
  product           text,                    -- FCC | UU | UO | LAIN | null (company-level line)
  component         text not null,
  unit              text,
  value             numeric(28,10),          -- as in the BP cell (unit above)
  qty               numeric(18,4),
  price             numeric(18,4),
  amount            numeric(18,2),           -- Rupiah (IDR Mil × 1.000.000)
  driver_code       text not null,           -- product|component|YYYY-MM (D12: key, not a BP row number)
  bp_column_kind    text check (bp_column_kind in ('actual','plan')),
  bp_row            integer,
  bp_label          text,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists budget_line_driver_key on public.budget_line (budget_version_id, driver_code);
create index if not exists budget_line_month_idx on public.budget_line (budget_version_id, month, product);

create table if not exists public.budget_pool_map (
  id                uuid primary key default gen_random_uuid(),
  budget_version_id uuid not null references public.budget_version(id),
  bp_row_code       text not null,
  bp_label          text,
  pool              text not null check (pool in ('A','KUPAS','B','C','D','E','MATERIAL','NONE')),
  fixed_pct         numeric(10,8) check (fixed_pct is null or (fixed_pct >= 0 and fixed_pct <= 1)),
  confirmed         boolean not null default false,
  note              text,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists budget_pool_map_code_key on public.budget_pool_map (budget_version_id, bp_row_code);

-------------------------------------------------------------------------------- standards, versioned (PRD §4.1, rule 8)
create table if not exists public.std_version (
  id             uuid primary key default gen_random_uuid(),
  code           text not null,
  effective_from date not null,
  status         text not null default 'draft' check (status in ('draft','approved','superseded')),
  approved_by    text,
  approved_at    timestamptz,
  note           text,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists std_version_code_key on public.std_version (code);
create index if not exists std_version_status_idx on public.std_version (status, effective_from);

create table if not exists public.bom_line (
  id                uuid primary key default gen_random_uuid(),
  std_version_id    uuid not null references public.std_version(id),
  product           text not null check (product in ('FCC','UU','UO')),
  material_category text not null,
  unit              text,
  qty_per_kg_input  numeric(18,8) not null,
  band_low          numeric(10,8),
  band_high         numeric(10,8),
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists bom_line_key on public.bom_line (std_version_id, product, material_category);

create table if not exists public.output_mix (
  id             uuid primary key default gen_random_uuid(),
  std_version_id uuid not null references public.std_version(id),
  product        text not null check (product in ('FCC','UU','UO')),
  premium_pct    numeric(10,8) not null,
  kw2_pct        numeric(10,8) not null default 0,
  waste_pct      numeric(10,8) not null default 0,
  wip_pct        numeric(10,8) not null default 0,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists output_mix_key on public.output_mix (std_version_id, product);

create table if not exists public.routing (
  id                    uuid primary key default gen_random_uuid(),
  std_version_id        uuid not null references public.std_version(id),
  product               text not null check (product in ('FCC','UU','UO')),
  dept                  text not null,
  hours_per_ton         numeric(12,4),
  machine_hours_per_ton numeric(12,4),
  kwh_per_ton           numeric(14,4),
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists routing_key on public.routing (std_version_id, product, dept);

create table if not exists public.rate_card (
  id                 uuid primary key default gen_random_uuid(),
  std_version_id     uuid not null references public.std_version(id),
  pool               text not null check (pool in ('A','KUPAS','B','C','D','E')),
  driver             text not null check (driver in ('man_hour','kg_peeled','kwh','machine_hour','material_value','kg_output')),
  rate_variable      numeric(18,4),
  rate_fixed         numeric(18,4),
  fixed_amount_month numeric(18,2),
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists rate_card_key on public.rate_card (std_version_id, pool);

-- Capacity per week and department (PRD D2: normal_capacity_hours; default = hours paid until PPIC sets it, Q9).
create table if not exists public.capacity (
  id                    uuid primary key default gen_random_uuid(),
  week_start            date not null check (extract(isodow from week_start) = 1),
  dept                  text not null,
  headcount             integer,
  shift_hours           numeric(12,2),
  working_days          numeric(5,2),
  machine_hours         numeric(12,2),
  normal_capacity_hours numeric(12,2),
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists capacity_key on public.capacity (week_start, dept);

-- FK indexes (lookups from data marts and the advisor's unindexed-FK check).
create index if not exists budget_pool_map_version_idx on public.budget_pool_map (budget_version_id);
create index if not exists bom_line_version_idx on public.bom_line (std_version_id);
create index if not exists output_mix_version_idx on public.output_mix (std_version_id);
create index if not exists routing_version_idx on public.routing (std_version_id);
create index if not exists rate_card_version_idx on public.rate_card (std_version_id);
do $$
declare t text;
begin
  foreach t in array array['product','others_group','sku','material_item','coa_pool_map','payroll_group','assumption',
    'budget_version','budget_line','budget_pool_map','std_version','bom_line','output_mix','routing','rate_card','capacity'] loop
    execute format('create index if not exists %I on public.%I (upload_id)', t || '_upload_idx', t);
  end loop;
end $$;

-------------------------------------------------------------------------------- standard version guards (rule 8)
-- A version is edited only while draft. Approving (draft → approved) and superseding are for Finance / Admin.
create or replace function private.tg_std_version_guard() returns trigger
language plpgsql set search_path = '' as $$
declare k text; o jsonb; n jsonb;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' and not (select public.has_role('admin','finance')) and public.app_role() is not null then
      raise exception 'Versi standar baru harus draft' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    if public.app_role() is not null and not (select public.has_role('admin','finance')) then
      raise exception 'Hanya Finance/Admin yang menyetujui atau mengganti versi standar' using errcode = '42501';
    end if;
    if not ((old.status = 'draft' and new.status = 'approved') or (old.status = 'approved' and new.status = 'superseded')) then
      raise exception 'Status versi standar tidak boleh berubah dari % ke %', old.status, new.status;
    end if;
    if new.status = 'approved' then
      new.approved_by := coalesce(nullif(public.current_email(), ''), new.approved_by);
      new.approved_at := coalesce(new.approved_at, now());
    end if;
  end if;
  if old.status <> 'draft' then
    o := to_jsonb(old); n := to_jsonb(new);
    for k in select jsonb_object_keys(n) loop
      if k not in ('status','updated_at','updated_by') and (o -> k) is distinct from (n -> k) then
        raise exception 'Versi standar % sudah %; buat versi baru untuk mengubah %', old.code, old.status, k;
      end if;
    end loop;
  end if;
  return new;
end $$;

-- Lines of a standard (BOM, output mix, routing, rate card) change only while their version is draft.
create or replace function private.tg_std_child_guard() returns trigger
language plpgsql set search_path = '' as $$
declare st text;
begin
  select v.status into st from public.std_version v where v.id = coalesce(new.std_version_id, old.std_version_id);
  if tg_op = 'UPDATE' and new.std_version_id is distinct from old.std_version_id then
    raise exception 'Baris standar tidak boleh dipindah ke versi lain';
  end if;
  if st is distinct from 'draft' then
    raise exception 'Versi standar sudah %; baris tidak bisa diubah (buat versi baru)', coalesce(st, '?');
  end if;
  return coalesce(new, old);
end $$;

create or replace trigger guard before insert or update on public.std_version for each row execute function private.tg_std_version_guard();
create or replace trigger guard before insert or update or delete on public.bom_line for each row execute function private.tg_std_child_guard();
create or replace trigger guard before insert or update or delete on public.output_mix for each row execute function private.tg_std_child_guard();
create or replace trigger guard before insert or update or delete on public.routing for each row execute function private.tg_std_child_guard();
create or replace trigger guard before insert or update or delete on public.rate_card for each row execute function private.tg_std_child_guard();

-------------------------------------------------------------------------------- stamps, audit, RLS
do $$
declare t text;
begin
  foreach t in array array['product','others_group','sku','material_item','coa_pool_map','payroll_group','assumption',
    'budget_version','budget_line','budget_pool_map','std_version','bom_line','output_mix','routing','rate_card','capacity'] loop
    execute format('create or replace trigger stamp before insert or update on public.%I for each row execute function private.tg_stamp()', t);
    execute format('create or replace trigger audit after insert or update or delete on public.%I for each row execute function private.tg_audit()', t);
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_select') then
      execute format('create policy %I on public.%I for select to authenticated using ((select public.is_app_user()))', t || '_select', t);
    end if;
  end loop;
end $$;

-- Writers per table (PRD §2): master data and budget — Finance/Admin; standards — PPIC drafts, Finance/Admin approve
-- (guard above); capacity — PPIC/Admin.
do $$
declare p record;
begin
  for p in select * from (values
    ('product',         '''admin'',''finance'''),
    ('others_group',    '''admin'',''finance'''),
    ('sku',             '''admin'',''finance'''),
    ('material_item',   '''admin'',''finance'''),
    ('coa_pool_map',    '''admin'',''finance'''),
    ('payroll_group',   '''admin'',''finance'''),
    ('assumption',      '''admin'',''finance'''),
    ('budget_version',  '''admin'',''finance'''),
    ('budget_line',     '''admin'',''finance'''),
    ('budget_pool_map', '''admin'',''finance'''),
    ('std_version',     '''admin'',''finance'',''ppic'''),
    ('bom_line',        '''admin'',''finance'',''ppic'''),
    ('output_mix',      '''admin'',''finance'',''ppic'''),
    ('routing',         '''admin'',''finance'',''ppic'''),
    ('rate_card',       '''admin'',''finance'',''ppic'''),
    ('capacity',        '''admin'',''ppic''')
  ) as t(tbl, roles) loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = p.tbl and policyname = p.tbl || '_insert') then
      execute format('create policy %I on public.%I for insert to authenticated with check ((select public.has_role(%s)))', p.tbl || '_insert', p.tbl, p.roles);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = p.tbl and policyname = p.tbl || '_update') then
      execute format('create policy %I on public.%I for update to authenticated using ((select public.has_role(%s))) with check ((select public.has_role(%s)))',
        p.tbl || '_update', p.tbl, p.roles, p.roles);
    end if;
  end loop;
end $$;

-------------------------------------------------------------------------------- upload targets
-- Master tables that uploads (budget_bp, std_master; Fase 1) write through apply_changes.
create or replace function public.upload_tables() returns text[]
language sql immutable set search_path = '' as $$
  select array['material_item','sku','coa_pool_map','assumption','budget_line','budget_pool_map',
               'bom_line','output_mix','routing','rate_card','capacity']::text[]
$$;

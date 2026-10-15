-- B1 monthly inputs (PRD v1 §4.2; Fase 1). Uploads write these tables through apply_upload (one transaction per
-- upload). Every row carries the month (first day), its upload and a per-file line_key so re-uploads are idempotent.
-- Readers: the WP preparers (admin, finance, cost_accounting). Writers per PRD §5: finance-owned sources (GL, tags,
-- payroll, Inventory Valuation, Sales by Item, Average Price, LK) and cost_accounting-owned CoGM card data.
-- Idempotent and additive only.

-------------------------------------------------------------------------------- GL Accurate per voucher
create table if not exists public.gl_month (
  id           uuid primary key default gen_random_uuid(),
  month        date not null check (extract(day from month) = 1),
  account      text not null,
  account_name text,
  txn_date     date,
  voucher      text,
  description  text,
  debit        numeric(18,2) not null default 0,
  credit       numeric(18,2) not null default 0,
  net          numeric(18,2) not null,          -- debit − credit
  line_key     text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create index if not exists gl_month_month_account_idx on public.gl_month (month, account) where deleted_at is null;

-- Voucher tags (BIAYA BERSAMA bagian 8): reclasses into / out of the conversion pools.
create table if not exists public.gl_voucher_tag (
  id          uuid primary key default gen_random_uuid(),
  month       date not null check (extract(day from month) = 1),
  voucher     text not null,
  account     text not null,
  amount      numeric(18,2) not null,
  tag         text not null check (tag in ('reklas_opex','thr_swap','tali_asih_cutoff','ongkir_singkong','pisau_urschel')),
  target_pool text not null check (target_pool in ('A','KUPAS','B','C','D','E','MATERIAL','THR','BPJS','OPEX_PABRIK','NONE')),
  target_line text,                              -- product line for MATERIAL (e.g. FCC: ongkos kirim singkong)
  note        text,
  line_key    text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-------------------------------------------------------------------------------- payroll
create table if not exists public.payroll_month (
  id                 uuid primary key default gen_random_uuid(),
  month              date not null check (extract(day from month) = 1),
  payroll_group_code text not null references public.payroll_group(code) on update cascade,
  amount             numeric(18,2) not null,
  line_key           text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create index if not exists payroll_month_group_idx on public.payroll_month (payroll_group_code);

create table if not exists public.payroll_journal (
  id       uuid primary key default gen_random_uuid(),
  month    date not null check (extract(day from month) = 1),
  kind     text not null check (kind in ('upah_harian','gaji_staf','tali_asih')),
  voucher  text,
  amount   numeric(18,2) not null,
  line_key text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-------------------------------------------------------------------------------- Inventory Valuation Accurate
create table if not exists public.inventory_valuation (
  id                 uuid primary key default gen_random_uuid(),
  month              date not null check (extract(day from month) = 1),
  item_code          text not null,
  item_name          text,
  account            text,                    -- 1106-001 | 1106-002 | 1106-003 (derived from the code prefix when absent)
  qty_open           numeric(18,4),
  value_open         numeric(18,2),
  qty_in             numeric(18,4),
  value_in           numeric(18,2),
  qty_out_sale       numeric(18,4),
  value_out_sale     numeric(18,2),
  qty_out_transfer   numeric(18,4),
  value_out_transfer numeric(18,2),
  qty_adj            numeric(18,4),
  value_adj          numeric(18,2),
  qty_close          numeric(18,4),
  value_close        numeric(18,2),
  line_key           text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);
create index if not exists inventory_valuation_item_idx on public.inventory_valuation (month, item_code) where deleted_at is null;

-------------------------------------------------------------------------------- LK Sales by Item, Average Price
create table if not exists public.sales_by_item (
  id             uuid primary key default gen_random_uuid(),
  month          date not null check (extract(day from month) = 1),
  item_code      text,
  item_name      text not null,
  unit           text,
  qty            numeric(18,4),
  amount         numeric(18,2) not null,
  customer_group text check (customer_group is null or customer_group in ('IFM','KGS','retail','maklon')),
  line_key       text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

create table if not exists public.average_price (
  id        uuid primary key default gen_random_uuid(),
  month     date not null check (extract(day from month) = 1),
  item_name text not null,                   -- Average Price name (= material_item.name)
  item_code text,
  unit      text,
  price     numeric(18,4) not null,
  line_key  text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-------------------------------------------------------------------------------- CoGM card (cost accounting)
-- line: FCC | UU | UO | others_group code | SKU code. Lain-lain lines: output/sample in kg, output_fg/sample_fg in FG units (bag or kg).
create table if not exists public.cogm_card (
  id       uuid primary key default gen_random_uuid(),
  month    date not null check (extract(day from month) = 1),
  line     text not null,
  row_kind text not null check (row_kind in ('wip_open','input','premium','kw2','waste','wip_close','sample','output',
                                             'output_fg','sample_fg','input_fcc_premium','input_kw2_fcc','input_kw2_ubi')),
  qty      numeric(14,3) not null,
  unit     text not null default 'kg',
  line_key text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

create table if not exists public.cogm_material (
  id             uuid primary key default gen_random_uuid(),
  month          date not null check (extract(day from month) = 1),
  line           text not null,
  item_name      text not null,
  item_code      text,
  material_group text,                       -- card group (Raw materials, Oil, CNG, Material-others, FCC, KW2, EXT, …)
  qty            numeric(18,4),
  unit           text,
  price_card     numeric(18,4),
  value_card     numeric(18,2) not null,
  line_key       text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

create table if not exists public.driver_month (
  id        uuid primary key default gen_random_uuid(),
  month     date not null check (extract(day from month) = 1),
  line      text not null,
  driver    text not null check (driver in ('man_hour','hours_paid','kg_peeled','kwh','machine_hour')),
  value     numeric(18,4) not null,
  estimated boolean not null default false,  -- D11 / Q16: UU machine driver estimated from the kWh ratio
  line_key  text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-------------------------------------------------------------------------------- LK control figures
create table if not exists public.fs_control (
  id         uuid primary key default gen_random_uuid(),
  month      date not null check (extract(day from month) = 1),
  key        text not null check (key in ('revenue_4101_007','material_usage','conversion_16','cogs',
                                          'inv_1106_001_close','inv_1106_002_open','inv_1106_002_close',
                                          'inv_1106_003_open','inv_1106_003_close')),
  amount     numeric(18,2) not null,
  source_ref text,
  line_key   text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-------------------------------------------------------------------------------- keys, indexes, stamps, audit, RLS
do $$
declare t text;
begin
  foreach t in array array['gl_month','gl_voucher_tag','payroll_month','payroll_journal','inventory_valuation',
    'sales_by_item','average_price','cogm_card','cogm_material','driver_month','fs_control'] loop
    execute format('create unique index if not exists %I on public.%I (month, line_key) where deleted_at is null', t || '_line_key', t);
    execute format('create index if not exists %I on public.%I (month)', t || '_month_idx', t);
    execute format('create index if not exists %I on public.%I (upload_id)', t || '_upload_idx', t);
    execute format('create or replace trigger stamp before insert or update on public.%I for each row execute function private.tg_stamp()', t);
    execute format('create or replace trigger audit after insert or update or delete on public.%I for each row execute function private.tg_audit()', t);
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_select') then
      execute format('create policy %I on public.%I for select to authenticated using ((select public.has_role(''admin'',''finance'',''cost_accounting'')))',
        t || '_select', t);
    end if;
  end loop;
end $$;

-- Writers per upload kind (PRD §5). No hard delete: removing a row is a soft delete (update deleted_at).
do $$
declare p record;
begin
  for p in select * from (values
    ('gl_month',            '''admin'',''finance'''),
    ('gl_voucher_tag',      '''admin'',''finance'''),
    ('payroll_month',       '''admin'',''finance'''),
    ('payroll_journal',     '''admin'',''finance'''),
    ('inventory_valuation', '''admin'',''finance'''),
    ('sales_by_item',       '''admin'',''finance'''),
    ('average_price',       '''admin'',''finance'''),
    ('fs_control',          '''admin'',''finance'''),
    ('cogm_card',           '''admin'',''cost_accounting'''),
    ('cogm_material',       '''admin'',''cost_accounting'''),
    ('driver_month',        '''admin'',''cost_accounting''')
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

-------------------------------------------------------------------------------- BP lock (Q4)
-- A BP version's lines change only while the version is draft, or locked but not yet imported (the budget_bp upload
-- fills the lines, then sets imported_at in the same transaction). After that the version is frozen.
create or replace function private.tg_budget_line_guard() returns trigger
language plpgsql set search_path = '' as $$
declare st text; imp timestamptz;
begin
  if tg_op = 'UPDATE' and new.budget_version_id is distinct from old.budget_version_id then
    raise exception 'Baris budget tidak boleh dipindah ke versi lain';
  end if;
  select v.status, v.imported_at into st, imp from public.budget_version v where v.id = coalesce(new.budget_version_id, old.budget_version_id);
  if st = 'locked' and imp is not null then
    raise exception 'Versi budget sudah dikunci dan diimpor; impor sebagai versi baru' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;

create or replace function private.tg_budget_version_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.status = 'locked' and old.imported_at is not null
     and (new.status is distinct from old.status or new.imported_at is distinct from old.imported_at or new.name is distinct from old.name) then
    raise exception 'Versi budget % sudah dikunci dan diimpor', old.name using errcode = '42501';
  end if;
  return new;
end $$;

create or replace trigger guard before insert or update or delete on public.budget_line for each row execute function private.tg_budget_line_guard();
create or replace trigger guard before insert or update or delete on public.budget_pool_map for each row execute function private.tg_budget_line_guard();
create or replace trigger guard before update on public.budget_version for each row execute function private.tg_budget_version_guard();

-------------------------------------------------------------------------------- upload targets
-- Fase 0 master targets + B1 inputs + the version rows that budget_bp / std_master create or stamp.
create or replace function public.upload_tables() returns text[]
language sql immutable set search_path = '' as $$
  select array['material_item','sku','coa_pool_map','assumption','budget_version','budget_line','budget_pool_map',
               'std_version','bom_line','output_mix','routing','rate_card','capacity',
               'gl_month','gl_voucher_tag','payroll_month','payroll_journal','inventory_valuation','sales_by_item',
               'average_price','cogm_card','cogm_material','driver_month','fs_control']::text[]
$$;

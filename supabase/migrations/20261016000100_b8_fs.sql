-- B8 FS: neraca, laba rugi, arus kas (PRD v2 §4.11, §5.1–§5.5; Fase 1b). Idempotent and additive only.
-- Inputs: tb_month (TB/LK Accurate per account), history_fs_line (BP sheet "BMG Business Plan" column Actual),
-- budget_fs_line (same sheet, column BP, per budget version). Master: fs_line (presentation lines = BP rows),
-- coa_fs_map (account → fs_line, effective-dated like coa_pool_map). Data marts written by the FS rebuild:
-- fs_month, nwc_month, cashflow_month, fs_check_month. Flag b8_fs (default off).

insert into public.app_setting (key, value, description) values
  ('b8_fs', 'false', 'B8 FS: neraca, laba rugi, arus kas, modal kerja (Fase 1b)')
on conflict (key) do nothing;

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

-------------------------------------------------------------------------------- seed
-- >>> generated by packages/engine/scripts/fs-seed-sql.ts (do not edit by hand)
insert into public.fs_line (code, statement, section, kind, label_id, label_en, bp_row, source_label, sum_codes, level, summary, sort_order) values
  ('pl.revenue_gross', 'pl', 'revenue', 'leaf', 'Pendapatan kotor', 'Revenue - Gross', 9, 'Revenue - Gross', null, 1, false, 1),
  ('pl.revenue.fcc', 'pl', 'revenue', 'memo', 'FCC', 'FCC', 10, 'FCC', null, 2, false, 2),
  ('pl.revenue.uu', 'pl', 'revenue', 'memo', 'Ubi ungu', 'Ubi Ungu', 11, 'Ubi Ungu', null, 2, false, 3),
  ('pl.revenue.uo', 'pl', 'revenue', 'memo', 'Ubi orange', 'Ubi Orange', 12, 'Ubi Orange', null, 2, false, 4),
  ('pl.revenue.others', 'pl', 'revenue', 'memo', 'Lain-lain', 'Others (actual: retail & maklon per invoice; projection: model total operating revenue less the three products) | Others (MBS, Nutrifood, Koperasi, Lembutan, maklon & merek)', 13, 'Others (actual: retail & maklon per invoice; projection: model total operating revenue less the three products) | Others (MBS, Nutrifood, Koperasi, Lembutan, maklon & merek)', null, 2, false, 5),
  ('pl.sales_discount_return', 'pl', 'revenue', 'total', 'Diskon dan retur penjualan', 'Sales Discount and Return', 14, 'Sales Discount and Return', array['pl.sales_discount','pl.sales_return']::text[], 1, false, 6),
  ('pl.sales_discount', 'pl', 'revenue', 'leaf', 'Diskon penjualan', 'Sales Discount', 15, 'Sales Discount', null, 2, false, 7),
  ('pl.sales_return', 'pl', 'revenue', 'leaf', 'Retur penjualan', 'Sales Return', 16, 'Sales Return', null, 2, false, 8),
  ('pl.revenue', 'pl', 'revenue', 'total', 'Pendapatan', 'Revenue', 17, 'Revenue', array['pl.revenue_gross','pl.sales_discount_return']::text[], 0, true, 9),
  ('pl.cogs_card.fcc', 'pl', 'cogs', 'memo', 'HPP FCC (kartu)', 'FCC', 18, 'FCC', null, 2, false, 10),
  ('pl.cogs_card.uu', 'pl', 'cogs', 'memo', 'HPP ubi ungu (kartu)', 'Ubi Ungu', 33, 'Ubi Ungu', null, 2, false, 11),
  ('pl.cogs_card.uo', 'pl', 'cogs', 'memo', 'HPP ubi orange (kartu)', 'Ubi Orange', 48, 'Ubi Orange', null, 2, false, 12),
  ('pl.cogs_card.others', 'pl', 'cogs', 'memo', 'HPP Lain-lain (kartu)', 'COGS - Others', 63, 'COGS - Others', null, 2, false, 13),
  ('pl.cost_of_revenue', 'pl', 'cogs', 'total', 'Harga pokok penjualan', 'Cost of revenue - Product Level', 64, 'Cost of revenue - Product Level', array['pl.cogm_material','pl.dl_basic','pl.dl_thr','pl.dl_bpjs','pl.dl_others','pl.idl_basic','pl.idl_thr','pl.idl_bpjs','pl.electricity','pl.water','pl.factory_household','pl.maint_machinery','pl.maint_factory','pl.maint_factory_equipment','pl.dep_machinery','pl.delivery_cogs','pl.inventory_recon','pl.cogs_others']::text[], 0, true, 14),
  ('pl.cogm_material', 'pl', 'cogs', 'leaf', 'Bahan (COGM bahan jadi)', 'COGM Bahan Jadi', 66, 'COGM Bahan Jadi', null, 1, false, 15),
  ('pl.dl_basic', 'pl', 'cogs', 'leaf', 'Upah langsung pokok', 'DL - Basic Salary (termasuk upah harian pabrik) | DL - Basic Salary', 68, 'DL - Basic Salary (termasuk upah harian pabrik) | DL - Basic Salary', null, 1, false, 16),
  ('pl.dl_thr', 'pl', 'cogs', 'leaf', 'Upah langsung: THR dan bonus', 'DL - THR And Bonus', 69, 'DL - THR And Bonus', null, 1, false, 17),
  ('pl.dl_bpjs', 'pl', 'cogs', 'leaf', 'Upah langsung: BPJS', 'DL - BPJS', 70, 'DL - BPJS', null, 1, false, 18),
  ('pl.dl_others', 'pl', 'cogs', 'leaf', 'Upah langsung lain', 'DL - Others', 71, 'DL - Others', null, 1, false, 19),
  ('pl.idl_basic', 'pl', 'cogs', 'leaf', 'Gaji tidak langsung', 'IDL - Basic Salary (bulanan) | IDL - Basic Salary', 73, 'IDL - Basic Salary (bulanan) | IDL - Basic Salary', null, 1, false, 20),
  ('pl.idl_thr', 'pl', 'cogs', 'leaf', 'Tidak langsung: THR dan bonus', 'IDL - THR and Bonus', 74, 'IDL - THR and Bonus', null, 1, false, 21),
  ('pl.idl_bpjs', 'pl', 'cogs', 'leaf', 'Tidak langsung: BPJS', 'IDL - BPJS', 75, 'IDL - BPJS', null, 1, false, 22),
  ('pl.electricity', 'pl', 'cogs', 'leaf', 'Listrik pabrik', 'Electricity', 76, 'Electricity', null, 1, false, 23),
  ('pl.water', 'pl', 'cogs', 'leaf', 'Air pabrik', 'Water', 77, 'Water', null, 1, false, 24),
  ('pl.factory_household', 'pl', 'cogs', 'leaf', 'Rumah tangga pabrik', 'Biaya Rumah Tangga Pabrik', 78, 'Biaya Rumah Tangga Pabrik', null, 1, false, 25),
  ('pl.maint_machinery', 'pl', 'cogs', 'leaf', 'Pemeliharaan mesin', 'Maintenance - Machinery', 79, 'Maintenance - Machinery', null, 1, false, 26),
  ('pl.maint_factory', 'pl', 'cogs', 'leaf', 'Pemeliharaan pabrik', 'Maintenance - Factory', 80, 'Maintenance - Factory', null, 1, false, 27),
  ('pl.maint_factory_equipment', 'pl', 'cogs', 'leaf', 'Pemeliharaan peralatan pabrik', 'Maintenance - Factory Equipments', 81, 'Maintenance - Factory Equipments', null, 1, false, 28),
  ('pl.dep_machinery', 'pl', 'cogs', 'leaf', 'Penyusutan mesin dan peralatan pabrik', 'Depreciation - Machinery', 82, 'Depreciation - Machinery', null, 1, false, 29),
  ('pl.production_variance', 'pl', 'cogs', 'memo', 'Varian produksi (kartu vs GL)', 'Selisih kartu CoGM vs GL (variance produksi) | Vairance Productions | Variance Produksi (5101-015) - nihil di GL Jan-Agu; masuk matriks bila muncul', 83, 'Selisih kartu CoGM vs GL (variance produksi) | Vairance Productions | Variance Produksi (5101-015) - nihil di GL Jan-Agu; masuk matriks bila muncul', null, 1, false, 30),
  ('pl.delivery_cogs', 'pl', 'cogs', 'leaf', 'Pabrikasi dan pengiriman', 'Delivery Expenses', 84, 'Delivery Expenses', null, 1, false, 31),
  ('pl.inventory_recon', 'pl', 'cogs', 'leaf', 'Rekonsiliasi persediaan ke COGM', 'Inventory Reconciliation to COGM | Inventory Reconciliation to COGM (KW 2, mutasi WIP & FG, penyesuaian ke GL)', 85, 'Inventory Reconciliation to COGM | Inventory Reconciliation to COGM (KW 2, mutasi WIP & FG, penyesuaian ke GL)', null, 1, false, 32),
  ('pl.cogs_others', 'pl', 'cogs', 'leaf', 'HPP lain', 'COGS - Others | COGS - Others (sudah termasuk di baris jenis biaya di atas)', 86, 'COGS - Others | COGS - Others (sudah termasuk di baris jenis biaya di atas)', null, 1, false, 33),
  ('pl.cost_of_revenue_blended', 'pl', 'cogs', 'memo', 'HPP gabungan (BP)', 'Cost of revenue - blended', 87, 'Cost of revenue - blended', null, 1, false, 34),
  ('pl.gross_profit', 'pl', 'gp', 'total', 'Laba kotor', 'Gross profit', 89, 'Gross profit', array['pl.revenue','pl.cost_of_revenue']::text[], 0, true, 35),
  ('pl.delivery_selling', 'pl', 'opex', 'leaf', 'Ongkos kirim penjualan', 'Delivery Expenses - SE', 95, 'Delivery Expenses - SE', null, 1, false, 36),
  ('pl.commission', 'pl', 'opex', 'leaf', 'Komisi', 'Commission Expenses', 96, 'Commission Expenses', null, 1, false, 37),
  ('pl.other_selling', 'pl', 'opex', 'leaf', 'Beban penjualan lain', 'Other selling Expense', 97, 'Other selling Expense', null, 1, false, 38),
  ('pl.salaries_ga', 'pl', 'opex', 'leaf', 'Gaji dan tunjangan kantor', 'Salaries and allowance', 99, 'Salaries and allowance', null, 1, false, 39),
  ('pl.delivery_ga', 'pl', 'opex', 'leaf', 'Ongkos kirim umum', 'Delivery Expenses', 100, 'Delivery Expenses', null, 1, false, 40),
  ('pl.maintenance_ga', 'pl', 'opex', 'leaf', 'Pemeliharaan', 'Maintenance Expenses', 101, 'Maintenance Expenses', null, 1, false, 41),
  ('pl.communication', 'pl', 'opex', 'leaf', 'Komunikasi', 'Communication Expenses', 102, 'Communication Expenses', null, 1, false, 42),
  ('pl.transport', 'pl', 'opex', 'leaf', 'Transportasi kantor', 'Office Transportation expenses', 103, 'Office Transportation expenses', null, 1, false, 43),
  ('pl.insurance', 'pl', 'opex', 'leaf', 'Asuransi', 'Insurance Expenses', 104, 'Insurance Expenses', null, 1, false, 44),
  ('pl.rent', 'pl', 'opex', 'leaf', 'Sewa', 'Rent Expenses', 105, 'Rent Expenses', null, 1, false, 45),
  ('pl.office_supplies', 'pl', 'opex', 'leaf', 'Keperluan kantor', 'Office Supplies Expenses', 106, 'Office Supplies Expenses', null, 1, false, 46),
  ('pl.representation', 'pl', 'opex', 'leaf', 'Representasi dan sumbangan', 'Representation and Donations', 107, 'Representation and Donations', null, 1, false, 47),
  ('pl.professional', 'pl', 'opex', 'leaf', 'Jasa profesional', 'Professional Expenses', 108, 'Professional Expenses', null, 1, false, 48),
  ('pl.depreciation_opex', 'pl', 'opex', 'leaf', 'Penyusutan non-pabrik', 'Depreciation Expenses', 109, 'Depreciation Expenses', null, 1, false, 49),
  ('pl.tax_permit', 'pl', 'opex', 'leaf', 'Pajak dan perizinan', 'Tax & Permit', 110, 'Tax & Permit', null, 1, false, 50),
  ('pl.opex', 'pl', 'opex', 'total', 'Beban usaha', 'OPEX', 111, 'OPEX', array['pl.delivery_selling','pl.commission','pl.other_selling','pl.salaries_ga','pl.delivery_ga','pl.maintenance_ga','pl.communication','pl.transport','pl.insurance','pl.rent','pl.office_supplies','pl.representation','pl.professional','pl.depreciation_opex','pl.tax_permit']::text[], 0, true, 51),
  ('pl.operating_profit', 'pl', 'op', 'total', 'Laba usaha', 'Operating Profit', 112, 'Operating Profit', array['pl.gross_profit','pl.opex']::text[], 0, true, 52),
  ('pl.finance_income', 'pl', 'other', 'leaf', 'Pendapatan keuangan', 'Finance Income', 113, 'Finance Income', null, 1, false, 53),
  ('pl.finance_expense', 'pl', 'other', 'leaf', 'Beban keuangan', 'Finance Expenses', 114, 'Finance Expenses', null, 1, false, 54),
  ('pl.other_income', 'pl', 'other', 'leaf', 'Pendapatan lain', 'Other income', 115, 'Other income', null, 1, false, 55),
  ('pl.other_expense', 'pl', 'other', 'leaf', 'Beban lain', 'Other Expense', 116, 'Other Expense', null, 1, false, 56),
  ('pl.gain_asset_sale', 'pl', 'other', 'leaf', 'Laba (rugi) jual aset tetap', 'Gain (loss) from sell of fixed assets', 117, 'Gain (loss) from sell of fixed assets', null, 1, false, 57),
  ('pl.ebt', 'pl', 'ebt', 'total', 'Laba sebelum pajak', 'EBT', 118, 'EBT', array['pl.operating_profit','pl.finance_income','pl.finance_expense','pl.other_income','pl.other_expense','pl.gain_asset_sale']::text[], 0, true, 58),
  ('pl.income_tax', 'pl', 'tax', 'leaf', 'Pajak penghasilan', 'Income tax (actual: GL 8300/8100; projection: rate in row 236 x positive EBT)', 119, 'Income tax (actual: GL 8300/8100; projection: rate in row 236 x positive EBT)', null, 1, false, 59),
  ('pl.net_profit', 'pl', 'np', 'total', 'Laba bersih', 'Net profit', 120, 'Net profit', array['pl.ebt','pl.income_tax']::text[], 0, true, 60),
  ('pl.ebit', 'pl', 'memo', 'total', 'EBIT', 'EBIT', 122, 'EBIT', array['pl.operating_profit']::text[], 1, false, 61),
  ('pl.depreciation', 'pl', 'memo', 'total', 'Penyusutan', 'Depreciation', 123, 'Depreciation', array['-pl.depreciation_opex','-pl.dep_machinery']::text[], 1, false, 62),
  ('pl.ebitda', 'pl', 'memo', 'total', 'EBITDA', 'EBITDA', 124, 'EBITDA', array['pl.ebit','pl.depreciation']::text[], 1, false, 63),
  ('wc.trade_receivables', 'wc', 'wc', 'flow', 'Piutang dagang', 'Trade receivables, net', 127, 'Trade receivables, net', null, 1, false, 64),
  ('wc.trade_payables', 'wc', 'wc', 'flow', 'Hutang dagang (negatif)', 'Trade payables (negative)', 128, 'Trade payables (negative)', null, 1, false, 65),
  ('wc.inventories', 'wc', 'wc', 'flow', 'Persediaan', 'Inventories', 129, 'Inventories', null, 1, false, 66),
  ('wc.nwc', 'wc', 'wc', 'flow', 'Modal kerja bersih', 'Net working capital', 130, 'Net working capital', null, 0, false, 67),
  ('wc.delta_cash', 'wc', 'wc', 'flow', 'Efek kas perubahan modal kerja', 'Decrease (increase) in net working capital - cash effect (Jan-26: opening not available)', 131, 'Decrease (increase) in net working capital - cash effect (Jan-26: opening not available)', null, 1, false, 68),
  ('cf.receipts', 'cf', 'cfo', 'flow', 'Penerimaan dari pelanggan', 'Cash receipts from customers', 134, 'Cash receipts from customers', null, 1, false, 69),
  ('cf.revenue', 'cf', 'cfo', 'flow', 'Pendapatan', 'Revenue', 135, 'Revenue', null, 2, false, 70),
  ('cf.d_trade_receivables', 'cf', 'cfo', 'flow', '(Kenaikan) penurunan piutang dagang', '(Increase) decrease in trade receivables', 136, '(Increase) decrease in trade receivables', null, 2, false, 71),
  ('cf.d_prepaid_tax', 'cf', 'cfo', 'flow', '(Kenaikan) penurunan pajak dibayar dimuka', '(Increase) decrease in prepaid taxes', 137, '(Increase) decrease in prepaid taxes', null, 2, false, 72),
  ('cf.d_shareholder_receivables', 'cf', 'cfo', 'flow', '(Kenaikan) penurunan piutang pemegang saham', '(Increase) decrease in shareholders receivables', 138, '(Increase) decrease in shareholders receivables', null, 2, false, 73),
  ('cf.d_customer_deposits', 'cf', 'cfo', 'flow', 'Kenaikan (penurunan) deposit pelanggan', 'Increase (decrease) in customer deposits', 139, 'Increase (decrease) in customer deposits', null, 2, false, 74),
  ('cf.paid_cost_of_revenue', 'cf', 'cfo', 'flow', 'Pembayaran harga pokok', 'Cash paid for cost of revenue', 140, 'Cash paid for cost of revenue', null, 1, false, 75),
  ('cf.cost_of_revenue', 'cf', 'cfo', 'flow', 'Harga pokok penjualan', 'Cost of revenue', 141, 'Cost of revenue', null, 2, false, 76),
  ('cf.addback_direct_labour', 'cf', 'cfo', 'flow', 'Ditambah: upah (dibayar di baris gaji)', 'Add back: direct labour (paid in row 102)', 142, 'Add back: direct labour (paid in row 102)', null, 2, false, 77),
  ('cf.addback_depreciation', 'cf', 'cfo', 'flow', 'Ditambah: penyusutan', 'Add back: depreciation and amortisation (movement in accumulated depreciation, all classes)', 143, 'Add back: depreciation and amortisation (movement in accumulated depreciation, all classes)', null, 2, false, 78),
  ('cf.d_deferred_tax_other', 'cf', 'cfo', 'flow', '(Kenaikan) penurunan pajak tangguhan dan aset lain', '(Increase) decrease in deferred tax and other non-current assets', 144, '(Increase) decrease in deferred tax and other non-current assets', null, 2, false, 79),
  ('cf.d_other_receivables', 'cf', 'cfo', 'flow', '(Kenaikan) penurunan piutang lain', '(Increase) decrease in other receivables', 145, '(Increase) decrease in other receivables', null, 2, false, 80),
  ('cf.d_inventories', 'cf', 'cfo', 'flow', '(Kenaikan) penurunan persediaan', '(Increase) decrease in inventories', 146, '(Increase) decrease in inventories', null, 2, false, 81),
  ('cf.d_advance_payments', 'cf', 'cfo', 'flow', '(Kenaikan) penurunan uang muka', '(Increase) decrease in advance payments', 147, '(Increase) decrease in advance payments', null, 2, false, 82),
  ('cf.d_trade_payables', 'cf', 'cfo', 'flow', 'Kenaikan (penurunan) hutang dagang', 'Increase (decrease) in trade payables', 148, 'Increase (decrease) in trade payables', null, 2, false, 83),
  ('cf.d_other_payables', 'cf', 'cfo', 'flow', 'Kenaikan (penurunan) hutang lain', 'Increase (decrease) in other payables', 149, 'Increase (decrease) in other payables', null, 2, false, 84),
  ('cf.paid_opex', 'cf', 'cfo', 'flow', 'Pembayaran beban usaha', 'Cash paid for operating expenses', 150, 'Cash paid for operating expenses', null, 1, false, 85),
  ('cf.opex', 'cf', 'cfo', 'flow', 'Beban usaha', 'Operating expenses', 151, 'Operating expenses', null, 2, false, 86),
  ('cf.addback_ga_salaries', 'cf', 'cfo', 'flow', 'Ditambah: gaji kantor (dibayar di baris gaji)', 'Add back: G&A salaries and allowances (paid in row 102)', 152, 'Add back: G&A salaries and allowances (paid in row 102)', null, 2, false, 87),
  ('cf.addback_dep_opex', 'cf', 'cfo', 'flow', 'Ditambah: penyusutan di beban usaha', 'Add back: depreciation in operating expenses (already included in row 88)', 153, 'Add back: depreciation in operating expenses (already included in row 88)', null, 2, false, 88),
  ('cf.d_employee_benefits', 'cf', 'cfo', 'flow', 'Kenaikan (penurunan) liabilitas imbalan kerja', 'Increase (decrease) in employee benefit liabilities', 154, 'Increase (decrease) in employee benefit liabilities', null, 2, false, 89),
  ('cf.d_accrued', 'cf', 'cfo', 'flow', 'Kenaikan (penurunan) biaya masih harus dibayar', 'Increase (decrease) in accrued expenses', 155, 'Increase (decrease) in accrued expenses', null, 2, false, 90),
  ('cf.d_prepaid_expenses', 'cf', 'cfo', 'flow', '(Kenaikan) penurunan biaya dibayar dimuka', '(Increase) decrease in prepaid expenses', 156, '(Increase) decrease in prepaid expenses', null, 2, false, 91),
  ('cf.salaries_paid', 'cf', 'cfo', 'flow', 'Gaji dan upah dibayar', 'Salaries and benefits paid (direct labour + G&A)', 157, 'Salaries and benefits paid (direct labour + G&A)', null, 1, false, 92),
  ('cf.tax_paid', 'cf', 'cfo', 'flow', 'Pajak dibayar', 'Income tax paid (tax expense adjusted for change in tax payables)', 158, 'Income tax paid (tax expense adjusted for change in tax payables)', null, 1, false, 93),
  ('cf.finance_other_net', 'cf', 'cfo', 'flow', 'Pendapatan keuangan dan lain-lain, bersih', 'Finance income and other income (expenses), net', 159, 'Finance income and other income (expenses), net', null, 1, false, 94),
  ('cf.cfo', 'cf', 'cfo', 'flow', 'Arus kas operasi', 'Cash flow from operating activities', 161, 'Cash flow from operating activities', null, 0, false, 95),
  ('cf.capex_machinery', 'cf', 'cfi', 'flow', 'Penambahan mesin dan peralatan pabrik', 'Additions of machinery and factory equipment', 163, 'Additions of machinery and factory equipment', null, 1, false, 96),
  ('cf.capex_vehicles', 'cf', 'cfi', 'flow', 'Penambahan kendaraan', 'Additions of vehicles', 164, 'Additions of vehicles', null, 1, false, 97),
  ('cf.capex_buildings', 'cf', 'cfi', 'flow', 'Penambahan bangunan', 'Additions of buildings', 165, 'Additions of buildings', null, 1, false, 98),
  ('cf.capex_office', 'cf', 'cfi', 'flow', 'Penambahan inventaris kantor', 'Additions of office furniture and equipment', 166, 'Additions of office furniture and equipment', null, 1, false, 99),
  ('cf.cfi', 'cf', 'cfi', 'flow', 'Arus kas investasi', 'Cash flow from investing activities', 167, 'Cash flow from investing activities', null, 0, false, 100),
  ('cf.lease', 'cf', 'cff', 'flow', 'Pembayaran sewa pembiayaan', 'Lease liability payments (actual: change in lease liability)', 169, 'Lease liability payments (actual: change in lease liability)', null, 1, false, 101),
  ('cf.wc_loan', 'cf', 'cff', 'flow', 'Pinjaman modal kerja (pelunasan)', 'Working capital loan drawdown (repayment)', 170, 'Working capital loan drawdown (repayment)', null, 1, false, 102),
  ('cf.related_party_loan', 'cf', 'cff', 'flow', 'Pinjaman pihak berelasi', 'Related party loan (no balance sheet account - not used)', 171, 'Related party loan (no balance sheet account - not used)', null, 1, false, 103),
  ('cf.shareholder_loan', 'cf', 'cff', 'flow', 'Pinjaman pemegang saham', 'Shareholder loan (no balance sheet account - not used)', 172, 'Shareholder loan (no balance sheet account - not used)', null, 1, false, 104),
  ('cf.bank_loan_repayment', 'cf', 'cff', 'flow', 'Pelunasan pinjaman bank', 'Repayment of bank loan', 173, 'Repayment of bank loan', null, 1, false, 105),
  ('cf.interest_paid', 'cf', 'cff', 'flow', 'Bunga dibayar', 'Interest paid', 174, 'Interest paid', null, 1, false, 106),
  ('cf.equity_movements', 'cf', 'cff', 'flow', 'Setoran modal dan pergerakan ekuitas lain', 'Capital injection and other equity movements (APIC, capital reserve, OCI)', 175, 'Capital injection and other equity movements (APIC, capital reserve, OCI)', null, 1, false, 107),
  ('cf.dividends', 'cf', 'cff', 'flow', 'Dividen dibayar', 'Dividends paid', 176, 'Dividends paid', null, 1, false, 108),
  ('cf.cff', 'cf', 'cff', 'flow', 'Arus kas pendanaan', 'Cash flow from financing activities', 177, 'Cash flow from financing activities', null, 0, false, 109),
  ('cf.net', 'cf', 'net', 'flow', 'Arus kas bersih', 'Net cash flow', 179, 'Net cash flow', null, 0, false, 110),
  ('cf.open', 'cf', 'net', 'flow', 'Kas awal', 'Cash at beginning of period', 180, 'Cash at beginning of period', null, 0, false, 111),
  ('cf.close', 'cf', 'net', 'flow', 'Kas akhir', 'Cash at end of period', 181, 'Cash at end of period', null, 0, false, 112),
  ('bs.cash', 'bs', 'current_asset', 'leaf', 'Kas dan setara kas', 'Cash and cash equivalents', 184, 'Cash and cash equivalents', null, 1, true, 113),
  ('bs.trade_receivables', 'bs', 'current_asset', 'total', 'Piutang dagang', 'Trade Receivables, net', 185, 'Trade Receivables, net', array['bs.trade_receivables_third','bs.trade_receivables_related']::text[], 1, true, 114),
  ('bs.trade_receivables_third', 'bs', 'current_asset', 'leaf', 'Piutang dagang pihak ketiga', 'Trade Receivables - Third Parties', 186, 'Trade Receivables - Third Parties', null, 2, false, 115),
  ('bs.trade_receivables_related', 'bs', 'current_asset', 'leaf', 'Piutang dagang pihak berelasi', 'Trade Receivables - Related Parties', 187, 'Trade Receivables - Related Parties', null, 2, false, 116),
  ('bs.other_receivables', 'bs', 'current_asset', 'total', 'Piutang lain-lain', 'Other receivables', 188, 'Other receivables', array['bs.other_receivables_third','bs.other_receivables_related','bs.shareholder_receivables']::text[], 1, true, 117),
  ('bs.other_receivables_third', 'bs', 'current_asset', 'leaf', 'Piutang lain-lain pihak ketiga', 'Other Receivables - third parties', 189, 'Other Receivables - third parties', null, 2, false, 118),
  ('bs.other_receivables_related', 'bs', 'current_asset', 'leaf', 'Piutang lain-lain pihak berelasi', 'Other Receivables - Related Parties', 190, 'Other Receivables - Related Parties', null, 2, false, 119),
  ('bs.shareholder_receivables', 'bs', 'current_asset', 'leaf', 'Piutang pemegang saham', 'Shareholders Receivables', 191, 'Shareholders Receivables', null, 2, false, 120),
  ('bs.inventories', 'bs', 'current_asset', 'total', 'Persediaan', 'Inventories', 192, 'Inventories', array['bs.inv_raw','bs.inv_wip','bs.inv_fg','bs.inv_technical']::text[], 1, true, 121),
  ('bs.inv_raw', 'bs', 'current_asset', 'leaf', 'Bahan baku', 'Raw Materials', 193, 'Raw Materials', null, 2, false, 122),
  ('bs.inv_wip', 'bs', 'current_asset', 'leaf', 'Barang dalam proses', 'Work in Progress', 194, 'Work in Progress', null, 2, false, 123),
  ('bs.inv_fg', 'bs', 'current_asset', 'leaf', 'Barang jadi', 'Finished Goods', 195, 'Finished Goods', null, 2, false, 124),
  ('bs.inv_technical', 'bs', 'current_asset', 'leaf', 'Persediaan teknik', 'Tekhnik Supplies', 196, 'Tekhnik Supplies', null, 2, false, 125),
  ('bs.prepaid_expenses', 'bs', 'current_asset', 'total', 'Biaya dibayar dimuka', 'Prepaid expenses', 197, 'Prepaid expenses', array['bs.prepaid_rent','bs.prepaid_insurance','bs.prepaid_thr','bs.prepaid_others']::text[], 1, false, 126),
  ('bs.prepaid_rent', 'bs', 'current_asset', 'leaf', 'Sewa dibayar dimuka', 'Prepaid Rent', 198, 'Prepaid Rent', null, 2, false, 127),
  ('bs.prepaid_insurance', 'bs', 'current_asset', 'leaf', 'Asuransi dibayar dimuka', 'Prepaid Insurance', 199, 'Prepaid Insurance', null, 2, false, 128),
  ('bs.prepaid_thr', 'bs', 'current_asset', 'leaf', 'THR dibayar dimuka', 'Prepaid THR', 200, 'Prepaid THR', null, 2, false, 129),
  ('bs.prepaid_others', 'bs', 'current_asset', 'leaf', 'Dibayar dimuka lain', 'Prepaid Others', 201, 'Prepaid Others', null, 2, false, 130),
  ('bs.prepaid_tax', 'bs', 'current_asset', 'total', 'Pajak dibayar dimuka', 'Prepaid tax', 202, 'Prepaid tax', array['bs.vat_in','bs.prepaid_art21','bs.prepaid_art22','bs.prepaid_art23','bs.prepaid_art25']::text[], 1, false, 131),
  ('bs.vat_in', 'bs', 'current_asset', 'leaf', 'PPN masukan', 'Value Added Tax - In', 203, 'Value Added Tax - In', null, 2, false, 132),
  ('bs.prepaid_art21', 'bs', 'current_asset', 'leaf', 'PPh 21 dibayar dimuka', 'Prepaid Art 21', 204, 'Prepaid Art 21', null, 2, false, 133),
  ('bs.prepaid_art22', 'bs', 'current_asset', 'leaf', 'PPh 22 dibayar dimuka', 'Prepaid Art 22', 205, 'Prepaid Art 22', null, 2, false, 134),
  ('bs.prepaid_art23', 'bs', 'current_asset', 'leaf', 'PPh 23 dibayar dimuka', 'Prepaid Art 23', 206, 'Prepaid Art 23', null, 2, false, 135),
  ('bs.prepaid_art25', 'bs', 'current_asset', 'leaf', 'PPh 25 dibayar dimuka', 'Prepaid Art 25', 207, 'Prepaid Art 25', null, 2, false, 136),
  ('bs.advance_payment', 'bs', 'current_asset', 'leaf', 'Uang muka', 'Advance Payment', 208, 'Advance Payment', null, 1, false, 137),
  ('bs.current_assets', 'bs', 'current_asset', 'total', 'Aset lancar', 'Current asset', 209, 'Current asset', array['bs.cash','bs.trade_receivables','bs.other_receivables','bs.inventories','bs.prepaid_expenses','bs.prepaid_tax','bs.advance_payment']::text[], 0, true, 138),
  ('bs.fa_buildings', 'bs', 'fixed_asset', 'leaf', 'Bangunan', 'Buildings', 212, 'Buildings', null, 2, false, 139),
  ('bs.fa_vehicles', 'bs', 'fixed_asset', 'leaf', 'Kendaraan', 'Vehicles', 213, 'Vehicles', null, 2, false, 140),
  ('bs.fa_office', 'bs', 'fixed_asset', 'leaf', 'Inventaris kantor', 'Office Furniture and Equipment', 214, 'Office Furniture and Equipment', null, 2, false, 141),
  ('bs.fa_factory_equipment', 'bs', 'fixed_asset', 'leaf', 'Inventaris pabrik', 'Factory Equipment', 215, 'Factory Equipment', null, 2, false, 142),
  ('bs.fa_machinery', 'bs', 'fixed_asset', 'leaf', 'Mesin', 'Machinery', 216, 'Machinery', null, 2, false, 143),
  ('bs.ad_buildings', 'bs', 'fixed_asset', 'leaf', 'Akumulasi penyusutan bangunan', 'Acc. Depreciation - Buildings', 218, 'Acc. Depreciation - Buildings', null, 2, false, 144),
  ('bs.ad_vehicles', 'bs', 'fixed_asset', 'leaf', 'Akumulasi penyusutan kendaraan', 'Acc. Depreciation - Vehicles', 219, 'Acc. Depreciation - Vehicles', null, 2, false, 145),
  ('bs.ad_office', 'bs', 'fixed_asset', 'leaf', 'Akumulasi penyusutan inventaris kantor', 'Acc. Depreciation - Office Furniture and Equipment', 220, 'Acc. Depreciation - Office Furniture and Equipment', null, 2, false, 146),
  ('bs.ad_factory_equipment', 'bs', 'fixed_asset', 'leaf', 'Akumulasi penyusutan inventaris pabrik', 'Acc. Depreciation - Factory Equipment', 221, 'Acc. Depreciation - Factory Equipment', null, 2, false, 147),
  ('bs.ad_machinery', 'bs', 'fixed_asset', 'leaf', 'Akumulasi penyusutan mesin', 'Acc. Depreciation - Machinery', 222, 'Acc. Depreciation - Machinery', null, 2, false, 148),
  ('bs.deferred_tax_asset', 'bs', 'fixed_asset', 'leaf', 'Aset pajak tangguhan', 'Deferred Tax Asset', 223, 'Deferred Tax Asset', null, 2, false, 149),
  ('bs.other_assets', 'bs', 'fixed_asset', 'leaf', 'Aset lain', 'Other assets', 224, 'Other assets', null, 2, false, 150),
  ('bs.noncurrent_assets', 'bs', 'fixed_asset', 'total', 'Aset tidak lancar', 'Non-current asset', 225, 'Non-current asset', array['bs.fa_buildings','bs.fa_vehicles','bs.fa_office','bs.fa_factory_equipment','bs.fa_machinery','bs.ad_buildings','bs.ad_vehicles','bs.ad_office','bs.ad_factory_equipment','bs.ad_machinery','bs.deferred_tax_asset','bs.other_assets']::text[], 0, true, 151),
  ('bs.assets', 'bs', 'total_asset', 'total', 'Total aset', 'Assets', 226, 'Assets', array['bs.current_assets','bs.noncurrent_assets']::text[], 0, true, 152),
  ('bs.st_bank_loans', 'bs', 'current_liab', 'leaf', 'Hutang bank jangka pendek', 'Short-term bank loans', 227, 'Short-term bank loans', null, 1, true, 153),
  ('bs.trade_payables', 'bs', 'current_liab', 'total', 'Hutang dagang', 'Trade Payables', 228, 'Trade Payables', array['bs.trade_payables_third','bs.trade_payables_related']::text[], 1, true, 154),
  ('bs.trade_payables_third', 'bs', 'current_liab', 'leaf', 'Hutang dagang pihak ketiga', 'Trade Payables - Third Parties', 229, 'Trade Payables - Third Parties', null, 2, false, 155),
  ('bs.trade_payables_related', 'bs', 'current_liab', 'leaf', 'Hutang dagang pihak berelasi', 'Trade Payables - Related Parties', 230, 'Trade Payables - Related Parties', null, 2, false, 156),
  ('bs.other_payables', 'bs', 'current_liab', 'total', 'Hutang lain-lain', 'Other payables', 231, 'Other payables', array['bs.other_payables_third','bs.other_payables_related']::text[], 1, false, 157),
  ('bs.other_payables_third', 'bs', 'current_liab', 'leaf', 'Hutang lain-lain pihak ketiga', 'Other Payable - Third Parties', 232, 'Other Payable - Third Parties', null, 2, false, 158),
  ('bs.other_payables_related', 'bs', 'current_liab', 'leaf', 'Hutang lain-lain pihak berelasi', 'Other Payable - Related Parties', 233, 'Other Payable - Related Parties', null, 2, false, 159),
  ('bs.tax_payables', 'bs', 'current_liab', 'total', 'Hutang pajak', 'Tax payables', 234, 'Tax payables', array['bs.tax_art21','bs.tax_art22','bs.tax_art23','bs.tax_art25','bs.vat_out','bs.tax_final']::text[], 1, false, 160),
  ('bs.tax_art21', 'bs', 'current_liab', 'leaf', 'Hutang PPh 21', 'Tax Payable - Art 21', 235, 'Tax Payable - Art 21', null, 2, false, 161),
  ('bs.tax_art22', 'bs', 'current_liab', 'leaf', 'Hutang PPh 22', 'Tax Payable - Art 22', 236, 'Tax Payable - Art 22', null, 2, false, 162),
  ('bs.tax_art23', 'bs', 'current_liab', 'leaf', 'Hutang PPh 23', 'Tax Payable - Art 23', 237, 'Tax Payable - Art 23', null, 2, false, 163),
  ('bs.tax_art25', 'bs', 'current_liab', 'leaf', 'Hutang PPh 25', 'Tax Payable - Art 25', 238, 'Tax Payable - Art 25', null, 2, false, 164),
  ('bs.vat_out', 'bs', 'current_liab', 'leaf', 'PPN keluaran', 'Value added Tax - Out', 239, 'Value added Tax - Out', null, 2, false, 165),
  ('bs.tax_final', 'bs', 'current_liab', 'leaf', 'Hutang PPh final', 'Final Tax Payable', 240, 'Final Tax Payable', null, 2, false, 166),
  ('bs.deposit_payable', 'bs', 'current_liab', 'leaf', 'Deposit pelanggan', 'Deposit Payable', 241, 'Deposit Payable', null, 1, false, 167),
  ('bs.accrued', 'bs', 'current_liab', 'total', 'Biaya masih harus dibayar', 'Accrued expenses', 242, 'Accrued expenses', array['bs.accrued_bpjs','bs.accrued_thr','bs.accrued_bonus','bs.accrued_utility','bs.accrued_others']::text[], 1, false, 168),
  ('bs.accrued_bpjs', 'bs', 'current_liab', 'leaf', 'BPJS masih harus dibayar', 'Accrued BPJS', 243, 'Accrued BPJS', null, 2, false, 169),
  ('bs.accrued_thr', 'bs', 'current_liab', 'leaf', 'THR dan bonus masih harus dibayar', 'Accrued THR & Bonus', 244, 'Accrued THR & Bonus', null, 2, false, 170),
  ('bs.accrued_bonus', 'bs', 'current_liab', 'leaf', 'Bonus masih harus dibayar', 'Accrued Bonus', 245, 'Accrued Bonus', null, 2, false, 171),
  ('bs.accrued_utility', 'bs', 'current_liab', 'leaf', 'Utilitas masih harus dibayar', 'Accrued Utility', 246, 'Accrued Utility', null, 2, false, 172),
  ('bs.accrued_others', 'bs', 'current_liab', 'leaf', 'Lain-lain masih harus dibayar', 'Accrued Others', 247, 'Accrued Others', null, 2, false, 173),
  ('bs.current_portion', 'bs', 'current_liab', 'total', 'Bagian lancar', 'Current portion', 248, 'Current portion', array['bs.lease_current']::text[], 1, false, 174),
  ('bs.lease_current', 'bs', 'current_liab', 'leaf', 'Sewa pembiayaan jatuh tempo', 'Current Maturities of Lease Liability', 249, 'Current Maturities of Lease Liability', null, 2, false, 175),
  ('bs.current_liabilities', 'bs', 'current_liab', 'total', 'Liabilitas lancar', 'Current liabilities', 250, 'Current liabilities', array['bs.st_bank_loans','bs.trade_payables','bs.other_payables','bs.tax_payables','bs.deposit_payable','bs.accrued','bs.current_portion']::text[], 0, true, 176),
  ('bs.employee_benefits', 'bs', 'noncurrent_liab', 'leaf', 'Liabilitas imbalan kerja', 'Employee Benefit Liabilities', 251, 'Employee Benefit Liabilities', null, 1, false, 177),
  ('bs.noncurrent_liabilities', 'bs', 'noncurrent_liab', 'total', 'Liabilitas jangka panjang', 'Non-current liabilities', 252, 'Non-current liabilities', array['bs.employee_benefits']::text[], 0, true, 178),
  ('bs.liabilities', 'bs', 'total_liab', 'total', 'Total liabilitas', 'Liabilities', 253, 'Liabilities', array['bs.current_liabilities','bs.noncurrent_liabilities']::text[], 0, true, 179),
  ('bs.net_assets', 'bs', 'net_assets', 'total', 'Aset bersih', 'Net assets', 254, 'Net assets', array['bs.assets','-bs.liabilities']::text[], 0, false, 180),
  ('bs.share_capital', 'bs', 'equity', 'leaf', 'Modal disetor', 'Share Capital', 255, 'Share Capital', null, 1, false, 181),
  ('bs.apic', 'bs', 'equity', 'leaf', 'Tambahan modal disetor', 'Additional paid-in capital (TA)', 256, 'Additional paid-in capital (TA)', null, 1, false, 182),
  ('bs.retained_earnings', 'bs', 'equity', 'leaf', 'Laba ditahan', 'R/E', 257, 'R/E', null, 1, false, 183),
  ('bs.current_profit', 'bs', 'equity', 'leaf', 'Laba tahun berjalan', 'Current profit/loss', 258, 'Current profit/loss', null, 1, true, 184),
  ('bs.capital_reserve', 'bs', 'equity', 'leaf', 'Cadangan modal', 'Capital Reserve', 259, 'Capital Reserve', null, 1, false, 185),
  ('bs.dividend', 'bs', 'equity', 'leaf', 'Dividen', 'Dividend', 260, 'Dividend', null, 1, false, 186),
  ('bs.oci', 'bs', 'equity', 'leaf', 'Penghasilan komprehensif lain', 'OCI', 261, 'OCI', null, 1, false, 187),
  ('bs.equity', 'bs', 'equity', 'total', 'Ekuitas', 'Shareholders'' equity', 262, 'Shareholders'' equity', array['bs.share_capital','bs.apic','bs.retained_earnings','bs.current_profit','bs.capital_reserve','bs.dividend','bs.oci']::text[], 0, true, 188)
on conflict (code) do nothing;

insert into public.coa_fs_map (account, account_name, effective_from, effective_to, fs_line_code, sign, accurate_code, confirmed, note, source) values
  ('1101-001', 'Petty Cash', '2026-01-01', null, 'bs.cash', 1, 'BS 01', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-001', 'PT Bank Central Asia (IDR) a/c 484-0198-877', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-002', 'PT Bank Central Asia (IDR) a/c 484-0198-001', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-003', 'PT Bank Central Asia (USD) a/c 484-0278-111', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-004', 'PT Bank Permata (IDR) a/c 007-01726-626', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-005', 'PT Bank Permata (IDR) a/c 007-02591-201', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-006', 'PT Bank KEB Hana Indonesia (IDR) a/c 140-66438-400', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-007', 'PT Bank Negara Indonesia (IDR) a/c 888-7777-580', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-008', 'PT Bank Negara Indonesia (IDR) a/c 888-7777-546', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-009', 'PT Bank CTBC Indonesia (IDR) a/c 102-018101782-001', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-098', 'Deposit Pajak', '2026-01-01', null, 'bs.cash', 1, 'BS 42', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1102-099', 'Temporary Account (Bank)', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1103-001', 'Ayat Silang Bank - Bank', '2026-01-01', null, 'bs.cash', 1, 'BS 02', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1104-001', 'Deposito', '2026-01-01', null, 'bs.cash', 1, 'BS 03', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1104-002', 'Invesment', '2026-01-01', null, 'bs.cash', 1, 'BS 43', true, 'BP v1 Mapping: Cash and cash equivalents', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-001', 'Piutang Dagang Pihak Ketiga', '2026-01-01', null, 'bs.trade_receivables_third', 1, 'BS 04', true, 'BP v1 Mapping: Trade Receivables - Third Parties', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-002', 'Cadangan Kerugian Piutang', '2026-01-01', null, 'bs.trade_receivables_third', 1, 'BS 04', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-003', 'Piutang Dagang Afiliasi', '2026-01-01', null, 'bs.trade_receivables_related', 1, 'BS 05', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-004', 'Piutang Lain-lain Pihak Ketiga', '2026-01-01', null, 'bs.other_receivables_third', 1, 'BS 06', true, 'BP v1 Mapping: Other Receivables - third parties', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-005', 'Piutang lain-lain Afiliasi', '2026-01-01', null, 'bs.other_receivables_related', 1, 'BS 07', true, 'BP v1 Mapping: Other Receivables - Related Parties', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-006', 'Piutang Pemegang Saham', '2026-01-01', null, 'bs.shareholder_receivables', 1, 'BS 08', true, 'BP v1 Mapping: Shareholders Receivables', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-007', 'Piutang Karyawan', '2026-01-01', null, 'bs.other_receivables_third', 1, 'BS 09', true, 'BP v1 Mapping: Other Receivables - third parties', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-008', 'Piutang Dagang Pihak Ketiga (USD)', '2026-01-01', null, 'bs.trade_receivables_third', 1, 'BS 10', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-097', 'Account Receivable IDR', '2026-01-01', null, 'bs.trade_receivables_third', 1, 'BS 11', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-099', 'Temporary Account', '2026-01-01', null, 'bs.other_receivables_third', 1, 'BS 12', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-1', 'Advance Purchase (IDR)', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 13', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1105-2', 'Advance Purchase (USD)', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 13', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1106-001', 'Persediaan Bahan Baku Pabrik', '2026-01-01', null, 'bs.inv_raw', 1, 'BS 14', true, 'BP v1 Mapping: Raw Materials', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1106-002', 'Persediaan Barang Setengah Jadi Pabrik', '2026-01-01', null, 'bs.inv_wip', 1, 'BS 15', true, 'BP v1 Mapping: Work in Progress', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1106-003', 'Persediaan Barang Jadi Pabrik', '2026-01-01', null, 'bs.inv_fg', 1, 'BS 16', true, 'BP v1 Mapping: Finished Goods', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1106-004', 'Persediaan Tekhnik GP', '2026-01-01', null, 'bs.inv_technical', 1, 'BS 17', true, 'BP v1 Mapping: Tekhnik Supplies', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1106-005', 'Persediaan Tekhnik CP', '2026-01-01', null, 'bs.inv_technical', 1, 'BS 17', true, 'BP v1 Mapping: Tekhnik Supplies', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1110-001', 'Inventory', '2026-01-01', null, 'bs.inv_raw', 1, 'BS 18', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1110-002', 'Inventory In Transit', '2026-01-01', null, 'bs.inv_raw', 1, 'BS 18', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1110-003', 'Inventory In Transit', '2026-01-01', null, 'bs.inv_raw', 1, 'BS 18', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1110-004', 'Inventory Transfer Adjustment', '2026-01-01', null, 'bs.inv_raw', 1, 'BS 18', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1107-001', 'Sewa Dibayar Dimuka', '2026-01-01', null, 'bs.prepaid_rent', 1, 'BS 19', true, 'BP v1 Mapping: Prepaid Rent', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1107-002', 'Asuransi Dibayar Dimuka', '2026-01-01', null, 'bs.prepaid_insurance', 1, 'BS 19', true, 'BP v1 Mapping: Prepaid Insurance', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1107-003', 'Biaya Lain-lain Dibayar Dimuka', '2026-01-01', null, 'bs.prepaid_thr', 1, 'BS 19', true, 'BP v1 Mapping: Prepaid THR', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1107-004', 'THR Dibayar Dimuka', '2026-01-01', null, 'bs.prepaid_others', 1, 'BS 19', true, 'BP v1 Mapping: Prepaid Others', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1108-001', 'PPh Pasal 22', '2026-01-01', null, 'bs.prepaid_art22', 1, 'BS 20', true, 'BP v1 Mapping: Prepaid Art 22', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1108-002', 'PPh Pasal 23', '2026-01-01', null, 'bs.prepaid_art23', 1, 'BS 20', true, 'BP v1 Mapping: Prepaid Art 23', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1108-003', 'PPh Pasal 25', '2026-01-01', null, 'bs.prepaid_art25', 1, 'BS 20', true, 'BP v1 Mapping: Prepaid Art 25', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1108-004', 'PPN Masukan', '2026-01-01', null, 'bs.vat_in', 1, 'BS 20', true, 'BP v1 Mapping: Value Added Tax - In', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1108-005', 'PPh Pasal 21', '2026-01-01', null, 'bs.prepaid_art21', 1, 'BS 20', true, 'BP v1 Mapping: Prepaid Art 21', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-001', 'Uang Muka Barang Dagang', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', true, 'BP v1 Mapping: Advance Payment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-002', 'Uang Muka - Project', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-003', 'Cash Advance Besar', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', true, 'BP v1 Mapping: Advance Payment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-004', 'Cash Advance Purchasing', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', true, 'BP v1 Mapping: Advance Payment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-005', 'Cash Advance Operasional', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', true, 'BP v1 Mapping: Advance Payment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-006', 'Cash Advance GA', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', true, 'BP v1 Mapping: Advance Payment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-007', 'Cash Advance PPIC', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', true, 'BP v1 Mapping: Advance Payment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-008', 'Cash Advance Gaji Harian', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', true, 'BP v1 Mapping: Advance Payment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-009', 'Cash Advance BPJS', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', true, 'BP v1 Mapping: Advance Payment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1109-010', 'Uang Muka Barang Non Dagang', '2026-01-01', null, 'bs.advance_payment', 1, 'BS 21', true, 'BP v1 Mapping: Advance Payment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1203-001', 'Asset Pajak Tangguhan', '2026-01-01', null, 'bs.deferred_tax_asset', 1, 'BS 22', true, 'BP v1 Mapping: Deferred Tax Asset', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1203-002', 'Temporary Fixed Asset', '2026-01-01', null, 'bs.other_assets', 1, 'BS 23', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-001', 'Bangunan', '2026-01-01', null, 'bs.fa_buildings', 1, 'BS 23', true, 'BP v1 Mapping: Buildings', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-002', 'Kendaraan Gol 1', '2026-01-01', null, 'bs.fa_vehicles', 1, 'BS 23', true, 'BP v1 Mapping: Vehicles', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-003', 'Kendaraan Gol 2', '2026-01-01', null, 'bs.fa_vehicles', 1, 'BS 23', true, 'BP v1 Mapping: Vehicles', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-004', 'Inventaris Kantor Gol 1', '2026-01-01', null, 'bs.fa_office', 1, 'BS 23', true, 'BP v1 Mapping: Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-005', 'Inventaris Kantor Gol 2', '2026-01-01', null, 'bs.fa_office', 1, 'BS 23', true, 'BP v1 Mapping: Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-006', 'Inventaris Pabrik Gol 1', '2026-01-01', null, 'bs.fa_factory_equipment', 1, 'BS 23', true, 'BP v1 Mapping: Factory Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-007', 'Inventaris Pabrik Gol 2', '2026-01-01', null, 'bs.fa_factory_equipment', 1, 'BS 23', true, 'BP v1 Mapping: Factory Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-008', 'Mesin Gol 1', '2026-01-01', null, 'bs.fa_machinery', 1, 'BS 23', true, 'BP v1 Mapping: Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-009', 'Mesin Gol 2', '2026-01-01', null, 'bs.fa_machinery', 1, 'BS 23', true, 'BP v1 Mapping: Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-010', 'Komputer Software', '2026-01-01', null, 'bs.fa_office', 1, 'BS 23', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-011', 'Inventaris Kantor Gol 1 (Value)', '2026-01-01', null, 'bs.fa_office', 1, 'BS 23', true, 'BP v1 Mapping: Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-012', 'Inventaris Kantor Gol 2 (Value)', '2026-01-01', null, 'bs.fa_office', 1, 'BS 23', true, 'BP v1 Mapping: Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-013', 'Inventaris Pabrik Gol 1 (Value)', '2026-01-01', null, 'bs.fa_factory_equipment', 1, 'BS 23', true, 'BP v1 Mapping: Factory Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-014', 'Inventaris Pabrik Gol 2 (Value)', '2026-01-01', null, 'bs.fa_factory_equipment', 1, 'BS 23', true, 'BP v1 Mapping: Factory Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-015', 'Mesin Gol 1 (Value)', '2026-01-01', null, 'bs.fa_machinery', 1, 'BS 23', true, 'BP v1 Mapping: Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-016', 'Mesin Gol 2 (Value)', '2026-01-01', null, 'bs.fa_machinery', 1, 'BS 23', true, 'BP v1 Mapping: Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-017', 'Komputer Software (Value)', '2026-01-01', null, 'bs.fa_office', 1, 'BS 23', true, 'BP v1 Mapping: Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-018', 'Kendaraan Gol 1 (Value)', '2026-01-01', null, 'bs.fa_vehicles', 1, 'BS 23', true, 'BP v1 Mapping: Vehicles', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-019', 'Kendaraan Gol 2 (Value)', '2026-01-01', null, 'bs.fa_vehicles', 1, 'BS 23', true, 'BP v1 Mapping: Vehicles', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1201-020', 'Bangunan Value', '2026-01-01', null, 'bs.fa_buildings', 1, 'BS 23', true, 'BP v1 Mapping: Buildings', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-001', 'Akum. Peny. Bangunan', '2026-01-01', null, 'bs.ad_buildings', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Buildings', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-002', 'Akum. Peny. Kendaraan Gol 1', '2026-01-01', null, 'bs.ad_vehicles', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Vehicles', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-003', 'Akum. Peny. Kendaraan Gol 2', '2026-01-01', null, 'bs.ad_vehicles', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Vehicles', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-004', 'Akum. Peny. Inventaris Kantor Gol 1', '2026-01-01', null, 'bs.ad_office', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-005', 'Akum. Peny. Inventaris Kantor Gol 2', '2026-01-01', null, 'bs.ad_office', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-006', 'Akum. Peny. Inventaris Pabrik Gol 1', '2026-01-01', null, 'bs.ad_factory_equipment', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Factory Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-007', 'Akum. Peny. Inventaris Pabrik Gol 2', '2026-01-01', null, 'bs.ad_factory_equipment', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Factory Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-008', 'Akum. Peny. Mesin Gol 1', '2026-01-01', null, 'bs.ad_machinery', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-009', 'Akum. Peny. Mesin Gol 2', '2026-01-01', null, 'bs.ad_machinery', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-010', 'Akum. Peny. Komputer Software', '2026-01-01', null, 'bs.ad_office', 1, 'BS 40', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-011', 'Akum. Peny. Inventaris Kantor Gol 1 (Value)', '2026-01-01', null, 'bs.ad_office', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-012', 'Akum. Peny. Inventaris Kantor Gol 2 (Value)', '2026-01-01', null, 'bs.ad_office', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-013', 'Akum. Peny. Inventaris Pabrik Gol 1 (Value)', '2026-01-01', null, 'bs.ad_factory_equipment', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Factory Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-014', 'Akum. Peny. Inventaris Pabrik Gol 2 (Value)', '2026-01-01', null, 'bs.ad_factory_equipment', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Factory Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-015', 'Akum. Peny. Mesin Gol 1 (Value)', '2026-01-01', null, 'bs.ad_machinery', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-016', 'Akum. Peny. Mesin Gol 2 (Value)', '2026-01-01', null, 'bs.ad_machinery', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-017', 'Akum. Peny. Komputer Software (Value)', '2026-01-01', null, 'bs.ad_office', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Office Furniture and Equipment', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-018', 'Akum. Peny. Kendaraan Gol 1 (Value)', '2026-01-01', null, 'bs.ad_vehicles', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Vehicles', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-019', 'Akum. Peny. Kendaraan Gol 2 (Value)', '2026-01-01', null, 'bs.ad_vehicles', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Vehicles', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('1202-020', 'Akum. Peny. Bangunan (Value)', '2026-01-01', null, 'bs.ad_buildings', 1, 'BS 40', true, 'BP v1 Mapping: Acc. Depreciation - Buildings', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-001', 'Hutang Dagang Pihak Ketiga', '2026-01-01', null, 'bs.trade_payables_third', -1, 'BS 24', true, 'BP v1 Mapping: Trade Payables - Third Parties', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-002', 'Hutang Dagang Afiliasi', '2026-01-01', null, 'bs.trade_payables_related', -1, 'BS 25', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-003', 'Hutang Lain-lain Pihak Ketiga', '2026-01-01', null, 'bs.other_payables_third', -1, 'BS 26', true, 'BP v1 Mapping: Other Payable - Third Parties', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-004', 'Hutang Lain-lain Afiliasi', '2026-01-01', null, 'bs.other_payables_related', -1, 'BS 27', true, 'BP v1 Mapping: Other Payable - Related Parties', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-005', 'Deposit Customer', '2026-01-01', null, 'bs.deposit_payable', -1, 'BS 28', true, 'BP v1 Mapping: Deposit Payable', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-006', 'Cadangan Packaging', '2026-01-01', null, 'bs.other_payables_third', -1, 'BS 28', true, 'BP v1 Mapping: Other Payable - Third Parties', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-007', 'Hutang Pemegang Saham', '2026-01-01', null, 'bs.other_payables_related', -1, 'BS 29', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-008', 'Hutang Leasing Jangka Pendek', '2026-01-01', null, 'bs.lease_current', -1, 'BS 30', true, 'BP v1 Mapping: Current Maturities of Lease Liability', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-009', 'BYMHD Listrik', '2026-01-01', null, 'bs.accrued_others', -1, 'BS 31', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-010', 'BYMHD Telepon, Internet, & Fax', '2026-01-01', null, 'bs.accrued_others', -1, 'BS 31', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-011', 'BYMHD Gaji, THR, & Bonus', '2026-01-01', null, 'bs.accrued_others', -1, 'BS 31', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-012', 'BYMHD BPJS', '2026-01-01', null, 'bs.accrued_others', -1, 'BS 31', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-013', 'Hutang Lain-lain Pihak Ketiga (USD)', '2026-01-01', null, 'bs.accrued_others', -1, 'BS 26', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-014', 'Hutang Bank Jangka Pendek', '2026-01-01', null, 'bs.st_bank_loans', -1, 'BS 36', true, 'BP v1 Mapping: Short-term bank loans', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-015', 'Hutang Deviden', '2026-01-01', null, 'bs.accrued_others', -1, null, true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2101-099', 'BYMHD Lain-lain', '2026-01-01', null, 'bs.accrued_others', -1, 'BS 31', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('210102', 'Account Payable IDR', '2026-01-01', null, 'bs.accrued_others', -1, null, true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-1', 'Advance Sales (IDR)', '2026-01-01', null, 'bs.accrued_others', -1, null, true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-2', 'Advance Sales (USD)', '2026-01-01', null, 'bs.accrued_others', -1, null, true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2201-001', 'Hutang Leasing Jangka Panjang', '2026-01-01', null, 'bs.accrued_others', -1, 'BS 32', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-001', 'Hutang PPh Pasal 21', '2026-01-01', null, 'bs.tax_art21', -1, 'BS 33', true, 'BP v1 Mapping: Tax Payable - Art 21', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-002', 'Hutang PPh Pasal 22', '2026-01-01', null, 'bs.tax_art22', -1, 'BS 33', true, 'BP v1 Mapping: Tax Payable - Art 22', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-003', 'Hutang PPh Pasal 23', '2026-01-01', null, 'bs.tax_art23', -1, 'BS 33', true, 'BP v1 Mapping: Tax Payable - Art 23', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-004', 'Hutang PPh Pasal 25', '2026-01-01', null, 'bs.tax_art25', -1, 'BS 33', true, 'BP v1 Mapping: Tax Payable - Art 25', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-009', 'Hutang PPh Pasal 26', '2026-01-01', null, 'bs.tax_art25', -1, 'BS 33', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-005', 'Hutang PPN Keluaran', '2026-01-01', null, 'bs.vat_out', -1, 'BS 33', true, 'BP v1 Mapping: Value added Tax - Out', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-006', 'Passiva Pajak Tangguhan', '2026-01-01', null, 'bs.tax_final', -1, 'BS 33', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-007', 'Hutang PPh Final', '2026-01-01', null, 'bs.tax_final', -1, 'BS 33', true, 'BP v1 Mapping: Final Tax Payable', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2102-008', 'Hutang PPh Pasal 29', '2026-01-01', null, 'bs.tax_art25', -1, 'BS 33', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2103-002', 'BYMHD Listrik', '2026-01-01', null, 'bs.accrued_utility', -1, 'BS 34', true, 'BP v1 Mapping: Accrued Utility', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2103-003', 'BYMHD Telepon, Internet & Fax', '2026-01-01', null, 'bs.accrued_utility', -1, 'BS 34', true, 'BP v1 Mapping: Accrued Utility', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2103-004', 'BYMHD BPJS', '2026-01-01', null, 'bs.accrued_others', -1, 'BS 34', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2103-005', 'BYMHD Gaji, THR, & Bonus', '2026-01-01', null, 'bs.accrued_thr', -1, 'BS 34', true, 'BP v1 Mapping: Accrued THR & Bonus', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2103-006', 'BYMHD Lain-lain', '2026-01-01', null, 'bs.accrued_others', -1, 'BS 34', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2103-007', 'Unbilled Vendor (Outstanding GR)', '2026-01-01', null, 'bs.accrued_others', -1, null, true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2201-002', 'Hutang Imbalan Pasca Kerja Jk Panjang', '2026-01-01', null, 'bs.employee_benefits', -1, 'BS 35', true, 'BP v1 Mapping: Employee Benefit Liabilities', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('2201-003', 'Hutang Bank Jangka Panjang', '2026-01-01', null, 'bs.st_bank_loans', -1, 'BS 36', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('3101-001', 'Modal Disetor', '2026-01-01', null, 'bs.share_capital', -1, 'BS 37', true, 'BP v1 Mapping: Shareholder Equity', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('3101-002', 'Laba Ditahan', '2026-01-01', null, 'bs.retained_earnings', -1, 'BS 38', true, 'BP v1 Mapping: - Beginning retained earnings', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('3101-003', 'Laba Ditahan OCI (BS)', '2026-01-01', null, 'bs.oci', -1, 'BS 38', true, 'BP v1 Mapping: - Beginning - OCI', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('3101-004', 'Laba (Rugi) Tahun Berjalan', '2026-01-01', null, 'bs.retained_earnings', -1, 'BS 38', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('3101-005', 'Openning Balance Equity', '2026-01-01', null, 'bs.retained_earnings', -1, 'BS 38', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('3101-006', 'Deviden', '2026-01-01', null, 'bs.dividend', -1, 'BS 41', true, 'BP v1 Mapping: Dividend', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('3101-007', 'Cadangan Modal', '2026-01-01', null, 'bs.capital_reserve', -1, 'BS 44', true, 'BP v1 Mapping: Capital Reserves', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx BS Actual MTM - Aug 26'),
  ('4101-001', 'Penjualan Barang Pabrik', '2026-01-01', null, 'pl.revenue_gross', -1, 'PL 01', true, 'BP v1 Mapping: Revenue', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('4101-002', 'Penjualan Lain-lain', '2026-01-01', null, 'pl.revenue_gross', -1, 'PL 01', true, 'BP v1 Mapping: Revenue', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('4101-003', 'Retur Penjualan Barang Pabrik', '2026-01-01', null, 'pl.sales_return', -1, 'PL 02', true, 'BP v1 Mapping: Sales Return', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('4101-004', 'Sales Returns', '2026-01-01', null, 'pl.revenue_gross', -1, 'PL 02', true, 'BP v1 Mapping: Revenue', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('4101-005', 'Sales Discount', '2026-01-01', null, 'pl.revenue_gross', -1, 'PL 03', true, 'BP v1 Mapping: Revenue', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('4101-006', 'Diskon Penjualan', '2026-01-01', null, 'pl.revenue_gross', -1, 'PL 03', true, 'BP v1 Mapping: Revenue', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('4101-007', 'Penjualan', '2026-01-01', null, 'pl.revenue_gross', -1, 'PL 01', true, 'BP v1 Mapping: Revenue', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('4102', 'Sales Term Discount', '2026-01-01', null, 'pl.revenue_gross', -1, 'PL 03', true, 'BP v1 Mapping: Revenue', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('4103', 'Sales Term Discount (USD)', '2026-01-01', null, 'pl.revenue_gross', -1, 'PL 03', true, 'BP v1 Mapping: Revenue', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-001', 'COGM - Bahan Jadi', '2026-01-01', null, 'pl.cogm_material', -1, 'PL 04', true, 'BP v1 Mapping: COGM Bahan Jadi', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-002', 'COGM - DL - Biaya Upah Langsung Pabrik', '2026-01-01', null, 'pl.dl_basic', -1, 'PL 05', true, 'BP v1 Mapping: DL - Basic Salary', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-003', 'COGM - DL - THR & Bonus Pabrik', '2026-01-01', null, 'pl.dl_thr', -1, 'PL 05', true, 'BP v1 Mapping: DL - THR And Bonus', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-004', 'COGM - DL - Pesangon Pabrik', '2026-01-01', null, 'pl.dl_others', -1, 'PL 05', true, 'BP v1 Mapping: DL - Others', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-005', 'COGM - DL - Biaya Jamsostek Pabrik', '2026-01-01', null, 'pl.dl_bpjs', -1, 'PL 05', true, 'BP v1 Mapping: DL - BPJS', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-006', 'COGM - OHP - Biaya Listrik Pabrik', '2026-01-01', null, 'pl.electricity', -1, 'PL 06', true, 'BP v1 Mapping: Electricity', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-007', 'COGM - OHP - Biaya Air Pabrik', '2026-01-01', null, 'pl.water', -1, 'PL 07', true, 'BP v1 Mapping: Water', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-008', 'COGM - OHP - Biaya Utilitas Pabrik', '2026-01-01', null, 'pl.cogm_material', -1, 'PL 08', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-009', 'COGM - OHP - Biaya Rumah Tangga Pabrik', '2026-01-01', null, 'pl.factory_household', -1, 'PL 09', true, 'BP v1 Mapping: Biaya Rumah Tangga Pabrik', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-010', 'COGM - OHP - Biaya Perbaikan & Pemeliharaan Mesin', '2026-01-01', null, 'pl.maint_machinery', -1, 'PL 10', true, 'BP v1 Mapping: Maintenance - Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-011', 'COGM - OHP - Biaya Perbaikan & Pemeliharaan Pabrik', '2026-01-01', null, 'pl.maint_factory', -1, 'PL 10', true, 'BP v1 Mapping: Maintenance - Factory', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-012', 'COGM - OHP - Biaya Perbaikan & Pemeliharaan Inventaris Pabri', '2026-01-01', null, 'pl.maint_factory_equipment', -1, 'PL 10', true, 'BP v1 Mapping: Maintenance - Factory Equipments', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-013', 'COGM - OHP - Biaya Peny. Mesin Gol 1', '2026-01-01', null, 'pl.dep_machinery', -1, 'PL 11', true, 'BP v1 Mapping: Depreciation - Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-014', 'COGM - OHP - Biaya Peny. Mesin Gol 2', '2026-01-01', null, 'pl.dep_machinery', -1, 'PL 11', true, 'BP v1 Mapping: Depreciation - Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-015', 'Varian Produksi', '2026-01-01', null, 'pl.cogm_material', -1, 'PL 04', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-016', 'COGM - OHP - Biaya Pabrikasi & Pengiriman', '2026-01-01', null, 'pl.delivery_cogs', -1, 'PL 85', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5102', 'COGS', '2026-01-01', null, 'pl.cogm_material', -1, 'PL 04', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5102-001', 'COGS', '2026-01-01', null, 'pl.cogm_material', -1, 'PL 04', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5102-002', 'COGS VALUE', '2026-01-01', null, 'pl.cogm_material', -1, 'PL 04', true, 'BP v1 Mapping: COGM Bahan Jadi', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5102-003', 'COGS WWTP', '2026-01-01', null, 'pl.cogm_material', -1, 'PL 04', true, 'BP v1 Mapping: COGM Bahan Jadi', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6100-001', 'Biaya Penjualan / Pemasaran Lainnya', '2026-01-01', null, 'pl.other_selling', -1, 'PL 12', true, 'BP v1 Mapping: Other selling Expense', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6100-002', 'Biaya Promosi Lainnya', '2026-01-01', null, 'pl.other_selling', -1, 'PL 12', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6100-003', 'Biaya Komisi', '2026-01-01', null, 'pl.commission', -1, 'PL 65', true, 'BP v1 Mapping: Commission Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6100-004', 'Biaya Ekspedisi', '2026-01-01', null, 'pl.delivery_selling', -1, 'PL 17', true, 'BP v1 Mapping: Delivery Expenses - SE', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6200-001', 'Biaya Gaji', '2026-01-01', null, 'pl.salaries_ga', -1, 'PL 13', true, 'BP v1 Mapping: Salaries and allowance', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6200-002', 'Biaya THR Karyawan & Bonus', '2026-01-01', null, 'pl.salaries_ga', -1, 'PL 13', true, 'BP v1 Mapping: Salaries and allowance', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6200-003', 'Biaya Jamsostek Office', '2026-01-01', null, 'pl.salaries_ga', -1, 'PL 13', true, 'BP v1 Mapping: Salaries and allowance', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6200-004', 'Biaya Incentive & Benefit Karyawan', '2026-01-01', null, 'pl.salaries_ga', -1, 'PL 13', true, 'BP v1 Mapping: Salaries and allowance', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6200-005', 'Biaya Overtime Pabrik', '2026-01-01', null, 'pl.salaries_ga', -1, 'PL 13', true, 'BP v1 Mapping: Salaries and allowance', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-001', 'Biaya Tol & Parkir', '2026-01-01', null, 'pl.delivery_ga', -1, 'PL 14', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-002', 'Biaya Bahan Bakar Pengiriman', '2026-01-01', null, 'pl.delivery_ga', -1, 'PL 15', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-003', 'Biaya Kuli Angkut', '2026-01-01', null, 'pl.delivery_ga', -1, 'PL 16', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-004', 'Biaya Ekspedisi', '2026-01-01', null, 'pl.delivery_ga', -1, 'PL 17', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-005', 'Biaya Transportasi Kantor', '2026-01-01', null, 'pl.transport', -1, 'PL 18', true, 'BP v1 Mapping: Office Transportation expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-006', 'Biaya Perbaikan & Pemeliharaan Gedung Pabrik', '2026-01-01', null, 'pl.maintenance_ga', -1, 'PL 19', true, 'BP v1 Mapping: Maintenance Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-007', 'Biaya Perbaikan & Pemeliharaan Inventaris Kantor', '2026-01-01', null, 'pl.maintenance_ga', -1, 'PL 20', true, 'BP v1 Mapping: Maintenance Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-008', 'Biaya Perbaikan & Pemeliharaan Kendaraan', '2026-01-01', null, 'pl.maintenance_ga', -1, 'PL 21', true, 'BP v1 Mapping: Maintenance Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-009', 'Biaya Asuransi Gedung', '2026-01-01', null, 'pl.insurance', -1, 'PL 22', true, 'BP v1 Mapping: Insurance Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-010', 'Biaya Asuransi Kendaraan', '2026-01-01', null, 'pl.insurance', -1, 'PL 23', true, 'BP v1 Mapping: Insurance Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-011', 'Biaya Asuransi Lain-lain', '2026-01-01', null, 'pl.insurance', -1, 'PL 24', true, 'BP v1 Mapping: Insurance Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-012', 'Biaya Alat Tulis Kantor', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 25', true, 'BP v1 Mapping: Office Supplies Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-013', 'Biaya Materai, Cetakan, & Fotocopy', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 26', true, 'BP v1 Mapping: Office Supplies Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-014', 'Biaya Pos & Pengiriman Dokumen', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 27', true, 'BP v1 Mapping: Office Supplies Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-015', 'Biaya Rumah Tangga', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 28', true, 'BP v1 Mapping: Office Supplies Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-016', 'Biaya Keperluan Kantor', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 29', true, 'BP v1 Mapping: Office Supplies Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-017', 'Biaya Keperluan Kantor Lainnya', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 30', true, 'BP v1 Mapping: Office Supplies Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-018', 'Biaya Telepon, Internet, & Fax', '2026-01-01', null, 'pl.communication', -1, 'PL 31', true, 'BP v1 Mapping: Communication Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-019', 'Biaya Telp / Pulsa Isi Ulang', '2026-01-01', null, 'pl.communication', -1, 'PL 32', true, 'BP v1 Mapping: Communication Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-020', 'Biaya Sewa Gedung', '2026-01-01', null, 'pl.rent', -1, 'PL 33', true, 'BP v1 Mapping: Rent Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-021', 'Biaya Sewa Tanah', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 34', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-022', 'Biaya Sewa Lainnya', '2026-01-01', null, 'pl.rent', -1, 'PL 35', true, 'BP v1 Mapping: Rent Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-023', 'Biaya Medical', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 36', true, 'BP v1 Mapping: Office Supplies Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-024', 'Biaya Representasi & Entertain', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 37', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-025', 'Biaya Sumbangan', '2026-01-01', null, 'pl.representation', -1, 'PL 38', true, 'BP v1 Mapping: Representation and Donations', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-026', 'Biaya Perjalanan Dinas', '2026-01-01', null, 'pl.transport', -1, 'PL 39', true, 'BP v1 Mapping: Office Transportation expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-027', 'Biaya Keamanan & Kebersihan', '2026-01-01', null, 'pl.representation', -1, 'PL 40', true, 'BP v1 Mapping: Representation and Donations', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-028', 'Biaya Profesional Fee', '2026-01-01', null, 'pl.professional', -1, 'PL 41', true, 'BP v1 Mapping: Professional Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-029', 'Biaya PBB & Retribusi Daerah', '2026-01-01', null, 'pl.tax_permit', -1, 'PL 42', true, 'BP v1 Mapping: Tax & Permit', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-030', 'Biaya Perijinan Produk', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 43', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-031', 'Biaya Snack & Konsumsi', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 44', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-032', 'Biaya Rekreasi & Gathering', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 45', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-033', 'Cancellation Fee', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 46', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-034', 'Biaya ADLinistrasi Impor', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 47', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-035', 'Biaya Management Fee', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 48', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-036', 'Service Fee', '2026-01-01', null, 'pl.professional', -1, 'PL 49', true, 'BP v1 Mapping: Professional Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-037', 'Outsourching', '2026-01-01', null, 'pl.professional', -1, 'PL 50', true, 'BP v1 Mapping: Professional Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-038', 'Consultant Fee', '2026-01-01', null, 'pl.professional', -1, 'PL 51', true, 'BP v1 Mapping: Professional Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-039', 'Uniform', '2026-01-01', null, 'pl.tax_permit', -1, 'PL 52', true, 'BP v1 Mapping: Tax & Permit', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-040', 'Biaya Perijinan Kendaraan', '2026-01-01', null, 'pl.tax_permit', -1, 'PL 53', true, 'BP v1 Mapping: Tax & Permit', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6300-041', 'Biaya Imbalan Pasca Kerja (Opex)', '2026-01-01', null, 'pl.office_supplies', -1, 'PL 81', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6600', 'Biaya Pajak', '2026-01-01', null, 'pl.tax_permit', -1, 'PL 55', true, 'BP v1 Mapping: Tax & Permit', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('7100', 'Pendapatan Lain-lain', '2026-01-01', null, 'pl.other_income', -1, 'PL 56', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('7100-001', 'Pendapatan Jasa Giro', '2026-01-01', null, 'pl.finance_income', -1, 'PL 57', true, 'BP v1 Mapping: Finance Income', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('7100-002', 'Pendapatan Bunga Deposito', '2026-01-01', null, 'pl.other_income', -1, 'PL 58', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('7100-003', 'Pendapatan Bunga Reksadana', '2026-01-01', null, 'pl.other_income', -1, 'PL 59', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('7100-004', 'Pendapatan Bunga Pinjaman ( Non Bank )', '2026-01-01', null, 'pl.finance_income', -1, 'PL 60', true, 'BP v1 Mapping: Finance Income', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('7100-005', 'Pendapatan Selisih Kurs', '2026-01-01', null, 'pl.finance_income', -1, 'PL 61', true, 'BP v1 Mapping: Finance Income', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('7100-006', 'Pendapatan Selisih Penjualan Aktiva', '2026-01-01', null, 'pl.gain_asset_sale', -1, 'PL 62', true, 'BP v1 Mapping: Gain (loss) from sell of fixed assets', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('7100-007', 'Pendapatan Investasi Tanam Singkong', '2026-01-01', null, 'pl.other_income', -1, 'PL 63', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('7100-099', 'Pendapatan Lain-lain', '2026-01-01', null, 'pl.other_income', -1, 'PL 64', true, 'BP v1 Mapping: Other income', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-001', 'Biaya ADLinistrasi Bank', '2026-01-01', null, 'pl.finance_expense', -1, 'PL 66', true, 'BP v1 Mapping: Finance Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-004', 'Biaya Denda & Pinalty', '2026-01-01', null, 'pl.other_expense', -1, 'PL 69', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-005', 'Biaya Selisih Stock', '2026-01-01', null, 'pl.other_expense', -1, 'PL 70', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-006', 'Biaya Selisih Kurs', '2026-01-01', null, 'pl.other_expense', -1, 'PL 71', true, 'BP v1 Mapping: Other Expense', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-007', 'Biaya Selisih Pembayaran', '2026-01-01', null, 'pl.other_expense', -1, 'PL 72', true, 'BP v1 Mapping: Other Expense', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-008', 'Biaya Selish Penjualan Aktiva', '2026-01-01', null, 'pl.other_expense', -1, 'PL 73', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-009', 'Biaya Penghapusn Piutang', '2026-01-01', null, 'pl.other_expense', -1, 'PL 74', true, 'BP v1 Mapping: Other Expense', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-010', 'Biaya Pemusnahan Stock', '2026-01-01', null, 'pl.other_expense', -1, 'PL 75', true, 'BP v1 Mapping: Other Expense', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-011', 'Biaya Investasi Tanam Singkong', '2026-01-01', null, 'pl.other_expense', -1, 'PL 76', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-012', 'Realize Gain or Loss', '2026-01-01', null, 'pl.other_expense', -1, 'PL 77', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-014', 'Unrealize Gain or Loss', '2026-01-01', null, 'pl.other_expense', -1, 'PL 78', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-015', 'Biaya Rounding', '2026-01-01', null, 'pl.other_expense', -1, 'PL 79', true, 'BP v1 Mapping: Other Expense', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-016', 'Realize Gain or Loss (USD)', '2026-01-01', null, 'pl.other_expense', -1, 'PL 80', true, 'BP v1 Mapping: Other Expense', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-002', 'Biaya Bunga Bank', '2026-01-01', null, 'pl.finance_expense', -1, 'PL 67', true, 'BP v1 Mapping: Finance Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6400-003', 'Biaya Bunga Leasing', '2026-01-01', null, 'pl.other_expense', -1, 'PL 68', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-001', 'Biaya Peny. Bangunan', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-002', 'Biaya Peny. Kendaraan Gol 1', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-003', 'Biaya Peny. Kendaraan Gol 2', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-004', 'Biaya Peny. Inventaris Kantor Gol 1', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-005', 'Biaya Peny. Inventaris Kantor Gol 2', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-006', 'Biaya Peny. Inventaris Pabrik Gol 1', '2026-01-01', null, 'pl.dep_machinery', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation - Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-007', 'Biaya Peny. Inventaris Pabrik Gol 2', '2026-01-01', null, 'pl.dep_machinery', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation - Machinery', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-008', 'Biaya Peny. Komputer Software', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-009', 'Biaya Peny. Inventaris Kantor Gol 1 (Value)', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-011', 'Biaya Peny. Inventaris Pabrik Gol 1 (Value)', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-013', 'Biaya Peny. Mesin Gol 1 (Value)', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 11', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-014', 'Biaya Peny. Mesin Gol 2 (Value)', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 11', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('6500-015', 'Biaya Peny. Komputer Software (Value)', '2026-01-01', null, 'pl.depreciation_opex', -1, 'PL 54', true, 'BP v1 Mapping: Depreciation Expenses', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('8300-001', 'Corporate Income Tax', '2026-01-01', null, 'pl.income_tax', -1, 'PL 82', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('8100-001', 'Beban (Manfaat Pajak Tangguhan)', '2026-01-01', null, 'pl.income_tax', -1, 'PL 83', true, 'Keputusan K2-F (BP tidak menjumlah label ini apa adanya)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('8200-001', 'Biaya Imbalan Pasca Kerja ( OCI PL )', '2026-01-01', null, 'pl.other_expense', -1, 'PL 84', false, 'Draft: tidak dipetakan di BP v1 (nol Jan–Agu 2026)', 'BMG_Business_Plan_-_Oct26_to_Dec27.xlsx PL Actual MTM - Aug 26'),
  ('5101-111', 'Upah (pecahan 5101-002)', '2026-10-01', null, 'pl.dl_basic', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-121', 'Upah (pecahan 5101-002)', '2026-10-01', null, 'pl.dl_basic', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-131', 'Upah (pecahan 5101-002)', '2026-10-01', null, 'pl.dl_basic', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-141', 'Upah (pecahan 5101-002)', '2026-10-01', null, 'pl.dl_basic', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-112', 'THR/bonus (pecahan 5101-003)', '2026-10-01', null, 'pl.dl_thr', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-113', 'THR/bonus (pecahan 5101-003)', '2026-10-01', null, 'pl.dl_thr', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-122', 'THR/bonus (pecahan 5101-003)', '2026-10-01', null, 'pl.dl_thr', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-132', 'THR/bonus (pecahan 5101-003)', '2026-10-01', null, 'pl.dl_thr', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-133', 'THR/bonus (pecahan 5101-003)', '2026-10-01', null, 'pl.dl_thr', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-142', 'THR/bonus (pecahan 5101-003)', '2026-10-01', null, 'pl.dl_thr', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-143', 'THR/bonus (pecahan 5101-003)', '2026-10-01', null, 'pl.dl_thr', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-114', 'BPJS (pecahan 5101-005)', '2026-10-01', null, 'pl.dl_bpjs', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-124', 'BPJS (pecahan 5101-005)', '2026-10-01', null, 'pl.dl_bpjs', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-134', 'BPJS (pecahan 5101-005)', '2026-10-01', null, 'pl.dl_bpjs', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-144', 'BPJS (pecahan 5101-005)', '2026-10-01', null, 'pl.dl_bpjs', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-150', 'Pesangon (pecahan 5101-004)', '2026-10-01', null, 'pl.dl_others', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-017', 'Penyusutan inventaris pabrik', '2026-10-01', null, 'pl.dep_machinery', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-201', 'Varian/pemakaian per jenis bahan', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-202', 'Varian/pemakaian per jenis bahan', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-203', 'Varian/pemakaian per jenis bahan', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-204', 'Varian/pemakaian per jenis bahan', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-205', 'Varian/pemakaian per jenis bahan', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-206', 'Varian/pemakaian per jenis bahan', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-207', 'Varian/pemakaian per jenis bahan', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-301', 'Varian produksi per lini', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-302', 'Varian produksi per lini', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26'),
  ('5101-303', 'Varian produksi per lini', '2026-10-01', null, 'pl.cogm_material', -1, null, false, 'Draft COA Okt-26 (D10); konfirmasi Finance', 'PRD v2 D10; coa_pool_map Okt-26')
on conflict do nothing;
-- <<< generated

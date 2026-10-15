-- B2 costing marts (PRD v2 §5.4; Fase 2): pool, idle, allocation, process card, FG, Lain-lain, summary, control.
-- Generated from packages/engine/src/mart-schema.ts by packages/engine/scripts/mart-sql.ts (no hand edits; test/mart-sql.test.ts
-- fails when this file differs). Data marts are written by the rebuild only: one live row per (month, line_key); every row
-- carries rule_id, inputs and source_ref(s) for SourceTrace (PRD v2 §5.4). Idempotent and additive only.

-- Pool konversi per bulan (BIAYA BERSAMA bagian 3): A, Kupas, B, C, D, E.
create table if not exists public.pool_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  pool                    text not null check (pool in ('A','KUPAS','B','C','D','E')),
  gl_amount               numeric(28,10) not null,
  adjustment              numeric(28,10) not null,
  total                   numeric(28,10) not null,
  fixed                   numeric(28,10) not null,
  variable                numeric(28,10) not null,
  components              jsonb not null default '{}'::jsonb,
  rule_id           text not null,
  inputs            jsonb,
  source_ref        text,
  source_refs       jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-- Jam menganggur Unit I (BIAYA BERSAMA bagian 5; PSAK 202). Satu baris per bulan.
create table if not exists public.idle_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  hours_paid              numeric(28,10) not null,
  hours_to_product        numeric(28,10) not null,
  idle_hours              numeric(28,10) not null,
  idle_pct                numeric(28,10) not null,
  rate_per_hour           numeric(28,10) not null,
  idle_cost               numeric(28,10) not null,
  normal_capacity_hours   numeric(28,10) not null,
  idle_to_period          numeric(28,10) not null,
  period_charge           numeric(28,10) not null,
  rule_id           text not null,
  inputs            jsonb,
  source_ref        text,
  source_refs       jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-- Alokasi pool ke lini: metode aktual dan pembanding metode budget.
create table if not exists public.allocation_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  pool                    text not null,
  line                    text not null check (line in ('FCC','UU','UO','LAIN')),
  method                  text not null check (method in ('actual','budget_compare')),
  driver                  text not null,
  driver_value            numeric(28,10) not null,
  driver_share            numeric(28,10) not null,
  amount                  numeric(28,10) not null,
  detail                  jsonb not null default '{}'::jsonb,
  rule_id           text not null,
  inputs            jsonb,
  source_ref        text,
  source_refs       jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-- Kartu proses FCC, UU, UO: kg, material, konversi, tarif rata-rata tertimbang.
create table if not exists public.process_card_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  product                 text not null check (product in ('FCC','UU','UO')),
  kg_input                numeric(28,10) not null,
  kg_premium              numeric(28,10) not null,
  kg_kw2                  numeric(28,10) not null,
  kg_waste                numeric(28,10) not null,
  wip_open_kg             numeric(28,10) not null,
  wip_close_kg            numeric(28,10) not null,
  wip_completion_pct      numeric(28,10) not null,
  material                jsonb not null default '{}'::jsonb,
  conversion              jsonb not null default '{}'::jsonb,
  total_cost              numeric(28,10) not null,
  cost_per_kg_input       numeric(28,10) not null,
  wip_open_value          numeric(28,10) not null,
  kw2_nrv_per_kg          numeric(28,10) not null,
  kw2_nrv_credit          numeric(28,10) not null,
  cost_to_account         numeric(28,10) not null,
  equivalent_kg           numeric(28,10) not null,
  rate_per_kg             numeric(28,10) not null,
  premium_value           numeric(28,10) not null,
  waste_value             numeric(28,10) not null,
  wip_close_value         numeric(28,10) not null,
  rule_id           text not null,
  inputs            jsonb,
  source_ref        text,
  source_refs       jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-- Barang jadi: rata-rata tertimbang, HPP, persediaan akhir; per produk proses dan per SKU Lain-lain.
create table if not exists public.fg_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  line                    text not null check (line in ('FCC','UU','UO','LAIN')),
  product_or_sku          text not null,
  item_code               text,
  unit                    text not null,
  qty_open                numeric(28,10) not null,
  value_open              numeric(28,10) not null,
  value_open_residual     numeric(28,10) not null,
  qty_in                  numeric(28,10) not null,
  value_in                numeric(28,10) not null,
  avg_rate                numeric(28,10) not null,
  qty_sold                numeric(28,10) not null,
  cogs_sold               numeric(28,10) not null,
  qty_transfer            numeric(28,10) not null,
  value_transfer          numeric(28,10) not null,
  qty_close_accurate      numeric(28,10) not null,
  value_close             numeric(28,10) not null,
  qty_diff                numeric(28,10) not null,
  cogs_qty_diff           numeric(28,10) not null,
  cogs_waste              numeric(28,10) not null,
  qty_kw2_sold            numeric(28,10) not null,
  cogs_kw2_sold           numeric(28,10) not null,
  cogs_total              numeric(28,10) not null,
  revenue                 numeric(28,10) not null,
  gross_margin            numeric(28,10) not null,
  gross_margin_pct        numeric(28,10) not null,
  accurate                jsonb not null default '{}'::jsonb,
  rule_id           text not null,
  inputs            jsonb,
  source_ref        text,
  source_refs       jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-- Lain-lain: kartu per SKU, subtotal per kelompok, dan SKU tanpa kartu.
create table if not exists public.others_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  row_kind                text not null check (row_kind in ('sku','group','no_card')),
  others_group            text,
  sku                     text,
  fg_unit                 text not null,
  kg_out                  numeric(28,10) not null,
  units_out               numeric(28,10) not null,
  sample_kg               numeric(28,10) not null,
  fcc_in_kg               numeric(28,10) not null,
  kw2_in_kg               numeric(28,10) not null,
  kw2_ubi_in_kg           numeric(28,10) not null,
  man_hour                numeric(28,10) not null,
  kwh                     numeric(28,10) not null,
  machine_hour            numeric(28,10) not null,
  fcc_value               numeric(28,10) not null,
  kw2_value               numeric(28,10) not null,
  ext_material            numeric(28,10) not null,
  dl                      numeric(28,10) not null,
  foh_b                   numeric(28,10) not null,
  foh_cd                  numeric(28,10) not null,
  foh_e                   numeric(28,10) not null,
  foh                     numeric(28,10) not null,
  total                   numeric(28,10) not null,
  per_kg                  numeric(28,10) not null,
  fg_value_open           numeric(28,10) not null,
  fg_value_close          numeric(28,10) not null,
  cogs                    numeric(28,10) not null,
  revenue                 numeric(28,10) not null,
  margin                  numeric(28,10) not null,
  margin_pct              numeric(28,10) not null,
  rule_id           text not null,
  inputs            jsonb,
  source_ref        text,
  source_refs       jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-- Ringkasan per lini dan total (REKON & KONTROL bagian 1, RINGKASAN bagian 1).
create table if not exists public.summary_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  line                    text not null check (line in ('FCC','UU','UO','LAIN','TOTAL')),
  kg_production           numeric(28,10) not null,
  material_ext            numeric(28,10) not null,
  material_interproduct   numeric(28,10) not null,
  kupas                   numeric(28,10) not null,
  dl                      numeric(28,10) not null,
  foh                     numeric(28,10) not null,
  total_cost              numeric(28,10) not null,
  cost_per_kg             numeric(28,10) not null,
  cogs                    numeric(28,10) not null,
  revenue                 numeric(28,10) not null,
  gross_margin            numeric(28,10) not null,
  gross_margin_pct        numeric(28,10) not null,
  rule_id           text not null,
  inputs            jsonb,
  source_ref        text,
  source_refs       jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-- Kontrol B01–B45 per bulan (satu baris per kode dan lingkup).
create table if not exists public.control_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  code                    text not null,
  scope                   text,
  label                   text not null,
  value                   numeric(28,10),
  tolerance               numeric(28,10),
  status                  text not null check (status in ('LULUS','GAGAL','PERIKSA','BELUM_DIISI')),
  note                    text,
  detail                  jsonb,
  rule_id           text not null,
  inputs            jsonb,
  source_ref        text,
  source_refs       jsonb,
  line_key          text not null,
  source text, document_ref text, upload_id uuid references public.upload(id),
  deleted_at timestamptz, deleted_by text,
  created_at timestamptz not null default now(), created_by text,
  updated_at timestamptz not null default now(), updated_by text
);

-------------------------------------------------------------------------------- keys, stamps, audit, RLS
do $$
declare t text;
begin
  foreach t in array array['pool_month','idle_month','allocation_month','process_card_month','fg_month','others_month','summary_month','control_month'] loop
    execute format('create unique index if not exists %I on public.%I (month, line_key) where deleted_at is null', t || '_line_key', t);
    execute format('create index if not exists %I on public.%I (month)', t || '_month_idx', t);
    execute format('create index if not exists %I on public.%I (upload_id)', t || '_upload_idx', t);
    execute format('create or replace trigger stamp before insert or update on public.%I for each row execute function private.tg_stamp()', t);
    execute format('create or replace trigger audit after insert or update or delete on public.%I for each row execute function private.tg_audit()', t);
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_select') then
      execute format('create policy %I on public.%I for select to authenticated using ((select public.has_role(''admin'',''finance'',''cost_accounting'',''management'',''ppic'',''purchasing'',''sales'')))', t || '_select', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_insert') then
      execute format('create policy %I on public.%I for insert to authenticated with check ((select public.has_role(''admin'',''finance'',''cost_accounting'')))', t || '_insert', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_update') then
      execute format('create policy %I on public.%I for update to authenticated using ((select public.has_role(''admin'',''finance'',''cost_accounting''))) with check ((select public.has_role(''admin'',''finance'',''cost_accounting'')))', t || '_update', t);
    end if;
  end loop;
end $$;

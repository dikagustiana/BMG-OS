-- B3 recon and B4 analysis marts (PRD v2 §5.4; Fase 3–4): recon, inventory recon, variance, bridge, reasonableness, KPI series.
-- Generated from packages/engine/src/mart-schema.ts by packages/engine/scripts/mart-sql.ts (no hand edits; test/mart-sql.test.ts
-- fails when this file differs). Data marts are written by the rebuild only: one live row per (month, line_key); every row
-- carries rule_id, inputs and source_ref(s) for SourceTrace (PRD v2 §5.4). Idempotent and additive only.

-- Rekon HPP kartu → GL, varian material, arus KW 2 dan RINGKASAN bagian 5 (32 baris per bulan).
create table if not exists public.recon_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  label                   text not null,
  wp_amount               numeric(28,10),
  gl_amount               numeric(28,10),
  lk_amount               numeric(28,10),
  difference              numeric(28,10),
  explained               jsonb,
  residual                numeric(28,10),
  gl_lk_diff              numeric(28,10),
  qty                     numeric(28,10),
  status                  text check (status in ('LULUS','GAGAL','PERIKSA','BELUM_DIISI')),
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

-- Rekon persediaan per item: REKON MATERIAL (kategori BB) dan REKON PERSEDIAAN (K1–K6).
create table if not exists public.inventory_recon (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  item_code               text,
  item_name               text,
  account                 text not null,
  category                text not null check (category in ('K1','K2','K3','K4','K5','K6','BB')),
  qty_wp                  numeric(28,10),
  value_wp                numeric(28,10) not null,
  qty_acc                 numeric(28,10),
  value_acc               numeric(28,10) not null,
  diff                    numeric(28,10) not null,
  qty_wp_open             numeric(28,10),
  value_wp_open           numeric(28,10),
  qty_acc_open            numeric(28,10),
  value_acc_open          numeric(28,10) not null,
  diff_open               numeric(28,10),
  diff_delta              numeric(28,10),
  rate_acc                numeric(28,10),
  rate_wp                 numeric(28,10),
  rate_old_card           numeric(28,10),
  old_card_ratio          numeric(28,10),
  qty_diff_value          numeric(28,10),
  qty_diff_value_open     numeric(28,10),
  movement                boolean,
  value_in                numeric(28,10),
  usage_card              numeric(28,10),
  usage_card_by_line      jsonb,
  usage_acc               numeric(28,10),
  close_implied           boolean,
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

-- Varian realisasi vs flex budget per produk dan komponen: harga, pemakaian, volume, metode (cek = 0).
create table if not exists public.variance_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  product                 text not null check (product in ('FCC','UU','UO','LAIN')),
  component               text not null,
  level                   text not null check (level in ('item','group','total')),
  grp                     text,
  label                   text not null,
  budget_version          text,
  qty_per_kg_act          numeric(28,10),
  qty_per_kg_bud          numeric(28,10),
  price_act               numeric(28,10),
  price_bud               numeric(28,10),
  actual_per_kg           numeric(28,10) not null,
  budget_per_kg           numeric(28,10) not null,
  diff                    numeric(28,10) not null,
  price                   numeric(28,10),
  usage                   numeric(28,10),
  volume                  numeric(28,10),
  method                  numeric(28,10),
  check_diff              numeric(28,10),
  kg_act                  numeric(28,10) not null,
  kg_bud                  numeric(28,10) not null,
  actual_amount           numeric(28,10),
  budget_amount           numeric(28,10),
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

-- Bridge margin kotor bulan lalu → bulan ini: 17 bar, 6 grup, tampilan direksi, waterfall WP.
create table if not exists public.bridge_month (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  compare_month           date not null,
  view                    text not null check (view in ('bar','group','display','wp_waterfall')),
  bar_code                text not null,
  label                   text not null,
  pp                      numeric(28,10) not null,
  grp                     text,
  sort_order              int not null,
  components              text[] not null,
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

-- Kewajaran: tren 8 bulan (bagian 1) dan bulan ke bulan (bagian 2) dengan penjelasan.
create table if not exists public.reasonableness (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  part                    text not null check (part in ('trend','mom')),
  kpi                     text not null,
  label                   text not null,
  unit                    text not null,
  value                   numeric(28,10) not null,
  compare_value           numeric(28,10),
  min_8m                  numeric(28,10),
  max_8m                  numeric(28,10),
  delta_pct               numeric(28,10),
  threshold               numeric(28,10),
  status                  text,
  explanation             text,
  explanation_required    boolean not null,
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

-- Deret KPI per bulan untuk layar tren (PRD v2 §5.4).
create table if not exists public.kpi_series (
  id                uuid primary key default gen_random_uuid(),
  month             date not null check (extract(day from month) = 1),
  product                 text not null,
  kpi_code                text not null,
  label                   text not null,
  unit                    text not null,
  value                   numeric(28,10) not null,
  min_8m                  numeric(28,10),
  max_8m                  numeric(28,10),
  status                  text,
  note                    text,
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
  foreach t in array array['recon_month','inventory_recon','variance_month','bridge_month','reasonableness','kpi_series'] loop
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

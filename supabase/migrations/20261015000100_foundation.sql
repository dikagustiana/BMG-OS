-- BMG-OS foundation (PRD v1 §2, §4.7): users and roles, audit trail, module flags, rebuild queue, uploads,
-- the generic apply_changes RPC, login allow-list, private storage buckets.
-- Idempotent and additive only (prompt "Database" D4): create … if not exists, create or replace, guarded policies.
-- No grant/revoke: anything that must not be reachable through the API lives in schema `private`, which PostgREST
-- does not expose.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

-------------------------------------------------------------------------------- users and roles (PRD §2)
create table if not exists public.app_user (
  email       text primary key check (email = lower(email) and position('@' in email) > 1),
  full_name   text,
  role        text not null check (role in ('admin','finance','cost_accounting','ppic','production','warehouse',
                                            'engineering','purchasing','sales','management')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  text,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

create or replace function public.current_email() returns text
language sql stable set search_path = '' as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.app_role() returns text
language sql stable security definer set search_path = '' as $$
  select u.role from public.app_user u where u.email = public.current_email() and u.active
$$;

create or replace function public.is_app_user() returns boolean
language sql stable set search_path = '' as $$
  select public.app_role() is not null
$$;

create or replace function public.has_role(variadic roles text[]) returns boolean
language sql stable set search_path = '' as $$
  select coalesce(public.app_role() = any(roles), false)
$$;

-------------------------------------------------------------------------------- audit trail
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  table_name text not null,
  row_id     text,
  period     text,
  op         text not null,
  changes    jsonb,
  actor      text,
  at         timestamptz not null default now()
);
create index if not exists audit_log_table_at_idx on public.audit_log (table_name, at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor);

-- updated_at / updated_by / created_by stamps on every write.
create or replace function private.tg_stamp() returns trigger
language plpgsql set search_path = '' as $$
declare
  who text := nullif(public.current_email(), '');
  j jsonb := to_jsonb(new);
  patch jsonb := '{}'::jsonb;
begin
  if j ? 'updated_at' then patch := patch || jsonb_build_object('updated_at', now()); end if;
  if who is not null and j ? 'updated_by' then patch := patch || jsonb_build_object('updated_by', who); end if;
  if tg_op = 'INSERT' and who is not null and j ? 'created_by' and (j ->> 'created_by') is null then
    patch := patch || jsonb_build_object('created_by', who);
  end if;
  if patch <> '{}'::jsonb then new := jsonb_populate_record(new, patch); end if;
  return new;
end $$;

-- One audit row per insert / changed update / delete; soft delete and restore are named.
create or replace function private.tg_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r_old jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  r_new jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
  r jsonb := coalesce(r_new, r_old);
  diff jsonb := '{}'::jsonb;
  k text;
  op text := tg_op;
begin
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(r_new) loop
      if k not in ('updated_at','updated_by') and (r_old -> k) is distinct from (r_new -> k) then
        diff := diff || jsonb_build_object(k, jsonb_build_array(r_old -> k, r_new -> k));
      end if;
    end loop;
    if diff = '{}'::jsonb then return new; end if;
    if (r_old ->> 'deleted_at') is null and (r_new ->> 'deleted_at') is not null then op := 'SOFT_DELETE';
    elsif (r_old ->> 'deleted_at') is not null and (r_new ->> 'deleted_at') is null then op := 'RESTORE';
    end if;
  elsif tg_op = 'DELETE' then
    diff := r_old;
  else
    diff := null; -- the inserted row itself is the record
  end if;
  insert into public.audit_log (table_name, row_id, period, op, changes, actor)
  values (
    tg_table_name,
    coalesce(r ->> 'id', r ->> 'code', r ->> 'key', r ->> 'email'),
    coalesce(r ->> 'month', r ->> 'week_start', r ->> 'period', r ->> 'effective_from'),
    op, diff, coalesce(nullif(public.current_email(), ''), 'system')
  );
  return coalesce(new, old);
end $$;

-------------------------------------------------------------------------------- settings and module flags
create table if not exists public.app_setting (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

insert into public.app_setting (key, value, description) values
  ('b1_ingest',     'false', 'B1 Ingest dan master (Fase 1)'),
  ('b2_costing',    'false', 'B2 Costing bulanan (Fase 2)'),
  ('b3_recon',      'false', 'B3 Rekon dan kontrol (Fase 3)'),
  ('b4_analysis',   'false', 'B4 Kewajaran, varian budget, bridge (Fase 4)'),
  ('b5_plan',       'false', 'B5a Standar dan rencana mingguan (Fase 5a)'),
  ('b5_weekly',     'false', 'B5b Aktual dan varian mingguan (Fase 5b)'),
  ('b5_forms',      'false', 'B5 Form harian web (PRD Q8)'),
  ('b6_closing',    'false', 'B6 Tutup bulan: true-up, kalibrasi, rilis (Fase 6)'),
  ('b6_management', 'false', 'B6 Tampilan manajemen (Fase 6)'),
  ('b7_outlook',    'false', 'B7 Outlook dan kas (Fase 7)'),
  ('wp_is_book',    'false', 'PRD Q3: nilai WP = manajemen (false) atau buku (true)')
on conflict (key) do nothing;

create or replace function public.module_enabled(p_key text) returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select s.value = 'true'::jsonb from public.app_setting s where s.key = p_key), false)
$$;

-------------------------------------------------------------------------------- rebuild queue (PRD §3)
create table if not exists public.rebuild_queue (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('month','week','day')),
  period       date not null,
  reason       text,
  status       text not null default 'queued' check (status in ('queued','running','done','failed')),
  error        text,
  requested_by text default nullif(public.current_email(), ''),
  requested_at timestamptz not null default now(),
  started_at   timestamptz,
  finished_at  timestamptz,
  updated_at   timestamptz not null default now(),
  updated_by   text
);
create index if not exists rebuild_queue_status_idx on public.rebuild_queue (status, requested_at);
create index if not exists rebuild_queue_period_idx on public.rebuild_queue (kind, period);

-------------------------------------------------------------------------------- uploads (PRD §5)
create table if not exists public.upload (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,
  period       text not null,                 -- 'YYYY-MM-01' (month), Monday (week), date (day) or version name
  status       text not null default 'staged' check (status in ('staged','planned','committed','rejected')),
  file_name    text not null,
  file_path    text,
  sha256       text not null,
  row_count    integer not null default 0,
  inserted     integer not null default 0,
  updated      integer not null default 0,
  deleted      integer not null default 0,
  unchanged    integer not null default 0,
  issues       jsonb not null default '[]'::jsonb,
  mapping      jsonb,
  options      jsonb not null default '{}'::jsonb,
  plan         jsonb,
  message      text,
  uploaded_by  text,
  uploaded_at  timestamptz not null default now(),
  committed_at timestamptz,
  updated_at   timestamptz not null default now(),
  updated_by   text
);
create index if not exists upload_kind_period_idx on public.upload (kind, period);
create index if not exists upload_status_idx on public.upload (status);

create table if not exists public.upload_row (
  upload_id uuid not null references public.upload(id) on delete cascade,
  row_no    integer not null,
  target    text not null,
  data      jsonb not null,
  issues    jsonb not null default '[]'::jsonb,
  primary key (upload_id, row_no)
);

-------------------------------------------------------------------------------- triggers on foundation tables
create or replace trigger stamp before insert or update on public.app_user for each row execute function private.tg_stamp();
create or replace trigger audit after insert or update or delete on public.app_user for each row execute function private.tg_audit();
create or replace trigger stamp before insert or update on public.app_setting for each row execute function private.tg_stamp();
create or replace trigger audit after insert or update or delete on public.app_setting for each row execute function private.tg_audit();
create or replace trigger stamp before insert or update on public.rebuild_queue for each row execute function private.tg_stamp();
create or replace trigger audit after insert or update or delete on public.rebuild_queue for each row execute function private.tg_audit();
create or replace trigger stamp before insert or update on public.upload for each row execute function private.tg_stamp();
create or replace trigger audit after insert or update or delete on public.upload for each row execute function private.tg_audit();

-------------------------------------------------------------------------------- RLS
alter table public.app_user enable row level security;
alter table public.audit_log enable row level security;
alter table public.app_setting enable row level security;
alter table public.rebuild_queue enable row level security;
alter table public.upload enable row level security;
alter table public.upload_row enable row level security;

-- Policies are created once (create policy has no "or replace"); later changes use alter policy in a new migration.
do $$
declare p record;
begin
  for p in select * from (values
    -- app_user: everyone sees their own row; Admin sees and manages all.
    ('app_user', 'app_user_select', 'select', 'email = public.current_email() or (select public.has_role(''admin''))', null),
    ('app_user', 'app_user_insert', 'insert', null, '(select public.has_role(''admin''))'),
    ('app_user', 'app_user_update', 'update', '(select public.has_role(''admin''))', '(select public.has_role(''admin''))'),
    ('app_user', 'app_user_delete', 'delete', '(select public.has_role(''admin''))', null),
    -- audit_log: written only by the security-definer trigger; read by the roles that review changes.
    ('audit_log', 'audit_log_select', 'select', '(select public.has_role(''admin'',''finance'',''cost_accounting''))', null),
    -- app_setting: every app user reads the flags; only Admin changes them.
    ('app_setting', 'app_setting_select', 'select', '(select public.is_app_user())', null),
    ('app_setting', 'app_setting_insert', 'insert', null, '(select public.has_role(''admin''))'),
    ('app_setting', 'app_setting_update', 'update', '(select public.has_role(''admin''))', '(select public.has_role(''admin''))'),
    -- rebuild_queue: anyone who changes data may queue a rebuild; the requester or Admin moves its status.
    ('rebuild_queue', 'rebuild_queue_select', 'select', '(select public.is_app_user())', null),
    ('rebuild_queue', 'rebuild_queue_insert', 'insert', null, '(select public.is_app_user()) and not (select public.has_role(''management''))'),
    ('rebuild_queue', 'rebuild_queue_update', 'update',
      'requested_by = public.current_email() or (select public.has_role(''admin''))',
      'requested_by = public.current_email() or (select public.has_role(''admin''))'),
    -- upload: every role that owns data may upload; the uploader or Admin moves its status.
    ('upload', 'upload_select', 'select', '(select public.is_app_user())', null),
    ('upload', 'upload_insert', 'insert', null, '(select public.is_app_user()) and not (select public.has_role(''management''))'),
    ('upload', 'upload_update', 'update',
      'uploaded_by = public.current_email() or (select public.has_role(''admin''))',
      'uploaded_by = public.current_email() or (select public.has_role(''admin''))'),
    ('upload_row', 'upload_row_select', 'select', '(select public.is_app_user())', null),
    ('upload_row', 'upload_row_insert', 'insert', null,
      'exists (select 1 from public.upload u where u.id = upload_id and (u.uploaded_by = public.current_email() or (select public.has_role(''admin''))))'),
    ('upload_row', 'upload_row_delete', 'delete',
      'exists (select 1 from public.upload u where u.id = upload_id and (u.uploaded_by = public.current_email() or (select public.has_role(''admin''))))', null)
  ) as t(tbl, name, cmd, using_expr, check_expr) loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = p.tbl and policyname = p.name) then
      execute format('create policy %I on public.%I for %s to authenticated %s %s', p.name, p.tbl, p.cmd,
        case when p.using_expr is not null then 'using (' || p.using_expr || ')' else '' end,
        case when p.check_expr is not null then 'with check (' || p.check_expr || ')' else '' end);
    end if;
  end loop;
end $$;

-------------------------------------------------------------------------------- apply_changes: one transaction per upload commit
-- Tables an upload may write. Each phase that adds an upload target replaces this function in its own migration.
create or replace function public.upload_tables() returns text[]
language sql immutable set search_path = '' as $$
  select array[]::text[]
$$;

-- Runs as the caller (security invoker) so RLS and the guards apply to every row.
create or replace function public.apply_changes(
  p_table text, p_inserts jsonb, p_updates jsonb, p_soft_deletes text[], p_supersede text[] default '{}'
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  cols text;
  u jsonb;
  pk text;
  n_ins int := 0; n_upd int := 0; n_del int := 0; n_sup int := 0;
begin
  if not (p_table = any(public.upload_tables())) then
    raise exception 'apply_changes: tabel % tidak diizinkan', p_table using errcode = '42501';
  end if;
  select a.attname into pk
  from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
  where i.indrelid = format('public.%I', p_table)::regclass and i.indisprimary and i.indnkeyatts = 1;
  if pk is null then raise exception 'apply_changes: % tidak punya primary key satu kolom', p_table; end if;
  if p_inserts is not null and jsonb_typeof(p_inserts) = 'array' and jsonb_array_length(p_inserts) > 0 then
    select string_agg(format('%I', k), ',') into cols from jsonb_object_keys(p_inserts -> 0) k;
    execute format('insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1)', p_table, cols, cols, p_table)
      using p_inserts;
    get diagnostics n_ins = row_count;
  end if;
  if p_updates is not null and jsonb_typeof(p_updates) = 'array' then
    for u in select * from jsonb_array_elements(p_updates) loop
      select string_agg(format('%I', k), ',') into cols from jsonb_object_keys(u) k where k <> pk;
      if cols is null then continue; end if;
      execute format('update public.%I t set (%s) = (select %s from jsonb_populate_record(null::public.%I, $1)) where t.%I::text = $1 ->> %L',
        p_table, cols, cols, p_table, pk, pk) using u;
      n_upd := n_upd + 1;
    end loop;
  end if;
  if p_soft_deletes is not null and array_length(p_soft_deletes, 1) > 0 then
    execute format('update public.%I set deleted_at = now(), deleted_by = public.current_email() where %I::text = any($1) and deleted_at is null', p_table, pk)
      using p_soft_deletes;
    get diagnostics n_del = row_count;
  end if;
  if p_supersede is not null and array_length(p_supersede, 1) > 0 then
    execute format('update public.%I set superseded_at = now() where %I::text = any($1) and superseded_at is null', p_table, pk) using p_supersede;
    get diagnostics n_sup = row_count;
  end if;
  return jsonb_build_object('inserted', n_ins, 'updated', n_upd, 'deleted', n_del, 'superseded', n_sup);
end $$;

-------------------------------------------------------------------------------- login allow-list (auth.users)
-- Only active e-mails in app_user can get a login. Self sign-up is refused; logins are provisioned by
-- private.provision_login (SQL editor, first Admin) or public.admin_set_password (Admin in the app).
-- Google OAuth (proves ownership of the e-mail) is accepted for allow-listed e-mails.
create or replace function private.tg_auth_allowlist() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.app_user u where u.email = lower(new.email) and u.active) then
    raise exception 'E-mail % belum terdaftar di BMG-OS. Minta Admin menambahkan Anda.', new.email
      using errcode = '42501';
  end if;
  if coalesce(current_setting('bmg.provisioning', true), '') <> 'on'
     and coalesce(new.raw_app_meta_data ->> 'provider', '') not in ('google') then
    raise exception 'Pendaftaran mandiri tidak tersedia. Login dibuat oleh Admin (Admin → Pengguna).'
      using errcode = '42501';
  end if;
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end $$;

create or replace trigger bmg_allowlist before insert on auth.users for each row execute function private.tg_auth_allowlist();

-- Create a login with a password, or reset it. Not reachable through the API (schema private).
-- First Admin, in the SQL editor:  select private.provision_login('<email>', '<strong password>');
create or replace function private.provision_login(p_email text, p_password text) returns text
language plpgsql security definer set search_path = '' as $$
declare uid uuid; e text := lower(trim(p_email));
begin
  if length(p_password) < 10 then raise exception 'Kata sandi minimal 10 karakter'; end if;
  if not exists (select 1 from public.app_user where email = e and active) then
    raise exception 'Tambahkan % ke public.app_user dulu', e;
  end if;
  select id into uid from auth.users where lower(email) = e;
  if uid is null then
    perform set_config('bmg.provisioning', 'on', true);
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', e,
      extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    perform set_config('bmg.provisioning', 'off', true);
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid::text, uid, jsonb_build_object('sub', uid::text, 'email', e, 'email_verified', true),
      'email', now(), now(), now());
    return 'created';
  end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = uid;
  return 'updated';
end $$;

-- In-app path (Admin → Pengguna): checks the caller's role, then provisions.
create or replace function public.admin_set_password(p_email text, p_password text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.has_role('admin')) then raise exception 'Hanya Admin' using errcode = '42501'; end if;
  return private.provision_login(p_email, p_password);
end $$;

-------------------------------------------------------------------------------- storage buckets (private)
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('releases', 'releases', false) on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'bmg_storage_read') then
    create policy bmg_storage_read on storage.objects for select to authenticated
      using (bucket_id in ('uploads','releases') and (select public.is_app_user()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'bmg_storage_upload') then
    create policy bmg_storage_upload on storage.objects for insert to authenticated
      with check (bucket_id = 'uploads' and (select public.is_app_user()) and not (select public.has_role('management')));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'bmg_storage_release') then
    create policy bmg_storage_release on storage.objects for insert to authenticated
      with check (bucket_id = 'releases' and (select public.has_role('admin','finance')));
  end if;
end $$;

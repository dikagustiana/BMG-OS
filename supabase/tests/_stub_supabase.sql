-- Minimal Supabase surface for testing migrations on a plain PostgreSQL (fallback when `supabase start` / Docker is not
-- available; prompt "Database" B). Creates the roles, schemas and functions the migrations reference.
-- Usage (PG 16 on the VM):
--   createdb bmg_test && psql -d bmg_test -f supabase/tests/_stub_supabase.sql
--   for f in supabase/migrations/*.sql; do psql -d bmg_test -v ON_ERROR_STOP=1 -f "$f"; done
--   psql -d bmg_test -v ON_ERROR_STOP=1 -f supabase/tests/rls_roles.sql
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists auth;
create schema if not exists storage;

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select auth.jwt() ->> 'role'
$$;

create table if not exists auth.users (
  instance_id uuid, id uuid primary key, aud text, role text, email text, encrypted_password text,
  email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz,
  confirmation_token text, recovery_token text, email_change_token_new text, email_change text, email_change_token_current text,
  phone_change text, phone_change_token text, reauthentication_token text
);
create table if not exists auth.identities (
  id uuid primary key, provider_id text, user_id uuid references auth.users(id), identity_data jsonb, provider text,
  last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz
);
create table if not exists storage.buckets (id text primary key, name text, public boolean default false);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid
);
alter table storage.objects enable row level security;

-- Supabase grants the API roles access to public; mirror it so RLS (not grants) decides.
grant usage on schema public, auth, storage, extensions to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;

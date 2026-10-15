#!/usr/bin/env bash
# pnpm test:rls — run supabase/tests/rls_roles.sql against a LOCAL database (never the remote project).
# Uses $LOCAL_DB_URL, else the default `supabase start` database. Skips with a warning when no local database runs.
set -euo pipefail
cd "$(dirname "$0")/.."
URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
case "$URL" in
  *supabase.co*|*supabase.com*) echo "test:rls: refusing to run against a remote Supabase host" >&2; exit 2 ;;
esac
if ! command -v psql >/dev/null 2>&1; then
  echo "test:rls: SKIP (psql not installed)"; exit 0
fi
if ! psql "$URL" -Atc "select 1" >/dev/null 2>&1; then
  echo "test:rls: SKIP (no local database at $URL — run 'supabase start' then 'supabase db reset')"; exit 0
fi
psql "$URL" -v ON_ERROR_STOP=1 -q -f supabase/tests/rls_roles.sql

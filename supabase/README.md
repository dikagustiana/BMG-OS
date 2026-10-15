# Supabase

Project **BMG-OS** (ref `btccexwuukrpushmharq`, ap-northeast-2, Postgres 17). Tidak ada branch; remote = production. Aturan lengkap: `CLAUDE.md` bagian "Database".

- `migrations/` — aditif dan idempoten (`create … if not exists`, `create or replace`, policy terjaga, seed `on conflict do nothing`). Tidak ada `drop`, `grant/revoke`, atau perubahan data. Fungsi yang tidak boleh diakses API ada di skema `private`.
  - `20261015000100_foundation.sql` — `app_user` (10 peran), audit trail, `app_setting` + flag modul, `module_enabled()`, `rebuild_queue`, `upload`/`upload_row`, `apply_changes()`, login allow-list di `auth.users`, bucket privat `uploads`/`releases`.
  - `20261015000200_master.sql` — tabel master PRD §4.1, guard versi standar, RLS per peran.
  - `20261015000300_master_seed.sql` — seed master dari WP (dibangkitkan `scripts/extract_fixtures.py --seed-sql`).
  - `20261015000400_apply_upload.sql` — `apply_upload()`: commit upload atomik (semua tabel target lewat `apply_changes` + status `committed` dalam satu transaksi), hanya pengunggah atau Admin.
  - `20261015000500_b1_inputs.sql` — 11 tabel input bulanan PRD §4.2 (GL, tag voucher, payroll, Inventory Valuation, Sales by Item, Average Price, kartu CoGM, driver, angka LK), RLS per kind, guard kunci BP, `upload_tables()` diperluas.
- `tests/rls_roles.sql` — tes peran × tabel (selalu rollback; gagal bila ada ekspektasi meleset). `pnpm test:rls` (DB lokal saja).
- `tests/_stub_supabase.sql` — permukaan Supabase minimal untuk menguji migrasi di PostgreSQL biasa bila Docker tidak tersedia.

## Admin pertama (sekali, oleh Dika di SQL Editor dashboard)

```sql
insert into public.app_user (email, role, full_name) values ('<email Dika>', 'admin', 'Dika') on conflict (email) do nothing;
select private.provision_login('<email Dika>', '<kata sandi kuat, ≥ 10 karakter>');
```

Login berikutnya dibuat Admin di aplikasi (Admin → Pengguna). Pendaftaran mandiri ditolak; Google OAuth hanya untuk e-mail yang terdaftar (aktifkan provider di Supabase Auth dan `NEXT_PUBLIC_AUTH_GOOGLE=1`).

## Uji lokal

```
dockerd &                                    # bila daemon belum jalan
SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io supabase start -x studio,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor,realtime
supabase db reset
pnpm test:rls
```
Realtime/studio/analytics dimatikan di `config.toml` (container cloud tanpa IPv6; tidak dipakai aplikasi).

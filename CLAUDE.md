# BMG-OS — aturan kerja untuk Claude Code

Platform costing dan operasi PT Boga Makmur Gracia (pabrik keripik singkong FCC, ubi ungu UU, ubi orange UO, lini Lain-lain).
Spesifikasi: `docs/PRD-v1-bmg-platform.md` (struktur) dan `docs/PLAN-v1-bmg-platform.md` (fase). Angka bulanan: `reference/DI - WP Costing BMG Sep26_4.xlsx` — kalau PRD dan WP berbeda, **WP benar untuk angka, PRD benar untuk struktur**. Keputusan dan selisih: `docs/open-questions.md`. Bukti per fase: `docs/v1/README.md`.

## Satu fase, satu sesi
- Satu sesi mengerjakan satu fase PLAN (`0, 1, 2, 3, 4, 5a, 5b, 6, 7`). Branch `v1/f<FASE>-<nama>` dari branch fase sebelumnya (atau `main` untuk Fase 0), satu PR ke `main`, jangan merge sendiri.
- Urutan kerja: baca PRD + PLAN + `docs/v1/README.md` + `docs/open-questions.md` + `CHANGELOG.md` → `docs/v1/F<FASE>-design.md` → migrasi → engine (golden dulu, lalu rule test) → parser → server action → halaman → kontrol → RLS test → verifikasi → CHANGELOG → PR → `docs/v1/F<FASE>-summary.md`.
- Jangan bertanya di tengah jalan: keputusan terbuka pakai default PRD §9 Q1–Q20 dan catat di `docs/open-questions.md` §C.
- Commit: `v1 F<FASE>: <ringkas>` + bagian "Bukti" (output verifikasi). Sebelum setiap `git push`: `git remote -v` harus `dikagustiana/BMG-OS` (huruf besar/kecil bebas). Repo `KGR-Weekly-Outlook` hanya dibaca, tidak pernah di-commit/push/PR.

## Urutan costing (Fase 2) dan golden
- Bangun dan uji berurutan: material per lini (Lampiran B, REKON MATERIAL) → tenaga kerja (payroll, bagian 8, pool A/Kupas/B) → overhead (pool C/D/E, driver, alokasi) → kartu proses → barang jadi → Lain-lain. Setiap tahap harus tie ke WP sebelum tahap berikutnya. Kewajaran, varian, bridge baru setelah Fase 2 tie penuh.
- Golden diambil dari sel WP (`fixtures/month-2026-09/cells.csv`), bukan dari output engine. ±Rp 1 untuk uang, ±0,0001 untuk pp/rasio, ±0,01 kg.
- `pnpm test`, `pnpm test:golden -- --fixture month-2026-09`, `pnpm snapshot:diff` harus bersih di setiap commit. Fixture `fixtures/month-2026-09/*`, `fixtures/month-2026-08/*` tidak diubah kecuali ekstraktor diperbaiki — lalu catat sel yang berubah di CHANGELOG. Output modul baru = key baru di snapshot.
- Angka tidak tereproduksi setelah dua pendekatan: jangan ubah fixture/toleransi; catat selisih, sel, dugaan di `docs/open-questions.md` §B, tandai test `todo`, lanjut.
- Ekstraksi: `python3 -I scripts/extract_fixtures.py` (openpyxl 3.1.5, `data_only=True` nilai, `False` rumus). Angka tidak di-hardcode di test.

## Engine
- Semua perhitungan di `packages/engine/src/<modul>.ts`: fungsi murni, input/output bertipe, decimal.js lewat `decimal.ts`, tanpa I/O, tanpa `Date.now()`. Tidak ada `number` di aritmetika uang; tidak ada `any` di TypeScript baru.
- Tidak ada perhitungan uang di React, server action, atau SQL view (SQL hanya filter/join). Halaman membaca data mart dari `rebuildMonth`/`rebuildWeek` ("satu angka").
- BMG adalah pabrik proses (pool konversi → alokasi driver → kartu proses rata-rata tertimbang → barang jadi → Lain-lain per SKU). Jangan menyalin `costing.ts`, `ledger.ts`, `demand.ts`, `allocation.ts`, `commercial.ts` dari KGR.
- Master berversi: BOM/routing/tarif/komposisi/kapasitas hanya lewat `std_version` baru; engine mingguan menerima `std_version_id` eksplisit.

## Database — aturan mutlak
Project Supabase **BMG-OS** (ref `btccexwuukrpushmharq`, Seoul, Postgres 17). Tidak ada branch. Remote = production.

- **A.** Tidak ada `supabase link`, `db push`, `db remote`, `psql` ke `*.supabase.co`, mencari password/connection string, meminta token, atau membuat branch Supabase.
- **B.** Semua migrasi diuji lokal dulu: `supabase start -x studio,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor,realtime` (`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` bila ECR diblokir; `dockerd` mungkin harus dijalankan manual) → `supabase db reset` → `pnpm test:rls`. Cadangan: PG16 VM + `supabase/tests/_stub_supabase.sql`.
- **C.** Remote hanya lewat connector Supabase: `list_*`, `get_advisors`, `get_project_url`, `get_publishable_keys`, `search_docs` kapan saja; `execute_sql` hanya `select`; `apply_migration` hanya lewat gerbang D; branch/pause/restore/create_project/edge function/secret **tidak pernah**.
- **D. Gerbang `apply_migration`** (tempel hasilnya ke `docs/v1/README.md`): (1) fase 0 atau 1 saja; (2) `select count(*)` di `upload` dan semua tabel input/data mart §4.2–§4.4 = 0, tidak ada upload `committed`; (3) `list_migrations` = urutan repo, nama baru belum ada; (4) isi hanya `create … if not exists`, `add column if not exists`, constraint lewat `do $$`, fungsi/trigger `create or replace`, policy terjaga `if not exists`, index `if not exists`, seed `on conflict do nothing` — tanpa `drop/truncate/delete/update data/disable RLS/grant/revoke/perubahan role`; (5) lulus B dan sudah di-commit. Setelah apply: `list_migrations`, `list_tables`, `get_advisors` (security + performance); temuan ERROR diperbaiki dengan migrasi baru.
- **E.** Gerbang gagal (Fase ≥ 2, ada data, remote ≠ repo): jangan apply; tulis "Untuk Dika: terapkan ke production" di `docs/v1/README.md` (daftar file berurutan, gerbang yang gagal, instruksi). PR tetap dibuka.
- **F.** Claude tidak pernah mengunggah data bisnis ke remote. Data hanya di DB lokal untuk test.
- Migrasi: jangan ubah file yang sudah ada; file baru bernomor setelah yang terakhir; tidak ada `drop table/column` atau rename kolom yang dibaca engine. Fungsi yang tidak boleh diakses API ditaruh di skema `private` (tidak diekspos PostgREST) — bukan lewat `revoke`.
- Setiap tabel baru: `private.tg_stamp`, `private.tg_audit`, RLS select/insert/update per peran PRD §2, index untuk kolom data mart, entri di `supabase/tests/rls_roles.sql`.

## Web
- Next.js 15 App Router + Supabase SSR (`apps/web`). Flag `app_setting` (`b1_ingest … b7_outlook`, `b5_plan`, `b5_weekly`, `b5_forms`, `b6_management`, default false): halaman modul off → `requireModule()` → `notFound()`; server action modul off → `assertModule()` → `WriteError`; nav hanya modul on sesuai peran (`lib/modules.ts`).
- Peran dan hak tulis: `lib/roles.ts` (10 peran PRD §2) + RLS.
- Tidak ada secret di repo; jangan ubah default `apps/web/lib/env.ts`, `vercel.json`, atau env Vercel.
- Bahasa: UI Bahasa Indonesia; kode dan kolom Inggris. Management view: tanpa istilah tabel, merah hanya untuk negatif, label "manajemen" vs "buku" tegas pada setiap HPP.
- Dilarang: dependency berat (ORM, state manager, chart library > 50 kB), form input pabrik sebagai halaman web sebelum Fase 5b.

## Perintah
```
pnpm install --frozen-lockfile
pnpm typecheck && pnpm test
pnpm test:golden -- --fixture month-2026-09
pnpm snapshot:diff
pnpm build
python3 -I scripts/extract_fixtures.py --check
python3 -I scripts/make_upload_fixtures.py --check   # fixture upload Fase 1 (sintetis dari sel WP)
pnpm test:rls            # DB lokal saja
```

Catatan Fase 1: upload melalui API dibatasi `statement_timeout` 8 s peran `authenticated`. Satu transaksi besar (> ±5.000 baris dengan trigger stamp/audit) harus dipecah. Pola yang dipakai: `UploadHandler.chunk` (lihat `apps/web/lib/upload-handlers.ts`, B-012).

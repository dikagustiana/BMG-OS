# F0 — Fondasi, fixture, keputusan data (design)

Fase 0 dari `docs/PLAN-v1-bmg-platform.md`. Tidak ada logika costing di fase ini: hanya kerangka repo, database fondasi + master, fixture WP, dan dokumen keputusan. Semua angka bisnis dibaca dari `reference/`, tidak dari kode.

## 1. Repo dan skeleton

Disalin dari clone baca-saja `KGR-Weekly-Outlook` (tanpa riwayat git, tanpa migrasi/fixture/engine domain KGR):

| Paket | Isi Fase 0 |
| --- | --- |
| `packages/engine` (`@bmg/engine`) | `decimal.ts` (decimal.js, presisi 40, ROUND_HALF_UP), `dates.ts` (+ helper bulan `YYYY-MM-01`), `format.ts`, `snapshot.ts` (JSON kanonik + SHA-256), `fixtures.ts` (loader Node: `cells.csv`, JSON per sheet). Belum ada modul domain. |
| `packages/parsers` (`@bmg/parsers`) | `values.ts`, `workbook.ts`, `tables.ts` (deteksi header generik, registry `KINDS` kosong — diisi Fase 1). |
| `apps/web` (`@bmg/web`) | Auth Supabase SSR, login allow-list, Shell + nav per modul/peran, `/admin/modul`, `/admin/pengguna`, `/admin/audit`, `/akun`; `lib/roles.ts` (10 peran PRD §2), `lib/modules.ts` (flag), `lib/write.ts`, `lib/upload.ts` (wizard generik), `lib/pdf.ts`, `components/BarChart.tsx`, `UploadWizard.tsx`. |

## 2. Database (migrasi baru, idempoten)

| File | Isi |
| --- | --- |
| `20261015000100_foundation.sql` | `app_user` (10 peran), `current_email/app_role/is_app_user/has_role`, `audit_log`, `tg_stamp`, `tg_audit`, `app_setting` + seed flag (`b1_ingest`, `b2_costing`, `b3_recon`, `b4_analysis`, `b5_plan`, `b5_weekly`, `b5_forms`, `b6_closing`, `b6_management`, `b7_outlook` = false; `wp_is_book` = false), `module_enabled(text)`, `rebuild_queue`, `upload`, `upload_row`, `apply_changes` (tabel yang diizinkan dari `upload_tables()`, diperluas fase berikutnya dengan `create or replace`), login allow-list di `auth.users`, `set_login_password`/`admin_set_password`, bucket privat `uploads`/`releases` + policy. |
| `20261015000200_master.sql` | Semua tabel PRD §4.1: `product`, `others_group`, `sku`, `material_item`, `coa_pool_map`, `payroll_group`, `assumption`, `budget_version`, `budget_line`, `budget_pool_map`, `std_version`, `bom_line`, `output_mix`, `routing`, `rate_card`, `capacity`. Setiap tabel: provenance (`source, upload_id, created_*, updated_*, deleted_*`), `tg_stamp`, `tg_audit`, RLS select (semua app user) + insert/update per peran PRD §2, index FK/lookup. Guard: baris standar hanya bisa diubah selama `std_version.status = 'draft'`; approve hanya `finance`/`admin`. |
| `20261015000300_master_seed.sql` | Dibangkitkan sekali oleh `scripts/extract_fixtures.py --seed-sql` dari `fixtures/master/*.json`: 3 `product`, 21 `others_group` (LAIN-LAIN A22:A42), 20 `sku` (9 sheet SKU + 11 kolom KOPERASI), 54 `material_item` (REKON MATERIAL A7:A60, kode Accurate dari kolom O), `coa_pool_map` Sep-26 (BIAYA BERSAMA A7:D22 + bagian 8) dan Okt-26 draft (kolom E "akun baru" + 5101-201..207, 301..303), 8 `payroll_group` (bagian 2), `assumption` (ASUMSI Agu26 no. 1–14 + D7: `kupas_thr_bpjs`, `cng_m3_per_mmbtu`, `nrv_kw2`, `fg_target_days`, `variance_alert_pct`, …). Semua `insert … on conflict do nothing`. |
| `20261015000400_apply_upload.sql` | (Ditambahkan setelah review PR #1.) `apply_upload(upload_id, changes)`: kunci baris `upload` (`for update`), hanya pengunggah atau Admin, status harus `staged`/`planned`; terapkan setiap tabel target lewat `apply_changes`, lalu set `committed` + jumlah baris — satu transaksi, gagal di mana pun = tidak ada yang tersimpan. Security invoker, jadi RLS tabel target tetap berlaku. |

Perbedaan kecil dari PRD (dicatat di `docs/open-questions.md` §C): enum `coa_pool_map.pool` ditambah `BPJS` dan `PAYROLL_SPLIT` (akun 5101-002/005 dipecah per kelompok, bukan satu pool); `material_item` memakai `name` sebagai kunci alami (nama Average Price) dan `code` Accurate opsional karena REKON MATERIAL hanya mencantumkan kode di catatan kolom O; `coa_pool_map.confirmed` membedakan Sep-26 (dari WP) dan Okt-26 (draft).

Uji lokal: `supabase start` (Docker, PG 17) → `supabase db reset` → `psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_roles.sql`. Tes RLS: setiap peran × setiap tabel master (insert/update boleh/tidak), flag hanya admin, audit tercatat, insert langsung ke `audit_log` ditolak, orang asing dan `anon` membaca 0 baris, daftar mandiri ditolak, approve versi standar oleh ppic ditolak.

Remote: gerbang D (Fase 0, tabel kosong, `list_migrations` cocok, isi aditif, lulus lokal, sudah di-commit) → `apply_migration` file berurutan (tiga di awal, `apply_upload` setelah review) → `list_migrations`, `list_tables`, `get_advisors`.

## 3. Fixture (`scripts/extract_fixtures.py`, `python3 -I`, openpyxl 3.1.5)

- Pembacaan ganda: `data_only=True` (nilai cache Excel) dan `data_only=False` (rumus). Angka ditulis sebagai string desimal tanpa eksponen (round-trip dari float Excel), tidak pernah dibulatkan.
- `fixtures/month-2026-09/cells.csv`: semua sel tak kosong 22 sheet WP Sep26_4 — `sheet, cell, type, value, formula`. Target DoD ≥ 2.500 sel angka.
- JSON per area, dipecah per bagian sheet (judul baris kolom A `1.`, `2a.`, `LAMPIRAN B.` …) supaya offset baris FCC/UU/UO yang berbeda tidak di-hardcode: `summary` (RINGKASAN), `pool` (BIAYA BERSAMA), `fcc`, `uu`, `uo`, `others` (LAIN-LAIN + 9 sheet SKU + KOPERASI), `recon` (REKON & KONTROL + REKON MATERIAL), `inventory` (REKON PERSEDIAAN), `reasonableness` (CEK KEWAJARAN), `bridge` (BRIDGE GP).
- `fixtures/month-2026-08/`: `summary.json`, `pool.json`, `cells.csv` dari `WP Costing BMG Agu26.xlsx`; `bridge_input.json` = BRIDGE GP Sep26_4 C7:C77 (nilai Agu26_6 yang dipakai bridge; file Agu26_6 sendiri tidak tersedia — §B open-questions).
- `fixtures/budget-v1/`: `budget_line.json` (setiap baris angka sheet "Business Plan - Model Details" × 24 bulan, `driver_code = <produk>|<komponen>|<YYYY-MM>`, `bp_row` hanya untuk jejak) dan `budget_pool_map.json` (draft dari label baris berakhiran "Grup A…E").
- `fixtures/master/*.json` → seed SQL.
- `fixtures/month-2026-09/prd_targets.json`: daftar angka target PRD §8 (B2, B3, B4) dengan alamat sel WP-nya; tes integritas membandingkan target PRD dengan `cells.csv` ±Rp 1 / ±0,0001.

## 4. Engine, tes, snapshot

- `pnpm test`: unit test util (decimal, dates, values/parsers, roles/modules web).
- `pnpm test:golden -- --fixture month-2026-09`: Fase 0 = integritas fixture (target PRD vs sel WP, jumlah sel angka, manifest SHA). Laporan ke `docs/v1/golden-f0.md`. Modul fase berikutnya mendaftar golden check di registry yang sama.
- `pnpm snapshot:diff`: snapshot kanonik `{engineVersion, fixtures: sha256 per file, modules: {}}` vs `tests/snapshots/month-2026-09.json`. Modul baru menambah key di `modules`, tidak mengubah key lama.

## 5. Kontrol dan keputusan data

`docs/open-questions.md` §A memetakan D1–D12 ke skrip/kontrol/catatan (mis. D2 → `capacity.normal_capacity_hours`, D4 → B21/B22 PERIKSA, D10 → `coa_pool_map` Okt-26 + B44); §B selisih per sel; §C default Q1–Q20 yang dipakai dan deviasi skema.

## 6. Risiko ke golden fase berikutnya dan pencegahan

| Risiko | Pencegahan |
| --- | --- |
| Ekstraktor berubah dan menggeser angka fixture | Manifest SHA-256 per file di snapshot; `snapshot:diff` gagal bila fixture berubah; perubahan ekstraktor wajib entri CHANGELOG dengan sel yang berubah. |
| Float Excel dibulatkan saat ekstraksi | Nilai ditulis `Decimal(repr(float))` tanpa pembulatan; engine membaca string ke decimal.js. |
| Seed master berubah setelah diterapkan | Seed hanya `on conflict do nothing`; revisi = migrasi baru. |
| Nama migrasi remote ≠ nama file (connector memberi versi waktu-terap) | Pemetaan file ↔ versi remote dicatat di `docs/v1/README.md`; semua migrasi idempoten sehingga `db push` ulang aman. |

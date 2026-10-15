# BMG-OS v1 — bukti per fase

Satu bagian per fase (PLAN v1 "Bukti per fase"): commit, migrasi, output verifikasi, golden, snapshot, screenshot, keputusan default, migrasi ke remote (bukti gerbang D) atau yang menunggu Dika, urutan flag.

---

## Fase 0 — fondasi, fixture, keputusan data

Branch `v1/f0-foundation` · PR https://github.com/dikagustiana/BMG-OS/pull/1 · design `docs/v1/F0-design.md` · ringkasan `docs/v1/F0-summary.md` · golden `docs/v1/golden-f0.md`

### Commit

| Commit | Isi |
| --- | --- |
| `7a85a27` | reference WP + ekstraktor + fixture golden |
| `e10c7a6` | skeleton monorepo (engine util, parsers generik, web) dari KGR baca-saja |
| `d7c99eb` | migrasi foundation + master + seed, tes RLS, CI |
| `db167d0` | dokumen PRD/PLAN, design, open-questions, CHANGELOG, golden F0 |
| `2cbd8e5` | pemeriksa migrasi aditif (gerbang D butir 4) |
| `f2f98c1` | rapikan `/admin/modul`, screenshot per peran |
| `d1435ec`, `ebff43b` | bukti fase, ringkasan, CHANGELOG |
| `90ab951` | review PR #1 (Codex P1/P2): commit upload atomik lewat RPC `apply_upload` (migrasi `20261015000400`), cek pemilik upload di TS dan DB, +10 cek RLS |

### Verifikasi lokal (checklist PLAN "Verifikasi per PR")

```
$ git rev-parse --short HEAD
90ab951
$ pnpm typecheck
packages/engine typecheck: Done
packages/parsers typecheck: Done
apps/web typecheck: Done
$ pnpm test
packages/engine test:       Tests  15 passed (15)
packages/parsers test:       Tests  5 passed (5)
apps/web test:       Tests  5 passed (5)
$ pnpm test:golden -- --fixture month-2026-09
Sel angka di `cells.csv`: 8422 (DoD Fase 0: ≥ 2.500).
## prd-targets (F0) — 50/50 lulus
Semua sel golden lulus.
$ pnpm snapshot:diff
snapshot:diff EMPTY — byte-identical to tests/snapshots/month-2026-09.json (sha256 7e7f1ed4ae3bf9db…)
$ python3 -I scripts/extract_fixtures.py --check
fixtures match a fresh extraction of reference/
$ python3 -I scripts/check_migration.py supabase/migrations/*.sql
supabase/migrations/20261015000100_foundation.sql: 46 statements, 0 violations
supabase/migrations/20261015000200_master.sql: 50 statements, 0 violations
supabase/migrations/20261015000300_master_seed.sql: 8 statements, 0 violations
supabase/migrations/20261015000400_apply_upload.sql: 1 statements, 0 violations
$ supabase db reset && pnpm test:rls
Applying migration 20261015000100_foundation.sql...
Applying migration 20261015000200_master.sql...
Applying migration 20261015000300_master_seed.sql...
Applying migration 20261015000400_apply_upload.sql...
Finished supabase db reset on branch v1/f0-foundation.
NOTICE:  RLS: all 597 checks passed
$ pnpm build
 ✓ Compiled successfully
 ✓ Generating static pages (7/7)
```

- Sel golden gagal: **tidak ada** (50/50 target PRD §8 = sel WP; daftar lengkap di `docs/v1/golden-f0.md`). Ketidakcocokan sumber dicatat di `docs/open-questions.md` §B (B-001…B-010).
- Snapshot `tests/snapshots/month-2026-09.json` sha256 `7e7f1ed4ae3bf9db9897e08200d459e23b359733cb60a8d6586b7f07a2d76cbe` (SHA-256 setiap file fixture; `modules: {}` di Fase 0).
- Lingkungan uji database (prompt B): Supabase CLI 2.54.11 + Docker, `supabase/postgres:17.6.1.029` (image ditarik dari Docker Hub: `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`, karena CDN ECR diblokir proxy; `dockerd` dijalankan manual; realtime/studio/analytics dimatikan di `config.toml` karena container tanpa IPv6). Uji cadangan PG 16.15 + `supabase/tests/_stub_supabase.sql`: 4 migrasi (dua kali) + RLS 597/597 lulus. Idempotensi: setiap migrasi diterapkan dua kali → exit 0, jumlah baris tetap.
- SheetJS: `cdn.sheetjs.com` diblokir jaringan sesi ini (§B B-010). Lockfile tetap SheetJS 0.20.3 dari CDN (entri sama persis dengan KGR); verifikasi lokal memakai `xlsx@0.18.5` di `node_modules` (tidak di-commit).

### Login per peran dan screenshot (lokal)

Preview Vercel belum bisa: connector Vercel tidak melihat project apa pun (lihat "Untuk Dika"), dan login di remote butuh user di `auth.users` remote yang tidak boleh dibuat Claude. Karena itu login per peran diuji di Supabase lokal (`next dev` → `http://127.0.0.1:54321`, user lokal via `private.provision_login`), Playwright Chromium:

```
anon /m/2026-09-01/pool → dialihkan ke /login?next=…
admin / → 200 nav=[Beranda, Modul, Pengguna, Audit]       admin /m/2026-09-01/pool → 404
admin /admin/modul, /admin/pengguna, /admin/audit, /akun → 200
finance / → 200 nav=[Beranda, Audit]; /admin/audit → 200   finance /m/2026-09-01/pool → 404
cost_accounting / → 200 nav=[Beranda, Audit]               → 404
ppic / → 200 nav=[Beranda]                                 → 404
production / → 200 nav=[Beranda]                           → 404
management / → 200 nav=[Beranda]; /admin/modul → dialihkan ke /; DOM tanpa pool_month|cost_week|rebuild → 404
Admin → Modul: aktifkan b1_ingest → app_setting true; nonaktifkan → false; audit_log 2 baris (actor admin)
Admin → Modul: antrian rebuild month 2026-09-01 → queued
```

| Screenshot | |
| --- | --- |
| `img/f0-login.png` | Login |
| `img/f0-admin-beranda.png`, `img/f0-admin-admin-modul.png`, `img/f0-admin-admin-pengguna.png`, `img/f0-admin-admin-audit.png`, `img/f0-admin-akun.png` | Admin |
| `img/f0-finance-beranda.png`, `img/f0-finance-admin-audit.png` | Finance |
| `img/f0-cost_accounting-beranda.png`, `img/f0-ppic-beranda.png`, `img/f0-production-beranda.png` | Cost accounting, PPIC, Produksi |
| `img/f0-management-beranda.png`, `img/f0-management-admin-modul.png` | Manajemen (dialihkan ke beranda) |

### CI GitHub Actions

Run CI pertama di branch ini (`38771591222`, `38771712170`) gagal ~3 detik dengan job tanpa runner (`runner_id: 0`, tanpa langkah, tanpa log). Pada menit yang sama CI repo `KGR-Weekly-Outlook` (akun sama) juga gagal dengan pola yang sama, jadi penyebabnya di tingkat akun GitHub Actions (kemungkinan kuota/billing menit Actions untuk repo privat), bukan kode. Semua langkah CI dijalankan lokal di atas dan lulus. Lihat "Untuk Dika".

### Migrasi ke remote (project BMG-OS `btccexwuukrpushmharq`) — diterapkan, gerbang D lulus

Empat migrasi diterapkan lewat connector Supabase (`apply_migration`), berurutan, setelah gerbang D untuk masing-masing (0004 menyusul sebagai perbaikan review PR #1):

| Butir gerbang D | `20261015000100_foundation` | `20261015000200_master` | `20261015000300_master_seed` | `20261015000400_apply_upload` |
| --- | --- | --- | --- | --- |
| 1. Fase 0 atau 1 | Fase 0 ✓ | Fase 0 ✓ | Fase 0 ✓ | Fase 0 ✓ |
| 2. `upload` dan tabel §4.2–§4.4 = 0, tidak ada `committed` | tabel public = 0 (belum ada `upload` maupun tabel §4.2–§4.4) ✓ | `upload` 0, committed 0; tabel §4.2–§4.4: none ✓ | `upload` 0, committed 0; tabel §4.2–§4.4: none; master 0 baris sebelum seed ✓ | `upload` 0, committed 0, `upload_row` 0; tabel §4.2–§4.4: none (22 tabel public = foundation + master) ✓ |
| 3. `list_migrations` = urutan repo, nama baru belum ada | `[]` ✓ | `[foundation]` ✓ | `[foundation, master]` ✓ | `[foundation, master, master_seed]`; `apply_upload` belum ada (juga di `pg_proc`) ✓ |
| 4. Isi aditif/idempoten | 46 pernyataan, 0 pelanggaran ✓ | 50 pernyataan, 0 pelanggaran ✓ | 8 pernyataan, 0 pelanggaran ✓ | 1 pernyataan (`create or replace function`), 0 pelanggaran ✓ |
| 5. Lulus B dan sudah di-commit | `d7c99eb` (push `2cbd8e5`), lokal PG17 + PG16 ✓ | idem ✓ (sha256 berkas = versi commit) | idem ✓ | `90ab951` (sudah di-push); sebelum apply: Supabase lokal PG17 `db reset` + terapkan ulang + RLS 597/597 (cadangan PG16 + stub dijalankan sesudahnya, juga 597/597) ✓ |
| Hasil `apply_migration` | `{"success":true}` | `{"success":true}` | `{"success":true}` | `{"success":true}` |

Bukti `execute_sql` (select saja), sebelum `foundation`:
```
[{"table_name":"count(public tables) = 0","table_exists":null}]
```
Sebelum `master`:
```
[{"table_name":"upload","rows":0,"committed":0},{"table_name":"upload_row","rows":0},
 {"table_name":"existing §4.2–§4.4 tables: none"},{"table_name":"public tables","rows":6}]
```
Sebelum `master_seed`:
```
[{"table_name":"upload","rows":0,"committed":0},{"table_name":"existing §4.2–§4.4 tables: none"},
 {"table_name":"master rows before seed (…)","rows":0},{"table_name":"public tables","rows":22}]
```

Sebelum `apply_upload`:
```
[{"table_name":"upload","rows":0,"committed":0},{"table_name":"upload_row","rows":0},
 {"table_name":"public tables","rows":22},{"table_name":"non-master public tables (§4.2–§4.4 candidates)","rows":0},
 {"table_name":"apply_upload function exists","rows":0}]
```

Setelah apply — `list_migrations`:
```
{"version":"20261015164706","name":"20261015000100_foundation"}
{"version":"20261015164816","name":"20261015000200_master"}
{"version":"20261015165107","name":"20261015000300_master_seed"}
{"version":"20261015171025","name":"20261015000400_apply_upload"}
```
`apply_upload` di remote: `security_definer = false`, `search_path=""`, argumen `p_upload_id uuid, p_changes jsonb` (security invoker seperti `apply_changes`, jadi RLS tetap berlaku).
Pemetaan berkas ↔ versi remote: connector memberi versi waktu-terap (`2026101516xxxx`), nama = nama berkas. Semua migrasi idempoten, jadi `supabase db push` kelak yang menerapkan ulang berkas dengan versi berkas aman (tidak mengubah apa pun).

`list_tables` (public): 22 tabel, semua `rls_enabled: true` — app_user 0, audit_log 197, app_setting 11, rebuild_queue 0, upload 0, upload_row 0, product 3, others_group 21, sku 20, material_item 54, coa_pool_map 62, payroll_group 14, assumption 22, budget_version 1, budget_line 0, budget_pool_map 0, std_version 0, bom_line 0, output_mix 0, routing 0, rate_card 0, capacity 0. Cek tambahan: flag aktif 0 dari 11 setting; policy public 65; policy storage `bmg_*` 3; tabel tanpa RLS 0; trigger `bmg_allowlist` di `auth.users` 1; bucket privat `uploads`, `releases` 2. Setelah `apply_upload`: `list_tables` tidak berubah (22 tabel, RLS semua, jumlah baris sama).

`get_advisors`:
- **security** (sama sebelum dan sesudah `apply_upload`): 0 ERROR. 2 WARN (lint 0028/0029) — `public.admin_set_password` dan `public.app_role()` adalah SECURITY DEFINER yang bisa dipanggil `anon`/`authenticated`. Disengaja: `admin_set_password` menolak semua kecuali Admin (diuji RLS test: 9 peran non-admin ditolak), memanggil `private.provision_login` yang tidak terekspos; `app_role()` hanya mengembalikan peran pemanggil sendiri dan dipakai policy RLS (perlu definer agar tidak rekursif). Menghapus EXECUTE butuh `revoke` (dilarang gerbang D); kalau ingin dibersihkan, Dika bisa menjalankan `revoke execute on function public.admin_set_password(text, text) from anon;` di SQL Editor.
- **performance**: 0 ERROR/WARN. INFO: 32 index belum dipakai (31 setelah `apply_upload`; database baru, wajar); Auth memakai 10 koneksi absolut (pengaturan project, bukan migrasi).

Tidak ada migrasi yang menunggu Dika untuk Fase 0.

### Flag dan urutan menyalakan

Semua flag `off` di remote: `b1_ingest`, `b2_costing`, `b3_recon`, `b4_analysis`, `b5_plan`, `b5_weekly`, `b5_forms`, `b6_closing`, `b6_management`, `b7_outlook`; `wp_is_book = false` (Q3). Fase 0 tidak punya halaman modul, jadi belum ada yang perlu dinyalakan. Urutan nanti: per fase setelah PR di-merge dan migrasinya diterapkan → nyalakan untuk Admin (cek angka) → baru peran lain; `b1_ingest` → `b2_costing` → `b3_recon` → `b4_analysis` → `b5_plan` → `b5_weekly` (→ `b5_forms`) → `b6_closing` → `b6_management` → `b7_outlook`.

### Keputusan default (Q-ID) yang dipakai

Q1, Q2, Q3, Q4, Q6, Q9, Q10, Q11, Q12, Q13, Q14, Q15, Q16, Q17, Q18, Q19, Q20 — rinci di `docs/open-questions.md` §C, termasuk deviasi skema S-01…S-08.

### Untuk Dika

1. **Admin pertama** (SQL Editor dashboard BMG-OS):
   ```sql
   insert into public.app_user (email, role, full_name) values ('<email Anda>', 'admin', 'Dika') on conflict (email) do nothing;
   select private.provision_login('<email Anda>', '<kata sandi kuat ≥ 10 karakter>');
   ```
   Pengguna lain dibuat di aplikasi (Admin → Pengguna).
2. **Vercel**: connector Vercel di sesi ini hanya melihat tim "dikagirawan-4804's projects" dengan 0 project. Import repo `dikagustiana/BMG-OS` sebagai project `bmg-os`: Root Directory `apps/web`, framework Next.js, install command default (pnpm), tanpa env var (default `lib/env.ts` menunjuk BMG-OS); region `icn1` (Seoul) dari `apps/web/vercel.json`. Preview per PR memakai database production yang sama — fitur baru tetap tersembunyi di balik flag.
3. **GitHub Actions**: job CI tidak mendapat runner (juga di KGR-Weekly-Outlook). Periksa Settings → Billing → Actions (kuota menit/spending limit) agar CI berjalan.
4. **Network environment cloud**: izinkan `cdn.sheetjs.com` agar `pnpm install --frozen-lockfile` jalan di sesi berikutnya (SheetJS 0.20.3).
5. **Backup** (`.github/workflows/backup.yml`): isi secret repo `SUPABASE_DB_URL` (session pooler) dan `BACKUP_PASSPHRASE`; jalankan sekali manual (workflow_dispatch) sebelum migrasi Fase ≥ 2.
6. **Konfirmasi data** (`docs/open-questions.md` §B): pola akun Okt-26 5101-1XY dan 5101-201..207 (B-007) sebelum upload GL Okt; file `DI - WP Costing BMG Agu26_6.xlsx` bila ada (B-001); WP Jul26 untuk standar 3 bulan (B-006); label satuan BP "IDR Mil" (B-005); `budget_pool_map` draft (D8).
7. **File untuk Fase 1** di `reference/`: `CoGM SEPTEMBER 2026 R1.xlsx`, GL Accurate Sep per voucher, Inventory Valuation 1 Agu–30 Sep 2026, LK Sep-26 (IS/BS, Sales by Item).

---

## Fase 1 — B1 ingest bulanan

Branch `v1/f1-ingest` (ditumpuk di atas `v1/f0-foundation`, PLAN "stacked") · PR https://github.com/dikagustiana/BMG-OS/pull/2 · design `docs/v1/F1-design.md` · ringkasan `docs/v1/F1-summary.md` · golden `docs/v1/golden-f1.md`

### Commit

| Commit | Isi |
| --- | --- |
| `4d62b66` | design F1 + migrasi `20261015000500_b1_inputs` (11 tabel PRD §4.2, RLS, guard BP) + tes RLS |
| `d058cc4` | 10 parser upload + fixture upload Sep-26 sintetis (`scripts/make_upload_fixtures.py`) |
| `873aa1e` | kontrol B01/B02/B44, handler upload, `/m/[month]/input`, `/standar`, e2e + screenshot |
| `ef878eb` | open-questions Fase 1; UU jam mesin = estimasi (D11) |
| `d29c22b` | komentar guard BP (impor bertahap, B-012) — versi berkas yang diterapkan ke remote |

### Verifikasi lokal (checklist PLAN "Verifikasi per PR")

```
$ git rev-parse --short HEAD
d29c22b
$ pnpm typecheck
packages/engine typecheck: Done
packages/parsers typecheck: Done
apps/web typecheck: Done
$ pnpm test
packages/engine test:       Tests  22 passed (22)
packages/parsers test:       Tests  30 passed (30)
apps/web test:       Tests  5 passed (5)
$ pnpm test:golden -- --fixture month-2026-09 --phase f1
Sel angka di `cells.csv`: 8422 (DoD Fase 0: ≥ 2.500).
## prd-targets (F0) — 50/50 lulus
Semua sel golden lulus.
$ pnpm snapshot:diff
snapshot:diff EMPTY — byte-identical to tests/snapshots/month-2026-09.json (sha256 8851040e82e2c98a…)
$ python3 -I scripts/extract_fixtures.py --check
fixtures match a fresh extraction of reference/
$ python3 -I scripts/make_upload_fixtures.py --check
upload fixtures match a fresh build from fixtures/month-2026-09/cells.csv
$ python3 -I scripts/check_migration.py supabase/migrations/*.sql
supabase/migrations/20261015000100_foundation.sql: 46 statements, 0 violations
supabase/migrations/20261015000200_master.sql: 50 statements, 0 violations
supabase/migrations/20261015000300_master_seed.sql: 8 statements, 0 violations
supabase/migrations/20261015000400_apply_upload.sql: 1 statements, 0 violations
supabase/migrations/20261015000500_b1_inputs.sql: 22 statements, 0 violations
$ supabase db reset && pnpm test:rls
Applying migration 20261015000100_foundation.sql...
Applying migration 20261015000200_master.sql...
Applying migration 20261015000300_master_seed.sql...
Applying migration 20261015000400_apply_upload.sql...
Applying migration 20261015000500_b1_inputs.sql...
Finished supabase db reset on branch v1/f1-ingest.
NOTICE:  RLS: all 1041 checks passed
$ pnpm build
 ✓ Compiled successfully in 4.6s
 ✓ Generating static pages (7/7)
├ ƒ /m/[month]/input                       703 B         177 kB
└ ƒ /standar                               183 B         177 kB
```

- Uji cadangan PG 16.15 + `supabase/tests/_stub_supabase.sql`: 5 migrasi, masing-masing diterapkan dua kali, lalu RLS 1041/1041 — lulus.
- Golden: tidak ada sel yang bergeser (50/50 target PRD §8; fixture WP Fase 0 byte-identik). Snapshot: 9 key baru `fixtures/uploads/2026-09/*` (milik F1); 26 key Fase 0 tidak berubah.
- Golden baru Fase 1 ada di tes parser (`packages/parsers/test/kinds.test.ts`):
  - parser `budget_bp` (TS) = ekstraktor Python Fase 0: 1.034 baris, 21 pool map, 23.024 baris budget dengan `driver_code` unik;
  - total setiap fixture upload = sel WP sumbernya.
- Engine `controls.test.ts`: B01, B02, B44 pada angka WP Sep dan mapping seed (Sep LULUS; Okt PERIKSA/GAGAL).

### DoD PRD §8 B1 — uji ujung ke ujung (lokal)

Aturan F melarang mengunggah data bisnis ke remote, jadi uji ini memakai Supabase lokal (PG17) dan `next dev`. Pengguna lokal per peran dibuat dengan `private.provision_login`. Upload berjalan lewat wizard di browser (Playwright Chromium), memakai server action dan RPC `apply_upload` yang sama dengan produksi.

| Langkah | Peran | Hasil |
| --- | --- | --- |
| GL, tag voucher, payroll, Inventory Valuation, Sales by Item, Average Price, angka LK | finance | 24, 11, 14 + 4, 121, 23, 23, 9 baris disimpan |
| BP v1 → versi `BP Okt-26 v1` | finance | 23.024 baris budget + 21 pool map; versi terkunci (`imported_at`); ±95 detik |
| Kartu CoGM (template) | cost_accounting | 69 kuantitas + 97 material + 41 driver |
| Master standar | ppic | versi draft `STD-CONTOH-SEP26` (26 BOM, 3 mix, 3 routing, 6 tarif, 1 kapasitas); tanpa tombol Approve untuk PPIC |
| Approve standar | finance | `approved`, `approved_by` = finance |
| Upload ulang GL yang sama | finance | rencana 0 baru / 0 ubah / 0 hapus, 24 sama; tombol Simpan nonaktif (idempoten) |
| GL Okt dengan akun 5101-002 (tanpa mapping Okt) | finance | **diblok B44** ("akun tanpa mapping aktif di Okt-26: 5101-002"); akun muncul di Mapping akun → ditambah → upload ulang tersimpan; B44 PERIKSA (5101-006, 5101-111 masih draft) |

Isi database setelah e2e (Sep-26):

```
gl_month 24 · gl_voucher_tag 11 · payroll_month 14 · payroll_journal 4 · inventory_valuation 121 · sales_by_item 23
average_price 23 · cogm_card 69 · cogm_material 97 · driver_month 41 · fs_control 9          → semua tabel §4.2 terisi
fs_control: revenue_4101_007 7.462.360.152,66 · material_usage 4.375.218.161,24 · conversion_16 1.590.888.645,02
            cogs 6.375.412.304,37 · inv_1106_001_close 947.179.402,89 · inv_1106_002_open 494.002.773,03
            inv_1106_002_close 297.850.706,22 · inv_1106_003_open 499.690.063,73 · inv_1106_003_close 286.536.639,64
            = RINGKASAN B58:B66 (LK Sep-26), 9/9
Σ sales_by_item 7.462.360.152,66 = LK 4101-007 · GL 5101-002 792.968.930,00 = Σ jurnal payroll
Kontrol: B01 LULUS (selisih 0,00) · B02 LULUS (0,00) · B44 LULUS (19 akun ber-mapping aktif)
BP Okt-26 v1: locked, imported, 23.024 baris, 23.024 driver_code unik · audit_log budget_line 23.024 baris
```

Akses per peran (e2e):
- `/m/2026-09-01/input` dan `/standar`: management dan production dialihkan ke beranda; DOM management tanpa `pool_month|cost_week|rebuild`.
- PPIC dialihkan dari Input bulanan, tetapi membuka `/standar`.
- Cost accounting hanya melihat jenis upload "Kartu CoGM" dan tidak punya editor tag.
- Nav finance: Beranda, Input bulanan (`/m/2026-09-01/input`), Standar, Audit.

| Screenshot | |
| --- | --- |
| `img/f1-finance-input-kosong.png`, `img/f1-finance-input.png` | Input bulanan Sep-26 sebelum/sesudah upload (kontrol, status, wizard, mapping, tag, BP) |
| `img/f1-finance-upload-ulang-gl.png` | Upload ulang GL: 0 perubahan |
| `img/f1-finance-b44-blokir-okt.png`, `img/f1-finance-mapping-okt.png`, `img/f1-finance-input-okt.png` | B44 memblok GL Okt → tambah mapping → tersimpan (PERIKSA) |
| `img/f1-finance-standar.png`, `img/f1-ppic-standar.png` | Versi standar (approved) dan rinciannya; PPIC tanpa Approve |
| `img/f1-cost_accounting-input.png`, `img/f1-admin-input.png`, `img/f1-management-beranda.png` | Tampilan per peran |

### CI GitHub Actions

Sama dengan Fase 0: job tidak mendapat runner (masalah akun, lihat "Untuk Dika" Fase 0 no. 3). CI sekarang juga menjalankan `make_upload_fixtures.py --check`. Semua langkahnya lulus lokal (di atas).

### Migrasi ke remote — `20261015000500_b1_inputs` diterapkan, gerbang D lulus

| Butir gerbang D | Bukti |
| --- | --- |
| 1. Fase 0 atau 1 | Fase 1 ✓ |
| 2. `upload` dan tabel §4.2–§4.4 = 0, tidak ada `committed` | `upload` 0, committed 0, `upload_row` 0; tabel §4.2–§4.4 di remote: 0 (belum ada); `budget_line` 0, `std_version` 0 ✓ |
| 3. `list_migrations` = urutan repo, nama baru belum ada | `[foundation, master, master_seed, apply_upload]` = berkas 0001–0004; `b1_inputs` belum ada ✓ |
| 4. Isi aditif/idempoten | 22 pernyataan, 0 pelanggaran (`create table/index if not exists`, `create or replace function/trigger`, policy terjaga `pg_policies`) ✓ |
| 5. Lulus B dan sudah di-commit | `d29c22b` (di-push); PG17 lokal `db reset` + terapkan ulang + RLS 1041/1041; PG16 + stub ✓ |
| Hasil `apply_migration` | `{"success":true}` → versi remote `20261015180819` |

Bukti `execute_sql` (select saja) sebelum apply:
```
[{"table_name":"upload","rows":0,"committed":0},{"table_name":"upload_row","rows":0},{"table_name":"public tables","rows":22},
 {"table_name":"existing §4.2–§4.4 tables","rows":0},{"table_name":"budget_line","rows":0},{"table_name":"std_version","rows":0},
 {"table_name":"b1_ingest flag on","rows":0}]
```

Setelah apply:
- `list_migrations`: `20261015164706 foundation`, `20261015164816 master`, `20261015165107 master_seed`, `20261015171025 apply_upload`, `20261015180819 b1_inputs`.
- `list_tables` (public): 33 tabel, semua `rls_enabled: true`; 11 tabel B1 kosong; data master tidak berubah (produk 3, mapping akun 62, payroll 14, dst.).
- Cek tambahan:
  - 33 policy pada 11 tabel B1 (select/insert/update);
  - 22 trigger stamp/audit;
  - trigger `guard` pada `budget_line`, `budget_pool_map`, `budget_version`;
  - `upload_tables()` = 24 tabel;
  - `cogm_card.row_kind` memuat `output_fg`;
  - flag `b1_ingest` = false.
- `get_advisors`:
  - security: 0 ERROR; 2 WARN yang sama dengan Fase 0 (`admin_set_password`, `app_role`; disengaja).
  - performance: INFO saja (56 index belum dipakai, wajar untuk tabel kosong) dan koneksi Auth absolut; tidak ada FK tanpa index.

Tidak ada migrasi Fase 1 yang menunggu Dika. **Mulai Fase 2** `apply_migration` dilarang tanpa pengecualian; migrasi diterapkan Dika setelah merge.

### Flag dan urutan menyalakan

`b1_ingest` tetap **off** di remote. Urutan setelah PR F0 dan F1 di-merge:
1. Admin pertama dibuat (Fase 0 "Untuk Dika" no. 1).
2. Admin menyalakan `b1_ingest` di `/admin/modul`; halaman Input bulanan dan Standar muncul untuk admin/finance/cost_accounting (Standar juga untuk PPIC).
3. Finance mengunggah sumber Sep-26 yang **asli** (bukan fixture sintetis), memeriksa B01/B02/B44 = LULUS, lalu mengimpor BP v1.
4. Peran lain mengikuti.

### Keputusan default (Q-ID) yang dipakai

- Q4: BP v1 terkunci setelah impor.
- Q6: standar contoh **bukan** v1; v1 dibuat di Fase 5a.
- Q9, Q13: pita BOM ±15% pada template contoh.
- Q16: UU jam mesin = estimasi.
- Keputusan Fase 1 K-01…K-07 dan deviasi skema S-09…S-14 ada di `docs/open-questions.md` §C. Selisih/sumber B-011…B-013 ada di §B.

### Untuk Dika (Fase 1)

1. **File sumber asli Sep-26** di `reference/` (B-011): GL Accurate per voucher, Inventory Valuation 1 Agu–30 Sep, LK Sep-26 (IS/BS + Sales by Item), `CoGM SEPTEMBER 2026 R1.xlsx`. Fixture upload Fase 1 sintetis; sesi berikutnya mencocokkan alias kolom dengan ekspor asli.
2. **Mapping akun Okt-26** (D10/B-007): sebelum upload GL Okt, konfirmasi akun baru di Input bulanan → Mapping akun. B44 memblok GL dengan akun tanpa mapping.
3. **B02 untuk COA Okt** (K-03): 5101-002 dipecah ke 5101-1X1. Putuskan apakah B02 memakai jumlah akun upah baru (A/B/Kupas) terhadap jurnal payroll.
4. **Impor BP di remote** (B-012): impor ditulis bertahap (2.500 baris per transaksi) karena batas 8 s. Bila tahap gagal, klik Simpan lagi; hanya baris yang belum ada yang ditambah.
5. Review dan merge PR Fase 0 lalu PR Fase 1 (PR Fase 1 berbasis `v1/f0-foundation`; GitHub memindahkan basisnya ke `main` setelah PR Fase 0 di-merge dan branch-nya dihapus).

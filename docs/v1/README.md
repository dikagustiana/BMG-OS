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

### Verifikasi lokal (checklist PLAN "Verifikasi per PR")

```
$ git rev-parse --short HEAD
f2f98c1
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
$ supabase db reset && pnpm test:rls
Applying migration 20261015000100_foundation.sql...
Applying migration 20261015000200_master.sql...
Applying migration 20261015000300_master_seed.sql...
Finished supabase db reset on branch v1/f0-foundation.
NOTICE:  RLS: all 587 checks passed
$ pnpm build
 ✓ Compiled successfully
 ✓ Generating static pages (7/7)
```

- Sel golden gagal: **tidak ada** (50/50 target PRD §8 = sel WP; daftar lengkap di `docs/v1/golden-f0.md`). Ketidakcocokan sumber dicatat di `docs/open-questions.md` §B (B-001…B-010).
- Snapshot `tests/snapshots/month-2026-09.json` sha256 `7e7f1ed4ae3bf9db9897e08200d459e23b359733cb60a8d6586b7f07a2d76cbe` (SHA-256 setiap file fixture; `modules: {}` di Fase 0).
- Lingkungan uji database (prompt B): Supabase CLI 2.54.11 + Docker, `supabase/postgres:17.6.1.029` (image ditarik dari Docker Hub: `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`, karena CDN ECR diblokir proxy; `dockerd` dijalankan manual; realtime/studio/analytics dimatikan di `config.toml` karena container tanpa IPv6). Uji cadangan PG 16.15 + `supabase/tests/_stub_supabase.sql`: 3 migrasi + RLS 587/587 lulus. Idempotensi: setiap migrasi diterapkan dua kali → exit 0, jumlah baris tetap.
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

Tiga migrasi diterapkan lewat connector Supabase (`apply_migration`), berurutan, setelah gerbang D untuk masing-masing:

| Butir gerbang D | `20261015000100_foundation` | `20261015000200_master` | `20261015000300_master_seed` |
| --- | --- | --- | --- |
| 1. Fase 0 atau 1 | Fase 0 ✓ | Fase 0 ✓ | Fase 0 ✓ |
| 2. `upload` dan tabel §4.2–§4.4 = 0, tidak ada `committed` | tabel public = 0 (belum ada `upload` maupun tabel §4.2–§4.4) ✓ | `upload` 0, committed 0; tabel §4.2–§4.4: none ✓ | `upload` 0, committed 0; tabel §4.2–§4.4: none; master 0 baris sebelum seed ✓ |
| 3. `list_migrations` = urutan repo, nama baru belum ada | `[]` ✓ | `[foundation]` ✓ | `[foundation, master]` ✓ |
| 4. Isi aditif/idempoten | 46 pernyataan, 0 pelanggaran ✓ | 50 pernyataan, 0 pelanggaran ✓ | 8 pernyataan, 0 pelanggaran ✓ |
| 5. Lulus B dan sudah di-commit | `d7c99eb` (push `2cbd8e5`), lokal PG17 + PG16 ✓ | idem ✓ (sha256 berkas = versi commit) | idem ✓ |
| Hasil `apply_migration` | `{"success":true}` | `{"success":true}` | `{"success":true}` |

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

Setelah apply — `list_migrations`:
```
{"version":"20261015164706","name":"20261015000100_foundation"}
{"version":"20261015164816","name":"20261015000200_master"}
{"version":"20261015165107","name":"20261015000300_master_seed"}
```
Pemetaan berkas ↔ versi remote: connector memberi versi waktu-terap (`2026101516xxxx`), nama = nama berkas. Semua migrasi idempoten, jadi `supabase db push` kelak yang menerapkan ulang berkas dengan versi berkas aman (tidak mengubah apa pun).

`list_tables` (public): 22 tabel, semua `rls_enabled: true` — app_user 0, audit_log 197, app_setting 11, rebuild_queue 0, upload 0, upload_row 0, product 3, others_group 21, sku 20, material_item 54, coa_pool_map 62, payroll_group 14, assumption 22, budget_version 1, budget_line 0, budget_pool_map 0, std_version 0, bom_line 0, output_mix 0, routing 0, rate_card 0, capacity 0. Cek tambahan: flag aktif 0 dari 11 setting; policy public 65; policy storage `bmg_*` 3; tabel tanpa RLS 0; trigger `bmg_allowlist` di `auth.users` 1; bucket privat `uploads`, `releases` 2.

`get_advisors`:
- **security**: 0 ERROR. 2 WARN (lint 0028/0029) — `public.admin_set_password` dan `public.app_role()` adalah SECURITY DEFINER yang bisa dipanggil `anon`/`authenticated`. Disengaja: `admin_set_password` menolak semua kecuali Admin (diuji RLS test: 9 peran non-admin ditolak), memanggil `private.provision_login` yang tidak terekspos; `app_role()` hanya mengembalikan peran pemanggil sendiri dan dipakai policy RLS (perlu definer agar tidak rekursif). Menghapus EXECUTE butuh `revoke` (dilarang gerbang D); kalau ingin dibersihkan, Dika bisa menjalankan `revoke execute on function public.admin_set_password(text, text) from anon;` di SQL Editor.
- **performance**: 0 ERROR/WARN. INFO: 32 index belum dipakai (database baru, wajar); Auth memakai 10 koneksi absolut (pengaturan project, bukan migrasi).

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

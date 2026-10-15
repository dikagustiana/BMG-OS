# Changelog

## v2 F1b — neraca, laba rugi, arus kas, tampilan baru (2026-10-16)

Branch `v2/f1b-fs`. Lihat `docs/v2/F1b-design.md`, `docs/v2/README.md` (bukti, gerbang D), `docs/v2/F1b-summary.md`, `docs/v2/wp-verification.md` (D15).

### Ditambahkan
- Migrasi `20261016000100_b8_fs`, `20261016000200_b8_fs_lines`, `20261016000300_b8_fs_map`: `fs_line` (188), `coa_fs_map` (288), `tb_month`, `history_fs_line`, `budget_fs_line`, data mart `fs_month`, `nwc_month`, `cashflow_month`, `fs_check_month`, flag `b8_fs`, asumsi `related_party_pct`, kunci BP FS, `upload.uploaded_by_name`.
- `@bmg/engine`: `fs-lines`, `fs` (total, TB → baris, modal kerja, arus kas, F01–F07, `rebuildFs`), `history`, `fs-map-seed`, `fs-view`.
- `@bmg/parsers`: `tb_month`, `bp_fs`.
- Fixture: `budget-v1/fs_sheet.json`, `budget-v1/coa_mtm.json` (ekstraktor), `uploads-fs/2026-08/tb_month.xlsx` (sintetis, `scripts/make_fs_fixtures.py`).
- Web: design system PRD v2 §8 (`globals.css` ditulis ulang, `components/ds.tsx`, `charts.tsx`), navigasi per tipe pengguna, Kinerja, Neraca & BP, Modal kerja & kas, Cek & kewajaran, Pengaturan, Audit; halaman menunggu modul memakai state kosong.
- `pnpm lint:css`; `docs/PRD-v2-bmg-platform.md`, `docs/PLAN-v2-bmg-platform.md`; PRD/PLAN v1 ke `docs/archive/`; delta `CLAUDE.md` (L4).

### Diubah
- Input bulanan dan Versi standar ditulis ulang: upload di atas, tanpa nama tabel/SHA/e-mail, konfirmasi simpan inline, pratinjau tertunda bisa dibatalkan, mapping akun ke pool dan ke baris neraca.
- Catatan kontrol B01/B02 memakai format rumah (1.590.888.645,02).
- `/admin/modul`, `/admin/pengguna`, `/admin/audit` dialihkan ke `/pengaturan`.
- Snapshot: 3 fixture baru; key Fase 0–1 tidak berubah.

## v1 F1 — B1 ingest bulanan (2026-10-15)

PR: https://github.com/dikagustiana/BMG-OS/pull/2 (`v1/f1-ingest`, ditumpuk di atas `v1/f0-foundation`). Lihat `docs/v1/F1-design.md`, `docs/v1/README.md` (bukti Fase 1), `docs/v1/F1-summary.md`.

### Ditambahkan
- Migrasi `20261015000500_b1_inputs`: 11 tabel input bulanan PRD §4.2 (`gl_month`, `gl_voucher_tag`, `payroll_month`, `payroll_journal`, `inventory_valuation`, `sales_by_item`, `average_price`, `cogm_card`, `cogm_material`, `driver_month`, `fs_control`) dengan `line_key` unik per bulan, stamp, audit, RLS (baca: admin/finance/cost_accounting; tulis per kind). Guard BP: versi terkunci setelah `imported_at`. `upload_tables()` diperluas.
- `@bmg/parsers`: 10 parser upload (`gl_month`, `gl_voucher_tag`, `payroll_month`, `inventory_valuation`, `sales_by_item`, `average_price`, `cogm_card`, `fs_control`, `budget_bp`, `std_master`), satu fungsi murni per kind dengan isu per baris dan peringatan (item tak terpeta, akun tanpa mapping, angka LK belum lengkap).
- `@bmg/engine/controls.ts`: B01 (Σ GL konversi = LK), B02 (GL 5101-002 = jurnal payroll), B44 (mapping akun aktif; memblok commit GL dengan akun tanpa mapping).
- Web: `/m/[month]/input` (kontrol, status per kind, wizard, mapping akun, editor tag voucher, impor BP per versi), `/standar` (versi standar, rincian, upload, approve), nav modul `b1_ingest`.
- `scripts/make_upload_fixtures.py` → `fixtures/uploads/2026-09/` (9 file sintetis dari sel WP, deterministik, `--check` di CI).

### Diubah
- `numberToString` eksak untuk angka berotasi eksponen; sel error SheetJS dibaca sebagai teks.
- Upload: plan punya `blockers` (dicek ulang saat commit); `budget_line` ditulis bertahap 2.500 baris sebelum transaksi akhir `apply_upload` (batas `statement_timeout` 8 s, B-012).
- Snapshot: 9 key fixture baru; key Fase 0 tidak berubah.


## v1 F0 — fondasi, fixture, keputusan data (2026-10-15)

PR: https://github.com/dikagustiana/BMG-OS/pull/1 (`v1/f0-foundation`). Lihat `docs/v1/F0-design.md`, `docs/v1/README.md` (bukti), `docs/v1/F0-summary.md`.

### Ditambahkan
- Monorepo pnpm dari skeleton KGR (baca saja; tanpa riwayat, migrasi, fixture, engine/halaman domain KGR): `@bmg/engine` (decimal, tanggal + helper bulan, format, snapshot kanonik SHA-256, golden), `@bmg/parsers` (SheetJS, deteksi header generik, registry jenis upload kosong), `@bmg/web` (login allow-list, 10 peran PRD §2, flag modul `lib/modules.ts`, `/admin/modul`, `/admin/pengguna`, `/admin/audit`, `/akun`, wizard upload generik, PDF generik).
- Migrasi `20261015000100_foundation`, `20261015000200_master`, `20261015000300_master_seed`, `20261015000400_apply_upload` (aditif, idempoten). Flag `b1_ingest … b7_outlook`, `b5_forms`, `b6_management` = off; `wp_is_book` = false.
- Commit upload atomik (review PR #1): RPC `apply_upload` menerapkan semua tabel target dan menandai upload `committed` dalam satu transaksi; hanya pengunggah atau Admin yang bisa commit/batal (dicek di server action dan database).
- `scripts/extract_fixtures.py`: `fixtures/month-2026-09` (cells.csv 8.422 sel angka + 10 JSON per area + target PRD §8), `fixtures/month-2026-08` (Agu26_3 + input bridge Agu dari BRIDGE GP Sep), `fixtures/budget-v1` (1.034 baris × 24 bulan, driver_code), `fixtures/master` → seed.
- Tes: unit util, parser generik, roles/modules web, integritas fixture (50/50 target PRD §8 = sel WP), RLS 597 cek (Supabase lokal PG 17.6 dan PG16 + stub), snapshot baseline `tests/snapshots/month-2026-09.json`.
- CI (`.github/workflows/ci.yml`): typecheck, test, golden, snapshot, build, fixture `--check`, migrasi + RLS di Supabase lokal. `backup.yml`: pg_dump harian terenkripsi (secret diisi Dika).
- Dokumen: `CLAUDE.md`, `docs/open-questions.md` (§A D1–D12, §B B-001…B-010, §C Q-default + deviasi skema), `reference/README.md`, `fixtures/README.md`, `supabase/README.md`.

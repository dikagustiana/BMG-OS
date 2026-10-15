# Changelog

## v2 F3–F4 engine — rekon, kontrol, kewajaran, varian budget, bridge (2026-10-15)

Branch `v2/f34-engine` (dari `v2/f1b-fs`). Engine saja; migrasi data mart, halaman §7.1–§7.3, §7.6, §7.7 dan server action menyusul. Lihat `docs/v2/F34-engine-notes.md`.

### Ditambahkan
- `@bmg/engine/recon.ts` (B3): rekon HPP kartu → GL (6 pos, sisa Rp 7,21), REKON MATERIAL per item, REKON PERSEDIAAN per item dengan K1–K6 (K2 WIP-022 225.691.966,25), RINGKASAN bagian 5 (9 baris WP vs GL vs LK); kontrol B17–B20, B23–B30; baris `recon_month`, `inventory_recon`.
- `@bmg/engine/reasonableness.ts` (B4): CEK KEWAJARAN bagian 1 (15 KPI kartu lama FCC, DALAM/DI LUAR RENTANG, catatan WP), bagian 2 (13 KPI, 6 CEK), `kpi_series` (Jan–Sep = tabel PRD v2 §1), B33 (karton PERIKSA).
- `@bmg/engine/variance.ts` (B4): varian vs flex budget per komponen FCC/UU/UO (harga, pemakaian, volume, metode, cek = 0), Lain-lain total; BP v1 lewat kode driver (`BP_V1_MAP`); B42, B43.
- `@bmg/engine/bridge.ts` (B4): BRIDGE GP Agu → Sep 17 bar (19,9219 → 14,5657 pp), B31, B32, tampilan direksi b2 + b12 (+0,1458 pp), waterfall WP bagian 5, perakitan input bulan berjalan dari keluaran Fase 2/3.
- `@bmg/engine/mart-row.ts`: kolom jejak data mart `rule_id`, `inputs`, `source_ref` (PRD v2 §5.4).
- Golden suite `f3-recon` (1.047 sel WP) dan `f4-analysis` (1.068 sel WP), semuanya lulus; adapter sel WP → input di `wp-f34.ts`; laporan `docs/v1/golden-f34.md`.
- Tes: 64 tes baru (recon 23, kewajaran 14, varian 18, bridge 9): status dan teks vs sel WP, rule test per cabang.

### Diubah
- Snapshot `tests/snapshots/month-2026-09.json`: key baru `f3.recon` dan `f4.analysis`; key fixture tidak berubah.
- `docs/open-questions.md`: §B B-030 … B-034 (15 KPI vs "14" di PRD, sisa Rp 7,21, ongkir di luar varian komponen, sheet BUDGET kosong, sel GL/LK tanpa kunci B1), catatan B-006 untuk B33; §C keputusan F34-01 … F34-12.

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

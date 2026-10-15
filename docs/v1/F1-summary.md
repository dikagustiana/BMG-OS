# F1 — ringkasan sesi

Fase 1 (B1 ingest bulanan) dari `docs/PLAN-v1-bmg-platform.md` — **selesai**.

- **Branch / PR:** `v1/f1-ingest` → basis `v1/f0-foundation` (ditumpuk; pindah ke `main` setelah PR Fase 0 di-merge). PR: lihat bagian akhir ringkasan ini. Claude tidak me-merge.
- **Bukti lengkap:** `docs/v1/README.md` (Fase 1) · design `docs/v1/F1-design.md` · golden `docs/v1/golden-f1.md` · keputusan/selisih `docs/open-questions.md` (B-011…B-013, K-01…K-07, S-09…S-14).

## DoD Fase 1 (PLAN) dan acceptance PRD §8 "B1"

| Kriteria | Status |
| --- | --- |
| Migrasi `…_b1_inputs.sql`: tabel §4.2 | ✓ `20261015000500_b1_inputs` (11 tabel, RLS, stamp, audit, guard BP); diterapkan ke remote lewat gerbang D (versi `20261015180819`) |
| Parser 10 kind | ✓ `gl_month`, `gl_voucher_tag`, `payroll_month`, `inventory_valuation`, `sales_by_item`, `average_price`, `cogm_card`, `fs_control`, `budget_bp`, `std_master` |
| Fixture input per parser + tes isu (item tak terpeta, akun tanpa mapping aktif, Σ GL ≠ LK) | ✓ `fixtures/uploads/2026-09/` (sintetis dari WP, B-011); 30 tes parser; B01/B44 di tes engine dan di plan upload |
| Web `/m/[month]/input` (status per kind, wizard, editor tag voucher), `/standar` (versi, draft dari upload, approve finance/admin), `/admin/modul` | ✓ (+ mapping akun B44, impor BP per versi) |
| Kontrol B01, B02, B44 | ✓ `packages/engine/src/controls.ts`; e2e Sep LULUS; Okt B44 memblok lalu PERIKSA |
| Flag `b1_ingest` | ✓ ada, **off** di remote |
| PRD §8 B1: upload 9 kind bulanan Sep-26 → semua tabel §4.2 terisi; `fs_control` 9 angka cocok LK; mapping akun aktif untuk semua akun | ✓ **lokal** (aturan F: tidak ada data bisnis ke remote). Semua 11 tabel terisi; 9/9 angka LK = RINGKASAN B58:B66; B44 LULUS (19 akun). Sumber = fixture sintetis dari WP, bukan file Accurate/LK asli (B-011) |
| CI hijau | ⚠ semua langkah CI lulus lokal; Actions belum mendapat runner (masalah akun, Fase 0) |

## Migrasi

| Berkas | Remote | Versi remote |
| --- | --- | --- |
| `supabase/migrations/20261015000500_b1_inputs.sql` | diterapkan (gerbang D lulus) | `20261015180819` |

Advisor: 0 ERROR; 2 WARN lama yang disengaja; INFO performa. Tidak ada migrasi Fase 1 yang menunggu Dika. Mulai Fase 2, migrasi diterapkan Dika setelah merge (gerbang E).

## Angka

Fase 1 belum menghitung costing. Angka yang dibuktikan:
- Σ 16 akun GL = 1.590.888.645,02 = LK (B01 LULUS).
- GL 5101-002 = jurnal payroll = 792.968.930 (B02 LULUS).
- Σ Sales by Item = 4101-007 = 7.462.360.152,66.
- 9 angka LK = RINGKASAN B58:B66.
- BP v1 23.024 baris, sama dengan ekstraktor Fase 0.
- Golden Fase 0 tetap 50/50; snapshot hanya bertambah key `fixtures/uploads/*`.

## Yang memerlukan manusia

1. File asli Sep-26 di `reference/`: GL per voucher, Inventory Valuation, LK + Sales by Item, CoGM R1 (B-011).
2. Konfirmasi akun Okt-26 di Mapping akun sebelum upload GL Okt; putuskan aturan B02 untuk COA baru (K-03).
3. Merge PR Fase 0 lalu Fase 1; admin pertama; nyalakan `b1_ingest` untuk Admin; unggah sumber asli Sep-26; cek B01/B02/B44.
4. Hal dari Fase 0 yang masih terbuka: Vercel, GitHub Actions, `cdn.sheetjs.com`, secret backup (wajib sebelum Fase 2).

## Konteks untuk sesi berikutnya (Fase 2)

- Input B1 ada di tabel §4.2. Kartu CoGM memakai template BMG: lini FCC/UU/UO dan kode SKU Lain-lain; KOPERASI per SKU dari kolom sheet KOPERASI.
- Engine Fase 2 membaca `cogm_card`, `cogm_material`, `driver_month`, `gl_month` + `gl_voucher_tag` + `payroll_*`, `coa_pool_map`.
- Golden Fase 2 tetap sel WP (`fixtures/month-2026-09`).
- Versi budget dipakai hanya bila `imported_at` terisi.
- Migrasi berikutnya bernomor setelah `20261015000500`, dan diterapkan Dika (bukan Claude).
- Lingkungan: `dockerd`, `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io supabase start -x …` (lihat `CLAUDE.md`).

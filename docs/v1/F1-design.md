# F1 — B1 ingest bulanan (design)

Fase 1 dari `docs/PLAN-v1-bmg-platform.md`: tabel input bulanan PRD §4.2, sepuluh parser upload, halaman input dan standar, kontrol B01/B02/B44, flag `b1_ingest`. Belum ada costing (Fase 2). Branch `v1/f1-ingest`, ditumpuk di atas `v1/f0-foundation` (PLAN "stacked").

## 0. Sumber data dan celah

File Fase 1 dari PLAN ("CoGM SEPTEMBER 2026 R1.xlsx", GL Accurate Sep per voucher, Inventory Valuation 1 Agu–30 Sep, LK Sep-26) **tidak ada** di `reference/`. Yang ada hanya WP Sep26_4, Agu26_3, Agu26 dan BP v1. Karena itu (dicatat B-011 di `docs/open-questions.md`):

- **Parser** mengikuti pola KGR: header dikenali dari alias kolom (label Accurate bahasa Indonesia dan Inggris, plus header template BMG), dan wizard bisa mengganti kolom per field. Format persis ekspor Accurate yang asli belum bisa diuji; aliasnya perlu dicek begitu file asli ada.
- **Fixture upload** `fixtures/uploads/2026-09/` **disintesis** dari sel WP Sep26_4 oleh `scripts/make_upload_fixtures.py`. Setiap baris fixture menyebut sel sumbernya. Totalnya sama dengan angka WP/LK, jadi DoD B1 bisa diuji ujung ke ujung (lokal), walaupun tata letaknya bukan salinan ekspor Accurate.
- **BP**: `budget_bp` diuji langsung pada `reference/BMG_Business_Plan_-_Oct26_to_Dec27.xlsx`. Output parser TS harus sama persis dengan `fixtures/budget-v1/budget_line.json` dari ekstraktor Python Fase 0.
- **Kartu CoGM**: tata letak kartu lama tidak diketahui. Fase 1 memakai **template BMG** (`cogm_card`: sheet Kuantitas, Material, Driver) yang diisi cost accounting dari workbook CoGM. Parser untuk workbook CoGM asli menyusul begitu file ada (B-011).

## 1. Database — `20261015000500_b1_inputs.sql` (aditif, idempoten)

Semua tabel: `id uuid`, `month date` (tanggal 1), kolom provenance (`source, document_ref, upload_id, line_key, created_*, updated_*, deleted_*`), `tg_stamp`, `tg_audit`, RLS, index `(month)` dan unik `(month, line_key) where deleted_at is null`, index `upload_id`.

| Tabel | Kolom pokok | Ditulis oleh |
| --- | --- | --- |
| `gl_month` | `account, account_name, txn_date, voucher, description, debit, credit, net` | admin, finance |
| `gl_voucher_tag` | `voucher, account, amount, tag (reklas_opex, thr_swap, tali_asih_cutoff, ongkir_singkong, pisau_urschel), target_pool, target_line, note` | admin, finance |
| `payroll_month` | `payroll_group_code → payroll_group.code, amount` | admin, finance |
| `payroll_journal` | `kind (upah_harian, gaji_staf, tali_asih), voucher, amount` | admin, finance |
| `inventory_valuation` | `item_code, item_name, account, qty/value open, in, out_sale, out_transfer, adj, close` | admin, finance |
| `sales_by_item` | `item_code, item_name, unit, qty, amount, customer_group (IFM, KGS, retail, maklon)` | admin, finance |
| `average_price` | `item_name, item_code, unit, price` | admin, finance |
| `cogm_card` | `line, row_kind, qty, unit` | admin, cost_accounting |
| `cogm_material` | `line, item_name, item_code, material_group, qty, unit, price_card, value_card` | admin, cost_accounting |
| `driver_month` | `line, driver (man_hour, hours_paid, kg_peeled, kwh, machine_hour), value, estimated` | admin, cost_accounting |
| `fs_control` | `key` (9 kunci LK), `amount`, `source_ref` | admin, finance |

- **Baca**: admin, finance, cost_accounting (penyusun WP). Peran lain dan management tidak membaca input bulanan mentah (payroll per kelompok sensitif). Management membaca data mart mulai Fase 2.
- `upload_tables()` diganti (`create or replace`) dan ditambah 11 tabel di atas + `std_version` + `budget_version`. `std_master` membuat versi draft dan barisnya dalam satu `apply_upload` (id versi dibuat di server). `budget_bp` mengisi baris versi BP lalu menandai `imported_at`.
- **Guard BP**: trigger `private.tg_budget_line_guard`. Baris `budget_line` dan `budget_pool_map` hanya bisa ditulis selama versinya `draft`, atau `locked` tetapi belum diimpor (`imported_at is null`). Setelah impor, BP terkunci (Q4).
- **Deviasi skema** (dicatat §C):
  - S-09: `cogm_card.row_kind` ditambah `output`, `input_fcc_premium`, `input_kw2_fcc`, `input_kw2_ubi` untuk lini Lain-lain.
  - S-10: `inventory_valuation.value_out_transfer` dan `item_name`.
  - S-11: `average_price.item_name` sebagai kunci (nama Average Price, sama dengan `material_item`).
  - S-12: `gl_voucher_tag.target_line` untuk ongkos kirim ke material FCC.
  - S-13: `sales_by_item.unit` (kg atau bag).

## 2. Parser (`packages/parsers/src/kinds/`)

Satu file per kind. Masing-masing berisi `KindDef` (label, peran, target, field + alias) dan fungsi murni `parse(sheets, ctx) → { sets: {target, rows}[], rows, issues }`. Baris membawa `line_key` stabil supaya upload ulang idempoten.

| Kind | Bentuk file | Catatan |
| --- | --- | --- |
| `gl_month` | Tabel GL per voucher (Tanggal, No. Sumber, Keterangan, No. Akun, Nama Akun, Debit, Kredit) | `net = debit − kredit`; baris total dilewati; akun tanpa nomor → isu baris |
| `gl_voucher_tag` | CSV/xlsx template (Voucher, Akun, Jumlah, Tag, Pool tujuan, Lini, Catatan) | tag/pool di luar daftar → isu |
| `payroll_month` | Dua bagian: Rekap (Kelompok, Unit/Departemen, Jumlah) dan Jurnal (Jenis, Voucher, Jumlah) | kelompok dipetakan ke `payroll_group` (nama + unit); tak terpeta → isu |
| `inventory_valuation` | Rincian Valuasi Persediaan (Kode Barang, Nama, Akun, Kts/Nilai Awal, Masuk, Keluar, Transfer, Penyesuaian, Akhir) | akun kosong → turunan dari prefiks kode (BB → 1106-001, WIP → 1106-002, FG → 1106-003) |
| `sales_by_item` | Sales by Item (Kode, Nama, Kts, Satuan, Jumlah, Grup pelanggan) | grup di luar daftar → isu |
| `average_price` | Average Price (Nama Barang, Kode, Satuan, Harga) | nama tidak ada di `material_item` → isu (peringatan) |
| `cogm_card` | Template 3 sheet: Kuantitas, Material, Driver | lini = `FCC/UU/UO`, kode `others_group`, atau kode SKU |
| `fs_control` | Pos + Nilai; pos dikenali dari kunci atau label LK/RINGKASAN | 9 kunci wajib; kurang → isu |
| `budget_bp` | Workbook BP asli, sheet "Business Plan - Model Details" | sama dengan ekstraktor Fase 0 (golden: `fixtures/budget-v1`) |
| `std_master` | Template 5 sheet: BOM, Mix, Routing, Tarif, Kapasitas | menjadi `std_version` draft baru + baris; approve di `/standar` |

Isu yang diuji (PLAN): item tak terpeta, akun tanpa mapping aktif, Σ GL ≠ LK.

## 3. Kontrol (`packages/engine/src/controls.ts`, murni)

| Kode | Kontrol | Toleransi | Status |
| --- | --- | --- | --- |
| B01 | Σ GL akun biaya konversi (16 akun LK: mapping aktif ke pool konversi untuk akun `5101-*`, `6500-006`, `6500-007`) = `fs_control.conversion_16` | Rp 1 | LULUS / GAGAL / BELUM DIISI |
| B02 | GL `5101-002` = Σ `payroll_journal` (upah harian + gaji staf + tali asih) | Rp 1 | LULUS / GAGAL / BELUM DIISI |
| B44 | Setiap akun GL bulan itu yang berawalan `5`, atau yang punya tag voucher, punya mapping `coa_pool_map` aktif di bulan itu; mapping draft (`confirmed = false`) → PERIKSA | — | LULUS / PERIKSA / GAGAL |

- **B44 memblok commit** `gl_month` bila ada akun tanpa mapping (PRD §10 risiko COA Okt-26). Plan upload memuat `blockers`, dan `commitUpload` menolak bila `blockers` tidak kosong (dihitung ulang saat commit). Setelah Finance menambah mapping, commit yang sama bisa dijalankan lagi.
- B01 dan B02 tampil di `/m/[month]/input` dan tidak memblok upload.

## 4. Web

- `/m/[month]/input` (admin, finance, cost_accounting; flag `b1_ingest`):
  - status per kind (upload terakhir, waktu, pengunggah, jumlah baris, isu);
  - wizard upload (komponen `UploadWizard` generik);
  - kontrol B01/B02/B44;
  - editor tag voucher (tambah/hapus baris `gl_voucher_tag`);
  - daftar akun GL tanpa mapping atau mapping draft, dengan tombol konfirmasi untuk Finance/Admin.
- `/standar` (admin, finance, ppic; flag `b1_ingest`): daftar versi (draft/approved/superseded, jumlah baris per tabel), upload `std_master`, rincian versi, tombol approve (finance/admin; guard DB juga memeriksa).
- `/admin/modul`: sudah ada; nav modul `b1_ingest` diisi dua rute di atas.

## 5. Bukti dan DoD

- DoD PLAN: PRD §8 B1 dengan Sep-26. Diuji **lokal**, karena aturan F melarang Claude mengunggah data bisnis ke remote:
  - skrip Playwright (di luar repo; tanpa dependensi baru) mengunggah semua fixture Sep-26 lewat wizard, server action dan RPC yang sama dengan produksi;
  - hasilnya: semua tabel §4.2 terisi; `fs_control` 9 angka = RINGKASAN B58:B66; B01, B02, B44 LULUS; `budget_line` 23.024 baris.
- Golden tetap (fixture WP tidak berubah). Golden parser baru: `budget_bp` TS = `fixtures/budget-v1`; total fixture upload = sel WP.
- Snapshot: `modules` tetap kosong (belum ada data mart). Fixture upload ikut manifest SHA.
- Gerbang D sebelum `apply_migration` (Fase 1 masih boleh selama tidak ada upload `committed` di remote).

## 6. Risiko ke golden fase berikutnya

| Risiko | Pencegahan |
| --- | --- |
| Fixture sintetis berbeda dari ekspor asli | Alias kolom luas + mapping manual di wizard; B-011 meminta file asli; fixture menyebut sel sumber per baris |
| Impor BP 23 ribu baris melewati `statement_timeout` | Diuji lokal dengan batas Supabase; bila lewat, impor dipecah per bulan sebagai upload terpisah (versi tetap terkunci setelah bulan terakhir) |
| Kartu Lain-lain per SKU belum lengkap (KOPERASI per kelompok) | Fase 2 menambah baris SKU ke generator fixture; tabel sudah mendukung lini SKU |

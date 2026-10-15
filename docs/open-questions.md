# Open questions, selisih, dan keputusan default

Tiga bagian: **§A** masalah data/model D1–D12 (PRD §1) dan penanganannya; **§B** angka yang tidak tereproduksi atau sumber yang tidak cocok, per sel; **§C** keputusan default yang dipakai (PRD §9 Q1–Q20) dan deviasi skema, dengan tempat mengubahnya.

---

## §A. D1–D12 — status Fase 0

Setiap masalah punya penanda: skrip/tabel yang menyimpannya, kontrol yang akan menandainya (PRD §4.6), atau catatan. Kontrol B01–B45 dihitung mulai fase modulnya; di Fase 0 yang ada adalah tempat datanya.

| ID | Masalah | Penanda di platform | Kontrol | Status Fase 0 |
| --- | --- | --- | --- | --- |
| D1 | Kartu baru belum dibukukan; HPP Accurate memakai kartu lama (cem-cem ORI: WP 332,4 jt vs Accurate 249,7 jt) | `app_setting.wp_is_book = false` (Q3: nilai WP = manajemen); fixture `others.json` (CEM-CEM ORI bagian 3 kolom D vs F); REKON PERSEDIAAN K1 di `inventory.json` | K1 / B23–B30 (Fase 3); label "manajemen" vs "buku" di setiap HPP | Default dicatat; angka K1 Sep ada di fixture |
| D2 | Kapasitas menganggur diserap produk (parameter 0/1) | `capacity.normal_capacity_hours` (per minggu × departemen); `assumption.idle_to_period = 0` (BIAYA BERSAMA C110) | `idleCapacity()` Fase 2; beban periode = `max(0, idle − (dibayar − normal)) × tarif` | Tabel + asumsi ada; default = jam dibayar (Q9) |
| D3 | WIP dinilai 100% selesai; WIP awal UU 4.042 kg vs produksi 467 kg | `product.wip_completion_pct` default 1; `assumption.wip_open_over_production_ratio = 3` | B34 PERIKSA (Fase 2) | Kolom + asumsi ada |
| D4 | FG-001 masuk kartu 221.027 vs Accurate 211.979,5 kg; transfer 23.115,5 vs 14.058 kg | Target `B3.b21_*`, `B3.b22_*` di `fixtures/month-2026-09/prd_targets.json` (FCC!B87, C206, B91, C207) | B21/B22 PERIKSA (bukan memo), toleransi 1% kg | Angka WP terkunci di golden |
| D5 | Karton FCC Sep 100 pcs vs perkiraan 6.419 pcs (61,7 jt belum dikeluarkan) | `material_item.category = 'karton'` (BB-026 Karton Polos IFL); `bom_line.band_low/high` (Q13 ±15%) | B33 rasio pemakaian/kg vs 3 bulan (Fase 4) | Master material siap; data 3 bulan butuh WP Jul (lihat §B B-006) |
| D6 | Olein ditahan di WIP-022 Accurate (225,7 jt akhir Sep) | REKON PERSEDIAAN K2 (H58 = 225.691.966,25) di golden `B3.k2_wip_close`; `material_item` BB-014 Minyak Olein | K2 di `inventory_recon` (Fase 3) | Q19 default: tetap bahan baku di WP |
| D7 | Sheet ASUMSI dirujuk tetapi tidak ada di Sep26_4 | Tabel `assumption`: 14 butir ASUMSI dari `WP Costing BMG Agu26.xlsx` + 8 default PRD (kupas_thr_bpjs 0, cng 22,2967, nrv_kw2 9.777,27, fg_target_days 7, variance_alert_pct 0,02, …) | — (dokumentasi) | Terisi lewat seed `20261015000300_master_seed.sql` |
| D8 | BUDGET di WP kosong; BP v1 berbeda klasifikasi | `budget_pool_map` (draft 21 baris dari BP bagian 4.1 + 4.3, `confirmed = false`); `fixtures/budget-v1/budget_pool_map.json` | B42–B43 (Fase 4) | Draft; perlu konfirmasi Finance sebelum Fase 4 |
| D9 | BP v1: laba jual aset 60 jt/bulan hardcode; pajak Sep–Des 2026 kosong; Lain-lain tidak membayar FCC | `budget_version 'BP Okt-26 v1'` status `locked` dengan catatan D9 | — | Dibekukan as-is (Q4); v2 oleh manusia |
| D10 | COA berubah Okt-26 (5101-002 → 111..144; varian 5101-201..207, 301..303) | `coa_pool_map`: 21 akun Sep-26 `confirmed = true` (berlaku s.d. 30 Sep 2026) + 41 akun Okt-26 `confirmed = false` | B44 memblok upload GL Okt bila ada akun tanpa mapping aktif (Fase 1) | Draft Okt-26 dari kolom E "akun baru"; pola 5101-1XY perlu konfirmasi (§B B-007) |
| D11 | Driver Grup D untuk UU diturunkan dari rasio kWh, bukan jam mesin aktual | `driver_month.estimated` (Fase 1); sel BIAYA BERSAMA D171 = 27,15 jam (bukan bilangan bulat) di fixture | Tampil di kewajaran (Fase 4) | Q16 default |
| D12 | Tautan budget di WP memakai nomor baris Model Details (MD411…) | `budget_line.driver_code = <produk>|<komponen>|<YYYY-MM>`; `bp_row` hanya untuk jejak | Unik per versi (index `budget_line_driver_key`) | Ekstraktor BP menghasilkan 1.034 baris × bulan, kode unik (diuji) |

---

## §B. Selisih dan sumber yang tidak cocok (per sel)

Fase 0 tidak menghitung angka; semua 50 target PRD §8 cocok dengan sel WP (`docs/v1/golden-f0.md`). Yang dicatat di sini adalah ketidakcocokan **sumber** yang akan memengaruhi fase berikutnya.

| ID | Sel / sumber | Temuan | Dugaan / dampak | Tindakan |
| --- | --- | --- | --- | --- |
| B-001 | BRIDGE GP!C7:C77 (Sep26_4) vs `DI - WP Costing BMG Agu26_3.xlsx` | Kolom Agu di BRIDGE GP berasal dari **Agu26_6** (A5). Contoh: HPP_WP Agu 7.926,648 jt (C64) vs Agu26_3 RINGKASAN F10 7.770,352 jt; pool A 609,92 jt (C28) vs Agu26_3 650,6 jt. File Agu26_6 tidak ada di `reference/`. | Agu26_3 adalah versi sebelum revisi. | Bridge Fase 4 memakai `fixtures/month-2026-08/bridge_input.json` (kolom C BRIDGE GP Sep26_4). `summary.json`/`pool.json` Agustus = Agu26_3 (informasi). **Untuk Dika:** taruh `DI - WP Costing BMG Agu26_6.xlsx` di `reference/` bila ada. |
| B-002 | CEM-CEM ORI!E109 (dan sheet SKU lain) | Saldo awal FG Sep dirujuk ke "Agu26_4"; FCC!E196/E201/E202 merujuk "Agu26_3". | Tiga versi Agu dipakai di WP Sep (3, 4, 6). | Golden Sep tidak terpengaruh (nilai awal ada di sel Sep). Roll-forward FCC diverifikasi otomatis: Agu26_3 FCC!E78 = Sep FCC!C196 (±Rp 0,01). |
| B-003 | Sep FCC!C196 vs Agu26_3 FCC!E78 | 7.910.432,18636064 vs 7.910.432,186360638 (selisih 2e-9). | Nilai ditempel (paste value) dengan presisi tampilan. | Ekstraktor membandingkan pada Rp 0,01. Tidak berdampak. |
| B-004 | Catatan sheet SKU "NRV KW 2 (FCC C208)" | NRV ada di **FCC!C209** (C208 = kg KW 2 tawar terjual 5.957). | Rujukan teks basi setelah baris disisipkan. | `product.kw2_nrv_per_kg` FCC diambil dari FCC!C209 = 9.777,27118088893 (sama dengan FCC!D74). |
| B-005 | BP "Business Plan - Model Details" kolom I | Satuan berlabel "IDR Mil" / "IDR Mio" tetapi sel berisi **Rupiah penuh** (Q76 pendapatan Agu-26 = 9.793.125.452 = BRIDGE GP C7 9.793,125 jt). | Label satuan salah di BP. | Ekstraktor: `maps_to = amount`, nilai = sel apa adanya (tidak dikali 1.000.000). Cek ulang saat impor `budget_bp` Fase 1. |
| B-006 | WP Jul26 | Tidak ada di `reference/`. | Standar v1 (Q6) dan pita rasio 3 bulan (B33) butuh 3 bulan. | Default: standar v1 = rata-rata Agu–Sep (PLAN §0). **Untuk Dika:** konfirmasi ke PPIC apakah WP Jul26 ada (sebelum Fase 2/5a). |
| B-007 | BIAYA BERSAMA!E7:E10 (akun baru Okt-26) | Hanya daftar nomor ("5101-111/121/131/141"), tanpa nama/arti. | Pola dibaca sebagai 5101-1XY: X = kelompok urut bagian 2 (1 operator → A, 2 support → B, 3 kupas → Kupas, 4 staf → B); Y = 1 upah, 2 THR, 3 bonus, 4 BPJS. 5101-201..207 = pemakaian per jenis bahan (REKON & KONTROL!A34). | `coa_pool_map` Okt-26 `confirmed = false`. **Untuk Dika:** konfirmasi nama akun di Accurate sebelum upload GL Okt (PLAN "Yang harus dilakukan manusia"). |
| B-008 | REKON MATERIAL kolom O | Kode Accurate (BB-…) hanya tertulis di catatan "saldo akhir: Inventory Valuation BB-004"; 14 dari 54 item tanpa kode. | Item tanpa transaksi bulan ini tidak punya baris IV. | `material_item.code` nullable, kunci alami = `name` (nama Average Price). Kode dilengkapi dari upload Inventory Valuation (Fase 1). |
| B-009 | SKU FG-138 Maicih Basreng L0 | Produksi Sep 0 kg / 0 bag → `kg_per_unit` tidak bisa diturunkan. | — | `kg_per_unit = null`; satuan `bag` ikut saudara grup. Isi dari master Accurate saat tersedia. |
| B-010 | `cdn.sheetjs.com` (SheetJS 0.20.3) | Host diblokir kebijakan jaringan sesi cloud ini (403 di proxy). | — | `package.json`/lockfile tetap SheetJS 0.20.3 dari CDN (sama dengan KGR; CI dan Vercel bisa mengunduh). Verifikasi lokal sesi ini memakai `xlsx@0.18.5` (API sama) yang **tidak** di-commit. **Untuk Dika:** izinkan `cdn.sheetjs.com` di network environment agar sesi berikutnya bisa `pnpm install --frozen-lockfile`. |

---

## §C. Keputusan default yang dipakai (Fase 0)

Format: ID — keputusan — default — di mana diubah — dampak kalau berubah.

| ID | Keputusan | Default yang dipakai | Di mana diubah | Dampak kalau berubah |
| --- | --- | --- | --- | --- |
| Q1 | Cakupan | Semua modul B1–B7 berurutan; flag `b1_ingest … b7_outlook` ada dan off | PLAN; `/admin/modul` | Urutan fase dan flag |
| Q2 | Repo | Repo baru `BMG-OS`, skeleton KGR (engine util, parsers generik, web), Supabase terpisah | — | — |
| Q3 | Nilai WP: buku atau manajemen | Manajemen: `app_setting.wp_is_book = false` | `/admin/modul` (Fase 6: halaman pengaturan) | Label HPP dan penjelasan K1 di rekon/management view |
| Q4 | BP | `budget_version 'BP Okt-26 v1'` `locked`, catatan D9 | `budget_version` baru (v2) | Varian budget Fase 4 dihitung ulang terhadap v2 |
| Q5 | Harga material mingguan | PI terakhir; true-up ke MA Accurate (belum dipakai di Fase 0) | `material_price_week.source` (Fase 5a) | Varian harga minggu vs true-up bulanan |
| Q6 | Tarif standar v1 | Rata-rata aktual Agu–Sep (WP Jul tidak tersedia, §B B-006) | `std_version` | HPP standar dan varian minggu |
| Q9 | Kapasitas normal | = jam dibayar sampai PPIC mengisi; `assumption.idle_to_period = 0` | `capacity.normal_capacity_hours` | Bagian jam menganggur pindah ke beban periode (HPP/kg turun saat volume turun) |
| Q10 | WIP completion | 100% (`product.wip_completion_pct = 1`) | `product.wip_completion_pct` | Rate kartu proses dan nilai WIP akhir (D3) |
| Q11 | By-product KW 2 | NRV 9.777,27118088893/kg (FCC!C209); UU/UO 0 (LAIN-LAIN!C7) | `product.kw2_nrv_per_kg`, `assumption.nrv_kw2` | Kredit KW 2 di kartu FCC dan bahan antarproduk Lain-lain |
| Q12 | Target stok FG | 7 hari (`assumption.fg_target_days`) | `assumption` | Rencana produksi mingguan |
| Q13 | Pita BOM | ±15% (`assumption.bom_band_pct`) | `bom_line.band_low/high`, `assumption` | Validasi bon material |
| Q14 | Ambang alert varian | 2% atau 3 minggu tanda sama (`variance_alert_pct`, `variance_alert_weeks`) | `assumption` | Alert minggu |
| Q15 | Hari kunci | H+1 12:00; Senin 10:00 = BELUM DIISI (`assumption.lock_deadline`) | `assumption` | Kontrol B37 |
| Q16 | Driver D untuk UU | Estimasi dari rasio kWh (`driver_month.estimated`, Fase 1) | upload `cogm_card` | Alokasi Grup D ke UU |
| Q17 | Kupas ikut THR/BPJS | 0 (`assumption.kupas_thr_bpjs`, BIAYA BERSAMA C46) | `assumption` | Porsi THR/BPJS kupas vs operator/support/staf |
| Q18 | Konversi CNG | 22,2967 m³/MMBTU (`assumption.cng_m3_per_mmbtu`, FCC!C210) | `assumption` | Qty CNG kartu FCC |
| Q19 | Olein di WIP-022 | Tetap bahan baku di WP; K2 | `inventory_recon.category` (Fase 3) | Rekon persediaan WIP |
| Q20 | Minggu dimulai | Senin (`assumption.week_start_dow = 1`) | `assumption` | Pemotongan minggu dan biaya tetap per hari |

Q7 (jam operator Lain-lain per kelompok) dan Q8 (template xlsx lalu form web; flag `b5_forms`) belum dipakai di Fase 0; flag `b5_forms` sudah ada (off).

### Deviasi skema dari PRD §4 (Fase 0)

| ID | Deviasi | Alasan | Di mana diubah |
| --- | --- | --- | --- |
| S-01 | `coa_pool_map.pool` menambah `BPJS` dan `PAYROLL_SPLIT` | 5101-002 (upah) dan 5101-005 (BPJS) dipecah per kelompok payroll, bukan satu pool (BIAYA BERSAMA bagian 2) | Migrasi baru bila enum berubah |
| S-02 | `coa_pool_map.confirmed`, `account_name` | Membedakan mapping Sep-26 dari WP dan draft Okt-26 | — |
| S-03 | `material_item`: `id` uuid, `name` unik (kunci alami), `code` Accurate opsional (unik bila ada); kategori ditambah `kemasan`, `ubi_ungu`, `ubi_orange`, `ubi_putih`, `bahan_maklon` | §B B-008; nama Average Price dipakai WP | — |
| S-04 | `budget_line`: kolom `value`, `unit`, `bp_column_kind` (actual/plan), `bp_label` di samping `qty/price/amount` | Baris BP berbeda satuan (%, hari, orang, kg, Rp); kolom Jan–Agu 2026 adalah aktual | — |
| S-05 | `upload.status` = `staged/planned/committed/rejected` (PRD §4.7); `upload.period` teks (bulan, Senin, atau nama versi) | Satu tabel untuk upload bulanan, mingguan, harian, dan per versi | — |
| S-06 | Fungsi trigger dan provisioning login di skema `private` | Tidak terekspos API tanpa perlu `revoke` (gerbang D melarang grant/revoke) | — |
| S-07 | `payroll_group` 14 baris (bukan perkiraan 8) | Bagian 2 WP berisi 14 kelompok (3 unit operator, 8 support, 2 kupas, 1 staf) | — |
| S-08 | `assumption`: `owner`, `status`, `used_in`, `note` | Kolom ASUMSI Agu26 dipertahankan | — |

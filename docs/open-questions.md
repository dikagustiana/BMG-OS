# Open questions, selisih, dan keputusan default

Tiga bagian: **§A** masalah data/model D1–D12 (PRD §1) dan penanganannya; **§B** angka yang tidak tereproduksi atau sumber yang tidak cocok, per sel; **§C** keputusan default yang dipakai (PRD §9 Q1–Q20) dan deviasi skema, dengan tempat mengubahnya.

---

## §A. D1–D12 — status Fase 0 (+ catatan Fase 1)

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
| D10 | COA berubah Okt-26 (5101-002 → 111..144; varian 5101-201..207, 301..303) | `coa_pool_map`: 21 akun Sep-26 `confirmed = true` (berlaku s.d. 30 Sep 2026) + 41 akun Okt-26 `confirmed = false` | B44 memblok upload GL Okt bila ada akun tanpa mapping aktif (Fase 1) | Draft Okt-26 dari kolom E "akun baru"; pola 5101-1XY perlu konfirmasi (§B B-007). **Fase 1:** B44 aktif (`engine/controls.ts`): commit GL diblok bila ada akun tanpa mapping, mapping draft = PERIKSA; akun dari upload yang tertahan tampil di Input bulanan → Mapping akun (tambah/konfirmasi). Diuji e2e dengan GL Okt contoh. |
| D11 | Driver Grup D untuk UU diturunkan dari rasio kWh, bukan jam mesin aktual | `driver_month.estimated` (Fase 1); sel BIAYA BERSAMA D171 = 27,15 jam (bukan bilangan bulat) di fixture | Tampil di kewajaran (Fase 4) | Q16 default. **Fase 1:** kolom `driver_month.estimated` ada; fixture `cogm_card.xlsx` menandai UU `machine_hour` = estimasi (diuji). |
| D12 | Tautan budget di WP memakai nomor baris Model Details (MD411…) | `budget_line.driver_code = <produk>|<komponen>|<YYYY-MM>`; `bp_row` hanya untuk jejak | Unik per versi (index `budget_line_driver_key`) | Ekstraktor BP menghasilkan 1.034 baris × bulan, kode unik (diuji). **Fase 1:** parser `budget_bp` (TS) = ekstraktor Python baris per baris (golden `fixtures/budget-v1`); impor lokal 23.024 baris, 23.024 kode unik, versi terkunci. |

---

## §B. Selisih dan sumber yang tidak cocok (per sel)

Fase 0 tidak menghitung angka; semua 50 target PRD §8 cocok dengan sel WP (`docs/v1/golden-f0.md`). Yang dicatat di sini adalah ketidakcocokan **sumber** yang akan memengaruhi fase berikutnya.

| ID | Sel / sumber | Temuan | Dugaan / dampak | Tindakan |
| --- | --- | --- | --- | --- |
| B-001 | BRIDGE GP!C7:C77 (Sep26_4) vs `DI - WP Costing BMG Agu26_3.xlsx` | Kolom Agu di BRIDGE GP berasal dari **Agu26_6** (A5). Contoh: HPP_WP Agu 7.926,648 jt (C64) vs Agu26_3 RINGKASAN F10 7.770,352 jt; pool A 609,92 jt (C28) vs Agu26_3 650,6 jt. File Agu26_6 tidak ada di `reference/`. | Agu26_3 adalah versi sebelum revisi. | Bridge Fase 4 memakai `fixtures/month-2026-08/bridge_input.json` (kolom C BRIDGE GP Sep26_4). `summary.json`/`pool.json` Agustus = Agu26_3 (informasi). **Untuk Dika:** taruh `DI - WP Costing BMG Agu26_6.xlsx` di `reference/` bila ada. |
| B-002 | CEM-CEM ORI!E109 (dan sheet SKU lain) | Saldo awal FG Sep dirujuk ke "Agu26_4"; FCC!E196/E201/E202 merujuk "Agu26_3". | Tiga versi Agu dipakai di WP Sep (3, 4, 6). | Golden Sep tidak terpengaruh (nilai awal ada di sel Sep). Roll-forward FCC diverifikasi otomatis: Agu26_3 FCC!E78 = Sep FCC!C196 (±Rp 0,01). |
| B-003 | Sep FCC!C196 vs Agu26_3 FCC!E78 | 7.910.432,18636064 vs 7.910.432,186360638 (selisih 2e-9). | Nilai ditempel (paste value) dengan presisi tampilan. | Ekstraktor membandingkan pada Rp 0,01. Tidak berdampak. |
| B-004 | Catatan sheet SKU "NRV KW 2 (FCC C208)" | NRV ada di **FCC!C209** (C208 = kg KW 2 tawar terjual 5.957). | Rujukan teks basi setelah baris disisipkan. | `product.kw2_nrv_per_kg` FCC diambil dari FCC!C209 = 9.777,27118088893 (sama dengan FCC!D74). |
| B-005 | BP "Business Plan - Model Details" kolom I | Satuan berlabel "IDR Mil" / "IDR Mio" tetapi sel berisi **Rupiah penuh** (Q76 pendapatan Agu-26 = 9.793.125.452 = BRIDGE GP C7 9.793,125 jt). | Label satuan salah di BP. | Ekstraktor: `maps_to = amount`, nilai = sel apa adanya (tidak dikali 1.000.000). Komentar kolom `budget_line.amount` di `20261015000200_master.sql` ("IDR Mil × 1.000.000") keliru — berkas migrasi tidak diubah; yang berlaku catatan ini. **Fase 1:** parser `budget_bp` memakai aturan yang sama (amount = sel). |
| B-006 | WP Jul26 | Tidak ada di `reference/`. | Standar v1 (Q6) dan pita rasio 3 bulan (B33) butuh 3 bulan. | Default: standar v1 = rata-rata Agu–Sep (PLAN §0). **Untuk Dika:** konfirmasi ke PPIC apakah WP Jul26 ada (sebelum Fase 2/5a). |
| B-007 | BIAYA BERSAMA!E7:E10 (akun baru Okt-26) | Hanya daftar nomor ("5101-111/121/131/141"), tanpa nama/arti. | Pola dibaca sebagai 5101-1XY: X = kelompok urut bagian 2 (1 operator → A, 2 support → B, 3 kupas → Kupas, 4 staf → B); Y = 1 upah, 2 THR, 3 bonus, 4 BPJS. 5101-201..207 = pemakaian per jenis bahan (REKON & KONTROL!A34). | `coa_pool_map` Okt-26 `confirmed = false`. **Untuk Dika:** konfirmasi nama akun di Accurate sebelum upload GL Okt (PLAN "Yang harus dilakukan manusia"). |
| B-008 | REKON MATERIAL kolom O | Kode Accurate (BB-…) hanya tertulis di catatan "saldo akhir: Inventory Valuation BB-004"; 14 dari 54 item tanpa kode. | Item tanpa transaksi bulan ini tidak punya baris IV. | `material_item.code` nullable, kunci alami = `name` (nama Average Price). Kode dilengkapi dari upload Inventory Valuation (Fase 1). |
| B-009 | SKU FG-138 Maicih Basreng L0 | Produksi Sep 0 kg / 0 bag → `kg_per_unit` tidak bisa diturunkan. | — | `kg_per_unit = null`; satuan `bag` ikut saudara grup. Isi dari master Accurate saat tersedia. |
| B-011 | File sumber Fase 1 (PLAN §0: `CoGM SEPTEMBER 2026 R1.xlsx`, GL Accurate Sep per voucher, Inventory Valuation 1 Agu–30 Sep 2026, LK Sep-26 IS/BS + Sales by Item) | **Tidak ada** di `reference/` (hanya WP Sep26_4, Agu26_3, Agu26, BP v1). | Tata letak ekspor Accurate dan kartu CoGM asli belum bisa diuji. Angka Sep-nya ada di WP (sel input biru dengan catatan sumber). | Fixture upload `fixtures/uploads/2026-09/` disintesis dari sel WP (`scripts/make_upload_fixtures.py`, sumber per baris). Parser mengenali header dari alias (label Accurate ID/EN), dan wizard bisa memetakan ulang kolom. `cogm_card` memakai template BMG 3 sheet, bukan tata letak kartu lama. **Untuk Dika:** taruh keempat file asli di `reference/`. Sesi berikutnya menambah fixture dari file asli, dan parser kartu CoGM asli bila template tidak dipakai. |
| B-012 | Impor BP lewat API | Satu transaksi 23.024 baris melewati `statement_timeout` 8 s peran `authenticated` (diuji lokal: "canceling statement due to statement timeout"). | Batas API Supabase. Mengubah peran dilarang gerbang D. | `budget_line` ditulis bertahap (2.500 baris per transaksi), lalu `apply_upload` mengunci versi (`imported_at`). Versi baru dianggap ada setelah `imported_at` terisi. Bila tahap gagal, upload tetap `planned`, dan commit ulang hanya menambah baris yang belum ada (`driver_code`). Lokal: total ±95 detik. Di remote (compute lebih kecil) bisa lebih lama, tetapi tiap tahap jauh di bawah 8 s (2.000 baris ≈ 0,6 s lokal). |
| B-013 | FCC!C211 "Pendapatan FCC premium IFM + KW 2 tawar" | WP hanya mencatat jumlah FG-001 + 2nd Grade Tawar (FG-015); pemisahan per item ada di LK Sales by Item yang tidak tersedia. | — | Fixture: FG-015 = kg × NRV (sintetis), FG-001 = sisanya; total = LK. Engine (Fase 2+) memakai jumlah keduanya seperti WP. Ganti dengan Sales by Item asli (B-011). |
| B-101 | BP v1 sheet "BMG Business Plan" baris 226, 253, 262, 265 | F01 (aset − liabilitas − ekuitas) dan F03 selisih Rp 47–201 per bulan Jan–Agu 2026; F02 (kas arus kas − kas neraca) sampai Rp 85. Baris 265–266 BP tampil 0,0 hanya pada presisi Rp juta. Penyebab: laba tahun berjalan BP dihitung dari Model Details (`S120`, 1.070.355.076,29 untuk Agu), sedangkan GL "PL Actual MTM" memberi 1.070.354.998,28. Neraca saldo GL sendiri selisih Rp 1,78 (BS Actual MTM baris 201). | Pembulatan dan sumber laba berbeda di BP; bukan kesalahan engine (arus kas dari dua neraca = baris BP ±Rp 1, tes lulus). | Tes F01–F03 pada ±Rp 1 ditandai `todo`; batas Rp 1.000 dipakai dan residu dinyatakan. Neraca saldo Accurate asli harus seimbang pada Rp 1; F01 akan menunjukkannya. |
| B-102 | PRD v2 §4.11 dan §10.1: "F06 PERIKSA Jun–Agu" | Rasio piutang pihak berelasi ÷ ekuitas: Mei 1,5%, Jun 8,6%, Jul 12,8%, Agu 15,8% (BP v1). Ambang 10% (Q27) → PERIKSA mulai Jul. | Teks PRD menghitung Jun. | Engine mengikuti ambang; tes menyatakan Jul–Agu. Ubah ambang di `assumption.related_party_pct` bila Jun harus PERIKSA. |
| B-103 | `docs/v2/wp-verification.md` (D15) | Verifikasi independen WP Sep26_4: aritmetika terbukti, satu temuan tinggi (tiga versi Agustus dalam satu WP) dan enam sedang (sisa rekon Rp 7,21 bukan 0; ongkos kirim singkong tidak ada di tabel varian; premium adalah sisa sehingga kontrol kartu tidak bisa gagal; ±43 kontrol yang tidak bisa gagal; RINGKASAN tanpa baris penyesuaian bagian 8; Average Price singkong Rp 19,0 jt di atas GL). | Lihat dokumen. | D15 ditutup untuk penggunaan golden. Halaman manajemen dibuka untuk peran Manajemen hanya setelah versi Agustus diputuskan, atau angka HPP kartu dan UU berstatus Sementara. |
| B-104 | Neraca saldo Accurate Sep-26 | Tidak ada di `reference/`. Fixture `fixtures/uploads-fs/2026-08/tb_month.xlsx` disintesis dari saldo GL Agu-26 di sheet "BS/PL Actual MTM" (`scripts/make_fs_fixtures.py`). | Tata letak ekspor TB/LK Accurate asli belum teruji. | Parser mengenali header dari alias (saldo bertanda atau pasangan debit/kredit) dan wizard bisa memetakan ulang kolom. **Untuk Dika:** unggah LK Sep-26. |
| B-010 | `cdn.sheetjs.com` (SheetJS 0.20.3) | Host diblokir kebijakan jaringan sesi cloud ini (403 di proxy). | — | `package.json`/lockfile tetap SheetJS 0.20.3 dari CDN (sama dengan KGR; CI dan Vercel bisa mengunduh). Verifikasi lokal sesi ini memakai `xlsx@0.18.5` (API sama) yang **tidak** di-commit. **Untuk Dika:** izinkan `cdn.sheetjs.com` di network environment agar sesi berikutnya bisa `pnpm install --frozen-lockfile`. |
| B-030 | CEK KEWAJARAN!A6:A20 vs PRD v2 §4.8/§10.1 "14 KPI FCC" | Bagian 1 memuat **15** KPI (masuk proses s.d. kartu lama per kg barang baik). | PRD menghitung salah satu baris (kemungkinan masuk proses dianggap volume, bukan KPI). | Fase 3–4: engine memakai 15 (WP benar untuk angka); status dan catatan 15 baris = kolom M, N. Bagian 2 = **6 CEK** (F25:F37), sama dengan PRD v2 (v1 menulis 7). |
| B-031 | REKON & KONTROL!C46 vs PRD v2 §4.7 "sisa 0" | Sisa HPP GL − HPP rekonsiliasi = 0,0000072 jt = Rp 7,21. | PRD membulatkan ke 4 desimal jt. | Engine mereproduksi Rp 7,21; B19 LULUS (toleransi Rp 1.000). Tidak ada tindakan. |
| B-032 | FCC!F133 (23.301,54/kg) vs FCC!F66 (23.478,38/kg) | Varian per komponen (bagian 4) tidak memuat ongkos kirim singkong (FCC!F43 = 176,84/kg); total aktual varian ≠ biaya produksi per kg. RINGKASAN B16 memakai F133. | Rancangan WP: BP tidak punya baris ongkir terpisah. | Engine mengikuti WP. **Untuk Dika:** putuskan apakah ongkir masuk komponen "Singkong" (harga) di varian; bila ya, ubah tata letak varian (bukan golden). |
| B-033 | Sheet BUDGET Sep26_4 | Semua angka budget dikosongkan ("permintaan user, Okt-26"); FCC/UU/UO bagian 4 dihitung dengan budget 0. | — | Golden varian = budget kosong (cocok 1.068 sel F4 termasuk bagian 4). Varian vs BP v1 tidak punya golden WP; diuji dengan cek = 0, B42 (Σ komponen = biaya produksi BP) dan B43 (Σ pool = pool BP) — semuanya LULUS untuk Sep-26. |
| B-034 | Sel biru REKON & KONTROL!C73, C75, C76; REKON MATERIAL!C67:C69, E67:E70 | Angka GL/LK yang diketik di WP (pendapatan GL 4101-007, mutasi GL 1106-002/003, GL 1106-001 penerimaan/pemakaian, LK PL HPP 4 angka) belum punya kunci di tabel B1 (`fs_control` hanya 9 kunci; upload GL Fase 1 hanya akun konversi dan opex). | — | Engine menerimanya sebagai field bernama (`ReconHppInputs.glRevenue`, `glInventoryMovement`, `ReconMaterialInputs.gl`, `lkPlHpp`). Usulan: kunci `fs_control` baru (lihat `docs/v2/F34-engine-notes.md`); check constraint perlu migrasi baru (Fase ≥ 2, Dika). |
| B-006 (Fase 3–4) | B33 rasio pemakaian 3 bulan | Riwayat kartu lama Jan–Sep (CEK KEWAJARAN bagian 3) memuat Jul, jadi karton dan olein bisa dihitung tanpa WP Jul26. HDPE tidak ada di riwayat. | — | B33 Sep-26: karton PERIKSA (−98,3% vs Jun–Agu), olein LULUS, HDPE BELUM_DIISI sampai 3 bulan data kartu per item (Sep–Nov). |

---

## §C. Keputusan default yang dipakai (Fase 0; Fase 1b di bawah)

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

### Keputusan Fase 1

| ID | Keputusan | Default yang dipakai | Di mana diubah | Dampak kalau berubah |
| --- | --- | --- | --- | --- |
| K-01 | Siapa membaca input bulanan mentah (§4.2) | admin, finance, cost_accounting. Peran lain dan management tidak (payroll per kelompok sensitif); management membaca data mart | Policy `<tabel>_select` di migrasi baru | Halaman Input bulanan dan RLS |
| K-02 | Akun B01 ("16 akun" LK) | Akun GL bulan itu yang mapping aktifnya pool konversi (A, KUPAS, B–E, THR, BPJS, PAYROLL_SPLIT) **dan** berawalan `5101-` atau `6500-006/007` | `engine/controls.ts` (`isConversionAccount`) | COA baru di luar pola ini perlu ditambah ke daftar |
| K-03 | Akun B02 | Akun ber-mapping `PAYROLL_SPLIT` (Sep-26: 5101-002) vs Σ `payroll_journal` | `engine/controls.ts` | Okt-26: 5101-002 dipecah ke 5101-1X1 (pool A/B/Kupas). B02 menjadi BELUM DIISI sampai aturannya diputuskan bersama mapping Okt (B-007) |
| K-04 | Cakupan B44 | Akun berawalan 5, `6500-006/007`, dan akun bertag voucher | `engine/controls.ts` (`mappingGaps`) | Akun opex tanpa tag tidak perlu mapping |
| K-05 | Upload bulanan = set lengkap bulan itu | Baris bulan yang tidak ada di file dihapus (soft). Bagian file yang kosong (mis. sheet Jurnal hilang) tidak menghapus apa pun | `apps/web/lib/upload-handlers.ts` | — |
| K-06 | Versi standar dari upload | Selalu draft baru; kode yang sudah ada ditolak (tidak ditimpa); kapasitas hanya PPIC/Admin | handler `std_master` | — |
| K-07 | Versi budget dari upload | Nama versi = periode; versi yang sudah diimpor (`imported_at`) tidak bisa diubah (guard DB) | handler `budget_bp`, `private.tg_budget_line_guard` | Revisi BP = versi baru (D9) |

### Keputusan Fase 1b (tanpa menunggu Dika; PRD v2 Q21–Q30 dipakai apa adanya)

Q21–Q30 dari PRD v2 §11 dipakai sebagai default; tidak ada yang diubah.

| ID | Keputusan | Default yang dipakai | Di mana diubah |
| --- | --- | --- | --- |
| K2-A | Sumber neraca Jan–Agu | Kolom Actual sheet "BMG Business Plan" apa adanya (D13) | `history_fs_line` (impor `bp_fs`) |
| K2-B | Tanda `coa_fs_map` | Aset +1, liabilitas dan ekuitas −1 (saldo TB debit-positif), laba rugi −1 (biaya negatif, pendapatan positif seperti BP) | `coa_fs_map.sign` |
| K2-C | HPP dari TB | Total HPP = Σ baris biaya BP baris 66–86 tanpa baris 83 (selisih kartu vs GL, memo). Akun 5101-015 Varian Produksi masuk baris "Bahan" (grup Accurate PL 04) | `coa_fs_map` |
| K2-D | Baris BP "Delivery Expenses" ganda | Akun 5101-016 → baris 84 (pabrikasi dan pengiriman); akun 6300-001…004 → baris 100 (ongkos kirim umum) | `coa_fs_map` |
| K2-E | Arus kas bulan pertama TB | Kas awal = kas neraca bulan sebelumnya (bukan rantai kas BP) sehingga F02 menguji kesesuaian dua neraca | `fs.ts` `cashflow` |
| K2-F | Label BP yang tidak dijumlah di mana pun | "Accrued Expenses - Third Parties" → Accrued Others; "Taxes Payable" (PPh 26, 29) → Hutang PPh 25; pajak 8300/8100 → Pajak penghasilan | `coa_fs_map` |
| K2-G | Akun nol di BP yang belum dipetakan | Dipetakan draft berdasar grup Accurate (`confirmed = false`); 215 dari 288 baris terkonfirmasi; 27 akun COA Okt-26 draft | Input bulanan → Mapping akun |
| K2-H | Flag di remote | Tidak diubah oleh sesi ini (`execute_sql` hanya `select`); `b8_fs` baru default mati | Pengaturan → Modul |

### Keputusan Fase 3–4 (engine `recon.ts`, `reasonableness.ts`, `variance.ts`, `bridge.ts`)

Nomor B-030+ dan F34-xx dipakai agar tidak bentrok dengan Fase 2 yang dikerjakan paralel. Rincian: `docs/v2/F34-engine-notes.md`.

| ID | Keputusan | Default yang dipakai | Di mana diubah | Dampak kalau berubah |
| --- | --- | --- | --- | --- |
| F34-01 | Sumber riwayat kartu lama Jan–Agu (kewajaran bagian 1, `kpi_series`, B33) | Tabel input baru `history_cost_line (month, kind, product, key, value, unit, source_ref, upload_id)`, `kind` = `old_card_fcc` (16 angka/bulan, format upload = CEK KEWAJARAN bagian 3), `mom_prior` (13 KPI bagian 2 bulan sebelum platform), `bridge_prior` (71 input BRIDGE GP bulan sebelum platform). Mulai Sep-26 `old_card_fcc` diunggah bulanan dari kartu lama; `mom_prior`/`bridge_prior` hanya untuk Agu-26 | Migrasi + parser (fase dengan halaman §7.6) | 14 dari 16 angka bisa diambil dari `cogm_card`/`cogm_material`/`driver_month` mulai Sep; total kartu lama tidak |
| F34-02 | Jendela tren | 8 bulan tepat sebelum bulan itu; min/maks/status hanya bila lengkap; batas inklusif | `trendKpis(window)` | Bulan Feb–Agu 2026 tampil tanpa status |
| F34-03 | Kode B23–B30 | B23 subledger stabil (C30+C31), B24 Σ K1 WIP akhir (C32), B25 Σ K1 FG akhir (C33), B26 Σ K1 WIP awal (C34), B27 Σ K1 FG awal (C35), B28 sisa WIP+FG (C36+C37), B29 Σ Δ = rekon HPP (C38), B30 item K6 bersaldo (C39) | `recon.ts reconInventoryByItem` | Label kontrol di layar §7.7 |
| F34-04 | Kategori K1–K6 bawaan | Lingkup WP → K1; akun lain → K6; WIP olein (`material_item.category = 'olein'`, Q19) → K2; WIP lain → K3; FG tanpa mutasi → K4; FG bermutasi → K5; override reviewer menang | `classifyInventoryItem`, `inventory_recon.category` | Mereproduksi kolom D WP untuk 81 item |
| F34-05 | Flex budget pool | Porsi tetap = `budget_pool_map.fixed_pct`; kosong → porsi tetap pool aktual bulan itu (`pool_month.fixed ÷ total`); material variabel penuh | `budget_pool_map.fixed_pct` | Pembagian volume vs harga/belanja di varian pool |
| F34-06 | Grup A/B budget | Diselaraskan seperti BUDGET baris 87–88 WP (DL × 13/12 + BPJS DL; support × 13/12 + staf + indirect + BPJS IDL; porsi driver C) | `variance.ts BP_V1_SHARED` | A + B per produk tetap = BP |
| F34-07 | B43 | Σ pool budget FCC/UU/UO + Lain-lain = Σ baris `budget_pool_map` bagian 4.3 (kode `4.3_…`), level total | `varianceMonth` | Per pool A/B tidak sama setelah penyelarasan |
| F34-08 | Varian Lain-lain | Level total: Σ `others_month` vs BP "Total Cost of Manufacturing" + "Volume Premium" | BP v2 | Komponen setelah BP v2 |
| F34-09 | Tampilan bridge direksi | b2 + b12 digabung di posisi b2 (16 bar + 2 margin); waterfall WP bagian 5 (8 grup) terpisah | `bridgeDisplayBars`, `bridgeWaterfallWp` | — |
| F34-10 | `source_ref` | Alamat sel padanan di template WP Sep26_4 untuk setiap baris data mart (golden: sel yang diuji); `inputs.<nama>.ref` = sumber operand | `mart-row.ts` | — |
| F34-11 | B33 | Rasio per kg masuk proses vs rata-rata 3 bulan sebelumnya, pita ±15% (Q13); item tanpa data → BELUM_DIISI | `usageRatioControl(band, window)` | — |
| F34-12 | Lingkup K1 butuh kode WIP per produk | `product.wip_item_code` (FCC WIP-067, UU WIP-139, UO WIP-138) diusulkan; FG dari `product.fg_item_code` dan `sku.code` | Migrasi master (Fase ≥ 2) | Tanpa itu WIP produk jatuh ke K3 |

### Deviasi skema dari PRD §4 (Fase 1)

| ID | Deviasi | Alasan | Di mana diubah |
| --- | --- | --- | --- |
| S-09 | `cogm_card.row_kind` + `output`, `output_fg`, `sample_fg`, `input_fcc_premium`, `input_kw2_fcc`, `input_kw2_ubi` | Kartu Lain-lain (LAIN-LAIN bagian 2, sheet SKU) mencatat output dan input antarproduk, kg dan satuan FG | Migrasi baru bila enum berubah |
| S-10 | `inventory_valuation`: `item_name`, `value_out_transfer` | Rincian Valuasi Accurate punya nilai transfer; nama dipakai rekon | — |
| S-11 | `average_price`: `item_name` (kunci = nama Average Price), `item_code` diisi dari `material_item` bila cocok | Sama dengan `material_item` (S-03, B-008) | — |
| S-12 | `gl_voucher_tag.target_line` | Ongkos kirim singkong masuk material **FCC** (BIAYA BERSAMA C153) | — |
| S-13 | `sales_by_item.unit`, `item_code` nullable | SKU Lain-lain dijual per bag; "produk tanpa kartu" tidak punya kode | — |
| S-14 | `cogm_material`: `material_group` (kelompok kartu: Raw materials, Oil, CNG, Material-others, FCC, KW2, KW2UBI, EXT), `item_code` kosong | Nama material kartu berbeda dari nama Average Price; pemetaan item → master dibuat di Fase 2 | — |

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

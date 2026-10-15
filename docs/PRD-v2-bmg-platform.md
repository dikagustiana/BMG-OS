# PRD v2 — BMG Costing & Operations Platform

Oct 16, 2026 · @Dika

## 0. Ringkasan

BMG-OS v2 adalah satu aplikasi pabrik untuk dua kegiatan: **Operate** (staf pabrik mencatat shift, Finance menutup bulan) dan **Understand** (direksi membaca kinerja, biaya per kg, neraca, dan kas dengan grammar samb-bi). Engine costing v1 tetap dipakai; yang berubah adalah lapisan produk, scope neraca dan kas, dan cara input harian.

Status: Draft v2.0 untuk eksekusi · Owner: Dika (Group Project Finance, SAMB) · Entitas: PT Boga Makmur Gracia (BMG), pabrik keripik singkong (FCC), ubi ungu (UU), ubi orange (UO), lini Lain-lain. Repo `dikagustiana/BMG-OS` (`main` 282084f, Fase 0–1 merge). Supabase `BMG-OS` ref `btccexwuukrpushmharq` (production, tanpa branch). Pendamping: PLAN v2 (delta di Lampiran), `CLAUDE.md` (delta di Lampiran).

Sumber angka dokumen ini: `DI - WP Costing BMG Sep26_4.xlsx` (sudah diekstrak ke `fixtures/month-2026-09/`, golden ±Rp 1), `DI - WP Costing BMG Agu26_3.xlsx`, `BMG_Business_Plan_-_Oct26_to_Dec27.xlsx` (BP v1), dan kode repo. Angka tanpa sumber tidak muncul. Verifikasi WP Sep26\_4 dengan `verify-financial-model` belum tercatat di repo; sampai ada, semua angka WP berstatus *belum diverifikasi independen*.

### Masalah hari ini

Costing BMG dikerjakan bulanan di Excel: 22 sheet, tie ke GL Accurate, bridge margin, cek kewajaran. Hasilnya benar tetapi terlambat (WD+7 s.d. WD+10) dan tidak bisa dipakai mengelola minggu berjalan. Neraca dan arus kas hidup di workbook BP yang terpisah, tanpa kontrol ke costing. Direksi menerima angka bulanan tanpa tren, tanpa pembanding yang konsisten, dan tanpa jejak ke sumber.

### Target: tiga lapis costing + satu lapis FS

| Lapis | Ritme | Isi |
| --- | --- | --- |
| **L1 Costing bulanan** | WD+3 s.d. WD+7 | Reproduksi WP 14 langkah: material per lini → penyesuaian payroll/opex → pool A–E → alokasi → kartu proses → barang jadi → Lain-lain per SKU → rekon HPP/persediaan/material ke GL → kewajaran → varian vs budget → bridge margin → gate rilis |
| **L2 Engine mingguan** | Harian input, Senin hitung | Master standar (BOM, komposisi, routing, tarif, kapasitas) → forecast jual → rencana produksi, bahan, jam → HPP standar; input harian pabrik → biaya aktual provisional → varian yield/pemakaian/harga/efisiensi/volume |
| **L3 Tutup bulan dan outlook** | Bulanan | True-up Σ minggu ke GL, kalibrasi standar, outlook bulan berjalan, kas 13 minggu |
| **FS Neraca dan kas** (baru) | Bulanan, Fase 1b | Neraca aktual per akun dari TB/LK, neraca dan arus kas BP v1, riwayat Jan–Agu 2026, modal kerja, cek FS |

### Modul

| # | Modul | Satu kalimat | Status |
| --- | --- | --- | --- |
| B1 | Ingest dan master | Upload GL, Inventory Valuation, Sales by Item, Average Price, kartu CoGM, rekap payroll, BP; mapping akun bertanggal efektif; master standar berversi | Merge (Fase 1) |
| B8 | FS: neraca dan kas | Upload TB/LK bulanan, mapping akun → baris neraca bertanggal efektif, impor neraca + arus kas + aktual Jan–Agu dari sheet "BMG Business Plan" | Baru (Fase 1b) |
| B2 | Costing bulanan | Engine `monthly-costing` yang mereproduksi WP Sep26\_4 | Fase 2 |
| B3 | Rekon dan kontrol | REKON & KONTROL, REKON MATERIAL, REKON PERSEDIAAN (K1–K6); 45 kontrol dengan toleransi dari WP | Fase 3 |
| B4 | Varian dan bridge | CEK KEWAJARAN, varian per komponen vs flex budget BP v1, BRIDGE GP 17 bar | Fase 4 |
| B5 | Engine mingguan | Master standar, rencana dari forecast, biaya aktual dari grid shift, varian mingguan, serapan biaya tetap | Fase 5a–5b |
| B6 | Tutup bulan + tampilan manajemen | True-up ke GL, kalibrasi standar, rilis bulanan; delapan halaman direksi | Fase 6 |
| B7 | Outlook dan kas | Outlook bulan berjalan vs BP, kas harian per rekening, 13 minggu | Fase 7 |

### Yang berubah dari v1

| Area | v1 | v2 |
| --- | --- | --- |
| Engine (§4–§5) | Rumus telanjang | Rumus yang sama, ditambah worked example Sep-26 per modul dengan sel WP; modul FS baru |
| Scope | Costing dan operasi; neraca hanya 9 angka kontrol | + neraca, arus kas, modal kerja, riwayat Jan–Agu |
| Input harian | Template xlsx (Fase 3), form web (Fase 5) — Q8 | Grid shift web untuk Produksi, Gudang, Engineering; CSV/xlsx hanya untuk Purchasing, Sales, PPIC |
| Halaman | Satu tabel rute (§6 v1) | 14 layar dispesifikasi per pengguna: tujuan, data, state, tindakan, jejak sumber (§7) |
| Tampilan manajemen | "Headline" tiga baris | Delapan halaman dengan grammar samb-bi: chip periode, kartu KPI + pembanding, kolom aktual vs BP, waterfall, tabel, panel teks, jejak sel |
| Design system | Tidak ada | §8: token, type scale, spacing, kosakata status tiga sumbu, warna delta baik/buruk, komponen, aksesibilitas |
| Dibuang | — | Prototipe dan handoff Codex 16 Okt 2026 (model state dan aturan koreksi seimbang diambil, sisanya tidak); samb-bi sebagai mesin hitung kedua |

### Prinsip

1. **Satu angka.** Semua perhitungan uang di engine (`@bmg/engine`, decimal.js). Tampilan hanya membaca data mart. Tidak ada mesin hitung kedua, termasuk DAX samb-bi.
2. **WP benar untuk angka, PRD benar untuk struktur.** Golden diambil dari sel WP, bukan dari output engine.
3. **Setiap angka di layar punya jejak**: sel WP, upload (file + baris), atau rumus engine dengan input-nya.
4. **Tidak ada istilah tabel, kode PRD, atau nama fase di antarmuka.** Nama tabel hanya di tooltip Admin dan dokumentasi.
5. **Migrasi hanya menambah.** Tidak ada drop/rename. Backfill idempoten. Production adalah satu-satunya database; flag modul adalah pagar.
6. **Minggu tidak ditulis ulang.** Angka mingguan provisional tetap; true-up bulanan tampil sebagai baris terpisah.
7. **Master berversi.** BOM, routing, tarif, komposisi, kapasitas punya `effective_from` dan status approved.
8. **Kunci hari tidak menyetujui HPP bulanan.** Status input, status angka, dan status kontrol adalah tiga sumbu yang berbeda (§6).

## 1. Konteks bisnis

September 2026 adalah bulan dengan volume FCC terendah Jan–Sep dan harga singkong tertinggi, dan margin kotor GL turun 5,4 pp dari Agu. Semua angka di bagian ini dari WP Sep26\_4 (sheet dan sel di `fixtures/month-2026-09/`) dan BP v1, satuan Rp juta kecuali disebut lain.

### Sep-26 dari WP (sheet RINGKASAN, FCC, LAIN-LAIN, BIAYA BERSAMA)

- Produksi 289.759 kg; biaya produksi 6.704,3 jt; HPP 6.463,2 jt (kartu) / 6.375,4 jt (GL); pendapatan 7.462,4 jt; margin kotor GL 14,6% (Agu 19,9%).
- FCC: 236.923 kg masuk proses, biaya produksi Rp 23.478/kg, margin 13,5%. Volume −30,1% vs Agu (338.754 kg); efek biaya tetap −2,4 pp.
- Lain-lain: 45.653 kg, margin 5,0%; menyerap FCC premium 23.115,5 kg / 551,8 jt. Margin cem-cem ORI −0,9%, BBQ −0,5%, Maicih basreng −14% s.d. −24%.
- Pool konversi 1.572,8 jt (tetap 806,3 / variabel 766,4) dari GL 16 akun 1.590,9 jt plus penyesuaian bagian 8 (reklas opex pabrik 108,9 jt, THR tertukar, tali asih, ongkir singkong ke material, pisau Urschel).
- Jam menganggur Unit I 3.265 jam (13,1%), 61,6 jt, saat ini diserap produk.
- BP v1 Sep-26: pendapatan 8.746 jt (aktual −14,7%), produksi FCC 297,1 t (aktual −20%), GP 13,7%.

### Tren FCC Jan–Sep 2026 (sheet CEK KEWAJARAN bagian 1, kartu lama)

| KPI | Jan | Feb | Mar | Apr | Mei | Jun | Jul | Agu | Sep | Status Sep |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Masuk proses (ton) | 358,3 | 317,5 | 246,9 | 249,0 | 277,0 | 278,4 | 294,7 | 338,8 | 236,9 | Di luar rentang |
| Premium ÷ masuk proses | 93,0% | 100,6% | 94,6% | 92,5% | 92,5% | 94,3% | 91,9% | 93,8% | 93,3% | Dalam rentang |
| KW 2 ÷ masuk proses | 2,2% | 2,9% | 2,9% | 4,0% | 3,8% | 3,9% | 4,4% | 4,1% | 3,2% | Dalam rentang |
| Waste ÷ masuk proses | 2,7% | 3,0% | 2,9% | 3,2% | 3,3% | 2,7% | 3,4% | 2,8% | 2,7% | Dalam rentang |
| Harga singkong kulit (Rp/kg) | 1.869 | 1.887 | 1.906 | 2.002 | 2.203 | 2.600 | 2.758 | 2.674 | 2.943 | Di luar rentang |
| Kartu lama per kg barang baik (Rp) | 17.277 | 17.973 | 18.461 | 19.565 | 20.632 | 21.238 | 21.439 | 20.701 | 21.490 | Di luar rentang |

Rendemen Feb 100,6% terjadi karena WIP awal ikut keluar sebagai premium; definisi WP (premium ÷ masuk proses) tidak mengoreksi pergerakan WIP, dan v2 mempertahankan definisi itu demi kesinambungan tren (§11 Q21). Catatan WP untuk status "di luar rentang" dibawa apa adanya ke layar (§7.1).

### Neraca Jan–Agu 2026 (BP v1, sheet "BMG Business Plan" baris 126–266, kolom Actual)

| Pos | Jan | Feb | Mar | Apr | Mei | Jun | Jul | Agu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Kas dan setara kas | 8.861,3 | 9.070,8 | 8.774,7 | 9.011,1 | 8.181,5 | 17.552,5 | 4.571,4 | 5.222,3 |
| Piutang dagang pihak ketiga | 8.379,6 | 9.146,5 | 6.014,6 | 5.718,5 | 7.441,4 | 6.894,0 | 7.749,8 | 8.144,8 |
| Piutang lain-lain pihak berelasi | 0 | 0 | 0 | 0 | 501,3 | 2.910,7 | 4.435,2 | 5.631,9 |
| Persediaan (BB + WIP + FG + teknik) | 2.450,5 | 2.498,6 | 2.202,6 | 2.422,3 | 2.677,2 | 2.338,4 | 2.297,6 | 2.593,7 |
| Liabilitas lancar | 8.135,9 | 8.044,7 | 6.703,0 | 7.116,2 | 8.053,9 | 17.662,8 | 6.761,4 | 8.105,6 |
| Modal kerja bersih | 7.168,0 | 7.829,3 | 5.629,1 | 5.070,9 | 6.309,6 | 5.774,3 | 7.325,6 | 7.019,8 |
| Laba tahun berjalan (YTD) | 1.700,8 | 2.741,7 | 1.926,6 | 2.181,1 | 2.660,6 | 3.093,8 | 3.641,6 | 4.712,0 |
| Ekuitas | 32.630,0 | 33.670,9 | 32.855,8 | 33.110,3 | 33.589,8 | 34.023,1 | 34.570,9 | 35.641,2 |

Tiga hal yang akan langsung tampil di halaman neraca (§7.4):

- Liabilitas lancar Jun 17.662,8 jt karena hutang bank jangka pendek 9.994,8 jt, dengan saldo CTBC 15.221,6 jt di akhir bulan yang sama; Jul keduanya kembali ke 0 dan 667,9 jt. Arus kas bersih Jul −12.981,2 jt.
- Piutang lain-lain pihak berelasi naik dari 0 ke 5.631,9 jt dalam empat bulan, 15,8% ekuitas Agu. BP v1 menahan saldo itu tetap sampai Des-27.
- Dua kontrol BP (kas akhir arus kas = kas neraca; aset bersih = ekuitas) bernilai 0 di setiap bulan Jan-26 s.d. Des-27.

Pembanding BP hanya ada mulai Sep-26: kolom Jan–Agu di BP v1 adalah aktual, bukan anggaran. Sheet "BS Actual MTM - Aug 26" memuat kolom Sep dan Okt yang hanya salinan Agu dengan dua sel kosong (tidak balance, −1.400 jt); kolom itu tidak dibaca engine.

### Masalah data dan model (D1–D12 dari v1, D13–D15 baru)

| ID | Masalah | Penanganan v2 |
| --- | --- | --- |
| D1 | Kartu baru belum dibukukan; HPP Accurate memakai kartu lama (cem-cem ORI: WP 332,4 jt vs Accurate 249,7 jt) | Q3: nilai WP = manajemen; rekon K1 menjelaskan selisih; label "manajemen" vs "buku" di setiap HPP |
| D2 | Kapasitas menganggur diserap produk | `normal_capacity_hours` per departemen; di atasnya = beban periode |
| D3 | WIP dinilai 100% selesai; UU WIP awal 4.042 kg vs produksi 467 kg | `wip_completion_pct` per produk; kontrol B34 |
| D4 | FG-001 masuk kartu 221.027 vs Accurate 211.980 kg; transfer 23.116 vs 14.058 kg | Kontrol B21/B22 status PERIKSA |
| D5 | Karton FCC Sep 100 pcs vs perkiraan 6.419 pcs (61,7 jt belum dikeluarkan) | Kontrol rasio pemakaian B33 |
| D6 | Olein ditahan di WIP-022 Accurate (225,7 jt akhir Sep) | Kategori K2; keputusan proses dicatat |
| D7 | Sheet ASUMSI dirujuk tetapi tidak ada | Tabel `assumption` |
| D8 | BUDGET di WP kosong; BP v1 beda klasifikasi | `budget_pool_map` + flex budget |
| D9 | BP v1: laba jual aset 60 jt/bulan hardcode; pajak Sep–Des 2026 kosong; Lain-lain tidak membayar FCC | `budget_version` v1 "as-is"; v2 oleh manusia |
| D10 | COA berubah Okt-26 (5101-002 → 111..144; varian 5101-201..207, 301..303) | `coa_pool_map` dan `coa_fs_map` bertanggal efektif, wajib sebelum upload Okt |
| D11 | Driver Grup D untuk UU dari rasio kWh, bukan jam mesin | Kolom `estimated=true`; tampil di kewajaran |
| D12 | Tautan budget memakai nomor baris Model Details | Kunci budget = kode driver |
| D13 | Sheet "BS Actual MTM - Aug 26" kolom Sep/Okt salinan Agu, tidak balance | Engine membaca neraca dari sheet "BMG Business Plan" kolom Actual saja; kolom berlabel BP masuk `budget_fs_line` |
| D14 | Tidak ada RKAP Jan–Sep 2026 | Jan–Agu tampil sebagai tren aktual tanpa pembanding BP; delta vs BP mulai Sep-26 |
| D15 | WP Sep26\_4 belum diverifikasi independen | Jalankan `verify-financial-model` sebelum halaman direksi dibuka ke pengguna selain admin |

## 2. Pengguna

Empat tipe pengguna membawa pertanyaan yang berbeda ke aplikasi yang sama, dan tiap tipe mendarat di layarnya sendiri. Sepuluh peran v1 tetap sebagai hak tulis; tipe pengguna menentukan titik masuk, kepadatan informasi, dan perangkat.

### Empat tipe pengguna

| Tipe | Peran | Ritme | Perangkat | Pertanyaan yang dibawa | Titik masuk |
| --- | --- | --- | --- | --- | --- |
| **Staf pabrik** | `production`, `warehouse`, `engineering` | Per shift, 3 kali sehari | Tablet di lantai pabrik atau HP; jaringan tidak selalu stabil | "Shift ini sudah kuisi belum? Neracanya seimbang? Hari ini sudah dikunci?" | Grid shift hari ini (§7.9) |
| **Perencana** | `ppic`, `purchasing`, `sales` | Mingguan, Jumat–Senin | Laptop kantor | "Minggu depan produksi berapa, bahan berapa, jam cukup? Harga material minggu ini?" | Rencana minggu (§7.11) |
| **Penyusun** | `finance`, `cost_accounting` | Bulanan, WD+1 s.d. WD+7 | Laptop kantor, dua layar | "Upload mana yang belum? Kontrol mana yang gagal? Rekon sudah nol? Boleh rilis?" | Input bulanan (§7.12) |
| **Direksi** | `management`; `admin` sebagai pembaca | Bulanan setelah rilis, mingguan untuk HPP/kg | Laptop, kadang HP | "Margin bulan ini kenapa turun? HPP/kg vs standar? Kas ke mana? Mana yang belum dikunci?" | Kinerja bulan (§7.1) |

`admin` (Dika) membuka semua halaman dan mengelola flag, pengguna, dan versi standar.

### Hari kerja tiap tipe

**Staf pabrik.** Operator shift membuka tablet di akhir shift. Layar yang muncul adalah grid hari ini untuk lininya: WIP awal sudah terisi dari WIP akhir shift sebelumnya, kolom lain kosong. Ia mengisi input proses, premium, KW 2, waste, WIP akhir, sampel; neraca material dihitung langsung di baris itu. Kalau neraca gagal, baris merah dan tombol Kirim mati sampai angkanya seimbang. Gudang mengisi bon material per lini di grid yang sama (tab Gudang); Engineering mengisi meter kWh dan jam mesin (tab Mesin). Supervisor produksi mengunci hari setelah tiga tab lengkap. Target: satu shift terisi dalam ≤ 3 menit, tanpa menu lain.

**Perencana.** Sales mengirim forecast minggu depan Jumat; Purchasing mengisi harga material minggu berjalan; PPIC membaca rencana produksi yang dihitung engine (kg input, bahan, jam vs kapasitas) dan menyetujui atau mengubah target. Tiga peran ini memakai CSV/xlsx karena datanya 20–60 baris sekaligus (≈ 60 item material; 21 kelompok Lain-lain) dan disiapkan di Excel.

**Penyusun.** Finance mengunggah sembilan jenis file bulanan, memeriksa B01/B02/B44 LULUS, melengkapi tag voucher dan mapping akun, lalu menjalankan costing. Cost Accounting mengunggah kartu CoGM dan membaca rekon per item. Keduanya bekerja dari satu halaman status: apa yang belum, apa yang gagal, apa yang menunggu keputusan.

**Direksi.** Membuka Kinerja bulan setelah rilis: enam kartu dengan pembanding, tren Jan–bulan ini, waterfall bridge margin, catatan kewajaran. Satu klik ke Biaya per kg, Neraca & BP, atau Rekonsiliasi. Tidak pernah melihat nama tabel, kode kontrol, atau tombol upload.

### Sepuluh peran dan hak tulis (v1 §2, tetap)

| Peran | Siapa | Bisa |
| --- | --- | --- |
| `admin` | Dika | Semua; flag modul; approve versi standar; pengguna |
| `finance` | Finance BMG | Upload GL/IV/Sales/Average Price/payroll/TB-LK; cost pool; true-up; rilis bulanan; budget dan mapping neraca |
| `cost_accounting` | Pengerja WP | Upload kartu CoGM; jalankan costing bulanan; lihat semua rekon; tidak bisa rilis |
| `ppic` | PPIC pabrik | Master BOM/komposisi/routing/kapasitas (draft); rencana produksi; approve downgrade |
| `production` | Supervisor/admin produksi | Grid produksi per shift, jam kerja, kunci hari, koreksi |
| `warehouse` | Gudang | Bon material |
| `engineering` | Engineering | Meter kWh, jam mesin, downtime |
| `purchasing` | Purchasing | Harga material minggu, rencana beli |
| `sales` | Sales | Forecast jual mingguan |
| `management` | Direksi BMG, SAMB | Semua view baca |

Hak tulis per area ditetapkan di `apps/web/lib/roles.ts` dan RLS. Pemilik workflow berbeda dari izin tulis: Produksi mengunci hari hanya setelah catatan Gudang dan Engineering untuk hari itu lengkap. Identitas tampil sebagai nama lengkap, bukan email.

## 3. Arsitektur

Satu jalur: sumber → tabel input → engine murni → data mart → tampilan. Tampilan tidak menghitung apa pun; grammar samb-bi dipinjam sebagai komponen tampilan, bukan sebagai mesin. Diagram dipertahankan sebagai teks supaya ikut terbawa ke `docs/` di repo.

```
Sumber manusia                 Sumber sistem
  grid shift (tablet)            GL Accurate, Inventory Valuation, Sales by Item,
  CSV/xlsx mingguan              Average Price, TB/LK bulanan, kartu CoGM, BP v1
        │                               │
        ▼                               ▼
  Validasi baris ──────► Tabel input (§5.2–5.3) ◄── Upload wizard: stage → plan → commit
        │                               │
        └───────────────┬───────────────┘
                        ▼
              @bmg/engine (murni, decimal.js, tanpa I/O)
   ┌────────────────┬────────────────┬────────────────┬────────────────┐
   │ monthly-       │ weekly-        │ fs.ts          │ outlook.ts     │
   │ costing.ts     │ engine.ts      │ (neraca, NWC,  │ cash.ts        │
   │ (WP 14 langkah)│ (standar,      │ arus kas,      │ (adaptasi KGR) │
   │                │ aktual, varian,│ cek FS)        │                │
   │                │ serapan)       │                │                │
   └────────┬───────┴───────┬────────┴───────┬────────┴───────┬────────┘
            ▼               ▼                ▼                ▼
   Data mart bulanan   Data mart mingguan   fs_month          pl_daily
   cost_month …        plan_week …          fs_check_month    cash_position
   bridge_month        variance_week        nwc_month
            └──────── rebuildMonth(month) / rebuildWeek(week) ────────┘
                        │  setiap baris: source, document_ref, upload_id, rule_id
                        ▼
   ┌──────────────────┬──────────────────┬──────────────────┐
   │ Direksi (§7.1–8) │ Pabrik (§7.9–10) │ Lainnya (§7.11–14) │
   │ 8 halaman grammar│ grid shift,      │ input bulanan,     │
   │ samb-bi          │ penyelesaian hari│ tutup bulan, admin │
   └──────────────────┴──────────────────┴──────────────────┘
```

### Paket

- `packages/engine/src/`: `pool.ts`, `allocation.ts`, `process-card.ts`, `finished-goods.ts`, `others-sku.ts`, `recon.ts`, `reasonableness.ts`, `variance.ts`, `bridge.ts`, `standards.ts`, `plan.ts`, `actual-week.ts`, `absorption.ts`, `trueup.ts`, `calibration.ts`, `outlook.ts`, `cash.ts`, dan baru `fs.ts` (neraca, NWC, arus kas indirect, cek FS) serta `history.ts` (riwayat Jan–Agu dari BP). Setiap modul: tipe input/output sendiri, golden test dari fixture, rule test per cabang. Tidak ada `number` di aritmetika uang.
- `packages/parsers/`: SheetJS; satu parser per jenis upload (§6.1), ditambah `tb_month` (TB/LK Accurate) dan `bp_fs` (sheet "BMG Business Plan" kolom Actual dan BP).
- `apps/web`: Next.js 15 App Router + Supabase SSR. Komponen tampilan di `components/` mengikuti §8: `PeriodChips`, `KpiCard`, `ColumnChart`, `Waterfall`, `DataTable`, `NotePanel`, `StatusBadge`, `SourceTrace`, `ShiftGrid`. Grafik digambar sebagai SVG sendiri (bersama < 50 kB). Tidak ada ECharts, tidak ada chart library eksternal.
- `supabase/`: migrasi aditif, RLS per peran, tes `rls_roles.sql`.

### Satu angka, dan apa yang dipinjam dari samb-bi

samb-bi menghitung ulang measure lewat DAX → DuckDB. BMG-OS tidak meniru itu: GM %, HPP/kg, dan varian hanya dihitung sekali di engine dan disimpan di data mart. Yang dipinjam dari samb-bi adalah grammar tampilannya, yang terbukti terbaca oleh manajemen SAMB: chip periode, kartu KPI dengan pembanding bernama dan warna baik/buruk, kolom aktual vs BP dengan periode terpilih ditebalkan, tabel laba rugi dengan kolom % pendapatan, panel teks "Cara baca" di samping angka, halaman cek dengan status dan catatan, dan jejak sumber per visual. Tombol SQL samb-bi menjadi `SourceTrace`: sel WP untuk bulan golden, file dan baris upload untuk input, `rule_id` beserta input-nya untuk angka hitungan.

Alasan menolak mesin kedua: dua mesin untuk angka yang sama akan berselisih Rp 1 di suatu bulan, dan tidak ada yang tahu mana yang benar. Alasan menolak ECharts: 1,03 MB melanggar batas chart library 50 kB di `CLAUDE.md`, dan grafik yang dibutuhkan (kolom, garis, waterfall) sederhana.

### Rebuild dan antrian

Rebuild dipicu setelah commit upload, kunci hari, approve versi standar, impor BP, dan tombol manual admin. Antrian `rebuild_queue` (kind month|week|day, period, reason, status, error). `rebuildMonth` < 10 detik, `rebuildWeek` < 3 detik pada volume saat ini (≈ 60 item material, 21 kelompok Lain-lain, 11 SKU koperasi, ≈ 150 baris input harian). Halaman hanya membaca data mart: waktu muat < 1 detik untuk halaman direksi. Pelajaran dari samb-kpi: halaman dengan enam measure per visual yang dihitung saat dibuka butuh > 8 detik; itu yang dihindari.

### Infrastruktur

- Supabase `BMG-OS` adalah production dan satu-satunya database; tidak ada branch. Preview Vercel per PR memakai database yang sama, jadi halaman modul hanya tampil bila flag-nya on dan peran diizinkan. Flag `b2_costing` s.d. `b7_outlook` wajib off sampai fase-nya merge (per 16 Okt 2026 semuanya on di remote; lihat Lampiran).
- `apply_migration` oleh Claude hanya di Fase 0, 1, dan 1b selama semua tabel data kosong (gerbang D `CLAUDE.md`). Mulai Fase 2 atau begitu ada upload `committed`, migrasi diterapkan Dika setelah merge, dengan backup `pg_dump` dijalankan dulu.
- Data bisnis (GL, WP, payroll, TB) hanya diunggah manusia lewat aplikasi.
- Upload lewat API dibatasi `statement_timeout` 8 detik peran `authenticated`; transaksi > ±2.500 baris dipecah (`UploadHandler.chunk`).

## 4. Engine: cara kerja per modul

Engine membaca tabel input, menghitung dalam decimal.js, dan menulis data mart; setiap modul di bawah diberi rumus dan worked example Sep-26 yang tie ke sel WP Sep26\_4 (toleransi ±Rp 1 untuk uang, ±0,0001 untuk pp, ±0,01 kg). Modul 4.1–4.8 adalah L1 (Fase 2–4), 4.9–4.10 L2 dan L3 (Fase 5–6), 4.11 FS (Fase 1b), 4.12 outlook dan kas (Fase 7).

### 4.1 Pool konversi (BIAYA BERSAMA) — `pool.ts`

Alur: 16 akun GL konversi dijumlah per pool, lalu dikoreksi tag voucher bagian 8 (reklas opex pabrik, THR tertukar, tali asih cut-off, ongkir singkong ke material, pisau Urschel). Upah 5101-002 dipecah: upah harian × porsi rekap per kelompok → A/B/Kupas; gaji staf → B; tali asih → B pada bulan jasa. THR dan BPJS dibagi porsi upah pokok per kelompok (Kupas ikut bila `assumption.kupas_thr_bpjs = 1`, default 0). Tetap/variabel per baris pool mengikuti WP.

```latex
pool\_total_p = \sum_{a \in p} gl(a) + \sum_{t:\ target\_pool = p} gl\_voucher\_tag(t)
```

Sep-26 (sheet BIAYA BERSAMA, baris 81–87): GL 16 akun 1.590,9 jt → pool 1.572.766.737,19 (C87). Per pool: A 469.314.556,75 (C81), Kupas 53.598.624,96 (C82), B 419.567.213,29 (C83), C 46.737.260 (C84), D 313.485.769,27 (C85), E 270.063.312,92 (C86). Tetap 806.327.113,62 (D87), variabel 766.439.623,57. Kontrol B01–B05.

### 4.2 Jam menganggur — `pool.ts`

```latex
idle\_hours = hours\_paid_{Unit\ I} - \sum man\_hour\_to\_product;\quad idle\_cost = idle\_hours \times \frac{pool_A}{hours\_paid}
```

Beban periode = max(0, idle\_hours − (hours\_paid − normal\_capacity\_hours)) × rate. Default `normal_capacity_hours = hours_paid`, identik dengan WP, sampai PPIC menetapkan (Q9). Sep-26: 3.265 jam (13,1%), 61,6 jt, seluruhnya diserap produk, sehingga pos "jam menganggur" di rekon = 0 (REKON & KONTROL C43).

### 4.3 Alokasi — `allocation.ts`

A dan B per man-hour; Kupas per kg dikupas; C per kWh; D per jam mesin goreng setelah porsi bagging (`kwh_bagging / kwh_total`) dipotong ke Lain-lain; E per nilai material. Metode budget (volume) dihitung paralel untuk kolom "metode alokasi" di varian. Sep-26 (BIAYA BERSAMA baris 121): FCC 1.287.026.419,50 · UU 5.780.271,39 · UO 78.965.900,38 · Lain-lain 200.994.145,92; Σ = pool total (B05).

### 4.4 Kartu proses — `process-card.ts`

Rata-rata tertimbang per lini: WIP awal dan biaya bulan ini dikurangi KW 2 pada NRV, dibagi kg premium + waste + WIP akhir × `wip_completion_pct` (default 100%, Q10). Premium, waste, dan WIP akhir dinilai pada rate; waste masuk HPP.

```latex
rate = \frac{wip\_open\_value + total\_cost - kg_{kw2} \times nrv}{kg_{premium} + kg_{waste} + kg_{wip\_close} \times wip\_completion\_pct}
```

Sep-26 FCC (sheet FCC):

| Langkah | Kg | Rp | Sel |
| --- | --- | --- | --- |
| WIP awal | 357,5 | 7.910.432,19 | B29, E72 |
| Masuk proses | 236.923 | 5.562.568.465,96 (= 23.478,38/kg: material 18.046,12 + konversi 5.432,26) | B30, E66, F66 |
| Dikurangi KW 2 pada NRV 9.777,27/kg | 7.581 | −74.121.492,82 | B33, E74 |
| Biaya untuk premium, waste, WIP akhir | 229.699,5 | 5.496.357.405,32 | B75, E75 |
| Rate |  | 23.928,4692/kg | D76 |
| Premium ke barang jadi | 221.027 | 5.288.837.756,40 | B32, E77 |
| Waste ke HPP | 6.500 | 155.535.049,64 | B34, E78 |
| WIP akhir | 2.172,5 | 51.984.599,28 | B35, E79 |

Kontrol B06–B09: kg dipertanggungjawabkan 237.280,5 = dibebankan; Rp sama; dekomposisi varian tertutup.

### 4.5 Barang jadi dan HPP — `finished-goods.ts`

Rata-rata tertimbang `(value_open + value_in) / (qty_open + qty_in)`; keluar jual, transfer ke Lain-lain, saldo akhir pada qty Accurate; selisih qty ke HPP. HPP = jual + waste + selisih qty + KW 2 tawar terjual pada NRV.

Sep-26 FG-001: saldo awal 7.029 kg / 155.531.266,68 + masuk 221.027 kg / 5.288.837.756,40 → rate FG 23.872,9/kg. Jual ke IFM 204.950,5 kg = 4.892.772.623,67 (E100); transfer ke Lain-lain 23.115,5 kg = 551.835.128,88 (E91); selisih kuantitas −10 kg = −238.729,48 (E102); KW 2 tawar terjual 5.957 kg × 9.777,27 = 58.243.204,42 (E103). Total HPP FCC 5.106.312.148,26 (E104). UU HPP 232.706.417,35 (UU!E98); UO HPP dari fixture (UO!E94). Kontrol B21/B22 PERIKSA: FG masuk kartu 221.027 vs Accurate 211.979,5 kg; transfer 23.115,5 vs 14.058 kg (D4).

### 4.6 Lain-lain per SKU — `others-sku.ts`

Bahan: FCC premium × rate FG FCC; KW 2 × NRV. Konversi: porsi pool Lain-lain dibagi A, B per man-hour per kelompok (21 kelompok, Q7; koperasi 11 SKU dibagi man-hour kartu); C + D per kWh (Ubi putih ACE per jam mesin); E per nilai material eksternal. FG per SKU dalam `fg_unit` (kg|bag). Sep-26: total 870.978.077,67; cem-cem ORI 318.461.224,94; HPP Lain-lain 871.581.725,61 (sheet LAIN-LAIN dan 9 sheet SKU). Kontrol B13–B16.

### 4.7 Rekon HPP dan persediaan — `recon.ts`

```latex
HPP_{GL} = HPP_{kartu} + varian\_material + \Delta pers_{kartu} - \Delta pers_{GL} + \Delta KW2_{NRV} - penyesuaian_{b8} + idle\_period
```

Sep-26 (Rp juta; RINGKASAN B29–B35, REKON & KONTROL C38–C43): HPP kartu 6.463,1669 → varian material −121,1482 → kenaikan persediaan WP −326,5394 → dikurangi kenaikan persediaan GL +409,3055 → KW 2 pada NRV −25,5969 → dikurangi penyesuaian bagian 8 −23,7756 → jam menganggur 0 → HPP GL 6.375,4123; sisa 0. Ini ditampilkan sebagai waterfall di §7.7.

Neraca persediaan WP vs GL (RINGKASAN B46–F48): 1106-001 826,0313 vs 947,1795 dijelaskan −121,1482; WIP 51,9846 vs 297,8507 dijelaskan −245,8661; FG 14,1713 vs 286,5366 dijelaskan −272,3654. REKON PERSEDIAAN K1–K6 per item; K2 WIP akhir 225.691.966,25 (olein di WIP-022, D6). Kontrol B17–B20, B23–B30 (toleransi Rp 1.000).

### 4.8 Kewajaran, varian budget, bridge — `reasonableness.ts`, `variance.ts`, `bridge.ts`

**Kewajaran.** Bagian 1: 14 KPI FCC Jan–Sep vs min–maks Jan–Agu → DALAM/DI LUAR RENTANG dengan catatan (tabel §1). Bagian 2: semua produk Agu vs Sep, |Δ| > 10% → CEK, wajib ada penjelasan sebelum rilis. Sep-26: 6 CEK (konversi FCC +26,1%, Grup B +37,2%, D +56,7%, E +59,0%, material lain −35,7%, pool variabel −16,7%); v1 §8 menulis "7 CEK", sheet CEK KEWAJARAN bagian 2 memuat 6 — angka v2 memakai 6, dikonfirmasi saat Fase 4.

**Varian vs flex budget (BP v1).** Flex = budget pada volume aktual (variabel × kg aktual, tetap tetap). Harga `(P_akt − P_bud) × Q/kg_akt`; pemakaian `(Q/kg_akt − Q/kg_bud) × P_bud`; volume `tetap/kg_bud × (kg_bud − kg_akt)`; metode = sisa pool alokasi aktual vs metode budget. Kolom cek = 0. Hanya FCC/UU/UO per komponen; Lain-lain di level total sampai BP v2 (D8, D9).

**Bridge GP Agu→Sep (BRIDGE GP C117–C135), 17 bar dalam pp margin GL:**

| Bar | Isi | pp | Grup |
| --- | --- | --- | --- |
| start | Margin GL Agustus 2026 | 19,9219 |  |
| b1 | Harga jual rata-rata | −0,6105 | Harga |
| b2 | Volume dan mix produksi | +8,6800 | Volume & persediaan |
| b3 | FCC: tarif singkong | −1,8502 | Tarif variabel |
| b4 | FCC: ongkos kirim singkong | +0,2569 | Tarif variabel |
| b5 | FCC: minyak olein | −0,8083 | Tarif variabel |
| b6 | FCC: CNG | +0,4567 | Tarif variabel |
| b7 | FCC: material lain | +1,0008 | Tarif variabel |
| b8 | FCC: tarif konversi variabel | −0,8088 | Tarif variabel |
| b9 | UU, UO, Lain-lain: tarif | −0,7491 | Tarif variabel |
| b10 | Biaya tetap: efek volume | −2,4339 | Tetap |
| b11 | Biaya tetap: perubahan belanja | −0,2603 | Tetap |
| b12 | Perubahan persediaan, KW 2, transfer | −8,5342 | Volume & persediaan |
| b13 | GL: material GL vs kartu | +0,7711 | GL lain |
| b14 | GL: beda penilaian persediaan WP vs Accurate | +0,5806 | GL lain |
| b15 | GL: KW 2 pada NRV | +0,5477 | GL lain |
| b16 | GL: biaya pabrik di opex | +0,2589 | GL lain |
| b17 | GL: waktu pencatatan (THR tertukar, tali asih) | −1,8536 | Waktu pencatatan |
| end | Margin GL September 2026 | 14,5657 |  |

Σ bar = −5,3562 pp = 14,5657 − 19,9219 (B31). Bar b2 dan b12 saling meniadakan sebagian (+8,68 dan −8,53): di tampilan direksi keduanya digabung menjadi satu bar "Volume, mix, dan persediaan" +0,1458 pp dengan rincian di tooltip, supaya waterfall tidak didominasi dua bar teknis.

### 4.9 Standar, rencana, aktual, dan varian mingguan — `standards.ts`, `plan.ts`, `actual-week.ts`, `absorption.ts`

**Rencana.** `kg_input = (forecast + target_fg − fg_open) / premium_pct` ditambah FCC untuk Lain-lain (target FG 1 minggu jual, Q12). `qty_i = kg_input × bom_i`; `hours_d = kg_input/1000 × routing_d`. `std_cost = Σ qty × price_week + Σ hours × rate_A + Σ driver × rate_variable + fixed_amount_month × 7/hari_bulan`. Harga material minggu = PI terakhir per item (Q5).

**Aktual minggu dari grid shift.** Material `qty_issue × price_week`; DL `hours_productive(operator, lini) × rate_A_std`; OH variabel `driver_act × rate_variable_std`; OH tetap `kg_act × rate_fixed_per_kg`; `under_absorption = fixed_budget_week − fixed_absorbed`. Semua angka minggu berlabel **sementara** sampai true-up.

**Varian minggu.** Yield/pemakaian `(qty_act − kg_act × bom) × price_std`; harga `(price_act − price_std) × qty_act`; efisiensi `(hours_act − kg_act × routing) × rate`; Σ = aktual − standar pada volume aktual (±Rp 1, B35). Pemilik varian per jenis: yield dan efisiensi → Produksi; pemakaian → Gudang; harga → Purchasing; volume → Sales/PPIC.

**Rendemen di grid dan di tren** memakai definisi WP: premium ÷ masuk proses, tanpa koreksi WIP (Q21). Pergerakan WIP tampil sebagai baris terpisah di grid dan di kartu proses.

Acceptance Fase 5: HPP standar FCC pada driver Sep = 23.481 ±5/kg dari standar v1 rata-rata Jul–Sep (Q6). Belum ada data harian riil; worked example ditulis saat fixture `week-2026-10-W2` dibuat dari data harian asli.

### 4.10 True-up dan kalibrasi — `trueup.ts`, `calibration.ts`

Per pool: `gl_pool_month − Σ driver_act_week × rate_std`, dialokasikan dengan driver pool yang sama. Harga material: `MA_accurate − Σ qty_week × price_week`. Kuantitas: `issue_accurate − Σ material_issue`. Kontrol B39: `Σ cost_week + trueup = process_card_month = GL`. Kalibrasi menghasilkan draft `std_version` berikutnya dengan diff vs versi berjalan dan vs BP; versi baru diputuskan manusia, tidak otomatis.

### 4.11 Neraca, modal kerja, arus kas — `fs.ts` (baru, Fase 1b)

Neraca bulanan dibangun dari TB/LK Accurate per akun lewat `coa_fs_map` (akun → baris neraca `BS 01`–`BS 44`, bertanggal efektif karena COA berubah Okt-26). Untuk Jan–Agu 2026 sumbernya sheet "BMG Business Plan" kolom Actual (impor `bp_fs`); untuk Sep-26 ke depan TB/LK bulanan. Kolom berlabel BP di sheet yang sama masuk `budget_fs_line`.

```latex
NWC = piutang\_dagang + persediaan - hutang\_dagang
```

Arus kas indirect mengikuti struktur sheet BP baris 133–181: CFO dari laba + depresiasi + perubahan pos modal kerja; CFI dari penambahan aset tetap; CFF dari lease, pinjaman, bunga, modal, dividen. Agu-26: NWC 8.144,8 + 2.593,7 − 3.718,8 = 7.019,8 jt (baris 130); CFO 938,1; CFI −158,0; CFF −129,2; arus kas bersih 650,9; kas awal 4.571,4 → kas akhir 5.222,3 jt (baris 161–181).

Cek FS (`fs_check_month`): F01 total aset = liabilitas + ekuitas (Rp 1); F02 kas akhir arus kas = kas neraca (Rp 1); F03 aset bersih = ekuitas (Rp 1); F04 persediaan 1106-001/002/003 neraca = REKON PERSEDIAAN WP ± penjelasan K1–K6 (Rp 1.000); F05 laba tahun berjalan neraca = NIAT YTD laba rugi (Rp 1); F06 piutang pihak berelasi > 10% ekuitas → PERIKSA dengan catatan. Jan–Agu 2026: F01–F03 LULUS setiap bulan; F06 PERIKSA Jun–Agu.

### 4.12 Outlook dan kas — `outlook.ts`, `cash.ts` (Fase 7)

Adaptasi KGR M4–M6: outlook bulan berjalan = aktual MTD + sisa bulan dari BP v1 atau standar; kas harian per rekening dari mutasi bank; proyeksi 13 minggu dari forecast jual, rencana beli, payroll, dan jatuh tempo. Kontrol: kas proyeksi minggu 0 = saldo bank; kas = neraca (F02).

## 5. Domain model dan kontrol

Skema v1 §4 tetap seluruhnya (sudah diterapkan sampai migrasi `20261015000500_b1_inputs`); v2 menambah tabel FS dan riwayat, satu kolom jejak di data mart, dan tujuh kontrol F01–F07. Konvensi tetap: money `numeric(18,2)`, Rp/kg dan tarif `numeric(18,4)`, kg `numeric(14,3)`, jam `numeric(12,2)`, persentase `numeric(10,8)`, tanggal Asia/Jakarta, soft delete, provenance (`source, document_ref, upload_id, created_*, updated_*`), `tg_stamp`, `tg_audit`, RLS per peran.

### 5.1 Master dan referensi (v1 §4.1 + baru)

```
product, others_group, sku, material_item, coa_pool_map, payroll_group, assumption,
budget_version, budget_line, budget_pool_map, std_version, bom_line, output_mix, routing,
rate_card, capacity                                              ← v1, tetap
coa_fs_map           account, effective_from, effective_to nullable, fs_line_code (BS 01..44 | PL 01..nn),
                     sign (+1|-1), note                            ← baru, Fase 1b (D10)
fs_line              code, statement (bs|pl), section (current_asset|fixed_asset|current_liab|
                     noncurrent_liab|equity|revenue|cogs|opex|other), order, label_id, label_en, is_total
```

### 5.2 Input bulanan (v1 §4.2 + baru)

```
gl_month, gl_voucher_tag, payroll_month, payroll_journal, inventory_valuation, sales_by_item,
average_price, cogm_card, cogm_material, driver_month, fs_control          ← v1, tetap
tb_month             month, account, debit, credit, balance_open, balance_close, upload_id   ← baru (TB/LK)
budget_fs_line       budget_version_id, month, fs_line_code, amount              ← baru (sheet BMG Business Plan, kolom BP)
history_fs_line      month, fs_line_code, amount, source ('bp_fs_actual'|'tb_month'), upload_id   ← baru (Jan–Agu 2026)
```

### 5.3 Input mingguan dan harian (v1 §4.3, tetap)

```
sales_forecast_week, material_price_week, production_shift, material_issue, labour_hours,
utility_reading, machine_log, peel_log, day_lock, correction_line
```

`production_shift` menambah kolom `status` (empty|draft|submitted) dan `submitted_by/at`; `day_lock` menambah `unlocked_by/at/reason` untuk koreksi setelah kunci (Q22). `correction_line` wajib berpasangan: koreksi premium 820→825 kg harus disertai koreksi WIP akhir 100→95 kg dalam satu transaksi, kontrol B37b menolak koreksi yang membuat neraca shift tidak seimbang.

### 5.4 Data mart (v1 §4.4 + baru)

```
pool_month, allocation_month, process_card_month, fg_month, others_month, recon_month,
inventory_recon, variance_month, bridge_month, reasonableness, control_month, plan_week,
cost_week, variance_week, absorption_week, trueup_month, release               ← v1, tetap
fs_month             month, fs_line_code, amount, basis ('actual'|'bp'), source_kind, source_ref   ← baru
nwc_month            month, trade_receivables, inventories, trade_payables, nwc, delta_nwc_cash
cashflow_month       month, line_code (cfo_…|cfi_…|cff_…|net|open|close), amount, basis
fs_check_month       month, code (F01..F07), value, tolerance, status, note
kpi_series           month, product, kpi_code, value, min_8m, max_8m, status, note, source_ref   ← tren §1 untuk layar
```

Setiap baris data mart membawa `rule_id` (nama fungsi engine + versi) dan `inputs jsonb` (id baris input yang dipakai) supaya `SourceTrace` (§8.6) bisa menampilkan "dari mana angka ini" tanpa menghitung ulang. Untuk bulan golden, `source_ref` memuat `sheet!cell` WP.

### 5.5 Kontrol (v1 §4.6 B01–B45 tetap; F01–F07 baru)

| Kode | Kontrol | Toleransi | Status gagal |
| --- | --- | --- | --- |
| B01–B45 | Sesuai v1 §4.6: pool, kartu proses, material, Lain-lain, rekon, FG vs Accurate, persediaan, bridge, rasio pemakaian, WIP, mingguan, true-up, budget, mapping, versi standar | Sesuai v1 | LULUS / GAGAL / PERIKSA / BELUM DIISI |
| B37b | Koreksi setelah kirim mengubah neraca shift | 0,01 kg | GAGAL (koreksi ditolak) |
| F01 | Total aset = liabilitas + ekuitas | Rp 1 | GAGAL |
| F02 | Kas akhir arus kas = kas neraca | Rp 1 | GAGAL |
| F03 | Aset bersih = ekuitas | Rp 1 | GAGAL |
| F04 | Persediaan neraca (1106-001/002/003) = REKON PERSEDIAAN WP ± K1–K6 | Rp 1.000 | GAGAL |
| F05 | Laba tahun berjalan neraca = NIAT YTD laba rugi | Rp 1 | GAGAL |
| F06 | Piutang pihak berelasi ≤ 10% ekuitas | parameter | PERIKSA |
| F07 | Mapping `coa_fs_map` aktif untuk setiap akun di TB bulan upload | — | BELUM DIISI (blok upload) |

Kewajaran (bagian 1 dan 2 CEK KEWAJARAN) bukan kontrol: status WAJAR/CEK, setiap CEK wajib ada penjelasan sebelum rilis.

### 5.6 Infrastruktur (v1 §4.7, tetap)

`app_setting` (flag `b1_ingest … b7_outlook`, `b8_fs`, `b5_forms`, `b6_management`, `wp_is_book`; default false), `rebuild_queue`, `upload` (status staged|planned|committed|rejected, issues jsonb, sha256).

## 6. Input

Tiga kanal input mengikuti ritme pengguna: upload bulanan untuk Penyusun, CSV/xlsx mingguan untuk Perencana, dan grid shift untuk Staf pabrik. Satu model state tiga sumbu berlaku di semua kanal.

### 6.1 Upload bulanan dan per versi (`packages/parsers`, wizard stage → plan → commit)

| Kind | Sumber | Target | Peran | Ritme |
| --- | --- | --- | --- | --- |
| `gl_month` | GL Accurate per akun per voucher (xlsx) | `gl_month` | finance | bulanan |
| `gl_voucher_tag` | CSV tag voucher bagian 8 | `gl_voucher_tag` | finance | bulanan |
| `payroll_month` | Rekap payroll per kelompok + jurnal | `payroll_month`, `payroll_journal` | finance | bulanan |
| `inventory_valuation` | Rincian Valuasi Persediaan Accurate | `inventory_valuation` | finance | bulanan |
| `sales_by_item` | LK Sales by Item | `sales_by_item` | finance | bulanan |
| `average_price` | Sheet Average Price | `average_price` | finance | bulanan |
| `cogm_card` | Kartu CoGM (FCC/UU/UO, LAP BAG per SKU, Labor, Overhead Allocation, jam mesin) | `cogm_card`, `cogm_material`, `driver_month` | cost\_accounting | bulanan |
| `fs_control` | LK IS/BS 9 angka kontrol | `fs_control` | finance | bulanan |
| `tb_month` (baru) | Trial balance / LK Accurate per akun | `tb_month` → `fs_month` via `coa_fs_map` | finance | bulanan |
| `budget_bp` | BP Model Details + Input Operasional | `budget_line`, `budget_pool_map` (draft) | finance | per versi |
| `bp_fs` (baru) | Sheet "BMG Business Plan" baris 9–266: kolom Actual Jan–Agu → riwayat; kolom BP → budget neraca/arus kas | `history_fs_line`, `budget_fs_line` | finance | per versi |
| `std_master` | Template master standar 5 sheet | tabel §5.1 sebagai draft `std_version` | ppic, finance | per versi |

Semua idempoten (`line_key`), issues per baris, pratinjau sebelum simpan. Upload untuk bulan yang sudah dirilis ditolak kecuali flag `reopen_month` oleh admin. B44 dan F07 memblok GL/TB dengan akun tanpa mapping aktif.

### 6.2 CSV/xlsx mingguan (Perencana)

| Kind | Sumber | Target | Peran |
| --- | --- | --- | --- |
| `sales_forecast` | CSV per minggu: product\_or\_group, kg, price\_per\_kg | `sales_forecast_week` | sales |
| `material_price` | CSV per item: item\_code, price, source | `material_price_week` | purchasing |
| `plan_override` | CSV target produksi per lini (opsional; default dari engine) | `plan_week` (override, dicatat) | ppic |

Template unduhan berisi kolom, contoh dua baris, dan daftar kode yang sah (item, kelompok). Baris dengan kode tak dikenal ditolak dengan nomor baris; file tetap bisa disimpan sebagian hanya bila pengguna memilih "simpan baris yang sah".

### 6.3 Grid shift harian (Staf pabrik) — menggantikan template xlsx `plant_daily` dan CSV pabrik

Satu halaman per hari dan lini, tiga tab: **Produksi**, **Gudang**, **Mesin**. Baris = shift (1, 2, 3); kolom = pos yang dicatat; sel dihitung langsung.

**Tab Produksi** (`production_shift`): WIP awal (terisi otomatis dari WIP akhir shift sebelumnya, bisa ditimpa dengan alasan) · input proses kg · premium kg · KW 2 kg · waste kg · WIP akhir kg · sampel kg · catatan. Kolom hitung: total masuk (WIP awal + input), total keluar, selisih, rendemen (premium ÷ input, definisi WP). Baris hanya bisa **Kirim** bila selisih = 0 ±0,01 kg. Reject dicatat sebagai bagian waste. Bagging adalah proses berikutnya dan tidak masuk tab ini.

**Tab Gudang** (`material_issue`, `peel_log`): per bon: item, qty, satuan, nomor bon, alasan bila di luar pita BOM ±15% (Q13). Baris kupas: kg kulit masuk, kg dikupas, borongan Rp.

**Tab Mesin** (`utility_reading`, `machine_log`, `labour_hours`): meter kWh awal/akhir per meter; jam jalan dan downtime per mesin dengan alasan; headcount, jam dibayar, jam produktif, lembur per departemen. **Nilai kosong ≠ nol**: sel kosong tampil sebagai "—" dan menahan status Lengkap; nol harus diketik.

Interaksi: Tab/Enter berpindah sel, angka diketik tanpa pemisah ribuan, satuan di header kolom, "Salin dari kemarin" mengisi pola shift yang sama (headcount, mesin yang jalan) tanpa kuantitas. Target: satu shift terisi ≤ 3 menit. Offline: draft disimpan lokal dan dikirim saat jaringan kembali (Q23).

### 6.4 Model state tiga sumbu

Tiga sumbu status yang tidak boleh dicampur, masing-masing dengan tampilan sendiri (§8.4):

| Sumbu | Nilai | Dipakai untuk | Transisi |
| --- | --- | --- | --- |
| **Status input** | Kosong → Draft → Terkirim → Terkunci (+ penanda Dikoreksi) | Baris grid, hari, upload | Kosong→Draft saat sel pertama diisi; Draft→Terkirim tombol Kirim (neraca seimbang); Terkirim→Terkunci oleh Produksi setelah tiga tab lengkap dan H+1 12:00 (Q15); Terkunci→Dikoreksi lewat `correction_line` berpasangan dengan alasan (Q22) |
| **Status angka** | Sementara → Direkonsiliasi → Final (dirilis) | Setiap angka biaya/HPP di layar | Mingguan selalu Sementara; bulanan Direkonsiliasi setelah B17–B20 LULUS; Final setelah `release` dengan snapshot + SHA |
| **Status kontrol** | LULUS · PERIKSA · GAGAL · BELUM DIISI | Baris kontrol B01–B45, F01–F07; kewajaran memakai WAJAR/CEK | Dihitung engine setiap rebuild |

Aturan: kunci hari tidak mengubah status angka; rilis bulanan tidak mengunci hari (sudah terkunci sebelumnya); upload bulan yang sudah Final ditolak tanpa `reopen_month`. Versi standar memakai kosakata sendiri (draft|approved|superseded) dan ditampilkan dengan istilah Indonesia: Draft, Berlaku, Digantikan.

### 6.5 Koreksi dan jejak audit

Koreksi setelah Terkirim atau Terkunci selalu lewat `correction_line` (ref\_table, ref\_id, field, old\_value, new\_value, reason, actor), tidak pernah menimpa nilai. Grid menampilkan nilai baru dengan penanda Dikoreksi dan nilai lama di tooltip. Koreksi yang mengubah neraca shift harus datang berpasangan (B37b). Halaman Audit menampilkan koreksi per hari, per lini, per orang.

## 7. Spesifikasi per layar

Empat belas layar: delapan untuk Direksi, dua untuk Staf pabrik, satu untuk Perencana, dua untuk Penyusun, satu Admin. Setiap layar dispesifikasikan dengan tujuan, pengguna, pertanyaan yang dijawab, data mart asal, tata letak, empat state (kosong, memuat, galat, terisi), tindakan, dan acceptance. Angka contoh adalah Sep-26 dari WP dan Agu-26 dari BP v1. Aturan umum: setiap angka punya ikon `SourceTrace` (§8.6); tidak ada nama tabel, kode fase, atau email di layar; kode kontrol (B01, F02) tampil kecil di samping label, bukan sebagai judul.

### Navigasi

| Tipe | Menu (urutan) | Beranda |
| --- | --- | --- |
| Direksi | Kinerja · Biaya per kg · Lain-lain & SKU · Neraca & BP · Modal kerja & kas · Cek & kewajaran · Rekonsiliasi · Mingguan & outlook | Kinerja (§7.1) |
| Staf pabrik | Shift hari ini · Penyelesaian hari | Shift hari ini (§7.9) |
| Perencana | Rencana minggu · (Kinerja, baca saja) | Rencana minggu (§7.11) |
| Penyusun | Input bulanan · Tutup bulan · semua halaman Direksi · Audit | Input bulanan (§7.12) |
| Admin | Semua + Pengaturan | Pengaturan (§7.14) |

Menu hanya memuat halaman yang flag-nya on dan peran diizinkan (`navFor`, tetap dari v1). Header: nama aplikasi, entitas, nama lengkap pengguna dan perannya, Akun, Keluar. Tidak ada pemilih peran di luar Admin → Pengguna.

### 7.1 Kinerja bulan (Direksi)

**Pertanyaan:** margin bulan ini berapa dan kenapa berubah; volume, rendemen, biaya per kg bergerak ke mana. **Data:** `fs_month` (laba rugi), `process_card_month`, `kpi_series`, `bridge_month`, `reasonableness`, `release`.

**Tata letak (atas ke bawah):**

1. Chip periode: bulan Jan-26 s.d. bulan rilis terakhir (bulan belum rilis tampil redup dengan label Sementara/Belum ada); chip lini: Semua, FCC, UU, UO, Lain-lain; toggle Bulan ini / YTD.
2. Enam kartu KPI dengan pembanding bernama, warna delta baik/buruk (§8.4): Pendapatan 7.462,4 jt (−14,7% vs BP v1) · Margin kotor GL 14,6% (−5,4 pp vs Agu) · FCC masuk proses 236,9 t (−30,1% vs Agu; terendah Jan–Sep) · Rendemen premium 93,3% (Agu 93,8%; rentang Jan–Agu 91,9–100,6%) · Biaya produksi FCC Rp 23.478/kg (+6,5% vs Agu) · Harga singkong kulit Rp 2.943/kg (+10,1% vs Agu; tertinggi Jan–Sep).
3. Dua grafik berdampingan: kolom masuk proses Jan–Sep dengan garis biaya per kg (bulan terpilih ditebalkan, BP mulai Sep-26 sebagai kolom redup); kolom margin kotor GL per bulan dari `history_fs_line`.
4. Waterfall bridge margin GL Agu→Sep, 15 bar (b2+b12 digabung), nilai pp di tiap bar, grup diberi warna (harga, volume & persediaan, tarif variabel, tetap, GL lain, waktu pencatatan).
5. Tabel laba rugi bulan ini: baris `fs_line` PL, kolom Aktual · % pendapatan · Bulan lalu · BP · Δ vs BP.
6. Panel teks kanan: "Cara baca" (definisi rendemen, basis pembanding, status angka Final/Direkonsiliasi/Sementara) dan "Catatan kewajaran bulan ini" (6 CEK dengan penjelasan dari Cost Accounting, apa adanya).

**State:** Kosong (bulan belum dirilis): kartu menampilkan "Belum dirilis" dan, untuk Penyusun/Admin, tautan ke Input bulanan dengan jumlah upload yang masuk; Direksi melihat bulan rilis terakhir sebagai default. Memuat: kerangka kartu. Galat: pesan satu baris + tombol coba lagi. **Tindakan:** klik kartu biaya/kg → §7.2; klik bar bridge → tooltip rincian + tautan §7.2 atau §7.7; klik baris laba rugi → `SourceTrace`. **Acceptance:** tiga pembaca awam menemukan margin, biaya/kg, dan penyebab terbesar bridge dalam ≤ 5 detik tanpa bertanya; muat < 1 detik; semua angka tie ke WP/BP.

### 7.2 Biaya per kg (Direksi)

**Pertanyaan:** komponen mana yang membuat biaya per kg naik; berapa yang tetap, berapa yang variabel. **Data:** `process_card_month`, `pool_month`, `allocation_month`, `variance_month`, `reasonableness` bagian 2.

**Tata letak:** chip bulan + lini; kartu: Biaya produksi/kg 23.478 (material 18.046 + konversi 5.432) · Pool tetap 806,3 jt / variabel 766,4 jt · Jam menganggur 3.265 jam (13,1%), 61,6 jt · Rendemen 93,3%; grafik kolom berkelompok komponen per kg Agu vs Sep (singkong, olein, CNG, material lain, Grup A, Kupas, B, C, D, E); tabel per kg Agu vs Sep dengan Δ % dan status WAJAR/CEK plus penjelasan (dari CEK KEWAJARAN bagian 2: konversi FCC 4.309 → 5.432, +26,1%, CEK: efek volume pada biaya tetap); tabel varian vs flex budget per komponen (harga · pemakaian · volume · metode, cek = 0) bila BP tersedia untuk bulan itu. **Drill:** klik komponen material → rekon material per item (REKON MATERIAL). **Acceptance:** Σ komponen per kg = biaya produksi/kg ±Rp 0,01; Σ varian = aktual − flex ±Rp 1.

### 7.3 Lain-lain & SKU (Direksi)

**Pertanyaan:** kelompok dan SKU mana yang margin-nya negatif, dan berapa FCC yang diserap. **Data:** `others_month`, `fg_month`, `sales_by_item`. **Tata letak:** kartu: Lain-lain 45.653 kg, margin 5,0% · FCC premium diserap 23.115,5 kg / 551,8 jt · Kelompok dengan margin negatif (jumlah); grafik batang horizontal margin % per kelompok (21), urut dari terendah; tabel kelompok: kg keluar, HPP, pendapatan, margin %, dengan baris SKU bisa dibuka (Maicih basreng −14% s.d. −24%; cem-cem ORI −0,9%; BBQ −0,5%). Label HPP "manajemen" vs "buku" (D1) di header tabel. **Acceptance:** Σ SKU = total Lain-lain (B15).

### 7.4 Neraca & BP (Direksi)

**Pertanyaan:** kas, piutang, persediaan, utang berada di mana dibanding bulan lalu dan BP. **Data:** `fs_month` (basis actual dan bp), `history_fs_line`, `fs_check_month`, `budget_fs_line`.

**Tata letak:** chip bulan Jan-26 s.d. bulan TB terakhir; toggle basis Aktual / BP v1; enam kartu (Agu-26): Kas dan setara kas 5.222,3 jt (+650,9 jt vs Jul) · Piutang dagang 8.144,8 jt (+395,1 jt) · Persediaan 2.593,7 jt (+296,2 jt) · Liabilitas lancar 8.105,6 jt · Ekuitas 35.641,2 jt · Laba tahun berjalan 4.712,0 jt YTD; grafik kolom total aset dan kas Jan-26 s.d. Des-27 (aktual tebal, BP redup); tabel neraca per baris `fs_line` dengan kolom Bulan ini · Bulan lalu · BP bulan ini · Δ vs BP, baris total tebal; panel "Catatan": F06 PERIKSA piutang pihak berelasi 5.631,9 jt (15,8% ekuitas), Jun hutang bank jangka pendek 9.994,8 jt. **State kosong:** bulan tanpa TB menampilkan "TB bulan ini belum diunggah" (tautan untuk Penyusun). **Acceptance:** F01–F03 LULUS tampil sebagai baris status di atas tabel; angka Jan–Agu sama dengan sheet BP ±Rp 1.

### 7.5 Modal kerja & kas (Direksi)

**Pertanyaan:** modal kerja mengikat berapa dan arus kas bulan ini dari mana. **Data:** `nwc_month`, `cashflow_month`, `fs_month`, kelak `cash_position` (Fase 7). **Tata letak:** kartu: Modal kerja bersih 7.019,8 jt (piutang dagang + persediaan − hutang dagang) · Hari piutang 25,8 (piutang dagang ÷ pendapatan bulan × 31; basis pendapatan gross BP) · Hari persediaan · Hari hutang · Arus kas operasi 938,1 jt; grafik garis NWC Jan-26 s.d. bulan terakhir; waterfall arus kas bulan: laba → depresiasi → Δ piutang → Δ persediaan → Δ hutang → pos lain → CFO 938,1 → CFI −158,0 → CFF −129,2 → kas akhir 5.222,3 jt; tabel arus kas indirect mengikuti baris BP 134–181. Bagian "Kas 13 minggu" tampil sebagai state kosong berlabel "Tersedia setelah modul Outlook" sampai Fase 7. **Acceptance:** F02 LULUS; waterfall berakhir tepat di kas neraca.

### 7.6 Cek & kewajaran (Direksi, Penyusun)

**Pertanyaan:** angka bulan ini boleh dipercaya sejauh mana, dan apa yang masih harus dijelaskan. **Data:** `control_month`, `fs_check_month`, `reasonableness`, `kpi_series`. **Tata letak:** ringkasan satu baris: "Sep-26: 36 LULUS · 2 PERIKSA · 6 CEK · 0 GAGAL · 1 BELUM DIISI"; filter "hanya yang bukan LULUS"; tiga blok tabel: (1) kewajaran bagian 1, 14 KPI FCC dengan Jan–Sep, min–maks, status, catatan WP; (2) kewajaran bagian 2, Agu vs Sep per produk, Δ %, WAJAR/CEK, penjelasan, pemilik, status penjelasan (Menunggu / Diisi); (3) kontrol B01–B45 dan F01–F07: label, nilai, toleransi, status, keterangan dalam format rumah (bukan `toFixed`). **Tindakan:** Cost Accounting mengisi penjelasan CEK dari baris; Finance menandai PERIKSA sebagai ditinjau dengan catatan. **Acceptance:** rilis diblok selama ada CEK tanpa penjelasan atau GAGAL; keterangan kontrol memakai format 1.590.888.645,02.

### 7.7 Rekonsiliasi (Direksi, Penyusun)

**Pertanyaan:** kenapa HPP manajemen 6.463,2 jt dan HPP buku 6.375,4 jt berbeda. **Data:** `recon_month`, `inventory_recon`, `fg_month`. **Tata letak:** waterfall HPP kartu → GL dengan enam pos §4.7 dan nilai di tiap bar; tabel persediaan WP vs GL (1106-001, WIP, FG) dengan kolom dijelaskan; tabel K1–K6 per item bisa dibuka; blok FG vs Accurate (B21/B22) dengan kg kartu, kg Accurate, selisih, status PERIKSA dan catatan D4. **Acceptance:** sisa rekon 0 ±Rp 0,001 jt; Σ K = selisih neraca.

### 7.8 Mingguan & outlook (Direksi, Perencana)

**Pertanyaan:** HPP/kg minggu ini vs standar, varian terbesar milik siapa, hari mana yang belum dikunci, bulan berjalan ke mana. **Data:** `cost_week`, `variance_week`, `absorption_week`, `day_lock`, kelak `pl_daily` (Fase 7). **Tata letak:** chip minggu (Senin); kartu: HPP/kg FCC aktual (Sementara) vs standar · Varian terbesar + pemilik · Serapan tetap (under-absorption) · Hari belum terkunci (daftar tanggal dan lini); grafik garis HPP/kg per minggu vs standar; tabel varian per jenis (yield, pemakaian, harga, efisiensi, volume) dengan pemilik dan penjelasan; blok Outlook bulan vs BP (Fase 7). Semua angka berlabel Sementara sampai true-up. **State kosong:** sebelum Fase 5b: "Modul mingguan belum aktif" tanpa angka contoh. **Acceptance:** Σ varian = aktual − standar ±Rp 1 (B35); hari belum terkunci Senin 10:00 tampil BELUM DIISI (B37).

### 7.9 Shift hari ini (Staf pabrik)

**Pertanyaan:** apa yang harus kuisi sekarang, sudah seimbang belum. **Data:** §5.3. **Tata letak:** header: tanggal (default hari ini, bisa mundur ke hari belum terkunci), lini (FCC/UU/UO/Lain-lain), tiga tab Produksi · Gudang · Mesin dengan penanda status per tab; grid §6.3; baris status di bawah grid: "Shift 1 Terkirim · Shift 2 Draft (selisih −5 kg) · Shift 3 Kosong"; tombol Kirim per baris, Simpan draft otomatis. Mobile 390 px: satu shift per kartu, kolom menjadi baris berlabel, tombol 44 px. **State:** Galat jaringan: draft tersimpan lokal, badge "Belum terkirim (offline)". **Acceptance:** satu shift ≤ 3 menit oleh operator tanpa pelatihan ulang; neraca tidak seimbang → Kirim mati dengan pesan nilai selisihnya; nilai kosong tidak pernah tersimpan sebagai nol.

### 7.10 Penyelesaian hari (Staf pabrik, Produksi mengunci)

**Pertanyaan:** hari ini boleh dikunci belum; apa yang kurang. **Data:** `production_shift`, `material_issue`, `utility_reading`, `machine_log`, `day_lock`, `correction_line`. **Tata letak:** matriks lini × tab dengan status per shift (Kosong/Draft/Terkirim); tombol Kunci hari aktif hanya bila semua Terkirim (Produksi); daftar hari minggu ini yang belum terkunci; bagian Koreksi: form berpasangan (pos lama → baru, pos pengimbang, alasan) untuk Produksi/Finance, riwayat koreksi hari itu. **Acceptance:** kunci ditolak bila ada tab Kosong/Draft dengan pesan yang menyebut lini dan shift; koreksi yang membuat neraca tak seimbang ditolak (B37b).

### 7.11 Rencana minggu (Perencana)

**Pertanyaan:** minggu depan produksi berapa, bahan dan jam cukup, harga material berapa. **Data:** `sales_forecast_week`, `material_price_week`, `plan_week`, `capacity`, `std_version`. **Tata letak:** chip minggu; blok Sales: tabel forecast per produk/kelompok + tombol Unggah CSV; blok Purchasing: tabel harga per item (± vs minggu lalu) + Unggah CSV; blok PPIC: rencana per lini (kg input, premium target, bahan per item, jam per departemen vs kapasitas dengan sel merah bila kurang, HPP standar/kg, margin rencana) dengan tombol Setujui atau Ubah target; versi standar yang dipakai tampil sebagai label Berlaku. **Acceptance:** rencana terhitung ulang < 3 detik setelah forecast disimpan; kapasitas kurang tampil sebagai jam dan hari.

### 7.12 Input bulanan (Penyusun) — versi bersih dari halaman live

**Pertanyaan:** upload mana yang belum, kontrol input mana yang gagal, mapping apa yang kurang. **Data:** `upload`, `control_month` (B01/B02/B44/F07), `coa_pool_map`, `coa_fs_map`, `gl_voucher_tag`, `budget_version`. **Tata letak:** header bulan dengan panah; blok status upload: satu baris per jenis dengan label bisnis ("GL Accurate per voucher", bukan `gl_month`), baris tersimpan, waktu, oleh (nama), status Menunggu/Tersimpan; blok kontrol input dengan keterangan format rumah; wizard upload: pilih jenis → pratinjau (baris bermasalah di atas, rencana perubahan baru/diubah/dihapus, contoh baris dilipat dengan judul kolom bisnis) → tombol "Simpan ke Sep-26" dengan konfirmasi inline; blok tag voucher; blok mapping akun (pool dan baris neraca) dengan akun tanpa mapping ditandai; blok BP per versi. **Acceptance:** tidak ada nama tabel, SHA, `line_key`, atau email di halaman; aksi utama tidak pernah berada di bawah dump data.

### 7.13 Tutup bulan (Penyusun)

**Pertanyaan:** bulan ini boleh dirilis belum; siapa masih punya pekerjaan. **Data:** `upload`, `control_month`, `fs_check_month`, `reasonableness`, `trueup_month`, `release`. **Tata letak:** daftar gate berurutan dengan status dan pemilik: (1) 10 upload Tersimpan · (2) costing dijalankan (waktu, `rule_id` versi) · (3) B01–B45 LULUS atau PERIKSA ditinjau · (4) CEK dijelaskan · (5) F01–F05 LULUS · (6) true-up (Fase 6) · (7) Rilis; tombol Rilis hanya Finance/Admin, aktif bila 1–6 selesai; hasil rilis: snapshot + SHA + PDF A4 landscape 3 halaman (ringkasan, bridge, kontrol). Setelah rilis semua angka bulan itu berlabel Final; upload ulang butuh `reopen_month`. **Acceptance:** gate tidak bisa dilewati; PDF berisi angka yang sama dengan layar.

### 7.14 Pengaturan (Admin)

Pengguna dan peran (nama lengkap, peran, status), flag modul dengan peringatan "preview dan production memakai database yang sama", master dan versi standar (Draft/Berlaku/Digantikan, diff antar versi), antrian rebuild, buka bulan (`reopen_month`) dengan alasan, audit (koreksi, upload, rilis) dengan filter tanggal, orang, lini. Nama tabel boleh tampil di sini sebagai tooltip.

## 8. Design system

Satu stylesheet (`globals.css`) yang dirapikan dari house style live, bukan tema baru: konvensi WP tetap (input biru di krem, merah hanya untuk angka negatif), grammar samb-bi masuk sebagai komponen, dan kosakata status dibakukan. Semua nilai di bawah adalah kontrak untuk `apps/web/components/`; class KGR yang tidak dipakai BMG dihapus.

### 8.1 Token warna

| Token | Nilai | Pakai |
| --- | --- | --- |
| `--ink` | #1d2433 | Teks utama |
| `--ink-2` | #4a5468 | Teks pendukung (7,6:1 di putih) |
| `--ink-3` | #636b7d (dulu #7a8396) | Label, keterangan; 5,34:1 di putih, 4,99:1 di `--bg`, 4,72:1 di `--head` |
| `--line`, `--line-2` | #e2e5ec, #cfd4de | Garis tabel dan kartu |
| `--bg`, `--card`, `--head` | #f6f7f9, #ffffff, #eef1f6 | Latar halaman, kartu, kepala tabel |
| `--brand` | #12355b | Topbar, tab aktif, tombol utama |
| `--accent` | #0f6cbd | Bulan terpilih di grafik, chip aktif (dipinjam dari samb-bi) |
| `--accent-soft` | #e6f0fa | Latar chip, kolom BP redup memakai `--line-2` |
| `--cream`, `--cream-line`, `--input-ink` | #fff8e6, #ecd9a6, #0b4fb3 | Sel input (konvensi WP) |
| `--ok`, `--ok-bg` | #187a3a, #e7f5ec | LULUS, delta baik |
| `--warn`, `--warn-bg` | #c62828, #fdecec | GAGAL, angka negatif, delta buruk |
| `--amber`, `--amber-bg` | #8a5a00, #fff3d6 | PERIKSA, CEK, Sementara |
| `--muted-bg` | #eceff3 | BELUM DIISI, Kosong, kolom BP di grafik |

Tidak ada hex di luar `:root`; 31 nilai mentah di `globals.css` live dan 4 di TSX dipetakan ke token ini. Tema gelap tidak dibuat (alasan: layar pabrik dan kantor memakai terang; dicatat sebagai Tier 2).

### 8.2 Tipografi dan spasi

Font: Segoe UI / system-ui, satu keluarga. Angka selalu `font-variant-numeric: tabular-nums`. Skala ukuran lima tingkat: 12 px (label, badge, keterangan tabel), 13 px (teks dan sel tabel, basis), 14 px (judul kartu, h3), 18 px (h1, nilai kartu KPI di tabel), 28 px (nilai kartu KPI). Ukuran 10 dan 11 px dihapus. Bobot: 400, 600, 700.

Skala spasi: 4, 8, 12, 16, 24, 32 px; semua padding dan gap dari skala ini (25 nilai padding berbeda di live dipetakan ke enam ini; 24 style inline dipindah ke class). Radius: 4 px kontrol, 8 px kartu; tidak ada radius lain.

### 8.3 Format angka, tanggal, satuan

Semua lewat `fmt.ts`: titik ribuan, koma desimal (1.590.888.645,02; 14,6%; 23.478/kg); `Rp` dengan spasi; satuan Rp juta untuk halaman Direksi ("7.462,4 jt"), Rp penuh untuk kartu proses dan rekon per item, pp untuk bridge. Tanggal "16 Okt 2026", bulan "Sep-26", minggu "Minggu 12 Okt". Catatan kontrol dari engine diformat di tampilan, bukan `toFixed`. Satuan di kepala kolom, bukan di tiap sel.

### 8.4 Kosakata status dan warna

Tiga sumbu §6.4, tiga tampilan berbeda supaya tidak tertukar:

| Sumbu | Tampilan | Nilai dan warna |
| --- | --- | --- |
| Status input | Chip bergaris (outline), ikon kecil | Kosong (abu), Draft (amber garis), Terkirim (biru garis), Terkunci (hijau garis + gembok), Dikoreksi (penanda kecil di samping nilai) |
| Status angka | Label teks di samping angka, tanpa warna latar | Sementara (amber teks), Direkonsiliasi (abu teks), Final (tanpa label) |
| Status kontrol | Badge terisi | LULUS (`--ok-bg`), PERIKSA dan CEK (`--amber-bg`), GAGAL (`--warn-bg`), BELUM DIISI (`--muted-bg`), WAJAR (`--ok-bg`) |
| Versi standar | Teks | Draft, Berlaku, Digantikan |

**Warna delta di kartu KPI** mengikuti baik/buruk, bukan tanda: pendapatan naik hijau, biaya per kg naik merah (`invert` per KPI). Angka di tabel tetap mengikuti konvensi WP: merah hanya untuk negatif. Pengecualian ini ditulis di `CLAUDE.md` (Lampiran). Tidak ada warna yang membawa dua arti: hijau LULUS tidak dipakai untuk "Berlaku".

### 8.5 Komponen

| Komponen | Isi | Dipakai di |
| --- | --- | --- |
| `PeriodChips` | Deret chip bulan/minggu, terpilih `--accent`, periode tanpa data redup dengan label | §7.1–7.8, 7.11 |
| `KpiCard` | Label + basis, nilai 28 px, sampai dua baris delta "±x vs \<basis>" berwarna baik/buruk, satu baris pendukung, ikon `SourceTrace`, label status angka | §7.1–7.5, 7.8 |
| `ColumnChart` | Kolom per periode, periode terpilih `--accent`, BP sebagai kolom `--muted-bg`, garis opsional sumbu kanan, nilai di atas kolom, SVG sendiri | §7.1, 7.2, 7.4, 7.8 |
| `Waterfall` | Bar bertanda dari start ke end, nilai di tiap bar, grup berwarna, subtotal opsional | Bridge §7.1, rekon §7.7, arus kas §7.5 |
| `BarChart` (horizontal) | Item diurutkan, nilai di ujung bar | Margin per kelompok §7.3 |
| `DataTable` | Kepala sticky, angka kanan tabular, baris total tebal, kolom % dan Δ, baris bisa dibuka, sticky kolom pertama di mobile (dari live) | Semua |
| `NotePanel` | Panel teks kanan: "Cara baca", "Catatan", bisa dilipat | §7.1, 7.4, 7.5 |
| `StatusBadge` / `InputStateChip` / `NumberStateLabel` | Tiga sumbu §8.4 | Semua |
| `SourceTrace` | Ikon kecil di samping angka → popover: sumber (sel WP `FCC!E66`, upload file + baris, atau `rule_id` + input), nilai mentah, tautan ke halaman rekon | Semua angka |
| `ShiftGrid` | Grid §6.3: sel input krem, sel hitung abu, baris status, Kirim per baris, layout kartu di ≤ 480 px | §7.9 |
| `GateList` | Daftar gate berurutan dengan status, pemilik, tautan | §7.13 |
| `UploadWizard` | Dari live, dibersihkan: pratinjau bermasalah dulu, rencana perubahan, dump dilipat, tombol bernama bulan | §7.12 |

Tooltip "Cara hitung" dari live digabung ke `SourceTrace`. Ikon hanya pada `SourceTrace`, gembok Terkunci, dan panah navigasi; tidak ada ikon dekoratif di judul kartu.

### 8.6 Aksesibilitas dan perangkat

- Kontras teks ≥ 4,5:1 di latar aktualnya, diukur, termasuk teks di badge.
- Target sentuh ≥ 44 px untuk semua kontrol di §7.9–7.10 (tablet pabrik); desktop Penyusun boleh 32 px.
- Semua kontrol bisa diakses Tab dengan fokus terlihat (outline 2 px `--accent`); grid mendukung Tab/Enter/panah.
- Lebar diuji di 390, 768, 1.024, 1.440 px; tabel lebar menggulir di dalam kartu, bukan halaman.
- Empat state untuk setiap blok data: kosong (menyebut apa yang harus dilakukan dan oleh siapa), memuat, galat (satu baris + coba lagi), terisi.
- Cetak: A4 landscape, tanpa chrome, untuk PDF rilis (dari live).

### 8.7 Bahasa

Antarmuka Bahasa Indonesia; istilah akuntansi yang lazim dipakai apa adanya (HPP, GL, WIP, BOM, FG, KW 2, bridge). Kode dan kolom Inggris. Istilah satu konsep satu nama: "masuk proses" (bukan input/throughput), "premium" (bukan good output), "kunci hari" (bukan lock/penyelesaian), "Sementara" (bukan provisional) di layar.

## 9. Non-functional

- Semua perhitungan di engine; golden dari fixture WP Sep26\_4 dan WP Agu26 (roll-forward dan bridge) dan dari sheet "BMG Business Plan" untuk FS; rule test per cabang. Tidak ada perhitungan uang di React, server action, atau SQL view.
- `rebuildMonth` < 10 detik; `rebuildWeek` < 3 detik; rebuild FS < 2 detik; halaman Direksi dimuat < 1 detik dari data mart; grid shift menyimpan draft < 300 ms.
- Grafik SVG sendiri; total JavaScript grafik < 50 kB; tidak ada dependency berat (ORM, state manager, chart library).
- RLS untuk setiap tabel; `supabase/tests/rls_roles.sql`; audit `tg_audit` pada semua tabel input dan koreksi.
- Upload API ≤ 8 detik per transaksi; chunk 2.500 baris; file ≤ 25 MB.
- Offline grid shift: draft di `localStorage` perangkat, dikirim saat jaringan kembali, konflik ditolak dengan pesan (versi server menang).
- Backup `pg_dump` harian via GitHub Actions; dijalankan manual sebelum migrasi Fase ≥ 2.
- PDF rilis bulanan A4 landscape 3 halaman (ringkasan, bridge, kontrol) dan PDF rencana mingguan 1 halaman untuk pabrik, dari data mart yang sama dengan layar.
- UI Bahasa Indonesia; kode dan kolom Inggris; format angka §8.3 di semua keluaran termasuk PDF dan CSV unduhan.

## 10. Acceptance criteria

Acceptance engine v1 §8 tetap dan ditambah FS; setiap halaman §7 punya uji tugas dengan orang sungguhan, bukan hanya tes browser. Golden bulanan diambil dari sel WP, bukan dari output engine. Angka yang tidak tereproduksi setelah dua pendekatan dicatat di `docs/open-questions.md` §B dengan sel dan dugaan penyebab, test ditandai `todo`, pekerjaan lanjut.

### 10.1 Engine dan data

| Modul | Lulus bila |
| --- | --- |
| Fase 0–1 (merge) | Repo, Supabase, fixture, D1–D12, 10 parser, B01/B02/B44, halaman Input dan Standar — bukti di `docs/v1/README.md` |
| B8 / Fase 1b | `bp_fs` mengimpor Jan–Agu aktual dan Sep-26–Des-27 BP dari sheet "BMG Business Plan" baris 9–266; `fs_month` Agu-26 = sheet ±Rp 1 (kas 5.222,3 jt; NWC 7.019,8 jt; ekuitas 35.641,2 jt); F01–F03 LULUS Jan–Agu; F06 PERIKSA Jun–Agu; `coa_fs_map` Sep-26 dan Okt-26 terisi; `tb_month` Sep-26 ditolak tanpa mapping (F07) |
| B2 | `pool_month` Sep: total 1.572.766.737,19; A 469.314.556,75; Kupas 53.598.624,96; B 419.567.213,29; C 46.737.260; D 313.485.769,27; E 270.063.312,92; tetap 806.327.113,62. Alokasi FCC 1.287.026.419,50; UU 5.780.271,39; UO 78.965.900,38; Lain-lain 200.994.145,92. FCC: biaya produksi 5.562.568.465,96 (23.478,381/kg); rate 23.928,4692; HPP 5.106.312.148,26; transfer 551.835.128,88. UU HPP 232.706.417,35; UO dari fixture (UO!E94). Lain-lain 870.978.077,67; cem-cem ORI 318.461.224,94; HPP Lain-lain 871.581.725,61. Semua ±Rp 1 |
| B3 | `recon_month` Sep: HPP kartu 6.463,1669 → GL 6.375,4123 dengan pos −121,1482 / −326,5394 / +409,3055 / −25,5969 / −23,7756 / 0; sisa 0. Neraca persediaan 1106-001 826,0313 vs 947,1795 (−121,1482); WIP 51,9846 vs 297,8507 (−245,8661); FG 14,1713 vs 286,5366 (−272,3654). K2 WIP akhir 225.691.966,25. B01–B32 LULUS; B21/B22 PERIKSA (221.027 vs 211.979,5; 23.115,5 vs 14.058) |
| B4 | Kewajaran Sep: 14 KPI bagian 1 dengan status dan catatan sama dengan WP; bagian 2: 6 CEK dengan penjelasan terbawa. Bridge Agu→Sep 19,9219 → 14,5657 pp, 17 bar C118:C134 ±0,0001 pp; `kpi_series` Jan–Sep = tabel §1. Varian vs BP v1 Sep untuk FCC/UU/UO, cek per baris = 0 |
| B5 | Versi standar v1 dari rata-rata Jul–Sep approved; fixture `week-2026-10-W2` dari data grid asli → `plan_week`, `cost_week`, `variance_week`, Σ varian = aktual − standar ±Rp 1; HPP standar FCC pada driver Sep = 23.481 ±5/kg; 6 hari grid → kunci → `rebuildWeek` < 3 detik |
| B6 | True-up Sep: Σ minggu + true-up = `process_card_month` = GL; rilis snapshot + SHA + PDF; kalibrasi menghasilkan draft v2 dengan diff |
| B7 | Outlook Okt vs BP v1 dengan aktual MTD + forecast; kas harian per rekening dan 13 minggu; kas proyeksi minggu 0 = saldo bank; F02 LULUS |
| Semua | `pnpm test`, `typecheck`, `build`, `snapshot:diff` hijau; RLS test hijau; flag off = halaman tidak ada; tidak ada hex di luar token; kontras diukur |

### 10.2 Uji tugas per layar (dengan pengguna, dicatat di `docs/v2/ux-tests.md`)

| Layar | Peserta | Tugas | Lulus bila |
| --- | --- | --- | --- |
| 7.9 Shift hari ini | 3 operator/admin produksi, 1 gudang, 1 engineering | Isi satu shift lengkap di tablet, termasuk satu kesalahan neraca yang sengaja | ≤ 3 menit; kesalahan terdeteksi sebelum Kirim; tidak bertanya ke penguji |
| 7.10 Penyelesaian hari | 1 supervisor produksi | Kunci hari dengan satu tab belum lengkap, lalu lengkapi dan kunci | Pesan menyebut lini dan shift yang kurang; kunci berhasil setelah lengkap |
| 7.1 Kinerja bulan | 3 pembaca awam (direksi atau wakilnya) | Sebutkan margin bulan ini, biaya/kg, dan penyebab terbesar penurunan margin | Ketiganya dalam ≤ 5 detik per angka; jawaban cocok dengan WP |
| 7.4 Neraca & BP | 2 pembaca | Sebutkan kas akhir Agu dan satu pos yang berubah paling besar sejak Mei | Jawaban: 5.222,3 jt; piutang pihak berelasi |
| 7.6 Cek & kewajaran | 1 Cost Accounting | Isi penjelasan untuk satu CEK dan lihat efeknya di gate rilis | Gate berubah dari "menunggu" ke "selesai" tanpa muat ulang |
| 7.12 Input bulanan | 1 Finance BMG | Unggah GL Sep asli, perbaiki satu akun tanpa mapping, simpan | Tidak membaca nama tabel; tahu akun mana yang kurang dari layar |
| 7.13 Tutup bulan | 1 Finance | Jelaskan siapa masih punya pekerjaan sebelum rilis | Menyebut pemilik dari daftar gate tanpa bertanya |

Uji dijalankan di lebar 390 px untuk 7.9–7.10 dan 1.440 px untuk sisanya. Hasil dicatat per peserta; satu kegagalan pada 7.9 atau 7.1 menunda fase yang bersangkutan.

## 11. Keputusan terbuka dan default

Q1–Q20 dari v1 tetap berlaku kecuali Q8 (dicabut); Q21–Q30 baru. Sesi Claude Code memakai default dan mencatat di `docs/open-questions.md` §C; perubahan default hanya oleh Dika.

| # | Keputusan | Default yang dipakai | Di mana diubah |
| --- | --- | --- | --- |
| Q1 | Cakupan | B1, B8, B2–B7 berurutan; L1 dulu, FS di Fase 1b | PLAN v2 |
| Q2 | Repo | `BMG-OS`, Supabase terpisah; multi-entitas ditunda | — |
| Q3 | Nilai WP: buku atau manajemen | Manajemen; Accurate tetap kartu lama; K1 menjelaskan; jurnal ke Accurate setelah B01–B32 hijau 3 bulan | `app_setting.wp_is_book` |
| Q4 | BP | v1 as-is dibekukan; v2 oleh manusia | `budget_version` |
| Q5 | Harga material mingguan | PI terakhir per item; true-up ke MA Accurate | `material_price_week.source` |
| Q6 | Tarif standar v1 | Rata-rata aktual Jul–Sep (WP Agu26 + Sep26) | `std_version` |
| Q7 | Jam operator Lain-lain | Per kelompok (21); koperasi 11 SKU dibagi man-hour kartu | `labour_hours.line` |
| Q8 | Kanal input harian | **Dicabut.** Grid shift web (§6.3) sejak Fase 5b; tidak ada template xlsx atau CSV untuk Produksi, Gudang, Engineering | flag `b5_forms` |
| Q9 | Kapasitas normal | = jam dibayar sampai PPIC mengisi | `capacity.normal_capacity_hours` |
| Q10 | WIP completion | 100% | `product.wip_completion_pct` |
| Q11 | By-product KW 2 | NRV 9.777/kg, kalibrasi bulanan dari Sales by Item | `product.kw2_nrv_per_kg` |
| Q12 | Target stok FG | 1 minggu jual | `assumption.fg_target_days` |
| Q13 | Pita BOM untuk validasi bon | ±15% | `bom_line.band_*` |
| Q14 | Ambang alert varian minggu | > 2% biaya standar minggu, atau 3 minggu tanda sama | `assumption.variance_alert_pct` |
| Q15 | Hari kunci | H+1 12:00; belum dikunci Senin 10:00 = BELUM DIISI | `assumption.lock_deadline` |
| Q16 | Driver D untuk UU | Estimasi dari rasio kWh, `estimated=true` | `driver_month.estimated` |
| Q17 | Kupas ikut THR/BPJS | 0 | `assumption.kupas_thr_bpjs` |
| Q18 | Konversi CNG | 22,2967 m³/MMBTU | `assumption.cng_m3_per_mmbtu` |
| Q19 | Olein di WIP-022 | Tetap bahan baku di WP; K2 | `inventory_recon.category` |
| Q20 | Minggu dimulai | Senin; biaya tetap per hari kalender | `assumption.week_start_dow` |
| Q21 | Definisi rendemen di layar | Premium ÷ masuk proses (WP), tanpa koreksi WIP; WIP baris terpisah | `kpi_series.kpi_code` |
| Q22 | Koreksi setelah kunci | Diizinkan oleh Produksi dan Finance lewat `correction_line` berpasangan dengan alasan; hari tetap Terkunci, berpenanda Dikoreksi; setelah rilis bulanan butuh `reopen_month` | `day_lock.unlocked_*` |
| Q23 | Offline grid | Draft lokal, kirim saat online, versi server menang saat konflik | `ShiftGrid` |
| Q24 | Perangkat pabrik | Tablet; target sentuh 44 px; uji di 390 px | §8.6 |
| Q25 | Warna delta kartu | Baik/buruk per KPI (`invert`); angka tabel merah hanya negatif | `KpiCard`, `CLAUDE.md` |
| Q26 | NWC | Piutang dagang + persediaan − hutang dagang (definisi sheet BP baris 127–130) | `nwc_month` |
| Q27 | Ambang F06 piutang pihak berelasi | 10% ekuitas → PERIKSA | `assumption.related_party_pct` |
| Q28 | Sumber neraca Sep-26 ke depan | TB/LK Accurate bulanan lewat `tb_month`; sampai LK Sep ada, neraca Sep tampil Kosong | `coa_fs_map` |
| Q29 | Fase 1b dan gerbang D | Migrasi B8 boleh diterapkan Claude selama semua tabel data kosong; begitu upload pertama `committed`, mengikuti aturan Fase ≥ 2 | `CLAUDE.md` gerbang D |
| Q30 | Satuan halaman Direksi | Rp juta satu desimal di kartu dan tabel ringkas; Rp penuh di rekon per item | `fmt.ts` |

## 12. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Engine bulanan tidak mereproduksi WP karena tautan manual | Fixture per sel dengan `extract_fixtures.py`; selisih dicatat per sel, bukan ditutup; test `todo` |
| WP Sep26\_4 belum diverifikasi independen (D15) | `verify-financial-model` sebelum `b6_management` dibuka ke selain admin; temuan menjadi fixture versi baru, bukan edit golden |
| Pabrik tidak konsisten mengisi grid | B36 dan BELUM DIISI terlihat di §7.8; uji tugas 7.9 sebelum Fase 5b; target ≤ 3 menit sebagai acceptance, bukan harapan |
| COA Okt-26 memecah pool dan baris neraca sebelum mapping siap | B44 dan F07 memblok upload; mapping Okt disiapkan dari kolom "akun baru" WP |
| BP v1 salah klasifikasi membuat varian budget menyesatkan | Varian per komponen hanya FCC/UU/UO; Lain-lain di level total sampai BP v2 |
| Standar dari aktual 3 bulan mengunci inefisiensi | Kalibrasi menampilkan selisih vs BP; versi berikutnya diputuskan manusia |
| Dua sumber HPP (WP vs Accurate) membingungkan direksi | Label "manajemen" vs "buku" di setiap HPP; K1 di rekon; Q3 di panel Cara baca |
| Production = satu-satunya database; preview memakai data yang sama | Flag b2–b8 off sampai fase merge; gerbang D hanya saat kosong; migrasi Fase ≥ 2 oleh Dika setelah backup |
| Semua flag on di remote (16 Okt 2026) | Dimatikan di Admin → Modul sebelum PR Fase 1b dibuat; dicatat di `docs/v1/README.md` |
| Halaman direksi berisi angka sintetis (pola prototipe Codex) | Tidak ada angka contoh di state kosong; semua kartu membaca data mart; uji 7.1 memakai WP |
| Grammar samb-bi disalin berikut mesinnya | §3: hanya komponen tampilan; tidak ada DAX, tidak ada ECharts; CI menolak dependency > 50 kB |
| Neraca Sep-26 tertunda karena LK Sep belum ada | Halaman neraca menampilkan Jan–Agu dari BP dan state kosong untuk Sep; `tb_month` menjadi upload rutin mulai Okt |
| Design system menyimpang kembali ke nilai mentah | Lint CSS menolak hex di luar `:root` dan ukuran di luar skala; review PR memakai §8 sebagai checklist |

## Lampiran

### L1. Peta perubahan v1 → v2

| v1 | v2 | Keterangan |
| --- | --- | --- |
| §0 Ringkasan | §0 | + lapis FS, modul B8, prinsip 3, 4, 8 |
| §1 Konteks | §1 | + tren Jan–Sep, neraca Jan–Agu, D13–D15 |
| §2 Pengguna dan peran | §2 | Peran tetap; + empat tipe pengguna, hari kerja, perangkat |
| §3 Arsitektur | §3 | + `fs.ts`, `history.ts`, komponen tampilan, aturan samb-bi, infrastruktur tanpa branch |
| §4 Domain model | §5 | + `coa_fs_map`, `fs_line`, `tb_month`, `budget_fs_line`, `history_fs_line`, `fs_month`, `nwc_month`, `cashflow_month`, `fs_check_month`, `kpi_series`; `rule_id` + `inputs` di data mart; B37b, F01–F07 |
| §4.5 Rumus inti | §4 | Rumus sama + worked example Sep-26 per modul; §4.11 FS baru |
| §5 Upload | §6.1–6.2 | + `tb_month`, `bp_fs`, `plan_override`; `plant_daily` dihapus |
| — | §6.3–6.5 | Grid shift, model state tiga sumbu, koreksi |
| §6 Halaman (satu tabel) | §7 | 14 layar dengan spesifikasi penuh |
| — | §8 | Design system |
| §7 Non-functional | §9 | + performa halaman, offline, lint |
| §8 Acceptance | §10 | + B8, uji tugas per layar |
| §9 Keputusan | §11 | Q8 dicabut; Q21–Q30 |
| §10 Risiko | §12 | + 6 risiko |

### L2. Yang diambil dari handoff dan prototipe Codex (16 Okt 2026)

Diambil: model state belum diisi → draft → dikirim → dikunci → dikoreksi (§6.4); aturan koreksi berpasangan (§6.5, B37b); nilai kosong ≠ nol (§6.3); aturan "kunci hari tidak menyetujui HPP bulanan" (§0 prinsip 8); peran akun tampil di header, bukan sebagai kontrol pengguna (§7 navigasi).

Tidak diambil: lima tab Ringkasan untuk semua peran; CSV sebagai kanal input Produksi/Gudang/Engineering; data shift sintetis (premium 82%, KW 2 10%) yang bertentangan dengan histori WP (91,9–100,6% dan 2,2–4,4%); stylesheet `redesign.css` terpisah; nama "Phase 1" yang bertabrakan dengan Fase 1 repo; pola "What Happened → What Next → How" sebagai label tab. Prototipe tidak dijadikan kontrak visual; kontrak visual adalah mockup §7 yang dibuat di atas `globals.css` v2.

### L3. Delta PLAN v2

| Fase | Isi | Gerbang masuk | Gerbang keluar |
| --- | --- | --- | --- |
| 1b | B8: `coa_fs_map`, `fs_line`, `tb_month`, `budget_fs_line`, `history_fs_line`, parser `tb_month` dan `bp_fs`, engine `fs.ts` + `history.ts`, data mart FS, F01–F07, halaman §7.4–7.5 di balik flag `b8_fs` | Flag b2–b8 off di remote; semua tabel data masih kosong (gerbang D) | Acceptance B8 §10.1; migrasi diterapkan lewat gerbang D |
| 2 | B2 costing bulanan (tidak berubah) | PR 1b merge; upload Sep asli masuk setelah fase ini mulai | Acceptance B2 |
| 3 | B3 rekon (tidak berubah) + halaman §7.7 |  | B3 |
| 4 | B4 kewajaran, varian, bridge + `kpi_series` + halaman §7.1, 7.2, 7.3, 7.6 | Mockup §7.1 disetujui Dika; uji tugas 7.1 lulus pada mockup | B4; uji 7.1 pada data mart |
| 5a | B5 standar dan rencana + halaman §7.11 |  | B5 sebagian |
| 5b | B5 grid shift (§7.9–7.10) dan varian mingguan + halaman §7.8 | Mockup grid disetujui; uji tugas 7.9 lulus pada mockup di tablet | B5; uji 7.9 pada aplikasi |
| 6 | B6 true-up, kalibrasi, rilis + halaman §7.13 + `b6_management` | D15 selesai (WP diverifikasi) | B6; uji 7.13 |
| 7 | B7 outlook dan kas + blok 13 minggu §7.5, outlook §7.8 |  | B7 |

Mockup dibuat sebelum fase yang punya halaman (4, 5b, 6), dari angka Sep-26/Agu-26 asli, di atas `globals.css` v2, dan disimpan di repo (`docs/v2/mockups/`). Satu sesi Claude Code tetap satu fase.

### L4. Delta `CLAUDE.md`

- Spesifikasi: `docs/PRD-v2-bmg-platform.md` (struktur) dan `docs/PLAN-v2-bmg-platform.md`; v1 dipindah ke `docs/archive/`.
- Tampilan: tidak ada nama tabel, kode fase, SHA, atau email di antarmuka selain Admin; label dari `fs_line.label_id` dan kamus istilah §8.7.
- Warna: angka merah hanya untuk negatif (tetap); delta di `KpiCard` berwarna baik/buruk per KPI (pengecualian baru).
- Grafik: hanya komponen SVG di `components/`; dependency grafik dilarang; lint CSS menolak hex di luar `:root` dan ukuran di luar skala §8.2.
- Status: tiga sumbu §6.4; kosakata tetap, tidak menambah status baru tanpa PRD.
- Form pabrik: grid shift dibangun di Fase 5b; tidak ada CSV untuk peran pabrik.
- Database: gerbang D berlaku juga untuk Fase 1b selama tabel kosong (Q29); flag `b8_fs` ditambah dengan default false.

### L5. Untuk Dika sebelum Fase 1b

1. Matikan flag `b2_costing` s.d. `b7_outlook`, `b5_plan`, `b5_weekly`, `b5_forms`, `b6_management` di Admin → Modul (per 16 Okt 2026 semuanya on; `b1_ingest` boleh tetap on untuk admin).
2. Jalankan `verify-financial-model` pada WP Sep26\_4 atau catat hasilnya bila sudah (D15).
3. Konfirmasi Q21–Q30 atau biarkan default.
4. Setujui mockup §7.1 dan §7.4 (akan dibuat dari angka WP/BP) sebelum PR Fase 4.
5. Siapkan LK Sep-26 (IS/BS) dan file sumber Sep asli di `reference/` (daftar Fase 1 "Untuk Dika" no. 1).

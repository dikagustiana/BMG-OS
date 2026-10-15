# PRD v1 — BMG Costing & Operations Platform

Status: Draft untuk eksekusi · Owner: Dika (Group Project Finance, SAMB) · Tanggal: 15 Okt 2026
Entitas: PT Boga Makmur Gracia (BMG) — pabrik keripik singkong (FCC), ubi ungu (UU), ubi orange (UO), dan lini Lain-lain (retail, koperasi, maklon)
Repo: `dikagustiana/BMG-OS` (baru) · Supabase: `BMG-OS` ref `btccexwuukrpushmharq` (ap-northeast-2 Seoul, Postgres 17, Pro, tanpa branch) · Vercel: `bmg-os`

Dokumen ini adalah spesifikasi platform BMG. Spesifikasi perhitungan bulanan adalah workpaper `reference/DI - WP Costing BMG Sep26_4.xlsx` (22 sheet, semua kontrol LULUS); platform harus mereproduksi angkanya ±Rp 1. Budget adalah `reference/BMG_Business_Plan_-_Oct26_to_Dec27.xlsx` (BP v1). Pola arsitektur mengikuti `KGR-Weekly-Outlook` (engine murni decimal.js, data mart, kontrol LULUS/GAGAL, snapshot SHA), tetapi logika costing-nya berbeda dan tidak boleh disalin dari M1 KGR.

---

## 0. Ringkasan satu halaman

Hari ini costing BMG dikerjakan bulanan di Excel: 22 sheet, tie ke GL Accurate, bridge margin, cek kewajaran. Hasilnya benar tetapi terlambat (WD+7 s.d. WD+10) dan tidak bisa dipakai untuk mengelola minggu berjalan. Budget (BP v1) ada tetapi tidak sebanding per komponen dengan WP.

Target: satu platform dengan tiga lapis yang saling mengunci.

| Lapis | Ritme | Isi |
| --- | --- | --- |
| **L1 Costing bulanan** | WD+3 s.d. WD+7 | Reproduksi WP 14 langkah: material per lini → penyesuaian payroll/opex → pool A–E → alokasi → kartu proses → barang jadi → Lain-lain per SKU → rekon HPP/persediaan/material ke GL → kewajaran → varian vs budget → bridge margin → gate rilis |
| **L2 Engine mingguan** | Harian input, Senin hitung | Master standar (BOM, komposisi, routing, tarif, kapasitas) → forecast jual → rencana produksi, bahan, jam → HPP standar; input harian pabrik → biaya aktual provisional → varian yield/pemakaian/harga/efisiensi/volume |
| **L3 Tutup bulan dan outlook** | Bulanan | True-up Σ minggu ke GL (varian tarif, belanja OH, harga MA), kalibrasi standar, outlook bulan berjalan, kas 13 minggu, solvabilitas |

Modul:

| # | Modul | Satu kalimat |
| --- | --- | --- |
| B1 | Ingest dan master | Upload GL, Inventory Valuation, Sales by Item, Average Price, kartu CoGM, rekap payroll, BP; mapping akun bertanggal efektif (COA berubah Okt-26); master standar berversi |
| B2 | Costing bulanan | Engine `monthly-costing` yang mereproduksi WP Sep26_4 sheet BIAYA BERSAMA, FCC, UU, UO, LAIN-LAIN, sheet SKU, KOPERASI |
| B3 | Rekon dan kontrol | REKON & KONTROL, REKON MATERIAL, REKON PERSEDIAAN (K1–K6), RINGKASAN bagian 5; 40+ kontrol dengan toleransi dari WP |
| B4 | Varian dan bridge | CEK KEWAJARAN, varian per komponen vs flex budget dari BP v1, BRIDGE GP 17 bar |
| B5 | Engine mingguan | Master standar, rencana dari forecast, biaya aktual dari input harian, varian mingguan, serapan biaya tetap |
| B6 | Tutup bulan | True-up ke GL, kalibrasi standar, rilis bulanan (snapshot + SHA + PDF) |
| B7 | Outlook, kas, solvabilitas | Diadaptasi dari KGR M4–M6: outlook bulan berjalan vs BP, kas harian per rekening, 13 minggu, CCC |

Prinsip yang tidak boleh dilanggar:

1. **Engine fungsi murni** `MonthInputs → MonthOutputs`, `WeekInputs → WeekOutputs`. decimal.js semua, tanpa I/O, tanpa `Date.now()`.
2. **WP Sep26_4 adalah golden.** Semua angka RINGKASAN, REKON & KONTROL, BIAYA BERSAMA, FCC, LAIN-LAIN, BRIDGE GP direproduksi ±Rp 1 (±0,0001 untuk pp dan rasio). Fixture tidak diubah agar lulus.
3. **Satu angka.** Semua halaman membaca data mart yang ditulis `rebuildMonth(month)` dan `rebuildWeek(week)`.
4. **Migrasi hanya menambah.** Tidak ada drop/rename. Backfill idempoten.
5. **Minggu tidak ditulis ulang.** Angka mingguan provisional tetap; true-up bulanan tampil sebagai baris terpisah.
6. **Master berversi.** BOM, routing, tarif, komposisi, kapasitas punya `effective_from` dan status approved. Revisi = versi baru.

---

## 1. Konteks bisnis (dari WP Sep26_4 dan BP v1)

- September 2026: produksi 289.759 kg, biaya produksi 6.704,3 jt, HPP 6.463,2 jt (kartu) / 6.375,4 jt (GL), pendapatan 7.462,4 jt, margin kotor GL 14,6% (Agu 19,9%).
- FCC: 236.923 kg masuk proses, 23.478/kg biaya produksi, margin 13,5%. Volume −30% vs Agu; efek biaya tetap −2,4 pp.
- Lain-lain: 45.653 kg, margin 5,0%; menyerap FCC premium 23.115,5 kg / 551,8 jt. Cem-cem ORI −0,9%, BBQ −0,5%, Maicih basreng −14% s.d. −24%.
- Pool konversi 1.572,8 jt (tetap 806,3 / variabel 766,4) dari GL 16 akun 1.590,9 jt plus penyesuaian bagian 8 (reklas opex pabrik 108,9 jt, THR tertukar, tali asih, ongkir singkong ke material, pisau Urschel).
- Jam menganggur Unit I: 3.265 jam (13,1%), 61,6 jt, saat ini diserap produk.
- BP v1 Sep-26: pendapatan 8.746 jt (aktual −14,7%), produksi FCC 297,1 t (aktual −20%), GP 13,7%.

Masalah data dan model yang harus beres di Fase 0:

| ID | Masalah | Dampak | Penanganan |
| --- | --- | --- | --- |
| D1 | Kartu baru belum dibukukan; HPP Accurate memakai kartu lama (cem-cem ORI: WP 332,4 jt vs Accurate 249,7 jt) | Dua angka HPP per SKU | Q3: nilai WP = manajemen; rekon K1 menjelaskan selisih |
| D2 | Kapasitas menganggur diserap produk (parameter 0/1) | HPP/kg naik saat volume turun | Parameter `normal_capacity_hours` per departemen; di atasnya = beban periode |
| D3 | WIP dinilai 100% selesai; UU WIP awal 4.042 kg vs produksi 467 kg | Rp/kg UU ditentukan WIP awal | Parameter `wip_completion_pct` per produk, default 100%; kontrol WIP awal > 3× produksi → PERIKSA |
| D4 | FG-001 masuk kartu 221.027 vs Accurate 211.980 kg; transfer 23.116 vs 14.058 kg | Kuantitas FG tidak cocok | Kontrol B21/B22 status PERIKSA, bukan memo |
| D5 | Karton FCC Sep 100 pcs vs perkiraan 6.419 pcs (61,7 jt belum dikeluarkan) | Material understated | Kontrol rasio pemakaian per kg vs 3 bulan (B33) |
| D6 | Olein ditahan di WIP-022 Accurate (225,7 jt akhir Sep) | WIP WP ≠ Accurate | Kategori K2 dipertahankan; keputusan proses dicatat |
| D7 | Sheet ASUMSI dirujuk tetapi tidak ada (no. 3, 6, 9) | Asumsi tak terdokumentasi | Tabel `assumption` berisi kupas ikut THR = 0, CNG 22,2967 m³/MMBTU, kapasitas normal |
| D8 | BUDGET di WP kosong; BP v1 berbeda klasifikasi (DL BP = seluruh upah harian; opex pabrik tetap di opex) | Varian per komponen tidak sebanding | Tabel `budget_pool_map` + flex budget (§4.5) |
| D9 | BP v1: laba jual aset 60 jt/bulan hardcode; pajak Sep–Des 2026 kosong; Lain-lain tidak membayar FCC | Angka budget salah di tiga pos | Dicatat sebagai `budget_version` v1 "as-is"; perbaikan menjadi v2 oleh manusia |
| D10 | COA berubah Okt-26 (5101-002 → 111..144; varian 5101-201..207, 301..303) | Mapping pool rusak mulai Okt | `coa_pool_map` bertanggal efektif, wajib sebelum upload GL Okt |
| D11 | Driver Grup D untuk UU diturunkan dari rasio kWh, bukan jam mesin aktual | Estimasi tersembunyi | Kolom `estimated=true` pada driver; tampil di kewajaran |
| D12 | Tautan budget di WP memakai nomor baris Model Details (MD411…) | Rapuh | Kunci budget = kode driver (`product × component × month`), bukan baris |

---

## 2. Pengguna dan peran

| Peran | Siapa | Bisa |
| --- | --- | --- |
| `admin` | Dika | Semua; flag modul; approve versi standar |
| `finance` | Finance BMG | Upload GL/IV/Sales/Average Price/payroll; cost pool; true-up; rilis bulanan; budget mapping |
| `cost_accounting` | Pengerja WP | Upload kartu CoGM; jalankan costing bulanan; lihat semua rekon; tidak bisa rilis |
| `ppic` | PPIC pabrik | Master BOM/komposisi/routing/kapasitas (draft); rencana produksi; approve downgrade |
| `production` | Supervisor/admin produksi | Form produksi per shift, jam kerja, kunci hari, koreksi |
| `warehouse` | Gudang | Bon material |
| `engineering` | Engineering | Meter kWh, jam mesin, downtime |
| `purchasing` | Purchasing | Harga material minggu, rencana beli |
| `sales` | Sales | Forecast jual mingguan |
| `management` | Direksi BMG, SAMB | Semua view baca |

Hak tulis per area ditetapkan di `apps/web/lib/roles.ts` dan RLS: `std_version` (admin, finance approve; ppic draft), `upload_*` per kind sesuai tabel §5, `day_lock` (production), `correction_line` (production, finance), `trueup` dan `release` (finance, admin), `budget_version` (finance, admin).

---

## 3. Arsitektur target

```
Sumber ──► Upload + validasi ──► Tabel input ──► Engine (@bmg/engine, murni)
                                                     │
                   ┌─────────────────────────────────┼──────────────────────┐
                   ▼                                 ▼                      ▼
           monthly-costing.ts                  weekly-engine.ts        outlook/cash.ts
           (WP 14 langkah)                     (standar, aktual,       (adaptasi KGR)
                                                varian, serapan)
                   │                                 │                      │
                   ▼                                 ▼                      ▼
           Data mart bulanan                  Data mart mingguan      Data mart harian
           cost_month, recon_month,           plan_week, cost_week,   pl_daily, cash_position
           variance_month, bridge_month       variance_week
                   └──────────── rebuildMonth(month) / rebuildWeek(week) ────────────┘
                                                     │
                      ┌──────────────────────────────┼──────────────────────┐
                      ▼                              ▼                      ▼
              Management view                  Plant view               Preparer view
      (margin, bridge, varian, outlook)   (rencana minggu, varian,    (semua + cara hitung,
                                           input status)               rekon per item)
```

- `packages/engine/src/`: `pool.ts`, `allocation.ts`, `process-card.ts`, `finished-goods.ts`, `others-sku.ts`, `recon.ts`, `reasonableness.ts`, `variance.ts`, `bridge.ts`, `standards.ts`, `plan.ts`, `actual-week.ts`, `absorption.ts`, `trueup.ts`, `calibration.ts`, `outlook.ts`, `cash.ts`. Setiap modul tipe input/output sendiri, golden test, rule test.
- `packages/parsers/`: SheetJS; satu parser per upload kind (§5).
- `apps/web`: Next.js 15 App Router + Supabase SSR, pola sama dengan KGR (`lib/upload.ts`, `lib/write.ts`, `lib/roles.ts`, `lib/modules.ts`).
- Rebuild dipicu setelah commit upload, kunci hari, approve versi standar, dan tombol manual admin. Antrian `rebuild_queue`.

---

## 4. Domain model

Konvensi: money `numeric(18,2)`, Rp/kg dan tarif `numeric(18,4)`, kg `numeric(14,3)`, jam `numeric(12,2)`, persentase `numeric(10,8)`, tanggal Asia/Jakarta, soft delete, kolom provenance (`source, document_ref, upload_id, created_*, updated_*`), `tg_stamp`, `tg_audit`, RLS.

### 4.1 Master dan referensi

```
product              code (FCC|UU|UO), name, fg_item_code, kw2_nrv_per_kg, wip_completion_pct default 1
others_group         code, name, main_line (singkong|ubi_ungu|ubi_orange|maklon), fg_unit (kg|bag), active
sku                  code (FG-180…), others_group_code, name, kg_per_unit, active
material_item        code (Accurate), name, unit, category (singkong_kulit|singkong_daging|olein|cng|amonium|hdpe|karton|other|bumbu|…),
                     line_default nullable
coa_pool_map         account, effective_from, effective_to nullable, pool (A|KUPAS|B|C|D|E|MATERIAL|OPEX_PABRIK|THR|NONE),
                     fixed_flag, note                                  ← D10
payroll_group        code, dept, kind (operator|support|kupas|staf), pool, unit (I|II|III|null)
assumption           key, value_num, value_text, unit, source, effective_from     ← D7
budget_version       id, name ('BP Okt-26 v1'), status (locked), imported_at, note (D9)
budget_line          budget_version_id, month, product, component, qty, price, amount, driver_code (unique)   ← D12
budget_pool_map      budget_version_id, bp_row_code, pool, fixed_pct                ← D8
std_version          id, effective_from, status (draft|approved|superseded), approved_by, approved_at, note
bom_line             std_version_id, product, material_category, qty_per_kg_input, band_low, band_high
output_mix           std_version_id, product, premium_pct, kw2_pct, waste_pct, wip_pct
routing              std_version_id, product, dept, hours_per_ton, machine_hours_per_ton, kwh_per_ton
rate_card            std_version_id, pool, driver (man_hour|kg_peeled|kwh|machine_hour|material_value|kg_output),
                     rate_variable, rate_fixed, fixed_amount_month
capacity             week_start, dept, headcount, shift_hours, working_days, machine_hours, normal_capacity_hours   ← D2
```

### 4.2 Input bulanan (L1)

```
gl_month             month, account, debit, credit, net, voucher, description, upload_id
gl_voucher_tag       month, voucher, account, amount, tag (reklas_opex|thr_swap|tali_asih_cutoff|ongkir_singkong|pisau_urschel), target_pool, note
payroll_month        month, payroll_group_code, amount, source
payroll_journal      month, kind (upah_harian|gaji_staf|tali_asih), amount, voucher
inventory_valuation  month, item_code, account (1106-001|002|003), qty_open, value_open, qty_in, value_in, qty_out_sale,
                     value_out_sale, qty_out_transfer, qty_adj, value_adj, qty_close, value_close
sales_by_item        month, item_code, qty, amount, customer_group (IFM|KGS|retail|maklon)
average_price        month, item_code, price
cogm_card            month, line (FCC|UU|UO|others_group|sku), row_kind (wip_open|input|premium|kw2|waste|wip_close|sample),
                     qty, unit
cogm_material        month, line, item_code, qty, unit, price_card, value_card
driver_month         month, line, driver (man_hour|hours_paid|kg_peeled|kwh|machine_hour), value, estimated boolean   ← D11
fs_control           month, key (revenue_4101_007|material_usage|conversion_16|cogs|inv_1106_001_close|…), amount
```

### 4.3 Input mingguan dan harian (L2)

```
sales_forecast_week  week_start, product_or_group, kg, price_per_kg, sales_rep
material_price_week  week_start, item_code, price, source (pi_last|ma_accurate|manual)
production_shift     date, shift, line, wip_open, kg_input, kg_premium, kg_kw2, kg_waste, wip_close, kg_sample, note
material_issue       date, line, item_code, qty, unit, doc_ref, reason nullable
labour_hours         date, dept, line nullable, headcount, hours_paid, hours_productive, overtime_hours
utility_reading      date, meter_code, line, kwh_open, kwh_close
machine_log          date, machine_code, line, hours_run, downtime_hours, downtime_reason
peel_log             date, kg_kulit_in, kg_peeled, borongan_rp
day_lock             date, locked_by, locked_at
correction_line      ref_table, ref_id, field, old_value, new_value, reason, created_*
```

### 4.4 Data mart (dibangun engine)

```
pool_month           month, pool, gl_amount, adjustment, total, fixed, variable
allocation_month     month, pool, line, driver_share, amount, method (actual|budget_compare)
process_card_month   month, product, kg_input, kg_premium, kg_kw2, kg_waste, wip_open_kg, wip_close_kg,
                     material jsonb, conversion jsonb, total_cost, rate_per_kg, kw2_nrv_credit, wip_close_value
fg_month             month, product_or_sku, qty_open, value_open, qty_in, value_in, avg_rate, qty_sold, cogs_sold,
                     qty_transfer, value_transfer, qty_close_accurate, value_close, qty_diff, cogs_total
others_month         month, others_group, sku, kg_out, fcc_in_kg, kw2_in_kg, ext_material, dl, foh, total, per_kg, cogs, revenue, margin
recon_month          month, line_key, wp_amount, gl_amount, explained jsonb, residual, status
inventory_recon      month, item_code, account, category (K1..K6), qty_wp, value_wp, qty_acc, value_acc, diff
variance_month       month, product, component, actual_per_kg, budget_per_kg, price, usage, volume, method, check
bridge_month         month, bar_code, label, pp, group
reasonableness       month, kpi, value, min_8m, max_8m, delta_pct, status (WAJAR|CEK), explanation
control_month        month, code (B01..B45), value, tolerance, status (LULUS|GAGAL|PERIKSA|BELUM_DIISI), note
plan_week            week_start, product, kg_premium_target, kg_input, kg_kw2, kg_waste, material_qty jsonb,
                     hours jsonb, std_cost jsonb, std_cost_per_kg, margin_plan, capacity_gap jsonb
cost_week            week_start, product, component, driver_std, driver_act, cost_std, cost_act
variance_week        week_start, product, type (yield|usage|price|efficiency|volume|material_e), component, amount, owner_role, explanation
absorption_week      week_start, product, fixed_budget, fixed_absorbed, under_absorption, idle_hours, idle_cost
trueup_month         month, pool, applied_std, gl_actual, variance, allocation jsonb
release              id, kind (month|week), period, snapshot jsonb, sha256, pdf_path, released_by, released_at
```

### 4.5 Rumus inti

**Pool (BIAYA BERSAMA).** `pool_total = Σ gl(account∈pool) + Σ gl_voucher_tag(target_pool)`. Upah 5101-002 dibagi: upah harian × porsi rekap per kelompok → A/B/Kupas; gaji staf → B; tali asih → B dengan cut-off bulan jasa. THR = 5101-003 + koreksi tertukar; THR dan BPJS dibagi porsi upah pokok per kelompok (kupas ikut bila `assumption.kupas_thr_bpjs = 1`). Tetap/variabel per baris pool sesuai WP.

**Jam menganggur.** `idle_hours = hours_paid_unit1 − Σ man_hour_to_product`; `idle_cost = idle_hours × pool_A / hours_paid`. Beban periode sebesar `max(0, idle_hours − (hours_paid − normal_capacity_hours)) × rate`. Default `normal_capacity_hours = hours_paid` (sama dengan WP sekarang) sampai PPIC menetapkan.

**Alokasi.** A, B per man-hour; Kupas per kg dikupas; C per kWh; D per jam mesin goreng setelah porsi bagging (`kwh_bagging / kwh_total`) dipotong ke Lain-lain; E per nilai material. Pembanding metode budget (volume) dihitung paralel untuk kolom "metode alokasi".

**Kartu proses.** `rate = (wip_open_value + total_cost − kg_kw2 × nrv) / (kg_premium + kg_waste + wip_close_kg × wip_completion_pct)`. Premium, waste, WIP akhir dinilai pada rate. Waste masuk HPP.

**Barang jadi.** Rata-rata tertimbang `(value_open + value_in) / (qty_open + qty_in)`; keluar jual, transfer ke Lain-lain, saldo akhir pada qty Accurate; selisih qty ke HPP. HPP = jual + waste + selisih qty + KW 2 tawar pada NRV.

**Lain-lain.** Bahan: FCC premium × rate FG FCC; KW 2 × NRV. Konversi: porsi pool Lain-lain dibagi A, B per man-hour SKU; C + D per kWh (Ubi putih ACE per jam mesin); E per nilai material eksternal. FG per SKU dalam satuan `fg_unit`.

**Rekon HPP.** `HPP_GL = HPP_kartu + varian_material + Δpersediaan_kartu − Δpersediaan_GL + ΔKW2_NRV − penyesuaian_bagian8 + idle_period`. Sisa ≤ Rp 0,001 jt.

**Flex budget (B4).** Budget statis dari `budget_line`; flex = budget pada volume aktual (variabel × kg aktual, tetap tetap). Varian harga `(P_akt − P_bud) × Q/kg_akt`; pemakaian `(Q/kg_akt − Q/kg_bud) × P_bud`; volume `tetap/kg_bud × (kg_bud − kg_akt)`; metode = sisa pool alokasi aktual vs metode budget. Kolom cek = 0.

**Standar dan rencana (B5).** `kg_input = (forecast + target_fg − fg_open) / premium_pct` ditambah FCC untuk Lain-lain. `qty_i = kg_input × bom_i`; `hours_d = kg_input/1000 × routing_d`. `std_cost = Σ qty × price_week + Σ hours × rate_A + Σ driver × rate_variable + fixed_amount_month × 7/hari_bulan`.

**Aktual minggu.** Material `qty_issue × price_week`; DL `hours_productive(operator, line) × rate_A_std`; OH variabel `driver_act × rate_variable_std`; OH tetap `kg_act × rate_fixed_per_kg`. `under_absorption = fixed_budget_week − fixed_absorbed`.

**Varian minggu.** Yield/pemakaian `(qty_act − kg_act × bom) × price_std`; harga `(price_act − price_std) × qty_act`; efisiensi `(hours_act − kg_act × routing) × rate`; Σ = aktual − standar pada volume aktual (±Rp 1).

**True-up.** Per pool: `gl_pool_month − Σ driver_act_week × rate_std`, dialokasikan dengan driver pool yang sama; harga material: `MA_accurate − Σ qty_week × price_week`; kuantitas: `issue_accurate − Σ material_issue`. Kontrol `Σ cost_week + trueup = process_card_month = GL`.

### 4.6 Kontrol (semua dari WP, dinomori ulang)

| Kode | Kontrol | Toleransi | Status gagal |
| --- | --- | --- | --- |
| B01–B05 | Σ 16 akun GL = LK; 5101-002 = jurnal; semua baris tag punya tujuan; gaji staf = jurnal; alokasi aktual dan pembanding habis | Rp 1 | GAGAL |
| B06–B09 | Kartu proses: kg dipertanggungjawabkan = dibebankan; Rp sama; kg penilaian = kuantitas; dekomposisi varian tertutup | 0,01 kg / Rp 1 | GAGAL |
| B10–B12 | Material kartu baru = kartu lama; kartu lama tersusun ulang = total; BP: COGS = −HPP | Rp 1 | GAGAL |
| B13–B16 | Lain-lain: man-hour dan kWh = driver pool; konversi = pool Lain-lain; Σ SKU = total; semua sheet SKU LULUS | 0,01 / Rp 1 | GAGAL |
| B17–B20 | Rekon: konversi semua kartu = pool − idle; material + varian = GL; HPP rekon = GL; pendapatan = GL | Rp 0,001 jt | GAGAL |
| B21–B22 | FG masuk kartu vs Accurate; transfer vs Accurate | 1% kg | PERIKSA (D4) |
| B23–B30 | Rekon persediaan: subledger vs GL stabil; Σ K1 = saldo WP (WIP/FG, awal/akhir); sisa WIP/FG = 0; Σ Δ = REKON; K6 = 0 | Rp 1.000 | GAGAL |
| B31–B32 | Bridge: Σ bar = Δ margin; komponen = HPP GL; tetap = Σ pool tetap | 1e-6 pp | GAGAL |
| B33 | Rasio pemakaian per kg vs 3 bulan (karton, HDPE, olein) di luar pita | parameter | PERIKSA (D5) |
| B34 | WIP awal > 3× produksi bulan | — | PERIKSA (D3) |
| B35–B38 | Mingguan: Σ varian = aktual − standar; jam operator ke lini ≤ jam dibayar; hari belum dikunci sampai Senin 10:00; bon material bulan vs pengeluaran Accurate | Rp 1 / 1% | GAGAL / BELUM DIISI / PERIKSA |
| B39–B41 | True-up: Σ minggu + true-up = kartu bulan = GL; tarif standar vs aktual > 10% | Rp 0,001 jt / 10% | GAGAL / PERIKSA |
| B42–B45 | Budget: Rp/kg × kg = total; Σ pool budget = BP; mapping akun aktif untuk setiap akun bulan upload; versi standar approved ada untuk minggu | Rp 1 | GAGAL / BELUM DIISI |

Kewajaran (CEK KEWAJARAN) bukan kontrol: status WAJAR/CEK, setiap CEK wajib ada penjelasan sebelum rilis.

### 4.7 Infrastruktur

```
app_setting          key, value jsonb      (flag: b1_ingest … b7_outlook, default false)
rebuild_queue        id, kind (month|week|day), period, reason, status, error
upload               id, kind, period, status (staged|planned|committed|rejected), issues jsonb, sha256
```

---

## 5. Upload (`packages/parsers`)

| Kind | Sumber | Target | Peran | Ritme |
| --- | --- | --- | --- | --- |
| `gl_month` | GL Accurate per akun per voucher (xlsx) | `gl_month` | finance | bulanan |
| `gl_voucher_tag` | CSV tag voucher (reklas, THR, tali asih, ongkir, pisau) | `gl_voucher_tag` | finance | bulanan |
| `payroll_month` | Rekap payroll per kelompok + jurnal | `payroll_month`, `payroll_journal` | finance | bulanan |
| `inventory_valuation` | Rincian Valuasi Persediaan Accurate | `inventory_valuation` | finance | bulanan |
| `sales_by_item` | LK Sales by Item | `sales_by_item` | finance | bulanan |
| `average_price` | Sheet Average Price | `average_price` | finance | bulanan |
| `cogm_card` | Kartu CoGM (FCC/UU/UO, LAP BAG per SKU, Labor, Overhead Allocation, jam mesin) | `cogm_card`, `cogm_material`, `driver_month` | cost_accounting | bulanan |
| `fs_control` | LK IS/BS (9 angka kontrol) | `fs_control` | finance | bulanan |
| `budget_bp` | BP Model Details + Input Operasional | `budget_line`, `budget_pool_map` (draft) | finance | per versi |
| `std_master` | Template master standar (BOM, mix, routing, rate card, kapasitas) | tabel §4.1 sebagai draft `std_version` | ppic, finance | per versi |
| `sales_forecast` | CSV per minggu | `sales_forecast_week` | sales | mingguan |
| `material_price` | CSV per item | `material_price_week` | purchasing | mingguan |
| `plant_daily` | Template xlsx harian 5 sheet (produksi, bon, jam, meter, kupas) | tabel §4.3 | production, warehouse, engineering | harian (Fase 3); form web di Fase 5 |

Semua idempoten (`line_key`), wizard stage → plan → commit, issues per baris. Upload bulanan untuk bulan yang sudah dirilis ditolak kecuali flag `reopen_month` oleh admin.

---

## 6. Halaman

| Rute | View | Isi |
| --- | --- | --- |
| `/m/[month]/input` | preparer | Status upload per kind, tag voucher, payroll split, tombol "Hitung" |
| `/m/[month]/pool` | preparer, management | BIAYA BERSAMA: pool, tetap/variabel, driver, alokasi aktual vs metode budget, idle |
| `/m/[month]/kartu/[product]` | preparer | Kartu proses + barang jadi + HPP, lampiran material, kontrol kartu |
| `/m/[month]/lain-lain` dan `/sku/[code]` | preparer | 21 kelompok, per SKU, FG per bag |
| `/m/[month]/rekon` | preparer, finance | REKON & KONTROL, REKON MATERIAL per item, REKON PERSEDIAAN K1–K6 |
| `/m/[month]/kewajaran` | preparer, management | Tren KPI, Agu vs Sep, penjelasan CEK |
| `/m/[month]/varian` | management | Per komponen vs flex budget: harga, pemakaian, volume, metode |
| `/m/[month]/bridge` | management | Waterfall 17 bar, grup |
| `/m/[month]/tutup-buku` | finance | True-up per pool, gate rilis, rilis snapshot + PDF |
| `/w/[week]/rencana` | ppic, purchasing, management | Forecast → rencana produksi, bahan, jam vs kapasitas, HPP standar, margin rencana |
| `/w/[week]/aktual` | ppic, production, management | Biaya aktual provisional, serapan tetap, status input harian per hari/lini |
| `/w/[week]/varian` | management, pemilik varian | Varian minggu per jenis, pemilik, penjelasan, alert |
| `/hari/[date]` | production, warehouse, engineering | Form harian (Fase 5), status kunci hari, koreksi |
| `/standar` | ppic, finance | Versi standar: draft/approved, diff antar versi, usulan kalibrasi |
| `/outlook/[month]`, `/kas` | management, finance | Adaptasi KGR M4–M6 |
| `/admin/modul` | admin | Flag, rebuild queue, reopen month |

Management view: tanpa istilah tabel, merah hanya untuk negatif, satu angka per sel. Headline: margin GL bulan lalu dan bridge 3 bar terbesar; HPP/kg FCC aktual minggu vs standar; varian minggu terbesar dengan pemilik; hari belum dikunci; outlook bulan berjalan vs BP.

---

## 7. Non-functional

- Semua perhitungan di engine, golden dari fixture WP Sep26_4 dan WP Agu26 (untuk roll-forward dan bridge), rule test per cabang.
- `rebuildMonth` < 10 detik; `rebuildWeek` < 3 detik pada volume saat ini (≈ 60 item material, 21 kelompok Lain-lain, 11 SKU koperasi, ≈ 150 baris input harian).
- RLS untuk setiap tabel; `supabase/tests/rls_roles.sql`.
- Backup `pg_dump` harian via GitHub Actions ke bucket privat.
- PDF rilis bulanan A4 landscape 3 halaman: ringkasan, bridge, kontrol. PDF rencana mingguan 1 halaman untuk pabrik.
- UI Bahasa Indonesia; kode dan kolom Inggris.

---

## 8. Acceptance criteria

| Modul | Lulus bila |
| --- | --- |
| Fase 0 | Repo dan Supabase berdiri; D1–D12 masing-masing punya skrip, kontrol, atau catatan di `docs/open-questions.md`; fixture `fixtures/month-2026-09/` terekstrak dari WP Sep26_4 dengan angka target di bawah; `coa_pool_map` Okt-26 terisi |
| B1 | Upload 9 kind bulanan untuk Sep-26 → semua tabel §4.2 terisi; `fs_control` 9 angka cocok LK; mapping akun aktif untuk semua akun |
| B2 | `pool_month` Sep: total 1.572.766.737,19; A 469.314.556,75; Kupas 53.598.624,96; B 419.567.213,29; C 46.737.260; D 313.485.769,27; E 270.063.312,92; tetap 806.327.113,62. Alokasi FCC 1.287.026.419,50; UU 5.780.271,39; UO 78.965.900,38; Lain-lain 200.994.145,92. FCC: biaya produksi 5.562.568.465,96 (23.478,381/kg); rate 23.928,4692; HPP 5.106.312.148,26; transfer 551.835.128,88. UU HPP 232.706.417,35; UO 252.566.6xx (dari fixture). Lain-lain 870.978.077,67; cem-cem ORI 318.461.224,94; HPP Lain-lain 871.581.725,61. Semua ±Rp 1 |
| B3 | `recon_month` Sep: HPP kartu 6.463,1669 → GL 6.375,4123 dengan pos −121,1482 / −326,5394 / +409,3055 / −25,5969 / −23,7756 / 0; sisa 0. Neraca: 1106-001 826,0313 vs 947,1795 dijelaskan −121,1482; WIP 51,9846 vs 297,8507 dijelaskan −245,8661; FG 14,1713 vs 286,5366 dijelaskan −272,3654. REKON PERSEDIAAN K2 WIP akhir 225.691.966,25. B01–B32 LULUS; B21/B22 PERIKSA dengan angka 221.027 vs 211.979,5 dan 23.115,5 vs 14.058 |
| B4 | Kewajaran Sep: 7 CEK sesuai WP (konversi FCC +26,1%, Grup B +37,2%, D +56,7%, E +59,0%, material lain −35,7%, pool variabel −16,7%) dengan penjelasan terbawa. Bridge Agu→Sep: 19,9219 → 14,5657 pp, 17 bar sesuai `BRIDGE GP` C118:C134 ±0,0001 pp. Varian vs BP v1 Sep terhitung untuk FCC/UU/UO dengan cek per baris = 0 |
| B5 | Versi standar v1 dari rata-rata Jul–Sep approved; minggu contoh (fixture `fixtures/week-2026-10-W2/`, dibuat dari data harian hipotetis yang konsisten dengan Sep) → `plan_week`, `cost_week`, `variance_week` dengan Σ varian = aktual − standar ±Rp 1; HPP standar FCC pada driver Sep = 23.481 ±5/kg; upload `plant_daily` 6 hari → kunci hari → rebuildWeek < 3 detik |
| B6 | True-up Sep (minggu disintesis dari data bulanan): Σ minggu + true-up = `process_card_month` = GL; rilis snapshot + SHA + PDF; kalibrasi menghasilkan draft v2 dengan diff |
| B7 | Outlook Okt vs BP v1 dengan actual MTD + forecast; kas harian per rekening dan 13 minggu; kontrol kas = neraca |
| Semua | `pnpm test`, `typecheck`, `build`, `snapshot:diff` hijau; RLS test hijau; flag off = halaman tidak ada |

Golden bulanan diambil dari sel WP, bukan dari output engine. Kalau angka tidak tereproduksi setelah dua pendekatan: catat selisih, sel Excel, dugaan penyebab di `docs/open-questions.md`, test `todo`, lanjut.

---

## 9. Keputusan terbuka dan default

| # | Keputusan | Default yang dipakai | Di mana diubah |
| --- | --- | --- | --- |
| Q1 | Cakupan | Semua modul B1–B7, berurutan; L1 dulu | PLAN |
| Q2 | Repo | Repo baru `BMG-OS`, skeleton disalin dari KGR (engine/parsers/web), Supabase project terpisah; multi-entitas ditunda ke konsolidasi SAMB | — |
| Q3 | Nilai WP: buku atau manajemen | Manajemen. Accurate tetap kartu lama; K1 menjelaskan selisih; jurnal ke Accurate diputuskan setelah B01–B32 hijau 3 bulan | `app_setting.wp_is_book` |
| Q4 | BP | v1 as-is dibekukan (`budget_version`), D9 dicatat; v2 oleh manusia | `budget_version` |
| Q5 | Harga material mingguan | PI terakhir per item (purchasing); true-up ke MA Accurate bulanan | `material_price_week.source` |
| Q6 | Tarif standar v1 | Rata-rata aktual Jul–Sep (WP Agu26 + Sep26); BP hanya untuk varian budget | `std_version` |
| Q7 | Jam operator Lain-lain | Per kelompok (21), bukan per SKU; koperasi 11 SKU dibagi man-hour kartu | `labour_hours.line` |
| Q8 | Kanal input harian | Template xlsx `plant_daily` (Fase 3); form web (Fase 5) | flag `b5_forms` |
| Q9 | Kapasitas normal | = jam dibayar (identik WP) sampai PPIC mengisi | `capacity.normal_capacity_hours` |
| Q10 | WIP completion | 100% | `product.wip_completion_pct` |
| Q11 | By-product KW 2 | NRV 9.777/kg tetap, kalibrasi bulanan dari Sales by Item | `product.kw2_nrv_per_kg` |
| Q12 | Target stok FG untuk rencana | 1 minggu jual | `assumption.fg_target_days` |
| Q13 | Pita BOM untuk validasi bon | ±15% dari standar | `bom_line.band_*` |
| Q14 | Ambang alert varian minggu | > 2% biaya standar minggu, atau 3 minggu tanda sama | `assumption.variance_alert_pct` |
| Q15 | Hari kunci | H+1 12:00; belum dikunci Senin 10:00 = BELUM DIISI | `assumption.lock_deadline` |
| Q16 | Driver D untuk UU | Estimasi dari rasio kWh, `estimated=true` | `driver_month.estimated` |
| Q17 | Kupas ikut THR/BPJS | 0 | `assumption.kupas_thr_bpjs` |
| Q18 | Konversi CNG | 22,2967 m³/MMBTU | `assumption.cng_m3_per_mmbtu` |
| Q19 | Olein di WIP-022 | Tetap bahan baku di WP; K2 | `inventory_recon.category` |
| Q20 | Minggu dimulai | Senin; bulan dipecah per hari kalender untuk biaya tetap | `assumption.week_start_dow` |

---

## 10. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Engine bulanan tidak mereproduksi WP karena WP punya tautan manual | Fixture diekstrak per sel dengan `scripts/extract_fixtures.py`; selisih dicatat per sel, bukan ditutup |
| Pabrik tidak konsisten mengisi jam per lini | B36 dan status BELUM DIISI terlihat di management view; template harian 1 sheet per peran |
| COA Okt-26 memecah pool sebelum mapping siap | B44 memblok upload GL Okt tanpa mapping; mapping disiapkan Fase 0 dari kolom "akun baru" WP |
| BP v1 salah klasifikasi membuat varian budget menyesatkan | Varian budget per komponen hanya untuk FCC/UU/UO; Lain-lain di level total sampai BP v2 |
| Standar dari aktual 3 bulan mengunci inefisiensi | Kalibrasi menampilkan selisih vs BP; versi standar berikutnya diputuskan manusia |
| Dua sumber HPP (WP vs Accurate) membingungkan management | Label tegas "manajemen" vs "buku"; K1 di rekon; Q3 dicatat di headline |

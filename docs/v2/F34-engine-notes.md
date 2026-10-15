# Fase 3–4 engine: rekon, kontrol, kewajaran, varian, bridge

Branch `v2/f34-engine` (dari `v2/f1b-fs` b28757d). Hanya engine (`packages/engine`), tanpa migrasi, halaman, atau server action. Modul Fase 2 (`pool.ts` … `monthly-costing.ts`) dikerjakan paralel oleh sesi lain; semua angka hulu masuk lewat field input bernama yang menyebut sumbernya.

## Temuan

1. **Semua angka B3 dan B4 PRD v2 §10.1 tereproduksi dari sel WP.** 2.115 sel WP dicek (suite `f3-recon` 1.047, `f4-analysis` 1.068), semuanya dalam toleransi. Tidak ada test `todo`. Entri baru `open-questions.md` §B (B-030 … B-034) mencatat beda PRD vs WP dan celah sumber, bukan angka yang gagal direproduksi.
2. **Sisa rekon HPP bukan nol persis.** HPP GL − HPP rekonsiliasi = Rp 7,21 (WP REKON & KONTROL C46 = 0,0000072 jt). PRD menulis "sisa 0" karena dibulatkan 4 desimal jt. B19 LULUS (toleransi Rp 1.000).
3. **CEK KEWAJARAN bagian 1 memuat 15 KPI, bukan 14** (PRD v2 §4.8 dan §10.1). Baris 6–20: masuk proses, rendemen premium, KW 2, waste, harga singkong kulit, harga singkong daging, singkong per kg, olein per kg, harga olein, CNG per kg, harga CNG, karton per ton, DL per ton, material kartu lama per kg, kartu lama per kg barang baik. Engine memakai 15 (WP benar untuk angka). Status Sep: 8 DI LUAR RENTANG, 7 DALAM RENTANG.
4. **Bagian 2: 6 CEK, sama dengan PRD v2** (konversi FCC +26,1%, Grup B +37,2%, D +56,7%, E +59,0%, material lain −35,7%, pool variabel −16,7%). PRD v1 menulis 7; sheet memuat 6. Keenamnya punya penjelasan di kolom G WP, jadi tidak ada CEK tanpa penjelasan.
5. **`kpi_series` Jan–Sep = tabel PRD v2 §1.** 54 angka (6 KPI × 9 bulan, dibulatkan seperti tabel) dan 6 status Sep cocok.
6. **Varian per komponen di WP tidak memuat ongkos kirim singkong.** Total Rp/kg aktual varian FCC = 23.301,54 (FCC!F133), bukan biaya produksi 23.478,38/kg; selisih 176,84/kg = ongkir (FCC!F43). Engine mengikuti WP.
7. **Varian vs BP v1 Sep tertutup.** Cek per baris ≤ 1e-12 Rp/kg untuk FCC, UU, UO. B42 dan B43 LULUS. Budget per kg FCC dari komponen = 24.169,86 = "COGM per KG" BP (baris 511), bukti pemetaan kode driver lengkap. FCC: aktual 23.301,54 vs BP 24.169,86 → −868,32/kg (harga +382,12; pemakaian −1.154,45; volume +602,13; metode −698,12).
8. **Sheet BUDGET WP Sep26_4 kosong** ("dikosongkan sementara"). Golden varian memakai budget kosong, sama seperti WP (FCC/UU/UO bagian 4 dan RINGKASAN bagian 2: semua selisih = aktual). Run BP v1 adalah keluaran tambahan yang diuji dengan cek = 0, B42, B43.
9. **Bridge 17 bar cocok sampai < 1e-9 pp** (19,9219 → 14,5657). Gabungan b2 + b12 untuk direksi = +0,1458 pp (WP B163). Input bridge bulan berjalan bisa dirakit dari keluaran Fase 2/3 (`bridgeMonthInputs`), dan hasilnya sama dengan kolom D BRIDGE GP untuk 71 kode.
10. **B33: karton PERIKSA.** Karton per kg masuk proses Sep −98,3% vs rata-rata Jun–Agu; olein −2,9% (LULUS); HDPE BELUM_DIISI (riwayat kartu lama tidak memuat HDPE, data kartu per item baru ada mulai Sep). B-006 (WP Jul tidak ada) tidak menghalangi B33 untuk karton dan olein karena riwayat kartu lama Jan–Sep memuat Jul.
11. **B21/B22 bukan bagian modul ini.** PLAN v1 menaruhnya di Fase 2 (kartu barang jadi). Target angkanya sudah ada di `prd_targets.json` (FCC!B87, C206, B91, C207).

## Peta modul

| File | Fungsi | Sheet WP |
| --- | --- | --- |
| `src/mart-row.ts` | `ruleId`, `trace`, `traceInputs`, `ControlMonthRow` | — (kolom jejak data mart PRD v2 §5.4) |
| `src/recon.ts` | `reconHpp` | REKON & KONTROL bagian 2–5 (varian material per lini/akun, waterfall HPP, KW 2, B17–B20) |
| | `reconMaterialByItem` | REKON MATERIAL bagian 1–3 |
| | `reconInventoryByItem`, `classifyInventoryItem`, `ivMovement` | REKON PERSEDIAAN bagian 1–4 (K1–K6, B23–B30) |
| | `summaryControls` | RINGKASAN bagian 5 (9 baris WP vs GL vs LK) |
| | `reconMonth`, `reconMonthRows`, `inventoryReconRows` | orkestrasi + baris `recon_month`, `inventory_recon` |
| `src/reasonableness.ts` | `trendKpis`, `TREND_KPIS` | CEK KEWAJARAN bagian 1 |
| | `kpiSeries` | `kpi_series` (bagian 1 untuk setiap bulan) |
| | `monthOverMonth`, `momValues`, `MOM_KPIS` | CEK KEWAJARAN bagian 2 |
| | `reasonablenessRows` | baris `reasonableness` |
| | `usageRatioControl`, `usageMonthsFromHistory` | B33 |
| `src/variance.ts` | `productVariance`, `othersVariance` | FCC/UU/UO bagian 4, RINGKASAN bagian 2 |
| | `budgetFromBp`, `BP_V1_MAP`, `BP_V1_SHARED`, `budgetLineIndex` | BUDGET (struktur), BP v1 `budget_line` + `budget_pool_map` |
| | `varianceMonth`, `varianceRows` | B42, B43, baris `variance_month` |
| `src/bridge.ts` | `bridgeComponents`, `computeBridge` | BRIDGE GP bagian 2–4 (B31, B32) |
| | `bridgeMonthInputs` | BRIDGE GP bagian 1 kolom D dari keluaran Fase 2/3 |
| | `bridgeDisplayBars`, `bridgeWaterfallWp`, `bridgeMonthRows` | PRD v2 §4.8 (b2 + b12), BRIDGE GP bagian 5, baris `bridge_month` |
| `src/wp-f34.ts` | `reconInputsFromWp`, `kpiHistoryFromWp`, `momSourceFromWp`, `varianceActualFromWp`, `bridgeCurrentFromWp`, … | adapter sel WP → input (golden dan snapshot saja) |
| `src/golden-f34.ts` | `runF34`, `f3Targets`, `f4Targets`, `F34_SUITES`, `f3Snapshot`, `f4Snapshot` | suite golden dan key snapshot `f3.recon`, `f4.analysis` (Node) |

`index.ts` mengekspor `mart-row`, `recon`, `reasonableness`, `variance`, `bridge` (murni). `wp-f34.ts` dan `golden-f34.ts` tidak diekspor (khusus tes/skrip).

## Antarmuka input

Satuan: Rp penuh untuk uang (WP menampilkan Rp juta), kg, kecuali `BridgeMonthInputs` (Rp juta dan kg, satuan WP; rasio sehingga satuan saling meniadakan). Semua angka `Num` (Decimal | string | number), dihitung dengan decimal.js.

### `ReconInputs` (recon.ts)

| Field | Sumber produksi | Sel WP Sep-26 |
| --- | --- | --- |
| `hpp.hppCard[FCC,UU,UO,LAIN]` | `fg_month.cogs_total` per produk; Σ `others_month.cogs` | FCC!E104, UU!E98, UO!E94, LAIN-LAIN!G93 |
| `hpp.revenue[…]` | `fg_month` / `sales_by_item` per produk; Lain-lain = Sales by Item non-FCC/UU/UO | FCC!C211, UU!C207, UO!C203, REKON & KONTROL!C74 |
| `hpp.materialExternal[…]` | `process_card_month.material` total (FCC termasuk ongkir); `others_month` material eksternal | FCC!E56, UU!G218, UO!G214, LAIN-LAIN!D68 |
| `hpp.conversion[…].kupas/directLabour/overhead` | `allocation_month` pool KUPAS, A, B–E per lini | FCC!E58/E59/E64, UU!E58/E59/E64, UO!E54/E55/E60, LAIN-LAIN!E68/F68 |
| `hpp.materialCard[FCC,UU,UO,LAIN_SINGKONG,LAIN_UBI_UNGU,LAIN_UBI_ORANGE]` | driver E "nilai material" per lini (`allocation_month` driver / `process_card_month`); Lain-lain per `others_group.main_line` (singkong + maklon → SINGKONG) | BIAYA BERSAMA!C94:E94, LAIN-LAIN!B22:G42 |
| `hpp.glMaterialUsage` | `fs_control.material_usage` | REKON & KONTROL!B29 |
| `hpp.inventory[…].wipOpen/wipClose/fgOpen/fgClose` | `process_card_month` (nilai WIP awal/akhir), `fg_month.value_open/close`, Σ `others_month` FG awal/akhir | FCC!E72/E79/E86/E92, UU!E70/E77/E84/E89, UO!E66/E73/E80/E85, LAIN-LAIN!E93/F93 |
| `hpp.glInventoryMovement.wip/fg` | Σ `gl_month.net` akun 1106-002 / 1106-003 (atau kunci `fs_control` baru, lihat bawah) | REKON & KONTROL!C75, C76 |
| `hpp.kw2.kgProduced/kgToOthers/kgSold/nrvPerKg` | `process_card_month` FCC kg_kw2; Σ `others_month.kw2_in_kg`; `fg_month` FCC KW 2 tawar terjual; `product.kw2_nrv_per_kg` | FCC!B33, LAIN-LAIN!E43, FCC!C208, FCC!C209 |
| `hpp.section8.toPools/toThr/toMaterial` | Σ `gl_voucher_tag.amount` per `target_pool` (A–E, THR, MATERIAL) | BIAYA BERSAMA!C157, C158, C159 |
| `hpp.pool.total/idlePeriodCharge` | Σ `pool_month.total`; `pool.ts idleCapacity().periodCharge` | BIAYA BERSAMA!C87, C111 |
| `hpp.glRevenue` | Σ `gl_month` 4101-007 | REKON & KONTROL!C73 |
| `hpp.hppGl` | `fs_control.cogs` | REKON & KONTROL!C45 |
| `material.items[]` (nama, kode, satuan, `qtyCard`, `cardByLine`, `accOpen`, `accIn`, `accClose \| null`) | kartu: `process_card_month.material` per item + `others_month` material per item (dipetakan ke `material_item.name`); Accurate: `inventory_valuation` 1106-001 (`value_open`, `value_in`, `value_close`; tidak ada baris → `null`) | REKON MATERIAL!A7:K60 |
| `material.gl.open/receipts/usage` | GL 1106-001: saldo awal, sumber Penerimaan Barang, Penyesuaian Persediaan neto | REKON MATERIAL!C67:C69 |
| `material.lkPlHpp.open/receipts/usage/close` | LK sheet PL HPP (saldo bahan baku awal, penerimaan, pemakaian, akhir) | REKON MATERIAL!E67:E70 |
| `inventory.items[]` (kode, nama, akun, qty/nilai awal/akhir, `movement`, `materialCategory`, `categoryOverride`, `oldCardRatePerKg`) | `inventory_valuation` 1106-002/003; `movement = ivMovement(row)` (qty_in, qty_out_sale, qty_out_transfer ≠ 0); `material_item.category` dari nama; override reviewer; Rp/kg kartu lama per produk (riwayat kartu lama) | REKON PERSEDIAAN!A55:R135 |
| `inventory.wpItems[]` (kode, qty/nilai awal/akhir) | `process_card_month` (WIP produk), `fg_month` (FG-001/101/102), `others_month` per SKU (`sku.code`) | REKON PERSEDIAAN!J:M (baris bertautan ke sheet produk/SKU) |
| `inventory.tolerance`, `inventory.oldCardLimit` | parameter (Rp 1.000; 0,02) | REKON PERSEDIAAN!E29, E41 |
| `glConversion` | Σ `gl_month` 16 akun konversi (kontrol B01) | BIAYA BERSAMA!C23 |
| `lk.*` (9 angka) | `fs_control` (9 kunci Fase 1) | RINGKASAN!B58:B66 |

Yang belum punya tempat di tabel B1 (WP mengetiknya sebagai sel biru): GL 1106-001 penerimaan dan pemakaian, LK PL HPP (4 angka), mutasi GL 1106-002/003, pendapatan GL 4101-007. Dua jalan: (a) upload GL memuat akun 4101-007, 1106-001/002/003 dengan jenis sumber voucher; (b) kunci `fs_control` baru (`gl_revenue_4101_007`, `gl_1106_001_receipts`, `gl_1106_001_usage`, `gl_1106_002_movement`, `gl_1106_003_movement`, `pl_hpp_open`, `pl_hpp_receipts`, `pl_hpp_usage`, `pl_hpp_close`). Usulan: (b), karena sama dengan cara WP sekarang dan tidak bergantung pada format voucher Accurate. Check constraint `fs_control.key` perlu diperluas lewat migrasi baru (Dika, Fase ≥ 2).

Master yang perlu ditambah untuk lingkup K1: kode item WIP per produk (`product.wip_item_code`: FCC WIP-067, UU WIP-139, UO WIP-138). FG sudah ada (`product.fg_item_code`, `sku.code`).

### Riwayat kartu lama: `KpiHistoryMonth[]` (reasonableness.ts) — keputusan

16 angka per bulan dari kartu lama FCC (CEK KEWAJARAN bagian 3, baris 42–57): `inputKg`, `kw2Kg`, `wasteKg`, `premiumKg`, `cassavaPeelKg`, `cassavaPeelRp`, `cassavaFleshKg`, `cassavaFleshRp`, `oleinKg`, `oleinRp`, `cngM3`, `cngRp`, `cartonPcs`, `dlHours`, `oldCardMaterialRp`, `oldCardCostAddedRp`; opsional `hdpeKg` (B33).

Keputusan: satu tabel input baru **`history_cost_line`** (pasangan `history_fs_line` PRD v2 §5.2): `month, kind, product, key, value, unit, source_ref, upload_id` dengan `kind`:

- `old_card_fcc` — 16 angka di atas, Jan–Agu 2026 diunggah sekali dari CEK KEWAJARAN bagian 3 WP Sep26_4 (format upload = blok itu: baris = 16 pos, kolom = bulan; parser mengubah ke panjang). Mulai Sep-26 diunggah bulanan dari file kartu lama (CoGM R1, sheet FCCmm26) bersama upload kartu, sampai parser kartu lama asli ada (B-011).
- `mom_prior` — 13 angka bagian 2 bulan sebelum platform (Agu-26, CEK KEWAJARAN B25:B37). Mulai Okt-26 diambil otomatis dari `momValues` keluaran Fase 2 bulan sebelumnya.
- `bridge_prior` — 71 input BRIDGE GP bulan sebelum platform (Agu-26 = `fixtures/month-2026-08/bridge_input.json`). Mulai Okt-26 dirakit otomatis dengan `bridgeMonthInputs` dari data mart bulan sebelumnya.

Kenapa tidak dari tabel B1 yang ada: `cogm_card` / `cogm_material` / `driver_month` bisa memberi 14 dari 16 angka mulai Sep (kg masuk proses, premium, KW 2, waste dari `cogm_card` baris FCC; singkong/olein/CNG/karton dari `cogm_material` FCC per kategori `material_item`; jam DL dari `driver_month` FCC `man_hour`), tetapi total kartu lama (`oldCardMaterialRp` "B.1 Material Cost", `oldCardCostAddedRp` "Current Cost Added") tidak ada di B1, dan Jan–Agu tidak pernah diunggah. Satu tabel riwayat menutup keduanya; untuk Sep-26 ke depan bisa ditambah kontrol silang (riwayat vs `process_card_month`).

### `MomSourceInputs` (reasonableness.ts)

| Field | Sumber | Sel Sep-26 |
| --- | --- | --- |
| `fccInputKg`, `fccProductionCost`, `fccMaterial`, `fccConversion`, `fccOtherMaterial` | `process_card_month` FCC | FCC!B30, E66, E56, E65, E55 |
| `fccPoolB`, `fccPoolD`, `fccPoolE` | `allocation_month` B, D, E → FCC | FCC!E60, E62, E63 |
| `uuInputKg`, `uuProductionCost`, `uoInputKg`, `uoProductionCost` | `process_card_month` UU, UO | UU!B32, E66; UO!B28, E62 |
| `othersOutputKg`, `othersProductionCost` | Σ `others_month` | LAIN-LAIN!C43, G68 |
| `poolFixed`, `poolVariable`, `poolA`, `manHours` | `pool_month`; `driver_month` man_hour | BIAYA BERSAMA!D87, E87, C81, G91 |

Bulan sebelumnya: `momValues` atas keluaran bulan sebelumnya (atau `history_cost_line.mom_prior`). Penjelasan per KPI: `reasonableness.explanation` (bulan golden: CEK KEWAJARAN G25:G37).

### `VarianceMonthInputs` (variance.ts)

| Field | Sumber | Sel Sep-26 |
| --- | --- | --- |
| `actual[p].kgInput` | `process_card_month.kg_input` | FCC!B30, UU!B32, UO!B28 |
| `actual[p].materials[]` (`component`, `qty`, `price`, `value`) | `process_card_month.material` per komponen; upah kupas: kg dikupas (`driver_month kg_peeled`), Rp/kg, alokasi KUPAS | FCC!B41:E58, UU!B43:E58, UO!B39:E54 |
| `actual[p].pools[]` (`allocated`, `budgetMethodAllocated`) | `allocation_month` method `actual` dan `budget_compare` | FCC!E59:E63 dan BIAYA BERSAMA!C125:C130 (UU kolom D, UO kolom E) |
| `budget` | `budgetFromBp(budget_line bulan itu, budget_pool_map, month, versi, poolFixedShare)` | BP v1 "Business Plan - Model Details" (kode driver di `BP_V1_MAP`) |
| `poolFixedShare` | `pool_month.fixed ÷ total` bulan itu (bila `budget_pool_map.fixed_pct` kosong) | BIAYA BERSAMA!D81:D86 ÷ C81:C86 |
| `others.actualKg`, `others.actualCost` | Σ `others_month` | LAIN-LAIN!C43, G68 |

### `BridgeInputs` (bridge.ts)

`prior` dan `current` bertipe `BridgeMonthInputs` (71 kode WP: `REV_T … B8_PIS`, doc comment per kode). Bulan berjalan dirakit dengan `bridgeMonthInputs(BridgeSources)`:

| `BridgeSources` | Sumber |
| --- | --- |
| `revenue[FCC,UU,UO,LAIN]` | `fg_month` / `sales_by_item` (sama dengan `ReconHppInputs.revenue`) |
| `qtySold.FCC/UU/UO` | `fg_month.qty_sold` (FCC: premium IFM + KW 2 tawar) |
| `kgProduced[…]` | `process_card_month.kg_input`; Σ `others_month.kg_out` |
| `materialExternal[…]` | sama dengan `ReconHppInputs.materialExternal` |
| `fccMaterial.cassava/ongkir/olein/cng/other` | `process_card_month` FCC per komponen |
| `pools[A,KUPAS,B,C,D,E].total/fixed/allocated[…]` | `pool_month` (total, fixed), `allocation_month` method actual |
| `hppCard`, `hppGl`, `reconSteps.*` | `ReconHppResult` (hppCardTotal, hppGl, steps C38:C43) |
| `oleinHeldDelta` | `ReconInventoryResult.table.k2.wipDelta` (REKON PERSEDIAAN E17) |
| `section8ByTag.*` | Σ `gl_voucher_tag` per tag (reklas_opex, thr_swap, tali_asih_cutoff, ongkir_singkong, pisau_urschel) |

`lk.revenue/cogs` = `fs_control.revenue_4101_007` dan `fs_control.cogs` (B31); `glRevenue` = GL 4101-007 (cek pendapatan).

### `UsageMonth[]` (B33)

`month, inputKg, carton, hdpe, olein` (qty kartu FCC). Karton dan olein dari riwayat kartu lama (`usageMonthsFromHistory`); HDPE dari `cogm_material` FCC kategori `hdpe` (Σ 0,03 + 0,05 + 0,07) mulai Sep-26, lengkap 3 bulan pada Des-26.

## Bentuk baris data mart (untuk penulis migrasi)

Semua baris membawa `rule_id text` (`<modul>.<fungsi>@v<n>`), `inputs jsonb` (`{ nama: { value: "desimal", ref: "Sheet!Sel" | "tabel:id" | null } }`), `source_ref text` (sel padanan di template WP; untuk bulan golden = sel yang diuji). Uang `numeric(18,2)`, Rp/kg dan pp `numeric(18,4)` — **kecuali** pp bridge dan rasio kewajaran yang perlu ±0,0001: simpan `numeric(18,8)`. Kolom bertanda *baru* adalah usulan tambahan terhadap PRD v1 §4.4 (`add column if not exists`).

**`recon_month`** — 32 baris per bulan: `summary.<key>` (9: revenue, material_usage, conversion, cogs, gross_profit, inv_1106_001, inv_1106_002, inv_1106_003, inv_wip_fg_delta), `hpp.<step>` (10: hpp_card … residual), `material_variance.<FCC|UU|UO|LAIN_SINGKONG|LAIN_UBI_UNGU|LAIN_UBI_ORANGE|5101-301|5101-302|5101-303>` (9), `kw2.<in|to_others|sold|increase>` (4).

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| month, line_key, wp_amount, gl_amount, explained, residual, status | PRD v1 | `explained jsonb = { total, items: [{key,label,amount,source_ref}] }`; status LULUS/GAGAL, null untuk baris non-kontrol |
| label | text *baru* | Bahasa Indonesia, tanpa nama tabel |
| lk_amount, difference, gl_lk_diff | numeric(18,2) *baru* | RINGKASAN kolom D, E, H |
| qty | numeric(14,3) *baru* | kg arus KW 2 |
| rule_id, inputs, source_ref | v2 §5.4 | |

**`inventory_recon`** — satu baris per item: 1106-001 (REKON MATERIAL, `category = 'BB'`, 55 baris termasuk pembulatan) dan 1106-002/003 (REKON PERSEDIAAN, 81 baris).

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| month, item_code, account, category, qty_wp, value_wp, qty_acc, value_acc, diff | PRD v1 | `category` K1..K6 atau `BB` (*nilai baru*); `diff = value_wp − value_acc` (akhir); BB: saldo akhir implisit kartu − Accurate = pemakaian Accurate − kartu |
| item_name | text *baru* | |
| qty_wp_open, value_wp_open, qty_acc_open, value_acc_open, diff_open, diff_delta | numeric *baru* | kolom J, K, E, F; K − F; O |
| rate_acc, rate_wp, rate_old_card, old_card_ratio | numeric(18,4)/(18,8) *baru* | kolom P, Q, R, S |
| qty_diff_value, qty_diff_value_open | numeric(18,2) *baru* | kolom U, V |
| movement | boolean *baru* | kolom I |
| value_in, usage_card, usage_card_by_line jsonb, usage_acc, close_implied | *baru* (BB saja) | REKON MATERIAL J, H, D:G, L, K implisit |
| category_override_by/at, category_note | *baru* | perubahan reviewer (PLAN Fase 3: klasifikasi bisa diubah dengan audit) |

**`variance_month`** — per produk FCC/UU/UO: baris komponen, grup, total (FCC 24, UU 23, UO 23) + 1 baris `LAIN` total; dua basis per bulan bila diinginkan (budget kosong WP dan BP v1) dibedakan `budget_version`.

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| month, product, component, actual_per_kg, budget_per_kg, price, usage, volume, method, check | PRD v1 | `product` + `LAIN`; `component` = kode komponen, kode grup (`raw_materials` …) atau `total`; price/usage/volume/method/check null untuk LAIN |
| level ('item'\|'group'\|'total'), group, label | *baru* | |
| budget_version | text *baru* | `budget_version.name`; null = tanpa budget |
| qty_per_kg_act, qty_per_kg_bud, price_act, price_bud | numeric(18,8)/(18,4) *baru* | kolom B–E |
| diff | numeric(18,4) *baru* | kolom H |
| kg_act, kg_bud, actual_amount, budget_amount | *baru* | Lain-lain level total |

**`bridge_month`** — 53 baris per bulan: `view = 'bar'` (start, b1–b17, end), `'group'` (6), `'display'` (start, 16 bar dengan b2_b12, end), `'wp_waterfall'` (start, 8, end).

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| month, bar_code, label, pp, group | PRD v1 | pp `numeric(18,8)` |
| compare_month, view, sort_order, components text[] | *baru* | `components` = kode bar yang digabung (tooltip) |

**`reasonableness`** — 28 baris per bulan: `part = 'trend'` (15 KPI bagian 1) dan `'mom'` (13 KPI bagian 2).

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| month, kpi, value, min_8m, max_8m, delta_pct, status, explanation | PRD v1 | status diperluas: `DALAM_RENTANG`, `DI_LUAR_RENTANG` (bagian 1), `WAJAR`, `CEK` (bagian 2) |
| part, label, unit, compare_value, threshold, explanation_required | *baru* | `compare_value` = bulan lalu; `explanation_required` = status CEK |

**`kpi_series`** — 15 KPI × setiap bulan riwayat (Jan–Sep 2026: 135 baris): `month, product ('FCC'), kpi_code, value, min_8m, max_8m, status, note, source_ref` (PRD v2 §5.4) + `label`, `unit`, `rule_id`, `inputs`. `min_8m/max_8m/status` hanya terisi bila 8 bulan sebelumnya lengkap (Sep-26 saja untuk riwayat sekarang).

**`control_month`** — kolom PRD v1 + `rule_id`, `inputs`, `source_ref`. Kode baru dari modul ini: B17, B18, B19, B20 (recon), B23–B30 (persediaan), B31, B32 (bridge), B33 (rasio pemakaian), B42, B43 (budget).

## Kontrol

| Kode | Isi | Sel WP | Toleransi | Sep-26 |
| --- | --- | --- | --- | --- |
| B17 | Konversi semua kartu = pool − jam menganggur periode | REKON & KONTROL C59 | Rp 1.000 | LULUS |
| B18 | Material kartu − ongkir + varian = pemakaian GL | C60 | Rp 1.000 | LULUS |
| B19 | Sisa rekon HPP | C61 | Rp 1.000 | LULUS (Rp 7,21) |
| B20 | Pendapatan per produk = GL | C63 | Rp 1.000 | LULUS |
| B23 | Beda subledger vs GL stabil (WIP C30, FG C31) | REKON PERSEDIAAN C30:C31 | Rp 1.000 | LULUS (10,69; 3,97) |
| B24–B27 | Σ nilai WP item K1 = saldo WP (WIP akhir, FG akhir, WIP awal, FG awal) | C32, C33, C34, C35 | Rp 1.000 | LULUS |
| B28 | Sisa WIP dan FG akhir = 0 | C36:C37 | Rp 1.000 | LULUS |
| B29 | Σ Δ (WP − GL) = selisih kenaikan persediaan rekon HPP | C38 | Rp 1.000 | LULUS |
| B30 | Item K6 / akun tak dikenal bersaldo | C39 | 0 item | LULUS |
| B31 | Σ bar = Δ margin (+ margin Agu, margin Sep = LK) | BRIDGE GP C153 (C151, C152) | 1e-6 pp | LULUS |
| B32 | Komponen = HPP GL (Agu, Sep); tetap = Σ pool tetap; pendapatan = GL | C155 (C154, C156, C157) | Rp 0,001 jt | LULUS |
| B33 | Rasio pemakaian karton/HDPE/olein vs rata-rata 3 bulan, ±15% | — | parameter | PERIKSA (karton) |
| B42 | Σ komponen budget (Rp/kg × kg) = biaya produksi BP per produk | — | Rp 1 | LULUS (BP v1); BELUM_DIISI tanpa budget |
| B43 | Σ pool budget FCC/UU/UO/Lain-lain = pool BP bagian 4.3 | — | Rp 1 | LULUS (BP v1) |

Pemetaan B23–B30 ke cek bagian 2 REKON PERSEDIAAN adalah keputusan sesi ini (PRD v1 hanya menyebut daftar frasa); lihat `open-questions.md` §C F34-03. Cek lembar tanpa kode B (REKON MATERIAL C75:C87, REKON & KONTROL C62, uji kartu lama C41, cek BRIDGE GP) dikembalikan sebagai `checks` dengan `source_ref`.

## Hasil golden (fixture `month-2026-09`)

`pnpm test:golden -- --fixture month-2026-09 --phase f34` → laporan `docs/v1/golden-f34.md` (script menulis ke `docs/v1`).

| Suite | Sel WP | Lulus | Isi |
| --- | ---: | ---: | --- |
| `prd-targets` (F0) | 50 | 50 | integritas fixture |
| `f3-recon` | 1.047 | 1.047 | REKON & KONTROL B28:D33, C37:C47, C52:D55, C59:C63; RINGKASAN B29:B35, B40:H49; REKON MATERIAL H/K/L/M/N per item, baris 62, C70, F68:F70, C75:C87; REKON PERSEDIAAN C7:H24, E25, C30:C41, N/O/P/Q/S/U/V per item, H58 |
| `f4-analysis` | 1.068 | 1.068 | CEK KEWAJARAN B6:L20 (via `kpi_series`), C25:D37; FCC F110:M133 + B:E, UU F104:M126, UO F100:M122; RINGKASAN B16:H18; BRIDGE GP C81:D107, C111:C115, C117:C135, C138:C144, C151:C157, B161:B170, G161:G170, D7:D77 (dirakit) |

Angka acceptance PRD v2 §10.1:

| Target | Engine | Sel WP |
| --- | --- | --- |
| HPP kartu → GL 6.463,1669 → 6.375,4123 | 6.463,16689379 → 6.375,41230437 | REKON & KONTROL C37, C45 |
| Pos −121,1482 / −326,5394 / +409,3055 / −25,5969 / −23,7756 / 0 | sama (selisih < 1e-12 jt) | C38:C43 |
| Sisa 0 | 0,0000072 jt (Rp 7,21) | C46 |
| 1106-001 826,0313 vs 947,1795 (−121,1482) | sama | RINGKASAN B46, C46, F46 |
| WIP 51,9846 vs 297,8507 (−245,8661) | sama | B47, C47, F47 |
| FG 14,1713 vs 286,5366 (−272,3654) | sama | B48, C48, F48 |
| K2 WIP akhir 225.691.966,25 | 225.691.966,25 | REKON PERSEDIAAN H58 (D17) |
| B17–B20, B23–B30 LULUS | LULUS | REKON & KONTROL D59:D63, REKON PERSEDIAAN D30:D39 |
| Kewajaran: KPI bagian 1 dengan status dan catatan WP | 15 KPI, status dan catatan = kolom M, N | CEK KEWAJARAN M6:N20 |
| Bagian 2: 6 CEK dengan penjelasan | 6 CEK, penjelasan = kolom G | F25:G37 |
| Bridge 19,9219 → 14,5657, 17 bar ±0,0001 | selisih < 1e-9 pp | BRIDGE GP C117:C135 |
| `kpi_series` Jan–Sep = tabel §1 | 135 baris; 54 angka tabel §1 + 6 status cocok | CEK KEWAJARAN B6:J20 |
| Varian vs BP v1 Sep FCC/UU/UO, cek = 0 | cek ≤ 1e-12 Rp/kg; B42, B43 LULUS | — (BUDGET WP kosong) |

Todo: tidak ada.

## Keputusan

Dicatat juga di `docs/open-questions.md` §C (F34-01 … F34-12).

1. **Riwayat kartu lama** lewat tabel baru `history_cost_line` (lihat atas).
2. **Jendela tren** = 8 bulan tepat sebelum bulan itu; rentang dan status hanya bila 8 bulan lengkap. Batas inklusif (WP: `AND(J>=K, J<=L)`).
3. **B23–B30** dipetakan ke cek REKON PERSEDIAAN bagian 2 seperti tabel Kontrol; dua kontrol berpasangan (B23 WIP+FG, B28 WIP+FG) memakai nilai terburuk.
4. **Kategori K1–K6 bawaan**: dalam lingkup WP → K1; akun bukan 1106-002/003 → K6; WIP dengan kategori material `olein` → K2, WIP lain → K3; FG tanpa mutasi jual/produksi/transfer → K4, dengan mutasi → K5; override reviewer menang. Aturan ini mereproduksi kolom D WP untuk 81 item.
5. **Flex budget pool konversi**: bagian tetap = `budget_pool_map.fixed_pct` bila diisi, kalau kosong (draft v1 semua kosong) = porsi tetap pool aktual bulan itu (`pool_month.fixed ÷ total`). Dengan porsi tetap 1 rumusnya identik dengan WP. Material selalu variabel.
6. **Grup A/B BP diselaraskan** seperti BUDGET baris 87–88 WP: A = (biaya DL bulanan × 13/12 + BPJS DL) × porsi driver C produk; B = (biaya support × 13/12 + staf + indirect labour + BPJS IDL) × porsi. A + B per produk = baris BP produk (cek WP baris 89). B43 diuji di level total pool karena A dan B masing-masing tidak sama dengan baris 4.3.
7. **B43 memakai `budget_pool_map` baris bagian 4.3** (kode diawali `4.3_`); baris 4.1 adalah rincian akun dari total yang sama dan tidak dijumlah.
8. **Lain-lain varian level total**: aktual Σ `others_month` vs BP "Total Cost of Manufacturing" dan "Volume Premium" (BP v1 Sep: volume 0 → budget per kg 0).
9. **Ongkir singkong tidak ada di varian komponen** (mengikuti WP; lihat Temuan 6).
10. **Tampilan direksi bridge**: 17 bar dengan b2 + b12 digabung di posisi b2 (16 bar + 2 margin); waterfall WP bagian 5 (8 grup) disediakan terpisah untuk layar Penyusun.
11. **`source_ref`** selalu alamat sel padanan di template WP Sep26_4 (juga untuk bulan non-golden: menunjukkan "sel WP yang setara"); `inputs.<nama>.ref` membawa sumber operand.
12. **B33** = rasio per kg masuk proses vs rata-rata 3 bulan sebelumnya, pita ±15% (`assumption.bom_band_pct`, Q13); item tanpa 3 bulan data → BELUM_DIISI; kontrol PERIKSA bila ada item di luar pita.

## Integrasi dengan Fase 2

- File bersama yang juga diubah sesi Fase 2: `packages/engine/src/index.ts` (baris export), `golden-suites.ts` (`...F34_SUITES`), `snapshot-modules.ts` (key `f3.recon`, `f4.analysis`), `tests/snapshots/month-2026-09.json`. Konflik merge diselesaikan dengan menggabungkan baris lalu `pnpm snapshot:update` (key lama tidak boleh berubah).
- `rebuildMonth` merakit input modul ini dari keluaran `computeMonth` mengikuti tabel antarmuka di atas. Yang perlu disediakan Fase 2 secara eksplisit: material per item per lini (`process_card_month.material`, `others_month`), nilai WIP/FG per kode item (lingkup K1), alokasi metode budget (`allocation_month.method = 'budget_compare'`), `idleCapacity().periodCharge`.
- `mart-row.ts` (`rule_id`, `inputs`, `source_ref`) bisa dipakai juga oleh data mart Fase 2.

## Verifikasi

```
pnpm typecheck && pnpm test                         # engine 88 tes, parsers 30, web 5
pnpm test:golden -- --fixture month-2026-09         # prd-targets 50/50, f3-recon 1047/1047, f4-analysis 1068/1068
pnpm snapshot:diff                                  # EMPTY
python3 -I scripts/extract_fixtures.py --check      # fixtures match
```

Catatan: tanpa `--phase`, `test:golden` menulis ulang `docs/v1/golden-f0.md` dengan suite F3/F4 ikut tercantum; laporan fase ini dibuat dengan `--phase f34`.

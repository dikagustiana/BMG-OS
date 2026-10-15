# Plan v1 — eksekusi PRD BMG Platform

Pasangan dari `docs/PRD-v1-bmg-platform.md`. Setiap fase = satu branch, satu PR, satu set migrasi, satu entri CHANGELOG, satu bukti di `docs/v1/README.md`.

Gate antar fase: fase berikutnya dikerjakan di atas branch fase sebelumnya (stacked) **tanpa menunggu merge**, tetapi satu sesi Claude Code hanya mengerjakan **satu fase**. Manusia me-review dan merge sebelum sesi fase berikutnya dimulai; kalau belum merge, sesi berikutnya rebase ke branch sebelumnya. Ini menghindari dua masalah di KGR v3: rebase berantai 11 PR dan kehabisan konteks di tengah fase.

---

## 0. Aturan main

**Repo (baru, `dikagustiana/BMG-OS`)**
- Repo kosong dibuat Dika. Skeleton disalin di awal sesi Fase 0 dari clone **baca-saja** `KGR-Weekly-Outlook` di folder sementara (tidak ada commit/push/PR ke KGR; `git remote -v` dicek sebelum setiap push; riwayat git KGR tidak ikut): salin skeleton KGR (`packages/engine` tanpa modul domain, `packages/parsers` tanpa parser domain, `apps/web` dengan auth, upload wizard, roles, modules, BarChart, pdf), `supabase/` kosong, `scripts/`, `.github/workflows`. Tidak menyalin fixture, migrasi, atau engine KGR.
- Branch dari `main`: `v1/f0-foundation`, `v1/f1-ingest`, `v1/f2-costing`, `v1/f3-recon`, `v1/f4-variance`, `v1/f5-weekly`, `v1/f6-closing`, `v1/f7-outlook`.
- Migrasi `supabase/migrations/2026MMDDhhmmss_*.sql`, satu file per topik, idempoten, tidak mengubah file yang sudah diterapkan.
- Engine: setiap modul file sendiri, tipe sendiri, golden test dari fixture, rule test per cabang, decimal.js lewat `decimal.ts`. Tidak ada `number` di aritmetika uang.
- Setiap tabel: `tg_stamp`, `tg_audit`, RLS per peran, entri `supabase/tests/rls_roles.sql`, index untuk kolom data mart.
- Flag `app_setting` per modul, default false, helper `moduleEnabled()`.
- CI: `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm snapshot:diff`, `pnpm test:rls` (skip dengan peringatan kalau DB tidak ada).

**Supabase (project `BMG-OS`, ref `btccexwuukrpushmharq`, Seoul, Postgres 17, tanpa branch)**
- Sesi Claude Code berjalan di cloud (network Trusted): tidak ada koneksi TCP Postgres ke remote, jadi tidak ada `db push`/`psql` remote. Uji migrasi dan RLS di Supabase lokal (Docker) di dalam sesi; cadangan PG16 + stub.
- Remote hanya lewat connector Supabase. `apply_migration` diizinkan di Fase 0–1 selama gerbang "database kosong" lulus (prompt bagian D). Mulai Fase 2, atau begitu ada upload `committed`, migrasi diterapkan Dika setelah merge (prompt bagian E).
- Tidak ada branch Supabase (keputusan biaya). Konsekuensi: preview Vercel per PR memakai database production yang sama, jadi fitur baru di preview hanya dibuka lewat flag untuk admin.
- Backup: Supabase Pro menyimpan backup harian; `backup.yml` (pg_dump via GitHub Actions dengan secret di GitHub) dibuat di Fase 0 dan dijalankan Dika sebelum menerapkan migrasi Fase ≥ 2.

**File sumber (`reference/`, disiapkan manusia sebelum Fase 0)**
- `DI - WP Costing BMG Sep26_4.xlsx` (golden bulanan)
- `DI - WP Costing BMG Agu26_6.xlsx` (roll-forward, bridge Agu, standar 3 bulan)
- `BMG_Business_Plan_-_Oct26_to_Dec27.xlsx` (BP v1)
- `CoGM SEPTEMBER 2026 R1.xlsx` (kartu lama, Labor, Overhead Allocation, Average Price, jam mesin)
- Inventory Valuation Accurate 1 Agu–30 Sep 2026, GL Accurate Sep (per voucher), LK Sep-26 (IS/BS, Sales by Item)
- Kalau WP Jul26 ada: untuk standar 3 bulan; kalau tidak, standar v1 = rata-rata Agu–Sep dan dicatat.

**Bukti per fase** (`docs/v1/README.md`): hash commit, migrasi, output `pnpm test`, SHA snapshot fixture, screenshot halaman, keputusan default yang dipakai, migrasi yang diterapkan ke remote (bukti gerbang D) atau yang menunggu Dika, dan urutan flag.

---

## Fase 0 — Fondasi, fixture, keputusan data (1 PR, 1 sesi)

1. `backup.yml`; `supabase/migrations/…_foundation.sql`: `app_setting`, `rebuild_queue`, `upload`, `app_user` dengan 10 peran §2, `public.module_enabled(text)`; `roles.ts`, `modules.ts`.
2. Migrasi `…_master.sql`: semua tabel §4.1 (product, others_group, sku, material_item, coa_pool_map, payroll_group, assumption, budget_version, budget_line, budget_pool_map, std_version, bom_line, output_mix, routing, rate_card, capacity). Seed: `product` 3 baris; `others_group` 21 baris dari LAIN-LAIN A22:A42; `sku` dari sheet SKU + KOPERASI; `material_item` dari REKON MATERIAL A7:A62; `coa_pool_map` Sep-26 dari BIAYA BERSAMA A7:D22 + bagian 8, dan Okt-26 dari kolom E "akun baru"; `payroll_group` dari bagian 2; `assumption` D7 (kupas_thr_bpjs 0; cng 22,2967; nrv_kw2 9.777,27; fg_target_days 7; variance_alert_pct 0,02).
3. `scripts/extract_fixtures.py` (python3 -I, openpyxl, `data_only=True` untuk nilai dan `data_only=False` untuk rumus): ekstraktor per sheet WP → `fixtures/month-2026-09/{pool,fcc,uu,uo,others,recon,inventory,reasonableness,bridge,summary}.json` plus `cells.csv` (sheet, sel, nilai, rumus) untuk ±Rp 1 per sel. Ekstraktor BP → `fixtures/budget-v1/budget_line.json` dengan `driver_code`, dan `budget_pool_map` draft dari label baris. Ekstraktor WP Agu26 → `fixtures/month-2026-08/` subset (summary, pool, bridge input kolom C).
4. `docs/open-questions.md` §A: D1–D12 dengan status, kontrol penanda, dan keputusan Q1–Q20 yang dipakai.
5. `docs/v1/README.md`, `CHANGELOG.md`.

DoD: CI hijau; `fixtures/month-2026-09/cells.csv` berisi ≥ 2.500 sel bernilai; seed master terisi; flag `b1…b7` ada dan off.

---

## Fase 1 — B1 ingest bulanan (1 PR, 1 sesi)

Migrasi `…_b1_inputs.sql`: tabel §4.2. Parser: `gl_month`, `gl_voucher_tag`, `payroll_month`, `inventory_valuation`, `sales_by_item`, `average_price`, `cogm_card`, `fs_control`, `budget_bp`, `std_master`. Setiap parser: fixture input (file di `reference/` dipotong seperlunya ke `fixtures/uploads/`), test issues (item tak terpeta, akun tanpa mapping aktif, Σ GL ≠ LK).

Web: `/m/[month]/input` (status per kind, wizard, tag voucher editor), `/standar` (daftar versi, draft dari upload `std_master`, approve oleh finance/admin), `/admin/modul`.

Kontrol B01, B02, B44 di `controls.ts`. Flag `b1_ingest`.

DoD: PRD §8 B1 dengan Sep-26 dari `reference/`.

---

## Fase 2 — B2 costing bulanan (1 PR, 1 sesi; fase terbesar)

Engine, urutan sesuai aturan costing (material → DL → FOH → tie):
```
pool.ts            buildPools({gl, voucherTags, payroll, journals, coaMap, assumptions}) → PoolMonth[]  (BIAYA BERSAMA §1–3, 8, 9)
                   idleCapacity({hoursPaid, hoursToProduct, poolA, normalCapacity}) → {idleHours, idleCost, periodCharge}
allocation.ts      allocatePools({pools, drivers, baggingShare, idle}) → AllocationMonth[] (aktual) + budgetMethodCompare
process-card.ts    processCard({product, card, materials, prices, conversion, nrv, wipCompletion}) → ProcessCardMonth
finished-goods.ts  fgRollForward({opening, inFromCard, sales, transfers, accurateClose}) → FgMonth
others-sku.ts      othersGroups({groups, skus, fccRate, nrv, poolOthers, drivers}) → OthersMonth[]
monthly-costing.ts computeMonth(MonthInputs) → MonthOutputs  (orkestrasi, tanpa logika baru)
```
Golden: setiap fungsi diuji terhadap `fixtures/month-2026-09/*.json` ±Rp 1; `computeMonth` diuji terhadap `cells.csv` untuk sel RINGKASAN bagian 1, BIAYA BERSAMA bagian 3–6, FCC bagian 1–3, LAIN-LAIN bagian 2–3 dan 5.

Migrasi `…_b2_mart.sql`: `pool_month`, `allocation_month`, `process_card_month`, `fg_month`, `others_month`, `control_month`. Server action `rebuildMonth(month)`.

Web: `/m/[month]/pool`, `/m/[month]/kartu/[product]`, `/m/[month]/lain-lain`, `/m/[month]/sku/[code]`. Kontrol B03–B16, B21, B22, B34. Flag `b2_costing`.

DoD: PRD §8 B2. Angka yang tidak tereproduksi dicatat per sel di `docs/open-questions.md` §B.

---

## Fase 3 — B3 rekon dan kontrol (1 PR, 1 sesi)

Engine `recon.ts`: `reconHpp`, `reconBalanceSheet`, `reconMaterialByItem` (REKON MATERIAL kolom I–O), `reconInventoryByItem` (REKON PERSEDIAAN K1–K6, aturan klasifikasi default dari sheet bagian 3), `summaryControls` (RINGKASAN bagian 5, 9 baris).

Migrasi `…_b3_recon.sql`: `recon_month`, `inventory_recon`. Web `/m/[month]/rekon` (tiga tab), klasifikasi K1–K6 bisa diubah reviewer dengan audit. Kontrol B17–B20, B23–B30. Flag `b3_recon`.

DoD: PRD §8 B3.

---

## Fase 4 — B4 kewajaran, varian budget, bridge (1 PR, 1 sesi)

Engine `reasonableness.ts` (tren 8 bulan dari input kartu lama CEK KEWAJARAN bagian 3, Agu vs Sep bagian 2), `variance.ts` (flex budget §4.5; kolom harga/pemakaian/volume/metode/cek seperti FCC bagian 4), `bridge.ts` (BRIDGE GP bagian 2–3 dan waterfall bagian 5; Agu = fixture `month-2026-08`).

Migrasi `…_b4_analysis.sql`: `variance_month`, `bridge_month`, `reasonableness`. Web `/m/[month]/kewajaran`, `/varian`, `/bridge` (waterfall SVG pola `BarChart.tsx`). Kontrol B31–B33, B42, B43. Flag `b4_analysis`.

DoD: PRD §8 B4.

---

## Fase 5 — B5 engine mingguan (2 PR, 2 sesi: 5a standar + rencana, 5b aktual + varian)

**5a.** Engine `standards.ts` (`deriveStandards({months[]}) → StdVersionDraft` dari Agu–Sep; `approveVersion`), `plan.ts` (`planWeek({forecast, fgOpen, std, prices, capacity}) → PlanWeek`). Migrasi `…_b5a_plan.sql`: `sales_forecast_week`, `material_price_week`, `plan_week`. Parser `sales_forecast`, `material_price`. Web `/w/[week]/rencana`, `/standar` diff antar versi. Kontrol B45. Flag `b5_plan`.

**5b.** Migrasi `…_b5b_daily.sql`: tabel §4.3, `cost_week`, `variance_week`, `absorption_week`. Parser `plant_daily` (xlsx 5 sheet; template dibuat script di `reference/templates/Template_Harian_Pabrik.xlsx` dengan dropdown lini/departemen/item). Engine `actual-week.ts`, `absorption.ts`, `variance-week.ts` dengan rumus §4.5. Fixture `fixtures/week-2026-10-W2/` dibuat script dari rata-rata harian Sep (hipotetis, konsisten). Server action `rebuildWeek`, `lockDay`, `correctLine`. Web `/w/[week]/aktual`, `/w/[week]/varian`, `/hari/[date]` (status dan koreksi; form web ditunda). Kontrol B35–B38. Flag `b5_weekly`.

DoD: PRD §8 B5.

---

## Fase 6 — B6 tutup bulan: true-up, kalibrasi, rilis (1 PR, 1 sesi)

Engine `trueup.ts` (§4.5), `calibration.ts` (rata-rata 3 bulan → draft `std_version` + diff Rp/kg), `release.ts` (snapshot JSON kanonik + SHA-256). Migrasi `…_b6_closing.sql`: `trueup_month`, `release`. Web `/m/[month]/tutup-buku` (gate: semua B01–B45 bukan GAGAL, semua CEK berpenjelasan, PERIKSA diakui), PDF bulanan 3 halaman (pdfmake pola `lib/pdf.ts`), `/standar` usulan kalibrasi. Kontrol B39–B41. Flag `b6_closing`.

Management view v1 (`/`): headline PRD §6. Flag `b6_management`.

DoD: PRD §8 B6.

---

## Fase 7 — B7 outlook dan kas (1 PR, 1 sesi)

Adaptasi dari KGR v3 M4–M6 **setelah** modul itu merge di KGR (kalau belum, fase ini menunggu): `outlook.ts` (actual MTD dari GL + forecast dari `plan_week` × standar, vs `budget_line`), `cash.ts` (kas harian per rekening, 13 minggu dari AR/AP termin BP), solvabilitas sederhana. Web `/outlook/[month]`, `/kas`. Flag `b7_outlook`.

Tidak menyalin M3/M7 KGR.

---

## Urutan dan estimasi

| Fase | PR | Sesi | Migrasi | Engine | Web | Bergantung |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 1 | foundation, master | — | admin/modul | repo + Supabase + reference |
| 1 | 1 | 1 | b1_inputs | — | input, standar | 0 |
| 2 | 1 | 1 (panjang) | b2_mart | pool, allocation, process-card, fg, others, monthly | pool, kartu, lain-lain | 1 |
| 3 | 1 | 1 | b3_recon | recon | rekon | 2 |
| 4 | 1 | 1 | b4_analysis | reasonableness, variance, bridge | kewajaran, varian, bridge | 3 |
| 5 | 2 | 2 | b5a, b5b | standards, plan, actual-week, absorption, variance-week | rencana, aktual, varian, hari | 2 (5a), 5a (5b) |
| 6 | 1 | 1 | b6_closing | trueup, calibration, release | tutup-buku, management | 3, 4, 5 |
| 7 | 1 | 1 | b7 | outlook, cash | outlook, kas | 6, KGR M4–M6 |

Total 9 PR, 9 sesi. Fase 5a bisa paralel dengan 3–4 setelah Fase 2 merge.

---

## Verifikasi per PR

```
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm test:golden -- --fixture month-2026-09      # ±Rp 1 per sel, laporan sel gagal ke docs/v1/golden-<fase>.md
pnpm snapshot:diff
pnpm build
supabase db reset && psql "$LOCAL_DB_URL" -f supabase/tests/rls_roles.sql   # lokal di sesi; bukan remote
# Fase 0–1 saja, setelah gerbang D lulus: connector Supabase apply_migration → list_migrations → get_advisors
```
Lalu: deploy preview Vercel, login per peran (admin, finance, cost_accounting, ppic, production, management), screenshot halaman baru ke `docs/v1/`, cek halaman management tidak memuat string `pool_month|cost_week|rebuild` di DOM.

---

## Yang harus dilakukan manusia (di luar sesi)

- Sebelum Fase 0: buat repo kosong `BMG-OS` (private), beri akses Claude GitHub app ke `BMG-OS` dan `KGR-Weekly-Outlook`, isi `reference/`. Supabase BMG-OS sudah ada.
- Setelah setiap PR: review, merge; untuk Fase ≥ 2 terapkan migrasi dari daftar "Untuk Dika" di `docs/v1/README.md` (connector Supabase di claude.ai atau SQL Editor), lalu nyalakan flag untuk admin, lalu peran lain.
- Sebelum Fase 2: konfirmasi ke PPIC apakah WP Jul26 ada (untuk standar 3 bulan).
- Sebelum Fase 5b: sepakati template harian dengan supervisor pabrik; tetapkan `normal_capacity_hours`.
- Sebelum Fase 1 upload Okt: isi `coa_pool_map` Okt-26 (draft dari Fase 0) dan konfirmasi akun baru di Accurate.
- BP v2 (D9) kapan pun; impor sebagai `budget_version` baru.

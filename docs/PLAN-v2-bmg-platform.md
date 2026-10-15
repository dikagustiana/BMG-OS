# Plan v2 — eksekusi PRD v2 BMG Platform

Pasangan dari `docs/PRD-v2-bmg-platform.md` (Lampiran L3). Aturan main PLAN v1 (`docs/archive/PLAN-v1-bmg-platform.md` §0) tetap berlaku kecuali yang ditulis ulang di sini. Setiap fase = satu branch, satu PR, satu set migrasi, satu entri CHANGELOG, satu bukti di `docs/v2/README.md`.

## Fase

| Fase | Branch | Isi | Gerbang masuk | Gerbang keluar |
| --- | --- | --- | --- | --- |
| 1b | `v2/f1b-fs` | B8: `fs_line`, `coa_fs_map`, `tb_month`, `budget_fs_line`, `history_fs_line`, data mart `fs_month`, `nwc_month`, `cashflow_month`, `fs_check_month`; parser `tb_month` dan `bp_fs`; engine `fs.ts` + `history.ts`; F01–F07; design system §8; navigasi per tipe pengguna; halaman §7.4, §7.5, §7.12, §7.14; flag `b8_fs` | Semua tabel data kosong (gerbang D) | Acceptance B8 PRD §10.1; migrasi diterapkan lewat gerbang D |
| 2 | `v2/f2-costing` | B2: `pool.ts`, `allocation.ts`, `process-card.ts`, `finished-goods.ts`, `others-sku.ts`, `monthly-costing.ts`; data mart `pool_month`, `allocation_month`, `process_card_month`, `fg_month`, `others_month`, `control_month` (+ `rule_id`, `inputs`); `rebuildMonth` | PR 1b | Acceptance B2 |
| 3 | `v2/f3-recon` | B3: `recon.ts`; `recon_month`, `inventory_recon`; halaman §7.7 | PR 2 | Acceptance B3 |
| 4 | `v2/f4-analysis` | B4: `reasonableness.ts`, `variance.ts`, `bridge.ts`, `kpi_series`; halaman §7.1, §7.2, §7.3, §7.6 | Mockup §7.1 disetujui; uji tugas 7.1 pada mockup | Acceptance B4; uji 7.1 pada data mart |
| 5a | `v2/f5a-plan` | B5: `standards.ts`, `plan.ts`; parser `sales_forecast`, `material_price`, `plan_override`; halaman §7.11 | PR 2 | B5 sebagian |
| 5b | `v2/f5b-shift` | B5: grid shift §6.3 (`ShiftGrid`), `actual-week.ts`, `absorption.ts`, varian mingguan; kunci hari, koreksi berpasangan (B37b); halaman §7.8, §7.9, §7.10 | Mockup grid disetujui; uji tugas 7.9 pada mockup di tablet | B5; uji 7.9 pada aplikasi |
| 6 | `v2/f6-closing` | B6: `trueup.ts`, `calibration.ts`, `release.ts`; halaman §7.13; PDF rilis; flag `b6_management` | D15 selesai (WP diverifikasi) | B6; uji 7.13 |
| 7 | `v2/f7-outlook` | B7: `outlook.ts`, `cash.ts` (adaptasi KGR M4–M6); blok 13 minggu §7.5, outlook §7.8 | — | B7 |

Mockup dibuat sebelum fase yang punya halaman (4, 5b, 6) dari angka Sep-26/Agu-26 asli di atas `globals.css` v2 dan disimpan di `docs/v2/mockups/`.

## Database

- Fase 1b: `apply_migration` lewat gerbang D `CLAUDE.md` selama semua tabel data kosong (PRD Q29).
- Fase ≥ 2, atau begitu ada upload `committed`: migrasi tidak diterapkan Claude. Daftar file berurutan dan satu berkas gabungan untuk SQL Editor ada di `docs/v2/README.md` bagian "Untuk Dika", dijalankan setelah `pg_dump`.
- Halaman yang membaca tabel yang belum ada di database menampilkan state "belum aktif", bukan galat.

## Verifikasi per PR

```
pnpm install --frozen-lockfile
pnpm typecheck && pnpm test
pnpm test:golden -- --fixture month-2026-09
pnpm snapshot:diff
pnpm build
python3 -I scripts/extract_fixtures.py --check
python3 -I scripts/make_upload_fixtures.py --check
pnpm test:rls            # DB lokal
```

Lalu: screenshot setiap halaman baru di lebar 390 dan 1.440 px ke `docs/v2/img/`, kontras token diukur, DOM halaman Direksi tidak memuat nama tabel.

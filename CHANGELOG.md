# Changelog

## v1 F0 — fondasi, fixture, keputusan data (2026-10-15)

PR: https://github.com/dikagustiana/BMG-OS/pull/1 (`v1/f0-foundation`). Lihat `docs/v1/F0-design.md`, `docs/v1/README.md` (bukti), `docs/v1/F0-summary.md`.

### Ditambahkan
- Monorepo pnpm dari skeleton KGR (baca saja; tanpa riwayat, migrasi, fixture, engine/halaman domain KGR): `@bmg/engine` (decimal, tanggal + helper bulan, format, snapshot kanonik SHA-256, golden), `@bmg/parsers` (SheetJS, deteksi header generik, registry jenis upload kosong), `@bmg/web` (login allow-list, 10 peran PRD §2, flag modul `lib/modules.ts`, `/admin/modul`, `/admin/pengguna`, `/admin/audit`, `/akun`, wizard upload generik, PDF generik).
- Migrasi `20261015000100_foundation`, `20261015000200_master`, `20261015000300_master_seed` (aditif, idempoten). Flag `b1_ingest … b7_outlook`, `b5_forms`, `b6_management` = off; `wp_is_book` = false.
- `scripts/extract_fixtures.py`: `fixtures/month-2026-09` (cells.csv 8.422 sel angka + 10 JSON per area + target PRD §8), `fixtures/month-2026-08` (Agu26_3 + input bridge Agu dari BRIDGE GP Sep), `fixtures/budget-v1` (1.034 baris × 24 bulan, driver_code), `fixtures/master` → seed.
- Tes: unit util, parser generik, roles/modules web, integritas fixture (50/50 target PRD §8 = sel WP), RLS 587 cek (Supabase lokal PG 17.6 dan PG16 + stub), snapshot baseline `tests/snapshots/month-2026-09.json`.
- CI (`.github/workflows/ci.yml`): typecheck, test, golden, snapshot, build, fixture `--check`, migrasi + RLS di Supabase lokal. `backup.yml`: pg_dump harian terenkripsi (secret diisi Dika).
- Dokumen: `CLAUDE.md`, `docs/open-questions.md` (§A D1–D12, §B B-001…B-010, §C Q-default + deviasi skema), `reference/README.md`, `fixtures/README.md`, `supabase/README.md`.

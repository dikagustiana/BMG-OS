# F0 — ringkasan sesi

Fase 0 (fondasi, fixture, keputusan data) dari `docs/PLAN-v1-bmg-platform.md` — **selesai**.

- **Branch / PR:** `v1/f0-foundation` → `main` · PR: lihat bagian "PR" di bawah (dibuka di akhir sesi; tidak di-merge).
- **Bukti lengkap:** `docs/v1/README.md` (Fase 0) · design: `docs/v1/F0-design.md` · golden: `docs/v1/golden-f0.md` · keputusan/selisih: `docs/open-questions.md`.

## DoD Fase 0 (PLAN) dan acceptance PRD §8 "Fase 0"

| Kriteria | Status |
| --- | --- |
| Repo berdiri (skeleton KGR baca-saja; nama KGR diganti; tanpa riwayat/migrasi/fixture/engine domain KGR) | ✓ |
| Supabase berdiri: migrasi foundation + master + seed diterapkan ke remote lewat gerbang D | ✓ (3/3, bukti di README) |
| Flag `b1…b7` (+ `b5_forms`, `b6_management`) ada dan off | ✓ (remote: 0 dari 11 setting aktif) |
| `fixtures/month-2026-09/cells.csv` ≥ 2.500 sel bernilai | ✓ 8.422 sel angka (14.753 sel tak kosong, 22 sheet) |
| Fixture terekstrak dengan angka target PRD §8 | ✓ 50/50 target (B2, B3, B4 ujung bridge, konteks §1) = sel WP ±Rp 1 / ±0,0001 |
| Seed master terisi | ✓ produk 3, kelompok Lain-lain 21, SKU 20, material 54, payroll 14, mapping akun 62, asumsi 22, versi budget 1 |
| `coa_pool_map` Okt-26 terisi | ✓ 41 akun draft (`confirmed = false`) dari kolom E "akun baru" + 5101-201..207, 301..303 |
| D1–D12 masing-masing punya skrip/kontrol/catatan | ✓ `docs/open-questions.md` §A |
| CI hijau | ⚠ semua langkah CI lulus **lokal**; GitHub Actions tidak menjalankan job (masalah akun, juga di KGR) — perlu tindakan Dika |

## Migrasi

| Berkas | Remote | Versi remote |
| --- | --- | --- |
| `supabase/migrations/20261015000100_foundation.sql` | diterapkan (gerbang D lulus) | `20261015164706` |
| `supabase/migrations/20261015000200_master.sql` | diterapkan (gerbang D lulus) | `20261015164816` |
| `supabase/migrations/20261015000300_master_seed.sql` | diterapkan (gerbang D lulus) | `20261015165107` |

Advisor: 0 ERROR; 2 WARN keamanan disengaja (`admin_set_password`, `app_role` SECURITY DEFINER — alasan di README); INFO performa (index belum dipakai). Tidak ada migrasi yang menunggu Dika.

## Flag dan urutan

Semua off. Fase 0 tidak menambah halaman modul. Urutan per fase setelah merge + migrasi: Admin dulu, lalu peran lain; `b1_ingest` → `b2_costing` → `b3_recon` → `b4_analysis` → `b5_plan` → `b5_weekly` (`b5_forms`) → `b6_closing` → `b6_management` → `b7_outlook`.

## Angka target

Fase 0 tidak menghitung angka (belum ada engine domain). Golden integritas: 50/50 angka PRD §8 tereproduksi dari sel WP Sep26_4 tanpa selisih di luar toleransi. Contoh: pool 1.572.766.737,19 (`BIAYA BERSAMA!C87`), rate FCC 23.928,4692 (`FCC!D76`), HPP FCC 5.106.312.148,26 (`FCC!E104`), HPP kartu 6.463,1669 jt → GL 6.375,4123 jt (`RINGKASAN!B29`, `B34`), margin Agu 19,9219 pp → Sep 14,5657 pp (`BRIDGE GP!C117`, `C135`). Ketidakcocokan **sumber** (bukan angka) dicatat B-001…B-010.

## Keputusan default (Q-ID)

Q1, Q2, Q3 (`wp_is_book = false`), Q4 (BP v1 locked as-is), Q6 (standar = rata-rata Agu–Sep karena WP Jul tidak ada), Q9, Q10, Q11 (NRV 9.777,27118088893), Q12 (7 hari), Q13 (±15%), Q14 (2% / 3 minggu), Q15, Q16, Q17 (kupas tidak ikut THR/BPJS), Q18 (22,2967), Q19, Q20 (Senin). Deviasi skema S-01…S-08 (enum pool `BPJS`/`PAYROLL_SPLIT`, kunci alami `material_item.name`, dll.).

## Yang memerlukan manusia sebelum Fase 1

1. Admin pertama lewat SQL Editor (`docs/v1/README.md` → Untuk Dika no. 1).
2. Buat/hubungkan project Vercel `bmg-os` (root `apps/web`) — connector tidak melihat project.
3. Perbaiki GitHub Actions (job tidak mendapat runner; cek billing/kuota) agar CI berjalan di PR.
4. Izinkan `cdn.sheetjs.com` di network environment cloud (SheetJS 0.20.3).
5. Konfirmasi akun COA Okt-26 di Accurate (B-007) sebelum upload GL Okt; review `budget_pool_map` draft (D8).
6. Taruh file Fase 1 di `reference/`: CoGM Sep R1, GL Sep per voucher, Inventory Valuation 1 Agu–30 Sep, LK Sep-26 (IS/BS, Sales by Item); bila ada: WP Agu26_6 (B-001), WP Jul26 (B-006).
7. Review dan merge PR Fase 0. Secret `SUPABASE_DB_URL` + `BACKUP_PASSPHRASE` untuk `backup.yml` (wajib sebelum Fase ≥ 2).

## Konteks untuk sesi berikutnya

Fase 0 selesai penuh; tidak ada pekerjaan tertunda di fase ini. Fase 1 mulai dari branch `v1/f0-foundation` (atau `main` setelah merge): `KINDS` di `packages/parsers/src/tables.ts` dan `HANDLERS` di `apps/web/lib/upload.ts` masih kosong; `public.upload_tables()` sudah memuat tabel master target upload; migrasi berikutnya bernomor setelah `20261015000300`. Lingkungan: jalankan `dockerd` lalu `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io supabase start -x …` (lihat `CLAUDE.md`).

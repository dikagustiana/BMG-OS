# BMG-OS v2 — bukti per fase

Satu bagian per fase (PLAN v2). Bukti Fase 0–1: `docs/v1/README.md`.

---

## Fase 1b — neraca, laba rugi, arus kas, tampilan baru

Branch `v2/f1b-fs` · design `docs/v2/F1b-design.md` · ringkasan `docs/v2/F1b-summary.md` · verifikasi WP `docs/v2/wp-verification.md` (D15)

### Verifikasi lokal

| Perintah | Hasil |
| --- | --- |
| `pnpm typecheck` | bersih |
| `pnpm test` | engine 40 lulus + 1 todo, parsers 35, web 9 |
| `pnpm test:golden -- --fixture month-2026-09` | semua sel golden lulus |
| `pnpm snapshot:diff` | EMPTY (baseline diperbarui sekali: 2 fixture baru `budget-v1/fs_sheet.json`, `budget-v1/coa_mtm.json`, `uploads-fs/…/tb_month.xlsx`; key Fase 0–1 tidak berubah) |
| `pnpm lint:css` | OK (tidak ada hex di luar `:root`, huruf dan spasi dari skala §8) |
| `pnpm build` | lulus |
| `extract_fixtures.py`, `make_upload_fixtures.py`, `make_fs_fixtures.py` `--check` | cocok |
| `supabase db reset` + `pnpm test:rls` | `rls_roles` 1041/1041, `rls_fs` 273/273 |

### Todo yang tercatat

- F01–F03 pada ±Rp 1 untuk Jan–Agu 2026: `it.todo` di `packages/engine/test/fs.test.ts`. BP v1 sendiri selisih Rp 47–201 per bulan (laba BP dari Model Details berbeda dari GL; B-101). Tes memakai batas Rp 1.000 dan menyatakan residu.

### Gerbang D (`apply_migration`, PRD Q29)

1. Fase 1b: boleh.
2. `select count(*)` di `upload` dan semua tabel input/data mart = 0, tidak ada upload `committed`, tidak ada `std_version` selain draft: lulus (15 Okt 2026, sebelum apply).
3. `list_migrations` = urutan repo (5 migrasi), tiga nama baru belum ada: lulus.
4. Isi: `check_migration.py` 0 pelanggaran pada ketiga file (hanya `create … if not exists`, `add column if not exists`, `create or replace`, policy terjaga, seed `on conflict do nothing`).
5. Lulus gerbang B (Supabase lokal PG 17) dan sudah di-commit sebelum apply.

Diterapkan lewat connector, urutan: `20261016000100_b8_fs` → `…000200_b8_fs_lines` → `…000300_b8_fs_map`.

Sesudah apply:

- `list_migrations`: 8 migrasi (versi remote `20261015212444`, `…212609`, `…212800`).
- Isi remote = repo: `fs_line` 188 baris dan `coa_fs_map` 288 baris (215 terkonfirmasi), checksum md5 per kolom kunci sama dengan database lokal.
- `get_advisors` security: 0 ERROR; WARN yang sama seperti Fase 1 (`admin_set_password` dan `app_role` dapat dieksekusi `anon` karena `SECURITY DEFINER` di skema `public`; proteksi kata sandi bocor mati). Perbaikannya (pindah ke skema `private`) memerlukan migrasi yang melanggar gerbang D butir 4 bila memakai `revoke`; dicatat di "Untuk Dika".
- `get_advisors` performance: hanya INFO (indeks belum dipakai karena tabel kosong).
- Flag `b8_fs` = false di remote.

### Untuk Dika

1. **Nyalakan `b8_fs`** di Pengaturan → Modul bila ingin halaman Neraca & BP dan Modal kerja & kas terlihat. Halaman Kinerja, Input bulanan, dan Cek sudah tampil karena `b1_ingest` dan `b4_analysis` menyala di remote.
2. **Flag b2–b7**: per 16 Okt 2026 semuanya menyala di remote (PRD L5). Sesi ini tidak mematikannya (`execute_sql` hanya `select`). Halaman modul itu menampilkan state kosong yang jujur, tanpa angka. Matikan di Pengaturan → Modul bila tidak ingin menunya terlihat.
3. **Unggah BP** (versi `BP Okt-26 v1`, jenis "Business Plan — neraca, laba rugi, arus kas") dan neraca saldo Sep-26 dari Accurate. Data bisnis hanya diunggah manusia; sesi ini tidak mengunggah apa pun ke remote.
4. **Taruh `DI - WP Costing BMG Agu26_6.xlsx` dan `Agu26_4`** di `reference/` dan putuskan versi Agustus final (D15 temuan 1).
5. **Konfirmasi** Q21–Q30 atau biarkan default (`docs/open-questions.md` §C).
6. **Fase ≥ 2**: migrasi tidak diterapkan Claude. Urutan dan instruksi ada di bagian "Untuk Dika: terapkan ke production" setiap README fase.

### Screenshot

`docs/v2/img/`: `f1b-kinerja-1440.png`, `f1b-neraca-1440.png`, `f1b-kas-1440.png`, `f1b-input-1440.png`, `f1b-kinerja-390.png`. Diambil dari aplikasi lokal dengan BP v1 asli yang diimpor lewat wizard (4.508 baris, 24 bulan dihitung ulang).

# Fase 1b — neraca, laba rugi, arus kas, dan tampilan baru

Spesifikasi: PRD v2 §4.11, §5, §7.4–§7.5, §7.12, §7.14, §8. Keputusan yang dibuat tanpa menunggu Dika dicatat di `docs/open-questions.md` §C (K2-A s.d. K2-H) dan celah data di §B (B-101 s.d. B-104).

## Apa yang dibangun

| Lapis | Isi |
| --- | --- |
| Engine | `fs-lines.ts` (188 baris dari sheet BP "BMG Business Plan"), `fs.ts` (total, TB → baris lewat `coa_fs_map`, modal kerja, arus kas indirect, F01–F07, `rebuildFs`), `history.ts` (cocokkan baris BP berdasar label berurutan), `fs-map-seed.ts`, `fs-view.ts` |
| Parser | `tb_month` (neraca saldo Accurate), `bp_fs` (sheet BMG Business Plan: kolom Actual → riwayat, kolom BP → pembanding versi) |
| Database | Migrasi `20261016000100_b8_fs` (9 tabel, flag `b8_fs`, kunci BP FS, `upload.uploaded_by_name`), `…000200_b8_fs_lines`, `…000300_b8_fs_map` (seed dibangkitkan dari engine) |
| Web | Design system §8, navigasi per tipe pengguna, Kinerja, Neraca & BP, Modal kerja & kas, Cek & kewajaran, Input bulanan, Pengaturan, Audit, Versi standar |

## Aturan angka

- Jan–Agu 2026: kolom Actual BP v1 apa adanya (D13: sheet "BS Actual MTM" kolom Sep/Okt tidak dibaca).
- Sep-26 dst.: neraca saldo bulanan. Neraca: saldo akhir × tanda; laba rugi: mutasi bulan × tanda; laba tahun berjalan = −Σ saldo akhir akun 4–8.
- Arus kas: dua neraca dan laba rugi bulan itu, rumus baris BP 134–181. Kas awal = kas neraca bulan lalu, sehingga F02 menguji rantai neraca, bukan rantai kas BP.
- Pembanding BP hanya dari Sep-26 (D14).

## Yang sengaja belum ada

Halaman Biaya per kg, Lain-lain & SKU, Rekonsiliasi, Tutup bulan, Mingguan, Rencana, Shift, dan Penyelesaian hari menampilkan state kosong yang menyebut isi dan syaratnya. Tidak ada angka contoh (PRD §12).

# Fase 1b — ringkasan

Neraca, laba rugi, modal kerja, dan arus kas Jan–Agu 2026 tampil dari sheet BP v1, dengan cek F01–F07. Aplikasi memakai design system baru, menu per tipe pengguna, dan halaman Input bulanan serta Pengaturan yang ditulis ulang.

- **Angka:** Agu-26 sama dengan sheet BP: kas 5.222,3 jt, NWC 7.019,8 jt, ekuitas 35.641,2 jt, CFO 938,1 jt, hari piutang 25,8.
- **Celah yang ditemukan:** BP v1 tidak seimbang pada Rp 1: F01 dan F03 selisih Rp 47–201 per bulan, F02 sampai Rp 85, karena laba BP (Model Details) berbeda dari GL. Tes menyatakan batas Rp 1.000 dan `it.todo` untuk Rp 1 (B-101). F06 PERIKSA mulai Jul-26, bukan Jun-26 seperti di PRD (Jun 8,6% ekuitas; B-102).
- **Database:** tiga migrasi diterapkan lewat gerbang D; tabel data tetap kosong.
- **Belum:** semua halaman yang butuh costing, rekon, mingguan, dan pabrik. Engine Fase 2–7 dikerjakan terpisah dan belum tersambung ke halaman.

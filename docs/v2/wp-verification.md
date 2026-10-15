# Verifikasi independen WP Costing Sep26_4 (D15)

Objek: `reference/DI - WP Costing BMG Sep26_4.xlsx` (SHA-256 `9089f5a3…c1a3aa`, sama dengan `reference/README.md`), pembanding `DI - WP Costing BMG Agu26_3.xlsx`, serta BP v1 hanya di sel yang dirujuk WP dan untuk angka BP di PRD §1. Metode `verify-financial-model`, disesuaikan untuk WP costing (neraca, arus kas, eliminasi, dan PSAK 22 tidak berlaku; lihat akhir dokumen).

**Kesimpulan.** WP Sep26_4 layak menjadi golden aritmetika platform. Seluruh 5.856 rumus dihitung ulang penuh di LibreOffice dan sama dengan nilai tersimpan Excel (dua beda ≤ Rp 0,000002 di sel sisa). Tidak ada referensi sirkular, sel error, atau tautan eksternal. Rantai biaya yang dihitung ulang terpisah hanya dari sel input (GL → pool → alokasi → kartu proses → barang jadi → Lain-lain → rekon GL) cocok dengan sel WP sampai Rp 0,000001. Angka PRD v2 §1 dan §10.1 B2–B4 cocok dengan sel, kecuali tiga pernyataan di PRD: sisa rekon HPP Rp 7,21 (bukan 0), bagian 1 kewajaran berisi 15 KPI (bukan 14), dan label b17. Dua catatan membatasi pemakaian angka WP di halaman direksi, tetapi tidak mengubah golden. (1) Saldo awal Sep diambil dari Agu26_3, sedangkan bridge dan kewajaran memakai Agu26_6 yang tidak ada di repo. Bila Agu26_6 yang final, HPP kartu Sep kurang sekitar Rp 15,9 jt dan margin UU turun dari 27,7% ke sekitar 23,7%. Jumlah CEK juga menjadi 9 bila pembandingnya Agu26_3. (2) Sebanyak 58 dari 183 status LULUS tidak bisa gagal, termasuk neraca kg dan Rp kartu proses. Karena itu "semua kontrol LULUS" bukan bukti mutu input. D15 dapat ditutup untuk golden. `b6_management` dibuka ke selain admin setelah temuan 1 diputuskan, atau setelah HPP kartu dan angka UU diberi status Sementara.

## Temuan

### 1. Tiga versi Agustus dipakai dalam satu WP September (tinggi)

- **Sel:** `FCC!C196`, `FCC!C202`, `UU!C196`, `UU!C202` (catatan sumber "Agu26_3"); `CEM-CEM ORI!C109`, `KOPERASI!B127` dan sheet SKU lain ("Agu26_4"); `BRIDGE GP!C7:C77` dan `CEK KEWAJARAN!B60:B61` ("Agu26_6"), serta `CEK KEWAJARAN!B25:B37` (sumber hanya ditulis "WP Agu", tetapi nilainya = Agu26_6).
- **Masalah:** saldo awal WIP dan FG Sep dinilai dengan tarif Agu26_3, sedangkan pembanding Agustus di bridge dan kewajaran adalah Agu26_6, yang punya penyesuaian bagian 8 dan pool berbeda. Agu26_3 tidak punya bagian 8 (5101-016 Agustus hanya Rp 12,5 jt). Akibatnya ongkos kirim singkong Rp 87,5 jt yang dikeluarkan dari Sep (`BIAYA BERSAMA!C152` + `C153`) tidak masuk biaya produk, baik di Agu26_3 maupun di Sep. Di Agu26_6 biaya itu ada (`BRIDGE GP!C24` = `C76` = 87,513676 jt = −`D76`). Pasangan tali asih "periode Agustus" Rp 32,4 jt (`BIAYA BERSAMA!C150`) tidak bisa ditelusuri. B-001 baru mencatat sisi bridge.
- **Bukti:**
  - Input Agustus di bridge vs Agu26_3: 24 input sama persis, yaitu pendapatan (5 pos), kg jual dan produksi (7), material per jenis selain ongkos kirim (7), pool C, HPP GL, L38, L40, dan L41. Yang berbeda: MAT_F +87,51 jt, pool A −40,69, Kupas −3,93, B +27,75, D +3,78, E +112,72, HPP_WP +156,30, dan L39 (kenaikan persediaan WP) +30,85 jt.
  - Biaya produksi Agustus menurut bridge vs Agu26_3: FCC 7.471,30 vs 7.327,44 jt (tarif kartu proses +439,36/kg); UU 492,65 vs 465,31 jt (+2.043,93/kg).
  - Dampak ke saldo awal Sep: FCC WIP 357,5 kg +0,16 jt, FCC FG 7.029 kg +3,09 jt, UU WIP 4.042,5 kg +8,26 jt, UU FG 2.123 kg +4,34 jt; total +15,85 jt. Cek silang: L39 +30,85 jt dikurangi FG Lain-lain awal Sep 14,77 jt (`LAIN-LAIN!E93`) = 16,08 jt. Asumsi: WIP awal Agustus (52,1 jt) dan KW 2 sama di kedua versi.
  - Bagian 2 kewajaran: dengan kolom Agu dari Agu26_3, CEK menjadi 9, bukan 6. Tambahannya UU +12,1%, UO +16,5%, dan pool tetap +26,4% (Agu26_3 637,90 jt vs Agu26_6 786,77 jt).
- **Dampak:** dengan saldo awal Agu26_6, HPP kartu Sep naik sekitar Rp 15,9 jt: UU 232,71 → ±245,31 jt, FCC ±+2,9 jt. `REKON & KONTROL!C39` menjadi ±Rp 16 jt lebih negatif, sedangkan HPP GL dan sisa rekon tidak berubah. Bar b10/b11 (−2,4339/−0,2603 pp) dan "efek biaya tetap −2,4 pp" di PRD §1 bergantung pada pool tetap Agu26_6 yang tidak bisa diverifikasi.
- **§10.1:** ya. B2 (HPP FCC, HPP UU), B3 (HPP kartu, pos −326,5394), dan B4 (6 CEK; b10–b14). Golden tetap tereproduksi karena saldo awal adalah sel input.
- **Tindakan:** taruh Agu26_6 dan Agu26_4 di `reference/`, lalu putuskan satu versi Agustus final. Bila berbeda dari Agu26_3, buat WP Sep versi baru sebagai fixture baru, bukan edit golden (PRD §12).

### 2. Sisa rekon HPP Rp 7,21, bukan 0 (sedang)

- **Sel:** `REKON & KONTROL!C46` = 0,0000072142 jt, yang terbawa ke `RINGKASAN!B35` dan `REKON & KONTROL!C61`.
- **Masalah:** PRD §4.7 dan §10.1 B3 menulis "sisa 0" dengan toleransi golden ±Rp 1. WP lulus hanya karena toleransinya Rp 1.000 (0,001 jt).
- **Bukti:** penyebabnya ada di LK sendiri. Total COGS LK 6.375.412.304,37 (`RINGKASAN!B61`) dikurangi pemakaian LK 4.375.218.161,24, konversi 1.590.888.645,02, penurunan WIP 196.152.066,81, dan penurunan FG 213.153.424,09 menyisakan Rp 7,21. Angka ini sama dengan pemakaian GL 4.375.218.168,45 (`REKON MATERIAL!C69`) dikurangi pemakaian LK (`REKON MATERIAL!F69` = 7,21). WP memakai pemakaian LK untuk varian material (`REKON & KONTROL!B29`), tetapi `RINGKASAN!C41` memakai GL.
- **§10.1:** ya, B3 ("sisa 0").
- **Tindakan:** ubah teks PRD menjadi "sisa Rp 7,21 (beda pemakaian LK vs GL)", atau tetapkan pemakaian GL sebagai satu-satunya sumber varian material. Toleransi golden jangan dilonggarkan.

### 3. Tabel varian FCC tidak memuat ongkos kirim singkong (sedang)

- **Sel:** `FCC!F112` (= F110 + F111), `FCC!F133`, `FCC!H133`, `FCC!E10` vs `FCC!C10`, dan `RINGKASAN!B16` vs `RINGKASAN!B9`.
- **Masalah:** baris ongkos kirim (`FCC!E43` 41.897.465; 176,84 Rp/kg) disisipkan di Sep, tetapi bagian 4 tidak ikut diperbarui. Rp/kg aktual di bagian 4 menjadi 23.301,54, sedangkan biaya produksi 23.478,38/kg, dan RINGKASAN menampilkan keduanya sebagai "Rp/kg". `FCC!C164` hanya memeriksa sisa per baris (kolom M), bukan total bagian 4 = biaya produksi, sehingga selisih ini lolos. UU dan UO tidak terdampak (`UU!F126` = `UU!F66`, `UO!F122` = `UO!F62`).
- **§10.1:** ya, B4 (varian vs BP v1 FCC: "cek per baris = 0" lolos meskipun totalnya kurang 176,84 Rp/kg).
- **Tindakan:** engine varian memuat komponen ongkos kirim dan kontrol Σ komponen = biaya produksi per kg.

### 4. Kg premium adalah sisa, sehingga neraca kg dan Rp kartu proses tidak bisa gagal (sedang)

- **Sel:** `FCC!B32` = B31 − B33 − B34 − B35 (juga `UU!B34`, `UO!B30`); kontrol `FCC!C159:C161`, `UU!C148:C150`, `UO!C144:C146`.
- **Masalah:** premium tidak diinput, tetapi dihitung sebagai sisa (WIP awal + masuk − KW 2 − waste − WIP akhir). Akibatnya kontrol "kg dipertanggungjawabkan = dibebankan" dan "biaya dipertanggungjawabkan = dibebankan" (PRD §4.4 B06–B09) adalah identitas. Satu-satunya pembanding independen, FG-001 masuk menurut Accurate 211.979,5 vs 221.027 kg, hanya tampil sebagai baris info `FCC!B96` (−9.047,5 kg) tanpa status.
- **Bukti:** selisih transfer `FCC!B97` (−9.057,5 kg) hampir sama dengan selisih masuk; bedanya 10 kg = `FCC!B93` (selisih kuantitas FG). Polanya menunjukkan sekitar 9.050 kg premium di Accurate langsung dikirim ke Lain-lain tanpa lewat FG-001. Ini beda rute, bukan kehilangan, sehingga HPP FCC tidak bergeser secara material.
- **§10.1:** ya, B2/B3: B06–B09 tidak memberi jaminan, sehingga B21/B22 harus menjadi kontrol berstatus.
- **Tindakan:** platform tidak memakai B06–B09 sebagai bukti mutu. B21/B22 berstatus PERIKSA dengan rekonsiliasi gabungan kg masuk + transfer (selisih 10 kg).

### 5. 52 status LULUS lain adalah identitas, 6 lagi kosong (sedang)

- **Sel:**
  - Sembilan sheet SKU, `B70`, `B72`, `B73`, `B74` (36 status). Isinya: `E34` dibandingkan dengan SUMIF yang sama, total = bahan + konversi, barang jadi dengan selisih kuantitas sebagai sisa, dan ringkasan = 2b.
  - `KOPERASI!B56`, `B58`, `B59` (3).
  - `LAIN-LAIN!C72:C73` (2): membandingkan `H43`/`I43` dengan `BIAYA BERSAMA!F91`/`F93`, yang adalah tautan ke sel itu sendiri.
  - `BRIDGE GP!C151` (C111 = C7) dan `C153` (bar disusun teleskopik) (2).
  - Ditambah 9 identitas di temuan 4, totalnya 52.
  - Enam status budget (`FCC!C165:C166`, `UU!C154:C155`, `UO!C150:C151`) bernilai 0 karena BUDGET kosong. `FCC!C165` merujuk `FCC!G134` yang kosong, karena FCC tidak punya baris "Cek budget" seperti `UU!G127` dan `UO!G123`. Kontrol ini tetap kosong meskipun BUDGET diisi.
- **Dampak:** 58 dari 183 sel LULUS tidak bisa GAGAL, sehingga `RINGKASAN!C3` "LULUS" tidak membuktikan mutu input.
- **§10.1:** ya, B3 ("B01–B32 LULUS") bila kontrol platform disalin apa adanya.
- **Tindakan:** dalam pemetaan B01–B45, kontrol identitas menjadi tes unit engine, bukan kontrol rilis. Gantinya adalah pembanding independen (input vs sumber).

### 6. RINGKASAN bagian 4 tidak memuat penyesuaian bagian 8 (sedang)

- **Sel:** `RINGKASAN!A29:B35`.
- **Masalah:** baris yang tampil menjumlah 6.463,1669 − 121,1482 + 82,7660 − 25,5969 + 0 = 6.399,1879, bukan HPP GL 6.375,4123 (`B34`). Bedanya 23,7756 jt = `REKON & KONTROL!C42` (penyesuaian bagian 8), yang tidak punya baris di RINGKASAN. `B35` "Cek (harus nol)" menampilkan 0,000007 karena diambil dari REKON, bukan dari baris di atasnya.
- **§10.1:** tidak (PRD §4.7 memakai `REKON & KONTROL!C38:C43` yang lengkap). Berisiko bila waterfall direksi dibangun dari RINGKASAN.

### 7. Harga singkong kulit dari Average Price melebihi GL, dengan risiko ongkos kirim terhitung ganda (sedang)

- **Sel:** `FCC!F215` (2.942,83/kg) → `FCC!E41` 1.021.433.573,07; `REKON MATERIAL!M9`, `N9`, `O9`; `FCC!E43`.
- **Masalah:** kartu memakai singkong kulit Rp 9,07 jt lebih banyak dari yang tersedia menurut GL. Saldo awal 0 + penerimaan GL 1.012.361.248 − saldo akhir −681,88 menghasilkan saldo implisit `N9` = −9.072.325,07. Catatan `O9` menyebut pembelian di Average Price 1.031.371.931 vs GL 1.012.361.248 (beda 19,0 jt). Bila beda itu biaya kirim yang sudah dikapitalisasi di Average Price, ongkos kirim terhitung dua kali bersama `FCC!E43` (41,9 jt). Untuk CNG, nilai kartu justru sama dengan GL (799,99 jt) sementara Average Price 724,6 jt (`O10`), jadi sumber harga antar material tidak seragam.
- **Dampak:** biaya FCC versi manajemen bisa lebih tinggi Rp 9–19 jt (40–80 Rp/kg). HPP GL tidak terpengaruh karena selisihnya masuk varian material.
- **§10.1:** tidak langsung (golden mengikuti sel); ya bila koreksi dibuat di WP versi baru (B2 FCC).
- **Tindakan:** Purchasing/Finance menjelaskan beda Average Price vs GL singkong Sep. Engine memakai satu aturan harga untuk semua material (MA Accurate, Q5).

### 8. Selisih teks PRD v2 terhadap WP (rendah)

- `CEK KEWAJARAN!A6:A20` berisi 15 KPI (8 DI LUAR RENTANG, 7 DALAM RENTANG), sedangkan PRD §4.8 dan §10.1 B4 menulis 14.
- `BRIDGE GP!B134` dan `E106`: b17 memuat THR tertukar, tali asih, ongkos kirim (−87,51 jt Sep, +87,51 jt Agu), dan pisau. PRD §4.8 hanya menulis "(THR tertukar, tali asih)".
- Di luar WP: PRD §1 "BP v1 Sep-26 produksi FCC 297,1 t" tidak tertelusur. BP Model Details baris 421 (Target output produksi) Sep-26 = 299.474,5 kg. Pendapatan 8.746,3 jt (sheet BMG Business Plan baris 9) dan GP 13,69% (baris 90) cocok.
- **§10.1:** ya, B4 (jumlah KPI).

### 9. Input LK diketik ganda dan tidak konsisten (rendah)

- `RINGKASAN!B62` (LK neraca 1106-001) 947.179.402,89 vs `REKON MATERIAL!E70` (LK PL HPP saldo akhir) 947.179.465,89. Bedanya tepat Rp 63,00, pola salah ketik. `RINGKASAN!H46` = Rp 55,80.
- `REKON & KONTROL!B29` (4.375,21816123577 jt) dan `C45` (6.375,41230437 jt) diketik ulang dari `RINGKASAN!B59`/`B61`, bukan ditautkan. B29 berbeda Rp 0,004.
- `CEK KEWAJARAN!J42:J57` (Sep) diketik, padahal angkanya ada di sheet FCC. Saat ini 15 sel cocok.
- `FCC!C234`, `UU!C222`, dan `UO!C218` ("kartu lama", yang diuji `FCC!C162` dkk.) sama dengan hasil hitung WP sampai 5 desimal (beda ≤ Rp 0,000004). Kontrol ini tidak menunjukkan sumber independen, dan kartu CoGM asli tidak ada di repo (B-011).
- **§10.1:** tidak (semua beda < Rp 100). Risikonya muncul saat bulan berikutnya.
- **Tindakan:** platform membaca tiap angka LK sekali, dari upload `fs_control`.

### 10. KW 2 tidak punya saldo (rendah)

- `REKON & KONTROL!C52:D55`: Sep memproduksi KW 2 7.581 kg, memakai 4.242 kg untuk Lain-lain, dan menjual 5.957 kg. Stok KW 2 turun 2.618 kg (Rp 25,6 jt pada NRV), padahal tidak ada saldo KW 2 yang tercatat; Agu26_3 menambah 2.075,2 kg. Tidak ada kontrol saldo KW 2 ≥ 0.
- NRV `FCC!C209` adalah harga jual rata-rata Jan–Agu ke KGS (`Data Aktual!Q76` di BP, berlabel "Harga KW2 sementara"), bukan harga jual dikurangi biaya jual. SKU Koperasi KW 2 berbumbu rugi 42–57% (`KOPERASI!B41:E41`).
- **§10.1:** tidak.

### 11. SKU Koperasi 250 gr (rendah)

- `KOPERASI!J123`: kg per satuan = 1 untuk "FCC Premium Bumbu Asin 250gr", sehingga output tercatat 10 satuan, sementara Accurate 0 (`J129`). Seluruh biaya Rp 294.142,63 masuk HPP lewat selisih kuantitas (`J36:J37`). 10 kg FCC premium untuk SKU ini (`J9`) adalah 10 kg yang membuat `FCC!B93` = −10 kg.
- **§10.1:** tidak.

### 12. Beda subledger vs GL untuk FG, dan FG tanpa mutasi (rendah)

- `REKON PERSEDIAAN!F9`/`G9` −717.815,14 / −717.811,17: GL 1106-003 di bawah Σ Inventory Valuation. Beda ini dijelaskan sebagai baris tersendiri (`F22:G22`) dan hanya diuji kestabilannya (`C31` = 3,97).
- `G19`: K4 273,06 jt FG tanpa penjualan atau produksi (pellet) = 95% saldo FG GL. WP menjelaskannya, tetapi tidak menguji NRV.
- **§10.1:** tidak (neraca FG B3 cocok). Relevan untuk F04 dan neraca direksi.

### 13. Selisih kecil roll-forward saldo GL dan #REF! di Agu26_3 (rendah)

- Agu26_3 `REKON & KONTROL!C40` (saldo akhir 1106-002/003 diketik dalam rumus) 494.002.781,77 / 499.690.064,50, sedangkan Sep `RINGKASAN!B63`/`B65` 494.002.773,03 / 499.690.063,73. Bedanya Rp 8,74 dan Rp 0,77.
- Agu26_3 `RINGKASAN!B25` dan `D25` berisi #REF! (`=FCC!#REF!`, `=UO!#REF!`) dan terbawa ke fixture `month-2026-08`. Sel ini tidak dipakai Sep.
- **§10.1:** tidak.

### 14. Struktur rapuh dan label basi (rendah)

- `LAIN-LAIN!B97:B103` memakai SUMIF pada nomor baris yang diketik (22…41 di `B82:B91`). Menyisipkan baris di bagian 2 memutus kontrol tanpa memunculkan error.
- Label basi:
  - `BIAYA BERSAMA!A136` menulis "referensi BP Q173", padahal `C24` diambil dari LK.
  - `LAIN-LAIN!A17` menulis "BP Data Aktual P68 + P65", padahal nilainya dari LK Sales by Item (`REKON & KONTROL!C74`).
  - `RINGKASAN!C26` (persen jam menganggur 13,1%) berada di kolom "Ubi Ungu".
  - `G32` di sheet SKU menulis "NRV KW 2 (FCC C208)" (B-004).
- **§10.1:** tidak.

### 15. Presisi target golden di repo (rendah)

- `fixtures/month-2026-09/prd_targets.json`:
  - `B2.uo_hpp` expected 252.566.650 ±50, padahal sel `UO!E94` = 252.566.602,58 (lolos dengan sisa margin 2,58).
  - `B3.recon_residual` expected 0 ±0,001 jt, sehingga temuan 2 tertutup.
- Ini bukan kesalahan WP, dan fixture tidak diubah di sesi ini.
- **§10.1:** ya (B2 UO, B3 sisa). Target sebaiknya memakai nilai sel persis ±Rp 1 saat fixture versi berikutnya dibuat.

## Pemeriksaan yang lulus

1. **Integritas file:** SHA-256 ketiga file sama dengan `reference/README.md`, dan `python3 -I scripts/extract_fixtures.py --check` → "fixtures match a fresh extraction of reference/".
2. **Rekalkulasi penuh (LibreOffice 24.2, hitung ulang saat buka):** 5.856 rumus Sep, 5.854 identik, 2 beda ≤ Rp 0,000002 (`REKON MATERIAL!C86:C87`, sel sisa). Agu26_3: 2.176 rumus, 2.174 identik, 2 = #REF! (temuan 13). Nilai tersimpan tidak basi.
3. **Struktur:**
   - 0 referensi sirkular (graf dependensi 5.856 rumus); iterasi kalkulasi mati (`calcPr` tanpa `iterate`).
   - 0 tautan eksternal, 0 nama terdefinisi, 0 sel error di Sep, 0 baris/kolom tersembunyi.
   - Rujukan ke sel kosong di luar sheet BUDGET: 38 sel kolom "BP (dikosongkan)" di bagian 5 FCC/UU/UO (disengaja) dan `FCC!C165` (temuan 5).
4. **Angka tertanam:** tidak ada nominal uang di dalam rumus Sep.
   - Literal hanya skala (10^6, 100, /12), nomor baris `LAIN-LAIN!B97:B103`, batas 10.000 di `REKON MATERIAL!C82`, dan 0,005 di `REKON PERSEDIAAN!C39`.
   - Dari 2.823 konstanta angka, 158 berada di blok rumus: 141 nol struktural; sisanya input LK (`REKON & KONTROL!B29`, `C45`, `REKON MATERIAL!E67`, `E70`) dan ambang 10% (`CEK KEWAJARAN!E25:E37`).
5. **Hitung ulang independen** (Python Decimal, hanya dari sel input, pemetaan pool dan driver ditulis ulang): 34 angka cocok ≤ Rp 0,000001, yaitu:
   - GL 16 akun; pool A, Kupas, B, C, D, E, total, dan tetap; pool = GL + bagian 8 − ongkir ke material.
   - Material FCC dan Lain-lain; alokasi ke 4 produk.
   - Biaya produksi FCC/UU/UO/Lain-lain; kg premium; tarif FCC dan tarif FG; transfer kg dan Rp.
   - HPP FCC/UU/UO/Lain-lain dan HPP kartu total; pendapatan = GL; margin GL Sep.
   - Sisa rekon HPP Rp 7,21, sama dengan WP.
6. **Roll-forward Agu26_3 → Sep:**
   - 12 saldo awal FCC/UU/UO (kg dan Rp, WIP dan FG) sama, beda ≤ Rp 0,000001.
   - Saldo awal Accurate WIP-067, WIP-139, FG-001, dan FG-101 sama dengan Agu26_3 (≤ Rp 0,01). Saldo awal 1106-001 per item vs LK beda Rp 0,01 (`REKON MATERIAL!C79`).
   - Kolom Agu `CEK KEWAJARAN` bagian 3: 13 input = Agu26_3.
   - 24 input Agu di bridge yang tidak bergantung versi sama dengan Agu26_3 (temuan 1). Margin GL Agu 19,9219 pp = Agu26_3, dan pendapatannya = BP baris 9 Agu (9.793,13 jt).
7. **Angka PRD v2:**
   - §10.1 B2: 22 angka cocok.
   - §10.1 B3: 22 angka cocok (HPP kartu, 6 pos rekon, HPP GL, 9 angka neraca persediaan, K2, 4 kuantitas B21/B22). Pernyataan "sisa 0" tidak cocok (temuan 2).
   - §10.1 B4: bridge 19 angka (start, 17 bar, end) cocok ±0,0001 pp, dengan Σ bar −5,3562 pp. Bagian 2 kewajaran berisi 6 CEK pada basis Agu26_6 (konversi FCC +26,1%, Grup B +37,2%, D +56,7%, E +59,0%, material lain −35,7%, pool variabel −16,7%): PRD v2 benar, sedangkan "7 CEK" di v1 salah.
   - §1: tabel tren 54 angka dan 6 status cocok; poin Sep (produksi, biaya, HPP, pendapatan, margin, FCC, Lain-lain, pool, jam menganggur) cocok.
8. **Kontrol WP:**
   - 183 sel status LULUS, 0 GAGAL.
   - RINGKASAN bagian 5: 9 baris LULUS; sisa terbesar Rp 55,80 (`H46`) pada toleransi Rp 1.000.
   - REKON MATERIAL: 14 cek LULUS (toleransi Rp 1, 100, dan 10.000).
   - REKON PERSEDIAAN: sisa WIP dan FG akhir 0.
9. **Konvensi tanda** (diperiksa manual, konsisten):
   - Pos rekon `REKON & KONTROL!C38:C43`.
   - Ekspor BP `FCC!C139:C153`: biaya negatif, kredit KW 2 dan transfer positif, COGS = −HPP.
   - Bridge: positif = margin naik.
   - KW 2 pada NRV (`C41` negatif saat stok KW 2 turun).
10. **D1–D12 terlihat di WP sesuai PRD:**
    - D1: `CEM-CEM ORI!D54` 332,36 jt vs `F54` 249,72 jt.
    - D2: `BIAYA BERSAMA!C110` = 0; 3.264,8 jam, 61,59 jt.
    - D3: WIP 100%; UU WIP 4.042,5 vs 467,5 kg.
    - D4: lihat temuan 4.
    - D5: `CEK KEWAJARAN!B63:B66` 100 vs 6.419 pcs, 61,69 jt.
    - D6: `REKON PERSEDIAAN!H58` 225.691.966,25.
    - D7: rujukan "ASUMSI no. 3/6/9" tanpa sheet ASUMSI.
    - D8: BUDGET berisi 0 angka.
    - D10: `BIAYA BERSAMA!E7:E22`.
    - D11: `BIAYA BERSAMA!D171` 27,15 jam (estimasi).
    - D12: `FCC!B139:B152` memakai nomor baris BP.
    - D9, D13, dan D14 ada di BP, bukan di WP.

## Tidak bisa diverifikasi, dan tidak berlaku

- Agu26_4 dan Agu26_6 tidak ada di `reference/` (temuan 1).
- Sumber Sep (kartu CoGM, GL per voucher, Inventory Valuation, LK; B-011) juga tidak ada. Sel input biru WP hanya bisa diuji konsistensi internalnya dan silangnya antar sheet, tidak sampai ke dokumen sumber.
- Tren Jan–Jul `CEK KEWAJARAN!B42:H57` diketik dari kartu lama yang juga tidak ada.
- Bagian neraca, arus kas, eliminasi antarperusahaan, dan PSAK 22 dari `verify-financial-model` tidak berlaku untuk WP costing. Cek FS (F01–F07) ada di Fase 1b, dari sheet "BMG Business Plan".

Alat: openpyxl 3.1.5 (`data_only=True` dan `False`), LibreOffice 24.2.7 headless, Python `decimal`. Skrip pemeriksaan tidak di-commit (sekali pakai, di scratchpad sesi); semua bukti di atas menyebut sel sehingga bisa diulang dari `fixtures/month-2026-09/cells.csv`.

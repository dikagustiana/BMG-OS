# Fixture upload (Fase 1)

`2026-09/` berisi satu file per jenis upload B1 untuk September 2026. File ini **sintetis**: dibangun oleh `scripts/make_upload_fixtures.py` dari sel WP Sep26_4 (`fixtures/month-2026-09/cells.csv`). File sumber Fase 1 (ekspor GL Accurate per voucher, Inventory Valuation, LK Sep-26, CoGM R1) belum ada di `reference/` — lihat `docs/open-questions.md` B-011.

- Setiap baris menyebut sel WP sumbernya di kolom `Sumber WP`. Parser mengabaikan kolom ini.
- `python3 -I scripts/make_upload_fixtures.py --check` (CI) membangun ulang dan membandingkan byte per byte. xlsx disimpan tanpa kompresi dengan cap waktu tetap.
- `budget_bp` tidak punya fixture di sini. Tesnya memakai `reference/BMG_Business_Plan_-_Oct26_to_Dec27.xlsx` langsung, dengan golden `fixtures/budget-v1/` dari ekstraktor Fase 0.

| File | Kind | Isi | Sumber WP |
| --- | --- | --- | --- |
| `gl_month.xlsx` | `gl_month` | 24 baris GL per voucher: 16 akun konversi + 5 akun opex yang direklas; judul laporan gaya Accurate | BIAYA BERSAMA bagian 1, 8, 9 |
| `gl_voucher_tag.csv` | `gl_voucher_tag` | 11 tag (reklas opex, THR, tali asih, ongkir singkong, pisau Urschel) | BIAYA BERSAMA bagian 8 |
| `payroll_month.xlsx` | `payroll_month` | sheet Rekap (14 kelompok) + sheet Jurnal (4 jurnal 5101-002) | BIAYA BERSAMA bagian 2, 9 |
| `inventory_valuation.xlsx` | `inventory_valuation` | bahan baku BB (nilai awal, penerimaan, penyesuaian = pemakaian, akhir) + WIP/FG (kuantitas dan nilai awal/akhir) | REKON MATERIAL, REKON PERSEDIAAN bagian 4 |
| `sales_by_item.xlsx` | `sales_by_item` | 23 baris; Σ = 4101-007 = LK | FCC/UU/UO Lampiran A, sheet SKU, KOPERASI, LAIN-LAIN H92 |
| `average_price.xlsx` | `average_price` | 23 material bernilai | REKON MATERIAL (nilai kartu ÷ qty kartu) |
| `cogm_card.xlsx` | `cogm_card` | template BMG: Kuantitas, Material, Driver untuk FCC/UU/UO dan setiap SKU Lain-lain | FCC/UU/UO Lampiran A–B, sheet SKU, KOPERASI, BIAYA BERSAMA bagian 4/5/10 |
| `fs_control.csv` | `fs_control` | 9 angka LK | RINGKASAN B58:B66 |
| `std_master.xlsx` | `std_master` | contoh template standar dari aktual Sep-26 (`STD-CONTOH-SEP26`; **bukan** standar v1 Fase 5a) | FCC/UU/UO, BIAYA BERSAMA |

Satu-satunya aritmetika di generator (selain menyalin angka):

1. **GL 5101-016.** Voucher ongkir singkong dan pisau dari bagian 8 menjadi baris sendiri. Sisanya (871.400) menjadi `SALDO-5101-016`.
2. **Tali asih 5101-002.** Totalnya 67.951.482 (bagian 9), dipecah menjadi MJ26090010 (32.360.982, baris cut-off bagian 8) dan MJ26090026 (sisanya).
3. **Pendapatan FCC.** WP hanya mencatat jumlah FG-001 + 2nd Grade Tawar (FCC!C211). Fixture memberi FG-015 = kg × NRV KW 2 dan sisanya ke FG-001; total sama dengan LK.
4. **Average Price** = nilai kartu ÷ qty kartu (REKON MATERIAL), dibulatkan 4 desimal.
5. **Std contoh** (BOM per kg input, mix, jam/kWh per ton, tarif = pool ÷ driver Sep) hanya untuk menguji alur upload → draft → approve.

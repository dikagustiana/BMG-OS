# fixtures/

Dibangkitkan oleh `python3 -I scripts/extract_fixtures.py` dari `reference/` (sumber dan SHA-256 di `SOURCES.json`). Jangan diedit tangan; `python3 -I scripts/extract_fixtures.py --check` (CI) gagal bila isi berbeda dari ekstraksi baru. SHA-256 setiap file juga dikunci di `tests/snapshots/month-2026-09.json` (`pnpm snapshot:diff`).

| Folder | Isi |
| --- | --- |
| `month-2026-09/` | WP Sep26_4 (golden). `cells.csv`: semua sel tak kosong 22 sheet — `sheet, cell, type (n/s/b/e/d), value, formula`; angka = string desimal persis double Excel (tanpa eksponen, tanpa pembulatan). JSON per area dipecah per bagian sheet (judul kolom A `1.`, `2a.`, `LAMPIRAN B.` …): `summary` (RINGKASAN), `pool` (BIAYA BERSAMA), `fcc`, `uu`, `uo`, `others` (LAIN-LAIN + 9 sheet SKU + KOPERASI), `recon` (REKON & KONTROL + REKON MATERIAL), `inventory` (REKON PERSEDIAAN), `reasonableness` (CEK KEWAJARAN), `bridge` (BRIDGE GP). Baris: `{r, c: {kolom: nilai}, n: [kolom angka], e: [kolom error]}`. `prd_targets.json`: angka target PRD §8 dengan sel WP-nya (golden integritas). |
| `month-2026-08/` | WP Agu26_3: `cells.csv`, `summary.json`, `pool.json`; `bridge_input.json` = input Agu dari BRIDGE GP Sep26_4 C7:C77 (nilai Agu26_6). |
| `budget-v1/` | BP v1 sheet "Business Plan - Model Details": `budget_line.json` (1.034 baris angka × 24 bulan; `driver_code = driver_code_base + '|' + YYYY-MM`), `budget_pool_map.json` (draft dari label "Grup A–E" di bagian 4.1/4.3). |
| `uploads/2026-09/` | **Fase 1**, dibangkitkan `python3 -I scripts/make_upload_fixtures.py` dari `month-2026-09/cells.csv` (bukan dari `reference/`): satu file per jenis upload B1, sintetis dari sel WP karena file sumber asli belum ada (B-011). Lihat `uploads/README.md`. |
| `master/` | Sumber seed `supabase/migrations/20261015000300_master_seed.sql`: product, others_group, sku, material_item, payroll_group, coa_pool_map (Sep-26 + draft Okt-26), assumption. |

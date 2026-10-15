# reference/

File sumber yang disiapkan manusia (PLAN v1 §0). Hanya dibaca oleh `scripts/extract_fixtures.py`; aplikasi dan tes tidak membacanya langsung (tes memakai `fixtures/`). Jangan diedit — versi baru = file baru dengan nama versi baru, lalu ekstraksi ulang dan catat di CHANGELOG.

| File | SHA-256 | Dipakai untuk |
| --- | --- | --- |
| `DI - WP Costing BMG Sep26_4.xlsx` | `9089f5a393a737546fd23dd57cba75fbbfdeb824ad1033c18cca15d077c1a3aa` | Golden bulanan (`fixtures/month-2026-09/`), seed master (produk, kelompok Lain-lain, SKU, material, payroll, mapping akun) |
| `DI - WP Costing BMG Agu26_3.xlsx` | `06ab1c61bfb85373844fbf503c13567071d2b7c2b864333706acf4d8ec8e38d5` | `fixtures/month-2026-08/` (summary, pool, cells); roll-forward FCC yang dirujuk Sep26_4 |
| `WP Costing BMG Agu26.xlsx` | `53eb97f5870d897a5d20704b8eff3d505acb2d68a1f39311ec4ed6ce5fb9fe27` | Sheet ASUMSI (PRD D7) → tabel `assumption`; angka lain sama dengan Agu26_3 |
| `BMG_Business_Plan_-_Oct26_to_Dec27.xlsx` | `19b230326591252bbfb5baf58862730c1edf56e585f87ae94d6c6629e70c8b5d` | BP v1 → `fixtures/budget-v1/` (budget_line, budget_pool_map draft) |

Belum ada (lihat `docs/open-questions.md` §B): `DI - WP Costing BMG Agu26_6.xlsx` (versi yang dipakai BRIDGE GP Sep), WP Jul26 (standar 3 bulan), `CoGM SEPTEMBER 2026 R1.xlsx`, GL Accurate Sep per voucher, Inventory Valuation 1 Agu–30 Sep 2026, LK Sep-26 (IS/BS, Sales by Item) — diperlukan untuk fixture upload Fase 1.

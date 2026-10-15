# BMG-OS

Platform costing dan operasi **PT Boga Makmur Gracia** (SAMB Group): costing bulanan yang mereproduksi workpaper (WP) costing ±Rp 1, engine mingguan (standar, rencana, varian), tutup bulan, outlook dan kas.

- Spesifikasi: [`docs/PRD-v2-bmg-platform.md`](docs/PRD-v2-bmg-platform.md) · rencana fase: [`docs/PLAN-v2-bmg-platform.md`](docs/PLAN-v2-bmg-platform.md) · v1 di [`docs/archive/`](docs/archive/)
- Status dan bukti per fase: [`docs/v1/README.md`](docs/v1/README.md) (Fase 0–1), [`docs/v2/README.md`](docs/v2/README.md) (Fase 1b dst.) · keputusan/selisih: [`docs/open-questions.md`](docs/open-questions.md) · [`CHANGELOG.md`](CHANGELOG.md)
- Aturan kerja untuk Claude Code: [`CLAUDE.md`](CLAUDE.md)

## Struktur

| Path | Isi |
| --- | --- |
| `packages/engine` (`@bmg/engine`) | Engine murni (decimal.js, tanpa I/O): util desimal/tanggal/format, snapshot kanonik, golden; modul domain mulai Fase 2 |
| `packages/parsers` (`@bmg/parsers`) | Parser upload (SheetJS), deteksi header generik; parser per jenis upload mulai Fase 1 |
| `apps/web` (`@bmg/web`) | Next.js 15 App Router + Supabase SSR; login allow-list, peran PRD §2, flag modul, admin |
| `supabase/` | Migrasi (aditif, idempoten), tes RLS per peran |
| `reference/` | Workpaper dan BP sumber (dibaca ekstraktor) |
| `fixtures/` | Golden dan seed hasil `scripts/extract_fixtures.py` |

## Menjalankan

```
pnpm install --frozen-lockfile
pnpm typecheck && pnpm test
pnpm test:golden -- --fixture month-2026-09
pnpm snapshot:diff
pnpm build && pnpm dev            # http://localhost:3000
python3 -I scripts/extract_fixtures.py --check   # openpyxl==3.1.5
supabase start -x studio,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor,realtime && supabase db reset && pnpm test:rls
```

Aplikasi memakai project Supabase BMG-OS secara default (`apps/web/lib/env.ts`); set `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` untuk project lain (mis. lokal).

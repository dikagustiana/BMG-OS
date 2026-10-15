/**
 * Golden suites per fixture (PRD v1 §8; prompt rule 3). Each phase registers the WP cells its engine modules must
 * reproduce. Fase 0 registers the fixture integrity suite: the PRD §8 numbers against the WP cells they cite.
 * Node only (reads fixtures) — used by `pnpm test:golden` and the vitest golden tests.
 */
import { checkTargets, type GoldenResult } from "./golden";
import { loadCells, loadTargets } from "./fixtures";
import { F34_SUITES } from "./golden-f34";

export interface GoldenSuite {
  id: string;
  phase: string;
  description: string;
  run(fixture: string): GoldenResult[];
}

export const SUITES: GoldenSuite[] = [
  {
    id: "prd-targets",
    phase: "F0",
    description: "Angka target PRD §8 = sel WP yang dirujuk (integritas fixture)",
    run: (fixture) => checkTargets(loadCells(fixture), loadTargets(fixture)),
  },
  // Fase 3–4 (B3 rekon, B4 kewajaran / varian / bridge): engine outputs vs WP cells
  ...F34_SUITES,
];

export function numericCellCount(fixture: string): number {
  let n = 0;
  for (const c of loadCells(fixture).values()) if (c.type === "n") n++;
  return n;
}

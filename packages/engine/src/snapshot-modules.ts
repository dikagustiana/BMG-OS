/**
 * Engine modules whose output on the golden month is part of `pnpm snapshot:diff` (prompt rule 3).
 * Each phase appends its modules here (new keys only). Fase 0 has none.
 */
import { f3Snapshot } from "./golden-f34";

export interface SnapshotModule {
  key: string;
  run(fixture: string): unknown;
}

export const SNAPSHOT_MODULES: SnapshotModule[] = [
  // Fase 3 (B3): recon_month, inventory_recon, control_month B17–B20, B23–B30
  { key: "f3.recon", run: (fixture) => f3Snapshot(fixture) },
];

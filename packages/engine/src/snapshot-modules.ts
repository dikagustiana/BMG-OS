/**
 * Engine modules whose output on the golden month is part of `pnpm snapshot:diff` (prompt rule 3).
 * Each phase appends its modules here (new keys only). Fase 0 has none.
 */
export interface SnapshotModule {
  key: string;
  run(fixture: string): unknown;
}

export const SNAPSHOT_MODULES: SnapshotModule[] = [];

/**
 * Engine modules whose output on the golden month is part of `pnpm snapshot:diff` (prompt rule 3).
 * Each phase appends its modules here (new keys only). Fase 0 has none.
 */
import { goldenMonthRows } from "./fixtures-month";
import { loadCells } from "./fixtures";
import { f3Snapshot, f4Snapshot } from "./golden-f34";
import { rebuildMonthFromRows } from "./monthly-costing";
import { serializeMart } from "./mart";

export interface SnapshotModule {
  key: string;
  run(fixture: string): unknown;
}

export const SNAPSHOT_MODULES: SnapshotModule[] = [
  // Fase 2 (B2): pool_month, idle_month, allocation_month, process_card_month, fg_month, others_month, summary_month, control_month
  { key: "f2.costing", run: (fixture) => serializeMart(rebuildMonthFromRows(goldenMonthRows(loadCells(fixture)))) },
  // Fase 3 (B3): recon_month, inventory_recon, control_month B17–B20, B23–B30
  { key: "f3.recon", run: (fixture) => f3Snapshot(fixture) },
  // Fase 4 (B4): reasonableness, kpi_series, variance_month (WP and BP v1), bridge_month, B31–B33, B42–B43
  { key: "f4.analysis", run: (fixture) => f4Snapshot(fixture) },
];

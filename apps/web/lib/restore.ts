/** Soft-deletable tables and their key column (master tables in Fase 0; input tables join in later phases). */
export const RESTORE_KEYS: Record<string, string> = {
  product: "code", others_group: "code", sku: "code", material_item: "id", coa_pool_map: "id", payroll_group: "code",
  assumption: "id", budget_line: "id", budget_pool_map: "id", bom_line: "id", output_mix: "id", routing: "id", rate_card: "id", capacity: "id",
};

export const RESTORABLE = Object.keys(RESTORE_KEYS);

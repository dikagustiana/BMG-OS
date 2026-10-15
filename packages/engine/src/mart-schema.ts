/**
 * Schema of the B2–B4 data marts (PRD v2 §5.4) as data: one spec per table drives the migration SQL (mart-sql.ts, the
 * generator script) and the engine row → database row mapping (`martDbRows`), so a column cannot exist in one and not
 * the other. Pure; no I/O.
 *
 * Conventions: every mart row is keyed by (month, line_key) with one live row per key (soft delete); derived numbers are
 * `numeric(28,10)` (the engine's full precision — the golden compares Rp/kg to ±0,0001); nested parts are `jsonb`;
 * every row carries `rule_id`, `inputs` (what was used) and `source_ref(s)` (WP cell for the golden month).
 * Engine field names `group` and `check` are reserved words in SQL: the columns are `grp` and `check_diff`.
 */
import { Decimal } from "./decimal";
import { canonical } from "./snapshot";

export type ColKind = "text" | "num" | "int" | "bool" | "json" | "textarr" | "date";

export interface MartCol {
  /** Field name on the engine row. */
  n: string;
  /** Column name in the database when it differs from `n`. */
  db?: string;
  k: ColKind;
  /** Nullable column (default: not null). */
  nul?: boolean;
  /** SQL check expression over the column, e.g. `in ('A','B')`. */
  in?: readonly string[];
}

export interface MartSpec {
  table: string;
  /** Written as a comment above the table. */
  note: string;
  /** line_key of an engine row (unique with `month`). */
  key(r: Record<string, unknown>): string;
  cols: readonly MartCol[];
}

const t = (n: string, o: Partial<MartCol> = {}): MartCol => ({ n, k: "text", ...o });
const num = (...names: string[]): MartCol[] => names.map((n) => ({ n, k: "num" as const }));
const numN = (...names: string[]): MartCol[] => names.map((n) => ({ n, k: "num" as const, nul: true }));
const j = (n: string, nul = false): MartCol => ({ n, k: "json", nul });

const s = (v: unknown) => String(v ?? "");
const CONTROL_STATUS = ["LULUS", "GAGAL", "PERIKSA", "BELUM_DIISI"] as const;

export const MART_SPECS: readonly MartSpec[] = [
  // ------------------------------------------------------------------------------------------------- Fase 2
  {
    table: "pool_month", note: "Pool konversi per bulan (BIAYA BERSAMA bagian 3): A, Kupas, B, C, D, E.",
    key: (r) => s(r.pool),
    cols: [t("pool", { in: ["A", "KUPAS", "B", "C", "D", "E"] }), ...num("gl_amount", "adjustment", "total", "fixed", "variable"), j("components")],
  },
  {
    table: "idle_month", note: "Jam menganggur Unit I (BIAYA BERSAMA bagian 5; PSAK 202). Satu baris per bulan.",
    key: () => "idle",
    cols: num("hours_paid", "hours_to_product", "idle_hours", "idle_pct", "rate_per_hour", "idle_cost", "normal_capacity_hours", "idle_to_period", "period_charge"),
  },
  {
    table: "allocation_month", note: "Alokasi pool ke lini: metode aktual dan pembanding metode budget.",
    key: (r) => `${s(r.pool)}|${s(r.line)}|${s(r.method)}`,
    cols: [t("pool"), t("line", { in: ["FCC", "UU", "UO", "LAIN"] }), t("method", { in: ["actual", "budget_compare"] }), t("driver"), ...num("driver_value", "driver_share", "amount"), j("detail")],
  },
  {
    table: "process_card_month", note: "Kartu proses FCC, UU, UO: kg, material, konversi, tarif rata-rata tertimbang.",
    key: (r) => s(r.product),
    cols: [
      t("product", { in: ["FCC", "UU", "UO"] }),
      ...num("kg_input", "kg_premium", "kg_kw2", "kg_waste", "wip_open_kg", "wip_close_kg", "wip_completion_pct"), j("material"), j("conversion"),
      ...num("total_cost", "cost_per_kg_input", "wip_open_value", "kw2_nrv_per_kg", "kw2_nrv_credit", "cost_to_account", "equivalent_kg", "rate_per_kg", "premium_value", "waste_value", "wip_close_value"),
      ...num("premium_pct", "kw2_pct", "waste_pct"), j("per_kg"),
    ],
  },
  {
    table: "fg_month", note: "Barang jadi: rata-rata tertimbang, HPP, persediaan akhir; per produk proses dan per SKU Lain-lain.",
    key: (r) => `${s(r.line)}|${s(r.product_or_sku)}`,
    cols: [
      t("line", { in: ["FCC", "UU", "UO", "LAIN"] }), t("product_or_sku"), t("item_code", { nul: true }), t("unit"),
      ...num("qty_open", "value_open", "value_open_residual", "qty_in", "value_in", "avg_rate", "qty_sold", "cogs_sold", "qty_transfer", "value_transfer", "qty_close_accurate", "value_close",
        "qty_diff", "cogs_qty_diff", "cogs_waste", "qty_kw2_sold", "cogs_kw2_sold", "cogs_total", "revenue", "gross_margin", "gross_margin_pct"),
      j("accurate"),
    ],
  },
  {
    table: "others_month", note: "Lain-lain: kartu per SKU, subtotal per kelompok, dan SKU tanpa kartu.",
    key: (r) => `${s(r.row_kind)}|${s(r.others_group)}|${s(r.sku)}`,
    cols: [
      t("row_kind", { in: ["sku", "group", "no_card"] }), t("others_group", { nul: true }), t("sku", { nul: true }), t("fg_unit"),
      ...num("kg_out", "units_out", "sample_kg", "fcc_in_kg", "kw2_in_kg", "kw2_ubi_in_kg", "man_hour", "kwh", "machine_hour", "fcc_value", "kw2_value", "ext_material", "dl", "foh_b", "foh_cd",
        "foh_e", "foh", "total", "per_kg", "fg_value_open", "fg_value_close", "cogs", "revenue", "margin", "margin_pct"),
    ],
  },
  {
    table: "summary_month", note: "Ringkasan per lini dan total (REKON & KONTROL bagian 1, RINGKASAN bagian 1).",
    key: (r) => s(r.line),
    cols: [t("line", { in: ["FCC", "UU", "UO", "LAIN", "TOTAL"] }), ...num("kg_production", "material_ext", "material_interproduct", "kupas", "dl", "foh", "total_cost", "cost_per_kg", "cogs", "revenue", "gross_margin", "gross_margin_pct")],
  },
  {
    table: "control_month", note: "Kontrol B01–B45 per bulan (satu baris per kode dan lingkup).",
    key: (r) => `${s(r.code)}|${s(r.scope)}`,
    cols: [t("code"), t("scope", { nul: true }), t("label"), ...numN("value", "tolerance"), t("status", { in: CONTROL_STATUS }), t("note", { nul: true }), j("detail", true)],
  },
  // ------------------------------------------------------------------------------------------------- Fase 3
  {
    table: "recon_month", note: "Rekon HPP kartu → GL, varian material, arus KW 2 dan RINGKASAN bagian 5 (32 baris per bulan).",
    key: (r) => s(r.line_key),
    cols: [t("label"), ...numN("wp_amount", "gl_amount", "lk_amount", "difference"), j("explained", true), ...numN("residual", "gl_lk_diff", "qty"), t("status", { nul: true, in: CONTROL_STATUS })],
  },
  {
    table: "inventory_recon", note: "Rekon persediaan per item: REKON MATERIAL (kategori BB) dan REKON PERSEDIAAN (K1–K6).",
    key: (r) => `${s(r.account)}|${s(r.category)}|${s(r.item_code ?? r.item_name)}`,
    cols: [
      t("item_code", { nul: true }), t("item_name", { nul: true }), t("account"), t("category", { in: ["K1", "K2", "K3", "K4", "K5", "K6", "BB"] }),
      ...numN("qty_wp"), ...num("value_wp"), ...numN("qty_acc"), ...num("value_acc", "diff"),
      ...numN("qty_wp_open", "value_wp_open", "qty_acc_open"), ...num("value_acc_open"),
      ...numN("diff_open", "diff_delta", "rate_acc", "rate_wp", "rate_old_card", "old_card_ratio", "qty_diff_value", "qty_diff_value_open"),
      { n: "movement", k: "bool", nul: true }, ...numN("value_in", "usage_card"), j("usage_card_by_line", true), ...numN("usage_acc"), { n: "close_implied", k: "bool", nul: true },
    ],
  },
  // ------------------------------------------------------------------------------------------------- Fase 4
  {
    table: "variance_month", note: "Varian realisasi vs flex budget per produk dan komponen: harga, pemakaian, volume, metode (cek = 0).",
    key: (r) => `${s(r.budget_version) || "-"}|${s(r.product)}|${s(r.level)}|${s(r.component)}`,
    cols: [
      t("product", { in: ["FCC", "UU", "UO", "LAIN"] }), t("component"), t("level", { in: ["item", "group", "total"] }), { n: "group", db: "grp", k: "text", nul: true }, t("label"),
      t("budget_version", { nul: true }), ...numN("qty_per_kg_act", "qty_per_kg_bud", "price_act", "price_bud"), ...num("actual_per_kg", "budget_per_kg", "diff"),
      ...numN("price", "usage", "volume", "method"), { n: "check", db: "check_diff", k: "num", nul: true }, ...num("kg_act", "kg_bud"), ...numN("actual_amount", "budget_amount"),
    ],
  },
  {
    table: "bridge_month", note: "Bridge margin kotor bulan lalu → bulan ini: 17 bar, 6 grup, tampilan direksi, waterfall WP.",
    key: (r) => `${s(r.view)}|${String(r.sort_order).padStart(3, "0")}|${s(r.bar_code)}`,
    cols: [
      { n: "compare_month", k: "date" }, t("view", { in: ["bar", "group", "display", "wp_waterfall"] }), t("bar_code"), t("label"), ...num("pp"),
      { n: "group", db: "grp", k: "text", nul: true }, { n: "sort_order", k: "int" }, { n: "components", k: "textarr" },
    ],
  },
  {
    table: "reasonableness", note: "Kewajaran: tren 8 bulan (bagian 1) dan bulan ke bulan (bagian 2) dengan penjelasan.",
    key: (r) => `${s(r.part)}|${s(r.kpi)}`,
    cols: [
      t("part", { in: ["trend", "mom"] }), t("kpi"), t("label"), t("unit"), ...num("value"), ...numN("compare_value", "min_8m", "max_8m", "delta_pct", "threshold"),
      t("status", { nul: true }), t("explanation", { nul: true }), { n: "explanation_required", k: "bool" },
    ],
  },
  {
    table: "kpi_series", note: "Deret KPI per bulan untuk layar tren (PRD v2 §5.4).",
    key: (r) => s(r.kpi_code),
    cols: [t("product"), t("kpi_code"), t("label"), t("unit"), ...num("value"), ...numN("min_8m", "max_8m"), t("status", { nul: true }), t("note", { nul: true })],
  },
];

export const MART_SPEC_BY_TABLE: ReadonlyMap<string, MartSpec> = new Map(MART_SPECS.map((m) => [m.table, m]));

/** The column name in the database. */
export const dbName = (c: MartCol): string => c.db ?? c.n;

type Row = Record<string, unknown>;

function cell(c: MartCol, v: unknown): unknown {
  if (v === undefined || v === null) {
    if (!c.nul) throw new Error(`Kolom ${c.n} tidak boleh kosong`);
    return null;
  }
  switch (c.k) {
    case "num":
      return v instanceof Decimal ? v.toDecimalPlaces(10).toFixed() : String(v);
    case "json":
      return canonical(v, 10);
    case "textarr":
      return (v as unknown[]).map(String);
    case "int":
      return Number(v);
    case "bool":
      return Boolean(v);
    default:
      return String(v);
  }
}

/** Engine rows → database rows of one month (month + line_key + trace columns + the spec's columns). */
export function martDbRows(table: string, month: string, rows: readonly object[]): Row[] {
  const spec = MART_SPEC_BY_TABLE.get(table);
  if (!spec) throw new Error(`Tabel mart tidak dikenal: ${table}`);
  const seen = new Set<string>();
  return rows.map((o) => {
    const r = o as Row;
    const key = spec.key(r);
    if (seen.has(key)) throw new Error(`${table}: kunci baris ganda ${key}`);
    seen.add(key);
    const out: Row = { month, line_key: key, rule_id: String(r.rule_id ?? ""), inputs: canonical(r.inputs ?? null, 10), source_ref: r.source_ref ?? null, source_refs: canonical(r.source_refs ?? null, 10) };
    for (const c of spec.cols) out[dbName(c)] = cell(c, r[c.n]);
    return out;
  });
}

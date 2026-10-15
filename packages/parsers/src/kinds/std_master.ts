import { D } from "@bmg/engine";
import { good, pick, scale, table, type DbRow, type KindParser } from "../kind";
import { F, type KindDef, type ParsedRow } from "../tables";
import { parseDate, text } from "../values";
import type { Sheet } from "../workbook";

const bomFields = [
  F("product", "Produk", "text", ["product"], true),
  F("material_category", "Kategori material", "text", ["kategori", "material", "sub kelompok"], true),
  F("unit", "Satuan", "text", ["unit"]),
  F("qty_per_kg_input", "Qty per kg input", "number", ["qty per kg", "kebutuhan per kg"], true),
  F("band_low", "Pita bawah", "number", ["batas bawah"]),
  F("band_high", "Pita atas", "number", ["batas atas"]),
];
const mixFields = [
  F("product", "Produk", "text", ["product"], true),
  F("premium_pct", "Premium %", "number", ["premium"], true),
  F("kw2_pct", "KW 2 %", "number", ["kw2 %", "kw 2"]),
  F("waste_pct", "Waste %", "number", ["waste"]),
  F("wip_pct", "WIP %", "number", ["wip"]),
];
const routingFields = [
  F("product", "Produk", "text", ["product"], true),
  F("dept", "Departemen", "text", ["dept", "unit"], true),
  F("hours_per_ton", "Jam per ton", "number", ["man hour per ton"]),
  F("machine_hours_per_ton", "Jam mesin per ton", "number", ["machine hours per ton"]),
  F("kwh_per_ton", "kWh per ton", "number", ["kwh per ton"]),
];
const rateFields = [
  F("pool", "Pool", "text", ["grup"], true),
  F("driver", "Driver", "text", ["dasar alokasi"], true),
  F("rate_variable", "Tarif variabel", "number", ["tarif var"]),
  F("rate_fixed", "Tarif tetap", "number", ["tarif fix"]),
  F("fixed_amount_month", "Biaya tetap per bulan", "number", ["biaya tetap"]),
];
const capFields = [
  F("week_start", "Minggu mulai", "date", ["minggu", "week start"], true),
  F("dept", "Departemen", "text", ["dept", "unit"], true),
  F("headcount", "Headcount", "number", ["jumlah orang"]),
  F("shift_hours", "Jam shift", "number", ["jam per shift"]),
  F("working_days", "Hari kerja", "number", ["hari"]),
  F("machine_hours", "Jam mesin", "number", ["machine hours"]),
  F("normal_capacity_hours", "Kapasitas normal (jam)", "number", ["kapasitas normal", "normal capacity hours"]),
];

export const def: KindDef = {
  kind: "std_master", label: "Master standar (BOM, mix, routing, tarif, kapasitas)", source: "Manual",
  target: "std_version (draft), bom_line, output_mix, routing, rate_card, capacity",
  description: "Template 5 sheet. Kode versi dan tanggal berlaku dibaca dari kepala sheet (Kode versi, Berlaku mulai); hasilnya versi draft baru yang di-approve Finance/Admin di /standar.",
  roles: ["admin", "finance", "ppic"], cadence: "version", fields: bomFields,
};

const PRODUCTS = ["FCC", "UU", "UO"];
const POOLS = { A: ["grup a"], KUPAS: ["kupas"], B: ["grup b"], C: ["grup c"], D: ["grup d"], E: ["grup e"] };
const DRIVERS = {
  man_hour: ["man hour", "manhour"], kg_peeled: ["kg dikupas"], kwh: ["listrik"], machine_hour: ["jam mesin"],
  material_value: ["nilai material"], kg_output: ["kg output", "kg produksi"],
};

/** "Kode versi" / "Berlaku mulai" in the first rows of any sheet (label in one cell, value in the next). */
export function stdHeader(sheets: Sheet[]): { code: string | null; effectiveFrom: string | null } {
  let code: string | null = null, effectiveFrom: string | null = null;
  for (const s of sheets) {
    for (const row of s.rows.slice(0, 10)) {
      for (let i = 0; i + 1 < row.length; i++) {
        const l = (text(row[i]) ?? "").toLowerCase();
        if (l === "kode versi" && !code) code = text(row[i + 1]);
        if (l === "berlaku mulai" && !effectiveFrom) effectiveFrom = parseDate(row[i + 1]);
      }
    }
  }
  return { code, effectiveFrom };
}

export const stdMaster: KindParser = {
  def,
  parse(sheets, ctx) {
    const head = stdHeader(sheets);
    const code = head.code ?? ctx.period;
    const issues: string[] = [];
    if (!head.effectiveFrom) issues.push('Tanggal "Berlaku mulai" tidak ditemukan di kepala sheet');
    const bom = table(sheets, bomFields, { mapping: ctx.mapping, sheet: /^bom/i });
    const mix = table(sheets, mixFields, { sheet: /mix/i });
    const routing = table(sheets, routingFields, { sheet: /routing/i });
    const rate = table(sheets, rateFields, { sheet: /tarif|rate/i });
    const cap = table(sheets, capFields, { sheet: /kapasitas|capacity/i });
    const prod = (r: ParsedRow) => { if (r.values.product && !PRODUCTS.includes(r.values.product)) r.issues.push(`Produk harus FCC, UU, atau UO: "${r.values.product}"`); };
    const pct = (r: ParsedRow, f: string) => { const v = r.values[f]; if (v !== null && (D(v).lt(0) || D(v).gt(1))) r.issues.push(`${f} harus 0–1: ${v}`); };
    const dup = (rows: ParsedRow[], key: (r: ParsedRow) => string, what: string) => {
      const seen = new Set<string>();
      for (const r of rows) {
        const k = key(r);
        if (seen.has(k)) r.issues.push(`Baris ganda (${what}): ${k}`);
        seen.add(k);
      }
    };
    for (const r of bom.rows) prod(r);
    dup(bom.rows, (r) => `${r.values.product}|${r.values.material_category}`, "produk, kategori");
    dup(mix.rows, (r) => `${r.values.product}`, "produk");
    dup(routing.rows, (r) => `${r.values.product}|${r.values.dept}`, "produk, departemen");
    dup(rate.rows, (r) => `${(r.values.pool ?? "").toUpperCase()}`, "pool");
    dup(cap.rows, (r) => `${r.values.week_start}|${r.values.dept}`, "minggu, departemen");
    for (const r of mix.rows) {
      prod(r);
      for (const f of ["premium_pct", "kw2_pct", "waste_pct", "wip_pct"]) pct(r, f);
      const s = ["premium_pct", "kw2_pct", "waste_pct", "wip_pct"].reduce((a, f) => a.plus(D(r.values[f])), D(0));
      if (r.issues.length === 0 && s.minus(1).abs().gt("0.001")) issues.push(`Mix ${r.values.product}: jumlah persentase ${s.toFixed(6)} ≠ 1`);
    }
    for (const r of routing.rows) prod(r);
    const poolOf = new Map<number, string>(), drvOf = new Map<number, string>();
    for (const r of rate.rows) {
      const p = pick(r.values.pool, POOLS), d = pick(r.values.driver, DRIVERS);
      if (!p) r.issues.push(`Pool tidak dikenal: "${r.values.pool}"`); else poolOf.set(r.rowNo, p);
      if (!d) r.issues.push(`Driver tidak dikenal: "${r.values.driver}"`); else drvOf.set(r.rowNo, d);
    }
    for (const r of cap.rows) {
      const w = r.values.week_start;
      if (w && new Date(`${w}T00:00:00Z`).getUTCDay() !== 1) r.issues.push(`Minggu mulai harus Senin: ${w}`);
    }
    const capRows = good(cap.rows);
    const capAllowed = !ctx.role || ["admin", "ppic"].includes(ctx.role);
    if (capRows.length && !capAllowed) issues.push(`Kapasitas hanya bisa diunggah PPIC/Admin: ${capRows.length} baris kapasitas dilewati`);
    const m8 = (v: string | null) => scale(v, 8), m4 = (v: string | null) => scale(v, 4), m2 = (v: string | null) => scale(v, 2);
    const version: DbRow = { code, effective_from: head.effectiveFrom, status: "draft", note: `Upload std_master` };
    return {
      period: code,
      detected: bom.detected, fields: bomFields, rows: [...bom.rows, ...mix.rows, ...routing.rows, ...rate.rows, ...cap.rows],
      sets: [
        { target: "std_version", rows: head.effectiveFrom ? [version] : [] },
        { target: "bom_line", rows: good(bom.rows).map((r) => ({ product: r.values.product, material_category: r.values.material_category, unit: r.values.unit, qty_per_kg_input: m8(r.values.qty_per_kg_input), band_low: m8(r.values.band_low), band_high: m8(r.values.band_high) })) },
        { target: "output_mix", rows: good(mix.rows).map((r) => ({ product: r.values.product, premium_pct: m8(r.values.premium_pct), kw2_pct: m8(r.values.kw2_pct) ?? "0", waste_pct: m8(r.values.waste_pct) ?? "0", wip_pct: m8(r.values.wip_pct) ?? "0" })) },
        { target: "routing", rows: good(routing.rows).map((r) => ({ product: r.values.product, dept: r.values.dept, hours_per_ton: m4(r.values.hours_per_ton), machine_hours_per_ton: m4(r.values.machine_hours_per_ton), kwh_per_ton: m4(r.values.kwh_per_ton) })) },
        { target: "rate_card", rows: good(rate.rows).map((r) => ({ pool: poolOf.get(r.rowNo), driver: drvOf.get(r.rowNo), rate_variable: m4(r.values.rate_variable), rate_fixed: m4(r.values.rate_fixed), fixed_amount_month: m2(r.values.fixed_amount_month) })) },
        { target: "capacity", rows: capAllowed ? capRows.map((r) => ({ week_start: r.values.week_start, dept: r.values.dept, headcount: r.values.headcount === null ? null : D(r.values.headcount).toDecimalPlaces(0).toFixed(), shift_hours: m2(r.values.shift_hours), working_days: m2(r.values.working_days), machine_hours: m2(r.values.machine_hours), normal_capacity_hours: m2(r.values.normal_capacity_hours) })) : [] },
      ],
      issues: [
        `Versi standar "${code}" (draft), berlaku ${head.effectiveFrom ?? "?"}`,
        ...issues,
        ...(bom.detected ? [] : ["Sheet BOM tidak ditemukan"]),
      ],
    };
  },
};

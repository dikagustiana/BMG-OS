import { assertMonth, good, keyed, pick, scale, table, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

const fields = [
  F("line", "Lini", "text", ["produk", "line"], true),
  F("component", "Komponen", "text", ["pos", "component"], true),
  F("amount", "Jumlah", "number", ["nilai", "nilai rp", "amount"], true),
];

export const def: KindDef = {
  kind: "cogm_legacy", label: "Total kartu CoGM lama", source: "Manual", target: "cogm_legacy",
  description: "Total kartu CoGM lama per lini proses (material, upah kupas, tenaga kerja langsung, overhead, total), pembanding kartu baru.",
  roles: ["admin", "cost_accounting"], cadence: "month", fields,
};

const COMPONENTS = {
  material: ["material cost", "bahan", "b.1 material cost"],
  upah_kupas: ["upah kupas", "kupas"],
  direct_labour: ["tenaga kerja langsung", "direct labour", "direct labor", "dl"],
  overhead: ["overhead", "biaya overhead", "foh"],
  total: ["total", "jumlah", "current cost added"],
};
const LINES = ["FCC", "UU", "UO"];

export const cogmLegacy: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const comp = new Map<number, string>();
    for (const r of rows) {
      const c = pick(r.values.component, COMPONENTS);
      if (!c) r.issues.push(`Komponen tidak dikenal: "${r.values.component}"`);
      else comp.set(r.rowNo, c);
      if (r.values.line && !LINES.includes(r.values.line.toUpperCase())) r.issues.push(`Lini harus FCC, UU, atau UO: "${r.values.line}"`);
    }
    const db = keyed(good(rows), (r) => `${r.values.line!.toUpperCase()}|${comp.get(r.rowNo)}`, (r) => ({
      line: r.values.line!.toUpperCase(), component: comp.get(r.rowNo), amount: scale(r.values.amount, 2),
    }), month);
    return { detected, fields, rows, sets: [{ target: "cogm_legacy", rows: db }], issues: detected ? [] : ["Judul kolom (Lini, Komponen, Jumlah) tidak ditemukan"] };
  },
};

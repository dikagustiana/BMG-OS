import { assertMonth, good, keyed, pick, scale, table, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

const fields = [
  F("line", "Lini", "text", ["lini produk", "produk", "sku", "line"], true),
  F("kind", "Jenis", "text", ["jenis saldo", "kind"], true),
  F("item_code", "Kode Barang", "text", ["kode", "kode item", "item code"]),
  F("qty", "Kuantitas", "number", ["kts", "qty", "kg"], true),
  F("value", "Nilai", "number", ["nilai rp", "jumlah", "value"], true),
  F("unit", "Satuan", "text", ["unit", "sat"]),
];

export const def: KindDef = {
  kind: "wp_opening", label: "Saldo awal WIP dan barang jadi (nilai WP)", source: "Manual", target: "wp_opening",
  description: "Saldo awal WIP per lini proses dan barang jadi per produk atau SKU, dinilai pada kartu proses. Hanya untuk bulan pertama di platform; bulan berikutnya diambil dari saldo akhir bulan lalu.",
  roles: ["admin", "cost_accounting"], cadence: "month", fields,
};

const KINDS = { wip: ["wip", "barang setengah jadi", "setengah jadi"], fg: ["fg", "barang jadi"] };

export const wpOpening: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const kind = new Map<number, string>();
    for (const r of rows) {
      const k = pick(r.values.kind, KINDS);
      if (!k) r.issues.push(`Jenis saldo tidak dikenal: "${r.values.kind}" (WIP atau FG)`);
      else kind.set(r.rowNo, k);
    }
    const db = keyed(good(rows), (r) => {
      const k = kind.get(r.rowNo)!;
      return `${k}|${k === "wip" ? r.values.line : r.values.item_code ?? r.values.line}`;
    }, (r) => ({
      line: r.values.line, kind: kind.get(r.rowNo), item_code: r.values.item_code, qty: scale(r.values.qty, 4), value: scale(r.values.value, 2), unit: r.values.unit,
    }), month);
    return { detected, fields, rows, sets: [{ target: "wp_opening", rows: db }], issues: detected ? [] : ["Judul kolom (Lini, Jenis, Kuantitas, Nilai) tidak ditemukan"] };
  },
};

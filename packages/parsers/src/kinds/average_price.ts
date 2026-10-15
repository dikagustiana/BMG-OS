import { assertMonth, good, keyed, scale, table, warnRows, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";
import { norm } from "../values";

const fields = [
  F("item_name", "Nama Barang", "text", ["nama item", "item", "barang", "material"], true),
  F("item_code", "Kode Barang", "text", ["kode", "no barang", "kode item"]),
  F("unit", "Satuan", "text", ["unit", "sat"]),
  F("price", "Harga Rata-rata", "number", ["harga rata rata", "harga rata2", "average price", "harga", "avg price"], true),
];

export const def: KindDef = {
  kind: "average_price", label: "Average Price (harga rata-rata material)", source: "Accurate", target: "average_price",
  description: "Harga rata-rata per material bulan ini; nama harus sama dengan master material (nama Average Price).",
  roles: ["admin", "finance"], cadence: "month", fields,
};

export const averagePrice: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const items = ctx.masters?.materialItems ?? [];
    const byName = new Map(items.map((m) => [norm(m.name), m]));
    const unmapped: { rowNo: number; text: string }[] = [];
    for (const r of rows) {
      if (!r.values.item_name) continue;
      const hit = byName.get(norm(r.values.item_name));
      if (hit) r.values.item_code = r.values.item_code ?? hit.code;
      else if (items.length) unmapped.push({ rowNo: r.rowNo, text: r.values.item_name });
    }
    const db = keyed(good(rows), (r) => norm(r.values.item_name), (r) => ({
      item_name: r.values.item_name, item_code: r.values.item_code, unit: r.values.unit, price: scale(r.values.price, 4),
    }), month);
    return {
      detected, fields, rows, sets: [{ target: "average_price", rows: db }],
      issues: [
        ...(detected ? [] : ["Judul kolom Average Price tidak ditemukan (perlu Nama Barang dan Harga)"]),
        ...warnRows("Item tak terpeta ke master material", unmapped),
      ],
    };
  },
};

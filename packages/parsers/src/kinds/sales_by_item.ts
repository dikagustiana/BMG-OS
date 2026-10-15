import { assertMonth, good, keyed, pick, scale, table, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

const fields = [
  F("item_code", "Kode Barang", "text", ["kode", "no barang", "item no", "kode item"]),
  F("item_name", "Nama Barang", "text", ["deskripsi barang", "nama item", "item name", "barang"], true),
  F("qty", "Kuantitas", "number", ["kts", "qty", "quantity", "kts terjual"]),
  F("unit", "Satuan", "text", ["unit", "sat"]),
  F("amount", "Jumlah", "number", ["total", "nilai", "penjualan", "amount", "jumlah penjualan", "total penjualan"], true),
  F("customer_group", "Grup Pelanggan", "text", ["pelanggan", "customer group", "grup", "kelompok pelanggan"]),
];

export const def: KindDef = {
  kind: "sales_by_item", label: "Sales by Item (LK)", source: "Accurate", target: "sales_by_item",
  description: "Penjualan per barang bulan ini: kuantitas, satuan, jumlah (Rp), grup pelanggan (IFM, KGS, retail, maklon).",
  roles: ["admin", "finance"], cadence: "month", fields,
};

const GROUPS = { IFM: ["indofood", "ifm"], KGS: ["kgs"], retail: ["ritel", "retail", "koperasi"], maklon: ["maklon"] };

export const salesByItem: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const grp = new Map<number, string | null>();
    for (const r of rows) {
      const g = pick(r.values.customer_group, GROUPS);
      if (g === undefined) r.issues.push(`Grup pelanggan tidak dikenal: "${r.values.customer_group}" (IFM, KGS, retail, maklon)`);
      else grp.set(r.rowNo, g);
    }
    const db = keyed(good(rows), (r) => `${r.values.item_code ?? r.values.item_name}|${grp.get(r.rowNo) ?? ""}`, (r) => ({
      item_code: r.values.item_code, item_name: r.values.item_name, unit: r.values.unit, qty: scale(r.values.qty, 4),
      amount: scale(r.values.amount, 2), customer_group: grp.get(r.rowNo) ?? null,
    }), month);
    return {
      detected, fields, rows, sets: [{ target: "sales_by_item", rows: db }],
      issues: detected ? [] : ["Judul kolom Sales by Item tidak ditemukan (perlu Nama Barang dan Jumlah)"],
    };
  },
};

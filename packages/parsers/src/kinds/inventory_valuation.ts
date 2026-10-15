import { assertMonth, good, keyed, scale, table, warnRows, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

const fields = [
  F("item_code", "Kode Barang", "text", ["kode", "no barang", "no. barang", "item no", "kode item"], true),
  F("item_name", "Nama Barang", "text", ["deskripsi barang", "nama item", "item name", "keterangan barang"]),
  F("account", "Akun", "text", ["akun persediaan", "no akun", "kode akun"]),
  F("qty_open", "Kts. Awal", "number", ["kts awal", "kuantitas awal", "qty awal", "saldo awal kts"]),
  F("value_open", "Nilai Awal", "number", ["saldo awal nilai", "nilai saldo awal"]),
  F("qty_in", "Kts. Masuk", "number", ["kts masuk", "kuantitas masuk", "qty masuk"]),
  F("value_in", "Nilai Masuk", "number", ["nilai penerimaan"]),
  F("qty_out_sale", "Kts. Keluar", "number", ["kts keluar", "kuantitas keluar", "kts terjual", "qty keluar"]),
  F("value_out_sale", "Nilai Keluar", "number", ["nilai terjual", "nilai pengiriman"]),
  F("qty_out_transfer", "Kts. Transfer", "number", ["kts transfer", "kts pindah"]),
  F("value_out_transfer", "Nilai Transfer", "number", ["nilai pindah"]),
  F("qty_adj", "Kts. Penyesuaian", "number", ["kts penyesuaian", "kuantitas penyesuaian"]),
  F("value_adj", "Nilai Penyesuaian", "number", ["nilai penyesuaian persediaan"]),
  F("qty_close", "Kts. Akhir", "number", ["kts akhir", "kuantitas akhir", "qty akhir", "saldo akhir kts"]),
  F("value_close", "Nilai Akhir", "number", ["saldo akhir nilai", "nilai saldo akhir"]),
];

export const def: KindDef = {
  kind: "inventory_valuation", label: "Inventory Valuation Accurate (rincian valuasi persediaan)", source: "Accurate",
  target: "inventory_valuation",
  description: "Kuantitas dan nilai per barang: awal, masuk, keluar (jual), transfer, penyesuaian, akhir. Akun kosong diturunkan dari kode (BB → 1106-001, WIP → 1106-002, FG → 1106-003).",
  roles: ["admin", "finance"], cadence: "month", fields,
};

export function accountOfItem(code: string): string | null {
  return code.startsWith("BB-") ? "1106-001" : code.startsWith("WIP-") ? "1106-002" : code.startsWith("FG-") ? "1106-003" : null;
}

export const inventoryValuation: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const known = new Set((ctx.masters?.materialItems ?? []).map((m) => m.code).filter((c): c is string => !!c));
    const unmapped: { rowNo: number; text: string }[] = [];
    const noAccount: { rowNo: number; text: string }[] = [];
    for (const r of rows) {
      const code = r.values.item_code;
      if (!code) continue;
      if (!r.values.account) {
        r.values.account = accountOfItem(code);
        if (!r.values.account) noAccount.push({ rowNo: r.rowNo, text: code });
      }
      if (known.size && code.startsWith("BB-") && !known.has(code)) unmapped.push({ rowNo: r.rowNo, text: `${code} ${r.values.item_name ?? ""}`.trim() });
    }
    const q = (v: string | null) => scale(v, 4), m = (v: string | null) => scale(v, 2);
    const db = keyed(good(rows), (r) => `${r.values.item_code}`, (r) => ({
      item_code: r.values.item_code, item_name: r.values.item_name, account: r.values.account,
      qty_open: q(r.values.qty_open), value_open: m(r.values.value_open), qty_in: q(r.values.qty_in), value_in: m(r.values.value_in),
      qty_out_sale: q(r.values.qty_out_sale), value_out_sale: m(r.values.value_out_sale),
      qty_out_transfer: q(r.values.qty_out_transfer), value_out_transfer: m(r.values.value_out_transfer),
      qty_adj: q(r.values.qty_adj), value_adj: m(r.values.value_adj), qty_close: q(r.values.qty_close), value_close: m(r.values.value_close),
    }), month);
    return {
      detected, fields, rows, sets: [{ target: "inventory_valuation", rows: db }],
      issues: [
        ...(detected ? [] : ["Judul kolom Inventory Valuation tidak ditemukan (perlu Kode Barang)"]),
        ...warnRows("Item bahan baku tak terpeta ke material_item", unmapped),
        ...warnRows("Akun persediaan tidak diketahui", noAccount),
      ],
    };
  },
};

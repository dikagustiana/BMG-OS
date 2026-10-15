import { good, keyed, pick, scale, table, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

const fields = [
  F("month", "Bulan", "date", ["periode", "month"], true),
  F("kind", "Jenis", "text", ["jenis riwayat", "kind"], true),
  F("product", "Produk", "text", ["lini", "product"]),
  F("key", "Kode", "text", ["pos", "kode pos", "key"], true),
  F("value", "Nilai", "number", ["jumlah", "value"], true),
  F("unit", "Satuan", "text", ["unit", "sat"]),
  F("source_ref", "Sumber", "text", ["sel wp", "referensi", "source"]),
];

export const def: KindDef = {
  kind: "history_cost", label: "Riwayat biaya (kartu lama, bulan lalu, bridge)", source: "Manual", target: "history_cost_line",
  description: "Riwayat sebelum platform: 16 angka kartu lama FCC per bulan (kewajaran tren), 13 angka bulan sebelumnya (kewajaran bulan ke bulan), dan 71 masukan bridge bulan sebelumnya.",
  roles: ["admin", "cost_accounting"], cadence: "month", fields,
};

const KINDS = {
  old_card_fcc: ["kartu lama fcc", "kartu lama"],
  mom_prior: ["bulan sebelumnya", "bulan lalu", "mom"],
  bridge_prior: ["bridge bulan sebelumnya", "bridge"],
};

export const historyCost: KindParser = {
  def,
  parse(sheets, ctx) {
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const kind = new Map<number, string>();
    for (const r of rows) {
      const k = pick(r.values.kind, KINDS);
      if (!k) r.issues.push(`Jenis riwayat tidak dikenal: "${r.values.kind}"`);
      else kind.set(r.rowNo, k);
      if (r.values.month && !/-01$/.test(r.values.month)) r.issues.push(`Bulan harus tanggal 1: ${r.values.month}`);
    }
    const ok = good(rows);
    const db = keyed(ok, (r) => `${r.values.month}|${kind.get(r.rowNo)}|${r.values.product ?? ""}|${r.values.key}`, (r) => ({
      month: r.values.month, kind: kind.get(r.rowNo), product: r.values.product, key: r.values.key, value: scale(r.values.value, 10), unit: r.values.unit, source_ref: r.values.source_ref,
    }));
    return { detected, fields, rows, sets: [{ target: "history_cost_line", rows: db }], issues: detected ? [] : ["Judul kolom (Bulan, Jenis, Kode, Nilai) tidak ditemukan"] };
  },
};

import { assertMonth, good, keyed, pick, scale, table, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

const fields = [
  F("key", "Kunci", "text", ["kode", "key"]),
  F("label", "Pos", "text", ["uraian", "keterangan", "akun"]),
  F("amount", "Nilai", "number", ["jumlah", "nilai rp", "amount"], true),
];

export const def: KindDef = {
  kind: "fs_control", label: "Angka kontrol LK (9 angka IS/BS)", source: "Manual", target: "fs_control",
  description: "Pendapatan 4101-007, pemakaian bahan baku, biaya konversi 16 akun, total COGS, persediaan 1106-001 akhir, 1106-002 dan 1106-003 awal/akhir.",
  roles: ["admin", "finance"], cadence: "month", fields,
};

/** The 9 LK figures (WP RINGKASAN bagian 6) with the labels used in the LK and the WP. */
export const FS_KEYS = {
  revenue_4101_007: ["pendapatan 4101-007", "pendapatan", "revenue"],
  material_usage: ["pemakaian bahan baku"],
  conversion_16: ["biaya konversi pabrik (16 akun 5101-002 s/d 5101-016, 6500-006/007)", "biaya konversi pabrik", "biaya konversi"],
  cogs: ["total cost of goods sold", "cogs", "hpp"],
  inv_1106_001_close: ["persediaan bahan baku 1106-001, akhir bulan", "persediaan bahan baku akhir"],
  inv_1106_002_open: ["persediaan barang setengah jadi 1106-002, awal bulan", "persediaan wip awal"],
  inv_1106_002_close: ["persediaan barang setengah jadi 1106-002, akhir bulan", "persediaan wip akhir"],
  inv_1106_003_open: ["persediaan barang jadi 1106-003, awal bulan", "persediaan barang jadi awal"],
  inv_1106_003_close: ["persediaan barang jadi 1106-003, akhir bulan", "persediaan barang jadi akhir"],
};
export type FsKey = keyof typeof FS_KEYS;

export const fsControl: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const keyOf = new Map<number, FsKey>();
    for (const r of rows) {
      const k = pick(r.values.key, FS_KEYS) ?? pick(r.values.label, FS_KEYS);
      if (!k) r.issues.push(`Pos LK tidak dikenal: "${r.values.key ?? r.values.label}"`);
      else if ([...keyOf.values()].includes(k)) r.issues.push(`Pos LK ganda: ${k}`);
      else keyOf.set(r.rowNo, k);
    }
    const ok = good(rows);
    const missing = (Object.keys(FS_KEYS) as FsKey[]).filter((k) => !ok.some((r) => keyOf.get(r.rowNo) === k));
    const db = keyed(ok, (r) => keyOf.get(r.rowNo)!, (r) => ({
      key: keyOf.get(r.rowNo), amount: scale(r.values.amount, 2), source_ref: r.values.label,
    }), month);
    return {
      detected, fields, rows, sets: [{ target: "fs_control", rows: db }],
      issues: [
        ...(detected ? [] : ["Judul kolom (Kunci/Pos, Nilai) tidak ditemukan"]),
        ...(missing.length ? [`Angka LK belum lengkap (${missing.length} dari 9): ${missing.join(", ")}`] : []),
      ],
    };
  },
};

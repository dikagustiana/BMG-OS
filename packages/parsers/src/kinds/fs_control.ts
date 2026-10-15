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

/** Optional keys for the F3 recon (WP blue cells: GL 1106-xxx movements, LK sheet PL HPP). Not required for a complete upload. */
export const FS_KEYS_RECON = {
  gl_revenue_4101_007: ["pendapatan gl 4101-007", "gl pendapatan 4101-007"],
  gl_1106_001_receipts: ["gl 1106-001 penerimaan", "penerimaan bahan baku gl"],
  gl_1106_001_usage: ["gl 1106-001 pemakaian", "pemakaian bahan baku gl"],
  gl_1106_002_movement: ["gl 1106-002 mutasi", "mutasi wip gl"],
  gl_1106_003_movement: ["gl 1106-003 mutasi", "mutasi barang jadi gl"],
  pl_hpp_open: ["lk pl hpp saldo bahan baku awal", "hpp saldo awal"],
  pl_hpp_receipts: ["lk pl hpp penerimaan", "hpp penerimaan"],
  pl_hpp_usage: ["lk pl hpp pemakaian", "hpp pemakaian"],
  pl_hpp_close: ["lk pl hpp saldo bahan baku akhir", "hpp saldo akhir"],
};
export type FsKey = keyof typeof FS_KEYS;
const ALL_KEYS: Record<string, string[]> = { ...FS_KEYS, ...FS_KEYS_RECON };

export const fsControl: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const keyOf = new Map<number, string>();
    for (const r of rows) {
      const k = pick(r.values.key, ALL_KEYS) ?? pick(r.values.label, ALL_KEYS);
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

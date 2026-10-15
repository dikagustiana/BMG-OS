import { assertMonth, good, keyed, pick, scale, table, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

const fields = [
  F("voucher", "Voucher", "text", ["no sumber", "no voucher", "no bukti", "nomor"], true),
  F("account", "Akun", "text", ["no akun", "kode akun"], true),
  F("amount", "Jumlah", "number", ["nilai", "amount", "rp"], true),
  F("tag", "Tag", "text", ["jenis", "jenis tag"], true),
  F("target_pool", "Pool tujuan", "text", ["pool", "tujuan", "masuk ke"], true),
  F("target_line", "Lini", "text", ["produk", "lini tujuan"]),
  F("note", "Catatan", "text", ["keterangan", "uraian"]),
];

export const def: KindDef = {
  kind: "gl_voucher_tag", label: "Tag voucher GL (reklas, THR, tali asih, ongkir, pisau)", source: "Manual", target: "gl_voucher_tag",
  description: "Penyesuaian di luar saldo 16 akun (BIAYA BERSAMA bagian 8): voucher, akun, jumlah, tag, pool tujuan.",
  roles: ["admin", "finance"], cadence: "month", fields,
};

export const TAGS = {
  reklas_opex: ["reklas opex", "reklas", "opex pabrik"],
  thr_swap: ["thr swap", "thr tertukar", "thr"],
  tali_asih_cutoff: ["tali asih cutoff", "tali asih", "cut off tali asih"],
  ongkir_singkong: ["ongkir singkong", "ongkos kirim singkong", "ongkir"],
  pisau_urschel: ["pisau urschel", "pisau", "pisau potong urschel"],
} as const;

export const TAG_POOLS = {
  A: ["grup a"], KUPAS: ["kupas"], B: ["grup b"], C: ["grup c"], D: ["grup d"], E: ["grup e"],
  MATERIAL: ["material"], THR: [], BPJS: [], OPEX_PABRIK: ["opex pabrik"], NONE: ["tidak ada"],
} as const;

export const glVoucherTag: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const parsed = new Map<number, { tag: string; pool: string }>();
    for (const r of rows) {
      const tag = pick(r.values.tag, TAGS as unknown as Record<keyof typeof TAGS, string[]>);
      const pool = pick(r.values.target_pool?.replace(/\s*[–-].*$/, "") ?? null, TAG_POOLS as unknown as Record<keyof typeof TAG_POOLS, string[]>);
      if (!tag) r.issues.push(`Tag tidak dikenal: "${r.values.tag}" (${Object.keys(TAGS).join(", ")})`);
      if (!pool) r.issues.push(`Pool tujuan tidak dikenal: "${r.values.target_pool}"`);
      if (pool === "MATERIAL" && !r.values.target_line) r.issues.push("Pool MATERIAL perlu lini (mis. FCC)");
      if (tag && pool) parsed.set(r.rowNo, { tag, pool });
    }
    const ok = good(rows);
    const db = keyed(ok, (r) => `${r.values.voucher}|${r.values.account}|${parsed.get(r.rowNo)!.tag}`, (r) => ({
      voucher: r.values.voucher, account: r.values.account, amount: scale(r.values.amount, 2),
      tag: parsed.get(r.rowNo)!.tag, target_pool: parsed.get(r.rowNo)!.pool, target_line: r.values.target_line, note: r.values.note,
    }), month);
    return {
      detected, fields, rows, sets: [{ target: "gl_voucher_tag", rows: db }],
      issues: detected ? [] : ["Judul kolom tag voucher tidak ditemukan"],
    };
  },
};

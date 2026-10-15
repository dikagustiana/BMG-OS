import { D } from "@bmg/engine";
import { assertMonth, good, keyed, scale, table, warnRows, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

const fields = [
  F("txn_date", "Tanggal", "date", ["tgl", "date", "tgl transaksi", "tanggal transaksi"]),
  F("voucher", "No. Sumber", "text", ["no sumber", "nomor sumber", "no bukti", "no. bukti", "nomor bukti", "no transaksi", "no. transaksi", "voucher", "no voucher", "source no", "nomor"]),
  F("description", "Keterangan", "text", ["deskripsi", "description", "uraian", "memo"]),
  F("account", "No. Akun", "text", ["no akun", "kode akun", "nomor akun", "akun", "account no", "account"], true),
  F("account_name", "Nama Akun", "text", ["account name", "nama perkiraan"]),
  F("debit", "Debit", "number", ["debet", "debit idr"]),
  F("credit", "Kredit", "number", ["credit", "kredit idr"]),
];

export const def: KindDef = {
  kind: "gl_month", label: "GL Accurate per voucher (bulanan)", source: "Accurate", target: "gl_month",
  description: "Buku besar Accurate per akun per voucher untuk satu bulan; net = debit − kredit.",
  roles: ["admin", "finance"], cadence: "month", fields,
};

/** Accounts look like 5101-002 / 6500-006; a row without one is a heading or total. */
const ACCOUNT = /^\d{4}-\d{3}$/;

export const glMonth: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const outside: { rowNo: number; text: string }[] = [];
    for (const r of rows) {
      const a = r.values.account;
      if (a !== null && !ACCOUNT.test(a)) r.issues.push(`No. akun tidak berformat 9999-999: "${a}"`);
      if (r.values.debit === null && r.values.credit === null) r.issues.push("Debit dan kredit kosong");
      const d = r.values.txn_date;
      if (d && d.slice(0, 7) !== month.slice(0, 7)) outside.push({ rowNo: r.rowNo, text: `${d}` });
    }
    const ok = good(rows);
    const db = keyed(ok, (r) => `${r.values.account}|${r.values.voucher ?? ""}|${r.values.txn_date ?? ""}`, (r) => {
      const debit = scale(r.values.debit ?? "0", 2)!, credit = scale(r.values.credit ?? "0", 2)!;
      return {
        account: r.values.account, account_name: r.values.account_name, txn_date: r.values.txn_date, voucher: r.values.voucher,
        description: r.values.description, debit, credit, net: D(debit).minus(credit).toFixed(),
      };
    }, month);
    return {
      detected, fields, rows,
      sets: [{ target: "gl_month", rows: db }],
      issues: [
        ...(detected ? [] : ["Judul kolom GL tidak ditemukan (perlu kolom No. Akun dan Debit/Kredit)"]),
        ...warnRows("Tanggal di luar bulan upload", outside),
      ],
    };
  },
};

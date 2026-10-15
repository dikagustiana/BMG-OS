import { D } from "@bmg/engine";
import { assertMonth, good, keyed, scale, table, warnRows, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

/**
 * Trial balance / LK Accurate per account for one month (PRD v2 §6.1 `tb_month`, Fase 1b) → tb_month.
 * Balances are debit-positive (debit − credit). Accepted layouts: signed "Saldo Awal" / "Saldo Akhir" columns, or
 * debit/credit pairs ("Saldo Akhir Debit" + "Saldo Akhir Kredit"); the month's movement is "Debit" / "Kredit".
 */
const fields = [
  F("account", "No. Akun", "text", ["no akun", "kode akun", "nomor akun", "akun", "account no", "account", "no. perkiraan", "kode perkiraan"], true),
  F("account_name", "Nama Akun", "text", ["account name", "nama perkiraan", "keterangan", "deskripsi"]),
  F("balance_open", "Saldo Awal", "number", ["saldo awal", "opening balance", "beginning balance"]),
  F("open_debit", "Saldo Awal Debit", "number", ["saldo awal (debit)", "saldo awal debet"]),
  F("open_credit", "Saldo Awal Kredit", "number", ["saldo awal (kredit)", "saldo awal credit"]),
  F("debit", "Debit", "number", ["debet", "mutasi debit", "mutasi debet", "debit idr"]),
  F("credit", "Kredit", "number", ["credit", "mutasi kredit", "kredit idr"]),
  F("balance_close", "Saldo Akhir", "number", ["saldo akhir", "closing balance", "ending balance", "saldo"]),
  F("close_debit", "Saldo Akhir Debit", "number", ["saldo akhir (debit)", "saldo akhir debet"]),
  F("close_credit", "Saldo Akhir Kredit", "number", ["saldo akhir (kredit)", "saldo akhir credit"]),
];

export const def: KindDef = {
  kind: "tb_month", label: "Neraca saldo Accurate (bulanan)", source: "Accurate", target: "tb_month",
  description: "Neraca saldo per akun untuk satu bulan: saldo awal, mutasi debit/kredit, saldo akhir. Dasar neraca dan laba rugi mulai Sep-26.",
  roles: ["admin", "finance"], cadence: "month", fields,
};

/** Accurate account numbers: 1105-001, 1105-1, 6600, 210102. */
const ACCOUNT = /^\d{4}(-[0-9A-Za-z]+)?$|^\d{6}$/;

export const tbMonth: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const { detected, rows } = table(sheets, fields, { mapping: ctx.mapping });
    const pair = (a: string | null, b: string | null) => (a === null && b === null ? null : D(a ?? "0").minus(b ?? "0"));
    const noClose: { rowNo: number; text: string }[] = [];
    for (const r of rows) {
      const a = r.values.account;
      if (a !== null && !ACCOUNT.test(a)) r.issues.push(`No. akun tidak dikenali: "${a}"`);
      const close = r.values.balance_close ?? pair(r.values.close_debit, r.values.close_credit)?.toFixed() ?? null;
      if (close === null) noClose.push({ rowNo: r.rowNo, text: a ?? "?" });
    }
    const ok = good(rows);
    const db = keyed(ok, (r) => String(r.values.account), (r) => {
      const v = r.values;
      const open = v.balance_open ?? pair(v.open_debit, v.open_credit)?.toFixed() ?? null;
      const close = v.balance_close ?? pair(v.close_debit, v.close_credit)?.toFixed() ?? "0";
      const debit = scale(v.debit ?? "0", 2)!, credit = scale(v.credit ?? "0", 2)!;
      return {
        account: v.account, account_name: v.account_name, balance_open: scale(open, 2), debit, credit,
        balance_close: scale(close, 2),
      };
    }, month);
    const dupes = db.length - new Set(db.map((r) => r.account)).size;
    return {
      detected, fields, rows,
      sets: [{ target: "tb_month", rows: db }],
      issues: [
        ...(detected ? [] : ["Judul kolom neraca saldo tidak ditemukan (perlu kolom No. Akun dan Saldo Akhir)"]),
        ...warnRows("Saldo akhir kosong (dianggap 0)", noClose),
        ...(dupes ? [`${dupes} akun muncul lebih dari sekali; baris dijumlah sebagai baris terpisah`] : []),
      ],
    };
  },
};

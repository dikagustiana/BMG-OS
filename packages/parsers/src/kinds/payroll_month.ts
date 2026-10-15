import { assertMonth, good, keyed, pick, scale, table, warnRows, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";
import { norm } from "../values";

const rekapFields = [
  F("group", "Kelompok", "text", ["kelompok karyawan", "group", "jenis karyawan"], true),
  F("dept", "Unit / Departemen", "text", ["unit", "departemen", "dept", "bagian"]),
  F("amount", "Jumlah", "number", ["nilai", "total", "amount", "rp"], true),
];
const jurnalFields = [
  F("kind", "Jenis", "text", ["jenis jurnal", "komponen"], true),
  F("voucher", "Voucher", "text", ["no sumber", "no voucher", "no bukti", "jurnal"]),
  F("amount", "Jumlah", "number", ["nilai", "total", "amount", "rp"], true),
];

export const def: KindDef = {
  kind: "payroll_month", label: "Payroll per kelompok + jurnal 5101-002", source: "Manual", target: "payroll_month, payroll_journal",
  description: "Sheet Rekap (kelompok, unit/departemen, jumlah) dan sheet Jurnal (upah harian, gaji staf, tali asih per voucher).",
  roles: ["admin", "finance"], cadence: "month", fields: rekapFields,
};

const JOURNAL_KINDS = {
  upah_harian: ["upah harian", "upah langsung", "jurnal upah langsung"],
  gaji_staf: ["gaji staf", "gaji staf pabrik", "staf"],
  tali_asih: ["tali asih"],
};

export const payrollMonth: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const rekap = table(sheets, rekapFields, { mapping: ctx.mapping, sheet: /rekap/i });
    const jurnal = table(sheets, jurnalFields, { sheet: /jurnal/i });
    const groups = ctx.masters?.payrollGroups ?? [];
    const codeOf = new Map<number, string>();
    const unmapped: { rowNo: number; text: string }[] = [];
    for (const r of rekap.rows) {
      const g = norm(r.values.group), d = norm(r.values.dept);
      const hit = groups.find((x) => norm(x.name) === g && norm(x.dept ?? "") === d)
        ?? groups.find((x) => norm(x.code) === g);
      if (hit) codeOf.set(r.rowNo, hit.code);
      else if (groups.length) {
        r.issues.push(`Kelompok tak terpeta ke payroll_group: "${r.values.group} / ${r.values.dept ?? ""}"`);
        unmapped.push({ rowNo: r.rowNo, text: `${r.values.group} / ${r.values.dept ?? ""}` });
      } else codeOf.set(r.rowNo, `${r.values.group}|${r.values.dept ?? ""}`);
    }
    const kindOf = new Map<number, string>();
    for (const r of jurnal.rows) {
      const k = pick(r.values.kind, JOURNAL_KINDS);
      if (!k) r.issues.push(`Jenis jurnal tidak dikenal: "${r.values.kind}" (upah harian, gaji staf, tali asih)`);
      else kindOf.set(r.rowNo, k);
    }
    const pm = keyed(good(rekap.rows), (r) => codeOf.get(r.rowNo)!, (r) => ({
      payroll_group_code: codeOf.get(r.rowNo), amount: scale(r.values.amount, 2),
    }), month);
    const pj = keyed(good(jurnal.rows), (r) => `${kindOf.get(r.rowNo)}|${r.values.voucher ?? ""}`, (r) => ({
      kind: kindOf.get(r.rowNo), voucher: r.values.voucher, amount: scale(r.values.amount, 2),
    }), month);
    return {
      detected: rekap.detected, fields: rekapFields, rows: [...rekap.rows, ...jurnal.rows],
      sets: [{ target: "payroll_month", rows: pm }, { target: "payroll_journal", rows: pj }],
      issues: [
        ...(rekap.detected ? [] : ["Sheet Rekap (Kelompok, Jumlah) tidak ditemukan"]),
        ...(jurnal.detected ? [] : ["Sheet Jurnal (Jenis, Jumlah) tidak ditemukan — kontrol B02 akan BELUM DIISI"]),
        ...warnRows("Kelompok tak terpeta", unmapped),
      ],
    };
  },
};

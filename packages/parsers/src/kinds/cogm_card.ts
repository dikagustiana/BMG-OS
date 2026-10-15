import { assertMonth, good, keyed, pick, scale, table, warnRows, type KindParser } from "../kind";
import { F, type KindDef } from "../tables";

const qtyFields = [
  F("line", "Lini", "text", ["line", "produk", "sku", "kelompok"], true),
  F("row_kind", "Jenis", "text", ["jenis baris", "pos", "row kind"], true),
  F("qty", "Qty", "number", ["kuantitas", "kg", "jumlah"], true),
  F("unit", "Satuan", "text", ["unit"]),
];
const matFields = [
  F("line", "Lini", "text", ["line", "produk", "sku"], true),
  F("item_name", "Material", "text", ["nama material", "bahan", "item"], true),
  F("material_group", "Kelompok", "text", ["kelompok bp", "grup", "group"]),
  F("qty", "Qty", "number", ["kuantitas"]),
  F("unit", "Satuan", "text", ["unit"]),
  F("price_card", "Harga kartu", "number", ["harga", "harga satuan"]),
  F("value_card", "Nilai kartu", "number", ["nilai", "nilai rp"], true),
];
const drvFields = [
  F("line", "Lini", "text", ["line", "produk", "sku"], true),
  F("driver", "Driver", "text", ["jenis driver"], true),
  F("value", "Nilai", "number", ["jumlah", "qty"], true),
  F("estimated", "Estimasi", "text", ["estimated", "perkiraan"]),
];

export const def: KindDef = {
  kind: "cogm_card", label: "Kartu CoGM (template BMG: kuantitas, material, driver)", source: "Ops", target: "cogm_card, cogm_material, driver_month",
  description: "Template 3 sheet dari workbook CoGM: Kuantitas (WIP, input, premium, KW 2, waste, output), Material per lini, Driver (man-hour, kWh, kg dikupas, jam mesin, jam dibayar).",
  roles: ["admin", "cost_accounting"], cadence: "month", fields: qtyFields,
};

export const ROW_KINDS = {
  wip_open: ["wip awal", "wip awal curah"], input: ["produksi bulan ini", "masuk proses", "input"], premium: ["premium", "premium ke barang jadi"],
  kw2: ["kw 2", "kw2"], waste: ["waste", "keripik waste"], wip_close: ["wip akhir", "wip akhir curah"], sample: ["sampel", "sample"],
  output: ["output", "output produksi", "output kg"], output_fg: ["output fg", "output satuan fg"], sample_fg: ["sampel fg", "sample fg"],
  input_fcc_premium: ["input fcc premium"], input_kw2_fcc: ["input kw 2 fcc", "input kw2 fcc"],
  input_kw2_ubi: ["input kw 2 ubi", "input kw2 ubi"],
};
export const DRIVERS = {
  man_hour: ["man hour", "manhour", "jam kerja"], hours_paid: ["jam dibayar", "hours paid"], kg_peeled: ["kg dikupas", "kg peeled"],
  kwh: ["kwh", "listrik", "pemakaian listrik"], machine_hour: ["jam mesin", "machine hour"],
};

export const cogmCard: KindParser = {
  def,
  parse(sheets, ctx) {
    const month = assertMonth(ctx.period);
    const q = table(sheets, qtyFields, { mapping: ctx.mapping, sheet: /kuantitas|qty/i });
    const m = table(sheets, matFields, { sheet: /material/i });
    const d = table(sheets, drvFields, { sheet: /driver/i });
    const lines = new Set(ctx.masters?.lines ?? []);
    const unknownLine: { rowNo: number; text: string }[] = [];
    const checkLine = (r: { rowNo: number; values: Record<string, string | null>; issues: string[] }) => {
      if (lines.size && r.values.line && !lines.has(r.values.line)) {
        r.issues.push(`Lini tidak dikenal: "${r.values.line}"`);
        unknownLine.push({ rowNo: r.rowNo, text: r.values.line });
      }
    };
    const kind = new Map<number, string>();
    for (const r of q.rows) {
      checkLine(r);
      const k = pick(r.values.row_kind, ROW_KINDS);
      if (!k) r.issues.push(`Jenis baris tidak dikenal: "${r.values.row_kind}"`);
      else kind.set(r.rowNo, k);
    }
    for (const r of m.rows) checkLine(r);
    const drv = new Map<number, string>();
    const est = new Map<number, boolean>();
    for (const r of d.rows) {
      checkLine(r);
      const k = pick(r.values.driver, DRIVERS);
      if (!k) r.issues.push(`Driver tidak dikenal: "${r.values.driver}"`);
      else drv.set(r.rowNo, k);
      const e = (r.values.estimated ?? "").trim().toLowerCase();
      if (!["", "ya", "tidak", "true", "false", "1", "0", "y", "n"].includes(e)) r.issues.push(`Estimasi harus ya/tidak: "${r.values.estimated}"`);
      est.set(r.rowNo, ["ya", "true", "1", "y"].includes(e));
    }
    const card = keyed(good(q.rows), (r) => `${r.values.line}|${kind.get(r.rowNo)}|${r.values.unit ?? "kg"}`, (r) => ({
      line: r.values.line, row_kind: kind.get(r.rowNo), qty: scale(r.values.qty, 3), unit: r.values.unit ?? "kg",
    }), month);
    const mat = keyed(good(m.rows), (r) => `${r.values.line}|${r.values.item_name}`, (r) => ({
      line: r.values.line, item_name: r.values.item_name, item_code: null, material_group: r.values.material_group,
      qty: scale(r.values.qty, 4), unit: r.values.unit, price_card: scale(r.values.price_card, 4), value_card: scale(r.values.value_card, 2),
    }), month);
    const dm = keyed(good(d.rows), (r) => `${r.values.line}|${drv.get(r.rowNo)}`, (r) => ({
      line: r.values.line, driver: drv.get(r.rowNo), value: scale(r.values.value, 4), estimated: est.get(r.rowNo) ?? false,
    }), month);
    return {
      detected: q.detected, fields: qtyFields, rows: [...q.rows, ...m.rows, ...d.rows],
      sets: [{ target: "cogm_card", rows: card }, { target: "cogm_material", rows: mat }, { target: "driver_month", rows: dm }],
      issues: [
        ...(q.detected ? [] : ["Sheet Kuantitas (Lini, Jenis, Qty) tidak ditemukan"]),
        ...(m.detected ? [] : ["Sheet Material (Lini, Material, Nilai kartu) tidak ditemukan"]),
        ...(d.detected ? [] : ["Sheet Driver (Lini, Driver, Nilai) tidak ditemukan"]),
        ...warnRows("Lini tidak dikenal", unknownLine),
      ],
    };
  },
};

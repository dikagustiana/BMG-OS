/** B3 recon.ts — statuses vs WP cells (golden numbers are in the f3-recon suite) and rule tests per branch. */
import { describe, expect, it } from "vitest";
import { D } from "../src/decimal";
import { checkTargets } from "../src/golden";
import { f3Targets, runF34 } from "../src/golden-f34";
import {
  classifyInventoryItem, ivMovement, reconHpp, reconInventoryByItem, reconMaterialByItem, reconMonth,
  type InventoryItemInput, type ReconHppInputs, type ReconInputs,
} from "../src/recon";
import { reconInputsFromWp, wpReader, type MaterialMasterRow } from "../src/wp-f34";
import { readFixtureJson } from "../src/fixtures";

const { f3 } = runF34();
const r = f3.recon;
const w = wpReader(f3.cells);
const materials = readFixtureJson<{ rows: MaterialMasterRow[] }>("master", "material_item.json").rows;
const fresh = (): ReconInputs => reconInputsFromWp(f3.cells, materials);

describe("golden Sep-26 (WP Sep26_4)", () => {
  it("every engine number of REKON & KONTROL, REKON MATERIAL, REKON PERSEDIAAN, RINGKASAN 4–5 equals its WP cell", () => {
    const bad = checkTargets(f3.cells, f3Targets(f3)).filter((x) => !x.ok).map((x) => `${x.target.id} ${x.target.sheet}!${x.target.cell}: ${x.actual} vs ${x.target.expected}`);
    expect(bad).toEqual([]);
  });

  it("HPP kartu → HPP GL: six items, residual within Rp 1.000 (WP C46 = Rp 7,21)", () => {
    expect(r.hpp.steps.map((s) => s.key)).toEqual(["hpp_card", "material_variance", "inv_increase_wp", "inv_increase_gl", "kw2_nrv", "section8", "idle_period", "hpp_recon", "hpp_gl", "residual"]);
    expect(r.hpp.residual.abs().lte(1000)).toBe(true);
    expect(r.hpp.residual.minus(D(w.n("REKON & KONTROL!C46")).times(1e6)).abs().lte(1)).toBe(true);
  });

  it("B17–B20 LULUS like REKON & KONTROL D59:D63; RINGKASAN bagian 5 statuses = I40:I49", () => {
    const byCode = Object.fromEntries(r.controls.map((c) => [c.code, c.status]));
    expect([byCode.B17, byCode.B18, byCode.B19, byCode.B20]).toEqual([59, 60, 61, 63].map((n) => w.s(`REKON & KONTROL!D${n}`)));
    expect(r.hpp.checks[0].status).toBe(w.s("REKON & KONTROL!D62"));
    const rowOf: Record<string, number> = { revenue: 40, material_usage: 41, conversion: 42, cogs: 43, gross_profit: 44, inv_1106_001: 46, inv_1106_002: 47, inv_1106_003: 48, inv_wip_fg_delta: 49 };
    for (const row of r.summary.rows) expect(row.status, row.line_key).toBe(w.s(`RINGKASAN!I${rowOf[row.line_key.replace("summary.", "")]}`));
    expect(r.summary.status).toBe(w.s("RINGKASAN!I50"));
  });

  it("B23–B30 LULUS like REKON PERSEDIAAN D30:D39; sheet status C3; INFO test D41", () => {
    expect(r.inventory.controls.map((c) => c.code)).toEqual(["B23", "B24", "B25", "B26", "B27", "B28", "B29", "B30"]);
    for (const c of r.inventory.controls) expect(c.status, c.code).toBe("LULUS");
    for (let n = 30; n <= 39; n++) expect(w.s(`REKON PERSEDIAAN!D${n}`)).toBe("LULUS");
    expect(r.inventory.status).toBe(w.s("REKON PERSEDIAAN!C3"));
    expect(r.inventory.checks[0].status).toBe(w.s("REKON PERSEDIAAN!D41"));
  });

  it("REKON MATERIAL checks = D75:D87; sheet status D89", () => {
    r.material.checks.forEach((c, i) => expect(c.status, c.key).toBe(w.s(`REKON MATERIAL!D${75 + i}`)));
    expect(r.material.status).toBe(w.s("REKON MATERIAL!D89"));
  });

  it("default category rules reproduce REKON PERSEDIAAN column D for all 81 items (K2 olein WIP-022 = H58)", () => {
    const wpCats = r.inventory.rows.map((x) => w.s(`REKON PERSEDIAAN!D${Number(x.source_ref!.split("!A")[1])}`));
    expect(r.inventory.rows.map((x) => x.category)).toEqual(wpCats);
    const k2 = r.inventory.rows.filter((x) => x.category === "K2");
    expect(k2.map((x) => x.code)).toEqual(["WIP-022"]);
    expect(k2[0].accValueClose.toFixed(2)).toBe(D(w.n("REKON PERSEDIAAN!H58")).toFixed(2));
    expect(r.inventory.table.k2.wipClose.neg().toFixed(2)).toBe(D(w.n("REKON PERSEDIAAN!H58")).toFixed(2));
  });

  it("whole month LULUS; data mart rows carry rule_id, inputs and source_ref", () => {
    expect(r.status).toBe("LULUS");
    expect(r.reconMonthRows).toHaveLength(9 + 10 + 6 + 3 + 4);
    expect(r.inventoryReconRows).toHaveLength(r.material.rows.length + r.inventory.rows.length);
    for (const row of [...r.reconMonthRows, ...r.inventoryReconRows, ...r.controls]) {
      expect(row.rule_id).toMatch(/^recon\.\w+@v\d+$/);
      expect(typeof row.inputs).toBe("object");
    }
    const cogs = r.reconMonthRows.find((x) => x.line_key === "summary.cogs")!;
    expect(cogs.source_ref).toBe("RINGKASAN!I43");
    expect(cogs.inputs.gl.ref).toBe("RINGKASAN!C43");
    expect(cogs.explained!.items.map((i) => i.key)).toEqual(["material_variance", "inv_increase_wp", "inv_increase_gl", "kw2_nrv", "section8", "idle_period"]);
    const b19 = r.controls.find((c) => c.code === "B19")!;
    expect(b19.source_ref).toBe("REKON & KONTROL!C61");
    expect(b19.inputs.hppGl.ref).toBe("REKON & KONTROL!C45");
  });
});

describe("reconHpp rules", () => {
  const base = (): ReconHppInputs => fresh().hpp;

  it("B19 GAGAL when HPP GL is Rp 2.000 off; residual follows", () => {
    const i = base();
    i.hppGl = D(i.hppGl).plus(2000);
    const res = reconHpp(i);
    expect(res.residual.minus(r.hpp.residual).toFixed(2)).toBe("2000.00");
    expect(res.controls.find((c) => c.code === "B19")!.status).toBe("GAGAL");
  });

  it("idle hours charged to the period move into the waterfall and out of B17", () => {
    const i = base();
    i.pool = { ...i.pool, idlePeriodCharge: "61594632.85" };
    const res = reconHpp(i);
    expect(res.steps.find((s) => s.key === "idle_period")!.amount.toFixed(2)).toBe("61594632.85");
    expect(res.hppRecon.minus(r.hpp.hppRecon).toFixed(2)).toBe("61594632.85");
    // cards still carry the full pool → conversion on cards ≠ pool − idle
    expect(res.controls.find((c) => c.code === "B17")!.status).toBe("GAGAL");
  });

  it("B20 GAGAL when revenue per line ≠ GL; B18 GAGAL when material ≠ GL usage", () => {
    const i = base();
    i.revenue = { ...i.revenue, LAIN: D(i.revenue.LAIN).plus(5000) };
    i.section8 = { ...i.section8, toMaterial: D(i.section8.toMaterial).plus(5000) };
    const res = reconHpp(i);
    expect(res.controls.find((c) => c.code === "B20")!.status).toBe("GAGAL");
    expect(res.controls.find((c) => c.code === "B18")!.status).toBe("GAGAL");
  });

  it("material variance split: share 0 when no card material; accounts 5101-301/302/303 sum lines", () => {
    const i = base();
    i.materialCard = { FCC: 0, UU: 0, UO: 0, LAIN_SINGKONG: 0, LAIN_UBI_UNGU: 0, LAIN_UBI_ORANGE: 0 };
    const res = reconHpp(i);
    expect(res.materialVarianceByLine.every((l) => l.share.isZero() && l.variance.isZero())).toBe(true);
    const acc = r.hpp.materialVarianceByAccount;
    const line = (l: string) => r.hpp.materialVarianceByLine.find((x) => x.line === l)!.variance;
    expect(acc["5101-301"].minus(line("FCC").plus(line("LAIN_SINGKONG"))).isZero()).toBe(true);
    expect(acc["5101-301"].plus(acc["5101-302"]).plus(acc["5101-303"]).minus(r.hpp.materialVariance).abs().lt("0.000001")).toBe(true);
  });

  it("KW 2 increase = NRV × (produced − to Lain-lain − sold)", () => {
    const i = base();
    i.kw2 = { kgProduced: 100, kgToOthers: 30, kgSold: 50, nrvPerKg: 10 };
    expect(reconHpp(i).steps.find((s) => s.key === "kw2_nrv")!.amount.toFixed(2)).toBe("200.00");
  });
});

describe("reconMaterialByItem rules", () => {
  const inp = () => {
    const f = fresh();
    return { ...f.material, month: f.month, wpMaterialByLine: { FCC: 0, UU: 0, UO: 0, LAIN: 0 }, glMaterialUsage: 0, materialVariance: 0 };
  };

  it("item without Inventory Valuation (accClose null): saldo akhir = awal + terima − kartu, usage = card", () => {
    const res = reconMaterialByItem({ ...inp(), items: [{ name: "X", qtyCard: 1, cardByLine: { FCC: 100 }, accOpen: 500, accIn: 50, accClose: null }] });
    const row = res.rows[0];
    expect(row.accCloseImplied).toBe(true);
    expect(row.accClose.toFixed(2)).toBe("450.00");
    expect(row.diff.isZero()).toBe(true);
  });

  it("rounding row closes Σ saldo akhir to LK PL HPP; > Rp 10.000 makes the check fail", () => {
    const base = inp();
    const res = reconMaterialByItem({ ...base, items: [{ name: "X", qtyCard: 0, cardByLine: {}, accOpen: 0, accIn: 0, accClose: 0 }], lkPlHpp: { ...base.lkPlHpp, close: 20000 } });
    const rounding = res.rows.find((x) => x.rounding)!;
    expect(rounding.accClose.toFixed(0)).toBe("20000");
    expect(res.checks.find((c) => c.key === "rounding_small")!.status).toBe("GAGAL");
    expect(res.checks.find((c) => c.key === "close_vs_lk")!.status).toBe("LULUS");
  });

  it("GL vs LK checks use a Rp 100 tolerance", () => {
    const base = inp();
    const res = reconMaterialByItem({ ...base, lkPlHpp: { ...base.lkPlHpp, receipts: D(base.gl.receipts).minus(150) } });
    expect(res.checks.find((c) => c.key === "receipts_gl_lk")!.status).toBe("GAGAL");
  });
});

describe("REKON PERSEDIAAN rules", () => {
  const item = (o: Partial<InventoryItemInput>): InventoryItemInput => ({
    code: "X", account: "1106-003", accQtyOpen: 0, accValueOpen: 0, accQtyClose: 0, accValueClose: 0, movement: false, ...o,
  });

  it("classification: WP scope → K1; olein WIP → K2; other WIP → K3; FG without movement → K4, with → K5; unknown account → K6; override wins", () => {
    expect(classifyInventoryItem(item({ account: "1106-002" }), true)).toBe("K1");
    expect(classifyInventoryItem(item({ account: "1106-002", materialCategory: "olein" }), false)).toBe("K2");
    expect(classifyInventoryItem(item({ account: "1106-002", materialCategory: "hdpe" }), false)).toBe("K3");
    expect(classifyInventoryItem(item({ movement: false }), false)).toBe("K4");
    expect(classifyInventoryItem(item({ movement: true }), false)).toBe("K5");
    expect(classifyInventoryItem(item({ account: null }), true)).toBe("K6");
    expect(classifyInventoryItem(item({ movement: true, categoryOverride: "K4" }), false)).toBe("K4");
  });

  it("ivMovement: sale, production or transfer quantity; adjustments alone are not movement", () => {
    expect(ivMovement({ qty_in: 0, qty_out_sale: "0", qty_out_transfer: null })).toBe(false);
    expect(ivMovement({ qty_in: 5 })).toBe(true);
    expect(ivMovement({ qty_out_transfer: "-2" })).toBe(true);
  });

  const inv = () => {
    const f = fresh();
    const lk = f.lk;
    return {
      ...f.inventory, month: f.month,
      gl: { wipOpen: lk.inv1106002Open, wipClose: lk.inv1106002Close, fgOpen: lk.inv1106003Open, fgClose: lk.inv1106003Close },
      wp: { wipOpen: r.inventory.table.wp.wipOpen, wipClose: r.inventory.table.wp.wipClose, fgOpen: r.inventory.table.wp.fgOpen, fgClose: r.inventory.table.wp.fgClose },
      reconInventoryGap: r.hpp.inventoryGap,
    };
  };

  it("an unclassified item with a balance fails B30 and leaves a residual nowhere (K6 explains it)", () => {
    const i = inv();
    i.items = [...i.items, item({ code: "FG-999", categoryOverride: "K6", accValueClose: 1000, accQtyClose: 1 })];
    const res = reconInventoryByItem(i);
    expect(res.controls.find((c) => c.code === "B30")!.status).toBe("GAGAL");
    expect(res.table.k6.fgClose.toFixed(2)).toBe("-1000.00");
  });

  it("subledger drift above Rp 1.000 fails B23", () => {
    const i = inv();
    i.gl = { ...i.gl, fgClose: D(i.gl.fgClose).plus(5000) };
    const res = reconInventoryByItem(i);
    expect(res.controls.find((c) => c.code === "B23")!.status).toBe("GAGAL");
    // GL also moves WP − GL; the reversal of the subledger gap keeps the residual at 0
    expect(res.controls.find((c) => c.code === "B28")!.status).toBe("LULUS");
  });

  it("a WP value that is not mapped to an Accurate item fails B24 (Σ K1 ≠ saldo WP)", () => {
    const i = inv();
    i.wp = { ...i.wp, wipClose: D(i.wp.wipClose).plus(10000) };
    const res = reconInventoryByItem(i);
    expect(res.controls.find((c) => c.code === "B24")!.status).toBe("GAGAL");
  });

  it("old-card INFO turns CEK when Accurate ÷ kartu lama − 1 exceeds the limit", () => {
    const i = inv();
    i.oldCardLimit = "0.00001";
    expect(reconInventoryByItem(i).checks[0].status).toBe("CEK");
  });
});

describe("summary (RINGKASAN bagian 5) rules", () => {
  it("WIP and FG lines fail when REKON PERSEDIAAN fails even if the totals tie", () => {
    const f = fresh();
    f.inventory.items = [...f.inventory.items, { code: "FG-999", account: "1106-003", categoryOverride: "K6", accQtyOpen: 0, accValueOpen: 0, accQtyClose: 0, accValueClose: 0.01, movement: false }];
    const res = reconMonth(f);
    expect(res.inventory.status).toBe("GAGAL");
    expect(res.summary.rows.find((x) => x.line_key === "summary.inv_1106_002")!.status).toBe("GAGAL");
    expect(res.status).toBe("GAGAL");
  });

  it("GL − LK above Rp 1.000 fails the line", () => {
    const f = fresh();
    f.lk = { ...f.lk, revenue: D(f.lk.revenue).plus(2000) };
    const res = reconMonth(f);
    expect(res.summary.rows.find((x) => x.line_key === "summary.revenue")!.status).toBe("GAGAL");
  });
});

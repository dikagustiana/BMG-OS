/**
 * Stage 1 of the costing order (CLAUDE.md): material per line. Process cards FCC/UU/UO (LAMPIRAN B, bagian 2b) and the
 * Lain-lain units (SKU sheets LAMPIRAN B, KOPERASI, LAIN-LAIN bagian 2) against the WP cells.
 */
import { describe, expect, it } from "vitest";
import { D, ZERO, sum } from "../src/decimal";
import type { MaterialLine } from "../src/inputs";
import { unitCost } from "../src/others-sku";
import { buildPools } from "../src/pool";
import { materialGroupKey, processMaterial } from "../src/process-card";
import { expectCell, goldenInputs } from "./costing-helpers";

const inp = goldenInputs();
const freight = buildPools(inp).materialFromTags;
const mat = (p: string) => processMaterial(inp.materials.filter((m) => m.line === p), freight.find((f) => f.line === p)?.amount ?? ZERO, inp.assumptions.cngM3PerMmbtu);

describe("material per process line (bagian 2b, LAMPIRAN B)", () => {
  const rows: Record<string, { raw: number; oil: number; cng: number; others: number; total: number; card: string }> = {
    FCC: { raw: 44, oil: 46, cng: 47, others: 55, total: 56, card: "G229" },
    UU: { raw: 44, oil: 46, cng: 47, others: 55, total: 56, card: "G218" },
    UO: { raw: 40, oil: 42, cng: 43, others: 51, total: 52, card: "G214" },
  };
  for (const [p, r] of Object.entries(rows)) {
    it(`${p}: raw, oil, CNG, material-others, total = WP`, () => {
      const m = mat(p).material;
      expectCell(m.raw_materials, `${p}!E${r.raw}`);
      expectCell(m.oil, `${p}!E${r.oil}`);
      expectCell(m.cng, `${p}!E${r.cng}`);
      expectCell(m.cng_mmbtu, `${p}!B${r.cng}`, "0.0001");
      expectCell(m.others, `${p}!E${r.others}`);
      expectCell(m.total, `${p}!E${r.total}`);
      expectCell(m.card_total, `${p}!${r.card}`);
      expectCell(m.card_total, `BIAYA BERSAMA!${{ FCC: "C", UU: "D", UO: "E" }[p]}94`);
    });
  }
  it("FCC raw materials include the freight of singkong booked by voucher tag (BIAYA BERSAMA C159 → FCC!E43)", () => {
    const m = mat("FCC").material;
    expectCell(m.freight_in, "FCC!E43");
    expectCell(m.freight_in, "BIAYA BERSAMA!C159");
    expect(mat("UU").material.freight_in.isZero()).toBe(true);
  });
  it("REKON & KONTROL bagian 1: external material per line (Rp jt)", () => {
    expectCell(mat("FCC").material.total.div(1e6), "REKON & KONTROL!B7", "0.000001");
    expectCell(mat("UU").material.total.div(1e6), "REKON & KONTROL!C7", "0.000001");
    expectCell(mat("UO").material.total.div(1e6), "REKON & KONTROL!D7", "0.000001");
  });
  it("an unknown card group counts as material-others and is reported", () => {
    const line: MaterialLine = { ref: "t:1", line: "FCC", itemName: "Garam baru", group: "Bumbu", qty: D(1), unit: "kg", price: D(5), value: D(5) };
    const r = processMaterial([line], ZERO, D("22.2967"));
    expect(r.material.others.toFixed()).toBe("5");
    expect(r.issues[0]).toMatch(/kelompok "Bumbu" tidak dikenal/);
    expect(materialGroupKey("Raw materials")).toBe("raw");
    expect(materialGroupKey("Material-others")).toBe("others");
  });
});

describe("material of the Lain-lain units (SKU LAMPIRAN B, KOPERASI, LAIN-LAIN bagian 2)", () => {
  const units = inp.skus.map((s) => unitCost(s.code, inp));
  it("external material, inputs and output per SKU sheet", () => {
    for (const s of inp.skus.filter((x) => x.wpSheet !== "KOPERASI")) {
      const u = units.find((x) => x.code === s.code)!;
      expectCell(u.ext, `${s.wpSheet}!E34`);
      expectCell(u.fccKg, `${s.wpSheet}!B23`, "0.01");
      expectCell(u.kw2Kg, `${s.wpSheet}!B24`, "0.01");
      expectCell(u.kw2UbiKg, `${s.wpSheet}!B25`, "0.01");
      expectCell(u.outputKg, `${s.wpSheet}!B21`, "0.01");
      expectCell(u.unitsOut, `${s.wpSheet}!C21`, "0.01");
    }
  });
  it("KOPERASI: 11 SKUs per column, FG units from the master kg per unit", () => {
    const kop = inp.skus.filter((x) => x.wpSheet === "KOPERASI");
    expect(kop).toHaveLength(11);
    kop.forEach((s, i) => {
      const c = "BCDEFGHIJKL"[i];
      const u = units.find((x) => x.code === s.code)!;
      expectCell(u.ext, `KOPERASI!${c}15`);
      expectCell(u.kw2Kg, `KOPERASI!${c}10`, "0.01");
      expectCell(u.kw2UbiKg, `KOPERASI!${c}11`, "0.01");
      expectCell(u.fccKg, `KOPERASI!${c}9`, "0.01");
      expectCell(u.unitsOut, `KOPERASI!${c}8`, "0.01");
    });
  });
  it("LAIN-LAIN bagian 2 totals: output, FCC premium, KW 2, external material (C43:G43)", () => {
    expectCell(sum(units.map((u) => u.outputKg)), "LAIN-LAIN!C43", "0.01");
    expectCell(sum(units.map((u) => u.fccKg)), "LAIN-LAIN!D43", "0.01");
    expectCell(sum(units.map((u) => u.kw2Kg)), "LAIN-LAIN!E43", "0.01");
    expectCell(sum(units.map((u) => u.kw2UbiKg)), "LAIN-LAIN!F43", "0.01");
    expectCell(sum(units.map((u) => u.ext)), "LAIN-LAIN!G43");
    expectCell(sum(units.map((u) => u.ext)), "BIAYA BERSAMA!F94");
  });
});

/** B01, B02, B44 (PRD §4.6) on the Sep-26 figures of the WP and the seeded account mapping (fixtures/master). */
import { describe, expect, it } from "vitest";
import { b01, b02, b44, activeMapping, mappingGaps, type CoaMapping, type GlLine } from "../src/controls";
import { loadCells, readFixtureJson } from "../src/fixtures";

const cells = loadCells("month-2026-09");
const v = (ref: string) => cells.get(ref)!.value;
const mappings = readFixtureJson<{ rows: CoaMapping[] }>("master", "coa_pool_map.json").rows;
const SEP = "2026-09-01", OKT = "2026-10-01";

/** GL of September per account = BIAYA BERSAMA bagian 1 (C7:C22) + the opex accounts of bagian 8. */
const gl: GlLine[] = [
  ...Array.from({ length: 16 }, (_, i) => ({ account: v(`BIAYA BERSAMA!A${7 + i}`), net: v(`BIAYA BERSAMA!C${7 + i}`) })),
  ...[144, 145, 146, 147, 148].map((r) => ({ account: v(`BIAYA BERSAMA!A${r}`), net: v(`BIAYA BERSAMA!C${r}`) })),
];
const fs = [{ key: "conversion_16", amount: v("RINGKASAN!B60") }];
const journals = [164, 165, 166].map((r) => ({ kind: "x", amount: v(`BIAYA BERSAMA!C${r}`) }));

describe("activeMapping", () => {
  it("Sep-26 mapping ends 30 Sep; Okt-26 draft starts 1 Okt", () => {
    expect(activeMapping(mappings, "5101-006", SEP)).toMatchObject({ effective_from: "2026-01-01", confirmed: true });
    expect(activeMapping(mappings, "5101-006", OKT)).toMatchObject({ effective_from: "2026-10-01", confirmed: false });
    expect(activeMapping(mappings, "5101-002", OKT)).toBeNull();
  });
});

describe("B01 Σ GL konversi = LK", () => {
  it("LULUS for September (16 accounts; opex reclasses are not in the LK line)", () => {
    const r = b01(SEP, gl, mappings, fs);
    expect(r.status).toBe("LULUS");
    expect(r.value!.abs().lte(1)).toBe(true);
    expect(r.note).toMatch(/16 akun/);
  });
  it("GAGAL when GL ≠ LK; BELUM_DIISI without GL or LK", () => {
    expect(b01(SEP, [...gl, { account: "5101-006", net: "2" }], mappings, fs).status).toBe("GAGAL");
    expect(b01(SEP, [], mappings, fs).status).toBe("BELUM_DIISI");
    expect(b01(SEP, gl, mappings, []).status).toBe("BELUM_DIISI");
  });
});

describe("B02 GL 5101-002 = jurnal", () => {
  it("LULUS for September (BIAYA BERSAMA bagian 9)", () => {
    expect(b02(SEP, gl, mappings, journals)).toMatchObject({ status: "LULUS" });
  });
  it("GAGAL on a missing journal; BELUM_DIISI without journals", () => {
    expect(b02(SEP, gl, mappings, journals.slice(1)).status).toBe("GAGAL");
    expect(b02(SEP, gl, mappings, []).status).toBe("BELUM_DIISI");
  });
});

describe("B44 mapping akun aktif", () => {
  it("LULUS for September; tagged opex accounts are in scope", () => {
    expect(b44(SEP, gl.map((g) => g.account), ["6500-001"], mappings)).toMatchObject({ status: "LULUS", note: "17 akun ber-mapping aktif" });
  });
  it("Oktober: new accounts are draft (PERIKSA); an account without mapping is GAGAL", () => {
    expect(b44(OKT, ["5101-111", "5101-006"], [], mappings)).toMatchObject({ status: "PERIKSA" });
    const r = b44(OKT, ["5101-111", "5101-002", "4101-007"], [], mappings);
    expect(r.status).toBe("GAGAL");
    expect(r.note).toBe("Tanpa mapping: 5101-002");
    expect(mappingGaps(OKT, ["5101-002", "1106-001"], [], mappings)).toEqual({ missing: ["5101-002"], draft: [], scope: ["5101-002"] });
  });
});

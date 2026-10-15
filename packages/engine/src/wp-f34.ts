/**
 * WP Sep26_4 → engine inputs of Fase 3 (recon), for golden tests and snapshots.
 * Pure: reads a `CellIndex` (fixtures/<month>/cells.csv, loaded by the caller). Every number comes from a WP cell; nothing
 * is hard-coded. In production the same input fields are filled from the Fase 2 data mart and the B1 tables (see the field
 * doc comments in recon.ts).
 */
import { D, Decimal } from "./decimal";
import { cellKey, type CellIndex } from "./golden";
import type { InventoryItemInput, MaterialItemInput, ReconInputs, WpItemValue, MaterialLine } from "./recon";

export const GOLDEN_MONTH = "2026-09-01";
const MILLION = new Decimal(1_000_000);

/** "REKON & KONTROL!C45" → cell. */
export function wpReader(cells: CellIndex) {
  const split = (ref: string): [string, string] => {
    const i = ref.lastIndexOf("!");
    return [ref.slice(0, i), ref.slice(i + 1)];
  };
  const get = (ref: string) => cells.get(cellKey(...split(ref)));
  return {
    /** numeric cell (throws when absent or not a number) */
    n(ref: string): string {
      const c = get(ref);
      if (!c) throw new Error(`Sel ${ref} tidak ada`);
      if (c.type !== "n") throw new Error(`Sel ${ref} bukan angka (${c.type}: ${c.value})`);
      return c.value;
    },
    /** numeric cell or 0 when blank */
    n0(ref: string): string {
      const c = get(ref);
      return c && c.type === "n" ? c.value : "0";
    },
    /** Rp juta cell → Rp */
    jt(ref: string): Decimal {
      return D(this.n(ref)).times(MILLION);
    },
    s(ref: string): string | null {
      return get(ref)?.value ?? null;
    },
    f(ref: string): string | null {
      return get(ref)?.formula ?? null;
    },
    has(ref: string): boolean {
      return !!get(ref);
    },
  };
}
export type WpReader = ReturnType<typeof wpReader>;

/** material_item rows (fixtures/master/material_item.json) used to classify olein (K2). */
export interface MaterialMasterRow {
  name: string;
  code: string | null;
  category: string;
}

// ---------------------------------------------------------------------------------------------------------------
// Recon (B3)
// ---------------------------------------------------------------------------------------------------------------

/** LAIN-LAIN B22:B42 text → material line of REKON & KONTROL B25:B27 (SUMIF "Ubi Ungu*", "Ubi Orange", rest singkong). */
export function othersMainLine(text: string): MaterialLine {
  const t = text.trim().toLowerCase();
  if (t.startsWith("ubi ungu")) return "LAIN_UBI_UNGU";
  if (t === "ubi orange") return "LAIN_UBI_ORANGE";
  return "LAIN_SINGKONG";
}

export function reconInputsFromWp(cells: CellIndex, materials: readonly MaterialMasterRow[]): ReconInputs {
  const w = wpReader(cells);
  const othersByLine: Record<"LAIN_SINGKONG" | "LAIN_UBI_UNGU" | "LAIN_UBI_ORANGE", Decimal> = { LAIN_SINGKONG: D(0), LAIN_UBI_UNGU: D(0), LAIN_UBI_ORANGE: D(0) };
  for (let r = 22; r <= 42; r++) {
    const line = othersMainLine(w.s(`LAIN-LAIN!B${r}`) ?? "") as keyof typeof othersByLine;
    othersByLine[line] = othersByLine[line].plus(D(w.n0(`LAIN-LAIN!G${r}`)));
  }
  const hppRefs = {
    poolTotal: "BIAYA BERSAMA!C87", idlePeriodCharge: "BIAYA BERSAMA!C111", glMaterialUsage: "REKON & KONTROL!B29", hppGl: "REKON & KONTROL!C45",
    glRevenue: "REKON & KONTROL!C73", ongkirToMaterial: "BIAYA BERSAMA!C159", conversionCards: "REKON & KONTROL!F9:F11", materialExternal: "REKON & KONTROL!F7",
    revenueLines: "REKON & KONTROL!F15", materialVariance: "REKON & KONTROL!B30", hppRecon: "REKON & KONTROL!C44",
  };
  const category = new Map(materials.map((m) => [m.name.trim().toLowerCase(), m.category]));

  const materialItems: MaterialItemInput[] = [];
  for (let r = 7; r <= 60; r++) {
    const name = w.s(`REKON MATERIAL!A${r}`);
    if (!name) continue;
    const note = w.s(`REKON MATERIAL!O${r}`) ?? "";
    materialItems.push({
      name, code: /BB-\d+/.exec(note)?.[0] ?? null, unit: w.s(`REKON MATERIAL!B${r}`), qtyCard: w.n0(`REKON MATERIAL!C${r}`),
      cardByLine: { FCC: w.n0(`REKON MATERIAL!D${r}`), UU: w.n0(`REKON MATERIAL!E${r}`), UO: w.n0(`REKON MATERIAL!F${r}`), LAIN: w.n0(`REKON MATERIAL!G${r}`) },
      accOpen: w.n0(`REKON MATERIAL!I${r}`), accIn: w.n0(`REKON MATERIAL!J${r}`),
      accClose: w.f(`REKON MATERIAL!K${r}`) ? null : w.n0(`REKON MATERIAL!K${r}`), wpRow: r,
    });
  }

  const items: InventoryItemInput[] = [];
  const wpItems: WpItemValue[] = [];
  for (let r = 55; r <= 135; r++) {
    const code = w.s(`REKON PERSEDIAAN!A${r}`);
    if (!code) continue;
    const name = w.s(`REKON PERSEDIAAN!B${r}`);
    items.push({
      code, name, account: w.s(`REKON PERSEDIAAN!C${r}`),
      accQtyOpen: w.n0(`REKON PERSEDIAAN!E${r}`), accValueOpen: w.n0(`REKON PERSEDIAAN!F${r}`),
      accQtyClose: w.n0(`REKON PERSEDIAAN!G${r}`), accValueClose: w.n0(`REKON PERSEDIAAN!H${r}`),
      movement: (w.s(`REKON PERSEDIAAN!I${r}`) ?? "").trim().toLowerCase() === "ya",
      materialCategory: name ? category.get(name.trim().toLowerCase()) ?? null : null,
      oldCardRatePerKg: w.n0(`REKON PERSEDIAAN!R${r}`), wpRow: r,
    });
    // WP scope (K1) = rows whose WP columns link to a product/SKU sheet
    if (w.f(`REKON PERSEDIAAN!K${r}`) || w.f(`REKON PERSEDIAAN!M${r}`)) {
      wpItems.push({
        code, qtyOpen: w.n0(`REKON PERSEDIAAN!J${r}`), valueOpen: w.n0(`REKON PERSEDIAAN!K${r}`),
        qtyClose: w.n0(`REKON PERSEDIAAN!L${r}`), valueClose: w.n0(`REKON PERSEDIAAN!M${r}`),
      });
    }
  }

  return {
    month: GOLDEN_MONTH,
    hpp: {
      month: GOLDEN_MONTH,
      hppCard: { FCC: w.n("FCC!E104"), UU: w.n("UU!E98"), UO: w.n("UO!E94"), LAIN: w.n("LAIN-LAIN!G93") },
      revenue: { FCC: w.n("FCC!C211"), UU: w.n("UU!C207"), UO: w.n("UO!C203"), LAIN: w.n("REKON & KONTROL!C74") },
      materialExternal: { FCC: w.n("FCC!E56"), UU: w.n("UU!G218"), UO: w.n("UO!G214"), LAIN: w.n("LAIN-LAIN!D68") },
      conversion: {
        FCC: { kupas: w.n("FCC!E58"), directLabour: w.n("FCC!E59"), overhead: w.n("FCC!E64") },
        UU: { kupas: w.n("UU!E58"), directLabour: w.n("UU!E59"), overhead: w.n("UU!E64") },
        UO: { kupas: w.n("UO!E54"), directLabour: w.n("UO!E55"), overhead: w.n("UO!E60") },
        LAIN: { kupas: "0", directLabour: w.n("LAIN-LAIN!E68"), overhead: w.n("LAIN-LAIN!F68") },
      },
      materialCard: { FCC: w.n("BIAYA BERSAMA!C94"), UU: w.n("BIAYA BERSAMA!D94"), UO: w.n("BIAYA BERSAMA!E94"), ...othersByLine },
      glMaterialUsage: w.jt("REKON & KONTROL!B29"),
      inventory: {
        FCC: { wipOpen: w.n("FCC!E72"), wipClose: w.n("FCC!E79"), fgOpen: w.n("FCC!E86"), fgClose: w.n("FCC!E92") },
        UU: { wipOpen: w.n("UU!E70"), wipClose: w.n("UU!E77"), fgOpen: w.n("UU!E84"), fgClose: w.n("UU!E89") },
        UO: { wipOpen: w.n("UO!E66"), wipClose: w.n("UO!E73"), fgOpen: w.n("UO!E80"), fgClose: w.n("UO!E85") },
        LAIN: { wipOpen: "0", wipClose: "0", fgOpen: w.n("LAIN-LAIN!E93"), fgClose: w.n("LAIN-LAIN!F93") },
      },
      glInventoryMovement: { wip: w.n("REKON & KONTROL!C75"), fg: w.n("REKON & KONTROL!C76") },
      kw2: { kgProduced: w.n("FCC!B33"), kgToOthers: w.n("LAIN-LAIN!E43"), kgSold: w.n("FCC!C208"), nrvPerKg: w.n("FCC!C209") },
      section8: { toPools: w.n("BIAYA BERSAMA!C157"), toThr: w.n("BIAYA BERSAMA!C158"), toMaterial: w.n("BIAYA BERSAMA!C159") },
      pool: { total: w.n("BIAYA BERSAMA!C87"), idlePeriodCharge: w.n("BIAYA BERSAMA!C111") },
      glRevenue: w.n("REKON & KONTROL!C73"),
      hppGl: w.jt("REKON & KONTROL!C45"),
      refs: hppRefs,
    },
    material: {
      items: materialItems,
      gl: { open: w.n("REKON MATERIAL!C67"), receipts: w.n("REKON MATERIAL!C68"), usage: w.n("REKON MATERIAL!C69") },
      lkPlHpp: { open: w.n("REKON MATERIAL!E67"), receipts: w.n("REKON MATERIAL!E68"), usage: w.n("REKON MATERIAL!E69"), close: w.n("REKON MATERIAL!E70") },
    },
    inventory: { items, wpItems, tolerance: w.n("REKON PERSEDIAAN!E29"), oldCardLimit: w.n("REKON PERSEDIAAN!E41") },
    glConversion: w.n("BIAYA BERSAMA!C23"),
    lk: {
      revenue: w.n("RINGKASAN!B58"), materialUsage: w.n("RINGKASAN!B59"), conversion: w.n("RINGKASAN!B60"), cogs: w.n("RINGKASAN!B61"),
      inv1106001Close: w.n("RINGKASAN!B62"), inv1106002Open: w.n("RINGKASAN!B63"), inv1106002Close: w.n("RINGKASAN!B64"),
      inv1106003Open: w.n("RINGKASAN!B65"), inv1106003Close: w.n("RINGKASAN!B66"),
    },
  };
}

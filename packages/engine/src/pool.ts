/**
 * Conversion pools (WP BIAYA BERSAMA bagian 1–3, 8, 9) and Unit I idle capacity (bagian 5). PRD v2 §4.1–§4.2.
 *
 * pool_total(p) = Σ GL accounts mapped to p + Σ voucher tags with target p, where
 * - the payroll account (mapping PAYROLL_SPLIT, Sep-26: 5101-002) is split by journal: upah harian × rekap share per
 *   payroll group → pool of the group (A operator, B support, KUPAS kupas); gaji staf (rekap) → pool of the staf group;
 *   tali asih → Grup B;
 * - THR (mapping THR + tags to THR) and BPJS (mapping BPJS + tags to BPJS) are split by basic pay per group
 *   (operator, support, staf; kupas only when assumption kupas_thr_bpjs = 1);
 * - tags to MATERIAL are booked to the material of their target line (ongkos kirim singkong → FCC).
 * Fixed / variable follows the WP column "Sifat biaya": only "Tetap" is fixed.
 */
import { isConversionAccount } from "./controls";
import { D, div, max, sum, ZERO, type Decimal } from "./decimal";
import type { CoaRule, MonthInputs, PayrollGroup, Ref } from "./inputs";
import type { IdleMonthRow, PoolComponent, PoolMonthRow } from "./mart";
import type { PoolCode } from "./types";

export const POOL_RULE = "pool.buildPools@1";
export const IDLE_RULE = "pool.idleCapacity@1";
export const POOL_CODES: PoolCode[] = ["A", "KUPAS", "B", "C", "D", "E"];

/** WP BIAYA BERSAMA A60: tali asih (5101-002 jurnal tali asih) belongs to Grup B – IDL. */
export const TALI_ASIH_POOL: PoolCode = "B";

/** WP BIAYA BERSAMA bagian 3, column D: "Tetap" components. Upah harian is semi-variable, upah kupas variable. */
const FIXED = { upah_harian: false, gaji_staf: true, tali_asih: true, thr: true, bpjs: true } as const;

const WP_POOL_ROW: Record<PoolCode, number> = { A: 81, KUPAS: 82, B: 83, C: 84, D: 85, E: 86 };

export interface PayrollSplitRow {
  groupCode: string;
  kind: PayrollGroup["kind"];
  pool: PoolCode;
  rekap: Decimal;
  /** Upah GL (jurnal upah harian) × rekap share; staf = rekap (BIAYA BERSAMA F28:F41). */
  wageGl: Decimal;
  /** Basic pay used for THR/BPJS (kupas × kupas_thr_bpjs). */
  basis: Decimal;
  share: Decimal;
  thr: Decimal;
  bpjs: Decimal;
}

export interface PoolChecks {
  /** Σ GL of the conversion accounts (BIAYA BERSAMA C23). */
  glConversion: Decimal;
  /** Σ all tags (C156), tags to pools A–E (C157), to THR/BPJS (C158), to material (C159). */
  tagsTotal: Decimal;
  tagsToPools: Decimal;
  tagsToSplit: Decimal;
  tagsToMaterial: Decimal;
  /** C135: total pool − GL conversion − tags to pools − tags to THR/BPJS (must be 0). */
  tieOut: Decimal;
  /** C182: tags without a destination (must be 0). */
  tagsUnassigned: Decimal;
  /** C183: gaji staf (rekap) − jurnal gaji staf (must be 0); null when either is missing. */
  stafVsJournal: Decimal | null;
  thrTotal: Decimal;
  bpjsTotal: Decimal;
}

export interface MaterialFromTags { line: string; amount: Decimal; inputs: Ref[] }

export interface PoolResult {
  pools: PoolMonthRow[];
  payrollSplit: PayrollSplitRow[];
  materialFromTags: MaterialFromTags[];
  checks: PoolChecks;
}

const isPool = (p: string): p is PoolCode => (POOL_CODES as string[]).includes(p);
const coaOf = (coa: readonly CoaRule[], account: string) => coa.find((c) => c.account === account) ?? null;

export function buildPools(inp: Pick<MonthInputs, "month" | "gl" | "coa" | "tags" | "payroll" | "payrollGroups" | "journals" | "assumptions" | "wpTemplate">): PoolResult {
  const comps: Record<PoolCode, PoolComponent[]> = { A: [], KUPAS: [], B: [], C: [], D: [], E: [] };
  const add = (pool: PoolCode, c: PoolComponent) => comps[pool].push(c);

  // GL per conversion account with an active mapping (the LK "16 akun")
  const glAccounts = [...new Set(inp.gl.map((g) => g.account))].sort();
  const glOf = (a: string) => sum(inp.gl.filter((g) => g.account === a).map((g) => g.amount));
  const glRefs = (a: string) => inp.gl.filter((g) => g.account === a).map((g) => g.ref);
  let glConversion = ZERO;
  let thrGl = ZERO, bpjsGl = ZERO;
  const thrGlRefs: Ref[] = [], bpjsGlRefs: Ref[] = [];
  for (const a of glAccounts) {
    const m = coaOf(inp.coa, a);
    // only the plant conversion accounts (LK "16 akun"); opex accounts enter the pools through voucher tags (bagian 8)
    if (!m || !isConversionAccount(a, { ...m, effective_from: "", effective_to: null })) continue;
    const amt = glOf(a);
    if (isPool(m.pool)) {
      glConversion = glConversion.plus(amt);
      add(m.pool, { key: `gl:${a}`, label: `GL ${a}`, amount: amt, fixed: m.fixed === true, origin: "gl", inputs: [...glRefs(a), m.ref] });
    } else if (m.pool === "THR") { glConversion = glConversion.plus(amt); thrGl = thrGl.plus(amt); thrGlRefs.push(...glRefs(a), m.ref); }
    else if (m.pool === "BPJS") { glConversion = glConversion.plus(amt); bpjsGl = bpjsGl.plus(amt); bpjsGlRefs.push(...glRefs(a), m.ref); }
    else if (m.pool === "PAYROLL_SPLIT") glConversion = glConversion.plus(amt);
  }

  // voucher tags (bagian 8)
  let tagsToPools = ZERO, tagsToMaterial = ZERO, thrTags = ZERO, bpjsTags = ZERO;
  const thrTagRefs: Ref[] = [], bpjsTagRefs: Ref[] = [];
  const material = new Map<string, MaterialFromTags>();
  for (const t of inp.tags) {
    const m = coaOf(inp.coa, t.account);
    if (isPool(t.targetPool)) {
      tagsToPools = tagsToPools.plus(t.amount);
      const fixed = t.tag === "tali_asih_cutoff" ? FIXED.tali_asih : m?.fixed === true;
      add(t.targetPool, { key: `tag:${t.tag}:${t.voucher}:${t.account}`, label: `${t.tag} ${t.account}`, amount: t.amount, fixed, origin: "adjustment",
        inputs: [t.ref, ...(m ? [m.ref] : [])] });
    } else if (t.targetPool === "THR") { thrTags = thrTags.plus(t.amount); thrTagRefs.push(t.ref); }
    else if (t.targetPool === "BPJS") { bpjsTags = bpjsTags.plus(t.amount); bpjsTagRefs.push(t.ref); }
    else if (t.targetPool === "MATERIAL") {
      tagsToMaterial = tagsToMaterial.plus(t.amount);
      const line = t.targetLine ?? "";
      const cur = material.get(line) ?? { line, amount: ZERO, inputs: [] };
      cur.amount = cur.amount.plus(t.amount);
      cur.inputs.push(t.ref);
      material.set(line, cur);
    }
  }
  const tagsTotal = sum(inp.tags.map((t) => t.amount));
  const thrTotal = thrGl.plus(thrTags), bpjsTotal = bpjsGl.plus(bpjsTags);

  // payroll split (bagian 2 and 9)
  const jr = (k: string) => inp.journals.filter((j) => j.kind === k);
  const upah = sum(jr("upah_harian").map((j) => j.amount));
  const taliAsih = sum(jr("tali_asih").map((j) => j.amount));
  const groupOf = (code: string) => inp.payrollGroups.find((g) => g.code === code) ?? null;
  const rekapOf = (code: string) => sum(inp.payroll.filter((p) => p.groupCode === code).map((p) => p.amount));
  const rekapRefs = (code: string) => inp.payroll.filter((p) => p.groupCode === code).map((p) => p.ref);
  const daily = inp.payrollGroups.filter((g) => g.kind !== "staf");
  const dailyBase = sum(daily.map((g) => rekapOf(g.code)));
  const kupasFlag = inp.assumptions.kupasThrBpjs;
  const split: PayrollSplitRow[] = inp.payrollGroups.map((g) => {
    const rekap = rekapOf(g.code);
    const wageGl = g.kind === "staf" ? rekap : div(rekap, dailyBase).times(upah);
    const basis = g.kind === "kupas" ? wageGl.times(kupasFlag) : wageGl;
    return { groupCode: g.code, kind: g.kind, pool: g.pool, rekap, wageGl, basis, share: ZERO, thr: ZERO, bpjs: ZERO };
  });
  const basisTotal = sum(split.map((s) => s.basis));
  for (const s of split) {
    s.share = div(s.basis, basisTotal);
    s.thr = s.share.times(thrTotal);
    s.bpjs = s.share.times(bpjsTotal);
  }
  const upahRefs = jr("upah_harian").map((j) => j.ref);
  for (const pool of POOL_CODES) {
    const gs = split.filter((s) => s.pool === pool);
    if (!gs.length) continue;
    const refs = gs.flatMap((s) => rekapRefs(s.groupCode)).concat(gs.map((s) => groupOf(s.groupCode)!.ref));
    const daily = gs.filter((s) => s.kind !== "staf");
    if (daily.length) {
      add(pool, { key: "payroll:upah_harian", label: `Upah harian ${[...new Set(daily.map((s) => s.kind))].join(", ")} (GL, porsi rekap)`,
        amount: sum(daily.map((s) => s.wageGl)), fixed: FIXED.upah_harian, origin: "gl", inputs: [...upahRefs, ...refs] });
    }
    const staf = gs.filter((s) => s.kind === "staf");
    if (staf.length) {
      add(pool, { key: "payroll:gaji_staf", label: "Gaji staf bulanan pabrik (rekap)", amount: sum(staf.map((s) => s.wageGl)), fixed: FIXED.gaji_staf,
        origin: "gl", inputs: [...staf.flatMap((s) => rekapRefs(s.groupCode)), ...jr("gaji_staf").map((j) => j.ref)] });
    }
    const kinds = [...new Set(gs.map((s) => s.kind))].join(", ");
    const thrShare = sum(gs.map((s) => s.share));
    add(pool, { key: "payroll:thr", label: `THR ${kinds}`, amount: thrShare.times(thrGl), fixed: FIXED.thr, origin: "gl", inputs: [...thrGlRefs, ...refs] });
    if (!thrTags.isZero()) {
      add(pool, { key: "payroll:thr_adj", label: `THR ${kinds} (koreksi bagian 8)`, amount: thrShare.times(thrTags), fixed: FIXED.thr, origin: "adjustment", inputs: thrTagRefs });
    }
    add(pool, { key: "payroll:bpjs", label: `BPJS ${kinds}`, amount: thrShare.times(bpjsGl), fixed: FIXED.bpjs, origin: "gl", inputs: [...bpjsGlRefs, ...refs] });
    if (!bpjsTags.isZero()) {
      add(pool, { key: "payroll:bpjs_adj", label: `BPJS ${kinds} (koreksi bagian 8)`, amount: thrShare.times(bpjsTags), fixed: FIXED.bpjs, origin: "adjustment", inputs: bpjsTagRefs });
    }
  }
  if (!taliAsih.isZero() || jr("tali_asih").length) {
    add(TALI_ASIH_POOL, { key: "payroll:tali_asih", label: "Tali asih (GL 5101-002 bulan ini)", amount: taliAsih, fixed: FIXED.tali_asih, origin: "gl",
      inputs: jr("tali_asih").map((j) => j.ref) });
  }

  const wp = inp.wpTemplate === "sep26_4";
  const pools: PoolMonthRow[] = POOL_CODES.map((pool): PoolMonthRow => {
    const cs = comps[pool];
    const total = sum(cs.map((c) => c.amount));
    const fixed = sum(cs.filter((c) => c.fixed).map((c) => c.amount));
    const adjustment = sum(cs.filter((c) => c.origin === "adjustment").map((c) => c.amount));
    const r = WP_POOL_ROW[pool];
    return {
      month: inp.month, pool, gl_amount: total.minus(adjustment), adjustment, total, fixed, variable: total.minus(fixed), components: cs,
      rule_id: POOL_RULE, inputs: [...new Set(cs.flatMap((c) => c.inputs))],
      source_ref: wp ? `BIAYA BERSAMA!C${r}` : null,
      source_refs: wp ? { total: `BIAYA BERSAMA!C${r}`, fixed: `BIAYA BERSAMA!D${r}`, variable: `BIAYA BERSAMA!E${r}` } as Record<string, string> : {},
    };
  });

  const poolTotal = sum(pools.map((p) => p.total));
  const stafRekap = sum(split.filter((s) => s.kind === "staf").map((s) => s.rekap));
  const stafJ = jr("gaji_staf");
  return {
    pools, payrollSplit: split, materialFromTags: [...material.values()],
    checks: {
      glConversion, tagsTotal, tagsToPools, tagsToSplit: thrTags.plus(bpjsTags), tagsToMaterial,
      tieOut: poolTotal.minus(glConversion).minus(tagsToPools).minus(thrTags).minus(bpjsTags),
      tagsUnassigned: tagsTotal.minus(tagsToPools).minus(thrTags).minus(bpjsTags).minus(tagsToMaterial),
      stafVsJournal: stafJ.length && split.some((s) => s.kind === "staf") ? stafRekap.minus(sum(stafJ.map((j) => j.amount))) : null,
      thrTotal, bpjsTotal,
    },
  };
}

export interface IdleInput {
  month: string;
  hoursPaid: Decimal;
  hoursToProduct: Decimal;
  poolA: Decimal;
  /** Normal capacity (PPIC); null = hours paid (Q9). */
  normalCapacityHours: Decimal | null;
  /** WP C110: 1 = idle Unit I labour is a period charge, 0 = absorbed by products. */
  idleToPeriod: Decimal;
  inputs: Ref[];
  wpTemplate: "sep26_4" | null;
}

/**
 * idle_hours = hours_paid − Σ man-hour to products; idle_cost = idle_hours × pool A / hours_paid.
 * period_charge = idle_to_period × max(0, idle_hours − (hours_paid − normal_capacity_hours)) × rate.
 * With the defaults (normal = hours paid, flag 0) this is the WP: idle cost computed, nothing charged to the period.
 */
export function idleCapacity(x: IdleInput): IdleMonthRow {
  const idle = x.hoursPaid.minus(x.hoursToProduct);
  const rate = div(x.poolA, x.hoursPaid);
  const normal = x.normalCapacityHours ?? x.hoursPaid;
  const chargeable = max(ZERO, idle.minus(x.hoursPaid.minus(normal)));
  const wp = x.wpTemplate === "sep26_4";
  return {
    month: x.month, hours_paid: x.hoursPaid, hours_to_product: x.hoursToProduct, idle_hours: idle, idle_pct: div(idle, x.hoursPaid),
    rate_per_hour: rate, idle_cost: idle.times(rate), normal_capacity_hours: normal, idle_to_period: x.idleToPeriod,
    period_charge: chargeable.times(rate).times(x.idleToPeriod),
    rule_id: IDLE_RULE, inputs: x.inputs,
    source_ref: wp ? "BIAYA BERSAMA!C109" : null,
    source_refs: wp ? {
      hours_paid: "BIAYA BERSAMA!C105", hours_to_product: "BIAYA BERSAMA!C106", idle_hours: "BIAYA BERSAMA!C107", idle_pct: "BIAYA BERSAMA!D107",
      rate_per_hour: "BIAYA BERSAMA!C108", idle_cost: "BIAYA BERSAMA!C109", idle_to_period: "BIAYA BERSAMA!C110", period_charge: "BIAYA BERSAMA!C111",
    } : {},
  };
}

/** Convenience: pool total by code. */
export function poolTotal(pools: readonly PoolMonthRow[], code: PoolCode): Decimal {
  return pools.find((p) => p.pool === code)?.total ?? D(0);
}

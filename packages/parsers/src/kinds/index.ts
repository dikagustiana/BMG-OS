import type { Role } from "@bmg/engine";
import type { KindParser } from "../kind";
import type { KindDef, UploadKind } from "../tables";
import { averagePrice } from "./average_price";
import { budgetBp } from "./budget_bp";
import { cogmCard } from "./cogm_card";
import { fsControl } from "./fs_control";
import { glMonth } from "./gl_month";
import { glVoucherTag } from "./gl_voucher_tag";
import { inventoryValuation } from "./inventory_valuation";
import { payrollMonth } from "./payroll_month";
import { salesByItem } from "./sales_by_item";
import { stdMaster } from "./std_master";

export { accountOfItem } from "./inventory_valuation";
export { expandBp, parseBp, slug, type BpMonth, type BpPoolRow, type BpRow } from "./budget_bp";
export { FS_KEYS, type FsKey } from "./fs_control";
export { DRIVERS as CARD_DRIVERS, ROW_KINDS } from "./cogm_card";
export { TAGS, TAG_POOLS } from "./gl_voucher_tag";
export { stdHeader } from "./std_master";

/** Registered upload kinds of Fase 1 (B1). Later phases append theirs. */
export const KIND_PARSERS: KindParser[] = [
  glMonth, glVoucherTag, payrollMonth, inventoryValuation, salesByItem, averagePrice, cogmCard, fsControl, budgetBp, stdMaster,
];

export const KINDS: KindDef[] = KIND_PARSERS.map((k) => k.def);

export function kindParser(kind: UploadKind): KindParser {
  const k = KIND_PARSERS.find((x) => x.def.kind === kind);
  if (!k) throw new Error(`Jenis upload belum tersedia: ${kind}`);
  return k;
}

export function kindDef(kind: UploadKind, kinds: KindDef[] = KINDS): KindDef {
  const k = kinds.find((x) => x.kind === kind);
  if (!k) throw new Error(`Jenis upload belum tersedia: ${kind}`);
  return k;
}

export function kindsForRole(role: Role, kinds: KindDef[] = KINDS): KindDef[] {
  return kinds.filter((k) => k.roles.includes(role));
}

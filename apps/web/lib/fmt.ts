/** House number format via Intl.NumberFormat('id-ID'): Rp 24.600; 6,3%. Display only — maths stays in decimals. */
import type { Decimal } from "@bmg/engine";

const cache = new Map<string, Intl.NumberFormat>();
function nf(dp: number) {
  const k = String(dp);
  let f = cache.get(k);
  if (!f) {
    f = new Intl.NumberFormat("id-ID", { minimumFractionDigits: dp, maximumFractionDigits: dp });
    cache.set(k, f);
  }
  return f;
}

type DecLike = Decimal | number | string | null | undefined;

function toNum(v: DecLike, dp: number): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const s = typeof v === "string" ? v : v.toFixed(dp);
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function num(v: DecLike, dp = 0): string {
  const n = toNum(v, dp);
  if (n === null) return "";
  const r = nf(dp).format(n);
  return r === "-0" ? "0" : r.replace(/^-0(,0+)?$/, (m) => m.slice(1));
}

export function pct(v: DecLike, dp = 1): string {
  const n = toNum(v, 8);
  return n === null ? "" : `${num(n * 100, dp)}%`;
}

export function rp(v: DecLike): string {
  const s = num(v, 0);
  return s === "" ? "" : `Rp ${s}`;
}

export function jt(v: DecLike, dp = 1): string {
  const n = toNum(v, 2);
  return n === null ? "" : `${num(n / 1e6, dp)} jt`;
}

/** Billions in the house short form: 2.782.158.916 → "2,78 M". */
export function mrd(v: DecLike, dp = 2): string {
  const n = toNum(v, 2);
  return n === null ? "" : `${num(n / 1e9, dp)} M`;
}

export function isNeg(v: DecLike): boolean {
  const n = toNum(v, 6);
  return n !== null && n < -0.0000005;
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function tgl(iso: string | null | undefined, withDay = false): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${withDay ? DAYS[dow] + " " : ""}${d} ${MONTHS[m - 1]} ${y}`;
}

export function tglShort(iso: string | null | undefined): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "Sep-26" (PRD v2 §8.3). */
export function bulan(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]}-${String(y).slice(2)}`;
}

/** "Minggu 12 Okt" for a Monday. */
export function minggu(iso: string | null | undefined): string {
  return iso ? `Minggu ${tglShort(iso)}` : "";
}

/** Signed with an explicit plus: "+650,9 jt", "−5,4 pp". */
export function signed(text: string, v: DecLike): string {
  const n = toNum(v, 6);
  if (n === null || text === "") return text;
  if (n > 0.0000005) return `+${text}`;
  return text.replace(/^-/, "−");
}

/** Rp juta, one decimal, signed when asked. */
export function jtS(v: DecLike, dp = 1): string {
  return signed(jt(v, dp), v);
}

/** Percentage points from a ratio difference: 0,054 → "5,4 pp". */
export function pp(v: DecLike, dp = 1): string {
  const n = toNum(v, 8);
  return n === null ? "" : `${num(n * 100, dp)} pp`;
}

/** Change ratio a/b − 1, or null when b is zero or missing. */
export function change(a: DecLike, b: DecLike): number | null {
  const x = toNum(a, 6), y = toNum(b, 6);
  if (x === null || y === null || y === 0) return null;
  return x / y - 1;
}

/** Date-time "16 Okt 2026 08.15" (Asia/Jakarta). */
export function waktu(ts: string | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const j = new Date(d.getTime() + 7 * 3600_000);
  const iso = j.toISOString();
  return `${tgl(iso.slice(0, 10))} ${iso.slice(11, 13)}.${iso.slice(14, 16)}`;
}

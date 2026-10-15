import { addMonths, isMonth, jakartaToday, monthOf } from "@bmg/engine";

/** Months in routes (server side). */

/** The month the preparers work on by default: the previous calendar month (Jakarta). */
export function defaultMonth(now: Date = new Date()): string {
  return addMonths(monthOf(jakartaToday(now)), -1);
}

/** Route param → month start, or null when it is not a month. */
export function monthParam(raw: string): string | null {
  return isMonth(raw) ? monthOf(raw) : null;
}

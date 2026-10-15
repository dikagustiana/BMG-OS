import { addMonths, isISODate, isMonth, jakartaToday, mondayOf, monthOf } from "@bmg/engine";

/** Months and weeks in routes (server side). */

/** The month the preparers work on by default: the previous calendar month (Jakarta). */
export function defaultMonth(now: Date = new Date()): string {
  return addMonths(monthOf(jakartaToday(now)), -1);
}

/** Monday of the current week (Jakarta, Q20). */
export function defaultWeek(now: Date = new Date()): string {
  return mondayOf(jakartaToday(now));
}

/** Route param → month start, or null when it is not a month. */
export function monthParam(raw: string): string | null {
  return isMonth(raw) ? monthOf(raw) : null;
}

/** Route param → Monday, or null when it is not a date. */
export function weekParam(raw: string): string | null {
  return isISODate(raw) ? mondayOf(raw) : null;
}

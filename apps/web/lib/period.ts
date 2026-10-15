/** Storage folder for a period (month start, Monday, or a version name). Client-safe: no imports. */
export function storagePrefix(period: string): string {
  return period.replace(/[^\w.-]+/g, "_");
}

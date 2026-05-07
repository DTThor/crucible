/**
 * Timezone helpers anchored on America/Chicago (the user's home tz).
 * Avoids the trap of constructing Date objects from "YYYY-MM-DD" strings
 * — those parse as local time on whatever runtime is executing, which
 * silently breaks when the server is UTC and the client is Chicago.
 *
 * Always pass YMD strings around the wire; only construct Dates inside
 * these helpers.
 */

export const APP_TZ = "America/Chicago";

/** "YYYY-MM-DD" for the given absolute moment, in the app's timezone. */
export function localDateKey(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Today's YMD in the app's timezone. */
export function todayKey(): string {
  return localDateKey(new Date());
}

/**
 * Day of week (0=Sun ... 6=Sat) for a YMD string. Computed
 * timezone-neutral: just treats the YMD as a calendar date.
 */
export function dowFromIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  // UTC Date avoids any local TZ skew. Day-of-week is the same
  // regardless of tz when the calendar date is unambiguous.
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Day-of-month integer for a YMD string (the "7" in "2026-05-07"). */
export function dayOfMonthFromIso(iso: string): number {
  return parseInt(iso.slice(8, 10), 10);
}

/** Month index 0–11 for a YMD string. */
export function monthFromIso(iso: string): number {
  return parseInt(iso.slice(5, 7), 10) - 1;
}

/** Year integer for a YMD string. */
export function yearFromIso(iso: string): number {
  return parseInt(iso.slice(0, 4), 10);
}

/**
 * Add N calendar days to a YMD string (in the app's tz). N may be
 * negative. Always returns a clean YMD.
 */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear().toString();
  const mm = (dt.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = dt.getUTCDate().toString().padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * UTC ISO timestamp for "midnight at the start of `dateIso` in the
 * app's tz". Tries both -05:00 (CDT) and -06:00 (CST) candidates and
 * picks the one that round-trips to the same YMD when re-formatted in
 * the app's tz. Necessary because Chicago has DST.
 */
export function startOfDayUtcIso(dateIso: string): string {
  for (const offset of ["-05:00", "-06:00"]) {
    const dt = new Date(`${dateIso}T00:00:00${offset}`);
    if (localDateKey(dt) === dateIso) return dt.toISOString();
  }
  // Fallback (shouldn't hit) — return whichever DST bracket Chicago
  // is in based on the month. May–Nov is CDT, otherwise CST.
  const [, m] = dateIso.split("-").map(Number);
  const offset = m >= 4 && m <= 10 ? "-05:00" : "-06:00";
  return new Date(`${dateIso}T00:00:00${offset}`).toISOString();
}

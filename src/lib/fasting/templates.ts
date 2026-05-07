import type { ProtocolSlug } from "./protocols";

/**
 * Default weekly fasting template — Fung-anchored, biased to the
 * user's stated preferences:
 *
 *   • All fasts start after dinner (or occasional late lunch). The
 *     overnight fast counts in each day's protocol.
 *   • Weekly therapeutic 42-hour fast: Sunday ~6pm dinner is the last
 *     meal, Monday is fully fasted, Tuesday lunch (~12pm) breaks it.
 *   • Weekend protocols are shorter (16:8) for social flexibility.
 *   • Tuesday is the refeed day (18:6 — lunch + dinner).
 *   • Wed/Thu lean into OMAD; Friday relaxes to 18:6 for family meals.
 *
 * Days are JS-style: 0 = Sunday … 6 = Saturday.
 */
export const DEFAULT_WEEKLY_TEMPLATE: Record<number, ProtocolSlug> = {
  0: "16:8", // Sun — weekend, dinner is the last meal before the 42h
  1: "42h", // Mon — fully fasted; the centerpiece of the week
  2: "18:6", // Tue — refeed (lunch + dinner)
  3: "omad", // Wed
  4: "omad", // Thu
  5: "18:6", // Fri — social-flexible
  6: "16:8", // Sat — weekend
};

/** Today's planned protocol per the default template. */
export function getTodayProtocol(now = new Date()): ProtocolSlug {
  return DEFAULT_WEEKLY_TEMPLATE[now.getDay()];
}

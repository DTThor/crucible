import type { ProtocolSlug } from "./protocols";

/**
 * Default weekly fasting template, anchored in the program design from
 * architecture.md §4.1: 5× OMAD, 1× 36-hour, 2× 16:8 social-flexible.
 *
 * Days are JS-style: 0 = Sunday … 6 = Saturday.
 *
 * In v2 this becomes a per-user editable template stored in
 * fasting_templates.week_pattern. For v1 we hardcode and read the
 * user's selection later.
 */
export const DEFAULT_WEEKLY_TEMPLATE: Record<number, ProtocolSlug> = {
  0: "omad", // Sun
  1: "omad", // Mon
  2: "omad", // Tue
  3: "36h", // Wed
  4: "omad", // Thu
  5: "16:8", // Fri  — family-flexible
  6: "16:8", // Sat  — family-flexible
};

/** Today's planned protocol per the default template. */
export function getTodayProtocol(now = new Date()): ProtocolSlug {
  return DEFAULT_WEEKLY_TEMPLATE[now.getDay()];
}

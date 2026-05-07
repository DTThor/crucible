/**
 * Dr. Fung-anchored scheduling rules for fast-workout pairings.
 *
 * The throughline of Fung's work (Obesity Code, Diabetes Code) is that
 * insulin is the master hormone for fat storage and metabolic disease,
 * and that *therapeutic fasting* — going beyond simple calorie
 * restriction — drives autophagy, fat mobilization, and HGH preservation
 * of lean tissue. The exercise programming that pairs best with this is
 * about three things:
 *
 *   1. Don't dig a hole. Hard work fasted past 24h burns more than it
 *      builds. Save heavy lifting for refeed days.
 *   2. Capitalize on the refeed. The first meal after a long fast is a
 *      pharmacological dose of amino acids + insulin sensitivity. Lift
 *      heavy that day if you can.
 *   3. Sauna + cold + zone-2 walks are *amplifiers* of fasting, not
 *      taxes on it — schedule them on long-fast days.
 *
 * The matrix below encodes a per-pairing rating. It's not a rulebook;
 * it's guidance the user can override.
 */

import type { ProtocolSlug } from "@/lib/fasting/protocols";
import type { WorkoutType } from "@/lib/training/templates";
import type { PlannedDay } from "./types";
import { addDays, dowFromIso } from "@/lib/tz";

/** How many calendar days a fast affects (start eve → fully fasted → refeed). */
export function protocolSpanDays(slug: ProtocolSlug): {
  startEve: boolean; // previous evening is the last meal
  fastedDay: boolean; // the named day is fully fasted
  refeedDay: boolean; // next day is the refeed
} {
  switch (slug) {
    case "36h":
    case "42h":
      return { startEve: true, fastedDay: true, refeedDay: true };
    default:
      // 16:8, 18:6, OMAD all fit within a single calendar day in
      // Fung's framing — eating window opens and closes on the same
      // day.
      return { startEve: false, fastedDay: false, refeedDay: false };
  }
}

/** Is this a "long fast" (24h+) that bleeds into adjacent days? */
export function isLongFast(slug: ProtocolSlug): boolean {
  return slug === "36h" || slug === "42h";
}

/** Hard workouts are the ones we don't want to do during a long fast. */
export function isHardWorkout(type: WorkoutType): boolean {
  return type === "lift" || type === "gtx";
}

/** Pairing rating: how well a workout fits a given fasting protocol. */
export type PairingLevel = "great" | "ok" | "caution" | "avoid";

export function ratePairing(
  workout: WorkoutType,
  fast: ProtocolSlug,
): { level: PairingLevel; reason: string } {
  // Long fasts (36h+) on hard workout days = bad call.
  if (isLongFast(fast) && isHardWorkout(workout)) {
    return {
      level: "avoid",
      reason:
        workout === "gtx"
          ? "GTX class fasted past 24h tanks performance and recovery. Plan it the day before or after."
          : "Heavy lifting fasted past 24h is the worst of both worlds — light stim, heavy cost. Save it for the refeed.",
    };
  }
  if (isLongFast(fast) && workout === "cardio") {
    return {
      level: "caution",
      reason:
        "Zone-2 walking is fine on a 36h fast. Anything harder than that — back off until refeed.",
    };
  }
  if (isLongFast(fast) && workout === "recovery") {
    return {
      level: "great",
      reason:
        "Sauna + cold plunge + walk during a long fast amplifies the autophagy + parasympathetic recovery effects. This is the best pairing.",
    };
  }
  if (isLongFast(fast) && workout === "rest") {
    return {
      level: "great",
      reason:
        "Rest is the right answer on a long fast day. Sleep + hydration + light activity only.",
    };
  }

  // OMAD pairings — biggest meal of the day fits naturally as
  // post-workout refeed.
  if (fast === "omad") {
    if (workout === "lift") {
      return {
        level: "great",
        reason:
          "Lift in the late afternoon, eat a big meal after. Insulin sensitivity is high, the meal goes to muscle.",
      };
    }
    if (workout === "gtx") {
      return {
        level: "ok",
        reason:
          "GTX before your one meal is doable — eat hard after. If your class is morning, OMAD might leave you flat.",
      };
    }
    if (workout === "cardio") {
      return {
        level: "great",
        reason:
          "Zone-2 in the fasted state torches fat. HIIT works too if you eat shortly after.",
      };
    }
  }

  // 16:8 / 18:6 — flexible windows, almost any workout fits.
  if (fast === "16:8" || fast === "18:6") {
    if (workout === "lift" || workout === "gtx") {
      return {
        level: "great",
        reason:
          "Time the workout near the end of your fast so the meal is post-workout. Insulin + amino acids → muscle.",
      };
    }
    if (workout === "cardio") {
      return {
        level: "great",
        reason: "Easy schedule. Cardio fasted, eat after.",
      };
    }
  }

  return {
    level: "ok",
    reason: "Workable pairing. Listen to your body.",
  };
}

/** Highest-rated workout for a given fast. */
export function recommendedWorkout(fast: ProtocolSlug): WorkoutType {
  if (isLongFast(fast)) return "recovery";
  if (fast === "omad") return "lift";
  return "lift"; // 16:8 / 18:6 also great for lifting
}

/** Highest-rated fast for a given workout. */
export function recommendedFast(workout: WorkoutType): ProtocolSlug {
  switch (workout) {
    case "lift":
      return "omad";
    case "gtx":
      return "16:8";
    case "cardio":
      return "omad";
    case "recovery":
      return "36h";
    case "rest":
      return "36h";
    default:
      return "16:8";
  }
}

/**
 * Conflict warnings derived from the surrounding days. Returns an
 * array of human-readable warnings for the editor to surface.
 *
 * @param day        The day being edited.
 * @param prior      The day before (`null` if unknown — e.g. before today).
 * @param next       The day after (`null` if unknown).
 */
export function detectConflicts(
  day: PlannedDay,
  prior: PlannedDay | null,
  next: PlannedDay | null,
): string[] {
  const warnings: string[] = [];

  // Long fast today: warn about pairings on this day + adjacent days.
  if (isLongFast(day.fastingProtocolSlug)) {
    if (isHardWorkout(day.workoutType)) {
      warnings.push(
        `Long fast (${day.fastingProtocolSlug}) + hard workout = bad combo. Move the lift/GTX to the refeed day instead.`,
      );
    }
    if (next && isHardWorkout(next.workoutType)) {
      // The refeed day with a lift = ideal. No warning, but note it.
    } else if (next && next.workoutType === "rest") {
      warnings.push(
        "Refeed day after a long fast is the best lifting opportunity of the week. Consider scheduling a lift the day after.",
      );
    }
    if (prior && isLongFast(prior.fastingProtocolSlug)) {
      warnings.push(
        "Two long fasts back-to-back is a deep cut. Make sure refeeds in between are real meals.",
      );
    }
  }

  // The day after a long fast — should be eating.
  if (
    prior &&
    isLongFast(prior.fastingProtocolSlug) &&
    isLongFast(day.fastingProtocolSlug)
  ) {
    warnings.push(
      `Yesterday was a ${prior.fastingProtocolSlug}; you need a refeed today, not another long fast.`,
    );
  }

  return warnings;
}

/**
 * Short coaching note explaining today's pairing. Used as a tooltip /
 * subtitle on the day card.
 */
export function coachingNote(day: PlannedDay): string {
  return ratePairing(day.workoutType, day.fastingProtocolSlug).reason;
}

/**
 * Tag a day as part of a fasting span for visual hints in the planner.
 * Returns "eve" for the day before a long fast, "refeed" for the day
 * after, "long" for the long-fast day itself, "none" otherwise.
 */
export function fastSpanRole(
  day: PlannedDay,
  prior: PlannedDay | null,
  next: PlannedDay | null,
): "eve" | "long" | "refeed" | "none" {
  if (isLongFast(day.fastingProtocolSlug)) return "long";
  if (next && isLongFast(next.fastingProtocolSlug)) return "eve";
  if (prior && isLongFast(prior.fastingProtocolSlug)) return "refeed";
  return "none";
}

/**
 * Walk through a sequence of planned days and return a list of
 * cross-day issues — useful at the top of the Plan tab as an at-a-
 * glance audit. Currently flags long-fast days that aren't paired
 * with a refeed-friendly day after.
 */
export function auditWeek(days: PlannedDay[]): {
  dateIso: string;
  message: string;
}[] {
  const issues: { dateIso: string; message: string }[] = [];
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const prior = i > 0 ? days[i - 1] : null;
    const next = i < days.length - 1 ? days[i + 1] : null;
    if (isLongFast(day.fastingProtocolSlug) && isHardWorkout(day.workoutType)) {
      issues.push({
        dateIso: day.dateIso,
        message: `${weekdayLabel(day.dayOfWeek)}: ${day.fastingProtocolSlug} + ${day.workoutType} — hard workout fasted past 24h. Move it.`,
      });
    }
    // Surface a "you should lift the day after a long fast" gentle nudge
    // if the day after is currently rest with no override.
    if (
      isLongFast(day.fastingProtocolSlug) &&
      next &&
      next.workoutType === "rest"
    ) {
      issues.push({
        dateIso: next.dateIso,
        message: `${weekdayLabel(next.dayOfWeek)}: refeed day after ${day.fastingProtocolSlug} — prime time for a lift, you're set to rest.`,
      });
    }
    void prior; // reserved for future cross-day rules
  }
  return issues;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function weekdayLabel(dow: number): string {
  return WEEKDAY_LABELS[dow] ?? "";
}

// Re-export tz helpers used by callers via this module so coaching
// callers don't have to know two import paths.
export { addDays, dowFromIso };

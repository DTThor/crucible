/**
 * Smart weight + rep suggestion based on the user's last rated session
 * of an exercise.
 *
 * The algorithm uses a 1–10 difficulty (RPE-style) rating from the
 * previous session:
 *
 *   ≤6  easy        → bump weight to the next available size
 *    7  moderate    → keep weight, push reps (+1)
 *    8  hard        → hold steady (the sweet spot for hypertrophy)
 *   9-10 too hard   → deload to previous available size, keep reps
 *
 * If the previous session had no rating, suggest a repeat of the same
 * weight + reps.
 *
 * Crucially, weight changes snap to *real* equipment increments (5 lb
 * for everything we currently support — DBs, BBs, KBs, machines all
 * step in 5 lb at most gyms). So 60 lb won't try to suggest 57.5 lb,
 * because that's not a thing you'd find in a rack.
 */

import type { ExerciseEquipment } from "./exercises";

export interface ExerciseHistory {
  weight_lb: number;
  reps: number;
  rpe: number | null;
}

export interface Suggestion {
  weight_lb: number;
  reps: number;
  reasoning: string;
}

/**
 * Smallest jump between consecutive sizes available for the equipment.
 * Most gyms stock everything at 5 lb increments; some have 2.5 lb at
 * the low end of the DB rack but going up by 5 lb is still safer
 * (you've already proven you can do it at the previous weight).
 */
function stepFor(equipment: ExerciseEquipment): number {
  switch (equipment) {
    case "bodyweight":
    case "cardio":
      return 0;
    default:
      return 5;
  }
}

function snap(lb: number, step: number): number {
  if (step <= 0) return lb;
  return Math.round(lb / step) * step;
}

/**
 * Next available weight up the rack from `currentLb` for this
 * equipment — i.e. snap, then bump one step.
 */
function nextWeightUp(currentLb: number, equipment: ExerciseEquipment): number {
  const step = stepFor(equipment);
  if (step === 0) return currentLb;
  const snapped = snap(currentLb, step);
  // If the user's actual weight was below the snapped value, just
  // returning snapped would be a "free" increase. Push past it.
  if (snapped > currentLb) return snapped;
  return snapped + step;
}

/**
 * Previous available weight down the rack from `currentLb` for this
 * equipment.
 */
function prevWeightDown(
  currentLb: number,
  equipment: ExerciseEquipment,
): number {
  const step = stepFor(equipment);
  if (step === 0) return currentLb;
  const snapped = snap(currentLb, step);
  if (snapped < currentLb) return Math.max(step, snapped);
  return Math.max(step, snapped - step);
}

export function suggestNext(
  prev: ExerciseHistory | null,
  fallbackReps: number,
  equipment: ExerciseEquipment = "db",
): Suggestion | null {
  if (!prev) return null;
  const { weight_lb, reps, rpe } = prev;

  if (rpe == null) {
    return {
      weight_lb: snap(weight_lb, stepFor(equipment) || 1),
      reps: reps || fallbackReps,
      reasoning: "Repeat last session",
    };
  }
  if (rpe <= 6) {
    const next = nextWeightUp(weight_lb, equipment);
    return {
      weight_lb: next,
      reps: reps || fallbackReps,
      reasoning: `+${next - weight_lb} lb (felt easy)`,
    };
  }
  if (rpe === 7) {
    return {
      weight_lb: snap(weight_lb, stepFor(equipment) || 1),
      reps: (reps || fallbackReps) + 1,
      reasoning: "+1 rep (push reps)",
    };
  }
  if (rpe === 8) {
    return {
      weight_lb: snap(weight_lb, stepFor(equipment) || 1),
      reps: reps || fallbackReps,
      reasoning: "Hold steady (in the zone)",
    };
  }
  // 9–10
  const prevDown = prevWeightDown(weight_lb, equipment);
  return {
    weight_lb: prevDown,
    reps: reps || fallbackReps,
    reasoning:
      prevDown < weight_lb
        ? `-${weight_lb - prevDown} lb (was near max)`
        : "Hold (already at floor)",
  };
}

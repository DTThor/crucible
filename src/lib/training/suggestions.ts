/**
 * Smart weight + rep suggestion based on the user's last rated session
 * of an exercise.
 *
 * The algorithm assumes the user rates each exercise on a 1–10 difficulty
 * scale (RPE-style) when they finish all the prescribed sets. The rating
 * tells us how to nudge them next time:
 *
 *   ≤6  easy        → bump weight (+2.5 lb), keep reps
 *    7  moderate    → keep weight, push reps (+1)
 *    8  hard        → hold steady (the sweet spot for hypertrophy)
 *   9-10 too hard   → deload (-2.5 lb), keep reps
 *
 * If the previous session had no rating, we just suggest a repeat.
 */

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

const STEP_LB = 2.5;

function roundToStep(n: number, step = STEP_LB): number {
  return Math.round(n / step) * step;
}

export function suggestNext(
  prev: ExerciseHistory | null,
  fallbackReps: number,
): Suggestion | null {
  if (!prev) return null;
  const { weight_lb, reps, rpe } = prev;

  if (rpe == null) {
    return {
      weight_lb,
      reps: reps || fallbackReps,
      reasoning: "Repeat last session",
    };
  }
  if (rpe <= 6) {
    return {
      weight_lb: roundToStep(weight_lb + STEP_LB),
      reps: reps || fallbackReps,
      reasoning: `+${STEP_LB} lb (felt easy)`,
    };
  }
  if (rpe === 7) {
    return {
      weight_lb,
      reps: (reps || fallbackReps) + 1,
      reasoning: "+1 rep (push reps)",
    };
  }
  if (rpe === 8) {
    return {
      weight_lb,
      reps: reps || fallbackReps,
      reasoning: "Hold steady (in the zone)",
    };
  }
  // 9–10
  return {
    weight_lb: Math.max(STEP_LB, roundToStep(weight_lb - STEP_LB)),
    reps: reps || fallbackReps,
    reasoning: `-${STEP_LB} lb (was near max)`,
  };
}

/**
 * Workout templates and weekly schedule. Anchored in architecture.md §5
 * with the program design synced to the fasting schedule (lifts on OMAD
 * days so the post-workout meal is the refeed; light recovery on the
 * 36-hour fast day; GTX classes on Mon/Thu/Sat).
 */

export type WorkoutType = "gtx" | "lift" | "cardio" | "recovery" | "rest";

export interface WorkoutBlock {
  exerciseSlug: string;
  sets: number;
  /** Suggested rep target (override exercise default). */
  reps?: number;
  notes?: string;
}

export interface WorkoutTemplate {
  slug: string;
  name: string;
  type: WorkoutType;
  durationTargetMin: number;
  blocks: WorkoutBlock[];
}

export const WORKOUT_TEMPLATES: Record<string, WorkoutTemplate> = {
  upper_body_db: {
    slug: "upper_body_db",
    name: "Upper body — DB",
    type: "lift",
    durationTargetMin: 30,
    blocks: [
      { exerciseSlug: "db-bench-press", sets: 4, reps: 10 },
      { exerciseSlug: "db-row", sets: 4, reps: 10 },
      { exerciseSlug: "db-shoulder-press", sets: 3, reps: 10 },
      { exerciseSlug: "kb-swing", sets: 3, reps: 15, notes: "Finisher" },
    ],
  },
  lower_kb_focus: {
    slug: "lower_kb_focus",
    name: "Lower body — KB + leg press",
    type: "lift",
    durationTargetMin: 30,
    blocks: [
      { exerciseSlug: "leg-press", sets: 4, reps: 10 },
      { exerciseSlug: "db-romanian-deadlift", sets: 3, reps: 10 },
      { exerciseSlug: "kb-goblet-squat", sets: 3, reps: 12 },
      { exerciseSlug: "farmers-carry", sets: 3, reps: 1, notes: "30s carry" },
    ],
  },
  full_body_kb: {
    slug: "full_body_kb",
    name: "Full body — KB",
    type: "lift",
    durationTargetMin: 30,
    blocks: [
      { exerciseSlug: "kb-clean-and-press", sets: 3, reps: 8 },
      { exerciseSlug: "kb-goblet-squat", sets: 3, reps: 12 },
      { exerciseSlug: "kb-swing", sets: 4, reps: 15 },
      { exerciseSlug: "kb-turkish-getup", sets: 3, reps: 5 },
    ],
  },
};

/**
 * Default weekly training template. 0=Sun ... 6=Sat.
 *
 * Aligned with the fasting schedule:
 *   Mon/Thu (OMAD)   → GTX class (hardest workouts on refeed days)
 *   Tue (OMAD)       → 30m DB upper + sauna/cold (Phase 2C)
 *   Wed (36h fast)   → recovery (light walk + sauna only — don't dig a hole)
 *   Fri (16:8)       → 30m KB + leg press + sauna/cold
 *   Sat (16:8)       → GTX or zone-2 cardio
 *   Sun (OMAD)       → rest / mobility
 */
export interface WeeklyTrainingDay {
  type: WorkoutType;
  /** For lift days, which template to use. */
  templateSlug?: string;
  /** Display label. */
  label: string;
}

export const DEFAULT_TRAINING_WEEK: Record<number, WeeklyTrainingDay> = {
  0: { type: "rest", label: "Rest / mobility" }, // Sun
  1: { type: "gtx", label: "GTX class" }, // Mon
  2: { type: "lift", templateSlug: "upper_body_db", label: "Upper body — DB" }, // Tue
  3: { type: "recovery", label: "Light walk + sauna" }, // Wed
  4: { type: "gtx", label: "GTX class" }, // Thu
  5: {
    type: "lift",
    templateSlug: "lower_kb_focus",
    label: "Lower body — KB",
  }, // Fri
  6: { type: "cardio", label: "GTX or zone-2 cardio" }, // Sat
};

/** Today's planned training session per the default template. */
export function getTodayTraining(now = new Date()): WeeklyTrainingDay {
  return DEFAULT_TRAINING_WEEK[now.getDay()];
}

export function getTemplate(slug: string): WorkoutTemplate | null {
  return WORKOUT_TEMPLATES[slug] ?? null;
}

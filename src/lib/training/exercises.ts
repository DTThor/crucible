/**
 * Hardcoded exercise library. Sync with workout_sets.exercise_slug.
 * Storing exercises in code (not a DB table) for v1 — they're read-only
 * reference data. We can move to a proper table later if we want
 * user-editable exercises.
 */

export type ExerciseEquipment =
  | "db" // dumbbell
  | "bb" // barbell
  | "kb" // kettlebell
  | "machine"
  | "bodyweight"
  | "cardio";

export type ExerciseCategory = "lift" | "cardio" | "mobility" | "carry";

export interface Exercise {
  slug: string;
  name: string;
  equipment: ExerciseEquipment;
  category: ExerciseCategory;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  isUnilateral?: boolean;
  /** Default rep target shown in suggestion text. Templates can override. */
  defaultReps?: number;
}

export const EXERCISES: Exercise[] = [
  // ── Dumbbell compounds ────────────────────────────────
  {
    slug: "db-bench-press",
    name: "DB Bench Press",
    equipment: "db",
    category: "lift",
    primaryMuscle: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    defaultReps: 10,
  },
  {
    slug: "db-row",
    name: "DB Row",
    equipment: "db",
    category: "lift",
    primaryMuscle: "back",
    secondaryMuscles: ["biceps"],
    isUnilateral: true,
    defaultReps: 10,
  },
  {
    slug: "db-shoulder-press",
    name: "DB Shoulder Press",
    equipment: "db",
    category: "lift",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["triceps"],
    defaultReps: 10,
  },
  {
    slug: "db-romanian-deadlift",
    name: "DB Romanian Deadlift",
    equipment: "db",
    category: "lift",
    primaryMuscle: "hamstrings",
    secondaryMuscles: ["glutes", "back"],
    defaultReps: 10,
  },
  {
    slug: "db-lunge",
    name: "DB Lunge",
    equipment: "db",
    category: "lift",
    primaryMuscle: "quads",
    secondaryMuscles: ["glutes"],
    isUnilateral: true,
    defaultReps: 10,
  },
  {
    slug: "db-curl",
    name: "DB Curl",
    equipment: "db",
    category: "lift",
    primaryMuscle: "biceps",
    defaultReps: 12,
  },

  // ── Barbell ───────────────────────────────────────────
  {
    slug: "bb-bench-press",
    name: "Bench Press",
    equipment: "bb",
    category: "lift",
    primaryMuscle: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    defaultReps: 8,
  },

  // ── Machines ──────────────────────────────────────────
  {
    slug: "leg-press",
    name: "Leg Press",
    equipment: "machine",
    category: "lift",
    primaryMuscle: "quads",
    secondaryMuscles: ["glutes", "hamstrings"],
    defaultReps: 10,
  },
  {
    slug: "lat-pulldown",
    name: "Lat Pulldown",
    equipment: "machine",
    category: "lift",
    primaryMuscle: "back",
    secondaryMuscles: ["biceps"],
    defaultReps: 10,
  },

  // ── Kettlebell ────────────────────────────────────────
  {
    slug: "kb-swing",
    name: "KB Swing",
    equipment: "kb",
    category: "lift",
    primaryMuscle: "posterior chain",
    secondaryMuscles: ["glutes", "hamstrings"],
    defaultReps: 15,
  },
  {
    slug: "kb-goblet-squat",
    name: "KB Goblet Squat",
    equipment: "kb",
    category: "lift",
    primaryMuscle: "quads",
    secondaryMuscles: ["glutes"],
    defaultReps: 12,
  },
  {
    slug: "kb-clean-and-press",
    name: "KB Clean & Press",
    equipment: "kb",
    category: "lift",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["legs", "back"],
    isUnilateral: true,
    defaultReps: 8,
  },
  {
    slug: "kb-turkish-getup",
    name: "Turkish Get-Up",
    equipment: "kb",
    category: "lift",
    primaryMuscle: "core",
    secondaryMuscles: ["shoulders", "glutes"],
    isUnilateral: true,
    defaultReps: 5,
  },

  // ── Carries ───────────────────────────────────────────
  {
    slug: "farmers-carry",
    name: "Farmer's Carry",
    equipment: "db",
    category: "carry",
    primaryMuscle: "grip",
    secondaryMuscles: ["traps", "core"],
    defaultReps: 1, // measured in time/distance, not reps
  },
];

const EXERCISE_BY_SLUG: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.slug, e]),
);

export function getExercise(slug: string): Exercise | null {
  return EXERCISE_BY_SLUG[slug] ?? null;
}

/**
 * Type-specific workout detail shapes. Stored on workouts.details
 * (jsonb) — see migration 0003. Validated/normalized client-side; the
 * DB column is loose so we can evolve the shape without an ALTER.
 *
 * Lift workouts don't use this — their data lives in workout_sets.
 */

export type CardioModality =
  | "zone2-walk"
  | "run"
  | "bike"
  | "row"
  | "hike"
  | "swim"
  | "other";

export const CARDIO_MODALITY_LABELS: Record<CardioModality, string> = {
  "zone2-walk": "Zone-2 walk",
  run: "Run",
  bike: "Bike",
  row: "Row",
  hike: "Hike",
  swim: "Swim",
  other: "Other",
};

export const CARDIO_MODALITIES: CardioModality[] = [
  "zone2-walk",
  "run",
  "bike",
  "row",
  "hike",
  "swim",
  "other",
];

export interface GtxDetails {
  rpe?: number | null;
  notes?: string | null;
}

export interface CardioDetails {
  modality?: CardioModality | null;
  minutes?: number | null;
  rpe?: number | null;
  notes?: string | null;
}

export interface RecoveryDetails {
  sauna_min?: number | null;
  cold_plunge_min?: number | null;
  walk_min?: number | null;
  walk_distance_mi?: number | null;
  mobility_min?: number | null;
  notes?: string | null;
}

/**
 * Anything-shaped detail object stored in the DB. We branch on workout
 * type to know which fields to read.
 */
export type WorkoutDetails =
  | GtxDetails
  | CardioDetails
  | RecoveryDetails
  | Record<string, unknown>;

/** Convenience: was anything actually logged? */
export function hasDetails(d: WorkoutDetails | null | undefined): boolean {
  if (!d) return false;
  return Object.values(d).some(
    (v) => v != null && v !== "" && (typeof v !== "number" || v !== 0),
  );
}

/**
 * Strip empty strings + null/undefined values before saving — we want
 * `{ minutes: 30, rpe: 7 }`, not `{ minutes: 30, rpe: 7, notes: "" }`.
 */
export function compactDetails(d: WorkoutDetails): WorkoutDetails {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v == null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = typeof v === "string" ? v.trim() : v;
  }
  return out;
}

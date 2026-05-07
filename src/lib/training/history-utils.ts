/**
 * Pure (no server-only imports) helpers + types for workout history.
 * Lives separately from history.ts so client components can import
 * these without pulling in the Supabase server client.
 */

export interface HistoricWorkout {
  id: string;
  type: string;
  template_slug: string | null;
  /** Display title — template name if available, else type. */
  title: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  notes: string | null;
  duration_min: number;
  set_count: number;
  total_volume_lb: number;
}

export interface WorkoutStats {
  weekCount: number;
  weekVolumeLb: number;
  monthCount: number;
  monthVolumeLb: number;
  lifetimeCount: number;
}

export interface ExerciseSummary {
  slug: string;
  name: string;
  setCount: number;
  lastIso: string;
}

export interface ExercisePoint {
  workoutId: string;
  startedIso: string;
  topWeightLb: number;
  topReps: number;
  totalVolumeLb: number;
  setCount: number;
  rpe: number | null;
}

/**
 * Format pounds with a thousands separator, no trailing decimals when
 * the value is whole. e.g. 12_500 → "12,500".
 */
export function formatVolume(lb: number): string {
  return Math.round(lb).toLocaleString("en-US");
}

export function formatDuration(min: number): string {
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  return m === 0 ? `${h}h` : `${h}h ${m.toString().padStart(2, "0")}m`;
}

/**
 * Re-export the (already computed server-side) stats untouched. This
 * exists so client components have a typed entry point next to the
 * other pure helpers — and so we have a place to put any future
 * client-side derivations (e.g. PR detection from progression points).
 */
export function computeWorkoutStats(stats: WorkoutStats): WorkoutStats {
  return stats;
}

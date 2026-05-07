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
  /** Type-specific details payload (cardio, recovery, gtx). null for lift. */
  details: Record<string, unknown> | null;
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

/**
 * Format a one-line summary describing what was logged in this
 * workout, type-aware. Used in the recent-workouts list so cardio
 * shows "Bike · 30 min" rather than the misleading session duration.
 */
export function formatHistoricSummary(w: HistoricWorkout): string {
  const parts: string[] = [];
  if (w.type === "lift") {
    if (w.duration_min > 0) parts.push(formatDuration(w.duration_min));
    if (w.set_count > 0) {
      parts.push(`${w.set_count} set${w.set_count === 1 ? "" : "s"}`);
    }
    if (w.total_volume_lb > 0) {
      parts.push(`${formatVolume(w.total_volume_lb)} lb`);
    }
  } else if (w.type === "cardio" && w.details) {
    const d = w.details as {
      modality?: string;
      minutes?: number;
      rpe?: number;
    };
    if (d.modality) {
      const label = CARDIO_MODALITY_LABELS_LOCAL[d.modality] ?? d.modality;
      parts.push(label);
    }
    if (typeof d.minutes === "number" && d.minutes > 0) {
      parts.push(`${d.minutes} min`);
    }
  } else if (w.type === "recovery" && w.details) {
    const d = w.details as {
      sauna_min?: number;
      cold_plunge_min?: number;
      walk_min?: number;
      mobility_min?: number;
    };
    if (typeof d.sauna_min === "number") parts.push(`Sauna ${d.sauna_min}m`);
    if (typeof d.cold_plunge_min === "number")
      parts.push(`Plunge ${d.cold_plunge_min}m`);
    if (typeof d.walk_min === "number") parts.push(`Walk ${d.walk_min}m`);
    if (typeof d.mobility_min === "number")
      parts.push(`Mobility ${d.mobility_min}m`);
  } else if (w.type === "gtx" && w.details) {
    const d = w.details as { rpe?: number };
    parts.push("GTX class");
    if (typeof d.rpe === "number") parts.push(`Difficulty ${d.rpe}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Logged";
}

// Inline copy of CARDIO_MODALITY_LABELS to avoid circular imports —
// history-utils.ts must remain free of server-only deps and the
// details module is fine to import, but this helper happens to need
// only the labels. Sync if you add modalities.
const CARDIO_MODALITY_LABELS_LOCAL: Record<string, string> = {
  "zone2-walk": "Zone-2 walk",
  run: "Run",
  bike: "Bike",
  row: "Row",
  hike: "Hike",
  swim: "Swim",
  other: "Cardio",
};

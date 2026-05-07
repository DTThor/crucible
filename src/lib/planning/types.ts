/**
 * Pure types + helpers for the per-day planner. No server-only deps so
 * client components can import freely.
 */
import type { WorkoutType } from "@/lib/training/templates";
import type { ProtocolSlug } from "@/lib/fasting/protocols";

/**
 * The merged "what should I do on this day" view: either an override
 * row from planned_days, or the recurring weekday default if no row.
 */
export interface PlannedDay {
  /** YYYY-MM-DD in the user's local TZ. Stable key + display source. */
  dateIso: string;
  /** 0=Sun ... 6=Sat. */
  dayOfWeek: number;
  workoutType: WorkoutType;
  /** Set when workoutType === 'lift'. */
  workoutTemplateSlug: string | null;
  fastingProtocolSlug: ProtocolSlug;
  notes: string | null;
  /** True when an override row exists in planned_days. */
  isOverridden: boolean;
}

/** What the editor modal sends back. */
export interface PlanInput {
  workoutType: WorkoutType;
  workoutTemplateSlug?: string | null;
  fastingProtocolSlug?: ProtocolSlug | null;
  notes?: string | null;
}

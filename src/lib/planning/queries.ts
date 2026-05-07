import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_TRAINING_WEEK,
  type WorkoutType,
} from "@/lib/training/templates";
import { DEFAULT_WEEKLY_TEMPLATE } from "@/lib/fasting/templates";
import type { ProtocolSlug } from "@/lib/fasting/protocols";
import type { PlannedDay } from "./types";
import {
  addDays,
  dowFromIso,
  todayKey,
} from "@/lib/tz";

interface PlannedRow {
  date: string; // YYYY-MM-DD from postgres
  workout_type: string | null;
  workout_template_slug: string | null;
  fasting_protocol_slug: string | null;
  notes: string | null;
}

/**
 * Build the merged plan for the next `daysAhead` days starting today
 * (in the user's local TZ). Each entry is either an override row from
 * planned_days or the weekday default if no row exists.
 */
export async function getUpcomingPlannedDays(
  daysAhead = 14,
): Promise<PlannedDay[]> {
  noStore();
  const supabase = await createClient();
  const startIso = todayKey();
  const endIso = addDays(startIso, daysAhead - 1);

  const { data, error } = await supabase
    .from("planned_days")
    .select(
      "date, workout_type, workout_template_slug, fasting_protocol_slug, notes",
    )
    .gte("date", startIso)
    .lte("date", endIso);

  if (error) {
    console.error("getUpcomingPlannedDays error:", error);
    // Don't fail the page — just return defaults for every day.
  }

  const overridesByDate = new Map<string, PlannedRow>();
  for (const row of data ?? []) {
    overridesByDate.set(row.date, row as PlannedRow);
  }

  const days: PlannedDay[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const dateIso = addDays(startIso, i);
    const override = overridesByDate.get(dateIso);
    days.push(mergeDay(dateIso, override));
  }
  return days;
}

/** The merged plan for one specific day (today by default). */
export async function getPlannedDay(
  dateIso: string = todayKey(),
): Promise<PlannedDay> {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("planned_days")
    .select(
      "date, workout_type, workout_template_slug, fasting_protocol_slug, notes",
    )
    .eq("date", dateIso)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("getPlannedDay error:", error);
  }

  return mergeDay(dateIso, (data as PlannedRow | null) ?? undefined);
}

function mergeDay(dateIso: string, override?: PlannedRow): PlannedDay {
  const dow = dowFromIso(dateIso);
  const defaultWorkout = DEFAULT_TRAINING_WEEK[dow];
  const defaultFasting = DEFAULT_WEEKLY_TEMPLATE[dow];

  const workoutType =
    (override?.workout_type as WorkoutType | null | undefined) ??
    defaultWorkout.type;
  const workoutTemplateSlug =
    override?.workout_template_slug ??
    (override?.workout_type
      ? null // override picked a non-lift type explicitly — clear template
      : defaultWorkout.templateSlug ?? null);
  const fastingProtocolSlug =
    (override?.fasting_protocol_slug as ProtocolSlug | null | undefined) ??
    defaultFasting;

  return {
    dateIso,
    dayOfWeek: dow,
    workoutType,
    workoutTemplateSlug,
    fastingProtocolSlug,
    notes: override?.notes ?? null,
    isOverridden: override != null,
  };
}

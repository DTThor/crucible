import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_TRAINING_WEEK,
  type WorkoutType,
} from "@/lib/training/templates";
import { DEFAULT_WEEKLY_TEMPLATE } from "@/lib/fasting/templates";
import type { ProtocolSlug } from "@/lib/fasting/protocols";
import type { PlannedDay } from "./types";

const TZ = "America/Chicago";

/** Local-TZ YYYY-MM-DD for a Date. */
function localDateKey(d: Date, tz: string = TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Local-TZ start-of-day Date for a Date. */
function startOfDayLocal(d: Date, tz: string = TZ): Date {
  const ymd = localDateKey(d, tz);
  return new Date(`${ymd}T00:00:00`);
}

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
  const today = startOfDayLocal(new Date());
  const start = today;
  const end = new Date(today.getTime() + (daysAhead - 1) * 24 * 3_600_000);

  const { data, error } = await supabase
    .from("planned_days")
    .select(
      "date, workout_type, workout_template_slug, fasting_protocol_slug, notes",
    )
    .gte("date", localDateKey(start))
    .lte("date", localDateKey(end));

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
    const date = new Date(today.getTime() + i * 24 * 3_600_000);
    const dateIso = localDateKey(date);
    const dow = date.getDay();
    const override = overridesByDate.get(dateIso);
    days.push(mergeDay({ date, dateIso, dow, override }));
  }
  return days;
}

/** The merged plan for one specific date. Used by Today/Train/Fast. */
export async function getPlannedDay(date: Date): Promise<PlannedDay> {
  noStore();
  const supabase = await createClient();
  const dateIso = localDateKey(date);

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

  return mergeDay({
    date,
    dateIso,
    dow: date.getDay(),
    override: (data as PlannedRow | null) ?? undefined,
  });
}

function mergeDay({
  date,
  dateIso,
  dow,
  override,
}: {
  date: Date;
  dateIso: string;
  dow: number;
  override?: PlannedRow;
}): PlannedDay {
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
    date,
    dayOfWeek: dow,
    workoutType,
    workoutTemplateSlug,
    fastingProtocolSlug,
    notes: override?.notes ?? null,
    isOverridden: override != null,
  };
}

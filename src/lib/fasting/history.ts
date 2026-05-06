import { createClient } from "@/lib/supabase/server";

export interface HistoricFast {
  id: string;
  protocol_slug: string;
  started_at: string;
  ended_at: string | null;
  status: "active" | "completed" | "broken_early" | "extended" | string;
  notes: string | null;
  /** Computed: hours from started_at to ended_at (or now if active). */
  duration_hours: number;
}

/** All fasts in the last `days` days, including the active one if any. */
export async function getFastHistory(days = 90): Promise<HistoricFast[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("fasts")
    .select("id, protocol_slug, started_at, ended_at, status, notes")
    .gte("started_at", since)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("getFastHistory error:", error);
    return [];
  }
  return (data ?? []).map((f) => {
    const endMs = f.ended_at ? new Date(f.ended_at).getTime() : Date.now();
    const startMs = new Date(f.started_at).getTime();
    return {
      ...f,
      duration_hours: Math.max(0, (endMs - startMs) / 3_600_000),
    };
  });
}

export interface FastStats {
  streakDays: number;
  avgFastHours30d: number;
  weeklyFastHours: number;
  totalFasts30d: number;
}

const TZ = "America/Chicago";

function localDateKey(iso: string, tz: string = TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/**
 * Aggregate stats derived from a list of historic fasts.
 *
 * - **streakDays** — consecutive days (counting from today, going back)
 *   on which the user started or was actively fasting. Today contributes
 *   if there's been a fast started today; otherwise yesterday is the
 *   most recent eligible day.
 * - **avgFastHours30d** — mean duration of completed fasts in the last 30 days.
 * - **weeklyFastHours** — total fasted hours overlapping the last 7 days.
 *   Active fasts count up to "now".
 * - **totalFasts30d** — count of fasts (any status) started in the last 30 days.
 */
export function computeFastStats(history: HistoricFast[]): FastStats {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 3_600_000;
  const thirtyDaysAgo = now - 30 * 24 * 3_600_000;

  // Streak: walk back from today, counting days that have any fast started OR
  // had any active fasting time that day.
  const dayKeysWithFast = new Set<string>();
  for (const f of history) {
    const startMs = new Date(f.started_at).getTime();
    const endMs = f.ended_at ? new Date(f.ended_at).getTime() : now;
    // For each calendar day from start to end, mark it.
    for (
      let t = startOfDayLocal(new Date(startMs)).getTime();
      t <= endMs;
      t += 24 * 3_600_000
    ) {
      dayKeysWithFast.add(localDateKey(new Date(t).toISOString()));
    }
  }
  let streakDays = 0;
  for (let i = 0; i < 365; i++) {
    const day = new Date(now - i * 24 * 3_600_000);
    const key = localDateKey(day.toISOString());
    if (dayKeysWithFast.has(key)) {
      streakDays++;
    } else if (i === 0) {
      // Today has no fast yet — keep walking, don't break streak on day-0
      continue;
    } else {
      break;
    }
  }

  // Avg fast hours over last 30 days, completed only
  const recent30 = history.filter(
    (f) =>
      new Date(f.started_at).getTime() >= thirtyDaysAgo &&
      (f.status === "completed" || f.status === "extended"),
  );
  const avgFastHours30d =
    recent30.length > 0
      ? recent30.reduce((s, f) => s + f.duration_hours, 0) / recent30.length
      : 0;

  // Weekly fasted hours: sum durations clipped to last 7 days
  let weeklyFastHours = 0;
  for (const f of history) {
    const startMs = new Date(f.started_at).getTime();
    const endMs = f.ended_at ? new Date(f.ended_at).getTime() : now;
    const overlapStart = Math.max(startMs, sevenDaysAgo);
    const overlapEnd = Math.min(endMs, now);
    if (overlapEnd > overlapStart) {
      weeklyFastHours += (overlapEnd - overlapStart) / 3_600_000;
    }
  }

  const totalFasts30d = history.filter(
    (f) => new Date(f.started_at).getTime() >= thirtyDaysAgo,
  ).length;

  return {
    streakDays,
    avgFastHours30d,
    weeklyFastHours,
    totalFasts30d,
  };
}

function startOfDayLocal(d: Date, tz: string = TZ): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return new Date(`${ymd}T00:00:00`);
}

/**
 * Heatmap data: for each day in `days` window, the longest fast that
 * was active during any portion of that day (in hours). Days with no
 * fast return 0.
 */
export interface HeatmapDay {
  /** YYYY-MM-DD in local TZ. */
  dateKey: string;
  /** Local Date object for that day at midnight. */
  date: Date;
  /** Longest single-fast hours touching this day. 0 if none. */
  hours: number;
}

export function buildHeatmapDays(
  history: HistoricFast[],
  days = 84, // 12 weeks
  tz: string = TZ,
): HeatmapDay[] {
  const result: HeatmapDay[] = [];
  const today = startOfDayLocal(new Date(), tz);

  // Pre-compute fast spans
  const spans = history.map((f) => ({
    startMs: new Date(f.started_at).getTime(),
    endMs: f.ended_at ? new Date(f.ended_at).getTime() : Date.now(),
    durationHours: f.duration_hours,
  }));

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 3_600_000);
    const dateKey = localDateKey(date.toISOString(), tz);
    const dayStart = startOfDayLocal(date, tz).getTime();
    const dayEnd = dayStart + 24 * 3_600_000;
    let maxHours = 0;
    for (const s of spans) {
      // Does this fast overlap this day?
      if (s.endMs >= dayStart && s.startMs < dayEnd) {
        if (s.durationHours > maxHours) maxHours = s.durationHours;
      }
    }
    result.push({ dateKey, date, hours: maxHours });
  }
  return result;
}

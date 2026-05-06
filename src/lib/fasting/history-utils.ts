/**
 * Pure (no server-only imports) helpers for derived history values.
 * Lives separately so client components can import these without
 * pulling in the Supabase server client.
 */

export interface HistoricFast {
  id: string;
  protocol_slug: string;
  started_at: string;
  ended_at: string | null;
  status: "active" | "completed" | "broken_early" | "extended" | string;
  notes: string | null;
  duration_hours: number;
}

export interface FastStats {
  streakDays: number;
  avgFastHours30d: number;
  weeklyFastHours: number;
  totalFasts30d: number;
}

export interface HeatmapDay {
  dateKey: string;
  date: Date;
  hours: number;
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

function startOfDayLocal(d: Date, tz: string = TZ): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return new Date(`${ymd}T00:00:00`);
}

export function computeFastStats(history: HistoricFast[]): FastStats {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 3_600_000;
  const thirtyDaysAgo = now - 30 * 24 * 3_600_000;

  const dayKeysWithFast = new Set<string>();
  for (const f of history) {
    const startMs = new Date(f.started_at).getTime();
    const endMs = f.ended_at ? new Date(f.ended_at).getTime() : now;
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
      continue;
    } else {
      break;
    }
  }

  const recent30 = history.filter(
    (f) =>
      new Date(f.started_at).getTime() >= thirtyDaysAgo &&
      (f.status === "completed" || f.status === "extended"),
  );
  const avgFastHours30d =
    recent30.length > 0
      ? recent30.reduce((s, f) => s + f.duration_hours, 0) / recent30.length
      : 0;

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

  return { streakDays, avgFastHours30d, weeklyFastHours, totalFasts30d };
}

export function buildHeatmapDays(
  history: HistoricFast[],
  days = 84,
  tz: string = TZ,
): HeatmapDay[] {
  const result: HeatmapDay[] = [];
  const today = startOfDayLocal(new Date(), tz);

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
      if (s.endMs >= dayStart && s.startMs < dayEnd) {
        if (s.durationHours > maxHours) maxHours = s.durationHours;
      }
    }
    result.push({ dateKey, date, hours: maxHours });
  }
  return result;
}

/**
 * Pure helpers for Train tab copy. Lives in a non-client module so server
 * components can call these without crossing the client boundary.
 */

import type { WorkoutType } from "./templates";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function deriveName(identifier: string): string {
  if (!identifier) return "there";
  const local = identifier.split("@")[0] ?? identifier;
  const first = local.split(/[._-]/)[0] ?? local;
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export interface DayStripEntry {
  dayName: string;
  date: number;
  isToday: boolean;
}

export function buildDayStrip(now: Date): DayStripEntry[] {
  const entries: DayStripEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    entries.push({
      dayName: WEEKDAY_SHORT[d.getDay()],
      date: d.getDate(),
      isToday: i === 0,
    });
  }
  return entries;
}

export function getTrainSubtitle(
  todayLabel: string,
  workoutType: WorkoutType,
): string {
  switch (workoutType) {
    case "lift":
      return `Lift day. ${todayLabel} on the menu.`;
    case "gtx":
      return "GTX class today. Bring the energy.";
    case "cardio":
      return "Cardio day. Zone-2 or HIIT — your call.";
    case "recovery":
      return "Recovery day. Move easy, sweat in the sauna.";
    case "rest":
      return "Rest day. Sleep is part of the program.";
    default:
      return todayLabel;
  }
}

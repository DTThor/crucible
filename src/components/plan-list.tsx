"use client";

import { useState } from "react";
import {
  Dumbbell,
  Activity,
  Sparkles,
  Coffee,
  Pencil,
  Sparkle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PlanDayEditor } from "@/components/plan-day-editor";
import {
  WORKOUT_TEMPLATES,
  type WorkoutType,
} from "@/lib/training/templates";
import { PROTOCOLS } from "@/lib/fasting/protocols";
import type { PlannedDay } from "@/lib/planning/types";
import { fastSpanRole } from "@/lib/planning/coaching";
import { dayOfMonthFromIso, monthFromIso } from "@/lib/tz";

interface PlanListProps {
  days: PlannedDay[];
}

const WORKOUT_ICONS: Record<WorkoutType, LucideIcon> = {
  lift: Dumbbell,
  gtx: Activity,
  cardio: Activity,
  recovery: Sparkles,
  rest: Coffee,
};

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatHeader(day: PlannedDay, idx: number): string {
  if (idx === 0) return "Today";
  if (idx === 1) return "Tomorrow";
  return `${WEEKDAY_SHORT[day.dayOfWeek]} ${MONTH_SHORT[monthFromIso(day.dateIso)]} ${dayOfMonthFromIso(day.dateIso)}`;
}

function workoutLabel(day: PlannedDay): string {
  if (day.workoutType === "lift" && day.workoutTemplateSlug) {
    const t = WORKOUT_TEMPLATES[day.workoutTemplateSlug];
    return t?.name ?? "Lift";
  }
  if (day.workoutType === "gtx") return "GTX class";
  if (day.workoutType === "cardio") return "Cardio";
  if (day.workoutType === "recovery") return "Recovery";
  return "Rest";
}

export function PlanList({ days }: PlanListProps) {
  const [editingDay, setEditingDay] = useState<PlannedDay | null>(null);

  return (
    <>
      <ul className="space-y-2">
        {days.map((day, idx) => {
          const Icon = WORKOUT_ICONS[day.workoutType];
          const protocol = PROTOCOLS[day.fastingProtocolSlug];
          const isToday = idx === 0;
          const role = fastSpanRole(
            day,
            idx > 0 ? days[idx - 1] : null,
            idx < days.length - 1 ? days[idx + 1] : null,
          );
          return (
            <li key={day.dateIso}>
              <button
                type="button"
                onClick={() => setEditingDay(day)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                  isToday
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card"
                } hover:bg-accent`}
              >
                <div className="flex w-12 shrink-0 flex-col items-center">
                  <span
                    className={`text-[10px] uppercase tracking-wider ${
                      isToday ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {formatHeader(day, idx).split(" ")[0]}
                  </span>
                  <span
                    className={`font-mono text-xl font-bold tabular-nums ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {dayOfMonthFromIso(day.dateIso)}
                  </span>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {workoutLabel(day)}
                    {day.isOverridden && (
                      <Sparkle
                        className="h-3 w-3 text-primary"
                        aria-label="Overridden"
                      />
                    )}
                    {role !== "none" && (
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          role === "long"
                            ? "bg-violet-500/15 text-violet-300"
                            : role === "refeed"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {role === "long"
                          ? "Long fast"
                          : role === "refeed"
                            ? "Refeed"
                            : "Fast eve"}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Fast · {protocol.name} ({protocol.targetHours}h)
                  </p>
                </div>

                <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ul>

      <PlanDayEditor
        day={editingDay}
        onClose={() => setEditingDay(null)}
      />
    </>
  );
}

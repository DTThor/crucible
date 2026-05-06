"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TrainHomeHeaderProps {
  /** Email or display name for personalization. */
  identifier: string;
  /** Time-of-day-aware subtitle. */
  subtitle?: string;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function deriveName(identifier: string): string {
  const local = identifier.split("@")[0] ?? identifier;
  const first = local.split(/[._-]/)[0] ?? local;
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function getGreeting(now: Date): string {
  const h = now.getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late night";
}

export function TrainHomeHeader({
  identifier,
  subtitle,
}: TrainHomeHeaderProps) {
  // Re-render on mount so the greeting reflects local time, not server time.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const display = now ?? new Date();
  const greeting = getGreeting(display);
  const name = deriveName(identifier);
  const todayDate = display.getDate();
  const todayDay = display.getDay();
  const initials = name.charAt(0).toUpperCase();

  // Build last 6 days + today
  const dayStrip: { dayName: string; date: number; offset: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(display);
    d.setDate(d.getDate() - i);
    dayStrip.push({
      dayName: WEEKDAY_SHORT[d.getDay()],
      date: d.getDate(),
      offset: -i,
    });
  }

  return (
    <div className="space-y-4">
      {/* Greeting row */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-base font-bold text-primary ring-2 ring-primary/40">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold leading-tight text-primary">
            {greeting}, {name}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Day strip */}
      <div className="flex items-end justify-between gap-1">
        {dayStrip.map((d, i) => {
          const isToday = d.offset === 0;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-1.5",
                isToday && "rounded-lg",
              )}
            >
              <div
                className={cn(
                  "h-0.5 w-full rounded-full",
                  isToday ? "bg-foreground" : "bg-muted",
                )}
              />
              <span
                className={cn(
                  "text-xs font-mono tabular-nums",
                  isToday
                    ? "font-bold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {isToday ? "TODAY" : d.date}
              </span>
              {!isToday && (
                <span className="text-[9px] text-muted-foreground">
                  {d.dayName}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function getTrainSubtitle(
  todayLabel: string,
  workoutType: string,
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

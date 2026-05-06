"use client";

import { Pencil } from "lucide-react";

interface FastTimesRowProps {
  startedAtMs: number;
  plannedEndMs: number | null;
  onEditStart: () => void;
}

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

function formatDateTime(ms: number): { date: string; time: string } {
  const d = new Date(ms);
  return {
    date: `${WEEKDAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`,
    time: `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`,
  };
}

export function FastTimesRow({
  startedAtMs,
  plannedEndMs,
  onEditStart,
}: FastTimesRowProps) {
  const start = formatDateTime(startedAtMs);
  const end = plannedEndMs ? formatDateTime(plannedEndMs) : null;

  return (
    <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border">
      <button
        type="button"
        onClick={onEditStart}
        className="flex flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-accent"
      >
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Start <Pencil className="h-2.5 w-2.5" />
        </span>
        <span className="text-xs font-medium tabular-nums">
          {start.date} · {start.time}
        </span>
      </button>
      <div className="flex flex-col items-end gap-0.5 px-3 py-2 text-right">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          End
        </span>
        <span className="text-xs font-medium tabular-nums">
          {end ? `${end.date} · ${end.time}` : "—"}
        </span>
      </div>
    </div>
  );
}

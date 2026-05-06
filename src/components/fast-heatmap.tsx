"use client";

import { useState } from "react";
import type { HeatmapDay } from "@/lib/fasting/history";

interface FastHeatmapProps {
  /** 84 days of heatmap data, oldest first. */
  days: HeatmapDay[];
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
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

function colorForHours(h: number): string {
  if (h <= 0.05) return "hsl(217 32% 22%)"; // empty
  if (h < 4) return "hsl(160 30% 28%)";
  if (h < 12) return "hsl(160 50% 38%)";
  if (h < 16) return "hsl(142 60% 45%)";
  if (h < 23) return "hsl(142 76% 56%)";
  if (h < 30) return "hsl(43 96% 60%)";
  if (h < 42) return "hsl(24 94% 62%)";
  return "hsl(0 92% 68%)";
}

export function FastHeatmap({ days }: FastHeatmapProps) {
  const [selected, setSelected] = useState<HeatmapDay | null>(null);

  // Group into columns by week. The grid is week-aligned: each column
  // is a Sun→Sat week. We start the first column on the earliest day's
  // most-recent-prior Sunday.
  const startSunday = new Date(days[0].date);
  startSunday.setDate(startSunday.getDate() - startSunday.getDay());

  const cols: (HeatmapDay | null)[][] = [];
  let currentCol: (HeatmapDay | null)[] = [];
  for (
    let t = startSunday.getTime();
    t <= days[days.length - 1].date.getTime();
    t += 24 * 3_600_000
  ) {
    const dayOfWeek = new Date(t).getDay();
    if (dayOfWeek === 0 && currentCol.length > 0) {
      cols.push(currentCol);
      currentCol = [];
    }
    const match = days.find((d) => d.date.getTime() === t);
    currentCol.push(match ?? null);
  }
  if (currentCol.length > 0) cols.push(currentCol);

  // Pad the last column if today isn't Saturday
  while (cols[cols.length - 1].length < 7) {
    cols[cols.length - 1].push(null);
  }

  // Month labels above the grid: show month name on first column of each new month
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  cols.forEach((col, idx) => {
    const firstDay = col.find((d) => d !== null);
    if (!firstDay) return;
    const m = firstDay.date.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ col: idx, label: MONTH_SHORT[m] });
      lastMonth = m;
    }
  });

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">Last 12 weeks</p>
        <p className="text-[10px] text-muted-foreground">
          shaded by longest fast each day
        </p>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="inline-flex flex-col gap-1">
          {/* Month labels */}
          <div
            className="grid gap-[3px]"
            style={{
              gridTemplateColumns: `12px repeat(${cols.length}, 14px)`,
            }}
          >
            <div />
            {cols.map((_, idx) => {
              const lbl = monthLabels.find((m) => m.col === idx);
              return (
                <div
                  key={idx}
                  className="text-[9px] font-medium text-muted-foreground"
                >
                  {lbl?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* 7 rows of cells, each row a day-of-week */}
          {[0, 1, 2, 3, 4, 5, 6].map((rowDay) => (
            <div
              key={rowDay}
              className="grid items-center gap-[3px]"
              style={{
                gridTemplateColumns: `12px repeat(${cols.length}, 14px)`,
              }}
            >
              <div className="text-[9px] font-medium text-muted-foreground">
                {rowDay % 2 === 1 ? DAY_LABELS[rowDay] : ""}
              </div>
              {cols.map((col, colIdx) => {
                const day = col[rowDay] ?? null;
                if (!day) {
                  return <div key={colIdx} className="h-[14px] w-[14px]" />;
                }
                const isSelected =
                  selected?.dateKey === day.dateKey;
                return (
                  <button
                    key={colIdx}
                    type="button"
                    onClick={() => setSelected(day)}
                    aria-label={`${day.dateKey}: ${day.hours.toFixed(1)}h`}
                    className="h-[14px] w-[14px] rounded-sm transition-transform hover:scale-110"
                    style={{
                      backgroundColor: colorForHours(day.hours),
                      outline: isSelected
                        ? "1.5px solid hsl(var(--foreground))"
                        : undefined,
                      outlineOffset: 1,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0, 6, 14, 18, 24, 36, 48].map((h) => (
          <span
            key={h}
            className="h-[10px] w-[10px] rounded-sm"
            style={{ backgroundColor: colorForHours(h) }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">
          <p className="font-medium tabular-nums">
            {selected.date.toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="text-muted-foreground">
            {selected.hours <= 0.05
              ? "No fast that day"
              : `Longest fast that day: ${selected.hours.toFixed(1)}h`}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { kgToLb } from "@/lib/units";
import type { WeightLog } from "@/lib/weight/queries";
import { WeightHistoryModal } from "@/components/weight-history-modal";

interface WeightTrendChartProps {
  logs: WeightLog[];
  /** Optional goal weight in lb to draw as a horizontal line. */
  goalLb?: number | null;
}

interface Point {
  ts: number; // ms
  lb: number;
  rollingLb: number; // 7-day rolling average
}

/**
 * 30-day weight trend with raw points + 7-day rolling average line.
 * Hand-rolled SVG so we don't drag in a chart lib for one chart.
 */
export function WeightTrendChart({ logs, goalLb }: WeightTrendChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        Log a weight to start seeing your trend.
      </div>
    );
  }

  // Transform to lb + rolling average
  const points: Point[] = logs
    .map((l) => ({
      ts: new Date(l.logged_at).getTime(),
      lb: kgToLb(l.weight_kg),
      rollingLb: 0,
    }))
    .sort((a, b) => a.ts - b.ts);

  const ROLLING_WINDOW_MS = 7 * 24 * 3_600_000;
  for (let i = 0; i < points.length; i++) {
    const cutoff = points[i].ts - ROLLING_WINDOW_MS;
    let sum = 0;
    let count = 0;
    for (let j = i; j >= 0 && points[j].ts >= cutoff; j--) {
      sum += points[j].lb;
      count++;
    }
    points[i].rollingLb = count > 0 ? sum / count : points[i].lb;
  }

  // Chart geometry
  const width = 320;
  const height = 140;
  const padding = { top: 12, right: 16, bottom: 24, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Time range: anchor to last 30 days, ending now
  const now = Date.now();
  const start = now - 30 * 24 * 3_600_000;
  const xRange = now - start;

  // Y range: from data + goal, with padding
  const allValues = points.flatMap((p) => [p.lb, p.rollingLb]);
  if (goalLb != null) allValues.push(goalLb);
  const minV = Math.min(...allValues) - 1.5;
  const maxV = Math.max(...allValues) + 1.5;
  const yRange = Math.max(maxV - minV, 4); // never show less than 4 lb of range

  const x = (ts: number) =>
    padding.left + ((ts - start) / xRange) * innerW;
  const y = (lb: number) =>
    padding.top + ((maxV - lb) / yRange) * innerH;

  // Build the rolling-average path
  const rollingPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.ts)} ${y(p.rollingLb)}`)
    .join(" ");

  const latest = points[points.length - 1];
  const oldest = points[0];
  const deltaLb = latest.lb - oldest.lb;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setHistoryOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setHistoryOpen(true);
          }
        }}
        className="cursor-pointer rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/30"
      >
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="flex items-center gap-1 text-sm font-semibold">
            Weight · 30 days
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </p>
          <p
            className={`font-mono text-xs tabular-nums ${
              deltaLb < -0.05
                ? "text-emerald-400"
                : deltaLb > 0.05
                  ? "text-amber-400"
                  : "text-muted-foreground"
            }`}
          >
            {deltaLb > 0 ? "+" : ""}
            {deltaLb.toFixed(1)} lb
          </p>
        </div>

      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block"
      >
        {/* Y gridlines + labels */}
        {[0, 0.5, 1].map((t) => {
          const lb = maxV - t * yRange;
          const yPos = padding.top + t * innerH;
          return (
            <g key={t}>
              <line
                x1={padding.left}
                x2={padding.left + innerW}
                y1={yPos}
                y2={yPos}
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <text
                x={padding.left - 4}
                y={yPos + 3}
                textAnchor="end"
                fontSize={9}
                fill="hsl(var(--muted-foreground))"
              >
                {lb.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Goal line */}
        {goalLb != null && goalLb >= minV && goalLb <= maxV && (
          <g>
            <line
              x1={padding.left}
              x2={padding.left + innerW}
              y1={y(goalLb)}
              y2={y(goalLb)}
              stroke="hsl(142 76% 56%)"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
            />
            <text
              x={padding.left + innerW - 2}
              y={y(goalLb) - 3}
              textAnchor="end"
              fontSize={9}
              fill="hsl(142 76% 56%)"
            >
              goal {goalLb.toFixed(0)}
            </text>
          </g>
        )}

        {/* Rolling average line */}
        <path
          d={rollingPath}
          fill="none"
          stroke="hsl(212 95% 68%)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Raw points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(p.ts)}
            cy={y(p.lb)}
            r={hoverIdx === i ? 4 : 2.5}
            fill="hsl(var(--background))"
            stroke="hsl(212 95% 68%)"
            strokeWidth={1.5}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            onClick={(e) => {
              // Don't bubble up to the card-level "open history" handler.
              e.stopPropagation();
              setHoverIdx(i);
            }}
            style={{ cursor: "pointer" }}
          />
        ))}
      </svg>

        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {hoverIdx != null && points[hoverIdx]
              ? `${new Date(points[hoverIdx].ts).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })} · ${points[hoverIdx].lb.toFixed(1)} lb`
              : `${oldest.lb.toFixed(1)} → ${latest.lb.toFixed(1)} lb`}
          </span>
          <span>Tap to view all</span>
        </div>
      </div>

      <WeightHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        logs={logs}
      />
    </>
  );
}

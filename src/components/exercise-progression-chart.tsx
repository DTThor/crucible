"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { TrendingUp, ChevronDown } from "lucide-react";
import { Modal } from "@/components/modal";
import {
  formatVolume,
  type ExercisePoint,
  type ExerciseSummary,
} from "@/lib/training/history-utils";
import { fetchExerciseProgression } from "@/lib/training/history-client";

interface ExerciseProgressionChartProps {
  exercises: ExerciseSummary[];
  /** First exercise's progression, fetched server-side so we paint
   *  something meaningful on the very first render without a client
   *  round-trip. */
  initialPoints: ExercisePoint[];
  initialSlug: string | null;
}

/**
 * Per-exercise progression view. Picker on top to switch exercises;
 * inline SVG line chart for the selected one. Hand-rolled SVG to match
 * the WeightTrendChart and avoid pulling in a chart lib.
 *
 * Selection model:
 *   - Default: most recent session is selected (highlighted dot).
 *   - Tap a dot → selects that session, summary row shows its values.
 *   - Tapping the same dot again clears selection back to "summary
 *     across all sessions".
 */
export function ExerciseProgressionChart({
  exercises,
  initialPoints,
  initialSlug,
}: ExerciseProgressionChartProps) {
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [points, setPoints] = useState<ExercisePoint[]>(initialPoints);
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  // Default: latest session selected so the user can see specifics
  // without having to tap.
  const [selectedIdx, setSelectedIdx] = useState<number>(
    Math.max(0, initialPoints.length - 1),
  );

  // Reset selection when exercise switches, after points load.
  useEffect(() => {
    setSelectedIdx(Math.max(0, points.length - 1));
  }, [points]);

  function handlePick(next: string) {
    setPickerOpen(false);
    if (next === slug) return;
    setSlug(next);
    setPoints([]);
    startTransition(async () => {
      const fresh = await fetchExerciseProgression(next);
      setPoints(fresh);
    });
  }

  if (exercises.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        Log a few workouts and your per-exercise progression will show here.
      </div>
    );
  }

  const current = exercises.find((e) => e.slug === slug) ?? exercises[0];

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex min-w-0 items-center gap-1 rounded-lg border border-input bg-secondary px-2.5 py-1 text-sm font-semibold hover:bg-secondary/80"
          >
            <span className="truncate">{current.name}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {points.length} session{points.length === 1 ? "" : "s"}
          </div>
        </div>

        <ProgressionChart
          points={points}
          selectedIdx={selectedIdx}
          onSelect={(idx) =>
            setSelectedIdx((prev) => (prev === idx ? -1 : idx))
          }
          loading={pending}
        />

        <ExerciseSummaryRow
          points={points}
          selectedIdx={selectedIdx}
        />
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        className="max-w-xs"
      >
        <h2 className="mb-3 text-base font-semibold">Pick an exercise</h2>
        <ul className="-mx-1 max-h-[60vh] overflow-y-auto">
          {exercises.map((ex) => (
            <li key={ex.slug}>
              <button
                type="button"
                onClick={() => handlePick(ex.slug)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent ${
                  ex.slug === slug ? "bg-accent" : ""
                }`}
              >
                <span className="truncate font-medium">{ex.name}</span>
                <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                  {ex.setCount} set{ex.setCount === 1 ? "" : "s"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

function ProgressionChart({
  points,
  selectedIdx,
  onSelect,
  loading,
}: {
  points: ExercisePoint[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex h-[160px] items-center justify-center text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (points.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-xs text-muted-foreground">
        No history yet for this exercise.
      </div>
    );
  }

  const width = 320;
  const height = 160;
  const padding = { top: 18, right: 16, bottom: 22, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const ts = points.map((p) => new Date(p.startedIso).getTime());
  const minT = ts[0];
  const maxT = ts[ts.length - 1];
  const tRange = Math.max(1, maxT - minT);

  const weights = points.map((p) => p.topWeightLb);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const wRange = Math.max(maxW - minW, 5);
  const minWPad = minW - wRange * 0.15;
  const maxWPad = maxW + wRange * 0.15;
  const wRangePad = maxWPad - minWPad;

  const maxWeight = maxW;

  const x = (t: number) =>
    points.length === 1
      ? padding.left + innerW / 2
      : padding.left + ((t - minT) / tRange) * innerW;
  const y = (w: number) =>
    padding.top + ((maxWPad - w) / wRangePad) * innerH;

  const path = points
    .map((p, i) => {
      const px = x(new Date(p.startedIso).getTime());
      const py = y(p.topWeightLb);
      return `${i === 0 ? "M" : "L"} ${px} ${py}`;
    })
    .join(" ");

  const selectedPoint =
    selectedIdx >= 0 && selectedIdx < points.length
      ? points[selectedIdx]
      : null;
  const selectedX = selectedPoint
    ? x(new Date(selectedPoint.startedIso).getTime())
    : null;
  const selectedY = selectedPoint ? y(selectedPoint.topWeightLb) : null;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block"
    >
      {/* Gridlines */}
      {[0, 0.5, 1].map((t) => {
        const w = maxWPad - t * wRangePad;
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
              {Math.round(w)}
            </text>
          </g>
        );
      })}

      {/* Vertical reference line through the selected point */}
      {selectedX != null && (
        <line
          x1={selectedX}
          x2={selectedX}
          y1={padding.top - 6}
          y2={padding.top + innerH}
          stroke="hsl(142 76% 56%)"
          strokeOpacity={0.35}
          strokeDasharray="3 3"
        />
      )}

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke="hsl(142 76% 56%)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Selected dot — glow halo behind for emphasis */}
      {selectedX != null && selectedY != null && (
        <circle
          cx={selectedX}
          cy={selectedY}
          r={10}
          fill="hsl(142 76% 56%)"
          fillOpacity={0.18}
        />
      )}

      {/* Dots — PRs (== max weight) get the bright fill */}
      {points.map((p, i) => {
        const t = new Date(p.startedIso).getTime();
        const isPr = p.topWeightLb === maxWeight;
        const isSelected = i === selectedIdx;
        const cx = x(t);
        const cy = y(p.topWeightLb);
        return (
          <g key={p.workoutId}>
            <circle
              cx={cx}
              cy={cy}
              r={isSelected ? 5.5 : isPr ? 4 : 3}
              fill={
                isSelected
                  ? "hsl(142 76% 56%)"
                  : isPr
                    ? "hsl(142 76% 56%)"
                    : "hsl(var(--background))"
              }
              stroke="hsl(142 76% 56%)"
              strokeWidth={isSelected ? 2.5 : 1.75}
              onClick={() => onSelect(i)}
              style={{ cursor: "pointer" }}
            />
            {/* Reps label, but only when there's room — every other dot */}
            {(points.length <= 8 ||
              i % 2 === 0 ||
              isSelected) && (
              <text
                x={cx}
                y={cy - 9}
                textAnchor="middle"
                fontSize={isSelected ? 10 : 8}
                fontWeight={isSelected ? 600 : 400}
                fill={
                  isSelected
                    ? "hsl(142 76% 56%)"
                    : "hsl(var(--muted-foreground))"
                }
              >
                ×{p.topReps}
              </text>
            )}
          </g>
        );
      })}

      {/* X axis date labels — first + last */}
      <text
        x={padding.left}
        y={height - 6}
        fontSize={9}
        fill="hsl(var(--muted-foreground))"
      >
        {formatShortDate(points[0].startedIso)}
      </text>
      {points.length > 1 && (
        <text
          x={padding.left + innerW}
          y={height - 6}
          textAnchor="end"
          fontSize={9}
          fill="hsl(var(--muted-foreground))"
        >
          {formatShortDate(points[points.length - 1].startedIso)}
        </text>
      )}
    </svg>
  );
}

function ExerciseSummaryRow({
  points,
  selectedIdx,
}: {
  points: ExercisePoint[];
  selectedIdx: number;
}) {
  const selected = useMemo(
    () =>
      selectedIdx >= 0 && selectedIdx < points.length
        ? points[selectedIdx]
        : null,
    [points, selectedIdx],
  );

  if (points.length === 0) return null;

  if (selected) {
    return (
      <div className="mt-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-primary/80">
            Selected · {formatLongDate(selected.startedIso)}
          </span>
          {selected.rpe != null && (
            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Difficulty {selected.rpe}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-mono text-lg font-semibold tabular-nums">
            {roundLb(selected.topWeightLb)} lb × {selected.topReps}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {selected.setCount} set{selected.setCount === 1 ? "" : "s"} ·{" "}
            {formatVolume(selected.totalVolumeLb)} lb volume
          </span>
        </div>
      </div>
    );
  }

  // No selection (user tapped twice to clear) — show overall summary.
  const maxWeight = Math.max(...points.map((p) => p.topWeightLb));
  const totalVolume = points.reduce((s, p) => s + p.totalVolumeLb, 0);
  const lastRated = [...points].reverse().find((p) => p.rpe != null);

  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
      <SummaryCell label="Top weight" value={`${roundLb(maxWeight)} lb`} />
      <SummaryCell label="Total volume" value={`${formatVolume(totalVolume)} lb`} />
      <SummaryCell
        label="Last rating"
        value={lastRated?.rpe != null ? lastRated.rpe.toString() : "—"}
        sub={lastRated?.rpe != null ? "/ 10" : `${points.length} sessions`}
      />
    </div>
  );
}

function SummaryCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/30 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-sm font-semibold tabular-nums">{value}</p>
      {sub && (
        <p className="text-[9px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function roundLb(lb: number): string {
  return lb % 1 === 0 ? lb.toFixed(0) : lb.toFixed(1);
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Pencil } from "lucide-react";
import {
  ConfettiBurst,
} from "@/components/celebration";
import { EditFastTimesModal } from "@/components/edit-fast-times-modal";
import { updateWorkoutTimes } from "@/lib/training/actions";
import { getExercise } from "@/lib/training/exercises";
import { getTemplate } from "@/lib/training/templates";
import { kgToLb } from "@/lib/units";
import type { WorkoutSet } from "@/lib/training/queries";
import type { WorkoutDetails } from "@/lib/training/details";
import { WorkoutDetailSummary } from "@/components/workout-detail-summary";

interface WorkoutSummaryCardProps {
  workoutId: string;
  type: string;
  templateSlug: string | null;
  startedAt: string;
  endedAt: string;
  status: string;
  sets: WorkoutSet[];
  details: WorkoutDetails | null;
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

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${WEEKDAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`,
    time: `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`,
  };
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

export function WorkoutSummaryCard({
  workoutId,
  type,
  templateSlug,
  startedAt,
  endedAt,
  status,
  sets,
  details,
}: WorkoutSummaryCardProps) {
  const router = useRouter();
  const [localStartedAt, setLocalStartedAt] = useState(startedAt);
  const [localEndedAt, setLocalEndedAt] = useState(endedAt);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confettiActive, setConfettiActive] = useState(false);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);

  useEffect(() => setLocalStartedAt(startedAt), [startedAt]);
  useEffect(() => setLocalEndedAt(endedAt), [endedAt]);

  // Celebrate completed (not abandoned) workouts
  useEffect(() => {
    if (status === "completed" && !hasFiredConfetti) {
      setHasFiredConfetti(true);
      setConfettiActive(true);
      const id = setTimeout(() => setConfettiActive(false), 3500);
      return () => clearTimeout(id);
    }
  }, [status, hasFiredConfetti]);

  const startedMs = new Date(localStartedAt).getTime();
  const endedMs = new Date(localEndedAt).getTime();
  const durationMs = Math.max(0, endedMs - startedMs);

  const template = templateSlug ? getTemplate(templateSlug) : null;
  const title = template?.name ?? type.charAt(0).toUpperCase() + type.slice(1);

  // Group sets per exercise
  const setsByExercise: Record<string, WorkoutSet[]> = {};
  for (const s of sets) {
    setsByExercise[s.exercise_slug] = setsByExercise[s.exercise_slug] ?? [];
    setsByExercise[s.exercise_slug].push(s);
  }

  // Total volume: sum(weight × reps) across all sets
  const totalVolumeLb = sets.reduce((sum, s) => {
    const lb = s.weight_kg != null ? kgToLb(s.weight_kg) : 0;
    return sum + lb * (s.reps ?? 0);
  }, 0);

  function handleSaveTimes(newStart: string, newEnd: string) {
    setEditError(null);
    const previousStart = localStartedAt;
    const previousEnd = localEndedAt;
    setLocalStartedAt(newStart);
    setLocalEndedAt(newEnd);
    startTransition(async () => {
      const res = await updateWorkoutTimes(workoutId, newStart, newEnd);
      if (!res.ok) {
        setLocalStartedAt(previousStart);
        setLocalEndedAt(previousEnd);
        setEditError(res.error);
      } else {
        setEditOpen(false);
        router.refresh();
      }
    });
  }

  function handleDone() {
    if (typeof window !== "undefined") {
      window.location.href = "/train";
    } else {
      router.push("/train");
    }
  }

  const start = formatDateTime(localStartedAt);
  const end = formatDateTime(localEndedAt);
  const isAbandoned = status === "abandoned";

  return (
    <>
      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                isAbandoned
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-amber-400/20 text-amber-400"
              }`}
            >
              <Trophy className="h-7 w-7" />
            </div>
            <p className="text-base font-semibold">
              {isAbandoned ? "Workout saved" : "Workout complete!"}
            </p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <p className="mt-1 font-mono text-4xl font-semibold tabular-nums leading-none">
              {formatDuration(durationMs)}
            </p>
            {sets.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {sets.length} set{sets.length === 1 ? "" : "s"} ·{" "}
                {Math.round(totalVolumeLb).toLocaleString()} lb total volume
              </p>
            )}
          </div>

          {/* Type-specific details (cardio modality + minutes, recovery
              activities, GTX rating, etc.) — null for lift workouts */}
          <WorkoutDetailSummary type={type} details={details} />

          {/* Per-exercise breakdown */}
          {Object.keys(setsByExercise).length > 0 && (
            <ul className="space-y-1.5 rounded-xl border border-border bg-muted/10 p-3">
              {Object.entries(setsByExercise).map(([slug, exSets]) => {
                const ex = getExercise(slug);
                const name = ex?.name ?? slug;
                // Show weight × reps from the heaviest working set
                const top = [...exSets]
                  .filter((s) => !s.was_warmup)
                  .sort(
                    (a, b) => (b.weight_kg ?? 0) - (a.weight_kg ?? 0),
                  )[0];
                const topLb = top?.weight_kg != null ? kgToLb(top.weight_kg) : null;
                return (
                  <li
                    key={slug}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{name}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {exSets.length} × {top?.reps ?? "—"}
                      {topLb != null && ` · ${topLb.toFixed(0)} lb`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border">
            <div className="px-4 py-3 text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Start
              </p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">
                {start.date} · {start.time}
              </p>
            </div>
            <div className="px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                End
              </p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">
                {end.date} · {end.time}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={pending}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-input bg-secondary py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/80"
          >
            <Pencil className="h-3 w-3" /> Adjust times
          </button>

          <button
            type="button"
            onClick={handleDone}
            disabled={pending}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </CardContent>
      </Card>

      <EditFastTimesModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditError(null);
        }}
        onSave={handleSaveTimes}
        initialStartedAtIso={localStartedAt}
        initialEndedAtIso={localEndedAt}
        pending={pending}
        error={editError}
      />

      <ConfettiBurst active={confettiActive} />
    </>
  );
}

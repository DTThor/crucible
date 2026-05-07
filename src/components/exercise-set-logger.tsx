"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Circle,
  CheckCircle2,
  Plus,
  Minus,
  Pencil,
  Sparkles,
} from "lucide-react";
import {
  addSet,
  deleteSet,
  rateExerciseDifficulty,
  updateSet,
} from "@/lib/training/actions";
import { kgToLb } from "@/lib/units";
import { cn } from "@/lib/utils";
import { RpePicker } from "@/components/rpe-picker";
import type { Exercise } from "@/lib/training/exercises";
import type { WorkoutSet } from "@/lib/training/queries";
import type { Suggestion } from "@/lib/training/suggestions";

interface ExerciseSetLoggerProps {
  workoutId: string;
  exercise: Exercise;
  prescribedSets: number;
  prescribedReps: number;
  initialSets: WorkoutSet[];
  /** Suggested weight + reps from last time the user did this exercise. */
  suggestion: Suggestion | null;
}

interface RowState {
  weight: string;
  reps: string;
  completed: boolean;
  dbId: string | null;
}

const EQUIPMENT_LABEL: Record<string, string | null> = {
  db: "Dumbbell",
  bb: "Barbell",
  kb: "Kettlebell",
  machine: "Machine",
  bodyweight: "Bodyweight",
  cardio: null,
};

const DIFFICULTY_ANCHORS: Record<number, string> = {
  6: "easy",
  7: "moderate",
  8: "hard",
  9: "near max",
  10: "max effort",
};

function buildRows(
  prescribed: number,
  loggedSets: WorkoutSet[],
): RowState[] {
  const sorted = [...loggedSets].sort((a, b) => a.set_number - b.set_number);
  const rows: RowState[] = sorted.map((s) => ({
    weight: s.weight_kg != null ? kgToLb(s.weight_kg).toFixed(1) : "",
    reps: s.reps?.toString() ?? "",
    completed: true,
    dbId: s.id,
  }));
  while (rows.length < prescribed) {
    rows.push({ weight: "", reps: "", completed: false, dbId: null });
  }
  return rows;
}

export function ExerciseSetLogger({
  workoutId,
  exercise,
  prescribedSets,
  prescribedReps,
  initialSets,
  suggestion,
}: ExerciseSetLoggerProps) {
  const router = useRouter();
  const [rows, setRows] = useState<RowState[]>(() =>
    buildRows(prescribedSets, initialSets),
  );
  // Pull existing rating off any saved set (rateExerciseDifficulty writes
  // the same rpe to every non-warmup set in the exercise).
  const [exerciseRating, setExerciseRating] = useState<number | null>(() => {
    const rated = initialSets.find((s) => s.rpe != null && !s.was_warmup);
    return rated?.rpe ?? null;
  });
  const [editingRating, setEditingRating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allCompleted = rows.length > 0 && rows.every((r) => r.completed);
  const completedCount = rows.filter((r) => r.completed).length;
  const equipmentLabel = EQUIPMENT_LABEL[exercise.equipment] ?? null;

  function patchRow(idx: number, patch: Partial<RowState>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function handleAddRow() {
    setError(null);
    setRows((prev) => [
      ...prev,
      { weight: "", reps: "", completed: false, dbId: null },
    ]);
  }

  function handleRemoveRow() {
    setError(null);
    if (rows.length === 0) return;
    const last = rows[rows.length - 1];
    setRows((prev) => prev.slice(0, -1));
    if (last.dbId) {
      const dbId = last.dbId;
      startTransition(async () => {
        await deleteSet(dbId);
      });
    }
  }

  function handleToggleComplete(idx: number) {
    setError(null);
    const row = rows[idx];

    if (row.completed && row.dbId) {
      const dbId = row.dbId;
      patchRow(idx, { completed: false, dbId: null });
      startTransition(async () => {
        await deleteSet(dbId);
      });
      return;
    }

    const w = parseFloat(row.weight);
    const r = parseInt(row.reps, 10);
    if (!Number.isFinite(w) || w <= 0) {
      setError(`Set ${idx + 1}: enter weight first.`);
      return;
    }
    if (!Number.isFinite(r) || r <= 0) {
      setError(`Set ${idx + 1}: enter reps first.`);
      return;
    }

    patchRow(idx, { completed: true });
    startTransition(async () => {
      const res = await addSet({
        workoutId,
        exerciseSlug: exercise.slug,
        setNumber: idx + 1,
        weightLb: w,
        reps: r,
        rpe: exerciseRating ?? undefined,
      });
      if (res.ok && "setId" in res && res.setId) {
        patchRow(idx, { dbId: res.setId });
      } else if (!res.ok) {
        patchRow(idx, { completed: false });
        setError(res.error);
        router.refresh();
      }
    });
  }

  function handleBlur(idx: number) {
    const row = rows[idx];
    if (!row.completed || !row.dbId) return;
    const w = parseFloat(row.weight);
    const r = parseInt(row.reps, 10);
    if (!Number.isFinite(w) || !Number.isFinite(r)) return;
    const dbId = row.dbId;
    startTransition(async () => {
      await updateSet(dbId, { weightLb: w, reps: r });
    });
  }

  function handleRate(rpe: number) {
    setError(null);
    const previous = exerciseRating;
    setExerciseRating(rpe);
    setEditingRating(false);
    startTransition(async () => {
      const res = await rateExerciseDifficulty(
        workoutId,
        exercise.slug,
        rpe,
      );
      if (!res.ok) {
        setExerciseRating(previous);
        setError(res.error);
      }
    });
  }

  // Placeholder helpers — pull from suggestion when available.
  const weightPlaceholder = suggestion
    ? suggestion.weight_lb % 1 === 0
      ? suggestion.weight_lb.toString()
      : suggestion.weight_lb.toFixed(1)
    : "lbs";
  const repsPlaceholder = suggestion
    ? suggestion.reps.toString()
    : prescribedReps
      ? prescribedReps.toString()
      : "reps";

  return (
    <article
      className={cn(
        "space-y-3 rounded-2xl border bg-card p-4 transition-colors",
        allCompleted ? "border-emerald-500/50" : "border-primary/30",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight">{exercise.name}</h3>
          <p className="text-xs capitalize text-muted-foreground">
            {exercise.primaryMuscle}
            {equipmentLabel && ` · ${equipmentLabel}`}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            allCompleted
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {allCompleted ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Done
            </>
          ) : (
            `${completedCount} / ${rows.length}`
          )}
        </span>
      </div>

      {/* Suggestion hint */}
      {suggestion && completedCount === 0 && (
        <p className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          Last time: {suggestion.reasoning}
        </p>
      )}

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Column labels */}
      <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_0.5rem_minmax(0,1fr)_2.25rem] items-center gap-1.5 px-0.5">
        <span className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          Set
        </span>
        <span className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          Weight
        </span>
        <span />
        <span className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          Reps
        </span>
        <span />
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[1.5rem_minmax(0,1fr)_0.5rem_minmax(0,1fr)_2.25rem] items-center gap-1.5"
          >
            <span className="text-center font-mono text-sm font-bold tabular-nums">
              {i + 1}
            </span>

            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={row.weight}
              onChange={(e) => patchRow(i, { weight: e.target.value })}
              onBlur={() => handleBlur(i)}
              placeholder={weightPlaceholder}
              className={cn(
                "h-10 w-full min-w-0 rounded-lg border bg-muted/30 px-1 text-center font-mono text-sm font-semibold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                row.completed ? "border-emerald-500/40" : "border-border",
              )}
            />

            <span className="text-center text-xs text-muted-foreground">×</span>

            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              value={row.reps}
              onChange={(e) => patchRow(i, { reps: e.target.value })}
              onBlur={() => handleBlur(i)}
              placeholder={repsPlaceholder}
              className={cn(
                "h-10 w-full min-w-0 rounded-lg border bg-muted/30 px-1 text-center font-mono text-sm font-semibold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                row.completed ? "border-emerald-500/40" : "border-border",
              )}
            />

            <button
              type="button"
              onClick={() => handleToggleComplete(i)}
              disabled={pending}
              aria-label={
                row.completed
                  ? `Set ${i + 1} done — tap to undo`
                  : `Mark set ${i + 1} done`
              }
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                row.completed
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                  : "border-2 border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary",
              )}
            >
              {row.completed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Add / remove */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleAddRow}
          disabled={pending}
          className="flex items-center gap-1 rounded-full border border-input bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          Add set
        </button>
        {rows.length > 1 && (
          <button
            type="button"
            onClick={handleRemoveRow}
            disabled={pending}
            className="flex items-center gap-1 rounded-full border border-input bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
          >
            <Minus className="h-3 w-3" />
            Remove
          </button>
        )}
      </div>

      {/* Difficulty rating — appears after all sets are complete */}
      {allCompleted && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          {exerciseRating == null || editingRating ? (
            <>
              <p className="mb-2 text-xs font-medium">
                How hard was this exercise?
              </p>
              <RpePicker
                value={editingRating ? exerciseRating : null}
                onChange={handleRate}
              />
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Drives next session's suggested weight + reps.
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <span className="text-muted-foreground">Difficulty:</span>{" "}
                <span className="font-semibold">{exerciseRating}</span>
                {DIFFICULTY_ANCHORS[exerciseRating] && (
                  <span className="ml-1 italic text-muted-foreground">
                    · {DIFFICULTY_ANCHORS[exerciseRating]}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setEditingRating(true)}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                <Pencil className="h-3 w-3" />
                Change
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

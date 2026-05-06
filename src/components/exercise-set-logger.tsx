"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { RpePicker } from "@/components/rpe-picker";
import { kgToLb } from "@/lib/units";
import type { Exercise } from "@/lib/training/exercises";
import type { WorkoutSet } from "@/lib/training/queries";

interface ExerciseSetLoggerProps {
  exercise: Exercise;
  prescribedSets: number;
  prescribedReps: number;
  loggedSets: WorkoutSet[];
  pending: boolean;
  onAddSet: (
    exerciseSlug: string,
    weight: number,
    reps: number,
    rpe: number,
  ) => void;
  onDeleteSet: (setId: string) => void;
  /** Optional pre-fill suggested weight (lb). */
  suggestedWeightLb?: number;
}

export function ExerciseSetLogger({
  exercise,
  prescribedSets,
  prescribedReps,
  loggedSets,
  pending,
  onAddSet,
  onDeleteSet,
  suggestedWeightLb,
}: ExerciseSetLoggerProps) {
  // Sort logged sets by set_number
  const sorted = [...loggedSets].sort((a, b) => a.set_number - b.set_number);
  const lastSet = sorted[sorted.length - 1];
  const completedCount = sorted.length;
  const nextSetNumber = completedCount + 1;
  const isComplete = completedCount >= prescribedSets;

  // Form state — pre-fill weight from last set or suggestion
  const [weight, setWeight] = useState<string>(() => {
    if (lastSet?.weight_kg != null) return kgToLb(lastSet.weight_kg).toFixed(1);
    if (suggestedWeightLb != null) return suggestedWeightLb.toFixed(1);
    return "";
  });
  const [reps, setReps] = useState<string>(() =>
    prescribedReps ? prescribedReps.toString() : "",
  );
  const [rpe, setRpe] = useState<number | null>(null);

  // Re-sync defaults when logged sets change (e.g. after a server refresh)
  useEffect(() => {
    if (lastSet?.weight_kg != null) {
      setWeight(kgToLb(lastSet.weight_kg).toFixed(1));
    }
  }, [lastSet?.id, lastSet?.weight_kg]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (!Number.isFinite(w) || w <= 0) return;
    if (!Number.isFinite(r) || r <= 0) return;
    if (rpe == null) return;
    onAddSet(exercise.slug, w, r, rpe);
    // Reset rpe + reps, keep weight as default for next set
    setRpe(null);
    setReps(prescribedReps ? prescribedReps.toString() : "");
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/50 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{exercise.name}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {prescribedSets} × {prescribedReps}
            {exercise.equipment !== "machine" && ` · ${exercise.equipment.toUpperCase()}`}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isComplete
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {completedCount} / {prescribedSets}
        </span>
      </div>

      {/* Logged sets list */}
      {sorted.length > 0 && (
        <ul className="space-y-1">
          {sorted.map((s) => {
            const lb = s.weight_kg != null ? kgToLb(s.weight_kg) : null;
            return (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1 text-xs"
              >
                <span className="font-mono tabular-nums text-muted-foreground">
                  Set {s.set_number}
                </span>
                <span className="flex-1 px-2 font-mono tabular-nums">
                  {lb != null ? `${lb.toFixed(1)} lb` : "—"} ×{" "}
                  {s.reps ?? "—"}
                  {s.rpe != null && (
                    <span className="ml-2 text-muted-foreground">
                      Diff {s.rpe}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteSet(s.id)}
                  disabled={pending || s.id.startsWith("temp-")}
                  className="rounded p-0.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-30"
                  aria-label="Delete set"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Set entry form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Weight (lb)
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="50"
              className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-base font-mono tabular-nums text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Reps
            </span>
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="10"
              className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-base font-mono tabular-nums text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
        <RpePicker value={rpe} onChange={setRpe} />
        <button
          type="submit"
          disabled={pending || rpe == null || !weight || !reps}
          className="w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Log set {nextSetNumber}
        </button>
      </form>
    </div>
  );
}

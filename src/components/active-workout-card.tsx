"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/modal";
import { ExerciseSetLogger } from "@/components/exercise-set-logger";
import { Dumbbell, AlertTriangle, Pencil } from "lucide-react";
import {
  endWorkout,
  abandonWorkout,
  updateWorkoutStartTime,
} from "@/lib/training/actions";
import { getExercise } from "@/lib/training/exercises";
import { getTemplate } from "@/lib/training/templates";
import type { ActiveWorkout, WorkoutSet } from "@/lib/training/queries";
import { EditWorkoutStartTimeModal } from "@/components/edit-workout-start-time-modal";

interface ActiveWorkoutCardProps {
  workout: ActiveWorkout;
  initialSets: WorkoutSet[];
}

export function ActiveWorkoutCard({
  workout,
  initialSets,
}: ActiveWorkoutCardProps) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [localStartedAt, setLocalStartedAt] = useState(workout.started_at);
  const [pending, startTransition] = useTransition();
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [abandonModalOpen, setAbandonModalOpen] = useState(false);
  const [editStartOpen, setEditStartOpen] = useState(false);
  const [editStartError, setEditStartError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => setLocalStartedAt(workout.started_at), [workout.started_at]);

  // bfcache fix
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) router.refresh();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  const startedMs = new Date(localStartedAt).getTime();
  const elapsedSec = Math.max(0, Math.floor((now - startedMs) / 1000));
  const elapsedH = Math.floor(elapsedSec / 3600);
  const elapsedM = Math.floor((elapsedSec % 3600) / 60);
  const elapsedDisplay =
    elapsedH > 0
      ? `${elapsedH}h ${elapsedM.toString().padStart(2, "0")}m`
      : `${elapsedM}m`;

  const template = workout.template_slug
    ? getTemplate(workout.template_slug)
    : null;

  // Group sets by exercise slug — each ExerciseSetLogger gets its own slice.
  const setsByExercise: Record<string, WorkoutSet[]> = {};
  for (const s of initialSets) {
    setsByExercise[s.exercise_slug] = setsByExercise[s.exercise_slug] ?? [];
    setsByExercise[s.exercise_slug].push(s);
  }

  function handleEnd() {
    setEndModalOpen(false);
    setActionError(null);
    startTransition(async () => {
      const res = await endWorkout(workout.id);
      if (!res.ok) {
        setActionError(res.error);
        router.refresh();
        return;
      }
      // Navigate to the post-end summary view for this workout.
      router.replace(`/train?ended=${workout.id}`);
      router.refresh();
    });
  }

  function handleSaveStartTime(newIso: string) {
    setEditStartError(null);
    const previous = localStartedAt;
    setLocalStartedAt(newIso);
    startTransition(async () => {
      const res = await updateWorkoutStartTime(workout.id, newIso);
      if (!res.ok) {
        setLocalStartedAt(previous);
        setEditStartError(res.error);
      } else {
        setEditStartOpen(false);
        router.refresh();
      }
    });
  }

  function handleAbandon() {
    setAbandonModalOpen(false);
    setActionError(null);
    startTransition(async () => {
      const res = await abandonWorkout(workout.id);
      if (!res.ok) {
        setActionError(res.error);
      }
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {template?.name ??
                    workout.type.charAt(0).toUpperCase() +
                      workout.type.slice(1)}
                </p>
                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>{elapsedDisplay} elapsed</span>
                  <button
                    type="button"
                    onClick={() => setEditStartOpen(true)}
                    className="inline-flex items-center gap-0.5 hover:text-foreground"
                    aria-label="Edit workout start time"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                    edit
                  </button>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbandonModalOpen(true)}
              className="text-[10px] uppercase tracking-wider text-muted-foreground underline hover:text-destructive"
            >
              Abandon
            </button>
          </div>

          {/* Lift template — one ExerciseSetLogger per exercise */}
          {template && (
            <div className="space-y-3">
              {template.blocks.map((block) => {
                const ex = getExercise(block.exerciseSlug);
                if (!ex) return null;
                return (
                  <ExerciseSetLogger
                    key={block.exerciseSlug}
                    workoutId={workout.id}
                    exercise={ex}
                    prescribedSets={block.sets}
                    prescribedReps={block.reps ?? ex.defaultReps ?? 10}
                    initialSets={setsByExercise[block.exerciseSlug] ?? []}
                  />
                );
              })}
            </div>
          )}

          {/* Non-lift workouts — just elapsed time and end button */}
          {!template && (
            <p className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              {workout.type === "gtx"
                ? "Working out at the gym. Tap Complete when you finish the class."
                : workout.type === "cardio"
                  ? "Cardio session in progress."
                  : "Recovery session. Tap Complete when done."}
            </p>
          )}

          {actionError && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {actionError}
            </p>
          )}

          <button
            type="button"
            onClick={() => setEndModalOpen(true)}
            disabled={pending}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90 disabled:opacity-50"
          >
            Complete workout
          </button>
        </CardContent>
      </Card>

      <Modal
        open={endModalOpen}
        onClose={() => setEndModalOpen(false)}
        className="max-w-xs"
      >
        <h2 className="text-base font-semibold">Complete workout</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Save this workout and return to today's plan?
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setEndModalOpen(false)}
            className="flex-1 rounded-full border border-input bg-secondary py-3 text-sm font-medium hover:bg-secondary/80"
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={handleEnd}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Complete
          </button>
        </div>
      </Modal>

      <EditWorkoutStartTimeModal
        open={editStartOpen}
        onClose={() => {
          setEditStartOpen(false);
          setEditStartError(null);
        }}
        onSave={handleSaveStartTime}
        initialIso={localStartedAt}
        pending={pending}
        error={editStartError}
      />

      <Modal
        open={abandonModalOpen}
        onClose={() => setAbandonModalOpen(false)}
        className="max-w-xs"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/15">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Abandon workout?</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              The workout will be marked abandoned. Your logged sets stay in
              your history. Can be deleted later.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setAbandonModalOpen(false)}
            className="flex-1 rounded-full border border-input bg-secondary py-3 text-sm font-medium hover:bg-secondary/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAbandon}
            className="flex-1 rounded-full bg-destructive py-3 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            Abandon
          </button>
        </div>
      </Modal>
    </>
  );
}

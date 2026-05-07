"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Plus,
} from "lucide-react";
import { WorkoutTypePicker } from "@/components/workout-type-picker";
import { startWorkout } from "@/lib/training/actions";
import {
  formatHistoricSummary,
  type HistoricWorkout,
} from "@/lib/training/history-utils";
import type { WorkoutType } from "@/lib/training/templates";

interface CompletedTodayCardProps {
  workouts: HistoricWorkout[];
}

/**
 * Shown on the Train tab when the user has already finished one or
 * more workouts today and there's no active session. A multi-session
 * day (morning lift + afternoon sauna) lists both — each row links
 * into its history detail. The "Log another workout" CTA opens the
 * picker so the user can stack on top.
 */
export function CompletedTodayCard({ workouts }: CompletedTodayCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStartAnother(type: WorkoutType, templateSlug?: string) {
    setError(null);
    setPickerOpen(false);
    startTransition(async () => {
      const res = await startWorkout({ type, templateSlug });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.href = "/train";
    });
  }

  const sessionWord = workouts.length === 1 ? "session" : "sessions";

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-card to-card shadow-lg shadow-emerald-500/10">
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Done today
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight">
              {workouts.length} {sessionWord} logged
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nice work. Tap any session to review the details.
            </p>
          </div>

          <ul className="divide-y divide-border/60 rounded-xl border border-border bg-background/40 backdrop-blur-sm">
            {workouts.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/train/history/${w.id}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{w.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {formatTimeOfDay(w.started_at)} ·{" "}
                      {formatHistoricSummary(w)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>

          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      </article>

      {/* Secondary CTA — log another workout */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        disabled={pending}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent disabled:opacity-50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          {pending ? (
            <Dumbbell className="h-5 w-5 animate-pulse" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {pending ? "Starting…" : "Log another workout"}
          </p>
          <p className="text-xs text-muted-foreground">
            Lift, GTX, cardio, or recovery
          </p>
        </div>
      </button>

      <WorkoutTypePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handleStartAnother}
        pending={pending}
      />
    </>
  );
}

function formatTimeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

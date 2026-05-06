"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Activity,
  Sparkles,
  Coffee,
  Play,
  type LucideIcon,
} from "lucide-react";
import { WorkoutTypePicker } from "@/components/workout-type-picker";
import { startWorkout } from "@/lib/training/actions";
import {
  getTemplate,
  type WeeklyTrainingDay,
  type WorkoutType,
} from "@/lib/training/templates";
import { getExercise } from "@/lib/training/exercises";

interface HeroWorkoutCardProps {
  today: WeeklyTrainingDay;
}

const TYPE_ICONS: Record<WorkoutType, LucideIcon> = {
  lift: Dumbbell,
  gtx: Activity,
  cardio: Activity,
  recovery: Sparkles,
  rest: Coffee,
};

const BADGE_COPY: Record<WorkoutType, string> = {
  lift: "Today's workout",
  gtx: "Today's workout",
  cardio: "Today's workout",
  recovery: "Today's plan",
  rest: "Rest day",
};

const FALLBACK_TITLE: Record<WorkoutType, string> = {
  lift: "Lift",
  gtx: "GTX class",
  cardio: "Cardio",
  recovery: "Recovery",
  rest: "Take it easy",
};

const FALLBACK_BLURB: Record<WorkoutType, string> = {
  lift: "Strength session",
  gtx: "Group training class at the gym",
  cardio: "Zone-2 or HIIT, your call",
  recovery: "Light walk, sauna, mobility",
  rest: "Sleep, mobility, sauna",
};

export function HeroWorkoutCard({ today }: HeroWorkoutCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const Icon = TYPE_ICONS[today.type];
  const template = today.templateSlug ? getTemplate(today.templateSlug) : null;
  const isRest = today.type === "rest";

  const title = template?.name ?? FALLBACK_TITLE[today.type];
  const blurb = template
    ? `${template.durationTargetMin}-min · ${template.blocks.length} exercises`
    : FALLBACK_BLURB[today.type];

  function handleStart(type: WorkoutType, templateSlug?: string) {
    setError(null);
    setPickerOpen(false);
    startTransition(async () => {
      const res = await startWorkout({ type, templateSlug });
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  return (
    <>
      {/* Hero card — visually prominent today's workout */}
      <article className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card shadow-lg shadow-primary/10">
        {/* Decorative blur circle */}
        <div
          aria-hidden
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative space-y-4 p-5">
          {/* Top row: badge + icon */}
          <div className="flex items-start justify-between">
            <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              {BADGE_COPY[today.type]}
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Title + blurb */}
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
          </div>

          {/* Exercise preview list (for lift days) */}
          {template && (
            <ul className="space-y-1.5 rounded-xl border border-border/60 bg-background/40 p-3 backdrop-blur-sm">
              {template.blocks.map((block, idx) => {
                const ex = getExercise(block.exerciseSlug);
                if (!ex) return null;
                return (
                  <li
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {block.sets} × {block.reps ?? ex.defaultReps ?? 10}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {/* Primary CTA */}
          {!isRest ? (
            <button
              type="button"
              onClick={() => handleStart(today.type, today.templateSlug)}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-bold uppercase tracking-wide text-primary-foreground shadow-md shadow-primary/30 transition-transform hover:scale-[1.01] hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              {pending ? "Starting…" : "Start workout"}
            </button>
          ) : (
            <p className="text-center text-sm italic text-muted-foreground">
              Recover up — you've earned it.
            </p>
          )}
        </div>
      </article>

      {/* Secondary action — pick a different workout */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        disabled={pending}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent disabled:opacity-50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Custom workout</p>
          <p className="text-xs text-muted-foreground">
            Pick any session — lift, GTX, cardio, recovery
          </p>
        </div>
      </button>

      <WorkoutTypePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handleStart}
        pending={pending}
        recommendedType={isRest ? undefined : today.type}
        recommendedTemplateSlug={today.templateSlug}
      />
    </>
  );
}

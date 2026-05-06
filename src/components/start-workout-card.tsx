"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Activity, Coffee, Sparkles } from "lucide-react";
import { startWorkout } from "@/lib/training/actions";
import {
  type WeeklyTrainingDay,
  getTemplate,
} from "@/lib/training/templates";
import { getExercise } from "@/lib/training/exercises";

interface StartWorkoutCardProps {
  today: WeeklyTrainingDay;
}

const TYPE_ICONS = {
  gtx: Activity,
  lift: Dumbbell,
  cardio: Activity,
  recovery: Sparkles,
  rest: Coffee,
} as const;

export function StartWorkoutCard({ today }: StartWorkoutCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const Icon = TYPE_ICONS[today.type];
  const template = today.templateSlug ? getTemplate(today.templateSlug) : null;
  const isRest = today.type === "rest";

  function handleStart() {
    setError(null);
    if (isRest) return;
    startTransition(async () => {
      const res = await startWorkout({
        type: today.type,
        templateSlug: today.templateSlug,
      });
      if (!res.ok) {
        setError(res.error);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <Icon className="h-8 w-8 text-primary" />
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Today's training
          </p>
          <p className="mt-1 text-lg font-semibold">{today.label}</p>
          {template && (
            <p className="mt-1 text-xs text-muted-foreground">
              {template.durationTargetMin}-min · {template.blocks.length}{" "}
              exercises
            </p>
          )}
        </div>

        {/* Show prescribed exercises for lift workouts */}
        {template && (
          <ul className="space-y-1 rounded-xl border border-border bg-muted/20 p-3 text-left">
            {template.blocks.map((block, idx) => {
              const ex = getExercise(block.exerciseSlug);
              if (!ex) return null;
              return (
                <li
                  key={idx}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-medium">{ex.name}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {block.sets} × {block.reps ?? ex.defaultReps ?? 10}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!isRest ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={pending}
            className="w-full rounded-full bg-primary py-3 text-base font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Starting…" : "Start workout"}
          </button>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Rest day — recover up.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

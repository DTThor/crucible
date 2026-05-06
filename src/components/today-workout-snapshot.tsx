"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";
import type { ActiveWorkout, WorkoutSet } from "@/lib/training/queries";
import { getTemplate } from "@/lib/training/templates";

interface TodayWorkoutSnapshotProps {
  workout: ActiveWorkout;
  setCount: number;
}

export function TodayWorkoutSnapshot({
  workout,
  setCount,
}: TodayWorkoutSnapshotProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const startedMs = new Date(workout.started_at).getTime();
  const elapsedMin = Math.max(0, Math.floor((now - startedMs) / 60_000));
  const template = workout.template_slug
    ? getTemplate(workout.template_slug)
    : null;

  return (
    <Link href="/train" className="block">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
          <Dumbbell className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">
            {template?.name ??
              workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
          </p>
          <p className="text-xs text-muted-foreground">
            {elapsedMin}m elapsed · {setCount} set{setCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </Link>
  );
}

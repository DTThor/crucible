import { notFound } from "next/navigation";
import { Trophy, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { SmartBackButton } from "@/components/smart-back-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getWorkoutById,
  getWorkoutSets,
} from "@/lib/training/queries";
import { getTemplate } from "@/lib/training/templates";
import { getExercise } from "@/lib/training/exercises";
import { kgToLb } from "@/lib/units";
import {
  formatDuration,
  formatVolume,
} from "@/lib/training/history-utils";
import { WorkoutDetailSummary } from "@/components/workout-detail-summary";

export const dynamic = "force-dynamic";

interface DetailProps {
  params: Promise<{ id: string }>;
}

const WEEKDAY = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH = [
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

function formatStarted(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${WEEKDAY[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()} · ${time}`;
}

const DIFFICULTY_ANCHORS: Record<number, string> = {
  6: "easy",
  7: "moderate",
  8: "hard",
  9: "near max",
  10: "max effort",
};

export default async function WorkoutDetailPage({ params }: DetailProps) {
  await requireUser();
  const { id } = await params;

  const [workout, sets] = await Promise.all([
    getWorkoutById(id),
    getWorkoutSets(id),
  ]);

  if (!workout) notFound();

  const template = workout.template_slug
    ? getTemplate(workout.template_slug)
    : null;
  const title =
    template?.name ??
    workout.type.charAt(0).toUpperCase() + workout.type.slice(1);

  const isAbandoned = workout.status === "abandoned";
  const startMs = new Date(workout.started_at).getTime();
  const endMs = workout.ended_at
    ? new Date(workout.ended_at).getTime()
    : Date.now();
  const durationMin = Math.max(0, (endMs - startMs) / 60_000);

  // Group sets by exercise (preserving order they were logged)
  const setsByExercise: Record<
    string,
    { sets: typeof sets; rpe: number | null; volumeLb: number }
  > = {};
  for (const s of sets) {
    if (!setsByExercise[s.exercise_slug]) {
      setsByExercise[s.exercise_slug] = {
        sets: [],
        rpe: null,
        volumeLb: 0,
      };
    }
    const group = setsByExercise[s.exercise_slug];
    group.sets.push(s);
    if (group.rpe == null && s.rpe != null && !s.was_warmup) {
      group.rpe = s.rpe;
    }
    if (!s.was_warmup && s.weight_kg != null && s.reps != null) {
      group.volumeLb += kgToLb(s.weight_kg) * s.reps;
    }
  }

  const totalVolumeLb = Object.values(setsByExercise).reduce(
    (acc, g) => acc + g.volumeLb,
    0,
  );
  const workingSetCount = sets.filter((s) => !s.was_warmup).length;

  return (
    <>
      <header
        className="sticky top-0 z-30 -mx-4 mb-3 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <SmartBackButton fallbackHref="/train/history" />
      </header>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  isAbandoned
                    ? "bg-amber-400/15 text-amber-400"
                    : "bg-emerald-500/15 text-emerald-400"
                }`}
              >
                {isAbandoned ? (
                  <XCircle className="h-7 w-7" />
                ) : (
                  <Trophy className="h-7 w-7" />
                )}
              </div>
              <p className="text-base font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">
                {formatStarted(workout.started_at)}
              </p>
            </div>

            {/* Duration / Sets / Volume only make sense for lift days.
                Cardio + recovery + GTX are activity-logged and capture
                their own duration in the details payload. */}
            {workout.type === "lift" && (
              <div className="grid grid-cols-3 gap-2">
                <SnapshotCell
                  label="Duration"
                  value={formatDuration(durationMin)}
                />
                <SnapshotCell
                  label="Sets"
                  value={workingSetCount.toString()}
                />
                <SnapshotCell
                  label="Volume"
                  value={
                    totalVolumeLb > 0
                      ? `${formatVolume(totalVolumeLb)} lb`
                      : "—"
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Non-lift detail summary (cardio, GTX, recovery) */}
        <WorkoutDetailSummary type={workout.type} details={workout.details} />

        {Object.keys(setsByExercise).length === 0 ? (
          // Only show "no sets" for workout types that should have sets.
          workout.type === "lift" ? (
            <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              No sets were logged in this workout.
            </div>
          ) : null
        ) : (
          <div className="space-y-3">
            {Object.entries(setsByExercise).map(([slug, group]) => {
              const ex = getExercise(slug);
              return (
                <article
                  key={slug}
                  className="space-y-2 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-tight">
                        {ex?.name ?? slug}
                      </h3>
                      {ex && (
                        <p className="text-[10px] capitalize text-muted-foreground">
                          {ex.primaryMuscle}
                        </p>
                      )}
                    </div>
                    {group.rpe != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Difficulty {group.rpe}
                        {DIFFICULTY_ANCHORS[group.rpe] && (
                          <span className="text-primary/70">
                            · {DIFFICULTY_ANCHORS[group.rpe]}
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-1">
                    {group.sets.map((s, i) => {
                      const lb =
                        s.weight_kg != null ? kgToLb(s.weight_kg) : null;
                      return (
                        <li
                          key={s.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="font-mono tabular-nums text-muted-foreground">
                            {s.was_warmup ? "warmup" : `Set ${i + 1}`}
                          </span>
                          <span className="font-mono tabular-nums">
                            {lb != null
                              ? `${lb % 1 === 0 ? lb.toFixed(0) : lb.toFixed(1)} lb`
                              : "—"}{" "}
                            × {s.reps ?? "—"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {group.volumeLb > 0 && (
                    <p className="text-right text-[10px] text-muted-foreground">
                      {formatVolume(group.volumeLb)} lb volume
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function SnapshotCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-2.5 py-2 text-center">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-base font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

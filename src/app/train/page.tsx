import { BarChart3, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { ActiveWorkoutCard } from "@/components/active-workout-card";
import { HeroWorkoutCard } from "@/components/hero-workout-card";
import { WorkoutSummaryCard } from "@/components/workout-summary-card";
import { CompletedTodayCard } from "@/components/completed-today-card";
import { TabHeader } from "@/components/tab-header";
import { BfcacheRefresher } from "@/components/bfcache-refresher";
import { formatTodayDate } from "@/lib/copy";
import {
  getActiveWorkout,
  getLastSetForExercise,
  getWorkoutById,
  getWorkoutSets,
} from "@/lib/training/queries";
import { getTodayCompletedWorkouts } from "@/lib/training/history";
import { getTemplate } from "@/lib/training/templates";
import { getPlannedDay } from "@/lib/planning/queries";
import { getExercise } from "@/lib/training/exercises";
import {
  suggestNext,
  type Suggestion,
} from "@/lib/training/suggestions";
import {
  getProfile,
  resolveInitials,
  resolveName,
} from "@/lib/profile/queries";

export const dynamic = "force-dynamic";

interface TrainPageProps {
  searchParams: Promise<{ ended?: string }>;
}

export default async function TrainPage({ searchParams }: TrainPageProps) {
  const user = await requireUser();
  const { ended: endedWorkoutId } = await searchParams;

  const [profile, active, justEnded, completedToday, plan] =
    await Promise.all([
      getProfile(),
      getActiveWorkout(),
      endedWorkoutId
        ? getWorkoutById(endedWorkoutId)
        : Promise.resolve(null),
      getTodayCompletedWorkouts(),
      getPlannedDay(new Date()),
    ]);

  const showSummary =
    justEnded &&
    justEnded.status !== "active" &&
    justEnded.ended_at != null;

  const setsForView = showSummary
    ? await getWorkoutSets(justEnded.id)
    : active
      ? await getWorkoutSets(active.id)
      : [];

  // Compute per-exercise suggestions for the active workout based on the
  // most recent prior session of each exercise. We exclude the current
  // workout's own sets so the placeholders reflect what came BEFORE this
  // session — not what was just logged a minute ago.
  let suggestions: Record<string, Suggestion | null> = {};
  if (active) {
    const template = active.template_slug
      ? getTemplate(active.template_slug)
      : null;
    if (template) {
      const entries = await Promise.all(
        template.blocks.map(async (block) => {
          const last = await getLastSetForExercise(
            block.exerciseSlug,
            active.id,
          );
          const ex = getExercise(block.exerciseSlug);
          const fallbackReps =
            block.reps ?? ex?.defaultReps ?? 10;
          return [
            block.exerciseSlug,
            suggestNext(last, fallbackReps, ex?.equipment ?? "db"),
          ] as const;
        }),
      );
      suggestions = Object.fromEntries(entries);
    }
  }

  // Map the planner's per-day view onto the shape HeroWorkoutCard
  // already understands. Letter-for-letter the same when the user has
  // no override; otherwise reflects the planned slot.
  const today: {
    type: typeof plan.workoutType;
    templateSlug?: string;
    label: string;
  } = {
    type: plan.workoutType,
    templateSlug: plan.workoutTemplateSlug ?? undefined,
    label:
      plan.workoutType === "lift" && plan.workoutTemplateSlug
        ? getTemplate(plan.workoutTemplateSlug)?.name ?? "Lift"
        : plan.workoutType === "gtx"
          ? "GTX class"
          : plan.workoutType === "cardio"
            ? "Cardio"
            : plan.workoutType === "recovery"
              ? "Recovery"
              : "Rest day",
  };
  const now = new Date();
  const name = resolveName(profile, user.email ?? "");
  const initials = resolveInitials(name);
  const subtitle = showSummary
    ? `${formatTodayDate(now)} · Just finished`
    : active
      ? `${formatTodayDate(now)} · Workout in progress`
      : completedToday.length > 0
        ? `${formatTodayDate(now)} · You already trained today`
        : formatTodayDate(now);

  return (
    <div className="space-y-5">
      <BfcacheRefresher />
      <TabHeader
        avatarUrl={profile?.avatar_url ?? null}
        initials={initials}
        name={name}
        subtitle={subtitle}
      />
      {showSummary && justEnded?.ended_at ? (
        <WorkoutSummaryCard
          workoutId={justEnded.id}
          type={justEnded.type}
          templateSlug={justEnded.template_slug}
          startedAt={justEnded.started_at}
          endedAt={justEnded.ended_at}
          status={justEnded.status}
          sets={setsForView}
          details={justEnded.details}
        />
      ) : active ? (
        <ActiveWorkoutCard
          workout={active}
          initialSets={setsForView}
          suggestions={suggestions}
        />
      ) : completedToday.length > 0 ? (
        <CompletedTodayCard workouts={completedToday} />
      ) : (
        <HeroWorkoutCard today={today} />
      )}

      {!active && (
        // Hard-nav (plain <a>) instead of <Link> — soft nav can serve a
        // stale RSC payload of /train/history when the user just logged
        // a workout. Hard nav guarantees fresh stats + recent list.
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
          href="/train/history"
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4 text-primary" />
            View history & progression
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </a>
      )}
    </div>
  );
}

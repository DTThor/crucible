import { requireUser } from "@/lib/auth-guard";
import { ActiveWorkoutCard } from "@/components/active-workout-card";
import { HeroWorkoutCard } from "@/components/hero-workout-card";
import { WorkoutSummaryCard } from "@/components/workout-summary-card";
import { TabHeader } from "@/components/tab-header";
import { formatTodayDate, getGreeting } from "@/lib/copy";
import {
  getActiveWorkout,
  getWorkoutById,
  getWorkoutSets,
} from "@/lib/training/queries";
import { getTodayTraining } from "@/lib/training/templates";
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

  const [profile, active, justEnded] = await Promise.all([
    getProfile(),
    getActiveWorkout(),
    endedWorkoutId ? getWorkoutById(endedWorkoutId) : Promise.resolve(null),
  ]);

  const showSummary =
    justEnded &&
    justEnded.status !== "active" &&
    justEnded.ended_at != null;

  // Fetch sets for whichever workout we're showing
  const setsForView = showSummary
    ? await getWorkoutSets(justEnded.id)
    : active
      ? await getWorkoutSets(active.id)
      : [];

  const today = getTodayTraining();
  const now = new Date();
  const name = resolveName(profile, user.email ?? "");
  const initials = resolveInitials(name);
  const greeting = `${getGreeting(now)}, ${name}`;
  const subtitle = showSummary
    ? `${formatTodayDate(now)} · Just finished`
    : active
      ? `${formatTodayDate(now)} · Workout in progress`
      : formatTodayDate(now);

  return (
    <div className="space-y-5">
      <TabHeader
        avatarUrl={profile?.avatar_url ?? null}
        initials={initials}
        greeting={greeting}
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
        />
      ) : active ? (
        <ActiveWorkoutCard workout={active} initialSets={setsForView} />
      ) : (
        <HeroWorkoutCard today={today} />
      )}
    </div>
  );
}

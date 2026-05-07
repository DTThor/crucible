import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Dumbbell } from "lucide-react";
import { TabHeader } from "@/components/tab-header";
import { TodayFastSnapshot } from "@/components/today-fast-snapshot";
import { TodayWorkoutSnapshot } from "@/components/today-workout-snapshot";
import { WaterQuickLog } from "@/components/water-quick-log";
import { WeightCard } from "@/components/weight-card";
import { BfcacheRefresher } from "@/components/bfcache-refresher";
import { getActiveFast } from "@/lib/fasting/queries";
import { PROTOCOLS } from "@/lib/fasting/protocols";
import {
  getActiveWorkout,
  getWorkoutSets,
} from "@/lib/training/queries";
import { WORKOUT_TEMPLATES } from "@/lib/training/templates";
import { getPlannedDay } from "@/lib/planning/queries";
import { getRecentWaterLogs } from "@/lib/water/queries";
import {
  getLatestWeight,
  getRecentWeightLogs,
  getWeightAround,
} from "@/lib/weight/queries";
import {
  getProfile,
  resolveInitials,
  resolveName,
} from "@/lib/profile/queries";
import { formatTodayDate } from "@/lib/copy";

export const dynamic = "force-dynamic";

import type { PlannedDay } from "@/lib/planning/types";

function workoutLabel(plan: PlannedDay): string {
  if (plan.workoutType === "lift" && plan.workoutTemplateSlug) {
    const t = WORKOUT_TEMPLATES[plan.workoutTemplateSlug];
    return t?.name ?? "Lift";
  }
  if (plan.workoutType === "gtx") return "GTX class";
  if (plan.workoutType === "cardio") return "Cardio";
  if (plan.workoutType === "recovery") return "Recovery";
  return "Rest day";
}

export default async function TodayPage() {
  const user = await requireUser();

  const [
    profile,
    active,
    activeWorkout,
    waterLogs,
    latestWeight,
    weekAgoWeight,
    weightLogs,
    plan,
  ] = await Promise.all([
    getProfile(),
    getActiveFast(),
    getActiveWorkout(),
    getRecentWaterLogs(7),
    getLatestWeight(),
    getWeightAround(7),
    // Year of weigh-ins for the history modal mounted inside WeightCard.
    getRecentWeightLogs(365),
    getPlannedDay(),
  ]);

  const activeWorkoutSets = activeWorkout
    ? await getWorkoutSets(activeWorkout.id)
    : [];

  const todayProtocolName = PROTOCOLS[plan.fastingProtocolSlug].name;
  const todayTrainingLabel = workoutLabel(plan);

  const now = new Date();
  const name = resolveName(profile, user.email ?? "");
  const initials = resolveInitials(name);
  const subtitle = formatTodayDate(now);

  return (
    <div className="space-y-3">
      <BfcacheRefresher />
      <TabHeader
        avatarUrl={profile?.avatar_url ?? null}
        initials={initials}
        name={name}
        subtitle={subtitle}
      />

      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Timer className="h-4 w-4 text-primary" />
            {active ? "Active fast" : "No fast in progress"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {active ? (
            <TodayFastSnapshot
              startedAt={active.started_at}
              protocolSlug={active.protocol_slug}
            />
          ) : (
            <Link href="/fast" className="block text-sm text-muted-foreground">
              Today's plan:{" "}
              <span className="font-medium text-foreground">
                {todayProtocolName}
              </span>
              . Start it from the Fast tab.
            </Link>
          )}
        </CardContent>
      </Card>

      <WaterQuickLog recentLogs={waterLogs} />

      <WeightCard
        latest={latestWeight}
        weekAgo={weekAgoWeight}
        logs={weightLogs}
      />

      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Dumbbell className="h-4 w-4 text-primary" />
            {activeWorkout ? "Workout in progress" : "Today's training"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {activeWorkout ? (
            <TodayWorkoutSnapshot
              workout={activeWorkout}
              setCount={activeWorkoutSets.length}
            />
          ) : (
            <Link href="/train" className="block text-sm text-muted-foreground">
              Today's plan:{" "}
              <span className="font-medium text-foreground">
                {todayTrainingLabel}
              </span>
              . Start it from the Train tab.
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

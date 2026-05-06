import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Dumbbell } from "lucide-react";
import { TodayFastSnapshot } from "@/components/today-fast-snapshot";
import { TodayWorkoutSnapshot } from "@/components/today-workout-snapshot";
import { WaterQuickLog } from "@/components/water-quick-log";
import { WeightCard } from "@/components/weight-card";
import { getActiveFast } from "@/lib/fasting/queries";
import { getTodayProtocol } from "@/lib/fasting/templates";
import { PROTOCOLS } from "@/lib/fasting/protocols";
import {
  getActiveWorkout,
  getWorkoutSets,
} from "@/lib/training/queries";
import { getTodayTraining } from "@/lib/training/templates";
import { getRecentWaterLogs } from "@/lib/water/queries";
import { getLatestWeight, getWeightAround } from "@/lib/weight/queries";

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

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  await requireUser();

  const [active, activeWorkout, waterLogs, latestWeight, weekAgoWeight] =
    await Promise.all([
      getActiveFast(),
      getActiveWorkout(),
      getRecentWaterLogs(7),
      getLatestWeight(),
      getWeightAround(7),
    ]);

  const activeWorkoutSets = activeWorkout
    ? await getWorkoutSets(activeWorkout.id)
    : [];

  const todayProtocol = getTodayProtocol();
  const todayProtocolName = PROTOCOLS[todayProtocol].name;
  const todayTraining = getTodayTraining();

  const now = new Date();
  const subtitle = `${WEEKDAY[now.getDay()]} · ${MONTH[now.getMonth()]} ${now.getDate()}`;

  return (
    <>
      <PageHeader title="Today" subtitle={subtitle} />

      <div className="space-y-3">
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
              <Link
                href="/fast"
                className="block text-sm text-muted-foreground"
              >
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

        <WeightCard latest={latestWeight} weekAgo={weekAgoWeight} />

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
              <Link
                href="/train"
                className="block text-sm text-muted-foreground"
              >
                Today's plan:{" "}
                <span className="font-medium text-foreground">
                  {todayTraining.label}
                </span>
                . Start it from the Train tab.
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

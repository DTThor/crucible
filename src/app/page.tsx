import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Dumbbell, Droplets, Scale } from "lucide-react";
import { TodayFastSnapshot } from "@/components/today-fast-snapshot";
import { getActiveFast } from "@/lib/fasting/queries";
import { getTodayProtocol } from "@/lib/fasting/templates";
import { PROTOCOLS } from "@/lib/fasting/protocols";

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
  const user = await requireUser();
  const active = await getActiveFast();
  const todayProtocol = getTodayProtocol();
  const todayName = PROTOCOLS[todayProtocol].name;

  const now = new Date();
  const subtitle = `${WEEKDAY[now.getDay()]} · ${MONTH[now.getMonth()]} ${now.getDate()}`;

  return (
    <>
      <PageHeader title="Today" subtitle={subtitle} />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-4 w-4 text-primary" />
              {active ? "Active fast" : "No fast in progress"}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                Today's plan: <span className="font-medium text-foreground">{todayName}</span>.
                Start it from the Fast tab.
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="h-4 w-4 text-primary" />
              Today's training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Training program will appear here in Phase 2.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Droplets className="h-4 w-4" />
                Water
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">0 oz</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Scale className="h-4 w-4" />
                Last weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">— lb</p>
            </CardContent>
          </Card>
        </div>

        <p className="px-1 pt-2 text-xs text-muted-foreground">
          Signed in as {user.email}
        </p>
      </div>
    </>
  );
}

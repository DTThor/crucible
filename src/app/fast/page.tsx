import Link from "next/link";
import { ChevronRight, BarChart3 } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { ActiveFastCard } from "@/components/active-fast-card";
import { StartFastCard } from "@/components/start-fast-card";
import { WaterQuickLog } from "@/components/water-quick-log";
import { WeightCard } from "@/components/weight-card";
import { getActiveFast } from "@/lib/fasting/queries";
import { getTodayProtocol } from "@/lib/fasting/templates";
import { PROTOCOLS } from "@/lib/fasting/protocols";
import { getRecentWaterLogs } from "@/lib/water/queries";
import { getLatestWeight, getWeightAround } from "@/lib/weight/queries";

export const dynamic = "force-dynamic";

export default async function FastPage() {
  await requireUser();

  const [active, waterLogs, latestWeight, weekAgoWeight] = await Promise.all([
    getActiveFast(),
    getRecentWaterLogs(7),
    getLatestWeight(),
    getWeightAround(7),
  ]);

  const todayProtocol = getTodayProtocol();
  const todayName = PROTOCOLS[todayProtocol].name;

  return (
    <>
      <PageHeader
        title="Fast"
        subtitle={active ? "In progress" : `Today's plan: ${todayName}`}
      />

      <div className="space-y-3">
        {active ? (
          <ActiveFastCard
            fastId={active.id}
            protocolSlug={active.protocol_slug}
            startedAt={active.started_at}
            plannedEndAt={active.planned_end_at}
          />
        ) : (
          <StartFastCard todayProtocol={todayProtocol} />
        )}

        <WaterQuickLog recentLogs={waterLogs} />

        <WeightCard latest={latestWeight} weekAgo={weekAgoWeight} />

        <Link
          href="/fast/history"
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4 text-primary" />
            View history & stats
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </>
  );
}

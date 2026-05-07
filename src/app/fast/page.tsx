import Link from "next/link";
import { ChevronRight, BarChart3 } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { ActiveFastCard } from "@/components/active-fast-card";
import { StartFastCard } from "@/components/start-fast-card";
import { FastSummaryCard } from "@/components/fast-summary-card";
import { WaterQuickLog } from "@/components/water-quick-log";
import { WeightCard } from "@/components/weight-card";
import { TabHeader } from "@/components/tab-header";
import { getActiveFast, getFastById } from "@/lib/fasting/queries";
import { getTodayProtocol } from "@/lib/fasting/templates";
import { PROTOCOLS } from "@/lib/fasting/protocols";
import { getRecentWaterLogs } from "@/lib/water/queries";
import { getLatestWeight, getWeightAround } from "@/lib/weight/queries";
import {
  getProfile,
  resolveInitials,
  resolveName,
} from "@/lib/profile/queries";
import { formatTodayDate } from "@/lib/copy";

export const dynamic = "force-dynamic";

interface FastPageProps {
  searchParams: Promise<{ ended?: string }>;
}

export default async function FastPage({ searchParams }: FastPageProps) {
  const user = await requireUser();
  const { ended: endedFastId } = await searchParams;

  const [
    profile,
    active,
    waterLogs,
    latestWeight,
    weekAgoWeight,
    justEnded,
  ] = await Promise.all([
    getProfile(),
    getActiveFast(),
    getRecentWaterLogs(7),
    getLatestWeight(),
    getWeightAround(7),
    endedFastId ? getFastById(endedFastId) : Promise.resolve(null),
  ]);

  const todayProtocol = getTodayProtocol();
  const todayName = PROTOCOLS[todayProtocol].name;

  const now = new Date();
  const name = resolveName(profile, user.email ?? "");
  const initials = resolveInitials(name);
  const dateStr = formatTodayDate(now);

  const showSummary =
    justEnded &&
    justEnded.status !== "active" &&
    justEnded.ended_at != null;

  const subtitle = showSummary
    ? `${dateStr} · Just finished`
    : active
      ? `${dateStr} · In progress`
      : `${dateStr} · Today's plan: ${todayName}`;

  return (
    <div className="space-y-3">
      <TabHeader
        avatarUrl={profile?.avatar_url ?? null}
        initials={initials}
        name={name}
        subtitle={subtitle}
      />

      {showSummary && justEnded?.ended_at ? (
        <FastSummaryCard
          fastId={justEnded.id}
          protocolSlug={justEnded.protocol_slug}
          startedAt={justEnded.started_at}
          endedAt={justEnded.ended_at}
          status={justEnded.status}
        />
      ) : active ? (
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
        prefetch={false}
        className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="h-4 w-4 text-primary" />
          View history & stats
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}

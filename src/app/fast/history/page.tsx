import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import {
  getFastHistory,
  computeFastStats,
  buildHeatmapDays,
} from "@/lib/fasting/history";
import { getRecentWeightLogs } from "@/lib/weight/queries";
import { AggregateStats } from "@/components/aggregate-stats";
import { FastHeatmap } from "@/components/fast-heatmap";
import { WeightTrendChart } from "@/components/weight-trend-chart";
import { FastHistoryList } from "@/components/fast-history-list";

export const dynamic = "force-dynamic";

export default async function FastHistoryPage() {
  await requireUser();

  const [history, weightLogs] = await Promise.all([
    getFastHistory(90),
    getRecentWeightLogs(30),
  ]);

  const stats = computeFastStats(history);
  const heatmap = buildHeatmapDays(history, 84);

  return (
    <>
      <header
        className="sticky top-0 z-30 -mx-4 mb-3 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <Link
          href="/fast"
          className="-ml-2 flex items-center gap-0.5 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Fast</span>
        </Link>
        <h1 className="ml-1 text-lg font-semibold tracking-tight">History</h1>
      </header>

      <div className="space-y-4">
        <AggregateStats stats={stats} />

        <section className="rounded-xl border border-border bg-card p-3">
          <FastHeatmap days={heatmap} />
        </section>

        <WeightTrendChart logs={weightLogs} />

        <section className="space-y-2">
          <p className="px-1 text-sm font-semibold">Recent fasts</p>
          <FastHistoryList fasts={history.slice(0, 30)} />
        </section>
      </div>
    </>
  );
}

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { getFastHistory } from "@/lib/fasting/history";
import { getRecentWeightLogs } from "@/lib/weight/queries";
import { FastHistoryClient } from "@/components/fast-history-client";
import { WeightTrendChart } from "@/components/weight-trend-chart";

export const dynamic = "force-dynamic";

export default async function FastHistoryPage() {
  await requireUser();

  const [history, weightLogs] = await Promise.all([
    getFastHistory(90),
    // Pull a year of weight logs — the trend chart still focuses on
    // the last 30 days (x-axis is anchored there), but the "tap to
    // view all" modal benefits from the longer history.
    getRecentWeightLogs(365),
  ]);

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
        <FastHistoryClient initialFasts={history} />
        <WeightTrendChart logs={weightLogs} />
      </div>
    </>
  );
}

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/modal";
import { AggregateStats } from "@/components/aggregate-stats";
import { FastHeatmap } from "@/components/fast-heatmap";
import { FastHistoryList } from "@/components/fast-history-list";
import {
  buildHeatmapDays,
  computeFastStats,
  type HistoricFast,
} from "@/lib/fasting/history-utils";
import { deleteFast } from "@/lib/fasting/actions";

interface FastHistoryClientProps {
  initialFasts: HistoricFast[];
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
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

export function FastHistoryClient({ initialFasts }: FastHistoryClientProps) {
  const router = useRouter();
  const [fasts, setFasts] = useState<HistoricFast[]>(initialFasts);
  const [pending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<HistoricFast | null>(null);

  // Sync local state when server-provided fasts change (e.g. after refresh)
  useEffect(() => setFasts(initialFasts), [initialFasts]);

  // iOS Safari restores pages from bfcache when you navigate back, which can
  // cause a stale view. Force a router refresh on bfcache restore so server
  // data is re-fetched.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) router.refresh();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  const stats = useMemo(() => computeFastStats(fasts), [fasts]);
  const heatmap = useMemo(() => buildHeatmapDays(fasts, 84), [fasts]);

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    const previous = fasts;
    setFasts((prev) => prev.filter((f) => f.id !== id));
    setPendingDelete(null);
    startTransition(async () => {
      const res = await deleteFast(id);
      if (!res.ok) {
        setFasts(previous);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <AggregateStats stats={stats} />

      <section className="rounded-xl border border-border bg-card p-3">
        <FastHeatmap days={heatmap} />
      </section>

      <section className="space-y-2">
        <p className="px-1 text-sm font-semibold">Recent fasts</p>
        <FastHistoryList
          fasts={fasts.slice(0, 30)}
          onRequestDelete={setPendingDelete}
        />
      </section>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        className="max-w-xs"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/15">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Delete fast?</h2>
            {pendingDelete && (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDay(pendingDelete.started_at)} ·{" "}
                {formatDuration(pendingDelete.duration_hours)}. Can't be undone.
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            disabled={pending}
            className="flex-1 rounded-full border border-input bg-secondary py-3 text-sm font-medium hover:bg-secondary/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={pending}
            className="flex-1 rounded-full bg-destructive py-3 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

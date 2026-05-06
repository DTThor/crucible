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

  // Track explicitly-deleted IDs separately from server data. This lets the
  // optimistic delete survive any prop resync — if the server briefly hands
  // back a row we know we deleted (cache lag, RLS edge case), we still hide
  // it. New rows from the server still flow through normally.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<HistoricFast | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // bfcache fix — iOS Safari restores from cache on back-nav; force fresh.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) router.refresh();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  const visibleFasts = useMemo(
    () => initialFasts.filter((f) => !deletedIds.has(f.id)),
    [initialFasts, deletedIds],
  );

  const stats = useMemo(() => computeFastStats(visibleFasts), [visibleFasts]);
  const heatmap = useMemo(
    () => buildHeatmapDays(visibleFasts, 84),
    [visibleFasts],
  );

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setActionError(null);
    // Optimistic add to deleted set
    setDeletedIds((prev) => new Set([...prev, id]));
    startTransition(async () => {
      const res = await deleteFast(id);
      if (!res.ok) {
        // Revert
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setActionError(`Delete failed: ${res.error}`);
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
          fasts={visibleFasts.slice(0, 30)}
          onRequestDelete={setPendingDelete}
        />
      </section>

      {actionError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      )}

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

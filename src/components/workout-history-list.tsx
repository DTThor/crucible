"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { deleteWorkout } from "@/lib/training/actions";
import {
  formatDuration,
  formatVolume,
  type HistoricWorkout,
} from "@/lib/training/history-utils";

interface WorkoutHistoryListProps {
  workouts: HistoricWorkout[];
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

function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function WorkoutHistoryList({ workouts }: WorkoutHistoryListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Track optimistic deletes so the row vanishes the moment the user
  // confirms — no waiting on the server round-trip.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] =
    useState<HistoricWorkout | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visible = workouts.filter((w) => !deletedIds.has(w.id));

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setActionError(null);
    setDeletedIds((prev) => new Set([...prev, id]));
    startTransition(async () => {
      const res = await deleteWorkout(id);
      if (!res.ok) {
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

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        No finished workouts yet.
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {visible.map((w) => {
          const abandoned = w.status === "abandoned";
          return (
            <li
              key={w.id}
              className="flex items-center gap-1 hover:bg-accent"
            >
              <Link
                href={`/train/history/${w.id}`}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{w.title}</p>
                    {abandoned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                        <XCircle className="h-3 w-3" />
                        Abandoned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] tabular-nums text-muted-foreground">
                    {formatDay(w.started_at)} ·{" "}
                    {formatDuration(w.duration_min)}
                    {w.set_count > 0 && ` · ${w.set_count} sets`}
                    {w.total_volume_lb > 0 &&
                      ` · ${formatVolume(w.total_volume_lb)} lb`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setPendingDelete(w);
                }}
                disabled={pending}
                aria-label={`Delete ${w.title} on ${formatDay(w.started_at)}`}
                className="mr-2 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>

      {actionError && (
        <p className="mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
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
            <h2 className="text-base font-semibold">Delete workout?</h2>
            {pendingDelete && (
              <p className="mt-1 text-xs text-muted-foreground">
                {pendingDelete.title} ·{" "}
                {formatDay(pendingDelete.started_at)} ·{" "}
                {formatDuration(pendingDelete.duration_min)}
                {pendingDelete.set_count > 0 &&
                  ` · ${pendingDelete.set_count} sets`}
                . Can&apos;t be undone.
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

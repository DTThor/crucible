"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Activity,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { PROTOCOLS } from "@/lib/fasting/protocols";
import { deleteFast } from "@/lib/fasting/actions";
import type { HistoricFast } from "@/lib/fasting/history";

interface FastHistoryListProps {
  fasts: HistoricFast[];
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed" || status === "extended") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        {status === "extended" ? "Extended" : "Goal"}
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
        <Activity className="h-3 w-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
      <XCircle className="h-3 w-3" />
      Ended early
    </span>
  );
}

export function FastHistoryList({ fasts }: FastHistoryListProps) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const target = pendingDeleteId
    ? fasts.find((f) => f.id === pendingDeleteId)
    : null;

  function confirmDelete() {
    if (!target) return;
    const id = target.id;
    setHiddenIds((prev) => new Set([...prev, id]));
    setPendingDeleteId(null);
    startTransition(async () => {
      const res = await deleteFast(id);
      if (!res.ok) {
        // Revert on failure
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        router.refresh();
      }
    });
  }

  const visibleFasts = fasts.filter((f) => !hiddenIds.has(f.id));

  if (visibleFasts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        No fasts yet. Start one from the Fast tab.
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {visibleFasts.map((f) => {
          const protocol =
            PROTOCOLS[f.protocol_slug as keyof typeof PROTOCOLS] ?? null;
          const isActive = f.status === "active";
          return (
            <li key={f.id} className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium tabular-nums">
                    {formatDay(f.started_at)}
                  </p>
                  <StatusBadge status={f.status} />
                </div>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {formatTime(f.started_at)}
                  {f.ended_at
                    ? ` → ${formatTime(f.ended_at)}`
                    : " · in progress"}
                  {protocol ? ` · ${protocol.name}` : ""}
                </p>
              </div>
              <p className="font-mono tabular-nums text-sm font-semibold">
                {formatDuration(f.duration_hours)}
              </p>
              <button
                type="button"
                disabled={isActive}
                onClick={() => setPendingDeleteId(f.id)}
                aria-label={isActive ? "Active fasts cannot be deleted" : "Delete fast"}
                className="-mr-1 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>

      <Modal
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        className="max-w-xs"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/15">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Delete fast?</h2>
            {target && (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDay(target.started_at)} ·{" "}
                {formatDuration(target.duration_hours)}. This can't be undone.
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setPendingDeleteId(null)}
            className="flex-1 rounded-full border border-input bg-secondary py-3 text-sm font-medium hover:bg-secondary/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="flex-1 rounded-full bg-destructive py-3 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}

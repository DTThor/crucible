"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { deleteWeightLog } from "@/lib/weight/actions";
import { kgToLb } from "@/lib/units";
import type { WeightLog } from "@/lib/weight/queries";

interface WeightHistoryModalProps {
  open: boolean;
  onClose: () => void;
  logs: WeightLog[];
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

export function WeightHistoryModal({
  open,
  onClose,
  logs,
}: WeightHistoryModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Optimistic delete tracking — same pattern as other history lists.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<WeightLog | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Newest first for the list view.
  const visible = useMemo(
    () =>
      [...logs]
        .filter((l) => !deletedIds.has(l.id))
        .sort(
          (a, b) =>
            new Date(b.logged_at).getTime() -
            new Date(a.logged_at).getTime(),
        ),
    [logs, deletedIds],
  );

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setActionError(null);
    setDeletedIds((prev) => new Set([...prev, id]));
    startTransition(async () => {
      const res = await deleteWeightLog(id);
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

  return (
    <>
      <Modal open={open} onClose={onClose} className="max-w-md">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Recent weigh-ins</h2>
          <span className="text-xs text-muted-foreground">
            {visible.length} log{visible.length === 1 ? "" : "s"}
          </span>
        </div>

        {actionError && (
          <p className="mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {actionError}
          </p>
        )}

        {visible.length === 0 ? (
          <p className="mt-3 rounded-lg border border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            No weigh-ins logged.
          </p>
        ) : (
          <ul className="mt-3 max-h-[60vh] divide-y divide-border overflow-y-auto rounded-xl border border-border">
            {visible.map((log) => {
              const lb = kgToLb(log.weight_kg);
              return (
                <li
                  key={log.id}
                  className="flex items-center gap-2 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium tabular-nums">
                      {lb.toFixed(1)} lb
                    </p>
                    <p className="text-[10px] tabular-nums text-muted-foreground">
                      {formatDay(log.logged_at)} ·{" "}
                      {formatTime(log.logged_at)}
                      {log.source !== "manual" && ` · ${log.source}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(log)}
                    disabled={pending}
                    aria-label={`Delete weigh-in ${lb.toFixed(1)} lb on ${formatDay(log.logged_at)}`}
                    className="-mr-1 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-full border border-input bg-secondary py-2.5 text-sm font-medium hover:bg-secondary/80"
        >
          Close
        </button>
      </Modal>

      {/* Confirm-delete modal layered on top */}
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
            <h2 className="text-base font-semibold">Delete weigh-in?</h2>
            {pendingDelete && (
              <p className="mt-1 text-xs text-muted-foreground">
                {kgToLb(pendingDelete.weight_kg).toFixed(1)} lb ·{" "}
                {formatDay(pendingDelete.logged_at)}.
                Can&apos;t be undone.
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

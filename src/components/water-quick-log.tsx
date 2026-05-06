"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets, X } from "lucide-react";
import {
  DEFAULT_WATER_TARGET_OZ,
  WATER_QUICK_ADDS_OZ,
  mlToOzRounded,
} from "@/lib/units";
import { logWater, deleteWaterLog } from "@/lib/water/actions";
import type { WaterLog } from "@/lib/water/queries";

interface WaterQuickLogProps {
  /** Last 7 days of water logs from the server. */
  recentLogs: WaterLog[];
  /** Daily target (oz). Defaults to DEFAULT_WATER_TARGET_OZ. */
  targetOz?: number;
}

export function WaterQuickLog({
  recentLogs,
  targetOz = DEFAULT_WATER_TARGET_OZ,
}: WaterQuickLogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Optimistic local copy of logs so taps feel instant
  const [localLogs, setLocalLogs] = useState<WaterLog[]>(recentLogs);
  useEffect(() => setLocalLogs(recentLogs), [recentLogs]);

  // Filter to "today" using browser-local calendar day
  const todayLogs = localLogs.filter((l) => isToday(l.logged_at));
  const todayMl = todayLogs.reduce((sum, l) => sum + l.ml, 0);
  const todayOz = mlToOzRounded(todayMl);
  const progress = Math.min(todayOz / targetOz, 1);

  function handleAdd(oz: number) {
    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const tempLog: WaterLog = {
      id: tempId,
      ml: Math.round(oz * 29.5735),
      logged_at: new Date().toISOString(),
    };
    setLocalLogs((prev) => [tempLog, ...prev]);
    startTransition(async () => {
      const res = await logWater(oz);
      if (!res.ok) {
        // Revert on failure
        setLocalLogs((prev) => prev.filter((l) => l.id !== tempId));
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete(logId: string) {
    if (logId.startsWith("temp-")) return; // wait for sync
    const removed = localLogs.find((l) => l.id === logId);
    setLocalLogs((prev) => prev.filter((l) => l.id !== logId));
    startTransition(async () => {
      const res = await deleteWaterLog(logId);
      if (!res.ok && removed) {
        setLocalLogs((prev) => [removed, ...prev]);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {/* Header row */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-sky-400" />
            <p className="text-sm font-semibold">Water</p>
          </div>
          <p className="font-mono tabular-nums text-sm">
            <span className="text-base font-semibold">{todayOz}</span>
            <span className="text-muted-foreground"> / {targetOz} oz</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-sky-400 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Quick-add buttons */}
        <div className="grid grid-cols-3 gap-2">
          {WATER_QUICK_ADDS_OZ.map((oz) => (
            <button
              key={oz}
              type="button"
              disabled={pending}
              onClick={() => handleAdd(oz)}
              className="rounded-lg border border-sky-500/30 bg-sky-500/5 py-2 text-sm font-semibold text-sky-300 transition-colors hover:bg-sky-500/15 disabled:opacity-50"
            >
              +{oz} oz
            </button>
          ))}
        </div>

        {/* Today's log entries */}
        {todayLogs.length > 0 && (
          <ul className="space-y-1 pt-1">
            {todayLogs.slice(0, 8).map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-md px-1 py-0.5 text-xs"
              >
                <span className="text-muted-foreground tabular-nums">
                  {formatTime(log.logged_at)}
                </span>
                <span className="font-mono tabular-nums">
                  {mlToOzRounded(log.ml)} oz
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(log.id)}
                  disabled={pending || log.id.startsWith("temp-")}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-30"
                  aria-label="Delete"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
            {todayLogs.length > 8 && (
              <li className="px-1 text-[10px] text-muted-foreground">
                + {todayLogs.length - 8} more earlier today
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

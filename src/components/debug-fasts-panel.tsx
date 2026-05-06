"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import type { RawFast } from "@/lib/fasting/debug";

interface DebugFastsPanelProps {
  fasts: RawFast[];
}

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${date} ${time}`;
}

function statusColor(status: string): string {
  if (status === "active") return "text-emerald-400";
  if (status === "completed" || status === "extended") return "text-sky-400";
  return "text-amber-400";
}

export function DebugFastsPanel({ fasts }: DebugFastsPanelProps) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium">DB state (debug)</p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-accent"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Most recent {fasts.length} fast row(s) for your user, straight from the
        database. Use this to verify what's actually persisted vs. what the UI
        thinks.
      </p>
      {fasts.length === 0 ? (
        <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
          No fast rows.
        </p>
      ) : (
        <ul className="space-y-1.5 font-mono text-[10px]">
          {fasts.map((f) => (
            <li
              key={f.id}
              className="rounded-md border border-border bg-muted/30 px-2 py-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-muted-foreground">
                  {f.id.slice(0, 8)}
                </span>
                <span className={`font-semibold ${statusColor(f.status)}`}>
                  {f.status}
                </span>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px]">
                <span className="text-muted-foreground">protocol</span>
                <span>{f.protocol_slug}</span>
                <span className="text-muted-foreground">started_at</span>
                <span>{formatTs(f.started_at)}</span>
                <span className="text-muted-foreground">ended_at</span>
                <span
                  className={
                    f.ended_at ? "" : "italic text-muted-foreground"
                  }
                >
                  {f.ended_at ? formatTs(f.ended_at) : "null"}
                </span>
                <span className="text-muted-foreground">created_at</span>
                <span>{formatTs(f.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

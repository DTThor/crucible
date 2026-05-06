"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { LogWeightModal } from "@/components/log-weight-modal";
import { logWeight } from "@/lib/weight/actions";
import { kgToLb } from "@/lib/units";
import type { WeightLog } from "@/lib/weight/queries";

interface WeightCardProps {
  /** Most-recent weight entry, or null if user has never logged. */
  latest: WeightLog | null;
  /** Closest entry to ~7 days ago, used for trend delta. */
  weekAgo: WeightLog | null;
}

export function WeightCard({ latest, weekAgo }: WeightCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const latestLb = latest ? kgToLb(latest.weight_kg) : null;
  const weekAgoLb = weekAgo ? kgToLb(weekAgo.weight_kg) : null;
  const deltaLb =
    latestLb != null && weekAgoLb != null ? latestLb - weekAgoLb : null;

  function handleSave(lb: number, loggedAtIso: string) {
    setError(null);
    startTransition(async () => {
      const res = await logWeight(lb, loggedAtIso);
      if (!res.ok) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Last weight
            </p>
            <p className="font-mono tabular-nums text-lg font-semibold leading-tight">
              {latestLb != null ? latestLb.toFixed(1) : "—"}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                lb
              </span>
            </p>
            {latest && (
              <p className="text-[10px] text-muted-foreground">
                {formatRelative(latest.logged_at)}
                {deltaLb != null && Math.abs(deltaLb) > 0.05 && (
                  <span className="ml-2 inline-flex items-center gap-0.5">
                    <DeltaIcon delta={deltaLb} />
                    <span className={deltaLb < 0 ? "text-emerald-400" : "text-amber-400"}>
                      {deltaLb > 0 ? "+" : ""}
                      {deltaLb.toFixed(1)} lb / wk
                    </span>
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
          >
            Log
          </button>
        </CardContent>
      </Card>

      <LogWeightModal
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        onSave={handleSave}
        initialLb={latestLb ?? undefined}
        pending={pending}
        error={error}
      />
    </>
  );
}

function DeltaIcon({ delta }: { delta: number }) {
  if (delta < -0.05) return <TrendingDown className="h-3 w-3 text-emerald-400" />;
  if (delta > 0.05) return <TrendingUp className="h-3 w-3 text-amber-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

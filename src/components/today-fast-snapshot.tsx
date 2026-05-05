"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentPhase } from "@/lib/fasting/phases";
import { getProtocol } from "@/lib/fasting/protocols";

interface TodayFastSnapshotProps {
  startedAt: string;
  protocolSlug: string;
}

/**
 * Compact live timer for the Today header card. Updates every second,
 * mirrors the math used in the full Fast tab so the displays agree.
 */
export function TodayFastSnapshot({
  startedAt,
  protocolSlug,
}: TodayFastSnapshotProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedHours = Math.max(
    0,
    (now - new Date(startedAt).getTime()) / 3_600_000,
  );
  const protocol = getProtocol(protocolSlug);
  const phase = getCurrentPhase(elapsedHours);
  const totalSeconds = Math.floor(elapsedHours * 3600);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  const progress = Math.min(elapsedHours / protocol.targetHours, 1);

  return (
    <Link href="/fast" className="block">
      <div className="space-y-2">
        <p className="font-mono text-3xl font-semibold tabular-nums">
          {hh}
          <span className="text-xl text-muted-foreground">:</span>
          {mm.toString().padStart(2, "0")}
          <span className="text-xl text-muted-foreground">:</span>
          {ss.toString().padStart(2, "0")}
        </p>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium" style={{ color: phase.color }}>
            {phase.name}
          </span>
          <span className="text-muted-foreground">
            {protocol.name} · {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: phase.color,
            }}
          />
        </div>
      </div>
    </Link>
  );
}

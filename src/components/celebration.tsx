"use client";

import { useMemo } from "react";
import { Trophy, Sparkles } from "lucide-react";

const CONFETTI_COLORS = [
  "#fbbf24", // amber
  "#22c55e", // green
  "#3b82f6", // blue
  "#ec4899", // pink
  "#a855f7", // purple
  "#f97316", // orange
];

interface ConfettiBurstProps {
  /** When this changes truthy, the burst plays. Each unique key replays. */
  active: boolean;
  /** Number of pieces. ~60 looks dense but stays cheap. */
  count?: number;
}

/**
 * CSS-only confetti burst. Pieces are absolute-positioned divs that
 * animate via the `confetti-fall` keyframe in globals.css.
 */
export function ConfettiBurst({ active, count = 60 }: ConfettiBurstProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotation: Math.random() * 360,
        duration: 1.6 + Math.random() * 1.4,
        size: 6 + Math.random() * 6,
      })),
    [count],
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

interface CelebrationBannerProps {
  targetHours: number;
}

export function CelebrationBanner({ targetHours }: CelebrationBannerProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-400/15 via-amber-500/20 to-orange-500/15 px-4 py-3 text-center"
      style={{ animation: "celebrate-glow 2.4s ease-in-out infinite" }}
    >
      {/* Decorative sparkles */}
      <Sparkles
        className="absolute left-3 top-2 h-3 w-3 text-amber-300/70"
        style={{ animation: "celebrate-twinkle 1.8s ease-in-out infinite" }}
      />
      <Sparkles
        className="absolute right-3 top-2 h-3 w-3 text-amber-300/70"
        style={{
          animation: "celebrate-twinkle 1.8s ease-in-out 0.6s infinite",
        }}
      />
      <Sparkles
        className="absolute left-6 bottom-2 h-2.5 w-2.5 text-amber-200/60"
        style={{
          animation: "celebrate-twinkle 2s ease-in-out 1.1s infinite",
        }}
      />
      <Sparkles
        className="absolute right-6 bottom-2 h-2.5 w-2.5 text-amber-200/60"
        style={{
          animation: "celebrate-twinkle 2s ease-in-out 0.3s infinite",
        }}
      />

      <div className="flex items-center justify-center gap-2 text-amber-300">
        <Trophy className="h-5 w-5" />
        <p className="text-base font-bold tracking-wide">Goal Reached!</p>
      </div>
      <p className="mt-0.5 text-xs text-amber-200/80">
        {targetHours}h fast complete · keep going or call it
      </p>
    </div>
  );
}

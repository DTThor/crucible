"use client";

import {
  PHASES,
  getCurrentPhase,
  getPhaseIcon,
  type Phase,
} from "@/lib/fasting/phases";
import { cn } from "@/lib/utils";

interface PhaseRingProps {
  /** Elapsed hours into the fast. Pass a fractional value for live updating. */
  elapsedHours: number;
  /** Target hours from the active protocol. Drives ring proportions. */
  targetHours: number;
  /** Optional pixel size for the SVG. Defaults to 320. */
  size?: number;
  className?: string;
}

/**
 * Concentric ring showing fast progress through Fung's physiological phases.
 *
 * Layout:
 *   - Dim track ring as the backdrop.
 *   - Brightly-colored progress arcs (one per phase, only the completed portion).
 *   - Phase boundary markers: small circles at each phase start, with the
 *     phase's lucide icon. Past phases full opacity, future phases dimmed.
 *   - Current playhead: glowing badge at the elapsed position with the
 *     current phase's icon.
 *   - Center: HH:MM:SS elapsed + remaining hours/min until target.
 */
export function PhaseRing({
  elapsedHours,
  targetHours,
  size = 320,
  className,
}: PhaseRingProps) {
  const stroke = 12;
  // Reserve outer space for icon badges so they don't clip
  const iconBadgeRadius = 18;
  const padding = iconBadgeRadius + 4;
  const radius = (size - stroke) / 2 - padding;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const elapsedClamped = Math.max(0, Math.min(elapsedHours, targetHours));
  const progressFraction = elapsedClamped / targetHours;
  const currentPhase = getCurrentPhase(elapsedHours);

  const visiblePhases = PHASES.filter((p) => p.fromHours < targetHours);

  const totalSeconds = Math.floor(elapsedHours * 3600);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;

  // Remaining hours/minutes (rounded down to whole minutes)
  const remainingHours = Math.max(0, targetHours - elapsedHours);
  const remTotalMinutes = Math.floor(remainingHours * 60);
  const remH = Math.floor(remTotalMinutes / 60);
  const remM = remTotalMinutes % 60;

  function angleAt(hours: number): number {
    return (hours / targetHours) * 2 * Math.PI - Math.PI / 2;
  }
  function pointAt(hours: number, r = radius): [number, number] {
    const a = angleAt(hours);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  const [phx, phy] = pointAt(elapsedClamped);
  const PlayheadIcon = getPhaseIcon(currentPhase);

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        {/* Background dim track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeOpacity={0.45}
          strokeWidth={stroke}
        />

        {/* Progress arcs — one per phase, only the completed portion */}
        {visiblePhases.map((phase) => {
          const completedTo = Math.min(elapsedClamped, phase.toHours);
          if (completedTo <= phase.fromHours) return null;
          return (
            <PhaseArc
              key={`fg-${phase.slug}`}
              phase={phase}
              fromHours={phase.fromHours}
              toHours={completedTo}
              targetHours={targetHours}
              cx={cx}
              cy={cy}
              radius={radius}
              stroke={stroke}
              circumference={circumference}
            />
          );
        })}
      </svg>

      {/* Phase boundary icon badges (HTML for crisp icons + easy positioning) */}
      {visiblePhases.map((phase) => {
        // Don't render a marker at 0h (start) — playhead lives there at first
        if (phase.fromHours === 0) return null;
        const [px, py] = pointAt(phase.fromHours);
        const Icon = getPhaseIcon(phase);
        const reached = elapsedClamped >= phase.fromHours;
        return (
          <div
            key={`marker-${phase.slug}`}
            className="pointer-events-none absolute flex items-center justify-center rounded-full bg-background transition-opacity"
            style={{
              left: px - iconBadgeRadius,
              top: py - iconBadgeRadius,
              width: iconBadgeRadius * 2,
              height: iconBadgeRadius * 2,
              border: `1.5px solid ${phase.color}`,
              opacity: reached ? 1 : 0.45,
            }}
          >
            <Icon
              size={16}
              strokeWidth={2}
              style={{ color: phase.color }}
            />
          </div>
        );
      })}

      {/* Glowing playhead with current phase icon */}
      <div
        className="pointer-events-none absolute flex items-center justify-center rounded-full"
        style={{
          left: phx - 18,
          top: phy - 18,
          width: 36,
          height: 36,
          backgroundColor: currentPhase.color,
          boxShadow: `0 0 18px 0 ${currentPhase.color}`,
        }}
      >
        <PlayheadIcon size={18} strokeWidth={2.5} color="white" />
      </div>

      {/* Center text */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Fasting for
        </p>
        <p className="font-semibold tabular-nums tracking-tight leading-none text-[44px]">
          {hh}h {mm.toString().padStart(2, "0")}m
        </p>
        <p className="font-mono text-sm text-muted-foreground tabular-nums">
          {ss.toString().padStart(2, "0")}s
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {progressFraction >= 1
            ? "Goal reached"
            : `Remaining ${remH}h ${remM.toString().padStart(2, "0")}m`}
        </p>
      </div>
    </div>
  );
}

interface PhaseArcProps {
  phase: Phase;
  fromHours: number;
  toHours: number;
  targetHours: number;
  cx: number;
  cy: number;
  radius: number;
  stroke: number;
  circumference: number;
}

function PhaseArc({
  phase,
  fromHours,
  toHours,
  targetHours,
  cx,
  cy,
  radius,
  stroke,
  circumference,
}: PhaseArcProps) {
  if (toHours <= fromHours) return null;
  const startFraction = fromHours / targetHours;
  const endFraction = toHours / targetHours;
  const arcLength = (endFraction - startFraction) * circumference;
  const offset = -startFraction * circumference;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill="none"
      stroke={phase.color}
      strokeWidth={stroke}
      strokeDasharray={`${arcLength} ${circumference - arcLength}`}
      strokeDashoffset={offset}
      strokeLinecap="round"
      transform={`rotate(-90 ${cx} ${cy})`}
    />
  );
}

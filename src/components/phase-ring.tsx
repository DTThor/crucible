"use client";

import { PHASES, getCurrentPhase, type Phase } from "@/lib/fasting/phases";
import { cn } from "@/lib/utils";

interface PhaseRingProps {
  /** Elapsed hours into the fast. Pass a fractional value for live updating. */
  elapsedHours: number;
  /** Target hours from the active protocol. Drives ring proportions. */
  targetHours: number;
  /** Optional pixel size for the SVG. Defaults to 280. */
  size?: number;
  className?: string;
}

/**
 * Concentric ring showing fast progress through Fung's physiological phases.
 *
 * Visual:
 *   - Faint backdrop ring split into phase color bands (proportional to target hours).
 *   - Solid progress arcs overlaid for the portion completed in each phase.
 *   - Small playhead dot at the current position.
 *   - Center display: elapsed h/m + current phase name + % to goal.
 *
 * Pure display component — parent drives elapsedHours and re-renders.
 */
export function PhaseRing({
  elapsedHours,
  targetHours,
  size = 280,
  className,
}: PhaseRingProps) {
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const elapsedClamped = Math.max(0, Math.min(elapsedHours, targetHours));
  const progressFraction = elapsedClamped / targetHours;
  const currentPhase = getCurrentPhase(elapsedHours);

  // Phases visible on this ring (those that overlap [0, targetHours]).
  const visiblePhases = PHASES.filter((p) => p.fromHours < targetHours);

  // Display: whole hours, minutes, seconds. Internal calc stays fractional.
  const totalSeconds = Math.floor(elapsedHours * 3600);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;

  // Playhead position
  const playheadAngle = progressFraction * 2 * Math.PI - Math.PI / 2;
  const playheadX = cx + radius * Math.cos(playheadAngle);
  const playheadY = cy + radius * Math.sin(playheadAngle);

  return (
    <div className={cn("relative inline-block", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        {/* Outermost track for context */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />

        {/* Backdrop phase bands (low opacity) */}
        {visiblePhases.map((phase) => (
          <PhaseArc
            key={`bg-${phase.slug}`}
            phase={phase}
            fromHours={phase.fromHours}
            toHours={Math.min(phase.toHours, targetHours)}
            targetHours={targetHours}
            cx={cx}
            cy={cy}
            radius={radius}
            stroke={stroke}
            circumference={circumference}
            opacity={0.18}
          />
        ))}

        {/* Foreground completed arcs (full opacity) */}
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
              opacity={1}
            />
          );
        })}

        {/* Playhead dot */}
        <circle
          cx={playheadX}
          cy={playheadY}
          r={8}
          fill="hsl(var(--background))"
          stroke="hsl(var(--foreground))"
          strokeWidth={2}
        />
      </svg>

      {/* Center text */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
        <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight leading-none">
          {hh}
          <span className="text-xl text-muted-foreground">:</span>
          {mm.toString().padStart(2, "0")}
          <span className="text-xl text-muted-foreground">:</span>
          {ss.toString().padStart(2, "0")}
        </p>
        <p
          className="mt-1 text-sm font-medium"
          style={{ color: currentPhase.color }}
        >
          {currentPhase.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.round(progressFraction * 100)}% to goal
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
  opacity: number;
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
  opacity,
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
      strokeOpacity={opacity}
      strokeWidth={stroke}
      strokeDasharray={`${arcLength} ${circumference - arcLength}`}
      strokeDashoffset={offset}
      strokeLinecap="butt"
      transform={`rotate(-90 ${cx} ${cy})`}
    />
  );
}

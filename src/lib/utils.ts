import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** kg → display weight in lb (UI standard for this app), 1 decimal place. */
export function kgToDisplayLb(kg: number): string {
  return (kg * 2.20462).toFixed(1);
}

/** Display weight (lb input) → kg for storage. */
export function lbToKg(lb: number): number {
  return lb / 2.20462;
}

/** ms → "Hh Mm" (e.g. "16h 04m"). */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

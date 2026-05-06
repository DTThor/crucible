"use client";

import { cn } from "@/lib/utils";

interface RpePickerProps {
  value: number | null;
  onChange: (rpe: number) => void;
  className?: string;
}

const ANCHORS: Record<number, string> = {
  6: "easy",
  7: "moderate",
  8: "hard",
  9: "near max",
  10: "max effort",
};

/** Returns a color for the RPE button at this value. */
function colorForRpe(value: number): string {
  if (value <= 6) return "hsl(160 50% 45%)"; // easy — green
  if (value <= 8) return "hsl(43 96% 60%)"; // working — amber
  if (value === 9) return "hsl(24 94% 62%)"; // hard — orange
  return "hsl(0 92% 68%)"; // max — red
}

export function RpePicker({ value, onChange, className }: RpePickerProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          RPE (effort)
        </p>
        {value != null && ANCHORS[value] && (
          <p className="text-xs italic text-muted-foreground">
            {ANCHORS[value]}
          </p>
        )}
      </div>
      <div className="grid grid-cols-10 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const isSelected = value === n;
          const color = colorForRpe(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="h-9 rounded-md border text-xs font-mono font-semibold tabular-nums transition-all"
              style={{
                borderColor: isSelected ? color : "hsl(var(--border))",
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${color} 25%, transparent)`
                  : "transparent",
                color: isSelected ? color : "hsl(var(--muted-foreground))",
              }}
              aria-label={`RPE ${n}${ANCHORS[n] ? ` — ${ANCHORS[n]}` : ""}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

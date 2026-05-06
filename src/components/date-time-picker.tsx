"use client";

import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

interface DateTimePickerProps {
  /** Current date (without time component). */
  date: Date;
  /** Hour 0-23. */
  hour: number;
  /** Minute 0-59. */
  minute: number;
  onChange: (next: { date: Date; hour: number; minute: number }) => void;
  /** Disallow stepping past today. */
  forbidFuture?: boolean;
  /** Compact variant trims spacing for embedded use in other modals. */
  compact?: boolean;
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

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DateTimePicker({
  date,
  hour,
  minute,
  onChange,
  forbidFuture,
  compact,
}: DateTimePickerProps) {
  const todayMs = dateOnly(new Date()).getTime();
  const canStepForward = forbidFuture ? date.getTime() < todayMs : true;

  function shiftDay(delta: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    if (forbidFuture && dateOnly(next).getTime() > todayMs) return;
    onChange({ date: next, hour, minute });
  }

  function shiftHour(delta: number) {
    onChange({ date, hour: (hour + delta + 24) % 24, minute });
  }

  function shiftMinute(delta: number) {
    onChange({ date, hour, minute: (minute + delta + 60) % 60 });
  }

  const dayLabel = `${WEEKDAY_SHORT[date.getDay()]}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
  const gap = compact ? "gap-3" : "gap-4";
  const numberSize = compact ? "text-2xl" : "text-4xl";
  const arrowSize = compact ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      {/* Date row */}
      <div className={`flex items-center justify-center ${gap}`}>
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="rounded-full p-1.5 text-primary hover:bg-primary/10"
          aria-label="Previous day"
        >
          <ChevronLeft className={arrowSize} />
        </button>
        <span className="min-w-[110px] text-center text-sm font-medium">
          {dayLabel}
        </span>
        <button
          type="button"
          onClick={() => shiftDay(1)}
          disabled={!canStepForward}
          className="rounded-full p-1.5 text-primary hover:bg-primary/10 disabled:opacity-30"
          aria-label="Next day"
        >
          <ChevronRight className={arrowSize} />
        </button>
      </div>

      {/* Time spinners */}
      <div className={`flex items-center justify-center ${gap}`}>
        <Spinner
          value={hour.toString().padStart(2, "0")}
          onUp={() => shiftHour(1)}
          onDown={() => shiftHour(-1)}
          numberClass={numberSize}
          arrowClass={arrowSize}
        />
        <span className={`${numberSize} font-semibold text-muted-foreground`}>
          :
        </span>
        <Spinner
          value={minute.toString().padStart(2, "0")}
          onUp={() => shiftMinute(1)}
          onDown={() => shiftMinute(-1)}
          numberClass={numberSize}
          arrowClass={arrowSize}
        />
      </div>
    </div>
  );
}

interface SpinnerProps {
  value: string;
  onUp: () => void;
  onDown: () => void;
  numberClass: string;
  arrowClass: string;
}

function Spinner({ value, onUp, onDown, numberClass, arrowClass }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onUp}
        className="rounded-full p-0.5 text-primary hover:bg-primary/10"
        aria-label="Increase"
      >
        <ChevronUp className={arrowClass} />
      </button>
      <span className={`font-mono ${numberClass} font-semibold tabular-nums`}>
        {value}
      </span>
      <button
        type="button"
        onClick={onDown}
        className="rounded-full p-0.5 text-primary hover:bg-primary/10"
        aria-label="Decrease"
      >
        <ChevronDown className={arrowClass} />
      </button>
    </div>
  );
}

/** Helper to combine a date + hour + minute into a Date in local time. */
export function combineDateTime(date: Date, hour: number, minute: number): Date {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Modal } from "@/components/modal";

interface EditStartTimeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (newStartIso: string) => void;
  initialIso: string;
  pending?: boolean;
  error?: string | null;
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

export function EditStartTimeModal({
  open,
  onClose,
  onSave,
  initialIso,
  pending,
  error,
}: EditStartTimeModalProps) {
  const [day, setDay] = useState(() => dateOnly(new Date(initialIso)));
  const [hour, setHour] = useState(() => new Date(initialIso).getHours());
  const [minute, setMinute] = useState(() => new Date(initialIso).getMinutes());

  useEffect(() => {
    if (!open) return;
    const d = new Date(initialIso);
    setDay(dateOnly(d));
    setHour(d.getHours());
    setMinute(d.getMinutes());
  }, [open, initialIso]);

  function shiftDay(delta: number) {
    const next = new Date(day);
    next.setDate(next.getDate() + delta);
    // Don't allow future dates
    if (dateOnly(next).getTime() > dateOnly(new Date()).getTime()) return;
    setDay(next);
  }

  function shiftHour(delta: number) {
    setHour((h) => (h + delta + 24) % 24);
  }

  function shiftMinute(delta: number) {
    setMinute((m) => (m + delta + 60) % 60);
  }

  function handleSave() {
    const result = new Date(day);
    result.setHours(hour, minute, 0, 0);
    if (result.getTime() > Date.now()) {
      // Bump back to "now" so we never send a future timestamp
      onSave(new Date().toISOString());
      return;
    }
    onSave(result.toISOString());
  }

  const dayLabel = `${WEEKDAY_SHORT[day.getDay()]}, ${MONTH_SHORT[day.getMonth()]} ${day.getDate()}`;
  const todayMs = dateOnly(new Date()).getTime();
  const canStepForward = day.getTime() < todayMs;

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-center text-base font-semibold">Edit Start Time</h2>

      {/* Date row */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="rounded-full p-2 text-primary hover:bg-primary/10"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-[120px] text-center text-base font-medium">
          {dayLabel}
        </span>
        <button
          type="button"
          onClick={() => shiftDay(1)}
          disabled={!canStepForward}
          className="rounded-full p-2 text-primary hover:bg-primary/10 disabled:opacity-30"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Time spinners */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <Spinner
          value={hour.toString().padStart(2, "0")}
          onUp={() => shiftHour(1)}
          onDown={() => shiftHour(-1)}
        />
        <span className="text-3xl font-semibold text-muted-foreground">:</span>
        <Spinner
          value={minute.toString().padStart(2, "0")}
          onUp={() => shiftMinute(1)}
          onDown={() => shiftMinute(-1)}
        />
      </div>

      {error && (
        <p className="mt-3 text-center text-xs text-destructive">{error}</p>
      )}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="flex-1 rounded-full border border-input bg-secondary py-3 text-sm font-medium hover:bg-secondary/80"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {pending ? "Saving…" : "Set Time"}
        </button>
      </div>
    </Modal>
  );
}

interface SpinnerProps {
  value: string;
  onUp: () => void;
  onDown: () => void;
}

function Spinner({ value, onUp, onDown }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onUp}
        className="rounded-full p-1 text-primary hover:bg-primary/10"
        aria-label="Increase"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <span className="font-mono text-4xl font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={onDown}
        className="rounded-full p-1 text-primary hover:bg-primary/10"
        aria-label="Decrease"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}

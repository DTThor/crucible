"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { DateTimePicker, combineDateTime } from "@/components/date-time-picker";

interface LogWeightModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (lb: number, loggedAtIso: string) => void;
  initialLb?: number;
  pending?: boolean;
  error?: string | null;
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function LogWeightModal({
  open,
  onClose,
  onSave,
  initialLb,
  pending,
  error,
}: LogWeightModalProps) {
  const [value, setValue] = useState(() =>
    initialLb ? initialLb.toFixed(1) : "",
  );
  // Time picker state — defaults to "now" each time the modal opens
  const [day, setDay] = useState(() => dateOnly(new Date()));
  const [hour, setHour] = useState(() => new Date().getHours());
  const [minute, setMinute] = useState(() => new Date().getMinutes());

  useEffect(() => {
    if (open) {
      setValue(initialLb ? initialLb.toFixed(1) : "");
      const now = new Date();
      setDay(dateOnly(now));
      setHour(now.getHours());
      setMinute(now.getMinutes());
    }
  }, [open, initialLb]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lb = parseFloat(value);
    if (!Number.isFinite(lb) || lb <= 0) return;
    let when = combineDateTime(day, hour, minute);
    if (when.getTime() > Date.now()) when = new Date();
    onSave(lb, when.toISOString());
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-center text-base font-semibold">Log Weight</h2>

        {/* Weight input */}
        <div className="space-y-1">
          <label
            htmlFor="weight-input"
            className="text-xs font-medium text-muted-foreground"
          >
            Weight (lb)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="weight-input"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="1000"
              autoFocus
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="180.4"
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-2xl font-mono tabular-nums text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-sm font-medium text-muted-foreground">
              lb
            </span>
          </div>
        </div>

        {/* Time picker */}
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-center text-xs font-medium text-muted-foreground">
            Logged at
          </p>
          <DateTimePicker
            date={day}
            hour={hour}
            minute={minute}
            onChange={(next) => {
              setDay(next.date);
              setHour(next.hour);
              setMinute(next.minute);
            }}
            forbidFuture
            compact
          />
        </div>

        {error && (
          <p className="text-center text-xs text-destructive">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 rounded-full border border-input bg-secondary py-3 text-sm font-medium hover:bg-secondary/80"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !value}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

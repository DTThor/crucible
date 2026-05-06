"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { DateTimePicker, combineDateTime } from "@/components/date-time-picker";

interface EditFastTimesModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (startedAtIso: string, endedAtIso: string) => void;
  initialStartedAtIso: string;
  initialEndedAtIso: string;
  pending?: boolean;
  error?: string | null;
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function EditFastTimesModal({
  open,
  onClose,
  onSave,
  initialStartedAtIso,
  initialEndedAtIso,
  pending,
  error,
}: EditFastTimesModalProps) {
  const [startDay, setStartDay] = useState(() =>
    dateOnly(new Date(initialStartedAtIso)),
  );
  const [startHour, setStartHour] = useState(() =>
    new Date(initialStartedAtIso).getHours(),
  );
  const [startMinute, setStartMinute] = useState(() =>
    new Date(initialStartedAtIso).getMinutes(),
  );
  const [endDay, setEndDay] = useState(() =>
    dateOnly(new Date(initialEndedAtIso)),
  );
  const [endHour, setEndHour] = useState(() =>
    new Date(initialEndedAtIso).getHours(),
  );
  const [endMinute, setEndMinute] = useState(() =>
    new Date(initialEndedAtIso).getMinutes(),
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const s = new Date(initialStartedAtIso);
    const e = new Date(initialEndedAtIso);
    setStartDay(dateOnly(s));
    setStartHour(s.getHours());
    setStartMinute(s.getMinutes());
    setEndDay(dateOnly(e));
    setEndHour(e.getHours());
    setEndMinute(e.getMinutes());
    setLocalError(null);
  }, [open, initialStartedAtIso, initialEndedAtIso]);

  function handleSave() {
    const start = combineDateTime(startDay, startHour, startMinute);
    let end = combineDateTime(endDay, endHour, endMinute);

    if (end.getTime() > Date.now()) end = new Date();

    if (end.getTime() <= start.getTime()) {
      setLocalError("End time must be after start.");
      return;
    }

    setLocalError(null);
    onSave(start.toISOString(), end.toISOString());
  }

  const displayError = localError ?? error;

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-center text-base font-semibold">Edit Times</h2>

      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
            Start
          </p>
          <DateTimePicker
            date={startDay}
            hour={startHour}
            minute={startMinute}
            onChange={({ date, hour, minute }) => {
              setStartDay(date);
              setStartHour(hour);
              setStartMinute(minute);
            }}
            forbidFuture
            compact
          />
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
            End
          </p>
          <DateTimePicker
            date={endDay}
            hour={endHour}
            minute={endMinute}
            onChange={({ date, hour, minute }) => {
              setEndDay(date);
              setEndHour(hour);
              setEndMinute(minute);
            }}
            forbidFuture
            compact
          />
        </div>
      </div>

      {displayError && (
        <p className="mt-3 text-center text-xs text-destructive">
          {displayError}
        </p>
      )}

      <div className="mt-5 flex gap-2">
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
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}

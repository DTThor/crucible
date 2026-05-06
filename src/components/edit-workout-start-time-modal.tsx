"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { DateTimePicker, combineDateTime } from "@/components/date-time-picker";

interface EditWorkoutStartTimeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (newStartIso: string) => void;
  initialIso: string;
  pending?: boolean;
  error?: string | null;
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function EditWorkoutStartTimeModal({
  open,
  onClose,
  onSave,
  initialIso,
  pending,
  error,
}: EditWorkoutStartTimeModalProps) {
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

  function handleSave() {
    const result = combineDateTime(day, hour, minute);
    if (result.getTime() > Date.now()) {
      onSave(new Date().toISOString());
      return;
    }
    onSave(result.toISOString());
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-center text-base font-semibold">
        Edit Workout Start
      </h2>
      <div className="mt-4">
        <DateTimePicker
          date={day}
          hour={hour}
          minute={minute}
          onChange={({ date, hour, minute }) => {
            setDay(date);
            setHour(hour);
            setMinute(minute);
          }}
          forbidFuture
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

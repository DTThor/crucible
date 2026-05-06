"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";

interface LogWeightModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (lb: number) => void;
  initialLb?: number;
  pending?: boolean;
  error?: string | null;
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

  useEffect(() => {
    if (open) {
      setValue(initialLb ? initialLb.toFixed(1) : "");
    }
  }, [open, initialLb]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lb = parseFloat(value);
    if (!Number.isFinite(lb) || lb <= 0) return;
    onSave(lb);
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-center text-base font-semibold">Log Weight</h2>

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

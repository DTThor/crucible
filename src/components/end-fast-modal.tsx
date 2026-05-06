"use client";

import { Modal } from "@/components/modal";

interface EndFastModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
  targetReached?: boolean;
}

export function EndFastModal({
  open,
  onClose,
  onConfirm,
  pending,
  targetReached,
}: EndFastModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-xs">
      <h2 className="text-lg font-semibold">End Fast</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {targetReached
          ? "You've reached your target. End the fast now?"
          : "Are you sure you want to end your fast?"}
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="flex-1 rounded-full border border-input bg-secondary py-3 text-sm font-medium hover:bg-secondary/80"
        >
          Keep Going
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="flex-1 rounded-full bg-secondary py-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
        >
          {pending ? "Ending…" : "End Fast"}
        </button>
      </div>
    </Modal>
  );
}

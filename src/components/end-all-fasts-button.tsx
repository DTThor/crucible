"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { endAllActiveFasts, deleteAllFasts } from "@/lib/fasting/actions";

export function EndAllFastsButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await endAllActiveFasts();
      setConfirming(false);
      if (!res.ok) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="w-full rounded-2xl border border-amber-500/50 bg-card py-3 text-sm font-medium text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
      >
        {pending
          ? "Ending…"
          : confirming
            ? "Tap again to end ALL active fasts"
            : "End all active fasts"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function DeleteAllFastsButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteAllFasts();
      setConfirming(false);
      if (!res.ok) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="w-full rounded-2xl border border-destructive/50 bg-card py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
      >
        {pending
          ? "Deleting…"
          : confirming
            ? "Tap again to DELETE ALL fasts"
            : "Delete all fasts (reset)"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

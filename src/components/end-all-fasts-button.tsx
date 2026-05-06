"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { endAllActiveFasts } from "@/lib/fasting/actions";

export function EndAllFastsButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000);
      return;
    }
    startTransition(async () => {
      await endAllActiveFasts();
      setConfirming(false);
      router.refresh();
    });
  }

  return (
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
          : "End all active fasts (cleanup)"}
    </button>
  );
}

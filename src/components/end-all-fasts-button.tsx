"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { endAllActiveFasts, deleteAllFasts } from "@/lib/fasting/actions";

type Result =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function EndAllFastsButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000);
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await endAllActiveFasts();
      setConfirming(false);
      if (!res.ok) {
        setResult({ kind: "error", message: res.error });
      } else {
        setResult({
          kind: "success",
          message:
            res.count === 0
              ? "No active fasts to end."
              : `Ended ${res.count} active fast${res.count === 1 ? "" : "s"}.`,
        });
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
      {result && (
        <p
          className={`rounded-md border px-3 py-2 text-xs ${
            result.kind === "error"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}

export function DeleteAllFastsButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000);
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await deleteAllFasts();
      setConfirming(false);
      if (!res.ok) {
        setResult({ kind: "error", message: res.error });
      } else {
        setResult({
          kind: "success",
          message:
            res.count === 0
              ? "No fasts to delete."
              : `Deleted ${res.count} fast${res.count === 1 ? "" : "s"}.`,
        });
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
      {result && (
        <p
          className={`rounded-md border px-3 py-2 text-xs ${
            result.kind === "error"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}

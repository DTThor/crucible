"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  endAllActiveWorkouts,
  deleteAllWorkouts,
} from "@/lib/training/actions";

type Result =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function EndAllWorkoutsButton() {
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
      const res = await endAllActiveWorkouts();
      setConfirming(false);
      if (!res.ok) {
        setResult({ kind: "error", message: res.error ?? "Failed." });
      } else {
        setResult({
          kind: "success",
          message:
            res.count === 0
              ? "No active workouts to end."
              : `Ended ${res.count} active workout${res.count === 1 ? "" : "s"}.`,
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
            ? "Tap again to end ALL active workouts"
            : "End all active workouts"}
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

export function DeleteAllWorkoutsButton() {
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
      const res = await deleteAllWorkouts();
      setConfirming(false);
      if (!res.ok) {
        setResult({ kind: "error", message: res.error ?? "Failed." });
      } else {
        setResult({
          kind: "success",
          message:
            res.count === 0
              ? "No workouts to delete."
              : `Deleted ${res.count} workout${res.count === 1 ? "" : "s"}.`,
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
            ? "Tap again to DELETE ALL workouts"
            : "Delete all workouts (reset)"}
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

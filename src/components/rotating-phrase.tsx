"use client";

import { useEffect, useState } from "react";
import { GREETING_PHRASES } from "@/lib/copy";

const STORAGE_KEY = "crucible_phrase_idx";

/**
 * Renders one of the GREETING_PHRASES, picked once per browser session
 * and held in sessionStorage so every tab in the app shows the same
 * phrase until the user closes the PWA. On first paint the phrase is
 * empty (server can't see sessionStorage); we fill it after mount.
 *
 * suppressHydrationWarning silences the unavoidable mismatch between
 * the empty SSR text and the populated client text.
 */
export function RotatingPhrase() {
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // sessionStorage unavailable (private mode etc.) — pick fresh.
    }
    let idx = raw != null ? parseInt(raw, 10) : NaN;
    if (
      !Number.isFinite(idx) ||
      idx < 0 ||
      idx >= GREETING_PHRASES.length
    ) {
      idx = Math.floor(Math.random() * GREETING_PHRASES.length);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, idx.toString());
      } catch {
        // best-effort
      }
    }
    setPhrase(GREETING_PHRASES[idx]);
  }, []);

  return <span suppressHydrationWarning>{phrase}</span>;
}

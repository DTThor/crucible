"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Tiny client component that triggers a router.refresh() on the iOS
 * Safari bfcache restore event (`pageshow` with `persisted: true`).
 *
 * Drop into any server-rendered page that holds data the user expects
 * to see updated when they back-navigate to it. Without this, iOS
 * happily restores the previous DOM snapshot — including stale stats.
 */
export function BfcacheRefresher() {
  const router = useRouter();
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) router.refresh();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);
  return null;
}

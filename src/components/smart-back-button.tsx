"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface SmartBackButtonProps {
  /** Where to go if there's no history to go back to (e.g. user
   *  opened the detail page directly via deep link or app start). */
  fallbackHref: string;
  /** Static label shown next to the chevron — e.g. "Back". Kept
   *  generic on purpose; trying to derive a contextual label from
   *  `document.referrer` is unreliable inside a PWA where most
   *  navigations are SPA transitions with no referrer header. */
  label?: string;
}

/**
 * Back button that defers to the browser history (router.back) rather
 * than hardcoding a destination. Falls back to a static href when the
 * page is the first entry in the session — that's only the case when
 * the user deep-linked to the URL.
 */
export function SmartBackButton({
  fallbackHref,
  label = "Back",
}: SmartBackButtonProps) {
  const router = useRouter();

  function handleClick() {
    // history.length includes the current entry, so > 1 means there's
    // somewhere to go back to within this tab's session.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="-ml-2 flex items-center gap-0.5 rounded-md p-1 text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-5 w-5" />
      <span className="text-sm">{label}</span>
    </button>
  );
}

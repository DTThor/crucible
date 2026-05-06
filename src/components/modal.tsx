"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Minimal centered-modal primitive. Closes on backdrop click + Escape.
 * Pure CSS, no extra deps. The modal panel is `children`.
 */
export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      {/* Panel */}
      <div
        className={cn(
          "relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl",
          className,
        )}
        // Stop click bubbling so taps inside the panel don't close
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

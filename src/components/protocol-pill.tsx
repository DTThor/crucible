"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import {
  PROTOCOL_OPTIONS,
  PROTOCOLS,
  type ProtocolSlug,
} from "@/lib/fasting/protocols";

interface ProtocolPillProps {
  selectedSlug: ProtocolSlug;
  onChange: (slug: ProtocolSlug) => void;
  disabled?: boolean;
}

export function ProtocolPill({
  selectedSlug,
  onChange,
  disabled,
}: ProtocolPillProps) {
  const [open, setOpen] = useState(false);
  const protocol = PROTOCOLS[selectedSlug];

  function handlePick(slug: ProtocolSlug) {
    onChange(slug);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-0.5 rounded-full border border-primary/40 bg-primary/5 px-6 py-2 text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
      >
        <span className="text-base font-semibold tracking-wide">
          {protocol.name.toUpperCase()}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-primary/70">
          {protocol.eatingWindowHours === 0
            ? "no eating window"
            : protocol.eatingWindowHours === 1
              ? "one meal a day"
              : `${protocol.eatingWindowHours}h eating window`}
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="text-center text-lg font-semibold">Choose protocol</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {PROTOCOL_OPTIONS.map((p) => {
            const isCurrent = p.slug === selectedSlug;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => handlePick(p.slug)}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                  isCurrent
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="font-semibold">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {p.targetHours}h target
                </span>
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}

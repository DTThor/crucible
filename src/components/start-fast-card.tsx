"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PROTOCOL_OPTIONS,
  PROTOCOLS,
  type ProtocolSlug,
} from "@/lib/fasting/protocols";
import { startFast } from "@/lib/fasting/actions";
import { Timer } from "lucide-react";

interface StartFastCardProps {
  todayProtocol: ProtocolSlug;
}

export function StartFastCard({ todayProtocol }: StartFastCardProps) {
  const [selected, setSelected] = useState<ProtocolSlug>(todayProtocol);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const protocol = PROTOCOLS[selected];
  const isPlanned = selected === todayProtocol;

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const res = await startFast(selected);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed border-muted-foreground/30">
          <Timer className="h-10 w-10 text-muted-foreground" />
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {isPlanned ? "Today's plan" : "You picked"}
          </p>
          <p className="mt-1 text-xl font-semibold">
            {protocol.name} · {protocol.targetHours}h
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {protocol.description}
          </p>
        </div>

        {showPicker && (
          <div className="grid w-full grid-cols-3 gap-2">
            {PROTOCOL_OPTIONS.map((p) => {
              const isSel = p.slug === selected;
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => {
                    setSelected(p.slug);
                    setShowPicker(false);
                  }}
                  className={`rounded-lg border px-2 py-3 text-sm font-medium transition-colors ${
                    isSel
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={pending}
        >
          {pending ? "Starting…" : "Start fast"}
        </Button>

        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="text-xs text-muted-foreground underline"
        >
          {showPicker ? "Hide options" : "Change protocol"}
        </button>
      </CardContent>
    </Card>
  );
}

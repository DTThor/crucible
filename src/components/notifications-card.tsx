"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  subscribePush,
  unsubscribePush,
  sendTestPush,
} from "@/lib/push/actions";

/**
 * URL-safe base64 → ArrayBuffer. Required by PushManager.subscribe's
 * applicationServerKey field.
 *
 * Returns ArrayBuffer (not Uint8Array) so it satisfies the strict
 * BufferSource type without the Uint8Array<ArrayBufferLike> /
 * Uint8Array<ArrayBuffer> mismatch newer TS DOM libs flag.
 */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "off"
  | "on"
  | "permission-needed";

export function NotificationsCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [testFlash, setTestFlash] = useState<string | null>(null);

  // Probe the browser's current state on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        if (sub && Notification.permission === "granted") {
          setStatus("on");
        } else if (Notification.permission === "default") {
          setStatus("permission-needed");
        } else {
          setStatus("off");
        }
      } catch (err) {
        console.error("notifications init error:", err);
        if (!cancelled) setStatus("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleEnable() {
    setError(null);
    setTestFlash(null);
    startTransition(async () => {
      try {
        // Permission must be requested from a user gesture — this
        // function is the click handler, so we're good.
        const permission = await Notification.requestPermission();
        if (permission === "denied") {
          setStatus("denied");
          return;
        }
        if (permission !== "granted") {
          setStatus("permission-needed");
          return;
        }
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          setError("Push not configured (missing VAPID key).");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(publicKey),
        });
        const json = sub.toJSON() as {
          endpoint: string;
          keys?: { p256dh?: string; auth?: string };
        };
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          setError("Push subscription was missing required keys.");
          return;
        }
        const res = await subscribePush({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          userAgent: navigator.userAgent,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setStatus("on");
      } catch (err) {
        console.error("enable push error:", err);
        setError(
          err instanceof Error ? err.message : "Couldn't enable notifications.",
        );
      }
    });
  }

  function handleDisable() {
    setError(null);
    setTestFlash(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await unsubscribePush(endpoint);
        }
        setStatus("off");
      } catch (err) {
        console.error("disable push error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Couldn't disable notifications.",
        );
      }
    });
  }

  function handleTest() {
    setError(null);
    setTestFlash(null);
    startTransition(async () => {
      const res = await sendTestPush();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTestFlash(`Sent · check your lock screen`);
      setTimeout(() => setTestFlash(null), 3500);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            {status === "on" ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Push notifications</p>
            <p className="text-xs text-muted-foreground">
              {statusBlurb(status)}
            </p>
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {testFlash && (
          <p className="flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            <Check className="h-3 w-3" />
            {testFlash}
          </p>
        )}

        {/* Action buttons depend on state */}
        {status === "loading" && (
          <p className="text-xs italic text-muted-foreground">Checking…</p>
        )}

        {status === "unsupported" && (
          <p className="text-xs text-muted-foreground">
            This browser doesn't support push. On iPhone, install Crucible to
            your Home Screen and open it from there.
          </p>
        )}

        {status === "denied" && (
          <p className="text-xs text-muted-foreground">
            You denied notifications earlier. Re-enable in iOS Settings →
            Notifications → Crucible, then come back here.
          </p>
        )}

        {(status === "off" || status === "permission-needed") && (
          <button
            type="button"
            onClick={handleEnable}
            disabled={pending}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Enabling…" : "Enable notifications"}
          </button>
        )}

        {status === "on" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={pending}
              className="flex-1 rounded-full border border-input bg-secondary py-2.5 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send test push"}
            </button>
            <button
              type="button"
              onClick={handleDisable}
              disabled={pending}
              className="rounded-full border border-destructive/50 bg-destructive/5 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Disable
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function statusBlurb(status: Status): string {
  switch (status) {
    case "loading":
      return "Checking your subscription…";
    case "unsupported":
      return "Not supported in this browser.";
    case "denied":
      return "Permission was denied.";
    case "off":
      return "Off. Enable to get fast phase + workout alerts.";
    case "permission-needed":
      return "Permission needed. Tap to allow.";
    case "on":
      return "On. You'll get phase transitions, goal alerts, and reminders.";
  }
}

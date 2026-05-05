"use client";

import { useEffect } from "react";

/**
 * Registers the service worker and auto-reloads the page when a new SW
 * version takes control. This is the bit that makes deploys land on the
 * iPhone home-screen PWA without manual cache-busting.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Force an update check on every page load — catches new deploys
        // even if iOS hasn't checked the 24h refresh timer yet.
        reg.update().catch(() => {});

        // Listen for a newly installed SW that's waiting to take control.
        reg.addEventListener("updatefound", () => {
          const incoming = reg.installing;
          if (!incoming) return;
          incoming.addEventListener("statechange", () => {
            if (
              incoming.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New SW is ready; tell it to skip waiting so it activates,
              // which fires controllerchange → reload.
              incoming.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((err) => {
        console.warn("SW registration failed:", err);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}

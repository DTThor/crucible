/**
 * Crucible service worker — minimal, hand-rolled.
 *
 * v5 strategy:
 *  - Static assets (Next chunks, fonts, icons): cache-first.
 *  - HTML navigations: passed through to the network (no SW intercept), so
 *    deploys are visible on the very next request — no waiting for the SW
 *    to update first. Sacrifices offline page support; we'll add proper
 *    offline + a queued-write store later.
 *  - API/Supabase calls: never cached.
 *
 * Bumping CACHE_VERSION evicts the old cache on activation.
 */

const CACHE_VERSION = "crucible-v7";

self.addEventListener("install", () => {
  // Activate immediately on first install — don't wait for old SW to die.
  self.skipWaiting();
});

// Lets the page tell us "you're ready, take over now."
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never touch Supabase / API / auth — always go straight to network.
  if (
    url.hostname.endsWith(".supabase.co") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/")
  ) {
    return;
  }

  // HTML navigations: don't intercept. Network is the source of truth so
  // deploys appear on the next page load.
  if (req.mode === "navigate") {
    return;
  }

  // Same-origin static assets: cache-first.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

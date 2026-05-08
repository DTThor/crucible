/**
 * Crucible service worker — minimal, hand-rolled.
 *
 * v6 strategy: only cache *truly static* assets (Next.js immutable
 * chunks, /icons, /fonts, manifest.json). Everything else goes to
 * network every time.
 *
 * Why: prior versions cached every same-origin GET that wasn't a
 * `navigate` request, which inadvertently also cached Next.js RSC
 * fetches (the `?_rsc=…` payloads issued for dynamic pages). That
 * meant after a write — e.g. deleting a workout — navigating back to
 * a tab would show a cached RSC payload from before the delete, even
 * though the underlying DB had been updated.
 *
 * Bumping CACHE_VERSION evicts the old cache on activation.
 */

const CACHE_VERSION = "crucible-v51";

// Path prefixes that are safe to cache aggressively. These are
// content-addressed (Next chunks include hashes; icons + manifest are
// versioned via the file name) so cached entries never need to be
// invalidated mid-deploy.
const CACHEABLE_PREFIXES = [
  "/_next/static/", // Next.js JS / CSS / image chunks
  "/icons/",
  "/fonts/",
];
const CACHEABLE_EXACT = ["/manifest.json"];

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

function isCacheable(url) {
  if (url.origin !== self.location.origin) return false;
  if (CACHEABLE_EXACT.includes(url.pathname)) return true;
  return CACHEABLE_PREFIXES.some((p) => url.pathname.startsWith(p));
}

// ── Web push ────────────────────────────────────────────────────────
// iOS 16.4+ supports web push for installed PWAs. The server signs
// payloads with VAPID; we render them here. Tag is used to dedupe so
// rapid-fire pushes of the same kind don't pile up.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Push payload wasn't JSON — fall through with defaults.
  }
  const title = data.title || "Crucible";
  const body = data.body || "";
  const url = data.url || "/";
  const tag = data.tag || undefined;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag,
      data: { url },
      // iOS ignores most action/vibrate options today; keep it simple.
    }),
  );
});

// Tap a notification → focus the existing PWA window if open, else
// open a fresh one. Deep-links to whatever URL the push specified.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of all) {
        // Reuse any open Crucible window. focus + navigate to the
        // deep-link URL.
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(url);
            } catch {
              // Cross-origin or navigation blocked — ignore.
            }
          }
          return;
        }
      }
      // No window open — open a fresh one.
      await self.clients.openWindow(url);
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Whitelist approach: only cacheable static assets get the SW
  // treatment. Everything else (RSC fetches, navigations, API calls,
  // Supabase, third-party) bypasses the SW entirely.
  if (!isCacheable(url)) return;

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

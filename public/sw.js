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

const CACHE_VERSION = "crucible-v48";

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

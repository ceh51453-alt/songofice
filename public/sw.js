/**
 * Service Worker (M15) — cache shell cho PWA offline.
 * Chỉ cache HTML + JS + CSS (app shell). API calls không cache.
 */
const CACHE_NAME = "asoiaf-rpg-v1";
const SHELL_URLS = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Không cache API calls hoặc các request từ extension (chrome-extension://)
  if (!url.protocol.startsWith("http") || url.pathname.startsWith("/v1/") || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache static assets
        if (response.ok && (
          url.pathname.endsWith(".js") ||
          url.pathname.endsWith(".css") ||
          url.pathname.endsWith(".woff2") ||
          url.pathname.endsWith(".png") ||
          url.pathname.endsWith(".webp") ||
          url.pathname === "/" ||
          url.pathname === "/index.html"
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — trả shell HTML
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
        return new Response("Offline", { status: 503 });
      });
    })
  );
});

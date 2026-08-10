const CACHE = "findik-universe-v3";
const CORE = ["/", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg", "/assets/character/findik-idle-front-v01.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("message", (event) => { if (event.data?.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isPublicAppRequest = url.origin === location.origin && !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/auth/") && !url.pathname.includes("/_next/data/");
  if (!isPublicAppRequest) return;
  const isNavigation = event.request.mode === "navigate";
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && response.type === "basic") caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => isNavigation ? caches.match("/") : Response.error())));
});

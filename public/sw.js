const CACHE_PREFIX = "findik-universe-";
const CACHE = `${CACHE_PREFIX}v5`;
const APP_SHELL = "/";
const PUBLIC_ASSETS = new Set([
  "/manifest.webmanifest",
  "/icons/apple-touch-icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/assets/character/findik-idle-front-v01.png",
  "/assets/stickers/findik-adventure-sticker-sheet-v01.png",
]);

const notifyClients = async (message) => {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
};

const canCache = (response) => {
  const cacheControl = response.headers.get("Cache-Control") || "";
  return response.ok
    && response.type === "basic"
    && !/private|no-store/i.test(cacheControl)
    && !response.headers.has("Set-Cookie");
};

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all([APP_SHELL, ...PUBLIC_ASSETS].map(async (url) => {
      const request = new Request(url, { cache: "reload" });
      const response = await fetch(request);
      if (canCache(response)) await cache.put(request, response);
    }));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
    await notifyClients({ type: "PWA_ACTIVATED", cache: CACHE });
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "GET_PWA_STATUS") {
    event.source?.postMessage({ type: "PWA_STATUS", cache: CACHE, waiting: Boolean(self.registration.waiting) });
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (url.pathname === APP_SHELL && canCache(response)) {
          const cache = await caches.open(CACHE);
          await cache.put(APP_SHELL, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(APP_SHELL)) || Response.error();
      }
    })());
    return;
  }

  const isPublicAsset = PUBLIC_ASSETS.has(url.pathname) || url.pathname.startsWith("/_next/static/");
  if (!isPublicAsset) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (canCache(response)) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
      await notifyClients({ type: "PWA_ASSET_CACHED", url: url.pathname });
    }
    return response;
  })());
});

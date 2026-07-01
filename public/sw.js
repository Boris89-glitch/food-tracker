// Simple app-shell service worker for offline use + home-screen install.
// Firebase Auth/Firestore traffic is intentionally NOT intercepted.
const CACHE = "ft-shell-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const staticCdn = url.hostname === "www.gstatic.com" || url.hostname === "cdn.jsdelivr.net";
  // Only handle our own assets + the two CDNs we load code from.
  // Everything else (Firebase APIs, Google auth) goes straight to network.
  if (!sameOrigin && !staticCdn) return;

  // The HTML page is network-first so app updates show immediately after a
  // deploy; fall back to cache only when offline.
  const isPage = req.mode === "navigate" ||
    (sameOrigin && (url.pathname === "/" || url.pathname.endsWith("/index.html")));
  if (isPage) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  // Other static assets (icons, manifest, CDN libs): cache-first for speed.
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
    })
  );
});

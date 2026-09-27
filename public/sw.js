/*
 * Tango service worker (docs/ARCHITECTURE.md §5).
 * - Navigations: network first, falling back to the cached app shell when offline.
 * - Same-origin assets and Google Fonts: served from cache, refreshed in the background.
 * Study data lives in localStorage / IndexedDB and is never touched here.
 */
const CACHE = 'tango-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isCacheable(url) {
  return (
    url.origin === self.location.origin ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  if (!isCacheable(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok || response.type === 'opaque') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

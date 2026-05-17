// Pay Trix Service Worker - v2 (Network-First)
const CACHE_NAME = 'paytrix-cache-v2';

// On install, skip waiting so the new SW activates immediately
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// On activate, delete ALL old caches so stale content is never served
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy: always try the network, fall back to cache only if offline
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Clone the response and cache it for offline use
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try the cache
        return caches.match(e.request);
      })
  );
});

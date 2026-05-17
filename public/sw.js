// Pay Trix Service Worker - v3 (Network-First, Live updates for HTML)
const CACHE_NAME = 'paytrix-cache-v3';

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

// Network-first strategy with cache bypass for HTML/Root to avoid stale cache bugs
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // BYPASS cache for index.html / root path so updates are instantly loaded!
  if (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Keep a backup of the latest HTML in cache for offline mode, but always prefer network!
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Standard Network-first strategy for other static assets (JS, CSS, Images, etc.)
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

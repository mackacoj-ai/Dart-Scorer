// Bump this when you change cached assets
const CACHE_NAME = 'dart-scorer-cache-v1';
const ASSETS = [
  '/',                 // only works if SW is at site root and server routes `/` -> index.html
  '/index.html',
  '/style.css',
  '/app.js',
  '/engine/state.js',
  '/engine/match.js',
  '/engine/doubles.js',
  '/engine/players.js',
  '/engine/checkout.js',
  '/data/checkout_table.js'
];

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Important: cache.addAll() rejects the whole install if ANY item 404s.
        return cache.addAll(ASSETS);
      })
      .then(() => {
        // Ensure the new SW activates immediately (dev-friendly)
        return self.skipWaiting();
      })
      .catch((err) => {
        // Log install errors to help debug missing/404 assets
        console.error('[SW] Install failed:', err);
        throw err; // keep install failing so you notice and fix paths
      })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for same-origin GET; passthrough otherwise
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests on same origin
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return; // let the network handle it
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      // Fallback to network and (optionally) add to cache
      return fetch(req).then((res) => {
        // Optionally cache successful, basic same-origin responses
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      });
    }).catch(() => {
      // Optional offline fallback: if you have /offline.html, return it for navigations
      // if (req.mode === 'navigate') return caches.match('/offline.html');
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});


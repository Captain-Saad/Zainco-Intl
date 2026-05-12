const CACHE = 'aerolearn-v3';
const STATIC = [
  '/',
  '/login',
  '/images/logo.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Purge all old caches so users get fresh assets on new deployments
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // DO NOT intercept API or backend requests — let the browser handle them natively.
  // Vercel rewrites (vercel.json) proxy /api/* and /quiz-files/* to Render.
  // Intercepting here breaks Safari/WebKit which doesn't support ReadableStream body in SW.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/quiz-files/') || url.pathname.startsWith('/images/')) {
    return;
  }

  // For non-API GET requests
  if (e.request.method !== 'GET') return;

  // Handle navigation requests (SPA routing)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // Regular asset requests: Network-first (ensures new deployments are picked up)
  // Falls back to cache only when offline
  // Regular asset requests: Network-first
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Only cache valid responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback for failed fetches that aren't in cache
          return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});


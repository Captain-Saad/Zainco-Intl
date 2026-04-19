const CACHE = 'aerolearn-v1';
const STATIC = [
  '/',
  '/login',
  '/images/logo.png',
];

// Backend API server — in production, use same origin (Vercel rewrites handle proxying)
const API_BACKEND = self.location.origin;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Proxy /api/ and /quiz-files/ requests to the backend server
  // This ensures they work in standalone PWA mode where Vite proxy isn't available
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/quiz-files/')) {
    const backendUrl = API_BACKEND + url.pathname + url.search;
    const modifiedRequest = new Request(backendUrl, {
      method: e.request.method,
      headers: e.request.headers,
      body: e.request.method !== 'GET' && e.request.method !== 'HEAD' ? e.request.body : undefined,
      mode: 'cors',
      credentials: 'same-origin',
      redirect: 'follow',
      duplex: 'half',
    });
    e.respondWith(fetch(modifiedRequest));
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

  // Regular asset requests: Cache-first
  e.respondWith(
    caches.match(e.request).then(
      (cached) => cached || fetch(e.request)
    )
  );
});

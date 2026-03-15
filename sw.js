// sw.js — Service worker for offline caching

const CACHE_NAME = 'tonight-v1';
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/store.js',
  './js/tonight.js',
  './js/library.js',
  './js/covers.js',
  './js/ui.js',
  './favicon.svg',
  './manifest.json'
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app shell, network-first for API/images
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls — network only (don't cache search results)
  if (url.hostname === 'openlibrary.org' ||
      url.hostname === 'covers.openlibrary.org' ||
      url.hostname === 'api.rawg.io' ||
      url.hostname === 'api.themoviedb.org' ||
      url.hostname === 'image.tmdb.org') {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // App shell — cache first
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});

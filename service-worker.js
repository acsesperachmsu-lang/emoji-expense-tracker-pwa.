/**
 * Service Worker for Emoji Expense Tracker PWA
 * Caches app files so the app works offline.
 */

const CACHE_NAME = 'emoji-expense-tracker-v3';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './EsnoPera_192x192.png',
  './EsnoPera_512x512.png'
];

// Install: cache all app files
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache when offline
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);
  var isSameOrigin = url.origin === self.location.origin;
  var isNavigation = event.request.mode === 'navigate';

  // For page navigations, try network first so updates land immediately.
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(function () {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // For same-origin assets (css/js/etc): stale-while-revalidate.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        var fetchPromise = fetch(event.request)
          .then(function (response) {
            if (!response || response.status !== 200) return response;
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, copy);
            });
            return response;
          })
          .catch(function () {
            return cached;
          });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: just pass through.
  event.respondWith(fetch(event.request));
});

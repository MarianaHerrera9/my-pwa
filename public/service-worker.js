const CACHE_NAME = 'pwa-app-shell-v1';
const RUNTIME = 'pwa-runtime-v1';

const PRECACHE_URLS = [
  'index.html',
  'css/styles.css',
  'js/app.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== RUNTIME)
        .map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request).then(response => { const copy = response.clone();
        caches.open(RUNTIME).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then(cached => 
        cached || fetch(request).then(response => {
          caches.open(RUNTIME).then(cache => cache.put(request, response.clone()));
          return response;
        })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => response)
      .catch(() => caches.match(request))
  );
});

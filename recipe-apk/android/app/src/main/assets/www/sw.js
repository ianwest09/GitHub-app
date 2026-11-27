// Offline cache. No CDN, no analytics, no automatic network calls.
// Optional LAN sync is initiated by the user in the UI and is never cached here.
const CACHE = 'christmas-lunch-v5';
const ASSETS = [
  './', './index.html', './styles.css', './manifest.json', './icon.svg',
  './js/data.js', './js/engine.js', './js/store.js', './js/repository.js', './js/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
      return res;
    }).catch(async () => {
      if (event.request.mode === 'navigate') {
        return (await caches.match('./index.html')) || Response.error();
      }
      return Response.error();
    }))
  );
});

const CACHE_NAME = 'xmas-lunch-v1';
const ASSETS = [
  'index.html',
  'styles.css',
  'data.js',
  'app.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'dishes/d1.jpg', 'dishes/d2.jpg', 'dishes/d3.jpg', 'dishes/d4.jpg',
  'dishes/d5.jpg', 'dishes/d6.jpg', 'dishes/d7.jpg', 'dishes/d8.jpg',
  'dishes/d9.jpg', 'dishes/d10.jpg', 'dishes/d11.jpg', 'dishes/d12.jpg',
  'dishes/d13.jpg', 'dishes/d14.jpg', 'dishes/d15.jpg', 'dishes/d16.jpg',
  'dishes/d17.jpg', 'dishes/d18.jpg',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.warn('Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(n) {
        return n !== CACHE_NAME;
      }).map(function(n) {
        return caches.delete(n);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if (response) return response;
      return fetch(e.request).then(function(resp) {
        // Cache new GET requests
        if (e.request.method === 'GET' && resp.status === 200) {
          var respClone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, respClone);
          }).catch(function() {});
        }
        return resp;
      }).catch(function() {
        // Offline fallback
        if (e.request.destination === 'document') {
          return caches.match('index.html');
        }
      });
    })
  );
});

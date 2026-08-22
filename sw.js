self.addEventListener('install', (e) => {
  console.log('Service Worker installed');
});

self.addEventListener('fetch', (e) => {
  // Required for PWA criteria
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

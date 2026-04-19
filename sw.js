const CACHE_NAME = 'visita-tortuga-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => caches.open(CACHE_NAME))
      .then(cache => cache.addAll(['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }).then(cls => cls.forEach(c => c.navigate(c.url))))
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co') || e.request.url.includes('cdn.jsdelivr.net')) return;

  if (e.request.mode === 'navigate' || e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(x => x.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request) || caches.match('/index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then(x => x.put(e.request, c)); } return r; }).catch(() => null);
      return cached || net || new Response('Offline', { status: 503 });
    })
  );
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

// ===== AGENDA POLARE — Service Worker =====
const CACHE_NAME = 'agenda-polare-v10';
const CACHE_CDN  = 'agenda-polare-cdn-v10';

// File locali: sempre in cache
const LOCAL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// CDN esterne: cache con strategia network-first, fallback cache
const CDN_URLS = [
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;500;600&display=swap',
];

// ── INSTALL: precache file locali ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(LOCAL_FILES)),
      caches.open(CACHE_CDN).then(cache =>
        Promise.allSettled(CDN_URLS.map(url =>
          fetch(url, { mode: 'cors' })
            .then(res => { if (res.ok) cache.put(url, res); })
            .catch(() => {/* CDN non raggiungibile al primo avvio */})
        ))
      ),
    ]).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: rimuovi cache vecchie ───────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CACHE_CDN)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: strategia per tipo di risorsa ─────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // Richieste Firestore / Firebase Auth → sempre network (dati real-time)
  if (url.includes('firestore.googleapis.com') ||
      url.includes('identitytoolkit.googleapis.com') ||
      url.includes('securetoken.googleapis.com') ||
      url.includes('firebase') && url.includes('/v1/')) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // File locali → Cache First (sempre aggiornati all'install)
  if (url.includes(self.location.origin)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // CDN esterne → Network First con fallback cache
  if (CDN_URLS.some(u => url.startsWith(u.split('?')[0])) ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com') ||
      url.includes('unpkg.com') ||
      url.includes('gstatic.com')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_CDN).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then(cached =>
          cached || new Response('/* offline */', {
            headers: { 'Content-Type': 'application/javascript' }
          })
        ))
    );
    return;
  }

  // Tutto il resto → Network con fallback cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

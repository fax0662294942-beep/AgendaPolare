// Agenda Polare SW v15.3 — stabile
const CACHE     = 'agenda-polare-v15.3';
const CACHE_CDN = 'agenda-polare-cdn-v15.3';
const LOCAL = ['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
const CDN = [
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE).then(c => c.addAll(LOCAL)),
      caches.open(CACHE_CDN).then(c =>
        Promise.allSettled(CDN.map(u =>
          fetch(u,{mode:'cors'}).then(r => { if(r.ok) c.put(u,r); }).catch(()=>{})
        ))
      )
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== CACHE_CDN).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = e.request.url;
  if (u.includes('firestore.googleapis.com') || u.includes('identitytoolkit') || u.includes('securetoken')) {
    e.respondWith(fetch(e.request).catch(() => new Response('',{status:503}))); return;
  }
  if (u.includes(self.location.origin)) {
    e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(r => {
      if (r.ok) { const cl=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cl)); }
      return r;
    }))); return;
  }
  if (u.includes('unpkg.com') || u.includes('gstatic.com') || u.includes('fonts.google')) {
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) { const cl=r.clone(); caches.open(CACHE_CDN).then(c=>c.put(e.request,cl)); }
      return r;
    }).catch(() => caches.match(e.request))); return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

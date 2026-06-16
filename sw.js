const CACHE_NAME = 'agenda-polare-v15.2';
const CACHE_CDN  = 'agenda-polare-cdn-v15.2';
const LOCAL_FILES = ['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
const CDN_URLS = [
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

// Risponde a SKIP_WAITING: forza attivazione immediata
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(c => c.addAll(LOCAL_FILES)),
      caches.open(CACHE_CDN).then(c =>
        Promise.allSettled(CDN_URLS.map(url =>
          fetch(url,{mode:'cors'}).then(r=>{ if(r.ok) c.put(url,r); }).catch(()=>{})
        ))
      ),
    ]).then(() => self.skipWaiting()) // skipWaiting anche qui: non aspettare
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== CACHE_CDN)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // prendi controllo di tutti i client subito
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('identitytoolkit') || url.includes('securetoken')) {
    e.respondWith(fetch(e.request).catch(() => new Response('',{status:503}))); return;
  }
  if (url.includes(self.location.origin)) {
    e.respondWith(
      caches.match(e.request).then(c => c || fetch(e.request).then(r => {
        if (r.ok) { const cl=r.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request,cl)); }
        return r;
      }))
    ); return;
  }
  if (url.includes('unpkg.com') || url.includes('gstatic.com') || url.includes('fonts.google')) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) { const cl=r.clone(); caches.open(CACHE_CDN).then(c=>c.put(e.request,cl)); }
        return r;
      }).catch(() => caches.match(e.request).then(c => c || new Response('',{status:503})))
    ); return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

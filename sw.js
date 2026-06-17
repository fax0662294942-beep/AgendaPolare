const CACHE='agenda-polare-v15.6';
const CDN='agenda-polare-cdn-v15.6';
const LOCAL=['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
const CDN_URLS=[
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js',
];
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('install',e=>{
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c=>c.addAll(LOCAL)),
    caches.open(CDN).then(c=>Promise.allSettled(CDN_URLS.map(u=>fetch(u,{mode:'cors'}).then(r=>{if(r.ok)c.put(u,r);}).catch(()=>{}))))
  ]).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==CDN).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=e.request.url;
  if(u.includes('firestore.googleapis.com')||u.includes('identitytoolkit')||u.includes('securetoken')){
    e.respondWith(fetch(e.request).catch(()=>new Response('',{status:503})));return;
  }
  if(u.includes(self.location.origin)){
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}return r;})));return;
  }
  if(u.includes('cdnjs.cloudflare.com')||u.includes('gstatic.com')){
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(CDN).then(c=>c.put(e.request,cl));}return r;}).catch(()=>caches.match(e.request)));return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});

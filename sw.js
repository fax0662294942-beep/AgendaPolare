const CACHE='agenda-polare-v15.4';
const CDN='agenda-polare-cdn-v15.4';
const LOCAL=['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(LOCAL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==CDN).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=e.request.url;
  if(u.includes('firestore.googleapis.com')||u.includes('identitytoolkit')||u.includes('securetoken')){
    e.respondWith(fetch(e.request).catch(()=>new Response('',{status:503}))); return;
  }
  if(u.includes(self.location.origin)){
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}return r;}).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});

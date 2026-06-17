const CACHE='agenda-polare-v15.5debug';
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  // DEBUG: network-only, niente cache, così vediamo sempre i file freschi
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});

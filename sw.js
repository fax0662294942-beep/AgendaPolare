// SW di auto-distruzione: si disregistra e cancella tutto
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', async (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.navigate(c.url));
  })());
});

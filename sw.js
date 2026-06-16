// SW vuoto di emergenza - verrà sostituito
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// Service worker minimal : rend Gēmu installable (les images restent dans le cache HTTP du navigateur).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

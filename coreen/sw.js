// Service worker : met l'application en cache pour qu'elle fonctionne hors connexion.
// Changer VERSION à chaque mise à jour pour que les téléphones récupèrent les nouveaux fichiers.
const VERSION = 'haru-v21';
const REMINDER = 'haru-reminder'; // état du rappel quotidien, écrit par l'application (js/reminders.js)
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/ui.js',
  './js/store.js',
  './js/course.js',
  './js/hangul.js',
  './js/generator.js',
  './js/quiz.js',
  './js/games.js',
  './js/phrases.js',
  './js/road.js',
  './js/reminders.js',
  './js/content/roadmap.js',
  './js/lang/ko.js',
  './js/lang/ja.js',
  './js/lang/kana.js',
  './js/content/kanji.js',
  './js/content/concepts.js',
  './js/content/lexicon.js',
  './js/content/strings.js',
  './js/content/jamo.js',
  './js/content/guide.js',
  './js/content/guide.en.js',
  './js/content/guide.ja.js',
  './js/content/guide.ja.en.js',
  './js/content/guide.util.js',
  './js/content/guide.plus.js',
  './js/content/guide.adv.js',
  './js/content/guide.ja.plus.js',
  './js/content/guide.ja.adv.js',
  './js/content/awkward.js',
  './fonts/nunito-latin.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== REMINDER).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Réseau d'abord (pour recevoir les mises à jour), cache en secours hors connexion.
// « no-cache » : le navigateur revalide chaque fichier auprès du serveur au lieu de resservir
// sa copie pendant 10 minutes, ce qui mélangeait anciens et nouveaux fichiers après une mise à jour.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});

// ---------- Rappel quotidien ----------
// Le navigateur réveille ce script de temps en temps (application installée, Chrome sur Android).
// On prévient si l'heure choisie est passée, que l'objectif du jour n'est pas atteint
// et qu'aucun rappel n'a encore été envoyé aujourd'hui.
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function remind() {
  const cache = await caches.open(REMINDER);
  const res = await cache.match('./__reminder-state');
  if (!res) return;
  const s = await res.json();
  if (!s.on) return;
  const now = new Date();
  const today = dayKey(now);
  const [h, m] = String(s.at || '19:00').split(':').map(Number);
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + (m || 0)) return;
  if (s.notified === today) return;
  const xp = s.day === today ? s.xp : 0; // l'état date peut-être d'hier : rien de fait aujourd'hui
  if (xp >= s.goal) return;
  const tx = s.texts || {};
  const body = xp > 0
    ? String(tx.left || '').replace('{n}', s.goal - xp)
    : s.day !== today && s.streak > 1 ? String(tx.streak || '').replace('{n}', s.streak) : tx.start || '';
  s.notified = today;
  await cache.put('./__reminder-state', new Response(JSON.stringify(s), { headers: { 'Content-Type': 'application/json' } }));
  await self.registration.showNotification(tx.title || 'Haru', {
    body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'haru-reminder', data: { url: './#/road' },
  });
}

self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'haru-reminder') e.waitUntil(remind());
});

// Toucher la notification ouvre l'application (ou la ramène au premier plan).
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => 'focus' in c);
      return open ? open.focus() : self.clients.openWindow(e.notification.data?.url || './');
    }),
  );
});

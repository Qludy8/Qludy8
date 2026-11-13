// Service worker : met l'application en cache pour qu'elle fonctionne hors connexion.
// Changer VERSION à chaque mise à jour pour que les téléphones récupèrent les nouveaux fichiers.
const VERSION = 'haru-v28';
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
  './js/keyboard.js',
  './js/draw.js',
  './js/exam.js',
  './js/achievements.js',
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
  './js/content/guide.pron.js',
  './js/content/guide.ja.pron.js',
  './js/content/strokes.ko.js',
  './js/content/strokes.ja.js',
  './js/content/strokes.kanji.js',
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
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      // Les rappels par notification ont été retirés : on annule la vérification en arrière-plan des anciennes versions.
      .then(() => self.registration.periodicSync?.unregister('haru-reminder').catch(() => {}))
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

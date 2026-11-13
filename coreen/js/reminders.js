// Rappels quotidiens : une notification quand l'objectif du jour n'est pas encore atteint à l'heure choisie.
// Sans serveur, deux mécanismes se complètent :
//  - tant que l'application est ouverte ou en arrière-plan, une minuterie déclenche le rappel à l'heure dite ;
//  - application fermée, le navigateur réveille le service worker de temps en temps
//    (« periodic background sync » : Chrome sur Android, application installée) et celui-ci vérifie l'objectif.
// Le service worker ne peut pas lire localStorage : l'état utile lui est recopié dans un cache dédié.
import * as store from './store.js';
import { t, lang } from './course.js';

export const STATE_CACHE = 'haru-reminder';
export const STATE_KEY = './__reminder-state';
const TAG = 'haru-reminder';

const hasNotif = () => 'Notification' in window && 'serviceWorker' in navigator;
export const permission = () => (hasNotif() ? Notification.permission : 'unsupported');

/** Ce que l'appareil sait faire : notifications, vérification en arrière-plan. */
export function support() {
  return { notif: hasNotif(), background: 'serviceWorker' in navigator && 'PeriodicSyncManager' in window };
}

const minutes = (hhmm) => { const [h, m] = String(hhmm || '19:00').split(':').map(Number); return h * 60 + (m || 0); };

/** Texte du rappel selon l'avancement du jour. */
export function message() {
  const st = store.get();
  const left = Math.max(0, st.goal - store.todayXp());
  const streak = store.streak();
  const body = store.todayXp() === 0
    ? (streak > 1 ? t('remind.bodyStreak', { n: streak }) : t('remind.bodyStart'))
    : t('remind.bodyLeft', { n: left });
  return { title: t('remind.title'), body };
}

/** Recopie l'état utile au service worker (réglage, objectif, XP du jour, textes dans la langue de l'interface). */
export async function syncState(extra = {}) {
  if (!('caches' in window)) return;
  const st = store.get();
  const s = st.settings;
  try {
    const cache = await caches.open(STATE_CACHE);
    const old = await cache.match(STATE_KEY).then((r) => (r ? r.json() : {})).catch(() => ({}));
    const state = {
      notified: old.notified || '',
      ...extra,
      on: !!s.remind,
      at: s.remindAt || '19:00',
      goal: st.goal,
      xp: store.todayXp(),
      day: store.dayKey(),
      streak: store.streak(),
      lang: lang(),
      texts: { title: t('remind.title'), start: t('remind.bodyStart'), streak: t('remind.bodyStreak'), left: t('remind.bodyLeft') },
    };
    await cache.put(STATE_KEY, new Response(JSON.stringify(state), { headers: { 'Content-Type': 'application/json' } }));
  } catch { /* stockage indisponible : le rappel reste limité à l'application ouverte */ }
}

async function show() {
  const reg = await navigator.serviceWorker.ready;
  const { title, body } = message();
  await reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: TAG, renotify: true, data: { url: './#/road' } });
}

let timer = null;
let run = 0; // plusieurs appels peuvent se chevaucher (gain d'XP, réglage, retour au premier plan) : seul le dernier programme
let sentDay = '';
/** Programme le rappel du jour tant que l'application tourne, et tient l'état du service worker à jour. */
export async function schedule() {
  const mine = ++run;
  clearTimeout(timer);
  await syncState();
  if (mine !== run) return;
  const s = store.get().settings;
  if (!s.remind || permission() !== 'granted') return;
  const now = new Date();
  const wait = (minutes(s.remindAt) - (now.getHours() * 60 + now.getMinutes())) * 60000 - now.getSeconds() * 1000;
  if (wait <= 0) return; // heure passée : le service worker s'en charge s'il est réveillé
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const today = store.dayKey();
    if (sentDay === today || store.todayXp() >= store.get().goal) return;
    sentDay = today; // un seul rappel par jour
    await show().catch(() => {});
    await syncState({ notified: today });
  }, Math.min(wait, 2 ** 31 - 1));
}

/** Demande l'autorisation et, si le navigateur le permet, la vérification en arrière-plan. Renvoie l'autorisation obtenue. */
export async function enable() {
  if (!hasNotif()) return 'unsupported';
  const perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (perm !== 'granted') return perm;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.periodicSync) await reg.periodicSync.register(TAG, { minInterval: 6 * 3600 * 1000 });
  } catch { /* refusé par le navigateur (application non installée, par exemple) */ }
  await schedule();
  return perm;
}

export async function disable() {
  clearTimeout(timer);
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.periodicSync) await reg.periodicSync.unregister(TAG);
  } catch { /* rien à annuler */ }
  await syncState();
}

/** La vérification en arrière-plan est-elle réellement active sur cet appareil ? */
export async function backgroundActive() {
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!reg.periodicSync && (await reg.periodicSync.getTags()).includes(TAG);
  } catch { return false; }
}

export const test = () => show();

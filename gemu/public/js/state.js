// État du jeu côté navigateur : joueur, catalogue, collection. Les pages s'abonnent aux changements.
import { api } from './api.js';
import { RARITY_CUTS } from '/shared/config.js';

const STEAM = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/';
const WIKI = 'https://upload.wikimedia.org/wikipedia/';

export const S = {
  user: null,
  games: [],          // catalogue complet, index = n - 1
  total: 0,
  coll: new Map(),    // n → { qty, reserved, locked, first }
  wishes: new Set(),
  boosters: [],
  univers: new Map(), // univers → [n…]
};

const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const emit = (what) => listeners.forEach((fn) => fn(what));

export const game = (n) => S.games[n - 1];
export const owned = (n) => S.coll.get(n)?.qty > 0;

export function setUser(u) {
  if (!u) return;
  S.user = u;
  emit('user');
}

export async function loadCatalog() {
  const res = await fetch('/catalog.json');
  S.games = await res.json();
  S.total = S.games.length;
  S.univers = new Map();
  for (const g of S.games) {
    if (!S.univers.has(g.u)) S.univers.set(g.u, []);
    S.univers.get(g.u).push(g.n);
  }
}

export async function loadCollection() {
  if (!S.user) return;
  const { cards, wishes } = await api.get('/collection');
  S.coll = new Map(cards.map(([n, qty, reserved, locked, first]) => [n, { qty, reserved, locked: !!locked, first }]));
  S.wishes = new Set(wishes);
  emit('collection');
}

// Ajoute les cartes d'un tirage à la collection locale (sans recharger)
export function addPulled(cards) {
  const t = Date.now();
  for (const c of cards) {
    const cur = S.coll.get(c.n);
    if (cur) cur.qty = c.qty; else S.coll.set(c.n, { qty: c.qty, reserved: 0, locked: false, first: t });
    S.wishes.delete(c.n);
  }
  emit('collection');
}

// --- images : affiche officielle (Steam) ou jaquette (Wikipédia) ---
const expand = (p) => (!p ? '' : p.startsWith('w:') ? WIKI + p.slice(2) : p.startsWith('http') ? p : STEAM + p);
export function artUrl(g, big = false) {
  if (!g.i && g.wk) return wikiArt(g);
  return expand(big && g.j ? g.j : g.i);
}
export const isShot = (g) => /\/ss_/.test(g.i || '');
export function shotUrl(p, size = 'full') {
  const u = expand(p);
  return size === 'thumb' ? u.replace(/\.jpg$/, '.600x338.jpg') : u.replace(/\.jpg$/, '.1920x1080.jpg');
}

// Jeux hors Steam dont l'image n'est pas encore en cache : le navigateur la demande à Wikipédia.
const wikiCache = (() => { try { return JSON.parse(localStorage.getItem('gemu:wiki') || '{}'); } catch { return {}; } })();
const wikiPending = new Map();
function wikiArt(g) {
  if (wikiCache[g.wk]) return wikiCache[g.wk];
  if (!wikiPending.has(g.wk)) {
    wikiPending.set(g.wk, fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(g.wk.replace(/ /g, '_'))}`)
      .then((r) => r.json()).then((d) => {
        const src = d.originalimage?.source || d.thumbnail?.source;
        if (!src) return;
        wikiCache[g.wk] = src;
        try { localStorage.setItem('gemu:wiki', JSON.stringify(wikiCache)); } catch { /* plein */ }
        document.querySelectorAll(`img[data-wk="${CSS.escape(g.wk)}"]`).forEach((img) => { img.src = src; img.closest('.art')?.querySelector('.art-ph')?.remove(); });
      }).catch(() => {}));
  }
  return '';
}

// Position d'une carte dans son palier de rareté (pour la cote affichée)
export function tierBounds(r) {
  let start = 0;
  for (const [k, cut] of RARITY_CUTS) {
    const end = Math.round(cut * S.total);
    if (k === r) return [start, end];
    start = end;
  }
  return [0, S.total];
}

// Tous les boosters : boosters de base + un par collection + un par modèle d'arme.
// Les taux sont renormalisés sur les raretés réellement présentes dans le contenu,
// et le prix est calculé pour viser PACK_EV_TARGET (valeur moyenne / prix).
import { BASE_PACKS, COLLECTIONS, COLLECTION_PACK_RATES, MODEL_PACK_RATES, PACK_EV_TARGET, RARITIES, CLASS_SYM } from './config.js';
import { SKINS, MODELS } from './catalog.js';

// Multiplicateur moyen d'une carte vs sa valeur de base (usure, holo, traqueur, centrage, graines…),
// mesuré par `npm run calibrate`.
export const AVG_CARD_MULT = 0.6;

export const packFilter = (filter = {}) => (s) =>
  (!filter.classes || filter.classes.includes(s.cls)) && (!filter.models || filter.models.includes(s.m)) && (!filter.collection || s.col === filter.collection);

const CLASS_THEME = {
  pistol: ['#3b9cff', '#5ff3ff'], revolver: ['#c08a4a', '#ffd38a'], smg: ['#22d3ee', '#a3e635'], rifle: ['#4ade80', '#d9ff66'],
  dmr: ['#a78bfa', '#5ff3ff'], sniper: ['#b266ff', '#ff7ae6'], shotgun: ['#f97316', '#fde047'], lmg: ['#84cc16', '#facc15'], knife: ['#ff3d5a', '#ffb020'],
};

function finalize(p) {
  const pool = SKINS.filter(packFilter(p.filter));
  const has = RARITIES.map((_, r) => pool.some((s) => s.r === r));
  const raw = p.rates.map((x, r) => (has[r] ? x : 0));
  const sum = raw.reduce((a, b) => a + b, 0);
  const rates = raw.map((x) => Math.round((x / sum) * 100 * 1e4) / 1e4);
  const drift = 100 - rates.reduce((a, b) => a + b, 0);
  rates[rates.indexOf(Math.max(...rates))] = Math.round((rates[rates.indexOf(Math.max(...rates))] + drift) * 1e4) / 1e4;
  const meanBase = RARITIES.map((_, r) => { const l = pool.filter((s) => s.r === r); return l.length ? l.reduce((a, s) => a + s.base, 0) / l.length : 0; });
  const ev = p.cards * rates.reduce((a, x, r) => a + (x / 100) * meanBase[r], 0) * AVG_CARD_MULT;
  let price = p.free ? 0 : ev / (p.evTarget || PACK_EV_TARGET);
  price = price < 100 ? Math.round(price / 5) * 5 : price < 1000 ? Math.round(price / 10) * 10 : Math.round(price / 50) * 50;
  return { ...p, rates, price, poolSize: pool.length, estEV: Math.round(ev) };
}

export const PACKS = [
  ...BASE_PACKS.map((p) => finalize({ ...p, group: 'base' })),
  ...COLLECTIONS.map((c) => finalize({
    key: `col-${c.key}`, group: 'collection', fr: c.fr, en: c.en, tag: `Collection ${c.fr}`, tagEn: `${c.en} Collection`, filter: { collection: c.key },
    cards: 5, rates: COLLECTION_PACK_RATES, theme: c.theme, art: c.arts[0], collection: c.key, sym: c.sym,
  })),
  ...MODELS.map((m) => finalize({
    key: `model-${m.key}`, group: 'model', fr: m.name, en: m.name, tag: m.clsFr, tagEn: m.clsEn, filter: { models: [m.key] },
    cards: 5, rates: MODEL_PACK_RATES, theme: CLASS_THEME[m.cls], hero: m.key, sym: m.sym || CLASS_SYM[m.cls],
    // petite variation de prix d'un modèle à l'autre (marge 82–92 %)
    evTarget: 0.82 + (m.key.charCodeAt(0) % 11) / 100,
  })),
];
export const PACK_BY_KEY = Object.fromEntries(PACKS.map((p) => [p.key, p]));

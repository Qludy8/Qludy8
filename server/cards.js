// Tirages côté serveur : rareté, skin, float, centrage, modificateurs, carte erreur, gradation.
import { randomInt, randomBytes } from 'node:crypto';
import { RARITIES, WEAR, MODIFIERS, CENTERING, MISPRINT, GRADING, PITY, PATTERN } from '../shared/config.js';
import { SKINS } from '../shared/catalog.js';
import { packFilter } from '../shared/packs.js';
import { wearOf, centeringScore, FLOAT_DECIMALS } from '../shared/rules.js';

// Uniforme [0,1) cryptographique (53 bits)
export function rand() {
  return (randomInt(0, 2 ** 26) * 2 ** 27 + randomInt(0, 2 ** 27)) / 2 ** 53;
}
export function gauss() {
  let u = 0; while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}
const pickWeighted = (weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rand() * total;
  for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x < 0 && weights[i] > 0) return i; }
  for (let i = weights.length - 1; i >= 0; i--) if (weights[i] > 0) return i;
  return 0;
};

// Index : pool[filtre][rareté] = skins
const poolCache = new Map();
export function poolFor(filter, rarity) {
  const key = JSON.stringify(filter || {}) + ':' + rarity;
  if (!poolCache.has(key)) {
    const ok = packFilter(filter || {});
    poolCache.set(key, SKINS.filter((s) => s.r === rarity && ok(s)));
  }
  return poolCache.get(key);
}

export function rollRarity(rates, minRarity = 0) {
  const w = rates.map((r, i) => (i >= minRarity ? r : 0));
  if (w.every((x) => x === 0)) return Math.min(minRarity, rates.length - 1);
  return pickWeighted(w);
}

export function rollFloat(skin) {
  const tiers = WEAR.tiers.map((t) => ({ ...t, lo: Math.max(t.min, skin.fmin), hi: Math.min(t.max, skin.fmax) }));
  const ok = tiers.filter((t) => t.hi > t.lo);
  const t = ok[pickWeighted(ok.map((x) => x.weight))];
  const f = t.lo + rand() * (t.hi - t.lo);
  return Math.min(t.hi - 10 ** -FLOAT_DECIMALS, Math.round(f * 10 ** FLOAT_DECIMALS) / 10 ** FLOAT_DECIMALS);
}

export function rollCentering() {
  const c = () => {
    const v = 50 + gauss() * CENTERING.sigma;
    return Math.round(Math.min(CENTERING.max, Math.max(CENTERING.min, v)) * 10) / 10;
  };
  return { cx: c(), cy: c() };
}

export function newSerial() {
  return 'MG-' + randomBytes(5).toString('hex').toUpperCase();
}

/** Tire une carte complète pour une rareté et un filtre de contenu ({ classes, models, collection }). */
export function rollCard(rarity, filter) {
  let pool = poolFor(filter, rarity);
  if (!pool.length) pool = poolFor(null, rarity);
  const skin = pool[randomInt(0, pool.length)];
  const f = rollFloat(skin);
  const { cx, cy } = rollCentering();
  const tr = rand() < MODIFIERS.tracker.chance ? randomInt(0, 2500) : null;
  const foil = rarity >= MODIFIERS.foil.minRarity && rand() < MODIFIERS.foil.chance ? 1 : 0;
  let mp = null;
  if (rand() < MISPRINT.chance) {
    // la 2e moitié vient d'un skin voisin du même modèle (comme une feuille mal découpée)
    const sameModel = SKINS.filter((s) => s.m === skin.m && s.id !== skin.id);
    mp = sameModel[randomInt(0, sameModel.length)].id;
  }
  const pt = randomInt(0, PATTERN.seeds);
  return { s: skin.id, f, cx, cy, tr, foil, mp, g: null, pt };
}

/**
 * Ouvre un booster. pity = { ultra, legend } (packs consécutifs sans Ultra+ / Légendaire+).
 * Retourne { cards, pity, pityTriggered }.
 */
export function openPack(pack, pity = { ultra: 0, legend: 0 }, usePity = true) {
  const rarities = [];
  for (let i = 0; i < pack.cards; i++) rarities.push(rollRarity(pack.rates));
  let pityTriggered = null;
  if (usePity) {
    const best = Math.max(...rarities);
    const can = (r) => pack.rates.some((x, i) => i >= r && x > 0);
    if (best < 4 && pity.legend + 1 >= PITY.legendaryAfter && can(4)) {
      rarities[rarities.length - 1] = rollRarity(pack.rates, 4); pityTriggered = 4;
    } else if (best < 3 && pity.ultra + 1 >= PITY.ultraAfter && can(3)) {
      rarities[rarities.length - 1] = rollRarity(pack.rates, 3); pityTriggered = 3;
    }
  }
  const best = Math.max(...rarities);
  const next = usePity
    ? { ultra: best >= 3 ? 0 : pity.ultra + 1, legend: best >= 4 ? 0 : pity.legend + 1 }
    : pity;
  const cards = rarities.map((r) => rollCard(r, pack.filter));
  return { cards, pity: next, pityTriggered };
}

// ───── Gradation
const round05 = (x) => Math.round(x * 2) / 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function gradeCard(card) {
  const wear = wearOf(card.f).key;
  const { k, p, sigma } = GRADING.model;
  const sub = (s) => clamp(round05(10 - k * card.f ** p + gauss() * s), 1, 10);
  const centering = card.mp ? 1 : clamp(round05(centeringScore(card.cx, card.cy) + gauss() * 0.25), 1, 10);
  const subs = { centering, corners: sub(sigma[wear]), edges: sub(sigma[wear]), surface: sub(sigma[wear] * 1.1) };
  const w = GRADING.weights;
  let g = subs.centering * w.centering + subs.corners * w.corners + subs.edges * w.edges + subs.surface * w.surface;
  g = Math.min(g, Math.min(...Object.values(subs)) + 1, GRADING.maxByWear[wear]);
  g = clamp(Math.floor(g * 2) / 2, 1, 10);
  return { subs, grade: g };
}

export function gradingFee(service, declaredValue) {
  const s = GRADING.services[service];
  return s.baseFee + Math.min(GRADING.maxValueFee, Math.round(declaredValue * GRADING.valueFeeRate));
}

export { RARITIES };

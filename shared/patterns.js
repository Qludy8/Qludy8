// Graines de motif (0–999) : chaque carte en reçoit une. Pour les styles « à motif » (Fondu, Trempe, Marbrure),
// la graine change réellement le rendu et certaines graines sont rares. Le classement est fixe par modèle + style
// (comme les graines célèbres de certains jeux) : top 3 = légendaire, 15 suivantes = rare, 40 suivantes = recherchée.
import { PATTERN } from './config.js';
import { STYLES, hashStr } from './catalog.js';
import { t } from './i18n.js';

const TIER_SIZES = [3, 15, 40];
const cache = new Map();

export const seedScore = (model, style, seed) => hashStr(`${model}:${style}:${seed}`) / 4294967296;

function ranking(model, style) {
  const k = `${model}:${style}`;
  if (!cache.has(k)) {
    const list = Array.from({ length: PATTERN.seeds }, (_, s) => ({ s, u: seedScore(model, style, s) })).sort((a, b) => b.u - a.u);
    const tier = new Map();
    let i = 0;
    TIER_SIZES.forEach((n, t) => { for (let j = 0; j < n; j++, i++) tier.set(list[i].s, t + 1); });
    cache.set(k, { list, tier });
  }
  return cache.get(k);
}

// Lecture humaine d'une graine pour un skin
export function describeSeed(skin, seed) {
  if (seed == null || !STYLES[skin.st]?.patternBased) return null;
  const u = seedScore(skin.m, skin.st, seed);
  const tier = ranking(skin.m, skin.st).tier.get(seed) || 0;
  let label, value;
  if (skin.st === 'fade') { value = 80 + 20 * u ** 4; label = t('Fondu {v} %', { v: value.toFixed(1) }); }
  else if (skin.st === 'hardened') { value = 8 + 88 * u ** 3; label = t('{v} % de bleu', { v: Math.round(value) }); }
  else {
    const kind = tier === 1 ? t('Braise & Givre') : tier === 2 ? t('Nuit profonde') : tier === 3 ? t('Aurore') : t('Mélange');
    value = tier; label = kind;
  }
  return { tier, label, value, u, tierFr: tier ? PATTERN.tiers[tier].fr : null, tierEn: tier ? PATTERN.tiers[tier].en : null, mult: tier ? PATTERN.tiers[tier].mult : 1 };
}

// Fiche des graines rares pour un modèle + style
export function rareSeeds(model, style) {
  const { list } = ranking(model, style);
  const out = [];
  let i = 0;
  TIER_SIZES.forEach((n, t) => { for (let j = 0; j < n; j++, i++) out.push({ seed: list[i].s, tier: t + 1, u: list[i].u }); });
  return out;
}

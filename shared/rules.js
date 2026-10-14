// Règles pures partagées serveur + navigateur : usure, centrage, gradation, valeur d'une carte.
// Aucune dépendance, aucun aléa : tout tirage aléatoire se fait côté serveur (server/cards.js).
import { WEAR, MODIFIERS, CENTERING, MISPRINT, GRADING, RARITIES } from './config.js';

export const FLOAT_DECIMALS = 6;

export function wearOf(float) {
  const t = WEAR.tiers;
  for (const tier of t) if (float < tier.max) return tier;
  return t[t.length - 1];
}

// Lookup dans une table [[seuil, valeur], …] triée par seuil décroissant : 1re ligne dont seuil ≤ x
export function stepDown(table, x) {
  for (const [min, v] of table) if (x >= min) return v;
  return table[table.length - 1][1];
}

// cx / cy = part (en %) de la bordure à gauche / en haut. 50 = parfaitement centré.
export function centeringDeviation(cx, cy) {
  return Math.max(Math.abs(cx - 50), Math.abs(cy - 50));
}
export function centeringScore(cx, cy) {
  const dev = centeringDeviation(cx, cy);
  for (const [maxDev, score] of CENTERING.scale) if (dev <= maxDev) return score;
  return CENTERING.scale[CENTERING.scale.length - 1][1];
}
export function centeringLabel(cx, cy) {
  const l = Math.round(Math.max(cx, 100 - cx));
  const t = Math.round(Math.max(cy, 100 - cy));
  return `${Math.max(l, t)}/${100 - Math.max(l, t)}`;
}

export function isExtremeFloat(f) {
  return f < MODIFIERS.extreme.low || f > MODIFIERS.extreme.high;
}
export function extremeMult(f) {
  const [a, b] = MODIFIERS.extreme.mult;
  if (f < MODIFIERS.extreme.low) return a + (b - a) * (1 - f / MODIFIERS.extreme.low);
  if (f > MODIFIERS.extreme.high) return a + (b - a) * ((f - MODIFIERS.extreme.high) / (1 - MODIFIERS.extreme.high));
  return 1;
}

export function gradeLabel(g) {
  for (const [min, label] of GRADING.labels) if (g >= min) return label;
  return GRADING.labels[GRADING.labels.length - 1][1];
}
export function gradeMult(g) { return stepDown(GRADING.valueMult, g); }
export function popBonus(pop) {
  for (const [max, m] of GRADING.popBonus) if (pop <= max) return m;
  return 1;
}

/**
 * Valeur de référence d'une carte (en crédits) + détail des multiplicateurs.
 * card : { f, cx, cy, tr, foil, mp, g } ; skin : entrée du catalogue ; pop : population à cette note (si gradée)
 */
export function cardValue(card, skin, pop = null) {
  const parts = [];
  const push = (label, mult) => { if (mult !== 1) parts.push({ label, mult: Math.round(mult * 100) / 100 }); };
  const wear = wearOf(card.f);
  let v = skin.base;
  v *= wear.mult; push(`Usure ${wear.key}`, wear.mult);
  if (card.tr != null) { v *= MODIFIERS.tracker.mult; push('Traqueur', MODIFIERS.tracker.mult); }
  if (card.foil) { v *= MODIFIERS.foil.mult; push('Holo', MODIFIERS.foil.mult); }
  const ex = extremeMult(card.f); v *= ex; push('Float extrême', ex);
  if (card.mp) { v *= MISPRINT.valueMult; push('Carte erreur', MISPRINT.valueMult); }
  if (card.g != null) {
    const gm = gradeMult(card.g); v *= gm; push(`Grade ${card.g}`, gm);
    if (pop != null) { const pb = popBonus(pop); v *= pb; push(`Population ${pop}`, pb); }
  } else if (!card.mp) {
    const cm = stepDown(CENTERING.valueMult, centeringScore(card.cx, card.cy));
    v *= cm; push(`Centrage ${centeringLabel(card.cx, card.cy)}`, cm);
  }
  return { value: Math.max(1, Math.round(v)), parts };
}

export const rarityOf = (r) => RARITIES[r];
export const fmtFloat = (f) => f.toFixed(FLOAT_DECIMALS);
export const fmtCredits = (n) => Math.round(n).toLocaleString('fr-FR');

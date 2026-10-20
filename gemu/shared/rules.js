// Règles communes au serveur et au navigateur : cote d'une carte, jours et semaines (heure de Paris).
import { RARITY, RARITY_CUTS } from './config.js';

// Cote de référence : valeur de la rareté, plus forte pour les jeux en haut de leur palier.
export function baseValue(n, r, total) {
  let start = 0;
  for (const [k, cut] of RARITY_CUTS) {
    const end = Math.round(cut * total);
    if (k === r) {
      const pos = 1 - (n - 1 - start) / Math.max(1, end - start); // 1 = haut du palier
      return Math.max(1, Math.round(RARITY[r].value * (0.7 + 0.9 * Math.max(0, Math.min(1, pos)))));
    }
    start = end;
  }
  return RARITY[r]?.value || 1;
}

const dayFmt = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
export const dayKey = (t = Date.now()) => dayFmt.format(new Date(t));
export function weekKey(t = Date.now()) {
  const [y, m, d] = dayKey(t).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = (date.getUTCDay() + 6) % 7; // lundi = 0
  date.setUTCDate(date.getUTCDate() - dow);
  return 'S' + date.toISOString().slice(0, 10);
}
export function previousDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - 1));
  return date.toISOString().slice(0, 10);
}
// Prochain minuit (heure de Paris), à quelques minutes près selon l'heure d'été
export function msToMidnight(t = Date.now()) {
  const today = dayKey(t);
  let step = 60_000 * 15, x = t;
  while (dayKey(x) === today) x += step;
  while (step > 1000) { step /= 2; if (dayKey(x - step) !== today) x -= step; }
  return Math.max(0, x - t);
}

export const fmt = (n) => Number(n).toLocaleString('fr-FR');
export const pad4 = (n) => String(n).padStart(4, '0');

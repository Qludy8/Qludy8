// Catalogue en mémoire : les jeux (numérotés #0001 → #N du plus populaire au moins populaire) et les réserves des boosters.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BOOSTERS, GENRES, RARITIES } from '../shared/config.js';
import { matches } from '../shared/pools.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const GAMES = JSON.parse(readFileSync(join(root, 'catalog', 'games.json'), 'utf8'));
const DETAILS = JSON.parse(readFileSync(join(root, 'catalog', 'details.json'), 'utf8'));
export const TOTAL = GAMES.length;
const byNo = new Map(GAMES.map((g) => [g.n, g]));
const byId = new Map(GAMES.map((g) => [g.id, g]));

export const game = (n) => byNo.get(Number(n));
export const gameById = (id) => byId.get(id);
// numéro affiché (#0001…) → identifiant stable stocké en base, et inversement
export const idOf = (n) => byNo.get(Number(n))?.id ?? null;
export const nOf = (id) => byId.get(id)?.n ?? null;
export const details = (n) => {
  const g = game(n);
  return g ? DETAILS[g.id] || null : null;
};

// Univers (albums) : nombre de jeux par univers
export const UNIVERS = new Map();
for (const g of GAMES) UNIVERS.set(g.u, (UNIVERS.get(g.u) || 0) + 1);

// Réserve d'un booster : numéros de cartes groupés par rareté
const pools = new Map();
export function poolFor(booster, theme) {
  const key = booster.id + (theme ? `:${theme}` : '');
  if (pools.has(key)) return pools.get(key);
  const filter = theme ? { ...booster.pool, genre: theme } : booster.pool;
  const p = Object.fromEntries(RARITIES.map((r) => [r, []]));
  for (const g of GAMES) if (matches(g, filter)) p[g.r].push(g.n);
  // une rareté vide (petit booster) emprunte au catalogue entier pour ne jamais bloquer un tirage
  for (const r of RARITIES) if (!p[r].length) p[r] = GAMES.filter((g) => g.r === r).map((g) => g.n);
  pools.set(key, p);
  return p;
}

export function boosterSize(booster) {
  const filter = booster.pool;
  return GAMES.filter((g) => matches(g, filter)).length;
}

export const genreKeys = Object.keys(GENRES);
export { BOOSTERS };

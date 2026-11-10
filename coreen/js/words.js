// Liste unifiée de tous les mots du lexique (noms, lieux, verbes, expressions).
import { NOUNS, PLACES, EXTRA, THEMES } from './data/vocab.js';
import { VERBS, verbLabel } from './data/verbs.js';

const all = [
  ...NOUNS.map((x) => ({ kr: x.kr, fr: x.fr, t: x.t })),
  ...PLACES.map((x) => ({ kr: x.kr, fr: x.word, t: x.t })),
  ...VERBS.map((x) => ({ kr: x.kr, fr: verbLabel(x), t: x.t[0] })),
  ...VERBS.filter((x) => x.neg).map((x) => ({ kr: x.neg.kr, fr: 'ne pas être bon (goût)', t: x.t[0] })),
  ...EXTRA,
];

const seen = new Set();
export const WORDS = all
  .filter((x) => !seen.has(x.kr) && seen.add(x.kr))
  .map((x) => ({ id: x.kr, ...x }));

export const wordsOf = (theme) => (!theme || theme === 'all' ? WORDS : WORDS.filter((x) => x.t === theme));

export { THEMES };

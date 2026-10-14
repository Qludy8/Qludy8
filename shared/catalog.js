// Catalogue procédural DÉTERMINISTE (identique côté serveur et navigateur, aucun appel réseau).
// Uniquement des armes imaginaires : noms inventés, silhouettes originales, skins générés.
import { RARITIES, SKINS_PER_MODEL, CATALOG_QUOTA, KNIFE_QUOTA, COLLECTIONS } from './config.js';

export const MODELS = [
  { key: 'vyrex9', sym: '비',    name: 'Vyrex-9',      cls: 'pistol',   clsFr: 'Pistolet compact',        glyph: 'V9' },
  { key: 'quasar', sym: '퀘',    name: 'Quasar .50',   cls: 'pistol',   clsFr: 'Pistolet lourd',          glyph: 'Q50' },
  { key: 'orrin6', sym: '륜',    name: 'Orrin Six',    cls: 'revolver', clsFr: 'Revolver',                glyph: 'O6' },
  { key: 'zephra', sym: '제',    name: 'Zephra S4',    cls: 'smg',      clsFr: 'Pistolet-mitrailleur',    glyph: 'S4' },
  { key: 'rhoden', sym: '로',    name: 'Rhoden R7',    cls: 'rifle',    clsFr: 'Fusil d’assaut',          glyph: 'R7' },
  { key: 'taluk', sym: '탈',     name: 'Taluk A3',     cls: 'rifle',    clsFr: 'Fusil bullpup',           glyph: 'A3' },
  { key: 'lumen', sym: '루',     name: 'Lumen DM-2',   cls: 'dmr',      clsFr: 'Fusil de tireur d’élite', glyph: 'DM' },
  { key: 'longshade', sym: '롱', name: 'Longshade L9', cls: 'sniper',   clsFr: 'Fusil de précision',      glyph: 'L9' },
  { key: 'gorgon', sym: '고',    name: 'Gorgon-12',    cls: 'shotgun',  clsFr: 'Fusil à pompe',           glyph: 'G12' },
  { key: 'bastion', sym: '바',   name: 'Bastion H2',   cls: 'lmg',      clsFr: 'Mitrailleuse légère',     glyph: 'H2' },
  { key: 'nightfang', sym: '밤', name: 'Nightfang',    cls: 'knife',    clsFr: 'Lame griffe',             glyph: 'NF' },
  { key: 'marrow', sym: '골',    name: 'Marrow',       cls: 'knife',    clsFr: 'Lame-baïonnette',         glyph: 'MW' },
  { key: 'halcyon', sym: '나',   name: 'Halcyon',      cls: 'knife',    clsFr: 'Couteau balancier',       glyph: 'HC' },
  { key: 'ridgeback', sym: '등', name: 'Ridgeback',    cls: 'knife',    clsFr: 'Couteau de chasse',       glyph: 'RB' },
  { key: 'tern', sym: '갈',      name: 'Tern',         cls: 'knife',    clsFr: 'Couteau pliant',          glyph: 'TN' },
  { key: 'hookjaw', sym: '구',   name: 'Hookjaw',      cls: 'knife',    clsFr: 'Lame à crochet',          glyph: 'HJ' },
  { key: 'vespera', sym: '침',   name: 'Vespera',      cls: 'knife',    clsFr: 'Stylet',                  glyph: 'VS' },
];
export const MODEL_BY_KEY = Object.fromEntries(MODELS.map((m) => [m.key, m]));
export const COLLECTION_BY_KEY = Object.fromEntries(COLLECTIONS.map((c) => [c.key, c]));

// Styles de skin (du plus simple au plus détaillé)
export const STYLES = {
  solid:    { fr: 'Teinte',          desc: 'Recoloration unie avec nuances de matière.' },
  twotone:  { fr: 'Bicolore',        desc: 'Deux teintes séparées par une découpe nette.' },
  camo:     { fr: 'Camouflage',      desc: 'Taches ou pixels ; la graine décale le motif.' },
  geo:      { fr: 'Motif',           desc: 'Motif géométrique répété sur toute l’arme.' },
  fade:     { fr: 'Fondu',           desc: 'Dégradé de 3 couleurs ; la graine fixe le pourcentage de fondu.', patternBased: true },
  hardened: { fr: 'Trempe',          desc: 'Acier trempé : métal doré marbré de bleu. La graine fixe la part de bleu.', patternBased: true },
  marble:   { fr: 'Marbrure',        desc: 'Veines de couleurs mêlées ; certaines graines n’affichent que deux couleurs.', patternBased: true },
  damascus: { fr: 'Acier damassé',   desc: 'Strates d’acier ondulées, façon forge.' },
  art:      { fr: 'Illustration',    desc: 'Œuvre détaillée peinte sur toute l’arme, avec ornements.' },
};

export const PATTERNS = [
  'Rayures', 'Chevrons', 'Alvéoles', 'Écailles', 'Triangles', 'Pois', 'Carbone', 'Damier',
  'Hexagrammes', 'Vagues', 'Circuit', 'Éclairs', 'Tribal', 'Glitch', 'Étoiles', 'Losanges',
];
export const CAMOS = ['Forêt', 'Numérique', 'Tigré', 'Urbain', 'Éclaté'];
export const FINISHES = ['Mat', 'Brossé', 'Laqué', 'Anodisé', 'Givré', 'Céramique'];
export const ART_FR = {
  dragon: 'Dragon', filigree: 'Filigrane', koi: 'Koï', wave: 'Grande vague', city: 'Mégapole', circuit: 'Circuit',
  scorpion: 'Scorpion', dunes: 'Dunes', runes: 'Runes', sakura: 'Cerisier', crane: 'Grue', galaxy: 'Galaxie',
  planet: 'Planète', frost: 'Givre', wolf: 'Loup', tiger: 'Tigre', serpent: 'Serpent', phoenix: 'Phénix', flames: 'Flammes',
};

// Palettes par collection : plages de teinte / saturation / luminosité
const HUES = {
  dragon:  { h: [38, 48], h2: [350, 360], s: [70, 85], l: [42, 55] },
  abysses: { h: [190, 215], h2: [215, 240], s: [65, 85], l: [36, 50] },
  neon:    { h: [295, 320], h2: [170, 190], s: [85, 100], l: [50, 60] },
  desert:  { h: [28, 38], h2: [18, 28], s: [40, 60], l: [44, 58] },
  forge:   { h: [18, 30], h2: [205, 220], s: [25, 60], l: [34, 50] },
  sakura:  { h: [325, 345], h2: [340, 355], s: [60, 80], l: [62, 74] },
  cosmos:  { h: [255, 275], h2: [220, 240], s: [60, 80], l: [32, 48] },
  arctique: { h: [195, 210], h2: [200, 215], s: [35, 65], l: [70, 82] },
  jungle:  { h: [95, 135], h2: [30, 45], s: [45, 70], l: [32, 46] },
  phenix:  { h: [10, 22], h2: [40, 50], s: [85, 100], l: [48, 58] },
};

// Styles possibles par rareté (poids)
const STYLE_W = [
  { solid: 45, twotone: 25, camo: 30 },
  { camo: 35, geo: 45, twotone: 20 },
  { geo: 45, fade: 15, marble: 12, camo: 13, hardened: 10, damascus: 5 },
  { geo: 22, fade: 18, hardened: 15, marble: 15, art: 25, damascus: 5 },
  { art: 45, fade: 15, hardened: 15, marble: 15, damascus: 10 },
  { art: 70, fade: 10, hardened: 10, marble: 10 },
  { art: 85, fade: 5, hardened: 5, marble: 5 },
];
const KNIFE_STYLE_W = { geo: 15, fade: 20, hardened: 20, marble: 20, damascus: 15, art: 10 };

const NOUNS = ['Aube', 'Brume', 'Cendre', 'Éclipse', 'Faucon', 'Givre', 'Harpon', 'Jugement', 'Karma', 'Légion',
  'Mirage', 'Orage', 'Quartz', 'Requiem', 'Spectre', 'Tempête', 'Vertige', 'Wyverne', 'Zénith', 'Aurore', 'Bastion',
  'Corbeau', 'Delta', 'Écho', 'Fournaise', 'Gorgone', 'Hydre', 'Icare', 'Chacal', 'Kraken', 'Lynx', 'Météore', 'Némésis',
  'Oracle', 'Pulsar', 'Rapace', 'Sirocco', 'Titan', 'Vortex', 'Veilleur', 'Arcane', 'Bourrasque', 'Citadelle', 'Dune',
  'Émeute', 'Forge', 'Granit', 'Horizon', 'Brasier', 'Lagune', 'Mercure', 'Néon', 'Odyssée', 'Prisme', 'Rempart',
  'Sentinelle', 'Tonnerre', 'Silex', 'Comète', 'Mistral', 'Ronce', 'Obus', 'Sillage', 'Vigie', 'Cobalt'];
const QUALS = ['Carmin', 'Ambre', 'Onyx', 'Ivoire', 'Cuivré', 'Opale', 'Indigo', 'Rubis', 'Jade', 'Obsidienne',
  'Nocturne', 'Solaire', 'Lunaire', 'Arctique', 'Sauvage', 'Cendré', 'Doré', 'Argenté', 'Écarlate', 'Safran', 'Azur',
  'Corail', 'Basalte', 'Platine', 'Rouillé', 'Cyan', 'Magenta', 'Bronze', 'Ébène', 'Turquoise', 'Violet', 'Électrique',
  'Spectral', 'Brisé', 'Maudit', 'Sacré', 'Fantôme', 'Cristal', 'Abyssal', 'Volcanique', 'Stellaire', 'Silencieux',
  'Royal', 'Antique', 'Sombre', 'Radieux', 'Glacial', 'Ardent', 'Toxique', 'Céleste', 'Sylvestre', 'Impérial'];
const ART_NAMES = {
  dragon: ['Souffle du Dragon', 'Écaille d’Or', 'Dragon Céleste', 'Griffe Impériale', 'Dynaste'],
  filigree: ['Héritage', 'Ciselure', 'Relique', 'Joyau de Cour', 'Couronne'],
  koi: ['Koï Céleste', 'Bassin Lunaire', 'Carpe d’Or', 'Remous'],
  wave: ['Grande Houle', 'Marée Noire', 'Ressac', 'Tsunami'],
  city: ['Mégapole', 'Néon Nocturne', 'Skyline', 'Avenue 2099'],
  circuit: ['Code Source', 'Surcharge', 'Synapse', 'Protocole'],
  scorpion: ['Dard Royal', 'Scorpion Sable', 'Venin d’Ocre'],
  dunes: ['Mer de Dunes', 'Mirage d’Ocre', 'Sirocco Doré'],
  runes: ['Runes Anciennes', 'Sceau de Forge', 'Enclume'],
  sakura: ['Hanami', 'Pétales', 'Printemps Éternel', 'Branche Rose'],
  crane: ['Envol de Grues', 'Grue Sacrée', 'Migration'],
  galaxy: ['Voie Lactée', 'Nébuleuse', 'Supernova', 'Horizon des Événements'],
  planet: ['Anneaux', 'Orbite', 'Géante Gazeuse'],
  frost: ['Cristaux de Givre', 'Blizzard', 'Permafrost'],
  wolf: ['Loup Polaire', 'Meute', 'Hurlement'],
  tiger: ['Roi Tigre', 'Rugissement', 'Fauve Doré'],
  serpent: ['Mue', 'Serpent de Jade', 'Anaconda'],
  phoenix: ['Renaissance', 'Aile de Feu', 'Phénix Doré', 'Cendres Vives'],
  flames: ['Brasier', 'Fournaise', 'Combustion'],
};

// PRNG entier déterministe (mulberry32)
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const pickW = (rng, w) => { const e = Object.entries(w); let x = rng() * e.reduce((a, [, v]) => a + v, 0); for (const [k, v] of e) { if ((x -= v) < 0) return k; } return e[0][0]; };
const range = (rng, [a, b]) => a + rng() * (b - a);

function build() {
  const skins = [];
  for (const m of MODELS) {
    const rng = mulberry32(hashStr('mugigo:' + m.key));
    const quota = m.cls === 'knife' ? KNIFE_QUOTA : CATALOG_QUOTA;
    const rars = [];
    quota.forEach((q, r) => { for (let i = 0; i < q; i++) rars.push(r); });
    if (rars.length !== SKINS_PER_MODEL) throw new Error('quota ≠ SKINS_PER_MODEL');
    for (let i = rars.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [rars[i], rars[j]] = [rars[j], rars[i]]; }
    const used = new Set();
    for (let i = 0; i < SKINS_PER_MODEL; i++) {
      const r = rars[i];
      const col = COLLECTIONS[Math.floor(rng() * COLLECTIONS.length)];
      const st = pickW(rng, m.cls === 'knife' ? KNIFE_STYLE_W : STYLE_W[r]);
      const art = st === 'art' ? col.arts[Math.floor(rng() * col.arts.length)] : null;
      let name, tries = 0;
      do {
        name = art && tries < 20
          ? `${ART_NAMES[art][Math.floor(rng() * ART_NAMES[art].length)]}${tries > 3 ? ' ' + QUALS[Math.floor(rng() * QUALS.length)] : ''}`
          : `${NOUNS[Math.floor(rng() * NOUNS.length)]} ${QUALS[Math.floor(rng() * QUALS.length)]}`;
        tries++;
      } while (used.has(name));
      used.add(name);
      const [lo, hi] = RARITIES[r].base;
      const u = rng();
      const base = Math.round(lo + (hi - lo) * u * u);
      const fmin = rng() < 0.2 ? Math.round(rng() * 8) / 100 : 0;
      const fmax = rng() < 0.2 ? 0.5 + Math.round(rng() * 40) / 100 : 1;
      const H = HUES[col.key];
      skins.push({
        id: `${m.key}-${String(i + 1).padStart(3, '0')}`,
        m: m.key, cls: m.cls, n: name, r, base, fmin, fmax: Math.max(fmax, fmin + 0.2),
        col: col.key, st, art,
        p: Math.floor(rng() * PATTERNS.length),
        cm: Math.floor(rng() * CAMOS.length),
        f: Math.floor(rng() * FINISHES.length),
        h: Math.round(range(rng, H.h)), h2: Math.round(range(rng, H.h2)),
        s: Math.round(range(rng, H.s)), l: Math.round(range(rng, H.l)),
        v: Math.floor(rng() * 4),            // variante de palette (fondu, trempe, marbrure)
        seed: Math.floor(rng() * 1e9),
      });
    }
  }
  return skins;
}

export const SKINS = build();
export const SKIN_BY_ID = new Map(SKINS.map((s) => [s.id, s]));
export const skinTitle = (s) => `${MODEL_BY_KEY[s.m].name} | ${s.n}`;
export const skinCollection = (s) => COLLECTION_BY_KEY[s.col];

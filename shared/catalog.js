// Catalogue procédural DÉTERMINISTE (identique côté serveur et navigateur, aucun appel réseau).
// Uniquement des armes imaginaires : noms inventés, silhouettes originales.
import { RARITIES, SKINS_PER_MODEL, CATALOG_QUOTA } from './config.js';

export const MODELS = [
  { key: 'vyrex9',   name: 'Vyrex-9',       cls: 'pistol',   clsFr: 'Pistolet',            glyph: 'V9' },
  { key: 'orrin6',   name: 'Orrin Six',     cls: 'revolver', clsFr: 'Revolver',            glyph: 'O6' },
  { key: 'zephra',   name: 'Zephra S4',     cls: 'smg',      clsFr: 'Pistolet-mitrailleur', glyph: 'S4' },
  { key: 'rhoden',   name: 'Rhoden R7',     cls: 'rifle',    clsFr: 'Fusil d’assaut',      glyph: 'R7' },
  { key: 'taluk',    name: 'Taluk A3',      cls: 'rifle',    clsFr: 'Fusil bullpup',       glyph: 'A3' },
  { key: 'longshade', name: 'Longshade L9', cls: 'sniper',   clsFr: 'Fusil de précision',  glyph: 'L9' },
  { key: 'gorgon',   name: 'Gorgon-12',     cls: 'shotgun',  clsFr: 'Fusil à pompe',       glyph: 'G12' },
  { key: 'bastion',  name: 'Bastion H2',    cls: 'lmg',      clsFr: 'Mitrailleuse légère', glyph: 'H2' },
  { key: 'nightfang', name: 'Nightfang',    cls: 'blade',    clsFr: 'Lame courbe',         glyph: 'NF' },
  { key: 'marrow',   name: 'Marrow Dirk',   cls: 'blade',    clsFr: 'Dague',               glyph: 'MD' },
  { key: 'lumen',    name: 'Lumen Arc',     cls: 'energy',   clsFr: 'Fusil à énergie',     glyph: 'LA' },
  { key: 'quasar',   name: 'Quasar-0',      cls: 'energy',   clsFr: 'Pistolet à énergie',  glyph: 'Q0' },
];
export const MODEL_BY_KEY = Object.fromEntries(MODELS.map((m) => [m.key, m]));

export const PATTERNS = [
  'Uni', 'Rayures', 'Chevrons', 'Alvéoles', 'Camouflage', 'Pixels', 'Vagues', 'Flammes',
  'Circuit', 'Tigré', 'Écailles', 'Triangles', 'Pois', 'Carbone', 'Marbre', 'Éclairs',
  'Dégradé', 'Damier', 'Tribal', 'Glitch', 'Étoiles', 'Nébuleuse', 'Rouille', 'Hexagrammes',
];
export const FINISHES = ['Mat', 'Brossé', 'Laqué', 'Anodisé', 'Givré', 'Céramique'];

const NOUNS = ['Aube', 'Brume', 'Cendre', 'Dragon', 'Éclipse', 'Faucon', 'Givre', 'Harpon', 'Ivresse', 'Jugement',
  'Karma', 'Légion', 'Mirage', 'Nébuleuse', 'Orage', 'Phénix', 'Quartz', 'Requiem', 'Spectre', 'Tempête',
  'Union', 'Vertige', 'Wyvern', 'Zénith', 'Aurore', 'Bastion', 'Corbeau', 'Delta', 'Écho', 'Fournaise',
  'Gorgone', 'Hydre', 'Icare', 'Jackal', 'Kraken', 'Lynx', 'Météore', 'Nemesis', 'Oracle', 'Pulsar',
  'Rapace', 'Sirocco', 'Titan', 'Ultime', 'Vortex', 'Warden', 'Yeti', 'Zéphyr', 'Arcane', 'Bourrasque',
  'Citadelle', 'Dune', 'Émeute', 'Forge', 'Granit', 'Horizon', 'Inferno', 'Jungle', 'Klaxon', 'Lagune',
  'Mercure', 'Néon', 'Odyssée', 'Prisme', 'Rempart', 'Sentinelle', 'Tonnerre', 'Veilleur'];
const QUALS = ['Carmin', 'Cobalt', 'Ambre', 'Onyx', 'Ivoire', 'Cuivre', 'Opale', 'Indigo', 'Rubis', 'Jade',
  'Obsidienne', 'Nocturne', 'Solaire', 'Lunaire', 'Arctique', 'Sauvage', 'Cendré', 'Doré', 'Argenté', 'Écarlate',
  'Safran', 'Azur', 'Corail', 'Basalte', 'Mercure', 'Platine', 'Rouille', 'Cyan', 'Magenta', 'Citron',
  'Bronze', 'Ébène', 'Turquoise', 'Violette', 'Électrique', 'Spectral', 'Brisé', 'Maudit', 'Sacré', 'Fantôme',
  'Cristal', 'Abyssal', 'Volcanique', 'Stellaire', 'Rapide', 'Silencieux', 'Brutal', 'Royal', 'Antique', 'Futuriste',
  'Sombre', 'Radieux', 'Glacial', 'Ardent', 'Mécanique', 'Organique', 'Toxique', 'Céleste', 'Sylvestre', 'Marin'];

// PRNG entier déterministe (mulberry32) – pas de fonctions transcendantes.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function build() {
  const skins = [];
  for (const m of MODELS) {
    const rng = mulberry32(hashStr('armaris:' + m.key));
    // quotas de rareté, puis mélange (Fisher–Yates)
    const rars = [];
    CATALOG_QUOTA.forEach((q, r) => { for (let i = 0; i < q; i++) rars.push(r); });
    if (rars.length !== SKINS_PER_MODEL) throw new Error('CATALOG_QUOTA ≠ SKINS_PER_MODEL');
    for (let i = rars.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [rars[i], rars[j]] = [rars[j], rars[i]]; }
    const used = new Set();
    for (let i = 0; i < SKINS_PER_MODEL; i++) {
      let name;
      do { name = `${NOUNS[Math.floor(rng() * NOUNS.length)]} ${QUALS[Math.floor(rng() * QUALS.length)]}`; } while (used.has(name));
      used.add(name);
      const r = rars[i];
      const [lo, hi] = RARITIES[r].base;
      const u = rng();
      const base = Math.round(lo + (hi - lo) * u * u);               // distribution biaisée vers le bas
      const fmin = rng() < 0.2 ? Math.round(rng() * 8) / 100 : 0;      // certains skins ne sortent jamais « neufs »
      const fmax = rng() < 0.2 ? 0.5 + Math.round(rng() * 40) / 100 : 1;
      skins.push({
        id: `${m.key}-${String(i + 1).padStart(3, '0')}`,
        m: m.key, cls: m.cls, n: name, r, base, fmin, fmax: Math.max(fmax, fmin + 0.2),
        p: Math.floor(rng() * PATTERNS.length),
        f: Math.floor(rng() * FINISHES.length),
        h: Math.floor(rng() * 360), h2: Math.floor(rng() * 360),
        s: 45 + Math.floor(rng() * 45), l: 38 + Math.floor(rng() * 24),
        seed: Math.floor(rng() * 1e9),
      });
    }
  }
  return skins;
}

export const SKINS = build();
export const SKIN_BY_ID = new Map(SKINS.map((s) => [s.id, s]));
export const skinTitle = (s) => `${MODEL_BY_KEY[s.m].name} | ${s.n}`;

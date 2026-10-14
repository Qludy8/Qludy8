// Armaris – config de jeu : TOUS les paramètres d'équilibrage (partagé serveur + navigateur).
// Jeu 100 % fictif : aucune monnaie réelle, aucun paiement.

export const CURRENCY = { name: 'Crédits', symbol: '¢' };

export const RARITIES = [
  { id: 0, key: 'common',       fr: 'Commun',       color: '#9aa3ad', glow: '#9aa3ad', base: [4, 10] },
  { id: 1, key: 'uncommon',     fr: 'Peu commun',   color: '#4ade80', glow: '#4ade80', base: [14, 34] },
  { id: 2, key: 'rare',         fr: 'Rare',         color: '#3b9cff', glow: '#3b9cff', base: [50, 130] },
  { id: 3, key: 'ultra',        fr: 'Ultra rare',   color: '#b266ff', glow: '#b266ff', base: [220, 560] },
  { id: 4, key: 'legendary',    fr: 'Légendaire',   color: '#ffb020', glow: '#ffb020', base: [900, 2400] },
  { id: 5, key: 'mythic',       fr: 'Mythique',     color: '#ff3d5a', glow: '#ff3d5a', base: [4000, 11000] },
  { id: 6, key: 'transcendent', fr: 'Transcendant', color: '#5ff3ff', glow: '#ff7ae6', base: [22000, 60000] },
];

// Répartition du catalogue : skins par modèle d'arme et par rareté (somme = SKINS_PER_MODEL)
export const SKINS_PER_MODEL = 300;
export const CATALOG_QUOTA = [100, 78, 54, 36, 20, 9, 3];

// ───── Usure (float 0.0000 → 1.0000, 4 décimales)
export const WEAR = {
  tiers: [
    { key: 'FN', fr: 'Neuf',                 min: 0.00, max: 0.07, mult: 1.00, weight: 4 },
    { key: 'MW', fr: 'Quasi neuf',           min: 0.07, max: 0.15, mult: 0.80, weight: 9 },
    { key: 'FT', fr: 'Testé sur le terrain', min: 0.15, max: 0.38, mult: 0.60, weight: 34 },
    { key: 'WW', fr: 'Très usé',             min: 0.38, max: 0.45, mult: 0.45, weight: 9 },
    { key: 'BS', fr: 'Brisé',                min: 0.45, max: 1.00, mult: 0.30, weight: 44 },
  ],
};

export const MODIFIERS = {
  tracker: { chance: 0.08, mult: 1.4 },                 // compteur de victimes (cosmétique)
  foil:    { chance: 0.05, mult: 2.0, minRarity: 2 },   // holo, à partir de Rare
  extreme: { low: 0.001, high: 0.999, mult: [1.5, 3.0] },
};

// ───── Centrage (part de la bordure à gauche / en haut, 50 = parfait)
export const CENTERING = {
  sigma: 4.5, min: 28, max: 72,
  // écart max à 50 → note de centrage (barème type PSA : 55/45 = 10, 60/40 = 9 …)
  scale: [[5, 10], [7.5, 9.5], [10, 9], [12.5, 8.5], [15, 8], [20, 7], [25, 6], [30, 5], [99, 4]],
  // effet (léger) du centrage sur une carte NON gradée : [note de centrage ≥ n, multiplicateur]
  valueMult: [[10, 1.12], [9, 1.04], [8, 1.0], [7, 0.94], [0, 0.85]],
};

// ───── Carte erreur : deux cartes à moitié sur la même carte
export const MISPRINT = { chance: 1 / 2000, valueMult: 40 };

// ───── Cartes gradées
export const GRADING = {
  maxPerOrder: 10,
  services: {
    economy:  { fr: 'Économique', baseFee: 40,  delayMs: 24 * 3600e3 },
    standard: { fr: 'Standard',   baseFee: 120, delayMs: 4 * 3600e3 },
    express:  { fr: 'Express',    baseFee: 300, delayMs: 10 * 60e3 },
  },
  valueFeeRate: 0.02, maxValueFee: 600,
  model: { k: 9.0, p: 0.75, sigma: { FN: 0.45, MW: 0.55, FT: 0.85, WW: 0.9, BS: 0.9 } },
  weights: { centering: 0.2, corners: 0.25, edges: 0.2, surface: 0.35 },
  maxByWear: { FN: 10, MW: 10, FT: 9, WW: 7, BS: 6 },
  labels: [[10, 'Pristine'], [9.5, 'Gem Mint'], [9, 'Mint'], [8, 'NM-MT'], [7, 'NM'], [6, 'EX'], [0, 'Abîmée']],
  valueMult: [[10, 6], [9.5, 3], [9, 2], [8, 1.4], [7, 1.15], [6, 1.0], [5, 0.9], [0, 0.75]],
  popBonus: [[1, 1.30], [5, 1.15], [25, 1.05]],   // [population ≤ n, multiplicateur]
};

// ───── Boosters (taux par carte en %, indices = rareté 0..6)
// Prix calibrés avec `npm run calibrate` : EV ≈ 85–92 % du prix, revente système ≈ 50 % → pas de boucle d'argent infinie.
export const PACKS = [
  { key: 'standard',  fr: 'Caisse Standard', tag: 'Tous modèles', classes: null,
    price: 150, cards: 5, rates: [62, 25, 9.5, 3, 0.4, 0.09, 0.01], theme: ['#ff4d2e', '#ffb020'] },
  { key: 'sidearm',   fr: 'Arme de poing', tag: 'Pistolets & revolvers', classes: ['pistol', 'revolver'],
    price: 160, cards: 5, rates: [64, 24, 8.5, 2.8, 0.55, 0.13, 0.02], theme: ['#3b9cff', '#5ff3ff'] },
  { key: 'assault',   fr: 'Rafale', tag: 'SMG, fusils, pompes, LMG', classes: ['smg', 'rifle', 'shotgun', 'lmg'],
    price: 300, cards: 5, rates: [55, 27, 12, 4.5, 1.1, 0.35, 0.05], theme: ['#4ade80', '#d9ff66'] },
  { key: 'precision', fr: 'Ligne de mire', tag: 'Snipers', classes: ['sniper'],
    price: 900, cards: 5, rates: [0, 52, 30, 13, 3.8, 1, 0.2], theme: ['#b266ff', '#ff7ae6'] },
  { key: 'blades',    fr: 'Éclat d’acier', tag: 'Lames', classes: ['blade'],
    price: 1750, cards: 5, rates: [0, 0, 62, 26, 9, 2.6, 0.4], theme: ['#ff3d5a', '#ffb020'] },
  { key: 'prototype', fr: 'Prototype X', tag: 'Armes à énergie', classes: ['energy'],
    price: 1900, cards: 5, rates: [0, 35, 35, 20, 7, 2.4, 0.6], theme: ['#5ff3ff', '#ff7ae6'] },
  { key: 'free',      fr: 'Colis gratuit', tag: 'Toutes les 10 minutes', classes: null, free: true,
    price: 0, cards: 3, rates: [80, 16, 3.6, 0.4, 0, 0, 0], theme: ['#9aa3ad', '#ffffff'] },
];

export const PITY = { ultraAfter: 15, legendaryAfter: 90 };   // packs payants sans Ultra+ / Légendaire+

// ───── Économie
export const ECONOMY = {
  startBalance: 300,
  welcomePacks: 3,                       // 3 Caisses Standard offertes
  sellToSystemRate: 0.55,
  marketFee: 0.05,
  priceCapMult: 20, priceFloorMult: 0.15,
  maxListings: 40,
  free: { intervalMs: 10 * 60e3, maxStock: 6 },
  dailyStreak: [40, 50, 60, 75, 90, 120, 200],
  xp: { pack: 10, sale: 5, grade: 15, mission: 20 },
};

export const MISSIONS = [
  { key: 'open5',   fr: 'Ouvrir 5 boosters',               target: 5, reward: 60 },
  { key: 'new3',    fr: 'Découvrir 3 nouveaux skins',      target: 3, reward: 50 },
  { key: 'market1', fr: 'Acheter ou vendre sur le marché', target: 1, reward: 40 },
];

export const LEVELS = [0, 100, 250, 500, 900, 1500, 2400, 3800, 6000, 9500, 15000]; // XP par niveau

export const DISCORD = {
  minAccountAgeDays: 7,
  // Actions réservées aux comptes vérifiés (si l'OAuth Discord est configuré côté serveur)
  gated: ['market.sell', 'trade', 'friends.request'],
  verifyBonus: 150,                      // crédits offerts à la vérification
};

export const TRADES = { maxCardsPerSide: 12, maxOpenPerUser: 15, maxCredits: 250000 };
export const TRADE_UP = { inputCount: 10, cost: 25, maxInputRarity: 5 };
export const LEGAL = 'Jeu fictif sans valeur réelle. Aucune monnaie réelle, aucun achat, aucune revente hors du site. Toutes les armes et tous les skins sont imaginaires et ne sont affiliés à aucune marque ni à aucun éditeur.';

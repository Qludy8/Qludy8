// Mugigo (무기고) – config de jeu : TOUS les paramètres d'équilibrage (partagé serveur + navigateur).
// Jeu 100 % fictif : aucune monnaie réelle, aucun paiement.

export const BRAND = { name: 'Mugigo', ko: '무기고', glyph: '무', tagline: 'L’arsenal à collectionner', taglineEn: 'The collectible arsenal' };
export const CURRENCY = { name: 'Mu', ko: '무', symbol: '무' };
// Boutique (argent réel) : prévue plus tard. Tant que enabled = false, l'onglet est visible mais verrouillé.
export const SHOP = { enabled: false };
// Mode admin de test : interrupteur dans le menu joueur (sans mot de passe) → Mu illimités, gradation instantanée.
// À désactiver (false) avant l'ouverture au public.
export const ADMIN_TOGGLE = true;

export const RARITIES = [
  { id: 0, key: 'common',       fr: 'Commun', en: 'Common',       color: '#9aa3ad', glow: '#9aa3ad', base: [4, 10] },
  { id: 1, key: 'uncommon',     fr: 'Peu commun', en: 'Uncommon',   color: '#4ade80', glow: '#4ade80', base: [14, 34] },
  { id: 2, key: 'rare',         fr: 'Rare', en: 'Rare',         color: '#3b9cff', glow: '#3b9cff', base: [50, 130] },
  { id: 3, key: 'ultra',        fr: 'Ultra rare', en: 'Ultra Rare',   color: '#b266ff', glow: '#b266ff', base: [220, 560] },
  { id: 4, key: 'legendary',    fr: 'Légendaire', en: 'Legendary',   color: '#ffb020', glow: '#ffb020', base: [900, 2400] },
  { id: 5, key: 'mythic',       fr: 'Mythique', en: 'Mythic',     color: '#ff3d5a', glow: '#ff3d5a', base: [4000, 11000] },
  { id: 6, key: 'transcendent', fr: 'Transcendant', en: 'Transcendent', color: '#5ff3ff', glow: '#ff7ae6', base: [22000, 60000] },
];

// Répartition du catalogue : skins par modèle d'arme et par rareté (somme = SKINS_PER_MODEL)
export const SKINS_PER_MODEL = 300;
export const CATALOG_QUOTA = [100, 78, 54, 36, 20, 9, 3];          // armes à feu
export const KNIFE_QUOTA = [0, 0, 120, 90, 55, 25, 10];            // couteaux : à partir de Rare

// ───── Usure (float 0 → 1, 6 décimales) – noms propres à Mugigo
export const WEAR = {
  tiers: [
    { key: 'IM', fr: 'Immaculée', en: 'Immaculate',   min: 0.00, max: 0.07, mult: 1.00, weight: 4,  color: '#4ade80' },
    { key: 'PM', fr: 'Peu marquée', en: 'Lightly Marked', min: 0.07, max: 0.15, mult: 0.80, weight: 9,  color: '#a3e635' },
    { key: 'EP', fr: 'Éprouvée', en: 'Seasoned',    min: 0.15, max: 0.38, mult: 0.60, weight: 34, color: '#facc15' },
    { key: 'US', fr: 'Usée', en: 'Worn',        min: 0.38, max: 0.45, mult: 0.45, weight: 9,  color: '#fb923c' },
    { key: 'RV', fr: 'Ravagée', en: 'Ravaged',     min: 0.45, max: 1.00, mult: 0.30, weight: 44, color: '#ef4444' },
  ],
};

// ───── Graine de motif (0–999) : place le motif sur l'arme ; certaines graines sont rares (voir shared/patterns.js)
export const PATTERN = { seeds: 1000, tiers: { 1: { fr: 'Graine légendaire', en: 'Legendary seed', mult: 6 }, 2: { fr: 'Graine rare', en: 'Rare seed', mult: 2.5 }, 3: { fr: 'Graine recherchée', en: 'Coveted seed', mult: 1.35 } } };

// ───── Collections (thèmes de skins)
export const COLLECTIONS = [
  { key: 'dragon', sym: '용',  fr: 'Dynastie du Dragon', en: 'Dragon Dynasty', theme: ['#e0b54a', '#c8102e'], arts: ['dragon', 'filigree'] },
  { key: 'abysses', sym: '해', fr: 'Abysses', en: 'Abyss',            theme: ['#0ea5e9', '#1e3a8a'], arts: ['koi', 'wave'] },
  { key: 'neon', sym: '빛',    fr: 'Nuit Néon', en: 'Neon Night',          theme: ['#ff2bd6', '#2bfff0'], arts: ['city', 'circuit'] },
  { key: 'desert', sym: '사',  fr: 'Désert d’Ocre', en: 'Ochre Desert',      theme: ['#d6a35c', '#7a4a1e'], arts: ['scorpion', 'dunes'] },
  { key: 'forge', sym: '철',   fr: 'Forge Ancienne', en: 'Ancient Forge',     theme: ['#ff8a3d', '#4a4f5a'], arts: ['runes', 'filigree'] },
  { key: 'sakura', sym: '꽃',  fr: 'Jardin Sakura', en: 'Sakura Garden',      theme: ['#ff9ec7', '#5b2a3a'], arts: ['sakura', 'crane'] },
  { key: 'cosmos', sym: '별',  fr: 'Cosmos', en: 'Cosmos',             theme: ['#8b5cf6', '#0b1030'], arts: ['galaxy', 'planet'] },
  { key: 'arctique', sym: '얼', fr: 'Arctique', en: 'Arctic',          theme: ['#bfe9ff', '#2b4a6b'], arts: ['frost', 'wolf'] },
  { key: 'jungle', sym: '숲',  fr: 'Jungle', en: 'Jungle',             theme: ['#4ade80', '#14532d'], arts: ['tiger', 'serpent'] },
  { key: 'phenix', sym: '불',  fr: 'Phénix', en: 'Phoenix',             theme: ['#ff5a1f', '#ffd36b'], arts: ['phoenix', 'flames'] },
];

export const MODIFIERS = {
  tracker: { chance: 0.08, mult: 1.4 },                 // compteur de victimes (cosmétique)
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
    economy:  { fr: 'Économique', en: 'Economy', baseFee: 40,  delayMs: 24 * 3600e3 },
    standard: { fr: 'Standard', en: 'Standard',   baseFee: 120, delayMs: 4 * 3600e3 },
    express:  { fr: 'Express', en: 'Express',    baseFee: 300, delayMs: 10 * 60e3 },
  },
  valueFeeRate: 0.02, maxValueFee: 600,
  model: { k: 9.0, p: 0.75, sigma: { IM: 0.45, PM: 0.55, EP: 0.85, US: 0.9, RV: 0.9 } },
  weights: { centering: 0.2, corners: 0.25, edges: 0.2, surface: 0.35 },
  maxByWear: { IM: 10, PM: 10, EP: 9, US: 7, RV: 6 },
  labels: [[10, 'Pristine'], [9.5, 'Gem Mint'], [9, 'Mint'], [8, 'NM-MT'], [7, 'NM'], [6, 'EX'], [0, 'Abîmée']],
  valueMult: [[10, 6], [9.5, 3], [9, 2], [8, 1.4], [7, 1.15], [6, 1.0], [5, 0.9], [0, 0.75]],
  popBonus: [[1, 1.30], [5, 1.15], [25, 1.05]],   // [population ≤ n, multiplicateur]
};

// ───── Boosters (taux par carte en %, indices = rareté 0..6)
// Les prix sont calculés automatiquement (shared/packs.js) pour que la valeur moyenne ≈ PACK_EV_TARGET × prix.
// `npm run calibrate` vérifie le résultat par simulation.
export const PACK_EV_TARGET = 0.87;
export const BASE_PACKS = [
  { key: 'standard',  fr: 'Caisse Mugigo', en: 'Mugigo Crate', ko: '무기고', sym: '무', tag: 'Tous modèles', tagEn: 'All models', filter: {},
    cards: 5, rates: [62, 25, 9.5, 3, 0.4, 0.09, 0.01], theme: ['#ff4d2e', '#ffb020'] },
  { key: 'sidearm',   fr: 'Arme de poing', en: 'Sidearm', ko: '권총', sym: '권', tag: 'Pistolets & revolvers', tagEn: 'Pistols & revolvers', filter: { classes: ['pistol', 'revolver'] },
    cards: 5, rates: [64, 24, 8.5, 2.8, 0.55, 0.13, 0.02], theme: ['#3b9cff', '#5ff3ff'] },
  { key: 'assault',   fr: 'Rafale', en: 'Burst', ko: '연사', sym: '연', tag: 'PM, fusils, pompes, mitrailleuses', tagEn: 'SMGs, rifles, shotguns, machine guns', filter: { classes: ['smg', 'rifle', 'shotgun', 'lmg'] },
    cards: 5, rates: [55, 27, 12, 4.5, 1.1, 0.35, 0.05], theme: ['#4ade80', '#d9ff66'] },
  { key: 'precision', fr: 'Ligne de mire', en: 'Line of Sight', ko: '저격', sym: '저', tag: 'Fusils de précision', tagEn: 'Sniper rifles', filter: { classes: ['sniper', 'dmr'] },
    cards: 5, rates: [0, 52, 30, 13, 3.8, 1, 0.2], theme: ['#b266ff', '#ff7ae6'] },
  { key: 'blades',    fr: 'Éclat d’acier', en: 'Steel Glint', ko: '칼날', sym: '검', tag: 'Couteaux', tagEn: 'Knives', filter: { classes: ['knife'] },
    cards: 5, rates: [0, 0, 62, 26, 9, 2.6, 0.4], theme: ['#ff3d5a', '#ffb020'] },
  { key: 'mega',      fr: 'Caisse Mugigo XL', en: 'Mugigo Crate XL', ko: '대형', sym: '대', tag: '10 cartes, tous modèles', tagEn: '10 cards, all models', filter: {},
    cards: 10, rates: [60, 26, 10, 3.3, 0.55, 0.13, 0.02], theme: ['#ff7a1f', '#ffd36b'], evTarget: 0.9 },
  { key: 'elite',     fr: 'Coffre d’élite', en: 'Elite Chest', ko: '정예', sym: '정', tag: '7 cartes, à partir de Peu commun', tagEn: '7 cards, Uncommon or better', filter: {},
    cards: 7, rates: [0, 34, 38, 19, 6.5, 2, 0.5], theme: ['#2bd9ff', '#8b5cff'], evTarget: 0.85 },
  { key: 'royal',     fr: 'Arsenal royal', en: 'Royal Arsenal', ko: '왕실', sym: '왕', tag: '10 cartes, à partir de Rare', tagEn: '10 cards, Rare or better', filter: {},
    cards: 10, rates: [0, 0, 52, 31, 12, 4, 1], theme: ['#e0b54a', '#c8102e'], evTarget: 0.82 },
  { key: 'free',      fr: 'Booster gratuit', en: 'Free Pack', ko: '선물', sym: '선', tag: 'Toutes les 10 minutes', tagEn: 'Every 10 minutes', filter: {}, free: true,
    price: 0, cards: 3, rates: [78, 17.5, 3.6, 0.75, 0.12, 0.025, 0.005], theme: ['#9aa3ad', '#ffffff'] },
];
// symbole des boosters « par arme » selon la famille
export const CLASS_SYM = { pistol: '권', revolver: '탄', smg: '속', rifle: '총', dmr: '정', sniper: '저', shotgun: '산', lmg: '포', knife: '검' };
// Boosters générés : un par collection et un par modèle d'arme (taux renormalisés selon le contenu réel)
export const COLLECTION_PACK_RATES = [58, 26, 10.5, 4, 1.1, 0.33, 0.07];
export const MODEL_PACK_RATES = [60, 25, 10, 3.8, 0.9, 0.25, 0.05];

// boosters payants consécutifs sans Ultra+ / Légendaire+ / Transcendant.
// Le compteur Transcendant ne progresse qu'avec les boosters « premium » (taux Transcendant ≥ transcendentMinRate % par carte),
// sinon la garantie offrirait trop de valeur aux boosters bon marché.
export const PITY = { ultraAfter: 15, legendaryAfter: 90, transcendentAfter: 150, transcendentMinRate: 0.2 };

// ───── Économie
export const ECONOMY = {
  startBalance: 300,
  welcomePacks: 3,                       // 3 Caisses Standard offertes
  sellToSystemRate: 0.55,
  marketFee: 0.05,
  priceCapMult: 20, priceFloorMult: 0.15,
  maxListings: 40,
  free: { intervalMs: 10 * 60e3, maxStock: 10 },
  dailyStreak: [40, 50, 60, 75, 90, 120, 200],
  xp: { pack: 10, sale: 5, grade: 15, mission: 20 },
};

// ───── Quêtes : quotidiennes (minuit UTC), hebdomadaires (lundi), exploits (une seule fois)
// ev = évènement suivi ; diff = difficulté affichée ; reward en Mu, packs = Caisses Mugigo offertes
export const QUEST_DIFF = { facile: { fr: 'Facile', en: 'Easy', color: '#4ade80' }, moyen: { fr: 'Moyen', en: 'Medium', color: '#3b9cff' }, difficile: { fr: 'Difficile', en: 'Hard', color: '#b266ff' }, extreme: { fr: 'Extrême', en: 'Extreme', color: '#ffb020' } };
export const QUESTS = {
  daily: [
    { key: 'd_open3', ev: 'open', fr: 'Ouvrir 3 boosters', en: 'Open 3 packs', target: 3, reward: 60, diff: 'facile' },
    { key: 'd_free2', ev: 'open_free', fr: 'Ouvrir 2 boosters gratuits', en: 'Open 2 free packs', target: 2, reward: 30, diff: 'facile' },
    { key: 'd_new3', ev: 'new', fr: 'Découvrir 3 nouveaux skins', en: 'Discover 3 new skins', target: 3, reward: 50, diff: 'facile' },
    { key: 'd_market', ev: 'market', fr: 'Acheter ou vendre sur le marché', en: 'Buy or sell on the market', target: 1, reward: 50, diff: 'moyen' },
    { key: 'd_ultra', ev: 'drop3', fr: 'Obtenir une carte Ultra rare ou mieux', en: 'Pull an Ultra Rare card or better', target: 1, reward: 90, diff: 'moyen' },
    { key: 'd_open10', ev: 'open', fr: 'Ouvrir 10 boosters', en: 'Open 10 packs', target: 10, reward: 220, diff: 'difficile' },
  ],
  weekly: [
    { key: 'w_daily5', ev: 'daily', fr: 'Se connecter 5 jours', en: 'Log in on 5 days', target: 5, reward: 300, diff: 'facile' },
    { key: 'w_new40', ev: 'new', fr: 'Découvrir 40 nouveaux skins', en: 'Discover 40 new skins', target: 40, reward: 400, diff: 'moyen' },
    { key: 'w_grade3', ev: 'grade', fr: 'Faire grader 3 cartes', en: 'Get 3 cards graded', target: 3, reward: 300, diff: 'moyen' },
    { key: 'w_trade3', ev: 'trade', fr: 'Réaliser 3 échanges avec des amis', en: 'Complete 3 trades with friends', target: 3, reward: 300, diff: 'moyen' },
    { key: 'w_tradeup2', ev: 'tradeup', fr: 'Signer 2 contrats', en: 'Sign 2 contracts', target: 2, reward: 250, diff: 'moyen' },
    { key: 'w_open40', ev: 'open', fr: 'Ouvrir 40 boosters', en: 'Open 40 packs', target: 40, reward: 600, packs: 2, diff: 'difficile' },
    { key: 'w_legend', ev: 'drop4', fr: 'Obtenir une carte Légendaire ou mieux', en: 'Pull a Legendary card or better', target: 1, reward: 700, diff: 'difficile' },
  ],
  long: [
    { key: 'l_open250', ev: 'open', fr: 'Ouvrir 250 boosters', en: 'Open 250 packs', target: 250, reward: 2500, packs: 5, diff: 'difficile' },
    { key: 'l_new500', ev: 'new', fr: 'Découvrir 500 skins', en: 'Discover 500 skins', target: 500, reward: 3000, diff: 'difficile' },
    { key: 'l_sell50', ev: 'market_sell', fr: 'Vendre 50 cartes sur le marché', en: 'Sell 50 cards on the market', target: 50, reward: 1500, diff: 'difficile' },
    { key: 'l_friends10', ev: 'friend', fr: 'Avoir 10 amis', en: 'Have 10 friends', target: 10, reward: 800, diff: 'moyen' },
    { key: 'l_grade9', ev: 'grade9', fr: 'Obtenir une note de 9 ou plus', en: 'Get a grade of 9 or higher', target: 1, reward: 1200, diff: 'difficile' },
    { key: 'l_mythic', ev: 'drop5', fr: 'Obtenir une carte Mythique', en: 'Pull a Mythic card', target: 1, reward: 1500, diff: 'difficile' },
    { key: 'l_misprint', ev: 'misprint', fr: 'Trouver une carte erreur', en: 'Find a misprint card', target: 1, reward: 5000, diff: 'extreme' },
    { key: 'l_transc', ev: 'drop6', fr: 'Obtenir une carte Transcendante', en: 'Pull a Transcendent card', target: 1, reward: 10000, packs: 10, diff: 'extreme' },
  ],
};
// compatibilité : anciennes missions du jour
export const MISSIONS = QUESTS.daily;

export const LEVELS = [0, 100, 250, 500, 900, 1500, 2400, 3800, 6000, 9500, 15000]; // XP par niveau

export const DISCORD = {
  minAccountAgeDays: 7,
  // Actions réservées aux comptes vérifiés (si l'OAuth Discord est configuré côté serveur)
  gated: ['market.sell', 'trade', 'friends.request'],
  verifyBonus: 150,                      // crédits offerts à la vérification
};

export const TRADES = { maxCardsPerSide: 12, maxOpenPerUser: 15, maxCredits: 250000 };
export const TRADE_UP = { inputCount: 10, cost: 25, maxInputRarity: 5 };
export const LEGAL = 'Mugigo est un jeu fictif sans valeur réelle. Aucune monnaie réelle, aucun achat, aucune revente hors du site. Toutes les armes et tous les skins sont imaginaires et ne sont affiliés à aucune marque ni à aucun éditeur.';
export const LEGAL_EN = 'Mugigo is a fictional game with no real value. No real money, no purchases, no resale outside the site. All weapons and skins are imaginary and are not affiliated with any brand or publisher.';

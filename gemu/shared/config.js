// Gēmu – équilibrage du jeu, partagé entre le serveur et le navigateur.
// Les raretés, taux et valeurs de recyclage reprennent ceux de kyara.games.

export const RARITIES = ['C', 'U', 'R', 'E', 'L', 'M'];

// share : part du catalogue (classé du plus populaire au moins populaire) qui reçoit la rareté.
export const RARITY = {
  C: { label: 'Commune', short: 'C', color: '#B5B1BB', drop: 62, recycle: 1, points: 1, value: 2, rule: 'le reste (25 %)', look: 'Cadre gris mat, aucun effet.' },
  U: { label: 'Peu commune', short: 'U', color: '#3FBF7F', drop: 25, recycle: 1, points: 2, value: 4, rule: 'top 50–75 %', look: 'Cadre vert, filet lumineux.' },
  R: { label: 'Rare', short: 'R', color: '#4D9BFF', drop: 11.4, recycle: 3, points: 5, value: 12, rule: 'top 25–50 %', look: 'Cadre bleu, halo externe léger.' },
  E: { label: 'Épique', short: 'E', color: '#B072FF', drop: 1.4, recycle: 10, points: 15, value: 45, rule: 'top 10–25 %', look: 'Cadre violet, premier reflet holo animé.' },
  L: { label: 'Légendaire', short: 'L', color: '#F5C518', drop: 0.15, recycle: 40, points: 50, value: 180, rule: 'top 3–10 %', look: 'Cadre or brossé, holo et forte lueur.' },
  M: { label: 'Mythique', short: 'M', color: '#FF4D2E', drop: 0.025, recycle: 150, points: 200, value: 700, rule: 'top 3 %', look: 'Cadre arc-en-ciel, holo intégral.' },
};
// bornes cumulées du classement (part du catalogue) : top 3 % Mythique, 3–10 % Légendaire…
export const RARITY_CUTS = [['M', 0.03], ['L', 0.10], ['E', 0.25], ['R', 0.50], ['U', 0.75], ['C', 1]];

export const rarityIndex = (r) => RARITIES.indexOf(r);

export const CURRENCY = { name: 'jetons', one: 'jeton', icon: '◆' };

export const ECONOMY = {
  packSize: 5,
  startJetons: 300,
  free: { max: 10, regenMinutes: 10 },     // 1 booster gratuit toutes les 10 min, stock de 10
  welcomeFree: 10,                          // le stock est plein à l'inscription
  pityMythic: 250,                          // Mythique garantie au 250e booster sans Mythique
  goldenEvery: 10,                          // 1 booster sur 10 est doré : Épique ou mieux garantie
  divineChance: 1 / 800,                    // booster divin : Mythique garantie, tout en Rare ou mieux
  marketFee: 0.05,
  minPrice: 1,
  maxPrice: 1_000_000,
  maxListings: 30,
  maxOffers: 10,
  wishMax: 200,
  showcaseMax: 8,
  streak: [20, 25, 30, 40, 50, 60, 120],   // récompense de connexion, jour 1 → 7 (puis 7 en boucle)
  streakBoosterDay: 7,                      // le 7e jour donne aussi un booster gratuit en plus
};

// Groupes de tags Steam (identifiants) → thèmes des boosters et filtres.
export const GENRES = {
  action: { label: 'Action', kanji: '撃', color: '#FF4D2E', tags: [19, 1646, 4106] },
  aventure: { label: 'Aventure', kanji: '旅', color: '#3FBF7F', tags: [21, 3834, 1695] },
  rpg: { label: 'RPG', kanji: '冒', color: '#B072FF', tags: [122, 4231, 4434, 1754] },
  tir: { label: 'Tir & FPS', kanji: '銃', color: '#FF7A45', tags: [1663, 1774, 3814] },
  strategie: { label: 'Stratégie', kanji: '策', color: '#4D9BFF', tags: [9, 1676, 1741, 1708] },
  simulation: { label: 'Simulation & gestion', kanji: '営', color: '#4DD6FF', tags: [599, 12472, 4328, 1100687] },
  horreur: { label: 'Horreur', kanji: '怖', color: '#C0392B', tags: [1667, 1721, 3978, 1659] },
  inde: { label: 'Indé', kanji: '独', color: '#FF4D9E', tags: [492] },
  plateforme: { label: 'Plateforme', kanji: '跳', color: '#F5C518', tags: [1625, 1628] },
  course: { label: 'Course & sport', kanji: '速', color: '#FFB347', tags: [699, 701, 1644] },
  survie: { label: 'Survie & craft', kanji: '生', color: '#8BC34A', tags: [1662, 1702, 1100689, 7332] },
  roguelike: { label: 'Roguelike', kanji: '輪', color: '#E056FD', tags: [1716, 3959, 42804] },
  combat: { label: 'Combat', kanji: '拳', color: '#FF5C5C', tags: [1743] },
  multi: { label: 'Multijoueur', kanji: '群', color: '#4DB6AC', tags: [128, 1775, 3878] },
  anime: { label: 'Anime', kanji: '絵', color: '#FF8AC9', tags: [4085] },
  casse: { label: 'Casse-tête', kanji: '謎', color: '#9CCC65', tags: [1664] },
};

// Boosters. pool : filtre sur le catalogue ; usesFree : s'ouvre avec le stock gratuit (sinon jetons).
// slots : raretés minimales garanties par emplacement (null = tirage libre).
export const BOOSTERS = [
  { id: 'standard', cat: 'free', name: 'Booster Standard', sub: 'Tout le catalogue', kanji: '遊', color: '#FF4D2E', price: 100, usesFree: true, pool: {} },
  { id: 'retro', cat: 'free', name: 'Rétro', sub: 'Sortis avant 2006', kanji: '昔', color: '#E9C496', price: 100, usesFree: true, pool: { yearMax: 2005 } },
  { id: 'eighties', cat: 'free', name: 'Années 2006–2015', sub: "L'âge d'or HD", kanji: '黄', color: '#F5C518', price: 100, usesFree: true, pool: { yearMin: 2006, yearMax: 2015 } },
  { id: 'nextgen', cat: 'free', name: 'Nouvelle génération', sub: 'Sortis depuis 2020', kanji: '新', color: '#4DD6FF', price: 100, usesFree: true, pool: { yearMin: 2020 } },
  ...Object.entries(GENRES).map(([g, d]) => ({ id: `g-${g}`, cat: 'free', name: d.label, sub: `Booster ${d.label}`, kanji: d.kanji, color: d.color, price: 100, usesFree: true, pool: { genre: g } })),
  { id: 'nintendo', cat: 'shop', name: 'Consoles Nintendo', sub: 'NES → Switch 2', kanji: '任', color: '#E60012', price: 150, pool: { platform: 'nintendo' } },
  { id: 'playstation', cat: 'shop', name: 'Exclus PlayStation', sub: 'PS1 → PS5', kanji: '駅', color: '#2E6DB4', price: 150, pool: { platform: 'playstation' } },
  { id: 'arcade', cat: 'shop', name: 'Arcade & cartouches', sub: 'Bornes, Mega Drive, Game Boy…', kanji: '機', color: '#FF4D9E', price: 150, pool: { platform: 'retro' } },
  { id: 'mobile', cat: 'shop', name: 'Mobile & free-to-play', sub: 'Les géants du téléphone', kanji: '携', color: '#3FBF7F', price: 150, pool: { platform: 'mobile' } },
  { id: 'univers', cat: 'shop', name: 'Grandes sagas', sub: 'Uniquement des jeux de séries', kanji: '系', color: '#B072FF', price: 150, pool: { saga: true } },
  { id: 'prestige', cat: 'shop', name: 'Édition prestige', sub: 'Rare ou mieux sur chaque carte', kanji: '極', color: '#F5C518', price: 600, pool: {}, slots: ['R', 'R', 'R', 'R', 'E'] },
  { id: 'daily', cat: 'limited', name: 'Pack du jour', sub: 'Gratuit · 1 par jour · Épique garantie', kanji: '日', color: '#FF6A4D', price: 0, daily: true, pool: {}, slots: [null, null, null, null, 'E'] },
];

export const boosterById = (id) => BOOSTERS.find((b) => b.id === id);

// Le pack du jour change de thème chaque jour (genre).
export function dailyTheme(dayKey) {
  const keys = Object.keys(GENRES);
  let h = 0;
  for (const ch of dayKey) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return keys[h % keys.length];
}

// Missions (réinitialisées à minuit / le lundi, heure de Paris) et succès.
export const MISSIONS = {
  daily: [
    { id: 'd-open5', label: 'Ouvre 5 boosters', stat: 'open', goal: 5, reward: 40 },
    { id: 'd-daily', label: 'Ouvre le pack du jour', stat: 'dailyPack', goal: 1, reward: 25 },
    { id: 'd-rare', label: 'Tire une Rare ou mieux', stat: 'rarePlus', goal: 1, reward: 25 },
    { id: 'd-recycle', label: 'Recycle 10 doublons', stat: 'recycled', goal: 10, reward: 30 },
  ],
  weekly: [
    { id: 'w-open50', label: 'Ouvre 50 boosters', stat: 'open', goal: 50, reward: 250, freePacks: 2 },
    { id: 'w-epic', label: 'Tire 3 Épiques ou mieux', stat: 'epicPlus', goal: 3, reward: 150 },
    { id: 'w-new', label: 'Découvre 40 nouveaux jeux', stat: 'newCards', goal: 40, reward: 150 },
    { id: 'w-market', label: 'Vends, achète ou échange 1 carte', stat: 'trade', goal: 1, reward: 100 },
  ],
};

export const ACHIEVEMENTS = [
  { id: 'a-first', label: 'Premier booster', desc: 'Ouvre ton premier booster', stat: 'open', goal: 1, reward: 50 },
  { id: 'a-open100', label: 'Habitué', desc: 'Ouvre 100 boosters', stat: 'open', goal: 100, reward: 200 },
  { id: 'a-open1000', label: 'Accro', desc: 'Ouvre 1 000 boosters', stat: 'open', goal: 1000, reward: 1000 },
  { id: 'a-uniq100', label: 'Ludothèque', desc: '100 jeux différents', stat: 'unique', goal: 100, reward: 100 },
  { id: 'a-uniq500', label: 'Collectionneur', desc: '500 jeux différents', stat: 'unique', goal: 500, reward: 400 },
  { id: 'a-uniq1500', label: 'Archiviste', desc: '1 500 jeux différents', stat: 'unique', goal: 1500, reward: 1200 },
  { id: 'a-uniq3000', label: 'Conservateur', desc: '3 000 jeux différents', stat: 'unique', goal: 3000, reward: 3000 },
  { id: 'a-epic', label: 'Violet', desc: 'Tire ta première Épique', stat: 'epicPlus', goal: 1, reward: 50 },
  { id: 'a-legend', label: 'Or brossé', desc: 'Tire ta première Légendaire', stat: 'legendPlus', goal: 1, reward: 150 },
  { id: 'a-mythic', label: 'Arc-en-ciel', desc: 'Tire ta première Mythique', stat: 'mythic', goal: 1, reward: 500 },
  { id: 'a-univers', label: 'Saga complète', desc: 'Complète un univers à 100 %', stat: 'universDone', goal: 1, reward: 200 },
  { id: 'a-univers10', label: 'Encyclopédiste', desc: 'Complète 10 univers', stat: 'universDone', goal: 10, reward: 800 },
  { id: 'a-recycle', label: 'Recycleur', desc: 'Recycle 500 doublons', stat: 'recycled', goal: 500, reward: 150 },
  { id: 'a-streak', label: 'Fidèle', desc: 'Série de connexion de 7 jours', stat: 'streak', goal: 7, reward: 150 },
  { id: 'a-trade', label: 'Marchand', desc: '10 ventes, achats ou échanges', stat: 'trade', goal: 10, reward: 200 },
];

// Rangs du joueur, d'après ses points de collection (Commune 1 … Mythique 200).
export const RANKS = [
  [0, 'Joueur du dimanche'], [100, 'Apprenti'], [400, 'Habitué'], [1000, 'Collectionneur'],
  [2500, 'Expert'], [5000, 'Vétéran'], [10000, 'Maître'], [20000, 'Légende'], [40000, 'Hall of Fame'],
];
export const rankFor = (pts) => RANKS.reduce((a, r) => (pts >= r[0] ? r : a), RANKS[0]);

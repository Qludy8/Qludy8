// Logique du jeu : boosters, collection, recyclage, missions, succès, marché, échanges, classement.
// Toute mutation passe par une transaction ; chaque mouvement de jetons est inscrit au registre (ledger).
import { randomInt } from 'node:crypto';
import { db, one, all, run, tx, now } from './db.js';
import { GAMES, TOTAL, UNIVERS, game, gameById, idOf, nOf, poolFor, boosterSize } from './catalog.js';
import { RARITY, RARITIES, rarityIndex, ECONOMY, BOOSTERS, boosterById, dailyTheme, MISSIONS, ACHIEVEMENTS, GENRES, rankFor } from '../shared/config.js';
import { baseValue, dayKey, weekKey, previousDay } from '../shared/rules.js';

export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}

// Table des cartes (rareté, points, univers) pour les classements en SQL
db.exec('DROP TABLE IF EXISTS cards_meta');
db.exec('CREATE TABLE cards_meta (id TEXT PRIMARY KEY, n INTEGER NOT NULL, r TEXT NOT NULL, pts INTEGER NOT NULL, u TEXT NOT NULL)');
tx(() => {
  const ins = db.prepare('INSERT INTO cards_meta (id, n, r, pts, u) VALUES (?,?,?,?,?)');
  for (const g of GAMES) ins.run(g.id, g.n, g.r, RARITY[g.r].points, g.u);
});

// Numéro de carte reçu de l'API → identifiant stable du jeu (erreur si la carte n'existe pas)
function cardId(n) {
  const id = idOf(n);
  if (!id) throw new HttpError(404, 'Cette carte n’existe pas.');
  return id;
}
db.exec(`CREATE TABLE IF NOT EXISTS univers_meta (u TEXT PRIMARY KEY, total INTEGER NOT NULL)`);
tx(() => {
  run('DELETE FROM univers_meta');
  const ins = db.prepare('INSERT INTO univers_meta (u, total) VALUES (?,?)');
  for (const [u, n] of UNIVERS) ins.run(u, n);
});

const rnd = () => randomInt(0, 2 ** 32) / 2 ** 32;
const pick = (arr) => arr[randomInt(0, arr.length)];

// --- jetons ------------------------------------------------------------------------------------
export function credit(userId, amount, reason) {
  return tx(() => {
    const u = one('SELECT jetons FROM users WHERE id = ?', userId);
    if (!u) throw new HttpError(404, 'Joueur introuvable');
    const after = u.jetons + amount;
    if (after < 0) throw new HttpError(400, 'Pas assez de jetons.', 'no_jetons');
    run('UPDATE users SET jetons = ? WHERE id = ?', after, userId);
    run('INSERT INTO ledger (user_id, amount, balance_after, reason, at) VALUES (?,?,?,?,?)', userId, amount, after, reason, now());
    return after;
  });
}

// --- boosters gratuits ------------------------------------------------------------------------
const REGEN = ECONOMY.free.regenMinutes * 60_000;
export function refreshFree(userId) {
  const u = one('SELECT free_stock, free_at FROM users WHERE id = ?', userId);
  let { free_stock: stock, free_at: at } = u;
  const t = now();
  if (stock >= ECONOMY.free.max) {
    if (at !== t) run('UPDATE users SET free_at = ? WHERE id = ?', t, userId);
    return { stock, next: null };
  }
  const gained = Math.floor((t - at) / REGEN);
  if (gained > 0) {
    stock = Math.min(ECONOMY.free.max, stock + gained);
    at = stock >= ECONOMY.free.max ? t : at + gained * REGEN;
    run('UPDATE users SET free_stock = ?, free_at = ? WHERE id = ?', stock, at, userId);
  }
  return { stock, next: stock >= ECONOMY.free.max ? null : at + REGEN };
}

// --- statistiques (missions & succès) ----------------------------------------------------------
export function addStat(userId, stat, v = 1) {
  if (!v) return;
  const t = now();
  for (const period of [dayKey(t), weekKey(t), 'all']) {
    run(`INSERT INTO stats (user_id, period, stat, value) VALUES (?,?,?,?)
         ON CONFLICT(user_id, period, stat) DO UPDATE SET value = value + excluded.value`, userId, period, stat, v);
  }
}
const statOf = (userId, period, stat) => one('SELECT value FROM stats WHERE user_id = ? AND period = ? AND stat = ?', userId, period, stat)?.value || 0;

// --- profil -------------------------------------------------------------------------------------
export function collectionSummary(userId) {
  return one(`SELECT COUNT(*) AS uniq, COALESCE(SUM(m.pts),0) AS points, COALESCE(SUM(c.qty),0) AS copies,
      SUM(CASE WHEN m.r = 'M' THEN 1 ELSE 0 END) AS mythics, SUM(CASE WHEN m.r = 'L' THEN 1 ELSE 0 END) AS legends
    FROM collection c JOIN cards_meta m ON m.id = c.card WHERE c.user_id = ? AND c.qty > 0`, userId);
}
export function universDone(userId) {
  return one(`SELECT COUNT(*) AS n FROM (SELECT m.u, COUNT(*) AS have FROM collection c JOIN cards_meta m ON m.id = c.card
    WHERE c.user_id = ? AND c.qty > 0 GROUP BY m.u) x JOIN univers_meta um ON um.u = x.u WHERE x.have >= um.total AND um.total >= 2`, userId).n;
}

export function me(userId) {
  const free = refreshFree(userId);
  const u = one('SELECT * FROM users WHERE id = ?', userId);
  const sum = collectionSummary(userId);
  const today = dayKey();
  return {
    id: u.id, username: u.username, guest: !!u.guest, hue: u.hue, bio: u.bio,
    jetons: u.jetons, freePacks: free.stock, freePacksMax: ECONOMY.free.max, nextFreeAt: free.next, bonusPacks: u.bonus_packs,
    packsOpened: u.packs_opened, pityM: u.pity_m, pityThreshold: ECONOMY.pityMythic,
    goldenIn: ECONOMY.goldenEvery - (u.packs_opened % ECONOMY.goldenEvery),
    dailyAvailable: u.daily_pack !== today, dailyTheme: dailyTheme(today),
    streak: u.streak, unique: sum.uniq, points: sum.points, rank: rankFor(sum.points)[1], total: TOTAL,
    claimable: claimableCount(userId),
    unread: one('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND seen = 0', userId).n,
  };
}

// Récompense de connexion quotidienne (série de 7 jours)
export function dailyLogin(userId) {
  return tx(() => {
    const u = one('SELECT last_login, streak FROM users WHERE id = ?', userId);
    const today = dayKey();
    if (u.last_login === today) return null;
    const streak = u.last_login === previousDay(today) ? u.streak + 1 : 1;
    const step = ((streak - 1) % 7) + 1;
    const jetons = ECONOMY.streak[step - 1];
    const packs = step === ECONOMY.streakBoosterDay ? 1 : 0;
    run('UPDATE users SET last_login = ?, streak = ?, bonus_packs = bonus_packs + ? WHERE id = ?', today, streak, packs, userId);
    credit(userId, jetons, 'Connexion du jour');
    addStat(userId, 'login');
    return { streak, step, jetons, packs, table: ECONOMY.streak };
  });
}

// --- tirage -------------------------------------------------------------------------------------
function drawRarity(min) {
  const allowed = RARITIES.filter((r) => rarityIndex(r) >= rarityIndex(min || 'C'));
  const total = allowed.reduce((s, r) => s + RARITY[r].drop, 0);
  let x = rnd() * total;
  for (const r of allowed) { x -= RARITY[r].drop; if (x < 0) return r; }
  return allowed[allowed.length - 1];
}

export function rollPack(booster, { theme, golden, divine, pityHit } = {}) {
  const pool = poolFor(booster, theme);
  const size = ECONOMY.packSize;
  const mins = [...(booster.slots || Array(size).fill(null))];
  if (golden) mins[size - 1] = maxR(mins[size - 1], 'E');
  if (divine) {
    for (let i = 0; i < size; i++) mins[i] = maxR(mins[i], 'R');
    mins[randomInt(0, size)] = 'M';
  }
  let rarities = mins.map((m) => drawRarity(m));
  if (pityHit && !rarities.includes('M')) rarities[size - 1] = 'M';
  // aucun doublon dans un même booster
  const picked = new Set();
  const cards = rarities.map((r) => {
    let n, tries = 0;
    do { n = pick(pool[r]); } while (picked.has(n) && ++tries < 20);
    picked.add(n);
    return n;
  });
  // les meilleures cartes à la fin : le suspense monte
  return cards.map((n) => ({ n, r: game(n).r })).sort((a, b) => rarityIndex(a.r) - rarityIndex(b.r));
}
const maxR = (a, b) => (!a ? b : rarityIndex(a) >= rarityIndex(b) ? a : b);

export function boosterInfo() {
  return BOOSTERS.map((b) => ({
    id: b.id, cat: b.cat, name: b.name, sub: b.sub, kanji: b.kanji, color: b.color, price: b.price,
    usesFree: !!b.usesFree, daily: !!b.daily, slots: b.slots || null, size: boosterSize(b),
  }));
}

// Ouvre `count` boosters d'un coup. pay : 'free' (stock gratuit puis boosters bonus) ou 'jetons'.
export function openBooster(userId, boosterId, { pay = 'free', count = 1, bot = false } = {}) {
  const booster = boosterById(boosterId);
  if (!booster) throw new HttpError(404, "Ce booster n'existe pas ou n'est plus disponible.");
  count = Math.max(1, Math.min(10, Math.floor(Number(count) || 1)));
  if (booster.daily) count = 1;
  return tx(() => {
    const t = now();
    const today = dayKey(t);
    if (!bot) {
      if (booster.daily) {
        const u = one('SELECT daily_pack FROM users WHERE id = ?', userId);
        if (u.daily_pack === today) throw new HttpError(400, 'Déjà ouvert aujourd’hui, reviens demain.', 'daily_limit');
        run('UPDATE users SET daily_pack = ? WHERE id = ?', today, userId);
      } else if (pay === 'free' && booster.usesFree) {
        const { stock } = refreshFree(userId);
        const u = one('SELECT bonus_packs FROM users WHERE id = ?', userId);
        if (stock + u.bonus_packs < count) throw new HttpError(400, 'Plus assez de boosters gratuits.', 'no_free');
        const fromStock = Math.min(stock, count);
        const wasFull = stock >= ECONOMY.free.max;
        run('UPDATE users SET free_stock = free_stock - ?, bonus_packs = bonus_packs - ? WHERE id = ?', fromStock, count - fromStock, userId);
        if (wasFull && fromStock > 0) run('UPDATE users SET free_at = ? WHERE id = ?', t, userId); // la recharge repart maintenant
      } else {
        if (!booster.price) throw new HttpError(400, 'Ce booster s’obtient seulement en récompense.');
        credit(userId, -booster.price * count, `Booster ${booster.name}${count > 1 ? ` ×${count}` : ''}`);
      }
    }
    const theme = booster.daily ? dailyTheme(today) : null;
    const packs = [];
    for (let k = 0; k < count; k++) {
      const u = one('SELECT packs_opened, pity_m FROM users WHERE id = ?', userId);
      const golden = (u.packs_opened + 1) % ECONOMY.goldenEvery === 0;
      const divine = !golden && rnd() < ECONOMY.divineChance;
      const pityHit = u.pity_m + 1 >= ECONOMY.pityMythic;
      const cards = rollPack(booster, { theme, golden, divine, pityHit });
      const gotM = cards.some((c) => c.r === 'M');
      run('UPDATE users SET packs_opened = packs_opened + 1, pity_m = ? WHERE id = ?', gotM ? 0 : u.pity_m + 1, userId);
      const out = [];
      for (const c of cards) {
        const id = idOf(c.n);
        const prev = one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', userId, id);
        run(`INSERT INTO collection (user_id, card, qty, first_at, last_at) VALUES (?,?,1,?,?)
             ON CONFLICT(user_id, card) DO UPDATE SET qty = qty + 1, last_at = excluded.last_at`, userId, id, t, t);
        out.push({ n: c.n, r: c.r, isNew: !prev || prev.qty === 0, qty: (prev?.qty || 0) + 1 });
      }
      const best = cards.reduce((b, c) => (rarityIndex(c.r) > rarityIndex(b) ? c.r : b), 'C');
      const kind = divine ? 'divine' : golden ? 'golden' : 'normal';
      run('INSERT INTO pulls (user_id, booster, kind, cards, best, at) VALUES (?,?,?,?,?,?)', userId, booster.id, kind, JSON.stringify(cards.map((c) => idOf(c.n))), best, t);
      if (!bot) {
        addStat(userId, 'open');
        if (booster.daily) addStat(userId, 'dailyPack');
        addStat(userId, 'rarePlus', cards.filter((c) => rarityIndex(c.r) >= 2).length);
        addStat(userId, 'epicPlus', cards.filter((c) => rarityIndex(c.r) >= 3).length);
        addStat(userId, 'legendPlus', cards.filter((c) => rarityIndex(c.r) >= 4).length);
        addStat(userId, 'mythic', cards.filter((c) => c.r === 'M').length);
        addStat(userId, 'newCards', out.filter((c) => c.isNew).length);
        notifyWishes(userId, out);
      }
      packs.push({ cards: out, kind, golden, divine, pityHit: pityHit && gotM, theme });
    }
    return { booster: booster.id, packs, user: bot ? null : me(userId) };
  });
}

// une envie obtenue quitte la liste d'envies
function notifyWishes(userId, cards) {
  for (const c of cards) if (c.isNew) run('DELETE FROM wishes WHERE user_id = ? AND card = ?', userId, idOf(c.n));
}

// --- collection ---------------------------------------------------------------------------------
export function collectionOf(userId) {
  return all('SELECT card, qty, reserved, locked, first_at FROM collection WHERE user_id = ? AND qty > 0', userId)
    .filter((c) => nOf(c.card)).map((c) => [nOf(c.card), c.qty, c.reserved, c.locked, c.first_at]);
}

export function setLock(userId, n, locked) {
  const card = cardId(n);
  const r = run('UPDATE collection SET locked = ? WHERE user_id = ? AND card = ? AND qty > 0', locked ? 1 : 0, userId, card);
  if (!r.changes) throw new HttpError(404, 'Tu n’as pas cette carte.');
}

export function toggleWish(userId, n, on) {
  const card = cardId(n);
  if (on) {
    const n = one('SELECT COUNT(*) AS n FROM wishes WHERE user_id = ?', userId).n;
    if (n >= ECONOMY.wishMax) throw new HttpError(400, `Ta liste d’envies est pleine (${ECONOMY.wishMax} jeux).`);
    run('INSERT OR IGNORE INTO wishes (user_id, card, at) VALUES (?,?,?)', userId, card, now());
  } else run('DELETE FROM wishes WHERE user_id = ? AND card = ?', userId, card);
}
export const wishesOf = (userId) => all('SELECT card FROM wishes WHERE user_id = ? ORDER BY at DESC', userId).map((w) => nOf(w.card)).filter(Boolean);

// Recycle des doublons : on garde toujours 1 exemplaire ; jamais les cartes verrouillées ni réservées.
export function recycle(userId, { card: n = null, qty = null, rarities = null } = {}) {
  const card = n ? cardId(n) : null;
  return tx(() => {
    let rows;
    if (card) rows = all('SELECT card, qty, reserved, locked FROM collection WHERE user_id = ? AND card = ?', userId, card);
    else rows = all('SELECT card, qty, reserved, locked FROM collection WHERE user_id = ? AND qty > 1', userId);
    const allowed = new Set(rarities && rarities.length ? rarities : RARITIES);
    let gain = 0, count = 0;
    for (const c of rows) {
      const g = gameById(c.card);
      if (!g || c.locked || !allowed.has(g.r)) continue;
      const free = c.qty - 1 - c.reserved;
      const k = card && qty ? Math.min(free, Math.max(0, Math.floor(qty))) : free;
      if (k <= 0) continue;
      run('UPDATE collection SET qty = qty - ? WHERE user_id = ? AND card = ?', k, userId, c.card);
      gain += k * RARITY[g.r].recycle;
      count += k;
    }
    if (card && !count) throw new HttpError(400, 'Aucun doublon libre à recycler pour cette carte.');
    if (count) {
      credit(userId, gain, `Recyclage de ${count} doublon${count > 1 ? 's' : ''}`);
      addStat(userId, 'recycled', count);
    }
    return { count, gain, user: me(userId) };
  });
}

// --- missions et succès -------------------------------------------------------------------------
function achievementValue(userId, a) {
  if (a.stat === 'unique') return collectionSummary(userId).uniq;
  if (a.stat === 'universDone') return universDone(userId);
  if (a.stat === 'streak') return one('SELECT streak FROM users WHERE id = ?', userId).streak;
  return statOf(userId, 'all', a.stat);
}
export function missions(userId) {
  const d = dayKey(), w = weekKey();
  const claimed = (id, p) => !!one('SELECT 1 FROM claims WHERE user_id = ? AND mission = ? AND period = ?', userId, id, p);
  const mk = (list, period) => list.map((m) => {
    const value = statOf(userId, period, m.stat);
    return { ...m, value: Math.min(value, m.goal), done: value >= m.goal, claimed: claimed(m.id, period) };
  });
  const ach = ACHIEVEMENTS.map((a) => {
    const value = achievementValue(userId, a);
    return { ...a, value: Math.min(value, a.goal), done: value >= a.goal, claimed: claimed(a.id, 'all') };
  });
  const u = one('SELECT streak, last_login FROM users WHERE id = ?', userId);
  return { daily: mk(MISSIONS.daily, d), weekly: mk(MISSIONS.weekly, w), achievements: ach, streak: u.streak, streakTable: ECONOMY.streak };
}
function claimableCount(userId) {
  const m = missions(userId);
  return [...m.daily, ...m.weekly, ...m.achievements].filter((x) => x.done && !x.claimed).length;
}
export function claim(userId, id) {
  return tx(() => {
    const m = missions(userId);
    const list = [['daily', dayKey()], ['weekly', weekKey()], ['achievements', 'all']];
    const ids = id === 'all' ? null : [id];
    let jetons = 0, packs = 0, n = 0;
    for (const [k, period] of list) {
      for (const x of m[k]) {
        if ((ids && !ids.includes(x.id)) || !x.done || x.claimed) continue;
        run('INSERT INTO claims (user_id, mission, period, at) VALUES (?,?,?,?)', userId, x.id, period, now());
        jetons += x.reward || 0;
        packs += x.freePacks || 0;
        n++;
      }
    }
    if (!n) throw new HttpError(400, 'Rien à réclamer pour le moment.');
    if (jetons) credit(userId, jetons, 'Missions et succès');
    if (packs) run('UPDATE users SET bonus_packs = bonus_packs + ? WHERE id = ?', packs, userId);
    return { jetons, packs, n, user: me(userId) };
  });
}

// --- fil des gros tirages & classements ---------------------------------------------------------
export function feed(limit = 30) {
  const rows = all(`SELECT p.id, p.cards, p.kind, p.at, p.booster, u.username, u.hue FROM pulls p JOIN users u ON u.id = p.user_id
    WHERE p.best IN ('L','M') ORDER BY p.id DESC LIMIT ?`, limit);
  return rows.map((p) => ({
    id: p.id, user: p.username, hue: p.hue, at: p.at, kind: p.kind, booster: p.booster,
    cards: JSON.parse(p.cards).map(nOf).filter((n) => n && ['L', 'M'].includes(game(n).r)),
  }));
}

// Classement des joueurs (les collectionneurs automatiques n'y figurent pas)
export function leaderboard(kind = 'points', limit = 50) {
  const order = { points: 'points DESC, mythics DESC', mythics: 'mythics DESC, points DESC', unique: 'uniq DESC, points DESC' }[kind] || 'points DESC';
  return all(`SELECT u.id, u.username, u.hue, COUNT(*) AS uniq, SUM(m.pts) AS points, SUM(CASE WHEN m.r = 'M' THEN 1 ELSE 0 END) AS mythics
    FROM collection c JOIN users u ON u.id = c.user_id JOIN cards_meta m ON m.id = c.card
    WHERE c.qty > 0 AND u.is_bot = 0 GROUP BY u.id ORDER BY ${order} LIMIT ?`, limit)
    .map((r) => ({ ...r, rank: rankFor(r.points)[1] }));
}

export function stats() {
  return {
    players: one('SELECT COUNT(*) AS n FROM users WHERE is_bot = 0').n,
    packs: one('SELECT COALESCE(SUM(packs_opened),0) AS n FROM users').n,
    cards: one('SELECT COALESCE(SUM(qty),0) AS n FROM collection').n,
    mythics: one("SELECT COUNT(*) AS n FROM pulls WHERE best = 'M'").n,
  };
}

// --- profils ---------------------------------------------------------------------------------------
export function profile(username) {
  const u = one('SELECT id, username, hue, bio, showcase, created_at, packs_opened, streak, is_bot FROM users WHERE username = ?', username);
  if (!u) throw new HttpError(404, 'Ce collectionneur est introuvable.');
  const sum = collectionSummary(u.id);
  let show = JSON.parse(u.showcase || '[]').filter((id) => nOf(id) && one('SELECT 1 FROM collection WHERE user_id = ? AND card = ? AND qty > 0', u.id, id)).map(nOf);
  if (!show.length) {
    show = all(`SELECT m.n FROM collection c JOIN cards_meta m ON m.id = c.card WHERE c.user_id = ? AND c.qty > 0
      ORDER BY CASE m.r WHEN 'M' THEN 0 WHEN 'L' THEN 1 WHEN 'E' THEN 2 WHEN 'R' THEN 3 WHEN 'U' THEN 4 ELSE 5 END, m.n LIMIT 8`, u.id).map((r) => r.n);
  }
  const byRarity = Object.fromEntries(all(`SELECT m.r, COUNT(*) AS n FROM collection c JOIN cards_meta m ON m.id = c.card
    WHERE c.user_id = ? AND c.qty > 0 GROUP BY m.r`, u.id).map((r) => [r.r, r.n]));
  return {
    username: u.username, hue: u.hue, bio: u.bio, since: u.created_at, packsOpened: u.packs_opened, bot: !!u.is_bot,
    unique: sum.uniq, points: sum.points, mythics: sum.mythics, rank: rankFor(sum.points)[1], showcase: show, byRarity,
    universDone: universDone(u.id), total: TOTAL,
  };
}
export function updateProfile(userId, { bio, hue, showcase }) {
  if (bio !== undefined) run('UPDATE users SET bio = ? WHERE id = ?', String(bio).slice(0, 160), userId);
  if (hue !== undefined) run('UPDATE users SET hue = ? WHERE id = ?', Math.max(0, Math.min(359, Math.floor(Number(hue) || 0))), userId);
  if (showcase !== undefined) {
    const list = [...new Set((Array.isArray(showcase) ? showcase : []).map(idOf).filter(Boolean))].slice(0, ECONOMY.showcaseMax);
    run('UPDATE users SET showcase = ? WHERE id = ?', JSON.stringify(list), userId);
  }
  return me(userId);
}

// --- notifications -------------------------------------------------------------------------------
export function notify(userId, text, link = null) {
  run('INSERT INTO notifications (user_id, text, link, at) VALUES (?,?,?,?)', userId, text, link, now());
}
export function notifications(userId) {
  const list = all('SELECT id, text, link, seen, at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 40', userId);
  run('UPDATE notifications SET seen = 1 WHERE user_id = ? AND seen = 0', userId);
  return list;
}

// --- marché -------------------------------------------------------------------------------------
function reserveCopy(userId, card, { keepOne = false } = {}) {
  const c = one('SELECT qty, reserved, locked FROM collection WHERE user_id = ? AND card = ?', userId, card);
  if (!c || c.qty <= 0) throw new HttpError(400, 'Tu n’as pas cette carte.');
  if (c.locked) throw new HttpError(400, 'Carte verrouillée : déverrouille-la pour la vendre ou l’échanger.');
  if (c.qty - c.reserved - (keepOne ? 1 : 0) <= 0) throw new HttpError(400, 'Aucun exemplaire libre de cette carte.');
  run('UPDATE collection SET reserved = reserved + 1 WHERE user_id = ? AND card = ?', userId, card);
}
function releaseCopy(userId, card) {
  run('UPDATE collection SET reserved = MAX(0, reserved - 1) WHERE user_id = ? AND card = ?', userId, card);
}
function moveCopy(fromId, toId, card) {
  const t = now();
  run('UPDATE collection SET qty = qty - 1, reserved = MAX(0, reserved - 1) WHERE user_id = ? AND card = ?', fromId, card);
  run(`INSERT INTO collection (user_id, card, qty, first_at, last_at) VALUES (?,?,1,?,?)
       ON CONFLICT(user_id, card) DO UPDATE SET qty = qty + 1, last_at = excluded.last_at`, toId, card, t, t);
}

export function marketList({ card: n = null, seller = null, limit = 200 } = {}) {
  const card = n ? idOf(n) : null;
  let sql = `SELECT l.id, l.card, l.price, l.created_at, u.username AS seller, u.hue FROM listings l JOIN users u ON u.id = l.seller_id WHERE l.status = 'ACTIVE'`;
  const p = [];
  if (card) { sql += ' AND l.card = ?'; p.push(card); }
  if (seller) { sql += ' AND l.seller_id = ?'; p.push(seller); }
  sql += card ? ' ORDER BY l.price ASC' : ' ORDER BY l.id DESC';
  sql += ' LIMIT ?'; p.push(limit);
  return all(sql, ...p).map((l) => ({ ...l, card: nOf(l.card) })).filter((l) => l.card);
}
export function priceInfo(n) {
  const card = cardId(n);
  const g = game(n);
  const since = now() - 30 * 864e5;
  const sales = all(`SELECT price, closed_at FROM listings WHERE card = ? AND status = 'SOLD' AND closed_at > ? ORDER BY closed_at DESC LIMIT 50`, card, since);
  const sorted = sales.map((s) => s.price).sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
  const cheapest = one(`SELECT MIN(price) AS p FROM listings WHERE card = ? AND status = 'ACTIVE'`, card).p;
  const owners = one('SELECT COUNT(*) AS n FROM collection WHERE card = ? AND qty > 0', card).n;
  const copies = one('SELECT COALESCE(SUM(qty),0) AS n FROM collection WHERE card = ?', card).n;
  return { base: baseValue(g.n, g.r, TOTAL), median, cheapest, sales: sales.slice(0, 10), owners, copies, recycle: RARITY[g.r].recycle };
}
export function createListing(userId, n, price) {
  const card = cardId(n);
  price = Math.floor(Number(price));
  if (!(price >= ECONOMY.minPrice && price <= ECONOMY.maxPrice)) throw new HttpError(400, 'Prix invalide.');
  return tx(() => {
    const n = one(`SELECT COUNT(*) AS n FROM listings WHERE seller_id = ? AND status = 'ACTIVE'`, userId).n;
    if (n >= ECONOMY.maxListings) throw new HttpError(400, 'Tu as atteint le nombre maximum d’annonces actives.');
    reserveCopy(userId, card);
    const r = run('INSERT INTO listings (seller_id, card, price, created_at) VALUES (?,?,?,?)', userId, card, price, now());
    return { id: Number(r.lastInsertRowid) };
  });
}
export function cancelListing(userId, id) {
  return tx(() => {
    const l = one(`SELECT * FROM listings WHERE id = ? AND status = 'ACTIVE'`, id);
    if (!l || l.seller_id !== userId) throw new HttpError(404, 'Cette annonce est terminée.');
    run(`UPDATE listings SET status = 'CANCELLED', closed_at = ? WHERE id = ?`, now(), id);
    releaseCopy(userId, l.card);
    return { ok: true };
  });
}
export function buyListing(userId, id) {
  return tx(() => {
    const l = one(`SELECT * FROM listings WHERE id = ? AND status = 'ACTIVE'`, id);
    if (!l) throw new HttpError(404, 'Cette annonce est terminée.');
    if (l.seller_id === userId) throw new HttpError(400, 'C’est ta propre annonce.');
    const g = gameById(l.card);
    if (!g) throw new HttpError(410, 'Ce jeu n’est plus au catalogue.');
    credit(userId, -l.price, `Achat au marché : ${g.t}`);
    const fee = Math.ceil(l.price * ECONOMY.marketFee);
    credit(l.seller_id, l.price - fee, `Vente au marché : ${g.t}`);
    moveCopy(l.seller_id, userId, l.card);
    run(`UPDATE listings SET status = 'SOLD', buyer_id = ?, closed_at = ? WHERE id = ?`, userId, now(), id);
    addStat(userId, 'trade'); addStat(l.seller_id, 'trade');
    const buyer = one('SELECT username FROM users WHERE id = ?', userId).username;
    notify(l.seller_id, `${buyer} a acheté ${g.t} pour ${l.price} ◆ (${l.price - fee} ◆ reçus après frais).`, `/carte/${g.n}`);
    run('DELETE FROM wishes WHERE user_id = ? AND card = ?', userId, l.card);
    return { ok: true, card: g.n, user: me(userId) };
  });
}

// --- tableau des échanges -------------------------------------------------------------------------
export function offersList({ user = null, limit = 100 } = {}) {
  let sql = `SELECT o.id, o.give, o.wants, o.created_at, u.username, u.hue, o.user_id FROM offers o JOIN users u ON u.id = o.user_id WHERE o.status = 'OPEN'`;
  const p = [];
  if (user) { sql += ' AND o.user_id = ?'; p.push(user); }
  sql += ' ORDER BY o.id DESC LIMIT ?'; p.push(limit);
  return all(sql, ...p).map((o) => ({ ...o, give: nOf(o.give), wants: JSON.parse(o.wants).map(nOf).filter(Boolean) })).filter((o) => o.give && o.wants.length);
}
export function createOffer(userId, giveN, wantsN) {
  const give = cardId(giveN);
  const wants = [...new Set((Array.isArray(wantsN) ? wantsN : []).map(idOf).filter((id) => id && id !== give))].slice(0, 5);
  if (!wants.length) throw new HttpError(400, 'Choisis au moins une carte que tu acceptes en retour.');
  return tx(() => {
    const n = one(`SELECT COUNT(*) AS n FROM offers WHERE user_id = ? AND status = 'OPEN'`, userId).n;
    if (n >= ECONOMY.maxOffers) throw new HttpError(400, 'Tu as trop d’échanges en attente.');
    reserveCopy(userId, give);
    const r = run('INSERT INTO offers (user_id, give, wants, created_at) VALUES (?,?,?,?)', userId, give, JSON.stringify(wants), now());
    return { id: Number(r.lastInsertRowid) };
  });
}
export function cancelOffer(userId, id) {
  return tx(() => {
    const o = one(`SELECT * FROM offers WHERE id = ? AND status = 'OPEN'`, id);
    if (!o || o.user_id !== userId) throw new HttpError(404, 'Cet échange n’est plus en attente.');
    run(`UPDATE offers SET status = 'CANCELLED', closed_at = ? WHERE id = ?`, now(), id);
    releaseCopy(userId, o.give);
    return { ok: true };
  });
}
// Le preneur donne l'une des cartes demandées et reçoit la carte proposée, en un clic.
export function takeOffer(userId, id, giveBackN) {
  const giveBack = cardId(giveBackN);
  return tx(() => {
    const o = one(`SELECT * FROM offers WHERE id = ? AND status = 'OPEN'`, id);
    if (!o) throw new HttpError(404, 'Cet échange n’est plus en attente.');
    if (o.user_id === userId) throw new HttpError(400, 'C’est ta propre offre.');
    if (!JSON.parse(o.wants).includes(giveBack)) throw new HttpError(400, 'Cette carte ne fait pas partie de la demande.');
    reserveCopy(userId, giveBack);
    moveCopy(userId, o.user_id, giveBack);
    moveCopy(o.user_id, userId, o.give);
    run(`UPDATE offers SET status = 'DONE', taker_id = ?, got = ?, closed_at = ? WHERE id = ?`, userId, giveBack, now(), id);
    addStat(userId, 'trade'); addStat(o.user_id, 'trade');
    const taker = one('SELECT username FROM users WHERE id = ?', userId).username;
    notify(o.user_id, `Échange conclu ! ${taker} t’a donné ${gameById(giveBack).t} contre ${gameById(o.give)?.t || 'ta carte'}.`, `/carte/${nOf(giveBack)}`);
    run('DELETE FROM wishes WHERE user_id = ? AND card = ?', userId, o.give);
    run('DELETE FROM wishes WHERE user_id = ? AND card = ?', o.user_id, giveBack);
    return { ok: true, got: nOf(o.give), user: me(userId) };
  });
}

// Qui possède une carte (pour proposer un échange) — limité aux doublons libres
export function holders(n, limit = 20) {
  const card = cardId(n);
  return all(`SELECT u.username, u.hue, c.qty FROM collection c JOIN users u ON u.id = c.user_id
    WHERE c.card = ? AND c.qty > 0 ORDER BY c.qty DESC LIMIT ?`, card, limit);
}

export { GENRES };

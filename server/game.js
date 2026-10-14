// Services de jeu : portefeuille, cartes, boosters, marché, amis, échanges, gradation, missions.
// Toute mutation passe par tx() → atomique. Les routes HTTP (server/api.js) ne font qu'appeler ces fonctions.
import {
  ECONOMY, MISSIONS, LEVELS, GRADING, TRADES, TRADE_UP, RARITIES, DISCORD,
} from '../shared/config.js';
import { SKIN_BY_ID, SKINS, MODEL_BY_KEY } from '../shared/catalog.js';
import { PACK_BY_KEY } from '../shared/packs.js';
import { cardValue, wearOf } from '../shared/rules.js';
import { db, tx, one, all, run, now, today } from './db.js';
import { openPack, gradeCard, gradingFee, newSerial, rand, rollCard } from './cards.js';
import { randomInt } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (msg) => new HttpError(400, msg);

// ───────────────────────────── Portefeuille
export function credit(userId, amount, type, note = null) {
  amount = Math.round(amount);
  const u = one('SELECT balance FROM users WHERE id = ?', userId);
  const after = u.balance + amount;
  if (after < 0) throw bad('Solde insuffisant');
  run('UPDATE users SET balance = ? WHERE id = ?', after, userId);
  run('INSERT INTO transactions (user_id, type, amount, balance_after, note, at) VALUES (?,?,?,?,?,?)',
    userId, type, amount, after, note, now());
  return after;
}
export function addXp(userId, xp) { run('UPDATE users SET xp = xp + ? WHERE id = ?', xp, userId); }
export function levelOf(xp) {
  let lvl = 1;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) lvl = i + 1;
  const cur = LEVELS[lvl - 1] ?? 0; const next = LEVELS[lvl] ?? null;
  return { level: lvl, xp, cur, next };
}
export function notify(userId, text, link = null) {
  run('INSERT INTO notifications (user_id, text, link, at) VALUES (?,?,?,?)', userId, text, link, now());
}

// ───────────────────────────── Cartes
function popOf(skinId, grade) {
  return one("SELECT COUNT(*) n FROM cards WHERE skin_id = ? AND grade = ? AND status != 'BURNED'", skinId, grade).n;
}
export const rowToCard = (r) => ({ f: r.float, cx: r.cx, cy: r.cy, tr: r.tracker, foil: r.foil, mp: r.misprint, g: r.grade, pt: r.pattern });
export function valueOfRow(r) {
  const skin = SKIN_BY_ID.get(r.skin_id);
  return cardValue(rowToCard(r), skin, r.grade != null ? popOf(r.skin_id, r.grade) : null).value;
}
export function cardOut(r, extra = {}) {
  const skin = SKIN_BY_ID.get(r.skin_id);
  const card = rowToCard(r);
  const v = cardValue(card, skin, r.grade != null ? popOf(r.skin_id, r.grade) : null);
  return {
    id: r.id, serial: r.serial, s: r.skin_id, r: r.rarity, ...card,
    subs: r.subgrades ? JSON.parse(r.subgrades) : null, cert: r.cert,
    status: r.status, locked: !!r.locked, origin: r.origin, created_at: r.created_at,
    owner_id: r.owner_id, value: v.value, parts: v.parts, ...extra,
  };
}
export function insertCard(ownerId, c, origin) {
  const skin = SKIN_BY_ID.get(c.s);
  const res = run(`INSERT INTO cards (serial, skin_id, rarity, owner_id, float, cx, cy, tracker, foil, misprint, pattern, origin, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, newSerial(), c.s, skin.r, ownerId, c.f, c.cx, c.cy, c.tr, c.foil, c.mp, c.pt ?? null, origin, now());
  const id = Number(res.lastInsertRowid);
  run('INSERT INTO ownership (card_id, from_id, to_id, reason, at) VALUES (?,?,?,?,?)', id, null, ownerId, origin, now());
  return id;
}
function ownedCard(userId, cardId, statuses = ['OWNED']) {
  const r = one('SELECT * FROM cards WHERE id = ?', cardId);
  if (!r || r.owner_id !== userId) throw bad('Carte introuvable');
  if (!statuses.includes(r.status)) throw bad(`Carte indisponible (${r.status})`);
  return r;
}
function transferCard(cardId, fromId, toId, reason, price = null) {
  run("UPDATE cards SET owner_id = ?, status = 'OWNED', locked = 0 WHERE id = ?", toId, cardId);
  run('INSERT INTO ownership (card_id, from_id, to_id, reason, price, at) VALUES (?,?,?,?,?,?)', cardId, fromId, toId, reason, price, now());
  const r = one('SELECT skin_id FROM cards WHERE id = ?', cardId);
  discover(toId, r.skin_id);
  // une carte qui bouge invalide les échanges ouverts qui la contiennent
  for (const t of all("SELECT t.id FROM trades t JOIN trade_items i ON i.trade_id = t.id WHERE i.card_id = ? AND t.status = 'OPEN'", cardId)) {
    run("UPDATE trades SET status = 'FAILED', updated_at = ? WHERE id = ?", now(), t.id);
  }
}
function discover(userId, skinId) {
  const r = run('INSERT OR IGNORE INTO discovered (user_id, skin_id, at) VALUES (?,?,?)', userId, skinId, now());
  return r.changes > 0;
}

// ───────────────────────────── Missions & connexion quotidienne
export function bumpMission(userId, key, n = 1) {
  run(`INSERT INTO missions (user_id, day, key, progress) VALUES (?,?,?,?)
       ON CONFLICT(user_id, day, key) DO UPDATE SET progress = progress + excluded.progress`, userId, today(), key, n);
}
export function missionsOf(userId) {
  const rows = Object.fromEntries(all('SELECT key, progress, claimed FROM missions WHERE user_id = ? AND day = ?', userId, today()).map((r) => [r.key, r]));
  return MISSIONS.map((m) => ({ ...m, progress: Math.min(m.target, rows[m.key]?.progress ?? 0), claimed: !!rows[m.key]?.claimed }));
}
export function claimMission(userId, key) {
  return tx(() => {
    const m = MISSIONS.find((x) => x.key === key);
    if (!m) throw bad('Mission inconnue');
    const r = one('SELECT progress, claimed FROM missions WHERE user_id = ? AND day = ? AND key = ?', userId, today(), key);
    if (!r || r.progress < m.target) throw bad('Mission non terminée');
    if (r.claimed) throw bad('Déjà réclamée');
    run('UPDATE missions SET claimed = 1 WHERE user_id = ? AND day = ? AND key = ?', userId, today(), key);
    addXp(userId, ECONOMY.xp.mission);
    return credit(userId, m.reward, 'MISSION', m.fr);
  });
}
const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
export function dailyState(u) {
  const available = u.last_daily !== today();
  const nextStreak = u.last_daily === yesterday() ? u.streak + 1 : (available ? 1 : u.streak);
  const reward = ECONOMY.dailyStreak[Math.min(nextStreak, ECONOMY.dailyStreak.length) - 1];
  return { available, streak: available && u.last_daily !== yesterday() ? 0 : u.streak, nextStreak, reward, table: ECONOMY.dailyStreak };
}
export function claimDaily(userId) {
  return tx(() => {
    const u = one('SELECT * FROM users WHERE id = ?', userId);
    const d = dailyState(u);
    if (!d.available) throw bad('Récompense déjà réclamée aujourd’hui');
    run('UPDATE users SET streak = ?, last_daily = ? WHERE id = ?', d.nextStreak, today(), userId);
    return { balance: credit(userId, d.reward, 'DAILY', `Jour ${d.nextStreak}`), reward: d.reward, streak: d.nextStreak };
  });
}

// ───────────────────────────── Colis gratuits (stock qui se recharge)
export function syncFree(userId) {
  const u = one('SELECT free_stock, free_at FROM users WHERE id = ?', userId);
  const { intervalMs, maxStock } = ECONOMY.free;
  let stock = u.free_stock, at = u.free_at || now();
  if (stock >= maxStock) { at = now(); } else {
    const gained = Math.floor((now() - at) / intervalMs);
    if (gained > 0) { stock = Math.min(maxStock, stock + gained); at = stock >= maxStock ? now() : at + gained * intervalMs; }
  }
  run('UPDATE users SET free_stock = ?, free_at = ? WHERE id = ?', stock, at, userId);
  return { stock, max: maxStock, nextAt: stock >= maxStock ? null : at + intervalMs };
}

// ───────────────────────────── Boosters
export function openPacks(userId, key, count = 1) {
  const pack = PACK_BY_KEY[key];
  if (!pack) throw bad('Booster inconnu');
  count = Math.max(1, Math.min(10, Math.floor(Number(count) || 1)));
  return tx(() => {
    let u = one('SELECT * FROM users WHERE id = ?', userId);
    let welcomeUsed = 0;
    if (pack.free) {
      const f = syncFree(userId);
      if (f.stock < count) throw bad('Plus de colis gratuit disponible');
      // si le stock était plein, le compte à rebours démarre maintenant
      run('UPDATE users SET free_stock = free_stock - ?, free_at = CASE WHEN free_stock >= ? THEN ? ELSE free_at END WHERE id = ?',
        count, f.max, now(), userId);
    } else {
      if (key === 'standard') welcomeUsed = Math.min(count, u.welcome_packs);
      const toPay = (count - welcomeUsed) * pack.price;
      if (welcomeUsed) run('UPDATE users SET welcome_packs = welcome_packs - ? WHERE id = ?', welcomeUsed, userId);
      if (toPay) credit(userId, -toPay, 'PACK', `${count - welcomeUsed} × ${pack.fr}`);
    }
    const packsOut = [];
    let pity = { ultra: u.pity_ultra, legend: u.pity_legend };
    let newSkins = 0;
    for (let i = 0; i < count; i++) {
      const res = openPack(pack, pity, !pack.free);
      pity = res.pity;
      const cards = res.cards.map((c) => {
        const id = insertCard(userId, c, `PACK:${key}`);
        const isNew = discover(userId, c.s);
        if (isNew) newSkins++;
        const row = one('SELECT * FROM cards WHERE id = ?', id);
        if (row.rarity >= 3 || row.misprint) run('INSERT INTO feed (user_id, card_id, at) VALUES (?,?,?)', userId, id, now());
        return cardOut(row, { isNew });
      });
      packsOut.push({ cards, pityTriggered: res.pityTriggered });
    }
    run('UPDATE users SET pity_ultra = ?, pity_legend = ?, packs_opened = packs_opened + ? WHERE id = ?', pity.ultra, pity.legend, count, userId);
    addXp(userId, ECONOMY.xp.pack * count);
    if (!pack.free) bumpMission(userId, 'open5', count);
    if (newSkins) bumpMission(userId, 'new3', newSkins);
    u = one('SELECT balance, welcome_packs, pity_ultra, pity_legend FROM users WHERE id = ?', userId);
    return { packs: packsOut, balance: u.balance, welcomePacks: u.welcome_packs, pity: { ultra: u.pity_ultra, legend: u.pity_legend }, welcomeUsed };
  });
}

// ───────────────────────────── Inventaire
export function sellToSystem(userId, ids) {
  if (!Array.isArray(ids) || !ids.length) throw bad('Aucune carte');
  return tx(() => {
    let total = 0;
    for (const id of ids) {
      const r = ownedCard(userId, Number(id));
      total += Math.max(1, Math.floor(valueOfRow(r) * ECONOMY.sellToSystemRate));
      run("UPDATE cards SET status = 'BURNED' WHERE id = ?", r.id);
      run('INSERT INTO ownership (card_id, from_id, to_id, reason, at) VALUES (?,?,?,?,?)', r.id, userId, null, 'SYSTEM_SELL', now());
    }
    return { total, balance: credit(userId, total, 'SELL_SYSTEM', `${ids.length} carte(s)`) };
  });
}
export function setLocked(userId, id, locked) {
  ownedCard(userId, Number(id), ['OWNED', 'LISTED', 'GRADING']);
  run('UPDATE cards SET locked = ? WHERE id = ?', locked ? 1 : 0, id);
}
export function setShowcase(userId, ids) {
  ids = (ids || []).slice(0, 6).map(Number);
  for (const id of ids) ownedCard(userId, id, ['OWNED', 'LISTED', 'GRADING']);
  run('UPDATE users SET showcase = ? WHERE id = ?', JSON.stringify(ids), userId);
}
export function cardDetail(id) {
  const r = one('SELECT * FROM cards WHERE id = ? OR serial = ?', Number(id) || -1, String(id));
  if (!r) throw new HttpError(404, 'Carte introuvable');
  const owner = one('SELECT id, username, avatar_hue FROM users WHERE id = ?', r.owner_id);
  const history = all(`SELECT o.reason, o.price, o.at, f.username AS from_name, t.username AS to_name FROM ownership o
    LEFT JOIN users f ON f.id = o.from_id LEFT JOIN users t ON t.id = o.to_id WHERE o.card_id = ? ORDER BY o.id DESC LIMIT 30`, r.id);
  const listing = one("SELECT id, price FROM listings WHERE card_id = ? AND status = 'ACTIVE'", r.id);
  const sales = all('SELECT price, at FROM sales WHERE skin_id = ? ORDER BY at DESC LIMIT 40', r.skin_id).reverse();
  const population = all("SELECT grade, COUNT(*) n FROM cards WHERE skin_id = ? AND grade IS NOT NULL AND status != 'BURNED' GROUP BY grade ORDER BY grade DESC", r.skin_id);
  const copies = one("SELECT COUNT(*) n FROM cards WHERE skin_id = ? AND status != 'BURNED'", r.skin_id).n;
  return { card: cardOut(r), owner, history, listing, sales, population, copies };
}

// ───────────────────────────── Trade-up (contrat) : 10 cartes de rareté N → 1 carte N+1
export function tradeUp(userId, ids) {
  ids = [...new Set((ids || []).map(Number))];
  if (ids.length !== TRADE_UP.inputCount) throw bad(`Il faut exactement ${TRADE_UP.inputCount} cartes`);
  return tx(() => {
    const rows = ids.map((id) => ownedCard(userId, id));
    const r = rows[0].rarity;
    if (rows.some((x) => x.rarity !== r)) throw bad('Toutes les cartes doivent avoir la même rareté');
    if (r > TRADE_UP.maxInputRarity) throw bad('Rareté maximale atteinte');
    if (rows.some((x) => x.grade != null)) throw bad('Les cartes gradées ne peuvent pas entrer dans un contrat');
    credit(userId, -TRADE_UP.cost, 'TRADE_UP', 'Contrat');
    for (const x of rows) {
      run("UPDATE cards SET status = 'BURNED' WHERE id = ?", x.id);
      run('INSERT INTO ownership (card_id, from_id, to_id, reason, at) VALUES (?,?,?,?,?)', x.id, userId, null, 'TRADE_UP', now());
    }
    const src = SKIN_BY_ID.get(rows[randomInt(0, rows.length)].skin_id);
    const c = rollCard(r + 1, { classes: [src.cls] });
    const skin = SKIN_BY_ID.get(c.s);
    const avg = rows.reduce((a, x) => a + x.float, 0) / rows.length;
    c.f = Math.round((skin.fmin + avg * (skin.fmax - skin.fmin)) * 1e6) / 1e6;
    const id = insertCard(userId, c, 'TRADE_UP');
    discover(userId, c.s);
    addXp(userId, 20);
    if (r + 1 >= 3) run('INSERT INTO feed (user_id, card_id, at) VALUES (?,?,?)', userId, id, now());
    return cardOut(one('SELECT * FROM cards WHERE id = ?', id));
  });
}

// ───────────────────────────── Marché
export function createListing(userId, cardId, price) {
  price = Math.floor(Number(price));
  return tx(() => {
    const r = ownedCard(userId, Number(cardId));
    const v = valueOfRow(r);
    const min = Math.max(1, Math.floor(v * ECONOMY.priceFloorMult));
    const max = Math.max(10, Math.ceil(v * ECONOMY.priceCapMult));
    if (!(price >= min && price <= max)) throw bad(`Prix autorisé : ${min} – ${max}`);
    const n = one("SELECT COUNT(*) n FROM listings WHERE seller_id = ? AND status = 'ACTIVE'", userId).n;
    if (n >= ECONOMY.maxListings) throw bad(`Maximum ${ECONOMY.maxListings} annonces actives`);
    run("UPDATE cards SET status = 'LISTED' WHERE id = ?", r.id);
    const res = run('INSERT INTO listings (card_id, seller_id, price, created_at) VALUES (?,?,?,?)', r.id, userId, price, now());
    for (const t of all("SELECT t.id FROM trades t JOIN trade_items i ON i.trade_id = t.id WHERE i.card_id = ? AND t.status = 'OPEN'", r.id)) {
      run("UPDATE trades SET status = 'FAILED', updated_at = ? WHERE id = ?", now(), t.id);
    }
    return Number(res.lastInsertRowid);
  });
}
export function cancelListing(userId, listingId) {
  return tx(() => {
    const l = one("SELECT * FROM listings WHERE id = ? AND status = 'ACTIVE'", Number(listingId));
    if (!l || l.seller_id !== userId) throw bad('Annonce introuvable');
    run("UPDATE listings SET status = 'CANCELLED' WHERE id = ?", l.id);
    run("UPDATE cards SET status = 'OWNED' WHERE id = ?", l.card_id);
  });
}
export function buyListing(userId, listingId) {
  return tx(() => {
    const l = one("SELECT * FROM listings WHERE id = ? AND status = 'ACTIVE'", Number(listingId));
    if (!l) throw bad('Annonce déjà vendue ou retirée');
    if (l.seller_id === userId) throw bad('C’est votre propre annonce');
    credit(userId, -l.price, 'MARKET_BUY', `Annonce #${l.id}`);
    const fee = Math.ceil(l.price * ECONOMY.marketFee);
    credit(l.seller_id, l.price - fee, 'MARKET_SELL', `Annonce #${l.id} (frais ${fee})`);
    run("UPDATE listings SET status = 'SOLD', buyer_id = ?, sold_at = ? WHERE id = ?", userId, now(), l.id);
    transferCard(l.card_id, l.seller_id, userId, 'MARKET', l.price);
    const card = one('SELECT * FROM cards WHERE id = ?', l.card_id);
    run('INSERT INTO sales (skin_id, price, at) VALUES (?,?,?)', card.skin_id, l.price, now());
    addXp(userId, ECONOMY.xp.sale); addXp(l.seller_id, ECONOMY.xp.sale);
    bumpMission(userId, 'market1'); bumpMission(l.seller_id, 'market1');
    const buyer = one('SELECT username FROM users WHERE id = ?', userId);
    notify(l.seller_id, `${buyer.username} a acheté ${skinName(card.skin_id)} pour ${l.price} ¢ (vous recevez ${l.price - fee} ¢)`, `#/card/${card.id}`);
    return cardOut(card);
  });
}
export const skinName = (id) => { const s = SKIN_BY_ID.get(id); return `${MODEL_BY_KEY[s.m].name} | ${s.n}`; };

export function browseMarket(qs, viewerId) {
  const where = ["l.status = 'ACTIVE'"]; const p = [];
  const skinFilter = [];
  if (qs.r !== undefined && qs.r !== '') { where.push('c.rarity = ?'); p.push(Number(qs.r)); }
  if (qs.foil === '1') where.push('c.foil = 1');
  if (qs.graded === '1') where.push('c.grade IS NOT NULL');
  if (qs.misprint === '1') where.push('c.misprint IS NOT NULL');
  if (qs.tracker === '1') where.push('c.tracker IS NOT NULL');
  if (qs.fmin) { where.push('c.float >= ?'); p.push(Number(qs.fmin)); }
  if (qs.fmax) { where.push('c.float <= ?'); p.push(Number(qs.fmax)); }
  if (qs.pmin) { where.push('l.price >= ?'); p.push(Number(qs.pmin)); }
  if (qs.pmax) { where.push('l.price <= ?'); p.push(Number(qs.pmax)); }
  if (qs.mine === '1') { where.push('l.seller_id = ?'); p.push(viewerId); }
  if (qs.model || qs.cls || qs.q) {
    const needle = (qs.q || '').toLowerCase();
    for (const s of SKINS) {
      if (qs.model && s.m !== qs.model) continue;
      if (qs.cls && s.cls !== qs.cls) continue;
      if (needle && !`${MODEL_BY_KEY[s.m].name} ${s.n}`.toLowerCase().includes(needle)) continue;
      skinFilter.push(s.id);
    }
    if (!skinFilter.length) return { items: [], total: 0 };
    where.push(`c.skin_id IN (${skinFilter.map(() => '?').join(',')})`); p.push(...skinFilter);
  }
  const order = { price_asc: 'l.price ASC', price_desc: 'l.price DESC', float: 'c.float ASC', rarity: 'c.rarity DESC, l.price DESC' }[qs.sort] || 'l.id DESC';
  const page = Math.max(0, Number(qs.page) || 0); const per = 36;
  const sql = `FROM listings l JOIN cards c ON c.id = l.card_id JOIN users u ON u.id = l.seller_id WHERE ${where.join(' AND ')}`;
  const total = db.prepare(`SELECT COUNT(*) n ${sql}`).get(...p).n;
  const rows = db.prepare(`SELECT c.*, l.id AS listing_id, l.price, l.created_at AS listed_at, u.username AS seller, u.is_bot ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...p, per, page * per);
  return {
    total, per,
    items: rows.map((r) => cardOut(r, { listing: { id: r.listing_id, price: r.price, at: r.listed_at, seller: r.seller, sellerId: r.owner_id } })),
  };
}

// ───────────────────────────── Amis
const pair = (x, y) => (x < y ? [x, y] : [y, x]);
export function friendStatus(me, other) {
  const [a, b] = pair(me, other);
  const f = one('SELECT * FROM friends WHERE a = ? AND b = ?', a, b);
  if (!f) return 'NONE';
  if (f.status === 'ACCEPTED') return 'FRIENDS';
  return f.requester === me ? 'SENT' : 'RECEIVED';
}
export function requestFriend(me, username) {
  const o = one('SELECT id, username, is_bot FROM users WHERE username = ?', String(username || '').trim());
  if (!o) throw bad('Joueur introuvable');
  if (o.id === me) throw bad('C’est vous !');
  if (o.is_bot) throw bad('Ce joueur n’accepte pas les demandes');
  return tx(() => {
    const st = friendStatus(me, o.id);
    if (st === 'FRIENDS') throw bad('Déjà amis');
    if (st === 'SENT') throw bad('Demande déjà envoyée');
    const [a, b] = pair(me, o.id);
    if (st === 'RECEIVED') { run("UPDATE friends SET status = 'ACCEPTED' WHERE a = ? AND b = ?", a, b); return 'FRIENDS'; }
    run('INSERT INTO friends (a, b, requester, created_at) VALUES (?,?,?,?)', a, b, me, now());
    const meName = one('SELECT username FROM users WHERE id = ?', me).username;
    notify(o.id, `${meName} vous a envoyé une demande d’ami`, '#/friends');
    return 'SENT';
  });
}
export function respondFriend(me, otherId, accept) {
  otherId = Number(otherId);
  const [a, b] = pair(me, otherId);
  const f = one('SELECT * FROM friends WHERE a = ? AND b = ?', a, b);
  if (!f) throw bad('Aucune demande');
  if (accept) {
    if (f.status !== 'PENDING' || f.requester === me) throw bad('Rien à accepter');
    run("UPDATE friends SET status = 'ACCEPTED' WHERE a = ? AND b = ?", a, b);
    const meName = one('SELECT username FROM users WHERE id = ?', me).username;
    notify(otherId, `${meName} a accepté votre demande d’ami`, '#/friends');
  } else {
    run('DELETE FROM friends WHERE a = ? AND b = ?', a, b);
  }
}
export function listFriends(me) {
  const rows = all(`SELECT f.*, u.id AS uid, u.username, u.avatar_hue, u.xp, u.last_seen, u.discord_verified_at FROM friends f
    JOIN users u ON u.id = CASE WHEN f.a = ? THEN f.b ELSE f.a END WHERE f.a = ? OR f.b = ? ORDER BY u.last_seen DESC`, me, me, me);
  const out = { friends: [], incoming: [], outgoing: [] };
  for (const r of rows) {
    const u = { id: r.uid, username: r.username, avatar_hue: r.avatar_hue, level: levelOf(r.xp).level, online: now() - r.last_seen < 5 * 60e3, verified: !!r.discord_verified_at };
    if (r.status === 'ACCEPTED') out.friends.push(u);
    else if (r.requester === me) out.outgoing.push(u);
    else out.incoming.push(u);
  }
  return out;
}

// ───────────────────────────── Échanges (entre amis)
export function createTrade(me, { toId, give = [], take = [], creditsFrom = 0, creditsTo = 0, message = '' }) {
  toId = Number(toId);
  give = [...new Set(give.map(Number))]; take = [...new Set(take.map(Number))];
  creditsFrom = Math.max(0, Math.floor(Number(creditsFrom) || 0));
  creditsTo = Math.max(0, Math.floor(Number(creditsTo) || 0));
  if (friendStatus(me, toId) !== 'FRIENDS') throw bad('Vous ne pouvez échanger qu’avec vos amis');
  if (!give.length && !take.length && !creditsFrom && !creditsTo) throw bad('Échange vide');
  if (give.length > TRADES.maxCardsPerSide || take.length > TRADES.maxCardsPerSide) throw bad(`Maximum ${TRADES.maxCardsPerSide} cartes par côté`);
  if (creditsFrom > TRADES.maxCredits || creditsTo > TRADES.maxCredits) throw bad('Montant trop élevé');
  return tx(() => {
    const open = one("SELECT COUNT(*) n FROM trades WHERE from_id = ? AND status = 'OPEN'", me).n;
    if (open >= TRADES.maxOpenPerUser) throw bad('Trop d’échanges en attente');
    for (const id of give) ownedCard(me, id);
    for (const id of take) ownedCard(toId, id);
    if (one('SELECT balance FROM users WHERE id = ?', me).balance < creditsFrom) throw bad('Solde insuffisant');
    const t = now();
    const res = run('INSERT INTO trades (from_id, to_id, credits_from, credits_to, message, created_at, updated_at) VALUES (?,?,?,?,?,?,?)',
      me, toId, creditsFrom, creditsTo, String(message).slice(0, 200), t, t);
    const id = Number(res.lastInsertRowid);
    for (const c of give) run('INSERT INTO trade_items (trade_id, card_id, side) VALUES (?,?,?)', id, c, 'from');
    for (const c of take) run('INSERT INTO trade_items (trade_id, card_id, side) VALUES (?,?,?)', id, c, 'to');
    const meName = one('SELECT username FROM users WHERE id = ?', me).username;
    notify(toId, `${meName} vous propose un échange`, `#/trades/${id}`);
    return id;
  });
}
export function tradeDetail(me, id) {
  const t = one('SELECT * FROM trades WHERE id = ?', Number(id));
  if (!t || (t.from_id !== me && t.to_id !== me)) throw new HttpError(404, 'Échange introuvable');
  const items = all('SELECT i.side, c.* FROM trade_items i JOIN cards c ON c.id = i.card_id WHERE i.trade_id = ?', t.id);
  const users = Object.fromEntries(all('SELECT id, username, avatar_hue FROM users WHERE id IN (?, ?)', t.from_id, t.to_id).map((u) => [u.id, u]));
  return {
    ...t, from: users[t.from_id], to: users[t.to_id],
    give: items.filter((i) => i.side === 'from').map((r) => cardOut(r)),
    take: items.filter((i) => i.side === 'to').map((r) => cardOut(r)),
  };
}
export function listTrades(me) {
  return all(`SELECT t.*, f.username AS from_name, o.username AS to_name,
      (SELECT COUNT(*) FROM trade_items i WHERE i.trade_id = t.id AND i.side = 'from') AS n_give,
      (SELECT COUNT(*) FROM trade_items i WHERE i.trade_id = t.id AND i.side = 'to') AS n_take
    FROM trades t JOIN users f ON f.id = t.from_id JOIN users o ON o.id = t.to_id
    WHERE t.from_id = ? OR t.to_id = ? ORDER BY (t.status = 'OPEN') DESC, t.updated_at DESC LIMIT 60`, me, me);
}
export function respondTrade(me, id, action) {
  return tx(() => {
    const t = one("SELECT * FROM trades WHERE id = ? AND status = 'OPEN'", Number(id));
    if (!t) throw bad('Échange introuvable ou clos');
    if (action === 'cancel') {
      if (t.from_id !== me) throw bad('Seul l’initiateur peut annuler');
      run("UPDATE trades SET status = 'CANCELLED', updated_at = ? WHERE id = ?", now(), t.id); return 'CANCELLED';
    }
    if (t.to_id !== me) throw bad('Seul le destinataire peut répondre');
    if (action === 'decline') {
      run("UPDATE trades SET status = 'DECLINED', updated_at = ? WHERE id = ?", now(), t.id);
      notify(t.from_id, 'Votre proposition d’échange a été refusée', `#/trades/${t.id}`); return 'DECLINED';
    }
    if (action !== 'accept') throw bad('Action inconnue');
    if (friendStatus(t.from_id, t.to_id) !== 'FRIENDS') throw bad('Vous n’êtes plus amis');
    const items = all('SELECT * FROM trade_items WHERE trade_id = ?', t.id);
    for (const i of items) ownedCard(i.side === 'from' ? t.from_id : t.to_id, i.card_id);
    if (t.credits_from) { credit(t.from_id, -t.credits_from, 'TRADE', `Échange #${t.id}`); credit(t.to_id, t.credits_from, 'TRADE', `Échange #${t.id}`); }
    if (t.credits_to) { credit(t.to_id, -t.credits_to, 'TRADE', `Échange #${t.id}`); credit(t.from_id, t.credits_to, 'TRADE', `Échange #${t.id}`); }
    run("UPDATE trades SET status = 'DONE', updated_at = ? WHERE id = ?", now(), t.id);
    for (const i of items) {
      const [from, to] = i.side === 'from' ? [t.from_id, t.to_id] : [t.to_id, t.from_id];
      transferCard(i.card_id, from, to, 'TRADE');
    }
    notify(t.from_id, 'Votre échange a été accepté !', `#/trades/${t.id}`);
    return 'DONE';
  });
}

// ───────────────────────────── Gradation
export function submitGrading(me, ids, service) {
  const svc = GRADING.services[service];
  if (!svc) throw bad('Service inconnu');
  ids = [...new Set((ids || []).map(Number))];
  if (!ids.length || ids.length > GRADING.maxPerOrder) throw bad(`1 à ${GRADING.maxPerOrder} cartes`);
  return tx(() => {
    let fee = 0;
    for (const id of ids) {
      const r = ownedCard(me, id);
      if (r.grade != null) throw bad('Carte déjà gradée');
      fee += gradingFee(service, valueOfRow(r));
    }
    credit(me, -fee, 'GRADING', `${ids.length} carte(s) – ${svc.fr}`);
    const res = run('INSERT INTO grading_orders (user_id, service, fee, ready_at, created_at) VALUES (?,?,?,?,?)', me, service, fee, now() + svc.delayMs, now());
    const oid = Number(res.lastInsertRowid);
    for (const id of ids) {
      run('INSERT INTO grading_items (order_id, card_id) VALUES (?,?)', oid, id);
      run("UPDATE cards SET status = 'GRADING' WHERE id = ?", id);
      for (const t of all("SELECT t.id FROM trades t JOIN trade_items i ON i.trade_id = t.id WHERE i.card_id = ? AND t.status = 'OPEN'", id)) {
        run("UPDATE trades SET status = 'FAILED', updated_at = ? WHERE id = ?", now(), t.id);
      }
    }
    return { orderId: oid, fee };
  });
}
export function gradingQuote(me, ids, service) {
  const svc = GRADING.services[service];
  if (!svc) throw bad('Service inconnu');
  let fee = 0;
  for (const id of ids || []) fee += gradingFee(service, valueOfRow(ownedCard(me, Number(id))));
  return { fee };
}
export function listGrading(me) {
  return all('SELECT * FROM grading_orders WHERE user_id = ? ORDER BY id DESC LIMIT 30', me).map((o) => ({
    ...o,
    cards: all('SELECT c.* FROM grading_items i JOIN cards c ON c.id = i.card_id WHERE i.order_id = ?', o.id).map((r) => cardOut(r)),
  }));
}
let certCounter = null;
function nextCert() {
  if (certCounter == null) certCounter = Number(one("SELECT v FROM meta WHERE k = 'cert'")?.v || 0);
  certCounter++;
  run("INSERT INTO meta (k, v) VALUES ('cert', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", String(certCounter));
  return `MGG-${new Date().getFullYear()}-${String(certCounter).padStart(6, '0')}`;
}
export function revealGrading(me, orderId) {
  return tx(() => {
    const o = one("SELECT * FROM grading_orders WHERE id = ? AND user_id = ? AND status = 'PENDING'", Number(orderId), me);
    if (!o) throw bad('Commande introuvable ou déjà révélée');
    if (o.ready_at > now()) throw bad('Pas encore prêt');
    const out = [];
    for (const { card_id } of all('SELECT card_id FROM grading_items WHERE order_id = ?', o.id)) {
      const r = one('SELECT * FROM cards WHERE id = ?', card_id);
      const before = valueOfRow(r);
      const { subs, grade } = gradeCard(rowToCard(r));
      run("UPDATE cards SET grade = ?, subgrades = ?, cert = ?, status = 'OWNED' WHERE id = ?", grade, JSON.stringify(subs), nextCert(), r.id);
      out.push({ ...cardOut(one('SELECT * FROM cards WHERE id = ?', r.id)), before });
    }
    run("UPDATE grading_orders SET status = 'DONE' WHERE id = ?", o.id);
    addXp(me, ECONOMY.xp.grade * out.length);
    return out;
  });
}
export function unslab(me, id) {
  return tx(() => {
    const r = ownedCard(me, Number(id));
    if (r.grade == null) throw bad('Carte non gradée');
    run('UPDATE cards SET grade = NULL, subgrades = NULL, cert = NULL WHERE id = ?', r.id);
    return cardOut(one('SELECT * FROM cards WHERE id = ?', r.id));
  });
}
export function certLookup(cert) {
  const r = one('SELECT id FROM cards WHERE cert = ?', String(cert).toUpperCase());
  if (!r) throw new HttpError(404, 'Certificat inconnu');
  return cardDetail(r.id);
}

// ───────────────────────────── Discord
export function verifyDiscord(me, discordId, discordName) {
  return tx(() => {
    const taken = one('SELECT id FROM users WHERE discord_id = ? AND id != ?', discordId, me);
    if (taken) throw bad('Ce compte Discord est déjà lié à un autre joueur');
    const u = one('SELECT discord_verified_at FROM users WHERE id = ?', me);
    run('UPDATE users SET discord_id = ?, discord_name = ?, discord_verified_at = ? WHERE id = ?', discordId, discordName, now(), me);
    if (!u.discord_verified_at && DISCORD.verifyBonus) credit(me, DISCORD.verifyBonus, 'BONUS', 'Vérification Discord');
  });
}

// ───────────────────────────── Profil, classements, flux
export function userCardsValue(userId) {
  let total = 0;
  for (const r of all("SELECT * FROM cards WHERE owner_id = ? AND status != 'BURNED'", userId)) total += valueOfRow(r);
  return total;
}
let lbCache = { at: 0, data: null };
export function leaderboards() {
  if (now() - lbCache.at < 60e3 && lbCache.data) return lbCache.data;
  const users = all('SELECT id, username, avatar_hue, xp, is_bot FROM users');
  const byUser = new Map(users.map((u) => [u.id, { ...u, value: 0, best: 0, bestCard: null }]));
  for (const r of all("SELECT * FROM cards WHERE status != 'BURNED'")) {
    const u = byUser.get(r.owner_id); if (!u) continue;
    const v = valueOfRow(r); u.value += v;
    if (v > u.best) { u.best = v; u.bestCard = r; }
  }
  const disc = Object.fromEntries(all('SELECT user_id, COUNT(*) n FROM discovered GROUP BY user_id').map((r) => [r.user_id, r.n]));
  const list = [...byUser.values()].map((u) => ({
    id: u.id, username: u.username, avatar_hue: u.avatar_hue, bot: !!u.is_bot, level: levelOf(u.xp).level,
    value: u.value, best: u.best, bestCard: u.bestCard ? cardOut(u.bestCard) : null, discovered: disc[u.id] || 0,
  }));
  const top = (k) => [...list].sort((a, b) => b[k] - a[k]).slice(0, 25);
  lbCache = { at: now(), data: { value: top('value'), best: top('best'), discovered: top('discovered'), level: top('level') } };
  return lbCache.data;
}
export function publicProfile(username, viewerId) {
  const u = one('SELECT * FROM users WHERE username = ?', String(username));
  if (!u) throw new HttpError(404, 'Joueur introuvable');
  const ids = JSON.parse(u.showcase || '[]');
  const showcase = ids.map((id) => one("SELECT * FROM cards WHERE id = ? AND owner_id = ? AND status != 'BURNED'", id, u.id)).filter(Boolean).map((r) => cardOut(r));
  const count = one("SELECT COUNT(*) n FROM cards WHERE owner_id = ? AND status != 'BURNED'", u.id).n;
  const discovered = one('SELECT COUNT(*) n FROM discovered WHERE user_id = ?', u.id).n;
  const byRarity = all("SELECT rarity, COUNT(*) n FROM cards WHERE owner_id = ? AND status != 'BURNED' GROUP BY rarity", u.id);
  return {
    id: u.id, username: u.username, avatar_hue: u.avatar_hue, bio: u.bio, bot: !!u.is_bot,
    level: levelOf(u.xp), created_at: u.created_at, online: now() - u.last_seen < 5 * 60e3,
    verified: !!u.discord_verified_at, discord_name: u.discord_verified_at ? u.discord_name : null,
    packs_opened: u.packs_opened, count, discovered, total: SKINS.length, byRarity,
    value: userCardsValue(u.id), showcase,
    friend: viewerId ? (viewerId === u.id ? 'SELF' : friendStatus(viewerId, u.id)) : null,
  };
}
export function feed(limit = 30) {
  return all(`SELECT f.at, u.username, u.is_bot, c.* FROM feed f JOIN users u ON u.id = f.user_id JOIN cards c ON c.id = f.card_id
    ORDER BY f.id DESC LIMIT ?`, limit).map((r) => ({ at: r.at, username: r.username, card: cardOut(r) }));
}
export function siteStats() {
  return {
    players: one('SELECT COUNT(*) n FROM users WHERE is_bot = 0').n,
    cards: one("SELECT COUNT(*) n FROM cards WHERE status != 'BURNED'").n,
    listings: one("SELECT COUNT(*) n FROM listings WHERE status = 'ACTIVE'").n,
    skins: SKINS.length,
  };
}

export { PACK_BY_KEY, RARITIES, rand, wearOf };

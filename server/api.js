// Routes HTTP : fines, elles valident l'accès puis délèguent à server/game.js.
import express from 'express';
import { ECONOMY, PITY } from '../shared/config.js';
import { one, all, run } from './db.js';
import * as G from './game.js';
import { createUser, createSession, destroySession, checkPassword, requireUser, rateLimit } from './auth.js';
import { mountDiscord, discordMode, requireVerified, assertVerified } from './discord.js';

const { HttpError } = G;

function me(u) {
  const free = G.syncFree(u.id);
  u = one('SELECT * FROM users WHERE id = ?', u.id);
  return {
    id: u.id, username: u.username, email: u.email, balance: u.balance, avatar_hue: u.avatar_hue, bio: u.bio,
    level: G.levelOf(u.xp), welcomePacks: u.welcome_packs, free,
    pity: { ultra: u.pity_ultra, legend: u.pity_legend, trans: u.pity_trans, ultraAfter: PITY.ultraAfter, legendaryAfter: PITY.legendaryAfter, transAfter: PITY.transcendentAfter },
    daily: G.dailyState(u), packs_opened: u.packs_opened, showcase: JSON.parse(u.showcase),
    discord: { mode: discordMode(), verified: !!u.discord_verified_at, name: u.discord_name },
    unread: one('SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND read = 0', u.id).n,
    openTrades: one("SELECT COUNT(*) n FROM trades WHERE to_id = ? AND status = 'OPEN'", u.id).n,
    friendRequests: one("SELECT COUNT(*) n FROM friends WHERE (a = ? OR b = ?) AND status = 'PENDING' AND requester != ?", u.id, u.id, u.id).n,
    questsReady: G.questsReady(u.id),
    gradingReady: one("SELECT COUNT(*) n FROM grading_orders WHERE user_id = ? AND status = 'PENDING' AND ready_at <= ?", u.id, Date.now()).n,
  };
}

export function api() {
  const r = express.Router();
  r.use(express.json({ limit: '64kb' }));
  // Anti-CSRF : un formulaire d'un autre site ne peut pas envoyer de JSON → toute écriture exige ce type
  r.use((req, _res, next) => {
    if (req.method !== 'GET' && !req.is('application/json')) return next(new HttpError(415, 'Requête JSON attendue'));
    next();
  });

  // ── Auth
  r.post('/auth/register', rateLimit(8, 60 * 60e3), (req, res) => {
    const { username, email, password } = req.body || {};
    const id = createUser({ username, email: email || null, password });
    createSession(res, id);
    res.json(me(one('SELECT * FROM users WHERE id = ?', id)));
  });
  r.post('/auth/login', rateLimit(15, 15 * 60e3), (req, res) => {
    const { login, password } = req.body || {};
    const u = one('SELECT * FROM users WHERE (username = ? OR email = ?) AND is_bot = 0', String(login || ''), String(login || ''));
    if (!u || !checkPassword(String(password || ''), u.pass_hash)) throw new HttpError(401, 'Identifiants incorrects');
    createSession(res, u.id);
    res.json(me(u));
  });
  r.post('/auth/logout', (req, res) => { destroySession(req, res); res.json({ ok: true }); });
  r.get('/me', (req, res) => res.json(req.user ? me(req.user) : null));
  r.patch('/me', requireUser, (req, res) => {
    const { bio, avatar_hue } = req.body || {};
    if (bio !== undefined) run('UPDATE users SET bio = ? WHERE id = ?', String(bio).slice(0, 160), req.user.id);
    if (avatar_hue !== undefined) run('UPDATE users SET avatar_hue = ? WHERE id = ?', Math.abs(Number(avatar_hue) | 0) % 360, req.user.id);
    res.json(me(req.user));
  });
  mountDiscord(r, requireUser);

  // ── Public
  r.get('/feed', (_req, res) => res.json(G.feed(30)));
  r.get('/stats', (_req, res) => res.json(G.siteStats()));
  r.get('/leaderboards', (_req, res) => res.json(G.leaderboards()));
  r.get('/users/:name', (req, res) => res.json(G.publicProfile(req.params.name, req.user?.id)));
  r.get('/users/:name/cards', (req, res) => {
    const u = one('SELECT id FROM users WHERE username = ?', req.params.name);
    if (!u) throw new HttpError(404, 'Joueur introuvable');
    const rows = all("SELECT * FROM cards WHERE owner_id = ? AND status = 'OWNED' ORDER BY rarity DESC, id DESC LIMIT 400", u.id);
    res.json(rows.map((x) => G.cardOut(x)));
  });
  r.get('/cards/:id', (req, res) => res.json(G.cardDetail(req.params.id)));
  r.get('/cert/:cert', (req, res) => res.json(G.certLookup(req.params.cert)));
  r.get('/market', (req, res) => res.json(G.browseMarket(req.query, req.user?.id)));
  r.get('/skins/:id/market', (req, res) => {
    const rows = all(`SELECT c.*, l.id AS listing_id, l.price, u.username AS seller FROM listings l JOIN cards c ON c.id = l.card_id
      JOIN users u ON u.id = l.seller_id WHERE l.status = 'ACTIVE' AND c.skin_id = ? ORDER BY l.price LIMIT 30`, req.params.id);
    const sales = all('SELECT price, at FROM sales WHERE skin_id = ? ORDER BY at DESC LIMIT 40', req.params.id).reverse();
    const copies = one("SELECT COUNT(*) n FROM cards WHERE skin_id = ? AND status != 'BURNED'", req.params.id).n;
    res.json({ listings: rows.map((x) => G.cardOut(x, { listing: { id: x.listing_id, price: x.price, seller: x.seller } })), sales, copies });
  });

  // ── Joueur connecté
  r.use(requireUser);
  r.post('/daily', (req, res) => res.json(G.claimDaily(req.user.id)));
  r.get('/missions', (req, res) => res.json(G.missionsOf(req.user.id)));
  r.post('/missions/:key/claim', (req, res) => res.json({ balance: G.claimMission(req.user.id, req.params.key) }));
  r.get('/notifications', (req, res) => {
    const rows = all('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 40', req.user.id);
    run('UPDATE notifications SET read = 1 WHERE user_id = ?', req.user.id);
    res.json(rows);
  });
  r.get('/transactions', (req, res) => res.json(all('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 100', req.user.id)));

  r.post('/packs/:key/open', (req, res) => res.json(G.openPacks(req.user.id, req.params.key, req.body?.count)));

  r.get('/inventory', (req, res) => {
    const rows = all("SELECT c.*, l.id AS listing_id, l.price AS listing_price FROM cards c LEFT JOIN listings l ON l.card_id = c.id AND l.status = 'ACTIVE' WHERE c.owner_id = ? AND c.status != 'BURNED' ORDER BY c.id DESC", req.user.id);
    res.json(rows.map((x) => G.cardOut(x, x.listing_id ? { listing: { id: x.listing_id, price: x.listing_price } } : {})));
  });
  r.get('/collection', (req, res) => {
    const owned = all("SELECT skin_id, COUNT(*) n, MIN(float) best FROM cards WHERE owner_id = ? AND status != 'BURNED' GROUP BY skin_id", req.user.id);
    const disc = all('SELECT skin_id FROM discovered WHERE user_id = ?', req.user.id).map((x) => x.skin_id);
    res.json({ owned: Object.fromEntries(owned.map((o) => [o.skin_id, { n: o.n, best: o.best }])), discovered: disc });
  });
  r.post('/cards/sell', (req, res) => res.json(G.sellToSystem(req.user.id, req.body?.ids)));
  r.post('/cards/:id/lock', (req, res) => { G.setLocked(req.user.id, req.params.id, !!req.body?.locked); res.json({ ok: true }); });
  r.post('/cards/:id/unslab', (req, res) => res.json(G.unslab(req.user.id, req.params.id)));
  r.post('/showcase', (req, res) => { G.setShowcase(req.user.id, req.body?.ids); res.json({ ok: true }); });
  r.post('/trade-up', (req, res) => res.json(G.tradeUp(req.user.id, req.body?.ids)));

  r.post('/market/list', requireVerified('market.sell'), (req, res) => res.json({ id: G.createListing(req.user.id, req.body?.cardId, req.body?.price) }));
  r.post('/market/:id/cancel', (req, res) => { G.cancelListing(req.user.id, req.params.id); res.json({ ok: true }); });
  r.post('/market/:id/buy', (req, res) => res.json(G.buyListing(req.user.id, req.params.id)));

  r.get('/friends', (req, res) => res.json(G.listFriends(req.user.id)));
  r.post('/friends/request', requireVerified('friends.request'), (req, res) => res.json({ status: G.requestFriend(req.user.id, req.body?.username) }));
  r.post('/friends/:id/accept', (req, res) => { G.respondFriend(req.user.id, req.params.id, true); res.json({ ok: true }); });
  r.post('/friends/:id/remove', (req, res) => { G.respondFriend(req.user.id, req.params.id, false); res.json({ ok: true }); });

  r.get('/trades', (req, res) => res.json(G.listTrades(req.user.id)));
  r.get('/trades/:id', (req, res) => res.json(G.tradeDetail(req.user.id, req.params.id)));
  r.post('/trades', requireVerified('trade'), (req, res) => res.json({ id: G.createTrade(req.user.id, req.body || {}) }));
  r.post('/trades/:id/:action', (req, res) => {
    if (req.params.action === 'accept') assertVerified(req.user, 'trade');
    res.json({ status: G.respondTrade(req.user.id, req.params.id, req.params.action) });
  });

  r.get('/grading', (req, res) => res.json(G.listGrading(req.user.id)));
  r.post('/grading/quote', (req, res) => res.json(G.gradingQuote(req.user.id, req.body?.ids, req.body?.service)));
  r.post('/grading', (req, res) => res.json(G.submitGrading(req.user.id, req.body?.ids, req.body?.service)));
  r.post('/grading/:id/reveal', (req, res) => res.json(G.revealGrading(req.user.id, req.params.id)));

  r.get('/economy', (_req, res) => res.json(ECONOMY));
  return r;
}

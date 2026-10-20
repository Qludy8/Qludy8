// Routes JSON de l'API.
import express from 'express';
import { requireUser, rateLimit, createUser, createSession, destroySession, login, secureAccount } from './auth.js';
import * as G from './game.js';
import { game, details, TOTAL } from './catalog.js';

const wrap = (fn) => (req, res, next) => {
  try {
    const out = fn(req, res);
    if (out !== undefined) res.json(out);
  } catch (e) { next(e); }
};

export function api() {
  const r = express.Router();
  r.use(express.json({ limit: '32kb' }));

  // comptes
  r.post('/guest', rateLimit(40, 3600e3), wrap((req, res) => {
    if (req.user) return { user: G.me(req.user.id) };
    const id = createUser();
    createSession(res, id);
    const login = G.dailyLogin(id);
    return { user: G.me(id), login, welcome: true };
  }));
  r.post('/login', rateLimit(15, 600e3), wrap((req, res) => {
    const id = login(req.body.username, req.body.password);
    createSession(res, id);
    return { user: G.me(id) };
  }));
  r.post('/register', rateLimit(10, 3600e3), wrap((req, res) => {
    if (req.user) {
      secureAccount(req.user.id, req.body.username, req.body.password);
      return { user: G.me(req.user.id) };
    }
    const id = createUser({ username: String(req.body.username || '').trim(), password: String(req.body.password || '') });
    createSession(res, id);
    return { user: G.me(id) };
  }));
  r.post('/logout', wrap((req, res) => { destroySession(req, res); return { ok: true }; }));

  r.get('/me', wrap((req) => {
    if (!req.user) return { user: null };
    const login = G.dailyLogin(req.user.id);
    return { user: G.me(req.user.id), login };
  }));
  r.get('/stats', wrap(() => ({ ...G.stats(), total: TOTAL })));
  r.get('/boosters', wrap(() => G.boosterInfo()));

  // boosters
  r.post('/open', requireUser, rateLimit(120, 60e3), wrap((req) =>
    G.openBooster(req.user.id, String(req.body.booster || 'standard'), { pay: req.body.pay === 'jetons' ? 'jetons' : 'free', count: req.body.count })));

  // collection
  r.get('/collection', requireUser, wrap((req) => ({ cards: G.collectionOf(req.user.id), wishes: G.wishesOf(req.user.id) })));
  r.post('/collection/:card/lock', requireUser, wrap((req) => { G.setLock(req.user.id, Number(req.params.card), !!req.body.locked); return { ok: true }; }));
  r.post('/collection/:card/wish', requireUser, wrap((req) => { G.toggleWish(req.user.id, Number(req.params.card), !!req.body.on); return { ok: true }; }));
  r.post('/recycle', requireUser, wrap((req) => G.recycle(req.user.id, {
    card: req.body.card ? Number(req.body.card) : null, qty: req.body.qty ? Number(req.body.qty) : null,
    rarities: Array.isArray(req.body.rarities) ? req.body.rarities : null,
  })));

  // fiche d'un jeu
  r.get('/card/:n', wrap((req) => {
    const n = Number(req.params.n);
    const g = game(n);
    if (!g) throw new G.HttpError(404, 'Cette carte n’existe pas.');
    return { card: g, details: details(n), price: G.priceInfo(n), holders: G.holders(n), listings: G.marketList({ card: n, limit: 20 }) };
  }));

  // missions & succès
  r.get('/missions', requireUser, wrap((req) => G.missions(req.user.id)));
  r.post('/missions/claim', requireUser, wrap((req) => G.claim(req.user.id, String(req.body.id || 'all'))));

  // communauté
  r.get('/feed', wrap(() => G.feed(40)));
  r.get('/leaderboard', wrap((req) => G.leaderboard(String(req.query.kind || 'points'))));
  r.get('/profile/:name', wrap((req) => G.profile(req.params.name)));
  r.post('/profile', requireUser, wrap((req) => ({ user: G.updateProfile(req.user.id, req.body || {}) })));
  r.get('/notifications', requireUser, wrap((req) => G.notifications(req.user.id)));

  // marché
  r.get('/market', wrap((req) => G.marketList({ card: req.query.card ? Number(req.query.card) : null, limit: 300 })));
  r.get('/market/mine', requireUser, wrap((req) => G.marketList({ seller: req.user.id })));
  r.post('/market', requireUser, rateLimit(30, 60e3), wrap((req) => G.createListing(req.user.id, req.body.card, req.body.price)));
  r.post('/market/:id/buy', requireUser, rateLimit(30, 60e3), wrap((req) => G.buyListing(req.user.id, Number(req.params.id))));
  r.delete('/market/:id', requireUser, wrap((req) => G.cancelListing(req.user.id, Number(req.params.id))));

  // échanges
  r.get('/offers', wrap(() => G.offersList()));
  r.get('/offers/mine', requireUser, wrap((req) => G.offersList({ user: req.user.id })));
  r.post('/offers', requireUser, rateLimit(20, 60e3), wrap((req) => G.createOffer(req.user.id, req.body.give, req.body.wants)));
  r.post('/offers/:id/take', requireUser, rateLimit(30, 60e3), wrap((req) => G.takeOffer(req.user.id, Number(req.params.id), req.body.give)));
  r.delete('/offers/:id', requireUser, wrap((req) => G.cancelOffer(req.user.id, Number(req.params.id))));

  return r;
}

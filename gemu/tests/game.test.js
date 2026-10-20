// Tests du serveur : tirages, garanties, recyclage, marché, échanges, invariants du portefeuille.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_FILE = ':memory:';
const { createUser } = await import('../server/auth.js');
const G = await import('../server/game.js');
const { GAMES, TOTAL, game, idOf, nOf, poolFor } = await import('../server/catalog.js');
const { one, all, run } = await import('../server/db.js');
const { RARITY, RARITIES, ECONOMY, BOOSTERS, RARITY_CUTS } = await import('../shared/config.js');

const newUser = (name) => createUser({ username: name, password: 'motdepasse' });
const balanceOk = (id) => {
  const u = one('SELECT jetons FROM users WHERE id = ?', id).jetons;
  const sum = one('SELECT COALESCE(SUM(amount),0) AS s FROM ledger WHERE user_id = ?', id).s;
  assert.equal(u, sum, 'solde = somme du registre');
};

test('catalogue : des milliers de jeux, numérotés, raretés par tranches de classement', () => {
  assert.ok(TOTAL >= 3000, `${TOTAL} jeux`);
  GAMES.forEach((g, i) => assert.equal(g.n, i + 1));
  const ids = new Set(GAMES.map((g) => g.id));
  assert.equal(ids.size, TOTAL, 'identifiants uniques');
  const count = Object.fromEntries(RARITIES.map((r) => [r, GAMES.filter((g) => g.r === r).length]));
  let prev = 0;
  for (const [r, cut] of RARITY_CUTS) {
    const expect = Math.round(cut * TOTAL) - prev;
    assert.ok(Math.abs(count[r] - expect) <= 2, `${r} : ${count[r]} ≈ ${expect}`);
    prev += count[r];
  }
  // les Mythiques sont en tête du classement
  assert.ok(GAMES.slice(0, 20).every((g) => g.r === 'M'));
  // chaque jeu a une image (affiche Steam) ou un article Wikipédia d'où le navigateur la tire
  assert.ok(GAMES.every((g) => g.i || g.wk));
  assert.equal(nOf(idOf(42)), 42);
});

test('chaque booster a une réserve dans toutes les raretés', () => {
  for (const b of BOOSTERS) {
    const p = poolFor(b);
    for (const r of RARITIES) assert.ok(p[r].length > 0, `${b.id} ${r}`);
  }
});

test('ouvrir un booster : 5 cartes sans doublon, stock gratuit débité, collection à jour', () => {
  const id = newUser('ouvreur');
  const r = G.openBooster(id, 'standard');
  const cards = r.packs[0].cards;
  assert.equal(cards.length, ECONOMY.packSize);
  assert.equal(new Set(cards.map((c) => c.n)).size, cards.length);
  assert.equal(r.user.freePacks, ECONOMY.free.max - 1);
  assert.equal(r.user.packsOpened, 1);
  for (const c of cards) {
    assert.equal(c.r, game(c.n).r);
    assert.equal(one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', id, idOf(c.n)).qty, 1);
  }
  // les cartes sont triées de la moins rare à la plus rare
  const idx = cards.map((c) => RARITIES.indexOf(c.r));
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b));
  balanceOk(id);
});

test('stock gratuit épuisé → jetons ; pas assez de jetons → refus', () => {
  const id = newUser('fauche');
  G.openBooster(id, 'standard', { count: 10 });
  assert.throws(() => G.openBooster(id, 'standard'), /gratuits/);
  const before = one('SELECT jetons FROM users WHERE id = ?', id).jetons;
  G.openBooster(id, 'standard', { pay: 'jetons' });
  assert.equal(one('SELECT jetons FROM users WHERE id = ?', id).jetons, before - 100);
  run('UPDATE users SET jetons = 0 WHERE id = ?', id);
  run('INSERT INTO ledger (user_id, amount, balance_after, reason, at) VALUES (?,?,?,?,?)', id, -(before - 100), 0, 'test', Date.now());
  assert.throws(() => G.openBooster(id, 'prestige', { pay: 'jetons' }), /Pas assez/);
  balanceOk(id);
});

test('booster doré tous les 10 boosters : Épique ou mieux', () => {
  const id = newUser('dore');
  run('UPDATE users SET bonus_packs = 100 WHERE id = ?', id);
  const r = G.openBooster(id, 'standard', { count: 10 });
  const last = r.packs[9];
  assert.ok(last.golden);
  assert.ok(last.cards.some((c) => RARITIES.indexOf(c.r) >= 3));
});

test('pitié : Mythique garantie au 250e booster sans Mythique', () => {
  const id = newUser('pitie');
  run('UPDATE users SET pity_m = ?, bonus_packs = 5 WHERE id = ?', ECONOMY.pityMythic - 1, id);
  const r = G.openBooster(id, 'standard');
  assert.ok(r.packs[0].cards.some((c) => c.r === 'M'));
  assert.equal(one('SELECT pity_m FROM users WHERE id = ?', id).pity_m, 0);
});

test('pack du jour : une fois par jour, Épique garantie', () => {
  const id = newUser('quotidien');
  const r = G.openBooster(id, 'daily');
  assert.ok(r.packs[0].cards.some((c) => RARITIES.indexOf(c.r) >= 3));
  assert.throws(() => G.openBooster(id, 'daily'), /demain/);
});

test('édition prestige : Rare ou mieux partout', () => {
  const id = newUser('prestige');
  G.credit(id, 1000, 'test');
  const r = G.openBooster(id, 'prestige', { pay: 'jetons' });
  assert.ok(r.packs[0].cards.every((c) => RARITIES.indexOf(c.r) >= 2));
});

test('taux observés proches des taux annoncés', () => {
  const b = BOOSTERS.find((x) => x.id === 'standard');
  const n = 40000;
  const seen = Object.fromEntries(RARITIES.map((r) => [r, 0]));
  for (let i = 0; i < n / 5; i++) for (const c of G.rollPack(b)) seen[c.r]++;
  const total = RARITIES.reduce((s, r) => s + RARITY[r].drop, 0);
  for (const r of ['C', 'U', 'R']) {
    const p = RARITY[r].drop / total;
    assert.ok(Math.abs(seen[r] / n - p) < 0.015, `${r} ${seen[r] / n} vs ${p}`);
  }
});

test('recyclage : garde 1 exemplaire, ignore les cartes verrouillées, crédite les jetons', () => {
  const id = newUser('recycleur');
  const [a, b] = [GAMES.find((g) => g.r === 'C'), GAMES.find((g) => g.r === 'E')];
  const t = Date.now();
  run('INSERT INTO collection (user_id, card, qty, first_at, last_at) VALUES (?,?,?,?,?)', id, a.id, 4, t, t);
  run('INSERT INTO collection (user_id, card, qty, locked, first_at, last_at) VALUES (?,?,?,?,?,?)', id, b.id, 3, 1, t, t);
  const before = one('SELECT jetons FROM users WHERE id = ?', id).jetons;
  const r = G.recycle(id, {});
  assert.equal(r.count, 3);
  assert.equal(r.gain, 3 * RARITY.C.recycle);
  assert.equal(one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', id, a.id).qty, 1);
  assert.equal(one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', id, b.id).qty, 3);
  assert.equal(one('SELECT jetons FROM users WHERE id = ?', id).jetons, before + r.gain);
  assert.throws(() => G.recycle(id, { card: a.n, qty: 1 }), /Aucun doublon/);
  balanceOk(id);
});

test('marché : vente, achat avec frais, carte transférée, annonce close', () => {
  const s = newUser('vendeur'), acheteur = newUser('acheteur');
  const g = GAMES.find((x) => x.r === 'R');
  const t = Date.now();
  run('INSERT INTO collection (user_id, card, qty, first_at, last_at) VALUES (?,?,?,?,?)', s, g.id, 2, t, t);
  const { id } = G.createListing(s, g.n, 100);
  assert.equal(one('SELECT reserved FROM collection WHERE user_id = ? AND card = ?', s, g.id).reserved, 1);
  assert.throws(() => G.buyListing(s, id), /propre annonce/);
  const sb = one('SELECT jetons FROM users WHERE id = ?', s).jetons;
  G.buyListing(acheteur, id);
  assert.equal(one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', acheteur, g.id).qty, 1);
  assert.equal(one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', s, g.id).qty, 1);
  assert.equal(one('SELECT jetons FROM users WHERE id = ?', s).jetons, sb + 100 - Math.ceil(100 * ECONOMY.marketFee));
  assert.throws(() => G.buyListing(acheteur, id), /terminée/);
  assert.equal(G.priceInfo(g.n).median, 100);
  balanceOk(s); balanceOk(acheteur);
});

test('marché : une carte verrouillée ne se vend pas, une annonce annulée rend la carte', () => {
  const s = newUser('prudent');
  const g = GAMES.find((x) => x.r === 'U');
  const t = Date.now();
  run('INSERT INTO collection (user_id, card, qty, locked, first_at, last_at) VALUES (?,?,?,?,?,?)', s, g.id, 1, 1, t, t);
  assert.throws(() => G.createListing(s, g.n, 10), /verrouillée/);
  G.setLock(s, g.n, false);
  const { id } = G.createListing(s, g.n, 10);
  assert.throws(() => G.createListing(s, g.n, 10), /libre/);
  G.cancelListing(s, id);
  assert.equal(one('SELECT reserved FROM collection WHERE user_id = ? AND card = ?', s, g.id).reserved, 0);
});

test('tableau des échanges : « je donne X contre l’une de Y »', () => {
  const a = newUser('alice'), b = newUser('bob');
  const [x, y, z] = GAMES.filter((g) => g.r === 'C').slice(0, 3);
  const t = Date.now();
  run('INSERT INTO collection (user_id, card, qty, first_at, last_at) VALUES (?,?,?,?,?)', a, x.id, 2, t, t);
  run('INSERT INTO collection (user_id, card, qty, first_at, last_at) VALUES (?,?,?,?,?)', b, z.id, 1, t, t);
  const { id } = G.createOffer(a, x.n, [y.n, z.n]);
  assert.throws(() => G.takeOffer(b, id, y.n), /pas cette carte/);
  G.takeOffer(b, id, z.n);
  assert.equal(one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', b, x.id).qty, 1);
  assert.equal(one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', a, z.id).qty, 1);
  assert.equal(one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', a, x.id).qty, 1);
  assert.equal(one('SELECT qty FROM collection WHERE user_id = ? AND card = ?', b, z.id).qty, 0);
  assert.throws(() => G.takeOffer(b, id, z.n), /plus en attente/);
});

test('missions : progression et réclamation unique', () => {
  const id = newUser('missionnaire');
  run('UPDATE users SET bonus_packs = 10 WHERE id = ?', id);
  G.openBooster(id, 'standard', { count: 5 });
  const m = G.missions(id);
  const d = m.daily.find((x) => x.id === 'd-open5');
  assert.ok(d.done && !d.claimed);
  const r = G.claim(id, 'd-open5');
  assert.equal(r.jetons, d.reward);
  assert.throws(() => G.claim(id, 'd-open5'), /Rien à réclamer/);
  assert.ok(G.missions(id).achievements.find((a) => a.id === 'a-first').done);
  balanceOk(id);
});

test('connexion quotidienne : une seule récompense par jour', () => {
  const id = newUser('fidele');
  const r = G.dailyLogin(id);
  assert.equal(r.streak, 1);
  assert.equal(r.jetons, ECONOMY.streak[0]);
  assert.equal(G.dailyLogin(id), null);
  balanceOk(id);
});

test('classement et profil', () => {
  const id = newUser('champion');
  run('UPDATE users SET bonus_packs = 10 WHERE id = ?', id);
  G.openBooster(id, 'standard', { count: 3 });
  const lb = G.leaderboard('points');
  const me = lb.find((r) => r.username === 'champion');
  assert.ok(me && me.points > 0);
  const p = G.profile('champion');
  assert.ok(p.unique > 0 && p.showcase.length > 0);
  assert.ok(p.showcase.every((n) => game(n)));
});

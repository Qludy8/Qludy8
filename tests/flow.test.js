// Parcours complet sur une base en mémoire : boosters, vente, marché, amis, échange, gradation, contrat.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_FILE = ':memory:';
const { one, all, run } = await import('../server/db.js');
const G = await import('../server/game.js');
const { createUser } = await import('../server/auth.js');

const a = createUser({ username: 'alice', password: 'password123' });
const b = createUser({ username: 'bob', password: 'password123' });
const bal = (id) => one('SELECT balance FROM users WHERE id = ?', id).balance;
const owned = (id) => all("SELECT * FROM cards WHERE owner_id = ? AND status = 'OWNED'", id);

test('boosters offerts puis payants', () => {
  const r = G.openPacks(a, 'standard', 3);
  assert.equal(r.welcomeUsed, 3);
  assert.equal(r.balance, 300);
  assert.equal(r.packs.flatMap((p) => p.cards).length, 15);
  G.openPacks(a, 'standard', 1);
  assert.equal(bal(a), 150);
  assert.throws(() => G.openPacks(a, 'blades', 1), /Solde insuffisant/);
  assert.equal(owned(a).length, 20, 'rollback : aucune carte créée si le paiement échoue');
});

test('colis gratuits limités par le stock', () => {
  G.openPacks(b, 'free', 2);
  assert.throws(() => G.openPacks(b, 'free', 1), /Plus de colis/);
});

test('vente au système à 55 %', () => {
  const c = owned(a)[0];
  const v = G.valueOfRow(c);
  const before = bal(a);
  G.sellToSystem(a, [c.id]);
  assert.equal(bal(a), before + Math.max(1, Math.floor(v * 0.55)));
  assert.throws(() => G.sellToSystem(a, [c.id]));
});

test('marché : annonce, achat, frais, propriété', () => {
  const c = owned(a)[0];
  const price = Math.max(1, G.valueOfRow(c));
  const id = G.createListing(a, c.id, price);
  assert.throws(() => G.buyListing(a, id), /propre annonce/);
  const sa = bal(a), sb = bal(b);
  G.buyListing(b, id);
  assert.equal(one('SELECT owner_id FROM cards WHERE id = ?', c.id).owner_id, b);
  assert.equal(bal(b), sb - price);
  assert.equal(bal(a), sa + price - Math.ceil(price * 0.05));
  assert.throws(() => G.buyListing(b, id), /déjà vendue/);
});

test('amis puis échange atomique', () => {
  assert.throws(() => G.createTrade(a, { toId: b, give: [owned(a)[0].id] }), /amis/);
  G.requestFriend(a, 'bob');
  G.respondFriend(b, a, true);
  assert.equal(G.friendStatus(a, b), 'FRIENDS');
  const give = owned(a).slice(0, 2).map((c) => c.id), take = [owned(b)[0].id];
  const id = G.createTrade(a, { toId: b, give, take, creditsFrom: 10 });
  const sa = bal(a), sb = bal(b);
  assert.equal(G.respondTrade(b, id, 'accept'), 'DONE');
  for (const c of give) assert.equal(one('SELECT owner_id FROM cards WHERE id = ?', c).owner_id, b);
  assert.equal(one('SELECT owner_id FROM cards WHERE id = ?', take[0]).owner_id, a);
  assert.equal(bal(a), sa - 10); assert.equal(bal(b), sb + 10);
});

test('un échange devient invalide si une carte bouge', () => {
  const c = owned(a)[0];
  const id = G.createTrade(a, { toId: b, give: [c.id] });
  G.sellToSystem(a, [c.id]);
  assert.throws(() => G.respondTrade(b, id, 'accept'));
});

test('gradation : verrouillage, révélation, certificat', () => {
  run('UPDATE users SET balance = balance + 5000 WHERE id = ?', a);
  run("INSERT INTO transactions (user_id, type, amount, balance_after, at) VALUES (?, 'TEST', 5000, ?, 0)", a, bal(a));
  const c = owned(a)[0];
  const { orderId } = G.submitGrading(a, [c.id], 'express');
  assert.equal(one('SELECT status FROM cards WHERE id = ?', c.id).status, 'GRADING');
  assert.throws(() => G.revealGrading(a, orderId), /Pas encore/);
  run('UPDATE grading_orders SET ready_at = 0 WHERE id = ?', orderId);
  const [res] = G.revealGrading(a, orderId);
  assert.ok(res.g >= 1 && res.g <= 10);
  assert.match(res.cert, /^ARG-\d{4}-\d{6}$/);
  G.unslab(a, c.id);
  assert.equal(one('SELECT grade FROM cards WHERE id = ?', c.id).grade, null);
});

test('contrat : 10 cartes N → 1 carte N+1', () => {
  for (let i = 0; i < 8; i++) { run('UPDATE users SET free_stock = 6 WHERE id = ?', b); G.openPacks(b, 'free', 6); }
  const byR = {};
  for (const c of owned(b)) (byR[c.rarity] ||= []).push(c);
  const [r, list] = Object.entries(byR).find(([, l]) => l.length >= 10) || [];
  assert.ok(list, 'au moins 10 cartes de même rareté');
  const out = G.tradeUp(b, list.slice(0, 10).map((c) => c.id));
  assert.equal(out.r, Number(r) + 1);
});

test('invariant du portefeuille : solde = somme des transactions', () => {
  for (const u of all('SELECT id, balance FROM users')) {
    const s = one('SELECT COALESCE(SUM(amount), 0) s FROM transactions WHERE user_id = ?', u.id).s;
    assert.equal(u.balance, s, `utilisateur ${u.id}`);
  }
});

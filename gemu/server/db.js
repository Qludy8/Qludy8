// Base SQLite embarquée (node:sqlite). Une seule connexion synchrone → transactions simples et sûres.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const file = process.env.DB_FILE || 'db/gemu.db';
if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
export const db = new DatabaseSync(file);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pass_hash TEXT,
  guest INTEGER NOT NULL DEFAULT 1,
  is_bot INTEGER NOT NULL DEFAULT 0,
  jetons INTEGER NOT NULL DEFAULT 0,
  free_stock INTEGER NOT NULL DEFAULT 0,
  free_at INTEGER NOT NULL DEFAULT 0,          -- instant de référence de la recharge
  bonus_packs INTEGER NOT NULL DEFAULT 0,      -- boosters gagnés (missions, série), ne se rechargent pas
  packs_opened INTEGER NOT NULL DEFAULT 0,
  pity_m INTEGER NOT NULL DEFAULT 0,           -- boosters depuis la dernière Mythique
  daily_pack TEXT,                             -- jour du dernier pack du jour
  streak INTEGER NOT NULL DEFAULT 0,
  last_login TEXT,
  hue INTEGER NOT NULL DEFAULT 12,
  bio TEXT NOT NULL DEFAULT '',
  showcase TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
-- Les cartes sont désignées par l'identifiant stable du jeu (« s570 » = appid Steam, « w… » = hors Steam) :
-- reconstruire le catalogue change les numéros #0001…, jamais les collections.
-- collection : un exemplaire = une unité de qty ; « reserved » = exemplaires au marché ou en échange
CREATE TABLE IF NOT EXISTS collection (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  locked INTEGER NOT NULL DEFAULT 0,
  first_at INTEGER NOT NULL,
  last_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, card)
);
CREATE INDEX IF NOT EXISTS collection_card ON collection(card);
CREATE TABLE IF NOT EXISTS pulls (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  booster TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'normal',         -- normal | golden | divine
  cards TEXT NOT NULL,                         -- [identifiants de jeux]
  best TEXT NOT NULL,                          -- meilleure rareté du tirage
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS pulls_user ON pulls(user_id, at);
CREATE INDEX IF NOT EXISTS pulls_best ON pulls(best, at);
CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL, reason TEXT NOT NULL, at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ledger_user ON ledger(user_id, at);
CREATE TABLE IF NOT EXISTS stats (
  user_id INTEGER NOT NULL, period TEXT NOT NULL, stat TEXT NOT NULL, value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period, stat)
);
CREATE TABLE IF NOT EXISTS claims (
  user_id INTEGER NOT NULL, mission TEXT NOT NULL, period TEXT NOT NULL, at INTEGER NOT NULL,
  PRIMARY KEY (user_id, mission, period)
);
CREATE TABLE IF NOT EXISTS wishes (
  user_id INTEGER NOT NULL, card TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (user_id, card)
);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY, seller_id INTEGER NOT NULL, card TEXT NOT NULL, price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', buyer_id INTEGER, created_at INTEGER NOT NULL, closed_at INTEGER
);
CREATE INDEX IF NOT EXISTS listings_status ON listings(status, card);
CREATE INDEX IF NOT EXISTS listings_seller ON listings(seller_id, status);
-- tableau des échanges : « je donne celle-ci contre l'une de celles-là »
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, give TEXT NOT NULL, wants TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN', taker_id INTEGER, got TEXT, created_at INTEGER NOT NULL, closed_at INTEGER
);
CREATE INDEX IF NOT EXISTS offers_status ON offers(status, created_at);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, text TEXT NOT NULL, link TEXT, seen INTEGER NOT NULL DEFAULT 0, at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id, seen, at);
`);

export const now = () => Date.now();
export const one = (sql, ...p) => db.prepare(sql).get(...p);
export const all = (sql, ...p) => db.prepare(sql).all(...p);
export const run = (sql, ...p) => db.prepare(sql).run(...p);

let depth = 0;
export function tx(fn) {
  if (depth > 0) return fn();
  depth++;
  db.exec('BEGIN IMMEDIATE');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  } finally {
    depth--;
  }
}

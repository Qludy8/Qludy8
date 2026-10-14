// Base SQLite embarquée (node:sqlite). Une seule connexion synchrone → transactions simples et sûres.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const file = process.env.DB_FILE || 'data/armaris.db';
if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
export const db = new DatabaseSync(file);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT UNIQUE COLLATE NOCASE,
  pass_hash TEXT,
  is_bot INTEGER NOT NULL DEFAULT 0,
  balance INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  avatar_hue INTEGER NOT NULL DEFAULT 200,
  bio TEXT,
  welcome_packs INTEGER NOT NULL DEFAULT 0,
  free_stock INTEGER NOT NULL DEFAULT 0,
  free_at INTEGER NOT NULL DEFAULT 0,
  pity_ultra INTEGER NOT NULL DEFAULT 0,
  pity_legend INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_daily TEXT,
  packs_opened INTEGER NOT NULL DEFAULT 0,
  discord_id TEXT UNIQUE,
  discord_name TEXT,
  discord_verified_at INTEGER,
  showcase TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY,
  serial TEXT NOT NULL UNIQUE,
  skin_id TEXT NOT NULL,
  rarity INTEGER NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  float REAL NOT NULL,
  cx REAL NOT NULL,
  cy REAL NOT NULL,
  tracker INTEGER,
  foil INTEGER NOT NULL DEFAULT 0,
  misprint TEXT,
  status TEXT NOT NULL DEFAULT 'OWNED',      -- OWNED | LISTED | GRADING | BURNED
  grade REAL,
  subgrades TEXT,
  cert TEXT UNIQUE,
  locked INTEGER NOT NULL DEFAULT 0,        -- favori : protégé contre la vente groupée
  origin TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cards_owner ON cards(owner_id, status);
CREATE INDEX IF NOT EXISTS cards_skin ON cards(skin_id, grade);
CREATE TABLE IF NOT EXISTS ownership (
  id INTEGER PRIMARY KEY, card_id INTEGER NOT NULL, from_id INTEGER, to_id INTEGER,
  reason TEXT NOT NULL, price INTEGER, at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ownership_card ON ownership(card_id);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, type TEXT NOT NULL,
  amount INTEGER NOT NULL, balance_after INTEGER NOT NULL, note TEXT, at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tx_user ON transactions(user_id, at);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY, card_id INTEGER NOT NULL, seller_id INTEGER NOT NULL,
  price INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', buyer_id INTEGER,
  created_at INTEGER NOT NULL, sold_at INTEGER
);
CREATE INDEX IF NOT EXISTS listings_status ON listings(status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS listings_active_card ON listings(card_id) WHERE status = 'ACTIVE';
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY, skin_id TEXT NOT NULL, price INTEGER NOT NULL, at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sales_skin ON sales(skin_id, at);
CREATE TABLE IF NOT EXISTS friends (
  a INTEGER NOT NULL, b INTEGER NOT NULL, requester INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', created_at INTEGER NOT NULL,
  PRIMARY KEY (a, b)
);
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY, from_id INTEGER NOT NULL, to_id INTEGER NOT NULL,
  credits_from INTEGER NOT NULL DEFAULT 0, credits_to INTEGER NOT NULL DEFAULT 0,
  message TEXT, status TEXT NOT NULL DEFAULT 'OPEN',   -- OPEN | DONE | DECLINED | CANCELLED | FAILED
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS trade_items (
  trade_id INTEGER NOT NULL, card_id INTEGER NOT NULL, side TEXT NOT NULL,
  PRIMARY KEY (trade_id, card_id)
);
CREATE TABLE IF NOT EXISTS grading_orders (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, service TEXT NOT NULL,
  fee INTEGER NOT NULL, ready_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS grading_items (
  order_id INTEGER NOT NULL, card_id INTEGER NOT NULL, PRIMARY KEY (order_id, card_id)
);
CREATE TABLE IF NOT EXISTS discovered (
  user_id INTEGER NOT NULL, skin_id TEXT NOT NULL, at INTEGER NOT NULL,
  PRIMARY KEY (user_id, skin_id)
);
CREATE TABLE IF NOT EXISTS missions (
  user_id INTEGER NOT NULL, day TEXT NOT NULL, key TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0, claimed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, key)
);
CREATE TABLE IF NOT EXISTS feed (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, card_id INTEGER NOT NULL, at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, text TEXT NOT NULL, link TEXT,
  read INTEGER NOT NULL DEFAULT 0, at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS notif_user ON notifications(user_id, at);
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY, user_id INTEGER NOT NULL, at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
`);

// Transaction : rollback automatique si fn lève une erreur. Réentrant (savepoints).
let depth = 0;
export function tx(fn) {
  const sp = `sp${depth}`;
  db.exec(depth === 0 ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${sp}`);
  depth++;
  try {
    const r = fn();
    depth--;
    db.exec(depth === 0 ? 'COMMIT' : `RELEASE ${sp}`);
    return r;
  } catch (e) {
    depth--;
    db.exec(depth === 0 ? 'ROLLBACK' : `ROLLBACK TO ${sp}; RELEASE ${sp}`);
    throw e;
  }
}

const stmtCache = new Map();
export function q(sql) {
  let s = stmtCache.get(sql);
  if (!s) { s = db.prepare(sql); stmtCache.set(sql, s); }
  return s;
}
export const one = (sql, ...p) => q(sql).get(...p);
export const all = (sql, ...p) => q(sql).all(...p);
export const run = (sql, ...p) => q(sql).run(...p);
export const now = () => Date.now();
export const today = () => new Date().toISOString().slice(0, 10);

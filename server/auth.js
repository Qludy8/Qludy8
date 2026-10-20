// Comptes : invité créé d'un clic, puis protégé par un pseudo et un mot de passe (scrypt) ; sessions en cookie httpOnly.
import { scryptSync, randomBytes, timingSafeEqual, randomInt } from 'node:crypto';
import { ECONOMY } from '../shared/config.js';
import { one, run, tx, now } from './db.js';
import { HttpError, credit } from './game.js';

const SESSION_MS = 180 * 864e5;
const COOKIE = 'gemu_sid';
const NAME_RE = /^[A-Za-z0-9_-]{3,20}$/;

export function hashPassword(pw) {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(pw, salt, 64).toString('hex')}`;
}
export function checkPassword(pw, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const h = scryptSync(pw, Buffer.from(salt, 'hex'), 64);
  return timingSafeEqual(h, Buffer.from(hash, 'hex'));
}

export function createUser({ username = null, password = null, bot = false } = {}) {
  if (username !== null && !NAME_RE.test(username)) throw new HttpError(400, '3 à 20 caractères : lettres, chiffres, _ et -');
  if (username && one('SELECT id FROM users WHERE username = ?', username)) throw new HttpError(409, 'Ce pseudo est déjà pris.');
  if (!username) {
    do username = `Joueur-${randomInt(1000, 99999)}`; while (one('SELECT id FROM users WHERE username = ?', username));
  }
  return tx(() => {
    const t = now();
    const res = run(`INSERT INTO users (username, pass_hash, guest, is_bot, free_stock, free_at, hue, created_at, last_seen)
      VALUES (?,?,?,?,?,?,?,?,?)`, username, password ? hashPassword(password) : null, password || bot ? 0 : 1, bot ? 1 : 0,
    ECONOMY.welcomeFree, t, randomInt(0, 360), t, t);
    const id = Number(res.lastInsertRowid);
    credit(id, bot ? 200_000 : ECONOMY.startJetons, 'Bienvenue');
    return id;
  });
}

// L'invité choisit un pseudo et un mot de passe : sa collection lui reste.
export function secureAccount(userId, username, password) {
  username = String(username || '').trim();
  if (!NAME_RE.test(username)) throw new HttpError(400, '3 à 20 caractères : lettres, chiffres, _ et -');
  if (!password || String(password).length < 6) throw new HttpError(400, 'Mot de passe : 6 caractères minimum.');
  const other = one('SELECT id FROM users WHERE username = ?', username);
  if (other && other.id !== userId) throw new HttpError(409, 'Ce pseudo est déjà pris.');
  run('UPDATE users SET username = ?, pass_hash = ?, guest = 0 WHERE id = ?', username, hashPassword(String(password)), userId);
}

export function login(username, password) {
  const u = one('SELECT id, pass_hash FROM users WHERE username = ? AND is_bot = 0', String(username || '').trim());
  if (!u || !checkPassword(String(password || ''), u.pass_hash)) throw new HttpError(401, 'Pseudo ou mot de passe incorrect.');
  return u.id;
}

export function createSession(res, userId) {
  const token = randomBytes(32).toString('hex');
  run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)', token, userId, now() + SESSION_MS);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: SESSION_MS });
}
export function destroySession(req, res) {
  const t = readCookie(req);
  if (t) run('DELETE FROM sessions WHERE token = ?', t);
  res.clearCookie(COOKIE);
}
function readCookie(req) {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|; )${COOKIE}=([a-f0-9]{64})`));
  return m ? m[1] : null;
}

export function loadUser(req, _res, next) {
  const t = readCookie(req);
  if (t) {
    const s = one('SELECT user_id, expires_at FROM sessions WHERE token = ?', t);
    if (s && s.expires_at > now()) {
      req.user = one('SELECT id, username, guest, last_seen FROM users WHERE id = ?', s.user_id);
      if (req.user && now() - req.user.last_seen > 60e3) run('UPDATE users SET last_seen = ? WHERE id = ?', now(), req.user.id);
    }
  }
  next();
}
export function requireUser(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Connexion requise'));
  next();
}

const hits = new Map();
export function rateLimit(max, windowMs) {
  return (req, _res, next) => {
    const k = req.ip + req.path; const t = now();
    const h = (hits.get(k) || []).filter((x) => t - x < windowMs);
    h.push(t); hits.set(k, h);
    if (h.length > max) return next(new HttpError(429, 'Doucement ! Trop de requêtes, réessaie dans un instant.'));
    next();
  };
}

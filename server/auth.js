// Comptes : mot de passe haché (scrypt), sessions en cookie httpOnly.
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { ECONOMY } from '../shared/config.js';
import { one, run, tx, now } from './db.js';
import { HttpError, credit } from './game.js';

const SESSION_MS = 30 * 864e5;
const COOKIE = 'mugigo_sid';

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

export function createUser({ username, email = null, password = null, isBot = false }) {
  username = String(username || '').trim();
  if (!/^[A-Za-z0-9_\-.]{3,20}$/.test(username)) throw new HttpError(400, 'Pseudo : 3 à 20 caractères (lettres, chiffres, _ - .)');
  if (!isBot && (!password || password.length < 8)) throw new HttpError(400, 'Mot de passe : 8 caractères minimum');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'E-mail invalide');
  if (one('SELECT id FROM users WHERE username = ?', username)) throw new HttpError(409, 'Pseudo déjà pris');
  if (email && one('SELECT id FROM users WHERE email = ?', email)) throw new HttpError(409, 'E-mail déjà utilisé');
  return tx(() => {
    const res = run(`INSERT INTO users (username, email, pass_hash, is_bot, avatar_hue, welcome_packs, free_stock, free_at, created_at, last_seen)
      VALUES (?,?,?,?,?,?,?,?,?,?)`, username, email || null, password ? hashPassword(password) : null, isBot ? 1 : 0,
    Math.floor(Math.random() * 360), isBot ? 0 : ECONOMY.welcomePacks, isBot ? 0 : ECONOMY.free.maxStock, now(), now(), now());
    const id = Number(res.lastInsertRowid);
    credit(id, isBot ? 5_000_000 : ECONOMY.startBalance, 'BONUS', 'Bienvenue');
    return id;
  });
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
  const h = req.headers.cookie || '';
  const m = h.match(new RegExp(`(?:^|; )${COOKIE}=([a-f0-9]{64})`));
  return m ? m[1] : null;
}

// Middleware : req.user si session valide
export function loadUser(req, _res, next) {
  const t = readCookie(req);
  if (t) {
    const s = one('SELECT user_id, expires_at FROM sessions WHERE token = ?', t);
    if (s && s.expires_at > now()) {
      req.user = one('SELECT * FROM users WHERE id = ?', s.user_id);
      if (req.user && now() - req.user.last_seen > 60e3) run('UPDATE users SET last_seen = ? WHERE id = ?', now(), req.user.id);
    }
  }
  next();
}
export function requireUser(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Connexion requise'));
  next();
}

// Limiteur très simple par IP (anti brute-force sur la connexion)
const hits = new Map();
export function rateLimit(max, windowMs) {
  return (req, _res, next) => {
    const k = req.ip + req.path; const t = now();
    const h = (hits.get(k) || []).filter((x) => t - x < windowMs);
    h.push(t); hits.set(k, h);
    if (h.length > max) return next(new HttpError(429, 'Trop de tentatives, réessayez plus tard'));
    next();
  };
}

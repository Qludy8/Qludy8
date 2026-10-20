// Collectionneurs automatiques : ils ouvrent des boosters (fil des gros tirages), vendent leurs doublons
// au marché et proposent des échanges, pour que le jeu soit vivant même avec peu de joueurs.
import { randomInt } from 'node:crypto';
import { one, all, run } from './db.js';
import { createUser } from './auth.js';
import * as G from './game.js';
import { gameById, TOTAL } from './catalog.js';
import { BOOSTERS } from '../shared/config.js';
import { baseValue } from '../shared/rules.js';

const NAMES = ['PixelNomade', 'LootGoblin', 'Sakura8bit', 'ManetteDor', 'NoScopeNina', 'RetroRenard', 'Kirbyste', 'SpeedrunSam',
  'GachaGaston', 'MiniBoss', 'CheatCodeChloe', 'Player2Paul', 'HadokenHugo', 'SaveStateSara', 'CartoucheCo', 'GlitchGuru'];

export function ensureBots() {
  return NAMES.map((name) => one('SELECT id FROM users WHERE username = ?', name)?.id ?? createUser({ username: name, bot: true }));
}

export function botTick(ids) {
  const id = ids[randomInt(0, ids.length)];
  const boosters = BOOSTERS.filter((b) => !b.daily && !b.slots);
  G.openBooster(id, boosters[randomInt(0, boosters.length)].id, { bot: true });
  // de temps en temps : mise en vente d'un doublon
  if (randomInt(0, 3) === 0) {
    const dup = all('SELECT card, qty, reserved FROM collection WHERE user_id = ? AND qty - reserved > 1 ORDER BY RANDOM() LIMIT 1', id)[0];
    const active = one(`SELECT COUNT(*) AS n FROM listings WHERE seller_id = ? AND status = 'ACTIVE'`, id).n;
    if (dup && active < 25 && gameById(dup.card)) {
      const g = gameById(dup.card);
      const price = Math.max(1, Math.round(baseValue(g.n, g.r, TOTAL) * (0.8 + Math.random() * 0.9)));
      try { G.createListing(id, g.n, price); } catch { /* carte déjà engagée */ }
    }
  }
  // de temps en temps : une offre d'échange « je donne X contre l'un de Y »
  if (randomInt(0, 6) === 0) {
    const dup = all('SELECT card FROM collection WHERE user_id = ? AND qty - reserved > 1 ORDER BY RANDOM() LIMIT 1', id)[0];
    const open = one(`SELECT COUNT(*) AS n FROM offers WHERE user_id = ? AND status = 'OPEN'`, id).n;
    if (dup && open < 5 && gameById(dup.card)) {
      const g = gameById(dup.card);
      const same = all('SELECT n FROM cards_meta WHERE r = ? AND id NOT IN (SELECT card FROM collection WHERE user_id = ? AND qty > 0) ORDER BY RANDOM() LIMIT 3', g.r, id).map((x) => x.n);
      if (same.length) try { G.createOffer(id, g.n, same); } catch { /* ignoré */ }
    }
  }
  // historique des tirages : seuls les gros tirages des bots sont gardés au-delà de 7 jours
  run(`DELETE FROM pulls WHERE at < ? AND best NOT IN ('L','M') AND user_id IN (SELECT id FROM users WHERE is_bot = 1)`, Date.now() - 7 * 864e5);
  // annonces trop anciennes retirées
  for (const l of all(`SELECT id FROM listings WHERE seller_id = ? AND status = 'ACTIVE' AND created_at < ?`, id, Date.now() - 3 * 864e5)) {
    G.cancelListing(id, l.id);
  }
}

export function startBots() {
  const ids = ensureBots();
  // amorçage : quelques boosters pour que le marché ait du choix dès le premier lancement
  if (!one(`SELECT COUNT(*) AS n FROM listings WHERE status = 'ACTIVE'`).n) for (let i = 0; i < 160; i++) botTick(ids);
  setInterval(() => { try { botTick(ids); } catch (e) { console.error('bot', e.message); } }, 45_000).unref();
}


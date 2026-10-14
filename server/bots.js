// Bots : font vivre le marché et le flux de drops dès le premier jour.
// Ils ouvrent des boosters (sans payer) et mettent en vente au-dessus de la valeur de référence.
// Ils n'achètent jamais aux joueurs → aucun argent créé ; chaque achat chez un bot est un puits.
import { PACKS } from '../shared/packs.js';
import { one, all, run, tx, now } from './db.js';
import { openPack, rand } from './cards.js';
import { insertCard, valueOfRow } from './game.js';
import { createUser } from './auth.js';

const NAMES = ['Kestrel', 'Vandal_7', 'NoxRaven', 'Mirefox', 'Sable.K', 'Orbit_Lux', 'Talon88', 'Hexwright',
  'GreyMantis', 'Ashen_Ivy', 'Pyrelight', 'Quillon', 'Driftmark', 'Zeroflare', 'Lumen_Cat', 'Brassjaw'];
const BOT_LISTING_TTL = 6 * 3600e3;

export function ensureBots() {
  for (const n of NAMES) if (!one('SELECT id FROM users WHERE username = ?', n)) createUser({ username: n, isBot: true });
  const bots = all('SELECT id FROM users WHERE is_bot = 1');
  const listed = one("SELECT COUNT(*) n FROM listings WHERE status = 'ACTIVE' AND seller_id IN (SELECT id FROM users WHERE is_bot = 1)").n;
  for (let i = Math.ceil(listed / 2); i < 60; i++) botTick(bots, true);
  return bots;
}

function botTick(bots, silent = false) {
  const bot = bots[Math.floor(rand() * bots.length)];
  const paid = PACKS.filter((p) => !p.free);
  // les boosters bon marché sont ouverts plus souvent
  const weights = paid.map((p) => 1 / Math.sqrt(p.price));
  let x = rand() * weights.reduce((a, b) => a + b, 0);
  const pack = paid.find((_, i) => (x -= weights[i]) < 0) || paid[0];
  tx(() => {
    const { cards } = openPack(pack, { ultra: 0, legend: 0 }, false);
    run('UPDATE users SET packs_opened = packs_opened + 1 WHERE id = ?', bot.id);
    // trie : les cartes intéressantes vont au marché, le reste est détruit
    for (const c of cards) {
      const id = insertCard(bot.id, c, `PACK:${pack.key}`);
      const row = one('SELECT * FROM cards WHERE id = ?', id);
      if (row.rarity >= 3 || row.misprint) run('INSERT INTO feed (user_id, card_id, at) VALUES (?,?,?)', bot.id, id, now());
      if (row.rarity >= 2 || row.misprint || (row.rarity === 1 && rand() < 0.5)) {
        const price = Math.max(2, Math.round(valueOfRow(row) * (1.05 + rand() * 0.35)));
        run("UPDATE cards SET status = 'LISTED' WHERE id = ?", id);
        run('INSERT INTO listings (card_id, seller_id, price, created_at) VALUES (?,?,?,?)', id, bot.id, price, now() - (silent ? Math.floor(rand() * 3 * 3600e3) : 0));
      } else {
        run("UPDATE cards SET status = 'BURNED' WHERE id = ?", id);
      }
    }
  });
}

function expireBotListings() {
  tx(() => {
    for (const l of all(`SELECT l.id, l.card_id FROM listings l JOIN users u ON u.id = l.seller_id
      WHERE l.status = 'ACTIVE' AND u.is_bot = 1 AND l.created_at < ?`, now() - BOT_LISTING_TTL)) {
      run("UPDATE listings SET status = 'EXPIRED' WHERE id = ?", l.id);
      run("UPDATE cards SET status = 'BURNED' WHERE id = ?", l.card_id);
    }
  });
}

export function startBots() {
  const bots = ensureBots();
  setInterval(() => {
    try {
      botTick(bots);
      expireBotListings();
      // garde le flux de drops raisonnable
      run('DELETE FROM feed WHERE id < (SELECT MAX(id) - 500 FROM feed)');
    } catch (e) { console.error('[bots]', e.message); }
  }, Number(process.env.BOT_TICK_MS || 90_000)).unref();
}

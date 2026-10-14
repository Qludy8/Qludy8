// Vérification de compte par Discord (OAuth2, scope « identify »).
// Variables : DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, PUBLIC_URL (ex. https://armaris.example).
// En local sans application Discord : DISCORD_DEV_MOCK=1 active un bouton de vérification simulée.
import { randomBytes } from 'node:crypto';
import { DISCORD } from '../shared/config.js';
import { one, run, now } from './db.js';
import { HttpError, verifyDiscord } from './game.js';

const API = 'https://discord.com/api/v10';
const cfg = () => ({
  id: process.env.DISCORD_CLIENT_ID,
  secret: process.env.DISCORD_CLIENT_SECRET,
  redirect: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/api/discord/callback`,
  mock: process.env.DISCORD_DEV_MOCK === '1',
});
export const discordMode = () => (cfg().id && cfg().secret ? 'oauth' : cfg().mock ? 'mock' : 'off');

// Les actions sensibles exigent un compte vérifié dès que la vérification est disponible
export function assertVerified(user, action) {
  if (discordMode() === 'off' || !DISCORD.gated.includes(action)) return;
  if (!user?.discord_verified_at) throw new HttpError(403, 'Vérifiez votre compte avec Discord pour utiliser cette fonction');
}
export function requireVerified(action) {
  return (req, _res, next) => { assertVerified(req.user, action); next(); };
}

// Date de création d'un compte Discord : encodée dans son identifiant (snowflake)
export const snowflakeDate = (id) => Number((BigInt(id) >> 22n) + 1420070400000n);

export function mountDiscord(app, requireUser) {
  app.get('/discord/start', requireUser, (req, res) => {
    const c = cfg();
    if (discordMode() !== 'oauth') throw new HttpError(400, 'Discord n’est pas configuré sur ce serveur');
    const state = randomBytes(16).toString('hex');
    run('DELETE FROM oauth_states WHERE at < ?', now() - 15 * 60e3);
    run('INSERT INTO oauth_states (state, user_id, at) VALUES (?,?,?)', state, req.user.id, now());
    const url = new URL('https://discord.com/oauth2/authorize');
    url.search = new URLSearchParams({ client_id: c.id, response_type: 'code', scope: 'identify', redirect_uri: c.redirect, state, prompt: 'none' });
    res.redirect(url.toString());
  });

  app.get('/discord/callback', async (req, res) => {
    const back = (status, msg) => res.redirect(`/#/settings?discord=${status}&msg=${encodeURIComponent(msg || '')}`);
    try {
      const c = cfg();
      const st = one('SELECT * FROM oauth_states WHERE state = ?', String(req.query.state || ''));
      if (!st || now() - st.at > 15 * 60e3) return back('error', 'Session de vérification expirée');
      run('DELETE FROM oauth_states WHERE state = ?', st.state);
      if (!req.query.code) return back('error', 'Autorisation refusée');
      const tokenRes = await fetch(`${API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: c.id, client_secret: c.secret, grant_type: 'authorization_code', code: String(req.query.code), redirect_uri: c.redirect }),
      });
      if (!tokenRes.ok) return back('error', 'Échange du code Discord refusé');
      const { access_token } = await tokenRes.json();
      const meRes = await fetch(`${API}/users/@me`, { headers: { Authorization: `Bearer ${access_token}` } });
      if (!meRes.ok) return back('error', 'Profil Discord illisible');
      const d = await meRes.json();
      const ageDays = (now() - snowflakeDate(d.id)) / 864e5;
      if (ageDays < DISCORD.minAccountAgeDays) return back('error', `Compte Discord trop récent (minimum ${DISCORD.minAccountAgeDays} jours)`);
      verifyDiscord(st.user_id, d.id, d.global_name || d.username);
      back('ok');
    } catch (e) {
      back('error', e instanceof HttpError ? e.message : 'Erreur Discord');
    }
  });

  app.post('/discord/mock', requireUser, (req, res) => {
    if (discordMode() !== 'mock') throw new HttpError(404, 'Indisponible');
    verifyDiscord(req.user.id, `mock-${req.user.id}`, `${req.user.username}#dev`);
    res.json({ ok: true });
  });

}

// Mugigo – serveur HTTP (Express) : API JSON + fichiers statiques (public/ et shared/).
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadUser } from './auth.js';
import { api } from './api.js';
import { startBots } from './bots.js';
import { HttpError } from './game.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' });
  next();
});
app.use(loadUser);
app.use('/api', api());
app.use('/api', (_req, res) => res.status(404).json({ error: 'Route inconnue' }));
// le service worker doit toujours être relu (sinon les mises à jour du jeu tardent)
app.get('/sw.js', (_req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(join(root, 'public', 'sw.js')); });
app.use('/shared', express.static(join(root, 'shared'), { maxAge: '1h' }));
app.use(express.static(join(root, 'public'), { maxAge: '1h' }));
app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(root, 'public', 'index.html')));

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide' });
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

if (process.env.BOTS !== '0') startBots();
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Mugigo prêt sur http://localhost:${port}`));

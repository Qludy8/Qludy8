// Gēmu – serveur HTTP (Express) : API JSON + fichiers statiques (public/, shared/, catalogue).
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { networkInterfaces } from 'node:os';
import { loadUser } from './auth.js';
import { api } from './api.js';
import { startBots } from './bots.js';
import { HttpError } from './game.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' });
  next();
});
app.use(loadUser);
app.get('/api/version', (_req, res) => res.json({ version }));
app.use('/api', api());
app.use('/api', (_req, res) => res.status(404).json({ error: 'Route inconnue' }));

// Catalogue des jeux : envoyé compressé, en cache tant que le fichier ne change pas.
const catalogRaw = readFileSync(join(root, 'catalog', 'games.json'));
const catalogGz = gzipSync(catalogRaw, { level: 9 });
const catalogTag = `"${version}-${catalogRaw.length}"`;
app.get('/catalog.json', (req, res) => {
  res.set({ 'Content-Type': 'application/json; charset=utf-8', ETag: catalogTag, 'Cache-Control': 'no-cache', Vary: 'Accept-Encoding' });
  if (req.headers['if-none-match'] === catalogTag) return res.status(304).end();
  if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) return res.set('Content-Encoding', 'gzip').send(catalogGz);
  res.send(catalogRaw);
});

app.get('/sw.js', (_req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(join(root, 'public', 'sw.js')); });
const fresh = { setHeaders: (res) => res.set('Cache-Control', 'no-cache') };
app.use('/shared', express.static(join(root, 'shared'), fresh));
app.use(express.static(join(root, 'public'), fresh));
app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(root, 'public', 'index.html')));

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide' });
  console.error(err);
  res.status(500).json({ error: 'Le serveur a un souci. Réessaie dans un instant.' });
});

if (process.env.BOTS !== '0') startBots();
const port = Number(process.env.PORT || 4848);
const lan = Object.values(networkInterfaces()).flat().filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => `http://${a.address}:${port}`);
app.listen(port, () => {
  console.log(`Gēmu v${version} prêt sur http://localhost:${port}`);
  if (lan.length) console.log(`Sur téléphone (même Wi-Fi) : ${lan.join('  ou  ')}`);
}).on('error', (e) => {
  if (e.code !== 'EADDRINUSE') throw e;
  console.error(`\nLe port ${port} est déjà utilisé par un autre serveur.
  → Fermez sa fenêtre (ou Ctrl+C dedans), puis relancez npm start.
  → Ou lancez celui-ci sur un autre port : $env:PORT=4949; npm start   (puis ouvrez http://localhost:4949)\n`);
  process.exit(1);
});

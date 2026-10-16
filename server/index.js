// Mugigo – serveur HTTP (Express) : API JSON + fichiers statiques (public/ et shared/).
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
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
app.get('/api/version', (_req, res) => res.json({ version }));
app.use('/api', api());
app.use('/api', (_req, res) => res.status(404).json({ error: 'Route inconnue' }));
// le service worker doit toujours être relu (sinon les mises à jour du jeu tardent)
app.get('/sw.js', (_req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(join(root, 'public', 'sw.js')); });
// code du jeu (JS, CSS, HTML) : revalidé à chaque chargement, pour toujours servir la dernière version ;
// images d'armes : adresses versionnées (?v=…), donc gardées longtemps en cache
const fresh = { setHeaders: (res, path) => res.set('Cache-Control', /\/img\//.test(path) ? 'public, max-age=604800' : 'no-cache') };
app.use('/shared', express.static(join(root, 'shared'), fresh));
app.use(express.static(join(root, 'public'), fresh));
app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(root, 'public', 'index.html')));

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide' });
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

if (process.env.BOTS !== '0') startBots();
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const port = Number(process.env.PORT || 4747);
// adresses du PC sur le réseau local : à ouvrir depuis un téléphone connecté au même Wi-Fi
const lan = Object.values(networkInterfaces()).flat().filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => `http://${a.address}:${port}`);
app.listen(port, () => {
  console.log(`Mugigo v${version} prêt sur http://localhost:${port}`);
  if (lan.length) console.log(`Sur téléphone (même Wi-Fi) : ${lan.join('  ou  ')}`);
}).on('error', (e) => {
  if (e.code !== 'EADDRINUSE') throw e;
  console.error(`\nLe port ${port} est déjà utilisé : un autre serveur (sans doute une ancienne version de Mugigo) tourne encore.
  → Fermez sa fenêtre ou faites Ctrl+C dedans, puis relancez npm start.
  → Ou arrêtez-le sous Windows (PowerShell) : Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force
  → Ou lancez celui-ci sur un autre port : $env:PORT=4848; npm start   (puis ouvrez http://localhost:4848)\n`);
  process.exit(1);
});

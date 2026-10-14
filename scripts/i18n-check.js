// Vérifie que chaque t('…') du code a une traduction anglaise.
// usage : node scripts/i18n-check.js [fichiers…]   (par défaut : public/js et shared)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EN } from '../shared/lang/en.js';

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
const files = process.argv.slice(2).length ? process.argv.slice(2) : [...walk('public/js'), ...walk('shared').filter((f) => !f.includes('/lang/'))];
// t('…'), t("…") ou t(`…`) sans interpolation ${}
const re = /\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\$]|\\.)*)`)/g;
let missing = 0, total = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(re)) {
    total++;
    const key = (m[1] ?? m[2] ?? m[3]).replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n');
    if (EN[key] == null) { missing++; console.log(`${f}: ${JSON.stringify(key)}`); }
  }
  for (const m of src.matchAll(/\bt\(\s*`[^`]*\$\{/g)) console.log(`${f}: interpolation dans t(\`…\`) interdite → utiliser {var} : ${m[0]}`);
}
console.log(`${total} appels t(), ${missing} sans traduction`);
process.exit(missing ? 1 : 0);

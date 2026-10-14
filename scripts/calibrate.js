// Monte-Carlo : valeur espérée (EV) de chaque booster vs son prix + retour en « vente au système ».
// Usage : npm run calibrate [-- 20000]
import { PACKS, ECONOMY, RARITIES } from '../shared/config.js';
import { SKIN_BY_ID } from '../shared/catalog.js';
import { openPack } from '../server/cards.js';
import { cardValue } from '../shared/rules.js';

const N = Number(process.argv[2] || 20000);
console.log(`Simulation : ${N} ouvertures par booster\n`);
for (const pack of PACKS) {
  let total = 0; const byR = new Array(RARITIES.length).fill(0);
  let pity = { ultra: 0, legend: 0 };
  for (let i = 0; i < N; i++) {
    const res = openPack(pack, pity, !pack.free);
    pity = res.pity;
    for (const c of res.cards) {
      const s = SKIN_BY_ID.get(c.s);
      const v = cardValue(c, s).value;
      total += v; byR[s.r] += v;
    }
  }
  const ev = total / N;
  const ratio = pack.price ? ev / pack.price : null;
  console.log(
    `${pack.fr.padEnd(18)} prix ${String(pack.price).padStart(5)} | EV ${ev.toFixed(1).padStart(8)}` +
    (ratio ? ` | EV/prix ${(ratio * 100).toFixed(0)} % | revente système ${(ratio * ECONOMY.sellToSystemRate * 100).toFixed(0)} %` : '') +
    `\n    part de l'EV par rareté : ${byR.map((x, r) => `${RARITIES[r].fr} ${((x / total) * 100).toFixed(0)}%`).join(' · ')}`,
  );
}

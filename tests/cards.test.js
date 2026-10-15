import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollFloat, rollCentering, openPack, gradeCard, rollCard } from '../server/cards.js';
import { SKINS, SKIN_BY_ID } from '../shared/catalog.js';
import { CENTERING, GRADING, PITY } from '../shared/config.js';
import { PACKS, packFilter } from '../shared/packs.js';
import { wearOf } from '../shared/rules.js';

test('le float reste dans les bornes du skin', () => {
  for (const s of SKINS.filter((_, i) => i % 37 === 0)) {
    for (let i = 0; i < 200; i++) { const f = rollFloat(s); assert.ok(f >= s.fmin && f < s.fmax, `${s.id} ${f}`); }
  }
});

test('distribution d’usure proche des poids', () => {
  const s = SKINS.find((x) => x.fmin === 0 && x.fmax === 1);
  const n = 20000, c = {};
  for (let i = 0; i < n; i++) { const k = wearOf(rollFloat(s)).key; c[k] = (c[k] || 0) + 1; }
  assert.ok(Math.abs(c.RV / n - 0.44) < 0.02);
  assert.ok(Math.abs(c.IM / n - 0.04) < 0.01);
});

test('centrage dans les bornes', () => {
  for (let i = 0; i < 2000; i++) { const { cx, cy } = rollCentering(); assert.ok(cx >= CENTERING.min && cx <= CENTERING.max && cy >= CENTERING.min && cy <= CENTERING.max); }
});

test('les cartes respectent le pool du booster', () => {
  for (const p of PACKS) {
    for (let i = 0; i < 50; i++) for (const c of openPack(p).cards) {
      const s = SKIN_BY_ID.get(c.s);
      assert.ok(packFilter(p.filter)(s), `${p.key} : ${s.id} hors contenu`);
      assert.ok(c.pt >= 0 && c.pt < 1000);
      assert.ok(p.rates[s.r] > 0, `${p.key} rareté ${s.r} interdite`);
      assert.equal(c.foil, 0);
    }
  }
});

test('garantie (pity) Ultra rare+', () => {
  const p = PACKS.find((x) => x.key === 'standard');
  for (let i = 0; i < 200; i++) {
    const r = openPack(p, { ultra: PITY.ultraAfter - 1, legend: 0 });
    assert.ok(r.cards.some((c) => SKIN_BY_ID.get(c.s).r >= 3));
    assert.equal(r.pity.ultra, 0);
  }
});

test('gradation : plafonds par usure et règle « plus basse sous-note + 1 »', () => {
  const s = SKINS[0];
  for (let i = 0; i < 3000; i++) {
    const c = rollCard(s.r, null);
    const { subs, grade } = gradeCard(c);
    assert.ok(grade <= GRADING.maxByWear[wearOf(c.f).key]);
    assert.ok(grade <= Math.min(...Object.values(subs)) + 1);
    assert.ok(grade >= 1 && grade <= 10 && (grade * 2) % 1 === 0);
  }
});

test('garantie Transcendant sur les boosters premium uniquement', () => {
  const royal = PACKS.find((x) => x.key === 'royal'), std = PACKS.find((x) => x.key === 'standard');
  const r = openPack(royal, { ultra: 0, legend: 0, trans: PITY.transcendentAfter - 1 });
  assert.ok(r.cards.some((c) => SKIN_BY_ID.get(c.s).r === 6));
  assert.equal(r.pity.trans, 0);
  const s = openPack(std, { ultra: 0, legend: 0, trans: 10 });
  assert.equal(s.pity.trans, 10, 'un booster bon marché ne fait pas avancer le compteur');
});

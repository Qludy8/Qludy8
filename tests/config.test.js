import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, RARITIES, WEAR, CATALOG_QUOTA, SKINS_PER_MODEL } from '../shared/config.js';
import { SKINS, MODELS } from '../shared/catalog.js';

test('chaque table de taux totalise 100 %', () => {
  for (const p of PACKS) {
    const sum = p.rates.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 100) < 1e-9, `${p.key} = ${sum}`);
    assert.equal(p.rates.length, RARITIES.length);
  }
});

test('les poids d’usure couvrent [0,1] sans trou', () => {
  let x = 0;
  for (const t of WEAR.tiers) { assert.equal(t.min, x); x = t.max; }
  assert.equal(x, 1);
});

test('catalogue : milliers de skins uniques et déterministes', () => {
  assert.equal(SKINS.length, MODELS.length * SKINS_PER_MODEL);
  assert.equal(new Set(SKINS.map((s) => s.id)).size, SKINS.length);
  for (const m of MODELS) {
    const names = SKINS.filter((s) => s.m === m.key).map((s) => s.n);
    assert.equal(new Set(names).size, names.length, `noms en double pour ${m.key}`);
    CATALOG_QUOTA.forEach((q, r) => assert.equal(SKINS.filter((s) => s.m === m.key && s.r === r).length, q));
  }
  for (const s of SKINS) {
    assert.ok(s.fmin >= 0 && s.fmax <= 1 && s.fmax - s.fmin >= 0.2);
    const [lo, hi] = RARITIES[s.r].base;
    assert.ok(s.base >= lo && s.base <= hi);
  }
});

test('chaque rareté tirable d’un booster a au moins un skin', () => {
  for (const p of PACKS) {
    p.rates.forEach((rate, r) => {
      if (!rate) return;
      const pool = SKINS.filter((s) => s.r === r && (!p.classes || p.classes.includes(s.cls)));
      assert.ok(pool.length > 0, `${p.key} / rareté ${r}`);
    });
  }
});

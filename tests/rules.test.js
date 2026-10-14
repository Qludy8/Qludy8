import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wearOf, centeringScore, cardValue, gradeLabel, extremeMult } from '../shared/rules.js';
import { SKINS } from '../shared/catalog.js';
import { MISPRINT } from '../shared/config.js';

const skin = SKINS.find((s) => s.r === 3);
const base = { f: 0.05, cx: 50, cy: 50, tr: null, foil: 0, mp: null, g: null };

test('paliers d’usure', () => {
  assert.equal(wearOf(0).key, 'IM');
  assert.equal(wearOf(0.07).key, 'PM');
  assert.equal(wearOf(0.2).key, 'EP');
  assert.equal(wearOf(0.44).key, 'US');
  assert.equal(wearOf(0.99).key, 'RV');
});

test('note de centrage façon PSA', () => {
  assert.equal(centeringScore(50, 50), 10);
  assert.equal(centeringScore(55, 50), 10);
  assert.equal(centeringScore(58, 49), 9);
  assert.equal(centeringScore(28, 50), 6);
});

test('le centrage modifie la valeur en + ou en −', () => {
  const good = cardValue(base, skin).value;
  const bad = cardValue({ ...base, cx: 30 }, skin).value;
  assert.ok(good > skin.base, 'parfaitement centrée > base');
  assert.ok(bad < skin.base, 'mal centrée < base');
});

test('la gradation peut faire gagner ou perdre de la valeur', () => {
  const raw = cardValue({ ...base, cx: 52 }, skin).value;
  assert.ok(cardValue({ ...base, g: 10 }, skin).value > raw * 4);
  assert.ok(cardValue({ ...base, g: 4 }, skin).value < raw);
  assert.equal(gradeLabel(10), 'Pristine');
  assert.equal(gradeLabel(9.5), 'Gem Mint');
});

test('carte erreur et float extrême', () => {
  const v = cardValue({ ...base, mp: SKINS[1].id }, skin).value;
  assert.ok(v >= skin.base * MISPRINT.valueMult * 0.99);
  assert.ok(extremeMult(0.0001) > 2.5);
  assert.equal(extremeMult(0.5), 1);
});

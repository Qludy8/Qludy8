import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, rng, finishFrench, negArticle } from '../js/generator.js';
import { WORDS } from '../js/words.js';
import { THEMES } from '../js/content/vocab.js';

test('élisions et négation française', () => {
  assert.equal(finishFrench('je aime le café.'), 'J’aime le café.');
  assert.equal(finishFrench('est-ce que il fait beau ?'), 'Est-ce qu’il fait beau ?');
  assert.equal(finishFrench('je ne ai pas bu de eau.'), 'Je n’ai pas bu d’eau.');
  assert.equal(negArticle('du pain'), 'de pain');
  assert.equal(negArticle('une lettre'), 'de lettre');
  assert.equal(negArticle('un livre'), 'de livre');
  assert.equal(negArticle('de l’eau'), 'de eau');
  assert.equal(negArticle('le coréen'), 'le coréen');
});

test('exemples précis', () => {
  // On vérifie la cohérence sur des milliers de phrases générées.
  const r = rng(1);
  const levels = [1, 2, 3];
  const opts = { tense: ['present', 'past', 'future', 'random'], style: ['polite', 'formal', 'casual'], form: ['affirm', 'neg', 'question', 'want', 'random'], theme: ['all', ...Object.keys(THEMES)] };
  for (let i = 0; i < 4000; i++) {
    const o = { level: levels[i % 3], tense: opts.tense[i % 4], style: opts.style[i % 3], form: opts.form[i % 5], theme: opts.theme[i % opts.theme.length] };
    const p = generate(o, r);
    assert.match(p.kr, /^[가-힣 ]+[.?]$/, p.kr);
    assert.ok(!/undefined|null|NaN/.test(p.kr + p.fr), p.kr + ' / ' + p.fr);
    assert.match(p.fr, /^[A-ZÀ-Ý]/, p.fr);
    assert.equal(p.tiles.join(' ') + p.end, p.kr);
    assert.ok(/[.?]$/.test(p.fr), p.fr);
    if (p.meta.form === 'question') assert.ok(p.kr.endsWith('?') && p.fr.endsWith('?'));
    if (p.meta.form === 'neg') assert.ok(/안 |않|없/.test(p.kr) && / pas\b/.test(p.fr), p.kr + ' / ' + p.fr);
    if (p.meta.form === 'want') assert.ok(/고 싶/.test(p.kr) && /veu|voul/.test(p.fr), p.kr + ' / ' + p.fr);
    if (p.meta.style === 'formal') assert.ok(/(니다|니까)[.?]$/.test(p.kr), p.kr);
    if (p.meta.style === 'casual') assert.ok(!/요[.?]$/.test(p.kr), p.kr);
    assert.ok(!/ (le|la|de|que|je|ne) [aeéèiouh]/i.test(p.fr), 'élision manquante : ' + p.fr);
    assert.ok(!/d’e /.test(p.fr), p.fr);
  }
});

test('même graine, même phrase', () => {
  assert.deepEqual(generate({ level: 2 }, rng(7)), generate({ level: 2 }, rng(7)));
});

test('lexique sans doublon', () => {
  assert.equal(new Set(WORDS.map((w) => w.id)).size, WORDS.length);
  for (const w of WORDS) assert.ok(w.kr && w.fr && w.t, JSON.stringify(w));
});

test('guide : leçons valides', async () => {
  const { GUIDE, GUIDE_CATS } = await import('../js/content/guide.js');
  assert.equal(new Set(GUIDE.map((g) => g.id)).size, GUIDE.length);
  for (const g of GUIDE) {
    assert.ok(GUIDE_CATS[g.cat] && g.title && g.sum && g.blocks.length, g.id);
    for (const b of g.blocks) {
      assert.ok(b.p || b.tip || b.table || b.ex, g.id);
      for (const [kr, fr] of b.ex || []) assert.ok(/[가-힣]/.test(kr) && fr, `${g.id} : ${kr}`);
    }
  }
});

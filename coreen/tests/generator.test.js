import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { generate, rng, finishFrench, negArticle } from '../js/generator.js';
import { KO, AWKWARD_EN } from '../js/lang/ko.js';
import { JA, AWKWARD_JA, conjugateJa } from '../js/lang/ja.js';
import { kanaToRomaji, toKata } from '../js/lang/kana.js';
import { THEMES } from '../js/content/concepts.js';
import { AWKWARD } from '../js/content/awkward.js';
import { STRINGS } from '../js/content/strings.js';
import { normalize } from '../js/store.js';

test('élisions et négation française', () => {
  assert.equal(finishFrench('je aime le café.'), 'J’aime le café.');
  assert.equal(finishFrench('est-ce que il fait beau ?'), 'Est-ce qu’il fait beau ?');
  assert.equal(finishFrench('je ne ai pas bu de eau.'), 'Je n’ai pas bu d’eau.');
  assert.equal(negArticle('du pain'), 'de pain');
  assert.equal(negArticle('une lettre'), 'de lettre');
  assert.equal(negArticle('un livre'), 'de livre');
  assert.equal(negArticle('le coréen'), 'le coréen');
});

const OPTS = {
  tense: ['present', 'past', 'future', 'random'],
  form: ['affirm', 'neg', 'question', 'want', 'random'],
  theme: ['all', ...Object.keys(THEMES)],
};

function checkCommon(p, o) {
  assert.ok(!/undefined|null|NaN|\{/.test(p.tl + p.fr + p.en + p.rom), `${p.tl} / ${p.fr} / ${p.en}`);
  assert.match(p.fr, /^[A-ZÀ-Ý]/, p.fr);
  assert.match(p.en, /^[A-Z]/, p.en);
  assert.ok(/[.?]$/.test(p.fr) && /[.?]$/.test(p.en), p.fr + ' / ' + p.en);
  assert.equal(p.tiles.join(p.sep) + p.end, p.tl);
  if (p.meta.form === 'question') assert.ok(p.fr.endsWith('?') && p.en.endsWith('?'), p.fr + ' / ' + p.en);
  assert.ok(!/ (le|la|de|que|je|ne) [aeéèiouh]/i.test(p.fr), 'élision manquante : ' + p.fr);
  assert.ok(!/d’e /.test(p.fr), p.fr);
  for (const n of p.notes) assert.ok(n.fr && n.en, JSON.stringify(n));
  for (const w of p.words) assert.ok(w.tl && w.fr && w.en, JSON.stringify(w));
}

test('coréen : milliers de phrases cohérentes', () => {
  const r = rng(1);
  for (let i = 0; i < 4000; i++) {
    const o = { level: 1 + (i % 3), tense: OPTS.tense[i % 4], style: KO.styles[i % 3], form: OPTS.form[i % 5], theme: OPTS.theme[i % OPTS.theme.length], mood: i % 11 === 0 ? 'awkward' : 'normal' };
    const p = generate(o, r, KO);
    checkCommon(p, o);
    assert.match(p.tl, /^[가-힣 ]+[.?]$/, p.tl);
    if (p.meta.mood === 'awkward') continue;
    if (p.meta.form === 'neg') assert.ok(/안 |않|없/.test(p.tl) && / pas\b/.test(p.fr) && /n't|not/.test(p.en), p.tl + ' / ' + p.fr + ' / ' + p.en);
    if (p.meta.form === 'want') assert.ok(/고 싶/.test(p.tl) && /veu|voul/.test(p.fr) && /want/.test(p.en), p.tl + ' / ' + p.en);
    if (p.meta.style === 'formal') assert.ok(/(니다|니까)[.?]$/.test(p.tl), p.tl);
    if (p.meta.style === 'casual') assert.ok(!/요[.?]$/.test(p.tl), p.tl);
  }
});

test('japonais : milliers de phrases cohérentes', () => {
  const r = rng(2);
  for (let i = 0; i < 4000; i++) {
    const o = { level: 1 + (i % 3), tense: OPTS.tense[i % 4], style: ['polite', 'casual', 'formal'][i % 3], form: OPTS.form[i % 5], theme: OPTS.theme[i % OPTS.theme.length], mood: i % 11 === 0 ? 'awkward' : 'normal' };
    const p = generate(o, r, JA);
    checkCommon(p, o);
    assert.match(p.tl, /^[぀-ヿ一-龯ー「」A-Z]+[。？]$/, p.tl);
    assert.ok(/^[A-Za-z' “”]+[.?]$/.test(p.rom), p.rom);
    assert.ok(p.ruby && p.ruby.every((x) => x.w && x.r), p.tl);
    if (p.meta.style === 'polite') assert.ok(/(です|ます|ました|ません|でした|ませんでした)か?[。？]$/.test(p.tl), p.tl);
    if (p.meta.style === 'casual') assert.ok(!/(です|ます)[。？]$/.test(p.tl), p.tl);
    if (p.meta.mood === 'awkward') continue;
    if (p.meta.form === 'neg') assert.ok(/ない|ません|なかった/.test(p.tl) && /n't|not/.test(p.en), p.tl + ' / ' + p.en);
    if (p.meta.form === 'want') assert.ok(/たい|たく|たか|たが/.test(p.tl), p.tl);
    if (p.meta.form === 'question') assert.ok(p.tl.endsWith('？'), p.tl);
  }
});

test('japonais : conjugaisons', () => {
  const v = (w, r, g) => ({ w, r, g });
  const c = (verb, o) => conjugateJa(verb, { tense: 'present', polite: true, ...o })[0];
  const taberu = v('食べる', 'たべる', '1');
  const nomu = v('飲む', 'のむ', '5');
  const iku = v('行く', 'いく', 'iku');
  const kuru = v('来る', 'くる', 'kuru');
  const suru = v('勉強する', 'べんきょうする', 'suru');
  const kau = v('買う', 'かう', '5');
  assert.equal(c(taberu), '食べます');
  assert.equal(c(taberu, { tense: 'past', neg: true }), '食べませんでした');
  assert.equal(c(taberu, { polite: false, neg: true }), '食べない');
  assert.equal(c(nomu, { polite: false, tense: 'past' }), '飲んだ');
  assert.equal(c(nomu, { polite: false, neg: true }), '飲まない');
  assert.equal(c(kau, { polite: false, neg: true }), '買わない');
  assert.equal(c(kau, { polite: false, tense: 'past' }), '買った');
  assert.equal(c(iku, { polite: false, tense: 'past' }), '行った');
  assert.deepEqual(conjugateJa(kuru, { tense: 'present', polite: false, neg: true }), ['来ない', 'こない']);
  assert.equal(c(kuru), '来ます');
  assert.equal(c(suru, { tense: 'past' }), '勉強しました');
  assert.equal(c(taberu, { want: true }), '食べたいです');
  assert.equal(c(taberu, { want: true, neg: true, tense: 'past' }), '食べたくなかったです');
  assert.equal(c(nomu, { want: true, third: true }), '飲みたがっています');
  assert.equal(c(v('高い', 'たかい', 'i'), { neg: true }), '高くないです');
  assert.equal(c(v('いい', 'いい', 'i'), { tense: 'past' }), 'よかったです');
  assert.equal(c(v('好き', 'すき', 'na'), { neg: true }), '好きじゃないです');
  assert.equal(c(v('好き', 'すき', 'na'), { polite: false }), '好きだ');
  assert.equal(c(v('食べる', 'たべる', '1'), { question: true }), '食べますか');
});

test('japonais : rōmaji', () => {
  const cases = { すし: 'sushi', きって: 'kitte', ちょっと: 'chotto', とうきょう: 'toukyou', ラーメン: 'raamen', しんぶん: 'shinbun', こんいん: "kon'in", ちゃ: 'cha', がっこう: 'gakkou', ぎゅうにゅう: 'gyuunyuu' };
  for (const [k, r] of Object.entries(cases)) assert.equal(kanaToRomaji(k), r, k);
  assert.equal(toKata('ぱん'), 'パン');
});

test('même graine, même phrase', () => {
  assert.deepEqual(generate({ level: 2 }, rng(7), KO), generate({ level: 2 }, rng(7), KO));
  assert.deepEqual(generate({ level: 3 }, rng(9), JA), generate({ level: 3 }, rng(9), JA));
});

test('lexiques et guides', () => {
  for (const C of [KO, JA]) {
    assert.ok(C.words.length > 120, C.id);
    assert.equal(new Set(C.words.map((w) => w.id)).size, C.words.length);
    for (const w of C.words) assert.ok(w.tl && w.fr && w.en && w.t, JSON.stringify(w));
    for (const lang of ['fr', 'en']) {
      const g = C.guide[lang];
      assert.ok(g.length >= 15, C.id + lang);
      assert.equal(new Set(g.map((x) => x.id)).size, g.length);
      for (const l of g) {
        assert.ok(['pron', 'gram', 'adv'].includes(l.cat) && typeof l.title === 'string' && typeof l.sum === 'string' && l.blocks.length, l.id);
        for (const b of l.blocks) for (const [tl, tr] of b.ex || []) assert.ok(/[가-힣぀-ヿ一-龯]/.test(tl) && tr, `${l.id} : ${tl}`);
      }
    }
    // Mêmes leçons dans les deux langues de l'interface
    assert.deepEqual(C.guide.fr.map((x) => x.id), C.guide.en.map((x) => x.id));
  }
});

test('phrases gênantes : traductions complètes', () => {
  assert.equal(AWKWARD_EN.length, AWKWARD.length);
  AWKWARD.forEach((e, i) => {
    for (const t of e.tenses || ['present', 'past', 'future']) assert.ok(e.fr[t] && AWKWARD_EN[i].en[t], `${e.pre} ${t}`);
    assert.equal(AWKWARD_EN[i].w.length, e.w.length, e.pre);
  });
  for (const e of AWKWARD_JA) assert.ok(AWKWARD[e.k], 'k ' + e.k);
});

test('textes de l’interface : toutes les clés existent en français et en anglais', () => {
  const dir = new URL('../js/', import.meta.url);
  const src = readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
  const keys = new Set([...src.matchAll(/\bt\('([a-zA-Z.]+)'/g)].map((m) => m[1]).filter((k) => !k.endsWith('.')));
  for (const k of ['pairs.errors', 'pairs.error', 'home.days', 'home.day', 'words.dueN', 'words.due1', 'progress.savedN', 'progress.saved1', 'guide.pron', 'guide.gram',
    'script.rulesSub.ko', 'script.rulesSub.ja', 'set.noVoice.ko', 'set.noVoice.ja', 'cel.levelText.ko', 'cel.levelText.ja', 'welcome.ko', 'welcome.ja']) keys.add(k);
  for (const k of keys) {
    assert.ok(STRINGS.fr[k], 'fr manquant : ' + k);
    assert.ok(STRINGS.en[k], 'en manquant : ' + k);
  }
  assert.deepEqual(Object.keys(STRINGS.fr).sort(), Object.keys(STRINGS.en).sort());
});

test('migration de l’ancienne progression (coréen seul)', () => {
  const old = { xp: 120, days: { '2026-11-10': 40 }, goal: 50, srs: { 빵: { b: 3 } }, journal: [{ kr: '빵' }], settings: { roman: false } };
  const r = normalize(old);
  assert.equal(r.v, 2);
  assert.equal(r.goal, 50);
  assert.equal(r.settings.roman, false);
  assert.equal(r.settings.course, 'ko');
  assert.equal(r.courses.ko.xp, 120);
  assert.equal(r.courses.ko.srs.빵.b, 3);
  assert.equal(r.courses.ja.xp, 0);
});

test('service worker : tous les fichiers de l’application sont mis en cache', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const root = new URL('../', import.meta.url);
  const walk = (rel) => readdirSync(new URL(rel, root), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(rel + d.name + '/') : [rel + d.name]));
  for (const f of walk('js/')) assert.ok(sw.includes(`'./${f}'`), 'absent du cache : ' + f);
});

test('japonais : kana regroupés et kanji', async () => {
  const { KANJI_NUM, KANJI_LIFE, KANJI_ACTION } = await import('../js/content/kanji.js');
  const sets = JA.script.sets;
  for (const k of ['base', 'voiced', 'combo']) for (const x of sets[k].items) assert.ok(x.j && x.j2 && x.r && x.j !== x.j2, x.j);
  const all = [...KANJI_NUM, ...KANJI_LIFE, ...KANJI_ACTION];
  assert.ok(all.length >= 70);
  assert.equal(new Set(all.map((x) => x.j)).size, all.length);
  for (const x of all) {
    assert.match(x.j, /^[一-龯]$/, x.j);
    assert.ok(x.on && x.kun && x.mean.fr && x.mean.en && x.ex.length === 4 && x.ex[0].includes(x.j), x.j);
    assert.match(x.say, /^[ぁ-ゖ]+$/, x.j);
  }
  for (let i = 0; i < 50; i++) assert.ok(JA.script.randomSyllable().rom, 'syllabe');
});

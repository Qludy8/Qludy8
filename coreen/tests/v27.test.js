import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assemble, disassemble, modifyKana, normAnswer } from '../js/keyboard.js';
import { ROADMAP, MODULES, CHAPTERS } from '../js/content/roadmap.js';
import { ALL_THEMES } from '../js/content/lexicon.js';
import { HANGUL_STROKES } from '../js/content/strokes.ko.js';
import { KANA_STROKES } from '../js/content/strokes.ja.js';
import { KANJI_STROKES } from '../js/content/strokes.kanji.js';
import { STRINGS } from '../js/content/strings.js';
import { KO } from '../js/lang/ko.js';
import { JA } from '../js/lang/ja.js';

test('clavier coréen : les lettres s’assemblent en syllabes', () => {
  const type = (s) => assemble([...s]);
  assert.equal(type('ㅎㅏㄴㄱㅡㄹ'), '한글');
  assert.equal(type('ㅇㅣㄹㄱㅇㅓㅇㅛ'), '읽어요');
  assert.equal(type('ㄷㅏㄹㄱ'), '닭');
  assert.equal(type('ㅇㅗㅏㅇㅛ'), '와요');
  assert.equal(type('ㅇㅓㅂㅅㅇㅓㅇㅛ'), '없어요');
  assert.equal(type('ㅗㅏ'), 'ㅘ');
  assert.equal(type('ㅂㅏㅂ ㅁㅓㄱㅇㅓ'), '밥 먹어');
  for (const w of KO.words) assert.equal(assemble(disassemble(w.tl)), w.tl, w.tl);
});

test('clavier japonais : marques et comparaison des réponses', () => {
  assert.equal(modifyKana('か', '゛'), 'が');
  assert.equal(modifyKana('が', '゛'), 'か');
  assert.equal(modifyKana('は', '゜'), 'ぱ');
  assert.equal(modifyKana('ば', '゜'), 'ぱ');
  assert.equal(modifyKana('キツ', '小'), 'キッ');
  assert.equal(normAnswer('コーヒー。'), normAnswer('こーひー'));
  assert.equal(normAnswer('밥 먹었어?'), '밥먹었어');
  // en japonais on écrit la lecture : elle ne doit contenir que des kana
  for (const w of JA.words) assert.doesNotMatch(w.r || w.tl.replace(/[一-龯々]/g, ''), /[一-龯々]/, w.tl);
});

test('parcours : chapitres complets, étapes uniques et contenus existants', () => {
  for (const C of [KO, JA]) {
    const R = ROADMAP[C.id];
    assert.ok(R.length >= 40, `${C.id} : ${R.length} modules`);
    assert.equal(R.length, MODULES[C.id].length, 'module hors chapitre');
    assert.equal(new Set(R.map((u) => u.id)).size, R.length);
    const steps = R.flatMap((u) => u.steps);
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, 'étape en double');
    const lessons = new Set(C.guide.fr.map((g) => g.id));
    for (const u of R) {
      assert.ok(u.title.fr && u.title.en && u.sub.fr && u.sub.en && u.glyph && u.color && u.steps.length, u.id);
      assert.ok(CHAPTERS[C.id].some((c) => c.id === u.chapter), u.id);
      for (const s of u.steps) {
        if (s.kind === 'lesson') assert.ok(lessons.has(s.lesson), s.lesson);
        if (s.theme) assert.ok(ALL_THEMES[s.theme] && C.words.filter((w) => w.t === s.theme).length >= 10, `${C.id} ${s.theme}`);
        if (s.set) assert.ok(C.script.sets[s.set] || ['syllables', 'words'].includes(s.set), s.set);
        if (s.title) assert.ok(s.title.fr && s.title.en, s.id);
      }
    }
    // chaque leçon du guide est reliée au parcours, et les rubriques existent dans les deux langues
    for (const l of lessons) assert.ok(steps.some((s) => s.lesson === l), 'leçon hors parcours : ' + l);
    assert.ok(C.guide.fr.filter((g) => g.sec).length >= 4);
    assert.equal(C.guide.fr.filter((g) => g.sec).length, C.guide.en.filter((g) => g.sec).length);
    for (const set of Object.values(C.script.sets)) if (!set.hidden) assert.ok(set.sym, 'symbole d’onglet');
  }
});

test('tracé : toutes les lettres ont leurs traits', () => {
  for (const set of Object.values(KO.script.sets)) for (const x of set.items) assert.ok(HANGUL_STROKES[x.j], x.j);
  for (const k of ['base', 'voiced']) for (const x of JA.script.sets[k].items) assert.ok(KANA_STROKES[x.j] && KANA_STROKES[x.j2], x.j);
  for (const x of JA.script.sets.kanji.items) assert.ok(KANJI_STROKES[x.j], x.j);
  // chemins bien formés : le bon nombre de coordonnées par commande
  const need = { m: 2, l: 2, c: 6, s: 4, q: 4, h: 1, v: 1, a: 7 };
  for (const all of [HANGUL_STROKES, KANA_STROKES, KANJI_STROKES]) {
    for (const [ch, d] of Object.entries(all)) {
      for (const c of d.matchAll(/([a-zA-Z])([^a-zA-Z|]*)/g)) {
        const n = (c[2].match(/-?\d*\.?\d+/g) || []).length;
        assert.ok(need[c[1].toLowerCase()] && n && n % need[c[1].toLowerCase()] === 0, `${ch} : ${c[0]}`);
      }
    }
  }
});

test('textes : les clés choisies à l’exécution existent aussi', () => {
  const src = ['quiz', 'draw', 'exam', 'road', 'phrases', 'app'].map((f) => readFileSync(new URL(`../js/${f}.js`, import.meta.url), 'utf8')).join('\n');
  const keys = new Set([...src.matchAll(/'((?:type|write|exam|final|road|script|ach|words|daily)\.[a-zA-Z0-9]+)'/g)].map((m) => m[1]));
  assert.ok(keys.size > 60);
  for (const k of keys) {
    assert.ok(STRINGS.fr[k], 'fr manquant : ' + k);
    assert.ok(STRINGS.en[k], 'en manquant : ' + k);
  }
});

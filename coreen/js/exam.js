// Examens : un par module (réussi, il fait passer le module au platine) et un examen final
// qui porte sur tout ce qui est terminé au moment où on le lance.
import { $, esc, shuffle, sfx } from './ui.js';
import * as store from './store.js';
import { course, t, tr, lang } from './course.js';
import { runQuiz, mcq, wordQuestion, letterQuestion, kanjiQuestion, kanaForms, syllableQuestion, shortWords } from './quiz.js';
import { phraseFor } from './phrases.js';
import { roadState } from './road.js';

const UNIT_LEN = 12;
const FINAL_LEN = 20;
const FINAL_PASS = 0.7;
const UNIT_BONUS = 20; // XP à la première réussite
const N_OPT = 5; // choix par question : un de plus que dans les quiz

const lessons = () => course().guide[lang()] || course().guide.fr;

/** Ce que couvrent des étapes : thèmes de vocabulaire, jeux de lettres, leçons, critères de phrases. */
function sourcesOf(steps, extraLessons = []) {
  const src = { themes: new Set(), sets: new Set(), lessons: new Set(extraLessons), crits: [] };
  for (const s of steps) {
    if (s.theme) src.themes.add(s.theme);
    if (s.set) src.sets.add(s.set);
    if (s.kind === 'lesson') src.lessons.add(s.lesson);
    if (s.kind === 'phrase' || s.kind === 'ptype') src.crits.push(s.crit);
    if (s.kind === 'daily') src.crits.push({ level: '2' });
    if (s.kind === 'pairs') src.sets.add('words');
  }
  return src;
}

// ---------- Questions tirées des leçons du guide ----------
/** Exemples des leçons : { tl, tr, pr } (pr : prononciation réelle en coréen, lecture en kana en japonais). */
function examplesOf(ids) {
  const seen = new Set();
  const out = [];
  for (const g of lessons()) {
    if (!ids.has(g.id)) continue;
    for (const b of g.blocks) for (const [tl, trans, pr] of b.ex || []) if (!seen.has(tl) && seen.add(tl)) out.push({ tl, tr: trans, pr });
  }
  return out;
}

function lessonQuestion(x, kind, pool) {
  const C = course();
  const others = pool.filter((o) => o.tl !== x.tl);
  const read = x.pr && C.id === 'ja' ? ` · ${x.pr}` : '';
  const base = { say: x.tl, explain: `<span class="kr">${esc(x.tl)}</span>${esc(read)}${x.pr && C.id === 'ko' ? ` [<span class="kr">${esc(x.pr)}</span>]` : ''} = ${esc(x.tr)}` };
  const size = x.tl.length > 14 ? 'xlong' : x.tl.length > 6 ? 'long' : '';
  if (kind === 'pron' && C.id === 'ko' && x.pr && x.pr !== x.tl) {
    // Comment se prononce vraiment ce mot ? (la forme écrite sert de piège)
    const options = shuffle([
      { label: x.pr, kr: true }, { label: x.tl, kr: true },
      ...shuffle(others.filter((o) => o.pr && o.pr !== x.pr && o.pr !== x.tl)).slice(0, 2).map((o) => ({ label: o.pr, kr: true })),
    ]);
    return { ...base, prompt: `<span class="qkr ${size}">${esc(x.tl)}</span>`, sub: t('exam.howPron'), options, correct: options.findIndex((o) => o.label === x.pr) };
  }
  if (kind === 'pick') {
    return mcq({ ...base, say: null, prompt: `<span class="qlatin">${esc(x.tr)}</span>`, sub: t('quiz.howSay', { lang: tr(C.name).toLowerCase() }) }, { label: x.tl, kr: true }, others.map((o) => ({ label: o.tl, kr: true })), 4);
  }
  return mcq({ ...base, prompt: `<span class="qkr ${size}">${esc(x.tl)}</span>`, sub: t('quiz.whatMeansEx') }, { label: x.tr }, others.map((o) => ({ label: o.tr })), 4);
}

// ---------- Composition d'un examen ----------
/** Tire n questions en puisant tour à tour dans chaque type de contenu. */
function compose(src, n) {
  const C = course();
  const S = C.script;
  const pools = [];

  // Vocabulaire : écrire, comprendre à l'oreille, reconnaître sans romanisation
  const words = shuffle(C.words.filter((w) => src.themes.has(w.t)));
  if (words.length) {
    const kinds = ['type', 'listen2fr', 'fr2kr', 'dict', 'kr2fr'];
    pools.push(words.map((w, k) => () => wordQuestion(w, kinds[k % kinds.length], { pool: words, n: N_OPT, plain: true })));
  }

  // Écriture : lettres, kanji, syllabes, mots à lire
  const letters = [];
  for (const id of src.sets) {
    const set = S.sets[id];
    if (set?.kind === 'kanji') {
      const kinds = ['mean', 'type', 'reading', 'pick'];
      shuffle(set.items).slice(0, n).forEach((x, k) => letters.push(() => kanjiQuestion(x, kinds[k % kinds.length], set.items, N_OPT)));
    } else if (set) {
      const items = kanaForms(set.items);
      const others = [...items, ...kanaForms(set.decoys || [])];
      const kinds = ['type', 'read', 'type', 'pick'];
      shuffle(items).slice(0, n).forEach((x, k) => letters.push(() => letterQuestion(x, kinds[k % kinds.length], others, N_OPT)));
    } else if (id === 'syllables') {
      for (let k = 0; k < 4; k++) letters.push(() => syllableQuestion(k % 2 ? 'read' : 'type'));
    } else if (id === 'words') {
      const pool = shortWords();
      shuffle(pool).slice(0, 4).forEach((w, k) => letters.push(() => wordQuestion(w, k % 2 ? 'listen2fr' : 'dict', { pool, n: N_OPT, plain: true, track: false })));
    }
  }
  if (letters.length) pools.push(shuffle(letters));

  // Leçons : sens des exemples, et prononciation réelle
  const ex = examplesOf(src.lessons);
  if (ex.length >= 4) {
    const kinds = ['mean', 'pron', 'pick'];
    pools.push(shuffle(ex).map((x, k) => () => lessonQuestion(x, kinds[k % kinds.length], ex)));
  }

  // Phrases : à remettre dans l'ordre, sans aide
  if (src.crits.length) pools.push(shuffle(src.crits).slice(0, Math.max(2, Math.round(n / 5))).map((crit) => () => ({ type: 'order', phrase: phraseFor(crit) })));

  const out = [];
  let k = 0;
  while (out.length < n && pools.some((p) => p.length)) {
    const p = pools[k++ % pools.length];
    if (p.length) out.push(p.shift()());
  }
  return shuffle(out);
}

/** Écran d'examen. q.u : identifiant du module, ou « final ». */
export function examScreen(el, q) {
  const R = roadState();
  const st = store.get();
  const final = q.u === 'final';
  const unit = R.units.find((u) => u.id === q.u);
  if (!final && (!unit || !unit.complete)) {
    location.hash = '#/road';
    return;
  }

  let src;
  let title;
  if (final) {
    const done = R.units.flatMap((u) => u.steps.filter((s) => s.done));
    src = sourcesOf(done, Object.keys(st.read || {}));
    title = t('final.title');
  } else {
    src = sourcesOf(unit.steps);
    title = tr(unit.title);
  }
  const n = final ? FINAL_LEN : UNIT_LEN;
  const probe = compose(src, n);
  const score = final ? st.final?.best || 0 : store.examScore(unit.id);
  const pass = final ? FINAL_PASS : store.EXAM_PASS / 100;

  if (probe.length < 4) {
    el.innerHTML = `
      <div class="screen result exam-intro">
        <div class="exam-seal"><span class="kr">${course().id === 'ja' ? '試験' : '시험'}</span></div>
        <h2>${esc(title)}</h2>
        <p class="muted">${t('final.empty')}</p>
        <a class="btn primary" href="#/road">${t('road.back')}</a>
      </div>`;
    return;
  }

  function start() {
    runQuiz(el, {
      questions: compose(src, n),
      title,
      again: () => examScreen(el, q),
      exam: {
        pass,
        passText: final ? '' : t('exam.platText'),
        onEnd(pct, passed) {
          if (final) {
            const first = !(st.final?.n);
            store.markFinal(pct);
            return passed ? (first ? 30 : 10) : 0;
          }
          const first = !store.examPassed(unit.id);
          store.markExam(unit.id, pct);
          return passed && first ? UNIT_BONUS : 0;
        },
      },
    });
  }

  el.innerHTML = `
    <div class="screen result exam-intro ${!final && store.examPassed(unit.id) ? 'plat' : ''}">
      <div class="exam-seal"><span class="kr">${course().id === 'ja' ? (final ? '総合' : '試験') : final ? '종합' : '시험'}</span></div>
      <span class="eyebrow">${final ? t('final.eyebrow') : t('exam.eyebrow')}</span>
      <h2>${esc(title)}</h2>
      <p class="muted">${final ? t('final.intro') : t('exam.intro')}</p>
      <ul class="exam-rules">
        <li><b>${probe.length}</b><span>${t('exam.rQuestions')}</span></li>
        <li><b>${Math.round(pass * 100)} %</b><span>${t('exam.rPass')}</span></li>
        <li><b>0</b><span>${t('exam.rHints')}</span></li>
      </ul>
      ${score ? `<p class="muted small">${t('exam.best', { n: score })}${final && st.final?.n ? ` · ${t('final.count', { n: st.final.n })}` : ''}</p>` : ''}
      <div class="stack">
        <button class="btn primary big start">${t('exam.start')}</button>
        <a class="btn ghost" href="#/road">${t('road.back')}</a>
      </div>
    </div>`;
  $('.start', el).addEventListener('click', () => {
    sfx.tap();
    start();
  });
}

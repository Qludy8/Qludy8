// Moteur de quiz à choix multiples + quiz d'écriture (hangeul / kana) et de vocabulaire.
import { $, $$, esc, shuffle, sfx, haptic, speak, autoSpeak, canSpeak, confetti, countUp, pulse, burst, ICONS } from './ui.js';
import { addXp, review, pickForReview, get, markRoad, starsFor } from './store.js';
import { course, t, tr, gloss } from './course.js';
import { ALL_THEMES } from './content/lexicon.js';

const wordsOf = (theme) => (!theme || theme === 'all' ? course().words : course().words.filter((w) => w.t === theme));
const len = () => get().settings.quizLen || 10;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/**
 * Lance une série de questions.
 * question = { prompt (html), sub?, say? (texte à prononcer), auto? (prononcer à l'affichage),
 *              options: [{ label, kr? }], correct, explain? (html), onAnswer?(ok) }
 */
export function runQuiz(el, { questions, title, again, back, step }) {
  const queue = questions.map((q) => ({ ...q, retry: false }));
  const total = questions.length;
  let done = 0;
  let firstTry = 0;
  let combo = 0;
  let xp = 0;

  el.innerHTML = `
    <div class="quiz screen">
      <div class="qbar">
        <div class="progress"><i></i></div>
        <span class="combo" aria-live="polite"></span>
        <span class="count qcount"></span>
      </div>
      <div class="qstage"></div>
      <div class="sheet" hidden>
        <div class="sheet-msg"></div>
        <button class="btn primary sheet-next">${t('continue')}</button>
      </div>
    </div>`;
  const stage = $('.qstage', el);
  const bar = $('.progress i', el);
  const comboEl = $('.combo', el);
  const sheet = $('.sheet', el);

  function show() {
    const q = queue[0];
    bar.style.width = `${(done / total) * 100}%`;
    $('.qcount', el).textContent = `${Math.min(done + 1, total)} / ${total}`;
    stage.innerHTML = `
      <div class="qcard pop">
        ${q.retry ? `<span class="tag">${t('quiz.retry')}</span>` : ''}
        <div class="qprompt">${q.prompt}</div>
        ${q.sub ? `<div class="qsub">${esc(q.sub)}</div>` : ''}
        ${q.say && canSpeak() ? `<button class="icon-btn speak" aria-label="${t('listen')}">${ICONS.sound}</button>` : ''}
      </div>
      <div class="options">
        ${q.options.map((o, i) => `<button class="opt ${o.kr ? 'kr' : ''}" style="--i:${i}" data-i="${i}">${esc(o.label)}</button>`).join('')}
      </div>`;
    $('.speak', stage)?.addEventListener('click', () => speak(q.say));
    $('.listen-big', stage)?.addEventListener('click', () => speak(q.say));
    if (q.auto && q.say) setTimeout(() => speak(q.say), 250);
    $$('.opt', stage).forEach((b) => b.addEventListener('click', () => answer(q, Number(b.dataset.i), b)));
  }

  function answer(q, i, btn) {
    const ok = i === q.correct;
    $$('.opt', stage).forEach((b) => (b.disabled = true));
    const right = $$('.opt', stage)[q.correct];
    right.classList.add('right');
    if (q.say) autoSpeak(q.say);
    if (ok) {
      sfx.ok();
      haptic(8);
      burst(right);
      combo++;
      if (!q.retry) {
        firstTry++;
        xp += 2;
      }
    } else {
      btn.classList.add('wrong');
      sfx.ko();
      haptic([30, 40, 30]);
      combo = 0;
    }
    if (!q.retry) q.onAnswer?.(ok);
    comboEl.textContent = combo >= 3 ? t('quiz.combo', { n: combo }) : '';
    if (combo >= 3) pulse(comboEl, 'bump');

    queue.shift();
    if (ok) done++;
    else queue.push({ ...q, retry: true, ...reshuffle(q) });

    sheet.className = `sheet ${ok ? 'ok' : 'ko'}`;
    $('.sheet-msg', sheet).innerHTML = `<strong>${ok ? pick(t('quiz.cheers').split('|')) : t('quiz.notQuite')}</strong>
      ${ok ? '' : `<div>${t('quiz.answer')} <b class="${q.options[q.correct].kr ? 'kr' : ''}">${esc(q.options[q.correct].label)}</b></div>`}
      ${q.explain ? `<div class="explain">${q.explain}</div>` : ''}`;
    sheet.hidden = false;
    $('.sheet-next', sheet).focus({ preventScroll: true });
  }

  $('.sheet-next', el).addEventListener('click', () => {
    sfx.tap();
    sheet.hidden = true;
    if (queue.length) show();
    else finish();
  });

  function finish() {
    bar.style.width = '100%';
    xp += 5;
    addXp(xp);
    const ratio = firstTry / total;
    if (step) markRoad(step, starsFor(ratio));
    if (ratio >= 0.7) {
      sfx.win();
      confetti();
    }
    stage.innerHTML = '';
    el.querySelector('.quiz').innerHTML = `
      <div class="result screen">
        <div class="score-ring" style="--p:${ratio}">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52"/><circle class="val" cx="60" cy="60" r="52"/></svg>
          <div><b>${firstTry}</b><span>/ ${total}</span></div>
        </div>
        <h2>${ratio === 1 ? t('quiz.perfect') : ratio >= 0.7 ? t('quiz.great') : ratio >= 0.4 ? t('quiz.good') : t('quiz.keepGoing')}</h2>
        <p class="muted">${esc(title || '')}</p>
        <div class="xp-won">+<span class="n">0</span> XP</div>
        <div class="stack">
          <button class="btn primary again">${t('playAgain')}</button>
          <a class="btn ghost" href="${step ? '#/road' : back}">${step ? t('road.back') : t('finish')}</a>
        </div>
      </div>`;
    countUp($('.xp-won .n', el), xp);
    requestAnimationFrame(() => $('.score-ring', el)?.classList.add('go'));
    $('.again', el).addEventListener('click', again);
  }

  show();
}

/** Nouvel ordre des réponses pour une question reposée (sans modifier l'originale). */
function reshuffle(q) {
  const right = q.options[q.correct];
  const options = shuffle(q.options);
  return { options, correct: options.indexOf(right) };
}

/** Construit une question : la bonne réponse et des leurres distincts. */
function mcq(base, answer, decoys, n = 4) {
  const seen = new Set([answer.label]);
  const pool = shuffle(decoys).filter((d) => !seen.has(d.label) && seen.add(d.label)).slice(0, n - 1);
  const options = shuffle([answer, ...pool]);
  return { ...base, options, correct: options.indexOf(answer) };
}

// ---------- Écriture : hangeul ou kana ----------
const romLabel = (x) => (x.r === '' ? t('quiz.silent') : x.r);

export function scriptQuiz(el, set, step) {
  const C = course();
  const S = C.script;
  let questions;
  let title;
  if (S.sets[set]?.kind === 'kanji') {
    const items = S.sets[set].items;
    title = tr(S.sets[set].label);
    const readings = (x) => [x.on, x.kun].filter((r) => r && r !== '—').join(' · ');
    const explain = (x) => `<span class="kr">${x.j}</span> · ${esc(readings(x))} = ${esc(tr(x.mean))}<br>${t('kanji.example')} <span class="kr">${esc(x.ex[0])}</span> (${esc(x.ex[1])}) : ${esc(tr({ fr: x.ex[2], en: x.ex[3] }))}`;
    questions = shuffle(items).slice(0, len()).map((x, k) => {
      const others = items.filter((o) => o.j !== x.j);
      const base = { say: x.say, explain: explain(x) };
      if (k % 3 === 0) return mcq({ ...base, prompt: `<span class="qkr">${x.j}</span>`, sub: t('kanji.whatMeans') }, { label: tr(x.mean) }, others.map((o) => ({ label: tr(o.mean) })));
      if (k % 3 === 1) return mcq({ ...base, prompt: `<span class="qkr">${x.j}</span>`, sub: t('kanji.whichReading') }, { label: readings(x), kr: true }, others.map((o) => ({ label: readings(o), kr: true })));
      return mcq({ ...base, prompt: `<span class="qlatin">${esc(tr(x.mean))}</span>`, sub: t('kanji.whichKanji') }, { label: x.j, kr: true }, others.map((o) => ({ label: o.j, kr: true })));
    });
  } else if (S.sets[set]) {
    // Les kana regroupent hiragana (j) et katakana (j2) : chaque question tire l'une des deux formes.
    const form = (x) => (x.j2 && Math.random() < 0.5 ? { ...x, j: x.j2 } : x);
    const items = S.sets[set].items.map(form);
    const others = [...items, ...(S.sets[set].decoys || []).map(form)];
    title = tr(S.sets[set].label);
    questions = shuffle(items).slice(0, len()).map((x, k) => {
      if (k % 3 === 2) {
        return mcq(
          { prompt: `<span class="qlatin">${esc(romLabel(x))}</span>`, sub: t('quiz.whichLetter'), say: x.say, explain: esc(tr(x.tip)) },
          { label: x.j, kr: true },
          others.filter((o) => o.r !== x.r).map((o) => ({ label: o.j, kr: true })),
        );
      }
      return mcq(
        { prompt: `<span class="qkr">${x.j}</span>`, sub: t('quiz.howRead'), say: x.say, explain: esc(tr(x.tip)) },
        { label: romLabel(x) },
        others.filter((o) => o.r !== x.r).map((o) => ({ label: romLabel(o) })),
      );
    });
  } else if (set === 'syllables') {
    title = tr(S.syllableLabel);
    questions = Array.from({ length: len() }, () => {
      const s = S.randomSyllable();
      const decoys = [];
      while (decoys.length < 8) decoys.push({ label: S.randomSyllable().rom });
      return mcq({ prompt: `<span class="qkr">${s.text}</span>`, sub: t('quiz.howReadSyl'), say: s.text }, { label: s.rom }, decoys);
    });
  } else {
    title = t('script.readWords');
    // Pour le japonais, on lit le mot en kana (sa lecture) ; pour le coréen, le mot lui-même.
    const pool = C.words.filter((w) => !/[\s?？]/.test(w.tl) && (w.r || w.tl).length <= 5);
    const shown = (w) => (C.id === 'ja' ? w.r || w.tl : w.tl);
    questions = shuffle(pool).slice(0, len()).map((w) =>
      mcq(
        { prompt: `<span class="qkr">${esc(shown(w))}</span>`, sub: t('quiz.howReadWord'), say: w.tl, explain: `${t('quiz.meaning')} ${esc(gloss(w))}` },
        { label: C.wordRom(w) },
        pool.filter((o) => o.tl !== w.tl).map((o) => ({ label: C.wordRom(o) })),
      ),
    );
  }
  runQuiz(el, { questions, title, again: () => scriptQuiz(el, set, step), back: '#/hangul', step });
}

// ---------- Vocabulaire ----------
/** Classe de taille pour un texte dans la langue apprise : les phrases s'affichent plus petit que les mots. */
export const sizeCls = (s) => (s.length > 14 ? 'xlong' : s.length > 6 ? 'long' : '');

export function vocabQuiz(el, theme, mode, step) {
  const C = course();
  const pool = wordsOf(theme);
  const list = pickForReview(pool, len());
  const listen = canSpeak();
  const roman = get().settings.roman;
  const sub = (w) => [C.wordRead(w), roman ? C.wordRom(w) : ''].filter(Boolean).join(' · ');
  const questions = list.map((w, k) => {
    const decoys = shuffle(pool.length >= 8 ? pool : C.words).filter((o) => o.id !== w.id);
    const kind = k % 3 === 2 && listen ? 'listen' : k % 2 ? 'fr2kr' : 'kr2fr';
    const base = { say: w.tl, onAnswer: (ok) => review(w.id, ok), explain: `<span class="kr">${esc(w.tl)}</span>${sub(w) ? ` · ${esc(sub(w))}` : ''} = ${esc(gloss(w))}` };
    if (kind === 'kr2fr') {
      return mcq({ ...base, prompt: `<span class="qkr ${sizeCls(w.tl)}">${esc(w.tl)}</span>`, sub: sub(w) || t('quiz.whatMeans') }, { label: gloss(w) }, decoys.map((o) => ({ label: gloss(o) })));
    }
    if (kind === 'fr2kr') {
      return mcq({ ...base, say: null, prompt: `<span class="qlatin">${esc(gloss(w))}</span>`, sub: t('quiz.howSay', { lang: tr(C.name).toLowerCase() }) }, { label: w.tl, kr: true }, decoys.map((o) => ({ label: o.tl, kr: true })));
    }
    return mcq({ ...base, auto: true, prompt: `<button class="listen-big" aria-label="${t('listen')}">${ICONS.sound}</button>`, sub: t('quiz.whatHeard') }, { label: w.tl, kr: true }, decoys.map((o) => ({ label: o.tl, kr: true })));
  });
  runQuiz(el, {
    questions,
    title: mode === 'review' ? t('review') : theme && theme !== 'all' ? tr(ALL_THEMES[theme]) : t('allThemes'),
    again: () => vocabQuiz(el, theme, mode, step),
    step,
    back: '#/words',
  });
}

export { wordsOf };

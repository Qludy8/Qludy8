// Moteur de quiz à choix multiples + quiz de hangeul et de vocabulaire.
import { $, $$, esc, shuffle, sfx, haptic, speak, canSpeak, confetti, countUp, pulse, ICONS } from './ui.js';
import { addXp, review, pickForReview, get } from './store.js';
import { romanize, compose, CHO, JUNG, JONG } from './hangul.js';
import { JAMO_SETS, VOWELS, CONSONANTS } from './content/jamo.js';
import { WORDS, wordsOf, THEMES } from './words.js';

/**
 * Lance une série de questions.
 * question = { prompt (html), sub?, say? (texte coréen à prononcer), auto? (prononcer à l'affichage),
 *              options: [{ label, kr? }], correct, explain? (html), onAnswer?(ok) }
 */
export function runQuiz(el, { questions, title, again, back }) {
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
      </div>
      <div class="qstage"></div>
      <div class="sheet" hidden>
        <div class="sheet-msg"></div>
        <button class="btn primary sheet-next">Continuer</button>
      </div>
    </div>`;
  const stage = $('.qstage', el);
  const bar = $('.progress i', el);
  const comboEl = $('.combo', el);
  const sheet = $('.sheet', el);

  function show() {
    const q = queue[0];
    bar.style.width = `${(done / total) * 100}%`;
    stage.innerHTML = `
      <div class="qcard pop">
        ${q.retry ? '<span class="tag">À revoir</span>' : ''}
        <div class="qprompt">${q.prompt}</div>
        ${q.sub ? `<div class="qsub">${esc(q.sub)}</div>` : ''}
        ${q.say && canSpeak() ? `<button class="icon-btn speak" aria-label="Écouter">${ICONS.sound}</button>` : ''}
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
    if (q.say) speak(q.say);
    if (ok) {
      sfx.ok();
      haptic(8);
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
    comboEl.textContent = combo >= 3 ? `Série ×${combo}` : '';
    if (combo >= 3) pulse(comboEl, 'bump');

    queue.shift();
    if (ok) done++;
    else queue.push({ ...q, retry: true, ...reshuffle(q) });

    sheet.className = `sheet ${ok ? 'ok' : 'ko'}`;
    $('.sheet-msg', sheet).innerHTML = `<strong>${ok ? pick(['Bravo !', 'Parfait !', 'Exact !', '잘했어요 !']) : 'Pas tout à fait'}</strong>
      ${ok ? '' : `<div>Réponse : <b class="${q.options[q.correct].kr ? 'kr' : ''}">${esc(q.options[q.correct].label)}</b></div>`}
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
        <h2>${ratio === 1 ? 'Sans faute !' : ratio >= 0.7 ? 'Très bien !' : ratio >= 0.4 ? 'Bien joué, continue !' : 'On continue à s’entraîner'}</h2>
        <p class="muted">${title || ''}</p>
        <div class="xp-won">+<span class="n">0</span> XP</div>
        <div class="stack">
          <button class="btn primary again">Rejouer</button>
          <a class="btn ghost" href="${back}">Terminer</a>
        </div>
      </div>`;
    countUp($('.xp-won .n', el), xp);
    requestAnimationFrame(() => $('.score-ring', el)?.classList.add('go'));
    $('.again', el).addEventListener('click', again);
  }

  show();
}

const pick = (a) => a[Math.floor(Math.random() * a.length)];

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

// ---------- Hangeul ----------
const romLabel = (x) => (x.r === '' ? 'muette (ng en finale)' : x.r);

export function hangulQuiz(el, set) {
  let questions;
  let title;
  if (JAMO_SETS[set]) {
    const items = JAMO_SETS[set].items;
    const others = [...items, ...(set === 'compound' ? VOWELS : set === 'double' ? CONSONANTS : [])];
    title = JAMO_SETS[set].label;
    questions = shuffle(items).slice(0, 10).map((x, k) => {
      if (k % 3 === 2) {
        return mcq(
          { prompt: `<span class="qlatin">${esc(romLabel(x))}</span>`, sub: 'Quelle lettre se lit ainsi ?', say: x.say, explain: esc(x.tip) },
          { label: x.j, kr: true },
          others.filter((o) => o.j !== x.j).map((o) => ({ label: o.j, kr: true })),
        );
      }
      return mcq(
        { prompt: `<span class="qkr">${x.j}</span>`, sub: 'Comment se lit cette lettre ?', say: x.say, explain: esc(x.tip) },
        { label: romLabel(x) },
        others.filter((o) => o.j !== x.j).map((o) => ({ label: romLabel(o) })),
      );
    });
  } else if (set === 'syllables') {
    title = 'Lire des syllabes';
    const cons = CONSONANTS.map((c) => CHO.indexOf(c.j));
    const vows = VOWELS.map((v) => JUNG.indexOf(v.j));
    const fins = [0, 0, 0, JONG.indexOf('ㄴ'), JONG.indexOf('ㅁ'), JONG.indexOf('ㅇ'), JONG.indexOf('ㄹ'), JONG.indexOf('ㄱ')];
    const make = () => compose(pick(cons), pick(vows), pick(fins));
    questions = Array.from({ length: 10 }, () => {
      const s = make();
      const decoys = [];
      while (decoys.length < 8) decoys.push({ label: romanize(make()) });
      return mcq({ prompt: `<span class="qkr">${s}</span>`, sub: 'Comment se lit cette syllabe ?', say: s }, { label: romanize(s) }, decoys);
    });
  } else {
    title = 'Lire des mots';
    const pool = WORDS.filter((w) => !/[\s?]/.test(w.kr) && w.kr.length <= 4);
    questions = shuffle(pool).slice(0, 10).map((w) =>
      mcq(
        { prompt: `<span class="qkr">${w.kr}</span>`, sub: 'Comment se lit ce mot ?', say: w.kr, explain: `Sens : ${esc(w.fr)}` },
        { label: romanize(w.kr) },
        pool.filter((o) => o.kr !== w.kr).map((o) => ({ label: romanize(o.kr) })),
      ),
    );
  }
  runQuiz(el, { questions, title, again: () => hangulQuiz(el, set), back: '#/hangul' });
}

// ---------- Vocabulaire ----------
export function vocabQuiz(el, theme, mode) {
  const pool = wordsOf(theme);
  const list = pickForReview(pool, 10);
  const listen = canSpeak();
  const roman = get().settings.roman;
  const questions = list.map((w, k) => {
    const decoys = shuffle(pool.length >= 8 ? pool : WORDS).filter((o) => o.id !== w.id);
    const kind = k % 3 === 2 && listen ? 'listen' : k % 2 ? 'fr2kr' : 'kr2fr';
    const base = { say: w.kr, onAnswer: (ok) => review(w.id, ok), explain: roman ? `<span class="kr">${esc(w.kr)}</span> · ${esc(romanize(w.kr))} = ${esc(w.fr)}` : '' };
    if (kind === 'kr2fr') {
      return mcq({ ...base, prompt: `<span class="qkr">${esc(w.kr)}</span>`, sub: roman ? romanize(w.kr) : 'Que signifie ce mot ?' }, { label: w.fr }, decoys.map((o) => ({ label: o.fr })));
    }
    if (kind === 'fr2kr') {
      return mcq({ ...base, say: null, prompt: `<span class="qlatin">${esc(w.fr)}</span>`, sub: 'Comment dit-on en coréen ?', explain: '' }, { label: w.kr, kr: true }, decoys.map((o) => ({ label: o.kr, kr: true })));
    }
    return mcq({ ...base, auto: true, prompt: `<button class="listen-big" aria-label="Réécouter">${ICONS.sound}</button>`, sub: 'Qu’as-tu entendu ?' }, { label: w.kr, kr: true }, decoys.map((o) => ({ label: o.kr, kr: true })));
  });
  runQuiz(el, {
    questions,
    title: mode === 'review' ? 'Révision' : THEMES[theme] || 'Tous les thèmes',
    again: () => vocabQuiz(el, theme, mode),
    back: mode === 'review' ? '#/home' : '#/learn',
  });
}


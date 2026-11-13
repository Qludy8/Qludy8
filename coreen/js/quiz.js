// Moteur d'exercices : choix multiples, réponses à écrire au clavier, dictées, phrases à remettre dans l'ordre.
// Il sert aux quiz d'écriture (hangeul / kana / kanji), de vocabulaire, et aux examens.
import { $, $$, esc, shuffle, sfx, speak, autoSpeak, canSpeak, hasVoice, confetti, countUp, pulse, burst, ICONS } from './ui.js';
import { addXp, review, pickForReview, get, markRoad, starsFor, box, bump, record } from './store.js';
import { course, t, tr, gloss } from './course.js';
import { ALL_THEMES } from './content/lexicon.js';
import { mountTyping, normAnswer } from './keyboard.js';
import { reconstruct } from './phrases.js';

const wordsOf = (theme) => (!theme || theme === 'all' ? course().words : course().words.filter((w) => w.t === theme));
const len = () => get().settings.quizLen || 10;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const typingOn = () => get().settings.typing !== false;
/** La voix sert aux dictées : sans elle, on affiche la traduction à la place. */
const canDictate = () => canSpeak() && hasVoice();

/**
 * Lance une série de questions.
 * Commun : { prompt (html), sub?, say? (texte à prononcer), auto? (prononcer à l'affichage), explain? (html), onAnswer?(ok) }
 *   choix multiples : options: [{ label, kr? }], correct
 *   saisie          : type: 'input', answer (texte affiché en correction), accept: [réponses admises], kata?, exact?, listen?
 *   ordre           : type: 'order', phrase (phrase générée)
 * exam : { pass (0 à 1), onEnd(pct, réussi) } → pas de seconde chance, pas d'indice.
 */
export function runQuiz(el, { questions, title, again, back, step, exam, backLabel }) {
  const queue = questions.map((q) => ({ ...q, retry: false }));
  const total = questions.length;
  let done = 0;
  let firstTry = 0;
  let combo = 0;
  let xp = 0;
  let onNext = null;

  el.innerHTML = `
    <div class="quiz screen ${exam ? 'exam-mode' : ''}">
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
    const n = exam ? total - queue.length : done;
    bar.style.width = `${(n / total) * 100}%`;
    $('.qcount', el).textContent = `${Math.min(n + 1, total)} / ${total}`;
    const head = `
      <div class="qcard pop ${q.type === 'input' ? 'compact' : ''}">
        ${q.retry ? `<span class="tag">${t('quiz.retry')}</span>` : ''}
        <div class="qprompt">${q.prompt}</div>
        ${q.sub ? `<div class="qsub">${esc(q.sub)}</div>` : ''}
        ${q.say && canSpeak() && !q.prompt.includes('listen-big') ? `<button class="icon-btn speak" aria-label="${t('listen')}">${ICONS.sound}</button>` : ''}
      </div>`;

    if (q.type === 'order') {
      stage.innerHTML = `<div class="qcard pop order-card"><div class="order-host"></div></div>`;
      reconstruct($('.order-host', stage), q.phrase, (clean) => settle(q, clean, null, q.phrase.tl, true), {
        strict: !!exam,
        onFail: () => settle(q, false, null, q.phrase.tl, false),
      });
      return;
    }

    if (q.type === 'input') {
      stage.innerHTML = `${head}
        <div class="type-host"></div>
        <div class="type-actions">
          ${exam ? '' : `<button class="btn ghost small hint-btn">${t('recon.hint')}</button>`}
          <button class="btn primary check-btn" disabled>${t('type.check')}</button>
        </div>`;
      let helped = false;
      const norm = q.exact ? (s) => s.trim() : normAnswer;
      const good = q.accept.map(norm);
      const check = () => {
        const v = norm(typing.value);
        if (!v) return;
        typing.kb.lock(true);
        const ok = good.includes(v);
        typing.box.classList.add(ok ? 'good' : 'bad');
        settle(q, ok && !helped, typing.box, q.answer, ok);
      };
      const typing = mountTyping($('.type-host', stage), {
        kind: course().id, kata: q.kata, space: /\s/.test(q.answer), placeholder: esc(q.placeholder || t('type.placeholder')), onEnter: check,
        onChange: (v) => { $('.check-btn', stage).disabled = !v; },
      });
      $('.check-btn', stage).addEventListener('click', check);
      $('.hint-btn', stage)?.addEventListener('click', () => {
        // Indice : garde le début juste et ajoute le signe suivant.
        helped = true;
        const target = q.accept[0];
        const cur = typing.value;
        let k = 0;
        while (k < cur.length && k < target.length && norm(cur.slice(0, k + 1)) === norm(target.slice(0, k + 1))) k++;
        let next = k + 1;
        while (next < target.length && /\s/.test(target[next - 1])) next++;
        typing.kb.set(target.slice(0, next));
        sfx.tap();
      });
    } else {
      stage.innerHTML = `${head}
        <div class="options ${q.options.length > 4 ? 'many' : ''}">
          ${q.options.map((o, i) => `<button class="opt ${o.kr ? 'kr' : ''}" style="--i:${i}" data-i="${i}">${esc(o.label)}</button>`).join('')}
        </div>`;
      $$('.opt', stage).forEach((b) => b.addEventListener('click', () => {
        const i = Number(b.dataset.i);
        const ok = i === q.correct;
        $$('.opt', stage).forEach((x) => (x.disabled = true));
        const right = $$('.opt', stage)[q.correct];
        right.classList.add('right');
        if (!ok) b.classList.add('wrong');
        settle(q, ok, right, q.options[q.correct].label, ok, q.options[q.correct].kr);
      }));
    }
    $('.speak', stage)?.addEventListener('click', () => speak(q.say));
    $('.listen-big', stage)?.addEventListener('click', () => speak(q.say));
    if (q.auto && q.say) setTimeout(() => speak(q.say), 250);
  }

  /**
   * Enregistre une réponse. clean : juste, du premier coup et sans aide ; okNow : juste (même avec un indice).
   */
  function settle(q, clean, target, answer, okNow = clean, kr = true) {
    if (q.say && !(q.auto && okNow)) autoSpeak(q.say);
    if (okNow) {
      sfx.ok();
      if (target) burst(target);
      combo++;
      record('combo', combo);
      if (clean && !q.retry) {
        firstTry++;
        xp += q.type === 'input' ? 3 : q.type === 'order' ? 4 : 2;
      }
      if (q.type === 'input') {
        bump('typed');
        if (q.listen) bump('dictation');
      }
      if (q.type === 'order') bump('phrases');
    } else {
      sfx.ko();
      if (target) pulse(target, 'shake');
      combo = 0;
    }
    if (!q.retry) q.onAnswer?.(okNow);
    comboEl.textContent = combo >= 3 ? t('quiz.combo', { n: combo }) : '';
    if (combo >= 3) pulse(comboEl, 'bump');

    queue.shift();
    if (okNow || exam) done++;
    else queue.push({ ...q, retry: true, ...(q.options ? reshuffle(q) : {}) });

    sheet.className = `sheet ${okNow ? 'ok' : 'ko'}`;
    $('.sheet-msg', sheet).innerHTML = `<strong>${okNow ? pick(t('quiz.cheers').split('|')) : t('quiz.notQuite')}</strong>
      ${okNow ? '' : `<div>${t('quiz.answer')} <b class="${kr ? 'kr' : ''}">${esc(answer)}</b></div>`}
      ${q.explain ? `<div class="explain">${q.explain}</div>` : ''}`;
    sheet.hidden = false;
    $('.sheet-next', sheet).focus({ preventScroll: true });
    onNext = () => {
      sheet.hidden = true;
      if (queue.length) show();
      else finish();
    };
  }

  $('.sheet-next', el).addEventListener('click', () => {
    sfx.tap();
    onNext?.();
  });
  // Entrée valide aussi la feuille de correction (clavier d'ordinateur).
  const onKey = (e) => {
    if (!sheet.isConnected) return document.removeEventListener('keydown', onKey, true);
    if (e.key === 'Enter' && !sheet.hidden) {
      e.preventDefault();
      e.stopPropagation();
      onNext?.();
    }
  };
  document.addEventListener('keydown', onKey, true);

  function finish() {
    bar.style.width = '100%';
    xp += 5;
    const ratio = firstTry / total;
    const pct = Math.round(ratio * 100);
    const passed = exam ? ratio >= exam.pass : true;
    if (exam) xp += exam.onEnd?.(pct, passed) || 0;
    addXp(xp);
    if (ratio === 1 && total >= 5) bump('perfect');
    if (step && !exam) markRoad(step, starsFor(ratio));
    if (exam ? passed : ratio >= 0.7) {
      sfx.win();
      confetti();
    }
    stage.innerHTML = '';
    const head = exam
      ? `<span class="exam-verdict ${passed ? 'pass' : 'fail'}">${passed ? t('exam.passed') : t('exam.failed')}</span>
         <h2>${pct} %</h2>
         <p class="muted">${esc(title || '')} · ${passed ? esc(exam.passText || '') : t('exam.need', { n: Math.round(exam.pass * 100) })}</p>`
      : `<h2>${ratio === 1 ? t('quiz.perfect') : ratio >= 0.7 ? t('quiz.great') : ratio >= 0.4 ? t('quiz.good') : t('quiz.keepGoing')}</h2>
         <p class="muted">${esc(title || '')}</p>`;
    el.querySelector('.quiz').innerHTML = `
      <div class="result screen ${exam ? (passed ? 'exam-pass' : 'exam-fail') : ''}">
        <div class="score-ring" style="--p:${ratio}">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52"/><circle class="val" cx="60" cy="60" r="52"/></svg>
          <div><b>${firstTry}</b><span>/ ${total}</span></div>
        </div>
        ${head}
        <div class="xp-won">+<span class="n">0</span> XP</div>
        <div class="stack">
          <button class="btn primary again">${exam ? t(passed ? 'exam.again' : 'exam.retry') : t('playAgain')}</button>
          <a class="btn ghost" href="${step || exam ? '#/road' : back}">${step || exam ? t('road.back') : backLabel || t('finish')}</a>
        </div>
      </div>`;
    countUp($('.xp-won .n', el), xp);
    requestAnimationFrame(() => $('.score-ring', el)?.classList.add('go'));
    $('.again', el).addEventListener('click', again);
  }

  if (!total) {
    el.innerHTML = `<div class="screen result"><p class="muted">${t('quiz.empty')}</p><a class="btn primary" href="${back || '#/road'}">${t('back')}</a></div>`;
    return;
  }
  show();
}

/** Nouvel ordre des réponses pour une question reposée (sans modifier l'originale). */
function reshuffle(q) {
  const right = q.options[q.correct];
  const options = shuffle(q.options);
  return { options, correct: options.indexOf(right) };
}

/** Construit une question à choix : la bonne réponse et des leurres distincts. */
export function mcq(base, answer, decoys, n = 4) {
  const seen = new Set([answer.label]);
  const pool = shuffle(decoys).filter((d) => d.label && !seen.has(d.label) && seen.add(d.label)).slice(0, n - 1);
  const options = shuffle([answer, ...pool]);
  return { ...base, options, correct: options.indexOf(answer) };
}

const listenBtn = () => `<button class="listen-big" aria-label="${t('listen')}">${ICONS.sound}</button>`;

// ---------- Mots ----------
/** Classe de taille pour un texte dans la langue apprise : les phrases s'affichent plus petit que les mots. */
export const sizeCls = (s) => (s.length > 14 ? 'xlong' : s.length > 6 ? 'long' : '');

/** Réponses admises pour un mot : en japonais, on écrit sa lecture en kana. */
const acceptWord = (w) => (course().id === 'ja' ? [w.r || w.tl, w.tl] : [w.tl]);
/** Un mot s'écrit-il raisonnablement au clavier ? (les longues phrases restent en choix multiples) */
export const typable = (w, max = 9) => normAnswer(acceptWord(w)[0]).length <= max && !/[一-龯々]/.test(acceptWord(w)[0]);

/**
 * Question sur un mot.
 * kind : kr2fr · fr2kr · listen (entendre → choisir le mot) · listen2fr (entendre → choisir le sens)
 *        type (traduction → écrire) · dict (entendre → écrire)
 * opts : { pool (leurres), n (nombre de choix), plain (sans romanisation), track (répétition espacée) }
 */
export function wordQuestion(w, kind, { pool, n = 4, plain = false, track = true } = {}) {
  const C = course();
  const roman = get().settings.roman && !plain;
  const sub = [C.wordRead(w), roman ? C.wordRom(w) : ''].filter(Boolean).join(' · ');
  const all = pool && pool.length >= 8 ? pool : C.words;
  const decoys = all.filter((o) => o.id !== w.id);
  const base = {
    say: w.tl,
    onAnswer: track ? (ok) => review(w.id, ok) : undefined,
    explain: `<span class="kr">${esc(w.tl)}</span>${sub ? ` · ${esc(sub)}` : ''} = ${esc(gloss(w))}`,
  };
  const lang = tr(C.name).toLowerCase();
  if ((kind === 'type' || kind === 'dict') && !typable(w, 16)) kind = kind === 'dict' ? 'listen' : 'fr2kr';
  if ((kind === 'dict' || kind === 'listen' || kind === 'listen2fr') && !canDictate()) kind = kind === 'dict' ? 'type' : kind === 'listen' ? 'fr2kr' : 'kr2fr';

  if (kind === 'type') {
    return { ...base, say: null, type: 'input', answer: w.tl, accept: acceptWord(w), prompt: `<span class="qlatin">${esc(gloss(w))}</span>`, sub: t(C.id === 'ja' ? 'type.writeKana' : 'type.write', { lang }) };
  }
  if (kind === 'dict') {
    return { ...base, auto: true, listen: true, type: 'input', answer: w.tl, accept: acceptWord(w), prompt: listenBtn(), sub: t(C.id === 'ja' ? 'type.dictKana' : 'type.dict') };
  }
  if (kind === 'kr2fr') {
    return mcq({ ...base, prompt: `<span class="qkr ${sizeCls(w.tl)}">${esc(w.tl)}</span>`, sub: sub || t('quiz.whatMeans') }, { label: gloss(w) }, decoys.map((o) => ({ label: gloss(o) })), n);
  }
  if (kind === 'listen2fr') {
    return mcq({ ...base, auto: true, prompt: listenBtn(), sub: t('quiz.whatMeansHeard') }, { label: gloss(w) }, decoys.map((o) => ({ label: gloss(o) })), n);
  }
  if (kind === 'fr2kr') {
    return mcq({ ...base, say: null, prompt: `<span class="qlatin">${esc(gloss(w))}</span>`, sub: t('quiz.howSay', { lang }) }, { label: w.tl, kr: true }, decoys.map((o) => ({ label: o.tl, kr: true })), n);
  }
  return mcq({ ...base, auto: true, prompt: listenBtn(), sub: t('quiz.whatHeard') }, { label: w.tl, kr: true }, decoys.map((o) => ({ label: o.tl, kr: true })), n);
}

/**
 * Quiz de vocabulaire. mode : review (révision), type (tout écrire), dictation (tout à l'oreille),
 * sinon mélange qui se durcit avec la maîtrise du mot : d'abord reconnaître, puis écrire et comprendre à l'oreille.
 */
export function vocabQuiz(el, theme, mode, step) {
  const pool = wordsOf(theme);
  let list;
  if (mode === 'type' || mode === 'dictation') {
    const ok = pool.filter((w) => typable(w));
    list = pickForReview(ok.length >= 5 ? ok : pool, len());
  } else list = pickForReview(pool, len());
  const questions = list.map((w, k) => {
    let kind;
    if (mode === 'type') kind = 'type';
    else if (mode === 'dictation') kind = 'dict';
    else {
      const b = box(w.id);
      if (typingOn() && b >= 1 && typable(w)) kind = ['type', 'dict', 'listen2fr'][k % 3];
      else kind = ['kr2fr', 'fr2kr', 'listen'][k % 3];
      return wordQuestion(w, kind, { pool, plain: b >= 3 });
    }
    return wordQuestion(w, kind, { pool });
  });
  const name = theme && theme !== 'all' ? tr(ALL_THEMES[theme]) : t('allThemes');
  runQuiz(el, {
    questions,
    title: mode === 'review' ? t('review') : mode === 'type' ? `${t('road.type')} · ${name}` : mode === 'dictation' ? `${t('road.dictation')} · ${name}` : name,
    again: () => vocabQuiz(el, theme, mode, step),
    step,
    back: '#/words',
  });
}

// ---------- Écriture : hangeul, kana, kanji ----------
const romLabel = (x) => (x.r === '' ? t('quiz.silent') : x.r);

/** Question sur une lettre. kind : read (lettre → lecture) · pick (lecture → lettre) · type (lecture → écrire) */
export function letterQuestion(x, kind, others, n = 4) {
  const C = course();
  const tip = x.tip ? esc(tr(x.tip)) : '';
  if (kind === 'type') {
    const kata = /[ァ-ヶ]/.test(x.j);
    return {
      type: 'input', exact: true, kata, answer: x.j, accept: [x.j], say: x.say, auto: true,
      prompt: `<span class="qlatin">${esc(romLabel(x))}</span>`, sub: C.id === 'ja' ? t(kata ? 'type.kata' : 'type.hira') : t('type.letter'), explain: tip,
      placeholder: C.id === 'ja' ? (kata ? 'カタカナ' : 'ひらがな') : '한글',
    };
  }
  if (kind === 'pick') {
    return mcq({ prompt: `<span class="qlatin">${esc(romLabel(x))}</span>`, sub: t('quiz.whichLetter'), say: x.say, explain: tip }, { label: x.j, kr: true }, others.filter((o) => o.r !== x.r).map((o) => ({ label: o.j, kr: true })), n);
  }
  return mcq({ prompt: `<span class="qkr">${x.j}</span>`, sub: t('quiz.howRead'), say: x.say, explain: tip }, { label: romLabel(x) }, others.filter((o) => o.r !== x.r).map((o) => ({ label: romLabel(o) })), n);
}

const readings = (x) => [x.on, x.kun].filter((r) => r && r !== '—').join(' · ');
/** Question sur un kanji. kind : mean · reading · pick · type (écrire la lecture du mot d'exemple) */
export function kanjiQuestion(x, kind, items, n = 4) {
  const others = items.filter((o) => o.j !== x.j);
  const base = {
    say: x.say,
    explain: `<span class="kr">${x.j}</span> · ${esc(readings(x))} = ${esc(tr(x.mean))}<br>${t('kanji.example')} <span class="kr">${esc(x.ex[0])}</span> (${esc(x.ex[1])}) : ${esc(tr({ fr: x.ex[2], en: x.ex[3] }))}`,
  };
  if (kind === 'type') {
    return { ...base, type: 'input', answer: x.ex[1], accept: [x.ex[1]], prompt: `<span class="qkr">${esc(x.ex[0])}</span>`, sub: `${t('type.kanjiWord')} · ${tr({ fr: x.ex[2], en: x.ex[3] })}`, placeholder: 'ひらがな' };
  }
  if (kind === 'mean') return mcq({ ...base, prompt: `<span class="qkr">${x.j}</span>`, sub: t('kanji.whatMeans') }, { label: tr(x.mean) }, others.map((o) => ({ label: tr(o.mean) })), n);
  if (kind === 'reading') return mcq({ ...base, prompt: `<span class="qkr">${x.j}</span>`, sub: t('kanji.whichReading') }, { label: readings(x), kr: true }, others.map((o) => ({ label: readings(o), kr: true })), n);
  return mcq({ ...base, prompt: `<span class="qlatin">${esc(tr(x.mean))}</span>`, sub: t('kanji.whichKanji') }, { label: x.j, kr: true }, others.map((o) => ({ label: o.j, kr: true })), n);
}

/** Les deux formes d'un kana (hiragana j, katakana j2) deviennent deux lettres distinctes. */
export const kanaForms = (items) => items.flatMap((x) => (x.j2 ? [x, { ...x, j: x.j2 }] : [x]));

/** Syllabe au hasard : lire (choix) ou écrire. */
export function syllableQuestion(kind) {
  const S = course().script;
  const s = S.randomSyllable();
  if (kind === 'type') {
    return { type: 'input', answer: s.text, accept: [s.text], say: s.text, auto: true, prompt: `<span class="qlatin">${esc(s.rom)}</span>`, sub: t('type.syllable') };
  }
  const decoys = [];
  while (decoys.length < 8) decoys.push({ label: S.randomSyllable().rom });
  return mcq({ prompt: `<span class="qkr">${s.text}</span>`, sub: t('quiz.howReadSyl'), say: s.text }, { label: s.rom }, decoys);
}

/** Mots courts, pour lire et écrire de vrais mots. */
export const shortWords = () => course().words.filter((w) => !/[\s?？]/.test(w.tl) && (w.r || w.tl).length <= 5);

/**
 * Quiz d'écriture. mode : type (tout écrire au clavier), sinon mélange lecture / choix / écriture.
 */
export function scriptQuiz(el, set, step, mode) {
  const C = course();
  const S = C.script;
  const typing = mode === 'type' || (typingOn() && mode !== 'read');
  const all = mode === 'type';
  let questions;
  let title;
  if (S.sets[set]?.kind === 'kanji') {
    const items = S.sets[set].items;
    title = tr(S.sets[set].label);
    questions = shuffle(items).slice(0, len()).map((x, k) => kanjiQuestion(x, all ? 'type' : ['mean', 'reading', 'pick', typing ? 'type' : 'mean'][k % 4], items));
  } else if (S.sets[set]) {
    // Les kana regroupent hiragana (j) et katakana (j2) : chaque question tire l'une des deux formes.
    const form = (x) => (x.j2 && Math.random() < 0.5 ? { ...x, j: x.j2 } : x);
    const items = S.sets[set].items.map(form);
    const others = [...items, ...(S.sets[set].decoys || []).map(form)];
    title = tr(S.sets[set].label);
    questions = shuffle(items).slice(0, len()).map((x, k) => letterQuestion(x, all ? 'type' : ['read', 'pick', typing ? 'type' : 'read'][k % 3], others));
  } else if (set === 'syllables') {
    title = tr(S.syllableLabel);
    questions = Array.from({ length: len() }, (_, k) => syllableQuestion(all || (typing && k % 2) ? 'type' : 'read'));
  } else {
    title = t('script.readWords');
    // Pour le japonais, on lit le mot en kana (sa lecture) ; pour le coréen, le mot lui-même.
    const pool = shortWords();
    const shown = (w) => (C.id === 'ja' ? w.r || w.tl : w.tl);
    questions = shuffle(pool).slice(0, len()).map((w, k) => (all || (typing && k % 2)
      ? wordQuestion(w, canDictate() ? 'dict' : 'type', { pool, track: false })
      : mcq(
        { prompt: `<span class="qkr">${esc(shown(w))}</span>`, sub: t('quiz.howReadWord'), say: w.tl, explain: `${t('quiz.meaning')} ${esc(gloss(w))}` },
        { label: C.wordRom(w) },
        pool.filter((o) => o.tl !== w.tl).map((o) => ({ label: C.wordRom(o) })),
      )));
  }
  if (all) title = `${t('road.type')} · ${title}`;
  runQuiz(el, { questions, title, again: () => scriptQuiz(el, set, step, mode), back: '#/hangul', step });
}

export { wordsOf };

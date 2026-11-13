// Moteur d'exercices : réponses à écrire au clavier, dictées, prononciation à voix haute,
// mots et syllabes à remettre dans l'ordre, paires à relier. Les choix multiples ne servent plus que de secours.
// Il sert aux quiz d'écriture (hangeul / kana / kanji), de vocabulaire, et aux examens.
import { $, $$, esc, shuffle, sfx, speak, autoSpeak, canSpeak, hasVoice, confetti, countUp, pulse, burst, toast, ICONS } from './ui.js';
import { addXp, review, pickForReview, get, markRoad, starsFor, box, bump, record } from './store.js';
import { course, t, tr, gloss, lang } from './course.js';
import { ALL_THEMES } from './content/lexicon.js';
import { THEMES } from './content/concepts.js';
import { mountTyping, normAnswer, normRoman } from './keyboard.js';
import { reconstruct, phraseFor } from './phrases.js';
import { canListen, listen, matchSpoken, muteSpeech } from './speech.js';
import { stepDepth } from './road.js';

const wordsOf = (theme) => (!theme || theme === 'all' ? course().words : course().words.filter((w) => w.t === theme));
const len = () => get().settings.quizLen || 10;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
/** La voix sert aux dictées : sans elle, on écrit à partir de la traduction. */
const canDictate = () => canSpeak() && hasVoice();
const MIC = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg>';

/**
 * Lance une série de questions.
 * Commun : { prompt (html), sub?, say? (texte à prononcer), auto? (prononcer à l'affichage), explain? (html), onAnswer?(ok) }
 *   saisie  : type: 'input', answer, accept: [réponses admises], kb? ('latin' : romanisation), kata?, exact?, listen?
 *   ordre   : type: 'order', phrase ({ tiles, tl, end, fr, en })
 *   paires  : type: 'match', pairs: [{ a, b, say? }]
 *   oral    : type: 'speak', accept: [textes attendus], answer, fallback() (question de remplacement sans micro)
 *   choix   : options: [{ label, kr? }], correct
 * exam : { pass (0 à 1), onEnd(pct, réussi) } → pas de seconde chance, pas d'indice.
 */
export function runQuiz(el, { questions, title, again, back, step, exam, backLabel }) {
  let queue = questions.map((q) => ({ ...q, retry: false }));
  let total = questions.length;
  let done = 0;
  let firstTry = 0;
  let combo = 0;
  let xp = 0;
  let onNext = null;
  let listening = null;

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
      <div class="qcard pop ${q.type === 'input' || q.type === 'speak' ? 'compact' : ''}">
        ${q.retry ? `<span class="tag">${t('quiz.retry')}</span>` : ''}
        <div class="qprompt">${q.prompt || ''}</div>
        ${q.sub ? `<div class="qsub">${esc(q.sub)}</div>` : ''}
        ${q.say && canSpeak() && !(q.prompt || '').includes('listen-big') ? `<button class="icon-btn speak" aria-label="${t('listen')}">${ICONS.sound}</button>` : ''}
      </div>`;

    if (q.type === 'order') {
      stage.innerHTML = `<div class="qcard pop order-card">${q.sub ? `<p class="order-sub muted small">${esc(q.sub)}</p>` : ''}<div class="order-host"></div></div>`;
      reconstruct($('.order-host', stage), q.phrase, (clean) => settle(q, clean, null, q.phrase.tl, true), {
        strict: !!exam,
        onFail: () => settle(q, false, null, q.phrase.tl, false),
      });
      return;
    }

    if (q.type === 'match') return showMatch(q);
    if (q.type === 'speak') return showSpeak(q, head);

    if (q.type === 'input') {
      const latin = q.kb === 'latin';
      stage.innerHTML = `${head}
        <div class="type-host"></div>
        <div class="type-actions">
          ${exam ? '' : `<button class="btn ghost small hint-btn">${t('recon.hint')}</button>`}
          <button class="btn primary check-btn" disabled>${t('type.check')}</button>
        </div>`;
      let helped = false;
      const norm = latin ? normRoman : q.exact ? (s) => s.trim() : normAnswer;
      const good = q.accept.map(norm);
      const check = () => {
        const v = norm(typing.value);
        if (!v) return;
        typing.kb.lock(true);
        const ok = good.includes(v);
        typing.box.classList.add(ok ? 'good' : 'bad');
        settle(q, ok && !helped, typing.box, q.answer, ok, !latin);
      };
      const typing = mountTyping($('.type-host', stage), {
        kind: latin ? 'latin' : course().id, layout: lang() === 'en' ? 'qwerty' : 'azerty', kata: q.kata, space: /\s/.test(q.answer),
        placeholder: esc(q.placeholder || t(latin ? 'type.placeholderRom' : 'type.placeholder')), onEnter: check,
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

  // ---------- Paires à relier ----------
  function showMatch(q) {
    const left = shuffle(q.pairs.map((p, i) => ({ i, label: p.a, say: p.say })));
    const right = shuffle(q.pairs.map((p, i) => ({ i, label: p.b })));
    let errors = 0;
    let found = 0;
    let sel = null;
    stage.innerHTML = `
      <div class="qcard pop match-card">
        <p class="order-sub muted small">${esc(q.sub || t('match.help'))}</p>
        <div class="match-grid">
          <div class="match-col">${left.map((x) => `<button class="tile mt kr" data-side="a" data-i="${x.i}">${esc(x.label)}</button>`).join('')}</div>
          <div class="match-col">${right.map((x) => `<button class="tile mt ${q.bKr ? 'kr' : ''}" data-side="b" data-i="${x.i}">${esc(x.label)}</button>`).join('')}</div>
        </div>
      </div>`;
    $$('.mt', stage).forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('done')) return;
      const say = b.dataset.side === 'a' ? q.pairs[b.dataset.i].say : null;
      if (say) autoSpeak(say);
      if (!sel || sel.dataset.side === b.dataset.side) {
        sel?.classList.remove('sel');
        sel = sel === b ? null : b;
        sel?.classList.add('sel');
        return sfx.tap();
      }
      if (sel.dataset.i === b.dataset.i) {
        [sel, b].forEach((x) => { x.classList.remove('sel'); x.classList.add('done'); });
        sfx.ok();
        found++;
        sel = null;
        if (found === q.pairs.length) settle(q, errors === 0, null, '', true);
      } else {
        errors++;
        [sel, b].forEach((x) => pulse(x, 'shake'));
        sel.classList.remove('sel');
        sel = null;
        sfx.ko();
      }
    }));
  }

  // ---------- Prononcer à voix haute ----------
  /** Plus de micro (refus, bruit, lieu public) : les questions orales deviennent des questions écrites. */
  function withoutSpeech() {
    muteSpeech();
    queue = queue.map((x) => (x.type === 'speak' ? { ...x.fallback(), retry: x.retry } : x));
    show();
  }
  function showSpeak(q, head) {
    if (!canListen()) return withoutSpeech();
    let tries = 0;
    stage.innerHTML = `${head}
      <div class="speak-zone">
        <button class="mic-btn" aria-label="${t('speak.tap')}">${MIC}</button>
        <p class="speak-msg">${t('speak.tap')}</p>
        <p class="speak-heard muted small"></p>
        <button class="btn ghost small speak-skip">${t('speak.skip')}</button>
      </div>`;
    const mic = $('.mic-btn', stage);
    const msg = $('.speak-msg', stage);
    const heard = $('.speak-heard', stage);
    $('.speak', stage)?.addEventListener('click', () => speak(q.say));
    $('.speak-skip', stage).addEventListener('click', () => {
      listening?.stop();
      withoutSpeech();
    });
    mic.addEventListener('click', () => {
      if (mic.classList.contains('on')) return listening?.stop();
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      mic.classList.add('on');
      msg.textContent = t('speak.listening');
      sfx.tap();
      listening = listen({
        onResult(alts) {
          const m = matchSpoken(alts, q.accept);
          heard.innerHTML = `${t('speak.heard')} <b class="kr">${esc(m.heard)}</b>`;
          if (m.ok) {
            bump('spoken');
            return settle(q, tries === 0, mic, q.answer, true);
          }
          tries++;
          sfx.ko();
          pulse(mic, 'shake');
          if (tries >= 3) return settle(q, false, mic, q.answer, false);
          msg.textContent = t('speak.again', { n: 3 - tries });
        },
        onError(code) {
          if (code === 'denied') {
            toast(t('speak.denied'));
            return withoutSpeech();
          }
          msg.textContent = t(code === 'silence' ? 'speak.silence' : 'speak.error');
        },
        onEnd() { mic.classList.remove('on'); },
      });
    });
  }

  /**
   * Enregistre une réponse. clean : juste, du premier coup et sans aide ; okNow : juste (même avec un indice).
   */
  function settle(q, clean, target, answer, okNow = clean, kr = true) {
    if (q.say && !(q.auto && okNow)) autoSpeak(q.say);
    if (okNow) {
      sfx.ok();
      if (target) burst(target);
      combo = clean ? combo + 1 : 0;
      record('combo', combo);
      if (clean && !q.retry) {
        firstTry++;
        xp += q.type === 'order' ? 4 : q.options ? 2 : 3;
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
    $('.sheet-msg', sheet).innerHTML = `<strong>${okNow ? (clean ? pick(t('quiz.cheers').split('|')) : t('quiz.doneHelped')) : t('quiz.notQuite')}</strong>
      ${okNow || !answer ? '' : `<div>${t('quiz.answer')} <b class="${kr ? 'kr' : ''}">${esc(answer)}</b></div>`}
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

/** Question à choix (secours) : la bonne réponse et des leurres distincts. */
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
/** Un mot s'écrit-il raisonnablement au clavier ? */
export const typable = (w, max = 9) => normAnswer(acceptWord(w)[0]).length <= max && !/[一-龯々]/.test(acceptWord(w)[0]);

/** Découpe un mot en étiquettes : syllabes en coréen, kana en japonais (ゃ, っ, ー restent avec le signe précédent). */
export function spellTiles(w) {
  const C = course();
  const text = (C.id === 'ja' ? w.r || w.tl : w.tl).replace(/[\s.,!?。、？！~〜…]/g, '');
  if (/[一-龯々]/.test(text)) return [];
  const tiles = [];
  for (const ch of text) {
    if (/[ゃゅょぁぃぅぇぉャュョァィゥェォー]/.test(ch) && tiles.length) tiles[tiles.length - 1] += ch;
    else tiles.push(ch);
  }
  return tiles;
}
/** Phrase toute faite coupée en mots (coréen : aux espaces). */
const wordTiles = (w) => w.tl.replace(/[.?!]+$/, '').split(/\s+/).filter(Boolean);
const endOf = (w) => (w.tl.match(/[.?!。？！]+$/) || [''])[0];

/**
 * Question sur un mot.
 * kind : type (traduction → écrire) · dict (entendre → écrire) · speak (lire → prononcer)
 *        spell (traduction → remettre les syllabes dans l'ordre) · order (phrase : remettre les mots dans l'ordre)
 *        secours à choix : kr2fr · fr2kr · listen · listen2fr
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
  const language = tr(C.name).toLowerCase();
  const again = (k) => wordQuestion(w, k, { pool, n, plain, track });

  if ((kind === 'type' || kind === 'dict') && !typable(w, 16)) kind = spellTiles(w).length > 1 ? 'spell' : 'listen2fr';
  if (kind === 'dict' && !canDictate()) kind = 'type';
  if (kind === 'speak' && !canListen()) kind = typable(w, 16) ? 'type' : 'spell';
  if (kind === 'order' && (C.id !== 'ko' || wordTiles(w).length < 2)) kind = 'spell';
  if (kind === 'spell' && (spellTiles(w).length < 2 || spellTiles(w).length > 14)) kind = typable(w, 16) ? 'type' : 'listen2fr';
  if ((kind === 'listen' || kind === 'listen2fr') && !canDictate()) kind = kind === 'listen' ? 'fr2kr' : 'kr2fr';

  if (kind === 'type') {
    return { ...base, say: null, type: 'input', answer: w.tl, accept: acceptWord(w), prompt: `<span class="qlatin">${esc(gloss(w))}</span>`, sub: t(C.id === 'ja' ? 'type.writeKana' : 'type.write', { lang: language }) };
  }
  if (kind === 'dict') {
    return { ...base, auto: true, listen: true, type: 'input', answer: w.tl, accept: acceptWord(w), prompt: listenBtn(), sub: t(C.id === 'ja' ? 'type.dictKana' : 'type.dict') };
  }
  if (kind === 'speak') {
    return {
      ...base, type: 'speak', answer: w.tl, accept: acceptWord(w), fallback: () => again(typable(w, 16) ? 'type' : 'spell'),
      prompt: `<span class="qkr ${sizeCls(w.tl)}">${esc(w.tl)}</span>`, sub: [sub, gloss(w)].filter(Boolean).join(' · '),
    };
  }
  if (kind === 'spell') {
    return { ...base, type: 'order', sub: t('order.spell'), phrase: { tiles: spellTiles(w), tl: w.tl, end: '', fr: w.fr, en: w.en } };
  }
  if (kind === 'order') {
    return { ...base, type: 'order', sub: t('order.words'), phrase: { tiles: wordTiles(w), tl: w.tl, end: endOf(w), fr: w.fr, en: w.en } };
  }
  if (kind === 'kr2fr') {
    return mcq({ ...base, prompt: `<span class="qkr ${sizeCls(w.tl)}">${esc(w.tl)}</span>`, sub: sub || t('quiz.whatMeans') }, { label: gloss(w) }, decoys.map((o) => ({ label: gloss(o) })), n);
  }
  if (kind === 'listen2fr') {
    return mcq({ ...base, auto: true, prompt: listenBtn(), sub: t('quiz.whatMeansHeard') }, { label: gloss(w) }, decoys.map((o) => ({ label: gloss(o) })), n);
  }
  if (kind === 'fr2kr') {
    return mcq({ ...base, say: null, prompt: `<span class="qlatin">${esc(gloss(w))}</span>`, sub: t('quiz.howSay', { lang: language }) }, { label: w.tl, kr: true }, decoys.map((o) => ({ label: o.tl, kr: true })), n);
  }
  return mcq({ ...base, auto: true, prompt: listenBtn(), sub: t('quiz.whatHeard') }, { label: w.tl, kr: true }, decoys.map((o) => ({ label: o.tl, kr: true })), n);
}

/** Paires à relier : mots ↔ traductions (jusqu'à quatre). */
export function matchWords(words, track = true) {
  const list = words.slice(0, 4);
  return {
    type: 'match', sub: t('match.words'),
    pairs: list.map((w) => ({ a: w.tl, b: gloss(w), say: w.tl })),
    onAnswer: track ? (ok) => { if (!ok) list.forEach((w) => review(w.id, false)); } : undefined,
  };
}

/**
 * Exercices adaptés à l'avancement (ease : 0 au tout début, 1 à la fin du parcours ou pour un mot bien connu).
 * Plus on avance, plus il faut écrire au clavier ; au début, on remet des syllabes dans l'ordre.
 */
export function wordKind(w, ease, k) {
  if (!typable(w)) {
    // Phrases toutes faites : remettre les mots dans l'ordre, puis les dire
    return (ease >= 0.5 ? ['order', 'speak', 'dict', 'order'] : ['order', 'speak', 'order', 'spell'])[k % 4];
  }
  if (ease < 0.34) return ['spell', 'type', 'speak', 'dict'][k % 4];
  if (ease < 0.67) return ['type', 'dict', 'speak', 'type', 'spell'][k % 5];
  return ['type', 'dict', 'type', 'speak', 'dict'][k % 5];
}

/** Phrase générée à remettre dans l'ordre, en lien avec le thème quand le générateur le connaît. */
export function sentenceQuestion(theme, ease) {
  const crit = { level: ease < 0.3 ? '1' : ease < 0.7 ? '2' : '3', theme: THEMES[theme] && theme !== 'basics' ? theme : 'all' };
  return { type: 'order', sub: t('order.sentence'), phrase: phraseFor(crit) };
}

/**
 * Quiz de vocabulaire. mode : review (révision), type (tout écrire), dictation (tout à l'oreille), speak (tout à voix haute),
 * sinon un mélange qui se durcit avec l'avancement dans le parcours et la maîtrise de chaque mot.
 */
export function vocabQuiz(el, theme, mode, step) {
  const pool = wordsOf(theme);
  const depth = step ? stepDepth(step) : 0;
  let list;
  if (mode === 'type' || mode === 'dictation') {
    const ok = pool.filter((w) => typable(w));
    list = pickForReview(ok.length >= 5 ? ok : pool, len());
  } else list = pickForReview(pool, len());
  const ease = (w) => Math.max(depth, Math.max(0, box(w.id)) / 5);
  let questions;
  if (mode === 'type') questions = list.map((w) => wordQuestion(w, 'type', { pool }));
  else if (mode === 'dictation') questions = list.map((w) => wordQuestion(w, 'dict', { pool }));
  else if (mode === 'speak') questions = list.map((w) => wordQuestion(w, 'speak', { pool }));
  else {
    questions = list.map((w, k) => wordQuestion(w, wordKind(w, ease(w), k), { pool, plain: box(w.id) >= 3 }));
    // Pour commencer : relier les mots nouveaux à leur sens. Pour finir : une phrase à remettre dans l'ordre.
    const fresh = list.filter((w) => box(w.id) < 2);
    if (fresh.length >= 3) questions.unshift(matchWords(fresh));
    if (mode !== 'review' || theme) questions.push(sentenceQuestion(theme, depth));
    if (depth >= 0.5) questions.push(sentenceQuestion(theme, depth));
  }
  const name = theme && theme !== 'all' ? tr(ALL_THEMES[theme]) : t('allThemes');
  const label = { review: t('review'), type: `${t('road.type')} · ${name}`, dictation: `${t('road.dictation')} · ${name}`, speak: `${t('road.speak')} · ${name}` }[mode] || name;
  runQuiz(el, { questions, title: label, again: () => vocabQuiz(el, theme, mode, step), step, back: '#/words' });
}

// ---------- Écriture : hangeul, kana, kanji ----------
const romLabel = (x) => (x.r === '' ? t('quiz.silent') : x.r);
/** Romanisations admises pour une lettre (を se lit « o »). */
const romAccept = (x) => (x.r === 'wo' ? ['wo', 'o'] : [x.r]);

/**
 * Question sur une lettre.
 * kind : rom (lettre → écrire sa lecture au clavier latin) · type (lecture → écrire la lettre) · speak (lettre → la prononcer)
 *        secours à choix : read · pick
 */
export function letterQuestion(x, kind, others = [], n = 4) {
  const C = course();
  const tip = x.tip ? esc(tr(x.tip)) : '';
  if (x.r === '' && (kind === 'rom' || kind === 'speak')) kind = 'type'; // ㅇ : pas de son propre
  if (kind === 'speak' && !canListen()) kind = 'rom';
  if (kind === 'type') {
    const kata = /[ァ-ヶ]/.test(x.j);
    return {
      type: 'input', exact: true, kata, answer: x.j, accept: [x.j], say: x.say, auto: true,
      prompt: `<span class="qlatin">${esc(romLabel(x))}</span>`, sub: C.id === 'ja' ? t(kata ? 'type.kata' : 'type.hira') : t('type.letter'), explain: tip,
      placeholder: C.id === 'ja' ? (kata ? 'カタカナ' : 'ひらがな') : '한글',
    };
  }
  if (kind === 'rom') {
    return { type: 'input', kb: 'latin', answer: x.r, accept: romAccept(x), say: x.say, prompt: `<span class="qkr">${x.j}</span>`, sub: t('type.rom'), explain: tip };
  }
  if (kind === 'speak') {
    return { type: 'speak', answer: x.say, accept: [x.say, x.j], say: x.say, prompt: `<span class="qkr">${x.j}</span>`, sub: t('speak.letter'), explain: tip, fallback: () => letterQuestion(x, 'rom', others, n) };
  }
  if (kind === 'pick') {
    return mcq({ prompt: `<span class="qlatin">${esc(romLabel(x))}</span>`, sub: t('quiz.whichLetter'), say: x.say, explain: tip }, { label: x.j, kr: true }, others.filter((o) => o.r !== x.r).map((o) => ({ label: o.j, kr: true })), n);
  }
  return mcq({ prompt: `<span class="qkr">${x.j}</span>`, sub: t('quiz.howRead'), say: x.say, explain: tip }, { label: romLabel(x) }, others.filter((o) => o.r !== x.r).map((o) => ({ label: romLabel(o) })), n);
}

const readings = (x) => [x.on, x.kun].filter((r) => r && r !== '—').join(' · ');
const kanjiExplain = (x) => `<span class="kr">${x.j}</span> · ${esc(readings(x))} = ${esc(tr(x.mean))}<br>${t('kanji.example')} <span class="kr">${esc(x.ex[0])}</span> (${esc(x.ex[1])}) : ${esc(tr({ fr: x.ex[2], en: x.ex[3] }))}`;
/** Question sur un kanji. kind : type (écrire la lecture du mot d'exemple) · speak (lire le mot d'exemple à voix haute) */
export function kanjiQuestion(x, kind) {
  const base = { say: x.say, explain: kanjiExplain(x) };
  const meaning = tr({ fr: x.ex[2], en: x.ex[3] });
  if (kind === 'speak' && canListen()) {
    return { ...base, type: 'speak', answer: x.ex[1], accept: [x.ex[0], x.ex[1]], prompt: `<span class="qkr">${esc(x.ex[0])}</span>`, sub: `${t('speak.word')} · ${meaning}`, fallback: () => kanjiQuestion(x, 'type') };
  }
  return { ...base, type: 'input', answer: x.ex[1], accept: [x.ex[1]], prompt: `<span class="qkr">${esc(x.ex[0])}</span>`, sub: `${t('type.kanjiWord')} · ${meaning}`, placeholder: 'ひらがな' };
}
/** Paires à relier : kanji ↔ sens. */
export const matchKanji = (items) => ({
  type: 'match', sub: t('match.kanji'),
  pairs: items.slice(0, 4).map((x) => ({ a: x.j, b: tr(x.mean).split(/[,;]/)[0], say: x.say })),
});

/** Les deux formes d'un kana (hiragana j, katakana j2) deviennent deux lettres distinctes. */
export const kanaForms = (items) => items.flatMap((x) => (x.j2 ? [x, { ...x, j: x.j2 }] : [x]));

/** Syllabe au hasard. kind : rom (la lire : écrire sa romanisation) · type (l'écrire) */
export function syllableQuestion(kind) {
  const s = course().script.randomSyllable();
  if (kind === 'type') {
    return { type: 'input', answer: s.text, accept: [s.text], say: s.text, auto: true, prompt: `<span class="qlatin">${esc(s.rom)}</span>`, sub: t('type.syllable') };
  }
  return { type: 'input', kb: 'latin', answer: s.rom, accept: [s.rom], say: s.text, prompt: `<span class="qkr">${s.text}</span>`, sub: t('type.romSyl') };
}

/** Mots courts, pour lire et écrire de vrais mots. */
export const shortWords = () => course().words.filter((w) => !/[\s?？]/.test(w.tl) && (w.r || w.tl).length <= 5);
/** Lire un mot : écrire sa romanisation au clavier latin. */
export function readWordQuestion(w) {
  const C = course();
  const shown = C.id === 'ja' ? w.r || w.tl : w.tl;
  return { type: 'input', kb: 'latin', answer: C.wordRom(w), accept: [C.wordRom(w)], say: w.tl, prompt: `<span class="qkr ${sizeCls(shown)}">${esc(shown)}</span>`, sub: t('type.romWord'), explain: `${t('quiz.meaning')} ${esc(gloss(w))}` };
}

/**
 * Quiz d'écriture. mode : type (tout écrire avec le clavier de la langue), speak (tout prononcer),
 * sinon un mélange : lire (clavier latin), écrire (clavier coréen ou japonais), prononcer.
 */
export function scriptQuiz(el, set, step, mode) {
  const C = course();
  const S = C.script;
  const depth = step ? stepDepth(step) : 0;
  const all = mode === 'type';
  const oral = mode === 'speak';
  let questions;
  let title;
  if (S.sets[set]?.kind === 'kanji') {
    const items = shuffle(S.sets[set].items).slice(0, len());
    title = tr(S.sets[set].label);
    questions = [];
    // Par groupes de quatre : relier les kanji à leur sens, puis écrire ou dire la lecture des mots
    for (let k = 0; k < items.length; k += 4) {
      const group = items.slice(k, k + 4);
      if (!all && !oral && group.length >= 3) questions.push(matchKanji(group));
      group.forEach((x, i) => questions.push(kanjiQuestion(x, oral || (!all && i % 3 === 2) ? 'speak' : 'type')));
    }
  } else if (S.sets[set]) {
    // Les kana regroupent hiragana (j) et katakana (j2) : chaque question tire l'une des deux formes.
    const form = (x) => (x.j2 && Math.random() < 0.5 ? { ...x, j: x.j2 } : x);
    const items = S.sets[set].items.map(form);
    title = tr(S.sets[set].label);
    const kinds = depth < 0.2 ? ['rom', 'type', 'rom', 'speak'] : ['type', 'rom', 'type', 'speak'];
    questions = shuffle(items).slice(0, len()).map((x, k) => letterQuestion(x, all ? 'type' : oral ? 'speak' : kinds[k % 4]));
  } else if (set === 'syllables') {
    title = tr(S.syllableLabel);
    questions = Array.from({ length: len() }, (_, k) => syllableQuestion(all || k % 2 ? 'type' : 'rom'));
  } else {
    title = t('script.readWords');
    const pool = shortWords();
    const kinds = ['rom', 'dict', 'speak', 'dict'];
    questions = shuffle(pool).slice(0, len()).map((w, k) => {
      const kind = all ? 'dict' : oral ? 'speak' : kinds[k % 4];
      return kind === 'rom' ? readWordQuestion(w) : wordQuestion(w, kind, { pool, track: false });
    });
  }
  if (all) title = `${t('road.type')} · ${title}`;
  if (oral) title = `${t('road.speak')} · ${title}`;
  runQuiz(el, { questions, title, again: () => scriptQuiz(el, set, step, mode), back: '#/hangul', step });
}

export { wordsOf };

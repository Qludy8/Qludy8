// Haru (하루) — application d'entraînement au coréen et au japonais. Navigation et écrans principaux.
import { $, $$, esc, speak, canSpeak, hasVoice, sfx, haptic, toast, countUp, pulse, celebrate, ICONS } from './ui.js';
import * as store from './store.js';
import { compose, CHO, JUNG, JONG } from './hangul.js';
import { CONSONANTS, VOWELS } from './content/jamo.js';
import { THEMES } from './content/concepts.js';
import { course, hasCourse, setCourse, COURSES, t, tr, lang, gloss } from './course.js';
import { scriptQuiz, vocabQuiz, wordsOf } from './quiz.js';
import { flashcards, pairs } from './games.js';
import { phrasesScreen, dailyScreen, dailyPhrases, phraseOfDay, phraseText, meaning } from './phrases.js';

const view = $('#view');
const titleEl = $('#title');
const backEl = $('#back');
const tabs = $('#tabs');
let installEvent = null;

// ---------- Écrans ----------
// tab : onglet (et couleur) ; back : adresse du bouton retour ; focus : plein écran (jeux)
const SCREENS = {
  welcome: { title: () => 'Haru', tab: 'home', bare: true, render: welcome },
  home: { title: () => 'Haru', tab: 'home', render: home },
  hangul: { title: () => tr(course().script.title), tab: 'hangul', render: script },
  words: { title: () => t('title.words'), tab: 'words', render: words },
  phrases: { title: () => t('title.phrases'), tab: 'phrases', render: phrasesScreen },
  guide: { title: () => t('title.guide'), tab: 'guide', render: guide },
  progress: { title: () => t('title.progress'), tab: 'stats', top: 'progress', back: '#/home', render: progress },
  settings: { title: () => t('title.settings'), tab: 'settings', top: 'settings', back: '#/home', render: settings },
  lexicon: { title: () => t('title.lexicon'), tab: 'words', back: '#/words', render: lexicon },
  hquiz: { title: () => t('title.scriptQuiz', { name: tr(course().script.title) }), tab: 'hangul', back: '#/hangul', focus: true, render: (el, q) => scriptQuiz(el, q.set || Object.keys(course().script.sets)[0]) },
  quiz: { title: () => t('title.quiz'), tab: 'words', back: '#/words', focus: true, render: (el, q) => vocabQuiz(el, q.t || 'all', q.mode) },
  cards: { title: () => t('title.cards'), tab: 'words', back: '#/words', focus: true, render: (el, q) => flashcards(el, q.t || 'all') },
  pairs: { title: () => t('title.pairs'), tab: 'words', back: '#/words', focus: true, render: (el) => pairs(el) },
  daily: { title: () => t('title.daily'), tab: 'phrases', back: '#/home', focus: true, render: dailyScreen },
};
const ALIASES = { learn: 'words' }; // anciennes adresses

const APP_VERSION = '13'; // à changer avec VERSION dans sw.js

// À chaque lancement, on repasse par le choix de la langue (sauf après un rechargement de mise à jour).
const SKIP_MENU = 'haru.skipMenu';
let choosing = true;
try {
  if (sessionStorage.getItem(SKIP_MENU)) { choosing = false; sessionStorage.removeItem(SKIP_MENU); }
} catch { /* stockage indisponible */ }

function route() {
  let [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  path = ALIASES[path] || path;
  let name = SCREENS[path] ? path : 'home';
  if (!hasCourse() || choosing) name = 'welcome';
  const params = Object.fromEntries(new URLSearchParams(query));
  const s = SCREENS[name];
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $$('.celebrate').forEach((c) => c.remove()); // ferme une célébration restée ouverte
  renderChrome();
  titleEl.textContent = s.title();
  document.title = name === 'home' || name === 'welcome' ? 'Haru' : `${s.title()} · Haru`;
  backEl.hidden = !s.back;
  backEl.dataset.href = params.mode === 'review' ? '#/home' : s.back || '';
  document.body.classList.toggle('focus', !!s.focus || !!s.bare);
  document.body.classList.toggle('bare', !!s.bare);
  document.body.dataset.tab = s.tab;
  $$('a', tabs).forEach((a) => a.classList.toggle('on', a.dataset.tab === s.tab));
  $$('[data-top]').forEach((a) => a.classList.toggle('on', a.dataset.top === s.top));
  view.innerHTML = '';
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  s.render(view, params);
}

/** Libellés des onglets et de l'en-tête dans la langue choisie. */
function renderChrome() {
  document.documentElement.lang = lang();
  const labels = { home: t('tab.home'), hangul: tr(course().script.title), words: t('tab.words'), phrases: t('tab.phrases'), guide: t('tab.guide') };
  $$('a', tabs).forEach((a) => { $('.tl', a).textContent = labels[a.dataset.tab]; });
  $('[data-top="progress"]').setAttribute('aria-label', t('title.progress'));
  $('[data-top="settings"]').setAttribute('aria-label', t('title.settings'));
  backEl.setAttribute('aria-label', t('back'));
}

backEl.addEventListener('click', () => {
  sfx.tap();
  location.hash = backEl.dataset.href;
});
window.addEventListener('hashchange', route);

// ---------- Premier lancement : choix de la langue ----------
function welcome(el) {
  el.innerHTML = `
    <div class="screen welcome">
      <div class="seg ui-lang">
        <button class="seg-btn ${lang() === 'fr' ? 'on' : ''}" data-l="fr">Français</button>
        <button class="seg-btn ${lang() === 'en' ? 'on' : ''}" data-l="en">English</button>
      </div>
      <div class="w-logo"><img src="icons/icon.svg" alt=""></div>
      <h1>Haru</h1>
      <p class="muted">${t('welcome.tagline')}</p>
      <h2>${t('welcome.question')}</h2>
      <div class="w-choices">
        ${Object.values(COURSES).map((c, i) => `
          <button class="w-choice ${c.id === store.get().settings.course ? 'last' : ''}" data-c="${c.id}" style="--i:${i}; --tc: ${c.id === 'ko' ? 'var(--c-hangul)' : 'var(--c-guide)'}">
            <span class="w-native kr lang-${c.id}">${c.native}</span>
            <b>${tr(c.name)}</b>
            <span class="muted small">${t('welcome.' + c.id)}</span>
            ${c.id === store.get().settings.course ? `<span class="w-last">${t('welcome.resume')}</span>` : ''}
          </button>`).join('')}
      </div>
      <p class="muted small center">${t('welcome.switch')}</p>
    </div>`;
  $('.ui-lang', el).addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    store.get().settings.lang = b.dataset.l;
    store.save();
    sfx.tap();
    route();
  });
  $$('.w-choice', el).forEach((b) => b.addEventListener('click', () => {
    setCourse(b.dataset.c);
    choosing = false;
    applySettings();
    sfx.win();
    haptic(10);
    location.hash = '#/home';
    route();
  }));
}

// ---------- Accueil ----------
function greetingSub() {
  const h = new Date().getHours();
  if (h < 5) return t('greet.night');
  if (h < 12) return t('greet.morning');
  if (h < 18) return t('greet.afternoon');
  return t('greet.evening');
}

// Parcours « Premiers pas » : trois étapes pour bien démarrer, masqué une fois terminé.
const STEP_WORDS = 10;
function firstSteps(st, C) {
  const seen = Math.min(STEP_WORDS, Object.keys(st.srs || {}).length);
  const did = st.steps || {};
  const steps = [
    { done: !!did.script, href: '#/hangul', kr: C.id === 'ja' ? 'あ' : '한', c: 'var(--c-hangul)',
      b: t('steps.script', { name: tr(C.script.title) }), s: t('steps.scriptSub') },
    { done: seen >= STEP_WORDS, href: '#/cards?t=basics', kr: C.id === 'ja' ? '語' : '말', c: 'var(--c-words)',
      b: t('steps.words', { n: STEP_WORDS }), s: seen ? t('steps.wordsProgress', { n: seen, total: STEP_WORDS }) : t('steps.wordsSub') },
    { done: !!did.phrase || Object.keys(st.daily || {}).length > 0, href: '#/phrases', kr: C.id === 'ja' ? '文' : '문', c: 'var(--c-phrases)',
      b: t('steps.phrase'), s: t('steps.phraseSub') },
  ];
  const n = steps.filter((x) => x.done).length;
  if (n === steps.length) return '';
  const next = steps.findIndex((x) => !x.done);
  return `
      <section class="card steps">
        <div class="steps-head"><span class="eyebrow">${t('steps.title')}</span><span class="count">${n} / ${steps.length}</span></div>
        ${steps.map((x, i) => `
        <a class="step ${x.done ? 'done' : ''} ${i === next ? 'next' : ''}" href="${x.href}" style="--tc:${x.c}">
          <span class="step-ico kr">${x.done ? '✓' : x.kr}</span>
          <div><b>${x.b}</b><span class="muted small">${x.s}</span></div>
          ${i === next ? `<span class="btn small primary">${t('steps.start')}</span>` : '<span class="chev">›</span>'}
        </a>`).join('')}
      </section>`;
}

function home(el) {
  const st = store.get();
  const C = course();
  const tx = store.todayXp();
  const lv = store.level();
  const streak = store.streak();
  const due = store.dueCount(C.words);
  const dailyDone = (st.daily[store.dayKey()] || 0) >= 3;
  const pod = phraseOfDay();
  const date = new Date().toLocaleDateString(lang() === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  el.innerHTML = `
    <div class="screen home">
      <section class="hero-card">
        <div>
          <p class="muted small cap">${esc(date)}</p>
          <h1 class="kr">${esc(C.greeting(new Date().getHours()))}</h1>
          <p class="muted">${greetingSub()}</p>
        </div>
        <div class="goal-ring" style="--p:${Math.min(1, tx / st.goal)}" aria-label="${t('home.goal')}">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50"/><circle class="val" cx="60" cy="60" r="50"/></svg>
          <div><b class="n">0</b><span>/ ${st.goal} XP</span></div>
        </div>
      </section>

      <div class="stats-row">
        <div class="stat-pill ${streak ? 'hot' : ''}"><span class="ico flame">${ICONS.flame}</span><div><b>${streak}</b><span>${t(streak > 1 ? 'home.days' : 'home.day')}</span></div></div>
        <a class="stat-pill" href="#/progress"><span class="ico level">${lv.lv}</span><div><b>${t('level', { n: lv.lv })}</b><span>${t('home.toNext', { xp: lv.toNext, n: lv.lv + 1 })}</span></div></a>
      </div>

      ${firstSteps(st, C)}

      ${installEvent ? `<button class="card install"><b>${t('home.install')}</b><span class="muted">${t('home.installSub')}</span></button>` : ''}

      <a class="card daily-cta ${dailyDone ? 'done' : ''}" href="#/daily">
        <span class="gl kr ${dailyDone ? 'ok' : ''}" style="--tc: var(--gold)">${dailyDone ? ICONS.check : C.id === 'ja' ? '今日' : '오늘'}</span>
        <div style="flex:1">
          <span class="eyebrow">${t('title.daily')}</span>
          <b>${dailyDone ? t('home.dailyDone') : t('home.dailyTodo')}</b>
          <span class="muted small">${dailyDone ? t('home.dailyAgain') : t('home.dailySub')}</span>
        </div>
        <span class="chev">›</span>
      </a>

      <section class="card pod">
        <div class="pod-head">
          <span class="eyebrow">${t('home.pod')}</span>
          ${canSpeak() ? `<button class="icon-btn pod-say" aria-label="${t('listen')}">${ICONS.sound}</button>` : ''}
        </div>
        <p class="kr pod-kr ${pod.ruby ? 'has-ruby' : ''}">${phraseText(pod)}</p>
        ${st.settings.roman ? `<p class="muted small">${esc(pod.rom)}</p>` : ''}
        <button class="pod-fr"><span>${esc(meaning(pod))}</span><em>${t('home.tapTranslate')}</em></button>
      </section>

      <h2>${t('home.train')}</h2>
      <div class="grid2">
        <a class="tile-link" href="#/quiz?mode=review" style="--i:0; --tc: var(--c-words)">
          <span class="tl-kr kr">${C.id === 'ja' ? '復習' : '복습'}</span><b>${t('review')}</b>
          <span class="muted small">${due ? t(due > 1 ? 'words.dueN' : 'words.due1', { n: due }) : t('home.wordsOfDay')}</span>
          ${due ? `<span class="badge">${due}</span>` : ''}
        </a>
        <a class="tile-link" href="#/phrases" style="--i:1; --tc: var(--c-phrases)">
          <span class="tl-kr kr">${C.id === 'ja' ? '文' : '문장'}</span><b>${t('home.generate')}</b><span class="muted small">${t('home.generateSub')}</span>
        </a>
      </div>
    </div>`;

  countUp($('.goal-ring .n', el), tx);
  requestAnimationFrame(() => requestAnimationFrame(() => $('.goal-ring', el)?.classList.add('go')));
  $('.pod-say', el)?.addEventListener('click', () => speak(pod.tl));
  $('.pod-fr', el).addEventListener('click', (e) => {
    e.currentTarget.classList.add('shown');
    sfx.tap();
  });
  $('.install', el)?.addEventListener('click', async () => {
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    route();
  });
}

// ---------- Mots (vocabulaire) ----------
// Chaque thème : [mot en coréen, mot en japonais, couleur]
const THEME_STYLE = {
  food: ['밥', '食', 'var(--c-phrases)'],
  daily: ['집', '家', 'var(--c-home)'],
  leisure: ['놀이', '遊', 'var(--c-guide)'],
  city: ['도시', '町', 'var(--c-stats)'],
  study: ['공부', '学', 'var(--c-words)'],
  basics: ['안녕', '初', 'var(--c-hangul)'],
};

function words(el) {
  const C = course();
  const ja = C.id === 'ja';
  const due = store.dueCount(C.words);
  el.innerHTML = `
    <div class="screen words">
      <div class="grid2">
        <a class="tile-link" href="#/quiz?t=all" style="--i:0; --tc: var(--c-words)"><span class="tl-kr kr">${ja ? 'クイズ' : '퀴즈'}</span><b>${t('words.quiz')}</b><span class="muted small">${t('allThemes')}</span></a>
        <a class="tile-link" href="#/pairs" style="--i:1; --tc: var(--c-guide)"><span class="tl-kr kr">${ja ? 'ペア' : '짝'}</span><b>${t('title.pairs')}</b><span class="muted small">${t('words.pairsSub')}</span></a>
        <a class="tile-link" href="#/quiz?mode=review" style="--i:2; --tc: var(--c-home)"><span class="tl-kr kr">${ja ? '復習' : '복습'}</span><b>${t('review')}</b><span class="muted small">${due ? t(due > 1 ? 'words.dueN' : 'words.due1', { n: due }) : t('words.consolidate')}</span>${due ? `<span class="badge">${due}</span>` : ''}</a>
        <a class="tile-link" href="#/lexicon" style="--i:3; --tc: var(--c-stats)"><span class="tl-kr kr">${ja ? '単語' : '단어'}</span><b>${t('title.lexicon')}</b><span class="muted small">${t('words.count', { n: C.words.length })}</span></a>
      </div>
      <h2>${t('words.byTheme')}</h2>
      <ul class="list themes">
        ${Object.entries(THEMES).map(([k, label], i) => {
          const ws = wordsOf(k);
          if (!ws.length) return '';
          const m = ws.filter((w) => store.box(w.id) >= 3).length;
          const [gko, gja, color] = THEME_STYLE[k] || ['말', '語', 'var(--accent)'];
          return `
          <li class="theme-row" style="--i:${i}; --tc: ${color}">
            <span class="gl kr">${ja ? gja : gko}</span>
            <div class="theme-info">
              <b>${esc(tr(label))}</b>
              <span class="muted small">${t('words.mastered', { m, n: ws.length })}</span>
              <div class="mini-bar"><i style="--w:${m / ws.length}"></i></div>
            </div>
            <a class="btn small ghost" href="#/cards?t=${k}">${t('words.cards')}</a>
            <a class="btn small primary" href="#/quiz?t=${k}">${t('title.quiz')}</a>
          </li>`;
        }).join('')}
      </ul>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.mini-bar', el).forEach((b) => b.classList.add('go'))));
}

// ---------- Écriture : hangeul (coréen) ou kana (japonais) ----------
const scriptSet = {};
function script(el) {
  const C = course();
  const S = C.script;
  if (!S.sets[scriptSet[C.id]]) scriptSet[C.id] = Object.keys(S.sets)[0];
  const ja = C.id === 'ja';
  el.innerHTML = `
    <div class="screen hangul">
      <div class="seg sets ${ja ? 'scroll' : ''}">
        ${Object.entries(S.sets).map(([k, s]) => `<button class="seg-btn ${k === scriptSet[C.id] ? 'on' : ''}" data-set="${k}">${esc(tr(s.label))}</button>`).join('')}
      </div>
      <div class="jamo-grid"></div>
      <div class="jamo-detail card" hidden></div>
      <a class="btn primary quiz-set" href="#">${t('script.quizSet')}</a>
      <a class="card guide-link" href="#/guide?c=pron">
        <span class="l-glyph kr">${ja ? '発音' : '발음'}</span>
        <span class="l-text"><b>${t('script.rules')}</b><span class="muted small">${t('script.rulesSub.' + C.id)}</span></span>
        <span class="chev">›</span>
      </a>

      ${S.builder ? `
      <h2>${t('script.build')}</h2>
      <p class="muted small">${t('script.buildHelp')}</p>
      <div class="card builder">
        <div class="built kr">가</div>
        <div class="built-rom muted">ga</div>
        <div class="b-row" data-part="c">${CONSONANTS.map((c, i) => `<button class="chip kr ${i === 0 ? 'on' : ''}" data-v="${CHO.indexOf(c.j)}">${c.j}</button>`).join('')}</div>
        <div class="b-row" data-part="v">${VOWELS.map((v, i) => `<button class="chip kr ${i === 0 ? 'on' : ''}" data-v="${JUNG.indexOf(v.j)}">${v.j}</button>`).join('')}</div>
        <div class="b-row" data-part="f">${['', 'ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'].map((f, i) => `<button class="chip kr ${i === 0 ? 'on' : ''}" data-v="${JONG.indexOf(f)}">${f || '—'}</button>`).join('')}</div>
      </div>` : `<p class="muted small script-help">${t('script.kanaHelp')}</p>`}

      <h2>${t('script.reading')}</h2>
      <div class="grid2">
        <a class="tile-link" href="#/hquiz?set=syllables" style="--i:0"><span class="tl-kr kr">${S.syllableSample}</span><b>${tr(S.syllableLabel)}</b><span class="muted small">${t('script.syllablesSub')}</span></a>
        <a class="tile-link" href="#/hquiz?set=words" style="--i:1"><span class="tl-kr kr">${ja ? 'さかな' : '사과'}</span><b>${t('script.words')}</b><span class="muted small">${t('script.wordsSub')}</span></a>
      </div>
    </div>`;

  const grid = $('.jamo-grid', el);
  const detail = $('.jamo-detail', el);
  function renderGrid() {
    const set = S.sets[scriptSet[C.id]];
    const items = set.items;
    const kanji = set.kind === 'kanji';
    grid.classList.toggle('wide', !kanji && items[0]?.j.length > 1);
    grid.classList.toggle('pairs', !!items[0]?.j2);
    grid.classList.toggle('kanji', kanji);
    grid.innerHTML = items.map((x, i) => `
      <button class="jamo" style="--i:${Math.min(i, 30)}" data-i="${i}">
        ${x.j2 ? `<span class="kr pair"><span>${x.j}</span><span class="k2">${x.j2}</span></span>` : `<span class="kr">${x.j}</span>`}
        <small>${kanji ? esc(tr(x.mean).split(/[,;]/)[0]) : x.r || '∅ / ng'}</small>
      </button>`).join('');
    detail.hidden = true;
    $('.quiz-set', el).href = `#/hquiz?set=${scriptSet[C.id]}`;
    $('.quiz-set', el).textContent = kanji ? t('kanji.quiz') : t('script.quizSet');
  }
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.jamo');
    if (!b) return;
    const x = S.sets[scriptSet[C.id]].items[b.dataset.i];
    speak(x.say);
    haptic(5);
    $$('.jamo', grid).forEach((j) => j.classList.toggle('on', j === b));
    detail.hidden = false;
    if (x.mean) {
      // Kanji : sens, lectures on / kun et mot d'exemple à écouter
      detail.innerHTML = `
        <div class="jd-big kr">${x.j}</div>
        <div>
          <b>${esc(tr(x.mean))}</b>
          <p class="kanji-read"><span class="muted small">on</span> <span class="kr">${esc(x.on)}</span> · <span class="muted small">kun</span> <span class="kr">${esc(x.kun)}</span></p>
          <button class="link ex-say" data-say="${esc(x.ex[0])}"><span class="kr">${esc(x.ex[0])}</span> <span class="kr muted small">${esc(x.ex[1])}</span> · ${esc(tr({ fr: x.ex[2], en: x.ex[3] }))}</button>
        </div>`;
      $('.ex-say', detail).addEventListener('click', (ev) => speak(ev.currentTarget.dataset.say));
      pulse(detail, 'pop');
      return;
    }
    detail.innerHTML = `
      <div class="jd-big kr">${x.j}${x.j2 ? `<span class="k2">${x.j2}</span>` : ''}</div>
      <div>
        <b>${x.r ? esc(x.r) : t('quiz.silent')}</b>${x.name ? ` <span class="muted kr">· ${x.name}</span>` : ''}
        <p>${esc(tr(x.tip))}</p>
        ${x.say !== x.j ? `<p class="muted small">${t('script.example')} <span class="kr">${x.say}</span> (${esc(C.romanize(x.say))})</p>` : ''}
      </div>`;
    pulse(detail, 'pop');
  });
  $('.sets', el).addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    scriptSet[C.id] = b.dataset.set;
    $$('.sets .seg-btn', el).forEach((x) => x.classList.toggle('on', x === b));
    sfx.tap();
    renderGrid();
  });
  renderGrid();

  if (!S.builder) return;
  // Atelier syllabe (coréen)
  const part = { c: CHO.indexOf('ㄱ'), v: JUNG.indexOf('ㅏ'), f: 0 };
  $('.builder', el).addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const row = b.closest('.b-row');
    part[row.dataset.part] = Number(b.dataset.v);
    $$('.chip', row).forEach((x) => x.classList.toggle('on', x === b));
    const s = compose(part.c, part.v, part.f);
    const out = $('.built', el);
    out.textContent = s;
    $('.built-rom', el).textContent = C.romanize(s);
    pulse(out, 'pop');
    speak(s);
  });
}

// ---------- Lexique ----------
let lexTheme = 'all';
function lexicon(el) {
  const C = course();
  const roman = store.get().settings.roman;
  el.innerHTML = `
    <div class="screen lexicon">
      <input class="search" type="search" placeholder="${t('lex.search', { lang: tr(C.name).toLowerCase() })}" autocomplete="off">
      <div class="seg scroll themes-seg">
        <button class="seg-btn" data-t="all">${t('all')}</button>
        ${Object.entries(THEMES).map(([k, l]) => `<button class="seg-btn" data-t="${k}">${esc(tr(l))}</button>`).join('')}
      </div>
      <ul class="list words"></ul>
    </div>`;
  const list = $('.words', el);
  const input = $('.search', el);
  function render() {
    const q = input.value.trim().toLowerCase();
    $$('.themes-seg .seg-btn', el).forEach((b) => b.classList.toggle('on', b.dataset.t === lexTheme));
    const ws = wordsOf(lexTheme).filter((w) => !q || w.tl.includes(q) || (w.r || '').includes(q) || gloss(w).toLowerCase().includes(q) || C.wordRom(w).includes(q));
    list.innerHTML = ws.length
      ? ws.map((w, i) => {
        const b = store.box(w.id);
        const read = C.wordRead(w);
        return `
        <li class="row" style="--i:${Math.min(i, 12)}">
          <button class="row-main say-row" data-say="${esc(w.tl)}">
            <span><span class="kr">${esc(w.tl)}</span>${read ? ` <span class="kr muted small">${esc(read)}</span>` : ''}${roman ? `<span class="muted small"> ${esc(C.wordRom(w))}</span>` : ''}</span>
            <span class="small">${esc(gloss(w))}</span>
          </button>
          <span class="dots5" title="${t('lex.mastery')}">${[1, 2, 3, 4, 5].map((k) => `<i class="${b >= k ? 'on' : ''}"></i>`).join('')}</span>
        </li>`;
      }).join('')
      : `<li class="empty muted">${t('lex.none')}</li>`;
  }
  input.addEventListener('input', render);
  $('.themes-seg', el).addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    lexTheme = b.dataset.t;
    sfx.tap();
    render();
  });
  list.addEventListener('click', (e) => {
    const r = e.target.closest('.say-row');
    if (r) {
      speak(r.dataset.say);
      pulse(r.closest('li'), 'flash'); // simple surbrillance, sans zoom
    }
  });
  render();
}

// ---------- Guide : prononciation et grammaire ----------
let guideCat = 'pron';
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
const guideList = () => course().guide[lang()] || course().guide.fr;
const GUIDE_CATS = ['pron', 'gram'];

function guide(el, q) {
  if (q.id) return lesson(el, q.id);
  if (q.c && GUIDE_CATS.includes(q.c)) guideCat = q.c;
  const read = store.get().read || {};
  el.innerHTML = `
    <div class="screen guide">
      <div class="seg cats">
        ${GUIDE_CATS.map((k) => `<button class="seg-btn ${k === guideCat ? 'on' : ''}" data-c="${k}">${t('guide.' + k)}</button>`).join('')}
      </div>
      <ul class="list lessons"></ul>
    </div>`;
  const list = $('.lessons', el);
  function render() {
    const ls = guideList().filter((g) => g.cat === guideCat);
    list.innerHTML = ls.map((g, i) => `
      <li style="--i:${i}">
        <a class="lesson-row" href="#/guide?id=${g.id}">
          <span class="l-glyph kr">${esc(g.glyph)}</span>
          <span class="l-text"><b>${esc(g.title)}</b><span class="muted small">${esc(g.sum)}</span></span>
          <span class="l-check ${read[g.id] ? 'on' : ''}">${read[g.id] ? ICONS.check : '›'}</span>
        </a>
      </li>`).join('');
  }
  $('.cats', el).addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    guideCat = b.dataset.c;
    $$('.cats .seg-btn', el).forEach((x) => x.classList.toggle('on', x === b));
    sfx.tap();
    render();
  });
  render();
}

function lesson(el, id) {
  const all = guideList();
  const g = all.find((x) => x.id === id);
  if (!g) {
    location.hash = '#/guide';
    return;
  }
  guideCat = g.cat;
  backEl.hidden = false;
  backEl.dataset.href = `#/guide?c=${g.cat}`;
  titleEl.textContent = t('guide.' + g.cat);
  const st = store.get();
  st.read ||= {};
  if (!st.read[g.id]) {
    st.read[g.id] = store.dayKey();
    store.addXp(2);
  }
  const same = all.filter((x) => x.cat === g.cat);
  const k = same.indexOf(g);
  const next = same[k + 1];
  const prev = same[k - 1];
  const roman = st.settings.roman;
  const C = course();
  const cjk = /[가-힣ㄱ-ㅣ぀-ヿ一-龯]/;
  const romOf = (tl, pr) => (C.id === 'ja' ? C.romanize(pr || tl) : C.romanize(pr || tl));

  const block = (b) => {
    if (b.p) return `<p class="g-p">${md(b.p)}</p>`;
    if (b.tip) return `<div class="g-tip"><span class="eyebrow">${t('guide.remember')}</span>${md(b.tip)}</div>`;
    if (b.table) {
      const [head, ...rows] = b.table;
      const cell = (c) => (cjk.test(c) ? `<span class="kr">${esc(c)}</span>` : md(c));
      return `<div class="g-table-wrap"><table class="g-table"><thead><tr>${head.map((h) => `<th>${cell(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${cell(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    if (b.ex) {
      return `<ul class="g-ex">${b.ex.map(([tl, fr, pr]) => `
        <li><button class="g-say" data-say="${esc(tl)}">
          <span class="g-kr kr">${esc(tl)}${pr ? ` <span class="g-pr">[${esc(pr)}]</span>` : ''}</span>
          ${roman && (C.id === 'ko' || pr || !/[一-龯]/.test(tl)) ? `<span class="muted small">${esc(romOf(tl, pr))}</span>` : ''}
          <span class="small">${esc(fr)}</span>
        </button>${canSpeak() ? `<span class="g-icon">${ICONS.sound}</span>` : ''}</li>`).join('')}</ul>`;
    }
    return '';
  };

  el.innerHTML = `
    <article class="screen lesson">
      <div class="lesson-head">
        <span class="l-glyph big kr">${esc(g.glyph)}</span>
        <div><h1>${esc(g.title)}</h1><p class="muted">${esc(g.sum)}</p></div>
      </div>
      ${g.blocks.map(block).join('')}
      <div class="lesson-nav">
        ${prev ? `<a class="btn ghost" href="#/guide?id=${prev.id}">‹ ${t('guide.prev')}</a>` : '<span></span>'}
        ${next ? `<a class="btn primary" href="#/guide?id=${next.id}">${t('guide.next')} ›</a>` : `<a class="btn primary" href="#/guide?c=${g.cat}">${t('finish')}</a>`}
      </div>
    </article>`;
  el.addEventListener('click', onSay);
}

function onSay(e) {
  const b = e.target.closest('.g-say');
  if (!b) return;
  speak(b.dataset.say);
  pulse(b.parentElement, 'flash');
}

// ---------- Progrès ----------
function progress(el) {
  const st = store.get();
  const lv = store.level();
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() - 34);
  for (let i = 0; i < 35; i++) {
    days.push({ k: store.dayKey(d), xp: st.days[store.dayKey(d)] || 0 });
    d.setDate(d.getDate() + 1);
  }
  const active = Object.values(st.days).filter((x) => x > 0).length;
  const learned = Object.keys(st.srs).length;
  const lessons = Object.keys(st.read || {}).length;
  const n = st.journal.length;

  el.innerHTML = `
    <div class="screen progress-screen">
      <p class="course-chip"><span class="kr">${course().native}</span> ${esc(tr(course().name))}</p>
      <section class="card level-card">
        <div class="lv-badge">${lv.lv}</div>
        <div class="lv-info">
          <b>${t('level', { n: lv.lv })}</b>
          <div class="xp-bar"><i style="--w:${lv.progress}"></i></div>
          <span class="muted small">${t('progress.total', { xp: st.xp, left: lv.toNext, n: lv.lv + 1 })}</span>
        </div>
      </section>

      <div class="stats3">
        <div class="stat"><b>${store.streak()}</b><span>${t('progress.streak')}</span></div>
        <div class="stat"><b>${active}</b><span>${t('progress.active')}</span></div>
        <div class="stat"><b>${store.todayXp()}</b><span>${t('progress.today')}</span></div>
        <div class="stat"><b>${store.mastered()}</b><span>${t('progress.mastered')}</span></div>
        <div class="stat"><b>${learned}</b><span>${t('progress.seen')}</span></div>
        <div class="stat"><b>${lessons} / ${guideList().length}</b><span>${t('progress.lessons')}</span></div>
      </div>

      <h2>${t('progress.weeks')}</h2>
      <div class="card heat">
        ${days.map((x, i) => `<i style="--i:${i}" class="h${x.xp >= st.goal ? 3 : x.xp >= st.goal / 2 ? 2 : x.xp > 0 ? 1 : 0}" title="${x.k} : ${x.xp} XP"></i>`).join('')}
      </div>
      <p class="muted small heat-legend"><i class="h1"></i> ${t('progress.lActive')} <i class="h2"></i> ${t('progress.lHalf')} <i class="h3"></i> ${t('progress.lGoal')}</p>

      <h2>${t('journal.title')}</h2>
      <a class="card daily-cta" href="#/phrases">
        <div><b>${t(n > 1 ? 'progress.savedN' : 'progress.saved1', { n })}</b>
        <span class="muted small">${t('progress.savedHint')}</span></div>
        <span class="chev">›</span>
      </a>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => $('.xp-bar', el)?.classList.add('go')));
}

// ---------- Réglages ----------
const seg = (key, options, current) => `
  <div class="seg set-seg" data-key="${key}">
    ${options.map(([v, l]) => `<button class="seg-btn ${String(current) === String(v) ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}
  </div>`;

function settings(el) {
  const st = store.get();
  const s = st.settings;
  const C = course();
  const voiceMsg = !canSpeak() ? t('set.noTts') : hasVoice() ? t('set.voiceOk') : t('set.noVoice.' + C.id);

  el.innerHTML = `
    <div class="screen settings-screen">
      <h2 class="first">${t('set.languages')}</h2>
      <div class="card settings">
        <div class="set-row col"><span>${t('set.course')}</span>${seg('course', Object.values(COURSES).map((c) => [c.id, tr(c.name)]), s.course)}
          <span class="muted small">${t('set.courseHelp')}</span></div>
        <div class="set-row col"><span>${t('set.uiLang')}</span>${seg('lang', [['fr', 'Français'], ['en', 'English']], lang())}</div>
      </div>

      <h2>${t('set.appearance')}</h2>
      <div class="card settings">
        <div class="set-row col"><span>${t('set.theme')}</span>${seg('theme', [['auto', t('set.auto')], ['light', t('set.light')], ['dark', t('set.dark')]], s.theme)}
          <span class="muted small">${t('set.autoHelp')}</span></div>
        <div class="set-row col"><span>${t('set.textSize', { lang: tr(C.name).toLowerCase() })}</span>${seg('krLarge', [['false', t('set.normal')], ['true', t('set.large')]], s.krLarge)}</div>
        ${toggle('motion', t('set.motion'), s.motion)}
        ${document.documentElement.requestFullscreen ? toggle('fullscreenTap', t('set.fullscreen'), s.fullscreenTap) : ''}
      </div>

      <h2>${t('set.learning')}</h2>
      <div class="card settings">
        <div class="set-row col"><span>${t('set.goal')}</span>${seg('goal', [[10, '10'], [30, '30'], [50, '50'], [100, '100']], st.goal)}</div>
        <div class="set-row col"><span>${t('set.quizLen')}</span>${seg('quizLen', [[5, '5'], [10, '10'], [15, '15'], [20, '20']], s.quizLen)}
          <span class="muted small">${t('set.quizLenHelp')}</span></div>
        ${toggle('roman', t('set.roman'), s.roman)}
      </div>

      <h2>${t('set.sound')}</h2>
      <div class="card settings">
        ${toggle('autoplay', t('set.autoplay'), s.autoplay)}
        ${toggle('sound', t('set.sfx'), s.sound)}
        ${toggle('haptics', t('set.haptics'), s.haptics)}
        <div class="set-row col">
          <span>${t('set.rate')} <b class="rate-val">${s.rate.toFixed(2).replace('.', t('decimal'))}</b></span>
          <div class="rate-row">
            <input type="range" class="rate" min="0.5" max="1.1" step="0.05" value="${s.rate}" aria-label="${t('set.rate')}">
            <button class="icon-btn test-voice" aria-label="${t('set.testVoice')}">${ICONS.sound}</button>
          </div>
          <span class="muted small">${voiceMsg}</span>
        </div>
      </div>

      <h2>${t('set.data')}</h2>
      <div class="card data-actions">
        <p class="muted small">${t('set.dataHelp')}</p>
        <button class="btn ghost export">${t('set.export')}</button>
        <label class="btn ghost import">${t('set.import')}<input type="file" accept="application/json,.json" hidden></label>
        <button class="btn danger reset">${t('set.reset', { lang: tr(C.name).toLowerCase() })}</button>
      </div>

      <h2>${t('set.install')}</h2>
      <div class="card install-help">
        <p><b>iPhone (Safari)</b> : ${t('set.installIos')}</p>
        <p><b>Android (Chrome)</b> : ${t('set.installAndroid')}</p>
        <p class="muted small">${t('set.updates')}</p>
      </div>
      <p class="muted small center version">Haru · 하루 · ${t('set.haru')} · v${APP_VERSION}</p>
    </div>`;

  $$('.set-seg', el).forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    const k = g.dataset.key;
    const v = b.dataset.v;
    sfx.tap();
    if (k === 'course') {
      setCourse(v);
      applySettings();
      toast(t('set.switched', { lang: tr(course().name) }));
      return route();
    }
    if (k === 'lang') {
      s.lang = v;
      store.save();
      return route();
    }
    if (k === 'goal') st.goal = Number(v);
    else if (k === 'quizLen') s.quizLen = Number(v);
    else if (k === 'krLarge') s.krLarge = v === 'true';
    else s[k] = v;
    store.save();
    applySettings();
    $$('.seg-btn', g).forEach((x) => x.classList.toggle('on', x === b));
  }));
  $$('.switch input', el).forEach((inp) => inp.addEventListener('change', () => {
    s[inp.name] = inp.checked;
    store.save();
    applySettings();
    dispatchEvent(new Event('haru:settings'));
    sfx.tap();
    haptic(5);
  }));
  const rate = $('.rate', el);
  rate.addEventListener('input', () => {
    s.rate = Number(rate.value);
    $('.rate-val', el).textContent = s.rate.toFixed(2).replace('.', t('decimal'));
  });
  rate.addEventListener('change', () => store.save());
  $('.test-voice', el).addEventListener('click', () => speak(C.testVoice));

  $('.export', el).addEventListener('click', () => {
    const blob = new Blob([store.exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `haru-backup-${store.dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('.import input', el).addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      store.importAll(JSON.parse(await f.text()));
      location.reload();
    } catch {
      toast(t('set.badFile'));
    }
  });
  $('.reset', el).addEventListener('click', () => {
    if (confirm(t('set.resetConfirm'))) {
      resetCourse();
      toast(t('set.resetDone'));
      route();
    }
  });
}

/** Réinitialise uniquement la progression du cours actif. */
function resetCourse() {
  const st = store.get();
  for (const k of ['xp']) st[k] = 0;
  for (const k of ['days', 'srs', 'daily', 'best', 'read', 'steps']) st[k] = {};
  st.journal = [];
  delete st.crit;
  store.save();
}

const toggle = (name, label, on) => `
  <label class="set-row switch">
    <span>${label}</span>
    <input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i>
  </label>`;

/** Applique thème, taille du texte, animations et police de la langue apprise. */
const THEME_BG = { light: '#f7f5fb', dark: '#15131c' };
function applySettings() {
  const s = store.get().settings;
  const root = document.documentElement;
  if (s.theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  root.dataset.course = course().id;
  root.classList.toggle('kr-large', !!s.krLarge);
  root.classList.toggle('no-motion', !s.motion);
  $$('meta[name="theme-color"]').forEach((m) => {
    const scheme = m.media.includes('dark') ? 'dark' : 'light';
    m.content = THEME_BG[s.theme === 'auto' ? scheme : s.theme];
  });
}

// ---------- Démarrage ----------
// Affichées tout de suite, au moment où les XP sont gagnés (fin de série, phrase réussie…).
addEventListener('haru:levelup', (e) => celebrate({
  glyph: String(e.detail),
  title: t('cel.level', { n: e.detail }),
  text: t('cel.levelText.' + course().id),
  button: course().id === 'ja' ? '頑張って！' : '화이팅 !',
}));
addEventListener('haru:goal', (e) => {
  if (document.querySelector('.celebrate')) return; // un niveau vient déjà d'être fêté
  celebrate({ glyph: course().id === 'ja' ? '目標' : '목표', title: t('cel.goal'), text: e.detail > 1 ? t('cel.goalStreak', { n: e.detail }) : t('cel.goalFirst'), button: t('continue') });
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  if (!location.hash || location.hash === '#/home') route();
});

$$('a', tabs).forEach((a) => a.addEventListener('click', () => {
  sfx.tap();
  haptic(4);
}));

// Retour visuel sur tous les boutons (pression).
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('button, .btn, .tile-link, .card[href]');
  if (b) b.classList.add('pressed');
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => document.addEventListener(type, () => $$('.pressed').forEach((b) => b.classList.remove('pressed'))));

// Plein écran réel (Android) : masque la barre système en bas, que le manifeste ne cache pas toujours.
// Le navigateur exige un geste de l'utilisateur : on le demande au premier toucher.
const installed = matchMedia('(display-mode: standalone), (display-mode: minimal-ui)').matches; // déjà en plein écran via le manifeste : rien à faire
const wantsFullscreen = () => installed && store.get().settings.fullscreenTap && !document.fullscreenElement && !!document.documentElement.requestFullscreen;
function enterFullscreen() {
  if (!wantsFullscreen()) return;
  document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
}
// Tous les gestes qui autorisent le plein écran (le simple défilement ne compte pas pour le navigateur).
for (const type of ['pointerup', 'touchend', 'click', 'keydown']) document.addEventListener(type, enterFullscreen, { passive: true });

/**
 * Écran d'ouverture : le navigateur interdit le plein écran sans geste de l'utilisateur.
 * À l'ouverture de l'application installée, un premier toucher sur cet écran active le plein écran
 * et masque la barre du téléphone dès le départ.
 */
function launchScreen() {
  if (!wantsFullscreen() || matchMedia('(display-mode: fullscreen)').matches) return;
  const box = document.createElement('div');
  box.className = 'launch';
  box.innerHTML = `
    <div class="launch-inner">
      <img src="icons/icon.svg" alt="">
      <h1>Haru</h1>
      <p class="kr">${course().id === 'ja' ? '今日も頑張ろう！' : '오늘도 화이팅!'}</p>
      <span class="launch-tap">${t('launch.tap')}</span>
    </div>`;
  document.body.append(box);
  const go = () => {
    enterFullscreen();
    box.classList.add('out');
    setTimeout(() => box.remove(), 350);
  };
  box.addEventListener('pointerup', go, { once: true });
  box.addEventListener('keydown', go, { once: true });
}
addEventListener('haru:settings', () => {
  if (!store.get().settings.fullscreenTap && document.fullscreenElement) document.exitFullscreen().catch(() => {});
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Quand une nouvelle version prend la main, on recharge une fois pour l'afficher tout de suite.
  const hadWorker = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadWorker || reloaded || document.body.classList.contains('focus')) return;
    reloaded = true;
    try { if (!choosing) sessionStorage.setItem(SKIP_MENU, '1'); } catch { /* stockage indisponible */ }
    location.reload();
  });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
    .then((reg) => {
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    })
    .catch(() => {});
}

applySettings();
if (hasCourse()) dailyPhrases(); // précalcul pour un premier clic sans délai
route();
if (hasCourse()) launchScreen();

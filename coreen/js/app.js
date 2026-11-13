// Haru (하루) — application d'entraînement au coréen et au japonais. Navigation et écrans principaux.
import { $, $$, esc, speak, canSpeak, hasVoice, sfx, toast, countUp, pulse, celebrate, ICONS } from './ui.js';
import * as store from './store.js';
import { ALL_THEMES, isPhraseTheme, themeGlyph, themeColor, themeShort } from './content/lexicon.js';
import { course, hasCourse, setCourse, COURSES, t, tr, lang, gloss } from './course.js';
import { scriptQuiz, vocabQuiz, wordsOf } from './quiz.js';
import { flashcards, pairs } from './games.js';
import { phrasesScreen, dailyScreen, dailyPhrases, phraseOfDay, phraseText, meaning, roadPhrases } from './phrases.js';
import { roadScreen, findStep } from './road.js';
import { writeScreen, strokeDemo, canTrace, writeChars } from './draw.js';
import { examScreen } from './exam.js';
import { achievements, newTiers, TIERS } from './achievements.js';

const view = $('#view');
const titleEl = $('#title');
const backEl = $('#back');
const tabs = $('#tabs');
let installEvent = null;

// ---------- Écrans ----------
// tab : onglet (et couleur) ; back : adresse du bouton retour ; focus : plein écran (jeux)
const SCREENS = {
  welcome: { title: () => 'Haru', tab: 'road', bare: true, render: welcome },
  road: { title: () => t('road.title'), tab: 'road', render: roadScreen },
  hangul: { title: () => tr(course().script.title), tab: 'hangul', render: script },
  words: { title: () => t('title.words'), tab: 'words', render: words },
  phrases: { title: () => t('title.phrases'), tab: 'phrases', render: phrasesTab },
  guide: { title: () => t('title.guide'), tab: 'guide', render: guide },
  profile: { title: () => t('title.profile'), tab: 'profile', render: profile },
  settings: { title: () => t('title.settings'), tab: 'settings', top: 'settings', back: '#/profile', render: settings },
  lexicon: { title: () => t('title.lexicon'), tab: 'words', back: '#/words', render: lexicon },
  hquiz: { title: () => t('title.scriptQuiz', { name: tr(course().script.title) }), tab: 'hangul', back: '#/hangul', focus: true, render: (el, q) => scriptQuiz(el, q.set || Object.keys(course().script.sets)[0], q.step, q.mode) },
  write: { title: () => t('title.write'), tab: 'hangul', back: '#/hangul', focus: true, render: writeScreen },
  exam: { title: () => t('title.exam'), tab: 'road', back: '#/road', focus: true, render: examScreen },
  quiz: { title: () => t('title.quiz'), tab: 'words', back: '#/words', focus: true, render: (el, q) => vocabQuiz(el, q.t || 'all', q.mode, q.step) },
  cards: { title: () => t('title.cards'), tab: 'words', back: '#/words', focus: true, render: (el, q) => flashcards(el, q.t || 'all', q.step) },
  pairs: { title: () => t('title.pairs'), tab: 'words', back: '#/words', focus: true, render: (el, q) => pairs(el, q.step) },
  daily: { title: () => t('title.daily'), tab: 'phrases', back: '#/phrases', focus: true, render: dailyScreen },
  rphrase: { title: () => t('title.phrases'), tab: 'phrases', back: '#/road', focus: true, render: (el, q) => {
    const s = findStep(q.step);
    if (s?.kind === 'phrase' || s?.kind === 'ptype') roadPhrases(el, s);
    else location.hash = '#/road';
  } },
};
const ALIASES = { learn: 'words', home: 'road', progress: 'profile' }; // anciennes adresses

const APP_VERSION = '28'; // à changer avec VERSION dans sw.js

// À chaque lancement, on repasse par le choix de la langue (sauf après un rechargement de mise à jour).
const SKIP_MENU = 'haru.skipMenu';
let choosing = true;
try {
  if (sessionStorage.getItem(SKIP_MENU)) { choosing = false; sessionStorage.removeItem(SKIP_MENU); }
} catch { /* stockage indisponible */ }

function route() {
  let [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  path = ALIASES[path] || path;
  let name = SCREENS[path] ? path : 'road';
  if (!hasCourse() || choosing) name = 'welcome';
  const params = Object.fromEntries(new URLSearchParams(query));
  const s = SCREENS[name];
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $$('.celebrate').forEach((c) => c.remove()); // ferme une célébration restée ouverte
  renderChrome();
  titleEl.textContent = s.title();
  document.title = name === 'welcome' ? 'Haru' : `${s.title()} · Haru`;
  backEl.hidden = !s.back;
  backEl.dataset.href = params.step ? '#/road' : s.back || '';
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
  const labels = { road: t('road.title'), hangul: tr(course().script.title), words: t('tab.words'), phrases: t('tab.phrases'), guide: t('tab.guide'), profile: t('title.profile') };
  $$('a', tabs).forEach((a) => { $('.tl', a).textContent = labels[a.dataset.tab]; });
  // Onglet de l'écriture : un caractère de la langue apprise en guise d'icône
  const glyph = course().id === 'ja' ? 'あ' : '한';
  const ti = $('a[data-tab="hangul"] .ti', tabs);
  if (ti.textContent !== glyph) ti.innerHTML = `<span class="ti-glyph kr">${glyph}</span>`;
  levelChip();
  $('[data-top="settings"]').setAttribute('aria-label', t('title.settings'));
  backEl.setAttribute('aria-label', t('back'));
}

/** Pastille de niveau dans l'en-tête : numéro du niveau et avancement dans ce niveau. */
function levelChip() {
  const chip = $('.lv-chip');
  const lv = store.level();
  chip.setAttribute('aria-label', `${t('level', { n: lv.lv })} · ${lv.into} / ${lv.span} XP`);
  $('.lv-n', chip).textContent = lv.lv;
  $('.lv-meter i', chip).style.width = `${Math.round(lv.progress * 100)}%`;
}
addEventListener('haru:xp', levelChip);

// La hauteur de l'en-tête sert à caler les bandeaux de module du parcours juste en dessous.
const topbar = $('.topbar');
const syncTopbar = () => document.documentElement.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`);
new ResizeObserver(syncTopbar).observe(topbar);
syncTopbar();

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
    location.hash = '#/road';
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

/** Onglet Phrases : défi et phrase du jour, puis le générateur. */
function phrasesTab(el) {
  phrasesScreen(el);
  const st = store.get();
  const C = course();
  const dailyDone = (st.daily[store.dayKey()] || 0) >= 3;
  const pod = phraseOfDay();
  $('.phrases', el).insertAdjacentHTML('afterbegin', `
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
      <h2>${t('phrase.generator')}</h2>`);
  $('.pod-say', el)?.addEventListener('click', () => speak(pod.tl));
  $('.pod-fr', el).addEventListener('click', (e) => {
    e.currentTarget.classList.add('shown');
    sfx.tap();
  });
}

// ---------- Mots (vocabulaire) ----------
function words(el) {
  const C = course();
  const ja = C.id === 'ja';
  const due = store.dueCount(C.words);
  // Une ligne par thème ; les phrases toutes faites sont listées à part.
  const themeRows = (phrases) => Object.entries(ALL_THEMES).filter(([k]) => isPhraseTheme(k) === phrases).map(([k, label], i) => {
    const ws = wordsOf(k);
    if (!ws.length) return '';
    const m = ws.filter((w) => store.box(w.id) >= 3).length;
    return `
          <li class="theme-row" style="--i:${Math.min(i, 12)}; --tc: ${themeColor(k)}">
            <span class="gl kr">${esc(themeGlyph(k, ja))}</span>
            <div class="theme-info">
              <b>${esc(themeShort(tr(label)))}</b>
              <span class="muted small">${t('words.mastered', { m, n: ws.length })}</span>
              <div class="mini-bar"><i style="--w:${m / ws.length}"></i></div>
            </div>
            <div class="theme-actions">
              <a class="btn small ghost" href="#/cards?t=${k}">${t('words.cards')}</a>
              <a class="btn small primary" href="#/quiz?t=${k}">${t('title.quiz')}</a>
              <a class="btn small ghost" href="#/quiz?t=${k}&mode=type">${t('words.typeShort')}</a>
              <a class="btn small ghost" href="#/quiz?t=${k}&mode=dictation">${t('words.dictShort')}</a>
            </div>
          </li>`;
  }).join('');
  el.innerHTML = `
    <div class="screen words">
      <div class="grid2">
        <a class="tile-link" href="#/quiz?t=all" style="--i:0; --tc: var(--c-words)"><span class="tl-kr kr">${ja ? 'クイズ' : '퀴즈'}</span><b>${t('words.quiz')}</b><span class="muted small">${t('allThemes')}</span></a>
        <a class="tile-link" href="#/pairs" style="--i:1; --tc: var(--c-guide)"><span class="tl-kr kr">${ja ? 'ペア' : '짝'}</span><b>${t('title.pairs')}</b><span class="muted small">${t('words.pairsSub')}</span></a>
        <a class="tile-link" href="#/quiz?t=all&mode=type" style="--i:2; --tc: var(--c-hangul)"><span class="tl-kr kr">${ja ? '書く' : '쓰기'}</span><b>${t('words.type')}</b><span class="muted small">${t('words.typeSub')}</span></a>
        <a class="tile-link" href="#/quiz?t=all&mode=dictation" style="--i:3; --tc: var(--c-phrases)"><span class="tl-kr kr">${ja ? '聞く' : '듣기'}</span><b>${t('words.dictation')}</b><span class="muted small">${t('words.dictationSub')}</span></a>
        <a class="tile-link" href="#/quiz?mode=review" style="--i:2; --tc: var(--c-home)"><span class="tl-kr kr">${ja ? '復習' : '복습'}</span><b>${t('review')}</b><span class="muted small">${due ? t(due > 1 ? 'words.dueN' : 'words.due1', { n: due }) : t('words.consolidate')}</span>${due ? `<span class="badge">${due}</span>` : ''}</a>
        <a class="tile-link" href="#/lexicon" style="--i:3; --tc: var(--c-stats)"><span class="tl-kr kr">${ja ? '単語' : '단어'}</span><b>${t('title.lexicon')}</b><span class="muted small">${t('words.count', { n: C.words.length })}</span></a>
      </div>
      <h2>${t('words.byTheme')}</h2>
      <ul class="list themes">${themeRows(false)}</ul>
      <h2>${t('words.phrases')}</h2>
      <ul class="list themes">${themeRows(true)}</ul>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.mini-bar', el).forEach((b) => b.classList.add('go'))));
}

// ---------- Écriture : hangeul (coréen) ou kana (japonais) ----------
const scriptSet = {};
function script(el) {
  const C = course();
  const S = C.script;
  if (!S.sets[scriptSet[C.id]] || S.sets[scriptSet[C.id]].hidden) scriptSet[C.id] = Object.keys(S.sets)[0];
  const ja = C.id === 'ja';
  const symOf = (set) => set.sym || set.items[0].j;
  el.innerHTML = `
    <div class="screen hangul">
      <div class="seg sets scroll">
        ${Object.entries(S.sets).filter(([, s]) => !s.hidden).map(([k, s]) => `<button class="seg-btn ${k === scriptSet[C.id] ? 'on' : ''}" data-set="${k}"><span class="seg-sym kr">${esc(symOf(s))}</span>${esc(tr(s.label))}</button>`).join('')}
      </div>
      <div class="jamo-grid"></div>
      <div class="jamo-detail card" hidden></div>
      <a class="btn primary quiz-set" href="#">${t('script.quizSet')}</a>

      <h2>${t('script.writing')}</h2>
      <p class="muted small">${t('script.writingHelp')}</p>
      <div class="grid2 write-tiles"></div>

      <h2>${t('script.reading')}</h2>
      <div class="grid2">
        <a class="tile-link" href="#/hquiz?set=syllables" style="--i:0"><span class="tl-kr kr">${S.syllableSample}</span><b>${tr(S.syllableLabel)}</b><span class="muted small">${t('script.syllablesSub')}</span></a>
        <a class="tile-link" href="#/hquiz?set=words" style="--i:1"><span class="tl-kr kr">${ja ? 'さかな' : '사과'}</span><b>${t('script.words')}</b><span class="muted small">${t('script.wordsSub')}</span></a>
        <a class="tile-link" href="#/hquiz?set=syllables&mode=type" style="--i:2; --tc: var(--c-guide)"><span class="tl-kr kr">${ja ? 'にゅ' : '봄'}</span><b>${t('script.typeSyl')}</b><span class="muted small">${t('script.typeSylSub')}</span></a>
        <a class="tile-link" href="#/hquiz?set=words&mode=type" style="--i:3; --tc: var(--c-phrases)"><span class="tl-kr kr">${ja ? '聞く' : '듣기'}</span><b>${t('script.dictation')}</b><span class="muted small">${t('script.dictationSub')}</span></a>
      </div>

      <a class="card guide-link" href="#/guide?c=pron">
        <span class="l-glyph kr">${ja ? '発音' : '발음'}</span>
        <span class="l-text"><b>${t('script.rules')}</b><span class="muted small">${t('script.rulesSub.' + C.id)}</span></span>
        <span class="chev">›</span>
      </a>
      ${ja ? `<p class="muted small script-help">${t('script.kanaHelp')}</p>` : ''}
      <p class="muted small center credit">${t('script.credit')}</p>
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
    const cell = (x, i) => `
      <button class="jamo" style="--i:${Math.min(i, 30)}" data-i="${i}">
        ${x.j2 ? `<span class="kr pair"><span>${x.j}</span><span class="k2">${x.j2}</span></span>` : `<span class="kr">${x.j}</span>`}
        <small>${kanji ? esc(tr(x.mean).split(/[,;]/)[0]) : x.r || '∅ / ng'}</small>
      </button>`;
    if (set.groups) {
      // Une section par catégorie : titre, nombre de kanji et quiz de la catégorie
      let n = 0;
      grid.innerHTML = set.groups.map((g) => `
        <div class="jamo-group">
          <b>${esc(tr(g.label))}</b><span class="muted small">${g.items.length}</span>
          <a class="btn small ghost" href="#/write?set=kanji-${g.id}">${t('script.trace')}</a>
          <a class="btn small ghost" href="#/hquiz?set=kanji-${g.id}">${t('title.quiz')}</a>
        </div>${g.items.map((x) => cell(x, n++)).join('')}`).join('');
    } else grid.innerHTML = items.map(cell).join('');
    detail.hidden = true;
    $('.quiz-set', el).href = `#/hquiz?set=${scriptSet[C.id]}`;
    $('.quiz-set', el).textContent = set.groups ? t('kanji.quizAll', { n: items.length }) : kanji ? t('kanji.quiz') : t('script.quizSet');
    // Écriture : tracer à la main (hiragana et katakana séparément) et taper au clavier
    const id = scriptSet[C.id];
    const sample = items[0];
    const tiles = [];
    if (writeChars(id).length) {
      if (sample.j2) {
        tiles.push(`<a class="tile-link" href="#/write?set=${id}&form=hira" style="--tc: var(--c-hangul)"><span class="tl-kr kr">${sample.j}</span><b>${t('script.traceHira')}</b><span class="muted small">${t('script.traceSub')}</span></a>`);
        tiles.push(`<a class="tile-link" href="#/write?set=${id}&form=kata" style="--tc: var(--c-guide)"><span class="tl-kr kr">${sample.j2}</span><b>${t('script.traceKata')}</b><span class="muted small">${t('script.traceSub')}</span></a>`);
      } else tiles.push(`<a class="tile-link" href="#/write?set=${id}" style="--tc: var(--c-hangul)"><span class="tl-kr kr">${sample.j}</span><b>${t('script.trace')}</b><span class="muted small">${t('script.traceSub')}</span></a>`);
    }
    tiles.push(`<a class="tile-link" href="#/hquiz?set=${id}&mode=type" style="--tc: var(--c-words)"><span class="tl-kr kr">${ja ? 'かな' : 'ㅂㅈㄷ'}</span><b>${t('script.keyboard')}</b><span class="muted small">${t(kanji ? 'script.keyboardKanji' : 'script.keyboardSub')}</span></a>`);
    $('.write-tiles', el).innerHTML = tiles.join('');
  }
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.jamo');
    if (!b) return;
    const x = S.sets[scriptSet[C.id]].items[b.dataset.i];
    speak(x.say);
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
      strokes(x, [x.j]);
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
    strokes(x, x.j2 ? [x.j, x.j2] : [x.j]);
    pulse(detail, 'pop');
  });
  /** Sous le détail : l'ordre des traits animé, et un bouton pour s'exercer à tracer. */
  function strokes(x, chars) {
    const list = chars.filter((c) => [...c].length === 1 && canTrace(c));
    if (!list.length) return;
    const id = scriptSet[C.id];
    detail.insertAdjacentHTML('beforeend', `
      <div class="jd-strokes">
        ${list.map((c) => `<div class="jd-demo" data-ch="${c}"></div>`).join('')}
        <div class="jd-trace">
          <span class="muted small">${t('script.strokeOrder')}</span>
          ${list.map((c, k) => `<a class="btn small ${k ? 'ghost' : 'primary'}" href="#/write?set=${id}&ch=${encodeURIComponent(c)}${x.j2 ? `&form=${k ? 'kata' : 'hira'}` : ''}">${t('script.traceOne', { ch: c })}</a>`).join('')}
        </div>
      </div>`);
    $$('.jd-demo', detail).forEach((h) => strokeDemo(h, h.dataset.ch));
  }
  $('.sets', el).addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    scriptSet[C.id] = b.dataset.set;
    $$('.sets .seg-btn', el).forEach((x) => x.classList.toggle('on', x === b));
    sfx.tap();
    renderGrid();
  });
  renderGrid();

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
        ${Object.entries(ALL_THEMES).map(([k, l]) => `<button class="seg-btn" data-t="${k}">${esc(tr(l))}</button>`).join('')}
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
const GUIDE_CATS = ['pron', 'gram', 'adv'];

function guide(el, q) {
  if (q.id) return lesson(el, q.id, q.step);
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
      ${g.sec ? `<li class="guide-sec" style="--i:${Math.min(i, 14)}"><span>${esc(g.sec)}</span></li>` : ''}
      <li style="--i:${Math.min(i, 14)}">
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

function lesson(el, id, step) {
  const all = guideList();
  const g = all.find((x) => x.id === id);
  if (!g) {
    location.hash = '#/guide';
    return;
  }
  guideCat = g.cat;
  backEl.hidden = false;
  backEl.dataset.href = step ? '#/road' : `#/guide?c=${g.cat}`;
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
      ${step ? `<a class="btn primary big road-next" href="#/road">${t('road.back')} ›</a>` : ''}
      <div class="lesson-nav" ${step ? 'hidden' : ''}>
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
function profile(el) {
  const st = store.get();
  const lv = store.level();
  const C = course();
  const tx = store.todayXp();
  const date = new Date().toLocaleDateString(lang() === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
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
  newTiers(true);
  const ach = achievements();
  const fmtVal = (a) => (a.lower && !a.value ? '—' : String(a.value).replace('.', t('decimal')));

  el.innerHTML = `
    <div class="screen progress-screen">
      <section class="hero-card">
        <div>
          <p class="muted small cap">${esc(date)}</p>
          <h1 class="kr">${esc(C.greeting(new Date().getHours()))}</h1>
          <p class="muted">${greetingSub()} · ${esc(tr(C.name))}</p>
        </div>
        <div class="goal-ring" style="--p:${Math.min(1, tx / st.goal)}" aria-label="${t('home.goal')}">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50"/><circle class="val" cx="60" cy="60" r="50"/></svg>
          <div><b class="n">0</b><span>/ ${st.goal} XP</span></div>
        </div>
      </section>

      <section class="card level-card">
        <div class="lv-badge">${lv.lv}</div>
        <div class="lv-info">
          <div class="lv-line"><b>${t('level', { n: lv.lv })}</b><span class="lv-xp">${lv.into} / ${lv.span} XP</span></div>
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

      <h2>${t('ach.title')} <span class="muted">· ${ach.reduce((k, a) => k + a.tier, 0)} / ${ach.length * TIERS.length}</span></h2>
      <p class="muted small">${t('ach.help')}</p>
      <div class="ach-grid">
        ${ach.map((a, i) => `
          <button class="ach t${a.tier}" style="--i:${Math.min(i, 12)}" data-a="${a.id}">
            <span class="ach-medal kr ${a.glyph.length > 2 ? 'long' : ''}">${esc(a.glyph)}</span>
            <b>${esc(tr(a.title))}</b>
            <span class="ach-tier">${a.tier ? esc(tr(TIERS[a.tier - 1])) : t('ach.locked')}</span>
            <span class="ach-dots">${TIERS.map((_, k) => `<i class="${k < a.tier ? 'on' : ''}"></i>`).join('')}</span>
            <span class="mini-bar"><i style="--w:${a.progress}"></i></span>
            <span class="ach-val muted small">${a.next == null ? t('ach.max') : `${fmtVal(a)} / ${a.next}${a.unit || ''}`}</span>
          </button>`).join('')}
      </div>

      <h2>${t('journal.title')}</h2>
      <a class="card daily-cta" href="#/phrases">
        <div><b>${t(n > 1 ? 'progress.savedN' : 'progress.saved1', { n })}</b>
        <span class="muted small">${t('progress.savedHint')}</span></div>
        <span class="chev">›</span>
      </a>

      <div class="stack profile-actions">
        ${installEvent ? `<button class="btn primary install">${t('home.install')}</button>` : ''}
        <a class="btn ghost" href="#/settings">${t('title.settings')}</a>
      </div>
    </div>`;
  countUp($('.goal-ring .n', el), tx);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('.xp-bar', el)?.classList.add('go');
    $('.goal-ring', el)?.classList.add('go');
    $$('.ach .mini-bar', el).forEach((b) => b.classList.add('go'));
  }));
  // Toucher un badge : ce qu'il faut faire pour le palier suivant
  $$('.ach', el).forEach((b) => b.addEventListener('click', () => {
    const a = ach.find((x) => x.id === b.dataset.a);
    sfx.tap();
    pulse($('.ach-medal', b), 'bump');
    toast(a.next == null ? `${tr(a.title)} · ${t('ach.max')}` : `${tr(TIERS[a.tier])} : ${tr(a.desc).replace('{n}', String(a.next).replace('.', t('decimal')))}`);
  }));
  $('.install', el)?.addEventListener('click', async () => {
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    route();
  });
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
      </div>

      <h2>${t('set.learning')}</h2>
      <div class="card settings">
        <div class="set-row col"><span>${t('set.goal')}</span>${seg('goal', [[10, '10'], [30, '30'], [50, '50'], [100, '100']], st.goal)}</div>
        <div class="set-row col"><span>${t('set.quizLen')}</span>${seg('quizLen', [[5, '5'], [10, '10'], [15, '15'], [20, '20']], s.quizLen)}
          <span class="muted small">${t('set.quizLenHelp')}</span></div>
        ${toggle('roman', t('set.roman'), s.roman)}
        ${toggle('typing', t('set.typing'), s.typing !== false)}
        <div class="set-row col"><span class="muted small">${t('set.typingHelp')}</span></div>
      </div>

      <h2>${t('set.sound')}</h2>
      <div class="card settings">
        ${toggle('autoplay', t('set.autoplay'), s.autoplay)}
        ${toggle('sound', t('set.sfx'), s.sound)}
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
  for (const k of ['days', 'srs', 'daily', 'best', 'read', 'road', 'exams', 'stats', 'ach', 'wr']) st[k] = {};
  st.final = { best: 0, n: 0, last: 0, date: '' };
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

// Succès : un palier franchi s'annonce par un message (au plus un à la fois).
let achTimer = 0;
function checkAchievements() {
  clearTimeout(achTimer);
  achTimer = setTimeout(() => {
    if (!hasCourse() || choosing) return;
    const fresh = newTiers();
    if (!fresh.length) return;
    const a = fresh.at(-1);
    sfx.win();
    toast(`${t('ach.unlocked')} ${tr(a.title)} · ${tr(TIERS[a.tier - 1])}${fresh.length > 1 ? ` (+${fresh.length - 1})` : ''}`);
  }, 900);
}
addEventListener('haru:xp', checkAchievements);
addEventListener('haru:stat', checkAchievements);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  if (location.hash.startsWith('#/profile')) route();
});

$$('a', tabs).forEach((a) => a.addEventListener('click', () => {
  sfx.tap();
}));

// Retour visuel sur tous les boutons (pression).
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('button, .btn, .tile-link, .card[href]');
  if (b) b.classList.add('pressed');
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => document.addEventListener(type, () => $$('.pressed').forEach((b) => b.classList.remove('pressed'))));

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
if (hasCourse()) {
  dailyPhrases(); // précalcul pour un premier clic sans délai
  newTiers(true); // les succès déjà acquis ne sont pas annoncés au lancement
}
route();

// Haru (하루) — application d'entraînement au coréen. Navigation et écrans principaux.
import { $, $$, esc, speak, canSpeak, hasKoreanVoice, sfx, haptic, toast, countUp, pulse, celebrate, ICONS } from './ui.js';
import * as store from './store.js';
import { romanize, compose, CHO, JUNG, JONG } from './hangul.js';
import { JAMO_SETS, CONSONANTS, VOWELS } from './content/jamo.js';
import { WORDS, wordsOf, THEMES } from './words.js';
import { hangulQuiz, vocabQuiz } from './quiz.js';
import { flashcards, pairs } from './games.js';
import { phrasesScreen, dailyScreen, dailyPhrases, phraseOfDay } from './phrases.js';
import { GUIDE, GUIDE_CATS } from './content/guide.js';

const view = $('#view');
const titleEl = $('#title');
const backEl = $('#back');
const tabs = $('#tabs');
let installEvent = null;

// ---------- Écrans ----------
// tab : onglet (et couleur) de l'écran ; back : adresse du bouton retour ; focus : plein écran (jeux)
const SCREENS = {
  home: { title: 'Haru', tab: 'home', render: home },
  hangul: { title: 'Hangeul', tab: 'hangul', render: hangul },
  words: { title: 'Mots', tab: 'words', render: words },
  phrases: { title: 'Phrases', tab: 'phrases', render: phrasesScreen },
  guide: { title: 'Guide', tab: 'guide', render: guide },
  progress: { title: 'Progrès', tab: 'stats', top: 'progress', back: '#/home', render: progress },
  settings: { title: 'Réglages', tab: 'settings', top: 'settings', back: '#/home', render: settings },
  lexicon: { title: 'Lexique', tab: 'words', back: '#/words', render: lexicon },
  hquiz: { title: 'Quiz hangeul', tab: 'hangul', back: '#/hangul', focus: true, render: (el, q) => hangulQuiz(el, q.set || 'vowels') },
  quiz: { title: 'Quiz', tab: 'words', back: '#/words', focus: true, render: (el, q) => vocabQuiz(el, q.t || 'all', q.mode) },
  cards: { title: 'Cartes mémoire', tab: 'words', back: '#/words', focus: true, render: (el, q) => flashcards(el, q.t || 'all') },
  pairs: { title: 'Jeu des paires', tab: 'words', back: '#/words', focus: true, render: (el) => pairs(el) },
  daily: { title: 'Défi du jour', tab: 'phrases', back: '#/home', focus: true, render: dailyScreen },
};
const ALIASES = { learn: 'words' }; // anciennes adresses

function route() {
  let [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  path = ALIASES[path] || path;
  const name = SCREENS[path] ? path : 'home';
  const params = Object.fromEntries(new URLSearchParams(query));
  const s = SCREENS[name];
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $$('.celebrate').forEach((c) => c.remove()); // ferme une célébration restée ouverte
  titleEl.textContent = s.title;
  backEl.hidden = !s.back;
  backEl.dataset.href = params.mode === 'review' ? '#/home' : s.back || '';
  document.body.classList.toggle('focus', !!s.focus);
  document.body.dataset.tab = s.tab;
  $$('a', tabs).forEach((a) => a.classList.toggle('on', a.dataset.tab === s.tab));
  $$('[data-top]').forEach((a) => a.classList.toggle('on', a.dataset.top === s.top));
  view.innerHTML = '';
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  s.render(view, params);
}

backEl.addEventListener('click', () => {
  sfx.tap();
  location.hash = backEl.dataset.href;
});
window.addEventListener('hashchange', route);

// ---------- Accueil ----------
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return { kr: '안녕하세요', fr: 'Bonsoir, oiseau de nuit 🦉' };
  if (h < 12) return { kr: '좋은 아침이에요', fr: 'Bonjour ! ☀️' };
  if (h < 18) return { kr: '안녕하세요', fr: 'Bon après-midi ! 🌤️' };
  return { kr: '좋은 저녁이에요', fr: 'Bonsoir ! 🌙' };
}

function home(el) {
  const st = store.get();
  const tx = store.todayXp();
  const lv = store.level();
  const streak = store.streak();
  const due = store.dueCount(WORDS);
  const dailyDone = (st.daily[store.dayKey()] || 0) >= 3;
  const g = greeting();
  const pod = phraseOfDay();
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  el.innerHTML = `
    <div class="screen home">
      <section class="hero-card">
        <div>
          <p class="muted small cap">${esc(date)}</p>
          <h1 class="kr">${g.kr}</h1>
          <p class="muted">${g.fr}</p>
        </div>
        <div class="goal-ring" style="--p:${Math.min(1, tx / st.goal)}" aria-label="Objectif du jour">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50"/><circle class="val" cx="60" cy="60" r="50"/></svg>
          <div><b class="n">0</b><span>/ ${st.goal} XP</span></div>
        </div>
      </section>

      <div class="stats-row">
        <div class="stat-pill ${streak ? 'hot' : ''}"><span class="ico flame">${ICONS.flame}</span><div><b>${streak}</b><span>jour${streak > 1 ? 's' : ''} de suite</span></div></div>
        <a class="stat-pill" href="#/progress"><span class="ico level">${lv.lv}</span><div><b>Niveau ${lv.lv}</b><span>${lv.toNext} XP avant le ${lv.lv + 1}</span></div></a>
      </div>

      ${installEvent ? '<button class="card install"><b>Installer Haru</b><span class="muted">Ajoute l’application à ton écran d’accueil</span></button>' : ''}

      <a class="card daily-cta ${dailyDone ? 'done' : ''}" href="#/daily">
        <span class="d-emoji">${dailyDone ? '🌸' : '🎯'}</span>
        <div style="flex:1">
          <span class="eyebrow">Défi du jour</span>
          <b>${dailyDone ? 'Terminé, bravo !' : '3 phrases à reconstituer'}</b>
          <span class="muted small">${dailyDone ? 'Tu peux le refaire pour t’entraîner' : 'Débutant → avancé · +10 XP minimum'}</span>
        </div>
        <span class="chev">›</span>
      </a>

      <section class="card pod">
        <div class="pod-head">
          <span class="eyebrow">Phrase du jour</span>
          ${canSpeak() ? `<button class="icon-btn pod-say" aria-label="Écouter">${ICONS.sound}</button>` : ''}
        </div>
        <p class="kr pod-kr">${esc(pod.kr)}</p>
        ${st.settings.roman ? `<p class="muted small">${esc(pod.rom)}</p>` : ''}
        <button class="pod-fr"><span>${esc(pod.fr)}</span><em>Toucher pour voir la traduction</em></button>
      </section>

      <h2>On s’entraîne ?</h2>
      <div class="grid2">
        <a class="tile-link" href="#/quiz?mode=review" style="--i:0; --tc: var(--c-words)">
          <span class="t-emoji">🧠</span>
          <span class="tl-kr kr">복습</span><b>Révision</b>
          <span class="muted small">${due ? `${due} mot${due > 1 ? 's' : ''} à revoir` : 'Mots du jour'}</span>
          ${due ? `<span class="badge">${due}</span>` : ''}
        </a>
        <a class="tile-link" href="#/phrases" style="--i:1; --tc: var(--c-phrases)">
          <span class="t-emoji">🎲</span>
          <span class="tl-kr kr">문장</span><b>Générer</b><span class="muted small">Une phrase sur mesure</span>
        </a>
      </div>
    </div>`;

  countUp($('.goal-ring .n', el), tx);
  requestAnimationFrame(() => requestAnimationFrame(() => $('.goal-ring', el)?.classList.add('go')));
  $('.pod-say', el)?.addEventListener('click', () => speak(pod.kr));
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
const THEME_STYLE = {
  food: ['🍜', 'var(--c-phrases)'],
  daily: ['🏠', 'var(--c-home)'],
  leisure: ['🎬', 'var(--c-guide)'],
  city: ['🚇', 'var(--c-stats)'],
  study: ['📚', 'var(--c-words)'],
  basics: ['👋', 'var(--c-hangul)'],
};

function words(el) {
  const due = store.dueCount(WORDS);
  el.innerHTML = `
    <div class="screen words">
      <div class="grid2">
        <a class="tile-link" href="#/quiz?t=all" style="--i:0; --tc: var(--c-words)"><span class="t-emoji">❓</span><span class="tl-kr kr">퀴즈</span><b>Quiz mélangé</b><span class="muted small">Tous les thèmes</span></a>
        <a class="tile-link" href="#/pairs" style="--i:1; --tc: var(--c-guide)"><span class="t-emoji">⚡</span><span class="tl-kr kr">짝</span><b>Paires</b><span class="muted small">Contre la montre</span></a>
        <a class="tile-link" href="#/quiz?mode=review" style="--i:2; --tc: var(--c-home)"><span class="t-emoji">🧠</span><span class="tl-kr kr">복습</span><b>Révision</b><span class="muted small">${due ? `${due} à revoir` : 'Mots à consolider'}</span>${due ? `<span class="badge">${due}</span>` : ''}</a>
        <a class="tile-link" href="#/lexicon" style="--i:3; --tc: var(--c-stats)"><span class="t-emoji">🔎</span><span class="tl-kr kr">단어</span><b>Lexique</b><span class="muted small">${WORDS.length} mots</span></a>
      </div>
      <h2>Par thème</h2>
      <ul class="list themes">
        ${Object.entries(THEMES).map(([k, label], i) => {
          const ws = wordsOf(k);
          const m = ws.filter((w) => store.box(w.id) >= 3).length;
          const [emoji, color] = THEME_STYLE[k] || ['📘', 'var(--accent)'];
          return `
          <li class="theme-row" style="--i:${i}; --tc: ${color}">
            <span class="th-emoji">${emoji}</span>
            <div class="theme-info">
              <b>${esc(label)}</b>
              <span class="muted small">${m} / ${ws.length} maîtrisés</span>
              <div class="mini-bar"><i style="--w:${m / ws.length}"></i></div>
            </div>
            <a class="btn small ghost" href="#/cards?t=${k}">Cartes</a>
            <a class="btn small primary" href="#/quiz?t=${k}">Quiz</a>
          </li>`;
        }).join('')}
      </ul>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.mini-bar', el).forEach((b) => b.classList.add('go'))));
}

// ---------- Alphabet ----------
let hangulSet = 'vowels';
function hangul(el) {
  el.innerHTML = `
    <div class="screen hangul">
      <div class="seg sets">
        ${Object.entries(JAMO_SETS).map(([k, s]) => `<button class="seg-btn ${k === hangulSet ? 'on' : ''}" data-set="${k}">${s.label}</button>`).join('')}
      </div>
      <div class="jamo-grid"></div>
      <div class="jamo-detail card" hidden></div>
      <a class="btn primary quiz-set" href="#/hquiz?set=${hangulSet}">Quiz sur ces lettres</a>
      <a class="card guide-link" href="#/guide?c=pron">
        <span class="l-glyph kr">발음</span>
        <span class="l-text"><b>Règles de prononciation</b><span class="muted small">Liaisons, consonnes finales, ㅎ, nasalisation…</span></span>
        <span class="chev">›</span>
      </a>

      <h2>Construire une syllabe</h2>
      <p class="muted small">Une syllabe coréenne s’écrit en bloc : consonne + voyelle (+ consonne finale facultative). Sans consonne, on écrit ㅇ (muet).</p>
      <div class="card builder">
        <div class="built kr">가</div>
        <div class="built-rom muted">ga</div>
        <div class="b-row" data-part="c">${CONSONANTS.map((c, i) => `<button class="chip kr ${i === 0 ? 'on' : ''}" data-v="${CHO.indexOf(c.j)}">${c.j}</button>`).join('')}</div>
        <div class="b-row" data-part="v">${VOWELS.map((v, i) => `<button class="chip kr ${i === 0 ? 'on' : ''}" data-v="${JUNG.indexOf(v.j)}">${v.j}</button>`).join('')}</div>
        <div class="b-row" data-part="f">${['', 'ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'].map((f, i) => `<button class="chip kr ${i === 0 ? 'on' : ''}" data-v="${JONG.indexOf(f)}">${f || '—'}</button>`).join('')}</div>
      </div>

      <h2>Lecture</h2>
      <div class="grid2">
        <a class="tile-link" href="#/hquiz?set=syllables" style="--i:0"><span class="tl-kr kr">가나다</span><b>Syllabes</b><span class="muted small">Lire des blocs</span></a>
        <a class="tile-link" href="#/hquiz?set=words" style="--i:1"><span class="tl-kr kr">사과</span><b>Mots</b><span class="muted small">Lire de vrais mots</span></a>
      </div>
    </div>`;

  const grid = $('.jamo-grid', el);
  const detail = $('.jamo-detail', el);
  function renderGrid() {
    const items = JAMO_SETS[hangulSet].items;
    grid.innerHTML = items.map((x, i) => `
      <button class="jamo" style="--i:${i}" data-i="${i}">
        <span class="kr">${x.j}</span><small>${x.r || '∅ / ng'}</small>
      </button>`).join('');
    detail.hidden = true;
    $('.quiz-set', el).href = `#/hquiz?set=${hangulSet}`;
  }
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.jamo');
    if (!b) return;
    const x = JAMO_SETS[hangulSet].items[b.dataset.i];
    speak(x.say);
    haptic(5);
    $$('.jamo', grid).forEach((j) => j.classList.toggle('on', j === b));
    detail.hidden = false;
    detail.innerHTML = `
      <div class="jd-big kr">${x.j}</div>
      <div>
        <b>${x.r ? esc(x.r) : 'muette / ng'}</b>${x.name ? ` <span class="muted kr">· ${x.name}</span>` : ''}
        <p>${esc(x.tip)}</p>
        <p class="muted small">Exemple : <span class="kr">${x.say}</span> (${esc(romanize(x.say))})</p>
      </div>`;
    pulse(detail, 'pop');
  });
  $('.sets', el).addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    hangulSet = b.dataset.set;
    $$('.sets .seg-btn', el).forEach((x) => x.classList.toggle('on', x === b));
    sfx.tap();
    renderGrid();
  });
  renderGrid();

  // Atelier syllabe
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
    $('.built-rom', el).textContent = romanize(s);
    pulse(out, 'pop');
    speak(s);
  });
}

// ---------- Lexique ----------
let lexTheme = 'all';
function lexicon(el) {
  const roman = store.get().settings.roman;
  el.innerHTML = `
    <div class="screen lexicon">
      <input class="search" type="search" placeholder="Rechercher (français ou coréen)" autocomplete="off">
      <div class="seg scroll themes-seg">
        <button class="seg-btn" data-t="all">Tous</button>
        ${Object.entries(THEMES).map(([k, l]) => `<button class="seg-btn" data-t="${k}">${esc(l)}</button>`).join('')}
      </div>
      <ul class="list words"></ul>
    </div>`;
  const list = $('.words', el);
  const input = $('.search', el);
  function render() {
    const q = input.value.trim().toLowerCase();
    $$('.themes-seg .seg-btn', el).forEach((b) => b.classList.toggle('on', b.dataset.t === lexTheme));
    const ws = wordsOf(lexTheme).filter((w) => !q || w.kr.includes(q) || w.fr.toLowerCase().includes(q) || romanize(w.kr).includes(q));
    list.innerHTML = ws.length
      ? ws.map((w, i) => {
        const b = store.box(w.id);
        return `
        <li class="row" style="--i:${Math.min(i, 12)}">
          <button class="row-main say-row" data-kr="${esc(w.kr)}">
            <span class="kr">${esc(w.kr)}</span>${roman ? `<span class="muted small"> ${esc(romanize(w.kr))}</span>` : ''}
            <span class="small">${esc(w.fr)}</span>
          </button>
          <span class="dots5" title="Maîtrise">${[1, 2, 3, 4, 5].map((k) => `<i class="${b >= k ? 'on' : ''}"></i>`).join('')}</span>
        </li>`;
      }).join('')
      : '<li class="empty muted">Aucun mot trouvé.</li>';
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
      speak(r.dataset.kr);
      pulse(r.closest('li'), 'flash'); // simple surbrillance, sans zoom
    }
  });
  render();
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

  el.innerHTML = `
    <div class="screen progress-screen">
      <section class="card level-card">
        <div class="lv-badge">${lv.lv}</div>
        <div class="lv-info">
          <b>Niveau ${lv.lv}</b>
          <div class="xp-bar"><i style="--w:${lv.progress}"></i></div>
          <span class="muted small">${st.xp} XP au total · ${lv.toNext} XP avant le niveau ${lv.lv + 1}</span>
        </div>
      </section>

      <div class="stats3">
        <div class="stat"><b>${store.streak()}</b><span>jours de suite</span></div>
        <div class="stat"><b>${active}</b><span>jours actifs</span></div>
        <div class="stat"><b>${today()}</b><span>XP aujourd’hui</span></div>
        <div class="stat"><b>${store.mastered()}</b><span>mots maîtrisés</span></div>
        <div class="stat"><b>${learned}</b><span>mots vus</span></div>
        <div class="stat"><b>${lessons} / ${GUIDE.length}</b><span>leçons lues</span></div>
      </div>

      <h2>5 dernières semaines</h2>
      <div class="card heat">
        ${days.map((x, i) => `<i style="--i:${i}" class="h${x.xp >= st.goal ? 3 : x.xp >= st.goal / 2 ? 2 : x.xp > 0 ? 1 : 0}" title="${x.k} : ${x.xp} XP"></i>`).join('')}
      </div>
      <p class="muted small heat-legend"><i class="h1"></i> actif <i class="h2"></i> mi-objectif <i class="h3"></i> objectif atteint</p>

      <h2>Mon carnet de phrases</h2>
      <a class="card daily-cta" href="#/phrases">
        <div><b>${st.journal.length} phrase${st.journal.length > 1 ? 's' : ''} enregistrée${st.journal.length > 1 ? 's' : ''}</b>
        <span class="muted small">Touche l’étoile d’une phrase générée pour l’ajouter</span></div>
        <span class="chev">›</span>
      </a>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => $('.xp-bar', el)?.classList.add('go')));
}
const today = () => store.todayXp();

// ---------- Réglages ----------
const seg = (key, options, current) => `
  <div class="seg set-seg" data-key="${key}">
    ${options.map(([v, l]) => `<button class="seg-btn ${String(current) === String(v) ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}
  </div>`;

function settings(el) {
  const st = store.get();
  const s = st.settings;
  const voiceMsg = !canSpeak()
    ? 'La synthèse vocale n’est pas disponible sur cet appareil.'
    : hasKoreanVoice()
      ? 'Voix coréenne détectée ✓'
      : 'Aucune voix coréenne détectée. iPhone : Réglages → Accessibilité → Contenu énoncé → Voix → Coréen. Android : Paramètres → Synthèse vocale → installer le coréen.';

  el.innerHTML = `
    <div class="screen settings-screen">
      <h2 class="first">Apparence</h2>
      <div class="card settings">
        <div class="set-row col"><span>Thème</span>${seg('theme', [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']], s.theme)}
          <span class="muted small">Automatique suit le réglage du téléphone.</span></div>
        <div class="set-row col"><span>Taille du texte coréen</span>${seg('krLarge', [['false', 'Normale'], ['true', 'Grande']], s.krLarge)}</div>
        ${toggle('motion', 'Animations', s.motion)}
        ${document.documentElement.requestFullscreen ? toggle('fullscreen', 'Plein écran (masque les barres du téléphone)', s.fullscreen) : ''}
      </div>

      <h2>Apprentissage</h2>
      <div class="card settings">
        <div class="set-row col"><span>Objectif quotidien (XP)</span>${seg('goal', [[10, '10'], [30, '30'], [50, '50'], [100, '100']], st.goal)}</div>
        <div class="set-row col"><span>Questions par série</span>${seg('quizLen', [[5, '5'], [10, '10'], [15, '15'], [20, '20']], s.quizLen)}
          <span class="muted small">Quiz, cartes mémoire et quiz d’alphabet.</span></div>
        ${toggle('roman', 'Afficher la romanisation', s.roman)}
      </div>

      <h2>Son</h2>
      <div class="card settings">
        ${toggle('autoplay', 'Lecture automatique du coréen', s.autoplay)}
        ${toggle('sound', 'Effets sonores', s.sound)}
        ${toggle('haptics', 'Vibrations (Android)', s.haptics)}
        <div class="set-row col">
          <span>Vitesse de la voix <b class="rate-val">${s.rate.toFixed(2).replace('.', ',')}</b></span>
          <div class="rate-row">
            <input type="range" class="rate" min="0.5" max="1.1" step="0.05" value="${s.rate}" aria-label="Vitesse de la voix">
            <button class="icon-btn test-voice" aria-label="Tester la voix">${ICONS.sound}</button>
          </div>
          <span class="muted small">${voiceMsg}</span>
        </div>
      </div>

      <h2>Mes données</h2>
      <div class="card data-actions">
        <p class="muted small">Ta progression est enregistrée uniquement sur ce téléphone. Fais une sauvegarde de temps en temps.</p>
        <button class="btn ghost export">Exporter une sauvegarde</button>
        <label class="btn ghost import">Restaurer une sauvegarde<input type="file" accept="application/json,.json" hidden></label>
        <button class="btn danger reset">Tout réinitialiser</button>
      </div>

      <h2>Installer sur le téléphone</h2>
      <div class="card install-help">
        <p><b>iPhone (Safari)</b> : bouton Partager → « Sur l’écran d’accueil ».</p>
        <p><b>Android (Chrome)</b> : menu ⋮ → « Installer l’application ».</p>
        <p class="muted small">Les mises à jour arrivent toutes seules : ferme l’application puis rouvre-la avec internet.</p>
      </div>
      <p class="muted small center version">Haru · 하루 · « une journée »</p>
    </div>`;

  $$('.set-seg', el).forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    const k = g.dataset.key;
    const v = b.dataset.v;
    if (k === 'goal') st.goal = Number(v);
    else if (k === 'quizLen') s.quizLen = Number(v);
    else if (k === 'krLarge') s.krLarge = v === 'true';
    else s[k] = v;
    store.save();
    applySettings();
    sfx.tap();
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
    $('.rate-val', el).textContent = s.rate.toFixed(2).replace('.', ',');
  });
  rate.addEventListener('change', () => store.save());
  $('.test-voice', el).addEventListener('click', () => speak('안녕하세요. 만나서 반가워요.'));

  $('.export', el).addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(st)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `haru-sauvegarde-${store.dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('.import input', el).addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (typeof data.xp !== 'number' || typeof data.days !== 'object') throw new Error();
      localStorage.setItem('haru.v1', JSON.stringify(data));
      location.reload();
    } catch {
      toast('Fichier de sauvegarde invalide');
    }
  });
  $('.reset', el).addEventListener('click', () => {
    if (confirm('Effacer toute ta progression ? Cette action est définitive.')) {
      store.reset();
      applySettings();
      toast('Progression réinitialisée');
      route();
    }
  });
}

const toggle = (name, label, on) => `
  <label class="set-row switch">
    <span>${label}</span>
    <input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i>
  </label>`;

/** Applique thème, taille du texte et animations. */
const THEME_BG = { light: '#f6f4f0', dark: '#141416' };
function applySettings() {
  const s = store.get().settings;
  const root = document.documentElement;
  if (s.theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  root.classList.toggle('kr-large', !!s.krLarge);
  root.classList.toggle('no-motion', !s.motion);
  // Couleur des barres du téléphone
  $$('meta[name="theme-color"]').forEach((m) => {
    const scheme = m.media.includes('dark') ? 'dark' : 'light';
    m.content = THEME_BG[s.theme === 'auto' ? scheme : s.theme];
  });
}

// ---------- Guide : prononciation et grammaire ----------
let guideCat = 'pron';
const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');

function guide(el, q) {
  if (q.id) return lesson(el, q.id);
  if (q.c && GUIDE_CATS[q.c]) guideCat = q.c;
  const read = store.get().read || {};
  el.innerHTML = `
    <div class="screen guide">
      <div class="seg cats">
        ${Object.entries(GUIDE_CATS).map(([k, l]) => `<button class="seg-btn ${k === guideCat ? 'on' : ''}" data-c="${k}">${l}</button>`).join('')}
      </div>
      <ul class="list lessons"></ul>
    </div>`;
  const list = $('.lessons', el);
  function render() {
    const ls = GUIDE.filter((g) => g.cat === guideCat);
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
  const i = GUIDE.findIndex((g) => g.id === id);
  const g = GUIDE[i];
  if (!g) {
    location.hash = '#/guide';
    return;
  }
  guideCat = g.cat;
  backEl.hidden = false;
  backEl.dataset.href = `#/guide?c=${g.cat}`;
  titleEl.textContent = GUIDE_CATS[g.cat];
  const st = store.get();
  st.read ||= {};
  if (!st.read[g.id]) {
    st.read[g.id] = store.dayKey();
    store.addXp(2);
  }
  const same = GUIDE.filter((x) => x.cat === g.cat);
  const k = same.indexOf(g);
  const next = same[k + 1];
  const prev = same[k - 1];
  const roman = st.settings.roman;

  const block = (b) => {
    if (b.p) return `<p class="g-p">${md(b.p)}</p>`;
    if (b.tip) return `<div class="g-tip"><span class="eyebrow">À retenir</span>${md(b.tip)}</div>`;
    if (b.table) {
      const [head, ...rows] = b.table;
      const cell = (c) => (/[가-힣ㄱ-ㅣ]/.test(c) ? `<span class="kr">${esc(c)}</span>` : md(c));
      return `<div class="g-table-wrap"><table class="g-table"><thead><tr>${head.map((h) => `<th>${cell(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${cell(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    if (b.ex) {
      return `<ul class="g-ex">${b.ex.map(([kr, fr, pr]) => `
        <li><button class="g-say" data-say="${esc(kr)}">
          <span class="g-kr kr">${esc(kr)}${pr ? ` <span class="g-pr">[${esc(pr)}]</span>` : ''}</span>
          ${roman ? `<span class="muted small">${esc(romanize(pr || kr))}</span>` : ''}
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
        ${prev ? `<a class="btn ghost" href="#/guide?id=${prev.id}">‹ Précédente</a>` : '<span></span>'}
        ${next ? `<a class="btn primary" href="#/guide?id=${next.id}">Suivante ›</a>` : `<a class="btn primary" href="#/guide?c=${g.cat}">Terminer</a>`}
      </div>
    </article>`;
  el.addEventListener('click', onSay);
}

function onSay(e) {
  const b = e.target.closest('.g-say');
  if (!b) return;
  speak(b.dataset.say);
  pulse(b.parentElement, 'bump');
}

// ---------- Démarrage ----------
const LEVEL_EMOJI = ['🌱', '🌿', '🌸', '🌳', '⭐', '🌟', '🏅', '🏆', '👑', '🐉'];
// Affichées tout de suite, au moment où les XP sont gagnés (fin de série, phrase réussie…).
addEventListener('haru:levelup', (e) => celebrate({
  emoji: LEVEL_EMOJI[Math.min(e.detail - 2, LEVEL_EMOJI.length - 1)] || '🎉',
  title: `Niveau ${e.detail} !`,
  text: '대박 ! Tu progresses vite, continue comme ça.',
  button: '화이팅 !',
}));
addEventListener('haru:goal', (e) => {
  if (document.querySelector('.celebrate')) return; // un niveau vient déjà d'être fêté
  celebrate({ emoji: '🔥', title: 'Objectif du jour atteint !', text: e.detail > 1 ? `${e.detail} jours de suite, bravo !` : 'Reviens demain pour lancer ta série.' });
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
['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => document.addEventListener(t, () => $$('.pressed').forEach((b) => b.classList.remove('pressed'))));

// Plein écran réel (Android) : masque la barre système en bas, que le manifeste ne cache pas toujours.
// Le navigateur exige un geste de l'utilisateur : on le demande au premier toucher.
const installed = matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches;
function enterFullscreen() {
  const root = document.documentElement;
  if (!installed || !store.get().settings.fullscreen || document.fullscreenElement || !root.requestFullscreen) return;
  root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
}
document.addEventListener('click', enterFullscreen);
addEventListener('haru:settings', () => {
  if (!store.get().settings.fullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

applySettings();

// Précalcule le défi pour éviter un temps de latence au premier clic.
dailyPhrases();
route();

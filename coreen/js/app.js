// Haru (하루) — application d'entraînement au coréen. Navigation et écrans principaux.
import { $, $$, esc, speak, canSpeak, hasKoreanVoice, sfx, haptic, toast, countUp, pulse, ICONS } from './ui.js';
import * as store from './store.js';
import { romanize, compose, CHO, JUNG, JONG } from './hangul.js';
import { JAMO_SETS, CONSONANTS, VOWELS } from './content/jamo.js';
import { WORDS, wordsOf, THEMES } from './words.js';
import { hangulQuiz, vocabQuiz } from './quiz.js';
import { flashcards, pairs } from './games.js';
import { phrasesScreen, dailyScreen, dailyPhrases, phraseOfDay } from './phrases.js';

const view = $('#view');
const titleEl = $('#title');
const backEl = $('#back');
const tabs = $('#tabs');
let installEvent = null;

// ---------- Écrans ----------
const SCREENS = {
  home: { title: 'Haru', tab: 'home', render: home },
  learn: { title: 'Apprendre', tab: 'learn', render: learn },
  phrases: { title: 'Phrases', tab: 'phrases', render: phrasesScreen },
  progress: { title: 'Progrès', tab: 'progress', render: progress },
  hangul: { title: 'Alphabet', tab: 'learn', back: '#/learn', render: hangul },
  lexicon: { title: 'Lexique', tab: 'learn', back: '#/learn', render: lexicon },
  hquiz: { title: 'Quiz hangeul', back: '#/hangul', focus: true, render: (el, q) => hangulQuiz(el, q.set || 'vowels') },
  quiz: { title: 'Quiz', back: '#/learn', focus: true, render: (el, q) => vocabQuiz(el, q.t || 'all', q.mode) },
  cards: { title: 'Cartes mémoire', back: '#/learn', focus: true, render: (el, q) => flashcards(el, q.t || 'all') },
  pairs: { title: 'Jeu des paires', back: '#/learn', focus: true, render: (el) => pairs(el) },
  daily: { title: 'Défi du jour', back: '#/home', focus: true, render: dailyScreen },
};

function route() {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const name = SCREENS[path] ? path : 'home';
  const params = Object.fromEntries(new URLSearchParams(query));
  const s = SCREENS[name];
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  titleEl.textContent = s.title;
  backEl.hidden = !s.back;
  backEl.dataset.href = params.mode === 'review' ? '#/home' : s.back || '';
  document.body.classList.toggle('focus', !!s.focus);
  $$('a', tabs).forEach((a) => a.classList.toggle('on', a.dataset.tab === s.tab));
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
  if (h < 5) return { kr: '안녕하세요', fr: 'Bonsoir, oiseau de nuit' };
  if (h < 12) return { kr: '좋은 아침이에요', fr: 'Bonjour !' };
  if (h < 18) return { kr: '안녕하세요', fr: 'Bon après-midi !' };
  return { kr: '좋은 저녁이에요', fr: 'Bonsoir !' };
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
      <section class="hero">
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

      <div class="stats3">
        <div class="stat ${streak ? 'hot' : ''}"><span class="ico">${ICONS.flame}</span><b>${streak}</b><span>jour${streak > 1 ? 's' : ''} de suite</span></div>
        <div class="stat"><b>Niv. ${lv.lv}</b><div class="mini-bar"><i style="--w:${lv.progress}"></i></div><span>${lv.toNext} XP avant le suivant</span></div>
        <div class="stat"><b>${store.mastered()}</b><span>mots maîtrisés</span></div>
      </div>

      ${installEvent ? '<button class="card install"><b>Installer Haru</b><span class="muted">Ajoute l’application à ton écran d’accueil</span></button>' : ''}

      <a class="card daily-cta ${dailyDone ? 'done' : ''}" href="#/daily">
        <div>
          <span class="eyebrow">Défi du jour</span>
          <b>${dailyDone ? 'Terminé, bravo ! 🌸' : '3 phrases à reconstituer'}</b>
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

      <h2>S’entraîner</h2>
      <div class="grid2">
        <a class="tile-link" href="#/quiz?mode=review" style="--i:0">
          <span class="tl-kr kr">복습</span><b>Révision</b>
          <span class="muted small">${due ? `${due} mot${due > 1 ? 's' : ''} à revoir` : 'Mots du jour'}</span>
          ${due ? `<span class="badge">${due}</span>` : ''}
        </a>
        <a class="tile-link" href="#/phrases" style="--i:1"><span class="tl-kr kr">문장</span><b>Générer</b><span class="muted small">Une phrase sur mesure</span></a>
        <a class="tile-link" href="#/hangul" style="--i:2"><span class="tl-kr kr">한글</span><b>Alphabet</b><span class="muted small">Lettres et syllabes</span></a>
        <a class="tile-link" href="#/pairs" style="--i:3"><span class="tl-kr kr">짝</span><b>Paires</b><span class="muted small">Contre la montre</span></a>
      </div>
    </div>`;

  countUp($('.goal-ring .n', el), tx);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('.goal-ring', el)?.classList.add('go');
    $('.mini-bar', el)?.classList.add('go');
  }));
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

// ---------- Apprendre ----------
function learn(el) {
  const themes = Object.entries(THEMES);
  el.innerHTML = `
    <div class="screen learn">
      <div class="grid2">
        <a class="tile-link" href="#/hangul" style="--i:0"><span class="tl-kr kr">ㄱㄴㄷ</span><b>Alphabet</b><span class="muted small">Apprendre à lire</span></a>
        <a class="tile-link" href="#/pairs" style="--i:1"><span class="tl-kr kr">짝</span><b>Paires</b><span class="muted small">Jeu de rapidité</span></a>
        <a class="tile-link" href="#/quiz?t=all" style="--i:2"><span class="tl-kr kr">퀴즈</span><b>Quiz mélangé</b><span class="muted small">Tous les thèmes</span></a>
        <a class="tile-link" href="#/lexicon" style="--i:3"><span class="tl-kr kr">단어</span><b>Lexique</b><span class="muted small">${WORDS.length} mots</span></a>
      </div>
      <h2>Vocabulaire par thème</h2>
      <ul class="list themes">
        ${themes.map(([k, label], i) => {
          const ws = wordsOf(k);
          const m = ws.filter((w) => store.box(w.id) >= 3).length;
          return `
          <li class="theme-row" style="--i:${i}">
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
      pulse(r, 'bump');
    }
  });
  render();
}

// ---------- Progrès et réglages ----------
function progress(el) {
  const st = store.get();
  const lv = store.level();
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() - 34);
  for (let i = 0; i < 35; i++) {
    days.push({ k: store.dayKey(d), xp: st.days[store.dayKey(d)] || 0, wd: d.getDay() });
    d.setDate(d.getDate() + 1);
  }
  const active = Object.values(st.days).filter((x) => x > 0).length;
  const voiceMsg = !canSpeak()
    ? 'La synthèse vocale n’est pas disponible sur cet appareil.'
    : hasKoreanVoice()
      ? 'Voix coréenne détectée ✓'
      : 'Aucune voix coréenne détectée pour l’instant. Sur iPhone : Réglages → Accessibilité → Contenu énoncé → Voix → Coréen. Sur Android : Paramètres → Synthèse vocale → installer le coréen.';

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
        <div class="stat"><b>${st.journal.length}</b><span>phrases au carnet</span></div>
      </div>

      <h2>5 dernières semaines</h2>
      <div class="card heat">
        ${days.map((x, i) => `<i style="--i:${i}" class="h${x.xp >= st.goal ? 3 : x.xp >= st.goal / 2 ? 2 : x.xp > 0 ? 1 : 0}" title="${x.k} : ${x.xp} XP"></i>`).join('')}
      </div>

      <h2>Réglages</h2>
      <div class="card settings">
        <div class="set-row">
          <span>Objectif quotidien</span>
          <div class="seg goal-seg">${[10, 30, 50, 100].map((g) => `<button class="seg-btn ${st.goal === g ? 'on' : ''}" data-g="${g}">${g}</button>`).join('')}</div>
        </div>
        ${toggle('roman', 'Afficher la romanisation', st.settings.roman)}
        ${toggle('sound', 'Effets sonores', st.settings.sound)}
        ${toggle('haptics', 'Vibrations (Android)', st.settings.haptics)}
        <div class="set-row col">
          <span>Vitesse de la voix <b class="rate-val">${st.settings.rate.toFixed(2).replace('.', ',')}</b></span>
          <div class="rate-row">
            <input type="range" class="rate" min="0.5" max="1.1" step="0.05" value="${st.settings.rate}">
            <button class="icon-btn test-voice" aria-label="Tester la voix">${ICONS.sound}</button>
          </div>
          <span class="muted small">${voiceMsg}</span>
        </div>
      </div>

      <h2>Installer sur le téléphone</h2>
      <div class="card install-help">
        <p><b>iPhone (Safari)</b> : bouton Partager → « Sur l’écran d’accueil ».</p>
        <p><b>Android (Chrome)</b> : menu ⋮ → « Installer l’application » ou « Ajouter à l’écran d’accueil ».</p>
        <p class="muted small">Une fois installée, l’application fonctionne hors connexion. Tes données restent uniquement sur ce téléphone.</p>
      </div>

      <h2>Mes données</h2>
      <div class="card data-actions">
        <button class="btn ghost export">Exporter une sauvegarde</button>
        <label class="btn ghost import">Restaurer une sauvegarde<input type="file" accept="application/json,.json" hidden></label>
        <button class="btn danger reset">Tout réinitialiser</button>
      </div>
      <p class="muted small center">Haru · 하루 · « une journée »</p>
    </div>`;

  requestAnimationFrame(() => requestAnimationFrame(() => $('.xp-bar', el)?.classList.add('go')));

  $('.goal-seg', el).addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    st.goal = Number(b.dataset.g);
    store.save();
    sfx.tap();
    $$('.goal-seg .seg-btn', el).forEach((x) => x.classList.toggle('on', x === b));
  });
  $$('.switch input', el).forEach((inp) => inp.addEventListener('change', () => {
    st.settings[inp.name] = inp.checked;
    store.save();
    sfx.tap();
    haptic(5);
  }));
  const rate = $('.rate', el);
  rate.addEventListener('input', () => {
    st.settings.rate = Number(rate.value);
    $('.rate-val', el).textContent = st.settings.rate.toFixed(2).replace('.', ',');
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

// ---------- Démarrage ----------
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

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// Précalcule le défi pour éviter un temps de latence au premier clic.
dailyPhrases();
route();

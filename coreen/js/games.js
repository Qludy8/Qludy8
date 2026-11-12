// Cartes mémoire (avec glissement) et jeu des paires.
import { $, $$, esc, shuffle, sfx, haptic, speak, autoSpeak, confetti, countUp, pulse, burst, ICONS } from './ui.js';
import { addXp, review, pickForReview, get, save } from './store.js';
import { romanize } from './hangul.js';
import { WORDS, wordsOf, THEMES } from './words.js';

// ---------- Cartes mémoire ----------
export function flashcards(el, theme) {
  const deck = pickForReview(wordsOf(theme), get().settings.quizLen || 10);
  const roman = get().settings.roman;
  let i = 0;
  let known = 0;

  el.innerHTML = `
    <div class="cards screen">
      <div class="qbar"><div class="progress"><i></i></div><span class="count"></span></div>
      <p class="hint muted">Touche la carte pour la retourner, puis glisse-la : à droite si tu savais, à gauche pour la revoir.</p>
      <div class="deck"></div>
      <div class="card-actions">
        <button class="btn ko-btn" data-k="0">À revoir</button>
        <button class="btn ok-btn" data-k="1">Je savais</button>
      </div>
    </div>`;
  const deckEl = $('.deck', el);
  const actions = $('.card-actions', el);

  function show() {
    $('.progress i', el).style.width = `${(i / deck.length) * 100}%`;
    $('.count', el).textContent = `${i + 1} / ${deck.length}`;
    const w = deck[i];
    deckEl.innerHTML = `
      <div class="flip" tabindex="0" role="button" aria-label="Retourner la carte">
        <div class="face front">
          <div class="kr-xl">${esc(w.kr)}</div>
          ${roman ? `<div class="muted">${esc(romanize(w.kr))}</div>` : ''}
          <button class="icon-btn speak" aria-label="Écouter">${ICONS.sound}</button>
        </div>
        <div class="face back">
          <div class="fr-xl">${esc(w.fr)}</div>
          <div class="muted kr">${esc(w.kr)}</div>
        </div>
      </div>`;
    const card = $('.flip', deckEl);
    actions.classList.remove('show');
    setTimeout(() => autoSpeak(w.kr), 200);
    $('.speak', card).addEventListener('click', (e) => {
      e.stopPropagation();
      speak(w.kr);
    });
    const flip = () => {
      card.classList.toggle('flipped');
      actions.classList.add('show');
      sfx.tap();
    };
    card.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && flip());
    drag(card, flip, (right) => decide(right ? 1 : 0));
  }

  function decide(ok) {
    const card = $('.flip', deckEl);
    if (!card || card.dataset.gone) return;
    card.dataset.gone = '1';
    review(deck[i].id, !!ok);
    if (ok) {
      known++;
      sfx.ok();
    } else sfx.ko();
    haptic(8);
    card.classList.add(ok ? 'out-right' : 'out-left');
    setTimeout(() => {
      i++;
      if (i < deck.length) show();
      else finish();
    }, 280);
  }

  $$('.card-actions .btn', el).forEach((b) => b.addEventListener('click', () => decide(Number(b.dataset.k))));

  function finish() {
    const xp = known + 5;
    addXp(xp);
    if (known / deck.length >= 0.7) confetti();
    sfx.win();
    el.innerHTML = `
      <div class="result screen">
        <div class="big-emoji">🃏</div>
        <h2>${known} / ${deck.length} mots connus</h2>
        <p class="muted">Les mots « à revoir » reviendront plus souvent.</p>
        <div class="xp-won">+<span class="n">0</span> XP</div>
        <div class="stack">
          <button class="btn primary again">Nouvelle série</button>
          <a class="btn ghost" href="#/words">Terminer</a>
        </div>
      </div>`;
    countUp($('.xp-won .n', el), xp);
    $('.again', el).addEventListener('click', () => flashcards(el, theme));
  }

  show();
}

/** Glisser une carte : appel de onTap si elle a peu bougé, sinon onSwipe(droite ?) au-delà du seuil. */
function drag(card, onTap, onSwipe) {
  let x0 = 0;
  let y0 = 0;
  let dx = 0;
  let active = false;
  card.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.speak')) return;
    active = true;
    x0 = e.clientX;
    y0 = e.clientY;
    dx = 0;
    card.setPointerCapture(e.pointerId);
    card.style.transition = 'none';
  });
  card.addEventListener('pointermove', (e) => {
    if (!active) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 6 && card.classList.contains('flipped')) {
      card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg) rotateY(180deg)`;
      card.dataset.lean = dx > 40 ? 'right' : dx < -40 ? 'left' : '';
    }
  });
  const end = (e) => {
    if (!active) return;
    active = false;
    card.style.transition = '';
    card.style.transform = '';
    card.dataset.lean = '';
    const moved = Math.abs(dx) + Math.abs((e.clientY ?? y0) - y0);
    if (card.classList.contains('flipped') && Math.abs(dx) > 90) onSwipe(dx > 0);
    else if (moved < 8) onTap();
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
}

// ---------- Jeu des paires ----------
export function pairs(el) {
  const words = shuffle(WORDS.filter((w) => w.kr.length <= 5 && w.fr.length <= 22)).slice(0, 6);
  const tiles = shuffle(words.flatMap((w) => [
    { id: w.id, label: w.kr, kr: true },
    { id: w.id, label: w.fr, kr: false },
  ]));
  let sel = null;
  let found = 0;
  let errors = 0;
  let t0 = 0;
  let timer;

  el.innerHTML = `
    <div class="pairs screen">
      <div class="pairs-head">
        <span class="muted">Associe chaque mot coréen à sa traduction.</span>
        <span class="chrono">0,0 s</span>
      </div>
      <div class="pair-grid">
        ${tiles.map((t, k) => `<button class="tile ${t.kr ? 'kr' : ''}" style="--i:${k}" data-k="${k}">${esc(t.label)}</button>`).join('')}
      </div>
    </div>`;
  const chrono = $('.chrono', el);
  const fmt = (ms) => (ms / 1000).toFixed(1).replace('.', ',') + ' s';

  $$('.tile', el).forEach((b) => b.addEventListener('click', () => {
    const t = tiles[b.dataset.k];
    if (b.classList.contains('done') || b === sel) return;
    if (!t0) {
      t0 = performance.now();
      timer = setInterval(() => {
        if (!chrono.isConnected) return clearInterval(timer);
        chrono.textContent = fmt(performance.now() - t0);
      }, 100);
    }
    if (t.kr) autoSpeak(t.label);
    if (!sel) {
      sel = b;
      b.classList.add('sel');
      sfx.tap();
      return;
    }
    const s = tiles[sel.dataset.k];
    if (s.id === t.id && s.kr !== t.kr) {
      sel.classList.remove('sel');
      [sel, b].forEach((x) => x.classList.add('done'));
      burst(b, 8);
      sfx.ok();
      haptic(8);
      found++;
      sel = null;
      if (found === words.length) finish();
    } else {
      errors++;
      [sel, b].forEach((x) => pulse(x, 'shake'));
      sel.classList.remove('sel');
      sfx.ko();
      haptic([20, 30, 20]);
      sel = null;
    }
  }));

  function finish() {
    clearInterval(timer);
    const ms = performance.now() - t0;
    const st = get();
    const best = st.best.pairs;
    const record = !best || ms < best;
    if (record) {
      st.best.pairs = ms;
      save();
    }
    const xp = words.length + 3;
    addXp(xp);
    setTimeout(() => {
      sfx.win();
      confetti();
      el.innerHTML = `
        <div class="result screen">
          <div class="big-emoji">${record ? '🏆' : '✨'}</div>
          <h2>${fmt(ms)}${record ? ' · nouveau record !' : ''}</h2>
          <p class="muted">${errors ? `${errors} erreur${errors > 1 ? 's' : ''}` : 'Aucune erreur'}${best && !record ? ` · record : ${fmt(best)}` : ''}</p>
          <div class="xp-won">+<span class="n">0</span> XP</div>
          <div class="stack">
            <button class="btn primary again">Rejouer</button>
            <a class="btn ghost" href="#/words">Terminer</a>
          </div>
        </div>`;
      countUp($('.xp-won .n', el), xp);
      $('.again', el).addEventListener('click', () => pairs(el));
    }, 450);
  }
}

export { THEMES };

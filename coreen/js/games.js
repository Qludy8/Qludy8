// Cartes mémoire (avec glissement) et jeu des paires.
import { $, $$, esc, shuffle, sfx, haptic, speak, autoSpeak, confetti, countUp, pulse, burst, ICONS } from './ui.js';
import { addXp, review, pickForReview, get, save, markRoad, starsFor } from './store.js';
import { course, t, gloss } from './course.js';
import { wordsOf, sizeCls } from './quiz.js';

// ---------- Cartes mémoire ----------
export function flashcards(el, theme, step) {
  const C = course();
  const deck = pickForReview(wordsOf(theme), get().settings.quizLen || 10);
  const roman = get().settings.roman;
  let i = 0;
  let known = 0;

  el.innerHTML = `
    <div class="cards screen">
      <div class="qbar"><div class="progress"><i></i></div><span class="count"></span></div>
      <p class="hint muted">${t('cards.hint')}</p>
      <div class="deck"></div>
      <div class="card-actions">
        <button class="btn ko-btn" data-k="0">${t('cards.again')}</button>
        <button class="btn ok-btn" data-k="1">${t('cards.knew')}</button>
      </div>
    </div>`;
  const deckEl = $('.deck', el);
  const actions = $('.card-actions', el);

  function show() {
    $('.progress i', el).style.width = `${(i / deck.length) * 100}%`;
    $('.count', el).textContent = `${i + 1} / ${deck.length}`;
    const w = deck[i];
    const read = C.wordRead(w);
    deckEl.innerHTML = `
      <div class="flip" tabindex="0" role="button" aria-label="${t('cards.flip')}">
        <div class="face front">
          <div class="kr-xl ${sizeCls(w.tl)}">${esc(w.tl)}</div>
          ${read ? `<div class="kr">${esc(read)}</div>` : ''}
          ${roman ? `<div class="muted">${esc(C.wordRom(w))}</div>` : ''}
          <button class="icon-btn speak" aria-label="${t('listen')}">${ICONS.sound}</button>
        </div>
        <div class="face back">
          <div class="fr-xl">${esc(gloss(w))}</div>
          <div class="muted kr">${esc(w.tl)}</div>
        </div>
      </div>`;
    const card = $('.flip', deckEl);
    actions.classList.remove('show');
    setTimeout(() => autoSpeak(w.tl), 200);
    $('.speak', card).addEventListener('click', (e) => {
      e.stopPropagation();
      speak(w.tl);
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
    if (step) markRoad(step, starsFor(known / deck.length));
    if (known / deck.length >= 0.7) confetti();
    sfx.win();
    el.innerHTML = `
      <div class="result screen">
        <div class="big-glyph kr">${course().id === 'ja' ? 'できた！' : '끝!'}</div>
        <h2>${t('cards.result', { n: known, total: deck.length })}</h2>
        <p class="muted">${t('cards.resultHint')}</p>
        <div class="xp-won">+<span class="n">0</span> XP</div>
        <div class="stack">
          <button class="btn primary again">${t('cards.newSet')}</button>
          <a class="btn ghost" href="${step ? '#/road' : '#/words'}">${step ? t('road.back') : t('finish')}</a>
        </div>
      </div>`;
    countUp($('.xp-won .n', el), xp);
    $('.again', el).addEventListener('click', () => flashcards(el, theme, step));
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
export function pairs(el, step) {
  const words = shuffle(course().words.filter((w) => w.tl.length <= 5 && gloss(w).length <= 22)).slice(0, 6);
  const tiles = shuffle(words.flatMap((w) => [
    { id: w.id, label: w.tl, kr: true },
    { id: w.id, label: gloss(w), kr: false },
  ]));
  let sel = null;
  let found = 0;
  let errors = 0;
  let t0 = 0;
  let timer;

  el.innerHTML = `
    <div class="pairs screen">
      <div class="pairs-head">
        <span class="muted">${t('pairs.hint')}</span>
        <span class="chrono">0.0 s</span>
      </div>
      <div class="pair-grid">
        ${tiles.map((x, k) => `<button class="tile ${x.kr ? 'kr' : ''}" style="--i:${k}" data-k="${k}">${esc(x.label)}</button>`).join('')}
      </div>
    </div>`;
  const chrono = $('.chrono', el);
  const fmt = (ms) => (ms / 1000).toFixed(1).replace('.', t('decimal')) + ' s';
  chrono.textContent = fmt(0);

  $$('.tile', el).forEach((b) => b.addEventListener('click', () => {
    const x = tiles[b.dataset.k];
    if (b.classList.contains('done') || b === sel) return;
    if (!t0) {
      t0 = performance.now();
      timer = setInterval(() => {
        if (!chrono.isConnected) return clearInterval(timer);
        chrono.textContent = fmt(performance.now() - t0);
      }, 100);
    }
    if (x.kr) autoSpeak(x.label);
    if (!sel) {
      sel = b;
      b.classList.add('sel');
      sfx.tap();
      return;
    }
    const s = tiles[sel.dataset.k];
    if (s.id === x.id && s.kr !== x.kr) {
      sel.classList.remove('sel');
      [sel, b].forEach((y) => y.classList.add('done'));
      burst(b, 8);
      sfx.ok();
      haptic(8);
      found++;
      sel = null;
      if (found === words.length) finish();
    } else {
      errors++;
      [sel, b].forEach((y) => pulse(y, 'shake'));
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
          <div class="big-glyph kr">${course().id === 'ja' ? (record ? '最高！' : 'いいね！') : record ? '최고!' : '좋아요!'}</div>
          <h2>${fmt(ms)}${record ? ' · ' + t('pairs.record') : ''}</h2>
          <p class="muted">${errors ? t(errors > 1 ? 'pairs.errors' : 'pairs.error', { n: errors }) : t('pairs.noError')}${best && !record ? ` · ${t('pairs.best', { time: fmt(best) })}` : ''}</p>
          <div class="xp-won">+<span class="n">0</span> XP</div>
          <div class="stack">
            <button class="btn primary again">${t('playAgain')}</button>
            <a class="btn ghost" href="${step ? '#/road' : '#/words'}">${step ? t('road.back') : t('finish')}</a>
          </div>
        </div>`;
      countUp($('.xp-won .n', el), xp);
      $('.again', el).addEventListener('click', () => pairs(el, step));
    }, 450);
  }
}

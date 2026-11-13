// Écriture à la main : démonstration de l'ordre des traits et tracé au doigt, trait par trait.
import { $, esc, shuffle, sfx, speak, canSpeak, confetti, countUp, pulse, burst, reducedMotion, ICONS } from './ui.js';
import { addXp, get, save, markRoad, starsFor, bump } from './store.js';
import { course, t, tr } from './course.js';
import { HANGUL_STROKES } from './content/strokes.ko.js';
import { KANA_STROKES } from './content/strokes.ja.js';

const SIZE = 109;
let kanjiStrokes = null; // chargé à la demande (fichier volumineux)

/** Traits d'un signe (tableau de chemins SVG), ou null si on ne sait pas le tracer. */
export async function strokesOf(ch) {
  const d = HANGUL_STROKES[ch] || KANA_STROKES[ch];
  if (d) return d.split('|');
  if (/[一-龯]/.test(ch)) {
    kanjiStrokes ||= (await import('./content/strokes.kanji.js')).KANJI_STROKES;
    return kanjiStrokes[ch]?.split('|') || null;
  }
  return null;
}
/** Sait-on tracer ce signe sans rien charger ? (lettres du hangeul et kana) */
export const canTrace = (ch) => !!(HANGUL_STROKES[ch] || KANA_STROKES[ch]) || /^[一-龯]$/.test(ch);

const GRID = `<g class="pad-grid"><rect x="1.5" y="1.5" width="106" height="106" rx="10"/><path d="M54.5 4V105M4 54.5H105"/></g>`;

function draw(path, ms) {
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  if (reducedMotion()) return Promise.resolve();
  return path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: ms ?? Math.max(220, len * 7), easing: 'ease-in-out', fill: 'backwards' }).finished.catch(() => {});
}

/** Démonstration animée de l'ordre des traits (toucher pour rejouer). */
export async function strokeDemo(host, ch) {
  const strokes = await strokesOf(ch);
  if (!strokes || !host.isConnected) return;
  host.innerHTML = `
    <button class="stroke-demo" aria-label="${t('write.replay')}">
      <svg viewBox="0 0 ${SIZE} ${SIZE}">${GRID}
        <g class="pad-ghost">${strokes.map((d) => `<path d="${d}"/>`).join('')}</g>
        <g class="pad-ink">${strokes.map((d) => `<path d="${d}"/>`).join('')}</g>
        <g class="pad-nums">${strokes.map(() => '<text></text>').join('')}</g>
      </svg>
    </button>`;
  const paths = [...host.querySelectorAll('.pad-ink path')];
  const nums = [...host.querySelectorAll('.pad-nums text')];
  paths.forEach((p, k) => {
    const a = p.getPointAtLength(0);
    nums[k].setAttribute('x', Math.max(6, a.x - 5));
    nums[k].setAttribute('y', Math.max(9, a.y - 3));
    nums[k].textContent = k + 1;
  });
  let run = 0;
  async function play() {
    const me = ++run;
    paths.forEach((p) => { p.style.visibility = 'hidden'; });
    for (const p of paths) {
      if (me !== run || !host.isConnected) return;
      p.style.visibility = '';
      await draw(p);
      await new Promise((r) => setTimeout(r, 140));
    }
  }
  host.querySelector('.stroke-demo').addEventListener('click', play);
  play();
}

// ---------- Comparaison d'un trait dessiné avec le trait attendu ----------
const N = 20;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function resample(pts, n = N) {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += dist(pts[i], pts[i - 1]);
  if (!total) return { pts: Array.from({ length: n }, () => pts[0]), total: 0 };
  const out = [pts[0]];
  const step = total / (n - 1);
  let acc = 0;
  let i = 1;
  let prev = pts[0];
  while (out.length < n - 1 && i < pts.length) {
    const d = dist(pts[i], prev);
    if (acc + d >= step && d > 0) {
      const k = (step - acc) / d;
      prev = { x: prev.x + (pts[i].x - prev.x) * k, y: prev.y + (pts[i].y - prev.y) * k };
      out.push(prev);
      acc = 0;
    } else {
      acc += d;
      prev = pts[i];
      i++;
    }
  }
  while (out.length < n) out.push(pts.at(-1));
  return { pts: out, total };
}
function sample(path, n = N) {
  const len = path.getTotalLength();
  return { pts: Array.from({ length: n }, (_, k) => { const p = path.getPointAtLength((len * k) / (n - 1)); return { x: p.x, y: p.y }; }), total: len };
}
/** Le tracé suit-il le modèle ? (départ, arrivée, écart moyen et longueur) */
function matches(user, model, tol = 1) {
  if (user.total < Math.min(5, model.total * 0.35) || user.total < model.total * 0.35 || user.total > model.total * 2.4 + 12) return false;
  if (dist(user.pts[0], model.pts[0]) > 22 * tol || dist(user.pts.at(-1), model.pts.at(-1)) > 25 * tol) return false;
  let sum = 0;
  for (let i = 0; i < N; i++) sum += dist(user.pts[i], model.pts[i]);
  return sum / N <= 15 * tol;
}

/**
 * Zone de tracé d'un signe.
 * guide : le modèle reste visible ; sinon on écrit de mémoire (le modèle n'apparaît qu'après deux erreurs).
 * onDone(erreurs)
 */
export function writePad(host, strokes, { guide, onDone }) {
  host.innerHTML = `
    <div class="pad ${guide ? 'guided' : 'memory'}">
      <svg viewBox="0 0 ${SIZE} ${SIZE}">${GRID}
        <g class="pad-ghost">${strokes.map((d) => `<path d="${d}"/>`).join('')}</g>
        <g class="pad-ink"></g>
        <path class="pad-hint" d=""/>
        <g class="pad-start" style="display:none"><circle r="5.5"/><text dy="2.6"></text></g>
        <polyline class="pad-live" points=""/>
      </svg>
      <p class="pad-msg muted small" aria-live="polite"></p>
    </div>`;
  const svg = $('svg', host);
  const ghost = [...host.querySelectorAll('.pad-ghost path')];
  const models = ghost.map((p) => sample(p));
  const ink = $('.pad-ink', host);
  const hint = $('.pad-hint', host);
  const start = $('.pad-start', host);
  const live = $('.pad-live', host);
  const msg = $('.pad-msg', host);
  let k = 0; // trait attendu
  let errors = 0;
  let misses = 0; // erreurs sur le trait en cours
  let pts = null;
  let hintRun = 0;

  function showHint(force) {
    const on = guide || force;
    hint.setAttribute('d', on ? strokes[k] : '');
    start.style.display = on ? '' : 'none';
    if (!on) return;
    const a = models[k].pts[0];
    start.setAttribute('transform', `translate(${a.x} ${a.y})`);
    $('text', start).textContent = k + 1;
    // Le trait se dessine en boucle pour montrer le sens.
    const me = ++hintRun;
    (async function loop() {
      while (me === hintRun && hint.isConnected && !reducedMotion()) {
        await draw(hint, Math.max(500, models[k]?.total * 11 || 500));
        await new Promise((r) => setTimeout(r, 500));
      }
    })();
  }
  function next() {
    misses = 0;
    hintRun++;
    if (k >= strokes.length) {
      hint.setAttribute('d', '');
      start.style.display = 'none';
      host.querySelector('.pad').classList.add('done');
      msg.textContent = '';
      return onDone(errors);
    }
    showHint(false);
  }

  const point = (e) => {
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  };
  svg.addEventListener('pointerdown', (e) => {
    if (k >= strokes.length) return;
    e.preventDefault();
    svg.setPointerCapture(e.pointerId);
    pts = [point(e)];
    live.setAttribute('points', '');
  });
  svg.addEventListener('pointermove', (e) => {
    if (!pts) return;
    const p = point(e);
    if (dist(p, pts.at(-1)) < 0.8) return;
    pts.push(p);
    live.setAttribute('points', pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' '));
  });
  const end = () => {
    if (!pts) return;
    const user = resample(pts);
    pts = null;
    live.setAttribute('points', '');
    if (user.total < 2 && models[k].total > 8) return; // simple toucher
    const tol = guide ? 1 : 1.12;
    if (matches(user, models[k], tol)) {
      ink.insertAdjacentHTML('beforeend', `<path d="${strokes[k]}"/>`);
      draw(ink.lastElementChild, 160);
      sfx.tap();
      msg.textContent = '';
      k++;
      return next();
    }
    errors++;
    misses++;
    sfx.ko();
    pulse(svg, 'shake');
    const reversed = { pts: [...user.pts].reverse(), total: user.total };
    if (matches(reversed, models[k], tol)) msg.textContent = t('write.reverse');
    else if (models.some((m, i) => i > k && matches(user, m, tol))) msg.textContent = t('write.order');
    else msg.textContent = t('write.miss');
    if (misses >= 2) showHint(true);
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  next();
  return {
    /** Montre le trait attendu (compte comme une erreur). */
    reveal() {
      if (k >= strokes.length) return;
      errors++;
      showHint(true);
    },
  };
}

// ---------- Séance d'écriture ----------
/** Signes d'un jeu de lettres à tracer. form : hira | kata (kana), sinon la lettre telle quelle. */
export function writeChars(setId, form) {
  const set = course().script.sets[setId];
  if (!set) return [];
  return set.items.filter((x) => [...x.j].length === 1).map((x) => ({ ...x, ch: form === 'kata' && x.j2 ? x.j2 : x.j })).filter((x) => canTrace(x.ch));
}

/**
 * Écran d'écriture : chaque signe est tracé deux fois, d'abord sur le modèle, puis de mémoire.
 * q : { set, form, ch (un seul signe), step }
 */
export async function writeScreen(el, q) {
  const C = course();
  const st = get();
  st.wr ||= {};
  const all = writeChars(q.set, q.form);
  let list;
  if (q.ch) list = all.filter((x) => x.ch === q.ch);
  // Les signes les moins tracés d'abord, pour faire le tour du jeu au fil des séances.
  else list = shuffle(all).sort((a, b) => (st.wr[a.ch] || 0) - (st.wr[b.ch] || 0)).slice(0, Math.min(st.settings.quizLen || 10, 8));
  const back = q.step ? '#/road' : '#/hangul';
  if (!list.length) {
    el.innerHTML = `<div class="screen result"><p class="muted">${t('quiz.empty')}</p><a class="btn primary" href="${back}">${t('back')}</a></div>`;
    return;
  }
  const data = await Promise.all(list.map((x) => strokesOf(x.ch)));
  if (!el.isConnected) return;
  let i = 0;
  let phase = 0; // 0 : sur le modèle ; 1 : de mémoire
  let errors = 0;
  let total = 0;

  el.innerHTML = `
    <div class="write screen">
      <div class="qbar"><div class="progress"><i></i></div><span class="count"></span></div>
      <div class="write-head"></div>
      <div class="pad-host"></div>
      <div class="write-actions">
        <button class="btn ghost small show-btn">${t('write.show')}</button>
        <button class="btn ghost small skip-btn">${t('write.skip')}</button>
      </div>
    </div>`;
  let pad;

  function show() {
    const x = list[i];
    const strokes = data[i];
    $('.progress i', el).style.width = `${((i * 2 + phase) / (list.length * 2)) * 100}%`;
    $('.count', el).textContent = `${i + 1} / ${list.length}`;
    const label = x.mean ? tr(x.mean) : x.r || t('quiz.silent');
    $('.write-head', el).innerHTML = `
      <div class="write-char">
        <span class="kr wc-big ${phase ? 'hide' : ''}">${x.ch}</span>
        <div><span><b>${esc(label)}</b>${x.name ? ` <span class="muted kr">· ${x.name}</span>` : ''}</span>
          <span class="muted small">${t(phase ? 'write.memory' : 'write.guided')} · ${t(strokes.length > 1 ? 'write.strokes' : 'write.stroke', { n: strokes.length })}</span></div>
        ${canSpeak() ? `<button class="icon-btn say-btn" aria-label="${t('listen')}">${ICONS.sound}</button>` : ''}
      </div>`;
    $('.say-btn', el)?.addEventListener('click', () => speak(x.say));
    if (!phase) setTimeout(() => el.isConnected && get().settings.autoplay && speak(x.say), 200);
    total += strokes.length;
    pad = writePad($('.pad-host', el), strokes, {
      guide: !phase,
      onDone(n) {
        errors += n;
        sfx.ok();
        burst($('.pad svg', el), 10);
        if (phase) {
          st.wr[x.ch] = (st.wr[x.ch] || 0) + 1;
          save();
          bump('traced');
        }
        setTimeout(() => {
          if (!el.isConnected) return;
          if (!phase) phase = 1;
          else { phase = 0; i++; }
          if (i < list.length) show();
          else finish();
        }, 650);
      },
    });
  }
  $('.show-btn', el).addEventListener('click', () => pad?.reveal());
  $('.skip-btn', el).addEventListener('click', () => {
    errors += data[i].length;
    phase = 0;
    i++;
    if (i < list.length) show();
    else finish();
  });

  function finish() {
    const ratio = Math.max(0, 1 - errors / Math.max(1, total));
    const xp = 5 + list.length * 2 + (ratio >= 0.9 ? 3 : 0);
    addXp(xp);
    if (q.step) markRoad(q.step, starsFor(ratio));
    if (!errors && list.length >= 5) bump('perfect');
    sfx.win();
    if (ratio >= 0.7) confetti();
    el.innerHTML = `
      <div class="result screen">
        <div class="big-glyph kr">${list.slice(0, 5).map((x) => x.ch).join(' ')}</div>
        <h2>${errors ? t(errors > 1 ? 'write.resultN' : 'write.result1', { n: errors }) : t('write.clean')}</h2>
        <p class="muted">${t('write.resultHint')}</p>
        <div class="xp-won">+<span class="n">0</span> XP</div>
        <div class="stack">
          <button class="btn primary again">${t('write.more')}</button>
          <a class="btn ghost" href="${back}">${q.step ? t('road.back') : t('finish')}</a>
        </div>
      </div>`;
    countUp($('.xp-won .n', el), xp);
    $('.again', el).addEventListener('click', () => writeScreen(el, q));
  }

  show();
}

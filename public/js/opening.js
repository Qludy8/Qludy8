// Séquence d'ouverture de booster : déchirure, pile de cartes, suspense pour les raretés, révélation, résumé.
import { RARITIES, ECONOMY } from '/shared/config.js';
import { SKIN_BY_ID, MODEL_BY_KEY } from '/shared/catalog.js';
import { wearOf, fmtFloat } from '/shared/rules.js';
import { cardHTML, cardBack } from './art/card.js';
import { packSVG } from './art/pack.js';
import { Particles, sound, haptic } from './fx.js';
import { esc, cr, toast, $, reducedMotion } from './ui.js';
import { post, store } from './api.js';
import { t, L } from '/shared/i18n.js';

const left = (n) => (n > 1 ? t('Cliquez sur la carte · {n} restantes', { n }) : t('Cliquez sur la carte · {n} restante', { n }));
const sleep = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? Math.min(ms, 60) : ms));
export const cardOf = (c, opts = {}) => cardHTML(SKIN_BY_ID.get(c.s), c, { ...opts, misprintSkin: c.mp ? SKIN_BY_ID.get(c.mp) : null });

const CHARGE_MS = 420;   // identique pour toutes les raretés

export function openSequence(pack, result, { onAgain } = {}) {
  const cards = result.packs.flatMap((p) => p.cards);
  // la carte la plus rare est révélée en dernier (suspense), les erreurs encore après
  const order = [...cards].sort((a, b) => (a.mp ? 99 : a.r) - (b.mp ? 99 : b.r) || a.value - b.value);
  const el = document.createElement('div');
  el.className = 'opening';
  el.style.setProperty('--glow', pack.theme[0]);
  el.innerHTML = `
    <canvas class="fx"></canvas>
    <div class="flash-screen"></div><div class="shockwave"></div><div class="rarity-burst"></div>
    <div class="controls">
      <button class="btn sm ghost" data-sound title="${t('Son')}">${sound.on ? '🔊' : '🔇'}</button>
      <button class="btn sm" data-all>${t('Tout révéler')}</button>
      <button class="btn sm ghost" data-close aria-label="${t('Fermer')}">✕</button>
    </div>
    <div class="stage">
      <div class="pack-big">${packSVG(pack)}<div class="tear-hint">${t('CLIQUEZ OU GLISSEZ POUR DÉCHIRER')}</div></div>
      ${order.map((c, i) => `<div class="stack-card" data-i="${i}" style="--rg:${RARITIES[c.r].glow};z-index:${order.length - i};opacity:0;transform:translateY(30%) scale(.85)">
        <div class="flip"><div class="face back"></div><div class="face front"></div></div>
      </div>`).join('')}
      <div class="reveal-info"></div>
      <div class="stack-hint"></div>
    </div>
    <div class="tray"></div>
    <div class="summary"></div>`;
  document.body.append(el);
  document.body.style.overflow = 'hidden';
  const fx = new Particles(el.querySelector('canvas.fx'));
  // particules qui remontent du bas de l'écran, à la couleur courante de la scène
  fx.ambient(() => el.style.getPropertyValue('--glow') || pack.theme[0], 0.12);
  const stage = $('.stage', el), packEl = $('.pack-big', el), info = $('.reveal-info', el), hint = $('.stack-hint', el);
  const stack = [...el.querySelectorAll('.stack-card')];
  let idx = 0, busy = false, torn = false, closed = false;
  const fitGridRef = { fn: () => {} };

  // rendu paresseux : seules les cartes proches du sommet de la pile existent dans le DOM
  // (une ouverture ×10 = 50 cartes, chacune avec ses filtres d'usure → trop lourd en une fois)
  const BACKS = 7, FRONTS = 2;
  const stackPos = (s, i) => {
    const depth = Math.min(i - idx, 6);
    s.style.opacity = 1;
    s.style.transform = `translate(${depth * 3}px, ${-depth * 3}px) rotate(${(i % 2 ? 1 : -1) * Math.min(depth, 3) * 0.25}deg)`;
  };
  function prep() {
    for (let i = idx; i < Math.min(stack.length, idx + BACKS); i++) {
      const s = stack[i], back = s.querySelector('.face.back');
      if (!back.firstChild) { back.innerHTML = `<div class="liseret"></div>${cardBack()}`; s.hidden = false; if (torn) stackPos(s, i); }
      const front = s.querySelector('.face.front');
      if (i < idx + FRONTS && !front.firstChild) front.innerHTML = cardOf(order[i]);
    }
  }
  stack.forEach((s, i) => { s.hidden = i >= BACKS; });
  prep();

  const center = () => { const r = stage.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const close = () => {
    if (closed) return; closed = true;
    fx.destroy(); el.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); removeEventListener('resize', fitGridRef.fn);
    store.refresh();
  };

  // ── Déchirure : clic, ou glisser horizontalement sur le haut du pack
  let sx = null;
  packEl.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  packEl.addEventListener('pointermove', (e) => { if (sx != null && Math.abs(e.clientX - sx) > 90) tear(); });
  packEl.addEventListener('click', () => tear());

  async function tear() {
    if (torn) return; torn = true;
    sound.play('tear'); haptic(30);
    packEl.classList.add('torn');
    const [x, y] = center();
    fx.burst(x, y - stage.offsetHeight * 0.45, ['#fff', pack.theme[1]], 22, { speed: 6, size: 2.5 });
    // lueur rapide de la couleur de la carte la plus rare du booster
    const best = order.reduce((a, b) => (b.r > a.r ? b : a), order[0]);
    const bc = best.mp ? '#ff2b6a' : RARITIES[best.r].glow;
    const fl = el.querySelector('.flash-screen');
    fl.style.background = `radial-gradient(circle at 50% 45%, ${bc}, transparent 70%)`;
    fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    el.style.setProperty('--glow', bc);
    setTimeout(() => el.style.setProperty('--glow', pack.theme[0]), 700);
    await sleep(450);
    packEl.classList.add('gone');
    const shown = stack.filter((s) => !s.hidden);
    shown.forEach((s, i) => setTimeout(() => stackPos(s, i), 120 + (shown.length - i) * 40));
    await sleep(500 + shown.length * 40);
    stack[0]?.classList.add('is-top');
    hint.textContent = left(stack.length);
  }

  async function next() {
    if (!torn) return tear();
    if (busy || idx >= stack.length) return;
    busy = true;
    const s = stack[idx], c = order[idx];
    if (!s.classList.contains('flipped')) {
      await reveal(s, c);
    } else {
      // carte déjà révélée → elle file dans le plateau
      s.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1), opacity .45s';
      s.style.transform = `translate(${innerWidth * 0.7}px, ${innerHeight * 0.25}px) rotate(24deg) scale(.6)`;
      s.style.opacity = 0;
      setTimeout(() => { s.style.display = 'none'; }, 600);
      info.innerHTML = '';
      const mini = document.createElement('div');
      mini.className = 'mini'; mini.innerHTML = cardOf(c, { small: true, noSlab: true, lite: true });
      const tray = $('.tray', el); tray.append(mini);
      if (tray.children.length > 12) tray.firstElementChild.remove();
      idx++;
      prep();
      stack[idx]?.classList.add('is-top');
      hint.textContent = idx < stack.length ? left(stack.length - idx) : '';
      await sleep(260);
      if (idx >= stack.length) summary();
    }
    busy = false;
  }

  async function reveal(s, c, quick = false) {
    const R = RARITIES[c.r];
    const special = c.mp || c.r >= 3;
    hint.textContent = '';
    if (!quick) {
      // même temps pour toutes les cartes : une courte charge (la lueur prend la couleur de la rareté), puis le retournement
      const [x, y] = center();
      s.classList.add('charging'); if (c.r >= 5 || c.mp) s.classList.add('lvl2');
      el.style.setProperty('--glow', c.mp ? '#ff2b6a' : R.glow);
      if (c.r >= 4 || c.mp) fx.swirl(x, y, c.mp ? ['#ff2b6a', '#fff'] : [R.color, R.glow, '#fff'], 18 + (c.r - 4) * 10, { radius: stage.offsetWidth * 0.95, life: CHARGE_MS / 16 });
      sound.play('charge', c.mp ? 6 : c.r); haptic(c.r >= 4 ? [20, 30, 20] : 15);
      await sleep(CHARGE_MS);
      s.classList.remove('charging', 'lvl2');
    }
    s.classList.add('flipped', 'revealed');
    // la lueur de fond prend (et garde) la couleur de la dernière carte révélée
    el.style.setProperty('--glow', c.mp ? '#ff2b6a' : R.glow);
    sound.play('flip', c.mp ? 6 : c.r);
    if (quick) return;
    const [x, y] = center();
    if (special) {
      haptic(c.r >= 5 ? [60, 40, 120] : 50);
      const burst = $('.rarity-burst', el);
      burst.style.setProperty('--rg', c.mp ? '#ff2b6a' : R.glow);
      burst.textContent = c.mp ? t('CARTE ERREUR !') : t('{r} !', { r: L(R).toUpperCase() });
      burst.classList.remove('go'); void burst.offsetWidth; burst.classList.add('go');
      const wave = $('.shockwave', el);
      wave.style.setProperty('--rg', R.glow); wave.classList.remove('go'); void wave.offsetWidth; wave.classList.add('go');
      fx.burst(x, y, [R.color, R.glow, '#fff'], 16 + c.r * 8, { speed: 6 + c.r, size: 3 });
      if (c.r >= 4 || c.mp) fx.stars(x, y, c.r === 6 || c.mp ? ['#5ff3ff', '#ff7ae6', '#ffe46b', '#fff'] : [R.color, '#fff'], 8 + (c.r - 4) * 5, { speed: 7 + c.r });
      if (c.r >= 4 || c.mp) { const f = $('.flash-screen', el); f.style.background = '#fff'; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
      if (c.r >= 5 || c.mp) {
        el.classList.remove('quake'); void el.offsetWidth; el.classList.add('quake');
        fx.rain(c.r === 6 || c.mp ? ['#5ff3ff', '#ff7ae6', '#ffe46b', '#fff'] : ['#ffd76a', '#ffb020', '#fff'], 60);
      }
    } else {
      fx.burst(x, y, R.color, 6, { speed: 4, size: 2 });
    }
    const skin = SKIN_BY_ID.get(c.s);
    const w = wearOf(c.f);
    info.innerHTML = `<div class="big" style="color:${R.color}">${esc(MODEL_BY_KEY[skin.m].name)} | ${esc(L(skin, 'n'))}</div>
      <div class="muted small">${esc(L(R))} · ${w.key} ${fmtFloat(c.f)}${c.tr != null ? ` · ${t('Traqueur')}` : ''}</div>
      <div style="margin-top:6px">${c.isNew ? `<span class="pill tag-new">${t('NOUVEAU')}</span> ` : ''}<span class="pill">${cr(c.value)}</span></div>`;
  }

  async function revealAll() {
    if (!torn) { torn = true; packEl.classList.add('gone'); }
    const best = order.reduce((a, b) => (b.r > a.r || (b.mp && !a.mp) ? b : a), order[0]);
    if (best.r >= 4 || best.mp) {
      const R = RARITIES[best.r];
      const [x, y] = center();
      fx.burst(x, y, [R.color, '#fff'], 50, { speed: 10 });
      sound.play('rare', best.r);
    }
    idx = stack.length;
    summary();
  }

  const EAGER = 10;
  function summary() {
    el.classList.add('done');
    const total = cards.reduce((a, c) => a + c.value, 0);
    const lows = cards.filter((c) => c.r <= 1 && !c.mp && c.g == null);
    const lowGain = lows.reduce((a, c) => a + Math.max(1, Math.floor(c.value * ECONOMY.sellToSystemRate)), 0);
    const sum = $('.summary', el);
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    sum.innerHTML = `
      <div class="summary-head">
        <div><div class="muted small">${result.packs.length} × ${esc(L(pack))}${result.welcomeUsed ? ` ${result.welcomeUsed > 1 ? t('({n} offerts)', { n: result.welcomeUsed }) : t('({n} offert)', { n: result.welcomeUsed })}` : ''}</div>
          <div class="total">${t('Valeur totale :')} ${cr(total)}</div>
          ${result.packs.some((p) => p.pityTriggered != null) ? `<div class="pill" style="margin-top:6px">✨ ${t('Garantie déclenchée')}</div>` : ''}</div>
        <div class="row">
          ${lows.length ? `<button class="btn" data-sell-low>${lows.length > 1 ? t('Vendre {n} communes', { n: lows.length }) : t('Vendre {n} commune', { n: lows.length })} · +${cr(lowGain)}</button>` : ''}
          <button class="btn ghost" data-close2>${t('Tout garder')}</button>
          ${onAgain ? `<button class="btn primary" data-again>${t('Rouvrir')} ${pack.free ? '' : `· ${pack.price} <i class="mu" aria-label="Mu">무</i>`}</button>` : ''}
        </div>
      </div>
      <div class="summary-grid">${sorted.map((c, i) => `<div class="tile" style="--i:${Math.min(i, 12)}">${i < EAGER ? cardOf(c) : `<div class="card-ph" data-ph="${i}"></div>`}
        <div class="meta">${c.isNew ? `<span class="pill tag-new">${t('NOUVEAU')}</span>` : ''}<b>${cr(c.value)}</b></div></div>`).join('')}</div>`;
    // les cartes suivantes sont dessinées quand elles approchent de l'écran
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.outerHTML = cardOf(sorted[Number(e.target.dataset.ph)]);
    }), { root: sum, rootMargin: '400px 0px' });
    sum.querySelectorAll('[data-ph]').forEach((x) => io.observe(x));
    // taille des cartes calculée pour que tout le résumé tienne à l'écran (mobile compris)
    const gridEl = sum.querySelector('.summary-grid');
    const fitGrid = () => {
      const head = sum.querySelector('.summary-head');
      const cs = getComputedStyle(sum);
      const W = sum.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const H = sum.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - head.offsetHeight - 20;
      const n = sorted.length, gap = innerWidth < 600 ? 8 : 14, meta = innerWidth < 600 ? 22 : 30;
      let best = 0, cols = 1;
      for (let c = 1; c <= n; c++) {
        const w = Math.min(230, (W - (c - 1) * gap) / c), rows = Math.ceil(n / c);
        if (rows * (w * 88 / 63 + meta) + (rows - 1) * gap <= H && w > best) { best = w; cols = c; }
      }
      if (!best) { cols = Math.max(1, Math.floor((W + gap) / (64 + gap))); best = (W - (cols - 1) * gap) / cols; }
      gridEl.style.gridTemplateColumns = `repeat(${cols}, ${Math.floor(best)}px)`;
      gridEl.style.gap = `${gap}px`;
      gridEl.classList.toggle('compact', best < 120);
    };
    fitGrid();
    fitGridRef.fn = fitGrid;
    addEventListener('resize', fitGrid);
    // inspection : clic sur une carte du résumé → la carte s'agrandit en tournant, inclinable à la souris
    gridEl.addEventListener('click', (e) => {
      const tile = e.target.closest('.tile'); if (!tile) return;
      const c = sorted[[...gridEl.children].indexOf(tile)]; if (!c) return;
      const R = RARITIES[c.r], skin = SKIN_BY_ID.get(c.s), w = wearOf(c.f);
      const r0 = tile.getBoundingClientRect();
      const z = document.createElement('div');
      z.className = 'zoom-inspect';
      z.innerHTML = `<div class="zoom-card" style="--fx:${r0.left + r0.width / 2 - innerWidth / 2}px;--fy:${r0.top + r0.height / 2 - innerHeight / 2}px;--fs:${(r0.width / Math.min(380, innerWidth * 0.8)).toFixed(3)}">${cardOf(c)}</div>
        <div class="zoom-info"><div class="big" style="color:${R.color}">${esc(MODEL_BY_KEY[skin.m].name)} | ${esc(L(skin, 'n'))}</div>
          <div class="muted small">${esc(L(R))} · ${w.key} ${fmtFloat(c.f)}${c.tr != null ? ` · ${t('Traqueur')}` : ''}</div>
          <div style="margin-top:6px">${c.isNew ? `<span class="pill tag-new">${t('NOUVEAU')}</span> ` : ''}<span class="pill">${cr(c.value)}</span></div>
          <div class="muted small" style="margin-top:10px">${t('Cliquez n’importe où pour fermer')}</div></div>`;
      el.append(z);
      sound.play('flip', 0);
      const shut = () => { z.classList.add('out'); setTimeout(() => z.remove(), 300); };
      z.addEventListener('click', (ev) => { if (!ev.target.closest('.zoom-card')) shut(); });
      z.querySelector('.zoom-card').addEventListener('dblclick', shut);
    });
    sum.querySelector('[data-close2]').onclick = close;
    sum.querySelector('[data-again]')?.addEventListener('click', () => { close(); onAgain(); });
    sum.querySelector('[data-sell-low]')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      try {
        const r = await post('/cards/sell', { ids: lows.map((c) => c.id) });
        sound.play('coin'); toast(`+${cr(r.total)} ${t('crédités')}`, 'good');
        e.target.remove(); store.refresh();
      } catch (err) { toast(esc(err.message), 'error'); e.target.disabled = false; }
    });
  }

  const onKey = (e) => {
    const z = el.querySelector('.zoom-inspect:not(.out)');
    if (e.key === 'Escape' && z) { z.click(); return; }
    if (e.key === 'Escape') close();
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!el.classList.contains('done')) next(); }
  };
  document.addEventListener('keydown', onKey);
  stage.addEventListener('click', (e) => { if (e.target.closest('.stack-card')) next(); });
  el.querySelector('[data-close]').onclick = close;
  el.querySelector('[data-all]').onclick = (e) => { e.target.remove(); revealAll(); };
  el.querySelector('[data-sound]').onclick = (e) => { sound.on = !sound.on; e.target.textContent = sound.on ? '🔊' : '🔇'; };
}

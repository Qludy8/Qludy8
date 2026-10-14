// Séquence d'ouverture de booster : déchirure, pile de cartes, suspense pour les raretés, révélation, résumé.
import { RARITIES, ECONOMY } from '/shared/config.js';
import { SKIN_BY_ID, MODEL_BY_KEY } from '/shared/catalog.js';
import { wearOf, fmtFloat } from '/shared/rules.js';
import { cardHTML, cardBack } from './art/card.js';
import { packSVG } from './art/pack.js';
import { Particles, sound, haptic } from './fx.js';
import { esc, cr, toast, $, reducedMotion } from './ui.js';
import { post, store } from './api.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? Math.min(ms, 60) : ms));
export const cardOf = (c, opts = {}) => cardHTML(SKIN_BY_ID.get(c.s), c, { ...opts, misprintSkin: c.mp ? SKIN_BY_ID.get(c.mp) : null });

export function openSequence(pack, result, { onAgain } = {}) {
  const cards = result.packs.flatMap((p) => p.cards);
  // la carte la plus rare est révélée en dernier (suspense), les erreurs encore après
  const order = [...cards].sort((a, b) => (a.mp ? 99 : a.r) - (b.mp ? 99 : b.r) || a.value - b.value);
  const el = document.createElement('div');
  el.className = 'opening';
  el.style.setProperty('--glow', pack.theme[0]);
  el.innerHTML = `
    <div class="rays"></div><canvas class="fx"></canvas>
    <div class="flash-screen"></div><div class="shockwave"></div><div class="rarity-burst"></div>
    <div class="controls">
      <button class="btn sm ghost" data-sound title="Son">${sound.on ? '🔊' : '🔇'}</button>
      <button class="btn sm" data-all>Tout révéler</button>
      <button class="btn sm ghost" data-close aria-label="Fermer">✕</button>
    </div>
    <div class="stage">
      <div class="pack-big">${packSVG(pack)}<div class="tear-hint">CLIQUEZ OU GLISSEZ POUR DÉCHIRER</div></div>
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
  const stage = $('.stage', el), packEl = $('.pack-big', el), info = $('.reveal-info', el), hint = $('.stack-hint', el);
  const stack = [...el.querySelectorAll('.stack-card')];
  let idx = 0, busy = false, torn = false, closed = false;

  // rendu paresseux : seules les cartes proches du sommet de la pile existent dans le DOM
  // (une ouverture ×10 = 50 cartes, chacune avec ses filtres d'usure → trop lourd en une fois)
  const BACKS = 7, FRONTS = 2;
  const stackPos = (s, i) => {
    const depth = Math.min(i - idx, 6);
    s.style.opacity = 1;
    s.style.transform = `translate(${depth * 4}px, ${-depth * 4}px) rotate(${(i % 2 ? 1 : -1) * depth * 0.8}deg)`;
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
    fx.destroy(); el.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey);
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
    fx.burst(x, y - stage.offsetHeight * 0.45, ['#fff', pack.theme[1]], 50, { speed: 6, size: 2.5 });
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
    stack[0]?.classList.add('top');
    hint.textContent = `Cliquez sur la carte · ${stack.length} restante${stack.length > 1 ? 's' : ''}`;
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
      el.classList.remove('rays-on');
      stack[idx]?.classList.add('top');
      hint.textContent = idx < stack.length ? `Cliquez sur la carte · ${stack.length - idx} restante${stack.length - idx > 1 ? 's' : ''}` : '';
      await sleep(260);
      if (idx >= stack.length) summary();
    }
    busy = false;
  }

  async function reveal(s, c, quick = false) {
    const R = RARITIES[c.r];
    const special = c.mp || c.r >= 3;
    hint.textContent = '';
    if (special && !quick) {
      // suspense : le dos pulse à la couleur de la rareté avant de se retourner
      s.classList.add('charging'); if (c.r >= 5 || c.mp) s.classList.add('lvl2');
      if (c.r >= 4 || c.mp) { s.classList.add('shake'); el.classList.add('rays-on'); }
      el.style.setProperty('--glow', R.glow);
      sound.play('charge', c.mp ? 6 : c.r); haptic([20, 40, 20]);
      await sleep(c.mp ? 2200 : c.r >= 5 ? 2000 : c.r === 4 ? 1500 : 900);
      s.classList.remove('charging', 'lvl2', 'shake');
    }
    s.classList.add('flipped', 'revealed');
    // la lueur de fond prend (et garde) la couleur de la dernière carte révélée
    el.style.setProperty('--glow', c.mp ? '#ff2b6a' : R.glow);
    sound.play('flip', c.r);
    if (quick) return;
    const [x, y] = center();
    if (special) {
      sound.play('rare', c.r); haptic(c.r >= 5 ? [60, 40, 120] : 50);
      const burst = $('.rarity-burst', el);
      burst.style.setProperty('--rg', c.mp ? '#ff2b6a' : R.glow);
      burst.textContent = c.mp ? 'CARTE ERREUR !' : `${R.fr.toUpperCase()} !`;
      burst.classList.remove('go'); void burst.offsetWidth; burst.classList.add('go');
      const wave = $('.shockwave', el);
      wave.style.setProperty('--rg', R.glow); wave.classList.remove('go'); void wave.offsetWidth; wave.classList.add('go');
      fx.burst(x, y, [R.color, R.glow, '#fff'], 40 + c.r * 25, { speed: 6 + c.r, size: 3 });
      if (c.r >= 4 || c.mp) { const f = $('.flash-screen', el); f.style.background = '#fff'; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
      if (c.r >= 5 || c.mp) {
        el.classList.remove('quake'); void el.offsetWidth; el.classList.add('quake');
        fx.rain(c.r === 6 || c.mp ? ['#5ff3ff', '#ff7ae6', '#ffe46b', '#fff'] : ['#ffd76a', '#ffb020', '#fff'], 140);
      }
    } else {
      fx.burst(x, y, R.color, 14, { speed: 4, size: 2 });
      if (c.r === 2) sound.play('rare', 2);
    }
    const skin = SKIN_BY_ID.get(c.s);
    const w = wearOf(c.f);
    info.innerHTML = `<div class="big" style="color:${R.color}">${esc(MODEL_BY_KEY[skin.m].name)} | ${esc(skin.n)}</div>
      <div class="muted small">${esc(R.fr)} · ${w.key} ${fmtFloat(c.f)}${c.foil ? ' · Holo' : ''}${c.tr != null ? ' · Traqueur' : ''}</div>
      <div style="margin-top:6px">${c.isNew ? '<span class="pill tag-new">NOUVEAU</span> ' : ''}<span class="pill">${cr(c.value)}</span></div>`;
  }

  async function revealAll() {
    if (!torn) { torn = true; packEl.classList.add('gone'); }
    const best = order.reduce((a, b) => (b.r > a.r || (b.mp && !a.mp) ? b : a), order[0]);
    if (best.r >= 4 || best.mp) {
      const R = RARITIES[best.r];
      const [x, y] = center();
      fx.burst(x, y, [R.color, '#fff'], 120, { speed: 10 });
      sound.play('rare', best.r);
    }
    idx = stack.length;
    summary();
  }

  const EAGER = 10;
  function summary() {
    el.classList.add('done');
    el.classList.remove('rays-on');
    const total = cards.reduce((a, c) => a + c.value, 0);
    const lows = cards.filter((c) => c.r <= 1 && !c.mp && !c.foil && c.g == null);
    const lowGain = lows.reduce((a, c) => a + Math.max(1, Math.floor(c.value * ECONOMY.sellToSystemRate)), 0);
    const sum = $('.summary', el);
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    sum.innerHTML = `
      <div class="summary-head">
        <div><div class="muted small">${result.packs.length} × ${esc(pack.fr)}${result.welcomeUsed ? ` (${result.welcomeUsed} offert${result.welcomeUsed > 1 ? 's' : ''})` : ''}</div>
          <div class="total">Valeur totale : ${cr(total)}</div>
          ${result.packs.some((p) => p.pityTriggered != null) ? '<div class="pill" style="margin-top:6px">✨ Garantie déclenchée</div>' : ''}</div>
        <div class="row">
          ${lows.length ? `<button class="btn" data-sell-low>Vendre ${lows.length} commune${lows.length > 1 ? 's' : ''} · +${cr(lowGain)}</button>` : ''}
          <button class="btn ghost" data-close2>Tout garder</button>
          ${onAgain ? `<button class="btn primary" data-again>Rouvrir ${pack.free ? '' : `· ${pack.price} <i class="mu" aria-label="Mu">무</i>`}</button>` : ''}
        </div>
      </div>
      <div class="summary-grid">${sorted.map((c, i) => `<div class="tile" style="--i:${Math.min(i, 12)}">${i < EAGER ? cardOf(c) : `<div class="card-ph" data-ph="${i}"></div>`}
        <div class="meta"><span class="pill r" style="--rc:${RARITIES[c.r].color}">${RARITIES[c.r].fr}</span>${c.isNew ? '<span class="pill tag-new">NOUVEAU</span>' : ''}<b>${cr(c.value)}</b></div></div>`).join('')}</div>`;
    // les cartes suivantes sont dessinées quand elles approchent de l'écran
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.outerHTML = cardOf(sorted[Number(e.target.dataset.ph)]);
    }), { root: sum, rootMargin: '400px 0px' });
    sum.querySelectorAll('[data-ph]').forEach((x) => io.observe(x));
    sum.querySelector('[data-close2]').onclick = close;
    sum.querySelector('[data-again]')?.addEventListener('click', () => { close(); onAgain(); });
    sum.querySelector('[data-sell-low]')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      try {
        const r = await post('/cards/sell', { ids: lows.map((c) => c.id) });
        sound.play('coin'); toast(`+${cr(r.total)} crédités`, 'good');
        e.target.remove(); store.refresh();
      } catch (err) { toast(esc(err.message), 'error'); e.target.disabled = false; }
    });
  }

  const onKey = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!el.classList.contains('done')) next(); }
  };
  document.addEventListener('keydown', onKey);
  stage.addEventListener('click', (e) => { if (e.target.closest('.stack-card')) next(); });
  el.querySelector('[data-close]').onclick = close;
  el.querySelector('[data-all]').onclick = (e) => { e.target.remove(); revealAll(); };
  el.querySelector('[data-sound]').onclick = (e) => { sound.on = !sound.on; e.target.textContent = sound.on ? '🔊' : '🔇'; };
}

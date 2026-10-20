// Cartes : rendu (format kyara : nom, gemme de rareté, image, numéro, univers, stats), holo, inclinaison, inspection recto/verso.
import { RARITY } from '/shared/config.js';
import { S, game, artUrl, isShot, shotUrl, owned } from './state.js';
import { esc, pad4, icon, fmt } from './util.js';
import { api } from './api.js';

// Texture de paillettes générée une fois (aucune image externe)
(function glitter() {
  const c = document.createElement('canvas');
  c.width = c.height = 180;
  const x = c.getContext('2d');
  for (let i = 0; i < 260; i++) {
    const r = Math.random() * 1.3 + 0.2, px = Math.random() * 180, py = Math.random() * 180;
    const a = Math.random() * 0.9 + 0.1;
    x.fillStyle = `hsla(${Math.random() * 360}, 100%, ${70 + Math.random() * 30}%, ${a})`;
    x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
    if (Math.random() < 0.06) {
      x.strokeStyle = `rgba(255,255,255,${a})`; x.lineWidth = 0.6;
      x.beginPath(); x.moveTo(px - 4, py); x.lineTo(px + 4, py); x.moveTo(px, py - 4); x.lineTo(px, py + 4); x.stroke();
    }
  }
  document.documentElement.style.setProperty('--glitter', `url(${c.toDataURL()})`);
})();

export function cardHTML(n, { lg = false, missing = false, tilt = false, calm = false, eager = false } = {}) {
  const g = game(n);
  if (!g) return '';
  const src = artUrl(g, lg);
  // affiche 300×450 ou 600×900 selon la taille d'affichage et la densité de l'écran
  const srcset = !lg && g.j && g.i && !g.i.startsWith('w:') ? ` srcset="${esc(artUrl(g))} 300w, ${esc(artUrl(g, true))} 600w" sizes="(max-width: 640px) 46vw, 210px"` : '';
  const ph = src ? '' : `<div class="art-ph">${esc(g.t)}</div>`;
  const wk = !g.i && g.wk ? ` data-wk="${esc(g.wk)}"` : '';
  return `<div class="tcg r-${g.r}${lg ? ' lg' : ''}${missing ? ' missing' : ''}${tilt ? ' tiltable' : ''}${calm ? ' calm' : ''}" data-n="${n}">
    <div class="tcg-top"><div class="tcg-name" title="${esc(g.t)}">${esc(g.t)}</div><div class="gem">${g.r}</div></div>
    <div class="art">${ph}<img ${src ? `src="${esc(src)}"` : ''}${srcset}${wk} alt="" loading="${eager ? 'eager' : 'lazy'}" decoding="async" class="${isShot(g) ? 'shot' : ''}" onerror="this.style.visibility='hidden'"><span class="art-n">#${pad4(n)}/${pad4(S.total)}</span></div>
    <div class="tcg-type">${esc(g.u)}</div>
    <div class="tcg-stats"><span>POP ${g.p}</span><span>NOTE ${g.q}</span></div>
    <div class="stripes"></div><div class="sparkle"></div><div class="holo"></div><div class="glare"></div>
  </div>`;
}

export function slotHTML(n, { showQty = true, missing = null, extra = '' } = {}) {
  const c = S.coll.get(n);
  const miss = missing ?? !(c && c.qty > 0);
  const flags = [];
  if (c?.locked) flags.push(`<span title="Verrouillée">🔒</span>`);
  if (S.wishes.has(n)) flags.push(`<span class="wish" title="Dans tes envies">♥</span>`);
  return `<div class="slot" data-card="${n}">${cardHTML(n, { missing: miss })}
    ${showQty && c?.qty > 1 ? `<span class="qty">×${c.qty}</span>` : ''}
    ${flags.length ? `<div class="flags">${flags.join('')}</div>` : ''}${extra}</div>`;
}

export const backHTML = () => `<div class="tcg-back"><span>ゲ</span></div>`;

// Inclinaison au pointeur (souris, doigt) et au gyroscope
export function bindTilt(el, { strength = 16 } = {}) {
  let raf = 0;
  const set = (px, py) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.style.setProperty('--ry', `${(px - 0.5) * strength * 2}deg`);
      el.style.setProperty('--rx', `${(0.5 - py) * strength * 2}deg`);
    });
  };
  const move = (e) => {
    const r = el.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    el.classList.add('tilting');
    set(px, py);
  };
  const leave = () => {
    el.classList.remove('tilting');
    set(0.5, 0.5);
  };
  const host = el.closest('.flipper') || el;
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', leave);
  host.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') leave(); });
  const orient = (e) => {
    if (e.beta == null || el.classList.contains('tilting-pointer')) return;
    const px = Math.max(0, Math.min(1, 0.5 + (e.gamma || 0) / 50));
    const py = Math.max(0, Math.min(1, 0.5 + ((e.beta || 0) - 45) / 50));
    el.classList.add('tilting');
    set(px, py);
  };
  window.addEventListener('deviceorientation', orient);
  return () => window.removeEventListener('deviceorientation', orient);
}

// Fiche au verso
function sheetHTML(n, d) {
  const g = game(n);
  const own = owned(n);
  const shot = d?.details?.shots?.[0] ? shotUrl(d.details.shots[0], 'thumb') : artUrl(g, true);
  const meta = [g.d, g.y, g.pf || (g.s ? 'PC (Steam)' : '')].filter(Boolean).map(esc).join(' · ');
  const body = !own
    ? `<div class="locked"><b>🔒</b>Fiche verrouillée<br>Obtiens la carte pour débloquer sa fiche.</div>`
    : `<div class="desc">${esc(d?.details?.desc || 'Chargement de la fiche…')}</div>`;
  const c = S.coll.get(n);
  return `<div class="sheet r-${g.r}" style="--rc:${RARITY[g.r].color}">
    <div class="shot"><img src="${esc(shot)}" alt=""><span class="kicker">FICHE · 情報</span></div>
    <div class="body">
      <div class="t">${esc(g.t)}</div>
      <div class="meta">${meta}</div>
      ${body}
      <div class="kv">
        <div><small>RANG</small><b>#${pad4(n)}</b></div>
        <div><small>RARETÉ</small><b style="color:${RARITY[g.r].color}">${RARITY[g.r].label}</b></div>
        <div><small>EXEMPLAIRES</small><b>${c?.qty || 0}</b></div>
        <div><small>POPULARITÉ</small><b>${g.p}/99</b></div>
        <div><small>NOTE</small><b>${g.q} %</b></div>
        <div><small>${g.s ? 'AVIS STEAM' : 'AUDIENCE'}</small><b>${g.s ? fmt(g.v) : '≈ ' + fmt(g.v)}</b></div>
      </div>
    </div></div>`;
}

// Inspection plein écran : incline la carte, touche pour la retourner.
export function inspect(n, { actions = true } = {}) {
  const g = game(n);
  if (!g) return;
  const wrap = document.createElement('div');
  wrap.className = 'inspect';
  wrap.innerHTML = `<button class="close-x" aria-label="Fermer">${icon.x}</button>
    <div class="flipper"><div class="face-wrap"><div class="front">${cardHTML(n, { lg: true, tilt: true })}</div><div class="back">${sheetHTML(n, null)}</div></div></div>
    <div class="hint">Bouge la souris ou le doigt pour l’incliner · touche la carte pour la retourner</div>
    ${actions ? `<div class="acts">
      <a class="btn sm" href="/carte/${n}" data-link>Voir la fiche</a>
      ${owned(n) ? '' : `<button class="btn sm" data-wish>${S.wishes.has(n) ? '♥ Dans tes envies' : '♡ Ajouter à mes envies'}</button>`}
    </div>` : ''}`;
  document.getElementById('layer').append(wrap);
  const flipper = wrap.querySelector('.flipper');
  const unbind = bindTilt(wrap.querySelector('.tcg'), { strength: 14 });
  let moved = false;
  flipper.addEventListener('pointerdown', () => { moved = false; });
  flipper.addEventListener('click', () => { if (!moved) flipper.classList.toggle('flipped'); });
  const close = () => { unbind(); wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); if (e.key === ' ') { e.preventDefault(); flipper.classList.toggle('flipped'); } };
  document.addEventListener('keydown', onKey);
  wrap.querySelector('.close-x').onclick = close;
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) close();
    if (e.target.closest('[data-link]')) close();
  });
  wrap.querySelector('[data-wish]')?.addEventListener('click', async (e) => {
    const on = !S.wishes.has(n);
    await api.post(`/collection/${n}/wish`, { on });
    on ? S.wishes.add(n) : S.wishes.delete(n);
    e.target.textContent = on ? '♥ Dans tes envies' : '♡ Ajouter à mes envies';
  });
  api.get(`/card/${n}`).then((d) => { wrap.querySelector('.back').innerHTML = sheetHTML(n, d); }).catch(() => {});
  return close;
}

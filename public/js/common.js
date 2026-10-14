// Fragments partagés entre les pages : tuiles de carte, sélecteur de cartes, graphique de prix.
import { RARITIES } from '/shared/config.js';
import { SKIN_BY_ID, MODEL_BY_KEY } from '/shared/catalog.js';
import { wearOf, fmtFloat } from '/shared/rules.js';
import { cardOf } from './opening.js';
import { esc, cr, modal } from './ui.js';

export const skinTitle = (s) => `${MODEL_BY_KEY[s.m].name} | ${s.n}`;
export const rarityPill = (r) => `<span class="pill r" style="--rc:${RARITIES[r].color}">${esc(RARITIES[r].fr)}</span>`;

const STATUS = { LISTED: ['En vente', '#ffb020'], GRADING: ['En gradation', '#5ff3ff'] };

export function tile(c, { i = 0, sel = false, price = null, href = null, sub = null, lite = false } = {}) {
  const skin = SKIN_BY_ID.get(c.s);
  const st = price != null ? null : STATUS[c.status];
  const w = wearOf(c.f);
  const right = price != null ? `<b>${cr(price)}</b>` : `<b>${cr(c.value)}</b>`;
  const inner = `${cardOf(c, { small: true, lite })}
    ${st ? `<span class="status pill" style="color:${st[1]}">${st[0]}</span>` : ''}
    ${c.locked ? '<span class="lock" title="Favori">★</span>' : ''}
    <span class="check-mark">✓</span>
    <div class="name" title="${esc(skinTitle(skin))}">${esc(skinTitle(skin))}</div>
    <div class="meta"><span class="muted">${w.key} · ${fmtFloat(c.f).slice(0, 6)}</span>${right}</div>
    ${sub ? `<div class="meta">${sub}</div>` : ''}`;
  return href
    ? `<a class="tile ${sel ? 'sel' : ''}" href="${href}" data-id="${c.id}" style="--i:${i}">${inner}</a>`
    : `<div class="tile ${sel ? 'sel' : ''}" data-id="${c.id}" style="--i:${i}">${inner}</div>`;
}

// Modale de sélection de cartes (échanges, contrat…)
export function pickCards(cards, { title = 'Choisir des cartes', max = 12, selected = [], filter = () => true } = {}) {
  return new Promise((resolve) => {
    const sel = new Set(selected);
    let done = false;
    const list = cards.filter(filter);
    const m = modal(`<h2>${esc(title)}</h2>
      <div class="filters"><input class="input" placeholder="Rechercher…" data-q><select class="input" data-r><option value="">Toutes raretés</option>${RARITIES.map((r, i) => `<option value="${i}">${r.fr}</option>`).join('')}</select>
      <span class="muted small" data-count></span></div>
      <div class="picker"><div class="cards" data-grid></div></div>
      <div class="row end" style="margin-top:14px"><button class="btn primary" data-ok>Valider</button></div>`, { wide: true, onClose: () => { if (!done) resolve(null); } });
    const grid = m.el.querySelector('[data-grid]');
    const draw = () => {
      const q = m.el.querySelector('[data-q]').value.toLowerCase(), r = m.el.querySelector('[data-r]').value;
      const shown = list.filter((c) => (r === '' || c.r === Number(r)) && skinTitle(SKIN_BY_ID.get(c.s)).toLowerCase().includes(q)).slice(0, 120);
      grid.innerHTML = shown.length ? shown.map((c, i) => tile(c, { i, sel: sel.has(c.id), lite: true })).join('') : '<div class="empty">Aucune carte disponible</div>';
      m.el.querySelector('[data-count]').textContent = `${sel.size}/${max} sélectionnée(s)`;
    };
    grid.addEventListener('click', (e) => {
      const t = e.target.closest('.tile'); if (!t) return;
      const id = Number(t.dataset.id);
      if (sel.has(id)) sel.delete(id); else if (sel.size < max) sel.add(id);
      t.classList.toggle('sel', sel.has(id));
      m.el.querySelector('[data-count]').textContent = `${sel.size}/${max} sélectionnée(s)`;
    });
    m.el.querySelector('[data-q]').oninput = draw;
    m.el.querySelector('[data-r]').onchange = draw;
    m.el.querySelector('[data-ok]').onclick = () => { done = true; resolve([...sel]); m.close(); };
    draw();
  });
}

export function priceChart(sales) {
  if (!sales?.length) return '<div class="empty small">Aucune vente enregistrée pour ce skin</div>';
  const W = 600, H = 160, pad = 10;
  const ys = sales.map((s) => s.price);
  const min = Math.min(...ys), max = Math.max(...ys);
  const pts = sales.map((s, i) => [pad + (i / Math.max(1, sales.length - 1)) * (W - 2 * pad), H - pad - ((s.price - min) / Math.max(1, max - min)) * (H - 2 * pad)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="chg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb020" stop-opacity=".35"/><stop offset="1" stop-color="#ffb020" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z" fill="url(#chg)"/>
    <path class="l" d="${d}"/>
  </svg><div class="row between small muted"><span>min ${cr(min)}</span><span>${sales.length} vente(s)</span><span>max ${cr(max)}</span></div>`;
}

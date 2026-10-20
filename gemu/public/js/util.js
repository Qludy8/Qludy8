// Petits outils d'interface : échappement HTML, formats, icônes, toasts, fenêtres.
import { CURRENCY } from '/shared/config.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');
export const pad4 = (n) => String(n).padStart(4, '0');
export const gem = (n) => `<span class="gem-v">${fmt(n)} ${CURRENCY.icon}</span>`;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const pct = (x) => (x >= 1 ? `${x.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : x >= 0.01 ? `${x.toLocaleString('fr-FR', { maximumSignificantDigits: 2 })} %` : '< 0,01 %');

export function ago(t) {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}
export function dur(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h) return `${h} h ${String(m).padStart(2, '0')}`;
  if (m) return `${m} min ${String(sec).padStart(2, '0')}`;
  return `${sec} s`;
}

const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
export const icon = {
  home: I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  pack: I('<path d="M6 3h12l-1 3 1 3v12H6V9l1-3z"/><path d="M6 9h12"/><circle cx="12" cy="15" r="2.5"/>'),
  cards: I('<rect x="3" y="5" width="12" height="16" rx="2"/><path d="M9 3h10a2 2 0 0 1 2 2v14"/>'),
  target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  bell: I('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/>'),
  trophy: I('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  shop: I('<path d="M3 9l2-5h14l2 5"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/>'),
  swap: I('<path d="M7 7h13l-4-4M17 17H4l4 4"/>'),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  gem: I('<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18 3-18"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'),
  lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  heart: I('<path d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z"/>'),
  recycle: I('<path d="M7 19H4l3-5M17 19h3l-3-5M12 4l-2 4h4z"/><path d="M8.5 8.5L6 13M15.5 8.5L18 13M8 19h8"/>'),
  back: I('<path d="M15 6l-6 6 6 6"/>'),
  sound: I('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>'),
  star: I('<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z"/>'),
  grid: I('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
};

// --- toasts ---
let toastBox;
export function toast(html, kind = '') {
  if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; document.body.append(toastBox); }
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.innerHTML = html;
  toastBox.append(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, kind === 'err' ? 4200 : 2800);
}
export const toastErr = (e) => toast(esc(e?.message || e || 'Une erreur est survenue.'), 'err');

// --- fenêtres ---
export function modal(html, { wide = false, onClose } = {}) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="icon-btn x" data-close aria-label="Fermer">${icon.x}</button>${html}</div>`;
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); onClose?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.getElementById('layer').append(bg);
  return { el: bg.querySelector('.modal'), close };
}
export function confirmBox(title, text, okLabel = 'Confirmer') {
  return new Promise((resolve) => {
    let done = false;
    const m = modal(`<h3>${esc(title)}</h3><p class="mut">${text}</p><div class="row" style="justify-content:flex-end;margin-top:18px">
      <button class="btn" data-no>Annuler</button><button class="btn acc" data-yes>${esc(okLabel)}</button></div>`, { onClose: () => { if (!done) resolve(false); } });
    m.el.querySelector('[data-no]').onclick = () => { done = true; resolve(false); m.close(); };
    m.el.querySelector('[data-yes]').onclick = () => { done = true; resolve(true); m.close(); };
  });
}

// --- réglages locaux ---
export const prefs = {
  get(k, d) { try { const v = localStorage.getItem('gemu:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('gemu:' + k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
};

// Redessine la page courante (après une ouverture de booster, un achat…)
export const refresh = () => dispatchEvent(new Event('gemu:refresh'));

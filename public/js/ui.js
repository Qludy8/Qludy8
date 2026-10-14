// Petits utilitaires d'interface : échappement, toasts, modales, tilt 3D, formatage.
import { t, fmt } from '/shared/i18n.js';
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const cr = (n) => `${fmt(Math.round(n))} <i class="mu" aria-label="Mu">무</i>`;
export const ago = (ts) => {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return t('il y a {n} s', { n: s });
  if (s < 3600) return t('il y a {n} min', { n: Math.round(s / 60) });
  if (s < 86400) return t('il y a {n} h', { n: Math.round(s / 3600) });
  return t('il y a {n} j', { n: Math.round(s / 86400) });
};
export const dur = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? t('{h} h {m}', { h, m: String(m).padStart(2, '0') }) : `${m}:${String(x).padStart(2, '0')}`;
};
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function toast(msg, kind = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = msg;
  $('#toasts').append(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 400); }, kind === 'error' ? 4200 : 2800);
}

export function modal(html, { wide = false, onClose } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="modal-x" aria-label="${t('Fermer')}">✕</button>${html}</div>`;
  document.body.append(wrap);
  requestAnimationFrame(() => wrap.classList.add('in'));
  const close = () => {
    wrap.classList.remove('in');
    setTimeout(() => wrap.remove(), 250);
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('.modal-x')) close(); });
  return { el: wrap.querySelector('.modal'), close };
}

export function confirmBox(text, okLabel = t('Confirmer')) {
  return new Promise((resolve) => {
    let done = false;
    const m = modal(`<p class="confirm-text">${text}</p><div class="row end"><button class="btn ghost" data-no>${t('Annuler')}</button><button class="btn primary" data-ok>${okLabel}</button></div>`,
      { onClose: () => { if (!done) resolve(false); } });
    m.el.querySelector('[data-ok]').onclick = () => { done = true; resolve(true); m.close(); };
    m.el.querySelector('[data-no]').onclick = () => { done = true; resolve(false); m.close(); };
  });
}

// Tilt 3D magnétique + reflet holographique (délégué sur tout le document)
export function initTilt() {
  let active = null;
  const reset = (el) => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('tilting'); };
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || reducedMotion()) return;
    const el = e.target.closest?.('[data-tilt]');
    if (active && active !== el) { reset(active); active = null; }
    if (!el) return;
    active = el;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    const max = el.classList.contains('small') ? 10 : 14;
    el.style.setProperty('--rx', `${((0.5 - py) * max).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((px - 0.5) * max).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.classList.add('tilting');
  }, { passive: true });
  document.addEventListener('pointerleave', () => { if (active) reset(active); active = null; });
}

export function animateNumber(el, to, ms = 700) {
  const from = Number(el.dataset.v || 0);
  el.dataset.v = to;
  if (reducedMotion() || from === to) { el.textContent = fmt(Math.round(to)); return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms), e = 1 - (1 - k) ** 3;
    el.textContent = fmt(Math.round(from + (to - from) * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  if (to > from) { el.parentElement?.classList.add('flash'); setTimeout(() => el.parentElement?.classList.remove('flash'), 700); }
}

export function avatar(u, size = 36) {
  const letter = esc((u.username || '?')[0].toUpperCase());
  return `<span class="avatar" style="--h:${u.avatar_hue ?? 200};width:${size}px;height:${size}px;font-size:${size * 0.45}px">${letter}</span>`;
}

// Inspection d'un skin : arme en grand, curseur de float (aperçu de l'usure) et curseur de graine de motif.
import { WEAR, PATTERN } from '/shared/config.js';
import { STYLES } from '/shared/catalog.js';
import { wearOf, fmtFloat } from '/shared/rules.js';
import { describeSeed, rareSeeds } from '/shared/patterns.js';
import { weaponSVG, styleLabel } from './art/card.js';
import { esc } from './ui.js';

const TIER_COL = { 1: '#ffd76a', 2: '#ff7ae6', 3: '#5ff3ff' };

export function inspector(skin, { f = null, pt = null, title = 'Inspection', lockedNote = '' } = {}) {
  const f0 = f ?? Math.max(skin.fmin, Math.min(skin.fmax - 0.0001, 0.02));
  const pt0 = pt ?? 0;
  const pb = STYLES[skin.st].patternBased;
  const rare = pb ? rareSeeds(skin.m, skin.st) : [];
  const html = `<div class="inspect" data-inspect>
    <div class="row between"><h3 style="margin:0">${esc(title)}</h3><span class="row" style="gap:10px"><span class="muted small">${esc(styleLabel(skin))}${lockedNote ? ` · ${esc(lockedNote)}` : ''}</span>
      <button class="btn sm ghost" data-reset title="Revenir aux valeurs de la carte">↺ Réinitialiser</button></span></div>
    <div class="inspect-stage"><svg viewBox="0 0 1000 360" data-wsvg>${weaponSVG(skin, { f: f0, pt: pt0, serial: 'inspect' })}</svg></div>
    <div class="inspect-ctrl">
      <label class="slider-field"><span>Float <b data-fv style="color:${wearOf(f0).color}">${fmtFloat(f0)}</b> <span class="pill" data-fw style="--rc:${wearOf(f0).color}">${wearOf(f0).key} · ${esc(wearOf(f0).fr)}</span></span>
        <input type="range" class="range" data-f min="${skin.fmin}" max="${(skin.fmax - 0.000001).toFixed(6)}" step="0.0005" value="${f0}"
          style="--fill:${(((f0 - skin.fmin) / (skin.fmax - skin.fmin)) * 100).toFixed(1)}%;--thumb:${wearOf(f0).color}">
        <span class="range-scale">${WEAR.tiers.filter((t) => t.max > skin.fmin && t.min < skin.fmax).map((t) => `<i style="flex:${Math.min(t.max, skin.fmax) - Math.max(t.min, skin.fmin)};background:${t.color}" title="${esc(t.fr)}"></i>`).join('')}</span></label>
      ${pb ? `<label class="slider-field"><span>Graine de motif <b data-pv>${pt0}</b> <span class="pill" data-pl></span></span>
        <input type="range" class="range" data-p min="0" max="${PATTERN.seeds - 1}" step="1" value="${pt0}" style="--fill:${((pt0 / 999) * 100).toFixed(1)}%"></label>
      <div class="seed-chips"><span class="muted small">Graines rares :</span>${rare.filter((x) => x.tier <= 2).map((x) => `<button class="chip" data-seed="${x.seed}" style="--rc:${TIER_COL[x.tier]}">#${x.seed}</button>`).join('')}</div>` : ''}
    </div></div>`;
  const bind = (root) => {
    const el = root.querySelector('[data-inspect]');
    const svg = el.querySelector('[data-wsvg]'), fi = el.querySelector('[data-f]'), pi = el.querySelector('[data-p]');
    let raf = 0;
    const draw = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const fv = Number(fi.value), pv = pi ? Number(pi.value) : pt0, w = wearOf(fv);
        svg.innerHTML = weaponSVG(skin, { f: fv, pt: pv, serial: 'inspect' });
        el.querySelector('[data-fv]').textContent = fmtFloat(fv);
        el.querySelector('[data-fv]').style.color = w.color;
        const fw = el.querySelector('[data-fw]'); fw.textContent = `${w.key} · ${w.fr}`; fw.style.setProperty('--rc', w.color);
        fi.style.setProperty('--fill', `${(((fv - skin.fmin) / (skin.fmax - skin.fmin)) * 100).toFixed(1)}%`); fi.style.setProperty('--thumb', w.color);
        if (!pi) return;
        pi.style.setProperty('--fill', `${((pv / 999) * 100).toFixed(1)}%`);
        el.querySelector('[data-pv]').textContent = pv;
        const d = describeSeed(skin, pv), pl = el.querySelector('[data-pl]');
        pl.textContent = d ? `${d.label}${d.tier ? ` · ${d.tierFr} ×${d.mult}` : ''}` : '—';
        pl.style.setProperty('--rc', d?.tier ? TIER_COL[d.tier] : '#8e93a6');
        pl.classList.toggle('r', true);
        pi.style.setProperty('--thumb', d?.tier ? TIER_COL[d.tier] : '#ffb020');
      });
    };
    fi.addEventListener('input', draw); pi?.addEventListener('input', draw);
    el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-seed]'); if (c) { pi.value = c.dataset.seed; draw(); }
      if (e.target.closest('[data-reset]')) { fi.value = f0; if (pi) pi.value = pt0; draw(); }
    });
    draw();
  };
  return { html, bind };
}
export { TIER_COL };

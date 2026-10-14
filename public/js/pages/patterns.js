// Fiche des motifs : styles de skins, graines de motif, liste des graines rares par modèle.
import { PATTERN } from '/shared/config.js';
import { SKINS, MODELS, MODEL_BY_KEY, STYLES } from '/shared/catalog.js';
import { rareSeeds, describeSeed } from '/shared/patterns.js';
import { weaponSVG } from '../art/card.js';
import { inspector, TIER_COL } from '../inspect.js';
import { esc, $ } from '../ui.js';

const PB = Object.entries(STYLES).filter(([, s]) => s.patternBased).map(([k]) => k);

export function patternsPage({ view, query }) {
  const st = { model: query.get('model') || 'rhoden', style: query.get('style') || 'fade' };
  const example = (style) => SKINS.find((s) => s.m === 'rhoden' && s.st === style && (style !== 'art' || s.art === 'dragon')) || SKINS.find((s) => s.m === 'rhoden' && s.st === style) || SKINS.find((s) => s.st === style);
  view.innerHTML = `<h1>Fiche des <span class="grad-text">motifs</span></h1>
    <p class="muted" style="max-width:760px">Chaque carte reçoit une <b class="glow-text" style="--gc:#ffb020">graine de motif</b> de 0 à ${PATTERN.seeds - 1}. Elle positionne le motif sur l’arme.
      Pour les styles <b>Fondu</b>, <b>Trempe</b> et <b>Marbrure</b>, la graine change vraiment le rendu : certaines sont rares et augmentent la valeur de la carte.</p>
    <div class="section-title"><h2>Les styles</h2></div>
    <div class="style-grid">${Object.entries(STYLES).map(([k, s]) => {
    const sk = example(k);
    return `<div class="style-card"><svg viewBox="0 0 1000 360">${weaponSVG(sk, { f: 0.01, pt: 3, serial: 'x' }, { lite: true })}</svg>
        <div><b>${esc(s.fr)}</b>${s.patternBased ? ' <span class="pill r" style="--rc:#ffd76a">graines rares</span>' : ''}<div class="muted small">${esc(s.desc)}</div></div></div>`;
  }).join('')}</div>
    <div class="section-title"><h2>Graines rares</h2></div>
    <div class="grid" style="grid-template-columns:repeat(3,auto);gap:10px;margin-bottom:16px;justify-content:start">
      ${Object.entries(PATTERN.tiers).map(([t, x]) => `<span class="pill r" style="--rc:${TIER_COL[t]}">${esc(x.fr)} · ×${x.mult} la valeur</span>`).join('')}
    </div>
    <div class="filters">
      <select class="input" data-model>${MODELS.map((m) => `<option value="${m.key}" ${m.key === st.model ? 'selected' : ''}>${esc(m.name)} — ${esc(m.clsFr)}</option>`).join('')}</select>
      <div class="tabs">${PB.map((k) => `<button data-style="${k}" class="${k === st.style ? 'on' : ''}">${esc(STYLES[k].fr)}</button>`).join('')}</div>
    </div>
    <div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(260px,1fr);gap:20px;align-items:start">
      <div class="panel" data-insp></div>
      <div class="panel"><h3>Classement des graines</h3><p class="muted small" data-explain></p><div data-seeds class="seed-table"></div></div>
    </div>`;
  const draw = () => {
    const skin = SKINS.find((s) => s.m === st.model && s.st === st.style);
    if (!skin) { $('[data-insp]', view).innerHTML = '<div class="empty">Ce modèle n’a pas encore de skin dans ce style.</div>'; $('[data-seeds]', view).innerHTML = ''; return; }
    const top = rareSeeds(st.model, st.style);
    const ins = inspector(skin, { pt: top[0].seed, title: `${MODEL_BY_KEY[skin.m].name} | ${skin.n}` });
    $('[data-insp]', view).innerHTML = ins.html; ins.bind($('[data-insp]', view));
    $('[data-explain]', view).textContent = {
      fade: 'Plus le pourcentage de fondu est haut, plus la dernière couleur recouvre l’arme. 100 % = fondu intégral.',
      hardened: 'Part de bleu sur l’acier trempé. Au-delà de 90 %, on parle de « joyau bleu ».',
      marble: 'Les meilleures graines n’affichent que deux couleurs : Braise & Givre (rouge et bleu), puis Nuit profonde et Aurore.',
    }[st.style];
    $('[data-seeds]', view).innerHTML = `<table class="t"><thead><tr><th>Graine</th><th>Rendu</th><th>Rang</th></tr></thead><tbody>${top.map((x) => {
      const d = describeSeed(skin, x.seed);
      return `<tr><td><button class="chip" data-seed="${x.seed}" style="--rc:${TIER_COL[x.tier]}">#${x.seed}</button></td><td>${esc(d.label)}</td><td><span style="color:${TIER_COL[x.tier]}" class="glow-text">${esc(d.tierFr)}</span></td></tr>`;
    }).join('')}</tbody></table>`;
  };
  view.addEventListener('change', (e) => { if (e.target.matches('[data-model]')) { st.model = e.target.value; draw(); } });
  view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-style]');
    if (b) { st.style = b.dataset.style; view.querySelectorAll('[data-style]').forEach((x) => x.classList.toggle('on', x === b)); draw(); return; }
    const s = e.target.closest('[data-seeds] [data-seed]');
    if (s) { const r = view.querySelector('[data-insp] input[data-p]'); r.value = s.dataset.seed; r.dispatchEvent(new Event('input')); view.querySelector('[data-insp]').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
  draw();
}

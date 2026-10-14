// Rendu des cartes en SVG : cadre de rareté, centrage réel, illustration de l'arme peinte avec le motif du skin,
// usure (écaillage de la peinture + rayures/bords blanchis de la carte), badges, carte erreur, slab gradé.
import { RARITIES, WEAR } from '/shared/config.js';
import { MODEL_BY_KEY, PATTERNS, FINISHES } from '/shared/catalog.js';
import { wearOf, fmtFloat, centeringLabel, gradeLabel, isExtremeFloat } from '/shared/rules.js';
import { WEAPON_ART, WEAPON_BOX } from './weapons.js';
import { patternDef, finishOverlay, palette, rng } from './patterns.js';
import { esc } from '../ui.js';

let uidN = 0;
const uid = () => `a${(++uidN).toString(36)}`;
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

export const CW = 630, CH = 880, MARGIN = 48;

// ───────── Arme peinte
export function weaponSVG(skin, float = null, opts = {}) {
  const id = uid();
  const parts = WEAPON_ART[skin.m] || [];
  const c = palette(skin);
  const fin = finishOverlay(`${id}f`, skin.f);
  const by = (k) => parts.filter((p) => p.k === k).map((p) => p.d).join(' ');
  const body = by('body'), dark = by('dark'), accent = by('accent'), glass = by('glass'), line = by('line'), hole = by('hole');
  // usure de la peinture : bruit fractal seuillé → la peinture s'écaille et laisse voir le métal
  let wearDefs = '', wearMask = '';
  if (float != null && float > 0.06 && !opts.lite) {
    const th = 0.92 - float * 0.5;
    wearDefs = `<filter id="${id}w" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${(0.025 + float * 0.03).toFixed(3)}" numOctaves="3" seed="${skin.seed % 997}"/>` +
      `<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -14 0 0 0 ${(14 * th).toFixed(2)}"/></filter>` +
      `<mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="260"><rect width="600" height="260" fill="#fff" filter="url(#${id}w)"/></mask>`;
    wearMask = `mask="url(#${id}m)"`;
  }
  const glow = skin.r >= 4 ? `<filter id="${id}g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>` : '';
  return `<g class="weapon">
    <defs>${patternDef(`${id}p`, skin)}${fin.def}${wearDefs}${glow}
      <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5f69"/><stop offset=".5" stop-color="#2a2d33"/><stop offset="1" stop-color="#121316"/></linearGradient>
      <linearGradient id="${id}bare" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9bec6"/><stop offset="1" stop-color="#6c727c"/></linearGradient>
    </defs>
    <path d="${body} ${dark}" fill="#000" opacity=".45" transform="translate(6 10)" fill-rule="evenodd"/>
    ${glow ? `<path d="${accent}" fill="${c.c2}" filter="url(#${id}g)" opacity=".9"/>` : ''}
    <path d="${dark}" fill="url(#${id}d)" stroke="#07080a" stroke-width="2" fill-rule="evenodd"/>
    <path d="${body}" fill="url(#${id}bare)" fill-rule="evenodd"/>
    <g ${wearMask}><path d="${body}" fill="url(#${id}p)" fill-rule="evenodd"/><path d="${body}" fill="${fin.fill}" fill-rule="evenodd"/></g>
    <path d="${body}" fill="none" stroke="#07080a" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="${hole}" fill="#07080a" opacity=".85"/>
    <path d="${line}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>
    <path d="${accent}" fill="${c.c2}" stroke="#07080a" stroke-width="1.5" fill-rule="evenodd"/>
    <path d="${glass}" fill="#9ff" opacity=".85" stroke="#07080a" stroke-width="1.5"/>
  </g>`;
}

// cadre l'arme dans la fenêtre d'illustration (546 × 420, origine 18,66)
function fit(m, PW) {
  const b = WEAPON_BOX[m];
  const k = Math.min((PW - 100) / b.w, 300 / b.h, 1.55);
  const x = 18 + (PW - 36 - b.w * k) / 2 - b.x * k;
  const y = 66 + (400 - b.h * k) / 2 - b.y * k;
  return `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(3)})`;
}

// ───────── Face complète d'une carte (cadre + panneau), coordonnées 630 × 880
function cardFace(skin, card, id, opts) {
  const R = RARITIES[skin.r];
  const model = MODEL_BY_KEY[skin.m];
  const c = palette(skin);
  const L = card ? (MARGIN * card.cx) / 100 : MARGIN / 2;
  const T = card ? (MARGIN * card.cy) / 100 : MARGIN / 2;
  const PW = CW - MARGIN, PH = CH - MARGIN;
  const fid = `${id}${opts.suffix || ''}`;
  const transc = skin.r === 6;
  const frameStops = transc
    ? `<stop offset="0" stop-color="#5ff3ff"/><stop offset=".33" stop-color="#ff7ae6"/><stop offset=".66" stop-color="#ffe46b"/><stop offset="1" stop-color="#5ff3ff"/>`
    : `<stop offset="0" stop-color="${R.color}"/><stop offset=".45" stop-color="#fff" stop-opacity=".85"/><stop offset=".5" stop-color="${R.color}"/><stop offset="1" stop-color="#15161a"/>`;

  // barre de float : segments d'usure + curseur (ou plage possible si skin du catalogue)
  const bx = 24, bw = PW - 48, by = 676;
  const segCols = ['#4ade80', '#a3e635', '#facc15', '#fb923c', '#ef4444'];
  let floatBar = WEAR.tiers.map((t, i) => `<rect x="${bx + t.min * bw}" y="${by}" width="${(t.max - t.min) * bw}" height="12" fill="${segCols[i]}" opacity="${card ? 0.9 : 0.25}"/>`).join('');
  let floatTxt;
  if (card) {
    const fx = bx + card.f * bw;
    floatBar += `<path d="M${fx - 9} ${by - 14} L${fx + 9} ${by - 14} L${fx} ${by - 2} Z" fill="#fff"/><rect x="${fx - 1.5}" y="${by - 2}" width="3" height="16" fill="#fff"/>`;
    const w = wearOf(card.f);
    floatTxt = `<text x="24" y="${by - 24}" class="t-lab">FLOAT</text><text x="${PW - 24}" y="${by - 24}" class="t-val" text-anchor="end">${fmtFloat(card.f)}</text>
      <text x="24" y="${by + 44}" class="t-sub">${w.fr} · ${w.key}</text><text x="${PW - 24}" y="${by + 44}" class="t-sub" text-anchor="end">Centrage ${centeringLabel(card.cx, card.cy)}</text>`;
  } else {
    floatBar += `<rect x="${bx + skin.fmin * bw}" y="${by - 3}" width="${(skin.fmax - skin.fmin) * bw}" height="18" rx="4" fill="none" stroke="#fff" stroke-width="2.5"/>`;
    floatTxt = `<text x="24" y="${by - 24}" class="t-lab">PLAGE DE FLOAT</text><text x="${PW - 24}" y="${by - 24}" class="t-val" text-anchor="end">${skin.fmin.toFixed(2)} – ${skin.fmax.toFixed(2)}</text>
      <text x="24" y="${by + 44}" class="t-sub">${esc(PATTERNS[skin.p])} · ${esc(FINISHES[skin.f])}</text>`;
  }

  const badges = [];
  if (card?.tr != null) badges.push(['TRAQUEUR ' + String(card.tr).padStart(4, '0'), '#ff8a3d']);
  if (card?.foil) badges.push(['HOLO', '#5ff3ff']);
  if (card && isExtremeFloat(card.f)) badges.push(['FLOAT EXTRÊME', '#ffe46b']);
  let bxPos = 36;
  const badgeSvg = badges.map(([t, col]) => {
    const w = t.length * 11.5 + 22;
    const s = `<g transform="translate(${bxPos} 84)"><rect width="${w}" height="30" rx="15" fill="#000" fill-opacity=".6" stroke="${col}" stroke-width="2"/><text x="${w / 2}" y="21" text-anchor="middle" class="t-badge" fill="${col}">${t}</text></g>`;
    bxPos += w + 8; return s;
  }).join('');

  const gems = Array.from({ length: skin.r + 1 }, (_, i) => `<path d="M${PW - 30 - i * 22} 786 l8 -10 l8 10 l-8 10 Z" fill="${R.color}" stroke="#000" stroke-width="1"/>`).join('');
  const raysOp = 0.05 + skin.r * 0.035;
  const art = weaponSVG(skin, card?.f ?? null, opts);

  return `<g>
    <defs>
      <linearGradient id="${fid}fr" x1="0" y1="0" x2="1" y2="1">${frameStops}</linearGradient>
      <linearGradient id="${fid}pn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1d24"/><stop offset=".6" stop-color="#101116"/><stop offset="1" stop-color="${R.color}" stop-opacity=".35"/></linearGradient>
      <radialGradient id="${fid}ab" cx=".5" cy=".55" r=".75"><stop offset="0" stop-color="hsl(${skin.h2} 70% 38%)"/><stop offset=".55" stop-color="hsl(${skin.h} 45% 16%)"/><stop offset="1" stop-color="#07080b"/></radialGradient>
      <pattern id="${fid}gr" patternUnits="userSpaceOnUse" width="28" height="28"><path d="M28 0 L0 0 0 28" fill="none" stroke="#fff" stroke-opacity=".06"/></pattern>
      <clipPath id="${fid}cl"><rect x="18" y="66" width="${PW - 36}" height="420" rx="14"/></clipPath>
    </defs>
    <rect width="${CW}" height="${CH}" rx="30" fill="url(#${fid}fr)"/>
    <rect x="5" y="5" width="${CW - 10}" height="${CH - 10}" rx="26" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"/>
    <g transform="translate(${L.toFixed(1)} ${T.toFixed(1)})">
      <rect width="${PW}" height="${PH}" rx="18" fill="url(#${fid}pn)" stroke="#000" stroke-opacity=".6" stroke-width="2"/>
      <text x="24" y="46" class="t-model">${esc(model.name.toUpperCase())}</text>
      <text x="${PW - 24}" y="46" class="t-rar" text-anchor="end" fill="${R.color}">${esc(R.fr.toUpperCase())}</text>
      <g clip-path="url(#${fid}cl)">
        <rect x="18" y="66" width="${PW - 36}" height="420" fill="url(#${fid}ab)"/>
        <rect x="18" y="66" width="${PW - 36}" height="420" fill="url(#${fid}gr)"/>
        <g opacity="${raysOp}" transform="translate(${PW / 2} 276)">${Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L-24 -420 L24 -420 Z" fill="#fff" transform="rotate(${i * 30})"/>`).join('')}</g>
        <text x="${PW - 34}" y="470" class="t-glyph" text-anchor="end" fill="#fff" fill-opacity=".07">${esc(model.glyph)}</text>
        <ellipse cx="${PW / 2}" cy="420" rx="230" ry="16" fill="#000" opacity=".45"/>
        <g transform="${fit(skin.m, PW)}">${art}</g>
        ${badgeSvg}
      </g>
      <rect x="18" y="66" width="${PW - 36}" height="420" rx="14" fill="none" stroke="${R.color}" stroke-opacity=".7" stroke-width="2"/>
      <rect x="18" y="500" width="${PW - 36}" height="96" rx="12" fill="#000" fill-opacity=".38" stroke="${R.color}" stroke-opacity=".35"/>
      <text x="${PW / 2}" y="548" text-anchor="middle" class="t-name" textLength="${Math.min(PW - 70, skin.n.length * 26)}" lengthAdjust="spacingAndGlyphs">${esc(skin.n)}</text>
      <text x="${PW / 2}" y="580" text-anchor="middle" class="t-sub">${esc(model.clsFr)} · ${esc(model.name)}</text>
      ${floatTxt}
      ${floatBar}
      <line x1="24" x2="${PW - 24}" y1="752" y2="752" stroke="#fff" stroke-opacity=".1"/>
      <text x="24" y="792" class="t-serial">${card?.serial ? esc(card.serial) : esc(skin.id.toUpperCase())}</text>
      ${gems}
    </g>
  </g>`;
}

// ───────── Usure visible de la carte (rayures, coins blanchis, pli, taches)
function cardWear(card, id) {
  const f = card.f;
  if (f < 0.04) return '';
  const r = rng(hash(card.serial || String(card.id || 0)));
  let s = '';
  const n = Math.floor(f * 46);
  for (let i = 0; i < n; i++) {
    const x = r() * CW, y = r() * CH, len = 20 + r() * 120 * (0.4 + f), a = r() * Math.PI;
    s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q${(Math.cos(a) * len * 0.5).toFixed(0)} ${(Math.sin(a) * len * 0.5 + (r() - 0.5) * 12).toFixed(0)} ${(Math.cos(a) * len).toFixed(0)} ${(Math.sin(a) * len).toFixed(0)}" stroke="#fff" stroke-opacity="${(0.12 + r() * 0.25).toFixed(2)}" stroke-width="${(0.6 + r() * 1.4).toFixed(1)}" fill="none"/>`;
  }
  const dash = Array.from({ length: 12 }, () => Math.round(4 + r() * 60 * (1.2 - f))).join(' ');
  s += `<rect x="3" y="3" width="${CW - 6}" height="${CH - 6}" rx="28" fill="none" stroke="#f4f1ea" stroke-opacity="${Math.min(0.75, f * 1.1).toFixed(2)}" stroke-width="${(3 + f * 8).toFixed(1)}" stroke-linecap="round" stroke-dasharray="${dash}"/>`;
  if (f > 0.3) for (const [cx, cy] of [[14, 14], [CW - 14, 14], [14, CH - 14], [CW - 14, CH - 14]]) {
    s += `<circle cx="${cx}" cy="${cy}" r="${(6 + f * 18 * r()).toFixed(1)}" fill="#f4f1ea" opacity="${(0.3 + f * 0.5).toFixed(2)}"/>`;
  }
  if (f > 0.45) for (let i = 0; i < Math.floor(f * 6); i++) {
    s += `<ellipse cx="${(r() * CW).toFixed(0)}" cy="${(r() * CH).toFixed(0)}" rx="${(20 + r() * 50).toFixed(0)}" ry="${(14 + r() * 30).toFixed(0)}" fill="#6b4a2a" opacity="${(0.08 + r() * 0.14).toFixed(2)}"/>`;
  }
  if (f > 0.62) {
    const y1 = 100 + r() * 300, y2 = y1 + 150 + r() * 400;
    s += `<path d="M0 ${y1.toFixed(0)} L${CW} ${y2.toFixed(0)}" stroke="#000" stroke-opacity=".35" stroke-width="5"/><path d="M0 ${(y1 + 4).toFixed(0)} L${CW} ${(y2 + 4).toFixed(0)}" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`;
  }
  s += `<rect width="${CW}" height="${CH}" rx="30" fill="#8a7a5c" opacity="${(f * 0.16).toFixed(3)}" style="mix-blend-mode:multiply"/>`;
  return `<g class="wear" pointer-events="none">${s}</g>`;
}

/**
 * SVG complet d'une carte. skin : entrée du catalogue. card : instance (ou null pour le catalogue).
 * opts.lite : pas d'écaillage (grilles très denses) ; opts.misprintSkin : skin de la 2e moitié.
 */
export function cardSVG(skin, card = null, opts = {}) {
  const id = uid();
  let inner;
  if (card?.mp && opts.misprintSkin) {
    // Carte erreur : deux cartes à moitié sur la même feuille (coupe décalée d'une demi-carte)
    inner = `<g transform="translate(-14 ${CH / 2 + 10})">${cardFace(skin, card, id, { ...opts, suffix: 'a' })}</g>
      <g transform="translate(10 ${-CH / 2 + 10})">${cardFace(opts.misprintSkin, { ...card, serial: '' }, id, { ...opts, suffix: 'b' })}</g>
      <rect x="0" y="${CH / 2 + 2}" width="${CW}" height="16" fill="#0b0c10" opacity=".55"/>`;
  } else {
    inner = cardFace(skin, card, id, opts);
  }
  return `<svg class="card-svg" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(MODEL_BY_KEY[skin.m].name)} | ${esc(skin.n)}">
    <defs><clipPath id="${id}clip"><rect width="${CW}" height="${CH}" rx="30"/></clipPath></defs>
    <g clip-path="url(#${id}clip)">
      <rect width="${CW}" height="${CH}" fill="#0b0c10"/>
      ${inner}
      ${card ? cardWear(card, id) : ''}
    </g>
  </svg>`;
}

export function cardBack(rarity = null) {
  const id = uid();
  const col = rarity != null ? RARITIES[rarity].color : '#ff4d2e';
  return `<svg class="card-svg" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1c24"/><stop offset="1" stop-color="#0a0b0f"/></linearGradient>
      <pattern id="${id}h" patternUnits="userSpaceOnUse" width="40" height="69.28"><path d="M20 0 L40 11.55 L40 34.64 L20 46.19 L0 34.64 L0 11.55 Z M20 46.19 L20 69.28 M0 34.64 L0 57.7 M40 34.64 L40 57.7" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="2"/></pattern>
      <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${CW}" height="${CH}" rx="30" fill="url(#${id}b)"/>
    <rect width="${CW}" height="${CH}" rx="30" fill="url(#${id}h)"/>
    <rect x="22" y="22" width="${CW - 44}" height="${CH - 44}" rx="20" fill="none" stroke="${col}" stroke-opacity=".6" stroke-width="3"/>
    <circle cx="${CW / 2}" cy="${CH / 2}" r="230" fill="url(#${id}g)"/>
    <g transform="translate(${CW / 2} ${CH / 2})" fill="none" stroke="${col}" stroke-width="10">
      <circle r="120" stroke-opacity=".9"/><circle r="84" stroke-opacity=".5" stroke-width="4"/>
      <path d="M0 -160 L0 -70 M0 70 L0 160 M-160 0 L-70 0 M70 0 L160 0" stroke-linecap="round"/>
      <path d="M-38 40 L0 -52 L38 40 M-22 6 L22 6" stroke="#fff" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
    </g>
    <text x="${CW / 2}" y="${CH - 70}" text-anchor="middle" class="t-back">ARMARIS</text>
  </svg>`;
}

// ───────── Enveloppe HTML (tilt, glow, holo, slab)
export function cardHTML(skin, card = null, opts = {}) {
  const R = RARITIES[skin.r];
  const cls = ['card', `r${skin.r}`];
  if (card?.foil) cls.push('foil');
  if (card?.mp) cls.push('misprint');
  if (opts.small) cls.push('small');
  const svg = cardSVG(skin, card, opts);
  const html = `<div class="${cls.join(' ')}" style="--rc:${R.color};--rg:${R.glow}" data-tilt>
    <div class="card-inner">${svg}<div class="card-shine"></div>${card?.foil ? '<div class="card-foil"></div>' : ''}${card?.mp ? '<div class="misprint-tag">ERREUR D’IMPRESSION</div>' : ''}</div>
  </div>`;
  if (card?.g != null && !opts.noSlab) {
    return `<div class="slab ${card.g >= 10 ? 'pristine' : ''}" style="--rc:${R.color}">
      <div class="slab-label">
        <div class="slab-brand">ARMARIS GRADING<small>${esc(card.cert || '')}</small></div>
        <div class="slab-name">${esc(MODEL_BY_KEY[skin.m].name)}<br><b>${esc(skin.n)}</b></div>
        <div class="slab-grade"><b>${card.g % 1 ? card.g.toFixed(1) : card.g}</b><small>${esc(gradeLabel(card.g))}</small></div>
      </div>
      <div class="slab-window">${html}</div>
    </div>`;
  }
  return html;
}

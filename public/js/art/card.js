// Rendu des cartes en SVG : cadre de rareté, centrage réel, arme dessinée pièce par pièce (matériaux + ombrage),
// texture du skin, usure (écaillage, perte de couleur, taches, rayures), badges, carte erreur, slab gradé, dos luxe.
import { RARITIES, WEAR, BRAND } from '/shared/config.js';
import { MODEL_BY_KEY, STYLES, FINISHES, COLLECTION_BY_KEY, ART_FR, PATTERNS, CAMOS } from '/shared/catalog.js';
import { wearOf, fmtFloat, centeringLabel, gradeLabel, isExtremeFloat } from '/shared/rules.js';
import { describeSeed } from '/shared/patterns.js';
import { WEAPON_ART, WEAPON_BOX, PAINT_BOX } from './weapons.js';
import { skinTexture, rng } from './skins.js';
import { esc } from '../ui.js';

let uidN = 0;
const uid = () => `a${(++uidN).toString(36)}`;
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const F = (x) => Math.round(x * 10) / 10;

export const CW = 630, CH = 880, MARGIN = 48;

export function styleLabel(skin) {
  if (skin.st === 'art') return `${STYLES.art.fr} · ${ART_FR[skin.art] || ''}`;
  if (skin.st === 'geo') return `${STYLES.geo.fr} · ${PATTERNS[skin.p]}`;
  if (skin.st === 'camo') return `${STYLES.camo.fr} · ${CAMOS[skin.cm]}`;
  return STYLES[skin.st].fr;
}

// masque de bruit : blanc là où le bruit dépasse le seuil (≈ part couverte)
function noiseMask(id, freq, seed, cover, oct = 3) {
  const th = 0.62 - cover * 0.32;
  return `<filter id="${id}f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  14 0 0 0 ${(-14 * th).toFixed(2)}"/></filter>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="360"><rect width="1000" height="360" filter="url(#${id}f)"/></mask>`;
}

// ───────── Arme peinte (espace 1000 × 360)
export function weaponSVG(skin, card = null, opts = {}) {
  const id = uid();
  const { parts } = WEAPON_ART[skin.m];
  const float = card?.f ?? null;
  const pt = card?.pt ?? (skin.seed % 1000);
  const of = (k) => parts.filter((p) => p.k === k);
  const all = parts.filter((p) => !['line', 'hi', 'wire', 'tex', 'hole'].includes(p.k)).map((p) => p.d).join(' ');
  const paint = of('paint');
  const tex = skinTexture(skin, pt, `${id}t`);
  const r = rng(hash(String(card?.serial || skin.id)));

  // usure de la peinture
  let wearDefs = '', chipMask = '', wearOver = '';
  if (float != null && float > 0.05) {
    const sc = Array.from({ length: Math.floor(float * 38) }, () => {
      const x = r() * 1000, y = r() * 360, len = 20 + r() * 110, a = (r() - 0.5) * 0.8;
      return `M${F(x)} ${F(y)} l${F(Math.cos(a) * len)} ${F(Math.sin(a) * len)}`;
    }).join(' ');
    if (!opts.lite) {
      wearDefs += noiseMask(`${id}chip`, (0.02 + float * 0.025).toFixed(3), skin.seed % 997, Math.max(0, float - 0.15) * 0.72)
        + noiseMask(`${id}loss`, '.006', (skin.seed + 3) % 997, Math.min(1, float * 1.2), 2)
        + noiseMask(`${id}stain`, '.018', (skin.seed + 11) % 997, Math.max(0, float - 0.3) * 0.9);
      chipMask = `mask="url(#${id}chipi)"`;
      wearDefs += `<mask id="${id}chipi" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="360"><rect width="1000" height="360" fill="#fff"/><rect width="1000" height="360" fill="#000" mask="url(#${id}chip)"/></mask>`;
      wearOver = `<rect width="1000" height="360" fill="#8f8a80" mask="url(#${id}loss)" opacity="${F(Math.min(0.85, float * 1.1))}" style="mix-blend-mode:saturation"/>
        <rect width="1000" height="360" fill="#e9e1cf" mask="url(#${id}loss)" opacity="${F(float * 0.22)}"/>
        <rect width="1000" height="360" fill="#3b2412" mask="url(#${id}stain)" opacity="${F(Math.min(0.75, float * 0.9))}" style="mix-blend-mode:multiply"/>`;
    } else if (float > 0.3) {
      wearOver = Array.from({ length: Math.floor(float * 8) }, () => `<ellipse cx="${F(r() * 1000)}" cy="${F(r() * 360)}" rx="${F(20 + r() * 50)}" ry="${F(10 + r() * 24)}" fill="#3b2412" opacity="${F(0.2 + float * 0.3)}"/>`).join('');
    }
    wearOver += `<path d="${sc}" stroke="#f4f1ea" stroke-opacity="${F(0.2 + float * 0.35)}" stroke-width="1.6" fill="none"/>`;
  }

  const mat = (k, fill, extra = '') => of(k).map((p) => `<path d="${p.d}" fill="${fill}" fill-rule="evenodd" stroke="#050608" stroke-width="2.2" stroke-linejoin="round" ${extra}/><path d="${p.d}" fill="url(#${id}sh)" fill-rule="evenodd"/>`).join('');
  const glow = skin.r >= 5 ? `<path d="${all}" fill="none" stroke="${RARITIES[skin.r].glow}" stroke-width="10" opacity=".25" filter="url(#${id}gl)"/>` : '';

  return `<g class="weapon">
    <defs>${tex.defs}${wearDefs}
      <linearGradient id="${id}sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".28" stop-color="#fff" stop-opacity=".05"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>
      <linearGradient id="${id}me" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d737d"/><stop offset=".45" stop-color="#2d3138"/><stop offset="1" stop-color="#121418"/></linearGradient>
      <linearGradient id="${id}po" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3d45"/><stop offset="1" stop-color="#15171b"/></linearGradient>
      <linearGradient id="${id}st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fb"/><stop offset=".5" stop-color="#a7afba"/><stop offset="1" stop-color="#59616d"/></linearGradient>
      <linearGradient id="${id}br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a3"/><stop offset=".5" stop-color="#c0902f"/><stop offset="1" stop-color="#6b4a12"/></linearGradient>
      <pattern id="${id}wo" patternUnits="userSpaceOnUse" width="120" height="16"><rect width="120" height="16" fill="#6e3b1c"/><path d="M0 4 Q30 1 60 5 T120 3 M0 11 Q40 8 70 12 T120 10" stroke="#3e1d0a" stroke-width="2" fill="none"/></pattern>
      <radialGradient id="${id}gs" cx=".3" cy=".3" r=".9"><stop offset="0" stop-color="#d9fbff"/><stop offset=".4" stop-color="#3a8fb0"/><stop offset="1" stop-color="#05121c"/></radialGradient>
      <pattern id="${id}dots" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="2" cy="2" r="1.1" fill="#000" opacity=".55"/><circle cx="5.5" cy="5.5" r="1.1" fill="#fff" opacity=".07"/></pattern>
      <linearGradient id="${id}bare" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3c8d0"/><stop offset="1" stop-color="#6c727c"/></linearGradient>
      <clipPath id="${id}pc">${paint.map((p) => `<path d="${p.d}" fill-rule="evenodd" clip-rule="evenodd"/>`).join('')}</clipPath>
      ${skin.r >= 5 ? `<filter id="${id}gl" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>` : ''}
    </defs>
    ${glow}
    <path d="${all}" fill="#000" opacity=".4" transform="translate(10 16)" fill-rule="evenodd"/>
    ${mat('poly', `url(#${id}po)`)}${mat('wood', `url(#${id}wo)`)}${mat('brass', `url(#${id}br)`)}${mat('metal', `url(#${id}me)`)}
    ${of('wire').map((p) => `<path d="${p.d}" fill="none" stroke="#050608" stroke-width="15" stroke-linecap="round"/><path d="${p.d}" fill="none" stroke="#2d3138" stroke-width="10" stroke-linecap="round"/>`).join('')}
    ${paint.map((p) => `<path d="${p.d}" fill="url(#${id}bare)" fill-rule="evenodd"/>`).join('')}
    <g clip-path="url(#${id}pc)"><g ${chipMask}><g transform="${texFit(skin.m)}">${tex.body}</g>${wearOver}</g></g>
    ${paint.map((p) => `<path d="${p.d}" fill="url(#${id}sh)" fill-rule="evenodd" stroke="#050608" stroke-width="2.4" stroke-linejoin="round"/>`).join('')}
    ${of('tex').map((p) => `<path d="${p.d}" fill="url(#${id}dots)"/>`).join('')}
    ${of('hole').map((p) => `<path d="${p.d}" fill="#07080a" stroke="#000" stroke-width="1.5"/>`).join('')}
    ${mat('metal2', `url(#${id}me)`)}${mat('steel', `url(#${id}st)`)}${mat('glass', `url(#${id}gs)`)}
    ${of('line').map((p) => `<path d="${p.d}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/><path d="${p.d}" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="1" transform="translate(0 1.5)"/>`).join('')}
    ${of('hi').map((p) => `<path d="${p.d}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`).join('')}
  </g>`;
}

// la texture (1000 × 360) est cadrée sur la zone peinte du modèle (mise à l'échelle uniforme, « cover »)
function texFit(m) {
  const b = PAINT_BOX[m];
  const k = Math.max(b.w / 1000, b.h / 360) * 1.04;
  return `translate(${F(b.x + b.w / 2 - 500 * k)} ${F(b.y + b.h / 2 - 180 * k)}) scale(${k.toFixed(4)})`;
}

// cadre l'arme dans la fenêtre d'illustration
// (les couteaux sont inclinés pour occuper la fenêtre)
function fit(m, x0, y0, w0, h0) {
  const b = WEAPON_BOX[m];
  const a = MODEL_BY_KEY[m].cls === 'knife' ? -24 : 0;
  const ra = (Math.abs(a) * Math.PI) / 180;
  const bw = b.w * Math.cos(ra) + b.h * Math.sin(ra), bh = b.w * Math.sin(ra) + b.h * Math.cos(ra);
  const k = Math.min((w0 - 40) / bw, (h0 - 70) / bh);
  const cx = x0 + w0 / 2, cy = y0 + h0 / 2 - 6;
  return `translate(${F(cx)} ${F(cy)}) rotate(${a}) scale(${k.toFixed(4)}) translate(${F(-(b.x + b.w / 2))} ${F(-(b.y + b.h / 2))})`;
}

// ───────── Face complète d'une carte (cadre + panneau), coordonnées 630 × 880
function cardFace(skin, card, id, opts) {
  const R = RARITIES[skin.r];
  const model = MODEL_BY_KEY[skin.m];
  const col = COLLECTION_BY_KEY[skin.col];
  const L = card ? (MARGIN * card.cx) / 100 : MARGIN / 2;
  const T = card ? (MARGIN * card.cy) / 100 : MARGIN / 2;
  const PW = CW - MARGIN, PH = CH - MARGIN;
  const fid = `${id}${opts.suffix || ''}`;
  const frameStops = skin.r === 6
    ? '<stop offset="0" stop-color="#5ff3ff"/><stop offset=".33" stop-color="#ff7ae6"/><stop offset=".66" stop-color="#ffe46b"/><stop offset="1" stop-color="#5ff3ff"/>'
    : `<stop offset="0" stop-color="${R.color}"/><stop offset=".45" stop-color="#fff" stop-opacity=".85"/><stop offset=".5" stop-color="${R.color}"/><stop offset="1" stop-color="#15161a"/>`;

  const bx = 26, bw = PW - 52, by = 690;
  let floatBar = `<rect x="${bx - 2}" y="${by - 2}" width="${bw + 4}" height="14" rx="7" fill="#000" opacity=".5"/>` +
    WEAR.tiers.map((t, i) => `<rect x="${F(bx + t.min * bw)}" y="${by}" width="${F((t.max - t.min) * bw)}" height="10" fill="${t.color}" opacity="${card ? 0.95 : 0.3}" ${i === 0 ? 'rx="5"' : ''}/>`).join('');
  let floatTxt;
  const seed = card ? describeSeed(skin, card.pt) : null;
  if (card) {
    const fx = bx + card.f * bw, w = wearOf(card.f);
    floatBar += `<circle cx="${F(fx)}" cy="${by + 5}" r="11" fill="${w.color}" opacity=".35"/><circle cx="${F(fx)}" cy="${by + 5}" r="7" fill="#fff" stroke="${w.color}" stroke-width="3"/>`;
    floatTxt = `<text x="26" y="${by - 20}" class="t-lab">FLOAT</text><text x="${PW - 26}" y="${by - 18}" class="t-val" text-anchor="end" fill="${w.color}">${fmtFloat(card.f)}</text>
      <text x="26" y="${by + 46}" class="t-sub"><tspan fill="${w.color}" font-weight="800">${w.key}</tspan> · ${esc(w.fr)}</text>
      <text x="${PW - 26}" y="${by + 46}" class="t-sub" text-anchor="end">Centrage ${centeringLabel(card.cx, card.cy)}</text>`;
  } else {
    floatBar += `<rect x="${F(bx + skin.fmin * bw)}" y="${by - 4}" width="${F((skin.fmax - skin.fmin) * bw)}" height="18" rx="9" fill="none" stroke="#fff" stroke-width="2.5"/>`;
    floatTxt = `<text x="26" y="${by - 20}" class="t-lab">PLAGE DE FLOAT</text><text x="${PW - 26}" y="${by - 18}" class="t-val" text-anchor="end">${skin.fmin.toFixed(2)} – ${skin.fmax.toFixed(2)}</text>
      <text x="26" y="${by + 46}" class="t-sub">${esc(FINISHES[skin.f])}</text>`;
  }

  const badges = [];
  if (card?.tr != null) badges.push(['TRAQUEUR ' + String(card.tr).padStart(4, '0'), '#ff8a3d']);
  if (card?.foil) badges.push(['HOLO', '#5ff3ff']);
  if (card && isExtremeFloat(card.f)) badges.push(['FLOAT EXTRÊME', '#ffe46b']);
  if (seed?.tier) badges.push([seed.tierFr.toUpperCase(), '#ffd76a']);
  let bxPos = 32;
  const badgeSvg = badges.map(([t, c]) => {
    const w = t.length * 11.5 + 24;
    const s = `<g transform="translate(${bxPos} 80)"><rect width="${w}" height="30" rx="15" fill="#000" fill-opacity=".62" stroke="${c}" stroke-width="2"/><text x="${w / 2}" y="21" text-anchor="middle" class="t-badge" fill="${c}">${t}</text></g>`;
    bxPos += w + 8; return s;
  }).join('');

  const gems = Array.from({ length: skin.r + 1 }, (_, i) => `<path d="M${PW - 32 - i * 22} 790 l8 -10 l8 10 l-8 10 Z" fill="${R.color}" stroke="#000" stroke-width="1"/>`).join('');
  const raysOp = 0.04 + skin.r * 0.03;
  const [t1, t2] = col.theme;
  const styleTxt = `${styleLabel(skin)}${card?.pt != null ? ` · Graine ${card.pt}` : ''}`;

  return `<g>
    <defs>
      <linearGradient id="${fid}fr" x1="0" y1="0" x2="1" y2="1">${frameStops}</linearGradient>
      <linearGradient id="${fid}pn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1d26"/><stop offset=".62" stop-color="#101118"/><stop offset="1" stop-color="${R.color}" stop-opacity=".32"/></linearGradient>
      <radialGradient id="${fid}ab" cx=".5" cy=".5" r=".8"><stop offset="0" stop-color="${t1}" stop-opacity=".55"/><stop offset=".5" stop-color="${t2}" stop-opacity=".35"/><stop offset="1" stop-color="#07080c"/></radialGradient>
      <pattern id="${fid}gr" patternUnits="userSpaceOnUse" width="28" height="28"><path d="M28 0 L0 0 0 28" fill="none" stroke="#fff" stroke-opacity=".05"/></pattern>
      <clipPath id="${fid}cl"><rect x="16" y="64" width="${PW - 32}" height="430" rx="16"/></clipPath>
    </defs>
    <rect width="${CW}" height="${CH}" rx="32" fill="url(#${fid}fr)"/>
    <rect x="5" y="5" width="${CW - 10}" height="${CH - 10}" rx="28" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"/>
    <g transform="translate(${F(L)} ${F(T)})">
      <rect width="${PW}" height="${PH}" rx="20" fill="url(#${fid}pn)" stroke="#000" stroke-opacity=".6" stroke-width="2"/>
      <text x="26" y="46" class="t-model">${esc(model.name.toUpperCase())}</text>
      <text x="${PW - 26}" y="46" class="t-rar" text-anchor="end" fill="${R.color}" style="filter:drop-shadow(0 0 6px ${R.glow})">${esc(R.fr.toUpperCase())}</text>
      <g clip-path="url(#${fid}cl)">
        <rect x="16" y="64" width="${PW - 32}" height="430" fill="#0a0b10"/>
        <rect x="16" y="64" width="${PW - 32}" height="430" fill="url(#${fid}ab)"/>
        <rect x="16" y="64" width="${PW - 32}" height="430" fill="url(#${fid}gr)"/>
        <g opacity="${raysOp}" transform="translate(${PW / 2} 280)">${Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L-26 -440 L26 -440 Z" fill="#fff" transform="rotate(${i * 30})"/>`).join('')}</g>
        <text x="${PW - 36}" y="476" class="t-glyph" text-anchor="end" fill="#fff" fill-opacity=".05">${esc(model.glyph)}</text>
        <ellipse cx="${PW / 2}" cy="440" rx="230" ry="14" fill="#000" opacity=".5"/>
        <g transform="${fit(skin.m, 16, 64, PW - 32, 430)}">${weaponSVG(skin, card, opts)}</g>
        ${badgeSvg}
      </g>
      <rect x="16" y="64" width="${PW - 32}" height="430" rx="16" fill="none" stroke="${R.color}" stroke-opacity=".7" stroke-width="2"/>
      <rect x="16" y="508" width="${PW - 32}" height="110" rx="14" fill="#000" fill-opacity=".38" stroke="${R.color}" stroke-opacity=".35"/>
      <text x="${PW / 2}" y="556" text-anchor="middle" class="t-name" textLength="${Math.min(PW - 70, skin.n.length * 25)}" lengthAdjust="spacingAndGlyphs">${esc(skin.n)}</text>
      <text x="${PW / 2}" y="586" text-anchor="middle" class="t-sub">${esc(model.clsFr)} · <tspan fill="${t1}" font-weight="700">${esc(col.fr)}</tspan></text>
      <text x="${PW / 2}" y="608" text-anchor="middle" class="t-sub2" fill="${seed?.tier ? '#ffd76a' : '#8f95a8'}">${esc(styleTxt)}${seed ? ` · ${esc(seed.label)}` : ''}</text>
      ${floatTxt}
      ${floatBar}
      <line x1="26" x2="${PW - 26}" y1="756" y2="756" stroke="#fff" stroke-opacity=".1"/>
      <text x="26" y="796" class="t-serial">${card?.serial ? esc(card.serial) : esc(skin.id.toUpperCase())}</text>
      ${gems}
    </g>
  </g>`;
}

// ───────── Usure visible de la carte (rayures, coins blanchis, perte de couleur, taches, pli)
function cardWear(card, id, lite) {
  const f = card.f;
  if (f < 0.04) return '';
  const r = rng(hash(card.serial || String(card.id || 0)));
  let s = '', defs = '';
  if (!lite && f > 0.12) {
    defs = `<filter id="${id}cf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008" numOctaves="2" seed="${Math.floor(r() * 999)}"/>
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  12 0 0 0 ${(-12 * (0.62 - f * 0.28)).toFixed(2)}"/></filter>
      <mask id="${id}cm" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" filter="url(#${id}cf)"/></mask>
      <filter id="${id}sf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" seed="${Math.floor(r() * 999)}"/>
        <feColorMatrix values="0 0 0 0 .32  0 0 0 0 .2  0 0 0 0 .09  6 0 0 0 ${(-6 * (0.74 - f * 0.16)).toFixed(2)}"/><feGaussianBlur stdDeviation="1.5"/></filter>`;
    s += `<rect width="${CW}" height="${CH}" fill="#9a958a" mask="url(#${id}cm)" opacity="${F(Math.min(0.8, f))}" style="mix-blend-mode:saturation"/>
      <rect width="${CW}" height="${CH}" fill="#efe6d2" mask="url(#${id}cm)" opacity="${F(f * 0.18)}"/>`;
    if (f > 0.3) s += `<rect width="${CW}" height="${CH}" filter="url(#${id}sf)" opacity="${F(Math.min(0.55, f * 0.6))}" style="mix-blend-mode:multiply"/>`;
  } else if (f > 0.4) {
    for (let i = 0; i < Math.floor(f * 6); i++) s += `<ellipse cx="${F(r() * CW)}" cy="${F(r() * CH)}" rx="${F(20 + r() * 50)}" ry="${F(14 + r() * 30)}" fill="#6b4a2a" opacity="${F(0.08 + r() * 0.14)}"/>`;
  }
  const n = Math.floor(f * 40);
  for (let i = 0; i < n; i++) {
    const x = r() * CW, y = r() * CH, len = 20 + r() * 110 * (0.4 + f), a = r() * Math.PI;
    s += `<path d="M${F(x)} ${F(y)} q${F(Math.cos(a) * len * 0.5)} ${F(Math.sin(a) * len * 0.5 + (r() - 0.5) * 12)} ${F(Math.cos(a) * len)} ${F(Math.sin(a) * len)}" stroke="#fff" stroke-opacity="${F(0.1 + r() * 0.22)}" stroke-width="${F(0.6 + r() * 1.3)}" fill="none"/>`;
  }
  const dash = Array.from({ length: 12 }, () => Math.round(4 + r() * 60 * (1.2 - f))).join(' ');
  s += `<rect x="3" y="3" width="${CW - 6}" height="${CH - 6}" rx="30" fill="none" stroke="#f4f1ea" stroke-opacity="${F(Math.min(0.7, f))}" stroke-width="${F(3 + f * 8)}" stroke-linecap="round" stroke-dasharray="${dash}"/>`;
  if (f > 0.3) for (const [cx, cy] of [[14, 14], [CW - 14, 14], [14, CH - 14], [CW - 14, CH - 14]]) s += `<circle cx="${cx}" cy="${cy}" r="${F(6 + f * 18 * r())}" fill="#f4f1ea" opacity="${F(0.3 + f * 0.45)}"/>`;
  if (f > 0.62) {
    const y1 = 100 + r() * 300, y2 = y1 + 150 + r() * 400;
    s += `<path d="M0 ${F(y1)} L${CW} ${F(y2)}" stroke="#000" stroke-opacity=".32" stroke-width="5"/><path d="M0 ${F(y1 + 4)} L${CW} ${F(y2 + 4)}" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>`;
  }
  return `<defs>${defs}</defs><g class="wear" pointer-events="none">${s}</g>`;
}

/**
 * SVG complet d'une carte. skin : entrée du catalogue. card : instance (ou null pour le catalogue).
 * opts.lite : rendu allégé (grilles denses) ; opts.misprintSkin : skin de la 2e moitié.
 */
export function cardSVG(skin, card = null, opts = {}) {
  const id = uid();
  let inner;
  if (card?.mp && opts.misprintSkin) {
    inner = `<g transform="translate(-14 ${CH / 2 + 10})">${cardFace(skin, card, id, { ...opts, suffix: 'a' })}</g>
      <g transform="translate(10 ${-CH / 2 + 10})">${cardFace(opts.misprintSkin, { ...card, serial: '', pt: null }, id, { ...opts, suffix: 'b' })}</g>
      <rect x="0" y="${CH / 2 + 2}" width="${CW}" height="16" fill="#0b0c10" opacity=".55"/>`;
  } else {
    inner = cardFace(skin, card, id, opts);
  }
  return `<svg class="card-svg" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(MODEL_BY_KEY[skin.m].name)} | ${esc(skin.n)}">
    <defs><clipPath id="${id}clip"><rect width="${CW}" height="${CH}" rx="32"/></clipPath></defs>
    <g clip-path="url(#${id}clip)">
      <rect width="${CW}" height="${CH}" fill="#0b0c10"/>
      ${inner}
      ${card ? cardWear(card, id, opts.lite) : ''}
    </g>
  </svg>`;
}

// ───────── Dos de carte « luxe » : laque noire, guilloché doré, médaillon 무
export function cardBack() {
  const id = uid();
  const rosette = Array.from({ length: 36 }, (_, i) => `<ellipse rx="190" ry="72" transform="rotate(${i * 5})" fill="none" stroke="url(#${id}g)" stroke-width="1.1" opacity=".55"/>`).join('');
  const corner = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 C30 0 44 10 50 34 M0 0 C0 30 10 44 34 50 M12 12 C26 14 34 22 36 36" fill="none" stroke="url(#${id}g)" stroke-width="3"/><circle cx="18" cy="18" r="5" fill="url(#${id}g)"/></g>`;
  return `<svg class="card-svg" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c1a22"/><stop offset=".5" stop-color="#0b0a0f"/><stop offset="1" stop-color="#17121a"/></linearGradient>
      <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c2"/><stop offset=".35" stop-color="#e0b54a"/><stop offset=".65" stop-color="#8a6a1c"/><stop offset="1" stop-color="#f3d27a"/></linearGradient>
      <radialGradient id="${id}m" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#2a2430"/><stop offset="1" stop-color="#0a090d"/></radialGradient>
      <pattern id="${id}p" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(45)"><path d="M0 9 H18" stroke="#e0b54a" stroke-opacity=".06"/></pattern>
    </defs>
    <rect width="${CW}" height="${CH}" rx="32" fill="url(#${id}b)"/>
    <rect width="${CW}" height="${CH}" rx="32" fill="url(#${id}p)"/>
    <rect x="22" y="22" width="${CW - 44}" height="${CH - 44}" rx="22" fill="none" stroke="url(#${id}g)" stroke-width="3"/>
    <rect x="34" y="34" width="${CW - 68}" height="${CH - 68}" rx="16" fill="none" stroke="url(#${id}g)" stroke-width="1.2" opacity=".7"/>
    ${corner(46, 46, 0)}${corner(CW - 46, 46, 90)}${corner(CW - 46, CH - 46, 180)}${corner(46, CH - 46, 270)}
    <g transform="translate(${CW / 2} ${CH / 2 - 20})">${rosette}
      <circle r="112" fill="url(#${id}m)" stroke="url(#${id}g)" stroke-width="5"/>
      <circle r="98" fill="none" stroke="url(#${id}g)" stroke-width="1.2" stroke-dasharray="3 5"/>
      <text y="38" text-anchor="middle" class="t-glyphko" fill="url(#${id}g)">${BRAND.glyph}</text>
    </g>
    <text x="${CW / 2}" y="${CH - 112}" text-anchor="middle" class="t-back" fill="url(#${id}g)">${BRAND.name.toUpperCase()}</text>
    <text x="${CW / 2}" y="${CH - 82}" text-anchor="middle" class="t-backsub" fill="#e0b54a" fill-opacity=".6">${BRAND.ko}</text>
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
        <div class="slab-brand">MUGIGO GRADING<small>${esc(card.cert || '')}</small></div>
        <div class="slab-name">${esc(MODEL_BY_KEY[skin.m].name)}<br><b>${esc(skin.n)}</b></div>
        <div class="slab-grade"><b>${card.g % 1 ? card.g.toFixed(1) : card.g}</b><small>${esc(gradeLabel(card.g))}</small></div>
      </div>
      <div class="slab-window">${html}</div>
    </div>`;
  }
  return html;
}

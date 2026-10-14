// Rendu des cartes en SVG : cadre de rareté, centrage réel, arme dessinée pièce par pièce (matériaux + ombrage),
// texture du skin, usure (écaillage, perte de couleur, taches, rayures), badges, carte erreur, slab gradé, dos luxe.
import { RARITIES, BRAND } from '/shared/config.js';
import { MODEL_BY_KEY, STYLES, COLLECTION_BY_KEY, ART_FR, PATTERNS, CAMOS } from '/shared/catalog.js';
import { wearOf, gradeLabel } from '/shared/rules.js';
import { WEAPON_ART, WEAPON_BOX, PAINT_BOX } from './weapons.js';
import { skinTexture, rng } from './skins.js';
import { esc } from '../ui.js';
import { t, L as loc } from '/shared/i18n.js';

let uidN = 0;
const uid = () => `a${(++uidN).toString(36)}`;
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const F = (x) => Math.round(x * 10) / 10;

export const CW = 630, CH = 880, MARGIN = 48;

export function styleLabel(skin) {
  if (skin.st === 'art') return `${loc(STYLES.art)} · ${ART_FR[skin.art] ? t(ART_FR[skin.art]) : ''}`;
  if (skin.st === 'geo') return `${loc(STYLES.geo)} · ${t(PATTERNS[skin.p])}`;
  if (skin.st === 'camo') return `${loc(STYLES.camo)} · ${t(CAMOS[skin.cm])}`;
  return loc(STYLES[skin.st]);
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
  const all = parts.filter((p) => !['line', 'hi', 'wire', 'tex', 'hole', 'shade'].includes(p.k)).map((p) => p.d).join(' ');
  const paint = of('paint');
  const tex = skinTexture(skin, pt, `${id}t`);

  // usure de la peinture : tout est continu en fonction du float (aucun palier).
  //  · écaillage : part des arêtes des pièces peintes puis gagne le centre (bruit + distance au bord)
  //  · perte de couleur et salissure : voiles doux qui montent progressivement
  //  · rayures fines : leur nombre croît avec le float, les premières restent en place
  let wearDefs = '', chipMask = '', wearOver = '';
  if (float != null && float > 0.004) {
    const w = Math.min(1, float);
    const sr = rng(hash(`${card?.serial || skin.id}:scr`));
    const sc = Array.from({ length: Math.round(w * 46) }, () => {
      const x = sr() * 1000, y = 20 + sr() * 320, len = 8 + sr() * 70, a = (sr() - 0.5) * 0.5;
      return `M${F(x)} ${F(y)} q${F(Math.cos(a) * len * 0.5)} ${F((sr() - 0.5) * 6)} ${F(Math.cos(a) * len)} ${F(Math.sin(a) * len)}`;
    }).join(' ');
    const ns = skin.seed % 997;
    if (!opts.lite) {
      // écaillage : bruit − intérieur (flou de la forme peinte) + décalage qui croît avec le float
      const C = -0.1 + Math.pow(w, 0.8) * 0.52;
      wearDefs += `<filter id="${id}chf" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="b"/><feColorMatrix in="b" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="bi"/>
          <feTurbulence type="fractalNoise" baseFrequency=".045 .06" numOctaves="4" seed="${ns}" result="n"/>
          <feComposite in="n" in2="bi" operator="arithmetic" k2="1" k3="-.55" k4="${C.toFixed(3)}" result="m"/>
          <feColorMatrix in="m" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  16 0 0 0 -7.2"/><feComposite in2="SourceAlpha" operator="in"/></filter>
        <filter id="${id}lsf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .008" numOctaves="3" seed="${(ns + 3) % 997}"/>
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -.55"/></filter>
        <filter id="${id}stf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="4" seed="${(ns + 11) % 997}"/>
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  5 0 0 0 ${(-3.1 + w * 1.4).toFixed(2)}"/><feGaussianBlur stdDeviation="1.2"/></filter>
        <mask id="${id}chip" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="360"><g filter="url(#${id}chf)">${paint.map((p) => `<path d="${p.d}" fill="#fff" fill-rule="evenodd"/>`).join('')}</g></mask>
        <mask id="${id}chipi" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="360"><rect width="1000" height="360" fill="#fff"/><rect width="1000" height="360" fill="#000" mask="url(#${id}chip)"/></mask>
        <mask id="${id}loss" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="360"><rect width="1000" height="360" filter="url(#${id}lsf)"/></mask>
        <mask id="${id}stain" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="360"><rect width="1000" height="360" filter="url(#${id}stf)"/></mask>`;
      chipMask = `mask="url(#${id}chipi)"`;
      wearOver = `<rect width="1000" height="360" fill="#8f8a80" mask="url(#${id}loss)" opacity="${Math.min(0.9, 1.2 * Math.pow(w, 0.85)).toFixed(3)}" style="mix-blend-mode:saturation"/>
        <rect width="1000" height="360" fill="#ece4d2" mask="url(#${id}loss)" opacity="${(w * w * 0.22).toFixed(3)}"/>
        <rect width="1000" height="360" fill="#3a2614" mask="url(#${id}stain)" opacity="${(Math.pow(w, 1.3) * 0.7).toFixed(3)}" style="mix-blend-mode:multiply"/>`;
    } else {
      wearOver = `<rect width="1000" height="360" fill="#8f8a80" opacity="${(w * 0.5).toFixed(3)}" style="mix-blend-mode:saturation"/>`;
    }
    wearOver += `<path d="${sc}" stroke="#f4f1ea" stroke-opacity="${(0.12 + w * 0.4).toFixed(3)}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`;
  }

  // rendu « réaliste » : pas de contour épais, dégradés à reflet spéculaire, biseau intérieur, grain, ombre douce
  let ci = 0;
  const clipDefs = [];
  const edge = (d) => { const c = `${id}c${ci++}`; clipDefs.push(`<clipPath id="${c}"><path d="${d}" fill-rule="evenodd" clip-rule="evenodd"/></clipPath>`); return `<g clip-path="url(#${c})"><path d="${d}" fill="none" stroke="url(#${id}eg)" stroke-width="5"/></g>`; };
  const mat = (k, fill) => of(k).map((p) => `<path d="${p.d}" fill="${fill}" fill-rule="evenodd" stroke="#000" stroke-opacity=".6" stroke-width="1.2" stroke-linejoin="round"/>${opts.lite ? '' : edge(p.d)}`).join('');
  const glow = skin.r >= 5 && !opts.lite ? `<path d="${all}" fill="none" stroke="${RARITIES[skin.r].glow}" stroke-width="10" opacity=".22" filter="url(#${id}gl)"/>` : '';
  const grad = (gid, stops) => `<linearGradient id="${id}${gid}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  const body = `
    ${mat('rubber', `url(#${id}ru)`)}${mat('poly', `url(#${id}po)`)}${mat('wood', `url(#${id}wo)`)}${mat('brass', `url(#${id}br)`)}${mat('metal', `url(#${id}me)`)}
    ${of('wire').map((p) => `<path d="${p.d}" fill="none" stroke="#050608" stroke-width="13" stroke-linecap="round"/><path d="${p.d}" fill="none" stroke="url(#${id}me)" stroke-width="10" stroke-linecap="round"/>`).join('')}
    ${paint.map((p) => `<path d="${p.d}" fill="url(#${id}bare)" fill-rule="evenodd"/>`).join('')}
    <g clip-path="url(#${id}pc)"><g ${chipMask}><g transform="${texFit(skin.m)}">${tex.body}</g>${wearOver}</g></g>
    ${paint.map((p) => `<path d="${p.d}" fill="url(#${id}sh)" fill-rule="evenodd" stroke="#000" stroke-opacity=".65" stroke-width="1.3" stroke-linejoin="round"/>${opts.lite ? '' : edge(p.d)}`).join('')}
    ${of('tex').map((p) => `<path d="${p.d}" fill="url(#${id}ck)"/>`).join('')}
    ${of('hole').map((p) => `<path d="${p.d}" fill="url(#${id}ho)" stroke="#000" stroke-opacity=".8" stroke-width="1"/>`).join('')}
    ${of('shade').map((p) => `<path d="${p.d}" fill="#000" opacity=".45"/><path d="${p.d}" fill="none" stroke="#fff" stroke-opacity=".12" transform="translate(0 1.5)"/>`).join('')}
    ${mat('metal2', `url(#${id}me)`)}${mat('steel', `url(#${id}st)`)}${mat('glass', `url(#${id}gs)`)}
    ${of('line').map((p) => `<path d="${p.d}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1.6"/><path d="${p.d}" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1" transform="translate(0 1.4)"/>`).join('')}
    ${of('hi').map((p) => `<path d="${p.d}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.6" stroke-linecap="round"/>`).join('')}`;

  return `<g class="weapon">
    <defs>${tex.defs}${wearDefs}
      ${grad('sh', [[0, '#fff', 0.42], [0.1, '#fff', 0.14], [0.26, '#fff', 0], [0.6, '#000', 0], [1, '#000', 0.48]])}
      ${grad('eg', [[0, '#fff', 0.5], [0.25, '#fff', 0.08], [0.7, '#fff', 0], [1, '#000', 0.4]])}
      ${grad('me', [[0, '#3a3f47'], [0.07, '#a3aab5'], [0.16, '#5c636e'], [0.5, '#2b2f36'], [0.85, '#16181c'], [1, '#08090b']])}
      ${grad('po', [[0, '#4a4e57'], [0.08, '#5f636d'], [0.2, '#2f3239'], [0.75, '#1a1c21'], [1, '#0c0d10']])}
      ${grad('ru', [[0, '#3a3c41'], [0.15, '#45484e'], [0.4, '#26282c'], [1, '#101113']])}
      ${grad('st', [[0, '#ffffff'], [0.14, '#e6eaef'], [0.42, '#98a1ad'], [0.62, '#cfd5dc'], [0.85, '#7a828e'], [1, '#4b525c']])}
      ${grad('br', [[0, '#fff3c2'], [0.18, '#e6bb5f'], [0.5, '#b07c22'], [0.8, '#7c5512'], [1, '#4d330a']])}
      ${grad('ho', [[0, '#000'], [1, '#1c1e23']])}
      ${grad('bare', [[0, '#e3e7ec'], [0.15, '#b9bfc8'], [0.6, '#7c838d'], [1, '#4a5058']])}
      <pattern id="${id}wo" patternUnits="userSpaceOnUse" width="160" height="22"><rect width="160" height="22" fill="#5e3016"/><path d="M0 5 Q40 1 80 6 T160 4 M0 12 Q50 8 90 13 T160 11 M0 18 Q30 16 70 19 T160 17" stroke="#3a1a08" stroke-width="1.6" fill="none"/><path d="M0 9 Q60 6 110 10 T160 8" stroke="#8a4f26" stroke-width="1" fill="none" opacity=".6"/></pattern>
      <pattern id="${id}ck" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><rect width="7" height="7" fill="#000" opacity=".22"/><path d="M0 0 H7 M0 0 V7" stroke="#fff" stroke-opacity=".09" stroke-width="1"/></pattern>
      <radialGradient id="${id}gs" cx=".3" cy=".3" r=".9"><stop offset="0" stop-color="#e6fdff"/><stop offset=".3" stop-color="#5fb7d6"/><stop offset=".7" stop-color="#123447"/><stop offset="1" stop-color="#02080d"/></radialGradient>
      <clipPath id="${id}pc">${paint.map((p) => `<path d="${p.d}" fill-rule="evenodd" clip-rule="evenodd"/>`).join('')}</clipPath>
      <clipPath id="${id}all"><path d="${all}"/></clipPath>
      ${opts.lite ? '' : `<filter id="${id}sb" x="-10%" y="-20%" width="120%" height="150%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="${id}gr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 -1.4 1"/></filter>`}
      ${skin.r >= 5 && !opts.lite ? `<filter id="${id}gl" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>` : ''}
    </defs>
    ${glow}
    <path d="${all}" fill="#000" opacity="${opts.lite ? 0.3 : 0.6}" transform="translate(6 14)" fill-rule="evenodd" ${opts.lite ? '' : `filter="url(#${id}sb)"`}/>
    ${body}
    ${opts.lite ? '' : `<rect width="1000" height="360" clip-path="url(#${id}all)" filter="url(#${id}gr)" opacity=".1" style="mix-blend-mode:overlay"/>`}
    <defs>${clipDefs.join('')}</defs>
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

// ───────── Forme de rareté (une forme par rang plutôt qu'un nombre de losanges)
// cercle · triangle · losange · pentagone · hexagone · étoile · étoile à huit branches
const poly = (n, r, rot = -90, inner = null) => {
  const pts = [];
  const k = inner ? n * 2 : n;
  for (let i = 0; i < k; i++) {
    const a = ((rot + (360 / k) * i) * Math.PI) / 180, rr = inner && i % 2 ? inner : r;
    pts.push(`${F(Math.cos(a) * rr)} ${F(Math.sin(a) * rr)}`);
  }
  return `M${pts.join(' L')} Z`;
};
export const RARITY_SHAPES = [
  (r) => `M${-r} 0 a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`,
  (r) => poly(3, r * 1.15, -90),
  (r) => poly(4, r * 1.15, -90),
  (r) => poly(5, r * 1.1, -90),
  (r) => poly(6, r * 1.08, 0),
  (r) => poly(5, r * 1.3, -90, r * 0.55),
  (r) => poly(8, r * 1.35, -90, r * 0.5),
];
export function rarityShape(rar, size = 12, { stroke = '#000' } = {}) {
  const R = RARITIES[rar];
  return `<path d="${RARITY_SHAPES[rar](size)}" fill="${R.color}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px ${R.glow})"/>`;
}
export const rarityIcon = (rar, px = 14) => `<svg class="rar-ico" width="${px}" height="${px}" viewBox="-16 -16 32 32" aria-hidden="true">${rarityShape(rar, 11)}</svg>`;

// ───────── Face complète d'une carte (cadre + panneau), coordonnées 630 × 880
function cardFace(skin, card, id, opts) {
  const R = RARITIES[skin.r];
  const model = MODEL_BY_KEY[skin.m];
  const col = COLLECTION_BY_KEY[skin.col];
  const name = loc(skin, 'n');
  const L = card ? (MARGIN * card.cx) / 100 : MARGIN / 2;
  const T = card ? (MARGIN * card.cy) / 100 : MARGIN / 2;
  const PW = CW - MARGIN, PH = CH - MARGIN;
  const fid = `${id}${opts.suffix || ''}`;
  const frameStops = skin.r === 6
    ? '<stop offset="0" stop-color="#5ff3ff"/><stop offset=".33" stop-color="#ff7ae6"/><stop offset=".66" stop-color="#ffe46b"/><stop offset="1" stop-color="#5ff3ff"/>'
    : `<stop offset="0" stop-color="${R.color}"/><stop offset=".45" stop-color="#fff" stop-opacity=".85"/><stop offset=".5" stop-color="${R.color}"/><stop offset="1" stop-color="#15161a"/>`;

  // fenêtre d'illustration et cartouche du nom
  const AY = 64, AH = 540, NY = AY + AH + 16, NH = 112;

  const badges = [];
  if (card?.tr != null) badges.push([t('TRAQUEUR {n}', { n: String(card.tr).padStart(4, '0') }), '#ff8a3d']);
  if (card?.foil) badges.push([t('HOLO'), '#5ff3ff']);
  let bxPos = 32;
  const badgeSvg = badges.map(([t, c]) => {
    const w = t.length * 11.5 + 24;
    const s = `<g transform="translate(${bxPos} ${AY + 16})"><rect width="${w}" height="30" rx="15" fill="#000" fill-opacity=".62" stroke="${c}" stroke-width="2"/><text x="${w / 2}" y="21" text-anchor="middle" class="t-badge" fill="${c}">${t}</text></g>`;
    bxPos += w + 8; return s;
  }).join('');

  // état général : seulement le code à 2 lettres
  const w = card ? wearOf(card.f) : null;
  const wearTag = w ? `<g transform="translate(26 22)"><rect width="58" height="34" rx="9" fill="#000" fill-opacity=".45" stroke="${w.color}" stroke-width="2"/>
    <text x="29" y="25" text-anchor="middle" class="t-wear" fill="${w.color}">${w.key}</text></g>` : '';

  const raysOp = 0.04 + skin.r * 0.03;
  const [t1, t2] = col.theme;

  return `<g>
    <defs>
      <linearGradient id="${fid}fr" x1="0" y1="0" x2="1" y2="1">${frameStops}</linearGradient>
      <linearGradient id="${fid}pn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1d26"/><stop offset=".62" stop-color="#101118"/><stop offset="1" stop-color="${R.color}" stop-opacity=".32"/></linearGradient>
      <radialGradient id="${fid}ab" cx=".5" cy=".5" r=".8"><stop offset="0" stop-color="${t1}" stop-opacity=".55"/><stop offset=".5" stop-color="${t2}" stop-opacity=".35"/><stop offset="1" stop-color="#07080c"/></radialGradient>
      <pattern id="${fid}gr" patternUnits="userSpaceOnUse" width="28" height="28"><path d="M28 0 L0 0 0 28" fill="none" stroke="#fff" stroke-opacity=".05"/></pattern>
      <clipPath id="${fid}cl"><rect x="16" y="${AY}" width="${PW - 32}" height="${AH}" rx="16"/></clipPath>
      ${opts.lite ? '' : `<filter id="${fid}sg" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>`}
    </defs>
    <rect width="${CW}" height="${CH}" rx="32" fill="url(#${fid}fr)"/>
    <rect x="5" y="5" width="${CW - 10}" height="${CH - 10}" rx="28" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"/>
    <g transform="translate(${F(L)} ${F(T)})">
      <rect width="${PW}" height="${PH}" rx="20" fill="url(#${fid}pn)" stroke="#000" stroke-opacity=".6" stroke-width="2"/>
      ${wearTag || `<text x="26" y="46" class="t-model">${esc(model.name.toUpperCase())}</text>`}
      <text x="${PW - 26}" y="46" class="t-rar" text-anchor="end" fill="${R.color}" style="filter:drop-shadow(0 0 6px ${R.glow})">${esc(loc(R).toUpperCase())}</text>
      <g clip-path="url(#${fid}cl)">
        <rect x="16" y="${AY}" width="${PW - 32}" height="${AH}" fill="#0a0b10"/>
        <rect x="16" y="${AY}" width="${PW - 32}" height="${AH}" fill="url(#${fid}ab)"/>
        <rect x="16" y="${AY}" width="${PW - 32}" height="${AH}" fill="url(#${fid}gr)"/>
        <g opacity="${raysOp}" transform="translate(${PW / 2} ${AY + AH * 0.5})">${Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L-26 -480 L26 -480 Z" fill="#fff" transform="rotate(${i * 30})"/>`).join('')}</g>
        <g class="colsym" transform="translate(${PW / 2} ${AY + AH / 2})">
          ${opts.lite ? '' : `<text y="0" dy=".36em" text-anchor="middle" class="t-colsym" fill="none" stroke="${t1}" stroke-width="10" opacity=".35" filter="url(#${fid}sg)">${esc(col.sym)}</text>`}
          <text y="0" dy=".36em" text-anchor="middle" class="t-colsym" fill="${t1}" fill-opacity=".05" stroke-width="2.5" stroke-opacity=".5" style="stroke:color-mix(in srgb, ${t1} 75%, #fff)">${esc(col.sym)}</text>
        </g>
        <ellipse cx="${PW / 2}" cy="${AY + AH - 66}" rx="230" ry="14" fill="#000" opacity=".5"/>
        <g transform="${fit(skin.m, 16, AY, PW - 32, AH)}">${weaponSVG(skin, card, opts)}</g>
        ${badgeSvg}
      </g>
      <rect x="16" y="${AY}" width="${PW - 32}" height="${AH}" rx="16" fill="none" stroke="${R.color}" stroke-opacity=".7" stroke-width="2"/>
      <rect x="16" y="${NY}" width="${PW - 32}" height="${NH}" rx="14" fill="#000" fill-opacity=".38" stroke="${R.color}" stroke-opacity=".35"/>
      <text x="${PW / 2}" y="${NY + 54}" text-anchor="middle" class="t-name" textLength="${Math.min(PW - 70, name.length * 25)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>
      <text x="${PW / 2}" y="${NY + 88}" text-anchor="middle" class="t-sub">${esc(model.name)} · <tspan fill="${t1}" font-weight="700">${esc(loc(col))}</tspan></text>
      <text x="26" y="${PH - 30}" class="t-serial">${card?.serial ? esc(card.serial) : esc(skin.id.toUpperCase())}</text>
      <g transform="translate(${PW - 48} ${PH - 38})">${rarityShape(skin.r, 17)}</g>
    </g>
  </g>`;
}

// ───────── Usure visible de la carte : même logique que les skins, continue de 0 à 1.
// Chaque effet a son propre tirage aléatoire : en montant le float, les marques existantes restent
// à leur place et de nouvelles s'ajoutent (coins blanchis, bords écaillés, rayures, perte de couleur, taches, pli).
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function cardWear(card, id, lite) {
  const f = Math.min(1, card.f);
  if (f < 0.004) return '';
  const key = card.serial || String(card.id || 0);
  const rs = (k) => rng(hash(`${key}:${k}`));
  let s = '', defs = '';

  // bords : blanchiment irrégulier qui s'étend
  if (!lite) {
    const ns = rs('n')() * 997 | 0;
    defs += `<filter id="${id}ef" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="${ns}"/>
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  9 0 0 0 ${(-5.6 + f * 4.2).toFixed(2)}"/></filter>
      <mask id="${id}em" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" filter="url(#${id}ef)"/></mask>
      <filter id="${id}cf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".005 .007" numOctaves="3" seed="${(ns + 5) % 997}"/>
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.4 0 0 0 -.6"/></filter>
      <mask id="${id}cm" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" filter="url(#${id}cf)"/></mask>
      <filter id="${id}sf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02 .026" numOctaves="4" seed="${(ns + 9) % 997}"/>
        <feColorMatrix values="0 0 0 0 .3  0 0 0 0 .19  0 0 0 0 .08  5 0 0 0 ${(-3.7 + f * 1.0).toFixed(2)}"/><feGaussianBlur stdDeviation="1.4"/></filter>`;
    // perte de couleur et voile jauni
    s += `<rect width="${CW}" height="${CH}" fill="#9a958a" mask="url(#${id}cm)" opacity="${Math.min(0.8, Math.pow(f, 0.9) * 0.9).toFixed(3)}" style="mix-blend-mode:saturation"/>
      <rect width="${CW}" height="${CH}" fill="#efe6d2" mask="url(#${id}cm)" opacity="${(f * f * 0.16).toFixed(3)}"/>
      <rect width="${CW}" height="${CH}" filter="url(#${id}sf)" opacity="${(Math.pow(f, 1.5) * 0.42).toFixed(3)}" style="mix-blend-mode:multiply"/>
      <rect x="4" y="4" width="${CW - 8}" height="${CH - 8}" rx="29" fill="none" stroke="#f4f1ea" stroke-width="${(4 + f * 16).toFixed(1)}" mask="url(#${id}em)" opacity="${Math.min(0.85, 0.25 + f * 0.7).toFixed(3)}"/>`;
  } else {
    s += `<rect width="${CW}" height="${CH}" fill="#9a958a" opacity="${(f * 0.45).toFixed(3)}" style="mix-blend-mode:saturation"/>
      <rect x="4" y="4" width="${CW - 8}" height="${CH - 8}" rx="29" fill="none" stroke="#f4f1ea" stroke-width="${(2 + f * 8).toFixed(1)}" opacity="${(f * 0.6).toFixed(3)}" stroke-dasharray="${f < 0.5 ? '6 22' : '20 10'}"/>`;
  }

  // coins blanchis
  const rc = rs('c');
  for (const [cx, cy] of [[10, 10], [CW - 10, 10], [10, CH - 10], [CW - 10, CH - 10]]) {
    const k = 0.4 + rc() * 0.6;
    s += `<circle cx="${cx}" cy="${cy}" r="${(2 + f * 22 * k).toFixed(1)}" fill="#f4f1ea" opacity="${Math.min(0.85, f * 1.3 * k).toFixed(3)}"/>`;
  }

  // rayures : les premières restent en place quand le float monte
  const rr = rs('s');
  const n = Math.round(f * 44);
  for (let i = 0; i < n; i++) {
    const x = rr() * CW, y = rr() * CH, len = 14 + rr() * 90, a = rr() * Math.PI, bend = (rr() - 0.5) * 12, op = 0.08 + rr() * 0.2, sw = 0.6 + rr() * 1.2;
    s += `<path d="M${F(x)} ${F(y)} q${F(Math.cos(a) * len * 0.5)} ${F(Math.sin(a) * len * 0.5 + bend)} ${F(Math.cos(a) * len)} ${F(Math.sin(a) * len)}" stroke="#fff" stroke-opacity="${(op * (0.5 + f * 0.5)).toFixed(3)}" stroke-width="${F(sw)}" fill="none"/>`;
  }

  // pli : apparaît en fondu sur les cartes très usées
  const crease = smooth(0.55, 0.9, f);
  if (crease > 0) {
    const rp = rs('p');
    const y1 = 100 + rp() * 300, y2 = y1 + 150 + rp() * 400;
    s += `<g opacity="${crease.toFixed(3)}"><path d="M0 ${F(y1)} L${CW} ${F(y2)}" stroke="#000" stroke-opacity=".3" stroke-width="5"/><path d="M0 ${F(y1 + 4)} L${CW} ${F(y2 + 4)}" stroke="#fff" stroke-opacity=".28" stroke-width="2"/></g>`;
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
  return `<svg class="card-svg" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(MODEL_BY_KEY[skin.m].name)} | ${esc(loc(skin, 'n'))}">
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
    <div class="card-inner">${svg}<div class="card-shine"></div>${card?.foil ? '<div class="card-foil"></div>' : ''}${card?.mp ? `<div class="misprint-tag">${t('ERREUR D’IMPRESSION')}</div>` : ''}</div>
  </div>`;
  if (card?.g != null && !opts.noSlab) {
    return `<div class="slab ${card.g >= 10 ? 'pristine' : ''}" style="--rc:${R.color}">
      <div class="slab-label">
        <div class="slab-brand">MUGIGO GRADING<small>${esc(card.cert || '')}</small></div>
        <div class="slab-name">${esc(MODEL_BY_KEY[skin.m].name)}<br><b>${esc(loc(skin, 'n'))}</b></div>
        <div class="slab-grade"><b>${card.g % 1 ? card.g.toFixed(1) : card.g}</b><small>${esc(gradeLabel(card.g))}</small></div>
      </div>
      <div class="slab-window">${html}</div>
    </div>`;
  }
  return html;
}

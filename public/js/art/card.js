// Rendu des cartes en SVG : cadre de rareté, centrage réel, arme dessinée pièce par pièce (matériaux + ombrage),
// texture du skin, usure (écaillage, perte de couleur, taches, rayures), badges, carte erreur, slab gradé, dos luxe.
import { RARITIES, BRAND, WEAR } from '/shared/config.js';
import { MODEL_BY_KEY, STYLES, COLLECTION_BY_KEY, ART_FR, PATTERNS, CAMOS } from '/shared/catalog.js';
import { gradeLabel } from '/shared/rules.js';
import { WEAPON_ART, WEAPON_BOX, PAINT_BOX } from './weapons.js';
import { HAS_3D, PHOTO, IMG_V } from './weapons3d.js';
import { skinTexture, rng } from './skins.js';
import { esc } from '../ui.js';
import { t, L as loc, getLang } from '/shared/i18n.js';

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
        <mask id="${id}chip" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="360"><g filter="url(#${id}chf)">${PHOTO[skin.m] ? `<image href="/img/weapons/${skin.m}.photo.mask.png?v=${IMG_V}" x="0" y="0" width="1000" height="360" preserveAspectRatio="none"/>` : paint.map((p) => `<path d="${p.d}" fill="#fff" fill-rule="evenodd"/>`).join('')}</g></mask>
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

  // ── armes rendues en 3D (Blender) : image de base + skin multiplié par l'éclairage des zones peintes + reflets
  if (HAS_3D.has(skin.m)) {
    // les armes importées depuis une image ont leurs propres fichiers (*.photo.*)
    const src = (k) => `/img/weapons/${skin.m}${PHOTO[skin.m] ? '.photo' : ''}.${k}?v=${IMG_V}`;
    const img = (k, extra = '') => `<image href="${src(k)}" x="0" y="0" width="1000" height="360" preserveAspectRatio="none" ${extra}/>`;
    const specOp = (0.85 * (1 - 0.6 * Math.min(1, float ?? 0))).toFixed(3);
    return `<g class="weapon w3d">
      <defs>${tex.defs}${wearDefs}
        <mask id="${id}pm" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="360">${img('mask.png')}</mask>
        ${skin.r >= 5 && !opts.lite ? `<filter id="${id}gl" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>` : ''}
        ${opts.lite ? '' : `<filter id="${id}sb" x="-10%" y="-20%" width="120%" height="150%"><feGaussianBlur stdDeviation="7"/></filter>`}
      </defs>
      ${skin.r >= 5 && !opts.lite && !PHOTO[skin.m] ? `<path d="${all}" fill="none" stroke="${RARITIES[skin.r].glow}" stroke-width="10" opacity=".22" filter="url(#${id}gl)"/>` : ''}
      ${img('base.webp')}
      <g mask="url(#${id}pm)"><g ${chipMask} style="isolation:isolate">
        <g transform="${texFit(skin.m)}">${tex.body}</g>${wearOver}
        ${img('light.webp', 'style="mix-blend-mode:multiply"')}
      </g></g>
      ${img('spec.webp', `style="mix-blend-mode:screen" opacity="${specOp}"`)}
    </g>`;
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
  const b = PHOTO[m] ? boxOf(PHOTO[m].box) : PAINT_BOX[m];
  const k = Math.max(b.w / 1000, b.h / 360) * 1.04;
  return `translate(${F(b.x + b.w / 2 - 500 * k)} ${F(b.y + b.h / 2 - 180 * k)}) scale(${k.toFixed(4)})`;
}

const boxOf = ([x, y, w, h]) => ({ x, y, w, h });
// cadre l'arme dans la fenêtre d'illustration
// (les couteaux sont inclinés pour occuper la fenêtre)
function fit(m, x0, y0, w0, h0) {
  const b = PHOTO[m] ? boxOf(PHOTO[m].box) : WEAPON_BOX[m];
  const a = PHOTO[m]?.tilt ?? (MODEL_BY_KEY[m].cls === 'knife' ? -24 : 0);
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

// contour unique d'un caractère coréen : la forme pleine est dilatée puis on retire la forme elle-même,
// ce qui donne un seul trait autour de la lettre (au lieu des contours de chaque trait superposé), plus un halo flou.
export const koOutline = (color, width = 2, glow = 6) => `<feMorphology in="SourceAlpha" operator="dilate" radius="${width}" result="d"/>
  <feComposite in="d" in2="SourceAlpha" operator="out" result="o"/><feFlood flood-color="${color}"/><feComposite in2="o" operator="in" result="line"/>
  ${glow ? `<feGaussianBlur in="line" stdDeviation="${glow}" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="line"/></feMerge>` : ''}`;

// ───────── Face d'une carte (style épuré) : fond gris propre à chaque carte, nom en haut,
// initiale de la rareté dans une pastille claire ; la rareté se lit surtout au bord lumineux (CSS, animé).
const GRAYS = [['#2a2c31', '#17181b'], ['#313338', '#1b1c20'], ['#36383e', '#1e1f23'], ['#26282c', '#141518'], ['#3b3d43', '#212226'], ['#2e3035', '#191a1d']];
export const rarityLetter = (r) => (getLang() === 'en' ? ['C', 'U', 'R', 'E', 'L', 'M', 'T'] : ['C', 'P', 'R', 'E', 'L', 'M', 'T'])[r];
function cardFace(skin, card, id, opts) {
  const R = RARITIES[skin.r];
  const model = MODEL_BY_KEY[skin.m];
  const col = COLLECTION_BY_KEY[skin.col];
  const name = loc(skin, 'n');
  const fid = `${id}${opts.suffix || ''}`;
  const [g1, g2] = GRAYS[skin.seed % GRAYS.length];
  const [t1] = col.theme;
  const AY = 150, AH = 560;                       // fenêtre de l'arme

  const badge = card?.tr != null ? (() => {
    const txt = t('TRAQUEUR {n}', { n: String(card.tr).padStart(4, '0') }); const w = txt.length * 11.5 + 24;
    return `<g transform="translate(36 ${AY + 14})"><rect width="${w}" height="30" rx="15" fill="#000" fill-opacity=".55" stroke="#ff8a3d" stroke-width="2"/><text x="${w / 2}" y="21" text-anchor="middle" class="t-badge" fill="#ff8a3d">${txt}</text></g>`;
  })() : '';

  // usure de l'arme : barre des états, avec seulement un point à la position du float
  const FY = CH - 78, FX = 40, FW = CW - 80;
  const floatBar = card ? `<g class="fbar">
      <rect x="${FX - 2}" y="${FY - 2}" width="${FW + 4}" height="10" rx="5" fill="#000" opacity=".35"/>
      ${WEAR.tiers.map((tr) => `<rect x="${F(FX + tr.min * FW)}" y="${FY}" width="${F((tr.max - tr.min) * FW)}" height="6" fill="${tr.color}" opacity=".9"/>`).join('')}
      <circle cx="${F(FX + Math.min(1, card.f) * FW)}" cy="${FY + 3}" r="8" fill="#fff" stroke="#000" stroke-opacity=".5" stroke-width="2.5"/></g>` : '';
  const letter = rarityLetter(skin.r);

  return `<g>
    <defs>
      <linearGradient id="${fid}bg" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/></linearGradient>
      <radialGradient id="${fid}sp" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <filter id="${fid}ko" x="-10%" y="-10%" width="120%" height="120%">${koOutline(`color-mix(in srgb, ${t1} 70%, #fff)`, 2.2, opts.lite ? 0 : 7)}</filter>
    </defs>
    <rect width="${CW}" height="${CH}" rx="32" fill="url(#${fid}bg)"/>
    <rect width="${CW}" height="${CH}" rx="32" fill="url(#${fid}sp)"/>
    <rect x="1.5" y="1.5" width="${CW - 3}" height="${CH - 3}" rx="31" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="3"/>
    <text x="40" y="78" class="t-name t-top" textLength="${F(Math.min(CW - 170, name.length * 27))}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>
    <text x="40" y="114" class="t-sub t-topsub">${esc(model.name)} · <tspan fill="${t1}" font-weight="700">${esc(loc(col))}</tspan></text>
    <g transform="translate(${CW - 70} 70)">
      <circle r="34" fill="#f2f3f6" opacity=".94"/>
      <text y="${letter.length > 1 ? 11 : 13}" text-anchor="middle" class="t-rletter${letter.length > 1 ? ' two' : ''}" fill="#1b1d22">${letter}</text>
    </g>
    <g class="colsym" transform="translate(${CW / 2} ${AY + AH / 2})">
      <text y="0" dy=".36em" text-anchor="middle" class="t-colsym" fill="#fff" filter="url(#${fid}ko)" opacity=".3">${esc(col.sym)}</text>
    </g>
    <g transform="${fit(skin.m, 30, AY, CW - 60, AH)}">${weaponSVG(skin, card, opts)}</g>
    ${badge}
    ${floatBar}
    <text x="${CW / 2}" y="${CH - 30}" text-anchor="middle" class="t-serial">${card?.serial ? esc(card.serial) : esc(skin.id.toUpperCase())}</text>
  </g>`;
}

// ───────── Brillance progressive selon la rareté (remplace les holos), ternie et rendue irrégulière par l'usure
// commun : satin discret · peu commun : vernis · rare : paillettes fines · épique : reflets nacrés
// légendaire : paillettes dorées · mythique : reflets prismatiques · transcendant : irisation complète
export const GLOSS = [0.1, 0.18, 0.3, 0.42, 0.56, 0.72, 0.9];
export const glossOf = (r, f = 0) => GLOSS[r] * Math.pow(1 - Math.min(1, f), 1.6);
function cardGloss(skin, card, id, lite) {
  // la carte ne s'use plus : brillance identique pour toutes les cartes d'une même rareté
  const r = skin.r, f = 0;
  const k = GLOSS[r], keep = 1;
  if (k * keep < 0.01) return '';
  const R = RARITIES[r];
  const tint = r >= 6 ? '#ffffff' : r >= 4 ? (r === 4 ? '#ffe2a0' : '#ffd0e0') : '#ffffff';
  let defs = `<linearGradient id="${id}gs" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tint}" stop-opacity="0"/><stop offset=".3" stop-color="${tint}" stop-opacity=".0"/>
      <stop offset=".42" stop-color="${tint}" stop-opacity=".55"/><stop offset=".5" stop-color="${tint}" stop-opacity=".15"/>
      <stop offset=".62" stop-color="${tint}" stop-opacity=".4"/><stop offset=".75" stop-color="${tint}" stop-opacity="0"/></linearGradient>`;
  let body = `<rect width="${CW}" height="${CH}" fill="url(#${id}gs)" opacity="${(k * 0.55).toFixed(3)}" style="mix-blend-mode:soft-light"/>`;
  if (r >= 5) {
    defs += `<linearGradient id="${id}gp" x1="0" y1="1" x2="1" y2="0">${['#ff5f8a', '#ffd25f', '#7dff8a', '#5ff3ff', '#a77bff', '#ff5f8a'].map((c, i) => `<stop offset="${(i / 5).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
    body += `<rect width="${CW}" height="${CH}" fill="url(#${id}gp)" opacity="${(r === 6 ? 0.3 : 0.16).toFixed(2)}" style="mix-blend-mode:overlay"/>`;
  }
  if (!lite && r >= 2) {
    const sp = r >= 4 ? (r === 4 ? '1 .85 .45' : '1 .8 .9') : '1 1 1';
    const [cr, cg, cb] = sp.split(' ');
    defs += `<filter id="${id}gk" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${(0.7 - r * 0.04).toFixed(2)}" numOctaves="1" seed="${skin.seed % 97}"/>
      <feColorMatrix values="0 0 0 0 ${cr}  0 0 0 0 ${cg}  0 0 0 0 ${cb}  ${(30 + r * 4)} 0 0 0 ${(-(30 + r * 4) * (0.84 - r * 0.012)).toFixed(2)}"/></filter>`;
    body += `<rect width="${CW}" height="${CH}" filter="url(#${id}gk)" opacity="${(0.3 + r * 0.06).toFixed(2)}" style="mix-blend-mode:screen"/>`;
  }
  // l'usure ternit la brillance par plaques : plus le float monte, plus les zones mates s'étendent
  let mask = '';
  if (card && f > 0.005) {
    if (lite) body = `<g opacity="${keep.toFixed(3)}">${body}</g>`;
    else {
      defs += `<filter id="${id}gw" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .016" numOctaves="3" seed="${(skin.seed + 7) % 97}"/>
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  4 0 0 0 ${(-2 + (1 - f) * 3.6 - 0.6).toFixed(2)}"/></filter>
        <mask id="${id}gm" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" filter="url(#${id}gw)"/></mask>`;
      mask = ` mask="url(#${id}gm)"`;
      body = `<g opacity="${Math.max(0.15, keep).toFixed(3)}">${body}</g>`;
    }
  }
  return `<defs>${defs}</defs><g class="gloss" pointer-events="none"${mask}>${body}</g>`;
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
      ${cardGloss(skin, card, id, opts.lite)}
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
  const cls = ['card', `r${skin.r}`, 'gb'];
  if (card?.mp) cls.push('misprint');
  if (opts.small) cls.push('small');
  const svg = cardSVG(skin, card, opts);
  const gloss = glossOf(skin.r, 0);
  const html = `<div class="${cls.join(' ')}" style="--rc:${R.color};--rg:${R.glow};--gloss:${(0.25 + gloss * 1.2).toFixed(2)}" data-tilt>
    <div class="card-inner">${svg}<div class="card-shine"></div>${card?.mp ? `<div class="misprint-tag">${t('ERREUR D’IMPRESSION')}</div>` : ''}</div>
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

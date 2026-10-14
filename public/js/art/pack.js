// Illustrations des boosters (SVG 400 × 620) : emballage alu, fond illustré (motif du booster ou œuvre de la
// collection), arme vedette peinte avec un skin du contenu, logo 무 Mugigo.
import { SKINS, MODEL_BY_KEY, COLLECTION_BY_KEY } from '/shared/catalog.js';
import { packFilter } from '/shared/packs.js';
import { BRAND } from '/shared/config.js';
import { WEAPON_BOX } from './weapons.js';
import { weaponSVG } from './card.js';
import { skinTexture } from './skins.js';
import { esc } from '../ui.js';

let n = 0;
const showcase = new Map();
function heroSkin(pack) {
  if (!showcase.has(pack.key)) {
    const ok = packFilter(pack.filter);
    let pool = SKINS.filter((s) => ok(s) && (!pack.hero || s.m === pack.hero));
    if (!pool.length) pool = SKINS.filter(ok);
    const best = [...pool].sort((a, b) => (b.st === 'art') - (a.st === 'art') || b.r - a.r || a.id.localeCompare(b.id))[0];
    showcase.set(pack.key, best);
  }
  return showcase.get(pack.key);
}

function motif(key, id, t2) {
  switch (key) {
    case 'standard':
      return `<g opacity=".18">${Array.from({ length: 14 }, (_, i) => `<path d="M${-200 + i * 50} 620 L${-110 + i * 50} 620 L${110 + i * 50} 400 L${20 + i * 50} 400 Z" fill="#000"/>`).join('')}</g>
        <rect x="40" y="96" width="320" height="400" rx="12" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>`;
    case 'sidearm':
      return `<g fill="none" stroke="#fff" stroke-opacity=".16">${[60, 110, 160, 210, 260].map((r) => `<circle cx="200" cy="300" r="${r}" stroke-width="${r % 100 ? 2 : 6}"/>`).join('')}</g>`;
    case 'assault':
      return `<g fill="none" stroke="#000" stroke-opacity=".22" stroke-width="22">${Array.from({ length: 9 }, (_, i) => `<path d="M-20 ${80 + i * 70} L200 ${20 + i * 70} L420 ${80 + i * 70}"/>`).join('')}</g>`;
    case 'precision':
      return `<g fill="none" stroke="#fff" stroke-opacity=".22"><circle cx="200" cy="300" r="170" stroke-width="5"/><circle cx="200" cy="300" r="120" stroke-width="1.5"/>
        <path d="M200 110 V250 M200 350 V490 M10 300 H150 M250 300 H390" stroke-width="3"/></g>`;
    case 'blades':
      return `<g>${[[-40, 520, 460, 60], [10, 600, 440, 160], [-60, 380, 300, -20]].map(([a, b, c, d], i) => `<path d="M${a} ${b} L${c} ${d}" stroke="#fff" stroke-opacity="${0.25 - i * 0.05}" stroke-width="${10 - i * 3}" stroke-linecap="round"/>`).join('')}</g>`;
    case 'free':
      return `<pattern id="${id}dt" patternUnits="userSpaceOnUse" width="22" height="22"><circle cx="11" cy="11" r="2.4" fill="#fff" fill-opacity=".14"/></pattern><rect width="400" height="620" fill="url(#${id}dt)"/>`;
    default:
      return `<pattern id="${id}hx" patternUnits="userSpaceOnUse" width="40" height="69.28"><path d="M20 0 L40 11.55 L40 34.64 L20 46.19 L0 34.64 L0 11.55 Z M20 46.19 V69.28" fill="none" stroke="${t2}" stroke-opacity=".22" stroke-width="2"/></pattern><rect width="400" height="620" fill="url(#${id}hx)"/>`;
  }
}

export function packSVG(pack) {
  const id = `pk${++n}`;
  const [t1, t2] = pack.theme;
  const crimp = (y, flip) => { let d = `M0 ${y}`; for (let x = 0; x <= 400; x += 10) d += ` L${x} ${y + (x % 20 ? (flip ? -8 : 8) : 0)}`; return d; };
  let bg = motif(pack.key, id, t2);
  if (pack.group === 'collection') {
    // l'œuvre de la collection sert de fond
    const art = skinTexture({ ...SKINS.find((s) => s.col === pack.collection), st: 'art', art: COLLECTION_BY_KEY[pack.collection].arts[0], r: 4 }, 7, `${id}a`);
    bg = `<defs>${art.defs}</defs><g transform="translate(-661 0) scale(1.722)">${art.body}</g><rect width="400" height="620" fill="#000" opacity=".35"/>`;
  }
  let hero = '';
  if (!pack.free) {
    const s = heroSkin(pack);
    const b = WEAPON_BOX[s.m];
    const knife = MODEL_BY_KEY[s.m].cls === 'knife';
    const k = (knife ? 400 : 360) / b.w;
    hero = `<g transform="translate(200 300) rotate(${knife ? -32 : -24}) scale(${k.toFixed(4)}) translate(${-(b.x + b.w / 2)} ${-(b.y + b.h / 2)})" filter="url(#${id}sh)">${weaponSVG(s, null, { lite: true })}</g>`;
  } else {
    hero = `<g transform="translate(200 300)">
      <path d="M-110 -40 L0 -90 L110 -40 L110 80 L0 130 L-110 80 Z" fill="#1b1d24" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-110 -40 L0 10 L110 -40 M0 10 V130" fill="none" stroke="#fff" stroke-width="4"/>
      <path d="M-55 -65 L55 -15 M-20 -80 L90 -30" stroke="${t2}" stroke-width="16" stroke-opacity=".8"/>
      <text y="80" text-anchor="middle" font-size="70" fill="#fff" fill-opacity=".9" font-family="Jua, sans-serif">${BRAND.glyph}</text></g>`;
  }
  const name = pack.fr.toUpperCase();
  return `<svg viewBox="0 0 400 620" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(pack.fr)}">
    <defs>
      <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t1}"/><stop offset=".55" stop-color="color-mix(in srgb, ${t1} 40%, #0b0c12)"/><stop offset="1" stop-color="#0b0c12"/></linearGradient>
      <linearGradient id="${id}fo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa0aa"/><stop offset=".3" stop-color="#f4f6fa"/><stop offset=".6" stop-color="#b9bec8"/><stop offset="1" stop-color="#eef0f4"/></linearGradient>
      <radialGradient id="${id}glow" cx=".5" cy=".48" r=".5"><stop offset="0" stop-color="${t2}" stop-opacity=".65"/><stop offset="1" stop-color="${t2}" stop-opacity="0"/></radialGradient>
      <filter id="${id}sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000" flood-opacity=".7"/></filter>
      <clipPath id="${id}c"><path d="${crimp(14, false)} L400 606 L0 606 Z"/></clipPath>
    </defs>
    <g clip-path="url(#${id}c)">
      <rect width="400" height="620" fill="url(#${id}bg)"/>
      ${bg}
      <circle cx="200" cy="300" r="190" fill="url(#${id}glow)"/>
      ${hero}
      <rect y="462" width="400" height="160" fill="#000" fill-opacity=".55"/>
      <rect y="462" width="400" height="3" fill="${t2}" opacity=".8"/>
      <text x="200" y="514" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="${name.length > 15 ? 30 : name.length > 11 ? 36 : 42}" fill="#fff">${esc(name)}</text>
      ${pack.ko ? `<text x="200" y="540" text-anchor="middle" font-family="Jua, sans-serif" font-size="18" fill="${t2}" letter-spacing="6">${esc(pack.ko)}</text>` : ''}
      <text x="200" y="${pack.ko ? 564 : 546}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="700" font-size="15" fill="#fff" fill-opacity=".75">${esc(pack.tag)}</text>
      <text x="200" y="590" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="14" fill="${t2}" letter-spacing="4">${pack.cards} CARTES</text>
      <rect x="0" y="0" width="12" height="620" fill="#fff" fill-opacity=".08"/><rect x="388" y="0" width="12" height="620" fill="#000" fill-opacity=".2"/>
    </g>
    <g class="pack-top">
      <path d="${crimp(0, false)} L400 0 L400 74 L0 74 Z" fill="url(#${id}fo)"/>
      <path d="M0 64 H400" stroke="#000" stroke-opacity=".25" stroke-dasharray="6 6" stroke-width="2"/>
      <circle cx="134" cy="38" r="17" fill="#14151b"/><text x="134" y="47" text-anchor="middle" font-family="Jua, sans-serif" font-size="24" fill="${t1}">${BRAND.glyph}</text>
      <text x="160" y="47" font-family="Baloo 2, sans-serif" font-weight="800" font-size="24" letter-spacing="6" fill="#14151b">${BRAND.name.toUpperCase()}</text>
    </g>
    <path d="${crimp(606, true)} L400 620 L0 620 Z" fill="url(#${id}fo)"/>
  </svg>`;
}

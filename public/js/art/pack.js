// Illustrations des boosters (SVG 400 × 620) : emballage thermo-soudé aux couleurs du booster, fond illustré
// (motif du booster ou œuvre de la collection) et grand symbole coréen lumineux propre à chaque booster.
import { SKINS, MODEL_BY_KEY, COLLECTION_BY_KEY } from '/shared/catalog.js';
import { BRAND } from '/shared/config.js';
import { skinTexture } from './skins.js';
import { esc } from '../ui.js';
import { koOutline } from './card.js';
import { t, L } from '/shared/i18n.js';

let n = 0;
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
  // bords thermo-soudés : ondulation douce (plus de dents de scie)
  const wave = (y, amp) => { let d = `M0 ${y}`; for (let x = 0; x < 400; x += 20) d += ` Q${x + 10} ${y + amp} ${x + 20} ${y}`; return d; };
  const waveBack = (y, amp) => { let d = ''; for (let x = 400; x > 0; x -= 20) d += ` Q${x - 10} ${y + amp} ${x - 20} ${y}`; return d; };
  let bg = motif(pack.key, id, t2);
  if (pack.group === 'collection') {
    const art = skinTexture({ ...SKINS.find((s) => s.col === pack.collection), st: 'art', art: COLLECTION_BY_KEY[pack.collection].arts[0], r: 4 }, 7, `${id}a`);
    bg = `<defs>${art.defs}</defs><g transform="translate(-661 0) scale(1.722)" opacity=".55">${art.body}</g><rect width="400" height="620" fill="#000" opacity=".35"/>`;
  }
  const sym = pack.sym || BRAND.glyph;
  const name = L(pack).toUpperCase();
  return `<svg viewBox="0 0 400 620" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(L(pack))}">
    <defs>
      <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t1}"/><stop offset=".5" stop-color="color-mix(in srgb, ${t1} 40%, #0b0c12)"/><stop offset="1" stop-color="#0b0c12"/></linearGradient>
      <linearGradient id="${id}seal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="color-mix(in srgb, ${t1} 70%, #000)"/><stop offset=".35" stop-color="${t2}"/><stop offset=".6" stop-color="${t1}"/><stop offset="1" stop-color="color-mix(in srgb, ${t2} 70%, #000)"/></linearGradient>
      <pattern id="${id}rib" patternUnits="userSpaceOnUse" width="400" height="5"><rect width="400" height="2" fill="#fff" opacity=".18"/></pattern>
      <radialGradient id="${id}glow" cx=".5" cy=".46" r=".5"><stop offset="0" stop-color="${t2}" stop-opacity=".55"/><stop offset="1" stop-color="${t2}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}sy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="${t2}" stop-opacity=".05"/></linearGradient>
      <filter id="${id}ng" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="${id}ko" x="-20%" y="-20%" width="140%" height="140%">${koOutline(t2, 3, 8)}</filter>
      <clipPath id="${id}c"><rect width="400" height="620" rx="14"/></clipPath>
    </defs>
    <g clip-path="url(#${id}c)">
      <rect width="400" height="620" fill="url(#${id}bg)"/>
      ${bg}
      <circle cx="200" cy="270" r="200" fill="url(#${id}glow)"/>
      <text x="200" y="352" text-anchor="middle" font-family="Noto Sans KR, sans-serif" font-weight="900" font-size="230" fill="url(#${id}sy)">${esc(sym)}</text>
      <text x="200" y="352" text-anchor="middle" font-family="Noto Sans KR, sans-serif" font-weight="900" font-size="230" fill="#fff" filter="url(#${id}ko)">${esc(sym)}</text>
      <rect y="452" width="400" height="168" fill="#000" fill-opacity=".5"/>
      <rect y="452" width="400" height="2" fill="${t2}" opacity=".9"/>
      <text x="200" y="504" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="${name.length > 15 ? 30 : name.length > 11 ? 36 : 42}" fill="#fff">${esc(name)}</text>
      ${pack.ko ? `<text x="200" y="532" text-anchor="middle" font-family="Noto Sans KR, sans-serif" font-weight="700" font-size="19" fill="${t2}" letter-spacing="3">${esc(pack.ko)}</text>` : ''}
      <text x="200" y="${pack.ko ? 556 : 538}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="700" font-size="15" fill="#fff" fill-opacity=".75">${esc(L(pack, 'tag'))}</text>
      <text x="200" y="${pack.ko ? 578 : 562}" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="14" fill="${t2}" letter-spacing="4">${t('{n} CARTES', { n: pack.cards })}</text>
      <rect x="0" y="0" width="10" height="620" fill="#fff" fill-opacity=".08"/><rect x="390" y="0" width="10" height="620" fill="#000" fill-opacity=".2"/>
    </g>
    <g class="pack-top">
      <path d="M14 0 H386 Q400 0 400 14 V66 ${waveBack(66, 7)} V14 Q0 0 14 0 Z" fill="url(#${id}seal)"/>
      <path d="M0 6 H400 V62 H0 Z" fill="url(#${id}rib)"/>
      <path d="${wave(66, 6)}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2"/>
      <circle cx="132" cy="34" r="17" fill="#0b0c12" fill-opacity=".85"/><text x="132" y="41" text-anchor="middle" font-family="Noto Sans KR, sans-serif" font-weight="900" font-size="19" fill="${t2}">${BRAND.glyph}</text>
      <text x="158" y="42" font-family="Baloo 2, sans-serif" font-weight="800" font-size="23" letter-spacing="6" fill="#0b0c12" fill-opacity=".85">${BRAND.name.toUpperCase()}</text>
    </g>
    <path d="${wave(594, -7)} V606 Q400 620 386 620 H14 Q0 620 0 606 Z" fill="url(#${id}seal)"/>
    <path d="M0 598 H400 V616 H0 Z" fill="url(#${id}rib)"/>
  </svg>`;
}

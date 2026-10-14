// Illustrations des boosters (SVG 400 × 620) : chaque booster a sa composition, son motif et son arme vedette.
import { WEAPON_ART, WEAPON_BOX } from './weapons.js';
import { esc } from '../ui.js';

let n = 0;
const HERO = { standard: 'rhoden', sidearm: 'vyrex9', assault: 'bastion', precision: 'longshade', blades: 'nightfang', prototype: 'lumen' };

function silhouette(model, id, t1, t2, x, y, w, rot) {
  const parts = WEAPON_ART[model];
  const b = WEAPON_BOX[model];
  const k = w / b.w;
  const all = parts.filter((p) => p.k !== 'line' && p.k !== 'hole').map((p) => p.d).join(' ');
  const acc = parts.filter((p) => p.k === 'accent' || p.k === 'glass').map((p) => p.d).join(' ');
  const lines = parts.filter((p) => p.k === 'line').map((p) => p.d).join(' ');
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k.toFixed(3)}) translate(${-b.x - b.w / 2} ${-b.y - b.h / 2})">
    <path d="${all}" fill="#000" opacity=".5" transform="translate(10 16)" fill-rule="evenodd"/>
    <path d="${all}" fill="url(#${id}w)" stroke="${t2}" stroke-width="${(3 / k).toFixed(1)}" stroke-linejoin="round" fill-rule="evenodd" filter="url(#${id}gl)"/>
    <path d="${lines}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="${(2 / k).toFixed(1)}"/>
    <path d="${acc}" fill="${t2}"/>
  </g>`;
}

function motif(key, id, t1, t2) {
  switch (key) {
    case 'standard':
      return `<g opacity=".18">${Array.from({ length: 14 }, (_, i) => `<path d="M${-200 + i * 50} 620 L${-110 + i * 50} 620 L${110 + i * 50} 400 L${20 + i * 50} 400 Z" fill="#000"/>`).join('')}</g>
        <g fill="#fff" opacity=".25">${[60, 340].map((x) => [120, 500].map((y) => `<circle cx="${x}" cy="${y}" r="7"/>`).join('')).join('')}</g>
        <rect x="40" y="96" width="320" height="420" rx="12" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="3"/>`;
    case 'sidearm':
      return `<g fill="none" stroke="#fff" stroke-opacity=".16">${[60, 110, 160, 210, 260].map((r) => `<circle cx="200" cy="300" r="${r}" stroke-width="${r % 100 ? 2 : 6}"/>`).join('')}</g>
        <path d="M200 30 V570 M-10 300 H410" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>`;
    case 'assault':
      return `<g fill="none" stroke="#000" stroke-opacity=".22" stroke-width="22">${Array.from({ length: 9 }, (_, i) => `<path d="M-20 ${80 + i * 70} L200 ${20 + i * 70} L420 ${80 + i * 70}"/>`).join('')}</g>`;
    case 'precision':
      return `<g fill="none" stroke="#fff" stroke-opacity=".22"><circle cx="200" cy="300" r="170" stroke-width="5"/><circle cx="200" cy="300" r="120" stroke-width="1.5"/>
        <path d="M200 110 V250 M200 350 V490 M10 300 H150 M250 300 H390" stroke-width="3"/>
        ${[-4, -3, -2, -1, 1, 2, 3, 4].map((i) => `<circle cx="${200 + i * 24}" cy="300" r="3" fill="#fff" fill-opacity=".4"/><circle cx="200" cy="${300 + i * 24}" r="3" fill="#fff" fill-opacity=".4"/>`).join('')}</g>`;
    case 'blades':
      return `<g>${[[-40, 520, 460, 60], [10, 600, 440, 160], [-60, 380, 300, -20]].map(([a, b, c, d], i) => `<path d="M${a} ${b} L${c} ${d}" stroke="#fff" stroke-opacity="${0.25 - i * 0.05}" stroke-width="${10 - i * 3}" stroke-linecap="round"/>`).join('')}</g>`;
    case 'prototype':
      return `<pattern id="${id}hx" patternUnits="userSpaceOnUse" width="40" height="69.28"><path d="M20 0 L40 11.55 L40 34.64 L20 46.19 L0 34.64 L0 11.55 Z M20 46.19 V69.28" fill="none" stroke="${t2}" stroke-opacity=".25" stroke-width="2"/></pattern>
        <rect width="400" height="620" fill="url(#${id}hx)"/>
        <g fill="none" stroke="${t2}" stroke-width="3">${[90, 140, 190].map((r, i) => `<ellipse cx="200" cy="300" rx="${r}" ry="${r * 0.35}" stroke-opacity="${0.5 - i * 0.12}" transform="rotate(-20 200 300)"/>`).join('')}</g>`;
    case 'free':
      return `<pattern id="${id}dt" patternUnits="userSpaceOnUse" width="22" height="22"><circle cx="11" cy="11" r="2.4" fill="#fff" fill-opacity=".14"/></pattern><rect width="400" height="620" fill="url(#${id}dt)"/>`;
    default: return '';
  }
}

export function packSVG(pack) {
  const id = `pk${++n}`;
  const [t1, t2] = pack.theme;
  const crimp = (y, flip) => {
    let d = `M0 ${y}`;
    for (let x = 0; x <= 400; x += 10) d += ` L${x} ${y + (x % 20 ? (flip ? -8 : 8) : 0)}`;
    return d;
  };
  const hero = HERO[pack.key];
  const art = hero
    ? silhouette(hero, id, t1, t2, 200, 300, pack.key === 'precision' ? 360 : pack.key === 'sidearm' ? 250 : 320, pack.key === 'blades' ? -8 : -18)
    : `<g transform="translate(200 300)">
        <path d="M-110 -40 L0 -90 L110 -40 L110 80 L0 130 L-110 80 Z" fill="url(#${id}w)" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
        <path d="M-110 -40 L0 10 L110 -40 M0 10 V130" fill="none" stroke="#fff" stroke-width="4"/>
        <path d="M-55 -65 L55 -15 M-20 -80 L90 -30" stroke="${t2}" stroke-width="16" stroke-opacity=".8"/>
        <text y="70" text-anchor="middle" font-size="54" font-weight="700" fill="#fff" fill-opacity=".9" font-family="Chakra Petch, sans-serif">?</text>
      </g>`;
  return `<svg viewBox="0 0 400 620" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(pack.fr)}">
    <defs>
      <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t1}"/><stop offset=".55" stop-color="color-mix(in srgb, ${t1} 45%, #0b0c12)"/><stop offset="1" stop-color="#0b0c12"/></linearGradient>
      <linearGradient id="${id}fo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa0aa"/><stop offset=".3" stop-color="#f4f6fa"/><stop offset=".6" stop-color="#b9bec8"/><stop offset="1" stop-color="#eef0f4"/></linearGradient>
      <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2d36"/><stop offset="1" stop-color="#0c0d12"/></linearGradient>
      <radialGradient id="${id}glow" cx=".5" cy=".48" r=".5"><stop offset="0" stop-color="${t2}" stop-opacity=".7"/><stop offset="1" stop-color="${t2}" stop-opacity="0"/></radialGradient>
      <filter id="${id}gl" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${t2}" flood-opacity=".8"/></filter>
      <clipPath id="${id}c"><path d="${crimp(14, false)} L400 606 L0 606 Z"/></clipPath>
    </defs>
    <g clip-path="url(#${id}c)">
      <rect width="400" height="620" fill="url(#${id}bg)"/>
      ${motif(pack.key, id, t1, t2)}
      <circle cx="200" cy="300" r="190" fill="url(#${id}glow)"/>
      ${art}
      <rect y="470" width="400" height="150" fill="#000" fill-opacity=".45"/>
      <text x="200" y="526" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="${pack.fr.length > 14 ? 34 : 40}" fill="#fff" letter-spacing="1">${esc(pack.fr.toUpperCase())}</text>
      <text x="200" y="556" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" fill="#fff" fill-opacity=".75">${esc(pack.tag)}</text>
      <text x="200" y="586" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="14" fill="${t2}" letter-spacing="4">${pack.cards} CARTES</text>
      <rect x="0" y="0" width="12" height="620" fill="#fff" fill-opacity=".08"/><rect x="388" y="0" width="12" height="620" fill="#000" fill-opacity=".2"/>
    </g>
    <g class="pack-top">
      <path d="${crimp(0, false)} L400 0 L400 74 L0 74 Z" fill="url(#${id}fo)"/>
      <path d="M0 64 H400" stroke="#000" stroke-opacity=".25" stroke-dasharray="6 6" stroke-width="2"/>
      <text x="200" y="46" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="22" letter-spacing="10" fill="#14151b">ARMARIS</text>
      <path d="M40 34 l10 -12 l10 12 l-10 12 Z M340 34 l10 -12 l10 12 l-10 12 Z" fill="${t1}"/>
    </g>
    <path d="${crimp(606, true)} L400 620 L0 620 Z" fill="url(#${id}fo)"/>
  </svg>`;
}

// Textures de skins « pleine arme » (espace 1000 × 360) : la texture est dessinée sur toute la surface puis
// découpée par les pièces peintes de l'arme. La graine de motif (0–999) décale / modifie le rendu.
import { PATTERNS } from '/shared/catalog.js';
import { describeSeed } from '/shared/patterns.js';
import { patternDef } from './patterns.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const F = (x) => Math.round(x * 10) / 10;
const W = 1000, H = 360;

export function colors(skin) {
  const { h, h2, s, l } = skin;
  return {
    c1: `hsl(${h} ${s}% ${l}%)`, c1d: `hsl(${h} ${s}% ${Math.max(8, l - 24)}%)`, c1l: `hsl(${h} ${Math.min(100, s + 8)}% ${Math.min(90, l + 22)}%)`,
    c2: `hsl(${h2} ${Math.min(100, s + 12)}% ${Math.min(68, l + 4)}%)`, c2d: `hsl(${h2} ${s}% ${Math.max(10, l - 20)}%)`, c2l: `hsl(${h2} ${s}% ${Math.min(88, l + 24)}%)`,
    ink: `hsl(${h} 30% 8%)`, gold: '#e8c15a', goldd: '#8a6a1c',
  };
}

const FADES = [
  ['#ffe08a', '#ff7eb6', '#8b5cff', '#5b2bd1'],
  ['#7af7ff', '#2f8bff', '#7b3bff', '#2a0f7a'],
  ['#fff07a', '#ff8a1f', '#e0182e', '#5a0a14'],
  ['#e9ff7a', '#2fe0c8', '#2f6bff', '#16206b'],
];
const METALS = [['#d9b35a', '#8a6420'], ['#c7cbd3', '#5d6470'], ['#c98a4b', '#6b3a17'], ['#e6d38a', '#7c6a2a']];
const MARBLES = [
  ['#ff3b3b', '#ffd23f', '#3b6bff', '#111'], ['#ff6ad5', '#7a5cff', '#2dd4bf', '#0b0b1a'],
  ['#ffb020', '#ff3d5a', '#ffe9a8', '#1a0b05'], ['#5ff3ff', '#b266ff', '#ffffff', '#081020'],
];

// ───────────────────────────── Style par style
function solid(c, r, id) {
  return { defs: `<filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${Math.floor(r() * 99)}"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 -1.2 .9"/></filter>
      <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="${c.c1l}"/><stop offset=".5" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c1d}"/></linearGradient>`,
  body: `<rect width="${W}" height="${H}" fill="url(#${id}g)"/><rect width="${W}" height="${H}" filter="url(#${id}n)" opacity=".18"/>` };
}
function twotone(c, r) {
  const y = 150 + r() * 60, a = (r() - 0.5) * 60;
  return { defs: '', body: `<rect width="${W}" height="${H}" fill="${c.c1}"/>
    <path d="M0 ${F(y + a)} L${W} ${F(y - a)} L${W} ${H} L0 ${H} Z" fill="${c.c2d}"/>
    <path d="M0 ${F(y + a)} L${W} ${F(y - a)}" stroke="${c.c2l}" stroke-width="6"/>
    <path d="M0 ${F(y + a + 14)} L${W} ${F(y - a + 14)}" stroke="${c.ink}" stroke-width="3" opacity=".6"/>` };
}
function camo(skin, c, r) {
  const kind = skin.cm;
  let s = `<rect width="${W}" height="${H}" fill="${kind === 3 ? '#8d939b' : c.c1}"/>`;
  const cols = kind === 3 ? ['#5a5f68', '#c4c8ce', '#30343a', c.c1] : [c.c1d, c.c2, c.ink, c.c1l];
  if (kind === 0 || kind === 4) {
    for (let i = 0; i < (kind === 4 ? 90 : 46); i++) {
      const x = r() * W, y = r() * H, rx = kind === 4 ? 6 + r() * 22 : 30 + r() * 70, ry = kind === 4 ? 4 + r() * 14 : 14 + r() * 34;
      let d = `M${F(x + rx)} ${F(y)}`;
      for (let k = 1; k <= 8; k++) { const t = (k / 8) * Math.PI * 2, j = 0.7 + r() * 0.5; d += ` Q${F(x + Math.cos(t - 0.4) * rx * j * 1.15)} ${F(y + Math.sin(t - 0.4) * ry * j * 1.15)} ${F(x + Math.cos(t) * rx * j)} ${F(y + Math.sin(t) * ry * j)}`; }
      s += `<path d="${d}Z" fill="${cols[i % cols.length]}"/>`;
    }
  } else if (kind === 1) {
    for (let y = 0; y < H; y += 12) for (let x = 0; x < W; x += 12) { const v = r(); if (v < 0.55) continue; s += `<rect x="${x}" y="${y}" width="12" height="12" fill="${cols[Math.floor(v * 10) % 4]}"/>`; }
  } else if (kind === 2) {
    for (let i = 0; i < 26; i++) {
      const x = r() * W, y = -20 + r() * 60, len = 120 + r() * 200, w = 8 + r() * 14;
      s += `<path d="M${F(x)} ${F(y)} Q${F(x + 30 * (r() - 0.5))} ${F(y + len / 2)} ${F(x + 40 * (r() - 0.5))} ${F(y + len)} Q${F(x + w)} ${F(y + len / 2)} ${F(x + w)} ${F(y)} Z" fill="${c.ink}"/>`;
    }
  } else {
    for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H, w = 30 + r() * 90, h = 20 + r() * 50; s += `<path d="M${F(x)} ${F(y)} l${F(w)} ${F(-h * 0.3)} l${F(-w * 0.3)} ${F(h)} l${F(-w * 0.8)} ${F(-h * 0.2)} Z" fill="${cols[i % 4]}"/>`; }
  }
  return { defs: '', body: s };
}
function geo(skin, c, id, pt) {
  const def = patternDef(`${id}gp`, skin);
  const shift = `translate(${pt % 60} ${(pt * 7) % 60})`;
  return { defs: def, body: `<g transform="scale(1.8) ${shift}"><rect x="-80" y="-80" width="${W}" height="${H}" fill="url(#${id}gp)"/></g>` };
}
function fade(skin, id, pt) {
  const d = describeSeed(skin, pt);
  const pct = d ? d.value : 90;
  const cols = FADES[skin.v % FADES.length];
  const k = (100 - pct) / 20;           // 0 = fondu intégral
  const st = [0, 0.16 + k * 0.5, 0.42 + k * 0.5, 0.8 + k * 0.2];
  return { defs: `<linearGradient id="${id}f" x1="1" y1="0" x2="0" y2=".55">${cols.map((col, i) => `<stop offset="${Math.min(1, st[i]).toFixed(3)}" stop-color="${col}"/>`).join('')}</linearGradient>
      <linearGradient id="${id}fs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
  body: `<rect width="${W}" height="${H}" fill="url(#${id}f)"/><rect width="${W}" height="${H}" fill="url(#${id}fs)"/>` };
}
function hardened(skin, id, pt) {
  const d = describeSeed(skin, pt);
  const blue = d ? d.value / 100 : 0.4;
  const [m1, m2] = METALS[skin.v % METALS.length];
  const t = (0.6 - blue * 0.24).toFixed(3);
  return { defs: `<filter id="${id}h" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008 .02" numOctaves="4" seed="${pt}"/>
      <feColorMatrix values="0 0 0 0 .12  0 0 0 0 .3  0 0 0 0 .85  9 0 0 0 ${(-9 * t).toFixed(2)}"/></filter>
    <filter id="${id}h2" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02 .05" numOctaves="3" seed="${pt + 7}"/>
      <feColorMatrix values="0 0 0 0 .42  0 0 0 0 .2  0 0 0 0 .62  7 0 0 0 -4.3"/></filter>
    <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m1}"/><stop offset="1" stop-color="${m2}"/></linearGradient>`,
  body: `<rect width="${W}" height="${H}" fill="url(#${id}m)"/><rect width="${W}" height="${H}" filter="url(#${id}h2)" opacity=".7"/><rect width="${W}" height="${H}" filter="url(#${id}h)"/>` };
}
function marble(skin, id, pt) {
  const d = describeSeed(skin, pt);
  let cols = MARBLES[skin.v % MARBLES.length];
  if (d?.tier === 1) cols = ['#ff2a2a', '#ff2a2a', '#2a5bff', '#2a5bff'];
  else if (d?.tier === 2) cols = ['#1a0b3a', '#5b2bd1', '#0b1a4a', '#2a6bff'];
  else if (d?.tier === 3) cols = ['#2dd4bf', '#a855f7', '#22c55e', '#0b1020'];
  const rgb = cols.map((h) => { const n = parseInt(h.slice(1).padEnd(6, h.slice(1)), 16); const x = h.length === 4 ? h.slice(1).split('').map((q) => parseInt(q + q, 16)) : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; return x.map((v) => (v / 255).toFixed(3)); });
  const tv = (ch) => [rgb[3][ch], rgb[0][ch], rgb[1][ch], rgb[2][ch], rgb[0][ch]].join(' ');
  return { defs: `<filter id="${id}mb" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency=".004 .012" numOctaves="4" seed="${pt}"/>
      <feColorMatrix type="matrix" values="2.4 0 0 0 -.25  2.4 0 0 0 -.25  2.4 0 0 0 -.25  0 0 0 0 1"/>
      <feComponentTransfer><feFuncR type="table" tableValues="${tv(0)}"/><feFuncG type="table" tableValues="${tv(1)}"/><feFuncB type="table" tableValues="${tv(2)}"/></feComponentTransfer></filter>`,
  body: `<rect width="${W}" height="${H}" filter="url(#${id}mb)"/>` };
}
function damascus(skin, c, id, pt) {
  return { defs: `<pattern id="${id}dp" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(${(pt % 40) - 20})"><rect width="14" height="14" fill="#5d636d"/><rect width="14" height="5" fill="#c9ced6"/><rect y="7" width="14" height="2" fill="#2a2e35"/></pattern>
    <filter id="${id}dd" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .03" numOctaves="3" seed="${pt}" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="60"/></filter>`,
  body: `<g filter="url(#${id}dd)"><rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="url(#${id}dp)"/></g><rect width="${W}" height="${H}" fill="${c.c1}" opacity=".28" style="mix-blend-mode:color"/>` };
}

// ───────────────────────────── Illustrations
const scroll = (x, y, s, col, w = 3) => `<path d="M${x} ${y} c${12 * s} ${-26 * s} ${46 * s} ${-28 * s} ${58 * s} ${-6 * s} c${10 * s} ${18 * s} ${-8 * s} ${34 * s} ${-26 * s} ${26 * s} c${-12 * s} ${-6 * s} ${-8 * s} ${-22 * s} ${4 * s} ${-22 * s} M${x} ${y} c${-10 * s} ${20 * s} ${-36 * s} ${26 * s} ${-52 * s} ${10 * s}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>
  <path d="M${x + 30 * s} ${y - 22 * s} q${10 * s} ${-14 * s} ${24 * s} ${-12 * s} q${-6 * s} ${10 * s} ${-24 * s} ${12 * s} Z" fill="${col}"/>`;
function filigreeLayer(r, col, density = 14) {
  let s = '';
  for (let i = 0; i < density; i++) s += scroll(F(r() * W), F(40 + r() * 280), 0.8 + r() * 0.9, col, 2.5);
  return s;
}
function stars(r, n, col = '#fff') {
  let s = '';
  for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, k = r() < 0.15 ? 3 + r() * 3 : 0.6 + r() * 1.4; s += k > 2.5 ? `<path d="M${F(x)} ${F(y - k * 2)} L${F(x + k * 0.4)} ${F(y - k * 0.4)} L${F(x + k * 2)} ${F(y)} L${F(x + k * 0.4)} ${F(y + k * 0.4)} L${F(x)} ${F(y + k * 2)} L${F(x - k * 0.4)} ${F(y + k * 0.4)} L${F(x - k * 2)} ${F(y)} L${F(x - k * 0.4)} ${F(y - k * 0.4)} Z" fill="${col}"/>` : `<circle cx="${F(x)}" cy="${F(y)}" r="${F(k)}" fill="${col}" opacity="${F(0.4 + r() * 0.6)}"/>`; }
  return s;
}
function bodyAlong(pts, w0, w1) {
  // contour d'un corps de largeur variable le long d'une courbe
  const L = [], Rr = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i], [x2, y2] = pts[Math.min(pts.length - 1, i + 1)], [x0, y0] = pts[Math.max(0, i - 1)];
    const dx = x2 - x0, dy = y2 - y0, n = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * (i / (pts.length - 1));
    L.push([x - (dy / n) * w, y + (dx / n) * w]); Rr.push([x + (dy / n) * w, y - (dx / n) * w]);
  }
  return { left: L, right: Rr, d: `M${L.map((p) => p.map(F).join(' ')).join(' L')} L${Rr.reverse().map((p) => p.map(F).join(' ')).join(' L')} Z` };
}

const ART = {
  dragon(c, r, id) {
    const ph = r() * 6;
    const pts = Array.from({ length: 60 }, (_, i) => { const x = -40 + i * 16; return [x, 190 + Math.sin(x / 120 + ph) * 70 + Math.sin(x / 47) * 12]; });
    const b = bodyAlong(pts, 16, 62);
    const head = pts[pts.length - 1];
    let spikes = '';
    for (let i = 4; i < b.right.length - 3; i += 2) { const [x, y] = b.right[b.right.length - 1 - i] || [0, 0]; spikes += `<path d="M${F(x - 8)} ${F(y + 4)} L${F(x)} ${F(y - 22 - (i / 60) * 14)} L${F(x + 8)} ${F(y + 4)} Z" fill="${c.c2d}" stroke="${c.gold}" stroke-width="1.5"/>`; }
    let clouds = '';
    for (let i = 0; i < 9; i++) { const x = r() * W, y = r() * H; clouds += `<path d="M${F(x)} ${F(y)} q20 -24 44 -6 q18 -22 40 0 q22 2 14 22 q-30 12 -98 -16 Z" fill="none" stroke="${c.gold}" stroke-width="3" opacity=".55"/>`; }
    const [hx, hy] = head;
    return {
      defs: `<pattern id="${id}sc" patternUnits="userSpaceOnUse" width="22" height="14"><rect width="22" height="14" fill="${c.c2}"/><path d="M0 14 Q11 0 22 14" fill="${c.c2d}" stroke="${c.gold}" stroke-width="1.4"/><path d="M-11 7 Q0 -7 11 7 M11 7 Q22 -7 33 7" fill="none" stroke="${c.gold}" stroke-width="1" opacity=".6"/></pattern>
        <radialGradient id="${id}bg" cx=".5" cy=".5" r=".8"><stop offset="0" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.ink}"/></radialGradient>`,
      body: `<rect width="${W}" height="${H}" fill="url(#${id}bg)"/>${clouds}
        <path d="${b.d}" fill="url(#${id}sc)" stroke="${c.gold}" stroke-width="3"/>${spikes}
        <path d="M${b.left.map((p) => p.map(F).join(' ')).join(' L')}" fill="none" stroke="${c.c1l}" stroke-width="7" opacity=".7"/>
        <g transform="translate(${F(Math.min(hx, 930))} ${F(hy)})">
          <path d="M-40 -34 L40 -40 Q78 -28 86 0 L46 6 L74 22 Q40 40 -30 30 Q-56 20 -50 -10 Z" fill="${c.c2}" stroke="${c.gold}" stroke-width="3"/>
          <path d="M-20 -36 Q-40 -80 -70 -86 Q-44 -62 -40 -32 M10 -40 Q0 -86 -24 -100 Q-6 -70 -4 -40" fill="none" stroke="${c.gold}" stroke-width="5" stroke-linecap="round"/>
          <circle cx="28" cy="-18" r="7" fill="#ffe46b"/><circle cx="30" cy="-18" r="3" fill="#000"/>
          <path d="M70 16 Q120 50 150 20 M66 -4 Q130 -30 150 -70" fill="none" stroke="${c.gold}" stroke-width="3"/>
          <path d="M46 6 L52 14 L58 6 L64 14" fill="none" stroke="#fff" stroke-width="2"/>
        </g>
        <g fill="${c.gold}">${[0.3, 0.55].map((t) => { const p = pts[Math.floor(t * pts.length)]; return `<path d="M${F(p[0])} ${F(p[1] + 40)} l-14 34 l8 -4 l2 14 l8 -12 l4 14 l6 -16 l8 6 l-6 -36 Z"/>`; }).join('')}</g>`,
    };
  },
  filigree(c, r) {
    return { defs: '', body: `<rect width="${W}" height="${H}" fill="${c.c1d}"/><rect width="${W}" height="${H}" fill="${c.ink}" opacity=".45"/>${filigreeLayer(r, c.gold, 26)}${filigreeLayer(r, c.c2l, 10)}` };
  },
  koi(c, r, id) {
    const fish = (x, y, rot, col, sp) => `<g transform="translate(${x} ${y}) rotate(${rot})">
      <path d="M-120 0 Q-60 -42 30 -30 Q90 -18 110 0 Q90 18 30 30 Q-60 42 -120 0 Z" fill="${col}" stroke="#2a0a00" stroke-width="2"/>
      <path d="M-118 0 L-180 -40 Q-160 0 -180 40 Z" fill="${col}" opacity=".85"/>
      <path d="M-10 -28 Q10 -70 50 -60 Q30 -40 30 -28 Z M-20 28 Q0 60 30 56 Q20 40 20 28 Z" fill="${col}" opacity=".8"/>
      ${sp}<circle cx="78" cy="-8" r="5" fill="#111"/><path d="M104 4 Q130 20 150 10" fill="none" stroke="#2a0a00" stroke-width="2"/></g>`;
    const spots = `<path d="M-60 -20 Q-20 -36 0 -10 Q-30 10 -60 -20 Z M10 10 Q40 -6 60 14 Q30 26 10 10 Z" fill="#fff"/>`;
    let ripples = '';
    for (let i = 0; i < 16; i++) { const x = r() * W, y = r() * H, k = 20 + r() * 50; ripples += `<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(k)}" ry="${F(k * 0.35)}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>`; }
    return { defs: `<linearGradient id="${id}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b5f7a"/><stop offset="1" stop-color="#062a45"/></linearGradient>`,
      body: `<rect width="${W}" height="${H}" fill="url(#${id}w)"/>${ripples}
        <g fill="#2f8a4a" opacity=".85"><circle cx="${F(120 + r() * 200)}" cy="70" r="56"/><circle cx="${F(700 + r() * 200)}" cy="300" r="64"/></g>
        ${[[220, 110, -8, '#ff7a1f', spots], [520, 250, 172, '#f2f0ea', '<path d="M-40 -14 Q-10 -30 20 -6 Q-10 12 -40 -14 Z" fill="#e0262e"/>'], [800, 120, 10, '#ffb020', spots], [80, 280, 190, '#e0262e', '<path d="M-40 -14 Q-10 -30 20 -6 Q-10 12 -40 -14 Z" fill="#fff"/>']]
    .map(([x, y, a, col, sp]) => `<g transform="translate(${F(x + r() * 40)} ${y}) scale(.72) translate(${-x} ${-y})">${fish(x, y, a, col, sp)}</g>`).join('')}` };
  },
  wave(c, r, id) {
    let s = `<rect width="${W}" height="${H}" fill="#efe2c4"/>`;
    for (let k = 0; k < 3; k++) {
      const x0 = -100 + k * 380 + r() * 60, top = 70 + r() * 40;
      s += `<path d="M${F(x0)} ${H} Q${F(x0 + 40)} ${F(top + 60)} ${F(x0 + 170)} ${F(top)} Q${F(x0 + 300)} ${F(top - 30)} ${F(x0 + 330)} ${F(top + 60)} Q${F(x0 + 250)} ${F(top + 10)} ${F(x0 + 220)} ${F(top + 80)} Q${F(x0 + 200)} ${F(top + 180)} ${F(x0 + 420)} ${H} Z" fill="#1d3f7a" stroke="#0b1a3a" stroke-width="3"/>`;
      s += `<path d="M${F(x0 + 30)} ${H} Q${F(x0 + 70)} ${F(top + 100)} ${F(x0 + 180)} ${F(top + 40)}" fill="none" stroke="#7fb2f0" stroke-width="6"/>`;
      for (let j = 0; j < 9; j++) { const a = j / 9; s += `<circle cx="${F(x0 + 200 + a * 130)}" cy="${F(top - 10 + Math.sin(a * 3) * 20)}" r="${F(6 + r() * 6)}" fill="#fff" stroke="#0b1a3a" stroke-width="1.5"/>`; }
    }
    s += `<circle cx="${F(800 + r() * 100)}" cy="70" r="40" fill="#c8102e" opacity=".85"/>`;
    return { defs: '', body: s };
  },
  city(c, r, id) {
    let b = '';
    for (let x = 0; x < W;) { const w = 30 + r() * 60, h = 80 + r() * 180; b += `<rect x="${F(x)}" y="${F(H - h)}" width="${F(w)}" height="${F(h)}" fill="#14061f" stroke="#ff2bd6" stroke-opacity=".4"/>`;
      for (let wy = H - h + 10; wy < H - 10; wy += 14) for (let wx = x + 6; wx < x + w - 8; wx += 12) if (r() < 0.35) b += `<rect x="${F(wx)}" y="${F(wy)}" width="5" height="6" fill="${r() < 0.5 ? '#2bfff0' : '#ffd36b'}"/>`;
      x += w + 4; }
    let grid = '';
    for (let i = -10; i <= 10; i++) grid += `<path d="M500 250 L${500 + i * 120} ${H}" stroke="#ff2bd6" stroke-width="1.5" opacity=".6"/>`;
    return { defs: `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0638"/><stop offset=".6" stop-color="#7a1a8a"/><stop offset="1" stop-color="#ff5ab8"/></linearGradient>
        <linearGradient id="${id}sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe46b"/><stop offset="1" stop-color="#ff2b6a"/></linearGradient>`,
    body: `<rect width="${W}" height="${H}" fill="url(#${id}s)"/>${stars(r, 40)}<circle cx="${F(400 + r() * 200)}" cy="170" r="110" fill="url(#${id}sun)"/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="0" y="${190 + i * 16}" width="${W}" height="${4 + i}" fill="#3a0a4a"/>`).join('')}${b}${grid}` };
  },
  circuit(c, r) {
    let s = `<rect width="${W}" height="${H}" fill="#06140f"/>`;
    for (let i = 0; i < 70; i++) {
      let x = Math.round(r() * 50) * 20, y = Math.round(r() * 18) * 20, d = `M${x} ${y}`;
      for (let k = 0; k < 4; k++) { if (r() < 0.5) x += (r() < 0.5 ? -1 : 1) * 40; else { y += (r() < 0.5 ? -1 : 1) * 20; x += 20; } d += ` L${x} ${y}`; }
      s += `<path d="${d}" fill="none" stroke="${c.c2}" stroke-width="3" opacity=".85"/><circle cx="${x}" cy="${y}" r="5" fill="${c.c2l}"/>`;
    }
    for (let i = 0; i < 6; i++) { const x = r() * 900, y = r() * 300; s += `<rect x="${F(x)}" y="${F(y)}" width="70" height="44" rx="4" fill="#111" stroke="${c.c2}" stroke-width="2"/>`; }
    return { defs: '', body: s };
  },
  scorpion(c, r) {
    let segs = '';
    for (let i = 0; i < 6; i++) { const a = -0.3 - i * 0.42; segs += `<ellipse cx="${F(560 + Math.cos(a) * (60 + i * 26))}" cy="${F(220 + Math.sin(a) * (70 + i * 20))}" rx="22" ry="16" fill="#2a1408" stroke="${c.c1l}" stroke-width="2"/>`; }
    return { defs: '', body: `<rect width="${W}" height="${H}" fill="${c.c1}"/>${dunesLayer(c, r)}
      <g><ellipse cx="460" cy="230" rx="90" ry="44" fill="#2a1408" stroke="${c.c1l}" stroke-width="2"/>${segs}
      <path d="M510 60 Q560 40 560 80 L540 70 Z" fill="#2a1408" stroke="${c.c1l}" stroke-width="2"/>
      <path d="M380 210 Q300 160 250 180 Q230 150 270 140 Q300 120 320 160 Z M380 250 Q300 300 250 280 Q230 310 270 320 Q300 340 320 300 Z" fill="#2a1408" stroke="${c.c1l}" stroke-width="2"/>
      ${[0, 1, 2, 3].map((i) => `<path d="M${440 + i * 26} 266 l-14 46 M${440 + i * 26} 194 l-14 -46" stroke="#2a1408" stroke-width="7" stroke-linecap="round"/>`).join('')}</g>` };
  },
  dunes(c, r) { return { defs: '', body: `<rect width="${W}" height="${H}" fill="${c.c1l}"/>${dunesLayer(c, r)}<circle cx="${F(200 + r() * 600)}" cy="60" r="34" fill="#fff4c8" opacity=".9"/>` }; },
  runes(c, r) {
    let s = `<rect width="${W}" height="${H}" fill="#2a2d33"/>`;
    for (let i = 0; i < 18; i++) { const x = r() * W, y = r() * H; s += `<path d="M${F(x)} ${F(y)} l${F(30 * (r() - 0.5))} ${F(40 + r() * 40)} l${F(40 * (r() - 0.5))} ${F(30 + r() * 30)}" stroke="#ff7a1f" stroke-width="3" fill="none" opacity=".8"/>`; }
    for (let i = 0; i < 26; i++) {
      const x = 40 + (i % 13) * 74, y = i < 13 ? 110 : 250;
      const g = ['M0 -24 V24 M0 -24 L16 -8 M0 0 L16 16', 'M-12 -24 L12 24 M12 -24 L-12 24', 'M0 -24 V24 M-14 -6 L14 -14', 'M-14 24 V-24 L14 0 L-14 24', 'M0 -24 L14 0 L0 24 L-14 0 Z'][Math.floor(r() * 5)];
      s += `<path d="${g}" transform="translate(${x} ${y})" fill="none" stroke="#ffb020" stroke-width="5" stroke-linecap="round"/><path d="${g}" transform="translate(${x} ${y})" fill="none" stroke="#fff3c4" stroke-width="1.5"/>`;
    }
    return { defs: '', body: s };
  },
  sakura(c, r) {
    let s = `<rect width="${W}" height="${H}" fill="#fbe9ef"/><rect width="${W}" height="${H}" fill="${c.c1}" opacity=".18"/>`;
    const branch = (x, y, a, len, w, d) => {
      if (d > 4 || len < 20) return '';
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      let o = `<path d="M${F(x)} ${F(y)} Q${F((x + x2) / 2 + 20 * (r() - 0.5))} ${F((y + y2) / 2 + 20 * (r() - 0.5))} ${F(x2)} ${F(y2)}" stroke="#3a1a1f" stroke-width="${F(w)}" fill="none" stroke-linecap="round"/>`;
      o += branch(x2, y2, a - 0.5 + r() * 0.3, len * 0.72, w * 0.65, d + 1) + branch(x2, y2, a + 0.3 + r() * 0.3, len * 0.66, w * 0.6, d + 1);
      if (d >= 2) for (let k = 0; k < 3; k++) o += flower(x2 + 30 * (r() - 0.5), y2 + 30 * (r() - 0.5), 8 + r() * 6);
      return o;
    };
    const flower = (x, y, k) => `<g transform="translate(${F(x)} ${F(y)}) rotate(${F(r() * 72)})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="${F(-k)}" rx="${F(k * 0.62)}" ry="${F(k)}" fill="#ffb7d0" stroke="#e86a9a" stroke-width="1" transform="rotate(${a})"/>`).join('')}<circle r="${F(k * 0.3)}" fill="#c8102e"/></g>`;
    s += branch(-20, 340, -0.55, 260, 26, 0) + branch(1020, 20, 2.7, 240, 22, 0);
    for (let i = 0; i < 24; i++) s += `<ellipse cx="${F(r() * W)}" cy="${F(r() * H)}" rx="5" ry="3" fill="#ff9ec7" transform="rotate(${F(r() * 180)})"/>`;
    return { defs: '', body: s };
  },
  crane(c, r) {
    let s = `<rect width="${W}" height="${H}" fill="#f3ead6"/><circle cx="${F(300 + r() * 400)}" cy="160" r="120" fill="#e0262e" opacity=".9"/>`;
    for (let i = 0; i < 8; i++) s += `<path d="M${F(r() * W)} ${F(250 + r() * 100)} q40 -30 80 0 q40 -30 80 0" fill="none" stroke="#c9b48a" stroke-width="4"/>`;
    for (let i = 0; i < 5; i++) {
      const x = 80 + i * 200 + r() * 40, y = 70 + r() * 200, k = 0.7 + r() * 0.5;
      s += `<g transform="translate(${F(x)} ${F(y)}) scale(${F(k)})"><path d="M-70 10 Q-20 -60 30 -10 Q70 -70 120 -40 Q70 -20 40 10 Q0 30 -70 10 Z" fill="#fff" stroke="#222" stroke-width="2"/>
        <path d="M30 -10 L60 -30 L90 -20" fill="none" stroke="#222" stroke-width="3"/><circle cx="92" cy="-22" r="4" fill="#c8102e"/><path d="M-70 10 L-110 20 M-40 18 L-80 40" stroke="#111" stroke-width="5"/></g>`;
    }
    return { defs: '', body: s };
  },
  galaxy(c, r, id) {
    let s = `<rect width="${W}" height="${H}" fill="#05051a"/>`;
    for (let i = 0; i < 7; i++) s += `<circle cx="${F(r() * W)}" cy="${F(r() * H)}" r="${F(80 + r() * 140)}" fill="url(#${id}n${i % 3})" opacity=".85"/>`;
    s += stars(r, 160);
    const cx = 300 + r() * 400;
    for (let a = 0; a < 2; a++) s += `<path d="${Array.from({ length: 60 }, (_, i) => { const t = i / 10 + a * Math.PI, rr = 6 + i * 4; return `${i ? 'L' : 'M'}${F(cx + Math.cos(t) * rr * 1.8)} ${F(180 + Math.sin(t) * rr * 0.7)}`; }).join(' ')}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="5"/>`;
    return { defs: [c.c1, c.c2, '#ff6ad5'].map((col, i) => `<radialGradient id="${id}n${i}"><stop offset="0" stop-color="${col}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`).join(''), body: s };
  },
  planet(c, r, id) {
    const x = 350 + r() * 300;
    return { defs: `<radialGradient id="${id}p" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="${c.c2l}"/><stop offset=".6" stop-color="${c.c2}"/><stop offset="1" stop-color="#05051a"/></radialGradient>`,
      body: `<rect width="${W}" height="${H}" fill="#070b24"/>${stars(r, 120)}
        <ellipse cx="${F(x)}" cy="180" rx="250" ry="56" fill="none" stroke="${c.c1l}" stroke-width="16" opacity=".5" transform="rotate(-12 ${F(x)} 180)"/>
        <circle cx="${F(x)}" cy="180" r="120" fill="url(#${id}p)"/>
        ${[0, 1, 2, 3].map((i) => `<path d="M${F(x - 110)} ${150 + i * 22} Q${F(x)} ${140 + i * 22} ${F(x + 110)} ${156 + i * 22}" stroke="#000" stroke-opacity=".18" stroke-width="7" fill="none"/>`).join('')}
        <path d="M${F(x - 250)} 230 A250 56 -12 0 0 ${F(x + 250)} 128" fill="none" stroke="${c.c1l}" stroke-width="16" opacity=".8" transform="rotate(-12 ${F(x)} 180)"/>
        <circle cx="${F(x + 330)}" cy="70" r="22" fill="#cfd6e6"/><circle cx="${F(x - 320)}" cy="290" r="14" fill="${c.c1}"/>` };
  },
  frost(c, r) {
    let s = `<rect width="${W}" height="${H}" fill="${c.c1}"/><rect width="${W}" height="${H}" fill="#fff" opacity=".2"/>`;
    for (let i = 0; i < 12; i++) {
      const x = r() * W, y = r() * H, k = 30 + r() * 50;
      let flake = '';
      for (let a = 0; a < 6; a++) flake += `<g transform="rotate(${a * 60})"><path d="M0 0 V${-k} M0 ${-k * 0.4} l${k * 0.25} ${-k * 0.2} M0 ${-k * 0.4} l${-k * 0.25} ${-k * 0.2} M0 ${-k * 0.7} l${k * 0.18} ${-k * 0.15} M0 ${-k * 0.7} l${-k * 0.18} ${-k * 0.15}" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
      s += `<g transform="translate(${F(x)} ${F(y)})" opacity="${F(0.5 + r() * 0.5)}">${flake}</g>`;
    }
    return { defs: '', body: s };
  },
  wolf(c, r) {
    let pines = '';
    for (let x = 0; x < W; x += 40 + r() * 30) { const h = 60 + r() * 80; pines += `<path d="M${F(x)} ${H} L${F(x + 22)} ${F(H - h)} L${F(x + 44)} ${H} Z" fill="#0b1a2a"/>`; }
    const mx = 650 + r() * 200;
    return { defs: '', body: `<rect width="${W}" height="${H}" fill="#1b3350"/><circle cx="${F(mx)}" cy="110" r="80" fill="#e8f2ff"/>${stars(r, 60)}${pines}
      <path transform="translate(${F(mx - 360)} 70)" d="M60 290 L90 160 L70 110 L96 60 L120 20 L132 70 L150 60 L176 96 L230 130 L220 150 L180 150 L176 190 L200 290 Z" fill="#081220"/>` };
  },
  tiger(c, r) {
    let s = `<rect width="${W}" height="${H}" fill="#f08a1f"/><rect width="${W}" height="${H / 2}" fill="#ffb347" opacity=".4"/>`;
    for (let i = 0; i < 34; i++) {
      const x = r() * W, y = r() < 0.5 ? -10 : H + 10, len = 80 + r() * 120, dir = y < 0 ? 1 : -1, w = 10 + r() * 16;
      s += `<path d="M${F(x)} ${F(y)} Q${F(x + 40 * (r() - 0.5))} ${F(y + dir * len * 0.5)} ${F(x + 30 * (r() - 0.5))} ${F(y + dir * len)} Q${F(x + w)} ${F(y + dir * len * 0.4)} ${F(x + w * 1.5)} ${F(y)} Z" fill="#140a04"/>`;
    }
    s += `<g transform="translate(${F(400 + r() * 200)} 180)"><path d="M-60 0 Q-30 -26 0 -10 Q-30 4 -60 0 Z M20 -10 Q50 -26 80 0 Q50 4 20 -10 Z" fill="#ffe46b" stroke="#140a04" stroke-width="4"/><circle cx="-28" cy="-8" r="5" fill="#000"/><circle cx="50" cy="-8" r="5" fill="#000"/></g>`;
    return { defs: '', body: s };
  },
  serpent(c, r, id) {
    const pts = Array.from({ length: 50 }, (_, i) => { const x = -30 + i * 22; return [x, 180 + Math.sin(x / 90 + r()) * 90]; });
    const b = bodyAlong(pts, 20, 40);
    return { defs: `<pattern id="${id}ss" patternUnits="userSpaceOnUse" width="20" height="12"><rect width="20" height="12" fill="${c.c1}"/><path d="M0 12 Q10 0 20 12" fill="${c.c1d}" stroke="#0b1a0b" stroke-width="1.2"/></pattern>
      <pattern id="${id}sb" patternUnits="userSpaceOnUse" width="30" height="30"><rect width="30" height="30" fill="${c.c2d}"/><path d="M0 15 L15 0 L30 15 L15 30 Z" fill="${c.c2}" opacity=".5"/></pattern>`,
    body: `<rect width="${W}" height="${H}" fill="url(#${id}sb)"/><path d="${b.d}" fill="url(#${id}ss)" stroke="#0b1a0b" stroke-width="3"/>
      <path d="M${b.left.map((p) => p.map(F).join(' ')).join(' L')}" fill="none" stroke="#ffe46b" stroke-width="4" opacity=".6"/>` };
  },
  phoenix(c, r, id) {
    let feathers = '';
    for (let side of [-1, 1]) for (let i = 0; i < 9; i++) {
      const a = side * (0.25 + i * 0.13), len = 160 + i * 18;
      feathers += `<path d="M500 200 Q${F(500 + Math.sin(a) * len * 0.6 + side * 30)} ${F(200 - Math.cos(a) * len * 0.6)} ${F(500 + Math.sin(a) * len)} ${F(200 - Math.cos(a) * len * 0.8)} Q${F(500 + Math.sin(a) * len * 0.5)} ${F(200 - Math.cos(a) * len * 0.3)} 500 200 Z" fill="url(#${id}fe)" stroke="#5a0a00" stroke-width="2" transform="rotate(${side * 70} 500 200) scale(1.6 .8) translate(-190 40)"/>`;
    }
    let tail = '';
    for (let i = 0; i < 5; i++) tail += `<path d="M500 230 Q${440 - i * 30} ${300} ${380 - i * 40} 360" fill="none" stroke="url(#${id}fe)" stroke-width="${12 - i}"/>`;
    return { defs: `<linearGradient id="${id}fe" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff2a00"/><stop offset=".6" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ffe46b"/></linearGradient>
      <radialGradient id="${id}fb" cx=".5" cy=".6" r=".7"><stop offset="0" stop-color="#ffb020"/><stop offset=".5" stop-color="#a3120a"/><stop offset="1" stop-color="#1a0400"/></radialGradient>`,
    body: `<rect width="${W}" height="${H}" fill="url(#${id}fb)"/>${flamesLayer(r, ['#ff5a1f', '#ffb020'], 0.35)}${tail}${feathers}
      <path d="M480 200 Q500 140 530 150 L560 140 L540 160 Q560 190 500 230 Z" fill="#ffe46b" stroke="#5a0a00" stroke-width="2"/><circle cx="526" cy="158" r="4" fill="#000"/>` };
  },
  flames(c, r) {
    return { defs: '', body: `<rect width="${W}" height="${H}" fill="${c.ink}"/>${flamesLayer(r, ['#ffe46b', '#ff8a1f', '#e0182e'], 1)}` };
  },
};
function dunesLayer(c, r) {
  let s = '';
  for (let i = 0; i < 5; i++) { const y = 120 + i * 50; s += `<path d="M0 ${y} Q${F(250 + r() * 100)} ${F(y - 40 - r() * 40)} 500 ${y} T1000 ${y} V${H} H0 Z" fill="${i % 2 ? c.c1d : c.c2}" opacity=".7"/>`; }
  return s;
}
function flamesLayer(r, cols, op) {
  let s = '';
  for (let k = 0; k < cols.length; k++) for (let i = 0; i < 14; i++) {
    const x = -40 + i * 80 + r() * 30, y = H, h = 140 + r() * 160 - k * 30;
    s += `<path d="M${F(x)} ${y} Q${F(x - 30)} ${F(y - h * 0.5)} ${F(x + 20)} ${F(y - h)} Q${F(x + 10)} ${F(y - h * 0.55)} ${F(x + 60)} ${F(y - h * 0.7)} Q${F(x + 40)} ${F(y - h * 0.3)} ${F(x + 80)} ${y} Z" fill="${cols[k]}" opacity="${op}"/>`;
  }
  return s;
}

// ───────────────────────────── Point d'entrée
export function skinTexture(skin, pt, id) {
  const c = colors(skin);
  const seed = pt ?? 0;
  const r = rng((skin.seed ^ (seed * 2654435761)) >>> 0);
  let t;
  switch (skin.st) {
    case 'solid': t = solid(c, r, id); break;
    case 'twotone': t = twotone(c, r); break;
    case 'camo': t = camo(skin, c, r); break;
    case 'geo': t = geo(skin, c, id, seed); break;
    case 'fade': t = fade(skin, id, seed); break;
    case 'hardened': t = hardened(skin, id, seed); break;
    case 'marble': t = marble(skin, id, seed); break;
    case 'damascus': t = damascus(skin, c, id, seed); break;
    case 'art': t = (ART[skin.art] || ART.filigree)(c, rng(skin.seed), id); break;
    default: t = solid(c, r, id);
  }
  // ornements dorés sur les plus hautes raretés
  if (skin.r >= 5 && skin.st !== 'filigree') t.body += `<g opacity=".55">${filigreeLayer(rng(skin.seed + 1), '#e8c15a', skin.r >= 6 ? 10 : 5)}</g>`;
  return t;
}
export { PATTERNS };

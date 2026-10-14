// Générateurs de motifs SVG (24 motifs × 6 finitions) — tout est procédural et déterministe par skin.
// Chaque motif renvoie le contenu d'un <pattern> ; les couleurs viennent du skin (h, h2, s, l).

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function palette(skin) {
  const { h, h2, s, l } = skin;
  return {
    c1: `hsl(${h} ${s}% ${l}%)`,
    c1d: `hsl(${h} ${s}% ${Math.max(10, l - 22)}%)`,
    c1l: `hsl(${h} ${Math.min(100, s + 10)}% ${Math.min(88, l + 22)}%)`,
    c2: `hsl(${h2} ${Math.min(100, s + 15)}% ${Math.min(70, l + 6)}%)`,
    c2d: `hsl(${h2} ${s}% ${Math.max(12, l - 18)}%)`,
    ink: `hsl(${h} 25% 9%)`,
  };
}

const R = (x) => Math.round(x * 10) / 10;

// id : identifiant unique du <pattern> ; renvoie la chaîne SVG complète (<pattern>/<linearGradient>…)
export function patternDef(id, skin) {
  const c = palette(skin);
  const r = rng(skin.seed);
  const pat = (w, hgt, inner, extra = '') =>
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${hgt}" ${extra}>${inner}</pattern>`;
  const bg = (w, hgt, col = c.c1) => `<rect width="${w}" height="${hgt}" fill="${col}"/>`;

  switch (skin.p) {
    case 0: // Uni
      return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.c1l}"/><stop offset=".55" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c1d}"/></linearGradient>`;
    case 1: // Rayures
      return pat(28, 28, bg(28, 28) + `<rect width="11" height="28" fill="${c.c2}"/><rect x="11" width="3" height="28" fill="${c.ink}" opacity=".5"/>`, 'patternTransform="rotate(35)"');
    case 2: // Chevrons
      return pat(40, 24, bg(40, 24) + `<path d="M0 18 L20 6 L40 18" fill="none" stroke="${c.c2}" stroke-width="7"/><path d="M0 24 L20 12 L40 24" fill="none" stroke="${c.c1d}" stroke-width="3"/>`);
    case 3: { // Alvéoles
      const hx = 'M15 0 L30 8.66 L30 25.98 L15 34.64 L0 25.98 L0 8.66 Z';
      return pat(30, 51.96, bg(30, 52, c.c1d) +
        `<path d="${hx}" fill="${c.c1}" stroke="${c.c2}" stroke-width="2" transform="scale(.92) translate(1.3 1.3)"/>` +
        `<path d="${hx}" fill="${c.c1}" stroke="${c.c2}" stroke-width="2" transform="translate(-15 26) scale(.92) translate(1.3 1.3)"/>` +
        `<path d="${hx}" fill="${c.c1}" stroke="${c.c2}" stroke-width="2" transform="translate(15 26) scale(.92) translate(1.3 1.3)"/>`);
    }
    case 4: { // Camouflage
      const cols = [c.c1d, c.c2, c.ink, c.c1l];
      let s = bg(180, 180);
      for (let i = 0; i < 22; i++) {
        const x = r() * 180, y = r() * 180, rx = 14 + r() * 26, ry = 8 + r() * 16, a = r() * 180;
        const col = cols[i % cols.length];
        for (const [dx, dy] of [[0, 0], [-180, 0], [0, -180], [-180, -180]]) {
          s += `<ellipse cx="${R(x + dx)}" cy="${R(y + dy)}" rx="${R(rx)}" ry="${R(ry)}" fill="${col}" transform="rotate(${R(a)} ${R(x + dx)} ${R(y + dy)})"/>`;
        }
      }
      return pat(180, 180, s);
    }
    case 5: { // Pixels
      const cols = [c.c1, c.c1d, c.c2, c.c1l, c.ink];
      let s = '';
      for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
        const v = r(); const col = cols[v < 0.4 ? 0 : v < 0.65 ? 1 : v < 0.82 ? 2 : v < 0.94 ? 3 : 4];
        s += `<rect x="${x * 9}" y="${y * 9}" width="9" height="9" fill="${col}"/>`;
      }
      return pat(108, 108, s);
    }
    case 6: // Vagues
      return pat(80, 30, bg(80, 30) +
        `<path d="M0 15 Q20 0 40 15 T80 15" fill="none" stroke="${c.c2}" stroke-width="5"/>` +
        `<path d="M0 27 Q20 12 40 27 T80 27" fill="none" stroke="${c.c1d}" stroke-width="3"/>`);
    case 7: { // Flammes
      let s = `<linearGradient id="${id}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c.c2}"/><stop offset="1" stop-color="${c.c1}"/></linearGradient>` + bg(120, 120, c.c1d);
      for (let i = 0; i < 6; i++) {
        const x = i * 20 + r() * 6, hgt = 50 + r() * 60;
        s += `<path d="M${R(x)} 120 Q${R(x - 8)} ${R(120 - hgt * 0.5)} ${R(x + 8)} ${R(120 - hgt)} Q${R(x + 4)} ${R(120 - hgt * 0.45)} ${R(x + 22)} 120 Z" fill="url(#${id}g)"/>`;
      }
      return pat(120, 120, s);
    }
    case 8: { // Circuit
      let s = bg(100, 100, c.c1d);
      for (let i = 0; i < 9; i++) {
        let x = Math.round(r() * 10) * 10, y = Math.round(r() * 10) * 10;
        let d = `M${x} ${y}`;
        for (let k = 0; k < 3; k++) { if (r() < 0.5) x += (r() < 0.5 ? -1 : 1) * 20; else y += (r() < 0.5 ? -1 : 1) * 20; d += ` L${x} ${y}`; }
        s += `<path d="${d}" fill="none" stroke="${c.c2}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3.5" fill="${c.c1l}"/>`;
      }
      return pat(100, 100, s);
    }
    case 9: { // Tigré
      let s = bg(120, 120, c.c1);
      for (let i = 0; i < 7; i++) {
        const y = i * 18 + r() * 8;
        s += `<path d="M${R(r() * 20)} ${R(y)} Q${R(40 + r() * 20)} ${R(y + 10 + r() * 6)} ${R(70 + r() * 40)} ${R(y + 2)} Q${R(50 + r() * 20)} ${R(y + 6)} ${R(r() * 20)} ${R(y + 7)} Z" fill="${c.ink}"/>`;
      }
      return pat(120, 120, s);
    }
    case 10: // Écailles
      return pat(30, 20, bg(30, 20, c.c1d) +
        `<circle cx="15" cy="0" r="14" fill="${c.c1}" stroke="${c.c2}" stroke-width="1.6"/><circle cx="0" cy="10" r="14" fill="${c.c1}" stroke="${c.c2}" stroke-width="1.6"/><circle cx="30" cy="10" r="14" fill="${c.c1}" stroke="${c.c2}" stroke-width="1.6"/><circle cx="15" cy="20" r="14" fill="${c.c1}" stroke="${c.c2}" stroke-width="1.6"/>`);
    case 11: // Triangles
      return pat(40, 34.64, bg(40, 35) +
        `<path d="M0 34.64 L20 0 L40 34.64 Z" fill="${c.c2}"/><path d="M20 0 L40 34.64 L40 0 Z" fill="${c.c1d}"/>`);
    case 12: // Pois
      return pat(26, 26, bg(26, 26) + `<circle cx="7" cy="7" r="5" fill="${c.c2}"/><circle cx="20" cy="20" r="3" fill="${c.c1l}"/>`);
    case 13: // Carbone
      return pat(12, 12,
        `<linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3d44"/><stop offset="1" stop-color="#0d0e11"/></linearGradient>` +
        `<rect width="12" height="12" fill="#121317"/><rect width="6" height="6" fill="url(#${id}a)"/><rect x="6" y="6" width="6" height="6" fill="url(#${id}a)"/>` +
        `<rect x="6" width="6" height="6" fill="${c.c1}" opacity=".35"/><rect y="6" width="6" height="6" fill="${c.c1}" opacity=".35"/>`);
    case 14: { // Marbre
      let s = bg(200, 200, c.c1l);
      for (let i = 0; i < 8; i++) {
        const y = r() * 200;
        s += `<path d="M-10 ${R(y)} C${R(50 + r() * 30)} ${R(y - 40 + r() * 80)} ${R(120 + r() * 30)} ${R(y - 40 + r() * 80)} 210 ${R(y + r() * 40 - 20)}" fill="none" stroke="${i % 2 ? c.c1d : c.c2}" stroke-width="${R(0.8 + r() * 3)}" opacity=".75"/>`;
      }
      return pat(200, 200, s);
    }
    case 15: { // Éclairs
      let s = bg(90, 90, c.c1d);
      for (let i = 0; i < 3; i++) {
        let x = 10 + i * 30, y = 0, d = `M${x} ${y}`;
        while (y < 90) { x += (r() - 0.5) * 22; y += 10 + r() * 12; d += ` L${R(x)} ${R(Math.min(90, y))}`; }
        s += `<path d="${d}" fill="none" stroke="${c.c2}" stroke-width="3" stroke-linejoin="bevel"/><path d="${d}" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/>`;
      }
      return pat(90, 90, s);
    }
    case 16: // Dégradé
      return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="${c.c1}"/><stop offset=".5" stop-color="${c.c2}"/><stop offset="1" stop-color="${c.c1d}"/></linearGradient>`;
    case 17: // Damier
      return pat(32, 32, bg(32, 32) + `<rect width="16" height="16" fill="${c.c2}"/><rect x="16" y="16" width="16" height="16" fill="${c.c2}"/>`);
    case 18: // Tribal
      return pat(120, 80, bg(120, 80, c.c1) +
        `<path d="M0 40 Q30 0 60 40 Q90 80 120 40 L120 50 Q90 90 60 50 Q30 10 0 50 Z" fill="${c.ink}"/>` +
        `<path d="M30 20 L44 4 L40 26 Z M90 60 L104 76 L84 62 Z" fill="${c.c2}"/>`);
    case 19: { // Glitch
      let s = bg(160, 120, c.c1);
      let y = 0;
      while (y < 120) {
        const hgt = 2 + r() * 10, x = r() * 160, w = 20 + r() * 120;
        s += `<rect x="${R(x)}" y="${R(y)}" width="${R(w)}" height="${R(hgt)}" fill="${[c.c2, c.ink, c.c1l, '#ff2bd6', '#2bfff0'][Math.floor(r() * 5)]}" opacity=".85"/>`;
        y += hgt + r() * 8;
      }
      return pat(160, 120, s);
    }
    case 20: { // Étoiles
      let s = bg(120, 120, c.ink);
      for (let i = 0; i < 16; i++) {
        const x = r() * 120, y = r() * 120, k = 1 + r() * 4;
        s += `<path d="M${R(x)} ${R(y - k * 2)} L${R(x + k * 0.5)} ${R(y - k * 0.5)} L${R(x + k * 2)} ${R(y)} L${R(x + k * 0.5)} ${R(y + k * 0.5)} L${R(x)} ${R(y + k * 2)} L${R(x - k * 0.5)} ${R(y + k * 0.5)} L${R(x - k * 2)} ${R(y)} L${R(x - k * 0.5)} ${R(y - k * 0.5)} Z" fill="${i % 3 ? '#fff' : c.c2}"/>`;
      }
      return pat(120, 120, s);
    }
    case 21: { // Nébuleuse
      let s = `<radialGradient id="${id}n1"><stop offset="0" stop-color="${c.c2}" stop-opacity=".9"/><stop offset="1" stop-color="${c.c2}" stop-opacity="0"/></radialGradient>` +
        `<radialGradient id="${id}n2"><stop offset="0" stop-color="${c.c1l}" stop-opacity=".8"/><stop offset="1" stop-color="${c.c1l}" stop-opacity="0"/></radialGradient>` +
        bg(220, 220, c.ink);
      for (let i = 0; i < 6; i++) s += `<circle cx="${R(r() * 220)}" cy="${R(r() * 220)}" r="${R(40 + r() * 50)}" fill="url(#${id}n${1 + (i % 2)})"/>`;
      for (let i = 0; i < 30; i++) s += `<circle cx="${R(r() * 220)}" cy="${R(r() * 220)}" r="${R(r() * 1.4 + 0.3)}" fill="#fff"/>`;
      return pat(220, 220, s);
    }
    case 22: { // Rouille
      let s = bg(140, 140, c.c1);
      for (let i = 0; i < 40; i++) {
        s += `<circle cx="${R(r() * 140)}" cy="${R(r() * 140)}" r="${R(2 + r() * 10)}" fill="${['#7a3b12', '#a4521c', '#4a2410', c.c1d][i % 4]}" opacity="${R(0.35 + r() * 0.5)}"/>`;
      }
      return pat(140, 140, s);
    }
    case 23: // Hexagrammes
      return pat(48, 48, bg(48, 48, c.c1d) +
        `<path d="M24 6 L39 32 L9 32 Z M24 42 L9 16 L39 16 Z" fill="none" stroke="${c.c2}" stroke-width="2"/><circle cx="24" cy="24" r="3" fill="${c.c1l}"/>`);
    default:
      return `<linearGradient id="${id}"><stop offset="0" stop-color="${c.c1}"/></linearGradient>`;
  }
}

// Finitions (overlay sur les pièces peintes)
export function finishOverlay(id, f) {
  switch (f) {
    case 1: // Brossé
      return { def: `<pattern id="${id}" patternUnits="userSpaceOnUse" width="200" height="4"><rect width="200" height="1" fill="#fff" opacity=".18"/><rect y="2" width="140" height="1" fill="#000" opacity=".15"/></pattern>`, fill: `url(#${id})` };
    case 2: // Laqué
      return { def: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".36" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>`, fill: `url(#${id})` };
    case 3: // Anodisé
      return { def: `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cf" stop-opacity=".25"/><stop offset=".5" stop-color="#f7c" stop-opacity=".12"/><stop offset="1" stop-color="#fd6" stop-opacity=".22"/></linearGradient>`, fill: `url(#${id})` };
    case 4: // Givré
      return { def: `<pattern id="${id}" patternUnits="userSpaceOnUse" width="9" height="9"><circle cx="2" cy="3" r=".9" fill="#fff" opacity=".35"/><circle cx="7" cy="7" r=".6" fill="#fff" opacity=".25"/></pattern>`, fill: `url(#${id})` };
    case 5: // Céramique
      return { def: `<radialGradient id="${id}" cx=".35" cy=".2" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>`, fill: `url(#${id})` };
    default: // Mat
      return { def: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`, fill: `url(#${id})` };
  }
}

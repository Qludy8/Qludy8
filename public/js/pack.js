// Sachets de boosters : métal brillant à la couleur du booster, perforation, sceau avec l'affiche du jeu vedette.
import { S, artUrl } from './state.js';
import { matches } from '/shared/pools.js';
import { esc } from './util.js';
import { dailyTheme, GENRES } from '/shared/config.js';

const featuredCache = new Map();
const used = new Set();
// Jeu vedette du booster : l'un des plus populaires de sa réserve, jamais le même d'un booster à l'autre
// (le pack du jour suit le thème du jour)
export function featured(b, theme) {
  const key = b.id + (theme || '');
  if (featuredCache.has(key)) return featuredCache.get(key);
  const pool = theme ? { ...(b.pool || {}), genre: theme } : b.pool || {};
  const list = S.games.filter((g) => matches(g, pool) && g.i && !used.has(g.n));
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pick = list[h % Math.max(1, Math.min(list.length, 15))] || S.games[0];
  used.add(pick.n);
  featuredCache.set(key, pick);
  return pick;
}

export function packHTML(b, { kind = 'normal', theme = null } = {}) {
  const f = featured(b, theme);
  const src = f ? artUrl(f) : '';
  const sub = theme ? `Thème : ${GENRES[theme]?.label || ''}` : b.sub;
  return `<div class="pack ${kind === 'golden' ? 'golden' : kind === 'divine' ? 'divine' : ''}" style="--pc:${kind === 'normal' ? b.color : ''}">
    <div class="pouch">
      <div class="crinkle"></div><div class="crimp t"></div><div class="crimp b"></div>
      <div class="frame"></div><div class="perf"></div>
      <div class="brand"><span class="mk">ゲ</span>GĒMU</div>
      <div class="seal">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : ''}</div>
      <div class="kanji">${esc(b.kanji)}</div>
      <div class="pname">${esc(b.name)}</div>
      <div class="psub">${esc(sub)}</div>
      <div class="light"></div><div class="sheen"></div>
    </div>
  </div>`;
}

export const todayTheme = () => dailyTheme(new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date()));

// Page des boosters : stock gratuit, onglets Gratuits / Boutique / Du jour, ouverture.
import { S, onChange } from '../state.js';
import { packHTML, todayTheme } from '../pack.js';
import { openStage, ratesModal } from '../opening.js';
import { GENRES } from '/shared/config.js';
import { esc, fmt, gem, dur, prefs, $ } from '../util.js';

const CATS = [['free', 'Gratuits'], ['shop', 'Boutique'], ['limited', 'Du jour & limités']];

export async function render(main) {
  let cat = prefs.get('bcat', 'free');
  const draw = () => {
    const u = S.user;
    const list = S.boosters.filter((b) => b.cat === cat);
    const free = u.freePacks + u.bonusPacks;
    main.innerHTML = `
      <div class="eyebrow">BOOSTERS · ブースター</div>
      <h1 class="h1">Choisis ton booster</h1>
      <p class="lead">Des boosters gratuits se rechargent tout au long de la journée. Les jetons en débloquent d’autres.</p>
      <div class="free-hero">
        <div>
          <div class="mut" style="font-weight:700">Tes boosters gratuits</div>
          <div class="big">${u.freePacks}<span class="mut" style="font-size:18px">/${u.freePacksMax}</span>${u.bonusPacks ? ` <span style="font-size:16px;color:var(--sand)">+${u.bonusPacks} bonus</span>` : ''}</div>
          <div class="meter"><i style="width:${(u.freePacks / u.freePacksMax) * 100}%"></i></div>
          <div class="mut" style="font-size:12.5px;margin-top:6px" data-regen>${u.freePacks >= u.freePacksMax ? 'Stock plein : ouvre-les avant qu’ils ne se perdent !' : `Prochain dans ${dur(u.nextFreeAt - Date.now())} · 1 toutes les 10 min`}</div>
        </div>
        <div style="display:grid;gap:8px;justify-items:end">
          <div class="mut" style="font-size:12.5px">${u.goldenIn === 1 ? '<b style="color:var(--gold)">Le prochain booster sera doré !</b>' : `${u.goldenIn} avant le booster doré`} · ${u.pityThreshold - u.pityM} avant Mythique sûre</div>
          <button class="btn acc lg" data-open="standard" ${free ? '' : 'disabled'}>Ouvrir un booster gratuit</button>
        </div>
      </div>
      <div class="seg" style="margin-bottom:22px">${CATS.map(([k, l]) => `<button data-cat="${k}" class="${k === cat ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="boosters">${list.map((b) => {
        const theme = b.daily ? todayTheme() : null;
        const cost = b.daily ? (u.dailyAvailable ? '<span class="badge" style="--rc:var(--ok)">Gratuit · 1 par jour</span>' : '<span class="badge">Revient demain</span>')
          : b.usesFree ? `<span class="chip">Gratuit ou ${gem(b.price)}</span>` : `<span class="chip">${gem(b.price)}</span>`;
        return `<div class="b-tile" data-open="${b.id}">
          ${packHTML(b, { theme })}
          <div><div class="nm">${esc(b.name)}</div><div class="meta">${esc(theme ? `Thème du jour : ${GENRES[theme].label}` : b.sub)} · ${fmt(b.size)} jeux</div></div>
          <div class="cost">${cost}</div>
          <button class="chip" style="justify-self:center" data-rates="${b.id}">Chances</button>
        </div>`;
      }).join('')}</div>
      ${cat === 'free' ? `<p class="mut" style="margin-top:26px;font-size:13px">Les boosters « Gratuits » s’ouvrent avec ton stock gratuit ; une fois le stock vide, ils se paient en jetons. Gagne des jetons en recyclant tes doublons, en vendant au marché, avec la connexion quotidienne et les missions.</p>` : ''}
      ${cat === 'shop' ? `<p class="mut" style="margin-top:26px;font-size:13px">Les boosters de la boutique ne prennent pas les boosters gratuits : ils se paient toujours en jetons.</p>` : ''}`;
  };
  draw();
  main.addEventListener('click', (e) => {
    const r = e.target.closest('[data-rates]');
    if (r) { e.stopPropagation(); return ratesModal(S.boosters.find((b) => b.id === r.dataset.rates)); }
    const c = e.target.closest('[data-cat]');
    if (c) { cat = c.dataset.cat; prefs.set('bcat', cat); return draw(); }
    const o = e.target.closest('[data-open]');
    if (o) openStage(o.dataset.open, { onClose: draw });
  });
  const off = onChange((w) => { if (w === 'user' && !document.querySelector('.stage')) draw(); });
  const t = setInterval(() => {
    const el = $('[data-regen]', main);
    const u = S.user;
    if (el && u.nextFreeAt) el.textContent = `Prochain dans ${dur(u.nextFreeAt - Date.now())} · 1 toutes les 10 min`;
  }, 1000);
  return () => { off(); clearInterval(t); };
}

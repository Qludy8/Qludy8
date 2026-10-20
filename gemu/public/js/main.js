// Point d'entrée : démarrage (catalogue, compte invité), en-tête, navigation, routeur.
import { S, setUser, loadCatalog, loadCollection, onChange } from './state.js';
import { api } from './api.js';
import { esc, icon, fmt, gem, dur, modal, toast, $, prefs } from './util.js';
import { ECONOMY, CURRENCY } from '/shared/config.js';
import { sfx } from './fx.js';

const routes = [
  [/^\/$/, () => import('./pages/home.js')],
  [/^\/boosters\/?$/, () => import('./pages/boosters.js')],
  [/^\/collection(?:\/univers\/(.+))?\/?$/, () => import('./pages/collection.js')],
  [/^\/carte\/(\d+)\/?$/, () => import('./pages/fiche.js')],
  [/^\/missions\/?$/, () => import('./pages/missions.js')],
  [/^\/classement\/?$/, () => import('./pages/ranking.js')],
  [/^\/marche\/?$/, () => import('./pages/market.js')],
  [/^\/profil(?:\/(.+))?\/?$/, () => import('./pages/profile.js')],
  [/^\/raretes\/?$/, () => import('./pages/rarity.js')],
];

const NAV = [
  ['/', 'Accueil', icon.home], ['/boosters', 'Boosters', icon.pack], ['/collection', 'Collection', icon.cards],
  ['/missions', 'Missions', icon.target], ['/marche', 'Marché', icon.shop], ['/classement', 'Classement', icon.trophy],
];

function shell() {
  document.getElementById('app').innerHTML = `
    <header class="top"><div class="top-in">
      <a class="logo" href="/" data-nav><b>ゲ</b><span>Gēmu</span><small>ゲーム</small></a>
      <nav class="nav">${NAV.map(([h, l]) => `<a class="navlink" href="${h}" data-nav>${l}</a>`).join('')}</nav>
      <div class="top-r">
        <a class="p-stock" href="/boosters" data-nav title="Boosters gratuits"><span class="txt" data-free>–</span><span class="bars"><i data-freebar style="width:0"></i></span><span class="mut" data-next></span></a>
        <div class="wallet" title="Solde de ${CURRENCY.name}"><span class="gem-v" data-jetons>…</span>
          <a class="avatar" data-me href="/profil" data-nav aria-label="Mon profil"></a></div>
        <button class="icon-btn bell" data-bell aria-label="Notifications">${icon.bell}</button>
        <button class="icon-btn" data-menu aria-label="Ouvrir le menu">${icon.menu}</button>
      </div>
    </div></header>
    <main id="main"></main>
    <footer class="foot">Gēmu est un projet de fan non officiel, gratuit et sans achat. Les jeux, noms et visuels appartiennent à leurs éditeurs ;
      les images proviennent des pages officielles des jeux sur Steam et de leurs articles Wikipédia. <a href="/raretes" data-nav>Système de rareté</a></footer>
    <nav class="tabbar">
      ${[['/', 'Accueil', icon.home], ['/boosters', 'Boosters', icon.pack], ['/collection', 'Collection', icon.cards], ['/missions', 'Missions', icon.target]]
        .map(([h, l, i]) => `<a class="tab" href="${h}" data-nav>${i}<span>${l}</span></a>`).join('')}
      <button class="tab" data-menu>${icon.menu}<span>Plus</span></button>
    </nav>`;
}

function updateHeader() {
  const u = S.user;
  if (!u) return;
  $('[data-jetons]').innerHTML = `${fmt(u.jetons)} ${CURRENCY.icon}`;
  const me = $('[data-me]');
  me.style.setProperty('--h', u.hue);
  me.textContent = (u.username[0] || '?').toUpperCase();
  $('[data-free]').textContent = `${u.freePacks}/${u.freePacksMax}${u.bonusPacks ? ` +${u.bonusPacks}` : ''}`;
  $('[data-freebar]').style.width = `${(u.freePacks / u.freePacksMax) * 100}%`;
  document.querySelectorAll('.navlink, .tab').forEach((a) => {
    const href = a.getAttribute('href');
    a.querySelector('.dot')?.remove();
    if (href === '/missions' && u.claimable) a.insertAdjacentHTML('beforeend', '<i class="dot"></i>');
  });
  $('[data-bell]').querySelector('.dot')?.remove();
  if (u.unread) $('[data-bell]').insertAdjacentHTML('beforeend', '<i class="dot"></i>');
  tickTimer();
}

// minuterie du prochain booster gratuit
function tickTimer() {
  const u = S.user;
  const el = $('[data-next]');
  if (!u || !el) return;
  if (!u.nextFreeAt) { el.textContent = ''; return; }
  const left = u.nextFreeAt - Date.now();
  if (left <= 0) {
    if (!tickTimer.busy) { tickTimer.busy = true; api.get('/me').then((r) => setUser(r.user)).finally(() => setTimeout(() => { tickTimer.busy = false; }, 3000)); }
    return;
  }
  el.textContent = dur(left).replace(/ \d+$/, '').replace(/^(\d+ min) \d+$/, '$1');
}

function drawer() {
  const u = S.user;
  const bg = document.createElement('div');
  bg.innerHTML = `<div class="drawer-bg"></div><aside class="drawer">
    <div class="who"><span class="avatar" style="--h:${u.hue}">${esc(u.username[0].toUpperCase())}</span>
      <div><b>${esc(u.username)}</b><div class="mut" style="font-size:12px">${esc(u.rank)} · ${fmt(u.points)} pts</div></div></div>
    ${NAV.map(([h, l, i]) => `<a href="${h}" data-nav>${i.replace('<svg', '<svg width="18" height="18"')}${l}</a>`).join('')}
    <a href="/profil" data-nav>${icon.user.replace('<svg', '<svg width="18" height="18"')}Mon profil</a>
    <a href="/raretes" data-nav>${icon.star.replace('<svg', '<svg width="18" height="18"')}Système de rareté</a>
    <div class="sep"></div>
    <button class="row" data-pref="sound">${icon.sound.replace('<svg', '<svg width="18" height="18"')}Son : <b>${prefs.get('sound', true) ? 'activé' : 'coupé'}</b></button>
    <button class="row" data-pref="anim">✦ Animations : <b>${prefs.get('anim', true) ? 'activées' : 'réduites'}</b></button>
    <button class="row" data-pref="warnPaid">◆ Prévenir avant un booster payant : <b>${prefs.get('warnPaid', true) ? 'oui' : 'non'}</b></button>
    ${u.guest ? `<div class="sep"></div><div class="mut" style="font-size:12.5px;padding:0 12px">Compte invité : ta collection sera perdue si tu changes d’appareil.</div>
      <a href="/profil" data-nav class="btn acc block" style="justify-content:center;margin-top:8px">Protéger mon compte</a>` : ''}
  </aside>`;
  document.getElementById('layer').append(bg);
  const close = () => bg.remove();
  bg.addEventListener('click', (e) => {
    if (e.target.classList.contains('drawer-bg') || e.target.closest('[data-nav]')) close();
    const p = e.target.closest('[data-pref]');
    if (p) {
      const k = p.dataset.pref;
      prefs.set(k, !prefs.get(k, true));
      close(); drawer();
    }
  });
}

async function bell() {
  const list = await api.get('/notifications');
  S.user.unread = 0;
  updateHeader();
  modal(`<h3>Notifications</h3>${list.length ? `<div style="display:grid;gap:8px;margin-top:12px">${list.map((n) =>
    `<a class="panel" style="padding:12px 14px;display:block${n.seen ? ';opacity:.6' : ''}" href="${esc(n.link || '#')}" data-nav data-close>${esc(n.text)}<div class="mut" style="font-size:11.5px;margin-top:4px">${new Date(n.at).toLocaleString('fr-FR')}</div></a>`).join('')}</div>`
    : '<p class="mut">Rien de neuf pour l’instant.</p>'}`);
}

// --- routeur ---
let cleanup = null;
export async function navigate(path, { replace = false } = {}) {
  if (path !== location.pathname + location.search) history[replace ? 'replaceState' : 'pushState']({}, '', path);
  await render();
}
async function render() {
  const path = location.pathname;
  // conteneur neuf à chaque page : aucun écouteur ne survit d'une page à l'autre
  const old = document.getElementById('main');
  const main = old.cloneNode(false);
  old.replaceWith(main);
  cleanup?.(); cleanup = null;
  document.querySelectorAll('.navlink, .tab').forEach((a) => {
    const h = a.getAttribute('href');
    a.classList.toggle('on', !!h && (h === '/' ? path === '/' : path.startsWith(h)));
  });
  for (const [re, load] of routes) {
    const m = path.match(re);
    if (m) {
      const mod = await load();
      if (main !== document.getElementById('main')) return;
      const y = path === render.last ? scrollY : 0;
      render.last = path;
      main.innerHTML = '';
      cleanup = (await mod.render(main, m.slice(1).map((x) => (x ? decodeURIComponent(x) : x)))) || null;
      window.scrollTo(0, y);
      return;
    }
  }
  main.innerHTML = `<div class="empty" style="margin-top:40px"><strong>Page introuvable</strong>L’adresse est peut-être mal tapée, ou la page a changé de place.<br><br><a class="btn" href="/" data-nav>Retour à l’accueil</a></div>`;
}

function loginReward(r) {
  if (!r) return;
  sfx.coin();
  modal(`<div class="eyebrow">CONNEXION · 連続</div><h3 style="margin-top:8px">Série de ${r.streak} jour${r.streak > 1 ? 's' : ''} !</h3>
    <p class="mut">Reviens chaque jour : la récompense grimpe jusqu’au 7ᵉ jour, qui offre aussi un booster gratuit.</p>
    <div class="streak" style="margin:16px 0">${r.table.map((j, i) => `<div class="d ${i < r.step ? 'on' : ''} ${i === r.step - 1 ? 'today' : ''}"><small>J${i + 1}</small><b>${j}</b>${i === 6 ? '<small>+1 booster</small>' : ''}</div>`).join('')}</div>
    <p style="text-align:center;font-size:18px">+${gem(r.jetons)}${r.packs ? ' · +1 booster gratuit' : ''}</p>
    <button class="btn acc block" data-close>Réclamer</button>`);
}

async function boot() {
  shell();
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (a && a.origin === location.origin && !a.target && !e.metaKey && !e.ctrlKey && !e.shiftKey && !a.hasAttribute('download')) {
      e.preventDefault();
      document.querySelectorAll('.modal-bg, .inspect').forEach((m) => m.remove());
      navigate(a.pathname + a.search);
      return;
    }
    if (e.target.closest('[data-menu]')) drawer();
    if (e.target.closest('[data-bell]')) bell();
  });
  addEventListener('popstate', render);
  addEventListener('gemu:refresh', () => { if (!document.querySelector('.stage')) render(); });
  onChange((w) => { if (w === 'user') updateHeader(); });
  setInterval(tickTimer, 1000);

  const [, , boosters] = await Promise.all([
    loadCatalog(),
    (async () => {
      let r = await api.get('/me');
      if (!r.user) r = await api.post('/guest');
      setUser(r.user);
      setTimeout(() => loginReward(r.login), 900);
    })(),
    api.get('/boosters'),
  ]);
  S.boosters = boosters;
  await loadCollection();
  updateHeader();
  await render();
  document.getElementById('boot').classList.add('gone');
  setTimeout(() => document.getElementById('boot')?.remove(), 400);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('boot')?.remove();
  document.getElementById('app').innerHTML = `<div class="empty" style="margin:60px auto;max-width:480px"><strong>Quelque chose a coincé.</strong>${esc(e.message)}<br><br><button class="btn" onclick="location.reload()">Recharger la page</button></div>`;
});

export { toast, ECONOMY };

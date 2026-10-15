// Mugigo – application monopage : en-tête, routeur, pages Accueil (+ boosters) / Connexion / Récompenses / Paramètres / Aide / Boutique.
import { BRAND, SHOP, COLLECTIONS, QUEST_DIFF, RARITIES, WEAR, ECONOMY, PITY, GRADING, CENTERING, MISPRINT, MODIFIERS, LEGAL, DISCORD, TRADE_UP, CURRENCY } from '/shared/config.js';
import { SKINS, SKIN_BY_ID, MODELS } from '/shared/catalog.js';
import { PACKS, packFilter } from '/shared/packs.js';
import { patternsPage } from './pages/patterns.js';
import { api, post, store } from './api.js';
import { t, tr, L, fmt, locale, getLang, LANGS, switchLang } from '/shared/i18n.js';
import { esc, cr, ago, dur, toast, modal, initTilt, animateNumber, avatar, $, $$ } from './ui.js';
import { packSVG } from './art/pack.js';
import { cardHTML } from './art/card.js';
import { openSequence, cardOf } from './opening.js';
import { skinTitle } from './common.js';
import { sound } from './fx.js';
import { collectionPage } from './pages/collection.js';
import { inventoryPage, cardPage, gradingPage } from './pages/inventory.js';
import { marketPage } from './pages/market.js';
import { friendsPage, tradesPage, tradePage, newTradePage, profilePage, leaderboardPage } from './pages/social.js';

let view = $('#view');
let renderToken = 0;
const timers = new Set();
const every = (fn, ms) => { const t = setInterval(fn, ms); timers.add(t); return t; };
// icône de la monnaie, pourcentage et pluriel selon la langue
const MU = `<i class="mu" aria-label="Mu">${CURRENCY.symbol}</i>`;
const pct = (s) => (getLang() === 'en' ? `${s}%` : `${s} %`);
const pl = (n, one, many) => ((getLang() === 'en' ? n === 1 : n < 2) ? one : many);
const dec2 = (n) => fmt(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ───────────────────────────── En-tête
const NAV = [
  ['', t('Boosters')], ['collection', t('Collection')], ['inventory', t('Inventaire')], ['market', t('Marché')],
  ['trades', t('Échanges'), 'openTrades'], ['friends', t('Amis'), 'friendRequests'], ['leaderboard', t('Classement')], ['patterns', t('Motifs')],
];
// sélecteur de langue : bascule FR ⇄ EN (la page se recharge dans la nouvelle langue)
const langButton = () => {
  const next = LANGS.find((l) => l.key !== getLang());
  return `<button class="lang-btn" data-lang="${next.key}" title="${esc(next.label)}"><b>${LANGS.find((l) => l.key === getLang()).short}</b><span>${next.short}</span></button>`;
};
document.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b) switchLang(b.dataset.lang); });
function header(me) {
  const route = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  $('#nav').innerHTML = NAV.map(([k, label, badge]) =>
    `<a href="#/${k}" class="${route === k ? 'on' : ''}">${label}${badge && me?.[badge] ? `<span class="dot">${me[badge]}</span>` : ''}</a>`).join('')
    + `<a href="#/shop" class="nav-locked ${route === 'shop' ? 'on' : ''}" title="${t('Bientôt disponible')}">${t('Boutique')} <span aria-hidden="true">🔒</span></a>`;
  const right = $('#top-right');
  if (!me) {
    right.innerHTML = `${langButton()}<a class="btn sm ghost" href="#/login">${t('Connexion')}</a><a class="btn sm primary" href="#/register">${t('Jouer gratuitement')}</a>`;
    return;
  }
  if (!right.querySelector('.balance')) {
    right.innerHTML = `
      <a class="icon-btn" href="#/rewards" title="${t('Récompenses')}">🎁<span class="dot" data-daily hidden>!</span></a>
      <button class="icon-btn" data-notif title="${t('Notifications')}">🔔<span class="dot" data-unread hidden></span></button>
      ${langButton()}
      <button class="admin-toggle" data-admin hidden title="${t('Mode admin de test : Mu illimités, gradation instantanée')}"><i></i><span>Admin</span></button>
      <a class="balance" href="#/rewards" title="${t('Solde')}"><span data-bal>0</span>${MU}</a>
      <button class="user-chip" data-menu>${avatar(me, 30)}<span class="name">${esc(me.username)}</span></button>`;
    right.querySelector('[data-notif]').onclick = showNotifications;
    right.querySelector('[data-menu]').onclick = userMenu;
    right.querySelector('[data-admin]').onclick = async (e) => {
      const btn = e.currentTarget; btn.disabled = true;
      try {
        store.set(await post('/admin/toggle', { on: !store.me.admin }));
        toast(store.me.admin ? t('Mode admin activé : Mu illimités, gradation instantanée') : t('Mode admin désactivé'), 'good');
      } catch (err) { toast(err.message, 'error'); }
      btn.disabled = false;
    };
  }
  const adm = right.querySelector('[data-admin]');
  adm.hidden = !me.adminToggle; adm.classList.toggle('on', !!me.admin); adm.setAttribute('aria-pressed', String(!!me.admin));
  right.querySelector('.balance').classList.toggle('infinite', !!me.admin);
  if (me.admin) right.querySelector('[data-bal]').textContent = '∞';
  else animateNumber(right.querySelector('[data-bal]'), me.balance);
  const dd = right.querySelector('[data-daily]'); dd.hidden = !(me.daily.available || me.questsReady); dd.textContent = me.questsReady || '!';
  const un = right.querySelector('[data-unread]');
  un.hidden = !(me.unread + me.gradingReady); un.textContent = me.unread + me.gradingReady;
}
function userMenu() {
  const me = store.me;
  const m = modal(`<div class="row">${avatar(me, 54)}<div><h2 style="margin:0">${esc(me.username)}</h2>
    <div class="muted small">${t('Niveau {n}', { n: me.level.level })} ${me.discord.verified ? `· <span class="verified">${t('✔ Discord vérifié')}</span>` : ''}</div></div></div>
    <div class="bar" style="margin:16px 0 6px"><i style="width:${me.level.next ? ((me.level.xp - me.level.cur) / (me.level.next - me.level.cur)) * 100 : 100}%"></i></div>
    <div class="muted small">${fmt(me.level.xp)} XP${me.level.next ? ` / ${fmt(me.level.next)}` : ''}</div>
    <div class="grid" style="margin-top:18px;grid-template-columns:1fr 1fr;gap:10px">
      <a class="btn" href="#/u/${encodeURIComponent(me.username)}">${t('Mon profil')}</a><a class="btn" href="#/grading">${t('Gradation')}${me.gradingReady ? ` (${me.gradingReady})` : ''}</a>
      <a class="btn" href="#/rewards">${t('Récompenses')}</a><a class="btn" href="#/settings">${t('Paramètres')}</a>
      <a class="btn" href="#/help">${t('Aide & règles')}</a><button class="btn danger" data-logout>${t('Déconnexion')}</button>
    </div>`);
  m.el.addEventListener('click', (e) => { if (e.target.closest('a')) m.close(); });
  m.el.querySelector('[data-logout]').onclick = async () => { await post('/auth/logout'); m.close(); store.set(null); location.hash = '#/'; };
}
async function showNotifications() {
  const list = await api('/notifications');
  const me = store.me;
  const n = me.gradingReady;
  const m = modal(`<h2>${t('Notifications')}</h2>
    ${n ? `<a class="btn cyan" href="#/grading" style="width:100%;margin-bottom:12px">${pl(n, t('{n} gradation prête à révéler', { n }), t('{n} gradations prêtes à révéler', { n }))}</a>` : ''}
    <div class="notif-list">${list.length ? list.map((x) => `<a href="${esc(x.link || '#/')}" class="${x.read ? '' : 'unread'}">${esc(tr(x.text))}<div class="muted small">${ago(x.at)}</div></a>`).join('') : `<div class="empty">${t('Rien de neuf.')}</div>`}</div>`);
  m.el.addEventListener('click', (e) => { if (e.target.closest('a')) m.close(); });
  store.refresh();
}

// ───────────────────────────── Ouverture de booster (partagée)
export async function openPack(key, count = 1) {
  const pack = PACKS.find((p) => p.key === key);
  if (!store.me) { location.hash = '#/register'; return; }
  try {
    const res = await post(`/packs/${key}/open`, { count });
    store.refresh();
    openSequence(pack, res, { onAgain: () => openPack(key, count) });
  } catch (e) { toast(esc(e.message), 'error'); }
}

function ratesBar(p) {
  return `<div class="pack-rates">${p.rates.map((r, i) => (r ? `<i style="width:${Math.max(r, 0.6)}%;background:${RARITIES[i].color}" title="${esc(L(RARITIES[i]))} ${pct(fmt(r))}"></i>` : '')).join('')}</div>`;
}
function freeLabel(f) {
  return f.stock >= f.max ? t('{a}/{b} disponibles', { a: f.stock, b: f.max }) : t('{a}/{b} · +1 dans {time}', { a: f.stock, b: f.max, time: dur(f.nextAt - Date.now()) });
}
function packTile(p, me, i = 0) {
  let price = `<span class="price">${fmt(p.price)} ${MU}</span>`;
  if (p.free) price = `<span class="price free-timer" data-free-label>${me ? t('{a}/{b} disponibles', { a: me.free.stock, b: me.free.max }) : t('Gratuit')}</span>`;
  else if (p.key === 'standard' && me?.welcomePacks) { const n = me.welcomePacks; price += ` <span class="pill tag-new">${pl(n, t('{n} offert', { n }), t('{n} offerts', { n }))}</span>`; }
  return `<div class="pack-tile tile" style="--t1:${p.theme[0]};--t2:${p.theme[1]};--i:${i}" data-pack="${p.key}">
    <div class="pack-art">${packSVG(p)}</div>
    <div><h3>${esc(L(p))}</h3><div class="muted small">${esc(L(p, 'tag'))}</div></div>
    ${ratesBar(p)}
    <div class="row between">${price}<button class="btn sm primary" data-open="${p.key}">${t('Ouvrir')}</button></div>
  </div>`;
}
// Arrondi à 2 décimales dont la somme fait exactement 100 (méthode du plus fort reste)
function pct100(rates) {
  const raw = rates.map((r) => r * 100), fl = raw.map(Math.floor);
  let left = 10000 - fl.reduce((a, b) => a + b, 0);
  raw.map((x, i) => [x - fl[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0 && rates[i] > 0) { fl[i]++; left--; } });
  return fl.map((x) => x / 100);
}
// Curseurs proportionnels : chaque remplissage = son pourcentage ; mis bout à bout ils forment exactement une barre
function rateSliders(p) {
  const shown = pct100(p.rates);
  let acc = 0;
  const stacked = p.rates.map((r, i) => { const seg = r ? `<i style="left:${acc}%;width:${r}%;background:${RARITIES[i].color};--rg:${RARITIES[i].glow}" title="${esc(L(RARITIES[i]))} ${pct(fmt(shown[i]))}"></i>` : ''; acc += r; return seg; }).join('');
  return `<div class="rate-stack">${stacked}</div>
    <div class="rate-list">${p.rates.map((r, i) => (r ? `<div class="rate-row" style="--rc:${RARITIES[i].color};--rg:${RARITIES[i].glow}">
      <span class="rate-name">${esc(L(RARITIES[i]))}</span>
      <div class="slider-track"><i style="width:${r}%"></i><b style="left:${r}%"></b></div>
      <span class="rate-val">${pct(dec2(shown[i]))}</span></div>` : '')).join('')}
      <div class="rate-row rate-total"><span class="rate-name">${t('Total')}</span><div></div><span class="rate-val">${pct(dec2(shown.reduce((a, b) => a + b, 0)))}</span></div></div>`;
}
function bindPacks(root) {
  root.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) { e.stopPropagation(); return openPack(o.dataset.open, 1); }
    const t = e.target.closest('[data-pack]');
    if (t) packModal(t.dataset.pack);
  });
}
function freeTicker() {
  every(() => {
    const me = store.me; if (!me) return;
    for (const el of $$('[data-free-label]')) {
      const f = me.free;
      el.textContent = freeLabel(f);
      if (f.nextAt && Date.now() > f.nextAt) store.refresh();
    }
  }, 1000);
}

function packModal(key) {
  const p = PACKS.find((x) => x.key === key);
  const pool = SKINS.filter(packFilter(p.filter));
  const me = store.me;
  const atLeast = (r) => p.rates.slice(r).reduce((a, b) => a + b, 0) / 100;
  const pity = [[3, me?.pity.ultra, PITY.ultraAfter, `${L(RARITIES[3])}+`], [4, me?.pity.legend, PITY.legendaryAfter, `${L(RARITIES[4])}+`],
    ...(p.rates[6] >= PITY.transcendentMinRate ? [[6, me?.pity.trans, PITY.transcendentAfter, L(RARITIES[6])]] : [])];
  const m = modal(`<div class="grid pack-modal" style="grid-template-columns:minmax(160px,240px) 1fr;gap:26px;align-items:start">
      <div class="pack-art" style="width:100%">${packSVG(p)}</div>
      <div>
        <h2 style="margin-bottom:4px">${esc(L(p))}</h2><p class="muted" style="margin-top:0">${esc(L(p, 'tag'))} · ${t('{n} cartes', { n: p.cards })} · <b class="glow-text" style="--gc:${p.theme[1]}">${t('{n} skins possibles', { n: fmt(pool.length) })}</b></p>
        <h3>${t('Taux par carte')}</h3>${rateSliders(p)}
        ${p.free ? `<p class="muted small">${t('Un colis toutes les {m} min, jusqu’à {max} en réserve.', { m: ECONOMY.free.intervalMs / 60e3, max: ECONOMY.free.maxStock })}</p>` : `
        <h3 style="margin-top:18px">${t('Simulateur')}</h3>
        <label class="slider-field"><span>${t('Si j’ouvre {n} boosters…', { n: '<b data-sim-n class="glow-text" style="--gc:#ffb020">10</b>' })}</span>
          <input type="range" class="range" min="1" max="100" value="10" data-sim style="--fill:9%" aria-label="${t('Nombre de boosters')}"></label>
        <div class="sim-grid" data-sim-out></div>
        <div class="pity-box">${pity.map(([r, cur, max, lab]) => `
          <div class="pity-row" style="--rc:${RARITIES[r].color};--rg:${RARITIES[r].glow}"><span>${t('{lab} garanti', { lab: esc(lab) })}</span><div class="slider-track"><i style="width:${me ? Math.min(100, (cur / max) * 100) : 0}%"></i></div><b>${me ? cur : 0}/${max}</b></div>`).join('')}
          <p class="muted small" style="margin:6px 0 0">${t('Compteurs de boosters payants consécutifs sans cette rareté (le compteur Transcendant ne progresse qu’avec les boosters premium : taux Transcendant ≥ {rate} par carte).', { rate: pct(fmt(PITY.transcendentMinRate)) })}</p></div>`}
        <div class="row" style="margin-top:16px">
          ${p.free ? `<button class="btn primary" data-n="1">${t('Ouvrir 1')}</button>${me?.free.stock > 1 ? `<button class="btn" data-n="${me.free.stock}">${t('Tout ouvrir ({n})', { n: me.free.stock })}</button>` : ''}`
    : [1, 5, 10].map((n) => `<button class="btn ${n === 1 ? 'primary' : ''}" data-n="${n}">×${n} · ${fmt(n * p.price)} ${MU}</button>`).join('')}
        </div>
      </div></div>`, { wide: true });
  const sim = m.el.querySelector('[data-sim]');
  const upd = () => {
    const n = Number(sim.value), cards = n * p.cards;
    m.el.querySelector('[data-sim-n]').textContent = n;
    sim.style.setProperty('--fill', `${((n - 1) / 99) * 100}%`);
    const mp = 1 - (1 - MISPRINT.chance) ** cards;
    m.el.querySelector('[data-sim-out]').innerHTML = [3, 4, 5, 6].filter((r) => atLeast(r) > 0).map((r) => {
      const pr = 1 - (1 - atLeast(r)) ** cards;
      return `<div class="sim-cell" style="--rc:${RARITIES[r].color}"><b>${pct(fmt(pr * 100, { minimumFractionDigits: pr > 0.995 ? 0 : 1, maximumFractionDigits: pr > 0.995 ? 0 : 1 }))}</b><span>${esc(L(RARITIES[r]))}${r < 6 ? '+' : ''}</span><div class="bar"><i style="width:${pr * 100}%;background:${RARITIES[r].color}"></i></div></div>`;
    }).join('') + `<div class="sim-cell" style="--rc:#ff2b6a"><b>${pct(dec2(mp * 100))}</b><span>${t('Carte erreur')}</span><div class="bar"><i style="width:${mp * 100}%;background:#ff2b6a"></i></div></div>`;
  };
  if (sim) { sim.addEventListener('input', upd); upd(); }
  m.el.addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) { m.close(); openPack(key, Number(b.dataset.n)); } });
}

// ───────────────────────────── Pages
function feedItem(f) {
  const skin = SKIN_BY_ID.get(f.card.s); const R = RARITIES[f.card.r];
  const what = `<b>${f.card.mp ? t('une CARTE ERREUR') : esc(L(R))}</b>`;
  return `<a class="feed-item" href="#/card/${f.card.id}" style="--rc:${f.card.mp ? '#ff2b6a' : R.color}">${cardOf(f.card, { small: true, lite: true, noSlab: true })}
    <div class="t">${t('{user} a obtenu {what}', { user: `<span class="muted">${esc(f.username)}</span>`, what })}<br>${esc(skinTitle(skin))}</div>
    <div class="small muted" style="text-align:right">${cr(f.card.value)}<br>${ago(f.at)}</div></a>`;
}

async function home({ token }) {
  const me = store.me;
  const [feed, stats] = await Promise.all([api('/feed'), api('/stats')]);
  if (token !== renderToken) return;
  const showcase = [SKINS.find((s) => s.r === 5 && s.m === 'nightfang' && s.st === 'art') || SKINS.find((s) => s.r === 5 && s.m === 'nightfang'), SKINS.find((s) => s.r === 6 && s.m === 'rhoden'), SKINS.find((s) => s.r === 5 && s.m === 'lumen')];
  const groups = [
    ['base', t('Boosters'), '부스터', t('Les grands classiques : tout le catalogue ou une famille d’armes.')],
    ['collection', t('Collections'), '컬렉션', t('Dix univers illustrés : chaque booster ne contient que les skins de sa collection.')],
    ['model', t('Par arme'), '무기', t('Ciblez votre modèle préféré.')],
  ];
  view.innerHTML = `
    <section class="hero hero-compact">
      <div>
        <div class="pill" style="margin-bottom:12px">⚡ ${t('{n} cartes · {p} boosters', { n: `<b class="glow-text" style="--gc:#ffb020">${fmt(stats.skins)}</b>`, p: PACKS.length })}</div>
        <h1>${t('Collectionnez l’<span class="grad-text">arsenal</span> le plus rare.')}</h1>
        <p>${t('Traquez les floats parfaits, les <b style="color:#ffd76a">graines rares</b>, les cartes les mieux centrées et les <b style="color:#ff5a8a">cartes erreur</b> (1 sur {n}). Échangez avec vos amis et dominez le classement.', { n: fmt(Math.round(1 / MISPRINT.chance)) })}</p>
        <div class="row" style="margin-top:18px">
          ${me ? `<button class="btn primary xl" data-quick-free>${t('Ouvrir un colis gratuit ({n})', { n: me.free.stock })}</button>${me.daily.available ? `<button class="btn xl" data-daily>🎁 ${t('Récompense du jour +{r} {mu}', { r: fmt(me.daily.reward), mu: MU })}</button>` : ''}`
    : `<a class="btn primary xl" href="#/register">${t('Commencer – {start} {mu} + {packs} boosters offerts', { start: fmt(ECONOMY.startBalance), mu: MU, packs: ECONOMY.welcomePacks })}</a><a class="btn xl" href="#/collection">${t('Voir la collection')}</a>`}
        </div>
        <div class="stats"><div><b style="color:#5ff3ff">${fmt(stats.players)}</b>${t('joueurs')}</div><div><b style="color:#b266ff">${fmt(stats.cards)}</b>${t('cartes en circulation')}</div><div><b style="color:#4ade80">${fmt(stats.listings)}</b>${t('annonces au marché')}</div></div>
      </div>
      <div class="hero-cards">${showcase.map((s, i) => cardHTML(s, { f: [0.012, 0.0004, 0.09][i], cx: 50, cy: 50, tr: null, mp: null, g: null, pt: 7, serial: 'MG-VITRINE' })).join('')}</div>
    </section>
    <div class="home-grid">
      <div>${groups.map(([g, title, ko, sub]) => `
        <div class="section-title"><div><h2>${title} <span class="ko">${ko}</span></h2><div class="muted small">${sub}</div></div></div>
        <div class="packs" data-packs>${PACKS.filter((p) => p.group === g).sort((a, b) => (b.free ? 1 : 0) - (a.free ? 1 : 0)).map((p, i) => packTile(p, me, i)).join('')}</div>`).join('')}</div>
      <aside class="feed-col"><div class="section-title"><h2>${t('Drops en direct')}</h2><span class="pill"><span class="online on"></span> live</span></div>
        <div class="panel feed" data-feed>${feed.map(feedItem).join('') || `<div class="empty">${t('Aucun drop pour l’instant')}</div>`}</div></aside>
    </div>`;
  view.querySelectorAll('[data-packs]').forEach(bindPacks);
  $('[data-quick-free]', view)?.addEventListener('click', () => openPack('free', 1));
  $('[data-daily]', view)?.addEventListener('click', claimDaily);
  let last = feed[0]?.at || 0;
  every(async () => {
    const f = await api('/feed').catch(() => []);
    const fresh = f.filter((x) => x.at > last);
    if (!fresh.length) return;
    last = f[0].at;
    $('[data-feed]', view)?.insertAdjacentHTML('afterbegin', fresh.map(feedItem).join(''));
  }, 8000);
}

async function claimDaily() {
  try {
    const r = await post('/daily');
    sound.play('coin');
    toast(t('Jour {n} : +{reward}', { n: r.streak, reward: cr(r.reward) }), 'good');
    await store.refresh(); route();
  } catch (e) { toast(esc(e.message), 'error'); }
}

function shopPage() {
  view.innerHTML = `<div class="shop-lock panel">
    <div class="shop-icon">🔒</div>
    <h1>${t('Boutique')} <span class="ko">상점</span></h1>
    <p class="muted">${t('La boutique n’est pas encore ouverte.')} ${SHOP.enabled ? '' : t('Aucun achat n’est possible pour le moment : toutes les cartes s’obtiennent en jouant.')}</p>
    <a class="btn primary" href="#/">${t('Retour aux boosters')}</a></div>`;
}

function authPage(mode) {
  view.innerHTML = `<div class="auth-box panel">
    <div class="tabs" style="margin-bottom:18px"><button class="${mode === 'login' ? 'on' : ''}" data-m="login">${t('Connexion')}</button><button class="${mode === 'register' ? 'on' : ''}" data-m="register">${t('Inscription')}</button></div>
    <form class="grid" style="gap:14px">
      ${mode === 'register'
    ? `<label class="field">${t('Pseudo')}<input class="input" name="username" required minlength="3" maxlength="20" autocomplete="username"></label>
         <label class="field">${t('E-mail (facultatif)')}<input class="input" name="email" type="email" autocomplete="email"></label>`
    : `<label class="field">${t('Pseudo ou e-mail')}<input class="input" name="login" required autocomplete="username"></label>`}
      <label class="field">${t('Mot de passe')}<input class="input" name="password" type="password" required minlength="${mode === 'register' ? 8 : 1}" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}"></label>
      <button class="btn primary xl">${mode === 'register' ? t('Créer mon compte · {n} {mu} offerts', { n: fmt(ECONOMY.startBalance), mu: MU }) : t('Se connecter')}</button>
      ${mode === 'register' ? `<p class="muted small">${t('Vous recevez {start} {mu}, {packs} Caisses Standard et 2 colis gratuits. Liez Discord ensuite pour débloquer le marché et les échanges (+{bonus} {mu}).', { start: fmt(ECONOMY.startBalance), mu: MU, packs: ECONOMY.welcomePacks, bonus: fmt(DISCORD.verifyBonus) })}</p>` : ''}
    </form></div>`;
  $$('[data-m]', view).forEach((b) => { b.onclick = () => { location.hash = `#/${b.dataset.m}`; }; });
  $('form', view).onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      store.set(await post(`/auth/${mode}`, body));
      toast(mode === 'register' ? t('Bienvenue sur Mugigo !') : t('Connecté'), 'good');
      location.hash = '#/';
    } catch (err) { toast(esc(err.message), 'error'); }
  };
}

async function rewardsPage({ token }) {
  const [missions, txs] = await Promise.all([api('/missions'), api('/transactions')]);
  if (token !== renderToken) return;
  const me = store.me, d = me.daily;
  const doneDays = d.available ? d.streak : d.streak;
  const quests = [['daily', t('Quêtes du jour'), t('Réinitialisées chaque jour')], ['weekly', t('Quêtes de la semaine'), t('Réinitialisées chaque lundi')], ['long', t('Exploits'), t('Une seule fois, pour les plus acharnés')]];
  view.innerHTML = `<h1>${t('Récompenses')}</h1>
    <div class="grid cols-2">
      <div class="panel"><div class="row between"><h2>${t('Connexion quotidienne')}</h2><span class="pill">${pl(d.streak, t('Série : {n} jour', { n: d.streak }), t('Série : {n} jours', { n: d.streak }))}</span></div>
        <div class="daily">${d.table.map((v, i) => {
    const pos = ((doneDays - 1) % 7 + 7) % 7;
    const done = doneDays > 0 && i <= pos && !(d.available && d.nextStreak === 1);
    const nxt = d.available && i === (d.nextStreak - 1) % 7;
    return `<div class="${done && !nxt ? 'done' : ''} ${nxt ? 'next' : ''}">${t('J{n}', { n: i + 1 })}<b>${fmt(v)}</b></div>`;
  }).join('')}</div>
        <div class="row between" style="margin-top:16px"><span class="muted small">${t('La série repart à zéro si vous manquez un jour.')}</span>
          <button class="btn primary" data-daily ${d.available ? '' : 'disabled'}>${d.available ? t('Réclamer +{r} {mu}', { r: fmt(d.reward), mu: MU }) : t('Revenez demain')}</button></div>
      </div>
      <div class="panel"><h2>${t('Comment gagner des Mu ?')}</h2><ul class="muted" style="line-height:1.9;padding-left:18px;margin:0">
        <li>${t('Colis gratuit toutes les {m} min (réserve de {max})', { m: ECONOMY.free.intervalMs / 60e3, max: ECONOMY.free.maxStock })}</li>
        <li>${t('Connexion quotidienne et quêtes ci-dessous (certaines offrent des Caisses Mugigo)')}</li>
        <li>${t('Vente au marché, vente au système, contrats et cartes rares')}</li></ul></div>
    </div>
    ${quests.map(([g, title, sub]) => `
    <div class="section-title"><div><h2>${title}</h2><div class="muted small">${sub}</div></div></div>
    <div class="quest-grid">${missions[g].map((m) => { const D = QUEST_DIFF[m.diff]; const done = m.progress >= m.target; return `<div class="mission ${done && !m.claimed ? 'ready' : ''} ${m.claimed ? 'claimed' : ''}" style="--qc:${D.color}">
      <div class="row between"><span class="pill r" style="--rc:${D.color}">${esc(L(D))}</span><span class="reward">+${fmt(m.reward)} ${MU}${m.packs ? ` · ${pl(m.packs, t('{n} caisse', { n: m.packs }), t('{n} caisses', { n: m.packs }))}` : ''}</span></div>
      <b>${esc(L(m))}</b>
      <div class="bar"><i style="width:${(m.progress / m.target) * 100}%;background:${D.color}"></i></div>
      <div class="row between small"><span class="muted">${fmt(m.progress)} / ${fmt(m.target)}</span>
      ${m.claimed ? `<span class="pos">${t('✓ Réclamée')}</span>` : `<button class="btn sm ${done ? 'primary' : ''}" data-claim="${m.key}" ${done ? '' : 'disabled'}>${t('Réclamer')}</button>`}</div></div>`; }).join('')}</div>`).join('')}
    <div class="section-title"><h2>${t('Historique des transactions')}</h2></div>
    <div class="panel" style="overflow:auto"><table class="t"><thead><tr><th>${t('Date')}</th><th>${t('Type')}</th><th>${t('Détail')}</th><th style="text-align:right">${t('Montant')}</th><th style="text-align:right">${t('Solde')}</th></tr></thead>
      <tbody>${txs.map((x) => `<tr><td class="muted small">${new Date(x.at).toLocaleString(locale())}</td><td>${esc(x.type)}</td><td class="muted">${esc(tr(x.note || ''))}</td>
        <td style="text-align:right" class="${x.amount >= 0 ? 'pos' : 'neg'}">${x.amount >= 0 ? '+' : ''}${fmt(x.amount)}</td><td style="text-align:right">${fmt(x.balance_after)}</td></tr>`).join('')}</tbody></table></div>`;
  $('[data-daily]', view).onclick = claimDaily;
  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-claim]'); if (!b) return;
    try { await post(`/missions/${b.dataset.claim}/claim`); sound.play('coin'); toast(t('Quête réclamée !'), 'good'); await store.refresh(); route(); } catch (err) { toast(esc(err.message), 'error'); }
  });
}

function settingsPage({ query }) {
  const me = store.me;
  if (query.get('discord') === 'ok') toast(t('Compte Discord vérifié !'), 'good');
  if (query.get('discord') === 'error') toast(esc(query.get('msg') ? tr(query.get('msg')) : t('Vérification impossible')), 'error');
  const dc = me.discord;
  view.innerHTML = `<h1>${t('Paramètres')}</h1><div class="grid cols-2">
    <div class="panel"><h2>${t('Vérification Discord')}</h2>
      <p class="muted">${t('Lier un compte Discord (âgé d’au moins {days} jours) prouve que vous êtes une vraie personne : cela protège le marché et les échanges contre les multi-comptes. Un compte Discord ne peut être lié qu’à un seul joueur.', { days: DISCORD.minAccountAgeDays })}</p>
      ${dc.verified ? `<div class="pill" style="color:#8b9cff">${t('✔ Vérifié : {name}', { name: esc(dc.name || '') })}</div>`
    : dc.mode === 'oauth' ? `<a class="btn discord xl" href="/api/discord/start">${t('Vérifier avec Discord · +{bonus} {mu}', { bonus: fmt(DISCORD.verifyBonus), mu: MU })}</a>`
      : dc.mode === 'mock' ? `<button class="btn discord xl" data-mock>${t('Vérification simulée (mode dev) · +{bonus} {mu}', { bonus: fmt(DISCORD.verifyBonus), mu: MU })}</button>`
        : `<div class="pill">${t('Discord n’est pas configuré sur ce serveur : les fonctions sociales sont ouvertes à tous.')}</div>`}
      <p class="muted small" style="margin-top:14px">${t('Nécessaire pour : vendre sur le marché, envoyer des demandes d’ami et faire des échanges.')}</p>
    </div>
    <div class="panel"><h2>${t('Profil')}</h2><form class="grid" style="gap:14px" data-profile>
      <label class="field">${t('Bio')}<textarea class="input" name="bio" maxlength="160" rows="3">${esc(me.bio || '')}</textarea></label>
      <label class="field">${t('Couleur d’avatar')} <input type="range" min="0" max="359" name="avatar_hue" value="${me.avatar_hue}"></label>
      <div class="row">${avatar(me, 48)}<button class="btn primary">${t('Enregistrer')}</button></div></form>
      <h2 style="margin-top:24px">${t('Préférences')}</h2>
      <label class="check"><input type="checkbox" data-sound ${sound.on ? 'checked' : ''}> ${t('Effets sonores')}</label>
      <div class="row" style="margin-top:12px;gap:8px"><span class="muted">${t('Langue')}</span>${LANGS.map((l) => `<button class="btn sm ${l.key === getLang() ? 'primary' : ''}" ${l.key === getLang() ? 'disabled' : `data-lang="${l.key}"`}>${esc(l.label)}</button>`).join('')}</div>
    </div></div>`;
  $('[data-mock]', view)?.addEventListener('click', async () => {
    try { await post('/discord/mock'); toast(t('Compte vérifié (simulation)'), 'good'); await store.refresh(); route(); } catch (e) { toast(esc(e.message), 'error'); }
  });
  $('[data-sound]', view).onchange = (e) => { sound.on = e.target.checked; };
  const form = $('[data-profile]', view);
  form.avatar_hue.oninput = (e) => form.querySelector('.avatar').style.setProperty('--h', e.target.value);
  form.onsubmit = async (e) => {
    e.preventDefault();
    try { store.set(await api('/me', { method: 'PATCH', body: { bio: form.bio.value, avatar_hue: Number(form.avatar_hue.value) } })); toast(t('Profil enregistré'), 'good'); } catch (err) { toast(esc(err.message), 'error'); }
  };
}

function helpPage() {
  const avg = (r) => { const s = SKINS.filter((x) => x.r === r); return Math.round(s.reduce((a, b) => a + b.base, 0) / s.length); };
  const x = (m) => `×${fmt(m)}`;
  view.innerHTML = `<h1>${t('Aide, règles & transparence')}</h1>
    <div class="grid cols-2">
      <div class="panel"><h2>${t('Raretés')}</h2><table class="t"><thead><tr><th>${t('Rareté')}</th><th>${t('Valeur de base')}</th><th>${t('Moyenne')}</th><th>${t('Skins')}</th></tr></thead><tbody>
        ${RARITIES.map((r, i) => `<tr><td style="color:${r.color};font-weight:700">${esc(L(r))}</td><td>${fmt(r.base[0])} – ${fmt(r.base[1])} ${MU}</td><td>${fmt(avg(i))} ${MU}</td><td>${fmt(SKINS.filter((s) => s.r === i).length)}</td></tr>`).join('')}
      </tbody></table><p class="muted small">${t('{n} skins répartis sur {m} modèles d’armes imaginaires.', { n: fmt(SKINS.length), m: MODELS.length })}</p></div>
      <div class="panel"><h2>${t('Usure (float)')}</h2><p class="muted">${t('Chaque carte reçoit un float entre 0 et 1 (6 décimales), fixé à jamais. Plus il est bas, plus la carte est propre : la peinture de l’arme s’écaille et la carte se raye, se plie et se tache à mesure que le float monte.')}</p>
        <table class="t"><thead><tr><th>${t('État')}</th><th>${t('Float')}</th><th>${t('Valeur')}</th><th>${t('Probabilité')}</th></tr></thead><tbody>
        ${WEAR.tiers.map((w) => `<tr><td>${esc(L(w))} (${w.key})</td><td>${dec2(w.min)} – ${dec2(w.max)}</td><td>${x(w.mult)}</td><td>${pct(fmt(w.weight))}</td></tr>`).join('')}</tbody></table>
        <p class="muted small">${t('Float extrême (&lt; {low} ou &gt; {high}) : {m0} à {m1}. Traqueur ({tc}) : {tm}.', {
    low: fmt(MODIFIERS.extreme.low), high: fmt(MODIFIERS.extreme.high), m0: x(MODIFIERS.extreme.mult[0]), m1: x(MODIFIERS.extreme.mult[1]),
    tc: pct(fmt(MODIFIERS.tracker.chance * 100)), tm: x(MODIFIERS.tracker.mult) })}</p></div>
      <div class="panel"><h2>${t('Centrage & cartes erreur')}</h2><p class="muted">${t('Comme une vraie carte imprimée, la bordure n’est jamais parfaitement égale. Le centrage (ex. 55/45) est visible sur chaque carte et influence sa valeur, puis sa sous-note de gradation.')}</p>
        <table class="t"><thead><tr><th>${t('Écart max')}</th><th>${t('Note de centrage')}</th></tr></thead><tbody>${CENTERING.scale.slice(0, 8).map(([d, s]) => `<tr><td>${t('≤ {d} pts ({a}/{b})', { d, a: 50 + d, b: 50 - d })}</td><td>${fmt(s)}</td></tr>`).join('')}</tbody></table>
        <p class="muted small">${t('Effet sur une carte non gradée : {list}.', { list: CENTERING.valueMult.map(([s, m]) => `${fmt(s)}+ → ${x(m)}`).join(' · ') })}<br>
        ${t('<b>Carte erreur</b> : 1 chance sur {n} — deux cartes apparaissent à moitié sur la même feuille. Valeur {m}.', { n: fmt(Math.round(1 / MISPRINT.chance)), m: x(MISPRINT.valueMult) })}</p></div>
      <div class="panel"><h2>${t('Gradation')}</h2><p class="muted">${t('Envoyez jusqu’à {n} cartes. Quatre sous-notes (centrage, coins, bords, surface) donnent une note finale de 1 à 10, plafonnée à la plus basse sous-note + 1 et par l’état d’usure.', { n: GRADING.maxPerOrder })}</p>
        <table class="t"><thead><tr><th>${t('Note')}</th><th>${t('Libellé')}</th><th>${t('Valeur')}</th></tr></thead><tbody>${GRADING.valueMult.map(([g, m]) => `<tr><td>${fmt(g)}+</td><td>${esc(t(GRADING.labels.find(([y]) => g >= y)[1]))}</td><td class="${m >= 1 ? 'pos' : 'neg'}">${x(m)}</td></tr>`).join('')}</tbody></table>
        <p class="muted small">${t('Services : {list} (+{rate} de la valeur, max {max} {mu}). Population faible = bonus : {pop}.', {
    list: Object.values(GRADING.services).map((s) => `${esc(L(s))} ${fmt(s.baseFee)} ${MU}`).join(' · '), rate: pct(fmt(GRADING.valueFeeRate * 100)), max: fmt(GRADING.maxValueFee), mu: MU,
    pop: GRADING.popBonus.map(([p, m]) => `≤${fmt(p)} → ${x(m)}`).join(', ') })}</p></div>
      <div class="panel"><h2>${t('Économie')}</h2><ul class="muted" style="line-height:1.8;padding-left:18px">
        <li>${t('Départ : {start} {mu} + {packs} Caisses Standard.', { start: fmt(ECONOMY.startBalance), mu: MU, packs: ECONOMY.welcomePacks })}</li>
        <li>${t('Colis gratuit toutes les {m} min (réserve max {max}).', { m: ECONOMY.free.intervalMs / 60e3, max: ECONOMY.free.maxStock })}</li>
        <li>${t('Connexion quotidienne : {list} {mu}. Missions du jour et vérification Discord (+{bonus} {mu}).', { list: ECONOMY.dailyStreak.map((v) => fmt(v)).join(' → '), mu: MU, bonus: fmt(DISCORD.verifyBonus) })}</li>
        <li>${t('Vente au système : {rate} de la valeur. Marché entre joueurs : frais {fee}.', { rate: pct(fmt(ECONOMY.sellToSystemRate * 100)), fee: pct(fmt(ECONOMY.marketFee * 100)) })}</li>
        <li>${t('Contrat : {n} cartes de même rareté → 1 carte de la rareté supérieure ({cost} {mu}).', { n: TRADE_UP.inputCount, cost: fmt(TRADE_UP.cost), mu: MU })}</li>
        <li>${t('La valeur moyenne d’un booster vaut environ 87 % de son prix (calcul automatique) : le jackpot existe, l’argent facile non.')}</li></ul></div>
      <div class="panel"><h2>${t('Mentions')}</h2><p class="muted">${esc(t(LEGAL))}</p><p class="muted small">${t('Les noms, modèles et visuels d’armes sont entièrement inventés et générés procéduralement.')}</p></div>
    </div>`;
}

// ───────────────────────────── Routeur
const ROUTES = [
  [/^$/, home],
  [/^packs$/, () => { location.hash = '#/'; }],
  [/^patterns$/, patternsPage],
  [/^shop$/, shopPage],
  [/^collection$/, collectionPage],
  [/^inventory$/, inventoryPage, true],
  [/^card\/([\w-]+)$/, cardPage],
  [/^cert\/([\w-]+)$/, (ctx) => cardPage({ ...ctx, cert: true })],
  [/^market$/, marketPage],
  [/^trades$/, tradesPage, true],
  [/^trades\/(\d+)$/, tradePage, true],
  [/^trade\/new\/([^/]+)$/, newTradePage, true],
  [/^friends$/, friendsPage, true],
  [/^u\/([^/]+)$/, profilePage],
  [/^leaderboard$/, leaderboardPage],
  [/^grading$/, gradingPage, true],
  [/^rewards$/, rewardsPage, true],
  [/^settings$/, settingsPage, true],
  [/^help$/, helpPage],
  [/^login$/, () => authPage('login')],
  [/^register$/, () => authPage('register')],
];
export async function route() {
  const token = ++renderToken;
  timers.forEach(clearInterval); timers.clear(); freeTicker();
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  const query = new URLSearchParams(qs || '');
  header(store.me);
  if (store.me) store.refresh();
  for (const [re, fn, auth] of ROUTES) {
    const m = path.match(re);
    if (!m) continue;
    if (auth && !store.me) { location.hash = '#/login'; return; }
    const host = $('#view-host');
    view = document.createElement('div');
    view.className = 'view';
    host.replaceChildren(view);
    const ctx = { view, token, params: m.slice(1).map(decodeURIComponent), query, every, openPack, rerender: route, stale: () => token !== renderToken };
    try { await fn(ctx); } catch (e) {
      if (token === renderToken) view.innerHTML = `<div class="empty"><b>${t('Oups')}</b>${esc(e.message)}</div>`;
    }
    window.scrollTo({ top: 0 });
    return;
  }
  location.hash = '#/';
}
// textes statiques d'index.html (rédigés en français) traduits au démarrage
function staticTexts() {
  document.title = t('Mugigo – cartes d’armes à collectionner');
  $('meta[name="description"]')?.setAttribute('content', t('Ouvrez des boosters, collectionnez des milliers de cartes d’armes imaginaires, faites-les grader et échangez avec vos amis. Jeu 100 % fictif.'));
  $('.logo')?.setAttribute('aria-label', t('Mugigo – accueil'));
  $('#nav')?.setAttribute('aria-label', t('Navigation principale'));
  const help = $('footer.legal a[href="#/help"]'); if (help) help.textContent = t('Aide, règles & taux');
  $('#legal').textContent = t(LEGAL);
}
store.on(header);
addEventListener('hashchange', route);
initTilt();
staticTexts();
store.refresh().then(route);
every(() => store.me && store.refresh(), 25000);

// Mugigo – application monopage : en-tête, routeur, pages Accueil (+ boosters) / Connexion / Récompenses / Paramètres / Aide / Boutique.
import { BRAND, SHOP, COLLECTIONS, RARITIES, WEAR, ECONOMY, PITY, GRADING, CENTERING, MISPRINT, MODIFIERS, LEGAL, DISCORD, TRADE_UP, CURRENCY } from '/shared/config.js';
import { SKINS, SKIN_BY_ID, MODELS } from '/shared/catalog.js';
import { PACKS, packFilter } from '/shared/packs.js';
import { patternsPage } from './pages/patterns.js';
import { api, post, store } from './api.js';
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

// ───────────────────────────── En-tête
const NAV = [
  ['', 'Boosters'], ['collection', 'Collection'], ['inventory', 'Inventaire'], ['market', 'Marché'],
  ['trades', 'Échanges', 'openTrades'], ['friends', 'Amis', 'friendRequests'], ['leaderboard', 'Classement'], ['patterns', 'Motifs'],
];
function header(me) {
  const route = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  $('#nav').innerHTML = NAV.map(([k, label, badge]) =>
    `<a href="#/${k}" class="${route === k ? 'on' : ''}">${label}${badge && me?.[badge] ? `<span class="dot">${me[badge]}</span>` : ''}</a>`).join('')
    + `<a href="#/shop" class="nav-locked ${route === 'shop' ? 'on' : ''}" title="Bientôt disponible">Boutique <span aria-hidden="true">🔒</span></a>`;
  const right = $('#top-right');
  if (!me) {
    right.innerHTML = `<a class="btn sm ghost" href="#/login">Connexion</a><a class="btn sm primary" href="#/register">Jouer gratuitement</a>`;
    return;
  }
  if (!right.querySelector('.balance')) {
    right.innerHTML = `
      <a class="icon-btn" href="#/rewards" title="Récompenses">🎁<span class="dot" data-daily hidden>!</span></a>
      <button class="icon-btn" data-notif title="Notifications">🔔<span class="dot" data-unread hidden></span></button>
      <a class="balance" href="#/rewards" title="Solde"><span data-bal>0</span><span class="cur">${CURRENCY.symbol}</span></a>
      <button class="user-chip" data-menu>${avatar(me, 30)}<span class="name">${esc(me.username)}</span></button>`;
    right.querySelector('[data-notif]').onclick = showNotifications;
    right.querySelector('[data-menu]').onclick = userMenu;
  }
  animateNumber(right.querySelector('[data-bal]'), me.balance);
  right.querySelector('[data-daily]').hidden = !me.daily.available;
  const un = right.querySelector('[data-unread]');
  un.hidden = !(me.unread + me.gradingReady); un.textContent = me.unread + me.gradingReady;
}
function userMenu() {
  const me = store.me;
  const m = modal(`<div class="row">${avatar(me, 54)}<div><h2 style="margin:0">${esc(me.username)}</h2>
    <div class="muted small">Niveau ${me.level.level} ${me.discord.verified ? '· <span class="verified">✔ Discord vérifié</span>' : ''}</div></div></div>
    <div class="bar" style="margin:16px 0 6px"><i style="width:${me.level.next ? ((me.level.xp - me.level.cur) / (me.level.next - me.level.cur)) * 100 : 100}%"></i></div>
    <div class="muted small">${me.level.xp} XP${me.level.next ? ` / ${me.level.next}` : ''}</div>
    <div class="grid" style="margin-top:18px;grid-template-columns:1fr 1fr;gap:10px">
      <a class="btn" href="#/u/${encodeURIComponent(me.username)}">Mon profil</a><a class="btn" href="#/grading">Gradation${me.gradingReady ? ` (${me.gradingReady})` : ''}</a>
      <a class="btn" href="#/rewards">Récompenses</a><a class="btn" href="#/settings">Paramètres</a>
      <a class="btn" href="#/help">Aide & règles</a><button class="btn danger" data-logout>Déconnexion</button>
    </div>`);
  m.el.addEventListener('click', (e) => { if (e.target.closest('a')) m.close(); });
  m.el.querySelector('[data-logout]').onclick = async () => { await post('/auth/logout'); m.close(); store.set(null); location.hash = '#/'; };
}
async function showNotifications() {
  const list = await api('/notifications');
  const me = store.me;
  const m = modal(`<h2>Notifications</h2>
    ${me.gradingReady ? `<a class="btn cyan" href="#/grading" style="width:100%;margin-bottom:12px">${me.gradingReady} gradation(s) prête(s) à révéler</a>` : ''}
    <div class="notif-list">${list.length ? list.map((n) => `<a href="${esc(n.link || '#/')}" class="${n.read ? '' : 'unread'}">${esc(n.text)}<div class="muted small">${ago(n.at)}</div></a>`).join('') : '<div class="empty">Rien de neuf.</div>'}</div>`);
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
  return `<div class="pack-rates">${p.rates.map((r, i) => (r ? `<i style="width:${Math.max(r, 0.6)}%;background:${RARITIES[i].color}" title="${RARITIES[i].fr} ${r}%"></i>` : '')).join('')}</div>`;
}
function packTile(p, me, i = 0) {
  let price = `<span class="price">${p.price.toLocaleString('fr-FR')} <span class="cur">¢</span></span>`;
  if (p.free) price = `<span class="price free-timer" data-free-label>${me ? `${me.free.stock}/${me.free.max} disponibles` : 'Gratuit'}</span>`;
  else if (p.key === 'standard' && me?.welcomePacks) price += ` <span class="pill tag-new">${me.welcomePacks} offert${me.welcomePacks > 1 ? 's' : ''}</span>`;
  return `<div class="pack-tile tile" style="--t1:${p.theme[0]};--t2:${p.theme[1]};--i:${i}" data-pack="${p.key}">
    <div class="pack-art">${packSVG(p)}</div>
    <div><h3>${esc(p.fr)}</h3><div class="muted small">${esc(p.tag)}</div></div>
    ${ratesBar(p)}
    <div class="row between">${price}<button class="btn sm primary" data-open="${p.key}">Ouvrir</button></div>
  </div>`;
}
// position logarithmique (0,01 % → 0, 100 % → 100) pour que les petits taux restent visibles
const logPos = (r) => Math.max(2, Math.min(100, ((Math.log10(Math.max(r, 0.01)) + 2) / 4) * 100));
function rateSliders(p) {
  return `<div class="rate-list">${p.rates.map((r, i) => (r ? `<div class="rate-row" style="--rc:${RARITIES[i].color};--rg:${RARITIES[i].glow}">
      <span class="rate-name">${RARITIES[i].fr}</span>
      <div class="slider-track"><i style="width:${logPos(r).toFixed(1)}%"></i><b style="left:${logPos(r).toFixed(1)}%"></b></div>
      <span class="rate-val">${r < 0.1 ? r.toFixed(2) : r < 10 ? r.toFixed(1) : Math.round(r)} %</span></div>` : '')).join('')}</div>`;
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
      el.textContent = f.stock >= f.max ? `${f.stock}/${f.max} disponibles` : `${f.stock}/${f.max} · +1 dans ${dur(f.nextAt - Date.now())}`;
      if (f.nextAt && Date.now() > f.nextAt) store.refresh();
    }
  }, 1000);
}

function packModal(key) {
  const p = PACKS.find((x) => x.key === key);
  const pool = SKINS.filter(packFilter(p.filter));
  const me = store.me;
  const atLeast = (r) => p.rates.slice(r).reduce((a, b) => a + b, 0) / 100;
  const m = modal(`<div class="grid pack-modal" style="grid-template-columns:minmax(160px,240px) 1fr;gap:26px;align-items:start">
      <div class="pack-art" style="width:100%">${packSVG(p)}</div>
      <div>
        <h2 style="margin-bottom:4px">${esc(p.fr)}</h2><p class="muted" style="margin-top:0">${esc(p.tag)} · ${p.cards} cartes · <b class="glow-text" style="--gc:${p.theme[1]}">${pool.length.toLocaleString('fr-FR')} skins possibles</b></p>
        <h3>Taux par carte</h3>${rateSliders(p)}
        ${p.free ? `<p class="muted small">Un colis toutes les ${ECONOMY.free.intervalMs / 60e3} min, jusqu’à ${ECONOMY.free.maxStock} en réserve.</p>` : `
        <h3 style="margin-top:18px">Simulateur</h3>
        <label class="slider-field"><span>Si j’ouvre <b data-sim-n class="glow-text" style="--gc:#ffb020">10</b> boosters…</span>
          <input type="range" class="range" min="1" max="100" value="10" data-sim style="--fill:9%"></label>
        <div class="sim-grid" data-sim-out></div>
        <p class="muted small">Garanties : <b style="color:${RARITIES[3].color}">Ultra rare+</b> au plus tard tous les ${PITY.ultraAfter} boosters payants, <b style="color:${RARITIES[4].color}">Légendaire+</b> tous les ${PITY.legendaryAfter}.
          ${me ? `<br>Votre compteur : ${me.pity.ultra}/${PITY.ultraAfter} · ${me.pity.legend}/${PITY.legendaryAfter}` : ''}</p>`}
        <div class="row" style="margin-top:16px">
          ${p.free ? `<button class="btn primary" data-n="1">Ouvrir 1</button>${me?.free.stock > 1 ? `<button class="btn" data-n="${me.free.stock}">Tout ouvrir (${me.free.stock})</button>` : ''}`
    : [1, 5, 10].map((n) => `<button class="btn ${n === 1 ? 'primary' : ''}" data-n="${n}">×${n} · ${(n * p.price).toLocaleString('fr-FR')} ¢</button>`).join('')}
        </div>
      </div></div>`, { wide: true });
  const sim = m.el.querySelector('[data-sim]');
  const upd = () => {
    const n = Number(sim.value), cards = n * p.cards;
    m.el.querySelector('[data-sim-n]').textContent = n;
    sim.style.setProperty('--fill', `${((n - 1) / 99) * 100}%`);
    m.el.querySelector('[data-sim-out]').innerHTML = [3, 4, 5, 6].filter((r) => atLeast(r) > 0).map((r) => {
      const pr = 1 - (1 - atLeast(r)) ** cards;
      return `<div class="sim-cell" style="--rc:${RARITIES[r].color}"><b>${(pr * 100).toFixed(pr > 0.995 ? 0 : 1)} %</b><span>${RARITIES[r].fr}${r < 6 ? '+' : ''}</span><div class="bar"><i style="width:${pr * 100}%;background:${RARITIES[r].color}"></i></div></div>`;
    }).join('') + `<div class="sim-cell" style="--rc:#ff2b6a"><b>${((1 - (1 - MISPRINT.chance) ** cards) * 100).toFixed(2)} %</b><span>Carte erreur</span><div class="bar"><i style="width:${(1 - (1 - MISPRINT.chance) ** cards) * 100}%;background:#ff2b6a"></i></div></div>`;
  };
  if (sim) { sim.addEventListener('input', upd); upd(); }
  m.el.addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) { m.close(); openPack(key, Number(b.dataset.n)); } });
}

// ───────────────────────────── Pages
function feedItem(f) {
  const skin = SKIN_BY_ID.get(f.card.s); const R = RARITIES[f.card.r];
  return `<a class="feed-item" href="#/card/${f.card.id}" style="--rc:${f.card.mp ? '#ff2b6a' : R.color}">${cardOf(f.card, { small: true, lite: true, noSlab: true })}
    <div class="t"><span class="muted">${esc(f.username)}</span> a obtenu <b>${f.card.mp ? 'une CARTE ERREUR' : esc(R.fr)}</b><br>${esc(skinTitle(skin))}</div>
    <div class="small muted" style="text-align:right">${cr(f.card.value)}<br>${ago(f.at)}</div></a>`;
}

async function home({ token }) {
  const me = store.me;
  const [feed, stats] = await Promise.all([api('/feed'), api('/stats')]);
  if (token !== renderToken) return;
  const showcase = [SKINS.find((s) => s.r === 5 && s.m === 'nightfang' && s.st === 'art') || SKINS.find((s) => s.r === 5 && s.m === 'nightfang'), SKINS.find((s) => s.r === 6 && s.m === 'rhoden'), SKINS.find((s) => s.r === 5 && s.m === 'lumen')];
  const groups = [
    ['base', 'Boosters', '부스터', 'Les grands classiques : tout le catalogue ou une famille d’armes.'],
    ['collection', 'Collections', '컬렉션', 'Dix univers illustrés : chaque booster ne contient que les skins de sa collection.'],
    ['model', 'Par arme', '무기', 'Ciblez votre modèle préféré.'],
  ];
  view.innerHTML = `
    <section class="hero hero-compact">
      <div>
        <div class="pill" style="margin-bottom:12px">⚡ <b class="glow-text" style="--gc:#ffb020">${stats.skins.toLocaleString('fr-FR')}</b> cartes · ${PACKS.length} boosters</div>
        <h1>Collectionnez l’<span class="grad-text">arsenal</span> le plus rare.</h1>
        <p>Traquez les floats parfaits, les <b style="color:#ffd76a">graines rares</b>, les cartes les mieux centrées et les
          <b style="color:#ff5a8a">cartes erreur</b> (1 sur ${Math.round(1 / MISPRINT.chance).toLocaleString('fr-FR')}). Échangez avec vos amis et dominez le classement.</p>
        <div class="row" style="margin-top:18px">
          ${me ? `<button class="btn primary xl" data-quick-free>Ouvrir un colis gratuit (${me.free.stock})</button>${me.daily.available ? `<button class="btn xl" data-daily>🎁 Récompense du jour +${me.daily.reward} ¢</button>` : ''}`
    : `<a class="btn primary xl" href="#/register">Commencer – ${ECONOMY.startBalance} ¢ + ${ECONOMY.welcomePacks} boosters offerts</a><a class="btn xl" href="#/collection">Voir la collection</a>`}
        </div>
        <div class="stats"><div><b style="color:#5ff3ff">${stats.players.toLocaleString('fr-FR')}</b>joueurs</div><div><b style="color:#b266ff">${stats.cards.toLocaleString('fr-FR')}</b>cartes en circulation</div><div><b style="color:#4ade80">${stats.listings.toLocaleString('fr-FR')}</b>annonces au marché</div></div>
      </div>
      <div class="hero-cards">${showcase.map((s, i) => cardHTML(s, { f: [0.012, 0.0004, 0.09][i], cx: 50, cy: 50, tr: null, foil: i === 1 ? 1 : 0, mp: null, g: null, pt: 7, serial: 'MG-VITRINE' })).join('')}</div>
    </section>
    <div class="home-grid">
      <div>${groups.map(([g, title, ko, sub]) => `
        <div class="section-title"><div><h2>${title} <span class="ko">${ko}</span></h2><div class="muted small">${sub}</div></div></div>
        <div class="packs" data-packs>${PACKS.filter((p) => p.group === g).sort((a, b) => (b.free ? 1 : 0) - (a.free ? 1 : 0)).map((p, i) => packTile(p, me, i)).join('')}</div>`).join('')}</div>
      <aside class="feed-col"><div class="section-title"><h2>Drops en direct</h2><span class="pill"><span class="online on"></span> live</span></div>
        <div class="panel feed" data-feed>${feed.map(feedItem).join('') || '<div class="empty">Aucun drop pour l’instant</div>'}</div></aside>
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
    toast(`Jour ${r.streak} : +${cr(r.reward)}`, 'good');
    await store.refresh(); route();
  } catch (e) { toast(esc(e.message), 'error'); }
}

function shopPage() {
  view.innerHTML = `<div class="shop-lock panel">
    <div class="shop-icon">🔒</div>
    <h1>Boutique <span class="ko">상점</span></h1>
    <p class="muted">La boutique n’est pas encore ouverte. ${SHOP.enabled ? '' : 'Aucun achat n’est possible pour le moment : toutes les cartes s’obtiennent en jouant.'}</p>
    <a class="btn primary" href="#/">Retour aux boosters</a></div>`;
}

function authPage(mode) {
  view.innerHTML = `<div class="auth-box panel">
    <div class="tabs" style="margin-bottom:18px"><button class="${mode === 'login' ? 'on' : ''}" data-m="login">Connexion</button><button class="${mode === 'register' ? 'on' : ''}" data-m="register">Inscription</button></div>
    <form class="grid" style="gap:14px">
      ${mode === 'register'
    ? `<label class="field">Pseudo<input class="input" name="username" required minlength="3" maxlength="20" autocomplete="username"></label>
         <label class="field">E-mail (facultatif)<input class="input" name="email" type="email" autocomplete="email"></label>`
    : '<label class="field">Pseudo ou e-mail<input class="input" name="login" required autocomplete="username"></label>'}
      <label class="field">Mot de passe<input class="input" name="password" type="password" required minlength="${mode === 'register' ? 8 : 1}" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}"></label>
      <button class="btn primary xl">${mode === 'register' ? `Créer mon compte · ${ECONOMY.startBalance} ¢ offerts` : 'Se connecter'}</button>
      ${mode === 'register' ? `<p class="muted small">Vous recevez ${ECONOMY.startBalance} ¢, ${ECONOMY.welcomePacks} Caisses Standard et 2 colis gratuits. Liez Discord ensuite pour débloquer le marché et les échanges (+${DISCORD.verifyBonus} ¢).</p>` : ''}
    </form></div>`;
  $$('[data-m]', view).forEach((b) => { b.onclick = () => { location.hash = `#/${b.dataset.m}`; }; });
  $('form', view).onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      store.set(await post(`/auth/${mode}`, body));
      toast(mode === 'register' ? 'Bienvenue sur Mugigo !' : 'Connecté', 'good');
      location.hash = '#/';
    } catch (err) { toast(esc(err.message), 'error'); }
  };
}

async function rewardsPage({ token }) {
  const [missions, txs] = await Promise.all([api('/missions'), api('/transactions')]);
  if (token !== renderToken) return;
  const me = store.me, d = me.daily;
  const doneDays = d.available ? d.streak : d.streak;
  view.innerHTML = `<h1>Récompenses</h1>
    <div class="grid cols-2">
      <div class="panel"><div class="row between"><h2>Connexion quotidienne</h2><span class="pill">Série : ${d.streak} jour(s)</span></div>
        <div class="daily">${d.table.map((v, i) => {
    const pos = ((doneDays - 1) % 7 + 7) % 7;
    const done = doneDays > 0 && i <= pos && !(d.available && d.nextStreak === 1);
    const nxt = d.available && i === (d.nextStreak - 1) % 7;
    return `<div class="${done && !nxt ? 'done' : ''} ${nxt ? 'next' : ''}">J${i + 1}<b>${v}</b></div>`;
  }).join('')}</div>
        <div class="row between" style="margin-top:16px"><span class="muted small">La série repart à zéro si vous manquez un jour.</span>
          <button class="btn primary" data-daily ${d.available ? '' : 'disabled'}>${d.available ? `Réclamer +${d.reward} ¢` : 'Revenez demain'}</button></div>
      </div>
      <div class="panel"><h2>Missions du jour</h2><div class="grid" style="gap:10px">
        ${missions.map((m) => `<div class="mission"><div class="row between"><b>${esc(m.fr)}</b><span class="cur">+${m.reward} ¢</span></div>
          <div class="bar"><i style="width:${(m.progress / m.target) * 100}%"></i></div>
          <div class="row between small"><span class="muted">${m.progress}/${m.target}</span>
          ${m.claimed ? '<span class="pos">✓ Réclamée</span>' : `<button class="btn sm ${m.progress >= m.target ? 'primary' : ''}" data-claim="${m.key}" ${m.progress >= m.target ? '' : 'disabled'}>Réclamer</button>`}</div></div>`).join('')}
      </div></div>
    </div>
    <div class="section-title"><h2>Historique des transactions</h2></div>
    <div class="panel" style="overflow:auto"><table class="t"><thead><tr><th>Date</th><th>Type</th><th>Détail</th><th style="text-align:right">Montant</th><th style="text-align:right">Solde</th></tr></thead>
      <tbody>${txs.map((t) => `<tr><td class="muted small">${new Date(t.at).toLocaleString('fr-FR')}</td><td>${esc(t.type)}</td><td class="muted">${esc(t.note || '')}</td>
        <td style="text-align:right" class="${t.amount >= 0 ? 'pos' : 'neg'}">${t.amount >= 0 ? '+' : ''}${t.amount.toLocaleString('fr-FR')}</td><td style="text-align:right">${t.balance_after.toLocaleString('fr-FR')}</td></tr>`).join('')}</tbody></table></div>`;
  $('[data-daily]', view).onclick = claimDaily;
  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-claim]'); if (!b) return;
    try { await post(`/missions/${b.dataset.claim}/claim`); sound.play('coin'); toast('Mission réclamée !', 'good'); await store.refresh(); route(); } catch (err) { toast(esc(err.message), 'error'); }
  });
}

function settingsPage({ query }) {
  const me = store.me;
  if (query.get('discord') === 'ok') toast('Compte Discord vérifié !', 'good');
  if (query.get('discord') === 'error') toast(esc(query.get('msg') || 'Vérification impossible'), 'error');
  const dc = me.discord;
  view.innerHTML = `<h1>Paramètres</h1><div class="grid cols-2">
    <div class="panel"><h2>Vérification Discord</h2>
      <p class="muted">Lier un compte Discord (âgé d’au moins ${DISCORD.minAccountAgeDays} jours) prouve que vous êtes une vraie personne : cela protège le marché et les échanges contre les multi-comptes. Un compte Discord ne peut être lié qu’à un seul joueur.</p>
      ${dc.verified ? `<div class="pill" style="color:#8b9cff">✔ Vérifié : ${esc(dc.name || '')}</div>`
    : dc.mode === 'oauth' ? `<a class="btn discord xl" href="/api/discord/start">Vérifier avec Discord · +${DISCORD.verifyBonus} ¢</a>`
      : dc.mode === 'mock' ? `<button class="btn discord xl" data-mock>Vérification simulée (mode dev) · +${DISCORD.verifyBonus} ¢</button>`
        : '<div class="pill">Discord n’est pas configuré sur ce serveur : les fonctions sociales sont ouvertes à tous.</div>'}
      <p class="muted small" style="margin-top:14px">Nécessaire pour : vendre sur le marché, envoyer des demandes d’ami et faire des échanges.</p>
    </div>
    <div class="panel"><h2>Profil</h2><form class="grid" style="gap:14px" data-profile>
      <label class="field">Bio<textarea class="input" name="bio" maxlength="160" rows="3">${esc(me.bio || '')}</textarea></label>
      <label class="field">Couleur d’avatar <input type="range" min="0" max="359" name="avatar_hue" value="${me.avatar_hue}"></label>
      <div class="row">${avatar(me, 48)}<button class="btn primary">Enregistrer</button></div></form>
      <h2 style="margin-top:24px">Préférences</h2>
      <label class="check"><input type="checkbox" data-sound ${sound.on ? 'checked' : ''}> Effets sonores</label>
    </div></div>`;
  $('[data-mock]', view)?.addEventListener('click', async () => {
    try { await post('/discord/mock'); toast('Compte vérifié (simulation)', 'good'); await store.refresh(); route(); } catch (e) { toast(esc(e.message), 'error'); }
  });
  $('[data-sound]', view).onchange = (e) => { sound.on = e.target.checked; };
  const form = $('[data-profile]', view);
  form.avatar_hue.oninput = (e) => form.querySelector('.avatar').style.setProperty('--h', e.target.value);
  form.onsubmit = async (e) => {
    e.preventDefault();
    try { store.set(await api('/me', { method: 'PATCH', body: { bio: form.bio.value, avatar_hue: Number(form.avatar_hue.value) } })); toast('Profil enregistré', 'good'); } catch (err) { toast(esc(err.message), 'error'); }
  };
}

function helpPage() {
  const avg = (r) => { const s = SKINS.filter((x) => x.r === r); return Math.round(s.reduce((a, b) => a + b.base, 0) / s.length); };
  view.innerHTML = `<h1>Aide, règles & transparence</h1>
    <div class="grid cols-2">
      <div class="panel"><h2>Raretés</h2><table class="t"><thead><tr><th>Rareté</th><th>Valeur de base</th><th>Moyenne</th><th>Skins</th></tr></thead><tbody>
        ${RARITIES.map((r, i) => `<tr><td style="color:${r.color};font-weight:700">${r.fr}</td><td>${r.base[0].toLocaleString('fr-FR')} – ${r.base[1].toLocaleString('fr-FR')} ¢</td><td>${avg(i).toLocaleString('fr-FR')} ¢</td><td>${SKINS.filter((s) => s.r === i).length}</td></tr>`).join('')}
      </tbody></table><p class="muted small">${SKINS.length.toLocaleString('fr-FR')} skins répartis sur ${MODELS.length} modèles d’armes imaginaires.</p></div>
      <div class="panel"><h2>Usure (float)</h2><p class="muted">Chaque carte reçoit un float entre 0 et 1 (6 décimales), fixé à jamais. Plus il est bas, plus la carte est propre : la peinture de l’arme s’écaille et la carte se raye, se plie et se tache à mesure que le float monte.</p>
        <table class="t"><thead><tr><th>État</th><th>Float</th><th>Valeur</th><th>Probabilité</th></tr></thead><tbody>
        ${WEAR.tiers.map((t) => `<tr><td>${t.fr} (${t.key})</td><td>${t.min.toFixed(2)} – ${t.max.toFixed(2)}</td><td>×${t.mult}</td><td>${t.weight} %</td></tr>`).join('')}</tbody></table>
        <p class="muted small">Float extrême (&lt; ${MODIFIERS.extreme.low} ou &gt; ${MODIFIERS.extreme.high}) : ×${MODIFIERS.extreme.mult[0]} à ×${MODIFIERS.extreme.mult[1]}. Holo (${MODIFIERS.foil.chance * 100} %, dès Rare) : ×${MODIFIERS.foil.mult}. Traqueur (${MODIFIERS.tracker.chance * 100} %) : ×${MODIFIERS.tracker.mult}.</p></div>
      <div class="panel"><h2>Centrage & cartes erreur</h2><p class="muted">Comme une vraie carte imprimée, la bordure n’est jamais parfaitement égale. Le centrage (ex. 55/45) est visible sur chaque carte et influence sa valeur, puis sa sous-note de gradation.</p>
        <table class="t"><thead><tr><th>Écart max</th><th>Note de centrage</th></tr></thead><tbody>${CENTERING.scale.slice(0, 8).map(([d, s]) => `<tr><td>≤ ${d} pts (${50 + d}/${50 - d})</td><td>${s}</td></tr>`).join('')}</tbody></table>
        <p class="muted small">Effet sur une carte non gradée : ${CENTERING.valueMult.map(([s, m]) => `${s}+ → ×${m}`).join(' · ')}.<br>
        <b>Carte erreur</b> : 1 chance sur ${Math.round(1 / MISPRINT.chance).toLocaleString('fr-FR')} — deux cartes apparaissent à moitié sur la même feuille. Valeur ×${MISPRINT.valueMult}.</p></div>
      <div class="panel"><h2>Gradation</h2><p class="muted">Envoyez jusqu’à ${GRADING.maxPerOrder} cartes. Quatre sous-notes (centrage, coins, bords, surface) donnent une note finale de 1 à 10, plafonnée à la plus basse sous-note + 1 et par l’état d’usure.</p>
        <table class="t"><thead><tr><th>Note</th><th>Libellé</th><th>Valeur</th></tr></thead><tbody>${GRADING.valueMult.map(([g, m]) => `<tr><td>${g}+</td><td>${GRADING.labels.find(([x]) => g >= x)[1]}</td><td class="${m >= 1 ? 'pos' : 'neg'}">×${m}</td></tr>`).join('')}</tbody></table>
        <p class="muted small">Services : ${Object.values(GRADING.services).map((s) => `${s.fr} ${s.baseFee} ¢`).join(' · ')} (+${GRADING.valueFeeRate * 100} % de la valeur, max ${GRADING.maxValueFee} ¢). Population faible = bonus : ${GRADING.popBonus.map(([p, m]) => `≤${p} → ×${m}`).join(', ')}.</p></div>
      <div class="panel"><h2>Économie</h2><ul class="muted" style="line-height:1.8;padding-left:18px">
        <li>Départ : ${ECONOMY.startBalance} ¢ + ${ECONOMY.welcomePacks} Caisses Standard.</li>
        <li>Colis gratuit toutes les ${ECONOMY.free.intervalMs / 60e3} min (réserve max ${ECONOMY.free.maxStock}).</li>
        <li>Connexion quotidienne : ${ECONOMY.dailyStreak.join(' → ')} ¢. Missions du jour et vérification Discord (+${DISCORD.verifyBonus} ¢).</li>
        <li>Vente au système : ${ECONOMY.sellToSystemRate * 100} % de la valeur. Marché entre joueurs : frais ${ECONOMY.marketFee * 100} %.</li>
        <li>Contrat : ${TRADE_UP.inputCount} cartes de même rareté → 1 carte de la rareté supérieure (${TRADE_UP.cost} ¢).</li>
        <li>La valeur moyenne d’un booster vaut environ 87 % de son prix (calcul automatique) : le jackpot existe, l’argent facile non.</li></ul></div>
      <div class="panel"><h2>Mentions</h2><p class="muted">${esc(LEGAL)}</p><p class="muted small">Les noms, modèles et visuels d’armes sont entièrement inventés et générés procéduralement.</p></div>
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
      if (token === renderToken) view.innerHTML = `<div class="empty"><b>Oups</b>${esc(e.message)}</div>`;
    }
    window.scrollTo({ top: 0 });
    return;
  }
  location.hash = '#/';
}
store.on(header);
addEventListener('hashchange', route);
initTilt();
$('#legal').textContent = LEGAL;
store.refresh().then(route);
every(() => store.me && store.refresh(), 25000);

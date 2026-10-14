// Social : amis, échanges (proposition / réponse), profils publics, classements.
import { RARITIES, TRADES } from '/shared/config.js';
import { SKIN_BY_ID } from '/shared/catalog.js';
import { api, post, store } from '../api.js';
import { cardOf } from '../opening.js';
import { tile, pickCards, skinTitle } from '../common.js';
import { esc, cr, ago, toast, confirmBox, avatar, $ } from '../ui.js';
import { t, L, locale } from '/shared/i18n.js';

const STATUS_FR = { OPEN: ['En attente', '#ffb020'], DONE: ['Terminé', '#4ade80'], DECLINED: ['Refusé', '#ff4d6a'], CANCELLED: ['Annulé', '#8e93a6'], FAILED: ['Invalide (carte déplacée)', '#ff4d6a'] };
const status = (k) => { const [lab, col] = STATUS_FR[k]; return [t(lab), col]; };
// « n carte(s) » + Mu éventuels
const side = (n, mu) => `${t('{n} carte(s)', { n })}${mu ? ` + ${mu} <i class="mu" aria-label="Mu">무</i>` : ''}`;

// ───────── Amis
export async function friendsPage({ view, stale, rerender }) {
  const f = await api('/friends');
  if (stale()) return;
  const row = (u, actions) => `<div class="user-row"><span class="online ${u.online ? 'on' : ''}"></span>${avatar(u, 40)}
    <div style="flex:1"><a href="#/u/${encodeURIComponent(u.username)}"><b>${esc(u.username)}</b></a> ${u.verified ? '<span class="verified">✔</span>' : ''}<div class="muted small">${t('Niveau {n}', { n: u.level })} · ${u.online ? t('en ligne') : t('hors ligne')}</div></div>${actions}</div>`;
  view.innerHTML = `<h1>${t('Amis')}</h1>
    <div class="grid cols-2">
      <div class="panel"><h2>${t('Ajouter un ami')}</h2><form class="row" data-add><input class="input" style="flex:1" name="username" placeholder="${t('Pseudo exact')}" required><button class="btn primary">${t('Envoyer')}</button></form>
        ${f.incoming.length ? `<h3 style="margin-top:20px">${t('Demandes reçues')}</h3>${f.incoming.map((u) => row(u, `<button class="btn sm primary" data-accept="${u.id}">${t('Accepter')}</button><button class="btn sm ghost" data-remove="${u.id}">${t('Refuser')}</button>`)).join('')}` : ''}
        ${f.outgoing.length ? `<h3 style="margin-top:20px">${t('Demandes envoyées')}</h3>${f.outgoing.map((u) => row(u, `<button class="btn sm ghost" data-remove="${u.id}">${t('Annuler')}</button>`)).join('')}` : ''}
      </div>
      <div class="panel"><h2>${t('Mes amis ({n})', { n: f.friends.length })}</h2>
        ${f.friends.length ? f.friends.map((u) => row(u, `<a class="btn sm primary" href="#/trade/new/${encodeURIComponent(u.username)}">${t('Échanger')}</a><button class="btn sm ghost" data-remove="${u.id}" data-confirm>${t('Retirer')}</button>`)).join('') : `<div class="empty">${t('Ajoutez des amis pour échanger des cartes avec eux.')}</div>`}
      </div>
    </div>`;
  $('[data-add]', view).onsubmit = async (e) => {
    e.preventDefault();
    try { const r = await post('/friends/request', { username: e.target.username.value }); toast(r.status === 'FRIENDS' ? t('Vous êtes maintenant amis !') : t('Demande envoyée'), 'good'); rerender(); } catch (err) { toast(esc(err.message), 'error'); }
  };
  view.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-accept]'), r = e.target.closest('[data-remove]');
    try {
      if (a) { await post(`/friends/${a.dataset.accept}/accept`); toast(t('Ami ajouté'), 'good'); store.refresh(); rerender(); }
      if (r) { if (r.dataset.confirm !== undefined && !(await confirmBox(t('Retirer cet ami ?'), t('Retirer')))) return; await post(`/friends/${r.dataset.remove}/remove`); store.refresh(); rerender(); }
    } catch (err) { toast(esc(err.message), 'error'); }
  });
}

// ───────── Échanges
export async function tradesPage({ view, stale }) {
  const list = await api('/trades');
  if (stale()) return;
  const me = store.me;
  view.innerHTML = `<div class="section-title" style="margin-top:0"><div><h1>${t('Échanges')}</h1><p class="muted">${t('Proposez des cartes et des Mu à vos amis. L’échange est exécuté instantanément et atomiquement quand il est accepté.')}</p></div><a class="btn primary" href="#/friends">${t('Nouvel échange')}</a></div>
    <div class="panel" style="overflow:auto">${list.length ? `<table class="t"><thead><tr><th>#</th><th>${t('Avec')}</th><th>${t('Vous donnez')}</th><th>${t('Vous recevez')}</th><th>${t('Statut')}</th><th></th></tr></thead><tbody>
      ${list.map((x) => {
    const out = x.from_id === me.id;
    const give = out ? side(x.n_give, x.credits_from) : side(x.n_take, x.credits_to);
    const get = out ? side(x.n_take, x.credits_to) : side(x.n_give, x.credits_from);
    const [lab, col] = status(x.status);
    return `<tr><td class="muted">${x.id}</td><td><b>${esc(out ? x.to_name : x.from_name)}</b> <span class="muted small">${out ? t('(envoyé)') : t('(reçu)')}</span></td><td>${give}</td><td>${get}</td>
          <td><span class="pill" style="color:${col}">${lab}</span></td><td><a class="btn sm" href="#/trades/${x.id}">${t('Ouvrir')}</a></td></tr>`;
  }).join('')}</tbody></table>` : `<div class="empty"><b>${t('Aucun échange')}</b>${t('Rendez-vous dans Amis pour en proposer un.')}</div>`}</div>`;
}

export async function tradePage({ view, params, stale, rerender }) {
  const trd = await api(`/trades/${params[0]}`);
  if (stale()) return;
  const me = store.me;
  const out = trd.from.id === me.id;
  const [lab, col] = status(trd.status);
  const sideBox = (title, cards, credits) => `<div class="panel"><h3>${title}</h3>
    ${credits ? `<div class="pill" style="margin-bottom:12px">+ ${cr(credits)}</div>` : ''}
    <div class="cards">${cards.map((c, i) => tile(c, { i, href: `#/card/${c.id}`, lite: true })).join('') || `<div class="muted small">${t('Aucune carte')}</div>`}</div>
    <div class="muted small" style="margin-top:10px">${t('Valeur :')} ${cr(cards.reduce((a, c) => a + c.value, 0) + credits)}</div></div>`;
  view.innerHTML = `<div class="section-title" style="margin-top:0"><div><h1>${t('Échange #{id}', { id: trd.id })}</h1><div class="muted">${esc(trd.from.username)} → ${esc(trd.to.username)} · ${ago(trd.created_at)}</div></div><span class="pill" style="color:${col}">${lab}</span></div>
    ${trd.message ? `<div class="panel" style="margin-bottom:18px">“${esc(trd.message)}”</div>` : ''}
    <div class="trade-cols">${sideBox(out ? t('Vous donnez') : t('{name} donne', { name: esc(trd.from.username) }), trd.give, trd.credits_from)}${sideBox(out ? t('{name} donne', { name: esc(trd.to.username) }) : t('Vous recevez… en échange de'), trd.take, trd.credits_to)}</div>
    ${trd.status === 'OPEN' ? `<div class="row end" style="margin-top:18px">${out ? `<button class="btn danger" data-a="cancel">${t('Annuler la proposition')}</button>`
    : `<button class="btn ghost" data-a="decline">${t('Refuser')}</button><a class="btn" href="#/trade/new/${encodeURIComponent(trd.from.username)}">${t('Contre-proposer')}</a><button class="btn primary" data-a="accept">${t('Accepter l’échange')}</button>`}</div>` : ''}`;
  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'accept' && !(await confirmBox(t('Accepter cet échange ? Il sera exécuté immédiatement et ne pourra pas être annulé.'), t('Accepter')))) return;
    try { await post(`/trades/${trd.id}/${b.dataset.a}`); toast(t('Échange mis à jour'), 'good'); store.refresh(); rerender(); } catch (err) { toast(esc(err.message), 'error'); }
  });
}

export async function newTradePage({ view, params, stale }) {
  const username = params[0];
  const [mine, theirs, prof] = await Promise.all([api('/inventory'), api(`/users/${encodeURIComponent(username)}/cards`), api(`/users/${encodeURIComponent(username)}`)]);
  if (stale()) return;
  if (prof.friend !== 'FRIENDS') { view.innerHTML = `<div class="empty"><b>${t('Vous n’êtes pas amis avec {name}', { name: esc(username) })}</b><a class="btn" href="#/friends" style="margin-top:12px">${t('Amis')}</a></div>`; return; }
  const myOwned = mine.filter((c) => c.status === 'OWNED');
  const st = { give: [], take: [] };
  const byId = new Map([...myOwned, ...theirs].map((c) => [c.id, c]));
  view.innerHTML = `<h1>${t('Proposer un échange à {name}', { name: esc(username) })}</h1>
    <div class="trade-cols">
      <div class="panel"><div class="row between"><h3 style="margin:0">${t('Vous donnez')}</h3><button class="btn sm" data-pick="give">${t('Choisir')}</button></div>
        <div class="cards" data-side="give" style="margin:12px 0"></div><label class="field">${t('Mu offerts')}<input class="input" type="number" min="0" value="0" data-cfrom></label></div>
      <div class="panel"><div class="row between"><h3 style="margin:0">${t('Vous demandez')}</h3><button class="btn sm" data-pick="take">${t('Choisir')}</button></div>
        <div class="cards" data-side="take" style="margin:12px 0"></div><label class="field">${t('Mu demandés')}<input class="input" type="number" min="0" value="0" data-cto></label></div>
    </div>
    <div class="panel" style="margin-top:18px"><label class="field">${t('Message (facultatif)')}<input class="input" maxlength="200" data-msg></label>
      <div class="row between" style="margin-top:14px"><span class="muted small" data-sum></span><button class="btn primary xl" data-send>${t('Envoyer la proposition')}</button></div></div>`;
  const draw = () => {
    for (const k of ['give', 'take']) $(`[data-side="${k}"]`, view).innerHTML = st[k].map((id, i) => tile(byId.get(id), { i, lite: true })).join('') || `<div class="muted small">${t('Aucune carte')}</div>`;
    const v = (k) => st[k].reduce((a, id) => a + byId.get(id).value, 0);
    $('[data-sum]', view).innerHTML = t('Valeur donnée {give} · reçue {take}', { give: cr(v('give') + Number($('[data-cfrom]', view).value || 0)), take: cr(v('take') + Number($('[data-cto]', view).value || 0)) });
  };
  view.addEventListener('input', draw);
  view.addEventListener('click', async (e) => {
    const p = e.target.closest('[data-pick]');
    if (p) {
      const k = p.dataset.pick;
      const r = await pickCards(k === 'give' ? myOwned : theirs, { title: k === 'give' ? t('Vos cartes') : t('Cartes de {name}', { name: username }), max: TRADES.maxCardsPerSide, selected: st[k] });
      if (r) { st[k] = r; draw(); }
    }
    if (e.target.closest('[data-send]')) {
      try {
        const { id } = await post('/trades', { toId: prof.id, give: st.give, take: st.take, creditsFrom: Number($('[data-cfrom]', view).value || 0), creditsTo: Number($('[data-cto]', view).value || 0), message: $('[data-msg]', view).value });
        toast(t('Proposition envoyée !'), 'good'); location.hash = `#/trades/${id}`;
      } catch (err) { toast(esc(err.message), 'error'); }
    }
  });
  draw();
}

// ───────── Profil public
export async function profilePage({ view, params, stale, rerender }) {
  const p = await api(`/users/${encodeURIComponent(params[0])}`);
  if (stale()) return;
  const me = store.me;
  const btn = {
    SELF: `<a class="btn" href="#/settings">${t('Modifier le profil')}</a><a class="btn" href="#/inventory">${t('Choisir la vitrine')}</a>`,
    NONE: `<button class="btn primary" data-friend>${t('Ajouter en ami')}</button>`,
    SENT: `<span class="pill">${t('Demande envoyée')}</span>`,
    RECEIVED: `<a class="btn primary" href="#/friends">${t('Répondre à sa demande')}</a>`,
    FRIENDS: `<span class="pill pos">${t('Amis')}</span><a class="btn primary" href="#/trade/new/${encodeURIComponent(p.username)}">${t('Proposer un échange')}</a>`,
  }[p.friend] || (me ? '' : `<a class="btn" href="#/login">${t('Connexion')}</a>`);
  view.innerHTML = `<div class="panel row between" style="padding:26px">
      <div class="row">${avatar(p, 76)}<div><h1 style="margin:0">${esc(p.username)} ${p.verified ? `<span class="verified" title="Discord : ${esc(p.discord_name || '')}">✔</span>` : ''}</h1>
        <div class="muted">${t('Niveau {n}', { n: p.level.level })} · ${p.online ? `<span class="pos">${t('en ligne')}</span>` : t('hors ligne')} · ${t('membre depuis {date}', { date: new Date(p.created_at).toLocaleDateString(locale()) })}${p.bot ? ` · ${t('PNJ marchand')}` : ''}</div>
        ${p.bio ? `<p style="margin:8px 0 0">${esc(p.bio)}</p>` : ''}</div></div>
      <div class="row">${p.bot ? '' : btn}</div></div>
    <div class="stats panel" style="margin-top:18px"><div><b>${cr(p.value)}</b>${t('valeur de collection')}</div><div><b>${p.count}</b>${t('cartes')}</div><div><b>${p.discovered}/${p.total}</b>${t('skins découverts')}</div><div><b>${p.packs_opened}</b>${t('boosters ouverts')}</div>
      ${p.byRarity.sort((a, b) => b.rarity - a.rarity).map((r) => `<div><b style="color:${RARITIES[r.rarity].color}">${r.n}</b>${esc(L(RARITIES[r.rarity]))}</div>`).join('')}</div>
    <div class="section-title"><h2>${t('Vitrine')}</h2></div>
    <div class="cards lg">${p.showcase.map((c, i) => `<a class="tile" href="#/card/${c.id}" style="--i:${i}">${cardOf(c)}<div class="name">${esc(skinTitle(SKIN_BY_ID.get(c.s)))}</div><div class="meta"><span class="muted">${esc(L(RARITIES[c.r]))}</span><b>${cr(c.value)}</b></div></a>`).join('') || `<div class="empty">${t('Vitrine vide')}</div>`}</div>`;
  $('[data-friend]', view)?.addEventListener('click', async () => {
    try { await post('/friends/request', { username: p.username }); toast(t('Demande envoyée'), 'good'); rerender(); } catch (e) { toast(esc(e.message), 'error'); }
  });
}

// ───────── Classements
export async function leaderboardPage({ view, stale }) {
  const lb = await api('/leaderboards');
  if (stale()) return;
  const tabs = [['value', t('Valeur de collection')], ['best', t('Meilleure carte')], ['discovered', t('Skins découverts')], ['level', t('Niveau')]];
  let cur = 'value';
  view.innerHTML = `<h1>${t('Classement')}</h1><div class="tabs" style="margin-bottom:18px">${tabs.map(([k, l]) => `<button data-t="${k}" class="${k === cur ? 'on' : ''}">${l}</button>`).join('')}</div><div class="panel" data-list></div>`;
  const draw = () => {
    $('[data-list]', view).innerHTML = `<table class="t"><tbody>${lb[cur].map((u, i) => `<tr>
      <td style="width:40px;font-family:var(--display);font-weight:700;color:${['#ffd76a', '#cfd6e6', '#e0a46a'][i] || 'var(--muted)'}">#${i + 1}</td>
      <td><a class="row" href="#/u/${encodeURIComponent(u.username)}">${avatar(u, 32)}<b>${esc(u.username)}</b>${u.bot ? `<span class="pill small">${t('PNJ')}</span>` : ''}</a></td>
      <td class="muted">${t('Niv. {n}', { n: u.level })}</td>
      <td style="text-align:right">${cur === 'value' ? cr(u.value) : cur === 'best' ? (u.bestCard ? `<a href="#/card/${u.bestCard.id}">${esc(skinTitle(SKIN_BY_ID.get(u.bestCard.s)))} · ${cr(u.best)}</a>` : '—') : cur === 'discovered' ? t('{n} skins', { n: u.discovered }) : `${u.level}`}</td></tr>`).join('')}</tbody></table>`;
  };
  view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    cur = b.dataset.t; view.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b)); draw();
  });
  draw();
}

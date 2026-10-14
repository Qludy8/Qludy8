// Social : amis, échanges (proposition / réponse), profils publics, classements.
import { RARITIES, TRADES } from '/shared/config.js';
import { SKIN_BY_ID } from '/shared/catalog.js';
import { api, post, store } from '../api.js';
import { cardOf } from '../opening.js';
import { tile, pickCards, skinTitle } from '../common.js';
import { esc, cr, ago, toast, confirmBox, avatar, $ } from '../ui.js';

const STATUS_FR = { OPEN: ['En attente', '#ffb020'], DONE: ['Terminé', '#4ade80'], DECLINED: ['Refusé', '#ff4d6a'], CANCELLED: ['Annulé', '#8e93a6'], FAILED: ['Invalide (carte déplacée)', '#ff4d6a'] };

// ───────── Amis
export async function friendsPage({ view, stale, rerender }) {
  const f = await api('/friends');
  if (stale()) return;
  const row = (u, actions) => `<div class="user-row"><span class="online ${u.online ? 'on' : ''}"></span>${avatar(u, 40)}
    <div style="flex:1"><a href="#/u/${encodeURIComponent(u.username)}"><b>${esc(u.username)}</b></a> ${u.verified ? '<span class="verified">✔</span>' : ''}<div class="muted small">Niveau ${u.level} · ${u.online ? 'en ligne' : 'hors ligne'}</div></div>${actions}</div>`;
  view.innerHTML = `<h1>Amis</h1>
    <div class="grid cols-2">
      <div class="panel"><h2>Ajouter un ami</h2><form class="row" data-add><input class="input" style="flex:1" name="username" placeholder="Pseudo exact" required><button class="btn primary">Envoyer</button></form>
        ${f.incoming.length ? `<h3 style="margin-top:20px">Demandes reçues</h3>${f.incoming.map((u) => row(u, `<button class="btn sm primary" data-accept="${u.id}">Accepter</button><button class="btn sm ghost" data-remove="${u.id}">Refuser</button>`)).join('')}` : ''}
        ${f.outgoing.length ? `<h3 style="margin-top:20px">Demandes envoyées</h3>${f.outgoing.map((u) => row(u, `<button class="btn sm ghost" data-remove="${u.id}">Annuler</button>`)).join('')}` : ''}
      </div>
      <div class="panel"><h2>Mes amis (${f.friends.length})</h2>
        ${f.friends.length ? f.friends.map((u) => row(u, `<a class="btn sm primary" href="#/trade/new/${encodeURIComponent(u.username)}">Échanger</a><button class="btn sm ghost" data-remove="${u.id}" data-confirm>Retirer</button>`)).join('') : '<div class="empty">Ajoutez des amis pour échanger des cartes avec eux.</div>'}
      </div>
    </div>`;
  $('[data-add]', view).onsubmit = async (e) => {
    e.preventDefault();
    try { const r = await post('/friends/request', { username: e.target.username.value }); toast(r.status === 'FRIENDS' ? 'Vous êtes maintenant amis !' : 'Demande envoyée', 'good'); rerender(); } catch (err) { toast(esc(err.message), 'error'); }
  };
  view.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-accept]'), r = e.target.closest('[data-remove]');
    try {
      if (a) { await post(`/friends/${a.dataset.accept}/accept`); toast('Ami ajouté', 'good'); store.refresh(); rerender(); }
      if (r) { if (r.dataset.confirm !== undefined && !(await confirmBox('Retirer cet ami ?', 'Retirer'))) return; await post(`/friends/${r.dataset.remove}/remove`); store.refresh(); rerender(); }
    } catch (err) { toast(esc(err.message), 'error'); }
  });
}

// ───────── Échanges
export async function tradesPage({ view, stale }) {
  const list = await api('/trades');
  if (stale()) return;
  const me = store.me;
  view.innerHTML = `<div class="section-title" style="margin-top:0"><div><h1>Échanges</h1><p class="muted">Proposez des cartes et des Mu à vos amis. L’échange est exécuté instantanément et atomiquement quand il est accepté.</p></div><a class="btn primary" href="#/friends">Nouvel échange</a></div>
    <div class="panel" style="overflow:auto">${list.length ? `<table class="t"><thead><tr><th>#</th><th>Avec</th><th>Vous donnez</th><th>Vous recevez</th><th>Statut</th><th></th></tr></thead><tbody>
      ${list.map((t) => {
    const out = t.from_id === me.id;
    const give = out ? `${t.n_give} carte(s)${t.credits_from ? ` + ${t.credits_from} <i class="mu" aria-label="Mu">무</i>` : ''}` : `${t.n_take} carte(s)${t.credits_to ? ` + ${t.credits_to} <i class="mu" aria-label="Mu">무</i>` : ''}`;
    const get = out ? `${t.n_take} carte(s)${t.credits_to ? ` + ${t.credits_to} <i class="mu" aria-label="Mu">무</i>` : ''}` : `${t.n_give} carte(s)${t.credits_from ? ` + ${t.credits_from} <i class="mu" aria-label="Mu">무</i>` : ''}`;
    const [lab, col] = STATUS_FR[t.status];
    return `<tr><td class="muted">${t.id}</td><td><b>${esc(out ? t.to_name : t.from_name)}</b> <span class="muted small">${out ? '(envoyé)' : '(reçu)'}</span></td><td>${give}</td><td>${get}</td>
          <td><span class="pill" style="color:${col}">${lab}</span></td><td><a class="btn sm" href="#/trades/${t.id}">Ouvrir</a></td></tr>`;
  }).join('')}</tbody></table>` : '<div class="empty"><b>Aucun échange</b>Rendez-vous dans Amis pour en proposer un.</div>'}</div>`;
}

export async function tradePage({ view, params, stale, rerender }) {
  const t = await api(`/trades/${params[0]}`);
  if (stale()) return;
  const me = store.me;
  const out = t.from.id === me.id;
  const [lab, col] = STATUS_FR[t.status];
  const side = (title, cards, credits) => `<div class="panel"><h3>${title}</h3>
    ${credits ? `<div class="pill" style="margin-bottom:12px">+ ${cr(credits)}</div>` : ''}
    <div class="cards">${cards.map((c, i) => tile(c, { i, href: `#/card/${c.id}`, lite: true })).join('') || '<div class="muted small">Aucune carte</div>'}</div>
    <div class="muted small" style="margin-top:10px">Valeur : ${cr(cards.reduce((a, c) => a + c.value, 0) + credits)}</div></div>`;
  view.innerHTML = `<div class="section-title" style="margin-top:0"><div><h1>Échange #${t.id}</h1><div class="muted">${esc(t.from.username)} → ${esc(t.to.username)} · ${ago(t.created_at)}</div></div><span class="pill" style="color:${col}">${lab}</span></div>
    ${t.message ? `<div class="panel" style="margin-bottom:18px">“${esc(t.message)}”</div>` : ''}
    <div class="trade-cols">${side(out ? 'Vous donnez' : `${esc(t.from.username)} donne`, t.give, t.credits_from)}${side(out ? `${esc(t.to.username)} donne` : 'Vous recevez… en échange de', t.take, t.credits_to)}</div>
    ${t.status === 'OPEN' ? `<div class="row end" style="margin-top:18px">${out ? '<button class="btn danger" data-a="cancel">Annuler la proposition</button>'
    : `<button class="btn ghost" data-a="decline">Refuser</button><a class="btn" href="#/trade/new/${encodeURIComponent(t.from.username)}">Contre-proposer</a><button class="btn primary" data-a="accept">Accepter l’échange</button>`}</div>` : ''}`;
  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'accept' && !(await confirmBox('Accepter cet échange ? Il sera exécuté immédiatement et ne pourra pas être annulé.', 'Accepter'))) return;
    try { await post(`/trades/${t.id}/${b.dataset.a}`); toast('Échange mis à jour', 'good'); store.refresh(); rerender(); } catch (err) { toast(esc(err.message), 'error'); }
  });
}

export async function newTradePage({ view, params, stale }) {
  const username = params[0];
  const [mine, theirs, prof] = await Promise.all([api('/inventory'), api(`/users/${encodeURIComponent(username)}/cards`), api(`/users/${encodeURIComponent(username)}`)]);
  if (stale()) return;
  if (prof.friend !== 'FRIENDS') { view.innerHTML = `<div class="empty"><b>Vous n’êtes pas amis avec ${esc(username)}</b><a class="btn" href="#/friends" style="margin-top:12px">Amis</a></div>`; return; }
  const myOwned = mine.filter((c) => c.status === 'OWNED');
  const st = { give: [], take: [] };
  const byId = new Map([...myOwned, ...theirs].map((c) => [c.id, c]));
  view.innerHTML = `<h1>Proposer un échange à ${esc(username)}</h1>
    <div class="trade-cols">
      <div class="panel"><div class="row between"><h3 style="margin:0">Vous donnez</h3><button class="btn sm" data-pick="give">Choisir</button></div>
        <div class="cards" data-side="give" style="margin:12px 0"></div><label class="field">Mu offerts<input class="input" type="number" min="0" value="0" data-cfrom></label></div>
      <div class="panel"><div class="row between"><h3 style="margin:0">Vous demandez</h3><button class="btn sm" data-pick="take">Choisir</button></div>
        <div class="cards" data-side="take" style="margin:12px 0"></div><label class="field">Mu demandés<input class="input" type="number" min="0" value="0" data-cto></label></div>
    </div>
    <div class="panel" style="margin-top:18px"><label class="field">Message (facultatif)<input class="input" maxlength="200" data-msg></label>
      <div class="row between" style="margin-top:14px"><span class="muted small" data-sum></span><button class="btn primary xl" data-send>Envoyer la proposition</button></div></div>`;
  const draw = () => {
    for (const k of ['give', 'take']) $(`[data-side="${k}"]`, view).innerHTML = st[k].map((id, i) => tile(byId.get(id), { i, lite: true })).join('') || '<div class="muted small">Aucune carte</div>';
    const v = (k) => st[k].reduce((a, id) => a + byId.get(id).value, 0);
    $('[data-sum]', view).innerHTML = `Valeur donnée ${cr(v('give') + Number($('[data-cfrom]', view).value || 0))} · reçue ${cr(v('take') + Number($('[data-cto]', view).value || 0))}`;
  };
  view.addEventListener('input', draw);
  view.addEventListener('click', async (e) => {
    const p = e.target.closest('[data-pick]');
    if (p) {
      const k = p.dataset.pick;
      const r = await pickCards(k === 'give' ? myOwned : theirs, { title: k === 'give' ? 'Vos cartes' : `Cartes de ${username}`, max: TRADES.maxCardsPerSide, selected: st[k] });
      if (r) { st[k] = r; draw(); }
    }
    if (e.target.closest('[data-send]')) {
      try {
        const { id } = await post('/trades', { toId: prof.id, give: st.give, take: st.take, creditsFrom: Number($('[data-cfrom]', view).value || 0), creditsTo: Number($('[data-cto]', view).value || 0), message: $('[data-msg]', view).value });
        toast('Proposition envoyée !', 'good'); location.hash = `#/trades/${id}`;
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
    SELF: '<a class="btn" href="#/settings">Modifier le profil</a><a class="btn" href="#/inventory">Choisir la vitrine</a>',
    NONE: '<button class="btn primary" data-friend>Ajouter en ami</button>',
    SENT: '<span class="pill">Demande envoyée</span>',
    RECEIVED: '<a class="btn primary" href="#/friends">Répondre à sa demande</a>',
    FRIENDS: `<span class="pill pos">Amis</span><a class="btn primary" href="#/trade/new/${encodeURIComponent(p.username)}">Proposer un échange</a>`,
  }[p.friend] || (me ? '' : '<a class="btn" href="#/login">Connexion</a>');
  view.innerHTML = `<div class="panel row between" style="padding:26px">
      <div class="row">${avatar(p, 76)}<div><h1 style="margin:0">${esc(p.username)} ${p.verified ? `<span class="verified" title="Discord : ${esc(p.discord_name || '')}">✔</span>` : ''}</h1>
        <div class="muted">Niveau ${p.level.level} · ${p.online ? '<span class="pos">en ligne</span>' : 'hors ligne'} · membre depuis ${new Date(p.created_at).toLocaleDateString('fr-FR')}${p.bot ? ' · PNJ marchand' : ''}</div>
        ${p.bio ? `<p style="margin:8px 0 0">${esc(p.bio)}</p>` : ''}</div></div>
      <div class="row">${p.bot ? '' : btn}</div></div>
    <div class="stats panel" style="margin-top:18px"><div><b>${cr(p.value)}</b>valeur de collection</div><div><b>${p.count}</b>cartes</div><div><b>${p.discovered}/${p.total}</b>skins découverts</div><div><b>${p.packs_opened}</b>boosters ouverts</div>
      ${p.byRarity.sort((a, b) => b.rarity - a.rarity).map((r) => `<div><b style="color:${RARITIES[r.rarity].color}">${r.n}</b>${RARITIES[r.rarity].fr}</div>`).join('')}</div>
    <div class="section-title"><h2>Vitrine</h2></div>
    <div class="cards lg">${p.showcase.map((c, i) => `<a class="tile" href="#/card/${c.id}" style="--i:${i}">${cardOf(c)}<div class="name">${esc(skinTitle(SKIN_BY_ID.get(c.s)))}</div><div class="meta"><span class="muted">${esc(RARITIES[c.r].fr)}</span><b>${cr(c.value)}</b></div></a>`).join('') || '<div class="empty">Vitrine vide</div>'}</div>`;
  $('[data-friend]', view)?.addEventListener('click', async () => {
    try { await post('/friends/request', { username: p.username }); toast('Demande envoyée', 'good'); rerender(); } catch (e) { toast(esc(e.message), 'error'); }
  });
}

// ───────── Classements
export async function leaderboardPage({ view, stale }) {
  const lb = await api('/leaderboards');
  if (stale()) return;
  const tabs = [['value', 'Valeur de collection'], ['best', 'Meilleure carte'], ['discovered', 'Skins découverts'], ['level', 'Niveau']];
  let cur = 'value';
  view.innerHTML = `<h1>Classement</h1><div class="tabs" style="margin-bottom:18px">${tabs.map(([k, l]) => `<button data-t="${k}" class="${k === cur ? 'on' : ''}">${l}</button>`).join('')}</div><div class="panel" data-list></div>`;
  const draw = () => {
    $('[data-list]', view).innerHTML = `<table class="t"><tbody>${lb[cur].map((u, i) => `<tr>
      <td style="width:40px;font-family:var(--display);font-weight:700;color:${['#ffd76a', '#cfd6e6', '#e0a46a'][i] || 'var(--muted)'}">#${i + 1}</td>
      <td><a class="row" href="#/u/${encodeURIComponent(u.username)}">${avatar(u, 32)}<b>${esc(u.username)}</b>${u.bot ? '<span class="pill small">PNJ</span>' : ''}</a></td>
      <td class="muted">Niv. ${u.level}</td>
      <td style="text-align:right">${cur === 'value' ? cr(u.value) : cur === 'best' ? (u.bestCard ? `<a href="#/card/${u.bestCard.id}">${esc(skinTitle(SKIN_BY_ID.get(u.bestCard.s)))} · ${cr(u.best)}</a>` : '—') : cur === 'discovered' ? `${u.discovered} skins` : `${u.level}`}</td></tr>`).join('')}</tbody></table>`;
  };
  view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    cur = b.dataset.t; view.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b)); draw();
  });
  draw();
}

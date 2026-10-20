// Marché (acheter, vendre, mes annonces) et tableau des échanges (« je donne celle-ci contre l'une de celles-là »).
import { S, game, setUser } from '../state.js';
import { api } from '../api.js';
import { RARITY, RARITIES, ECONOMY } from '/shared/config.js';
import { cardHTML, slotHTML, inspect } from '../card.js';
import { esc, fmt, gem, icon, modal, toast, toastErr, confirmBox, ago, prefs, $, refresh } from '../util.js';
import { sfx } from '../fx.js';

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
const freeCopies = (n) => { const c = S.coll.get(n); return c && !c.locked ? c.qty - c.reserved : 0; };

export function sellModal(n) {
  const g = game(n);
  api.get(`/card/${n}`).then(({ price }) => {
    const suggest = Math.max(1, price.cheapest ? price.cheapest - 1 : price.median || price.base);
    const m = modal(`<h3>Vendre une carte</h3>
      <div style="display:grid;grid-template-columns:120px 1fr;gap:16px;margin-top:12px;align-items:start">
        <div>${cardHTML(n)}</div>
        <div style="display:grid;gap:10px">
          <b>${esc(g.t)}</b>
          <div class="mut" style="font-size:12.5px">Cote : ${fmt(price.base)} ◆ · Médiane 30 j : ${price.median ? `${fmt(price.median)} ◆` : '—'} · Annonce la moins chère : ${price.cheapest ? `${fmt(price.cheapest)} ◆` : '—'}</div>
          <div class="field"><label>Prix (◆)</label><input class="input mono" type="number" min="1" max="${ECONOMY.maxPrice}" value="${suggest}" data-price></div>
          <div class="mut" style="font-size:12.5px" data-net></div>
          ${freeCopies(n) <= 1 ? '<div style="color:var(--warn);font-size:12.5px">C’est ton seul exemplaire : il quittera ta collection une fois vendu.</div>' : ''}
          <button class="btn acc" data-go>Mettre en vente</button>
        </div>
      </div>`);
    const inp = $('[data-price]', m.el);
    const upd = () => { const p = Math.floor(Number(inp.value) || 0); $('[data-net]', m.el).innerHTML = `Gain net après frais (${ECONOMY.marketFee * 100} %) : ${gem(p - Math.ceil(p * ECONOMY.marketFee))}`; };
    inp.oninput = upd; upd();
    $('[data-go]', m.el).onclick = async () => {
      try {
        await api.post('/market', { card: n, price: Math.floor(Number(inp.value)) });
        S.coll.get(n).reserved++;
        toast('Carte mise en vente ✓', 'ok');
        m.close();
        refresh();
      } catch (e) { toastErr(e); }
    };
  }).catch(toastErr);
}

// Crée une offre d'échange : la carte donnée, puis jusqu'à 5 cartes acceptées en retour.
export function offerModal(give = null) {
  let wants = [];
  const m = modal(`<h3>Proposer une carte à l’échange</h3><p class="mut" style="margin:0">Tu donnes une carte et tu choisis jusqu’à 5 cartes que tu acceptes en retour : tu en recevras une seule, la première qu’un joueur te donne. L’échange se fait en un clic, sans ta validation.</p>
    <div data-step style="margin-top:14px"></div>`, { wide: true });
  const step = $('[data-step]', m.el);
  const pickGive = () => {
    const mine = [...S.coll.keys()].filter((n) => freeCopies(n) > 0).sort((a, b) => (S.coll.get(b).qty - S.coll.get(a).qty) || a - b);
    step.innerHTML = `<b>1. Carte à donner</b><div class="search" style="margin:10px 0">${icon.search}<input class="input" placeholder="Chercher dans mes cartes…" data-q></div><div class="pick-grid" data-g></div>`;
    const draw = (q = '') => { $('[data-g]', step).innerHTML = mine.filter((n) => !q || norm(game(n).t).includes(norm(q))).slice(0, 120).map((n) => slotHTML(n)).join('') || '<p class="mut">Aucune carte libre à donner.</p>'; };
    draw();
    $('[data-q]', step).oninput = (e) => draw(e.target.value);
    $('[data-g]', step).onclick = (e) => { const s = e.target.closest('[data-card]'); if (s) { give = Number(s.dataset.card); pickWants(); } };
  };
  const pickWants = () => {
    step.innerHTML = `<div class="row" style="align-items:start;gap:16px"><div style="width:110px;flex-shrink:0">${cardHTML(give)}</div>
      <div style="flex:1;min-width:0"><b>2. Ce que tu acceptes en retour</b> <span class="mut">(5 max)</span>
        <div class="pick-grid" data-w style="max-height:none;margin:10px 0;grid-template-columns:repeat(auto-fill,minmax(80px,1fr))"></div>
        <div class="search" style="margin:10px 0">${icon.search}<input class="input" placeholder="Chercher un jeu (même rareté conseillée)…" data-q></div>
        <div class="row wrap" style="margin-bottom:8px"><button class="chip" data-wishes>♥ Mes envies</button><button class="chip" data-same>Même rareté, que je n’ai pas</button></div>
        <div class="pick-grid" data-g></div>
        <button class="btn acc block" style="margin-top:12px" data-go>Publier l’offre</button></div></div>`;
    const drawW = () => { $('[data-w]', step).innerHTML = wants.map((n) => slotHTML(n, { showQty: false }).replace('class="slot"', 'class="slot sel"')).join('') || '<span class="mut" style="font-size:12.5px">Choisis des cartes ci-dessous.</span>'; };
    const drawG = (ns) => { $('[data-g]', step).innerHTML = ns.slice(0, 60).map((n) => slotHTML(n)).join('') || '<p class="mut">Rien ne correspond.</p>'; };
    const r = game(give).r;
    const sameRarity = () => S.games.filter((g) => g.r === r && !(S.coll.get(g.n)?.qty > 0) && g.n !== give).map((g) => g.n);
    drawW(); drawG(sameRarity());
    $('[data-q]', step).oninput = (e) => { const q = norm(e.target.value); drawG(q.length < 2 ? sameRarity() : S.games.filter((g) => norm(g.t).includes(q)).map((g) => g.n)); };
    $('[data-wishes]', step).onclick = () => drawG([...S.wishes]);
    $('[data-same]', step).onclick = () => drawG(sameRarity());
    $('[data-g]', step).onclick = (e) => {
      const s = e.target.closest('[data-card]'); if (!s) return;
      const n = Number(s.dataset.card);
      if (!wants.includes(n) && wants.length < 5 && n !== give) wants.push(n);
      drawW();
    };
    $('[data-w]', step).onclick = (e) => { const s = e.target.closest('[data-card]'); if (s) { wants = wants.filter((x) => x !== Number(s.dataset.card)); drawW(); } };
    $('[data-go]', step).onclick = async () => {
      try {
        await api.post('/offers', { give, wants });
        S.coll.get(give).reserved++;
        toast('Offre publiée ✓ Ta carte est mise de côté.', 'ok');
        m.close();
        refresh();
      } catch (e) { toastErr(e); }
    };
  };
  give ? pickWants() : pickGive();
}

const TABS = [['buy', 'Acheter'], ['sell', 'Vendre'], ['offers', 'Échanges'], ['mine', 'Mes annonces']];

export async function render(main) {
  let tab = prefs.get('mtab', 'buy');
  const st = { q: '', rar: new Set(), sort: 'recent', wish: false };
  main.innerHTML = `<div class="eyebrow">HÔTEL DES VENTES · 市場</div><h1 class="h1">Marché & échanges</h1>
    <p class="lead">Achète la carte qui te manque, vends tes doublons au plus offrant, échange directement avec les autres joueurs.</p>
    <div class="seg" style="margin:22px 0 4px">${TABS.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div data-body style="margin-top:16px"></div>`;
  const body = $('[data-body]', main);
  let listings = [];

  const filt = (n) => {
    const g = game(n);
    if (st.q && !norm(g.t).includes(norm(st.q)) && !norm(g.u).includes(norm(st.q))) return false;
    if (st.rar.size && !st.rar.has(g.r)) return false;
    if (st.wish && !S.wishes.has(n)) return false;
    return true;
  };
  const toolbar = (sorts) => `<div class="toolbar" style="margin-top:0"><div class="search">${icon.search}<input class="input" data-q placeholder="Chercher une carte…" value="${esc(st.q)}"></div>
    ${sorts ? `<select class="select" data-sort>${sorts.map(([k, l]) => `<option value="${k}" ${st.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}
    <button class="chip ${st.wish ? 'on' : ''}" data-wishf>♥ Mes envies</button></div>
    <div class="filters">${RARITIES.map((r) => `<button class="chip ${st.rar.has(r) ? 'on' : ''}" data-rar="${r}" style="--rc:${RARITY[r].color}"><span class="r-dot"></span>${RARITY[r].label}</button>`).join('')}</div><div data-list></div>`;

  async function buy() {
    if (!body.querySelector('[data-list]')) body.innerHTML = toolbar([['recent', 'Plus récentes'], ['asc', 'Prix croissant'], ['desc', 'Prix décroissant'], ['rare', 'Plus rares d’abord']]);
    listings = await api.get('/market');
    drawBuy();
  }
  function drawBuy() {
    const ri = (n) => RARITIES.indexOf(game(n).r);
    const arr = listings.filter((l) => filt(l.card)).sort({
      recent: (a, b) => b.id - a.id, asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price, rare: (a, b) => ri(b.card) - ri(a.card) || a.price - b.price,
    }[st.sort] || ((a, b) => b.id - a.id));
    $('[data-list]', body).innerHTML = arr.length ? `<div class="cards">${arr.map((l) => slotHTML(l.card, {
      missing: false, extra: `<div class="price"><span class="mut" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.seller === S.user.username ? 'Ton annonce' : esc(l.seller)}</span><b>${fmt(l.price)} ◆</b></div>`,
    }).replace('class="slot"', `class="slot${l.seller === S.user.username ? ' mine' : ''}"`).replace('data-card=', `data-listing="${l.id}" data-card=`)).join('')}</div>`
      : `<div class="empty"><strong>Aucune annonce ne correspond.</strong>Reviens plus tard, ou vends tes propres doublons !</div>`;
  }

  function sell() {
    const mine = [...S.coll.keys()].filter((n) => freeCopies(n) > 0 && filt(n))
      .sort((a, b) => RARITIES.indexOf(game(b).r) - RARITIES.indexOf(game(a).r) || S.coll.get(b).qty - S.coll.get(a).qty);
    if (!body.querySelector('[data-list]')) body.innerHTML = toolbar(null);
    $('[data-list]', body).innerHTML = `<p class="mut" style="margin-top:0">Tes cartes libres à vendre : hors cartes verrouillées et déjà engagées. Les doublons ont leur nombre d’exemplaires en haut à droite.</p>
      ${mine.length ? `<div class="cards">${mine.map((n) => slotHTML(n)).join('')}</div>` : '<div class="empty">Aucune carte libre à vendre pour le moment.</div>'}`;
  }

  async function offers() {
    const list = await api.get('/offers');
    const can = (o) => o.wants.filter((n) => freeCopies(n) > 0 && (S.coll.get(n).qty > 1 || true));
    body.innerHTML = `<div class="row wrap" style="margin-bottom:16px"><button class="btn acc" data-newoffer>＋ Proposer une carte à l’échange</button>
      <span class="mut" style="font-size:13px">« Je donne celle-ci contre l’une de celles-là. » Si tu as une des cartes demandées, tu échanges en un clic.</span></div>
      ${list.length ? list.map((o) => {
        const mineOk = can(o);
        const own = o.username === S.user.username;
        return `<div class="offer">
          <div class="slot" data-card="${o.give}">${cardHTML(o.give)}</div>
          <div class="arrow">⇄</div>
          <div class="wants">${o.wants.map((n) => `<div class="slot" data-card="${n}">${cardHTML(n, { missing: !(S.coll.get(n)?.qty > 0) })}</div>`).join('')}</div>
          <div class="who"><span class="avatar" style="--h:${o.hue};width:22px;height:22px;font-size:10px;box-shadow:none">${esc(o.username[0])}</span>
            <a href="/profil/${encodeURIComponent(o.username)}"><b>${esc(o.username)}</b></a> donne <b>${esc(game(o.give).t)}</b> · ${ago(o.created_at)}
            <span class="spacer"></span>${own ? '<span class="mut">ton offre</span>' : mineOk.length ? `<button class="btn sm acc" data-take="${o.id}">Je l’ai : échanger</button>` : '<span class="mut">Tu n’as aucune de ces cartes</span>'}</div>
        </div>`;
      }).join('') : '<div class="empty">Aucune offre ouverte pour le moment. Lance la première !</div>'}`;
    body.dataset.offers = JSON.stringify(list);
  }

  async function mine() {
    const [ls, os] = await Promise.all([api.get('/market/mine'), api.get('/offers/mine')]);
    body.innerHTML = `<h2 class="h3" style="margin-bottom:12px">Mes ventes en cours</h2>
      ${ls.length ? `<div class="cards sm">${ls.map((l) => slotHTML(l.card, { extra: `<div class="price"><b>${fmt(l.price)} ◆</b><button class="chip" data-cancel="${l.id}">Annuler</button></div>` })).join('')}</div>` : '<p class="mut">Tu n’as encore rien mis en vente.</p>'}
      <h2 class="h3" style="margin:28px 0 12px">Mes offres d’échange</h2>
      ${os.length ? os.map((o) => `<div class="offer"><div>${cardHTML(o.give)}</div><div class="arrow">⇄</div><div class="wants">${o.wants.map((n) => cardHTML(n)).join('')}</div>
        <div class="who">${ago(o.created_at)}<span class="spacer"></span><button class="chip" data-cancel-offer="${o.id}">Retirer l’offre</button></div></div>`).join('') : '<p class="mut">Aucune offre en cours.</p>'}`;
  }

  const draw = () => {
    body.innerHTML = '<div class="mut">Chargement…</div>';
    Promise.resolve().then(() => ({ buy, sell, offers, mine })[tab]()).catch(toastErr);
  };
  draw();

  let qt;
  main.addEventListener('input', (e) => {
    if (!e.target.matches('[data-q]')) return;
    clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value; tab === 'buy' ? drawBuy() : sell(); }, 160);
  });
  main.addEventListener('change', (e) => { if (e.target.matches('[data-sort]')) { st.sort = e.target.value; drawBuy(); } });
  main.addEventListener('click', async (e) => {
    const t = e.target;
    const tb = t.closest('[data-tab]');
    if (tb) { tab = tb.dataset.tab; prefs.set('mtab', tab); main.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x === tb)); return draw(); }
    const r = t.closest('[data-rar]');
    if (r) { st.rar.has(r.dataset.rar) ? st.rar.delete(r.dataset.rar) : st.rar.add(r.dataset.rar); r.classList.toggle('on'); return tab === 'buy' ? drawBuy() : sell(); }
    if (t.closest('[data-wishf]')) { st.wish = !st.wish; t.closest('[data-wishf]').classList.toggle('on'); return tab === 'buy' ? drawBuy() : sell(); }
    if (t.closest('[data-newoffer]')) return offerModal();
    try {
      const c = t.closest('[data-cancel]');
      if (c) { await api.del(`/market/${c.dataset.cancel}`); const l = S.coll.get(Number(c.closest('[data-card]').dataset.card)); if (l) l.reserved--; toast('Annonce annulée, la carte t’est rendue.'); return mine(); }
      const co = t.closest('[data-cancel-offer]');
      if (co) { await api.del(`/offers/${co.dataset.cancelOffer}`); await loadAgain(); toast('Offre retirée.'); return mine(); }
      const tk = t.closest('[data-take]');
      if (tk) return takeOffer(JSON.parse(body.dataset.offers).find((o) => o.id === Number(tk.dataset.take)));
    } catch (err) { return toastErr(err); }
    const s = t.closest('[data-card]');
    if (!s) return;
    const n = Number(s.dataset.card);
    if (tab === 'buy' && s.dataset.listing) return buyModal(listings.find((l) => l.id === Number(s.dataset.listing)));
    if (tab === 'sell') return sellModal(n);
    inspect(n);
  });

  async function loadAgain() { const { loadCollection } = await import('../state.js'); await loadCollection(); }

  async function buyModal(l) {
    const g = game(l.card);
    const m = modal(`<h3>Confirmer l’achat</h3><div style="display:grid;grid-template-columns:130px 1fr;gap:16px;margin-top:12px;align-items:start">
      <div>${cardHTML(l.card)}</div><div style="display:grid;gap:10px"><b>${esc(g.t)}</b><span class="mut">Vendu par ${esc(l.seller)} · ${ago(l.created_at)}</span>
      <div style="font-size:20px">${gem(l.price)}</div><span class="mut" style="font-size:12.5px">Solde après achat : ${gem(S.user.jetons - l.price)}</span>
      ${S.coll.get(l.card)?.qty > 0 ? '<span style="color:var(--warn);font-size:12.5px">Tu as déjà cette carte.</span>' : '<span class="badge new" style="justify-self:start">Nouvelle pour toi</span>'}
      <div class="row">${l.seller === S.user.username ? '<button class="btn" data-cancel-own>Annuler l’annonce</button>'
        : `<button class="btn acc" data-go ${S.user.jetons < l.price ? 'disabled' : ''}>Acheter</button>`}<a class="btn" href="/carte/${l.card}">Voir la fiche</a></div></div></div>`);
    $('[data-cancel-own]', m.el)?.addEventListener('click', async () => {
      try {
        await api.del(`/market/${l.id}`);
        const c = S.coll.get(l.card); if (c) c.reserved = Math.max(0, c.reserved - 1);
        toast('Annonce annulée, la carte t’est rendue.');
        m.close(); buy();
      } catch (e) { toastErr(e); }
    });
    if (!$('[data-go]', m.el)) return;
    $('[data-go]', m.el).onclick = async () => {
      try {
        const r = await api.post(`/market/${l.id}/buy`);
        setUser(r.user);
        const cur = S.coll.get(l.card);
        if (cur) cur.qty++; else S.coll.set(l.card, { qty: 1, reserved: 0, locked: false, first: Date.now() });
        S.wishes.delete(l.card);
        sfx.coin();
        toast(`Achat réussi ✓ ${esc(g.t)} rejoint ta collection.`, 'ok');
        m.close();
        buy();
      } catch (e) { toastErr(e); }
    };
  }

  function takeOffer(o) {
    const opts = o.wants.filter((n) => freeCopies(n) > 0);
    const m = modal(`<h3>Échanger avec ${esc(o.username)}</h3><p class="mut">Tu reçois <b>${esc(game(o.give).t)}</b>. Choisis la carte que tu donnes en retour : l’échange est immédiat et définitif.</p>
      <div class="pick-grid" style="margin-top:12px">${opts.map((n) => slotHTML(n)).join('')}</div>`);
    m.el.querySelector('.pick-grid').onclick = async (e) => {
      const s = e.target.closest('[data-card]'); if (!s) return;
      const n = Number(s.dataset.card);
      const only = S.coll.get(n).qty === 1;
      if (!(await confirmBox('Accepter cet échange ?', `Tu donnes <b>${esc(game(n).t)}</b>${only ? ' (ton seul exemplaire)' : ''} et tu reçois <b>${esc(game(o.give).t)}</b>. C’est définitif.`, 'Oui, échanger'))) return;
      try {
        const r = await api.post(`/offers/${o.id}/take`, { give: n });
        setUser(r.user);
        S.coll.get(n).qty--;
        const cur = S.coll.get(o.give);
        if (cur) cur.qty++; else S.coll.set(o.give, { qty: 1, reserved: 0, locked: false, first: Date.now() });
        sfx.fanfare();
        toast('Échange conclu ! ⇄', 'ok');
        m.close();
        offers();
      } catch (err) { toastErr(err); }
    };
  }
}

export { inspect };

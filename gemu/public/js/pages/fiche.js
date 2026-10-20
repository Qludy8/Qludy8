// Fiche d'un jeu (équivalent du wiki kyara) : grande carte, infos, description et captures débloquées à l'obtention,
// cote et annonces du marché, actions (verrouiller, envie, recycler, vendre, échanger), même univers.
import { S, game, owned, shotUrl, setUser } from '../state.js';
import { api } from '../api.js';
import { RARITY, ECONOMY } from '/shared/config.js';
import { cardHTML, slotHTML, bindTilt, inspect } from '../card.js';
import { esc, fmt, gem, pad4, icon, modal, toast, toastErr, confirmBox, ago, $, refresh } from '../util.js';
import { sfx } from '../fx.js';
import { sellModal, offerModal } from './market.js';

export async function render(main, [nStr]) {
  const n = Number(nStr);
  const g = game(n);
  if (!g) { main.innerHTML = '<div class="empty"><strong>Cette carte n’existe pas.</strong></div>'; return; }
  main.innerHTML = '<div class="mut">Chargement de la fiche…</div>';
  let d;
  try { d = await api.get(`/card/${n}`); } catch (e) { main.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  const c = S.coll.get(n);
  const own = owned(n);
  const det = d.details || {};
  const price = d.price;
  const meta = [g.d, g.y, g.pf || (g.s ? 'PC · Steam' : '')].filter(Boolean).map(esc).join(' · ');
  const same = (S.univers.get(g.u) || []).filter((x) => x !== n).slice(0, 12);
  const free = c ? c.qty - c.reserved - (c.locked ? c.qty : 0) : 0;
  const link = det.url ? `<a class="btn sm" href="${esc(det.url)}" target="_blank" rel="noopener noreferrer">${g.s ? 'Voir sur Steam ↗' : 'Article Wikipédia ↗'}</a>` : '';

  main.innerHTML = `
    <div class="fiche">
      <div class="left">
        <div data-big>${cardHTML(n, { lg: true, tilt: true })}</div>
        <div class="row wrap" style="justify-content:center">
          ${own ? `<button class="btn sm" data-lock>${c.locked ? '🔓 Déverrouiller' : '🔒 Verrouiller'}</button>` : `<button class="btn sm" data-wish>${S.wishes.has(n) ? '♥ Dans tes envies' : '♡ Ajouter à mes envies'}</button>`}
          ${c?.qty > 1 && !c.locked ? `<button class="btn sm" data-recycle>♻ Recycler 1 doublon · +${RARITY[g.r].recycle} ◆</button>` : ''}
          ${own && free > 0 ? `<button class="btn sm" data-sell>Vendre</button><button class="btn sm" data-trade>⇄ Échanger</button>` : ''}
        </div>
        ${own ? `<div class="mut" style="text-align:center;font-size:12.5px">Tu l’as depuis le ${new Date(c.first).toLocaleDateString('fr-FR')} · ${c.qty} exemplaire${c.qty > 1 ? 's' : ''}${c.reserved ? ` (${c.reserved} au marché ou en échange)` : ''}</div>` : `<div class="mut" style="text-align:center;font-size:12.5px">Tu ne l’as pas encore.</div>`}
      </div>
      <div>
        <div class="eyebrow">FICHE · 情報 · #${pad4(n)}/${pad4(S.total)}</div>
        <h1 class="h1">${esc(g.t)}</h1>
        <div class="row wrap"><span class="badge" style="--rc:${RARITY[g.r].color}">${RARITY[g.r].label}</span><a class="chip" href="/collection/univers/${encodeURIComponent(g.u)}">${esc(g.u)}</a><span class="mut">${meta}</span></div>
        <div class="facts">
          <div class="fact"><small>Rang</small><b class="mono">#${pad4(n)}</b></div>
          <div class="fact"><small>Rareté</small><b style="color:${RARITY[g.r].color}">${RARITY[g.r].label}</b><div class="mut" style="font-size:11.5px">${RARITY[g.r].rule}</div></div>
          <div class="fact"><small>Popularité</small><b class="mono">${g.p}/99</b></div>
          <div class="fact"><small>Note</small><b class="mono">${g.q} %</b>${det.label ? `<div class="mut" style="font-size:11.5px">${esc(det.label)}</div>` : ''}</div>
          <div class="fact"><small>${g.s ? 'Avis Steam' : 'Audience estimée'}</small><b class="mono">${g.s ? '' : '≈ '}${fmt(g.v)}</b></div>
          <div class="fact"><small>Cote</small><b class="mono">${fmt(price.median ?? price.base)} ◆</b><div class="mut" style="font-size:11.5px">${price.median ? 'médiane 30 j' : 'valeur de base'}</div></div>
          <div class="fact"><small>Collectionneurs</small><b class="mono">${fmt(price.owners)}</b><div class="mut" style="font-size:11.5px">${fmt(price.copies)} exemplaires</div></div>
          <div class="fact"><small>Recyclage</small><b class="mono">${RARITY[g.r].recycle} ◆</b></div>
        </div>
        ${own ? `
          ${det.desc ? `<p class="desc-lg">${esc(det.desc)}</p>` : g.wk ? '<p class="desc-lg" data-wikidesc>Chargement du résumé Wikipédia…</p>' : ''}
          ${det.lang === 'en' ? '<p class="mut" style="font-size:12px">Résumé en anglais (Wikipédia).</p>' : ''}
          ${det.tags?.length ? `<div class="tags" style="margin:14px 0">${det.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
          ${det.shots?.length ? `<div class="sec-h" style="margin-top:24px"><h2 class="h3">En jeu</h2></div><div class="shots">${det.shots.map((s) => `<img src="${esc(shotUrl(s, 'thumb'))}" data-zoom="${esc(shotUrl(s))}" alt="Capture de ${esc(g.t)}" loading="lazy">`).join('')}</div>` : ''}
          <div class="row wrap" style="margin-top:16px">${link}</div>`
        : `<div class="lockbox"><b>🔒 Fiche verrouillée</b>Chaque carte obtenue ouvre la fiche complète de son jeu : présentation, captures d’écran en jeu, tags.<div style="margin-top:12px">${link}</div></div>`}

        <div class="sec">
          <div class="sec-h"><div><div class="eyebrow">MARCHÉ · 市場</div><h2 class="h3" style="margin-top:8px">Annonces pour ce jeu</h2></div></div>
          ${d.listings.length ? `<table class="table"><tr><th>Vendeur</th><th class="num">Prix</th><th></th></tr>${d.listings.map((l) => `<tr>
            <td><a href="/profil/${encodeURIComponent(l.seller)}">${esc(l.seller)}</a> <span class="mut">· ${ago(l.created_at)}</span></td>
            <td class="num">${fmt(l.price)} ◆</td>
            <td style="text-align:right">${l.seller === S.user.username ? '<span class="mut">ton annonce</span>' : `<button class="btn sm acc" data-buy="${l.id}" data-price="${l.price}">Acheter</button>`}</td></tr>`).join('')}</table>`
          : '<p class="mut">Aucune annonce pour l’instant.</p>'}
          ${price.sales.length ? `<p class="mut" style="font-size:12.5px;margin-top:10px">Dernières ventes : ${price.sales.map((s) => `${fmt(s.price)} ◆`).join(' · ')}</p>` : ''}
        </div>
      </div>
    </div>
    ${same.length ? `<section class="sec"><div class="sec-h"><div><div class="eyebrow">MÊME UNIVERS</div><h2 class="h2" style="margin-top:8px">${esc(g.u)}</h2></div><a class="more" href="/collection/univers/${encodeURIComponent(g.u)}">Voir l’album →</a></div>
      <div class="cards sm">${same.map((x) => slotHTML(x)).join('')}</div></section>` : ''}`;

  const unbind = bindTilt($('[data-big] .tcg', main));
  if (own && !det.desc && g.wk) wikiSummary(g).then((txt) => {
    const box = $('[data-wikidesc]', main);
    if (box && txt) box.textContent = txt;
  });
  $('[data-big]', main).onclick = () => inspect(n, { actions: false });

  main.addEventListener('click', async (e) => {
    const t = e.target;
    const z = t.closest('[data-zoom]');
    if (z) {
      const el = document.createElement('div');
      el.className = 'zoom';
      el.innerHTML = `<img src="${esc(z.dataset.zoom)}" alt="">`;
      el.onclick = () => el.remove();
      document.getElementById('layer').append(el);
      return;
    }
    const s = t.closest('.cards [data-card]');
    if (s) return inspect(Number(s.dataset.card));
    try {
      if (t.closest('[data-lock]')) {
        await api.post(`/collection/${n}/lock`, { locked: !c.locked });
        c.locked = !c.locked;
        toast(c.locked ? '🔒 Verrouillée : elle ne peut plus être vendue, échangée ni recyclée.' : 'Carte déverrouillée.');
        refresh();
      }
      if (t.closest('[data-wish]')) {
        const on = !S.wishes.has(n);
        await api.post(`/collection/${n}/wish`, { on });
        on ? S.wishes.add(n) : S.wishes.delete(n);
        toast(on ? '♥ Ajoutée à tes envies' : 'Retirée de tes envies');
        refresh();
      }
      if (t.closest('[data-recycle]')) {
        const r = await api.post('/recycle', { card: n, qty: 1 });
        setUser(r.user); c.qty -= r.count; sfx.coin();
        toast(`♻ +${gem(r.gain)}`, 'ok');
        refresh();
      }
      if (t.closest('[data-sell]')) sellModal(n);
      if (t.closest('[data-trade]')) offerModal(n);
      const b = t.closest('[data-buy]');
      if (b) {
        if (!(await confirmBox('Confirmer l’achat', `Acheter <b>${esc(g.t)}</b> pour ${gem(b.dataset.price)} ?`, 'Acheter'))) return;
        const r = await api.post(`/market/${b.dataset.buy}/buy`);
        setUser(r.user);
        const cur = S.coll.get(n);
        if (cur) cur.qty++; else S.coll.set(n, { qty: 1, reserved: 0, locked: false, first: Date.now() });
        S.wishes.delete(n);
        sfx.coin();
        toast('Achat réussi ✓', 'ok');
        refresh();
      }
    } catch (err) { toastErr(err); }
  });
  return unbind;
}

// Résumé Wikipédia (français si l'article existe sous ce nom, sinon anglais), demandé par le navigateur
async function wikiSummary(g) {
  for (const [lang, title] of [['fr', g.t], ['en', g.wk]]) {
    try {
      const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
      if (!r.ok) continue;
      const d = await r.json();
      if (d.type === 'standard' && d.extract) return d.extract;
    } catch { /* hors ligne */ }
  }
  return '';
}

export { modal, ECONOMY, icon };

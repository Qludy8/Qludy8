// Inventaire (sélection multiple, vente, contrat, gradation), fiche carte, suivi de gradation.
import { RARITIES, WEAR, ECONOMY, GRADING, TRADE_UP, CENTERING } from '/shared/config.js';
import { SKIN_BY_ID, MODEL_BY_KEY, PATTERNS, FINISHES } from '/shared/catalog.js';
import { wearOf, fmtFloat, centeringScore, centeringLabel, gradeLabel } from '/shared/rules.js';
import { api, post, store } from '../api.js';
import { cardOf } from '../opening.js';
import { tile, skinTitle, rarityPill, priceChart } from '../common.js';
import { esc, cr, ago, dur, toast, modal, confirmBox, avatar, $ } from '../ui.js';
import { sound } from '../fx.js';

const PER = 60;

export async function inventoryPage(ctx) {
  const { view, stale } = ctx;
  const cards = await api('/inventory');
  if (stale()) return;
  const me = store.me;
  const sel = new Set();
  const st = { q: '', r: '', w: '', flag: '', sort: 'new', page: 0, select: false };
  const total = cards.reduce((a, c) => a + c.value, 0);

  view.innerHTML = `<div class="section-title" style="margin-top:0"><div><h1>Inventaire</h1>
      <p class="muted">${cards.length} carte(s) · valeur estimée ${cr(total)}</p></div>
      <div class="row"><label class="check"><input type="checkbox" data-select> Sélection multiple</label><a class="btn" href="#/grading">Gradation</a></div></div>
    <div class="filters">
      <input class="input" placeholder="Rechercher…" data-f="q">
      <select class="input" data-f="r"><option value="">Toutes raretés</option>${RARITIES.map((r, i) => `<option value="${i}">${r.fr}</option>`).join('')}</select>
      <select class="input" data-f="w"><option value="">Toutes usures</option>${WEAR.tiers.map((t) => `<option value="${t.key}">${t.fr}</option>`).join('')}</select>
      <select class="input" data-f="flag"><option value="">Tout</option><option value="foil">Holo</option><option value="graded">Gradées</option><option value="mp">Cartes erreur</option><option value="tr">Traqueur</option><option value="listed">En vente</option><option value="locked">Favoris</option></select>
      <select class="input" data-f="sort"><option value="new">Plus récentes</option><option value="value">Valeur ↓</option><option value="rarity">Rareté ↓</option><option value="float">Float ↑</option></select>
    </div>
    <div class="cards" data-grid></div><div class="pager" data-pager></div><div data-bar></div>`;

  const filtered = () => {
    let l = cards.filter((c) => {
      const s = SKIN_BY_ID.get(c.s);
      if (st.q && !skinTitle(s).toLowerCase().includes(st.q)) return false;
      if (st.r !== '' && c.r !== Number(st.r)) return false;
      if (st.w && wearOf(c.f).key !== st.w) return false;
      if (st.flag === 'foil' && !c.foil) return false;
      if (st.flag === 'graded' && c.g == null) return false;
      if (st.flag === 'mp' && !c.mp) return false;
      if (st.flag === 'tr' && c.tr == null) return false;
      if (st.flag === 'listed' && c.status !== 'LISTED') return false;
      if (st.flag === 'locked' && !c.locked) return false;
      return true;
    });
    const so = { new: (a, b) => b.id - a.id, value: (a, b) => b.value - a.value, rarity: (a, b) => b.r - a.r || b.value - a.value, float: (a, b) => a.f - b.f };
    return l.sort(so[st.sort]);
  };
  const draw = () => {
    const l = filtered();
    const pages = Math.max(1, Math.ceil(l.length / PER));
    st.page = Math.min(st.page, pages - 1);
    $('[data-grid]', view).innerHTML = l.slice(st.page * PER, (st.page + 1) * PER)
      .map((c, i) => tile(c, { i, sel: sel.has(c.id), href: st.select ? null : `#/card/${c.id}`, lite: true })).join('')
      || `<div class="empty"><b>${cards.length ? 'Aucune carte ne correspond' : 'Votre inventaire est vide'}</b>${cards.length ? '' : '<a class="btn primary" href="#/packs" style="margin-top:12px">Ouvrir un booster</a>'}</div>`;
    $('[data-pager]', view).innerHTML = pages > 1 ? `<button class="btn sm" data-p="-1" ${st.page ? '' : 'disabled'}>←</button><span class="muted small">Page ${st.page + 1} / ${pages}</span><button class="btn sm" data-p="1" ${st.page < pages - 1 ? '' : 'disabled'}>→</button>` : '';
    bar();
  };
  const bar = () => {
    const chosen = cards.filter((c) => sel.has(c.id));
    const owned = chosen.filter((c) => c.status === 'OWNED');
    const sellable = owned.filter((c) => !c.locked);
    const gain = sellable.reduce((a, c) => a + Math.max(1, Math.floor(c.value * ECONOMY.sellToSystemRate)), 0);
    const sameR = owned.length === TRADE_UP.inputCount && owned.every((c) => c.r === owned[0].r && c.g == null) && owned[0].r <= TRADE_UP.maxInputRarity;
    $('[data-bar]', view).innerHTML = chosen.length ? `<div class="selection-bar">
      <div><b>${chosen.length}</b> sélectionnée(s) · ${cr(chosen.reduce((a, c) => a + c.value, 0))}</div>
      <div class="row">
        <button class="btn sm ghost" data-act="all">Tout sélectionner (page)</button>
        <button class="btn sm ghost" data-act="none">Vider</button>
        <button class="btn sm" data-act="lock">★ Favori</button>
        <button class="btn sm" data-act="showcase" ${chosen.length <= 6 ? '' : 'disabled'}>Vitrine</button>
        <button class="btn sm" data-act="grade" ${owned.length && owned.length <= GRADING.maxPerOrder && owned.every((c) => c.g == null) ? '' : 'disabled'}>Grader</button>
        <button class="btn sm" data-act="tradeup" ${sameR ? '' : 'disabled'} title="${TRADE_UP.inputCount} cartes de même rareté">Contrat ${owned.length}/${TRADE_UP.inputCount}</button>
        <button class="btn sm primary" data-act="sell" ${sellable.length ? '' : 'disabled'}>Vendre ${sellable.length} · +${cr(gain)}</button>
      </div></div>` : '';
  };

  view.addEventListener('input', (e) => {
    const f = e.target.dataset.f;
    if (f) { st[f] = f === 'q' ? e.target.value.trim().toLowerCase() : e.target.value; st.page = 0; draw(); }
    if (e.target.matches('[data-select]')) { st.select = e.target.checked; if (!st.select) sel.clear(); draw(); }
  });
  view.addEventListener('click', async (e) => {
    const p = e.target.closest('[data-p]');
    if (p) { st.page += Number(p.dataset.p); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const a = e.target.closest('[data-act]');
    if (a) return act(a.dataset.act);
    const t = e.target.closest('.tile');
    if (t && st.select) {
      const id = Number(t.dataset.id);
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      t.classList.toggle('sel', sel.has(id)); bar();
    }
  });

  async function act(kind) {
    const chosen = cards.filter((c) => sel.has(c.id));
    const ids = chosen.filter((c) => c.status === 'OWNED').map((c) => c.id);
    try {
      if (kind === 'all') { filtered().slice(st.page * PER, (st.page + 1) * PER).forEach((c) => sel.add(c.id)); return draw(); }
      if (kind === 'none') { sel.clear(); return draw(); }
      if (kind === 'sell') {
        const list = chosen.filter((c) => c.status === 'OWNED' && !c.locked);
        const gain = list.reduce((x, c) => x + Math.max(1, Math.floor(c.value * ECONOMY.sellToSystemRate)), 0);
        const rare = list.filter((c) => c.r >= 3 || c.mp || c.g != null).length;
        if (!(await confirmBox(`Vendre ${list.length} carte(s) au système pour <b>${cr(gain)}</b> (${ECONOMY.sellToSystemRate * 100} % de leur valeur) ?${rare ? `<br><span class="neg">Attention : ${rare} carte(s) rare(s) incluse(s).</span>` : ''} Cette action est définitive.`, 'Vendre'))) return;
        const r = await post('/cards/sell', { ids: list.map((c) => c.id) });
        sound.play('coin'); toast(`+${cr(r.total)}`, 'good'); store.refresh(); return ctx.rerender();
      }
      if (kind === 'lock') {
        const to = !chosen.every((c) => c.locked);
        for (const c of chosen) { await post(`/cards/${c.id}/lock`, { locked: to }); c.locked = to; }
        toast(to ? 'Ajoutées aux favoris (protégées de la vente groupée)' : 'Retirées des favoris'); return draw();
      }
      if (kind === 'showcase') { await post('/showcase', { ids: chosen.map((c) => c.id) }); toast('Vitrine mise à jour', 'good'); return; }
      if (kind === 'grade') return gradeModal(chosen.filter((c) => c.status === 'OWNED'));
      if (kind === 'tradeup') {
        if (!(await confirmBox(`Échanger ces ${TRADE_UP.inputCount} cartes ${RARITIES[chosen[0].r].fr} contre 1 carte <b>${RARITIES[chosen[0].r + 1].fr}</b> (coût ${TRADE_UP.cost} ¢) ? Le float obtenu dépend de la moyenne des floats.`, 'Signer le contrat'))) return;
        const c = await post('/trade-up', { ids });
        sound.play('rare', c.r);
        const m = modal(`<h2 style="text-align:center">Contrat rempli !</h2><div style="max-width:280px;margin:0 auto">${cardOf(c)}</div><div class="row end" style="margin-top:14px"><a class="btn primary" href="#/card/${c.id}">Voir la carte</a></div>`);
        m.el.addEventListener('click', (ev) => { if (ev.target.closest('a')) m.close(); });
        return ctx.rerender();
      }
    } catch (err) { toast(esc(err.message), 'error'); }
  }
  draw();
}

// ───────── Modale d'envoi en gradation
export function gradeModal(chosen) {
  const ids = chosen.map((c) => c.id);
  let service = 'standard';
  const m = modal(`<h2>Envoyer en gradation</h2><p class="muted">${ids.length} carte(s). Les cartes sont indisponibles pendant la gradation. La note peut faire <b>monter ou baisser</b> la valeur.</p>
    <div class="grid" style="gap:10px">${Object.entries(GRADING.services).map(([k, s]) => `<label class="check" style="justify-content:space-between"><span><input type="radio" name="svc" value="${k}" ${k === service ? 'checked' : ''}> ${s.fr}</span><span class="muted">${s.delayMs >= 3600e3 ? `${s.delayMs / 3600e3} h` : `${s.delayMs / 60e3} min`} · ${s.baseFee} ¢/carte</span></label>`).join('')}</div>
    <p style="margin-top:14px">Total : <b data-fee>…</b></p>
    <div class="row end"><button class="btn primary" data-go>Envoyer</button></div>`);
  const quote = async () => { try { const q = await post('/grading/quote', { ids, service }); m.el.querySelector('[data-fee]').innerHTML = cr(q.fee); } catch (e) { m.el.querySelector('[data-fee]').textContent = e.message; } };
  m.el.addEventListener('change', (e) => { if (e.target.name === 'svc') { service = e.target.value; quote(); } });
  m.el.querySelector('[data-go]').onclick = async () => {
    try { await post('/grading', { ids, service }); toast('Cartes envoyées en gradation', 'good'); m.close(); store.refresh(); location.hash = '#/grading'; } catch (e) { toast(esc(e.message), 'error'); }
  };
  quote();
}

// ───────── Fiche carte
export async function cardPage({ view, params, stale, rerender, cert }) {
  const d = await api(cert ? `/cert/${params[0]}` : `/cards/${params[0]}`);
  if (stale()) return;
  const c = d.card, s = SKIN_BY_ID.get(c.s), R = RARITIES[c.r], model = MODEL_BY_KEY[s.m];
  const me = store.me;
  const mine = me && c.owner_id === me.id;
  const w = wearOf(c.f);
  const burned = c.status === 'BURNED';
  const subs = c.subs ? Object.entries({ centering: 'Centrage', corners: 'Coins', edges: 'Bords', surface: 'Surface' }) : [];

  view.innerHTML = `<div class="detail">
    <div class="art-col">${cardOf(c)}</div>
    <div>
      <div class="row">${rarityPill(c.r)}${c.foil ? '<span class="pill" style="color:#5ff3ff">Holo</span>' : ''}${c.tr != null ? `<span class="pill" style="color:#ff8a3d">Traqueur ${c.tr}</span>` : ''}${c.mp ? '<span class="pill" style="color:#ff2b6a">Carte erreur</span>' : ''}${burned ? '<span class="pill neg">Détruite</span>' : ''}</div>
      <h1 style="margin-top:12px">${esc(model.name)} <span class="muted">|</span> ${esc(s.n)}</h1>
      <div class="row muted small"><span>${esc(c.serial)}</span>${c.cert ? `<span>· Certificat ${esc(c.cert)}</span>` : ''}<span>· Propriétaire : <a href="#/u/${encodeURIComponent(d.owner.username)}"><b>${esc(d.owner.username)}</b></a></span></div>
      <div class="panel" style="margin-top:18px"><div class="row between"><div><div class="muted small">Valeur de référence</div><div style="font-family:var(--display);font-size:34px;font-weight:700">${cr(c.value)}</div></div>
        <div class="muted small" style="text-align:right">Base ${cr(s.base)}<br>${c.parts.map((p) => `<span class="${p.mult >= 1 ? 'pos' : 'neg'}">${esc(p.label)} ×${p.mult}</span>`).join('<br>')}</div></div>
        ${d.listing ? `<div class="row between" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)"><span>En vente pour <b>${cr(d.listing.price)}</b></span>
          ${mine ? `<button class="btn sm danger" data-cancel="${d.listing.id}">Retirer</button>` : me ? `<button class="btn primary" data-buy="${d.listing.id}">Acheter</button>` : '<a class="btn" href="#/login">Connexion pour acheter</a>'}</div>` : ''}
        ${mine && c.status === 'OWNED' ? `<div class="row" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)">
          <button class="btn primary" data-list>Mettre en vente</button>
          ${c.g == null ? '<button class="btn" data-grade>Grader</button>' : '<button class="btn danger" data-unslab>Briser le slab</button>'}
          <button class="btn" data-lock>${c.locked ? '★ Retirer des favoris' : '☆ Favori'}</button>
          <button class="btn ghost" data-sell>Vendre au système · ${cr(Math.max(1, Math.floor(c.value * ECONOMY.sellToSystemRate)))}</button></div>` : ''}
      </div>
      <div class="grid cols-2" style="margin-top:18px">
        <div class="panel"><h3>État</h3><dl class="kv">
          <dt>Float</dt><dd>${fmtFloat(c.f)}</dd><dt>Usure</dt><dd>${esc(w.fr)} (${w.key})</dd>
          <dt>Centrage</dt><dd>${centeringLabel(c.cx, c.cy)} · G/D ${c.cx.toFixed(1)}/${(100 - c.cx).toFixed(1)} · H/B ${c.cy.toFixed(1)}/${(100 - c.cy).toFixed(1)}</dd>
          <dt>Note de centrage estimée</dt><dd>${c.mp ? '—' : centeringScore(c.cx, c.cy)}</dd>
          <dt>Motif</dt><dd>${esc(PATTERNS[s.p])}</dd><dt>Finition</dt><dd>${esc(FINISHES[s.f])}</dd>
          <dt>Exemplaires</dt><dd>${d.copies}</dd><dt>Obtenue</dt><dd>${new Date(c.created_at).toLocaleDateString('fr-FR')}</dd></dl></div>
        <div class="panel"><h3>${c.g != null ? `Gradation · ${c.g} ${esc(gradeLabel(c.g))}` : 'Population gradée'}</h3>
          ${subs.map(([k, label]) => `<div class="subgrade" style="animation-delay:0s;opacity:1"><span>${label}</span><div class="bar"><i style="width:${c.subs[k] * 10}%"></i></div><b>${c.subs[k]}</b></div>`).join('')}
          ${d.population.length ? `<table class="t" style="margin-top:10px"><thead><tr><th>Note</th><th>Population</th></tr></thead><tbody>${d.population.map((p) => `<tr><td>${p.grade} ${esc(gradeLabel(p.grade))}</td><td>${p.n}</td></tr>`).join('')}</tbody></table>` : '<p class="muted small">Aucun exemplaire gradé pour l’instant.</p>'}
        </div>
      </div>
      <div class="panel" style="margin-top:18px"><h3>Historique des prix (${esc(skinTitle(s))})</h3>${priceChart(d.sales)}</div>
      <div class="panel" style="margin-top:18px"><h3>Historique de propriété</h3><table class="t"><tbody>
        ${d.history.map((h) => `<tr><td class="muted small">${ago(h.at)}</td><td>${esc(h.from_name || '—')} → ${esc(h.to_name || 'Système')}</td><td class="muted">${esc(h.reason)}</td><td style="text-align:right">${h.price ? cr(h.price) : ''}</td></tr>`).join('')}
      </tbody></table></div>
    </div></div>`;

  const run = async (fn, okMsg) => { try { await fn(); if (okMsg) toast(okMsg, 'good'); store.refresh(); rerender(); } catch (e) { toast(esc(e.message), 'error'); } };
  view.addEventListener('click', async (e) => {
    const t = e.target;
    if (t.closest('[data-buy]')) run(() => post(`/market/${t.closest('[data-buy]').dataset.buy}/buy`), 'Achat effectué !');
    else if (t.closest('[data-cancel]')) run(() => post(`/market/${t.closest('[data-cancel]').dataset.cancel}/cancel`), 'Annonce retirée');
    else if (t.closest('[data-lock]')) run(() => post(`/cards/${c.id}/lock`, { locked: !c.locked }));
    else if (t.closest('[data-grade]')) gradeModal([c]);
    else if (t.closest('[data-unslab]')) { if (await confirmBox('Briser le slab ? La note et le certificat seront perdus définitivement.', 'Briser')) run(() => post(`/cards/${c.id}/unslab`), 'Slab brisé'); }
    else if (t.closest('[data-sell]')) { if (await confirmBox(`Vendre cette carte au système pour ${cr(Math.max(1, Math.floor(c.value * ECONOMY.sellToSystemRate)))} ?`, 'Vendre')) run(async () => { await post('/cards/sell', { ids: [c.id] }); sound.play('coin'); }, 'Carte vendue'); }
    else if (t.closest('[data-list]')) listModal(c, rerender);
  });
}

export function listModal(c, done) {
  const min = Math.max(1, Math.floor(c.value * ECONOMY.priceFloorMult)), max = Math.max(10, Math.ceil(c.value * ECONOMY.priceCapMult));
  const m = modal(`<h2>Mettre en vente</h2><p class="muted">Valeur de référence ${cr(c.value)}. Prix autorisé : ${cr(min)} – ${cr(max)}.</p>
    <label class="field">Prix<input class="input" type="number" min="${min}" max="${max}" value="${Math.round(c.value * 1.1)}" data-price></label>
    <div class="row" style="margin:10px 0">${[0.9, 1, 1.1, 1.25, 1.5].map((k) => `<button class="btn sm ghost" data-k="${k}">${Math.round(k * 100)} %</button>`).join('')}</div>
    <p>Vous recevrez <b data-net></b> (frais ${ECONOMY.marketFee * 100} %).</p>
    <div class="row end"><button class="btn primary" data-go>Publier l’annonce</button></div>`);
  const inp = m.el.querySelector('[data-price]');
  const upd = () => { const p = Number(inp.value) || 0; m.el.querySelector('[data-net]').innerHTML = cr(p - Math.ceil(p * ECONOMY.marketFee)); };
  inp.oninput = upd; upd();
  m.el.addEventListener('click', async (e) => {
    const k = e.target.closest('[data-k]'); if (k) { inp.value = Math.round(c.value * Number(k.dataset.k)); upd(); }
    if (e.target.closest('[data-go]')) {
      try { await post('/market/list', { cardId: c.id, price: Number(inp.value) }); toast('Annonce publiée', 'good'); m.close(); done?.(); } catch (err) { toast(esc(err.message), 'error'); }
    }
  });
}

// ───────── Gradation : commandes et révélation
export async function gradingPage({ view, stale, every, rerender }) {
  const orders = await api('/grading');
  if (stale()) return;
  const pending = orders.filter((o) => o.status === 'PENDING'), done = orders.filter((o) => o.status === 'DONE');
  view.innerHTML = `<h1>Gradation</h1><p class="muted">Sélectionnez des cartes dans votre <a href="#/inventory" class="grad-text">inventaire</a> pour les envoyer. Notes : ${GRADING.labels.map(([g, l]) => `${g}+ ${l}`).join(' · ')}.</p>
    <div class="section-title"><h2>En cours</h2></div>
    <div class="grid" style="gap:14px">${pending.length ? pending.map((o) => `<div class="panel"><div class="row between"><div><b>Commande #${o.id}</b> · ${esc(GRADING.services[o.service].fr)} · ${o.cards.length} carte(s)</div>
      ${o.ready_at <= Date.now() ? `<button class="btn primary" data-reveal="${o.id}">Révéler les notes</button>` : `<span class="pill" data-ready="${o.ready_at}">Prêt dans ${dur(o.ready_at - Date.now())}</span>`}</div>
      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr));margin-top:12px">${o.cards.map((c, i) => tile(c, { i, href: `#/card/${c.id}`, lite: true })).join('')}</div></div>`).join('') : '<div class="empty">Aucune commande en cours</div>'}</div>
    <div class="section-title"><h2>Terminées</h2></div>
    <div class="cards">${done.flatMap((o) => o.cards).map((c, i) => tile(c, { i, href: `#/card/${c.id}`, lite: true })).join('') || '<div class="empty">Rien pour l’instant</div>'}</div>`;
  every(() => {
    for (const el of view.querySelectorAll('[data-ready]')) {
      const t = Number(el.dataset.ready);
      if (t <= Date.now()) { rerender(); return; }
      el.textContent = `Prêt dans ${dur(t - Date.now())}`;
    }
  }, 1000);
  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-reveal]'); if (!b) return;
    b.disabled = true;
    try { revealModal(await post(`/grading/${b.dataset.reveal}/reveal`), rerender); store.refresh(); } catch (err) { toast(esc(err.message), 'error'); b.disabled = false; }
  });
}

function revealModal(results, done) {
  let i = 0;
  const m = modal('<div data-body></div>', { wide: true, onClose: done });
  const show = () => {
    const c = results[i];
    const labels = { centering: 'Centrage', corners: 'Coins', edges: 'Bords', surface: 'Surface' };
    const delta = c.value - c.before;
    m.el.querySelector('[data-body]').innerHTML = `<div class="grade-reveal">
      <div>${cardOf(c)}</div>
      <div><h2>${esc(skinTitle(SKIN_BY_ID.get(c.s)))}</h2><div class="muted small">${esc(c.cert)}</div>
        <div class="grid" style="gap:10px;margin:18px 0">${Object.entries(labels).map(([k, l], j) => `<div class="subgrade" style="animation-delay:${0.3 + j * 0.45}s"><span>${l}</span><div class="bar"><i style="width:${c.subs[k] * 10}%"></i></div><b>${c.subs[k]}</b></div>`).join('')}</div>
        <div class="row" style="align-items:flex-end"><div class="final-grade ${c.g >= 9.5 ? 'grad-text' : ''}" style="animation-delay:2.2s">${c.g}</div><div class="subgrade" style="animation-delay:2.4s;display:block"><b>${esc(gradeLabel(c.g))}</b><br>
          <span class="${delta >= 0 ? 'pos' : 'neg'}">${cr(c.before)} → ${cr(c.value)} (${delta >= 0 ? '+' : ''}${delta.toLocaleString('fr-FR')})</span></div></div>
        <div class="row end" style="margin-top:20px">${i < results.length - 1 ? `<button class="btn primary" data-next>Carte suivante (${i + 2}/${results.length})</button>` : '<button class="btn primary" data-end>Terminer</button>'}</div>
      </div></div>`;
    setTimeout(() => sound.play(c.g >= 9 ? 'rare' : 'flip', c.g >= 10 ? 6 : c.g >= 9 ? 4 : 1), 2200);
  };
  m.el.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) { i++; show(); }
    if (e.target.closest('[data-end]')) m.close();
  });
  show();
}

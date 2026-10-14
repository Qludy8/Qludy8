// Inventaire (sélection multiple, vente, contrat, gradation), fiche carte, suivi de gradation.
import { RARITIES, WEAR, ECONOMY, GRADING, TRADE_UP, CENTERING } from '/shared/config.js';
import { SKIN_BY_ID, MODEL_BY_KEY, FINISHES, COLLECTION_BY_KEY, STYLES } from '/shared/catalog.js';
import { describeSeed } from '/shared/patterns.js';
import { styleLabel } from '../art/card.js';
import { inspector } from '../inspect.js';
import { wearOf, fmtFloat, centeringScore, centeringLabel, gradeLabel } from '/shared/rules.js';
import { api, post, store } from '../api.js';
import { cardOf } from '../opening.js';
import { tile, skinTitle, rarityPill, priceChart } from '../common.js';
import { esc, cr, ago, dur, toast, modal, confirmBox, avatar, $ } from '../ui.js';
import { sound } from '../fx.js';
import { t, tr, L, fmt, locale } from '/shared/i18n.js';

// libellés des multiplicateurs de valeur (calculés en français par le serveur)
const SUBS = { centering: 'Centrage', corners: 'Coins', edges: 'Bords', surface: 'Surface' };
function partLabel(l) {
  let m;
  if ((m = /^Usure (\w+)$/.exec(l))) return t('Usure {w}', { w: m[1] });
  if ((m = /^Grade (.+)$/.exec(l))) return t('Grade {g}', { g: m[1] });
  if ((m = /^Population (\d+)$/.exec(l))) return t('Population {n}', { n: m[1] });
  if ((m = /^Centrage (.+)$/.exec(l))) return t('Centrage {c}', { c: m[1] });
  return tr(l);
}

const PER = 60;

export async function inventoryPage(ctx) {
  const { view, stale } = ctx;
  const cards = await api('/inventory');
  if (stale()) return;
  const me = store.me;
  const sel = new Set();
  const st = { q: '', r: '', w: '', flag: '', sort: 'new', page: 0, select: false };
  const total = cards.reduce((a, c) => a + c.value, 0);

  view.innerHTML = `<div class="section-title" style="margin-top:0"><div><h1>${t('Inventaire')}</h1>
      <p class="muted">${t('{n} carte(s) · valeur estimée {value}', { n: fmt(cards.length), value: cr(total) })}</p></div>
      <div class="row"><label class="check"><input type="checkbox" data-select> ${t('Sélection multiple')}</label><a class="btn" href="#/grading">${t('Gradation')}</a></div></div>
    <div class="filters">
      <input class="input" placeholder="${t('Rechercher…')}" data-f="q">
      <select class="input" data-f="r"><option value="">${t('Toutes raretés')}</option>${RARITIES.map((r, i) => `<option value="${i}">${esc(L(r))}</option>`).join('')}</select>
      <select class="input" data-f="w"><option value="">${t('Toutes usures')}</option>${WEAR.tiers.map((w) => `<option value="${w.key}">${esc(L(w))}</option>`).join('')}</select>
      <select class="input" data-f="flag"><option value="">${t('Tout')}</option><option value="foil">${t('Holo')}</option><option value="graded">${t('Gradées')}</option><option value="mp">${t('Cartes erreur')}</option><option value="tr">${t('Traqueur')}</option><option value="listed">${t('En vente')}</option><option value="locked">${t('Favoris')}</option></select>
      <select class="input" data-f="sort"><option value="new">${t('Plus récentes')}</option><option value="value">${t('Valeur ↓')}</option><option value="rarity">${t('Rareté ↓')}</option><option value="float">${t('Float ↑')}</option></select>
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
      || `<div class="empty"><b>${cards.length ? t('Aucune carte ne correspond') : t('Votre inventaire est vide')}</b>${cards.length ? '' : `<a class="btn primary" href="#/packs" style="margin-top:12px">${t('Ouvrir un booster')}</a>`}</div>`;
    $('[data-pager]', view).innerHTML = pages > 1 ? `<button class="btn sm" data-p="-1" ${st.page ? '' : 'disabled'}>←</button><span class="muted small">${t('Page {n} / {total}', { n: st.page + 1, total: pages })}</span><button class="btn sm" data-p="1" ${st.page < pages - 1 ? '' : 'disabled'}>→</button>` : '';
    bar();
  };
  const bar = () => {
    const chosen = cards.filter((c) => sel.has(c.id));
    const owned = chosen.filter((c) => c.status === 'OWNED');
    const sellable = owned.filter((c) => !c.locked);
    const gain = sellable.reduce((a, c) => a + Math.max(1, Math.floor(c.value * ECONOMY.sellToSystemRate)), 0);
    const sameR = owned.length === TRADE_UP.inputCount && owned.every((c) => c.r === owned[0].r && c.g == null) && owned[0].r <= TRADE_UP.maxInputRarity;
    $('[data-bar]', view).innerHTML = chosen.length ? `<div class="selection-bar">
      <div>${t('<b>{n}</b> sélectionnée(s) · {value}', { n: chosen.length, value: cr(chosen.reduce((a, c) => a + c.value, 0)) })}</div>
      <div class="row">
        <button class="btn sm ghost" data-act="all">${t('Tout sélectionner (page)')}</button>
        <button class="btn sm ghost" data-act="none">${t('Vider')}</button>
        <button class="btn sm" data-act="lock">${t('★ Favori')}</button>
        <button class="btn sm" data-act="showcase" ${chosen.length <= 6 ? '' : 'disabled'}>${t('Vitrine')}</button>
        <button class="btn sm" data-act="grade" ${owned.length && owned.length <= GRADING.maxPerOrder && owned.every((c) => c.g == null) ? '' : 'disabled'}>${t('Grader')}</button>
        <button class="btn sm" data-act="tradeup" ${sameR ? '' : 'disabled'} title="${t('{n} cartes de même rareté', { n: TRADE_UP.inputCount })}">${t('Contrat {n}/{total}', { n: owned.length, total: TRADE_UP.inputCount })}</button>
        <button class="btn sm primary" data-act="sell" ${sellable.length ? '' : 'disabled'}>${t('Vendre {n} · +{gain}', { n: sellable.length, gain: cr(gain) })}</button>
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
    const tl = e.target.closest('.tile');
    if (tl && st.select) {
      const id = Number(tl.dataset.id);
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      tl.classList.toggle('sel', sel.has(id)); bar();
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
        if (!(await confirmBox(`${t('Vendre {n} carte(s) au système pour <b>{gain}</b> ({pct} % de leur valeur) ?', { n: list.length, gain: cr(gain), pct: ECONOMY.sellToSystemRate * 100 })}${rare ? `<br><span class="neg">${t('Attention : {n} carte(s) rare(s) incluse(s).', { n: rare })}</span>` : ''} ${t('Cette action est définitive.')}`, t('Vendre')))) return;
        const r = await post('/cards/sell', { ids: list.map((c) => c.id) });
        sound.play('coin'); toast(`+${cr(r.total)}`, 'good'); store.refresh(); return ctx.rerender();
      }
      if (kind === 'lock') {
        const to = !chosen.every((c) => c.locked);
        for (const c of chosen) { await post(`/cards/${c.id}/lock`, { locked: to }); c.locked = to; }
        toast(to ? t('Ajoutées aux favoris (protégées de la vente groupée)') : t('Retirées des favoris')); return draw();
      }
      if (kind === 'showcase') { await post('/showcase', { ids: chosen.map((c) => c.id) }); toast(t('Vitrine mise à jour'), 'good'); return; }
      if (kind === 'grade') return gradeModal(chosen.filter((c) => c.status === 'OWNED'));
      if (kind === 'tradeup') {
        if (!(await confirmBox(t('Échanger ces {n} cartes {from} contre 1 carte <b>{to}</b> (coût {cost} <i class="mu" aria-label="Mu">무</i>) ? Le float obtenu dépend de la moyenne des floats.', { n: TRADE_UP.inputCount, from: esc(L(RARITIES[chosen[0].r])), to: esc(L(RARITIES[chosen[0].r + 1])), cost: TRADE_UP.cost }), t('Signer le contrat')))) return;
        const c = await post('/trade-up', { ids });
        sound.play('rare', c.r);
        const m = modal(`<h2 style="text-align:center">${t('Contrat rempli !')}</h2><div style="max-width:280px;margin:0 auto">${cardOf(c)}</div><div class="row end" style="margin-top:14px"><a class="btn primary" href="#/card/${c.id}">${t('Voir la carte')}</a></div>`);
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
  const m = modal(`<h2>${t('Envoyer en gradation')}</h2><p class="muted">${t('{n} carte(s). Les cartes sont indisponibles pendant la gradation. La note peut faire <b>monter ou baisser</b> la valeur.', { n: ids.length })}</p>
    <div class="grid" style="gap:10px">${Object.entries(GRADING.services).map(([k, s]) => `<label class="check" style="justify-content:space-between"><span><input type="radio" name="svc" value="${k}" ${k === service ? 'checked' : ''}> ${esc(L(s))}</span><span class="muted">${s.delayMs >= 3600e3 ? `${s.delayMs / 3600e3} h` : `${s.delayMs / 60e3} min`} · ${t('{fee} <i class="mu" aria-label="Mu">무</i>/carte', { fee: s.baseFee })}</span></label>`).join('')}</div>
    <p style="margin-top:14px">${t('Total :')} <b data-fee>…</b></p>
    <div class="row end"><button class="btn primary" data-go>${t('Envoyer')}</button></div>`);
  const quote = async () => { try { const q = await post('/grading/quote', { ids, service }); m.el.querySelector('[data-fee]').innerHTML = cr(q.fee); } catch (e) { m.el.querySelector('[data-fee]').textContent = e.message; } };
  m.el.addEventListener('change', (e) => { if (e.target.name === 'svc') { service = e.target.value; quote(); } });
  m.el.querySelector('[data-go]').onclick = async () => {
    try { await post('/grading', { ids, service }); toast(t('Cartes envoyées en gradation'), 'good'); m.close(); store.refresh(); location.hash = '#/grading'; } catch (e) { toast(esc(e.message), 'error'); }
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
  const subs = c.subs ? Object.entries(SUBS) : [];

  view.innerHTML = `<div class="detail">
    <div class="art-col">${cardOf(c)}</div>
    <div>
      <div class="row">${rarityPill(c.r)}${c.foil ? `<span class="pill" style="color:#5ff3ff">${t('Holo')}</span>` : ''}${c.tr != null ? `<span class="pill" style="color:#ff8a3d">${t('Traqueur {n}', { n: c.tr })}</span>` : ''}${c.mp ? `<span class="pill" style="color:#ff2b6a">${t('Carte erreur')}</span>` : ''}${burned ? `<span class="pill neg">${t('Détruite')}</span>` : ''}</div>
      <h1 style="margin-top:12px">${esc(model.name)} <span class="muted">|</span> ${esc(L(s, 'n'))}</h1>
      <div class="row muted small"><span>${esc(c.serial)}</span>${c.cert ? `<span>· ${t('Certificat {cert}', { cert: esc(c.cert) })}</span>` : ''}<span>· ${t('Propriétaire :')} <a href="#/u/${encodeURIComponent(d.owner.username)}"><b>${esc(d.owner.username)}</b></a></span></div>
      <div class="panel" style="margin-top:18px"><div class="row between"><div><div class="muted small">${t('Valeur de référence')}</div><div style="font-family:var(--display);font-size:34px;font-weight:700">${cr(c.value)}</div></div>
        <div class="muted small" style="text-align:right">${t('Base')} ${cr(s.base)}<br>${c.parts.map((p) => `<span class="${p.mult >= 1 ? 'pos' : 'neg'}">${esc(partLabel(p.label))} ×${p.mult}</span>`).join('<br>')}</div></div>
        ${d.listing ? `<div class="row between" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)"><span>${t('En vente pour <b>{price}</b>', { price: cr(d.listing.price) })}</span>
          ${mine ? `<button class="btn sm danger" data-cancel="${d.listing.id}">${t('Retirer')}</button>` : me ? `<button class="btn primary" data-buy="${d.listing.id}">${t('Acheter')}</button>` : `<a class="btn" href="#/login">${t('Connexion pour acheter')}</a>`}</div>` : ''}
        ${mine && c.status === 'OWNED' ? `<div class="row" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)">
          <button class="btn primary" data-list>${t('Mettre en vente')}</button>
          ${c.g == null ? `<button class="btn" data-grade>${t('Grader')}</button>` : `<button class="btn danger" data-unslab>${t('Briser le slab')}</button>`}
          <button class="btn" data-lock>${c.locked ? t('★ Retirer des favoris') : t('☆ Favori')}</button>
          <button class="btn ghost" data-sell>${t('Vendre au système ·')} ${cr(Math.max(1, Math.floor(c.value * ECONOMY.sellToSystemRate)))}</button></div>` : ''}
      </div>
      <div class="grid cols-2" style="margin-top:18px">
        <div class="panel"><h3>${t('État')}</h3><dl class="kv">
          <dt>${t('Float')}</dt><dd>${fmtFloat(c.f)}</dd><dt>${t('Usure')}</dt><dd>${esc(L(w))} (${w.key})</dd>
          <dt>${t('Centrage')}</dt><dd>${centeringLabel(c.cx, c.cy)} · ${t('G/D')} ${c.cx.toFixed(1)}/${(100 - c.cx).toFixed(1)} · ${t('H/B')} ${c.cy.toFixed(1)}/${(100 - c.cy).toFixed(1)}</dd>
          <dt>${t('Note de centrage estimée')}</dt><dd>${c.mp ? '—' : centeringScore(c.cx, c.cy)}</dd>
          <dt>${t('Collection')}</dt><dd style="color:${COLLECTION_BY_KEY[s.col].theme[0]}">${esc(L(COLLECTION_BY_KEY[s.col]))}</dd><dt>${t('Style')}</dt><dd>${esc(styleLabel(s))}</dd>${STYLES[s.st].patternBased ? `<dt>${t('Graine')}</dt><dd>${c.pt ?? '—'}${describeSeed(s, c.pt) ? ` · <span style="color:${describeSeed(s, c.pt).tier ? '#ffd76a' : 'inherit'}">${esc(describeSeed(s, c.pt).label)}</span>` : ''}</dd>` : ''}<dt>${t('Finition')}</dt><dd>${esc(t(FINISHES[s.f]))}</dd>
          <dt>${t('Exemplaires')}</dt><dd>${fmt(d.copies)}</dd><dt>${t('Obtenue')}</dt><dd>${new Date(c.created_at).toLocaleDateString(locale())}</dd></dl></div>
        <div class="panel"><h3>${c.g != null ? `${t('Gradation')} · ${c.g} ${esc(gradeLabel(c.g))}` : t('Population gradée')}</h3>
          ${subs.map(([k, label]) => `<div class="subgrade" style="animation-delay:0s;opacity:1"><span>${t(label)}</span><div class="bar"><i style="width:${c.subs[k] * 10}%"></i></div><b>${c.subs[k]}</b></div>`).join('')}
          ${d.population.length ? `<table class="t" style="margin-top:10px"><thead><tr><th>${t('Note')}</th><th>${t('Population')}</th></tr></thead><tbody>${d.population.map((p) => `<tr><td>${p.grade} ${esc(gradeLabel(p.grade))}</td><td>${p.n}</td></tr>`).join('')}</tbody></table>` : `<p class="muted small">${t('Aucun exemplaire gradé pour l’instant.')}</p>`}
        </div>
      </div>
      <div class="panel" style="margin-top:18px" data-insp></div>
      <div class="panel" style="margin-top:18px"><h3>${t('Historique des prix ({name})', { name: esc(skinTitle(s)) })}</h3>${priceChart(d.sales)}</div>
      <div class="panel" style="margin-top:18px"><h3>${t('Historique de propriété')}</h3><table class="t"><tbody>
        ${d.history.map((h) => `<tr><td class="muted small">${ago(h.at)}</td><td>${esc(h.from_name || '—')} → ${esc(h.to_name || t('Système'))}</td><td class="muted">${esc(tr(h.reason))}</td><td style="text-align:right">${h.price ? cr(h.price) : ''}</td></tr>`).join('')}
      </tbody></table></div>
    </div></div>`;

  const ins = inspector(s, { f: c.f, pt: c.pt, title: t('Inspection'), lockedNote: t('les curseurs ne modifient que l’aperçu') });
  view.querySelector('[data-insp]').innerHTML = ins.html; ins.bind(view.querySelector('[data-insp]'));
  const run = async (fn, okMsg) => { try { await fn(); if (okMsg) toast(okMsg, 'good'); store.refresh(); rerender(); } catch (e) { toast(esc(e.message), 'error'); } };
  view.addEventListener('click', async (e) => {
    const el = e.target;
    if (el.closest('[data-buy]')) run(() => post(`/market/${el.closest('[data-buy]').dataset.buy}/buy`), t('Achat effectué !'));
    else if (el.closest('[data-cancel]')) run(() => post(`/market/${el.closest('[data-cancel]').dataset.cancel}/cancel`), t('Annonce retirée'));
    else if (el.closest('[data-lock]')) run(() => post(`/cards/${c.id}/lock`, { locked: !c.locked }));
    else if (el.closest('[data-grade]')) gradeModal([c]);
    else if (el.closest('[data-unslab]')) { if (await confirmBox(t('Briser le slab ? La note et le certificat seront perdus définitivement.'), t('Briser'))) run(() => post(`/cards/${c.id}/unslab`), t('Slab brisé')); }
    else if (el.closest('[data-sell]')) { if (await confirmBox(t('Vendre cette carte au système pour {price} ?', { price: cr(Math.max(1, Math.floor(c.value * ECONOMY.sellToSystemRate))) }), t('Vendre'))) run(async () => { await post('/cards/sell', { ids: [c.id] }); sound.play('coin'); }, t('Carte vendue')); }
    else if (el.closest('[data-list]')) listModal(c, rerender);
  });
}

export function listModal(c, done) {
  const min = Math.max(1, Math.floor(c.value * ECONOMY.priceFloorMult)), max = Math.max(10, Math.ceil(c.value * ECONOMY.priceCapMult));
  const m = modal(`<h2>${t('Mettre en vente')}</h2><p class="muted">${t('Valeur de référence {value}. Prix autorisé : {min} – {max}.', { value: cr(c.value), min: cr(min), max: cr(max) })}</p>
    <label class="field">${t('Prix')}<input class="input" type="number" min="${min}" max="${max}" value="${Math.round(c.value * 1.1)}" data-price></label>
    <div class="row" style="margin:10px 0">${[0.9, 1, 1.1, 1.25, 1.5].map((k) => `<button class="btn sm ghost" data-k="${k}">${Math.round(k * 100)} %</button>`).join('')}</div>
    <p>${t('Vous recevrez <b data-net></b> (frais {pct} %).', { pct: ECONOMY.marketFee * 100 })}</p>
    <div class="row end"><button class="btn primary" data-go>${t('Publier l’annonce')}</button></div>`);
  const inp = m.el.querySelector('[data-price]');
  const upd = () => { const p = Number(inp.value) || 0; m.el.querySelector('[data-net]').innerHTML = cr(p - Math.ceil(p * ECONOMY.marketFee)); };
  inp.oninput = upd; upd();
  m.el.addEventListener('click', async (e) => {
    const k = e.target.closest('[data-k]'); if (k) { inp.value = Math.round(c.value * Number(k.dataset.k)); upd(); }
    if (e.target.closest('[data-go]')) {
      try { await post('/market/list', { cardId: c.id, price: Number(inp.value) }); toast(t('Annonce publiée'), 'good'); m.close(); done?.(); } catch (err) { toast(esc(err.message), 'error'); }
    }
  });
}

// ───────── Gradation : commandes et révélation
export async function gradingPage({ view, stale, every, rerender }) {
  const orders = await api('/grading');
  if (stale()) return;
  const pending = orders.filter((o) => o.status === 'PENDING'), done = orders.filter((o) => o.status === 'DONE');
  view.innerHTML = `<h1>${t('Gradation')}</h1><p class="muted">${t('Sélectionnez des cartes dans votre <a href="#/inventory" class="grad-text">inventaire</a> pour les envoyer.')} ${t('Notes :')} ${GRADING.labels.map(([g]) => `${g}+ ${esc(gradeLabel(g))}`).join(' · ')}.</p>
    <div class="section-title"><h2>${t('En cours')}</h2></div>
    <div class="grid" style="gap:14px">${pending.length ? pending.map((o) => `<div class="panel"><div class="row between"><div><b>${t('Commande #{id}', { id: o.id })}</b> · ${esc(L(GRADING.services[o.service]))} · ${t('{n} carte(s)', { n: o.cards.length })}</div>
      ${o.ready_at <= Date.now() ? `<button class="btn primary" data-reveal="${o.id}">${t('Révéler les notes')}</button>` : `<span class="pill" data-ready="${o.ready_at}">${t('Prêt dans {time}', { time: dur(o.ready_at - Date.now()) })}</span>`}</div>
      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr));margin-top:12px">${o.cards.map((c, i) => tile(c, { i, href: `#/card/${c.id}`, lite: true })).join('')}</div></div>`).join('') : `<div class="empty">${t('Aucune commande en cours')}</div>`}</div>
    <div class="section-title"><h2>${t('Terminées')}</h2></div>
    <div class="cards">${done.flatMap((o) => o.cards).map((c, i) => tile(c, { i, href: `#/card/${c.id}`, lite: true })).join('') || `<div class="empty">${t('Rien pour l’instant')}</div>`}</div>`;
  every(() => {
    for (const el of view.querySelectorAll('[data-ready]')) {
      const at = Number(el.dataset.ready);
      if (at <= Date.now()) { rerender(); return; }
      el.textContent = t('Prêt dans {time}', { time: dur(at - Date.now()) });
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
    const delta = c.value - c.before;
    m.el.querySelector('[data-body]').innerHTML = `<div class="grade-reveal">
      <div>${cardOf(c)}</div>
      <div><h2>${esc(skinTitle(SKIN_BY_ID.get(c.s)))}</h2><div class="muted small">${esc(c.cert)}</div>
        <div class="grid" style="gap:10px;margin:18px 0">${Object.entries(SUBS).map(([k, l], j) => `<div class="subgrade" style="animation-delay:${0.3 + j * 0.45}s"><span>${t(l)}</span><div class="bar"><i style="width:${c.subs[k] * 10}%"></i></div><b>${c.subs[k]}</b></div>`).join('')}</div>
        <div class="row" style="align-items:flex-end"><div class="final-grade ${c.g >= 9.5 ? 'grad-text' : ''}" style="animation-delay:2.2s">${c.g}</div><div class="subgrade" style="animation-delay:2.4s;display:block"><b>${esc(gradeLabel(c.g))}</b><br>
          <span class="${delta >= 0 ? 'pos' : 'neg'}">${cr(c.before)} → ${cr(c.value)} (${delta >= 0 ? '+' : ''}${fmt(delta)})</span></div></div>
        <div class="row end" style="margin-top:20px">${i < results.length - 1 ? `<button class="btn primary" data-next>${t('Carte suivante ({n}/{total})', { n: i + 2, total: results.length })}</button>` : `<button class="btn primary" data-end>${t('Terminer')}</button>`}</div>
      </div></div>`;
    setTimeout(() => sound.play(c.g >= 9 ? 'rare' : 'flip', c.g >= 10 ? 6 : c.g >= 9 ? 4 : 1), 2200);
  };
  m.el.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) { i++; show(); }
    if (e.target.closest('[data-end]')) m.close();
  });
  show();
}

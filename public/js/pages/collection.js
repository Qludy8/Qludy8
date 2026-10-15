// Collection : toutes les cartes possibles du jeu, avec progression du joueur.
import { RARITIES, MODIFIERS, COLLECTIONS } from '/shared/config.js';
import { STYLES } from '/shared/catalog.js';
import { SKINS, SKIN_BY_ID, MODELS, MODEL_BY_KEY, FINISHES, COLLECTION_BY_KEY } from '/shared/catalog.js';
import { styleLabel } from '../art/card.js';
import { inspector } from '../inspect.js';
import { api, post, store } from '../api.js';
import { cardHTML } from '../art/card.js';
import { tile, skinTitle, rarityPill, priceChart } from '../common.js';
import { esc, cr, modal, toast, $ } from '../ui.js';
import { t, L, fmt } from '/shared/i18n.js';

const PER = 48;

export async function collectionPage({ view, query, stale }) {
  const me = store.me;
  const col = me ? await api('/collection') : { owned: {}, discovered: [] };
  if (stale()) return;
  const owned = col.owned;
  const state = { model: query.get('m') || '', r: '', q: '', own: '', col: query.get('col') || '', st: '', sort: 'rarity', page: 0 };

  const countFor = (filter) => { const list = SKINS.filter(filter); return [list.filter((s) => owned[s.id]).length, list.length]; };
  const [oAll, tAll] = countFor(() => true);

  view.innerHTML = `<div class="section-title" style="margin-top:0"><div><h1>${t('Collection')}</h1>
      <p class="muted">${t('{n} cartes existent.', { n: fmt(SKINS.length) })} ${me ? t('Vous en possédez <b>{n}</b> ({pct} %).', { n: oAll, pct: fmt((oAll / tAll) * 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }) : t('<a href="#/register" class="grad-text">Créez un compte</a> pour suivre votre progression.')}</p></div></div>
    <details class="progress-fold" ${state.model ? 'open' : ''}><summary><span>${t('Progression par arme')}</span><b class="mono">${oAll}/${tAll}</b><div class="bar"><i style="width:${(oAll / tAll) * 100}%"></i></div></summary>
    <div class="collection-progress">
      <div class="model-chip ${state.model === '' ? 'on' : ''}" data-model=""><b>${t('Tous les modèles')}</b><div class="muted small">${oAll}/${tAll}</div><div class="bar" style="margin-top:8px"><i style="width:${(oAll / tAll) * 100}%"></i></div></div>
      ${MODELS.map((m) => { const [o, tot] = countFor((s) => s.m === m.key); return `<div class="model-chip ${state.model === m.key ? 'on' : ''}" data-model="${m.key}"><b>${esc(m.name)}</b><div class="muted small">${esc(L(m, 'clsFr'))} · ${o}/${tot}</div><div class="bar" style="margin-top:8px"><i style="width:${(o / tot) * 100}%"></i></div></div>`; }).join('')}
    </div></details>
    <div class="filters">
      <input class="input" placeholder="${t('Rechercher un skin…')}" data-f="q">
      <select class="input" data-f="r"><option value="">${t('Toutes raretés')}</option>${RARITIES.map((r, i) => `<option value="${i}">${esc(L(r))}</option>`).join('')}</select>
      <select class="input" data-f="col"><option value="">${t('Toutes collections')}</option>${COLLECTIONS.map((c) => `<option value="${c.key}" ${state.col === c.key ? 'selected' : ''}>${esc(L(c))}</option>`).join('')}</select>
      <select class="input" data-f="st"><option value="">${t('Tous styles')}</option>${Object.entries(STYLES).map(([k, x]) => `<option value="${k}">${esc(L(x))}</option>`).join('')}</select>
      ${me ? `<select class="input" data-f="own"><option value="">${t('Possédées & manquantes')}</option><option value="1">${t('Possédées')}</option><option value="0">${t('Manquantes')}</option></select>` : ''}
      <select class="input" data-f="sort"><option value="rarity">${t('Rareté ↓')}</option><option value="rarity_asc">${t('Rareté ↑')}</option><option value="name">${t('Nom')}</option><option value="value">${t('Valeur ↓')}</option></select>
      <span class="muted small" data-count></span>
    </div>
    <div class="row" style="margin-bottom:16px" data-rar></div>
    <div class="cards" data-grid></div>
    <div class="pager" data-pager></div>`;

  const draw = () => {
    let list = SKINS.filter((s) => (!state.model || s.m === state.model) && (state.r === '' || s.r === Number(state.r)) && (!state.col || s.col === state.col) && (!state.st || s.st === state.st)
      && (!state.q || skinTitle(s).toLowerCase().includes(state.q))
      && (state.own === '' || (state.own === '1' ? !!owned[s.id] : !owned[s.id])));
    const sorters = { rarity: (a, b) => b.r - a.r || b.base - a.base, rarity_asc: (a, b) => a.r - b.r || a.base - b.base, name: (a, b) => L(a, 'n').localeCompare(L(b, 'n')), value: (a, b) => b.base - a.base };
    list = list.sort(sorters[state.sort]);
    const pages = Math.max(1, Math.ceil(list.length / PER));
    state.page = Math.min(state.page, pages - 1);
    const slice = list.slice(state.page * PER, (state.page + 1) * PER);
    $('[data-count]', view).textContent = t('{n} résultat(s)', { n: fmt(list.length) });
    const base = SKINS.filter((s) => !state.model || s.m === state.model);
    $('[data-rar]', view).innerHTML = RARITIES.map((r, i) => {
      const all = base.filter((s) => s.r === i); const o = all.filter((s) => owned[s.id]).length;
      return `<span class="pill r" style="--rc:${r.color}">${esc(L(r))} ${me ? `${o}/` : ''}${all.length}</span>`;
    }).join('');
    $('[data-grid]', view).innerHTML = slice.map((s, i) => {
      const o = owned[s.id];
      return `<div class="tile ${me && !o ? 'ghost' : ''}" data-skin="${s.id}" style="--i:${i}">${cardHTML(s, null, { small: true, lite: true })}
        <div class="name">${esc(skinTitle(s))}</div>
        <div class="meta"><span class="muted">${o ? t('×{n} · meilleur {best}', { n: o.n, best: o.best.toFixed(4) }) : esc(L(RARITIES[s.r]))}</span><b>${cr(s.base)}</b></div></div>`;
    }).join('') || `<div class="empty"><b>${t('Aucun skin')}</b>${t('Essayez d’autres filtres.')}</div>`;
    $('[data-pager]', view).innerHTML = pages > 1 ? `<button class="btn sm" data-p="-1" ${state.page ? '' : 'disabled'}>←</button><span class="muted small">${t('Page {n} / {total}', { n: state.page + 1, total: pages })}</span><button class="btn sm" data-p="1" ${state.page < pages - 1 ? '' : 'disabled'}>→</button>` : '';
  };

  view.addEventListener('input', (e) => {
    const f = e.target.dataset.f; if (!f) return;
    state[f] = f === 'q' ? e.target.value.trim().toLowerCase() : e.target.value; state.page = 0; draw();
  });
  view.addEventListener('click', (e) => {
    const m = e.target.closest('[data-model]');
    if (m) { state.model = m.dataset.model; state.page = 0; view.querySelectorAll('[data-model]').forEach((x) => x.classList.toggle('on', x === m)); draw(); return; }
    const p = e.target.closest('[data-p]');
    if (p) { state.page += Number(p.dataset.p); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const sk = e.target.closest('[data-skin]');
    if (sk) skinModal(sk.dataset.skin);
  });
  draw();
}

export async function skinModal(id) {
  const s = SKIN_BY_ID.get(id);
  const model = MODEL_BY_KEY[s.m];
  const m = modal(`<div class="detail" style="grid-template-columns:minmax(200px,300px) 1fr;gap:24px">
    <div>${cardHTML(s, null)}</div>
    <div><div class="row">${rarityPill(s.r)}<span class="pill">${esc(L(model, 'clsFr'))}</span></div>
      <h2 style="margin-top:10px">${esc(skinTitle(s))}</h2>
      <dl class="kv"><dt>${t('Collection')}</dt><dd style="color:${COLLECTION_BY_KEY[s.col].theme[0]}">${esc(L(COLLECTION_BY_KEY[s.col]))}</dd><dt>${t('Style')}</dt><dd>${esc(styleLabel(s))}</dd><dt>${t('Finition')}</dt><dd>${esc(t(FINISHES[s.f]))}</dd>
        <dt>${t('Plage de float')}</dt><dd>${s.fmin.toFixed(2)} – ${s.fmax.toFixed(2)}</dd><dt>${t('Valeur de base (Neuf)')}</dt><dd>${cr(s.base)}</dd>
        <dt>${t('En circulation')}</dt><dd data-copies>…</dd></dl>
      <div style="margin-top:18px" data-insp></div>
      <h3 style="margin-top:18px">${t('Historique des ventes')}</h3><div data-chart>…</div>
      <h3 style="margin-top:18px">${t('En vente maintenant')}</h3><div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))" data-list>…</div>
    </div></div>`, { wide: true });
  const ins = inspector(s, { title: t('Inspection') });
  m.el.querySelector('[data-insp]').innerHTML = ins.html; ins.bind(m.el.querySelector('[data-insp]'));
  const d = await api(`/skins/${id}/market`);
  m.el.querySelector('[data-copies]').textContent = t('{n} exemplaire(s)', { n: fmt(d.copies) });
  m.el.querySelector('[data-chart]').innerHTML = priceChart(d.sales);
  m.el.querySelector('[data-list]').innerHTML = d.listings.length
    ? d.listings.map((c, i) => tile(c, { i, price: c.listing.price, lite: true, sub: `<span class="muted">${esc(c.listing.seller)}</span><button class="btn sm primary" data-buy="${c.listing.id}">${t('Acheter')}</button>` })).join('')
    : `<div class="empty small">${t('Aucune annonce')}</div>`;
  m.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-buy]'); if (!b) return;
    if (!store.me) { location.hash = '#/login'; m.close(); return; }
    b.disabled = true;
    try { await post(`/market/${b.dataset.buy}/buy`); toast(t('Achat effectué ! La carte est dans votre inventaire.'), 'good'); store.refresh(); b.closest('.tile').remove(); } catch (err) { toast(esc(err.message), 'error'); b.disabled = false; }
  });
}

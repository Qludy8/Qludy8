// Marché entre joueurs : recherche filtrée, achat instantané, gestion de ses annonces.
import { RARITIES } from '/shared/config.js';
import { MODELS } from '/shared/catalog.js';
import { api, post, store } from '../api.js';
import { tile } from '../common.js';
import { esc, toast, confirmBox, cr, $ } from '../ui.js';
import { sound } from '../fx.js';
import { t, L, fmt } from '/shared/i18n.js';

export async function marketPage({ view, query }) {
  const me = store.me;
  const st = { q: '', model: query.get('model') || '', r: '', sort: 'new', fmin: '', fmax: '', pmin: '', pmax: '', foil: '', graded: '', misprint: '', tracker: '', mine: '', page: 0 };
  view.innerHTML = `<div class="section-title" style="margin-top:0"><div><h1>${t('Marché')}</h1><p class="muted">${t('Achetez et vendez entre joueurs. Le vendeur paie 5 % de frais ; le paiement est garanti par le site.')}</p></div>
      ${me ? `<label class="check"><input type="checkbox" data-c="mine"> ${t('Mes annonces')}</label>` : ''}</div>
    <div class="filters">
      <input class="input" placeholder="${t('Rechercher…')}" data-f="q">
      <select class="input" data-f="model"><option value="">${t('Tous les modèles')}</option>${MODELS.map((m) => `<option value="${m.key}" ${st.model === m.key ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
      <select class="input" data-f="r"><option value="">${t('Toutes raretés')}</option>${RARITIES.map((r, i) => `<option value="${i}">${esc(L(r))}</option>`).join('')}</select>
      <select class="input" data-f="sort"><option value="new">${t('Plus récentes')}</option><option value="price_asc">${t('Prix ↑')}</option><option value="price_desc">${t('Prix ↓')}</option><option value="float">${t('Float ↑')}</option><option value="rarity">${t('Rareté ↓')}</option></select>
      <input class="input" style="min-width:0;width:100px" placeholder="${t('Float min')}" data-f="fmin" inputmode="decimal">
      <input class="input" style="min-width:0;width:100px" placeholder="${t('Float max')}" data-f="fmax" inputmode="decimal">
      <input class="input" style="min-width:0;width:100px" placeholder="${t('Prix min')}" data-f="pmin" inputmode="numeric">
      <input class="input" style="min-width:0;width:100px" placeholder="${t('Prix max')}" data-f="pmax" inputmode="numeric">
      <label class="check"><input type="checkbox" data-c="foil"> ${t('Holo')}</label>
      <label class="check"><input type="checkbox" data-c="graded"> ${t('Gradées')}</label>
      <label class="check"><input type="checkbox" data-c="tracker"> ${t('Traqueur')}</label>
      <label class="check"><input type="checkbox" data-c="misprint"> ${t('Erreurs')}</label>
    </div>
    <div class="muted small" data-count style="margin-bottom:12px"></div>
    <div class="cards" data-grid></div><div class="pager" data-pager></div>`;

  let req = 0;
  const load = async () => {
    const my = ++req;
    const qs = new URLSearchParams(Object.entries(st).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, String(v)]));
    const d = await api(`/market?${qs}`);
    if (my !== req) return;
    $('[data-count]', view).textContent = t('{n} annonce(s)', { n: fmt(d.total) });
    $('[data-grid]', view).innerHTML = d.items.map((c, i) => {
      const own = me && c.listing.sellerId === me.id;
      return tile(c, { i, price: c.listing.price, href: `#/card/${c.id}`, lite: true,
        sub: `<span class="muted small">${esc(c.listing.seller)}</span>${own ? `<button class="btn sm danger" data-cancel="${c.listing.id}">${t('Retirer')}</button>` : `<button class="btn sm primary" data-buy="${c.listing.id}" data-price="${c.listing.price}">${t('Acheter')}</button>`}` });
    }).join('') || `<div class="empty"><b>${t('Aucune annonce')}</b>${t('Modifiez les filtres.')}</div>`;
    const pages = Math.ceil(d.total / d.per);
    $('[data-pager]', view).innerHTML = pages > 1 ? `<button class="btn sm" data-p="-1" ${st.page ? '' : 'disabled'}>←</button><span class="muted small">${t('Page {n} / {total}', { n: st.page + 1, total: pages })}</span><button class="btn sm" data-p="1" ${st.page < pages - 1 ? '' : 'disabled'}>→</button>` : '';
  };
  let deb;
  view.addEventListener('input', (e) => {
    const f = e.target.dataset.f, c = e.target.dataset.c;
    if (f) st[f] = e.target.value.trim();
    if (c) st[c] = e.target.checked ? '1' : '';
    if (!f && !c) return;
    st.page = 0; clearTimeout(deb); deb = setTimeout(load, 250);
  });
  view.addEventListener('click', async (e) => {
    const p = e.target.closest('[data-p]');
    if (p) { st.page += Number(p.dataset.p); load(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const b = e.target.closest('[data-buy]'), x = e.target.closest('[data-cancel]');
    if (!b && !x) return;
    e.preventDefault(); e.stopPropagation();
    if (!me) { location.hash = '#/login'; return; }
    try {
      if (b) {
        if (!(await confirmBox(t('Acheter cette carte pour <b>{price}</b> ?', { price: cr(Number(b.dataset.price)) }), t('Acheter')))) return;
        await post(`/market/${b.dataset.buy}/buy`); sound.play('coin'); toast(t('Achat effectué ! La carte est dans votre inventaire.'), 'good');
      } else {
        await post(`/market/${x.dataset.cancel}/cancel`); toast(t('Annonce retirée'));
      }
      store.refresh(); load();
    } catch (err) { toast(esc(err.message), 'error'); }
  });
  load();
}

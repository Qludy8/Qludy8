// Collection : toutes les cartes du jeu (les tiennes en couleur, les manquantes grisées), albums par univers,
// filtres, tri, recherche, recyclage des doublons.
import { S, game, artUrl, setUser } from '../state.js';
import { api } from '../api.js';
import { RARITY, RARITIES, GENRES } from '/shared/config.js';
import { slotHTML, inspect } from '../card.js';
import { esc, fmt, gem, icon, modal, toast, toastErr, prefs, $, pct } from '../util.js';
import { sfx } from '../fx.js';

const SORTS = [
  ['num', 'Numéro'], ['rare', 'Plus rares d’abord'], ['common', 'Moins rares d’abord'], ['recent', 'Plus récentes'],
  ['qty', 'Plus d’exemplaires d’abord'], ['name', 'Nom'], ['year', 'Année (récentes)'], ['old', 'Année (anciennes)'],
];
const OWN = [['all', 'Cartes'], ['own', 'Possédées'], ['miss', 'Manquantes'], ['dup', 'Doublons'], ['wish', 'Envies'], ['lock', 'Verrouillées']];
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

export async function render(main, [univers]) {
  const st = { view: univers ? 'tous' : prefs.get('cview', 'tous'), own: prefs.get('cown', 'all'), sort: prefs.get('csort', 'num'),
    rar: new Set(), genre: '', q: '', usort: prefs.get('usort', 'progress') };
  let shown = 0, list = [], io;

  const head = () => {
    const have = S.user.unique;
    const scope = univers ? S.univers.get(univers) || [] : null;
    const haveScope = scope ? scope.filter((n) => S.coll.get(n)?.qty > 0).length : have;
    const tot = scope ? scope.length : S.total;
    return `<div class="col-head">
      <div>
        ${univers ? `<a class="chip" href="/collection" style="margin-bottom:12px">${icon.back.replace('<svg', '<svg width="14" height="14"')} Tous les univers</a>` : ''}
        <div class="eyebrow">${univers ? 'UNIVERS · 世界' : 'ALBUM · コレクション'}</div>
        <h1 class="h1">${univers ? esc(univers) : 'Ma collection'}</h1>
        <p class="lead">${univers ? `${fmt(tot)} jeux dans cet univers.` : 'Chaque univers est un album. Les doublons s’échangent ou se recyclent en jetons.'}</p>
      </div>
      <div class="col-progress"><div class="num"><span>${fmt(haveScope)} / ${fmt(tot)}</span><span>${pct((haveScope / Math.max(1, tot)) * 100)}</span></div>
        <div class="meter"><i style="width:${(haveScope / Math.max(1, tot)) * 100}%"></i></div></div>
    </div>`;
  };

  const shell = () => {
    main.innerHTML = `${head()}
      <div class="toolbar">
        ${univers ? '' : `<div class="seg">${[['univers', 'Univers'], ['tous', 'Tous']].map(([k, l]) => `<button data-view="${k}" class="${st.view === k ? 'on' : ''}">${l}</button>`).join('')}</div>`}
        <div class="search">${icon.search}<input class="input" data-q placeholder="${st.view === 'univers' ? 'Chercher un univers…' : 'Chercher une carte ou un univers…'}" value="${esc(st.q)}"></div>
        ${st.view === 'univers' ? `<select class="select" data-usort>${[['progress', 'Plus avancés'], ['size', 'Plus grands'], ['name', 'Nom'], ['done', 'Complets']].map(([k, l]) => `<option value="${k}" ${st.usort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`
          : `<select class="select" data-own>${OWN.map(([k, l]) => `<option value="${k}" ${st.own === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <select class="select" data-sort aria-label="Tri">${SORTS.map(([k, l]) => `<option value="${k}" ${st.sort === k ? 'selected' : ''}>Tri : ${l}</option>`).join('')}</select>
          <select class="select" data-genre><option value="">Tous les genres</option>${Object.entries(GENRES).map(([k, g]) => `<option value="${k}" ${st.genre === k ? 'selected' : ''}>${g.label}</option>`).join('')}</select>`}
        <button class="btn sm" data-recycle>${icon.recycle.replace('<svg', '<svg width="16" height="16"')} Recycler les doublons</button>
      </div>
      ${st.view === 'univers' ? '' : `<div class="filters">${RARITIES.map((r) => `<button class="chip ${st.rar.has(r) ? 'on' : ''}" data-rar="${r}" style="--rc:${RARITY[r].color}"><span class="r-dot"></span>${RARITY[r].label}</button>`).join('')}</div>`}
      <div class="count-line" data-count></div>
      <div data-body></div><div class="more-sentinel"></div>`;
    io?.disconnect();
    io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) more(); }, { rootMargin: '800px' });
    io.observe($('.more-sentinel', main));
    st.view === 'univers' ? albums() : cards();
  };

  function filtered() {
    const q = norm(st.q);
    let arr = univers ? (S.univers.get(univers) || []).map(game) : S.games;
    arr = arr.filter((g) => {
      const c = S.coll.get(g.n);
      const have = c?.qty > 0;
      if (st.own === 'own' && !have) return false;
      if (st.own === 'miss' && have) return false;
      if (st.own === 'dup' && !(c?.qty > 1)) return false;
      if (st.own === 'wish' && !S.wishes.has(g.n)) return false;
      if (st.own === 'lock' && !c?.locked) return false;
      if (st.rar.size && !st.rar.has(g.r)) return false;
      if (st.genre && !g.g.includes(st.genre)) return false;
      if (q && !norm(g.t).includes(q) && !norm(g.u).includes(q) && !norm(g.d || '').includes(q) && String(g.n) !== q) return false;
      return true;
    });
    const ri = (g) => RARITIES.indexOf(g.r);
    const own = (g) => (S.coll.get(g.n)?.qty > 0 ? 0 : 1);
    const cmp = {
      num: (a, b) => a.n - b.n,
      rare: (a, b) => ri(b) - ri(a) || a.n - b.n,
      common: (a, b) => ri(a) - ri(b) || b.n - a.n,
      recent: (a, b) => (S.coll.get(b.n)?.first || 0) - (S.coll.get(a.n)?.first || 0) || a.n - b.n,
      qty: (a, b) => (S.coll.get(b.n)?.qty || 0) - (S.coll.get(a.n)?.qty || 0) || a.n - b.n,
      name: (a, b) => a.t.localeCompare(b.t, 'fr'),
      year: (a, b) => (b.y || 0) - (a.y || 0) || a.n - b.n,
      old: (a, b) => (a.y || 9999) - (b.y || 9999) || a.n - b.n,
    }[st.sort];
    // « Cartes » : les tiennes d'abord, comme dans kyara
    return arr.sort((a, b) => (st.own === 'all' && st.sort === 'num' ? own(a) - own(b) : 0) || cmp(a, b)).map((g) => g.n);
  }

  function cards() {
    list = filtered();
    shown = 0;
    $('[data-count]', main).textContent = `${fmt(list.length)} carte${list.length > 1 ? 's' : ''}`;
    $('[data-body]', main).innerHTML = list.length ? '<div class="cards"></div>' : `<div class="empty">${S.user.unique ? '<strong>Aucune carte ne correspond à ces filtres.</strong>' : '<strong>Ta collection est vide.</strong>Chaque booster ajoute 5 cartes ; les emplacements grisés sont les jeux qu’il te reste à trouver.'}</div>`;
    more();
  }
  function more() {
    if (st.view === 'univers') return;
    const grid = $('[data-body] .cards', main);
    if (!grid || shown >= list.length) return;
    const next = list.slice(shown, shown + 60);
    shown += next.length;
    grid.insertAdjacentHTML('beforeend', next.map((n) => slotHTML(n)).join(''));
  }

  function albums() {
    const q = norm(st.q);
    let arr = [...S.univers.entries()].filter(([, ns]) => ns.length >= 2).map(([u, ns]) => {
      const have = ns.filter((n) => S.coll.get(n)?.qty > 0).length;
      return { u, ns, have, tot: ns.length };
    });
    if (q) arr = arr.filter((a) => norm(a.u).includes(q));
    if (st.usort === 'done') arr = arr.filter((a) => a.have === a.tot);
    arr.sort({
      progress: (a, b) => b.have / b.tot - a.have / a.tot || b.tot - a.tot,
      size: (a, b) => b.tot - a.tot, name: (a, b) => a.u.localeCompare(b.u, 'fr'), done: (a, b) => b.tot - a.tot,
    }[st.usort]);
    $('[data-count]', main).textContent = `${fmt(arr.length)} univers · les jeux seuls dans leur univers restent dans « Tous »`;
    $('[data-body]', main).innerHTML = `<div class="albums">${arr.map((a) => {
      const best = game(a.ns.find((n) => game(n).i) || a.ns[0]);
      return `<a class="album ${a.have === a.tot ? 'done' : ''}" href="/collection/univers/${encodeURIComponent(a.u)}">
        <div class="cov">${artUrl(best) ? `<img src="${esc(artUrl(best))}" alt="" loading="lazy">` : ''}</div>
        <div><div class="nm">${esc(a.u)}</div><div class="sub">${a.have} / ${a.tot}${a.have === a.tot ? ' · Complet ★' : ''}</div>
        <div class="meter ${a.have === a.tot ? 'ok' : ''}"><i style="width:${(a.have / a.tot) * 100}%"></i></div></div></a>`;
    }).join('')}</div>`;
  }

  function recycleModal() {
    const counts = Object.fromEntries(RARITIES.map((r) => [r, 0]));
    for (const [n, c] of S.coll) {
      const free = c.qty - 1 - c.reserved;
      if (free > 0 && !c.locked) counts[game(n).r] += free;
    }
    const sel = new Set(['C', 'U', 'R']);
    const m = modal(`<h3>♻ Recycler les doublons</h3><p class="mut">Quelles raretés recycler ? Tu gardes toujours 1 exemplaire de chaque carte, et les cartes verrouillées ne sont jamais recyclées.</p>
      <div style="display:grid;gap:8px;margin:14px 0" data-rs>${RARITIES.map((r) => `<label class="row panel" style="padding:10px 14px;cursor:pointer;--rc:${RARITY[r].color}">
        <input type="checkbox" value="${r}" ${sel.has(r) ? 'checked' : ''} ${counts[r] ? '' : 'disabled'}><b style="color:${RARITY[r].color}">${RARITY[r].label}</b>
        <span class="spacer"></span><span class="mono">${counts[r]} × ${RARITY[r].recycle} ◆</span></label>`).join('')}</div>
      <button class="btn acc block" data-go></button>`);
    const upd = () => {
      const gain = [...sel].reduce((s, r) => s + counts[r] * RARITY[r].recycle, 0);
      const n = [...sel].reduce((s, r) => s + counts[r], 0);
      const b = $('[data-go]', m.el);
      b.innerHTML = n ? `Oui, recycler ${n} doublon${n > 1 ? 's' : ''} · +${gem(gain)}` : 'Aucun doublon dans cette sélection';
      b.disabled = !n;
    };
    m.el.querySelectorAll('[data-rs] input').forEach((i) => i.onchange = () => { i.checked ? sel.add(i.value) : sel.delete(i.value); upd(); });
    upd();
    $('[data-go]', m.el).onclick = async () => {
      try {
        const r = await api.post('/recycle', { rarities: [...sel] });
        setUser(r.user);
        for (const [n, c] of S.coll) {
          if (!sel.has(game(n).r) || c.locked) continue;
          const free = c.qty - 1 - c.reserved;
          if (free > 0) c.qty -= free;
        }
        sfx.coin();
        toast(`♻ ${r.count} doublon${r.count > 1 ? 's' : ''} recyclé${r.count > 1 ? 's' : ''} : +${gem(r.gain)}`, 'ok');
        m.close();
        shell();
      } catch (e) { toastErr(e); }
    };
  }

  shell();
  let qt;
  main.addEventListener('input', (e) => {
    if (e.target.matches('[data-q]')) { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value; st.view === 'univers' ? albums() : cards(); }, 160); }
  });
  main.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-own]')) { st.own = t.value; prefs.set('cown', st.own); cards(); }
    if (t.matches('[data-sort]')) { st.sort = t.value; prefs.set('csort', st.sort); cards(); }
    if (t.matches('[data-genre]')) { st.genre = t.value; cards(); }
    if (t.matches('[data-usort]')) { st.usort = t.value; prefs.set('usort', st.usort); albums(); }
  });
  main.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    if (v) { st.view = v.dataset.view; prefs.set('cview', st.view); return shell(); }
    const r = e.target.closest('[data-rar]');
    if (r) { st.rar.has(r.dataset.rar) ? st.rar.delete(r.dataset.rar) : st.rar.add(r.dataset.rar); r.classList.toggle('on'); return cards(); }
    if (e.target.closest('[data-recycle]')) return recycleModal();
    const s = e.target.closest('[data-card]');
    if (s) inspect(Number(s.dataset.card));
  });
  return () => io?.disconnect();
}

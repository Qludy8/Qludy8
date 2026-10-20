// Classement des collectionneurs : points de collection, Mythiques, jeux différents.
import { S } from '../state.js';
import { api } from '../api.js';
import { esc, fmt, prefs, $ } from '../util.js';
import { RARITY } from '/shared/config.js';

const KINDS = [['points', 'Points'], ['mythics', 'Mythiques'], ['unique', 'Jeux différents']];

export async function render(main) {
  let kind = prefs.get('lbk', 'points');
  main.innerHTML = `<div class="eyebrow">CLASSEMENT · ランキング</div><h1 class="h1">Les meilleurs collectionneurs</h1>
    <p class="lead">Points de collection : chaque jeu compte selon sa rareté (Commune ${RARITY.C.points}, Peu commune ${RARITY.U.points}, Rare ${RARITY.R.points}, Épique ${RARITY.E.points}, Légendaire ${RARITY.L.points}, Mythique ${RARITY.M.points}). Ce sont eux qui donnent le rang.</p>
    <div class="seg" style="margin:22px 0 18px">${KINDS.map(([k, l]) => `<button data-k="${k}" class="${k === kind ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div data-list><div class="mut">Chargement du classement…</div></div>`;
  const draw = async () => {
    const list = await api.get(`/leaderboard?kind=${kind}`);
    const val = (r) => (kind === 'points' ? [fmt(r.points), 'points'] : kind === 'mythics' ? [fmt(r.mythics), 'Mythiques'] : [fmt(r.uniq), `jeux / ${fmt(S.total)}`]);
    $('[data-list]', main).innerHTML = list.length ? list.map((r, i) => `<a class="lb-row ${r.username === S.user.username ? 'me' : ''}" href="/profil/${encodeURIComponent(r.username)}">
      <div class="pos">${i + 1}</div>
      <div class="row" style="min-width:0"><span class="avatar" style="--h:${r.hue}">${esc(r.username[0].toUpperCase())}</span>
        <div style="min-width:0"><div class="nm">${esc(r.username)}${r.username === S.user.username ? ' <span class="badge new">toi</span>' : ''}</div><div class="rk">${esc(r.rank)} · ${fmt(r.uniq)} jeux · ${r.mythics} Mythique${r.mythics > 1 ? 's' : ''}</div></div></div>
      <div class="val">${val(r)[0]}<small>${val(r)[1]}</small></div></a>`).join('')
      : '<div class="empty">Personne n’est encore classé. Ouvre un booster pour prendre la tête !</div>';
  };
  draw();
  main.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    kind = b.dataset.k; prefs.set('lbk', kind);
    main.querySelectorAll('[data-k]').forEach((x) => x.classList.toggle('on', x === b));
    draw();
  });
}

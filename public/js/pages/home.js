// Accueil : ta journée (boosters gratuits, pack du jour, missions), fil en direct des gros tirages, dernières cartes.
import { S, game } from '../state.js';
import { api } from '../api.js';
import { RARITY, RARITIES, GENRES } from '/shared/config.js';
import { cardHTML, slotHTML, inspect } from '../card.js';
import { packHTML, todayTheme } from '../pack.js';
import { openStage } from '../opening.js';
import { esc, fmt, gem, ago, pad4, $, refresh } from '../util.js';

export async function render(main) {
  const u = S.user;
  const std = S.boosters.find((b) => b.id === 'standard');
  const daily = S.boosters.find((b) => b.id === 'daily');
  const retro = S.boosters.find((b) => b.id === 'nintendo') || std;
  const theme = todayTheme();
  const pctDone = ((u.unique / S.total) * 100).toFixed(1).replace('.', ',');
  main.innerHTML = `
    <section class="hero">
      <div>
        <div class="eyebrow">BIENVENUE · 歓迎</div>
        <h1 class="h1">Ouvre, collectionne,<br>complète ta ludothèque.</h1>
        <p class="lead">${fmt(S.total)} jeux vidéo à collectionner, de Commune à Mythique. Un booster gratuit toutes les 10 minutes, un pack du jour, des missions, un marché et des échanges.</p>
        <div class="cta-row">
          <button class="btn acc lg" data-free>${u.freePacks + u.bonusPacks > 0 ? `Ouvre ton booster gratuit · ${u.freePacks + u.bonusPacks}` : 'Ouvrir un booster'}</button>
          ${u.dailyAvailable ? `<button class="btn gold lg" data-daily>Pack du jour</button>` : `<a class="btn lg" href="/boosters">Tous les boosters</a>`}
        </div>
      </div>
      <div class="packs3">${packHTML(retro)}${packHTML(std)}${packHTML(daily, { theme })}</div>
    </section>

    <section class="sec">
      <div class="kpis">
        <div class="kpi"><small>Collection</small><b>${fmt(u.unique)}</b><span class="mut"> / ${fmt(S.total)}</span><div class="meter" style="margin-top:8px"><i style="width:${pctDone.replace(',', '.')}%"></i></div></div>
        <div class="kpi"><small>Points</small><b>${fmt(u.points)}</b><div class="mut" style="font-size:12px">${esc(u.rank)}</div></div>
        <div class="kpi"><small>Boosters ouverts</small><b>${fmt(u.packsOpened)}</b><div class="mut" style="font-size:12px">${u.pityThreshold - u.pityM} avant Mythique sûre</div></div>
        <div class="kpi"><small>Série de connexion</small><b>${u.streak} j</b><div class="mut" style="font-size:12px">${u.claimable ? `<a href="/missions" style="color:var(--acc)">${u.claimable} récompense${u.claimable > 1 ? 's' : ''} à réclamer</a>` : 'Reviens demain !'}</div></div>
      </div>
    </section>

    <section class="sec">
      <div class="sec-h"><div><div class="eyebrow">TA JOURNÉE · 日課</div><h2 class="h2" style="margin-top:8px">Missions du jour</h2></div><a class="more" href="/missions">Missions et succès →</a></div>
      <div class="grid2" data-missions><div class="panel mut">Chargement des missions…</div></div>
    </section>

    <section class="sec">
      <div class="sec-h"><div><div class="eyebrow"><span class="live">EN DIRECT · LÉGENDAIRES ET MYTHIQUES</span></div><h2 class="h2" style="margin-top:8px">Gros tirages des joueurs</h2></div><a class="more" href="/classement">Classement →</a></div>
      <div class="feed" data-feed><div class="mut">Chargement…</div></div>
    </section>

    <section class="sec">
      <div class="sec-h"><div><div class="eyebrow">RÉCEMMENT OBTENUES</div><h2 class="h2" style="margin-top:8px">Tes dernières cartes</h2></div><a class="more" href="/collection">Ma collection →</a></div>
      <div class="cards sm" data-recent></div>
    </section>

    <section class="sec">
      <div class="sec-h"><div><div class="eyebrow">SYSTÈME DE RARETÉ · レアリティ</div><h2 class="h2" style="margin-top:8px">De Commune à Mythique</h2></div><a class="more" href="/raretes">Comment ça marche →</a></div>
      <div class="cards sm">${RARITIES.map((r) => {
        const g = S.games.find((x) => x.r === r && (x.i || x.wk) && x.n % 7 === 3) || S.games.find((x) => x.r === r);
        return `<div class="slot" data-card="${g.n}">${cardHTML(g.n)}<div class="price"><span style="color:${RARITY[r].color};font-weight:900">${RARITY[r].label}</span><span class="mut">${RARITY[r].rule}</span></div></div>`;
      }).join('')}</div>
    </section>`;

  const recent = [...S.coll.entries()].filter(([, c]) => c.qty > 0).sort((a, b) => b[1].first - a[1].first).slice(0, 12).map(([n]) => n);
  $('[data-recent]', main).innerHTML = recent.length ? recent.map((n) => slotHTML(n)).join('')
    : `<div class="empty" style="grid-column:1/-1"><strong>Ta collection est vide.</strong>Chaque booster ajoute 5 cartes. Ouvre ton premier booster !</div>`;

  main.addEventListener('click', (e) => {
    const s = e.target.closest('[data-card]');
    if (s) return inspect(Number(s.dataset.card));
    if (e.target.closest('[data-free]')) openStage('standard', { onClose: refresh });
    if (e.target.closest('[data-daily]')) openStage('daily', { onClose: refresh });
  });

  api.get('/missions').then((m) => {
    $('[data-missions]', main).innerHTML = m.daily.map((x) => `<div class="mission ${x.claimed ? 'claimed' : x.done ? 'ready' : ''}">
      <div class="lb">${esc(x.label)}${x.id === 'd-daily' ? ` <span class="mut">· thème ${esc(GENRES[theme].label)}</span>` : ''}</div><div class="rw">+${gem(x.reward)}</div>
      <div class="meter ${x.done ? 'ok' : ''}"><i style="width:${(x.value / x.goal) * 100}%"></i></div>
      <div class="mut" style="font-size:12px">${x.claimed ? 'Réclamé ✓' : x.done ? '<a href="/missions" style="color:var(--acc)">À réclamer</a>' : `${x.value} / ${x.goal}`}</div></div>`).join('');
  }).catch(() => {});

  const loadFeed = () => api.get('/feed').then((list) => {
    const el = $('[data-feed]', main);
    if (!el) return;
    const items = list.flatMap((p) => p.cards.map((n) => ({ n, p }))).slice(0, 24);
    el.innerHTML = items.length ? items.map(({ n, p }) => `<div class="it"><div class="slot" data-card="${n}">${cardHTML(n)}</div>
      <div class="who"><span class="avatar" style="--h:${p.hue}">${esc(p.user[0])}</span><a href="/profil/${encodeURIComponent(p.user)}">${esc(p.user)}</a><span class="mut">· ${ago(p.at)}</span></div></div>`).join('')
      : '<div class="mut">Aucune Légendaire ni Mythique pour l’instant. La première sera peut-être pour toi.</div>';
  }).catch(() => {});
  loadFeed();
  const t = setInterval(loadFeed, 20000);
  return () => clearInterval(t);
}

export { game, pad4 };

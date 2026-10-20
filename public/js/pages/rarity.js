// Système de rareté : comment un jeu reçoit sa rareté, chances, recyclage, points.
import { S } from '../state.js';
import { RARITY, RARITIES, ECONOMY } from '/shared/config.js';
import { cardHTML, inspect } from '../card.js';
import { fmt, pct, pad4 } from '../util.js';

export async function render(main) {
  const total = RARITIES.reduce((s, r) => s + RARITY[r].drop, 0);
  main.innerHTML = `<div class="eyebrow">SYSTÈME DE RARETÉ · レアリティ</div><h1 class="h1">De Commune à Mythique</h1>
    <p class="lead">La rareté d’un jeu dépend de sa <b>popularité</b> et de la <b>qualité</b> de ses avis : plus il est joué et aimé, plus sa carte est rare.
    Le <b>numéro</b> d’une carte (par exemple #0001/${pad4(S.total)}) est sa place dans le catalogue : #0001 = le jeu le plus populaire et le mieux noté.
    C’est cette place qui donne la rareté : les plus aimés sont Mythiques, les moins connus sont Communs.</p>
    <div class="panel sec" style="font-size:13.5px;color:var(--fg2)">
      <b style="color:var(--fg)">D’où viennent les jeux et les images ?</b><br>
      Les ${fmt(S.games.filter((g) => g.s).length)} jeux PC viennent de Steam : nombre d’avis (popularité), pourcentage d’avis positifs (qualité), et l’affiche officielle du jeu ou une capture en jeu.
      Les ${fmt(S.games.filter((g) => !g.s).length)} grands jeux absents de Steam (Nintendo, PlayStation, arcade, mobile…) utilisent la jaquette officielle de leur article Wikipédia, avec une audience estimée.
      Aucune image n’est créée ni retouchée.
    </div>
    <div class="sec">${RARITIES.slice().reverse().map((r) => {
      const games = S.games.filter((g) => g.r === r);
      const ex = games[Math.floor(games.length * 0.1)] || games[0];
      return `<div class="rar-row" style="--rc:${RARITY[r].color}">
        <div class="slot" data-card="${ex.n}">${cardHTML(ex.n)}</div>
        <div><div class="nm">${RARITY[r].label}</div><div class="mut">${RARITY[r].look} Classement : ${RARITY[r].rule}.</div>
          <div class="facts">
            <div class="fact"><small>Jeux</small><b class="mono">${fmt(games.length)}</b></div>
            <div class="fact"><small>Par carte</small><b class="mono">${pct(RARITY[r].drop / total * 100)}</b></div>
            <div class="fact"><small>Recyclage</small><b class="mono">${RARITY[r].recycle} ◆</b></div>
            <div class="fact"><small>Points</small><b class="mono">${RARITY[r].points}</b></div>
          </div></div></div>`;
    }).join('')}</div>
    <div class="panel sec"><h2 class="h3" style="margin-bottom:10px">Garanties</h2>
      <div style="display:grid;gap:8px;color:var(--fg2)">
        <div>✦ <b>Booster doré</b> : un booster sur ${ECONOMY.goldenEvery} est doré, avec une Épique ou mieux garantie.</div>
        <div>✦ <b>Booster divin</b> : 1 chance sur ${Math.round(1 / ECONOMY.divineChance)} ; Mythique garantie et toutes les cartes Rares ou mieux.</div>
        <div>✦ <b>Pitié Mythique</b> : au ${ECONOMY.pityMythic}ᵉ booster sans Mythique, la Mythique est garantie.</div>
        <div>✦ <b>Pack du jour</b> : gratuit une fois par jour, thème différent chaque jour, Épique garantie.</div>
        <div>✦ Aucun doublon dans un même booster ; on garde toujours 1 exemplaire au recyclage.</div>
      </div></div>`;
  main.addEventListener('click', (e) => { const s = e.target.closest('[data-card]'); if (s) inspect(Number(s.dataset.card)); });
}

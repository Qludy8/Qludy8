// Missions du jour et de la semaine, série de connexion, succès.
import { S, setUser } from '../state.js';
import { api } from '../api.js';
import { esc, gem, dur, toast, toastErr, $, refresh } from '../util.js';
import { msToMidnight } from '/shared/rules.js';
import { sfx } from '../fx.js';

const row = (x) => `<div class="mission ${x.claimed ? 'claimed' : x.done ? 'ready' : ''}">
  <div><div class="lb">${esc(x.label)}</div>${x.desc ? `<div class="mut" style="font-size:12.5px">${esc(x.desc)}</div>` : ''}</div>
  <div class="row"><span class="rw">+${gem(x.reward)}${x.freePacks ? ` · +${x.freePacks} booster${x.freePacks > 1 ? 's' : ''}` : ''}</span>
    ${x.claimed ? '<span class="chip">Réclamé ✓</span>' : x.done ? `<button class="btn sm acc" data-claim="${x.id}">Réclamer</button>` : `<span class="chip mono">${x.value} / ${x.goal}</span>`}</div>
  <div class="meter ${x.done ? 'ok' : ''}"><i style="width:${(x.value / x.goal) * 100}%"></i></div></div>`;

export async function render(main) {
  main.innerHTML = '<div class="mut">Chargement des missions…</div>';
  const m = await api.get('/missions');
  const claimable = [...m.daily, ...m.weekly, ...m.achievements].filter((x) => x.done && !x.claimed).length;
  const step = ((Math.max(1, m.streak) - 1) % 7) + 1;
  const toMonday = () => { const d = new Date(); const dow = (d.getDay() + 6) % 7; return msToMidnight() + (6 - dow) * 864e5; };
  main.innerHTML = `
    <div class="eyebrow">MISSIONS · 任務</div>
    <h1 class="h1">Missions & succès</h1>
    <p class="lead">Missions du jour et de la semaine, série de connexion, succès : gagne des jetons et des boosters.</p>
    ${claimable ? `<div class="row" style="margin-top:18px"><button class="btn acc" data-claim="all">Tout réclamer (${claimable})</button></div>` : ''}
    <section class="sec">
      <div class="sec-h"><div><div class="eyebrow">CONNEXION · 連続</div><h2 class="h2" style="margin-top:8px">Série de ${m.streak} jour${m.streak > 1 ? 's' : ''}</h2></div><span class="mut">Un jour manqué et la série repart à zéro.</span></div>
      <div class="streak">${m.streakTable.map((j, i) => `<div class="d ${i < step ? 'on' : ''} ${i === step - 1 ? 'today' : ''}"><small>JOUR ${i + 1}</small><b>${j} ◆</b>${i === 6 ? '<small>+1 booster</small>' : ''}</div>`).join('')}</div>
    </section>
    <div class="grid2 sec">
      <section><div class="sec-h"><div><div class="eyebrow">DU JOUR · 日課</div><h2 class="h2" style="margin-top:8px">Missions du jour</h2></div><span class="mut mono" data-t1></span></div>${m.daily.map(row).join('')}</section>
      <section><div class="sec-h"><div><div class="eyebrow">DE LA SEMAINE · 週課</div><h2 class="h2" style="margin-top:8px">Missions de la semaine</h2></div><span class="mut mono" data-t2></span></div>${m.weekly.map(row).join('')}</section>
    </div>
    <section class="sec"><div class="sec-h"><div><div class="eyebrow">SUCCÈS · 実績</div><h2 class="h2" style="margin-top:8px">Succès</h2></div>
      <span class="mut">${m.achievements.filter((a) => a.claimed).length} / ${m.achievements.length} réclamés</span></div>
      <div class="grid2">${m.achievements.map(row).join('')}</div></section>`;
  const tick = () => {
    const a = $('[data-t1]', main), b = $('[data-t2]', main);
    if (a) a.textContent = `nouvelles dans ${dur(msToMidnight())}`;
    if (b) b.textContent = `lundi dans ${dur(toMonday())}`;
  };
  tick();
  const t = setInterval(tick, 1000);
  main.addEventListener('click', async (e) => {
    const c = e.target.closest('[data-claim]');
    if (!c) return;
    c.disabled = true;
    try {
      const r = await api.post('/missions/claim', { id: c.dataset.claim });
      setUser(r.user);
      sfx.coin();
      toast(`Récompense : +${gem(r.jetons)}${r.packs ? ` · +${r.packs} booster${r.packs > 1 ? 's' : ''}` : ''}`, 'ok');
      refresh();
    } catch (err) { toastErr(err); c.disabled = false; }
  });
  return () => clearInterval(t);
}

export { S };

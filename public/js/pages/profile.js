// Profil : le sien (vitrine, compte, réglages) ou celui d'un autre collectionneur.
import { S, setUser, loadCollection, game } from '../state.js';
import { api } from '../api.js';
import { RARITY, RARITIES, ECONOMY } from '/shared/config.js';
import { cardHTML, slotHTML, inspect } from '../card.js';
import { esc, fmt, icon, modal, toast, toastErr, $, refresh } from '../util.js';

export async function render(main, [name]) {
  const mine = !name || name === S.user.username;
  name = name || S.user.username;
  main.innerHTML = '<div class="mut">Chargement du profil…</div>';
  let p;
  try { p = await api.get(`/profile/${encodeURIComponent(name)}`); } catch (e) { main.innerHTML = `<div class="empty"><strong>${esc(e.message)}</strong></div>`; return; }
  const u = S.user;
  main.innerHTML = `
    <div class="prof-head">
      <span class="avatar lg" style="--h:${p.hue}">${esc(p.username[0].toUpperCase())}</span>
      <div style="flex:1;min-width:220px">
        <div class="eyebrow">${p.bot ? 'COLLECTIONNEUR AUTOMATIQUE · ロボ' : 'COLLECTIONNEUR · コレクター'}</div>
        <h1 class="h1">${esc(p.username)}</h1>
        <div class="mut">${esc(p.rank)} · inscrit le ${new Date(p.since).toLocaleDateString('fr-FR')}</div>
        ${p.bio ? `<p style="margin:8px 0 0">${esc(p.bio)}</p>` : ''}
      </div>
      ${mine ? '<button class="btn" data-edit>✎ Personnaliser</button>' : ''}
    </div>
    <div class="kpis sec" style="margin-top:24px">
      <div class="kpi"><small>Points</small><b>${fmt(p.points)}</b></div>
      <div class="kpi"><small>Jeux différents</small><b>${fmt(p.unique)}</b><span class="mut"> / ${fmt(p.total)}</span></div>
      <div class="kpi"><small>Mythiques</small><b>${fmt(p.mythics)}</b></div>
      <div class="kpi"><small>Univers complets</small><b>${fmt(p.universDone)}</b></div>
    </div>
    <section class="sec"><div class="sec-h"><div><div class="eyebrow">VITRINE · 陳列</div><h2 class="h2" style="margin-top:8px">${mine ? 'Ta vitrine' : 'Sa vitrine'}</h2></div>
      ${mine ? '<button class="btn sm" data-show>✎ Choisir ma vitrine</button>' : ''}</div>
      ${p.showcase.length ? `<div class="vitrine">${p.showcase.map((n) => `<div class="slot" data-card="${n}">${cardHTML(n)}</div>`).join('')}</div>` : '<div class="empty">Vitrine vide : ouvre des boosters d’abord.</div>'}
    </section>
    <section class="sec grid2">
      <div class="panel"><h2 class="h3" style="margin-bottom:14px">Raretés</h2><div class="rar-bars">${RARITIES.slice().reverse().map((r) => {
        const tot = S.games.filter((g) => g.r === r).length;
        const have = p.byRarity[r] || 0;
        return `<div class="rb" style="--rc:${RARITY[r].color}"><b style="color:${RARITY[r].color}">${RARITY[r].label}</b><div class="meter"><i style="width:${(have / tot) * 100}%"></i></div><span class="mono mut">${have}/${tot}</span></div>`;
      }).join('')}</div></div>
      ${mine ? `<div class="panel" data-account>
        <h2 class="h3" style="margin-bottom:6px">Ton compte</h2>
        ${u.guest ? `<p class="mut" style="margin-top:0">Compte invité : ta collection sera perdue si tu changes d’appareil ou vides ton navigateur. Choisis un pseudo et un mot de passe pour la garder.</p>
          <form data-secure style="display:grid;gap:10px">
            <div class="field"><label>Pseudo</label><input class="input" name="username" minlength="3" maxlength="20" placeholder="3 à 20 caractères : lettres, chiffres, _ et -" required></div>
            <div class="field"><label>Mot de passe</label><input class="input" name="password" type="password" minlength="6" required autocomplete="new-password"></div>
            <button class="btn acc">Protéger mon compte</button>
          </form>
          <div class="sep" style="height:1px;background:var(--line);margin:16px 0"></div>
          <p class="mut" style="margin:0 0 8px">Tu as déjà un compte ?</p>
          <form data-login style="display:grid;gap:10px">
            <input class="input" name="username" placeholder="Pseudo" required>
            <input class="input" name="password" type="password" placeholder="Mot de passe" required autocomplete="current-password">
            <button class="btn">Se connecter</button>
          </form>`
        : `<p class="mut" style="margin-top:0">Connecté en tant que <b>${esc(u.username)}</b>. ${fmt(u.packsOpened)} boosters ouverts.</p>
          <button class="btn" data-logout>Se déconnecter</button>`}
      </div>` : `<div class="panel"><h2 class="h3" style="margin-bottom:10px">Échanger avec ${esc(p.username)}</h2><p class="mut">Ses doublons et ses offres sont visibles au marché, onglet Échanges.</p><a class="btn" href="/marche">Aller au marché</a></div>`}
    </section>`;

  main.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      if (e.target.matches('[data-secure]')) {
        const r = await api.post('/register', f);
        setUser(r.user);
        toast('Compte protégé ✓ Ta collection est à l’abri.', 'ok');
      } else if (e.target.matches('[data-login]')) {
        const r = await api.post('/login', f);
        setUser(r.user);
        await loadCollection();
        toast(`Bon retour, ${esc(r.user.username)} !`, 'ok');
      }
      refresh();
    } catch (err) { toastErr(err); }
  });
  main.addEventListener('click', async (e) => {
    const s = e.target.closest('[data-card]');
    if (s) return inspect(Number(s.dataset.card));
    if (e.target.closest('[data-logout]')) {
      await api.post('/logout');
      location.href = '/';
    }
    if (e.target.closest('[data-edit]')) editProfile(p);
    if (e.target.closest('[data-show]')) pickShowcase(p);
  });
}

function editProfile(p) {
  const m = modal(`<h3>Personnaliser mon profil</h3>
    <div class="field" style="margin-top:12px"><label>Une phrase sur toi (160 caractères)</label><textarea class="input" rows="3" maxlength="160" data-bio>${esc(p.bio)}</textarea></div>
    <div class="field" style="margin-top:12px"><label>Couleur de l’avatar</label><input type="range" min="0" max="359" value="${p.hue}" data-hue style="width:100%"></div>
    <div class="row" style="margin-top:10px"><span class="avatar lg" data-prev style="--h:${p.hue}">${esc(p.username[0].toUpperCase())}</span></div>
    <button class="btn acc block" style="margin-top:16px" data-save>Enregistrer</button>`);
  $('[data-hue]', m.el).oninput = (e) => $('[data-prev]', m.el).style.setProperty('--h', e.target.value);
  $('[data-save]', m.el).onclick = async () => {
    try {
      const r = await api.post('/profile', { bio: $('[data-bio]', m.el).value, hue: Number($('[data-hue]', m.el).value) });
      setUser(r.user); m.close(); refresh();
    } catch (e) { toastErr(e); }
  };
}

function pickShowcase(p) {
  let sel = [...p.showcase].filter((n) => S.coll.get(n)?.qty > 0);
  const mine = [...S.coll.keys()].filter((n) => S.coll.get(n).qty > 0).sort((a, b) => RARITIES.indexOf(game(b).r) - RARITIES.indexOf(game(a).r) || a - b);
  const m = modal(`<h3>Choisir ma vitrine</h3><p class="mut">Choisis jusqu’à ${ECONOMY.showcaseMax} cartes, dans l’ordre où elles s’afficheront. Sans choix, ta vitrine montre tes cartes les plus rares.</p>
    <div class="pick-grid" data-g></div><div class="row" style="margin-top:14px"><span class="mut" data-c></span><span class="spacer"></span><button class="btn" data-clear>Vider</button><button class="btn acc" data-save>Enregistrer</button></div>`, { wide: true });
  const draw = () => {
    $('[data-g]', m.el).innerHTML = mine.slice(0, 300).map((n) => slotHTML(n, { showQty: false, extra: sel.includes(n) ? `<span class="qty">${sel.indexOf(n) + 1}</span>` : '' }).replace('class="slot"', `class="slot${sel.includes(n) ? ' sel' : ''}"`)).join('');
    $('[data-c]', m.el).textContent = `${sel.length} / ${ECONOMY.showcaseMax}`;
  };
  draw();
  $('[data-g]', m.el).onclick = (e) => {
    const s = e.target.closest('[data-card]'); if (!s) return;
    const n = Number(s.dataset.card);
    sel = sel.includes(n) ? sel.filter((x) => x !== n) : sel.length < ECONOMY.showcaseMax ? [...sel, n] : sel;
    draw();
  };
  $('[data-clear]', m.el).onclick = () => { sel = []; draw(); };
  $('[data-save]', m.el).onclick = async () => {
    try { await api.post('/profile', { showcase: sel }); m.close(); toast('Vitrine enregistrée ✓', 'ok'); refresh(); } catch (e) { toastErr(e); }
  };
}

export { icon };

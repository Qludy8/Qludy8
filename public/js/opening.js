// Ouverture d'un booster : déchirure (glisser le long du haut ou bouton), cartes empilées, suspense lumineux
// avant les cartes rares, retournement, rayons, onde de choc, particules, sons, puis récapitulatif.
import { RARITY, RARITIES, ECONOMY, rarityIndex, GENRES } from '/shared/config.js';
import { matches } from '/shared/pools.js';
import { S, setUser, addPulled, game, artUrl } from './state.js';
import { api } from './api.js';
import { cardHTML, backHTML, slotHTML, inspect } from './card.js';
import { packHTML, todayTheme } from './pack.js';
import { Particles, sfx, vibrate } from './fx.js';
import { esc, icon, fmt, gem, sleep, toast, toastErr, modal, confirmBox, prefs, pct, $ } from './util.js';

const CHARGE = { C: 0, U: 0, R: 450, E: 900, L: 1500, M: 2200 };

export function ratesModal(b) {
  const pool = b.daily ? { ...(b.pool || {}), genre: todayTheme() } : b.pool || {};
  const counts = Object.fromEntries(RARITIES.map((r) => [r, 0]));
  for (const g of S.games) if (matches(g, pool)) counts[g.r]++;
  const total = RARITIES.reduce((s, r) => s + RARITY[r].drop, 0);
  const slots = b.slots || Array(ECONOMY.packSize).fill(null);
  // chance qu'au moins une carte du booster soit de cette rareté (ou mieux pour les emplacements garantis)
  const perPack = (r) => {
    let none = 1;
    for (const min of slots) {
      const allowed = RARITIES.filter((x) => rarityIndex(x) >= rarityIndex(min || 'C'));
      const sum = allowed.reduce((s, x) => s + RARITY[x].drop, 0);
      const p = allowed.includes(r) ? RARITY[r].drop / sum : 0;
      none *= 1 - p;
    }
    return (1 - none) * 100;
  };
  modal(`<h3>Chance par booster</h3><p class="mut" style="margin:0 0 14px">${esc(b.name)} · ${fmt(Object.values(counts).reduce((a, c) => a + c, 0))} jeux · ${ECONOMY.packSize} cartes par booster</p>
    <table class="rates"><tr><td class="mut">Rareté</td><td class="num mut">Par carte</td><td class="num mut">Par booster</td><td class="num mut">Jeux</td></tr>
    ${RARITIES.map((r) => `<tr style="--rc:${RARITY[r].color}"><td class="rn">${RARITY[r].label}</td><td class="num">${pct(RARITY[r].drop / total * 100)}</td><td class="num">${pct(perPack(r))}</td><td class="num">${fmt(counts[r])}</td></tr>`).join('')}
    </table>
    <div style="display:grid;gap:8px;margin-top:16px;font-size:13px">
      ${b.slots ? `<div>★ ${b.daily ? 'Épique garantie dans le pack du jour.' : 'Rare ou mieux sur chaque carte, Épique ou mieux sur la dernière.'}</div>` : ''}
      <div>✦ <b>Booster doré</b> : un booster sur ${ECONOMY.goldenEvery}, Épique ou mieux garantie.</div>
      <div>✦ <b>Booster divin</b> : 1 chance sur ${ECONOMY.divineChance ? Math.round(1 / ECONOMY.divineChance) : '—'}, Mythique garantie et tout en Rare ou mieux.</div>
      <div>✦ <b>Pitié</b> : Mythique garantie au ${ECONOMY.pityMythic}ᵉ booster sans Mythique.</div>
      <div class="mut">Aucun doublon dans un même booster. Les meilleures cartes sortent en dernier.</div>
    </div>`);
}

export function openStage(boosterId, { onClose } = {}) {
  const b = S.boosters.find((x) => x.id === boosterId);
  if (!b) return;
  const theme = b.daily ? todayTheme() : null;
  const st = document.createElement('div');
  st.className = 'stage';
  st.style.setProperty('--glow', b.color);
  document.getElementById('layer').append(st);
  document.body.style.overflow = 'hidden';
  let fx, keyHandler, alive = true;

  let keyUp = null;
  const close = () => {
    alive = false;
    fx?.destroy();
    document.removeEventListener('keydown', keyHandler);
    document.removeEventListener('keyup', keyUp);
    st.remove();
    document.body.style.overflow = '';
    onClose?.();
  };

  const top = (sub = '') => `<div class="stage-top">
      <button class="icon-btn" data-close aria-label="Retour aux boosters">${icon.back}</button>
      <div><div class="t">${esc(b.name)}</div><div class="s">${esc(sub || (theme ? `Thème du jour : ${GENRES[theme].label}` : b.sub))}</div></div>
      <div class="spacer"></div>
      <button class="chip" data-rates>${icon.info.replace('<svg', '<svg width="14" height="14"')} Chances</button>
      <button class="icon-btn" data-sound aria-label="Son">${prefs.get('sound', true) ? icon.sound : icon.x}</button>
    </div>`;

  // --- étape 1 : le sachet ---
  function ready() {
    const u = S.user;
    const golden = u.goldenIn === 1;
    const freeLeft = u.freePacks + u.bonusPacks;
    let count = Math.min(prefs.get('count', 1), b.usesFree ? Math.max(1, freeLeft) : 10);
    if (b.daily) count = 1;
    const payFree = () => b.usesFree && !b.daily && freeLeft >= count;
    const costLine = () => {
      if (b.daily) return u.dailyAvailable ? 'Gratuit · 1 par jour' : 'Déjà ouvert aujourd’hui : reviens demain.';
      if (payFree()) return `Gratuit · stock ${u.freePacks}/${u.freePacksMax}${u.bonusPacks ? ` + ${u.bonusPacks} bonus` : ''}`;
      return `${gem(b.price * count)} · solde ${gem(u.jetons)}`;
    };
    st.innerHTML = `${top()}<div class="rays"></div><canvas class="fx"></canvas>
      <div class="stage-mid"><div class="open-pack">
        ${packHTML(b, { kind: golden ? 'golden' : 'normal', theme })}
        <div class="tear-guide" title="Glisse pour déchirer"><i></i></div>
      </div></div>
      <div class="stage-bot">
        ${golden ? `<div class="badge" style="--rc:var(--gold)">Ce booster sera doré : Épique ou mieux garantie</div>` : ''}
        <div class="hint-line">Glisse le doigt le long du haut pour déchirer</div>
        ${!b.daily ? `<div class="seg" data-count>${[1, 5, 10].map((k) => `<button data-k="${k}" class="${k === count ? 'on' : ''}">×${k}</button>`).join('')}</div>` : ''}
        <div class="row wrap" style="justify-content:center">
          <button class="btn acc lg" data-open>Ouvrir</button>
        </div>
        <div class="hint-line mut" data-cost>${costLine()}</div>
        <div class="counter">${u.pityThreshold - u.pityM} avant Mythique sûre · ${u.goldenIn} avant le booster doré</div>
      </div>`;
    fx = new Particles($('canvas.fx', st));
    const op = $('.open-pack', st), guide = $('.tear-guide', st), bar = guide.querySelector('i');
    const openBtn = $('[data-open]', st);
    const refresh = () => {
      $('[data-cost]', st).innerHTML = costLine();
      openBtn.disabled = b.daily && !u.dailyAvailable;
    };
    refresh();
    st.querySelectorAll('[data-count] button').forEach((btn) => btn.onclick = () => {
      count = Number(btn.dataset.k);
      prefs.set('count', count);
      st.querySelectorAll('[data-count] button').forEach((x) => x.classList.toggle('on', x === btn));
      refresh();
    });
    // déchirure au doigt
    let tearing = false, startX = 0, done = false;
    const rect = () => guide.getBoundingClientRect();
    const down = (e) => { if (done) return; tearing = true; startX = e.clientX; guide.setPointerCapture?.(e.pointerId); sfx.tick(); };
    const move = (e) => {
      if (!tearing || done) return;
      const r = rect();
      const p = Math.max(0, Math.min(1, (e.clientX - Math.min(startX, r.left + 10)) / r.width));
      bar.parentElement.style.setProperty('--tp', `${p * 100}%`);
      if (Math.random() < 0.3) sfx.tick();
      if (p > 0.82) { done = true; tearing = false; go(); }
    };
    const up = () => { if (!done) { tearing = false; bar.parentElement.style.setProperty('--tp', '0%'); } };
    guide.addEventListener('pointerdown', down);
    guide.addEventListener('pointermove', move);
    guide.addEventListener('pointerup', up);
    guide.addEventListener('pointercancel', up);
    openBtn.onclick = () => { if (!done) { done = true; go(); } };
    document.removeEventListener('keydown', keyHandler);
    keyHandler = (e) => {
      if (e.key === 'Escape') return close();
      if ((e.code === 'Space' || e.key === 'Enter') && !done && !openBtn.disabled && !document.querySelector('.modal-bg')) { e.preventDefault(); done = true; go(); }
    };
    document.addEventListener('keydown', keyHandler);

    async function go() {
      const pay = payFree() || b.daily ? 'free' : 'jetons';
      if (pay === 'jetons') {
        if (!b.price) { toast('Ce booster s’obtient seulement en récompense.', 'err'); done = false; return; }
        if (u.jetons < b.price * count) { toast(`Pas assez de jetons : il en faut ${fmt(b.price * count)}.`, 'err'); done = false; bar.parentElement.style.setProperty('--tp', '0%'); return; }
        if (prefs.get('warnPaid', true) && !(await confirmBox('Booster payant', `Ouvrir ${count > 1 ? `${count} boosters` : 'ce booster'} pour ${gem(b.price * count)} ?`, 'Ouvrir'))) {
          done = false; bar.parentElement.style.setProperty('--tp', '0%'); return;
        }
      }
      openBtn.disabled = true;
      bar.parentElement.style.setProperty('--tp', '100%');
      let res;
      try {
        res = await api.post('/open', { booster: b.id, pay, count });
      } catch (e) {
        toastErr(e);
        done = false; openBtn.disabled = false; bar.parentElement.style.setProperty('--tp', '0%');
        return;
      }
      setUser(res.user);
      for (const p of res.packs) addPulled(p.cards);
      // les affiches se chargent pendant la déchirure
      for (const p of res.packs) for (const c of p.cards) for (const big of [true, false]) { const im = new Image(); im.src = artUrl(game(c.n), big); }
      const divine = res.packs.some((p) => p.divine);
      const goldenNow = res.packs.some((p) => p.golden);
      if (divine) {
        op.querySelector('.pack').className = 'pack divine';
        st.style.setProperty('--glow', '#ffffff');
        $('.rays', st).classList.add('on');
        st.insertAdjacentHTML('beforeend', `<div class="banner-anim divine">Booster divin !</div><div class="flash go"></div>`);
        sfx.fanfare(); vibrate([60, 40, 120]);
        fx.burst('#fff', 120, { rainbow: true, speed: 12 });
        await sleep(1500);
      } else if (goldenNow) {
        st.style.setProperty('--glow', '#f5c518');
        st.insertAdjacentHTML('beforeend', `<div class="banner-anim">Booster doré !</div>`);
        sfx.fanfare();
        fx.rain('#f5c518', 50);
        await sleep(1100);
      }
      // la languette s'envole, le sachet tombe
      sfx.tear(); vibrate(30);
      const packEl = op.querySelector('.pack');
      const cap = packEl.cloneNode(true);
      cap.classList.add('cap-fly');
      cap.style.cssText = 'position:absolute;inset:0;clip-path:inset(0 0 91% 0);';
      packEl.style.clipPath = 'inset(9% 0 0 0)';
      packEl.classList.add('body-drop');
      op.append(cap);
      op.classList.add('torn');
      guide.remove();
      fx.burst('#fff8e0', 40, { y: op.getBoundingClientRect().top + 30, speed: 6 });
      await sleep(900);
      if (alive) reveal(res);
    }
  }

  // --- étape 2 : révélation carte par carte ---
  function reveal(res) {
    document.removeEventListener('keydown', keyHandler);
    const all = res.packs.flatMap((p) => p.cards);
    const seq = [...all].sort((a, c) => rarityIndex(a.r) - rarityIndex(c.r));
    const many = res.packs.length > 1;
    st.style.setProperty('--glow', b.color);
    st.innerHTML = `${top(many ? `${res.packs.length} boosters · ${all.length} cartes` : '')}<div class="rays"></div><canvas class="fx"></canvas>
      <div class="stage-mid"><div class="stack"></div></div>
      <div class="stage-bot">
        <div class="hint-line" data-hint>Touche la carte pour la retourner</div>
        <div class="row wrap" style="justify-content:center">
          <button class="btn sm" data-skip>Passer à la prochaine Épique ou mieux</button>
          <button class="btn sm" data-all>Tout révéler</button>
        </div>
        <div class="counter" data-ctr></div>
        <div class="hint-line mut" style="font-size:12px"><kbd>Espace</kbd> suivante · maintenir : avance rapide</div>
      </div>`;
    fx = new Particles($('canvas.fx', st));
    const stack = $('.stack', st);
    // première carte au-dessus
    stack.innerHTML = seq.map((c, i) => `<div class="sc" data-i="${i}" style="z-index:${seq.length - i};transform:translate(${(i % 3 - 1) * 3}px, ${Math.min(i, 6) * 2}px) rotate(${((i * 37) % 7) - 3}deg)">
      <div class="flipcard">${backHTML()}<div class="face">${cardHTML(c.n, { lg: true, eager: true })}</div></div></div>`).join('');
    let idx = 0, busy = false, flipped = false;
    const ctr = $('[data-ctr]', st), hint = $('[data-hint]', st);
    const upd = () => { ctr.textContent = `${Math.min(idx + 1, seq.length)} / ${seq.length}`; };
    upd();

    async function flip(fast = false) {
      if (busy || idx >= seq.length) return;
      busy = true;
      const c = seq[idx];
      const el = stack.children[idx];
      const col = RARITY[c.r].color;
      const charge = fast ? 0 : CHARGE[c.r];
      st.style.setProperty('--glow', col);
      if (charge) {
        el.style.setProperty('--cd', `${charge}ms`);
        el.style.setProperty('--glow', col);
        el.classList.add('charge');
        sfx.charge(charge / 1000);
        if (rarityIndex(c.r) >= 3) $('.rays', st).classList.add('on');
        if (c.r === 'M' || c.r === 'L') { vibrate([20, 40, 20, 40, 20]); setTimeout(() => el.classList.add('shake'), charge * 0.55); }
        await sleep(charge);
      }
      el.classList.remove('charge', 'shake');
      el.querySelector('.flipcard').classList.add('up');
      sfx.flip();
      await sleep(fast ? 120 : 260);
      if (rarityIndex(c.r) >= 2) {
        sfx.reveal(c.r);
        const flash = document.createElement('div'); flash.className = 'flash go'; st.append(flash); setTimeout(() => flash.remove(), 800);
        fx.burst(col, c.r === 'M' ? 180 : c.r === 'L' ? 120 : c.r === 'E' ? 70 : 30, { rainbow: c.r === 'M', speed: c.r === 'M' ? 13 : 9 });
        if (rarityIndex(c.r) >= 4) {
          const sh = document.createElement('div'); sh.className = 'shock'; st.querySelector('.stage-mid').append(sh); setTimeout(() => sh.remove(), 900);
          fx.rain(col, c.r === 'M' ? 80 : 40);
          vibrate(c.r === 'M' ? [80, 50, 160] : 80);
        }
      } else if (!fast) sfx.whoosh();
      el.insertAdjacentHTML('beforeend', `<div class="reveal-tag" style="--rc:${col}"><span class="rname">${RARITY[c.r].label}</span>${c.isNew ? '<span class="badge new">Nouveau</span>' : `<span class="badge">×${c.qty}</span>`}</div>`);
      hint.textContent = idx + 1 < seq.length ? 'Glisse ou touche pour la suivante' : 'Touche pour voir le récapitulatif';
      flipped = true;
      busy = false;
    }
    function next(dir = 1) {
      if (busy) return;
      if (!flipped) return flip();
      const el = stack.children[idx];
      el.classList.add('gone');
      if (dir < 0) el.classList.add('l');
      el.querySelector('.reveal-tag')?.remove();
      sfx.whoosh();
      idx++; flipped = false;
      $('.rays', st).classList.remove('on');
      st.style.setProperty('--glow', b.color);
      if (idx >= seq.length) return summary(res);
      upd();
      hint.textContent = 'Touche la carte pour la retourner';
    }
    async function skipLow() {
      // retourne d'un coup tout ce qui est en dessous d'Épique
      while (idx < seq.length && rarityIndex(seq[idx].r) < 3 && alive) {
        if (!flipped) await flip(true);
        next();
        await sleep(60);
      }
      if (idx >= seq.length) return;
      if (!flipped) flip();
    }
    // gestes : toucher, glisser
    let sx = 0, sy = 0;
    stack.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    stack.addEventListener('pointerup', (e) => {
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 40 && flipped) next(dx < 0 ? -1 : 1);
      else next();
    });
    $('[data-all]', st).onclick = () => summary(res);
    $('[data-skip]', st).onclick = () => skipLow();
    // espace : suivante ; maintenu : avance rapide
    let holdTimer = null, holding = false;
    keyHandler = (e) => {
      if (e.key === 'Escape') return summary(res);
      if (e.code !== 'Space' && e.key !== 'Enter' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      if (e.repeat) {
        if (!holding) {
          holding = true;
          holdTimer = setInterval(async () => { if (idx >= seq.length) return clearInterval(holdTimer); if (!flipped) await flip(rarityIndex(seq[idx].r) < 3); else next(); }, 180);
        }
        return;
      }
      next();
    };
    document.addEventListener('keydown', keyHandler);
    document.removeEventListener('keyup', keyUp);
    keyUp = () => { holding = false; clearInterval(holdTimer); };
    document.addEventListener('keyup', keyUp);
  }

  // --- étape 3 : récapitulatif ---
  function summary(res) {
    document.removeEventListener('keydown', keyHandler);
    const all = res.packs.flatMap((p) => p.cards);
    const best = all.reduce((a, c) => (rarityIndex(c.r) > rarityIndex(a.r) ? c : a), all[0]);
    const news = all.filter((c) => c.isNew).length;
    const dups = all.filter((c) => !c.isNew);
    const dupGain = dups.reduce((s, c) => s + RARITY[c.r].recycle, 0);
    const many = all.length > 5;
    st.style.setProperty('--glow', RARITY[best.r].color);
    st.innerHTML = `${top('Récapitulatif')}<canvas class="fx"></canvas>
      <div class="stage-mid" style="overflow:auto;${many ? 'align-items:start;padding-top:10px' : ''}">
        <div class="summary ${many ? 'many' : ''}">${all.map((c, i) => slotHTML(c.n, {
          showQty: false, missing: false,
          extra: c.isNew ? '<span class="badge new" style="position:absolute;top:-8px;left:50%;translate:-50% 0;z-index:9">Nouveau</span>' : '',
        }).replace('class="slot"', `class="slot${c === best ? ' best' : ''}" style="animation-delay:${Math.min(i, 30) * 60}ms"`)).join('')}</div>
      </div>
      <div class="stage-bot">
        <div class="sum-bar"><span><b>${news}</b> nouvelle${news > 1 ? 's' : ''}</span><span><b>${dups.length}</b> doublon${dups.length > 1 ? 's' : ''}${dups.length ? ` → ${gem(dupGain)} au recyclage` : ''}</span>
          <span>Meilleure : <b style="color:${RARITY[best.r].color}">${RARITY[best.r].label}</b></span></div>
        <div class="row wrap" style="justify-content:center">
          ${dups.length ? `<button class="btn" data-recycle>♻ Recycler ces doublons</button>` : ''}
          <button class="btn acc" data-again>Ouvrir un autre</button>
          <a class="btn" href="/collection" data-col>Voir la collection</a>
        </div>
      </div>`;
    fx = new Particles($('canvas.fx', st));
    if (rarityIndex(best.r) >= 3) setTimeout(() => fx.rain(RARITY[best.r].color, 40), 300);
    st.querySelectorAll('.summary .slot').forEach((s) => s.onclick = () => inspect(Number(s.dataset.card)));
    $('[data-again]', st).onclick = () => { fx.destroy(); ready(); };
    $('[data-col]', st).onclick = () => close();
    $('[data-recycle]', st)?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      let gain = 0, count = 0;
      const per = new Map();
      for (const c of dups) per.set(c.n, (per.get(c.n) || 0) + 1);
      try {
        for (const [n, q] of per) {
          const r = await api.post('/recycle', { card: n, qty: q });
          gain += r.gain; count += r.count;
          setUser(r.user);
          const cur = S.coll.get(n); if (cur) cur.qty -= r.count;
        }
        sfx.coin();
        toast(`♻ ${count} doublon${count > 1 ? 's' : ''} recyclé${count > 1 ? 's' : ''} : +${gem(gain)}`, 'ok');
        e.target.remove();
      } catch (err) { toastErr(err); e.target.disabled = false; }
    });
  }

  st.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close();
    if (e.target.closest('[data-rates]')) ratesModal(b);
    const snd = e.target.closest('[data-sound]');
    if (snd) { prefs.set('sound', !prefs.get('sound', true)); snd.innerHTML = prefs.get('sound', true) ? icon.sound : icon.x; }
  });
  ready();
  return close;
}

export { game };

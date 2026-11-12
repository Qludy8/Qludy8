// Générateur de phrases, exercice « reconstituer » et défi du jour.
import { $, $$, esc, shuffle, sfx, haptic, speak, autoSpeak, canSpeak, confetti, countUp, pulse, floatXp, toast, burst, ICONS } from './ui.js';
import { addXp, get, save, dayKey, dayNumber } from './store.js';
import { generate, rng, TENSE_LABEL, STYLE_LABEL, FORM_LABEL } from './generator.js';
import { THEMES } from './content/vocab.js';

const CRITERIA = [
  { key: 'mood', label: 'Ton', options: [['normal', 'Normal'], ['awkward', 'Gênant 😳']],
    help: { normal: 'phrases du quotidien', awkward: 'phrases drôles et embarrassantes (le niveau et le thème sont ignorés)' } },
  { key: 'level', label: 'Niveau', options: [['1', 'Débutant'], ['2', 'Intermédiaire'], ['3', 'Avancé']],
    help: { 1: 'Sujet + verbe', 2: '+ un moment (hier, demain…)', 3: '+ un lieu' } },
  { key: 'theme', label: 'Thème', options: [['all', 'Tous'], ...Object.entries(THEMES).filter(([k]) => k !== 'basics')] },
  { key: 'tense', label: 'Temps', options: [['random', 'Au hasard'], ...Object.entries(TENSE_LABEL)] },
  { key: 'style', label: 'Politesse', options: Object.entries(STYLE_LABEL),
    help: { polite: '-요 : le plus courant', formal: '-니다 : travail, annonces', casual: 'entre amis proches' } },
  { key: 'form', label: 'Forme', options: [['random', 'Au hasard'], ...Object.entries(FORM_LABEL)] },
];
const DEFAULT_CRIT = { mood: 'normal', level: '1', theme: 'all', tense: 'random', style: 'polite', form: 'random' };

let current = null; // dernière phrase générée
let mode = 'read';

// ---------- Exercice : reconstituer la phrase ----------
/** Affiche des étiquettes à remettre dans l'ordre. onSolved(propre) : propre = sans indice ni solution. */
export function reconstruct(box, phrase, onSolved) {
  const tiles = phrase.tiles.map((t, i) => ({ t, i }));
  let order = shuffle(tiles);
  if (tiles.length > 1) while (order.every((x, k) => x.i === k)) order = shuffle(tiles);
  const placed = [];
  let helped = false;
  let solved = false;

  box.innerHTML = `
    <div class="recon">
      <p class="recon-fr">${esc(phrase.fr)}</p>
      <div class="answer-line" aria-label="Ta réponse"></div>
      <div class="bank"></div>
      <div class="recon-tools">
        <button class="btn ghost small hint-btn">Indice</button>
        <button class="btn ghost small sol-btn">Voir la solution</button>
      </div>
    </div>`;
  const line = $('.answer-line', box);
  const bank = $('.bank', box);

  function render() {
    line.innerHTML = placed.map((x, k) => `<button class="chip kr placed" data-k="${k}">${esc(x.t)}</button>`).join('') + (placed.length ? '' : '<span class="placeholder">Touche les mots dans le bon ordre</span>');
    bank.innerHTML = order.map((x, k) => `<button class="chip kr ${placed.includes(x) ? 'used' : ''}" data-k="${k}" style="--i:${k}">${esc(x.t)}</button>`).join('');
  }

  bank.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b || solved) return;
    const x = order[b.dataset.k];
    if (placed.includes(x)) return;
    placed.push(x);
    sfx.tap();
    haptic(5);
    render();
    check();
  });
  line.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b || solved) return;
    placed.splice(Number(b.dataset.k), 1);
    sfx.tap();
    render();
  });
  $('.hint-btn', box).addEventListener('click', () => {
    if (solved) return;
    helped = true;
    // Garde le début correct, retire le reste, puis place le mot suivant.
    let k = 0;
    while (k < placed.length && placed[k].t === phrase.tiles[k]) k++;
    placed.splice(k);
    const next = order.find((x) => !placed.includes(x) && x.t === phrase.tiles[k]);
    if (next) placed.push(next);
    render();
    check();
  });
  $('.sol-btn', box).addEventListener('click', () => {
    if (solved) return;
    helped = true;
    // Recompose la phrase sans réutiliser deux fois la même étiquette (mots identiques possibles).
    const used = new Set();
    placed.splice(0, placed.length, ...phrase.tiles.map((t) => {
      const x = order.find((o) => o.t === t && !used.has(o));
      used.add(x);
      return x;
    }));
    render();
    check();
  });

  function check() {
    if (placed.length !== tiles.length) return;
    const ok = placed.every((x, k) => x.t === phrase.tiles[k]);
    if (ok) {
      solved = true;
      line.classList.add('solved');
      $('.recon-tools', box).remove();
      bank.remove();
      line.insertAdjacentHTML('beforeend', `<span class="end-punct kr">${esc(phrase.end)}</span>`);
      sfx.ok();
      haptic(12);
      burst(line, 16);
      autoSpeak(phrase.kr);
      onSolved?.(!helped, line);
    } else {
      sfx.ko();
      haptic([25, 30, 25]);
      pulse(line, 'shake');
      $$('.placed', line).forEach((b, k) => b.classList.toggle('bad', placed[k].t !== phrase.tiles[k]));
    }
  }

  render();
}

// ---------- Carte de phrase ----------
function phraseCard(p, { roman }) {
  return `
    <div class="phrase-meta">
      <span class="pill">${TENSE_LABEL[p.meta.tense]}</span>
      <span class="pill">${STYLE_LABEL[p.meta.style]}</span>
      <span class="pill">${FORM_LABEL[p.meta.form]}</span>
      ${p.meta.mood === 'awkward' ? '<span class="pill awkward">😳 Gênant</span>' : ''}
    </div>
    <div class="phrase-kr kr">${p.kr.split(' ').map((w, i) => `<span style="--i:${i}">${esc(w)}</span>`).join(' ')}</div>
    ${roman ? `<div class="phrase-rom">${esc(p.rom)}</div>` : ''}
    <div class="phrase-fr">${esc(p.fr)}</div>`;
}

function details(p) {
  return `
    <details class="explain-box">
      <summary>Vocabulaire et grammaire</summary>
      <ul class="gloss">${p.words.map((w) => `<li><button class="link kr say" data-say="${esc(w.kr)}">${esc(w.kr)}</button><span>${esc(w.fr)}</span></li>`).join('')}</ul>
      <ul class="notes">${p.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    </details>`;
}

// ---------- Écran Phrases ----------
export function phrasesScreen(el) {
  const st = get();
  const crit = { ...DEFAULT_CRIT, ...(st.crit || {}) };
  const roman = st.settings.roman;

  el.innerHTML = `
    <div class="screen phrases">
      <details class="card crit" ${st.crit ? '' : 'open'}>
        <summary><span>Critères</span><span class="crit-sum muted"></span></summary>
        ${CRITERIA.map((c) => `
          <div class="crit-group">
            <div class="crit-label">${c.label}<span class="crit-help muted" data-help="${c.key}"></span></div>
            <div class="seg" data-key="${c.key}">
              ${c.options.map(([v, l]) => `<button class="seg-btn" data-v="${v}">${esc(l)}</button>`).join('')}
            </div>
          </div>`).join('')}
      </details>
      <button class="btn primary big gen-btn">${ICONS.shuffle}<span>Générer une phrase</span></button>
      <div class="phrase-zone"></div>
      <section class="journal"></section>
    </div>`;

  const zone = $('.phrase-zone', el);

  function syncCrit() {
    for (const c of CRITERIA) {
      $$(`.seg[data-key="${c.key}"] .seg-btn`, el).forEach((b) => b.classList.toggle('on', b.dataset.v === crit[c.key]));
      const h = $(`[data-help="${c.key}"]`, el);
      if (h) h.textContent = c.help?.[crit[c.key]] ? ' · ' + c.help[crit[c.key]] : '';
    }
    const label = (k) => CRITERIA.find((c) => c.key === k).options.find(([v]) => v === crit[k])[1];
    $('.crit-sum', el).textContent = crit.mood === 'awkward' ? ['Gênant 😳', label('style')].join(' · ') : [label('level'), label('theme'), label('style')].join(' · ');
    el.querySelector('.phrases').classList.toggle('awkward-on', crit.mood === 'awkward');
    for (const k of ['level', 'theme']) $(`.seg[data-key="${k}"]`, el).closest('.crit-group').classList.toggle('dim', crit.mood === 'awkward');
  }
  $$('.seg', el).forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    crit[seg.dataset.key] = b.dataset.v;
    st.crit = { ...crit };
    save();
    sfx.tap();
    syncCrit();
  }));
  syncCrit();

  function showPhrase(animate) {
    if (!current) {
      zone.innerHTML = `<div class="empty muted">Choisis tes critères puis génère une phrase pour t’exercer.</div>`;
      return;
    }
    const p = current;
    const saved = st.journal.some((j) => j.kr === p.kr);
    zone.innerHTML = `
      <div class="card phrase ${animate ? 'pop' : ''}">
        <div class="seg modes">
          <button class="seg-btn ${mode === 'read' ? 'on' : ''}" data-m="read">Lire</button>
          <button class="seg-btn ${mode === 'translate' ? 'on' : ''}" data-m="translate">Traduire</button>
          <button class="seg-btn ${mode === 'build' ? 'on' : ''}" data-m="build">Reconstituer</button>
        </div>
        ${p.adjusted.map((a) => `<p class="note muted">${esc(a)}</p>`).join('')}
        <div class="phrase-body"></div>
        <div class="phrase-actions">
          ${canSpeak() ? `<button class="icon-btn listen" aria-label="Écouter">${ICONS.sound}</button>` : ''}
          <button class="icon-btn fav ${saved ? 'on' : ''}" aria-label="Enregistrer dans le carnet">${ICONS.star}</button>
        </div>
      </div>`;
    const body = $('.phrase-body', zone);
    if (mode === 'read') {
      body.innerHTML = phraseCard(p, { roman }) + details(p);
    } else if (mode === 'translate') {
      body.innerHTML = `
        <p class="prompt-label muted">Traduis en coréen, à l’oral ou sur papier :</p>
        <div class="phrase-fr big">${esc(p.fr)}</div>
        <button class="reveal">
          <div class="blurred">${phraseCard(p, { roman })}</div>
          <span class="reveal-label">Toucher pour voir la réponse</span>
        </button>
        <div class="self-check" hidden>
          <button class="btn ko-btn">À retravailler</button>
          <button class="btn ok-btn">Je l’avais !</button>
        </div>`;
      $('.reveal', body).addEventListener('click', (e) => {
        const r = e.currentTarget;
        if (r.classList.contains('shown')) return;
        r.classList.add('shown');
        speak(p.kr);
        $('.self-check', body).hidden = false;
        body.insertAdjacentHTML('beforeend', details(p));
      });
      $$('.self-check .btn', body).forEach((b) => b.addEventListener('click', () => {
        const ok = b.classList.contains('ok-btn');
        if (ok) {
          addXp(3);
          floatXp(3, b);
          sfx.ok();
        } else sfx.tap();
        $('.self-check', body).innerHTML = `<p class="muted">${ok ? 'Bien joué ! 👏' : 'Pas grave : génère-en une autre ou passe en mode Reconstituer.'}</p>`;
      }));
    } else {
      reconstruct(body, p, (clean, line) => {
        const xp = clean ? 5 : 2;
        addXp(xp);
        floatXp(xp, line);
        body.insertAdjacentHTML('beforeend', `${roman ? `<div class="phrase-rom">${esc(p.rom)}</div>` : ''}${details(p)}`);
      });
    }
    $$('.modes .seg-btn', zone).forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.m;
      sfx.tap();
      showPhrase(false);
    }));
    $('.listen', zone)?.addEventListener('click', () => speak(p.kr));
    $('.fav', zone).addEventListener('click', (e) => {
      const b = e.currentTarget;
      const k = st.journal.findIndex((j) => j.kr === p.kr);
      if (k >= 0) st.journal.splice(k, 1);
      else st.journal.unshift({ kr: p.kr, fr: p.fr, rom: p.rom, date: dayKey() });
      save();
      b.classList.toggle('on', k < 0);
      pulse(b, 'bump');
      haptic(8);
      toast(k < 0 ? 'Ajoutée au carnet' : 'Retirée du carnet');
      renderJournal();
    });
  }

  zone.addEventListener('click', (e) => {
    const s = e.target.closest('.say');
    if (s) speak(s.dataset.say);
  });

  $('.gen-btn', el).addEventListener('click', (e) => {
    const b = e.currentTarget;
    pulse(b, 'spin');
    sfx.tap();
    haptic(6);
    current = generate(crit);
    $('.crit', el).open = false;
    showPhrase(true);
    if (mode !== 'translate') autoSpeak(current.kr);
    zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  function renderJournal() {
    const j = $('.journal', el);
    if (!st.journal.length) {
      j.innerHTML = '';
      return;
    }
    j.innerHTML = `
      <h2>Mon carnet <span class="muted">· ${st.journal.length}</span></h2>
      <ul class="list">
        ${st.journal.map((x, k) => `
          <li class="row" style="--i:${Math.min(k, 10)}">
            <button class="row-main say-row" data-k="${k}">
              <span class="kr">${esc(x.kr)}</span>
              <span class="muted small">${esc(x.fr)}</span>
            </button>
            <button class="icon-btn del" data-k="${k}" aria-label="Supprimer">${ICONS.trash}</button>
          </li>`).join('')}
      </ul>`;
  }
  $('.journal', el).addEventListener('click', (e) => {
    const s = e.target.closest('.say-row');
    if (s) speak(st.journal[s.dataset.k].kr);
    const d = e.target.closest('.del');
    if (d) {
      const li = d.closest('li');
      li.classList.add('removing');
      setTimeout(() => {
        st.journal.splice(Number(d.dataset.k), 1);
        save();
        renderJournal();
        if (current) showPhrase(false);
      }, 220);
    }
  });

  showPhrase(false);
  renderJournal();
}

// ---------- Défi du jour ----------
export function dailyPhrases(date = new Date()) {
  const r = rng(dayNumber(date) * 7919);
  return [1, 2, 3].map((level) => generate({ level, style: 'polite', tense: 'random', form: 'random', theme: 'all' }, r));
}

export function phraseOfDay() {
  return generate({ level: 2, style: 'polite' }, rng(dayNumber() * 104729 + 1));
}

export function dailyScreen(el) {
  const st = get();
  const key = dayKey();
  const list = dailyPhrases();
  const already = (st.daily[key] || 0) >= list.length;
  let i = 0;
  let clean = 0;

  function show() {
    el.innerHTML = `
      <div class="screen daily">
        <div class="dots">${list.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'cur' : ''}"></i>`).join('')}</div>
        <p class="muted center">Phrase ${i + 1} sur ${list.length} · remets les mots dans l’ordre</p>
        <div class="card daily-card pop"></div>
        <button class="btn primary next" hidden>${i + 1 < list.length ? 'Phrase suivante' : 'Terminer'}</button>
      </div>`;
    const p = list[i];
    reconstruct($('.daily-card', el), p, (ok) => {
      if (ok) clean++;
      $('.daily-card', el).insertAdjacentHTML('beforeend', (get().settings.roman ? `<div class="phrase-rom">${esc(p.rom)}</div>` : '') + details(p));
      const n = $('.next', el);
      n.hidden = false;
      n.classList.add('pop');
    });
    $('.daily-card', el).addEventListener('click', (e) => {
      const s = e.target.closest('.say');
      if (s) speak(s.dataset.say);
    });
    $('.next', el).addEventListener('click', () => {
      i++;
      if (i < list.length) show();
      else finish();
    });
  }

  function finish() {
    const xp = already ? 0 : 10 + clean * 2;
    if (!already) {
      st.daily[key] = list.length;
      save();
      addXp(xp);
    }
    sfx.win();
    confetti();
    el.innerHTML = `
      <div class="result screen">
        <div class="big-emoji">🌸</div>
        <h2>Défi du jour terminé !</h2>
        <p class="muted">${clean} phrase${clean > 1 ? 's' : ''} sur ${list.length} sans aide. Reviens demain pour de nouvelles phrases.</p>
        ${xp ? '<div class="xp-won">+<span class="n">0</span> XP</div>' : '<p class="muted">Déjà validé aujourd’hui : pas de XP en plus, mais bel entraînement !</p>'}
        <div class="stack">
          <a class="btn primary" href="#/phrases">Générer d’autres phrases</a>
          <a class="btn ghost" href="#/home">Accueil</a>
        </div>
      </div>`;
    if (xp) countUp($('.xp-won .n', el), xp);
  }

  show();
}

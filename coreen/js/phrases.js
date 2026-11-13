// Générateur de phrases, exercice « reconstituer » et défi du jour.
import { $, $$, esc, shuffle, sfx, speak, autoSpeak, canSpeak, confetti, countUp, pulse, floatXp, toast, burst, ICONS } from './ui.js';
import { addXp, get, save, dayKey, markRoad, starsFor, bump } from './store.js';
import { mountTyping, normAnswer } from './keyboard.js';
import { generate, TENSE_LABEL, STYLE_LABEL, FORM_LABEL } from './generator.js';
import { THEMES } from './content/concepts.js';
import { course, t, tr, lang } from './course.js';

const STYLE_HELP = {
  ko: { polite: { fr: '-요 : le plus courant', en: '-요: the most common' }, formal: { fr: '-니다 : travail, annonces', en: '-니다: work, announcements' }, casual: { fr: 'entre amis proches', en: 'between close friends' } },
  ja: { polite: { fr: 'です・ます : le plus courant', en: 'です・ます: the most common' }, casual: { fr: 'forme simple, entre amis', en: 'plain form, between friends' } },
};

function criteria() {
  const C = course();
  return [
    { key: 'mood', label: t('crit.tone'), options: [['normal', t('crit.normal')], ['awkward', t('crit.awkward')]],
      help: { normal: t('crit.normalHelp'), awkward: t('crit.awkwardHelp') } },
    { key: 'level', label: t('crit.level'), options: [['1', t('crit.beginner')], ['2', t('crit.intermediate')], ['3', t('crit.advanced')]],
      help: { 1: t('crit.l1'), 2: t('crit.l2'), 3: t('crit.l3') } },
    { key: 'theme', label: t('crit.theme'), options: [['all', t('all')], ...Object.entries(THEMES).filter(([k]) => k !== 'basics').map(([k, v]) => [k, tr(v)])] },
    { key: 'tense', label: t('crit.tense'), options: [['random', t('crit.random')], ...Object.entries(TENSE_LABEL).map(([k, v]) => [k, tr(v)])] },
    { key: 'style', label: t('crit.style'), options: C.styles.map((k) => [k, tr(STYLE_LABEL[k])]),
      help: Object.fromEntries(Object.entries(STYLE_HELP[C.id]).map(([k, v]) => [k, tr(v)])) },
    { key: 'form', label: t('crit.form'), options: [['random', t('crit.random')], ...Object.entries(FORM_LABEL).map(([k, v]) => [k, tr(v)])] },
    { key: 'kind', label: t('crit.kind'), options: [['random', t('crit.random')], ['obj', t('crit.kObj')], ['go', t('crit.kGo')], ['act', t('crit.kAct')], ['adj', t('crit.kAdj')]],
      help: { obj: t('crit.kObjHelp'), go: t('crit.kGoHelp'), act: t('crit.kActHelp'), adj: t('crit.kAdjHelp') } },
    { key: 'subj', label: t('crit.subj'), options: [['random', t('crit.random')], ['me', t('crit.sMe')], ['friend', t('crit.sFriend')], ['we', t('crit.sWe')]],
      help: { me: t('crit.subjHelp'), friend: t('crit.subjHelp'), we: t('crit.subjHelp') } },
    { key: 'time', label: t('crit.time'), options: [['auto', t('crit.tAuto')], ['yes', t('crit.tYes')], ['no', t('crit.tNo')]],
      help: { auto: t('crit.tAutoHelp') } },
  ];
}
const DEFAULT_CRIT = { mood: 'normal', level: '1', theme: 'all', tense: 'random', style: 'polite', form: 'random', kind: 'random', subj: 'random', time: 'auto' };

let current = null; // dernière phrase générée
let currentCourse = null;
let mode = 'read';

/** Traduction de la phrase dans la langue de l'interface. */
export const meaning = (p) => (lang() === 'en' ? p.en : p.fr);
const hasKanji = (s) => /[一-龯]/.test(s);

/** Furigana seulement au-dessus des kanji : 食べます → 食(た)べます, お母さん → お母(かあ)さん. */
function rubyWord(w, r) {
  if (!hasKanji(w)) return esc(w);
  let a = 0;
  while (a < w.length && a < r.length && w[a] === r[a]) a++;
  let z = 0;
  while (z < w.length - a && z < r.length - a && w[w.length - 1 - z] === r[r.length - 1 - z]) z++;
  return `${esc(w.slice(0, a))}<ruby>${esc(w.slice(a, w.length - z))}<rt>${esc(r.slice(a, r.length - z))}</rt></ruby>${esc(w.slice(w.length - z))}`;
}

// ---------- Exercice : reconstituer la phrase ----------
/**
 * Affiche des étiquettes à remettre dans l'ordre. onSolved(propre) : propre = sans indice ni solution.
 * strict (examen) : pas d'aide, et une phrase fausse une fois complète appelle onFail.
 */
export function reconstruct(box, phrase, onSolved, { strict = false, onFail } = {}) {
  const tiles = phrase.tiles.map((x, i) => ({ t: x, i }));
  let order = shuffle(tiles);
  if (tiles.length > 1) while (order.every((x, k) => x.i === k)) order = shuffle(tiles);
  const placed = [];
  let helped = false;
  let solved = false;

  box.innerHTML = `
    <div class="recon">
      <p class="recon-fr">${esc(meaning(phrase))}</p>
      <div class="answer-line" aria-label="${t('recon.answer')}"></div>
      <div class="bank"></div>
      <div class="recon-tools" ${strict ? 'hidden' : ''}>
        <button class="btn ghost small hint-btn">${t('recon.hint')}</button>
        <button class="btn ghost small sol-btn">${t('recon.solution')}</button>
      </div>
    </div>`;
  const line = $('.answer-line', box);
  const bank = $('.bank', box);

  function render() {
    line.innerHTML = placed.map((x, k) => `<button class="chip kr placed" data-k="${k}">${esc(x.t)}</button>`).join('') + (placed.length ? '' : `<span class="placeholder">${t('recon.placeholder')}</span>`);
    bank.innerHTML = order.map((x, k) => `<button class="chip kr ${placed.includes(x) ? 'used' : ''}" data-k="${k}" style="--i:${k}">${esc(x.t)}</button>`).join('');
  }

  // Glisser-déposer : on attrape une étiquette (dans la réserve ou dans la réponse) et on la pose où l'on veut.
  // Un simple toucher fonctionne toujours : il ajoute l'étiquette à la fin, ou la retire.
  let dragged = false; // un glisser vient de se terminer : le « clic » qui suit est ignoré
  box.querySelector('.recon').addEventListener('pointerdown', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || solved || chip.classList.contains('used')) return;
    const fromLine = chip.classList.contains('placed');
    const item = fromLine ? placed[chip.dataset.k] : order[chip.dataset.k];
    const x0 = e.clientX;
    const y0 = e.clientY;
    let ghost = null;
    let mark = null;
    let index = -1;
    const others = () => $$('.placed', line).filter((c) => c !== chip);
    const move = (ev) => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
        const r = chip.getBoundingClientRect();
        ghost = chip.cloneNode(true);
        ghost.classList.add('drag-ghost');
        ghost.style.width = `${r.width}px`;
        ghost.dataset.dx = x0 - r.left;
        ghost.dataset.dy = y0 - r.top;
        document.body.append(ghost);
        chip.classList.add('dragging');
        mark = document.createElement('i');
        mark.className = 'drop-mark';
      }
      ev.preventDefault();
      ghost.style.left = `${ev.clientX - ghost.dataset.dx}px`;
      ghost.style.top = `${ev.clientY - ghost.dataset.dy}px`;
      const lr = line.getBoundingClientRect();
      const over = ev.clientX > lr.left - 24 && ev.clientX < lr.right + 24 && ev.clientY > lr.top - 34 && ev.clientY < lr.bottom + 34;
      line.classList.toggle('drop-on', over);
      if (!over) {
        index = -1;
        mark.remove();
        return;
      }
      // Place d'insertion : après toutes les étiquettes situées avant le doigt (ordre de lecture)
      const list = others();
      index = list.filter((c) => {
        const r = c.getBoundingClientRect();
        return ev.clientY > r.bottom || (ev.clientY >= r.top && ev.clientX > r.left + r.width / 2);
      }).length;
      if (list[index]) list[index].before(mark);
      else line.append(mark);
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      if (!ghost) return;
      ghost.remove();
      mark.remove();
      line.classList.remove('drop-on');
      dragged = true;
      setTimeout(() => { dragged = false; }, 60);
      const at = placed.indexOf(item);
      if (at >= 0) placed.splice(at, 1);
      if (index >= 0) placed.splice(index, 0, item);
      sfx.tap();
      render();
      if (index >= 0) check();
    };
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  });

  bank.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b || solved || dragged) return;
    const x = order[b.dataset.k];
    if (placed.includes(x)) return;
    placed.push(x);
    sfx.tap();
    render();
    check();
  });
  line.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b || solved || dragged) return;
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
    placed.splice(0, placed.length, ...phrase.tiles.map((x) => {
      const o = order.find((y) => y.t === x && !used.has(y));
      used.add(o);
      return o;
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
      burst(line, 16);
      autoSpeak(phrase.tl);
      if (!strict) bump('phrases');
      onSolved?.(!helped, line);
    } else {
      $$('.placed', line).forEach((b, k) => b.classList.toggle('bad', placed[k].t !== phrase.tiles[k]));
      if (strict) {
        solved = true;
        return onFail?.();
      }
      sfx.ko();
      pulse(line, 'shake');
    }
  }

  render();
}

/** Lecture attendue quand on écrit la phrase au clavier (en japonais : tout en kana). */
export const phraseAnswer = (p) => p.reading || p.tl;

/**
 * Écrire la phrase entière au clavier, à partir de sa traduction (et de la voix).
 * onSolved(propre) : propre = sans indice ni solution.
 */
export function typePhrase(box, phrase, onSolved) {
  const C = course();
  const target = phraseAnswer(phrase).replace(/[.?。？]$/, '');
  let helped = false;
  let tries = 0;
  box.innerHTML = `
    <div class="recon type-phrase">
      <p class="recon-fr">${esc(meaning(phrase))}</p>
      <p class="muted small type-help">${t(C.id === 'ja' ? 'type.phraseKana' : 'type.phrase')}</p>
      <div class="type-host"></div>
      <div class="type-actions">
        ${canSpeak() ? `<button class="icon-btn listen-btn" aria-label="${t('listen')}">${ICONS.sound}</button>` : ''}
        <button class="btn ghost small hint-btn">${t('recon.hint')}</button>
        <button class="btn ghost small sol-btn">${t('recon.solution')}</button>
        <button class="btn primary check-btn" disabled>${t('type.check')}</button>
      </div>
    </div>`;
  const check = () => {
    if (!normAnswer(typing.value)) return;
    if (normAnswer(typing.value) === normAnswer(target)) {
      typing.kb.lock(true);
      typing.box.classList.add('good');
      for (const sel of ['.type-actions', '.kb-host', '.type-help']) $(sel, box).hidden = true;
      $('.type-text', box).textContent = phrase.tl;
      sfx.ok();
      burst(typing.box, 16);
      autoSpeak(phrase.tl);
      bump('typed');
      bump('phrases');
      onSolved?.(!helped, typing.box);
    } else {
      tries++;
      sfx.ko();
      typing.box.classList.add('bad');
      pulse(typing.box, 'shake');
      if (tries >= 2) pulse($('.hint-btn', box), 'bump');
    }
  };
  const typing = mountTyping($('.type-host', box), {
    kind: C.id, space: C.id === 'ko', placeholder: esc(t('type.placeholder')), onEnter: check,
    onChange: (v) => { $('.check-btn', box).disabled = !v; },
  });
  $('.check-btn', box).addEventListener('click', check);
  $('.listen-btn', box)?.addEventListener('click', () => { helped = true; speak(phrase.tl); });
  $('.hint-btn', box).addEventListener('click', () => {
    // Garde le début juste, puis complète jusqu'à la fin du mot suivant.
    helped = true;
    const cur = typing.value;
    let k = 0;
    while (k < cur.length && k < target.length && normAnswer(cur.slice(0, k + 1)) === normAnswer(target.slice(0, k + 1))) k++;
    const sep = phrase.reading ? 0 : 1;
    const words = phrase.reading ? phrase.ruby.map((x) => x.r + (x.p || '')) : target.split(' ');
    let end = 0;
    for (const w of words) {
      end += w.length + sep;
      if (end > k + sep) break;
    }
    typing.kb.set(target.slice(0, Math.min(end, target.length)));
    sfx.tap();
  });
  $('.sol-btn', box).addEventListener('click', () => {
    helped = true;
    typing.kb.set(target);
    check();
  });
}

// ---------- Carte de phrase ----------
/** Texte de la phrase, mot par mot (avec furigana au-dessus des kanji en japonais). */
export function phraseText(p) {
  if (p.ruby) {
    return p.ruby.map((x, i) => `<span style="--i:${i}">${rubyWord(x.w, x.r)}${esc(x.p || '')}</span>`).join('') + esc(p.end);
  }
  return p.tl.split(' ').map((w, i) => `<span style="--i:${i}">${esc(w)}</span>`).join(' ');
}

function phraseCard(p, { roman }) {
  return `
    <div class="phrase-meta">
      <span class="pill">${tr(TENSE_LABEL[p.meta.tense])}</span>
      <span class="pill">${tr(STYLE_LABEL[p.meta.style])}</span>
      <span class="pill">${tr(FORM_LABEL[p.meta.form])}</span>
      ${p.meta.mood === 'awkward' ? `<span class="pill awkward">${t('crit.awkward')}</span>` : ''}
    </div>
    <div class="phrase-kr kr ${p.ruby ? 'has-ruby' : ''}">${phraseText(p)}</div>
    ${roman ? `<div class="phrase-rom">${esc(p.rom)}</div>` : ''}
    <div class="phrase-fr">${esc(meaning(p))}</div>`;
}

export function details(p) {
  return `
    <details class="explain-box">
      <summary>${t('phrase.details')}</summary>
      <ul class="gloss">${p.words.map((w) => `<li><button class="link kr say" data-say="${esc(w.tl)}">${esc(w.tl)}${w.r && w.r !== w.tl ? `<small class="g-read">${esc(w.r)}</small>` : ''}</button><span>${esc(tr(w))}</span></li>`).join('')}</ul>
      <ul class="notes">${p.notes.map((n) => `<li>${esc(tr(n))}</li>`).join('')}</ul>
    </details>`;
}

// ---------- Écran Phrases ----------
export function phrasesScreen(el) {
  const st = get();
  const C = course();
  if (currentCourse !== C.id) {
    current = null;
    currentCourse = C.id;
  }
  const CRITERIA = criteria();
  const crit = { ...DEFAULT_CRIT, ...(st.crit || {}) };
  if (!C.styles.includes(crit.style)) crit.style = 'polite';
  const roman = st.settings.roman;

  el.innerHTML = `
    <div class="screen phrases">
      <details class="card crit" ${st.crit ? '' : 'open'}>
        <summary><span>${t('crit.title')}</span><span class="crit-sum muted"></span></summary>
        ${CRITERIA.map((c) => `
          <div class="crit-group">
            <div class="crit-label">${c.label}<span class="crit-help muted" data-help="${c.key}"></span></div>
            <div class="seg" data-key="${c.key}">
              ${c.options.map(([v, l]) => `<button class="seg-btn" data-v="${v}">${esc(l)}</button>`).join('')}
            </div>
          </div>`).join('')}
      </details>
      <button class="btn primary big gen-btn">${ICONS.shuffle}<span>${t('phrase.generate')}</span></button>
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
    const label = (k) => CRITERIA.find((c) => c.key === k).options.find(([v]) => v === crit[k])?.[1] ?? '';
    $('.crit-sum', el).textContent = crit.mood === 'awkward' ? [t('crit.awkward'), label('style')].join(' · ') : [label('level'), label('theme'), label('style')].join(' · ');
    el.querySelector('.phrases').classList.toggle('awkward-on', crit.mood === 'awkward');
    for (const k of ['level', 'theme', 'kind', 'subj', 'time']) $(`.seg[data-key="${k}"]`, el).closest('.crit-group').classList.toggle('dim', crit.mood === 'awkward');
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
      zone.innerHTML = `<div class="empty muted">${t('phrase.empty')}</div>`;
      return;
    }
    const p = current;
    const same = (j) => (j.tl || j.kr) === p.tl;
    const saved = st.journal.some(same);
    zone.innerHTML = `
      <div class="card phrase ${animate ? 'pop' : ''}">
        <div class="seg modes">
          <button class="seg-btn ${mode === 'read' ? 'on' : ''}" data-m="read">${t('phrase.read')}</button>
          <button class="seg-btn ${mode === 'translate' ? 'on' : ''}" data-m="translate">${t('phrase.translate')}</button>
          <button class="seg-btn ${mode === 'build' ? 'on' : ''}" data-m="build">${t('phrase.build')}</button>
          <button class="seg-btn ${mode === 'write' ? 'on' : ''}" data-m="write">${t('phrase.write')}</button>
        </div>
        ${p.adjusted.map((a) => `<p class="note muted">${esc(tr(a))}</p>`).join('')}
        <div class="phrase-body"></div>
        <div class="phrase-actions">
          ${canSpeak() ? `<button class="icon-btn listen" aria-label="${t('listen')}">${ICONS.sound}</button>` : ''}
          <button class="icon-btn fav ${saved ? 'on' : ''}" aria-label="${t('phrase.save')}">${ICONS.star}</button>
        </div>
      </div>`;
    const body = $('.phrase-body', zone);
    if (mode === 'read') {
      body.innerHTML = phraseCard(p, { roman }) + details(p);
    } else if (mode === 'translate') {
      body.innerHTML = `
        <p class="prompt-label muted">${t('phrase.translatePrompt', { lang: tr(C.name).toLowerCase() })}</p>
        <div class="phrase-fr big">${esc(meaning(p))}</div>
        <button class="reveal">
          <div class="blurred">${phraseCard(p, { roman })}</div>
          <span class="reveal-label">${t('phrase.reveal')}</span>
        </button>
        <div class="self-check" hidden>
          <button class="btn ko-btn">${t('phrase.rework')}</button>
          <button class="btn ok-btn">${t('phrase.gotIt')}</button>
        </div>`;
      $('.reveal', body).addEventListener('click', (e) => {
        const r = e.currentTarget;
        if (r.classList.contains('shown')) return;
        r.classList.add('shown');
        speak(p.tl);
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
        $('.self-check', body).innerHTML = `<p class="muted">${ok ? t('phrase.wellDone') : t('phrase.noWorries')}</p>`;
      }));
    } else if (mode === 'write') {
      typePhrase(body, p, (clean, line) => {
        const xp = clean ? 8 : 3;
        addXp(xp);
        floatXp(xp, line);
        body.insertAdjacentHTML('beforeend', `${p.ruby ? `<div class="phrase-kr kr has-ruby small-ruby">${phraseText(p)}</div>` : ''}${roman ? `<div class="phrase-rom">${esc(p.rom)}</div>` : ''}${details(p)}`);
      });
    } else {
      reconstruct(body, p, (clean, line) => {
        const xp = clean ? 5 : 2;
        addXp(xp);
        floatXp(xp, line);
        body.insertAdjacentHTML('beforeend', `${p.ruby ? `<div class="phrase-kr kr has-ruby small-ruby">${phraseText(p)}</div>` : ''}${roman ? `<div class="phrase-rom">${esc(p.rom)}</div>` : ''}${details(p)}`);
      });
    }
    $$('.modes .seg-btn', zone).forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.m;
      sfx.tap();
      showPhrase(false);
    }));
    $('.listen', zone)?.addEventListener('click', () => speak(p.tl));
    $('.fav', zone).addEventListener('click', (e) => {
      const b = e.currentTarget;
      const k = st.journal.findIndex(same);
      if (k >= 0) st.journal.splice(k, 1);
      else st.journal.unshift({ tl: p.tl, fr: p.fr, en: p.en, rom: p.rom, date: dayKey() });
      save();
      b.classList.toggle('on', k < 0);
      pulse(b, 'bump');
      toast(k < 0 ? t('journal.added') : t('journal.removed'));
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
    current = generate(crit, Math.random, course());
    $('.crit', el).open = false;
    showPhrase(true);
    if (mode === 'read' || mode === 'build') autoSpeak(current.tl);
    zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  function renderJournal() {
    const j = $('.journal', el);
    if (!st.journal.length) {
      j.innerHTML = '';
      return;
    }
    j.innerHTML = `
      <h2>${t('journal.title')} <span class="muted">· ${st.journal.length}</span></h2>
      <ul class="list">
        ${st.journal.map((x, k) => `
          <li class="row" style="--i:${Math.min(k, 10)}">
            <button class="row-main say-row" data-k="${k}">
              <span class="kr">${esc(x.tl || x.kr)}</span>
              <span class="muted small">${esc(lang() === 'en' && x.en ? x.en : x.fr)}</span>
            </button>
            <button class="icon-btn del" data-k="${k}" aria-label="${t('delete')}">${ICONS.trash}</button>
          </li>`).join('')}
      </ul>`;
  }
  $('.journal', el).addEventListener('click', (e) => {
    const s = e.target.closest('.say-row');
    if (s) {
      const x = st.journal[s.dataset.k];
      speak(x.tl || x.kr);
      pulse(s.closest('li'), 'flash');
    }
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

// ---------- Séries de phrases (étapes du parcours) ----------
/** Série de phrases à reconstituer (ou à écrire au clavier), l'une après l'autre. onEnd(nombre de phrases réussies sans aide). */
function phraseSeries(el, list, onEnd, typed = false) {
  let i = 0;
  let clean = 0;
  function show() {
    el.innerHTML = `
      <div class="screen daily">
        <div class="dots">${list.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'cur' : ''}"></i>`).join('')}</div>
        <p class="muted center">${t(typed ? 'daily.progressType' : 'daily.progress', { n: i + 1, total: list.length })}</p>
        <div class="card daily-card pop"></div>
        <button class="btn primary next" hidden>${i + 1 < list.length ? t('daily.next') : t('finish')}</button>
      </div>`;
    const p = list[i];
    (typed ? typePhrase : reconstruct)($('.daily-card', el), p, (ok) => {
      if (ok) clean++;
      $('.daily-card', el).insertAdjacentHTML('beforeend', (p.ruby ? `<div class="phrase-kr kr has-ruby small-ruby">${phraseText(p)}</div>` : '') + (get().settings.roman ? `<div class="phrase-rom">${esc(p.rom)}</div>` : '') + details(p));
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
      else onEnd(clean);
    });
  }
  show();
}

/** Phrase générée selon les critères d'une étape du parcours (sert aussi aux examens). */
export const phraseFor = (crit) => generate({ ...DEFAULT_CRIT, ...crit }, Math.random, course());

/** Étape « phrases » du parcours : trois phrases selon les critères de l'étape (à reconstituer, ou à écrire pour « ptype »). */
export function roadPhrases(el, step) {
  const C = course();
  const typed = step.kind === 'ptype';
  const list = [1, 2, 3].map(() => phraseFor(step.crit));
  phraseSeries(el, list, (clean) => {
    const xp = (typed ? 10 : 6) + clean * (typed ? 3 : 2);
    addXp(xp);
    markRoad(step.id, starsFor(clean / list.length));
    sfx.win();
    confetti();
    el.innerHTML = `
      <div class="result screen">
        <div class="big-glyph kr">${C.id === 'ja' ? '完了！' : '완료!'}</div>
        <h2>${esc(tr(step.title))}</h2>
        <p class="muted">${t('daily.summary', { n: clean, total: list.length })}</p>
        <div class="xp-won">+<span class="n">0</span> XP</div>
        <div class="stack">
          <button class="btn primary again">${t('playAgain')}</button>
          <a class="btn ghost" href="#/road">${t('road.back')}</a>
        </div>
      </div>`;
    countUp($('.xp-won .n', el), xp);
    $('.again', el).addEventListener('click', () => roadPhrases(el, step));
  }, typed);
}

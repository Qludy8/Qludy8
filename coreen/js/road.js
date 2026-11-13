// Parcours : chapitres, modules et étapes de difficulté croissante, examens de module et examen final.
import { $, $$, esc, sfx, celebrate, ICONS } from './ui.js';
import * as store from './store.js';
import { course, t, tr, lang } from './course.js';
import { ALL_THEMES, themeGlyph, themeShort } from './content/lexicon.js';
import { ROADMAP, CHAPTERS } from './content/roadmap.js';

export const roadUnits = () => ROADMAP[course().id] || [];
export const roadChapters = () => CHAPTERS[course().id] || [];
export const findStep = (id) => roadUnits().flatMap((u) => u.steps).find((s) => s.id === id);
/** Avancement d'une étape dans le parcours, de 0 (premier module) à 1 (dernier) : sert à durcir les exercices. */
export function stepDepth(id) {
  const units = roadUnits();
  const k = units.findIndex((u) => u.steps.some((s) => s.id === id));
  return k < 0 || units.length < 2 ? 0 : k / (units.length - 1);
}

const UNIT_BONUS = 15; // XP offerts à la fin d'un module
const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const GEM = '<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3 7 9l5 12 5-12-2-6"/></svg>';

const lessons = () => course().guide[lang()] || course().guide.fr;

// Étape « objectif » : retenir 60 % des mots d'un thème (boîte 2 ou plus dans la répétition espacée).
const GOAL_RATIO = 0.6;
const GOAL_BOX = 2;
function goal(theme, st = store.get()) {
  const ws = course().words.filter((w) => w.t === theme);
  return { n: Math.min(Math.ceil(ws.length * GOAL_RATIO), ws.filter((w) => (st.srs?.[w.id]?.b ?? -1) >= GOAL_BOX).length), total: Math.ceil(ws.length * GOAL_RATIO) };
}

/** Une étape est-elle terminée ? Les leçons, les paires et le défi se lisent dans la progression existante. */
export function stepDone(s, st = store.get()) {
  if (s.kind === 'lesson') return !!st.read?.[s.lesson];
  if (s.kind === 'pairs') return !!st.best?.pairs;
  if (s.kind === 'mastery') { const g = goal(s.theme, st); return g.total > 0 && g.n >= g.total; }
  return !!st.road?.[s.id];
}
const STARRED = ['script', 'words', 'cards', 'phrase', 'write', 'type', 'dictation', 'ptype', 'speak'];
const stars = (s, st) => (STARRED.includes(s.kind) ? st.road?.[s.id] || 0 : 0);

/** Titre, type, pastille et adresse d'une étape. */
export function stepInfo(s) {
  const C = course();
  const ja = C.id === 'ja';
  const q = `step=${s.id}`;
  if (s.kind === 'lesson') {
    const g = lessons().find((x) => x.id === s.lesson);
    return { title: g?.title || s.lesson, type: t('road.lesson'), glyph: g?.glyph || '?', href: `#/guide?id=${s.lesson}&${q}` };
  }
  if (s.kind === 'script' || s.kind === 'write' || ((s.kind === 'type' || s.kind === 'speak') && s.set)) {
    const set = C.script.sets[s.set];
    let title = set ? tr(set.label) : s.set === 'syllables' ? tr(C.script.syllableLabel) : t('script.words');
    let glyph = set ? set.items[0].j : s.set === 'syllables' ? C.script.syllableSample.slice(0, 2) : ja ? 'さかな' : '사과';
    if (s.kind === 'write') {
      if (s.form === 'kata') glyph = set.items[0].j2;
      if (s.form) title = `${title} · ${s.form === 'kata' ? 'katakana' : 'hiragana'}`;
      return { title, type: t('road.write'), glyph, href: `#/write?set=${s.set}${s.form ? `&form=${s.form}` : ''}&${q}` };
    }
    if (s.kind === 'type') return { title, type: s.set === 'words' ? t('road.dictation') : t('road.type'), glyph, href: `#/hquiz?set=${s.set}&mode=type&${q}` };
    if (s.kind === 'speak') return { title, type: t('road.speak'), glyph, href: `#/hquiz?set=${s.set}&mode=speak&${q}` };
    return { title, type: t('road.quiz'), glyph, href: `#/hquiz?set=${s.set}&${q}` };
  }
  if (s.theme) {
    const glyph = themeGlyph(s.theme, ja);
    const title = themeShort(tr(ALL_THEMES[s.theme]));
    if (s.kind === 'mastery') return { title, type: t('road.goal', goal(s.theme)), glyph, href: `#/quiz?t=${s.theme}&${q}` };
    if (s.kind === 'cards') return { title, type: t('road.cards'), glyph, href: `#/cards?t=${s.theme}&${q}` };
    if (s.kind === 'type') return { title, type: t('road.type'), glyph, href: `#/quiz?t=${s.theme}&mode=type&${q}` };
    if (s.kind === 'dictation') return { title, type: t('road.dictation'), glyph, href: `#/quiz?t=${s.theme}&mode=dictation&${q}` };
    if (s.kind === 'speak') return { title, type: t('road.speak'), glyph, href: `#/quiz?t=${s.theme}&mode=speak&${q}` };
    return { title, type: t('road.quiz'), glyph, href: `#/quiz?t=${s.theme}&${q}` };
  }
  if (s.kind === 'phrase') return { title: tr(s.title), type: t('road.phrases'), glyph: ja ? '文' : '문장', href: `#/rphrase?${q}` };
  if (s.kind === 'ptype') return { title: tr(s.title), type: t('road.ptype'), glyph: ja ? '作文' : '작문', href: `#/rphrase?${q}` };
  return { title: t('title.pairs'), type: t('road.game'), glyph: ja ? 'ペア' : '짝', href: `#/pairs?${q}` };
}

/** État du parcours : modules (ouverts ou non, étapes faites, examen), chapitres et prochaine étape. */
export function roadState() {
  const st = store.get();
  const units = roadUnits().map((u) => {
    const steps = u.steps.map((s) => ({ ...s, done: stepDone(s, st), stars: stars(s, st) }));
    const done = steps.filter((s) => s.done).length;
    const score = st.exams?.[u.id] || 0;
    return { ...u, steps, done, complete: done === steps.length, score, plat: score >= store.EXAM_PASS };
  });
  units.forEach((u, k) => {
    u.open = k === 0 || units[k - 1].complete || u.done > 0 || !!st.road?.[`open:${u.id}`];
    u.n = k + 1;
  });
  const cur = units.find((u) => u.open && !u.complete);
  const next = cur?.steps.find((s) => !s.done);
  const total = units.reduce((n, u) => n + u.steps.length, 0);
  const done = units.reduce((n, u) => n + u.done, 0);
  const chapters = roadChapters().map((c) => {
    const us = units.filter((u) => u.chapter === c.id);
    return { ...c, list: us, complete: us.filter((u) => u.complete).length, plat: us.filter((u) => u.plat).length };
  });
  return { units, chapters, cur, next, total, done, starCount: units.reduce((n, u) => n + u.steps.reduce((m, s) => m + s.stars, 0), 0) };
}

const starRow = (n) => `<span class="rn-stars" aria-label="${n} / 3">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}">${ICONS.star}</i>`).join('')}</span>`;
const OFFSETS = [-1, -0.4, 0.4, 1, 0.4, -0.4]; // tracé sinueux : jamais au centre, le texte se place du côté libre
const openChapters = {}; // chapitres dépliés à la main pendant la séance

export function roadScreen(el) {
  const st = store.get();
  const C = course();
  st.road ||= {};
  let R = roadState();

  // Module terminé : bonus d'XP (une seule fois)
  const fresh = R.units.find((u) => u.complete && !st.road[`bonus:${u.id}`]);
  // Examen réussi : le module passe au platine
  const shiny = R.units.find((u) => u.plat && !st.road[`plat:${u.id}`]);
  if (fresh) {
    R.units.filter((u) => u.complete).forEach((u) => { st.road[`bonus:${u.id}`] = true; });
    store.save();
    store.addXp(UNIT_BONUS);
    celebrate({ glyph: fresh.glyph, title: t('road.unitComplete'), text: t('road.unitBonus', { name: tr(fresh.title), xp: UNIT_BONUS }), button: t('continue') });
    R = roadState();
  } else if (shiny) {
    R.units.filter((u) => u.plat).forEach((u) => { st.road[`plat:${u.id}`] = true; });
    store.save();
    celebrate({ glyph: shiny.glyph, title: t('road.platTitle'), text: t('road.platText', { name: tr(shiny.title) }), button: t('continue') });
    document.querySelector('.celebrate .cel-card')?.classList.add('plat');
  }

  const ja = C.id === 'ja';
  const unitHtml = (u) => `
      <section class="ru ${u.open ? '' : 'locked'} ${u.complete ? 'complete' : ''} ${u.plat ? 'plat' : ''}" style="--tc: ${u.color}" data-u="${u.id}">
        <div class="ru-stick"><header class="ru-head">
          <span class="ru-glyph kr">${esc(u.glyph)}</span>
          <div class="ru-text">
            <span class="ru-n">${t('road.unitN', { n: u.n, total: R.units.length })}${u.plat ? ` · ${t('road.plat')}` : ''}</span>
            <b>${esc(tr(u.title))}</b>
            <span class="ru-sub">${esc(tr(u.sub))}</span>
          </div>
          <span class="ru-count">${u.plat ? GEM : u.complete ? ICONS.check : u.open ? `${u.done} / ${u.steps.length}` : LOCK}</span>
        </header></div>
        ${u.open ? '' : `<div class="ru-lock"><span class="muted small">${t('road.locked')}</span><button class="btn small ghost ru-open">${t('road.unlock')}</button></div>`}
        <div class="ru-path">
          <svg class="ru-line" aria-hidden="true"></svg>
          ${u.steps.map((s, n) => {
            const info = stepInfo(s);
            const cur = R.next && s.id === R.next.id && u === R.cur;
            const x = OFFSETS[n % OFFSETS.length];
            const inner = `
              <span class="rn-btn kr ${info.glyph.length > 2 ? 'long' : ''}">${s.done ? ICONS.check : u.open ? esc(info.glyph) : LOCK}</span>
              <span class="rn-label"><b>${esc(info.title)}</b><span>${esc(info.type)}</span>${s.stars ? starRow(s.stars) : ''}${cur ? `<span class="rn-go">${R.done ? t('road.continue') : t('road.start')}</span>` : ''}</span>`;
            const cls = `rn ${x > 0 ? 'right' : 'left'} ${s.done ? 'done' : ''} ${cur ? 'cur' : ''}`;
            return u.open
              ? `<a class="${cls}" href="${info.href}" style="--x:${x}; --k:${n}">${inner}</a>`
              : `<div class="${cls}" style="--x:${x}; --k:${n}">${inner}</div>`;
          }).join('')}
          ${(() => {
            // Examen du module : accessible une fois toutes les étapes terminées
            const x = OFFSETS[u.steps.length % OFFSETS.length];
            const cls = `rn exam ${x > 0 ? 'right' : 'left'} ${u.plat ? 'done' : ''} ${u.complete ? '' : 'wait'}`;
            const sub = u.plat ? t('exam.scoreDone', { n: u.score }) : u.score ? t('exam.scoreTry', { n: u.score }) : u.complete ? t('exam.ready') : t('exam.locked');
            const inner = `
              <span class="rn-btn kr">${u.plat ? GEM : u.complete ? (ja ? '試験' : '시험') : LOCK}</span>
              <span class="rn-label"><b>${t('exam.node')}</b><span>${sub}</span>${u.complete && !u.plat ? `<span class="rn-go plat">${t('exam.go')}</span>` : ''}</span>`;
            return u.complete ? `<a class="${cls}" href="#/exam?u=${u.id}" style="--x:${x}; --k:${u.steps.length}">${inner}</a>` : `<div class="${cls}" style="--x:${x}">${inner}</div>`;
          })()}
        </div>
      </section>`;

  const platAll = R.units.filter((u) => u.plat).length;
  const fin = st.final || {};
  el.innerHTML = `
    <div class="screen road">
      <section class="card road-top">
        <div><b>${t('road.steps', { n: R.done, total: R.total })}</b><span class="muted small">${t('road.modules', { n: R.units.filter((u) => u.complete).length, total: R.units.length })}${platAll ? ` · ${t('road.platN', { n: platAll })}` : ''}</span></div>
        <div class="mini-bar"><i style="--w:${R.done / R.total}"></i></div>
      </section>
      ${R.chapters.map((c, k) => {
        const here = c.list.includes(R.cur) || (!R.cur && k === 0);
        const open = openChapters[c.id] ?? here;
        const full = c.complete === c.list.length;
        return `
      <details class="chapter ${full ? 'complete' : ''} ${c.plat === c.list.length ? 'plat' : ''}" data-c="${c.id}" ${open ? 'open' : ''}>
        <summary class="ch-head">
          <span class="ch-glyph kr">${esc(c.glyph)}</span>
          <span class="ch-text">
            <span class="ch-n">${t('road.chapterN', { n: k + 1 })}</span>
            <b>${esc(tr(c.title))}</b>
            <span class="ch-sub">${esc(tr(c.sub))}</span>
          </span>
          <span class="ch-count"><b>${c.complete} / ${c.list.length}</b>${c.plat ? `<span class="ch-plat">${GEM}${c.plat}</span>` : ''}</span>
          <span class="ch-chev">›</span>
        </summary>
        <div class="ch-body">${c.list.map(unitHtml).join('')}</div>
      </details>`;
      }).join('')}
      ${R.done === R.total ? `<p class="center muted road-end">${t('road.allDone')}</p>` : ''}
      <a class="card final-card" href="#/exam?u=final">
        <span class="final-seal kr">${ja ? '総合' : '종합'}</span>
        <span class="final-text">
          <span class="eyebrow">${t('final.eyebrow')}</span>
          <b>${t('final.title')}</b>
          <span class="muted small">${fin.n ? t('final.summary', { best: fin.best, n: fin.n }) : t('final.sub')}</span>
        </span>
        <span class="chev">›</span>
      </a>
    </div>`;

  requestAnimationFrame(() => requestAnimationFrame(() => $$('.mini-bar', el).forEach((b) => b.classList.add('go'))));

  $$('.ru-open', el).forEach((b) => b.addEventListener('click', () => {
    st.road[`open:${b.closest('.ru').dataset.u}`] = true;
    store.save();
    sfx.ok();
    roadScreen(el);
  }));

  // Tracé en pointillés entre les étapes, du bas d'un cercle au haut du suivant (sans passer sous les cercles ni les textes)
  function draw() {
    $$('.ru-path', el).forEach((path) => {
      const svg = $('.ru-line', path);
      const box = path.getBoundingClientRect();
      if (!box.width) return; // chapitre replié
      const pts = $$('.rn', path).map((r) => {
        const b = $('.rn-btn', r);
        // offsetTop/offsetLeft : positions stables, sans l'effet des animations d'apparition
        const x = r.offsetLeft + b.offsetLeft + b.offsetWidth / 2;
        const top = r.offsetTop + b.offsetTop;
        return { x, top, bottom: top + b.offsetHeight, done: r.classList.contains('done') };
      });
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      const GAP = 10;
      svg.innerHTML = pts.slice(1).map((p, i) => {
        const a = pts[i];
        const y1 = a.bottom + GAP;
        const y2 = p.top - GAP;
        if (y2 <= y1) return '';
        const bend = (y2 - y1) * 0.55;
        return `<path class="${a.done && p.done ? 'on' : ''}" d="M${a.x} ${y1} C${a.x} ${y1 + bend} ${p.x} ${y2 - bend} ${p.x} ${y2}"/>`;
      }).join('');
    });
  }
  draw();
  const onResize = () => (el.querySelector('.road') ? draw() : removeEventListener('resize', onResize));
  addEventListener('resize', onResize);
  document.fonts?.ready.then(() => el.querySelector('.road') && draw());
  $$('.chapter', el).forEach((d) => d.addEventListener('toggle', () => {
    openChapters[d.dataset.c] = d.open;
    if (d.open) draw();
  }));

  // On arrive directement sur l'étape en cours
  const cur = $('.rn.cur', el);
  if (cur && R.done) requestAnimationFrame(() => cur.scrollIntoView({ block: 'center' }));
}

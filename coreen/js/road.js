// Parcours : carte des modules et de leurs étapes, de difficulté croissante.
import { $, $$, esc, sfx, haptic, celebrate, ICONS } from './ui.js';
import * as store from './store.js';
import { course, t, tr, lang } from './course.js';
import { THEMES } from './content/concepts.js';
import { ROADMAP } from './content/roadmap.js';

export const roadUnits = () => ROADMAP[course().id] || [];
export const findStep = (id) => roadUnits().flatMap((u) => u.steps).find((s) => s.id === id);

const UNIT_BONUS = 15; // XP offerts à la fin d'un module
const THEME_GLYPH = { food: ['밥', '食'], daily: ['집', '家'], leisure: ['놀이', '遊'], city: ['도시', '町'], study: ['공부', '学'], basics: ['안녕', '初'] };
const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

const lessons = () => course().guide[lang()] || course().guide.fr;

/** Une étape est-elle terminée ? Les leçons, les paires et le défi se lisent dans la progression existante. */
export function stepDone(s, st = store.get()) {
  if (s.kind === 'lesson') return !!st.read?.[s.lesson];
  if (s.kind === 'pairs') return !!st.best?.pairs;
  if (s.kind === 'daily') return Object.keys(st.daily || {}).length > 0;
  return !!st.road?.[s.id];
}
const stars = (s, st) => (['script', 'words', 'cards', 'phrase'].includes(s.kind) ? st.road?.[s.id] || 0 : 0);

/** Titre, type, pastille et adresse d'une étape. */
export function stepInfo(s) {
  const C = course();
  const ja = C.id === 'ja';
  const q = `step=${s.id}`;
  if (s.kind === 'lesson') {
    const g = lessons().find((x) => x.id === s.lesson);
    return { title: g?.title || s.lesson, type: t('road.lesson'), glyph: g?.glyph || '?', href: `#/guide?id=${s.lesson}&${q}` };
  }
  if (s.kind === 'script') {
    const set = C.script.sets[s.set];
    const title = set ? tr(set.label) : s.set === 'syllables' ? tr(C.script.syllableLabel) : t('script.words');
    const glyph = set ? set.items[0].j : s.set === 'syllables' ? C.script.syllableSample.slice(0, 2) : ja ? 'さかな' : '사과';
    return { title, type: t('road.quiz'), glyph, href: `#/hquiz?set=${s.set}&${q}` };
  }
  if (s.kind === 'cards' || s.kind === 'words') {
    const glyph = (THEME_GLYPH[s.theme] || ['말', '語'])[ja ? 1 : 0];
    return s.kind === 'cards'
      ? { title: tr(THEMES[s.theme]), type: t('road.cards'), glyph, href: `#/cards?t=${s.theme}&${q}` }
      : { title: tr(THEMES[s.theme]), type: t('road.quiz'), glyph, href: `#/quiz?t=${s.theme}&${q}` };
  }
  if (s.kind === 'phrase') return { title: tr(s.title), type: t('road.phrases'), glyph: ja ? '文' : '문장', href: `#/rphrase?${q}` };
  if (s.kind === 'pairs') return { title: t('title.pairs'), type: t('road.game'), glyph: ja ? 'ペア' : '짝', href: `#/pairs?${q}` };
  return { title: t('title.daily'), type: t('road.challenge'), glyph: ja ? '今日' : '오늘', href: `#/daily?${q}` };
}

/** État du parcours : modules (ouverts ou non, étapes faites) et prochaine étape. */
export function roadState() {
  const st = store.get();
  const units = roadUnits().map((u) => {
    const steps = u.steps.map((s) => ({ ...s, done: stepDone(s, st), stars: stars(s, st) }));
    const done = steps.filter((s) => s.done).length;
    return { ...u, steps, done, complete: done === steps.length };
  });
  units.forEach((u, k) => {
    u.open = k === 0 || units[k - 1].complete || u.done > 0 || !!st.road?.[`open:${u.id}`];
  });
  const cur = units.find((u) => u.open && !u.complete);
  const next = cur?.steps.find((s) => !s.done);
  const total = units.reduce((n, u) => n + u.steps.length, 0);
  const done = units.reduce((n, u) => n + u.done, 0);
  return { units, cur, next, total, done };
}

const starRow = (n) => `<span class="rn-stars" aria-label="${n} / 3">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}">${ICONS.star}</i>`).join('')}</span>`;
const OFFSETS = [-1, -0.4, 0.4, 1, 0.4, -0.4]; // tracé sinueux : jamais au centre, le texte se place du côté libre

export function roadScreen(el) {
  const st = store.get();
  st.road ||= {};
  let R = roadState();

  // Module terminé : bonus d'XP (une seule fois)
  const fresh = R.units.find((u) => u.complete && !st.road[`bonus:${u.id}`]);
  if (fresh) {
    R.units.filter((u) => u.complete).forEach((u) => { st.road[`bonus:${u.id}`] = true; });
    store.save();
    store.addXp(UNIT_BONUS);
    celebrate({ glyph: fresh.glyph, title: t('road.unitComplete'), text: t('road.unitBonus', { name: tr(fresh.title), xp: UNIT_BONUS }), button: t('continue') });
    R = roadState();
  }

  el.innerHTML = `
    <div class="screen road">
      <section class="card road-top">
        <div><b>${t('road.steps', { n: R.done, total: R.total })}</b><span class="muted small">${t('road.modules', { n: R.units.filter((u) => u.complete).length, total: R.units.length })}</span></div>
        <div class="mini-bar"><i style="--w:${R.done / R.total}"></i></div>
      </section>
      ${R.units.map((u, k) => `
      <section class="ru ${u.open ? '' : 'locked'} ${u.complete ? 'complete' : ''}" style="--tc: ${u.color}" data-u="${u.id}">
        <div class="ru-stick"><header class="ru-head">
          <span class="ru-glyph kr">${esc(u.glyph)}</span>
          <div class="ru-text">
            <span class="ru-n">${t('road.unitN', { n: k + 1, total: R.units.length })}</span>
            <b>${esc(tr(u.title))}</b>
            <span class="ru-sub">${esc(tr(u.sub))}</span>
          </div>
          <span class="ru-count">${u.complete ? ICONS.check : u.open ? `${u.done} / ${u.steps.length}` : LOCK}</span>
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
              ? `<a class="${cls}" href="${info.href}" style="--x:${x}">${inner}</a>`
              : `<div class="${cls}" style="--x:${x}">${inner}</div>`;
          }).join('')}
        </div>
      </section>`).join('')}
      ${R.done === R.total ? `<p class="center muted road-end">${t('road.allDone')}</p>` : ''}
    </div>`;

  requestAnimationFrame(() => requestAnimationFrame(() => $$('.mini-bar', el).forEach((b) => b.classList.add('go'))));

  $$('.ru-open', el).forEach((b) => b.addEventListener('click', () => {
    st.road[`open:${b.closest('.ru').dataset.u}`] = true;
    store.save();
    sfx.ok();
    haptic(10);
    roadScreen(el);
  }));

  // Tracé en pointillés entre les étapes, du bas d'un cercle au haut du suivant (sans passer sous les cercles ni les textes)
  function draw() {
    $$('.ru-path', el).forEach((path) => {
      const svg = $('.ru-line', path);
      const box = path.getBoundingClientRect();
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

  // On arrive directement sur l'étape en cours
  const cur = $('.rn.cur', el);
  if (cur && R.done) requestAnimationFrame(() => cur.scrollIntoView({ block: 'center' }));
}

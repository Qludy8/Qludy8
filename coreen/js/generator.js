// Générateur de phrases : choisit un « plan » (verbe, sujet, objet, lieu, moment, temps, forme),
// puis le rend dans la langue apprise (module du cours) ainsi qu'en français et en anglais.
import { NOUNS, PLACES, VERBS, TIMES } from './content/concepts.js';

export const TENSE_LABEL = { present: { fr: 'Présent', en: 'Present' }, past: { fr: 'Passé', en: 'Past' }, future: { fr: 'Futur', en: 'Future' } };
export const STYLE_LABEL = { polite: { fr: 'Poli', en: 'Polite' }, formal: { fr: 'Formel', en: 'Formal' }, casual: { fr: 'Familier', en: 'Casual' } };
export const FORM_LABEL = { affirm: { fr: 'Affirmative', en: 'Statement' }, neg: { fr: 'Négative', en: 'Negative' }, question: { fr: 'Question', en: 'Question' }, want: { fr: 'Envie', en: 'Wish' } };

/** Générateur pseudo-aléatoire reproductible (même graine → même phrase). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = (r, list) => list[Math.floor(r() * list.length)];

// ---------- Plan ----------
export function makePlan(opts, r, lang) {
  const level = Number(opts.level) || 1;
  const form = !opts.form || opts.form === 'random' ? pick(r, ['affirm', 'affirm', 'neg', 'question', 'want']) : opts.form;
  let tense = !opts.tense || opts.tense === 'random' ? pick(r, form === 'want' ? ['present', 'past'] : ['present', 'past', 'future']) : opts.tense;
  const want = form === 'want';
  const adjusted = [];
  const has = (x) => x[lang] != null;
  const theme = opts.theme && opts.theme !== 'all' ? opts.theme : null;
  const preferTheme = (list) => {
    const t = theme && list.filter((x) => x.t === theme);
    return t && t.length ? t : list;
  };

  const wantable = (v) => ['obj', 'go', 'act'].includes(v.type) && !v.noWant;
  // kind : genre de phrase voulu (obj : action sur quelque chose, go : déplacement, act : activité, adj : description)
  const kind = opts.kind && opts.kind !== 'random' ? opts.kind : null;
  const ofKind = (v) => !kind || (kind === 'adj' ? v.type === 'adj' || v.type === 'weather' : v.type === kind);
  const fits = (v) => has(v) && (!want || wantable(v)) && !(tense === 'future' && v.noFuture);
  let pool = VERBS.filter((v) => fits(v) && ofKind(v) && (!theme || v.t.includes(theme)));
  if (!pool.length) pool = VERBS.filter((v) => fits(v) && ofKind(v));
  if (!pool.length) {
    pool = VERBS.filter((v) => fits(v) && (!theme || v.t.includes(theme)));
    adjusted.push({ fr: 'Ce genre de phrase ne va pas avec la forme choisie : un autre a été pris.', en: 'That kind of sentence does not fit the chosen form: another one was used.' });
  }
  if (!pool.length) pool = VERBS.filter(fits);
  const verb = pick(r, pool);
  if (want && tense === 'future') {
    tense = 'present';
    adjusted.push({ fr: 'L’envie se pratique ici au présent ou au passé.', en: 'Wishes are practised here in the present or the past.' });
  }
  // time : « yes » ajoute toujours un moment, « no » jamais ; sinon c'est le niveau qui décide
  const time = opts.time === 'yes' || (opts.time !== 'no' && level >= 2) ? pick(r, TIMES[tense]) : null;

  let subj;
  let thing = null;
  if (verb.type === 'weather') subj = 'weather';
  else if (verb.type === 'adj' && verb.subj !== 'person') {
    subj = 'thing';
    thing = pick(r, preferTheme(NOUNS.filter((x) => has(x) && verb.subj.includes(x.cat) && (!verb.only || verb.only.includes(x.id)) && (!x.frDef.startsWith('les ') || verb.fr.mp))));
  } else if (['me', 'friend', 'we'].includes(opts.subj) && form !== 'question') subj = opts.subj;
  else if (opts.subj === 'friend') subj = 'friend';
  else subj = form === 'question' ? pick(r, ['you', 'you', 'friend']) : pick(r, ['me', 'me', 'friend', 'we']);

  let place = null;
  if (verb.type === 'go') place = pick(r, preferTheme(PLACES.filter(has)));
  else if ((verb.type === 'obj' || verb.type === 'act') && verb.places.length && (level >= 3 || (verb.type === 'act' && level >= 2))) {
    const ok = PLACES.filter((p) => has(p) && p.tags.some((t) => verb.places.includes(t)));
    if (ok.length) place = pick(r, ok);
  }
  const obj = verb.type === 'obj'
    ? pick(r, preferTheme(NOUNS.filter((x) => has(x) && verb.objs.includes(x.cat) && (!verb.only || verb.only.includes(x.id)) && !(subj === 'friend' && x.id === 'friend'))))
    : null;
  if (obj && obj.cat === 'vehicle') place = null; // « attendre le bus au café » : non

  return { level, verb, subj, thing, obj, place, time, tense, form, neg: form === 'neg', question: form === 'question', want, adjusted, theme: theme || 'all' };
}

// ---------- Français ----------
// Indices : 0 je, 1 tu, 2 il/elle, 3 nous, 4 vous, 5 ils/elles
const AVOIR = ['ai', 'as', 'a', 'avons', 'avez', 'ont'];
const ETRE = ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'];
const ETRE_IMP = ['étais', 'étais', 'était', 'étions', 'étiez', 'étaient'];
const ALLER = ['vais', 'vas', 'va', 'allons', 'allez', 'vont'];
const VOULOIR = ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'];
const VOULOIR_IMP = ['voulais', 'voulais', 'voulait', 'voulions', 'vouliez', 'voulaient'];
const AGREE = ['(e)', '(e)', '', '(e)s', '(e)', 's'];

/** « du pain » → « de pain » après une négation. */
export function negArticle(s) {
  const m = s.match(/^(une |un |du |des |de la |de l’)/);
  return m ? 'de ' + s.slice(m[0].length) : s;
}

/** Élisions (je → j’, ne → n’, que → qu’, de → d’) et majuscule initiale. */
export function finishFrench(s) {
  const out = s
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)(je|ne|que|de)\s+(?=[aeiouyàâäéèêëîïôöùûüh])/gi, (_, sp, w) => sp + w.slice(0, -1) + '’')
    .replace(/\s+,/g, ',')
    .trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function frVerb(verb, tense, i, neg, want) {
  const f = verb.fr;
  if (want) {
    const vw = (tense === 'past' ? VOULOIR_IMP : VOULOIR)[i];
    return neg ? ['ne', vw, 'pas', f.inf] : [vw, f.inf];
  }
  if (tense === 'past') {
    const aux = (f.aux === 'être' ? ETRE : AVOIR)[i];
    const pp = f.pp + (f.aux === 'être' ? AGREE[i] : '');
    return neg ? ['ne', aux, 'pas', pp] : [aux, pp];
  }
  if (tense === 'future') return neg ? ['ne', ALLER[i], 'pas', f.inf] : [ALLER[i], f.inf];
  return neg ? ['ne', f.p[i], 'pas'] : [f.p[i]];
}
function frEtre(tense, i, neg) {
  if (tense === 'past') return neg ? ['ne', ETRE_IMP[i], 'pas'] : [ETRE_IMP[i]];
  if (tense === 'future') return neg ? ['ne', ALLER[i], 'pas', 'être'] : [ALLER[i], 'être'];
  return neg ? ['ne', ETRE[i], 'pas'] : [ETRE[i]];
}
function frWeather(w, tense, neg) {
  if (tense === 'past') return neg ? ['il', 'ne', 'faisait', 'pas', w] : ['il', 'faisait', w];
  if (tense === 'future') return neg ? ['il', 'ne', 'va', 'pas', 'faire', w] : ['il', 'va', 'faire', w];
  return neg ? ['il', 'ne', 'fait', 'pas', w] : ['il', 'fait', w];
}

const FR_SUBJ = { me: ['je', 0], friend: ['mon ami', 2], we: ['nous', 3] };

export function renderFr(p, style) {
  const { verb, tense, neg, want } = p;
  let fr;
  if (p.subj === 'weather') fr = frWeather(verb.fr.w, tense, neg);
  else if (p.subj === 'thing') {
    const pl = p.thing.frDef.startsWith('les ');
    const i = pl ? 5 : 2;
    const f = verb.fr;
    const adj = p.thing.g === 'f' ? (pl ? f.fp : f.f) : (pl ? f.mp : f.m);
    fr = [p.thing.frDef, ...frEtre(tense, i, neg), adj];
  } else {
    const [s, i] = p.subj === 'you' ? (style === 'casual' ? ['tu', 1] : ['vous', 4]) : FR_SUBJ[p.subj];
    if (verb.type === 'adj') {
      const f = verb.fr;
      fr = [s, ...frEtre(tense, i, neg), [f.x, f.x, f.m, f.xp, f.x][i]];
    } else {
      fr = [s, ...frVerb(verb, tense, i, neg, want)];
      if (verb.fr.suf) fr.push(neg ? verb.fr.sufNeg : verb.fr.suf);
      if (p.obj) {
        const o = verb.art === 'def' ? p.obj.frDef : p.obj.frInd;
        fr.push(neg && verb.art === 'ind' ? negArticle(o) : o);
      }
      if (p.place) fr.push(p.place.fr);
    }
  }
  const text = p.question
    ? 'est-ce que ' + fr.join(' ') + (p.time ? ' ' + p.time.fr : '') + ' ?'
    : (p.time ? p.time.fr + ', ' : '') + fr.join(' ') + '.';
  return finishFrench(text).replace(/\s\?$/, ' ?');
}

// ---------- Anglais ----------
const EN_SUBJ = { me: ['I', 'i'], friend: ['my friend', 's'], we: ['we', 'p'], you: ['you', 'p'] };
const EN_PLURAL = new Set(['clothes', 'shoes']);

function enBe(person, tense, neg) {
  if (tense === 'past') return person === 'p' ? (neg ? "weren't" : 'were') : neg ? "wasn't" : 'was';
  if (tense === 'future') return neg ? "won't be" : 'will be';
  if (person === 'i') return neg ? 'am not' : 'am';
  if (person === 's') return neg ? "isn't" : 'is';
  return neg ? "aren't" : 'are';
}
function enBeQ(person, tense) {
  if (tense === 'past') return person === 'p' ? 'were' : 'was';
  if (tense === 'future') return 'will';
  return person === 'i' ? 'am' : person === 's' ? 'is' : 'are';
}
function enAux(person, tense) {
  if (tense === 'past') return 'did';
  if (tense === 'future') return 'will';
  return person === 's' ? 'does' : 'do';
}

export function renderEn(p) {
  const { verb, tense, neg, want, question } = p;
  const e = verb.en;
  let subject;
  let person;
  if (p.subj === 'weather') [subject, person] = ['it', 's'];
  else if (p.subj === 'thing') [subject, person] = [p.thing.enDef, EN_PLURAL.has(p.thing.id) ? 'p' : 's'];
  else [subject, person] = EN_SUBJ[p.subj];

  const tail = [];
  if (verb.type === 'obj' && p.obj) tail.push(p.obj['en' + verb.enArt[0].toUpperCase() + verb.enArt.slice(1)]);
  if (p.place) tail.push(verb.type === 'go' ? p.place.enTo : p.place.enAt);

  let words;
  if (verb.type === 'adj' || verb.type === 'weather') {
    if (question) words = [enBeQ(person, tense), subject, ...(tense === 'future' ? ['be'] : []), e.adj];
    else words = [subject, enBe(person, tense, neg), e.adj];
  } else if (want) {
    const wantForm = tense === 'past' ? 'wanted' : person === 's' ? 'wants' : 'want';
    if (question) words = [enAux(person, tense), subject, 'want to', e.b];
    else if (neg) words = [subject, (tense === 'past' ? "didn't" : person === 's' ? "doesn't" : "don't"), 'want to', e.b];
    else words = [subject, wantForm, 'to', e.b];
  } else if (question) {
    words = [enAux(person, tense), subject, e.b];
  } else if (neg) {
    const aux = tense === 'past' ? "didn't" : tense === 'future' ? "won't" : person === 's' ? "doesn't" : "don't";
    words = [subject, aux, e.b];
  } else {
    const v = tense === 'past' ? e.past : tense === 'future' ? 'will ' + e.b : person === 's' ? e.s : e.b;
    words = [subject, v];
  }
  words.push(...tail);
  let text = words.join(' ');
  if (question) text += (p.time ? ' ' + p.time.en : '') + '?';
  else text = (p.time ? p.time.en + ', ' : '') + text + '.';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------- Assemblage ----------
/**
 * opts : { mood, level, theme, tense, style, form } ; course : module du cours (ko ou ja).
 * Renvoie { tl, ruby?, rom, fr, en, tiles, sep, end, words, notes, adjusted, meta }.
 */
export function generate(opts = {}, random = Math.random, course) {
  if (opts.mood === 'awkward') return course.awkward(opts, random);
  let style = opts.style || 'polite';
  const adjusted = [];
  if (!course.styles.includes(style)) {
    adjusted.push({ fr: 'Le japonais se pratique ici en style poli ou familier.', en: 'Japanese is practised here in polite or casual style.' });
    style = 'polite';
  }
  const plan = makePlan(opts, random, course.id);
  const out = course.render(plan, style);
  return {
    ...out,
    fr: renderFr(plan, style),
    en: renderEn(plan),
    adjusted: [...adjusted, ...plan.adjusted, ...(out.adjusted || [])],
    meta: { level: plan.level, tense: plan.tense, style, form: plan.form, theme: plan.theme },
  };
}

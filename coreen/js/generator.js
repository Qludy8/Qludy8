// Générateur de phrases coréennes (avec traduction française) selon des critères.
import { conjugate, particle, romanize } from './hangul.js';
import { NOUNS, PLACES } from './content/vocab.js';
import { VERBS, TIMES, verbLabel } from './content/verbs.js';

export const TENSE_LABEL = { present: 'Présent', past: 'Passé', future: 'Futur' };
export const STYLE_LABEL = { polite: 'Poli', formal: 'Formel', casual: 'Familier' };
export const FORM_LABEL = { affirm: 'Affirmative', neg: 'Négative', question: 'Question', want: 'Envie' };

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
const pick = (r, list) => list[Math.floor(r() * list.length)];

// ---------- Conjugaison française ----------
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

// ---------- Notes de grammaire ----------
const ENDING_NOTE = {
  polite: {
    present: '-아요 / -어요 : présent, style poli de tous les jours',
    past: '-았어요 / -었어요 : passé, style poli',
    future: '-(으)ㄹ 거예요 : futur ou intention, style poli',
  },
  formal: {
    present: '-ㅂ니다 / -습니다 (question : -ㅂ니까 / -습니까) : présent, style formel (travail, annonces)',
    past: '-았습니다 / -었습니다 : passé, style formel',
    future: '-(으)ㄹ 겁니다 : futur, style formel',
  },
  casual: {
    present: '-아 / -어 : présent familier, entre amis proches',
    past: '-았어 / -었어 : passé familier',
    future: '-(으)ㄹ 거야 : futur familier',
  },
};

const SUBJECTS = {
  me: { kr: { polite: '저', formal: '저', casual: '나' }, fr: 'je', i: 0, gloss: { polite: 'je (poli)', formal: 'je (poli)', casual: 'je (familier)' } },
  friend: { kr: '친구', fr: 'mon ami', i: 2, gloss: 'ami(e)' },
  we: { kr: '우리', fr: 'nous', i: 3, gloss: 'nous' },
};

/**
 * opts : { level: 1|2|3, theme: 'all'|clé de THEMES, tense: present|past|future|random,
 *          style: polite|formal|casual, form: affirm|neg|question|want|random }
 */
export function generate(opts = {}, random = Math.random) {
  const r = random;
  const level = Number(opts.level) || 1;
  const style = opts.style || 'polite';
  const form = !opts.form || opts.form === 'random' ? pick(r, ['affirm', 'affirm', 'neg', 'question', 'want']) : opts.form;
  let tense = !opts.tense || opts.tense === 'random' ? pick(r, form === 'want' ? ['present', 'past'] : ['present', 'past', 'future']) : opts.tense;
  const neg = form === 'neg';
  const question = form === 'question';
  const want = form === 'want';
  const adjusted = [];

  let pool = VERBS.filter((v) => !opts.theme || opts.theme === 'all' || v.t.includes(opts.theme));
  if (want) pool = pool.filter((v) => ['obj', 'go', 'act'].includes(v.type));
  if (!pool.length) pool = VERBS.filter((v) => !want || ['obj', 'go', 'act'].includes(v.type));
  const verb = pick(r, pool);

  if (want && tense === 'future') {
    tense = 'present';
    adjusted.push('L’envie (-고 싶다) se pratique ici au présent ou au passé.');
  }

  const words = []; // glossaire { kr, fr }
  const notes = [];
  const kr = []; // morceaux coréens dans l'ordre
  const theme = opts.theme && opts.theme !== 'all' ? opts.theme : null;
  const preferTheme = (list) => {
    const t = theme && list.filter((x) => x.t === theme);
    return t && t.length ? t : list;
  };

  // --- Complément de temps (niveau 2+)
  const time = level >= 2 ? pick(r, TIMES[tense]) : null;

  // --- Sujet
  let subjKr = null;
  let subjFr;
  let fi; // indice de conjugaison française
  let third = false;
  let thingSubject = null;

  if (verb.type === 'weather') {
    subjKr = particle('날씨', '이', '가');
    words.push({ kr: '날씨', fr: 'temps (météo)' });
    notes.push('가 / 이 : particule de sujet (가 après une voyelle)');
  } else if (verb.type === 'adj' && verb.subj !== 'person') {
    thingSubject = pick(r, preferTheme(NOUNS.filter((x) => verb.subj.includes(x.cat) && (!verb.only || verb.only.includes(x.kr)) && (!x.def.startsWith('les ') || verb.fr.mp))));
    subjKr = particle(thingSubject.kr, '이', '가');
    subjFr = thingSubject.def;
    fi = thingSubject.def.startsWith('les ') ? 5 : 2;
    words.push({ kr: thingSubject.kr, fr: thingSubject.fr });
    notes.push('이 / 가 : particule de sujet (이 après une consonne, 가 après une voyelle)');
  } else {
    // En question, on s'adresse surtout à l'autre (« tu / vous ») ou on parle d'un ami.
    const key = question ? pick(r, ['you', 'you', 'friend']) : pick(r, ['me', 'me', 'friend', 'we']);
    if (key === 'you') {
      fi = style === 'casual' ? 1 : 4;
      subjFr = style === 'casual' ? 'tu' : 'vous';
      notes.push('Le sujet « ' + subjFr + ' » est sous-entendu : en coréen, on l’omet quand il est évident.');
    } else {
      const s = SUBJECTS[key];
      const base = typeof s.kr === 'string' ? s.kr : s.kr[style];
      subjKr = particle(base, '은', '는');
      subjFr = s.fr;
      fi = s.i;
      third = key === 'friend';
      words.push({ kr: base, fr: typeof s.gloss === 'string' ? s.gloss : s.gloss[style] });
      notes.push('는 / 은 : particule de thème, « quant à… » (는 après une voyelle)');
    }
  }

  // --- Lieu
  let place = null;
  if (verb.type === 'go') {
    place = pick(r, preferTheme(PLACES));
  } else if ((verb.type === 'obj' || verb.type === 'act') && verb.places.length && (level >= 3 || (verb.type === 'act' && level >= 2))) {
    const ok = PLACES.filter((p) => p.tags.some((t) => verb.places.includes(t)));
    if (ok.length) place = pick(r, ok);
  }

  // --- Complément d'objet
  const obj = verb.type === 'obj' ? pick(r, preferTheme(NOUNS.filter((x) => verb.objs.includes(x.cat) && (!verb.only || verb.only.includes(x.kr)) && !(third && x.kr === '친구')))) : null;
  if (obj && obj.cat === 'vehicle' && verb.type === 'obj') place = null; // « attendre le bus au café » : non

  // --- Ordre coréen : sujet, temps, lieu, objet, verbe (météo : temps avant le sujet)
  if (verb.type === 'weather' || thingSubject) {
    if (time) kr.push(time.kr);
    kr.push(subjKr);
  } else {
    if (subjKr) kr.push(subjKr);
    if (time) kr.push(time.kr);
  }
  if (time) words.push({ kr: time.kr, fr: time.fr });
  if (place) {
    const go = verb.type === 'go';
    kr.push(place.kr + (go ? '에' : '에서'));
    words.push({ kr: place.kr, fr: place.word });
    notes.push(go ? '에 : destination, « à / vers »' : '에서 : lieu où se passe l’action');
  }
  if (obj) {
    kr.push(particle(obj.kr, '을', '를'));
    words.push({ kr: obj.kr, fr: obj.fr });
    notes.push('을 / 를 : complément d’objet (을 après une consonne, 를 après une voyelle)');
  }

  // --- Verbe coréen
  let vk = verb;
  let prefix = '';
  if (want) {
    const aux = third
      ? neg ? ['싶어하지 않', '싶어하지 않아', '싶어하지 않을'] : ['싶어하', '싶어해', '싶어할']
      : neg ? ['싶지 않', '싶지 않아', '싶지 않을'] : ['싶', '싶어', '싶을'];
    vk = { stem: verb.stem + '고 ' + aux[0], a: verb.stem + '고 ' + aux[1], f: verb.stem + '고 ' + aux[2] };
    notes.push(third ? '-고 싶어하다 : envie d’une autre personne (싶다 est réservé à soi ou à la personne à qui l’on parle)' : '-고 싶다 : avoir envie de, vouloir');
    if (neg) notes.push('-지 않다 : négation');
  } else if (neg) {
    if (verb.neg) {
      vk = verb.neg;
      notes.push(verb.neg.kr + ' : le contraire de ' + verb.kr + ' (pas de 안)');
    } else if (verb.longNeg) {
      vk = { stem: verb.stem + '지 않', a: verb.stem + '지 않아', f: verb.stem + '지 않을' };
      notes.push('-지 않다 : négation (forme longue, naturelle avec les verbes en 하다)');
    } else {
      prefix = '안 ';
      notes.push('안 + verbe : négation courte, placée juste avant le verbe');
    }
  }
  kr.push(prefix + conjugate(vk, tense, style, question));
  words.push({ kr: (neg && verb.neg ? verb.neg.kr : verb.kr), fr: neg && verb.neg ? 'ne pas être bon' : verbLabel(verb) });
  notes.push(ENDING_NOTE[style][tense]);
  if (question && style !== 'formal') notes.push('Question : même terminaison qu’à l’affirmative, avec une intonation montante.');

  // --- Phrase française
  let fr;
  if (verb.type === 'weather') {
    fr = frWeather(verb.fr.w, tense, neg);
  } else if (verb.type === 'adj') {
    const f = verb.fr;
    let adj;
    if (thingSubject) {
      const pl = fi === 5;
      adj = thingSubject.g === 'f' ? (pl ? f.fp : f.f) : (pl ? f.mp : f.m);
    } else {
      adj = [f.x, f.x, f.m, f.xp, f.x][fi];
    }
    fr = [subjFr, ...frEtre(tense, fi, neg), adj];
  } else {
    fr = [subjFr, ...frVerb(verb, tense, fi, neg, want)];
    if (verb.fr.suf) fr.push(neg ? verb.fr.sufNeg : verb.fr.suf);
    if (obj) {
      const o = obj[verb.art];
      fr.push(neg && verb.art === 'ind' ? negArticle(o) : o);
    }
    if (place) fr.push(place.fr);
  }
  let frText;
  if (question) {
    frText = 'est-ce que ' + fr.join(' ') + (time ? ' ' + time.fr : '') + ' ?';
  } else {
    frText = (time ? time.fr + ', ' : '') + fr.join(' ') + '.';
  }
  frText = finishFrench(frText).replace(/\s\?$/, ' ?');

  const krText = kr.join(' ');
  return {
    kr: krText,
    fr: frText,
    rom: romanize(krText),
    tiles: krText.replace(/[.?]$/, '').split(' '),
    end: krText.slice(-1),
    words,
    notes: [...new Set(notes)],
    adjusted,
    meta: { level, tense, style, form, theme: theme || 'all' },
  };
}

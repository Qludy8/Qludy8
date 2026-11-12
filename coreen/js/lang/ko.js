// Cours de coréen : rendu des phrases, phrases « gênantes », alphabet, vocabulaire de base.
import { conjugate, particle, romanize, compose, CHO, JUNG, JONG } from '../hangul.js';
import { NOUNS, PLACES, VERBS, verbLabel } from '../content/concepts.js';
import { JAMO_SETS, VOWELS, CONSONANTS } from '../content/jamo.js';
import { AWKWARD } from '../content/awkward.js';
import { GUIDE } from '../content/guide.js';
import { GUIDE_EN } from '../content/guide.en.js';
import { pick } from '../generator.js';

const L = (fr, en) => ({ fr, en });

// ---------- Notes de grammaire ----------
const ENDING = {
  polite: {
    present: L('-아요 / -어요 : présent, style poli de tous les jours', '-아요 / -어요: present tense, everyday polite style'),
    past: L('-았어요 / -었어요 : passé, style poli', '-았어요 / -었어요: past tense, polite style'),
    future: L('-(으)ㄹ 거예요 : futur ou intention, style poli', '-(으)ㄹ 거예요: future or intention, polite style'),
  },
  formal: {
    present: L('-ㅂ니다 / -습니다 (question : -ㅂ니까 / -습니까) : présent, style formel', '-ㅂ니다 / -습니다 (question: -ㅂ니까 / -습니까): present tense, formal style'),
    past: L('-았습니다 / -었습니다 : passé, style formel', '-았습니다 / -었습니다: past tense, formal style'),
    future: L('-(으)ㄹ 겁니다 : futur, style formel', '-(으)ㄹ 겁니다: future, formal style'),
  },
  casual: {
    present: L('-아 / -어 : présent familier, entre amis proches', '-아 / -어: casual present, between close friends'),
    past: L('-았어 / -었어 : passé familier', '-았어 / -었어: casual past'),
    future: L('-(으)ㄹ 거야 : futur familier', '-(으)ㄹ 거야: casual future'),
  },
};
const N_TOPIC = L('는 / 은 : particule de thème, « quant à… » (는 après une voyelle)', '는 / 은: topic particle, “as for…” (는 after a vowel)');
const N_SUBJ = L('이 / 가 : particule de sujet (이 après une consonne, 가 après une voyelle)', '이 / 가: subject particle (이 after a consonant, 가 after a vowel)');
const N_OBJ = L('을 / 를 : complément d’objet (을 après une consonne, 를 après une voyelle)', '을 / 를: object particle (을 after a consonant, 를 after a vowel)');
const N_TO = L('에 : destination, « à / vers »', '에: destination, “to”');
const N_AT = L('에서 : lieu où se passe l’action', '에서: place where the action happens');
const N_NEG = L('안 + verbe : négation courte, placée juste avant le verbe', '안 + verb: short negation, right before the verb');
const N_LONGNEG = L('-지 않다 : négation (forme longue, naturelle avec les verbes en 하다)', '-지 않다: negation (long form, natural with 하다 verbs)');
const N_WANT = L('-고 싶다 : avoir envie de, vouloir', '-고 싶다: to want to');
const N_WANT3 = L('-고 싶어하다 : envie d’une autre personne (싶다 est réservé à soi ou à l’interlocuteur)', '-고 싶어하다: someone else’s wish (싶다 is only for yourself or the listener)');
const N_Q = L('Question : même terminaison qu’à l’affirmative, avec une intonation montante.', 'Question: same ending as a statement, with rising intonation.');
const N_YOU = L('Le « tu / vous » est sous-entendu : en coréen, on l’omet quand il est évident.', 'The “you” is implied: Korean drops it when it is obvious.');

const SUBJ_KO = { me: { polite: '저', formal: '저', casual: '나' }, friend: '친구', we: '우리' };
const SUBJ_GLOSS = { me: L('je (poli)', 'I (polite)'), meCasual: L('je (familier)', 'I (casual)'), friend: L('ami(e)', 'friend'), we: L('nous', 'we') };
const nounGloss = (n) => L(n.fr, n.en);

function render(p, style) {
  const { verb, tense, neg, question, want } = p;
  const v = verb.ko;
  const words = [];
  const notes = [];
  const kr = [];
  let third = false;
  let subjKr = null;

  if (p.subj === 'weather') {
    subjKr = particle('날씨', '이', '가');
    words.push({ tl: '날씨', ...L('temps (météo)', 'weather') });
    notes.push(L('가 / 이 : particule de sujet (가 après une voyelle)', '가 / 이: subject particle (가 after a vowel)'));
  } else if (p.subj === 'thing') {
    subjKr = particle(p.thing.ko, '이', '가');
    words.push({ tl: p.thing.ko, ...nounGloss(p.thing) });
    notes.push(N_SUBJ);
  } else if (p.subj === 'you') {
    notes.push(N_YOU);
  } else {
    const base = typeof SUBJ_KO[p.subj] === 'string' ? SUBJ_KO[p.subj] : SUBJ_KO[p.subj][style];
    subjKr = particle(base, '은', '는');
    third = p.subj === 'friend';
    words.push({ tl: base, ...(p.subj === 'me' ? (style === 'casual' ? SUBJ_GLOSS.meCasual : SUBJ_GLOSS.me) : SUBJ_GLOSS[p.subj]) });
    notes.push(N_TOPIC);
  }

  if (p.subj === 'weather' || p.subj === 'thing') {
    if (p.time) kr.push(p.time.ko);
    kr.push(subjKr);
  } else {
    if (subjKr) kr.push(subjKr);
    if (p.time) kr.push(p.time.ko);
  }
  if (p.time) words.push({ tl: p.time.ko, fr: p.time.fr, en: p.time.en });
  if (p.place) {
    const go = verb.type === 'go';
    kr.push(p.place.ko + (go ? '에' : '에서'));
    words.push({ tl: p.place.ko, fr: p.place.word, en: p.place.enWord });
    notes.push(go ? N_TO : N_AT);
  }
  if (p.obj) {
    kr.push(particle(p.obj.ko, '을', '를'));
    words.push({ tl: p.obj.ko, ...nounGloss(p.obj) });
    notes.push(N_OBJ);
  }

  let vk = v;
  let prefix = '';
  if (want) {
    const aux = third
      ? neg ? ['싶어하지 않', '싶어하지 않아', '싶어하지 않을'] : ['싶어하', '싶어해', '싶어할']
      : neg ? ['싶지 않', '싶지 않아', '싶지 않을'] : ['싶', '싶어', '싶을'];
    vk = { stem: v.stem + '고 ' + aux[0], a: v.stem + '고 ' + aux[1], f: v.stem + '고 ' + aux[2] };
    notes.push(third ? N_WANT3 : N_WANT);
    if (neg) notes.push(L('-지 않다 : négation', '-지 않다: negation'));
  } else if (neg) {
    if (v.neg) {
      vk = v.neg;
      notes.push(L(`${v.neg.kr} : le contraire de ${v.kr} (pas de 안)`, `${v.neg.kr}: the opposite of ${v.kr} (no 안)`));
    } else if (v.longNeg) {
      vk = { stem: v.stem + '지 않', a: v.stem + '지 않아', f: v.stem + '지 않을' };
      notes.push(N_LONGNEG);
    } else {
      prefix = '안 ';
      notes.push(N_NEG);
    }
  }
  kr.push(prefix + conjugate(vk, tense, style, question));
  words.push(neg && v.neg ? { tl: v.neg.kr, ...L('ne pas être bon', 'to taste bad') } : { tl: v.kr, fr: verbLabel(verb, 'fr'), en: verbLabel(verb, 'en') });
  notes.push(ENDING[style][tense]);
  if (question && style !== 'formal') notes.push(N_Q);

  const tl = kr.join(' ');
  return { tl, rom: romanize(tl), tiles: tl.replace(/[.?]$/, '').split(' '), sep: ' ', end: tl.slice(-1), words, notes: dedupe(notes) };
}

function dedupe(notes) {
  const seen = new Set();
  return notes.filter((n) => !seen.has(n.fr) && seen.add(n.fr));
}

// ---------- Phrases « gênantes » ----------
// Traductions anglaises, dans l'ordre de AWKWARD (contrôlé par les tests).
export const AWKWARD_EN = [
  { en: { present: 'I talk to my fridge every day.', past: 'I used to talk to my fridge every day.', future: 'I’m going to talk to my fridge every day.' }, w: ['fridge', 'to (someone)', 'to talk to'] },
  { en: { present: 'I secretly eat my friend’s cake.', past: 'I secretly ate my friend’s cake.', future: 'I’m going to secretly eat my friend’s cake.' }, w: ['cake', 'secretly', 'to eat'] },
  { en: { present: 'I dance all alone in front of the mirror.', past: 'I danced all alone in front of the mirror.', future: 'I’m going to dance all alone in front of the mirror.' }, w: ['mirror', 'in front of', 'alone', 'to dance'] },
  { en: { present: 'I sing at the top of my lungs on the subway.', past: 'I sang at the top of my lungs on the subway.', future: 'I’m going to sing at the top of my lungs on the subway.' }, w: ['subway', 'loudly', 'to sing'], note: '부르다 is irregular (르): 부르 + 어요 → 불러요.' },
  { en: { present: 'I cry at yogurt commercials.', past: 'I cried at a yogurt commercial.', future: 'I’m going to cry at a yogurt commercial.' }, w: ['yogurt', 'commercial', 'and (then)', 'to cry'] },
  { en: { present: 'I call my teacher “Mom”.', past: 'I called my teacher “Mom”.', future: 'I’m going to call my teacher “Mom”.' }, w: ['teacher', 'mom', 'to call (someone) “…”'] },
  { en: { present: 'I sniff my socks.', past: 'I sniffed my socks.', future: 'I’m going to sniff my socks.' }, w: ['socks', 'smell', 'to sniff'] },
  { en: { present: 'I interview myself in the shower.', past: 'I interviewed myself in the shower.', future: 'I’m going to interview myself in the shower.' }, w: ['to shower', 'while (doing)', 'interview'], note: '-면서: “while doing”.' },
  { en: { present: 'I forget my best friend’s name.', past: 'I forgot my best friend’s name.', future: 'I’m going to forget my best friend’s name.' }, w: ['to be close', 'name', 'to forget (casual)'] },
  { en: { present: 'I eat tons of garlic on a first date.', past: 'I ate tons of garlic on a first date.', future: 'I’m going to eat tons of garlic on a first date.' }, w: ['first', 'date', 'garlic', 'a lot'] },
  { en: { present: 'I fart in the middle of meetings.', past: 'I farted in the middle of a meeting.', future: 'I’m going to fart in the middle of the meeting.' }, w: ['meeting', 'during', 'to fart'] },
  { en: { present: 'I pick my nose in front of guests.', past: 'I picked my nose in front of the guests.', future: 'I’m going to pick my nose in front of the guests.' }, w: ['guest, customer', 'nose', 'to pick one’s nose'] },
  { en: { present: 'I send the text meant for my mom to the group chat.', past: 'I sent the text meant for my mom to the group chat.', future: 'I’m going to send the text meant for my mom to the group chat.' }, w: ['text message', 'group chat', 'to send'] },
  { en: { present: 'I trip in the street and act like nothing happened.', past: 'I tripped in the street and acted like nothing happened.' }, w: ['street', 'to fall', 'to be fine', 'to pretend'], note: '-(으)ㄴ 척하다: “to pretend to…”.' },
  { en: { present: 'I go to the office in my pajamas.', past: 'I went to the office in my pajamas.', future: 'I’m going to go to the office in my pajamas.' }, w: ['pajamas', 'to wear', 'and (then)', 'office'] },
  { en: { present: 'I snore my way through class.', past: 'I snored my way through class.', future: 'I’m going to snore my way through class.' }, w: ['class', 'to snore', 'to sleep'] },
  { en: { present: 'Have you ever smelled your toes?' }, w: ['toe', 'to have ever done'], note: '-아/어 본 적(이) 있다: “to have ever tried…”.' },
  { en: { present: 'Why do you still live with your parents?' }, w: ['why', 'still', 'parents', 'to live'] },
  { en: { present: 'Why do you keep staring at me like that?' }, w: ['like that', 'constantly', 'to look'] },
  { en: { present: 'Are you standing on my foot right now?' }, w: ['now', 'foot', 'to step on', 'to be …-ing'], note: '-고 있다: “to be doing”.' },
  { en: { past: 'Do I have something on my face?' }, w: ['face', 'something', 'to be stuck on'], note: '묻었어요 is past tense: the stain happened before, you see the result now.' },
  { en: { past: 'Did you read my diary yesterday?' }, w: ['yesterday', 'diary', 'to read'] },
  { en: { past: 'Did you just forget my name?' }, w: ['just now', 'name', 'to forget'] },
  { en: { past: 'Did you eat all my snacks, by any chance?' }, w: ['by any chance', 'snacks', 'all'] },
  { en: { past: 'Why did you ignore me yesterday?' }, w: ['to ignore', 'why'] },
];

const MARKERS = {
  polite: { je: '저는', moi: '저를', mon: '제' },
  formal: { je: '저는', moi: '저를', mon: '제' },
  casual: { je: '나는', moi: '나를', mon: '내' },
};
const ALL = ['present', 'past', 'future'];

function awkward(opts = {}, r = Math.random) {
  const style = opts.style || 'polite';
  const adjusted = [];
  const kind = opts.form === 'question' ? 'ask' : opts.form === 'affirm' ? 'say' : null;
  if (opts.form === 'neg' || opts.form === 'want') adjusted.push(L('En ton gênant, il n’y a que des affirmations et des questions.', 'Awkward mode only has statements and questions.'));
  let pool = AWKWARD.map((e, i) => ({ ...e, i })).filter((x) => !kind || x.kind === kind);
  let tense = !opts.tense || opts.tense === 'random' ? null : opts.tense;
  const fit = pool.filter((x) => !tense || (x.tenses || ALL).includes(tense));
  if (fit.length) pool = fit;
  const e = pick(r, pool);
  const en = AWKWARD_EN[e.i];
  const tenses = e.tenses || ALL;
  if (!tense || !tenses.includes(tense)) {
    if (tense) adjusted.push(L('Cette phrase n’existe qu’à un autre temps.', 'This sentence only exists in another tense.'));
    tense = pick(r, tenses);
  }
  const question = e.kind === 'ask';
  const m = MARKERS[style];
  const pre = e.pre.replace(/\{(je|moi|mon)\}/g, (_, k) => m[k]);
  const tl = pre + ' ' + conjugate(e.v, tense, style, question);
  const words = [];
  if (e.pre.includes('{je}')) words.push({ tl: m.je.slice(0, -1), ...(style === 'casual' ? SUBJ_GLOSS.meCasual : SUBJ_GLOSS.me) });
  e.w.forEach(([k, f], j) => words.push({ tl: k, fr: f, en: en.w[j] || f }));
  const notes = [];
  if (e.pre.includes('{je}')) notes.push(N_TOPIC);
  if (question && !e.pre.includes('{je}')) notes.push(N_YOU);
  if (e.note) notes.push(L(e.note, en.note || e.note));
  notes.push(ENDING[style][tense]);
  const fr = question ? e.fr[tense][style === 'casual' ? 0 : 1] : e.fr[tense];
  return {
    tl, rom: romanize(tl), tiles: tl.replace(/[.?]$/, '').split(' '), sep: ' ', end: tl.slice(-1),
    fr, en: en.en[tense], words, notes, adjusted,
    meta: { level: Number(opts.level) || 1, tense, style, form: question ? 'question' : 'affirm', theme: 'all', mood: 'awkward' },
  };
}

// ---------- Vocabulaire de base (hors générateur) ----------
const w = (tl, fr, en, t) => ({ tl, fr, en, t });
const BASICS = [
  w('안녕하세요', 'bonjour', 'hello', 'basics'),
  w('감사합니다', 'merci', 'thank you', 'basics'),
  w('고마워', 'merci (familier)', 'thanks (casual)', 'basics'),
  w('죄송합니다', 'je suis désolé(e)', 'I’m sorry', 'basics'),
  w('네', 'oui', 'yes', 'basics'),
  w('아니요', 'non', 'no', 'basics'),
  w('괜찮아요', 'ça va, pas de souci', 'it’s okay, no problem', 'basics'),
  w('안녕히 가세요', 'au revoir (à qui s’en va)', 'goodbye (to someone leaving)', 'basics'),
  w('안녕히 계세요', 'au revoir (à qui reste)', 'goodbye (to someone staying)', 'basics'),
  w('잘 먹겠습니다', 'bon appétit (avant de manger)', 'bon appétit (before eating)', 'basics'),
  w('주세요', 'donnez-moi, s’il vous plaît', 'please give me', 'basics'),
  w('얼마예요?', 'combien ça coûte ?', 'how much is it?', 'basics'),
  w('맛있어요', 'c’est délicieux', 'it’s delicious', 'basics'),
  w('사랑해요', 'je t’aime', 'I love you', 'basics'),
  w('화이팅', 'courage ! (encouragement)', 'you can do it!', 'basics'),
  w('일', 'un (1, sino-coréen)', 'one (1, Sino-Korean)', 'basics'),
  w('이', 'deux (2, sino-coréen)', 'two (2, Sino-Korean)', 'basics'),
  w('삼', 'trois (3, sino-coréen)', 'three (3, Sino-Korean)', 'basics'),
  w('사', 'quatre (4, sino-coréen)', 'four (4, Sino-Korean)', 'basics'),
  w('오', 'cinq (5, sino-coréen)', 'five (5, Sino-Korean)', 'basics'),
  w('십', 'dix (10, sino-coréen)', 'ten (10, Sino-Korean)', 'basics'),
  w('백', 'cent (100)', 'hundred (100)', 'basics'),
  w('하나', 'un (1, coréen natif)', 'one (1, native Korean)', 'basics'),
  w('둘', 'deux (2, coréen natif)', 'two (2, native Korean)', 'basics'),
  w('셋', 'trois (3, coréen natif)', 'three (3, native Korean)', 'basics'),
  w('넷', 'quatre (4, coréen natif)', 'four (4, native Korean)', 'basics'),
  w('다섯', 'cinq (5, coréen natif)', 'five (5, native Korean)', 'basics'),
  w('엄마', 'maman', 'mom', 'daily'),
  w('아빠', 'papa', 'dad', 'daily'),
  w('어머니', 'mère', 'mother', 'daily'),
  w('아버지', 'père', 'father', 'daily'),
  w('언니', 'grande sœur (pour une fille)', 'older sister (said by a girl)', 'daily'),
  w('누나', 'grande sœur (pour un garçon)', 'older sister (said by a boy)', 'daily'),
  w('오빠', 'grand frère (pour une fille)', 'older brother (said by a girl)', 'daily'),
  w('형', 'grand frère (pour un garçon)', 'older brother (said by a boy)', 'daily'),
  w('동생', 'petit frère / petite sœur', 'younger sibling', 'daily'),
  w('오늘', 'aujourd’hui', 'today', 'daily'),
  w('내일', 'demain', 'tomorrow', 'daily'),
  w('어제', 'hier', 'yesterday', 'daily'),
  w('지금', 'maintenant', 'now', 'daily'),
  w('아침', 'matin, petit-déjeuner', 'morning, breakfast', 'daily'),
  w('저녁', 'soir, dîner', 'evening, dinner', 'daily'),
  w('주말', 'week-end', 'weekend', 'daily'),
  w('날씨', 'temps (météo)', 'weather', 'daily'),
  w('빨간색', 'rouge', 'red', 'basics'),
  w('파란색', 'bleu', 'blue', 'basics'),
  w('노란색', 'jaune', 'yellow', 'basics'),
  w('초록색', 'vert', 'green', 'basics'),
  w('하얀색', 'blanc', 'white', 'basics'),
  w('검은색', 'noir', 'black', 'basics'),
  w('사진', 'photo', 'photo', 'leisure'),
  w('사람', 'personne, gens', 'person, people', 'daily'),
  w('이름', 'nom, prénom', 'name', 'basics'),
  w('시간', 'temps, heure', 'time, hour', 'daily'),
  w('돈', 'argent', 'money', 'city'),
  w('계란', 'œuf', 'egg', 'food'),
  w('과일', 'fruit', 'fruit', 'food'),
  w('숙제', 'devoirs', 'homework', 'study'),
  w('시험', 'examen', 'exam', 'study'),
  w('여행', 'voyage', 'trip, travel', 'city'),
  w('공항', 'aéroport', 'airport', 'city'),
  w('호텔', 'hôtel', 'hotel', 'city'),
  w('길', 'route, chemin', 'road, way', 'city'),
];

function buildWords() {
  const all = [
    ...NOUNS.filter((x) => x.ko).map((x) => ({ tl: x.ko, fr: x.fr, en: x.en, t: x.t })),
    ...PLACES.filter((x) => x.ko).map((x) => ({ tl: x.ko, fr: x.word, en: x.enWord, t: x.t })),
    ...VERBS.map((x) => ({ tl: x.ko.kr, fr: verbLabel(x, 'fr'), en: verbLabel(x, 'en'), t: x.t[0] })),
    ...VERBS.filter((x) => x.ko.neg).map((x) => ({ tl: x.ko.neg.kr, fr: 'ne pas être bon (goût)', en: 'to taste bad', t: x.t[0] })),
    ...BASICS,
  ];
  const seen = new Set();
  return all.filter((x) => !seen.has(x.tl) && seen.add(x.tl)).map((x) => ({ id: x.tl, ...x }));
}

// ---------- Alphabet ----------
const TIPS_EN = {
  ㅏ: '“a” as in “father”', ㅑ: '“ya” as in “yard”', ㅓ: 'open “o”, between “o” and “u”, as in “awe”', ㅕ: '“yuh”, like “young”',
  ㅗ: 'closed “o”, rounded lips', ㅛ: '“yo” as in “yoga”', ㅜ: '“oo” as in “moon”', ㅠ: '“you”', ㅡ: '“eu”: lips spread, not rounded', ㅣ: '“ee” as in “see”',
  ㅐ: '“e” as in “bed”', ㅔ: '“e” as in “bed” (almost the same as ㅐ today)', ㅒ: '“ye” as in “yes”', ㅖ: '“ye”', ㅘ: 'ㅗ + ㅏ: “wa”', ㅙ: 'ㅗ + ㅐ: “we” as in “wet”',
  ㅚ: '“we” (close to ㅙ)', ㅝ: 'ㅜ + ㅓ: “wo” as in “won”', ㅞ: 'ㅜ + ㅔ: “we”', ㅟ: 'ㅜ + ㅣ: “wee”', ㅢ: 'ㅡ + ㅣ: “eu-i” glided',
  ㄱ: 'soft “g”, “k” at the end of a syllable', ㄴ: '“n”', ㄷ: 'soft “d”, “t” at the end', ㄹ: 'light flapped “r” at the start, “l” at the end', ㅁ: '“m”',
  ㅂ: 'soft “b”, “p” at the end', ㅅ: '“s” (“sh” before ㅣ)', ㅇ: 'silent at the start, “ng” at the end', ㅈ: 'soft “j”', ㅊ: '“ch” with a puff of air',
  ㅋ: '“k” with a puff of air', ㅌ: '“t” with a puff of air', ㅍ: '“p” with a puff of air', ㅎ: 'breathy “h”',
  ㄲ: 'tense “k”, no puff of air', ㄸ: 'tense “t”, no puff of air', ㅃ: 'tense “p”, no puff of air', ㅆ: 'strong “s”', ㅉ: 'tense “j”, no puff of air',
};
const SET_LABELS = { vowels: L('Voyelles', 'Vowels'), consonants: L('Consonnes', 'Consonants'), compound: L('Voyelles composées', 'Compound vowels'), double: L('Consonnes doubles', 'Double consonants') };
const SETS = Object.fromEntries(Object.entries(JAMO_SETS).map(([k, s]) => [k, {
  label: SET_LABELS[k],
  decoys: k === 'compound' ? VOWELS : k === 'double' ? CONSONANTS : [],
  items: s.items.map((x) => ({ ...x, tip: L(x.tip, TIPS_EN[x.j] || x.tip) })),
}]));

const pickR = (a) => a[Math.floor(Math.random() * a.length)];
function randomSyllable() {
  const cons = CONSONANTS.map((c) => CHO.indexOf(c.j));
  const vows = VOWELS.map((v) => JUNG.indexOf(v.j));
  const fins = [0, 0, 0, ...['ㄴ', 'ㅁ', 'ㅇ', 'ㄹ', 'ㄱ'].map((j) => JONG.indexOf(j))];
  const s = compose(pickR(cons), pickR(vows), pickR(fins));
  return { text: s, rom: romanize(s) };
}

export const KO = {
  id: 'ko',
  name: L('Coréen', 'Korean'),
  native: '한국어',
  flag: '🇰🇷',
  tts: 'ko-KR',
  appName: 'Haru',
  appKo: '하루',
  styles: ['polite', 'formal', 'casual'],
  greeting(h) {
    if (h < 5 || h >= 18) return '좋은 저녁이에요';
    if (h < 12) return '좋은 아침이에요';
    return '안녕하세요';
  },
  testVoice: '안녕하세요. 만나서 반가워요.',
  script: {
    title: L('Hangeul', 'Hangul'),
    sets: SETS,
    builder: true,
    randomSyllable,
    syllableLabel: L('Syllabes', 'Syllables'),
    syllableSample: '가나다',
  },
  _words: null,
  get words() { return (this._words ||= buildWords()); },
  romanize: (text) => romanize(text),
  wordRom: (w) => romanize(w.tl),
  wordRead: (w) => w.tl,
  render,
  awkward,
  guide: { fr: GUIDE, en: GUIDE_EN },
};

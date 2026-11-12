// Cours de japonais : conjugaison, rendu des phrases, phrases « gênantes », kana, vocabulaire de base.
import { NOUNS, PLACES, VERBS, verbLabel } from '../content/concepts.js';
import { KANA_SETS, kanaToRomaji, particleRomaji, toHira } from './kana.js';
import { KANJI_NUM, KANJI_LIFE, KANJI_ACTION } from '../content/kanji.js';
import { GUIDE_JA } from '../content/guide.ja.js';
import { GUIDE_JA_EN } from '../content/guide.ja.en.js';
import { GUIDE_JA_PLUS } from '../content/guide.ja.plus.js';
import { GUIDE_JA_ADV } from '../content/guide.ja.adv.js';
import { localize } from '../content/guide.util.js';
import { AWKWARD } from '../content/awkward.js';
import { AWKWARD_EN } from './ko.js';
import { pick } from '../generator.js';

const L = (fr, en) => ({ fr, en });

// ---------- Conjugaison ----------
const U2I = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' };
const U2A = { う: 'わ', く: 'か', ぐ: 'が', す: 'さ', つ: 'た', ぬ: 'な', ぶ: 'ば', む: 'ま', る: 'ら' };
const TA = { う: 'った', つ: 'った', る: 'った', く: 'いた', ぐ: 'いだ', す: 'した', ぬ: 'んだ', ぶ: 'んだ', む: 'んだ' };
const cut = (s, n) => s.slice(0, s.length - n);
const add = (pair, x) => [pair[0] + x, pair[1] + x];

/** Radicaux d'un verbe : forme du dictionnaire, en -ます, en -ない, en -た. */
export function stems(v) {
  const { w, r, g } = v;
  if (g === '1') return { dict: [w, r], masu: [cut(w, 1), cut(r, 1)], nai: [cut(w, 1), cut(r, 1)], ta: [cut(w, 1) + 'た', cut(r, 1) + 'た'] };
  if (g === 'suru') {
    const W = cut(w, 2);
    const R = cut(r, 2);
    return { dict: [w, r], masu: [W + 'し', R + 'し'], nai: [W + 'し', R + 'し'], ta: [W + 'した', R + 'した'] };
  }
  if (g === 'kuru') return { dict: [w, r], masu: ['来', 'き'], nai: ['来', 'こ'], ta: ['来た', 'きた'] };
  const e = r.slice(-1);
  const W = cut(w, 1);
  const R = cut(r, 1);
  const ta = g === 'iku' ? 'った' : TA[e];
  return { dict: [w, r], masu: [W + U2I[e], R + U2I[e]], nai: [W + U2A[e], R + U2A[e]], ta: [W + ta, R + ta] };
}

/** Adjectif en い (ou forme en たい) : formes non passée / passée, affirmative / négative. */
function iAdj(dict, stem, past, neg, polite) {
  let f;
  if (past) f = neg ? add(stem, 'くなかった') : add(stem, 'かった');
  else f = neg ? add(stem, 'くない') : dict;
  return polite ? add(f, 'です') : f;
}

/**
 * Conjugue un verbe ou un adjectif japonais.
 * o : { tense, polite, neg, question, want, third } → [écriture, lecture]
 */
export function conjugateJa(v, o) {
  const past = o.tense === 'past';
  const q = o.question && o.polite ? 'か' : '';
  if (v.g === 'i') {
    const stem = v.r === 'いい' ? ['よ', 'よ'] : [cut(v.w, 1), cut(v.r, 1)];
    return add(iAdj([v.w, v.r], stem, past, o.neg, o.polite), q);
  }
  if (v.g === 'na') {
    let end;
    if (o.polite) end = past ? (o.neg ? 'じゃなかったです' : 'でした') : o.neg ? 'じゃないです' : 'です';
    else end = past ? (o.neg ? 'じゃなかった' : 'だった') : o.neg ? 'じゃない' : o.question ? '' : 'だ';
    return add([v.w, v.r], end + q);
  }
  const s = stems(v);
  if (o.want && !o.third) {
    const tai = add(s.masu, 'たい');
    return add(iAdj(tai, add(s.masu, 'た'), past, o.neg, o.polite), q);
  }
  if (o.want && o.third) {
    const base = add(s.masu, 'たがってい');
    let end;
    if (o.polite) end = past ? (o.neg ? 'ませんでした' : 'ました') : o.neg ? 'ません' : 'ます';
    else end = past ? (o.neg ? 'なかった' : 'た') : o.neg ? 'ない' : 'る';
    return add(base, end + q);
  }
  if (o.polite) return add(s.masu, (past ? (o.neg ? 'ませんでした' : 'ました') : o.neg ? 'ません' : 'ます') + q);
  if (o.neg) return add(s.nai, past ? 'なかった' : 'ない');
  return past ? s.ta : s.dict;
}

// ---------- Notes ----------
const N = {
  wa: L('は (wa) : particule de thème, « quant à… »', 'は (wa): topic particle, “as for…”'),
  ga: L('が : particule de sujet', 'が: subject particle'),
  gaSuki: L('が : avec 好き, marque ce qu’on aime (pas を)', 'が: with 好き it marks what you like (not を)'),
  o: L('を (o) : complément d’objet', 'を (o): object particle'),
  niTo: L('に : destination, « à / vers »', 'に: destination, “to”'),
  niVerb: L('に : 会う (voir quelqu’un) et 乗る (monter dans) prennent に, pas を', 'に: 会う (to meet) and 乗る (to ride) take に, not を'),
  de: L('で : lieu où se passe l’action', 'で: place where the action happens'),
  you: L('Le « tu / vous » est sous-entendu : en japonais, on l’omet quand il est évident.', 'The “you” is implied: Japanese drops it when it is obvious.'),
  future: L('Pas de futur en japonais : la forme non passée + un mot comme 明日 suffit.', 'Japanese has no future tense: the non-past form + a word like 明日 is enough.'),
  want: L('〜たい : vouloir ; se conjugue comme un adjectif en い (たくない, たかった)', '〜たい: to want to; conjugates like an い adjective (たくない, たかった)'),
  want3: L('〜たがっている : envie d’une autre personne (たい est réservé à soi ou à l’interlocuteur)', '〜たがっている: someone else’s wish (たい is for yourself or the listener)'),
  qPolite: L('か : transforme la phrase polie en question', 'か: turns a polite sentence into a question'),
  qCasual: L('Question familière : intonation montante, sans か', 'Casual question: rising intonation, no か'),
  iAdj: L('Adjectif en い : 〜くない (négatif), 〜かった (passé) ; いい devient よくない, よかった', 'い adjective: 〜くない (negative), 〜かった (past); いい becomes よくない, よかった'),
  naAdj: L('Adjectif en な : です, じゃないです (négatif), でした (passé)', 'な adjective: です, じゃないです (negative), でした (past)'),
  timeWa: L('は après le moment (今日は…) : « en ce qui concerne aujourd’hui… »', 'は after the time word (今日は…): “as for today…”'),
};
function endingNote(polite, past, neg) {
  if (polite) {
    if (past) return neg ? L('〜ませんでした : passé négatif poli', '〜ませんでした: polite negative past') : L('〜ました : passé poli', '〜ました: polite past');
    return neg ? L('〜ません : négation polie', '〜ません: polite negative') : L('〜ます : forme polie, non passée (présent ou futur)', '〜ます: polite non-past form (present or future)');
  }
  if (past) return neg ? L('〜なかった : passé négatif familier', '〜なかった: casual negative past') : L('〜た / 〜だ : passé familier', '〜た / 〜だ: casual past');
  return neg ? L('〜ない : négation familière', '〜ない: casual negative') : L('Forme du dictionnaire : style familier, non passé', 'Dictionary form: casual, non-past');
}

// ---------- Rendu ----------
const SUBJ = { me: ['私', 'わたし', L('je, moi', 'I, me')], friend: ['友達', 'ともだち', L('ami(e)', 'friend')], we: ['私たち', 'わたしたち', L('nous', 'we')] };

/** Assemble des jetons { w, r, p } : texte, lecture, rōmaji, étiquettes. */
export function assemble(tokens, end) {
  const tl = tokens.map((t) => t.w + (t.p || '')).join('') + end;
  const spaced = (x) => x.replace(/(\S?)ja(nai|nakatta)$/, (_, a, b) => (a ? a + ' ' : '') + 'ja ' + b).replace(/([a-z])(desu|deshita|da|datta)$/, '$1 $2');
  const rom = tokens.map((t) => [spaced(kanaToRomaji(t.r)), t.p ? particleRomaji(t.p) : ''].filter(Boolean).join(' ')).join(' ');
  return {
    tl,
    reading: tokens.map((t) => t.r + (t.p || '')).join('') + end,
    rom: rom.charAt(0).toUpperCase() + rom.slice(1) + (end === '？' ? '?' : '.'),
    ruby: tokens,
    tiles: tokens.map((t) => t.w + (t.p || '')),
    sep: '',
    end,
  };
}

function render(p, style) {
  const polite = style !== 'casual';
  const { verb, tense, neg, question, want } = p;
  const v = verb.ja;
  const tokens = [];
  const words = [];
  const notes = [];
  const third = p.subj === 'friend';
  const isAdj = v.g === 'i' || v.g === 'na' || verb.type === 'adj' || verb.type === 'weather';

  const timeTok = p.time ? { w: p.time.ja[0], r: p.time.ja[1], p: p.time.ja[2] || '' } : null;
  if (p.time) words.push({ tl: p.time.ja[0], r: p.time.ja[1], fr: p.time.fr, en: p.time.en });

  if (p.subj === 'weather') {
    if (timeTok) {
      tokens.push({ ...timeTok, p: timeTok.p || 'は' });
      if (!timeTok.p) notes.push(N.timeWa);
    }
    if (v.subj) {
      tokens.push({ w: v.subj[0], r: v.subj[1], p: 'が' });
      words.push({ tl: v.subj[0], r: v.subj[1], ...L('temps (météo)', 'weather') });
      notes.push(N.ga);
    }
  } else if (p.subj === 'thing') {
    if (timeTok) tokens.push(timeTok);
    tokens.push({ w: p.thing.ja[0], r: p.thing.ja[1], p: 'は' });
    words.push({ tl: p.thing.ja[0], r: p.thing.ja[1], fr: p.thing.fr, en: p.thing.en });
    notes.push(N.wa);
  } else {
    if (p.subj === 'you') notes.push(N.you);
    else {
      const [w, r, g] = SUBJ[p.subj];
      tokens.push({ w, r, p: 'は' });
      words.push({ tl: w, r, ...g });
      notes.push(N.wa);
    }
    if (timeTok) tokens.push(timeTok);
  }
  if (p.place) {
    const go = verb.type === 'go';
    tokens.push({ w: p.place.ja[0], r: p.place.ja[1], p: go ? 'に' : 'で' });
    words.push({ tl: p.place.ja[0], r: p.place.ja[1], fr: p.place.word, en: p.place.enWord });
    notes.push(go ? N.niTo : N.de);
  }
  if (p.obj) {
    const part = v.p || 'を';
    tokens.push({ w: p.obj.ja[0], r: p.obj.ja[1], p: part });
    words.push({ tl: p.obj.ja[0], r: p.obj.ja[1], fr: p.obj.fr, en: p.obj.en });
    notes.push(part === 'が' ? N.gaSuki : part === 'に' ? N.niVerb : N.o);
  }
  const [cw, cr] = conjugateJa(v, { tense, polite, neg, question: question && !polite, want, third });
  tokens.push({ w: cw, r: cr, p: question && polite ? 'か' : '' });
  words.push({ tl: v.w, r: v.r, fr: verbLabel(verb, 'fr'), en: verbLabel(verb, 'en'), ...(v.label || {}) });
  if (want) notes.push(third ? N.want3 : N.want);
  else if (v.g === 'i') notes.push(N.iAdj);
  else if (v.g === 'na') notes.push(N.naAdj);
  if (!want && !isAdj) notes.push(endingNote(polite, tense === 'past', neg));
  if (tense === 'future') notes.push(N.future);
  if (question) notes.push(polite ? N.qPolite : N.qCasual);

  return { ...assemble(tokens, question ? '？' : '。'), words, notes };
}

// ---------- Phrases « gênantes » ----------
// k : indice de la phrase coréenne équivalente (traductions partagées) ; from : temps de la traduction à réutiliser.
const T = (w, r, p = '') => ({ w, r, p });
const JV = {
  hanashikakeru: { w: '話しかける', r: 'はなしかける', g: '1' },
  taberu: { w: '食べる', r: 'たべる', g: '1' },
  odoru: { w: '踊る', r: 'おどる', g: '5' },
  utau: { w: '歌う', r: 'うたう', g: '5' },
  naku: { w: '泣く', r: 'なく', g: '5' },
  yobu: { w: '呼ぶ', r: 'よぶ', g: '5' },
  kagu: { w: 'かぐ', r: 'かぐ', g: '5' },
  suru: { w: 'する', r: 'する', g: 'suru' },
  wasureru: { w: '忘れる', r: 'わすれる', g: '1' },
  hojiru: { w: 'ほじる', r: 'ほじる', g: '5' },
  okuru: { w: '送る', r: 'おくる', g: '5' },
  iku: { w: '行く', r: 'いく', g: 'iku' },
  neru: { w: '寝る', r: 'ねる', g: '1' },
  aru: { w: 'ある', r: 'ある', g: '5' },
  sundeiru: { w: '住んでいる', r: 'すんでいる', g: '1' },
  miteiru: { w: '見ている', r: 'みている', g: '1' },
  fundeiru: { w: '踏んでいる', r: 'ふんでいる', g: '1' },
  tsuiteiru: { w: 'ついている', r: 'ついている', g: '1' },
  yomu: { w: '読む', r: 'よむ', g: '5' },
  mushisuru: { w: '無視する', r: 'むしする', g: 'suru' },
};
const ME = T('私', 'わたし', 'は');

export const AWKWARD_JA = [
  { k: 0, kind: 'say', pre: [ME, T('毎日', 'まいにち'), T('冷蔵庫', 'れいぞうこ', 'に')], v: JV.hanashikakeru, w: [['冷蔵庫', 'れいぞうこ', 'frigo', 'fridge'], ['話しかける', 'はなしかける', 'adresser la parole', 'to talk to']] },
  { k: 1, kind: 'say', pre: [ME, T('友達', 'ともだち', 'の'), T('ケーキ', 'けーき', 'を'), T('こっそり', 'こっそり')], v: JV.taberu, w: [['こっそり', 'こっそり', 'en cachette', 'secretly'], ['〜の', 'の', 'de (possession)', '’s (possession)']] },
  { k: 2, kind: 'say', pre: [ME, T('鏡', 'かがみ', 'の'), T('前', 'まえ', 'で'), T('一人', 'ひとり', 'で')], v: JV.odoru, w: [['鏡', 'かがみ', 'miroir', 'mirror'], ['一人で', 'ひとりで', 'seul(e)', 'alone'], ['踊る', 'おどる', 'danser', 'to dance']] },
  { k: 3, kind: 'say', pre: [ME, T('電車', 'でんしゃ', 'で'), T('大声', 'おおごえ', 'で')], v: JV.utau, w: [['電車', 'でんしゃ', 'train', 'train'], ['大声で', 'おおごえで', 'à voix haute', 'loudly'], ['歌う', 'うたう', 'chanter', 'to sing']],
    fr: { present: 'Je chante à tue-tête dans le train.', past: 'J’ai chanté à tue-tête dans le train.', future: 'Je vais chanter à tue-tête dans le train.' },
    en: { present: 'I sing at the top of my lungs on the train.', past: 'I sang at the top of my lungs on the train.', future: 'I’m going to sing at the top of my lungs on the train.' } },
  { k: 4, kind: 'say', pre: [ME, T('ヨーグルト', 'よーぐると', 'の'), T('CM', 'しーえむ', 'を'), T('見て', 'みて')], v: JV.naku, w: [['CM', 'しーえむ', 'publicité', 'commercial'], ['見て', 'みて', 'en regardant (forme en て)', 'watching (て form)'], ['泣く', 'なく', 'pleurer', 'to cry']] },
  { k: 5, kind: 'say', pre: [ME, T('先生', 'せんせい', 'を'), T('「お母さん」', '「おかあさん」', 'と')], v: JV.yobu, w: [['先生', 'せんせい', 'professeur', 'teacher'], ['お母さん', 'おかあさん', 'maman', 'mom'], ['〜と呼ぶ', 'とよぶ', 'appeler « … »', 'to call “…”']] },
  { k: 6, kind: 'say', pre: [ME, T('自分', 'じぶん', 'の'), T('靴下', 'くつした', 'の'), T('におい', 'におい', 'を')], v: JV.kagu, w: [['靴下', 'くつした', 'chaussettes', 'socks'], ['におい', 'におい', 'odeur', 'smell'], ['かぐ', 'かぐ', 'renifler', 'to sniff']] },
  { k: 7, kind: 'say', pre: [ME, T('シャワー', 'しゃわー', 'を'), T('浴びながら', 'あびながら'), T('一人', 'ひとり', 'で'), T('インタビュー', 'いんたびゅー', 'を')], v: JV.suru, w: [['シャワーを浴びる', 'しゃわーをあびる', 'se doucher', 'to shower'], ['〜ながら', 'ながら', 'en (faisant)', 'while (doing)']], note: L('〜ながら : « pendant que, en faisant ».', '〜ながら: “while doing”.') },
  { k: 8, kind: 'say', pre: [ME, T('親友', 'しんゆう', 'の'), T('名前', 'なまえ', 'を')], v: JV.wasureru, w: [['親友', 'しんゆう', 'meilleur ami', 'best friend'], ['名前', 'なまえ', 'prénom', 'name'], ['忘れる', 'わすれる', 'oublier', 'to forget']] },
  { k: 9, kind: 'say', pre: [ME, T('初デート', 'はつでーと', 'で'), T('にんにく', 'にんにく', 'を'), T('たくさん', 'たくさん')], v: JV.taberu, w: [['初デート', 'はつでーと', 'premier rendez-vous', 'first date'], ['にんにく', 'にんにく', 'ail', 'garlic'], ['たくさん', 'たくさん', 'beaucoup', 'a lot']] },
  { k: 10, kind: 'say', pre: [ME, T('会議中', 'かいぎちゅう', 'に'), T('おなら', 'おなら', 'を')], v: JV.suru, w: [['会議', 'かいぎ', 'réunion', 'meeting'], ['〜中に', 'ちゅうに', 'pendant', 'during'], ['おならをする', 'おならをする', 'péter', 'to fart']] },
  { k: 11, kind: 'say', pre: [ME, T('お客さん', 'おきゃくさん', 'の'), T('前', 'まえ', 'で'), T('鼻', 'はな', 'を')], v: JV.hojiru, w: [['お客さん', 'おきゃくさん', 'invité, client', 'guest'], ['鼻', 'はな', 'nez', 'nose'], ['ほじる', 'ほじる', 'se curer (le nez)', 'to pick']] },
  { k: 12, kind: 'say', pre: [ME, T('お母さん', 'おかあさん', 'への'), T('メッセージ', 'めっせーじ', 'を'), T('グループ', 'ぐるーぷ', 'に')], v: JV.okuru, w: [['〜への', 'への', 'destiné à', 'meant for'], ['グループ', 'ぐるーぷ', 'groupe (de discussion)', 'group chat'], ['送る', 'おくる', 'envoyer', 'to send']] },
  { k: 14, kind: 'say', pre: [ME, T('パジャマ', 'ぱじゃま', 'で'), T('会社', 'かいしゃ', 'に')], v: JV.iku, w: [['パジャマ', 'ぱじゃま', 'pyjama', 'pajamas'], ['会社', 'かいしゃ', 'bureau, entreprise', 'office'], ['行く', 'いく', 'aller', 'to go']] },
  { k: 15, kind: 'say', pre: [ME, T('授業中', 'じゅぎょうちゅう', 'に'), T('いびき', 'いびき', 'を'), T('かいて', 'かいて')], v: JV.neru, w: [['授業', 'じゅぎょう', 'cours', 'class'], ['いびきをかく', 'いびきをかく', 'ronfler', 'to snore'], ['寝る', 'ねる', 'dormir', 'to sleep']] },
  { k: 13, kind: 'say', tenses: ['present', 'past'], pre: [ME, T('道', 'みち', 'で'), T('転んで', 'ころんで'), T('何も', 'なにも'), T('なかった', 'なかった'), T('ふり', 'ふり', 'を')], v: JV.suru, w: [['転ぶ', 'ころぶ', 'tomber', 'to fall'], ['何もなかった', 'なにもなかった', 'il ne s’est rien passé', 'nothing happened'], ['〜ふりをする', 'ふりをする', 'faire semblant', 'to pretend']], note: L('〜ふりをする : « faire semblant de… ».', '〜ふりをする: “to pretend to…”.') },
  { k: 16, kind: 'ask', tenses: ['present'], pre: [T('自分', 'じぶん', 'の'), T('足', 'あし', 'の'), T('指', 'ゆび', 'の'), T('におい', 'におい', 'を'), T('かいだ', 'かいだ'), T('こと', 'こと', 'が')], v: JV.aru, w: [['足の指', 'あしのゆび', 'orteil', 'toe'], ['〜たことがある', 'たことがある', 'avoir déjà fait', 'to have ever done']], note: L('〜たことがある : « avoir déjà fait… ».', '〜たことがある: “to have ever done…”.') },
  { k: 17, kind: 'ask', tenses: ['present'], pre: [T('どうして', 'どうして'), T('まだ', 'まだ'), T('両親', 'りょうしん', 'と')], v: JV.sundeiru, w: [['どうして', 'どうして', 'pourquoi', 'why'], ['まだ', 'まだ', 'encore', 'still'], ['両親', 'りょうしん', 'parents', 'parents'], ['住む', 'すむ', 'habiter', 'to live']] },
  { k: 18, kind: 'ask', tenses: ['present'], pre: [T('どうして', 'どうして'), T('そんなに', 'そんなに'), T('私', 'わたし', 'を')], v: JV.miteiru, w: [['そんなに', 'そんなに', 'autant, comme ça', 'like that'], ['見ている', 'みている', 'être en train de regarder', 'to be looking']] },
  { k: 19, kind: 'ask', tenses: ['present'], pre: [T('今', 'いま'), T('私', 'わたし', 'の'), T('足', 'あし', 'を')], v: JV.fundeiru, w: [['足', 'あし', 'pied', 'foot'], ['踏む', 'ふむ', 'marcher sur', 'to step on'], ['〜ている', 'ている', 'être en train de', 'to be …-ing']], note: L('〜ている : « être en train de… ».', '〜ている: “to be doing…”.') },
  { k: 20, kind: 'ask', tenses: ['present'], from: { present: 'past' }, pre: [T('私', 'わたし', 'の'), T('顔', 'かお', 'に'), T('何か', 'なにか')], v: JV.tsuiteiru, w: [['顔', 'かお', 'visage', 'face'], ['何か', 'なにか', 'quelque chose', 'something'], ['つく', 'つく', 'être collé à', 'to be stuck on']] },
  { k: 21, kind: 'ask', tenses: ['past'], pre: [T('昨日', 'きのう'), T('私', 'わたし', 'の'), T('日記', 'にっき', 'を')], v: JV.yomu, w: [['昨日', 'きのう', 'hier', 'yesterday'], ['日記', 'にっき', 'journal intime', 'diary'], ['読む', 'よむ', 'lire', 'to read']] },
  { k: 22, kind: 'ask', tenses: ['past'], pre: [T('今', 'いま'), T('私', 'わたし', 'の'), T('名前', 'なまえ', 'を')], v: JV.wasureru, w: [['今', 'いま', 'à l’instant', 'just now'], ['名前', 'なまえ', 'prénom', 'name'], ['忘れる', 'わすれる', 'oublier', 'to forget']] },
  { k: 23, kind: 'ask', tenses: ['past'], pre: [T('もしかして', 'もしかして'), T('私', 'わたし', 'の'), T('お菓子', 'おかし', 'を'), T('全部', 'ぜんぶ')], v: JV.taberu, w: [['もしかして', 'もしかして', 'par hasard', 'by any chance'], ['お菓子', 'おかし', 'biscuits, bonbons', 'snacks'], ['全部', 'ぜんぶ', 'tout', 'all']] },
  { k: 24, kind: 'ask', tenses: ['past'], pre: [T('昨日', 'きのう'), T('どうして', 'どうして'), T('私', 'わたし', 'を')], v: JV.mushisuru, w: [['無視する', 'むしする', 'ignorer', 'to ignore'], ['どうして', 'どうして', 'pourquoi', 'why']] },
];
const ALL = ['present', 'past', 'future'];

function awkward(opts = {}, r = Math.random) {
  let style = opts.style || 'polite';
  const adjusted = [];
  if (style === 'formal') {
    style = 'polite';
    adjusted.push(L('Le japonais se pratique ici en style poli ou familier.', 'Japanese is practised here in polite or casual style.'));
  }
  const polite = style !== 'casual';
  const kind = opts.form === 'question' ? 'ask' : opts.form === 'affirm' ? 'say' : null;
  if (opts.form === 'neg' || opts.form === 'want') adjusted.push(L('En ton gênant, il n’y a que des affirmations et des questions.', 'Awkward mode only has statements and questions.'));
  let pool = AWKWARD_JA.filter((x) => !kind || x.kind === kind);
  let tense = !opts.tense || opts.tense === 'random' ? null : opts.tense;
  const fit = pool.filter((x) => !tense || (x.tenses || ALL).includes(tense));
  if (fit.length) pool = fit;
  const e = pick(r, pool);
  const tenses = e.tenses || ALL;
  if (!tense || !tenses.includes(tense)) {
    if (tense) adjusted.push(L('Cette phrase n’existe qu’à un autre temps.', 'This sentence only exists in another tense.'));
    tense = pick(r, tenses);
  }
  const question = e.kind === 'ask';
  const [cw, cr] = conjugateJa(e.v, { tense, polite, neg: false, question: question && !polite });
  const out = assemble([...e.pre, { w: cw, r: cr, p: question && polite ? 'か' : '' }], question ? '？' : '。');
  const src = tense && e.from?.[tense] ? e.from[tense] : tense;
  const ko = AWKWARD[e.k];
  const koEn = AWKWARD_EN[e.k];
  const fr = e.fr ? e.fr[src] : question ? ko.fr[src][style === 'casual' ? 0 : 1] : ko.fr[src];
  const en = e.en ? e.en[src] : koEn.en[src];
  const words = [];
  if (e.pre[0] === ME) words.push({ tl: '私', r: 'わたし', ...L('je, moi', 'I, me') });
  words.push(...e.w.map(([tl, rd, f, g]) => ({ tl, r: rd, fr: f, en: g })));
  const notes = [];
  if (e.pre[0] === ME) notes.push(N.wa);
  else notes.push(N.you);
  if (e.note) notes.push(e.note);
  notes.push(endingNote(polite, tense === 'past', false));
  if (question) notes.push(polite ? N.qPolite : N.qCasual);
  return {
    ...out, fr, en, words, notes, adjusted,
    meta: { level: Number(opts.level) || 1, tense, style, form: question ? 'question' : 'affirm', theme: 'all', mood: 'awkward' },
  };
}

// ---------- Vocabulaire de base ----------
const w = (tl, r, fr, en, t) => ({ tl, r, fr, en, t });
const BASICS = [
  w('こんにちは', 'こんにちは', 'bonjour', 'hello', 'basics'),
  w('おはようございます', 'おはようございます', 'bonjour (le matin)', 'good morning', 'basics'),
  w('こんばんは', 'こんばんは', 'bonsoir', 'good evening', 'basics'),
  w('さようなら', 'さようなら', 'au revoir', 'goodbye', 'basics'),
  w('ありがとうございます', 'ありがとうございます', 'merci', 'thank you', 'basics'),
  w('ありがとう', 'ありがとう', 'merci (familier)', 'thanks (casual)', 'basics'),
  w('すみません', 'すみません', 'excusez-moi, pardon', 'excuse me, sorry', 'basics'),
  w('ごめんなさい', 'ごめんなさい', 'je suis désolé(e)', 'I’m sorry', 'basics'),
  w('はい', 'はい', 'oui', 'yes', 'basics'),
  w('いいえ', 'いいえ', 'non', 'no', 'basics'),
  w('大丈夫', 'だいじょうぶ', 'ça va, pas de souci', 'it’s okay, no problem', 'basics'),
  w('いただきます', 'いただきます', 'bon appétit (avant de manger)', 'let’s eat (before a meal)', 'basics'),
  w('ごちそうさまでした', 'ごちそうさまでした', 'merci pour le repas', 'thank you for the meal', 'basics'),
  w('ください', 'ください', 'donnez-moi, s’il vous plaît', 'please give me', 'basics'),
  w('いくらですか', 'いくらですか', 'combien ça coûte ?', 'how much is it?', 'basics'),
  w('がんばって', 'がんばって', 'courage ! (encouragement)', 'hang in there! good luck!', 'basics'),
  w('一', 'いち', 'un (1)', 'one (1)', 'basics'),
  w('二', 'に', 'deux (2)', 'two (2)', 'basics'),
  w('三', 'さん', 'trois (3)', 'three (3)', 'basics'),
  w('四', 'よん', 'quatre (4)', 'four (4)', 'basics'),
  w('五', 'ご', 'cinq (5)', 'five (5)', 'basics'),
  w('十', 'じゅう', 'dix (10)', 'ten (10)', 'basics'),
  w('百', 'ひゃく', 'cent (100)', 'hundred (100)', 'basics'),
  w('一つ', 'ひとつ', 'un (objet)', 'one (thing)', 'basics'),
  w('二つ', 'ふたつ', 'deux (objets)', 'two (things)', 'basics'),
  w('三つ', 'みっつ', 'trois (objets)', 'three (things)', 'basics'),
  w('お母さん', 'おかあさん', 'mère, maman', 'mother, mom', 'daily'),
  w('お父さん', 'おとうさん', 'père, papa', 'father, dad', 'daily'),
  w('姉', 'あね', 'ma grande sœur', 'my older sister', 'daily'),
  w('兄', 'あに', 'mon grand frère', 'my older brother', 'daily'),
  w('妹', 'いもうと', 'petite sœur', 'younger sister', 'daily'),
  w('弟', 'おとうと', 'petit frère', 'younger brother', 'daily'),
  w('朝', 'あさ', 'matin', 'morning', 'daily'),
  w('夜', 'よる', 'soir, nuit', 'evening, night', 'daily'),
  w('週末', 'しゅうまつ', 'week-end', 'weekend', 'daily'),
  w('天気', 'てんき', 'temps (météo)', 'weather', 'daily'),
  w('赤', 'あか', 'rouge', 'red', 'basics'),
  w('青', 'あお', 'bleu', 'blue', 'basics'),
  w('黄色', 'きいろ', 'jaune', 'yellow', 'basics'),
  w('緑', 'みどり', 'vert', 'green', 'basics'),
  w('白', 'しろ', 'blanc', 'white', 'basics'),
  w('黒', 'くろ', 'noir', 'black', 'basics'),
  w('写真', 'しゃしん', 'photo', 'photo', 'leisure'),
  w('人', 'ひと', 'personne', 'person', 'daily'),
  w('名前', 'なまえ', 'nom, prénom', 'name', 'basics'),
  w('時間', 'じかん', 'temps, heure', 'time, hour', 'daily'),
  w('お金', 'おかね', 'argent', 'money', 'city'),
  w('卵', 'たまご', 'œuf', 'egg', 'food'),
  w('果物', 'くだもの', 'fruit', 'fruit', 'food'),
  w('宿題', 'しゅくだい', 'devoirs', 'homework', 'study'),
  w('試験', 'しけん', 'examen', 'exam', 'study'),
  w('旅行', 'りょこう', 'voyage', 'trip, travel', 'city'),
  w('空港', 'くうこう', 'aéroport', 'airport', 'city'),
  w('駅', 'えき', 'gare', 'station', 'city'),
  w('猫', 'ねこ', 'chat', 'cat', 'daily'),
  w('犬', 'いぬ', 'chien', 'dog', 'daily'),
];

function buildWords() {
  const all = [
    ...NOUNS.filter((x) => x.ja).map((x) => ({ tl: x.ja[0], r: x.ja[1], fr: x.fr, en: x.en, t: x.t })),
    ...PLACES.filter((x) => x.ja).map((x) => ({ tl: x.ja[0], r: x.ja[1], fr: x.word, en: x.enWord, t: x.t })),
    ...VERBS.map((x) => ({ tl: x.ja.w, r: x.ja.r, fr: x.ja.label?.fr || verbLabel(x, 'fr'), en: x.ja.label?.en || verbLabel(x, 'en'), t: x.t[0] })),
    ...BASICS,
  ];
  const seen = new Set();
  return all.filter((x) => !seen.has(x.tl) && seen.add(x.tl)).map((x) => ({ id: x.tl, ...x }));
}

const pickR = (a) => a[Math.floor(Math.random() * a.length)];
function randomSyllable() {
  const items = [...KANA_SETS.base.items, ...KANA_SETS.voiced.items, ...KANA_SETS.combo.items];
  const n = 1 + Math.floor(Math.random() * 2);
  const kata = Math.random() < 0.4; // un mot sur trois environ en katakana
  let text = '';
  for (let i = 0; i < n; i++) {
    const k = pickR(items);
    text += kata ? k.j2 : k.j;
  }
  return { text, rom: kanaToRomaji(text) };
}

// Kanji : trois groupes affichés après les kana.
const SCRIPT_SETS = {
  ...KANA_SETS,
  kanjiNum: { label: L('Kanji · nombres et temps', 'Kanji · numbers & time'), kind: 'kanji', items: KANJI_NUM },
  kanjiLife: { label: L('Kanji · gens et lieux', 'Kanji · people & places'), kind: 'kanji', items: KANJI_LIFE },
  kanjiAction: { label: L('Kanji · actions et qualités', 'Kanji · actions & qualities'), kind: 'kanji', items: KANJI_ACTION },
};

export const JA = {
  id: 'ja',
  name: L('Japonais', 'Japanese'),
  native: '日本語',
  tts: 'ja-JP',
  appName: 'Haru',
  styles: ['polite', 'casual'],
  greeting(h) {
    if (h >= 5 && h < 11) return 'おはようございます';
    if (h >= 11 && h < 18) return 'こんにちは';
    return 'こんばんは';
  },
  testVoice: 'こんにちは。はじめまして。',
  script: {
    title: L('Kana', 'Kana'),
    sets: SCRIPT_SETS,
    builder: false,
    randomSyllable,
    syllableLabel: L('Syllabes', 'Syllables'),
    syllableSample: 'あいう',
  },
  _words: null,
  get words() { return (this._words ||= buildWords()); },
  romanize: (kana) => kanaToRomaji(kana),
  wordRom: (w) => kanaToRomaji(w.r || w.tl),
  wordRead: (w) => (w.r && toHira(w.tl) !== w.r ? w.r : ''),
  render,
  awkward,
  guide: {
    fr: [...GUIDE_JA, ...localize([...GUIDE_JA_PLUS, ...GUIDE_JA_ADV], 'fr')],
    en: [...GUIDE_JA_EN, ...localize([...GUIDE_JA_PLUS, ...GUIDE_JA_ADV], 'en')],
  },
};

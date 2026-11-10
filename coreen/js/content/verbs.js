// Verbes et adjectifs du générateur.
//   stem : radical, a : forme en 아/어 (base du présent et du passé), f : forme du futur en (으)ㄹ
//   type : obj (avec complément d'objet), go (déplacement vers un lieu), act (activité dans un lieu),
//          adj (adjectif), weather (adjectif météo)
//   objs : catégories de compléments acceptées ; art : article français du complément (def | ind)
//   places : activités de lieu compatibles (voir PLACES.tags)
//   longNeg : négation en -지 않다 plutôt qu'avec 안 (verbes en 하다 formés sur un nom)
//   fr.p : présent [je, tu, il, nous, vous] ; fr.pp : participe passé ; fr.aux : avoir | être

const v = (o) => o;

export const VERBS = [
  v({ kr: '먹다', stem: '먹', a: '먹어', f: '먹을', type: 'obj', objs: ['food'], art: 'ind', places: ['eat', 'home'], t: ['food'],
    fr: { inf: 'manger', p: ['mange', 'manges', 'mange', 'mangeons', 'mangez'], pp: 'mangé', aux: 'avoir' } }),
  v({ kr: '마시다', stem: '마시', a: '마셔', f: '마실', type: 'obj', objs: ['drink'], art: 'ind', places: ['eat', 'home'], t: ['food'],
    fr: { inf: 'boire', p: ['bois', 'bois', 'boit', 'buvons', 'buvez'], pp: 'bu', aux: 'avoir' } }),
  v({ kr: '만들다', stem: '만들', a: '만들어', f: '만들', type: 'obj', objs: ['food'], only: ['김치', '라면', '비빔밥', '불고기', '떡볶이', '케이크', '빵'], art: 'ind', places: ['home'], t: ['food'],
    fr: { inf: 'préparer', p: ['prépare', 'prépares', 'prépare', 'préparons', 'préparez'], pp: 'préparé', aux: 'avoir' } }),
  v({ kr: '사다', stem: '사', a: '사', f: '살', type: 'obj', objs: ['food', 'drink', 'item'], art: 'ind', places: ['shop'], t: ['city', 'daily', 'food'],
    fr: { inf: 'acheter', p: ['achète', 'achètes', 'achète', 'achetons', 'achetez'], pp: 'acheté', aux: 'avoir' } }),
  v({ kr: '좋아하다', stem: '좋아하', a: '좋아해', f: '좋아할', type: 'obj', objs: ['food', 'drink', 'music', 'lang'], art: 'def', places: [], t: ['food', 'leisure'],
    fr: { inf: 'aimer', p: ['aime', 'aimes', 'aime', 'aimons', 'aimez'], pp: 'aimé', aux: 'avoir' } }),
  v({ kr: '보다', stem: '보', a: '봐', f: '볼', type: 'obj', objs: ['media'], art: 'ind', places: ['movie', 'home'], t: ['leisure'],
    fr: { inf: 'regarder', p: ['regarde', 'regardes', 'regarde', 'regardons', 'regardez'], pp: 'regardé', aux: 'avoir' } }),
  v({ kr: '읽다', stem: '읽', a: '읽어', f: '읽을', type: 'obj', objs: ['read'], art: 'ind', places: ['study', 'home'], t: ['leisure', 'study'],
    fr: { inf: 'lire', p: ['lis', 'lis', 'lit', 'lisons', 'lisez'], pp: 'lu', aux: 'avoir' } }),
  v({ kr: '듣다', stem: '듣', a: '들어', f: '들을', type: 'obj', objs: ['music'], art: 'ind', places: ['home'], t: ['leisure'],
    fr: { inf: 'écouter', p: ['écoute', 'écoutes', 'écoute', 'écoutons', 'écoutez'], pp: 'écouté', aux: 'avoir' } }),
  v({ kr: '쓰다', stem: '쓰', a: '써', f: '쓸', type: 'obj', objs: ['letter'], art: 'ind', places: ['home', 'study'], t: ['study', 'daily'],
    fr: { inf: 'écrire', p: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez'], pp: 'écrit', aux: 'avoir' } }),
  v({ kr: '공부하다', stem: '공부하', a: '공부해', f: '공부할', type: 'obj', objs: ['lang'], art: 'def', places: ['study', 'home'], t: ['study'], longNeg: true,
    fr: { inf: 'étudier', p: ['étudie', 'étudies', 'étudie', 'étudions', 'étudiez'], pp: 'étudié', aux: 'avoir' } }),
  v({ kr: '배우다', stem: '배우', a: '배워', f: '배울', type: 'obj', objs: ['lang'], art: 'def', places: ['study'], t: ['study'],
    fr: { inf: 'apprendre', p: ['apprends', 'apprends', 'apprend', 'apprenons', 'apprenez'], pp: 'appris', aux: 'avoir' } }),
  v({ kr: '기다리다', stem: '기다리', a: '기다려', f: '기다릴', type: 'obj', objs: ['person', 'vehicle'], art: 'def', places: ['meet'], t: ['city', 'daily'],
    fr: { inf: 'attendre', p: ['attends', 'attends', 'attend', 'attendons', 'attendez'], pp: 'attendu', aux: 'avoir' } }),
  v({ kr: '만나다', stem: '만나', a: '만나', f: '만날', type: 'obj', objs: ['person'], art: 'def', places: ['meet'], t: ['daily', 'leisure'],
    fr: { inf: 'retrouver', p: ['retrouve', 'retrouves', 'retrouve', 'retrouvons', 'retrouvez'], pp: 'retrouvé', aux: 'avoir' } }),
  v({ kr: '타다', stem: '타', a: '타', f: '탈', type: 'obj', objs: ['vehicle'], art: 'def', places: [], t: ['city'],
    fr: { inf: 'prendre', p: ['prends', 'prends', 'prend', 'prenons', 'prenez'], pp: 'pris', aux: 'avoir' } }),
  v({ kr: '가다', stem: '가', a: '가', f: '갈', type: 'go', t: ['city', 'daily'],
    fr: { inf: 'aller', p: ['vais', 'vas', 'va', 'allons', 'allez'], pp: 'allé', aux: 'être' } }),
  v({ kr: '오다', stem: '오', a: '와', f: '올', type: 'go', t: ['city', 'daily'],
    fr: { inf: 'venir', p: ['viens', 'viens', 'vient', 'venons', 'venez'], pp: 'venu', aux: 'être' } }),
  v({ kr: '일하다', stem: '일하', a: '일해', f: '일할', type: 'act', places: ['work'], t: ['study', 'daily'], longNeg: true,
    fr: { inf: 'travailler', p: ['travaille', 'travailles', 'travaille', 'travaillons', 'travaillez'], pp: 'travaillé', aux: 'avoir' } }),
  v({ kr: '운동하다', stem: '운동하', a: '운동해', f: '운동할', type: 'act', places: ['sport'], t: ['leisure'], longNeg: true,
    fr: { inf: 'faire', p: ['fais', 'fais', 'fait', 'faisons', 'faites'], pp: 'fait', aux: 'avoir', suf: 'du sport', sufNeg: 'de sport', label: 'faire du sport' } }),
  v({ kr: '요리하다', stem: '요리하', a: '요리해', f: '요리할', type: 'act', places: ['home'], t: ['food', 'daily'], longNeg: true,
    fr: { inf: 'cuisiner', p: ['cuisine', 'cuisines', 'cuisine', 'cuisinons', 'cuisinez'], pp: 'cuisiné', aux: 'avoir' } }),
  v({ kr: '자다', stem: '자', a: '자', f: '잘', type: 'act', places: ['home'], t: ['daily'],
    fr: { inf: 'dormir', p: ['dors', 'dors', 'dort', 'dormons', 'dormez'], pp: 'dormi', aux: 'avoir' } }),
  // Adjectifs qui décrivent une personne
  v({ kr: '바쁘다', stem: '바쁘', a: '바빠', f: '바쁠', type: 'adj', subj: 'person', t: ['daily', 'study'],
    fr: { m: 'occupé', f: 'occupée', x: 'occupé(e)', xp: 'occupé(e)s' } }),
  v({ kr: '피곤하다', stem: '피곤하', a: '피곤해', f: '피곤할', type: 'adj', subj: 'person', t: ['daily'],
    fr: { m: 'fatigué', f: 'fatiguée', x: 'fatigué(e)', xp: 'fatigué(e)s' } }),
  v({ kr: '행복하다', stem: '행복하', a: '행복해', f: '행복할', type: 'adj', subj: 'person', t: ['daily', 'leisure'],
    fr: { m: 'heureux', f: 'heureuse', x: 'heureux (heureuse)', xp: 'heureux (heureuses)' } }),
  // Adjectifs qui décrivent une chose
  v({ kr: '맛있다', stem: '맛있', a: '맛있어', f: '맛있을', type: 'adj', subj: ['food', 'drink'], t: ['food'], neg: { stem: '맛없', a: '맛없어', f: '맛없을', kr: '맛없다' },
    fr: { m: 'bon', f: 'bonne', label: 'être bon, délicieux' } }),
  v({ kr: '맵다', stem: '맵', a: '매워', f: '매울', type: 'adj', subj: ['food'], only: ['김치', '라면', '떡볶이'], t: ['food'],
    fr: { m: 'épicé', f: 'épicée' } }),
  v({ kr: '비싸다', stem: '비싸', a: '비싸', f: '비쌀', type: 'adj', subj: ['food', 'drink', 'item'], t: ['food', 'city'],
    fr: { m: 'cher', f: 'chère', mp: 'chers', fp: 'chères' } }),
  // Météo (sujet : 날씨)
  v({ kr: '좋다', stem: '좋', a: '좋아', f: '좋을', type: 'weather', t: ['daily', 'city', 'leisure'], fr: { w: 'beau', label: 'être bon, beau' } }),
  v({ kr: '덥다', stem: '덥', a: '더워', f: '더울', type: 'weather', t: ['daily', 'city'], fr: { w: 'chaud', label: 'faire chaud' } }),
  v({ kr: '춥다', stem: '춥', a: '추워', f: '추울', type: 'weather', t: ['daily', 'city'], fr: { w: 'froid', label: 'faire froid' } }),
];

export const TIMES = {
  present: [
    { kr: '오늘', fr: 'aujourd’hui' },
    { kr: '지금', fr: 'maintenant' },
    { kr: '매일', fr: 'tous les jours' },
  ],
  past: [
    { kr: '어제', fr: 'hier' },
    { kr: '지난주에', fr: 'la semaine dernière' },
    { kr: '주말에', fr: 'ce week-end' },
  ],
  future: [
    { kr: '내일', fr: 'demain' },
    { kr: '다음 주에', fr: 'la semaine prochaine' },
    { kr: '주말에', fr: 'ce week-end' },
  ],
};

/** Libellé français d'un verbe pour le lexique. */
export function verbLabel(verb) {
  if (verb.fr.label) return verb.fr.label;
  if (verb.fr.inf) return verb.fr.inf;
  return 'être ' + verb.fr.m;
}

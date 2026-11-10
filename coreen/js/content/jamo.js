// Alphabet coréen (hangeul). `say` est la syllabe lue à voix haute pour faire entendre la lettre.

export const VOWELS = [
  { j: 'ㅏ', r: 'a', say: '아', tip: '« a » comme dans « papa »' },
  { j: 'ㅑ', r: 'ya', say: '야', tip: '« ya » comme dans « yak »' },
  { j: 'ㅓ', r: 'eo', say: '어', tip: '« o » ouvert, entre « o » et « a », comme dans « or »' },
  { j: 'ㅕ', r: 'yeo', say: '여', tip: '« yo » ouvert, comme « yaourt » prononcé vite' },
  { j: 'ㅗ', r: 'o', say: '오', tip: '« ô » fermé, lèvres arrondies' },
  { j: 'ㅛ', r: 'yo', say: '요', tip: '« yô » comme dans « yoyo »' },
  { j: 'ㅜ', r: 'u', say: '우', tip: '« ou » comme dans « loup »' },
  { j: 'ㅠ', r: 'yu', say: '유', tip: '« you »' },
  { j: 'ㅡ', r: 'eu', say: '으', tip: '« eu » lèvres étirées, sans les arrondir' },
  { j: 'ㅣ', r: 'i', say: '이', tip: '« i » comme dans « lit »' },
];

export const VOWELS_COMPOUND = [
  { j: 'ㅐ', r: 'ae', say: '애', tip: '« è » comme dans « mère »' },
  { j: 'ㅔ', r: 'e', say: '에', tip: '« é », presque comme ㅐ aujourd’hui' },
  { j: 'ㅒ', r: 'yae', say: '얘', tip: '« yè »' },
  { j: 'ㅖ', r: 'ye', say: '예', tip: '« yé »' },
  { j: 'ㅘ', r: 'wa', say: '와', tip: 'ㅗ + ㅏ : « oua »' },
  { j: 'ㅙ', r: 'wae', say: '왜', tip: 'ㅗ + ㅐ : « ouè »' },
  { j: 'ㅚ', r: 'oe', say: '외', tip: '« ouè » (proche de ㅙ)' },
  { j: 'ㅝ', r: 'wo', say: '워', tip: 'ㅜ + ㅓ : « ouo »' },
  { j: 'ㅞ', r: 'we', say: '웨', tip: 'ㅜ + ㅔ : « oué »' },
  { j: 'ㅟ', r: 'wi', say: '위', tip: 'ㅜ + ㅣ : « oui »' },
  { j: 'ㅢ', r: 'ui', say: '의', tip: 'ㅡ + ㅣ : « eu-i » glissé' },
];

export const CONSONANTS = [
  { j: 'ㄱ', r: 'g', say: '가', name: '기역', tip: '« g » doux, « k » en fin de syllabe' },
  { j: 'ㄴ', r: 'n', say: '나', name: '니은', tip: '« n »' },
  { j: 'ㄷ', r: 'd', say: '다', name: '디귿', tip: '« d » doux, « t » en fin de syllabe' },
  { j: 'ㄹ', r: 'r', say: '라', name: '리을', tip: '« r » roulé léger au début, « l » à la fin' },
  { j: 'ㅁ', r: 'm', say: '마', name: '미음', tip: '« m »' },
  { j: 'ㅂ', r: 'b', say: '바', name: '비읍', tip: '« b » doux, « p » en fin de syllabe' },
  { j: 'ㅅ', r: 's', say: '사', name: '시옷', tip: '« s » (« ch » devant ㅣ)' },
  { j: 'ㅇ', r: '', say: '아', name: '이응', tip: 'muet au début, « ng » à la fin' },
  { j: 'ㅈ', r: 'j', say: '자', name: '지읒', tip: '« dj » doux' },
  { j: 'ㅊ', r: 'ch', say: '차', name: '치읓', tip: '« tch » avec un souffle' },
  { j: 'ㅋ', r: 'k', say: '카', name: '키읔', tip: '« k » avec un souffle' },
  { j: 'ㅌ', r: 't', say: '타', name: '티읕', tip: '« t » avec un souffle' },
  { j: 'ㅍ', r: 'p', say: '파', name: '피읖', tip: '« p » avec un souffle' },
  { j: 'ㅎ', r: 'h', say: '하', name: '히읗', tip: '« h » expiré' },
];

export const CONSONANTS_DOUBLE = [
  { j: 'ㄲ', r: 'kk', say: '까', name: '쌍기역', tip: '« k » tendu, sans souffle' },
  { j: 'ㄸ', r: 'tt', say: '따', name: '쌍디귿', tip: '« t » tendu, sans souffle' },
  { j: 'ㅃ', r: 'pp', say: '빠', name: '쌍비읍', tip: '« p » tendu, sans souffle' },
  { j: 'ㅆ', r: 'ss', say: '싸', name: '쌍시옷', tip: '« s » appuyé' },
  { j: 'ㅉ', r: 'jj', say: '짜', name: '쌍지읒', tip: '« tch » tendu, sans souffle' },
];

export const JAMO_SETS = {
  vowels: { label: 'Voyelles', items: VOWELS },
  consonants: { label: 'Consonnes', items: CONSONANTS },
  compound: { label: 'Voyelles composées', items: VOWELS_COMPOUND },
  double: { label: 'Consonnes doubles', items: CONSONANTS_DOUBLE },
};

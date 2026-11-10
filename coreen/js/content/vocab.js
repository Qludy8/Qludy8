// Vocabulaire. Les noms avec `cat` servent aussi au générateur de phrases :
//   def : forme française avec article défini  (« J'aime le café »)
//   ind : forme avec article indéfini/partitif (« Je bois du café »)
//   g   : genre (accord des adjectifs)

export const THEMES = {
  food: 'Nourriture',
  daily: 'Quotidien',
  leisure: 'Loisirs',
  city: 'Ville & voyage',
  study: 'Études & travail',
  basics: 'Essentiels',
};

const n = (kr, fr, t, cat, def, ind, g = 'm') => ({ kr, fr, t, cat, def, ind, g });
const w = (kr, fr, t) => ({ kr, fr, t });

export const NOUNS = [
  // Nourriture
  n('밥', 'riz (cuit), repas', 'food', 'food', 'le riz', 'du riz'),
  n('빵', 'pain', 'food', 'food', 'le pain', 'du pain'),
  n('김치', 'kimchi', 'food', 'food', 'le kimchi', 'du kimchi'),
  n('사과', 'pomme', 'food', 'food', 'la pomme', 'une pomme', 'f'),
  n('라면', 'ramyeon (nouilles)', 'food', 'food', 'le ramyeon', 'un ramyeon'),
  n('비빔밥', 'bibimbap', 'food', 'food', 'le bibimbap', 'un bibimbap'),
  n('불고기', 'bulgogi', 'food', 'food', 'le bulgogi', 'du bulgogi'),
  n('떡볶이', 'tteokbokki', 'food', 'food', 'le tteokbokki', 'du tteokbokki'),
  n('고기', 'viande', 'food', 'food', 'la viande', 'de la viande', 'f'),
  n('생선', 'poisson', 'food', 'food', 'le poisson', 'du poisson'),
  n('케이크', 'gâteau', 'food', 'food', 'le gâteau', 'un gâteau'),
  // Boissons
  n('물', 'eau', 'food', 'drink', 'l’eau', 'de l’eau', 'f'),
  n('커피', 'café (boisson)', 'food', 'drink', 'le café', 'du café'),
  n('차', 'thé (aussi : voiture)', 'food', 'drink', 'le thé', 'du thé'),
  n('우유', 'lait', 'food', 'drink', 'le lait', 'du lait'),
  n('주스', 'jus', 'food', 'drink', 'le jus', 'du jus'),
  n('맥주', 'bière', 'food', 'drink', 'la bière', 'de la bière', 'f'),
  // Loisirs
  n('영화', 'film', 'leisure', 'media', 'le film', 'un film'),
  n('드라마', 'série (drama)', 'leisure', 'media', 'la série', 'une série', 'f'),
  n('책', 'livre', 'leisure', 'read', 'le livre', 'un livre'),
  n('웹툰', 'webtoon', 'leisure', 'read', 'le webtoon', 'un webtoon'),
  n('신문', 'journal', 'daily', 'read', 'le journal', 'un journal'),
  n('음악', 'musique', 'leisure', 'music', 'la musique', 'de la musique', 'f'),
  n('노래', 'chanson', 'leisure', 'music', 'la chanson', 'une chanson', 'f'),
  n('라디오', 'radio', 'leisure', 'music', 'la radio', 'la radio', 'f'),
  // Études
  n('한국어', 'coréen (langue)', 'study', 'lang', 'le coréen', 'le coréen'),
  n('영어', 'anglais', 'study', 'lang', 'l’anglais', 'l’anglais'),
  n('수학', 'mathématiques', 'study', 'lang', 'les maths', 'les maths'),
  n('역사', 'histoire', 'study', 'lang', 'l’histoire', 'l’histoire', 'f'),
  n('편지', 'lettre', 'study', 'letter', 'la lettre', 'une lettre', 'f'),
  n('일기', 'journal intime', 'daily', 'letter', 'le journal intime', 'un journal intime'),
  n('이메일', 'e-mail', 'study', 'letter', 'l’e-mail', 'un e-mail'),
  // Objets
  n('가방', 'sac', 'city', 'item', 'le sac', 'un sac'),
  n('옷', 'vêtements', 'city', 'item', 'les vêtements', 'des vêtements'),
  n('신발', 'chaussures', 'city', 'item', 'les chaussures', 'des chaussures', 'f'),
  n('선물', 'cadeau', 'daily', 'item', 'le cadeau', 'un cadeau'),
  n('우산', 'parapluie', 'daily', 'item', 'le parapluie', 'un parapluie'),
  n('휴대폰', 'téléphone portable', 'daily', 'item', 'le téléphone', 'un téléphone'),
  // Personnes
  n('친구', 'ami(e)', 'daily', 'person', 'mon ami', 'mon ami'),
  n('선생님', 'professeur', 'study', 'person', 'le professeur', 'le professeur'),
  n('가족', 'famille', 'daily', 'person', 'ma famille', 'ma famille', 'f'),
  // Transports
  n('버스', 'bus', 'city', 'vehicle', 'le bus', 'le bus'),
  n('지하철', 'métro', 'city', 'vehicle', 'le métro', 'le métro'),
  n('택시', 'taxi', 'city', 'vehicle', 'le taxi', 'un taxi'),
  n('기차', 'train', 'city', 'vehicle', 'le train', 'le train'),
];

// Lieux : `fr` est la forme utilisée dans une phrase, `tags` les activités possibles.
export const PLACES = [
  { kr: '학교', fr: 'à l’école', word: 'école', t: 'study', tags: ['study'] },
  { kr: '집', fr: 'à la maison', word: 'maison', t: 'daily', tags: ['home'] },
  { kr: '카페', fr: 'au café', word: 'café (lieu)', t: 'city', tags: ['eat', 'study', 'work', 'meet'] },
  { kr: '식당', fr: 'au restaurant', word: 'restaurant', t: 'food', tags: ['eat', 'work', 'meet'] },
  { kr: '회사', fr: 'au bureau', word: 'entreprise, bureau', t: 'study', tags: ['work'] },
  { kr: '도서관', fr: 'à la bibliothèque', word: 'bibliothèque', t: 'study', tags: ['study'] },
  { kr: '시장', fr: 'au marché', word: 'marché', t: 'city', tags: ['shop'] },
  { kr: '공원', fr: 'au parc', word: 'parc', t: 'leisure', tags: ['sport', 'meet'] },
  { kr: '영화관', fr: 'au cinéma', word: 'cinéma', t: 'leisure', tags: ['movie'] },
  { kr: '병원', fr: 'à l’hôpital', word: 'hôpital', t: 'city', tags: ['work'] },
  { kr: '편의점', fr: 'à la supérette', word: 'supérette', t: 'city', tags: ['shop', 'work'] },
  { kr: '헬스장', fr: 'à la salle de sport', word: 'salle de sport', t: 'leisure', tags: ['sport'] },
  { kr: '한국', fr: 'en Corée', word: 'Corée', t: 'city', tags: [] },
  { kr: '서울', fr: 'à Séoul', word: 'Séoul', t: 'city', tags: [] },
  { kr: '바다', fr: 'à la mer', word: 'mer', t: 'leisure', tags: [] },
];

export const EXTRA = [
  // Essentiels
  w('안녕하세요', 'bonjour', 'basics'),
  w('감사합니다', 'merci', 'basics'),
  w('고마워', 'merci (familier)', 'basics'),
  w('죄송합니다', 'je suis désolé(e)', 'basics'),
  w('네', 'oui', 'basics'),
  w('아니요', 'non', 'basics'),
  w('괜찮아요', 'ça va, pas de souci', 'basics'),
  w('안녕히 가세요', 'au revoir (à qui s’en va)', 'basics'),
  w('안녕히 계세요', 'au revoir (à qui reste)', 'basics'),
  w('잘 먹겠습니다', 'bon appétit (avant de manger)', 'basics'),
  w('주세요', 'donnez-moi, s’il vous plaît', 'basics'),
  w('얼마예요?', 'combien ça coûte ?', 'basics'),
  w('맛있어요', 'c’est délicieux', 'basics'),
  w('사랑해요', 'je t’aime', 'basics'),
  w('화이팅', 'courage ! (encouragement)', 'basics'),
  // Nombres
  w('일', 'un (1, sino-coréen)', 'basics'),
  w('이', 'deux (2, sino-coréen)', 'basics'),
  w('삼', 'trois (3, sino-coréen)', 'basics'),
  w('사', 'quatre (4, sino-coréen)', 'basics'),
  w('오', 'cinq (5, sino-coréen)', 'basics'),
  w('십', 'dix (10, sino-coréen)', 'basics'),
  w('백', 'cent (100)', 'basics'),
  w('하나', 'un (1, coréen natif)', 'basics'),
  w('둘', 'deux (2, coréen natif)', 'basics'),
  w('셋', 'trois (3, coréen natif)', 'basics'),
  w('넷', 'quatre (4, coréen natif)', 'basics'),
  w('다섯', 'cinq (5, coréen natif)', 'basics'),
  // Famille
  w('엄마', 'maman', 'daily'),
  w('아빠', 'papa', 'daily'),
  w('어머니', 'mère', 'daily'),
  w('아버지', 'père', 'daily'),
  w('언니', 'grande sœur (pour une fille)', 'daily'),
  w('누나', 'grande sœur (pour un garçon)', 'daily'),
  w('오빠', 'grand frère (pour une fille)', 'daily'),
  w('형', 'grand frère (pour un garçon)', 'daily'),
  w('동생', 'petit frère / petite sœur', 'daily'),
  // Temps
  w('오늘', 'aujourd’hui', 'daily'),
  w('내일', 'demain', 'daily'),
  w('어제', 'hier', 'daily'),
  w('지금', 'maintenant', 'daily'),
  w('아침', 'matin, petit-déjeuner', 'daily'),
  w('저녁', 'soir, dîner', 'daily'),
  w('주말', 'week-end', 'daily'),
  w('날씨', 'temps (météo)', 'daily'),
  // Couleurs
  w('빨간색', 'rouge', 'basics'),
  w('파란색', 'bleu', 'basics'),
  w('노란색', 'jaune', 'basics'),
  w('초록색', 'vert', 'basics'),
  w('하얀색', 'blanc', 'basics'),
  w('검은색', 'noir', 'basics'),
  // Divers
  w('사진', 'photo', 'leisure'),
  w('사람', 'personne, gens', 'daily'),
  w('이름', 'nom, prénom', 'basics'),
  w('시간', 'temps, heure', 'daily'),
  w('돈', 'argent', 'city'),
  w('계란', 'œuf', 'food'),
  w('과일', 'fruit', 'food'),
  w('숙제', 'devoirs', 'study'),
  w('시험', 'examen', 'study'),
  w('여행', 'voyage', 'city'),
  w('공항', 'aéroport', 'city'),
  w('호텔', 'hôtel', 'city'),
  w('길', 'route, chemin', 'city'),
];

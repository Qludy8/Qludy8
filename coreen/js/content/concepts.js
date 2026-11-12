// Vocabulaire partagé par les deux cours (coréen et japonais).
// Chaque concept porte sa forme coréenne (ko), japonaise (ja : [écriture, lecture en kana]),
// française et anglaise. Une langue absente (null) exclut le concept de ce cours.

export const THEMES = {
  food: { fr: 'Nourriture', en: 'Food' },
  daily: { fr: 'Quotidien', en: 'Daily life' },
  leisure: { fr: 'Loisirs', en: 'Leisure' },
  city: { fr: 'Ville & voyage', en: 'City & travel' },
  study: { fr: 'Études & travail', en: 'Study & work' },
  basics: { fr: 'Essentiels', en: 'Essentials' },
};

// ---------- Noms ----------
// fr : [mot, avec article défini, avec article indéfini/partitif], g : genre
// en : [mot, indéfini (« an apple »), générique (« apples »), défini (« the apple »)]
const N = (id, t, cat, ko, ja, fr, g, en) => ({ id, t, cat, ko, ja, fr: fr[0], frDef: fr[1], frInd: fr[2], g, en: en[0], enInd: en[1], enGen: en[2], enDef: en[3] });

export const NOUNS = [
  // Nourriture
  N('rice', 'food', 'food', '밥', ['ご飯', 'ごはん'], ['riz (cuit), repas', 'le riz', 'du riz'], 'm', ['rice, meal', 'rice', 'rice', 'the rice']),
  N('bread', 'food', 'food', '빵', ['パン', 'ぱん'], ['pain', 'le pain', 'du pain'], 'm', ['bread', 'bread', 'bread', 'the bread']),
  N('kimchi', 'food', 'food', '김치', ['キムチ', 'きむち'], ['kimchi', 'le kimchi', 'du kimchi'], 'm', ['kimchi', 'kimchi', 'kimchi', 'the kimchi']),
  N('apple', 'food', 'food', '사과', ['りんご', 'りんご'], ['pomme', 'la pomme', 'une pomme'], 'f', ['apple', 'an apple', 'apples', 'the apple']),
  N('ramen', 'food', 'food', '라면', ['ラーメン', 'らーめん'], ['ramen (nouilles)', 'le ramen', 'un ramen'], 'm', ['ramen (noodles)', 'ramen', 'ramen', 'the ramen']),
  N('bibimbap', 'food', 'food', '비빔밥', null, ['bibimbap', 'le bibimbap', 'un bibimbap'], 'm', ['bibimbap', 'bibimbap', 'bibimbap', 'the bibimbap']),
  N('bulgogi', 'food', 'food', '불고기', null, ['bulgogi', 'le bulgogi', 'du bulgogi'], 'm', ['bulgogi', 'bulgogi', 'bulgogi', 'the bulgogi']),
  N('tteokbokki', 'food', 'food', '떡볶이', null, ['tteokbokki', 'le tteokbokki', 'du tteokbokki'], 'm', ['tteokbokki', 'tteokbokki', 'tteokbokki', 'the tteokbokki']),
  N('sushi', 'food', 'food', '초밥', ['寿司', 'すし'], ['sushi', 'les sushis', 'des sushis'], 'm', ['sushi', 'sushi', 'sushi', 'the sushi']),
  N('tempura', 'food', 'food', null, ['天ぷら', 'てんぷら'], ['tempura', 'les tempuras', 'des tempuras'], 'm', ['tempura', 'tempura', 'tempura', 'the tempura']),
  N('onigiri', 'food', 'food', '주먹밥', ['おにぎり', 'おにぎり'], ['boulette de riz', 'la boulette de riz', 'une boulette de riz'], 'f', ['rice ball', 'a rice ball', 'rice balls', 'the rice ball']),
  N('udon', 'food', 'food', '우동', ['うどん', 'うどん'], ['udon (nouilles)', 'les udons', 'des udons'], 'm', ['udon', 'udon', 'udon', 'the udon']),
  N('miso', 'food', 'food', null, ['味噌汁', 'みそしる'], ['soupe miso', 'la soupe miso', 'de la soupe miso'], 'f', ['miso soup', 'miso soup', 'miso soup', 'the miso soup']),
  N('meat', 'food', 'food', '고기', ['肉', 'にく'], ['viande', 'la viande', 'de la viande'], 'f', ['meat', 'meat', 'meat', 'the meat']),
  N('fish', 'food', 'food', '생선', ['魚', 'さかな'], ['poisson', 'le poisson', 'du poisson'], 'm', ['fish', 'fish', 'fish', 'the fish']),
  N('cake', 'food', 'food', '케이크', ['ケーキ', 'けーき'], ['gâteau', 'le gâteau', 'un gâteau'], 'm', ['cake', 'a cake', 'cake', 'the cake']),
  // Boissons
  N('water', 'food', 'drink', '물', ['水', 'みず'], ['eau', 'l’eau', 'de l’eau'], 'f', ['water', 'water', 'water', 'the water']),
  N('coffee', 'food', 'drink', '커피', ['コーヒー', 'こーひー'], ['café (boisson)', 'le café', 'du café'], 'm', ['coffee', 'coffee', 'coffee', 'the coffee']),
  N('tea', 'food', 'drink', '차', ['お茶', 'おちゃ'], ['thé', 'le thé', 'du thé'], 'm', ['tea', 'tea', 'tea', 'the tea']),
  N('milk', 'food', 'drink', '우유', ['牛乳', 'ぎゅうにゅう'], ['lait', 'le lait', 'du lait'], 'm', ['milk', 'milk', 'milk', 'the milk']),
  N('juice', 'food', 'drink', '주스', ['ジュース', 'じゅーす'], ['jus', 'le jus', 'du jus'], 'm', ['juice', 'juice', 'juice', 'the juice']),
  N('beer', 'food', 'drink', '맥주', ['ビール', 'びーる'], ['bière', 'la bière', 'de la bière'], 'f', ['beer', 'beer', 'beer', 'the beer']),
  // Loisirs
  N('movie', 'leisure', 'media', '영화', ['映画', 'えいが'], ['film', 'le film', 'un film'], 'm', ['movie', 'a movie', 'movies', 'the movie']),
  N('drama', 'leisure', 'media', '드라마', ['ドラマ', 'どらま'], ['série (drama)', 'la série', 'une série'], 'f', ['TV series', 'a TV series', 'TV series', 'the series']),
  N('book', 'leisure', 'read', '책', ['本', 'ほん'], ['livre', 'le livre', 'un livre'], 'm', ['book', 'a book', 'books', 'the book']),
  N('webtoon', 'leisure', 'read', '웹툰', null, ['webtoon', 'le webtoon', 'un webtoon'], 'm', ['webtoon', 'a webtoon', 'webtoons', 'the webtoon']),
  N('manga', 'leisure', 'read', '만화', ['漫画', 'まんが'], ['manga, BD', 'le manga', 'un manga'], 'm', ['manga, comic', 'a manga', 'manga', 'the manga']),
  N('newspaper', 'daily', 'read', '신문', ['新聞', 'しんぶん'], ['journal', 'le journal', 'un journal'], 'm', ['newspaper', 'a newspaper', 'newspapers', 'the newspaper']),
  N('music', 'leisure', 'music', '음악', ['音楽', 'おんがく'], ['musique', 'la musique', 'de la musique'], 'f', ['music', 'music', 'music', 'the music']),
  N('song', 'leisure', 'music', '노래', ['歌', 'うた'], ['chanson', 'la chanson', 'une chanson'], 'f', ['song', 'a song', 'songs', 'the song']),
  N('radio', 'leisure', 'music', '라디오', ['ラジオ', 'らじお'], ['radio', 'la radio', 'la radio'], 'f', ['radio', 'the radio', 'the radio', 'the radio']),
  // Études
  N('korean', 'study', 'lang', '한국어', ['韓国語', 'かんこくご'], ['coréen (langue)', 'le coréen', 'le coréen'], 'm', ['Korean (language)', 'Korean', 'Korean', 'Korean']),
  N('japanese', 'study', 'lang', '일본어', ['日本語', 'にほんご'], ['japonais (langue)', 'le japonais', 'le japonais'], 'm', ['Japanese (language)', 'Japanese', 'Japanese', 'Japanese']),
  N('english', 'study', 'lang', '영어', ['英語', 'えいご'], ['anglais', 'l’anglais', 'l’anglais'], 'm', ['English', 'English', 'English', 'English']),
  N('math', 'study', 'lang', '수학', ['数学', 'すうがく'], ['mathématiques', 'les maths', 'les maths'], 'f', ['mathematics', 'math', 'math', 'math']),
  N('history', 'study', 'lang', '역사', ['歴史', 'れきし'], ['histoire', 'l’histoire', 'l’histoire'], 'f', ['history', 'history', 'history', 'history']),
  N('letter', 'study', 'letter', '편지', ['手紙', 'てがみ'], ['lettre', 'la lettre', 'une lettre'], 'f', ['letter', 'a letter', 'letters', 'the letter']),
  N('diary', 'daily', 'letter', '일기', ['日記', 'にっき'], ['journal intime', 'le journal intime', 'un journal intime'], 'm', ['diary', 'in my diary', 'diaries', 'the diary']),
  N('email', 'study', 'letter', '이메일', ['メール', 'めーる'], ['e-mail', 'l’e-mail', 'un e-mail'], 'm', ['email', 'an email', 'emails', 'the email']),
  // Objets
  N('bag', 'city', 'item', '가방', ['かばん', 'かばん'], ['sac', 'le sac', 'un sac'], 'm', ['bag', 'a bag', 'bags', 'the bag']),
  N('clothes', 'city', 'item', '옷', ['服', 'ふく'], ['vêtements', 'les vêtements', 'des vêtements'], 'm', ['clothes', 'clothes', 'clothes', 'the clothes']),
  N('shoes', 'city', 'item', '신발', ['靴', 'くつ'], ['chaussures', 'les chaussures', 'des chaussures'], 'f', ['shoes', 'shoes', 'shoes', 'the shoes']),
  N('gift', 'daily', 'item', '선물', ['プレゼント', 'ぷれぜんと'], ['cadeau', 'le cadeau', 'un cadeau'], 'm', ['gift', 'a gift', 'gifts', 'the gift']),
  N('umbrella', 'daily', 'item', '우산', ['傘', 'かさ'], ['parapluie', 'le parapluie', 'un parapluie'], 'm', ['umbrella', 'an umbrella', 'umbrellas', 'the umbrella']),
  N('phone', 'daily', 'item', '휴대폰', ['携帯', 'けいたい'], ['téléphone portable', 'le téléphone', 'un téléphone'], 'm', ['mobile phone', 'a phone', 'phones', 'the phone']),
  // Personnes
  N('friend', 'daily', 'person', '친구', ['友達', 'ともだち'], ['ami(e)', 'mon ami', 'mon ami'], 'm', ['friend', 'my friend', 'my friend', 'my friend']),
  N('teacher', 'study', 'person', '선생님', ['先生', 'せんせい'], ['professeur', 'le professeur', 'le professeur'], 'm', ['teacher', 'the teacher', 'the teacher', 'the teacher']),
  N('family', 'daily', 'person', '가족', ['家族', 'かぞく'], ['famille', 'ma famille', 'ma famille'], 'f', ['family', 'my family', 'my family', 'my family']),
  // Transports
  N('bus', 'city', 'vehicle', '버스', ['バス', 'ばす'], ['bus', 'le bus', 'le bus'], 'm', ['bus', 'the bus', 'the bus', 'the bus']),
  N('subway', 'city', 'vehicle', '지하철', ['地下鉄', 'ちかてつ'], ['métro', 'le métro', 'le métro'], 'm', ['subway', 'the subway', 'the subway', 'the subway']),
  N('taxi', 'city', 'vehicle', '택시', ['タクシー', 'たくしー'], ['taxi', 'le taxi', 'un taxi'], 'm', ['taxi', 'a taxi', 'a taxi', 'the taxi']),
  N('train', 'city', 'vehicle', '기차', ['電車', 'でんしゃ'], ['train', 'le train', 'le train'], 'm', ['train', 'the train', 'the train', 'the train']),
];

// ---------- Lieux ----------
// fr : « à l'école » ; en : [« at school », « to school »] ; tags : activités possibles
const P = (id, t, tags, ko, ja, frWord, fr, enWord, en) => ({ id, t, tags, ko, ja, word: frWord, fr, enWord, enAt: en[0], enTo: en[1] });

export const PLACES = [
  P('school', 'study', ['study'], '학교', ['学校', 'がっこう'], 'école', 'à l’école', 'school', ['at school', 'to school']),
  P('home', 'daily', ['home'], '집', ['家', 'いえ'], 'maison', 'à la maison', 'home, house', ['at home', 'home']),
  P('cafe', 'city', ['eat', 'study', 'work', 'meet'], '카페', ['カフェ', 'かふぇ'], 'café (lieu)', 'au café', 'café', ['at the café', 'to the café']),
  P('restaurant', 'food', ['eat', 'work', 'meet'], '식당', ['レストラン', 'れすとらん'], 'restaurant', 'au restaurant', 'restaurant', ['at the restaurant', 'to the restaurant']),
  P('office', 'study', ['work'], '회사', ['会社', 'かいしゃ'], 'entreprise, bureau', 'au bureau', 'company, office', ['at the office', 'to the office']),
  P('library', 'study', ['study'], '도서관', ['図書館', 'としょかん'], 'bibliothèque', 'à la bibliothèque', 'library', ['at the library', 'to the library']),
  P('market', 'city', ['shop'], '시장', ['市場', 'いちば'], 'marché', 'au marché', 'market', ['at the market', 'to the market']),
  P('park', 'leisure', ['sport', 'meet'], '공원', ['公園', 'こうえん'], 'parc', 'au parc', 'park', ['at the park', 'to the park']),
  P('cinema', 'leisure', ['movie'], '영화관', ['映画館', 'えいがかん'], 'cinéma', 'au cinéma', 'cinema', ['at the cinema', 'to the cinema']),
  P('hospital', 'city', ['work'], '병원', ['病院', 'びょういん'], 'hôpital', 'à l’hôpital', 'hospital', ['at the hospital', 'to the hospital']),
  P('konbini', 'city', ['shop', 'work'], '편의점', ['コンビニ', 'こんびに'], 'supérette', 'à la supérette', 'convenience store', ['at the convenience store', 'to the convenience store']),
  P('gym', 'leisure', ['sport'], '헬스장', ['ジム', 'じむ'], 'salle de sport', 'à la salle de sport', 'gym', ['at the gym', 'to the gym']),
  P('korea', 'city', [], '한국', ['韓国', 'かんこく'], 'Corée', 'en Corée', 'Korea', ['in Korea', 'to Korea']),
  P('japan', 'city', [], '일본', ['日本', 'にほん'], 'Japon', 'au Japon', 'Japan', ['in Japan', 'to Japan']),
  P('seoul', 'city', [], '서울', ['ソウル', 'そうる'], 'Séoul', 'à Séoul', 'Seoul', ['in Seoul', 'to Seoul']),
  P('tokyo', 'city', [], '도쿄', ['東京', 'とうきょう'], 'Tokyo', 'à Tokyo', 'Tokyo', ['in Tokyo', 'to Tokyo']),
  P('sea', 'leisure', [], '바다', ['海', 'うみ'], 'mer', 'à la mer', 'sea', ['at the beach', 'to the beach']),
];

// ---------- Verbes et adjectifs ----------
// type : obj | go | act | adj | weather
// ko : { stem, a, f, longNeg?, neg? } ; ja : { w, r, g: '1' (ichidan) | '5' (godan) | 'suru' | 'kuru' | 'iku' | 'i' | 'na', p? (particule de l'objet) }
// fr : conjugaison française ; en : { b, s, past } ou adjectif ; art / enArt : article du complément
const V = (o) => o;

export const VERBS = [
  V({ id: 'eat', type: 'obj', objs: ['food'], art: 'ind', enArt: 'ind', places: ['eat', 'home'], t: ['food'],
    ko: { kr: '먹다', stem: '먹', a: '먹어', f: '먹을' }, ja: { w: '食べる', r: 'たべる', g: '1' },
    fr: { inf: 'manger', p: ['mange', 'manges', 'mange', 'mangeons', 'mangez'], pp: 'mangé', aux: 'avoir' }, en: { b: 'eat', s: 'eats', past: 'ate' } }),
  V({ id: 'drink', type: 'obj', objs: ['drink'], art: 'ind', enArt: 'ind', places: ['eat', 'home'], t: ['food'],
    ko: { kr: '마시다', stem: '마시', a: '마셔', f: '마실' }, ja: { w: '飲む', r: 'のむ', g: '5' },
    fr: { inf: 'boire', p: ['bois', 'bois', 'boit', 'buvons', 'buvez'], pp: 'bu', aux: 'avoir' }, en: { b: 'drink', s: 'drinks', past: 'drank' } }),
  V({ id: 'make', type: 'obj', objs: ['food'], only: ['kimchi', 'ramen', 'bibimbap', 'bulgogi', 'tteokbokki', 'cake', 'bread', 'onigiri', 'miso', 'tempura', 'sushi', 'udon'], art: 'ind', enArt: 'ind', places: ['home'], t: ['food'],
    ko: { kr: '만들다', stem: '만들', a: '만들어', f: '만들' }, ja: { w: '作る', r: 'つくる', g: '5' },
    fr: { inf: 'préparer', p: ['prépare', 'prépares', 'prépare', 'préparons', 'préparez'], pp: 'préparé', aux: 'avoir' }, en: { b: 'make', s: 'makes', past: 'made' } }),
  V({ id: 'buy', type: 'obj', objs: ['food', 'drink', 'item'], art: 'ind', enArt: 'ind', places: ['shop'], t: ['city', 'daily', 'food'],
    ko: { kr: '사다', stem: '사', a: '사', f: '살' }, ja: { w: '買う', r: 'かう', g: '5' },
    fr: { inf: 'acheter', p: ['achète', 'achètes', 'achète', 'achetons', 'achetez'], pp: 'acheté', aux: 'avoir' }, en: { b: 'buy', s: 'buys', past: 'bought' } }),
  V({ id: 'like', type: 'obj', objs: ['food', 'drink', 'music', 'lang'], art: 'def', enArt: 'gen', places: [], t: ['food', 'leisure'], noWant: true, noFuture: true,
    ko: { kr: '좋아하다', stem: '좋아하', a: '좋아해', f: '좋아할' }, ja: { w: '好き', r: 'すき', g: 'na', p: 'が', label: { fr: 'aimer (好きだ)', en: 'to like (好きだ)' } },
    fr: { inf: 'aimer', p: ['aime', 'aimes', 'aime', 'aimons', 'aimez'], pp: 'aimé', aux: 'avoir' }, en: { b: 'like', s: 'likes', past: 'liked' } }),
  V({ id: 'watch', type: 'obj', objs: ['media'], art: 'ind', enArt: 'ind', places: ['movie', 'home'], t: ['leisure'],
    ko: { kr: '보다', stem: '보', a: '봐', f: '볼' }, ja: { w: '見る', r: 'みる', g: '1' },
    fr: { inf: 'regarder', p: ['regarde', 'regardes', 'regarde', 'regardons', 'regardez'], pp: 'regardé', aux: 'avoir' }, en: { b: 'watch', s: 'watches', past: 'watched' } }),
  V({ id: 'read', type: 'obj', objs: ['read'], art: 'ind', enArt: 'ind', places: ['study', 'home'], t: ['leisure', 'study'],
    ko: { kr: '읽다', stem: '읽', a: '읽어', f: '읽을' }, ja: { w: '読む', r: 'よむ', g: '5' },
    fr: { inf: 'lire', p: ['lis', 'lis', 'lit', 'lisons', 'lisez'], pp: 'lu', aux: 'avoir' }, en: { b: 'read', s: 'reads', past: 'read' } }),
  V({ id: 'listen', type: 'obj', objs: ['music'], art: 'ind', enArt: 'ind', places: ['home'], t: ['leisure'],
    ko: { kr: '듣다', stem: '듣', a: '들어', f: '들을' }, ja: { w: '聞く', r: 'きく', g: '5' },
    fr: { inf: 'écouter', p: ['écoute', 'écoutes', 'écoute', 'écoutons', 'écoutez'], pp: 'écouté', aux: 'avoir' }, en: { b: 'listen to', s: 'listens to', past: 'listened to' } }),
  V({ id: 'write', type: 'obj', objs: ['letter'], art: 'ind', enArt: 'ind', places: ['home', 'study'], t: ['study', 'daily'],
    ko: { kr: '쓰다', stem: '쓰', a: '써', f: '쓸' }, ja: { w: '書く', r: 'かく', g: '5' },
    fr: { inf: 'écrire', p: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez'], pp: 'écrit', aux: 'avoir' }, en: { b: 'write', s: 'writes', past: 'wrote' } }),
  V({ id: 'study', type: 'obj', objs: ['lang'], art: 'def', enArt: 'def', places: ['study', 'home'], t: ['study'],
    ko: { kr: '공부하다', stem: '공부하', a: '공부해', f: '공부할', longNeg: true }, ja: { w: '勉強する', r: 'べんきょうする', g: 'suru' },
    fr: { inf: 'étudier', p: ['étudie', 'étudies', 'étudie', 'étudions', 'étudiez'], pp: 'étudié', aux: 'avoir' }, en: { b: 'study', s: 'studies', past: 'studied' } }),
  V({ id: 'learn', type: 'obj', objs: ['lang'], art: 'def', enArt: 'def', places: ['study'], t: ['study'],
    ko: { kr: '배우다', stem: '배우', a: '배워', f: '배울' }, ja: { w: '習う', r: 'ならう', g: '5' },
    fr: { inf: 'apprendre', p: ['apprends', 'apprends', 'apprend', 'apprenons', 'apprenez'], pp: 'appris', aux: 'avoir' }, en: { b: 'learn', s: 'learns', past: 'learned' } }),
  V({ id: 'wait', type: 'obj', objs: ['person', 'vehicle'], art: 'def', enArt: 'def', places: ['meet'], t: ['city', 'daily'],
    ko: { kr: '기다리다', stem: '기다리', a: '기다려', f: '기다릴' }, ja: { w: '待つ', r: 'まつ', g: '5' },
    fr: { inf: 'attendre', p: ['attends', 'attends', 'attend', 'attendons', 'attendez'], pp: 'attendu', aux: 'avoir' }, en: { b: 'wait for', s: 'waits for', past: 'waited for' } }),
  V({ id: 'meet', type: 'obj', objs: ['person'], art: 'def', enArt: 'def', places: ['meet'], t: ['daily', 'leisure'],
    ko: { kr: '만나다', stem: '만나', a: '만나', f: '만날' }, ja: { w: '会う', r: 'あう', g: '5', p: 'に' },
    fr: { inf: 'retrouver', p: ['retrouve', 'retrouves', 'retrouve', 'retrouvons', 'retrouvez'], pp: 'retrouvé', aux: 'avoir' }, en: { b: 'meet', s: 'meets', past: 'met' } }),
  V({ id: 'take', type: 'obj', objs: ['vehicle'], art: 'def', enArt: 'def', places: [], t: ['city'],
    ko: { kr: '타다', stem: '타', a: '타', f: '탈' }, ja: { w: '乗る', r: 'のる', g: '5', p: 'に' },
    fr: { inf: 'prendre', p: ['prends', 'prends', 'prend', 'prenons', 'prenez'], pp: 'pris', aux: 'avoir' }, en: { b: 'take', s: 'takes', past: 'took' } }),
  V({ id: 'go', type: 'go', t: ['city', 'daily'],
    ko: { kr: '가다', stem: '가', a: '가', f: '갈' }, ja: { w: '行く', r: 'いく', g: 'iku' },
    fr: { inf: 'aller', p: ['vais', 'vas', 'va', 'allons', 'allez'], pp: 'allé', aux: 'être' }, en: { b: 'go', s: 'goes', past: 'went' } }),
  V({ id: 'come', type: 'go', t: ['city', 'daily'],
    ko: { kr: '오다', stem: '오', a: '와', f: '올' }, ja: { w: '来る', r: 'くる', g: 'kuru' },
    fr: { inf: 'venir', p: ['viens', 'viens', 'vient', 'venons', 'venez'], pp: 'venu', aux: 'être' }, en: { b: 'come', s: 'comes', past: 'came' } }),
  V({ id: 'work', type: 'act', places: ['work'], t: ['study', 'daily'],
    ko: { kr: '일하다', stem: '일하', a: '일해', f: '일할', longNeg: true }, ja: { w: '働く', r: 'はたらく', g: '5' },
    fr: { inf: 'travailler', p: ['travaille', 'travailles', 'travaille', 'travaillons', 'travaillez'], pp: 'travaillé', aux: 'avoir' }, en: { b: 'work', s: 'works', past: 'worked' } }),
  V({ id: 'exercise', type: 'act', places: ['sport'], t: ['leisure'],
    ko: { kr: '운동하다', stem: '운동하', a: '운동해', f: '운동할', longNeg: true }, ja: { w: '運動する', r: 'うんどうする', g: 'suru' },
    fr: { inf: 'faire', p: ['fais', 'fais', 'fait', 'faisons', 'faites'], pp: 'fait', aux: 'avoir', suf: 'du sport', sufNeg: 'de sport', label: 'faire du sport' }, en: { b: 'exercise', s: 'exercises', past: 'exercised' } }),
  V({ id: 'cook', type: 'act', places: ['home'], t: ['food', 'daily'],
    ko: { kr: '요리하다', stem: '요리하', a: '요리해', f: '요리할', longNeg: true }, ja: { w: '料理する', r: 'りょうりする', g: 'suru' },
    fr: { inf: 'cuisiner', p: ['cuisine', 'cuisines', 'cuisine', 'cuisinons', 'cuisinez'], pp: 'cuisiné', aux: 'avoir' }, en: { b: 'cook', s: 'cooks', past: 'cooked' } }),
  V({ id: 'sleep', type: 'act', places: ['home'], t: ['daily'],
    ko: { kr: '자다', stem: '자', a: '자', f: '잘' }, ja: { w: '寝る', r: 'ねる', g: '1' },
    fr: { inf: 'dormir', p: ['dors', 'dors', 'dort', 'dormons', 'dormez'], pp: 'dormi', aux: 'avoir' }, en: { b: 'sleep', s: 'sleeps', past: 'slept' } }),
  // Adjectifs qui décrivent une personne
  V({ id: 'busy', type: 'adj', subj: 'person', t: ['daily', 'study'],
    ko: { kr: '바쁘다', stem: '바쁘', a: '바빠', f: '바쁠' }, ja: { w: '忙しい', r: 'いそがしい', g: 'i' },
    fr: { m: 'occupé', f: 'occupée', x: 'occupé(e)', xp: 'occupé(e)s' }, en: { adj: 'busy' } }),
  V({ id: 'tired', type: 'adj', subj: 'person', t: ['daily'],
    ko: { kr: '피곤하다', stem: '피곤하', a: '피곤해', f: '피곤할' }, ja: { w: '疲れている', r: 'つかれている', g: '1', label: { fr: 'être fatigué (疲れる)', en: 'to be tired (疲れる)' } },
    fr: { m: 'fatigué', f: 'fatiguée', x: 'fatigué(e)', xp: 'fatigué(e)s' }, en: { adj: 'tired' } }),
  V({ id: 'happy', type: 'adj', subj: 'person', t: ['daily', 'leisure'],
    ko: { kr: '행복하다', stem: '행복하', a: '행복해', f: '행복할' }, ja: { w: '幸せ', r: 'しあわせ', g: 'na' },
    fr: { m: 'heureux', f: 'heureuse', x: 'heureux (heureuse)', xp: 'heureux (heureuses)' }, en: { adj: 'happy' } }),
  // Adjectifs qui décrivent une chose
  V({ id: 'tasty', type: 'adj', subj: ['food', 'drink'], t: ['food'],
    ko: { kr: '맛있다', stem: '맛있', a: '맛있어', f: '맛있을', neg: { stem: '맛없', a: '맛없어', f: '맛없을', kr: '맛없다' } }, ja: { w: 'おいしい', r: 'おいしい', g: 'i' },
    fr: { m: 'bon', f: 'bonne', mp: 'bons', fp: 'bonnes', label: 'être bon, délicieux' }, en: { adj: 'good', label: 'to be tasty' } }),
  V({ id: 'spicy', type: 'adj', subj: ['food'], only: ['kimchi', 'ramen', 'tteokbokki'], t: ['food'],
    ko: { kr: '맵다', stem: '맵', a: '매워', f: '매울' }, ja: { w: '辛い', r: 'からい', g: 'i' },
    fr: { m: 'épicé', f: 'épicée' }, en: { adj: 'spicy' } }),
  V({ id: 'expensive', type: 'adj', subj: ['food', 'drink', 'item'], t: ['food', 'city'],
    ko: { kr: '비싸다', stem: '비싸', a: '비싸', f: '비쌀' }, ja: { w: '高い', r: 'たかい', g: 'i' },
    fr: { m: 'cher', f: 'chère', mp: 'chers', fp: 'chères' }, en: { adj: 'expensive' } }),
  // Météo
  V({ id: 'nice', type: 'weather', t: ['daily', 'city', 'leisure'],
    ko: { kr: '좋다', stem: '좋', a: '좋아', f: '좋을' }, ja: { w: 'いい', r: 'いい', g: 'i', subj: ['天気', 'てんき'], label: { fr: 'être bien, beau (いい)', en: 'to be good, nice (いい)' } },
    fr: { w: 'beau', label: 'être bon, beau' }, en: { adj: 'nice', label: 'to be nice (weather)' } }),
  V({ id: 'hot', type: 'weather', t: ['daily', 'city'],
    ko: { kr: '덥다', stem: '덥', a: '더워', f: '더울' }, ja: { w: '暑い', r: 'あつい', g: 'i' },
    fr: { w: 'chaud', label: 'faire chaud' }, en: { adj: 'hot', label: 'to be hot (weather)' } }),
  V({ id: 'cold', type: 'weather', t: ['daily', 'city'],
    ko: { kr: '춥다', stem: '춥', a: '추워', f: '추울' }, ja: { w: '寒い', r: 'さむい', g: 'i' },
    fr: { w: 'froid', label: 'faire froid' }, en: { adj: 'cold', label: 'to be cold (weather)' } }),
];

export const TIMES = {
  present: [
    { ko: '오늘', ja: ['今日', 'きょう'], fr: 'aujourd’hui', en: 'today' },
    { ko: '지금', ja: ['今', 'いま'], fr: 'maintenant', en: 'now' },
    { ko: '매일', ja: ['毎日', 'まいにち'], fr: 'tous les jours', en: 'every day' },
  ],
  past: [
    { ko: '어제', ja: ['昨日', 'きのう'], fr: 'hier', en: 'yesterday' },
    { ko: '지난주에', ja: ['先週', 'せんしゅう'], fr: 'la semaine dernière', en: 'last week' },
    { ko: '주말에', ja: ['週末', 'しゅうまつ', 'に'], fr: 'ce week-end', en: 'last weekend' },
  ],
  future: [
    { ko: '내일', ja: ['明日', 'あした'], fr: 'demain', en: 'tomorrow' },
    { ko: '다음 주에', ja: ['来週', 'らいしゅう'], fr: 'la semaine prochaine', en: 'next week' },
    { ko: '주말에', ja: ['週末', 'しゅうまつ', 'に'], fr: 'ce week-end', en: 'this weekend' },
  ],
};

/** Libellé d'un verbe dans la langue de l'interface. */
export function verbLabel(v, lang = 'fr') {
  if (lang === 'en') return v.en.label || (v.en.adj ? 'to be ' + v.en.adj : 'to ' + v.en.b);
  if (v.fr.label) return v.fr.label;
  if (v.fr.inf) return v.fr.inf;
  return 'être ' + v.fr.m;
}

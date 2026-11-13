// Parcours : modules de difficulté croissante, composés d'étapes qui renvoient aux exercices existants.
// Types d'étape :
//   script  { set }            quiz d'écriture (lettres, syllabes, mots, kanji)
//   lesson  { lesson }         leçon du guide
//   cards   { theme }          cartes mémoire d'un thème
//   words   { theme }          quiz de vocabulaire d'un thème
//   phrase  { title, crit }    trois phrases à reconstituer selon des critères
//   mastery { theme }          objectif : retenir 60 % des mots du thème (suivi par la répétition espacée)
//   pairs                      jeu des paires
//   write   { set, form }      tracer les lettres dans le bon ordre des traits (form : hira | kata pour les kana)
//   type    { set | theme }    écrire au clavier : lettres d'un jeu, ou mots d'un thème à partir de leur traduction
//   dictation { theme }        dictée : écrire au clavier les mots entendus
//   ptype   { title, crit }    trois phrases à écrire entièrement au clavier
//   speak   { set | theme }    prononcer à voix haute les lettres d'un jeu ou les mots d'un thème (le téléphone écoute)
// Chaque module se termine par un examen (ajouté automatiquement dans road.js) : réussi, il passe au platine.
// Les modules sont rangés en chapitres (CHAPTERS, en bas du fichier).
// L'identifiant d'une étape (id) sert de clé de sauvegarde : ne pas le changer.

const L = (fr, en) => ({ fr, en });
const script = (id, set) => ({ id, kind: 'script', set });
const lesson = (id) => ({ id: `l-${id}`, kind: 'lesson', lesson: id });
const cards = (theme) => ({ id: `c-${theme}`, kind: 'cards', theme });
const words = (theme) => ({ id: `w-${theme}`, kind: 'words', theme });
const phrase = (id, title, crit) => ({ id, kind: 'phrase', title, crit });
const mastery = (theme) => ({ id: `m-${theme}`, kind: 'mastery', theme });
// Un thème de vocabulaire complet : découvrir (cartes), s'entraîner (quiz), retenir (objectif)
const theme = (t) => [cards(t), words(t), mastery(t)];
const write = (set, form) => ({ id: `wr-${set}${form === 'kata' ? '-kata' : ''}`, kind: 'write', set, form });
const typeS = (set) => ({ id: `ty-${set}`, kind: 'type', set });
const typeW = (t) => ({ id: `t-${t}`, kind: 'type', theme: t });
const dict = (t) => ({ id: `d-${t}`, kind: 'dictation', theme: t });
const ptype = (id, title, crit) => ({ id, kind: 'ptype', title, crit });
const speakW = (t) => ({ id: `v-${t}`, kind: 'speak', theme: t });
const speakS = (set) => ({ id: `vs-${set}`, kind: 'speak', set });
// Thème approfondi : découvrir, reconnaître, écrire, comprendre à l'oreille, retenir
const themePlus = (t) => [cards(t), words(t), typeW(t), dict(t), speakW(t), mastery(t)];
// Phrases toutes faites : découvrir, reconnaître, comprendre à l'oreille, retenir
const phrasePlus = (t) => [cards(t), words(t), dict(t), speakW(t), mastery(t)];

const KO = [
  {
    id: 'ko1', glyph: '한글', color: 'var(--c-hangul)',
    title: L('Les lettres du hangeul', 'The hangul letters'), sub: L('Voyelles, consonnes, premières syllabes', 'Vowels, consonants, first syllables'),
    steps: [lesson('syllabe'), script('s-vowels', 'vowels'), script('s-consonants', 'consonants'), lesson('ieung'), script('s-syllables', 'syllables')],
  },
  {
    id: 'ko2', glyph: '읽기', color: 'var(--c-guide)',
    title: L('Lire pour de bon', 'Reading for real'), sub: L('Lettres composées, consonnes finales, vrais mots', 'Compound letters, final consonants, real words'),
    steps: [script('s-compound', 'compound'), script('s-double', 'double'), lesson('series'), lesson('sonores'), lesson('finales'), lesson('double-batchim'), script('s-words', 'words')],
  },
  {
    id: 'ko3', glyph: '안녕', color: 'var(--c-words)',
    title: L('Premiers mots', 'First words'), sub: L('Les essentiels et la phrase la plus simple', 'The essentials and the simplest sentence'),
    steps: [cards('basics'), words('basics'), lesson('ordre'), lesson('etre'), phrase('p-first', L('Premières phrases', 'First sentences'), { level: '1' })],
  },
  {
    id: 'ko4', glyph: '일상', color: 'var(--c-home)',
    title: L('Le quotidien', 'Everyday life'), sub: L('Parler de sa journée au présent', 'Talking about your day in the present'),
    steps: [cards('daily'), words('daily'), lesson('theme'), lesson('present'), lesson('politesse'), lesson('adjectifs'), phrase('p-daily', L('Phrases du quotidien', 'Everyday sentences'), { level: '1', theme: 'daily', tense: 'present' })],
  },
  {
    id: 'ko5', glyph: '음식', color: 'var(--c-phrases)',
    title: L('À table', 'At the table'), sub: L('La nourriture, l’objet 을/를 et les nombres', 'Food, the object 을/를 and numbers'),
    steps: [cards('food'), words('food'), lesson('objet'), lesson('nombres'), lesson('compteurs'), phrase('p-food', L('Commander et manger', 'Ordering and eating'), { level: '2', theme: 'food' })],
  },
  {
    id: 'ko6', glyph: '도시', color: 'var(--c-stats)',
    title: L('En ville', 'Around town'), sub: L('Les lieux, 에/에서 et les liaisons', 'Places, 에/에서 and linking sounds'),
    steps: [cards('city'), words('city'), lesson('lieu'), lesson('particules'), lesson('liaison'), phrase('p-city', L('Se déplacer', 'Getting around'), { level: '2', theme: 'city' })],
  },
  {
    id: 'ko7', glyph: '시간', color: 'var(--c-hangul)',
    title: L('Hier et demain', 'Yesterday and tomorrow'), sub: L('Le passé, le futur et les loisirs', 'Past, future and leisure'),
    steps: [lesson('passe'), phrase('p-past', L('Raconter au passé', 'Telling it in the past'), { level: '2', tense: 'past' }), cards('leisure'), words('leisure'), lesson('futur'), lesson('dates'), phrase('p-future', L('Faire des projets', 'Making plans'), { level: '2', tense: 'future' })],
  },
  {
    id: 'ko8', glyph: '대화', color: 'var(--c-guide)',
    title: L('Nuancer', 'Adding nuance'), sub: L('Dire non, dire ce qu’on veut, poser des questions', 'Saying no, saying what you want, asking questions'),
    steps: [lesson('negation'), phrase('p-neg', L('Phrases négatives', 'Negative sentences'), { level: '2', form: 'neg' }), lesson('envie'), phrase('p-want', L('Dire ses envies', 'Saying what you want'), { level: '2', form: 'want' }), lesson('questions'), phrase('p-question', L('Poser des questions', 'Asking questions'), { level: '2', form: 'question' }), lesson('connecteurs'), cards('study'), words('study')],
  },
  {
    id: 'ko8b', glyph: '부탁', color: 'var(--c-phrases)',
    title: L('Demander et comparer', 'Asking and comparing'), sub: L('Ordres polis, obligations, capacités, comparaisons', 'Polite requests, obligations, abilities, comparisons'),
    steps: [lesson('imperatif'), lesson('obligation'), lesson('pouvoir'), lesson('progressif'), lesson('comparaison'), phrase('p-mixed', L('Phrases variées', 'Mixed sentences'), { level: '2' })],
  },
  {
    id: 'ko9', glyph: '발음', color: 'var(--c-words)',
    title: L('Prononcer comme il faut', 'Sounding right'), sub: L('Les règles de prononciation avancées', 'The advanced pronunciation rules'),
    steps: [lesson('hieut'), lesson('nasal'), lesson('rieul'), lesson('tension'), lesson('palatal'), lesson('n-insertion'), lesson('ui'), { id: 'g-pairs', kind: 'pairs' }],
  },
  {
    id: 'ko10', glyph: '고급', color: 'var(--c-home)',
    title: L('Aller plus loin', 'Going further'), sub: L('Irréguliers, intonation et phrases avancées', 'Irregulars, intonation and advanced sentences'),
    steps: [lesson('voyelles'), lesson('si'), lesson('rythme'), lesson('irreguliers'), phrase('p-advanced', L('Phrases avancées', 'Advanced sentences'), { level: '3' }), ptype('pt-mix', L('Écrire des phrases variées', 'Writing mixed sentences'), { level: '2' })],
  },
  {
    id: 'ko11', glyph: '문장', color: 'var(--c-stats)',
    title: L('Phrases complexes', 'Complex sentences'), sub: L('Relatives, nominalisation, temps, cause, condition', 'Relative clauses, nominalisation, time, cause, condition'),
    steps: [lesson('determinatif'), lesson('nominalisation'), lesson('temps-clauses'), lesson('cause'), lesson('conditions'), phrase('p-complex', L('Phrases longues', 'Long sentences'), { level: '3', tense: 'past' })],
  },
  {
    id: 'ko12', glyph: '느낌', color: 'var(--c-hangul)',
    title: L('Exprimer les nuances', 'Expressing nuance'), sub: L('Intention, expérience, services, suppositions, fins de phrase', 'Intention, experience, favours, conjecture, sentence endings'),
    steps: [lesson('intention'), lesson('experience'), lesson('donner'), lesson('conjecture'), lesson('fins'), phrase('p-nuance', L('Envies et questions', 'Wishes and questions'), { level: '3', form: 'want' })],
  },
  {
    id: 'ko13', glyph: '존댓말', color: 'var(--c-guide)',
    title: L('Les registres', 'Registers'), sub: L('Honorifiques, discours rapporté, passif, style écrit', 'Honorifics, reported speech, passive, written style'),
    steps: [lesson('honorifiques'), lesson('rapporte'), lesson('passif'), lesson('neutre'), phrase('p-formal', L('Phrases formelles', 'Formal sentences'), { level: '3', style: 'formal' })],
  },
];

const JA = [
  {
    id: 'ja1', glyph: 'かな', color: 'var(--c-hangul)',
    title: L('Les kana de base', 'The basic kana'), sub: L('Trois écritures, cinq voyelles, les premiers signes', 'Three scripts, five vowels, the first characters'),
    steps: [lesson('ecritures'), lesson('voyelles'), script('s-base', 'base'), lesson('sons-difficiles'), script('s-syllables', 'syllables')],
  },
  {
    id: 'ja2', glyph: '読む', color: 'var(--c-guide)',
    title: L('Lire pour de bon', 'Reading for real'), sub: L('Sons voisés, sons combinés, vrais mots', 'Voiced sounds, combined sounds, real words'),
    steps: [lesson('dakuten'), script('s-voiced', 'voiced'), lesson('yoon'), script('s-combo', 'combo'), lesson('tsu'), lesson('longues'), lesson('n'), lesson('rendaku'), script('s-words', 'words')],
  },
  {
    id: 'ja3', glyph: '初め', color: 'var(--c-words)',
    title: L('Premiers mots', 'First words'), sub: L('Les essentiels et la phrase la plus simple', 'The essentials and the simplest sentence'),
    steps: [cards('basics'), words('basics'), lesson('ordre'), lesson('desu'), phrase('p-first', L('Premières phrases', 'First sentences'), { level: '1' })],
  },
  {
    id: 'ja4', glyph: '日常', color: 'var(--c-home)',
    title: L('Le quotidien', 'Everyday life'), sub: L('は et が, les verbes en ます', 'は and が, the ます verbs'),
    steps: [cards('daily'), words('daily'), lesson('wa-ga'), lesson('masu'), lesson('particules'), phrase('p-daily', L('Phrases du quotidien', 'Everyday sentences'), { level: '1', theme: 'daily', tense: 'present' })],
  },
  {
    id: 'ja5', glyph: '食事', color: 'var(--c-phrases)',
    title: L('À table', 'At the table'), sub: L('La nourriture, を et les premiers kanji', 'Food, を and the first kanji'),
    steps: [cards('food'), words('food'), lesson('wo'), lesson('nombres'), lesson('compteurs-ja'), script('s-kanjiNum', 'kanjiNum'), phrase('p-food', L('Commander et manger', 'Ordering and eating'), { level: '2', theme: 'food' })],
  },
  {
    id: 'ja6', glyph: '町', color: 'var(--c-stats)',
    title: L('En ville', 'Around town'), sub: L('Les lieux, に et で, les kanji des gens et des lieux', 'Places, に and で, kanji for people and places'),
    steps: [cards('city'), words('city'), lesson('ni-de'), lesson('particules-plus'), script('s-kanjiLife', 'kanjiLife'), phrase('p-city', L('Se déplacer', 'Getting around'), { level: '2', theme: 'city' })],
  },
  {
    id: 'ja7', glyph: '時間', color: 'var(--c-hangul)',
    title: L('Hier et demain', 'Yesterday and tomorrow'), sub: L('Le passé, le futur et les loisirs', 'Past, future and leisure'),
    steps: [lesson('temps'), phrase('p-past', L('Raconter au passé', 'Telling it in the past'), { level: '2', tense: 'past' }), cards('leisure'), words('leisure'), lesson('dates-ja'), phrase('p-future', L('Faire des projets', 'Making plans'), { level: '2', tense: 'future' })],
  },
  {
    id: 'ja8', glyph: '会話', color: 'var(--c-guide)',
    title: L('Nuancer', 'Adding nuance'), sub: L('Adjectifs, envies, questions et négations', 'Adjectives, wishes, questions and negatives'),
    steps: [lesson('adjectifs'), lesson('tai'), phrase('p-want', L('Dire ses envies', 'Saying what you want'), { level: '2', form: 'want' }), lesson('questions'), phrase('p-question', L('Poser des questions', 'Asking questions'), { level: '2', form: 'question' }), cards('study'), words('study'), script('s-kanjiAction', 'kanjiAction'), phrase('p-neg', L('Phrases négatives', 'Negative sentences'), { level: '2', form: 'neg' })],
  },
  {
    id: 'ja8b', glyph: 'て形', color: 'var(--c-phrases)',
    title: L('La forme en て', 'The て form'), sub: L('Enchaîner, demander, décrire ce qui est en cours', 'Chaining, requesting, describing what is going on'),
    steps: [lesson('te'), lesson('teiru'), lesson('liaisons'), lesson('devenir'), lesson('comparaison-ja'), phrase('p-mixed', L('Phrases variées', 'Mixed sentences'), { level: '2' })],
  },
  {
    id: 'ja9', glyph: '上級', color: 'var(--c-home)',
    title: L('Aller plus loin', 'Going further'), sub: L('Style familier, prononciation fine, phrases avancées', 'Casual style, fine pronunciation, advanced sentences'),
    steps: [lesson('familier'), lesson('nai'), lesson('permission'), lesson('potentiel'), lesson('muettes'), lesson('accent'), { id: 'g-pairs', kind: 'pairs' }, phrase('p-advanced', L('Phrases avancées', 'Advanced sentences'), { level: '3' }), ptype('pt-mix', L('Écrire des phrases variées', 'Writing mixed sentences'), { level: '2' })],
  },
  {
    id: 'ja10', glyph: '文', color: 'var(--c-stats)',
    title: L('Phrases complexes', 'Complex sentences'), sub: L('Relatives, nominalisation, conditions, temps, citation', 'Relative clauses, nominalisation, conditionals, time, quotation'),
    steps: [lesson('relative'), lesson('nominaliser'), lesson('conditionnel'), lesson('temps-ja'), lesson('citation'), phrase('p-complex', L('Phrases longues', 'Long sentences'), { level: '3', tense: 'past' })],
  },
  {
    id: 'ja11', glyph: '気持ち', color: 'var(--c-hangul)',
    title: L('Exprimer les nuances', 'Expressing nuance'), sub: L('Intention, essais, services, suppositions, explications', 'Intention, trying, favours, conjecture, explanation'),
    steps: [lesson('volitif'), lesson('experience-ja'), lesson('donner-ja'), lesson('apparence'), lesson('explication'), phrase('p-nuance', L('Envies et questions', 'Wishes and questions'), { level: '3', form: 'want' })],
  },
  {
    id: 'ja12', glyph: '敬語', color: 'var(--c-guide)',
    title: L('Les registres', 'Registers'), sub: L('Transitif et intransitif, passif, keigo, style écrit', 'Transitive and intransitive, passive, keigo, written style'),
    steps: [lesson('transitif'), lesson('passif-ja'), lesson('keigo'), lesson('ecrit-ja'), phrase('p-casual', L('Phrases familières', 'Casual sentences'), { level: '3', style: 'casual' })],
  },
];

// ---------- Modules de vocabulaire et de phrases, intercalés dans le parcours ----------
// [identifiant du module après lequel insérer, module]
const KO_VOCAB = [
  ['ko3', {
    id: 'kov1', glyph: '인사', color: 'var(--c-guide)',
    title: L('Se présenter', 'Introducing yourself'), sub: L('Saluer, parler de soi et de sa famille', 'Greeting, talking about yourself and your family'),
    steps: [...theme('phrPolite'), ...theme('family'), ...theme('phrTalk')],
  }],
  ['ko4', {
    id: 'kov2', glyph: '몸', color: 'var(--c-hangul)',
    title: L('Le corps et la maison', 'Body and home'), sub: L('Se décrire, dire où l’on a mal, nommer les objets', 'Describing yourself, saying what hurts, naming objects'),
    steps: [...theme('body'), ...theme('home')],
  }],
  ['ko5', {
    id: 'kov3', glyph: '쇼핑', color: 'var(--c-phrases)',
    title: L('Faire des achats', 'Going shopping'), sub: L('Vêtements, couleurs, prix, et les phrases du voyageur', 'Clothes, colours, prices and the traveller’s phrases'),
    steps: [...theme('clothes'), ...theme('phrTravel')],
  }],
  ['ko6', {
    id: 'kov4', glyph: '자연', color: 'var(--c-words)',
    title: L('Dehors', 'Out and about'), sub: L('Nature, météo, animaux, jours et moments', 'Nature, weather, animals, days and times'),
    steps: [...theme('nature'), ...theme('animals'), ...theme('time')],
  }],
  ['ko8', {
    id: 'kov5', glyph: '느낌', color: 'var(--c-guide)',
    title: L('Décrire et ressentir', 'Describing and feeling'), sub: L('Adjectifs, émotions et caractère', 'Adjectives, emotions and character'),
    steps: [...theme('describe'), ...theme('feelings')],
  }],
  ['ko8b', {
    id: 'kov6', glyph: '동사', color: 'var(--c-hangul)',
    title: L('Agir et se débrouiller', 'Acting and getting by'), sub: L('Les verbes du quotidien et les phrases en cas de pépin', 'Everyday verbs and phrases for when things go wrong'),
    steps: [...theme('actions'), ...theme('phrHelp')],
  }],
  ['ko10', {
    id: 'kov7', glyph: '사회', color: 'var(--c-stats)',
    title: L('Travail et société', 'Work and society'), sub: L('Métiers, actualité, idées', 'Jobs, news, ideas'),
    steps: [...theme('work'), phrase('p-work', L('Phrases du travail', 'Work sentences'), { level: '3', theme: 'study' })],
  }],
];

const JA_VOCAB = [
  ['ja3', {
    id: 'jav1', glyph: '挨拶', color: 'var(--c-guide)',
    title: L('Se présenter', 'Introducing yourself'), sub: L('Saluer, parler de soi et de sa famille', 'Greeting, talking about yourself and your family'),
    steps: [...theme('phrPolite'), ...theme('family'), script('s-kanji-people', 'kanji-people'), ...theme('phrTalk')],
  }],
  ['ja4', {
    id: 'jav2', glyph: '体', color: 'var(--c-hangul)',
    title: L('Le corps et la maison', 'Body and home'), sub: L('Se décrire, dire où l’on a mal, nommer les objets', 'Describing yourself, saying what hurts, naming objects'),
    steps: [...theme('body'), script('s-kanji-body', 'kanji-body'), ...theme('home')],
  }],
  ['ja5', {
    id: 'jav3', glyph: '買い物', color: 'var(--c-phrases)',
    title: L('Faire des achats', 'Going shopping'), sub: L('Vêtements, couleurs, prix, et les phrases du voyageur', 'Clothes, colours, prices and the traveller’s phrases'),
    steps: [...theme('clothes'), script('s-kanji-quality', 'kanji-quality'), ...theme('phrTravel')],
  }],
  ['ja6', {
    id: 'jav4', glyph: '自然', color: 'var(--c-words)',
    title: L('Dehors', 'Out and about'), sub: L('Nature, météo, animaux, jours et moments', 'Nature, weather, animals, days and times'),
    steps: [...theme('nature'), script('s-kanji-nature', 'kanji-nature'), ...theme('animals'), ...theme('time'), script('s-kanji-time', 'kanji-time'), script('s-kanji-places', 'kanji-places')],
  }],
  ['ja8', {
    id: 'jav5', glyph: '気持ち', color: 'var(--c-guide)',
    title: L('Décrire et ressentir', 'Describing and feeling'), sub: L('Adjectifs, émotions et caractère', 'Adjectives, emotions and character'),
    steps: [...theme('describe'), ...theme('feelings')],
  }],
  ['ja8b', {
    id: 'jav6', glyph: '動詞', color: 'var(--c-hangul)',
    title: L('Agir et se débrouiller', 'Acting and getting by'), sub: L('Les verbes du quotidien et les phrases en cas de pépin', 'Everyday verbs and phrases for when things go wrong'),
    steps: [...theme('actions'), ...theme('phrHelp')],
  }],
  ['ja9', {
    id: 'jav7', glyph: '社会', color: 'var(--c-stats)',
    title: L('Travail et société', 'Work and society'), sub: L('Métiers, actualité, idées, et les kanji de l’école et du travail', 'Jobs, news, ideas, and the kanji of school and work'),
    steps: [...theme('work'), script('s-kanji-study', 'kanji-study'), phrase('p-work', L('Phrases du travail', 'Work sentences'), { level: '3', theme: 'study' })],
  }],
];

// ---------- Nouveaux modules : écriture à la main, clavier, dictées, nouveaux thèmes ----------
// Communs aux deux cours (mêmes thèmes de vocabulaire) ; g : pastilles [coréen, japonais].
const shared = (ja) => {
  const g = (ko, jp) => (ja ? jp : ko);
  const p = ja ? 'ja' : 'ko';
  return [
    {
      id: `${p}n1`, glyph: g('숫자', '数'), color: 'var(--c-stats)',
      title: L('Compter', 'Counting'), sub: L('Les nombres, les quantités et leur prononciation', 'Numbers, quantities and how to say them'),
      steps: [...themePlus('numbers'), lesson(ja ? 'compteurs-son' : 'nombres-pron'), ...(ja ? [write('kanji-num')] : [])],
    },
    {
      id: `${p}w1`, glyph: g('연습', '練習'), color: 'var(--c-home)',
      title: L('Atelier d’écriture : premiers mots', 'Writing workshop: first words'), sub: L('Écrire au clavier, sans modèle, puis sous la dictée', 'Typing without a model, then from dictation'),
      steps: [typeW('basics'), dict('basics'), typeW('family'), dict('family'), ptype('pt-first', L('Écrire ses premières phrases', 'Writing your first sentences'), { level: '1' })],
    },
    {
      id: `${p}f1`, glyph: g('반말', 'ため口'), color: 'var(--c-words)',
      title: L('Entre amis', 'Among friends'), sub: L('Le style familier, celui des messages et des séries', 'The casual style of text messages and TV dramas'),
      steps: phrasePlus('phrFriends'),
    },
    {
      id: `${p}c1`, glyph: g('요리', '料理'), color: 'var(--c-phrases)',
      title: L('En cuisine', 'In the kitchen'), sub: L('Ingrédients, ustensiles, goûts et gestes', 'Ingredients, utensils, tastes and techniques'),
      steps: themePlus('cooking'),
    },
    {
      id: `${p}s1`, glyph: g('가게', '店'), color: 'var(--c-guide)',
      title: L('Faire les magasins', 'Hitting the shops'), sub: L('Négocier, choisir une couleur, payer', 'Bargaining, picking a colour, paying'),
      steps: [...phrasePlus('phrShop'), ...themePlus('colors')],
    },
    {
      id: `${p}w2`, glyph: g('쓰기', '書く'), color: 'var(--c-home)',
      title: L('Atelier d’écriture : le quotidien', 'Writing workshop: everyday life'), sub: L('Les mots de tous les jours, de mémoire et à l’oreille', 'Everyday words, from memory and by ear'),
      steps: [typeW('daily'), dict('daily'), typeW('food'), dict('food'), typeW('body'), dict('home'), ptype('pt-daily', L('Écrire sa journée', 'Writing about your day'), { level: '1', theme: 'daily', tense: 'present' })],
    },
    {
      id: `${p}t1`, glyph: g('교통', '交通'), color: 'var(--c-stats)',
      title: L('Se déplacer', 'Getting about'), sub: L('Transports, directions, positions', 'Transport, directions, positions'),
      steps: themePlus('transport'),
    },
    {
      id: `${p}t2`, glyph: g('여행', '旅行'), color: 'var(--c-home)',
      title: L('Partir en voyage', 'Going on a trip'), sub: L('Réserver, se loger, visiter', 'Booking, staying, sightseeing'),
      steps: themePlus('trip'),
    },
    {
      id: `${p}sp`, glyph: g('운동', '運動'), color: 'var(--c-words)',
      title: L('Sport et forme', 'Sport and fitness'), sub: L('Disciplines, matchs et entraînement', 'Disciplines, matches and training'),
      steps: themePlus('sports'),
    },
    {
      id: `${p}w3`, glyph: g('받아쓰기', '聞き取り'), color: 'var(--c-hangul)',
      title: L('Atelier d’écriture : dehors', 'Writing workshop: out and about'), sub: L('La ville, la nature et le temps qui passe', 'The city, nature and the passing of time'),
      steps: [typeW('city'), dict('city'), typeW('nature'), dict('animals'), dict('time'), ptype('pt-city', L('Écrire ses déplacements', 'Writing about getting around'), { level: '2', theme: 'city' })],
    },
    {
      id: `${p}l1`, glyph: g('부사', '副詞'), color: 'var(--c-words)',
      title: L('Petits mots, grands effets', 'Small words, big effects'), sub: L('Adverbes, connecteurs et mots interrogatifs', 'Adverbs, connectors and question words'),
      steps: themePlus('linkers'),
    },
    {
      id: `${p}fe`, glyph: g('의견', '意見'), color: 'var(--c-guide)',
      title: L('Donner son avis, fixer un rendez-vous', 'Giving opinions, making plans'), sub: L('Dire ce qu’on ressent, téléphoner, se retrouver', 'Saying how you feel, phoning, meeting up'),
      steps: [...phrasePlus('phrFeel'), ...phrasePlus('phrPhone')],
    },
    {
      id: `${p}w4`, glyph: g('작문', '作文'), color: 'var(--c-phrases)',
      title: L('Atelier d’écriture : raconter', 'Writing workshop: telling stories'), sub: L('Décrire, agir, et écrire des phrases au passé', 'Describing, acting, and writing sentences in the past'),
      steps: [typeW('leisure'), dict('feelings'), typeW('describe'), dict('actions'), ptype('pt-past', L('Écrire au passé', 'Writing in the past'), { level: '2', tense: 'past' }), ptype('pt-neg', L('Écrire des phrases négatives', 'Writing negative sentences'), { level: '2', form: 'neg' })],
    },
    {
      id: `${p}9b`, glyph: g('예외', '読み方'), color: 'var(--c-guide)',
      title: ja ? L('Lectures particulières', 'Special readings') : L('Prononciations particulières', 'Special pronunciations'),
      sub: ja ? L('Lectures on et kun, mots irréguliers, phrases à l’oreille', 'On and kun readings, irregular words, phrases by ear') : L('Les mots qui surprennent, les emprunts, les phrases à l’oreille', 'Surprising words, loanwords, phrases by ear'),
      steps: [lesson(ja ? 'on-kun' : 'pron-exceptions'), lesson(ja ? 'jukujikun' : 'emprunts'), dict('phrPolite'), dict('phrTalk'), dict('phrTravel')],
    },
    {
      id: `${p}te`, glyph: g('기술', '技術'), color: 'var(--c-stats)',
      title: L('Technologie et médias', 'Technology and media'), sub: L('Téléphone, internet, écrans', 'Phone, internet, screens'),
      steps: themePlus('tech'),
    },
    {
      id: `${p}cu`, glyph: g('전통', '伝統'), color: 'var(--c-hangul)',
      title: L('Culture et traditions', 'Culture and traditions'), sub: L('Fêtes, arts, coutumes', 'Festivals, arts, customs'),
      steps: themePlus('culture'),
    },
    {
      id: `${p}w5`, glyph: g('완성', '仕上げ'), color: 'var(--c-phrases)',
      title: L('Grand atelier d’écriture', 'Master writing workshop'), sub: L('Tout écrire : mots, dictées et phrases avancées', 'Writing it all: words, dictations and advanced sentences'),
      steps: [typeW('study'), dict('work'), dict('phrHelp'), ptype('pt-future', L('Écrire ses projets', 'Writing about plans'), { level: '2', tense: 'future' }), ptype('pt-want', L('Écrire ses envies', 'Writing about wishes'), { level: '2', form: 'want' }), ptype('pt-advanced', L('Écrire des phrases avancées', 'Writing advanced sentences'), { level: '3' })],
    },
  ];
};

const KO_NEW = [
  {
    id: 'ko1w', glyph: '쓰기', color: 'var(--c-guide)',
    title: L('Tracer les lettres', 'Tracing the letters'), sub: L('L’ordre des traits, puis le clavier coréen', 'Stroke order, then the Korean keyboard'),
    steps: [write('vowels'), write('consonants'), typeS('vowels'), typeS('consonants'), speakS('vowels'), typeS('syllables')],
  },
  {
    id: 'ko2w', glyph: '받아쓰기', color: 'var(--c-home)',
    title: L('Écrire pour de bon', 'Writing for real'), sub: L('Lettres composées et doubles, puis des mots sous la dictée', 'Compound and double letters, then words from dictation'),
    steps: [write('compound'), write('double'), typeS('compound'), typeS('double'), typeS('words'), speakS('words')],
  },
  {
    id: 'ko2b', glyph: '받침', color: 'var(--c-phrases)',
    title: L('Les finales à la loupe', 'Finals under the microscope'), sub: L('Doubles finales, liaisons entre mots, ㅅ intercalaire', 'Double finals, linking between words, the in-between ㅅ'),
    steps: [lesson('double-batchim-plus'), lesson('liaison-mots'), lesson('sai-siot')],
  },
];

const JA_NEW = [
  {
    id: 'ja1w', glyph: 'かく', color: 'var(--c-guide)',
    title: L('Tracer les hiragana', 'Tracing hiragana'), sub: L('L’ordre des traits, puis le clavier des kana', 'Stroke order, then the kana keyboard'),
    steps: [write('base', 'hira'), typeS('base'), speakS('base'), typeS('syllables')],
  },
  {
    id: 'ja1k', glyph: 'カナ', color: 'var(--c-home)',
    title: L('Tracer les katakana', 'Tracing katakana'), sub: L('Les katakana, les sons voisés et les mots étrangers', 'Katakana, voiced sounds and foreign words'),
    steps: [write('base', 'kata'), lesson('katakana-plus'), write('voiced', 'hira'), write('voiced', 'kata'), typeS('voiced')],
  },
  {
    id: 'ja2w', glyph: '書く', color: 'var(--c-phrases)',
    title: L('Écrire pour de bon', 'Writing for real'), sub: L('Sons combinés, mots sous la dictée, pièges de longueur', 'Combined sounds, words from dictation, length traps'),
    steps: [typeS('combo'), typeS('words'), speakS('words'), lesson('paires'), lesson('yotsugana')],
  },
  {
    id: 'jakw', glyph: '漢字', color: 'var(--c-hangul)',
    title: L('Tracer les kanji', 'Tracing kanji'), sub: L('Les kanji des gens, du temps, du corps et des actions, trait par trait', 'Kanji for people, time, the body and actions, stroke by stroke'),
    steps: [write('kanji-people'), write('kanji-time'), write('kanji-body'), write('kanji-action')],
  },
];

// ---------- Chapitres : ordre final des modules ----------
const C = (id, glyph, title, sub, units) => ({ id, glyph, title, sub, units });
const CH = {
  ko: [
    C('kc1', '한글', L('Le hangeul', 'Hangul'), L('Lire, tracer et taper les lettres', 'Reading, tracing and typing the letters'), ['ko1', 'ko1w', 'ko2', 'ko2w', 'ko2b']),
    C('kc2', '첫걸음', L('Premiers pas', 'First steps'), L('Saluer, se présenter, compter', 'Greeting, introducing yourself, counting'), ['ko3', 'kov1', 'kon1', 'kow1', 'kof1']),
    C('kc3', '일상', L('La vie de tous les jours', 'Everyday life'), L('La maison, la table, les magasins', 'Home, meals, shops'), ['ko4', 'kov2', 'ko5', 'kov3', 'koc1', 'kos1', 'kow2']),
    C('kc4', '밖', L('Sortir et bouger', 'Out and about'), L('La ville, les transports, le voyage, le sport', 'Town, transport, travel, sport'), ['ko6', 'kov4', 'kot1', 'kot2', 'kosp', 'kow3']),
    C('kc5', '이야기', L('Raconter et nuancer', 'Telling and nuancing'), L('Passé, futur, envies, opinions', 'Past, future, wishes, opinions'), ['ko7', 'ko8', 'kov5', 'ko8b', 'kov6', 'kol1', 'kofe', 'kow4']),
    C('kc6', '발음', L('Bien prononcer', 'Sounding right'), L('Les règles avancées et les cas particuliers', 'Advanced rules and special cases'), ['ko9', 'ko9b', 'ko10', 'kov7', 'kote']),
    C('kc7', '고급', L('Niveau avancé', 'Advanced level'), L('Phrases complexes, registres, culture', 'Complex sentences, registers, culture'), ['ko11', 'ko12', 'ko13', 'kocu', 'kow5']),
  ],
  ja: [
    C('jc1', 'かな', L('Les kana', 'Kana'), L('Lire, tracer et taper hiragana et katakana', 'Reading, tracing and typing hiragana and katakana'), ['ja1', 'ja1w', 'ja1k', 'ja2', 'ja2w']),
    C('jc2', '初め', L('Premiers pas', 'First steps'), L('Saluer, se présenter, compter', 'Greeting, introducing yourself, counting'), ['ja3', 'jav1', 'jan1', 'jaw1', 'jaf1']),
    C('jc3', '日常', L('La vie de tous les jours', 'Everyday life'), L('La maison, la table, les magasins', 'Home, meals, shops'), ['ja4', 'jav2', 'ja5', 'jav3', 'jac1', 'jas1', 'jaw2']),
    C('jc4', '外', L('Sortir et bouger', 'Out and about'), L('La ville, les transports, le voyage, le sport', 'Town, transport, travel, sport'), ['ja6', 'jav4', 'jat1', 'jat2', 'jasp', 'jaw3']),
    C('jc5', '話', L('Raconter et nuancer', 'Telling and nuancing'), L('Passé, futur, envies, opinions', 'Past, future, wishes, opinions'), ['ja7', 'ja8', 'jav5', 'ja8b', 'jav6', 'jal1', 'jafe', 'jaw4']),
    C('jc6', '読み', L('Bien lire et prononcer', 'Reading and sounding right'), L('Lectures particulières, kanji à la main', 'Special readings, kanji by hand'), ['ja9', 'ja9b', 'jav7', 'jate', 'jakw']),
    C('jc7', '上級', L('Niveau avancé', 'Advanced level'), L('Phrases complexes, registres, culture', 'Complex sentences, registers, culture'), ['ja10', 'ja11', 'ja12', 'jacu', 'jaw5']),
  ],
};

function build(course, modules) {
  const byId = new Map(modules.map((m) => [m.id, m]));
  return CH[course].flatMap((c) => c.units.map((id) => ({ ...byId.get(id), chapter: c.id })));
}

/** Tous les modules définis (pour vérifier qu'aucun n'est oublié dans les chapitres). */
export const MODULES = {
  ko: [...KO, ...KO_VOCAB.map((x) => x[1]), ...KO_NEW, ...shared(false)],
  ja: [...JA, ...JA_VOCAB.map((x) => x[1]), ...JA_NEW, ...shared(true)],
};
export const CHAPTERS = CH;
export const ROADMAP = { ko: build('ko', MODULES.ko), ja: build('ja', MODULES.ja) };

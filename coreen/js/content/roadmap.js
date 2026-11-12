// Parcours : modules de difficulté croissante, composés d'étapes qui renvoient aux exercices existants.
// Types d'étape :
//   script  { set }            quiz d'écriture (lettres, syllabes, mots, kanji)
//   lesson  { lesson }         leçon du guide
//   cards   { theme }          cartes mémoire d'un thème
//   words   { theme }          quiz de vocabulaire d'un thème
//   phrase  { title, crit }    trois phrases à reconstituer selon des critères
//   pairs                      jeu des paires
//   daily                      défi du jour
// L'identifiant d'une étape (id) sert de clé de sauvegarde : ne pas le changer.

const L = (fr, en) => ({ fr, en });
const script = (id, set) => ({ id, kind: 'script', set });
const lesson = (id) => ({ id: `l-${id}`, kind: 'lesson', lesson: id });
const cards = (theme) => ({ id: `c-${theme}`, kind: 'cards', theme });
const words = (theme) => ({ id: `w-${theme}`, kind: 'words', theme });
const phrase = (id, title, crit) => ({ id, kind: 'phrase', title, crit });

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
    steps: [lesson('voyelles'), lesson('si'), lesson('rythme'), lesson('irreguliers'), phrase('p-advanced', L('Phrases avancées', 'Advanced sentences'), { level: '3' }), { id: 'g-daily', kind: 'daily' }],
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
    steps: [lesson('familier'), lesson('nai'), lesson('permission'), lesson('potentiel'), lesson('muettes'), lesson('accent'), { id: 'g-pairs', kind: 'pairs' }, phrase('p-advanced', L('Phrases avancées', 'Advanced sentences'), { level: '3' }), { id: 'g-daily', kind: 'daily' }],
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

export const ROADMAP = { ko: KO, ja: JA };

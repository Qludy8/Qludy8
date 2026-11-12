// Guide du japonais (français). Mêmes types de blocs que guide.js ;
// exemples : [japonais, traduction, lecture en kana (facultative)].

export const GUIDE_JA = [
  // ================= PRONONCIATION =================
  {
    id: 'ecritures', cat: 'pron', glyph: 'あア字', title: 'Trois écritures',
    sum: 'Hiragana, katakana et kanji : qui sert à quoi.',
    blocks: [
      { p: 'Le japonais mélange **trois écritures** dans une même phrase. Les **hiragana** servent à la grammaire (particules, terminaisons) et aux mots courants. Les **katakana** servent aux mots étrangers et aux noms. Les **kanji** (caractères chinois) portent le sens des mots.' },
      { table: [['Écriture', 'Exemple', 'Usage'], ['Hiragana', 'たべます', 'grammaire, mots courants'], ['Katakana', 'コーヒー', 'mots étrangers'], ['Kanji', '食', 'sens du mot']] },
      { ex: [['私はコーヒーを飲みます。', 'Je bois du café.', 'わたしはこーひーをのみます。']] },
      { tip: 'Commence par les hiragana : avec eux, tu peux déjà tout écrire. Les petits caractères au-dessus des kanji (furigana) donnent leur lecture.' },
    ],
  },
  {
    id: 'voyelles', cat: 'pron', glyph: 'あいう', title: 'Les cinq voyelles',
    sum: 'Des sons simples et réguliers.',
    blocks: [
      { p: 'Le japonais n’a que **cinq voyelles** : a, i, u, e, o. Elles se prononcent toujours de la même façon. Le **u** est léger, avec les lèvres peu arrondies, et le **e** se prononce « é ».' },
      { p: 'Chaque kana représente **une syllabe** (sauf ん et les petits caractères), et chaque syllabe dure à peu près le même temps.' },
      { ex: [['あい', 'amour'], ['いえ', 'maison'], ['うえ', 'dessus'], ['あおい', 'bleu']] },
      { tip: 'Ne transforme pas les voyelles : « e » se dit toujours « é », jamais « eu ».' },
    ],
  },
  {
    id: 'dakuten', cat: 'pron', glyph: 'か゛', title: 'Les petites marques ゛ et ゜',
    sum: 'Comment か devient が.',
    blocks: [
      { p: 'Deux petits traits **゛ (dakuten)** rendent la consonne **sonore** : k → g, s → z, t → d, h → b. Un petit rond **゜ (handakuten)**, seulement sur la série は, donne un **p**.' },
      { table: [['Base', '゛', '゜'], ['か ka', 'が ga', '—'], ['さ sa', 'ざ za', '—'], ['た ta', 'だ da', '—'], ['は ha', 'ば ba', 'ぱ pa']] },
      { ex: [['かき', 'kaki'], ['かぎ', 'clé'], ['はん', 'moitié'], ['ぱん', 'pain (en hiragana)']] },
    ],
  },
  {
    id: 'tsu', cat: 'pron', glyph: 'っ', title: 'Le petit っ : la consonne doublée',
    sum: 'Une courte pause qui change le sens.',
    blocks: [
      { p: 'Un **petit っ** (ou ッ en katakana) indique une **pause d’une syllabe** avant la consonne suivante, qui est alors doublée en rōmaji.' },
      { ex: [['きて', 'viens', 'きて'], ['きって', 'timbre', 'きって'], ['がっこう', 'école'], ['ちょっと', 'un peu'], ['ざっし', 'magazine']] },
      { tip: 'Compte les temps : き-っ-て fait trois temps, き-て seulement deux.' },
    ],
  },
  {
    id: 'longues', cat: 'pron', glyph: 'ー', title: 'Les voyelles longues',
    sum: 'おばさん ou おばあさん : tante ou grand-mère.',
    blocks: [
      { p: 'Une voyelle peut durer **deux temps**. En hiragana, on ajoute une voyelle (ああ, いい, うう) ; **おう** et **えい** se prononcent souvent « ō » et « ē ». En katakana, on utilise le trait **ー**.' },
      { ex: [['おばさん', 'tante'], ['おばあさん', 'grand-mère'], ['とうきょう', 'Tokyo'], ['せんせい', 'professeur'], ['ラーメン', 'ramen']] },
      { tip: 'Allonger ou non une voyelle change le mot : prends le temps de tenir la voyelle longue.' },
    ],
  },
  {
    id: 'yoon', cat: 'pron', glyph: 'きゃ', title: 'ん et les sons combinés',
    sum: 'きゃ, しょ, ちゅ… et le « n » qui compte double.',
    blocks: [
      { p: 'Un kana en **i** suivi d’un **petit ゃ, ゅ ou ょ** forme une seule syllabe : き + ゃ = **kya**, し + ょ = **sho**.' },
      { p: '**ん** est un « n » nasal qui compte comme **une syllabe entière**.' },
      { ex: [['きゃく', 'client'], ['しゃしん', 'photo'], ['びょういん', 'hôpital'], ['びよういん', 'salon de coiffure'], ['ほんや', 'librairie']] },
      { tip: 'びょういん (hôpital) et びよういん (coiffeur) ne diffèrent que par la taille du よ !' },
    ],
  },
  {
    id: 'particules', cat: 'pron', glyph: 'はへを', title: 'Les particules は, へ et を',
    sum: 'Trois kana qui se lisent autrement.',
    blocks: [
      { p: 'Quand ils servent de **particules**, trois kana changent de prononciation : **は → wa**, **へ → e**, **を → o**.' },
      { ex: [['わたしは', 'moi (thème)'], ['がっこうへ', 'vers l’école'], ['パンを', 'du pain (objet)']] },
      { tip: 'Dans un mot normal, は se lit bien « ha » : はな (fleur), はし (pont).' },
    ],
  },
  {
    id: 'muettes', cat: 'pron', glyph: 'です', title: 'Les voyelles qui s’effacent',
    sum: 'です se dit souvent « dess ».',
    blocks: [
      { p: 'Les voyelles **i** et **u** deviennent presque **muettes** entre deux consonnes sourdes (k, s, t, h, p) ou en fin de phrase après elles.' },
      { ex: [['です', 'c’est'], ['します', 'je fais'], ['すき', 'aimer'], ['ひと', 'personne']] },
      { tip: 'Écoute bien la voix : すき ressemble à « ski », です à « dess ».' },
    ],
  },
  {
    id: 'accent', cat: 'pron', glyph: '♪', title: 'L’accent de hauteur',
    sum: 'Une mélodie, pas une intensité.',
    blocks: [
      { p: 'Le japonais n’a pas d’accent d’intensité comme l’anglais, mais un **accent de hauteur** : certaines syllabes sont plus **hautes**, d’autres plus **basses**. Des mots écrits pareil peuvent ainsi se distinguer.' },
      { ex: [['雨', 'pluie', 'あめ'], ['飴', 'bonbon', 'あめ'], ['橋', 'pont', 'はし'], ['箸', 'baguettes', 'はし']] },
      { tip: 'Pas besoin de tout mémoriser au début : imite la mélodie des phrases écoutées dans l’application.' },
    ],
  },

  // ================= GRAMMAIRE =================
  {
    id: 'ordre', cat: 'gram', glyph: 'SOV', title: 'L’ordre des mots',
    sum: 'Le verbe à la fin, les particules après les mots.',
    blocks: [
      { p: 'Comme en coréen, l’ordre est **sujet – objet – verbe** : le verbe termine toujours la phrase. Chaque mot est suivi d’une **particule** qui indique son rôle.' },
      { table: [['Sujet', 'Objet', 'Verbe'], ['私は', 'パンを', '食べます'], ['moi', 'du pain', 'manger']] },
      { ex: [['私はパンを食べます。', 'Je mange du pain.'], ['私は昨日家で映画を見ました。', 'Hier, j’ai regardé un film à la maison.']] },
      { tip: 'Le sujet est souvent omis quand il est évident : « パンを食べます » suffit.' },
    ],
  },
  {
    id: 'wa-ga', cat: 'gram', glyph: 'はが', title: 'Thème は et sujet が',
    sum: 'La nuance la plus célèbre du japonais.',
    blocks: [
      { p: '**は (wa)** présente le **thème** : ce dont on parle, « quant à… ». **が (ga)** marque le **sujet**, souvent une information nouvelle ou mise en avant.' },
      { ex: [['私は学生です。', 'Je suis étudiant(e).'], ['誰が来ましたか？', 'Qui est venu ?'], ['友達が来ました。', 'C’est mon ami qui est venu.'], ['天気がいいです。', 'Il fait beau.']] },
      { tip: 'Avec 好き (aimer) et quelques autres mots, ce qu’on aime prend が : パンが好きです.' },
    ],
  },
  {
    id: 'wo', cat: 'gram', glyph: 'を', title: 'Le complément d’objet を',
    sum: 'Ce sur quoi porte l’action.',
    blocks: [
      { p: '**を** (prononcé « o ») se place après le nom qui subit l’action.' },
      { ex: [['本を読みます。', 'Je lis un livre.'], ['コーヒーを飲みます。', 'Je bois du café.'], ['日本語を勉強します。', 'J’étudie le japonais.']] },
      { tip: 'Quelques verbes prennent に au lieu de を : 友達に会います (voir un ami), バスに乗ります (prendre le bus).' },
    ],
  },
  {
    id: 'ni-de', cat: 'gram', glyph: 'にで', title: 'Le lieu : に ou で',
    sum: 'Aller quelque part ou y faire quelque chose.',
    blocks: [
      { p: '**に** indique une **destination**, un **moment** précis ou l’endroit où l’on **se trouve**. **で** indique le lieu où **se déroule une action**.' },
      { ex: [['学校に行きます。', 'Je vais à l’école.'], ['三時に会います。', 'On se voit à 3 h.'], ['家にいます。', 'Je suis à la maison.'], ['学校で勉強します。', 'J’étudie à l’école.']] },
      { tip: 'Se déplacer vers un lieu ou y être = に. Agir sur place = で.' },
    ],
  },
  {
    id: 'desu', cat: 'gram', glyph: 'です', title: '« Être » : です',
    sum: 'Dire ce qu’est quelque chose, poliment.',
    blocks: [
      { p: 'Nom + **です** = « c’est… / je suis… ». Négatif : **じゃないです** (ou ではありません, plus soutenu). Passé : **でした**.' },
      { ex: [['学生です。', 'Je suis étudiant(e).'], ['これは水ですか？', 'C’est de l’eau ?'], ['学生じゃないです。', 'Je ne suis pas étudiant(e).'], ['雨でした。', 'Il pleuvait.']] },
      { tip: 'En style familier, です devient だ, ou disparaît simplement.' },
    ],
  },
  {
    id: 'masu', cat: 'gram', glyph: 'ます', title: 'La forme polie en ます',
    sum: 'Conjuguer les trois groupes de verbes.',
    blocks: [
      { p: 'Les verbes forment trois groupes. On remplace la fin du verbe par **ます** :' },
      { table: [['Groupe', 'Dictionnaire', 'Forme en ます'], ['ichidan (-る)', '食べる', '食べます'], ['godan (-u → -i)', '飲む', '飲みます'], ['godan', '行く', '行きます'], ['irrégulier', 'する', 'します'], ['irrégulier', '来る', '来ます (きます)']] },
      { p: 'Pour les **godan**, le dernier son en **u** passe en **i** : む → み, く → き, う → い, る → り.' },
      { ex: [['毎日コーヒーを飲みます。', 'Je bois du café tous les jours.'], ['明日行きます。', 'J’irai demain.']] },
      { tip: 'Certains verbes en -る sont des godan : 帰る → 帰ります, 乗る → 乗ります. On les apprend au fur et à mesure.' },
    ],
  },
  {
    id: 'temps', cat: 'gram', glyph: 'ました', title: 'Passé et négation polis',
    sum: 'ました, ません, ませんでした.',
    blocks: [
      { table: [['', 'Affirmatif', 'Négatif'], ['Non passé', '食べます', '食べません'], ['Passé', '食べました', '食べませんでした']] },
      { p: 'Le japonais n’a **pas de futur** : la forme **non passée** sert au présent et au futur. Un mot comme **明日** (demain) suffit à situer l’action.' },
      { ex: [['昨日映画を見ました。', 'Hier, j’ai regardé un film.'], ['肉を食べません。', 'Je ne mange pas de viande.'], ['明日学校に行きます。', 'Demain, j’irai à l’école.']] },
    ],
  },
  {
    id: 'familier', cat: 'gram', glyph: 'る', title: 'Le style familier',
    sum: 'Entre amis : forme du dictionnaire, ない, た.',
    blocks: [
      { p: 'Entre amis proches, on n’utilise pas ます. On garde la **forme du dictionnaire** (non passé), **〜ない** (négatif) et **〜た** (passé).' },
      { table: [['Poli', 'Familier'], ['食べます', '食べる'], ['食べません', '食べない'], ['食べました', '食べた'], ['飲みました', '飲んだ'], ['行きました', '行った']] },
      { p: 'La forme en **た** des godan change selon la dernière syllabe : む → **んだ**, く → **いた**, う / つ / る → **った**, す → **した**. Exception : 行く → **行った**.' },
      { tip: 'Une question familière se fait simplement avec une intonation montante : 食べる？' },
    ],
  },
  {
    id: 'adjectifs', cat: 'gram', glyph: 'い・な', title: 'Adjectifs en い et en な',
    sum: 'Deux familles qui se conjuguent différemment.',
    blocks: [
      { p: 'Les adjectifs en **い** se conjuguent eux-mêmes : on remplace い par **くない** (négatif) ou **かった** (passé). Les adjectifs en **な** se comportent comme des noms, avec です.' },
      { table: [['', 'い : 高い', 'な : 静か'], ['Présent', '高いです', '静かです'], ['Négatif', '高くないです', '静かじゃないです'], ['Passé', '高かったです', '静かでした']] },
      { ex: [['このかばんは高いです。', 'Ce sac est cher.'], ['昨日は寒かったです。', 'Il faisait froid hier.'], ['私は幸せです。', 'Je suis heureux (heureuse).']] },
      { tip: 'Exception : いい (bien) devient よくない et よかった.' },
    ],
  },
  {
    id: 'tai', cat: 'gram', glyph: 'たい', title: 'L’envie : 〜たいです',
    sum: 'Dire ce qu’on veut faire.',
    blocks: [
      { p: 'Radical en ます + **たい** = « je veux… ». たい se conjugue comme un adjectif en い : たくない, たかった. Pour l’envie d’**une autre personne**, on dit **〜たがっています**.' },
      { ex: [['日本に行きたいです。', 'Je veux aller au Japon.'], ['何を食べたいですか？', 'Qu’est-ce que tu veux manger ?'], ['寝たくないです。', 'Je ne veux pas dormir.'], ['友達は休みたがっています。', 'Mon ami veut se reposer.']] },
    ],
  },
  {
    id: 'questions', cat: 'gram', glyph: 'か', title: 'Poser des questions',
    sum: 'か et les mots interrogatifs.',
    blocks: [
      { p: 'En style poli, on ajoute **か** à la fin de la phrase. Les mots interrogatifs se placent là où serait la réponse.' },
      { table: [['Japonais', 'Français'], ['何 (なに / なん)', 'quoi'], ['誰 (だれ)', 'qui'], ['どこ', 'où'], ['いつ', 'quand'], ['どうして', 'pourquoi'], ['いくら', 'combien (prix)']] },
      { ex: [['どこに行きますか？', 'Où vas-tu ?'], ['これは何ですか？', 'Qu’est-ce que c’est ?'], ['いくらですか？', 'Combien ça coûte ?']] },
    ],
  },
  {
    id: 'nombres', cat: 'gram', glyph: '一つ', title: 'Nombres et compteurs',
    sum: 'いち, ひとつ, ひとり…',
    blocks: [
      { table: [['', '1', '2', '3', '4', '5', '10'], ['Nombres', 'いち', 'に', 'さん', 'よん', 'ご', 'じゅう'], ['Objets (〜つ)', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'とお']] },
      { p: 'Pour compter, on ajoute un **compteur** qui dépend de la chose comptée : 〜人 (personnes), 〜枚 (objets plats), 〜時 (heures)… Les objets du quotidien utilisent souvent **〜つ**.' },
      { ex: [['りんごを二つください。', 'Deux pommes, s’il vous plaît.'], ['三時です。', 'Il est 3 h.'], ['一人です。', 'Je suis seul(e). / Une personne.']] },
      { tip: 'Attention : une personne se dit ひとり, deux personnes ふたり, puis さんにん, よにん…' },
    ],
  },
];

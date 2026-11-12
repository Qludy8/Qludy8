// Guide du japonais, suite : prononciation et grammaire intermédiaires (leçons bilingues, voir guide.util.js).
// Exemples : [japonais, traduction, lecture en kana quand la phrase contient des kanji].
import { B } from './guide.util.js';

export const GUIDE_JA_PLUS = [
  // ================= PRONONCIATION =================
  {
    id: 'n', cat: 'pron', glyph: 'ん', title: B('Les prononciations de ん', 'The pronunciations of ん'),
    sum: B('« n », « m », « ng » ou voyelle nasale selon ce qui suit.', '“n”, “m”, “ng” or a nasal vowel depending on what follows.'),
    blocks: [
      { p: B('**ん** compte pour un temps (une more) à lui seul, et son articulation s’adapte au son qui le suit.', '**ん** counts as one beat (mora) on its own, and its articulation adapts to the sound that follows.') },
      { table: [[B('Devant…', 'Before…'), B('Son', 'Sound'), B('Exemple', 'Example')], ['p, b, m', 'm', 'さんぽ → sampo'], ['t, d, n, r, z', 'n', 'みんな → minna'], ['k, g', 'ng', 'ぎんこう → gingkō'], [B('voyelle, y, w, s, h', 'vowel, y, w, s, h'), B('voyelle nasale', 'nasal vowel'), 'れんあい → reñai'], [B('fin de mot', 'end of word'), B('« n » arrière', 'back “n”'), 'ほん → hoɴ']] },
      { ex: [['さんぽ', B('promenade', 'walk')], ['しんぶん', B('journal', 'newspaper')], ['ぎんこう', B('banque', 'bank')], ['でんわ', B('téléphone', 'telephone')], ['ほんを よむ', B('lire un livre', 'read a book')]] },
      { p: B('Attention à ne pas fondre ん avec la voyelle suivante : **きんえん** (ki-n-e-n, « interdiction de fumer ») n’est pas **きねん** (ki-ne-n, « commémoration »).', 'Be careful not to merge ん with the following vowel: **きんえん** (ki-n-e-n, “no smoking”) is not **きねん** (ki-ne-n, “commemoration”).') },
      { tip: B('En rōmaji, on écrit n’ pour lever le doute : kin’en et kinen. Chaque kana, y compris ん, っ et la voyelle allongée, dure le même temps.', 'In rōmaji an apostrophe removes the doubt: kin’en vs kinen. Every kana, including ん, っ and a lengthened vowel, lasts the same time.') },
    ],
  },
  {
    id: 'rendaku', cat: 'pron', glyph: '゛', title: B('Le rendaku : quand le son se voise', 'Rendaku: when a sound becomes voiced'),
    sum: B('Pourquoi 手 + 紙 se lit « tegami » et non « tekami ».', 'Why 手 + 紙 is read “tegami”, not “tekami”.'),
    blocks: [
      { p: B('Dans un **mot composé**, la première consonne du second élément devient souvent **voisée** : k → g, s → z, t → d, h → b.', 'In a **compound word**, the first consonant of the second part often becomes **voiced**: k → g, s → z, t → d, h → b.') },
      { ex: [['てがみ', B('lettre (手 + 紙)', 'letter (手 + 紙)')], ['ひとびと', B('les gens (人 + 人)', 'people (人 + 人)')], ['はなび', B('feu d’artifice (花 + 火)', 'fireworks (花 + 火)')], ['にほんご', B('langue japonaise', 'Japanese language')], ['やまざくら', B('cerisier sauvage (山 + 桜)', 'mountain cherry (山 + 桜)')], ['いけばな', B('art floral (生け + 花)', 'flower arranging (生け + 花)')]] },
      { p: B('Le rendaku ne se produit **pas** si le second élément contient déjà une consonne voisée (loi de Lyman) : **はるかぜ** (vent de printemps) garde son k à cause du z. Il est rare aussi dans les mots d’origine chinoise ou étrangère.', 'Rendaku does **not** occur if the second part already contains a voiced consonant (Lyman’s law): **はるかぜ** (spring wind) keeps its k because of the z. It is also rare in words of Chinese or foreign origin.') },
      { tip: B('Il n’existe pas de règle absolue : on l’apprend mot par mot. Mais savoir qu’il existe explique pourquoi un kanji connu « change de son » dans un composé.', 'There is no absolute rule: you learn it word by word. But knowing it exists explains why a familiar kanji “changes sound” inside a compound.') },
    ],
  },
  {
    id: 'sons-difficiles', cat: 'pron', glyph: 'らふ', title: B('Les sons qui piègent : ら, ふ, つ, し, ち', 'Tricky sounds: ら, ふ, つ, し, ち'),
    sum: B('Ce qui ne se prononce pas comme en français.', 'What is not pronounced as the romanisation suggests.'),
    blocks: [
      { table: [[B('Kana', 'Kana'), B('Rōmaji', 'Rōmaji'), B('Comment faire', 'How to say it')], ['ら り る れ ろ', 'r', B('un seul battement de langue, entre « r » roulé bref et « l »', 'a single tap of the tongue, between a quick “d” and “l”')], ['ふ', 'fu', B('souffle entre les deux lèvres, sans les dents', 'breath between both lips, no teeth')], ['つ', 'tsu', B('« ts » d’un seul coup, comme dans « tsar »', '“ts” in one go, as in “cats”')], ['し', 'shi', B('« chi » français, lèvres non arrondies', '“shee”, lips unrounded')], ['ち', 'chi', B('« tchi »', '“chee”')], ['じ / ぢ', 'ji', B('« dji »', '“jee”')], ['ひ', 'hi', B('souffle chuintant, proche du « ch » allemand de « ich »', 'hissing breath, like German “ich”')], ['う', 'u', B('« ou » sans arrondir les lèvres', '“oo” without rounding the lips')], ['が (ぎぐげご)', 'g / ng', B('souvent nasal au milieu d’un mot', 'often nasal in the middle of a word')]] },
      { ex: [['ありがとう', B('merci', 'thank you')], ['ふゆ', B('hiver', 'winter')], ['つくえ', B('bureau', 'desk')], ['ひと', B('personne', 'person')], ['りんご', B('pomme', 'apple')], ['れんらく', B('contact', 'contact')]] },
      { tip: B('Pour ら, pose le bout de la langue juste derrière les dents du haut et relâche-le aussitôt, une seule fois.', 'For ら, touch the tip of the tongue just behind the upper teeth and release it at once, a single time.') },
    ],
  },

  // ================= GRAMMAIRE (suite) =================
  {
    id: 'te', cat: 'gram', glyph: 'て', title: B('La forme en て', 'The て form'),
    sum: B('La forme la plus utile : la construire et l’utiliser.', 'The most useful form: building it and using it.'),
    blocks: [
      { p: B('La forme en **て** relie les verbes et sert de base à des dizaines de constructions. Pour les **ichidan**, on remplace る par て. Pour les **godan**, la terminaison change selon le dernier kana :', 'The **て** form links verbs and underlies dozens of constructions. For **ichidan** verbs, replace る with て. For **godan** verbs, the ending changes with the last kana:') },
      { table: [[B('Terminaison', 'Ending'), B('Forme en て', 'て form'), B('Exemple', 'Example')], ['う・つ・る', 'って', 'かう → かって'], ['む・ぶ・ぬ', 'んで', 'のむ → のんで'], ['く', 'いて', 'かく → かいて'], ['ぐ', 'いで', 'およぐ → およいで'], ['す', 'して', 'はなす → はなして'], ['ichidan', 'て', 'たべる → たべて'], [B('irréguliers', 'irregular'), '', 'する → して、くる → きて'], [B('exception', 'exception'), '', 'いく → いって']] },
      { p: B('Usages de base : **enchaîner** des actions, **demander** avec ください, et former le **négatif** en ないで.', 'Basic uses: **chaining** actions, **requesting** with ください, and the **negative** in ないで.') },
      { ex: [['朝起きて、コーヒーを飲みます。', B('Je me lève et je bois un café.', 'I get up and drink coffee.'), 'あさおきて、こーひーをのみます。'], ['ちょっと待ってください。', B('Attendez un instant, s’il vous plaît.', 'Please wait a moment.'), 'ちょっとまってください。'], ['ここに名前を書いてください。', B('Écrivez votre nom ici, s’il vous plaît.', 'Please write your name here.'), 'ここになまえをかいてください。'], ['写真を撮らないでください。', B('Ne prenez pas de photos, s’il vous plaît.', 'Please don’t take photos.'), 'しゃしんをとらないでください。']] },
      { p: B('La forme en **た** (passé familier) se construit exactement de la même façon : って → った, んで → んだ, いて → いた.', 'The **た** form (plain past) is built in exactly the same way: って → った, んで → んだ, いて → いた.') },
      { tip: B('Les adjectifs ont aussi leur forme en て : い → **くて** (やすくて), な → **で** (しずかで). Elle permet de dire « bon marché et délicieux » : やすくておいしい.', 'Adjectives have a て form too: い → **くて** (やすくて), な → **で** (しずかで). It lets you say “cheap and tasty”: やすくておいしい.') },
    ],
  },
  {
    id: 'teiru', cat: 'gram', glyph: 'ている', title: B('En cours, état, habitude : ている', 'In progress, state, habit: ている'),
    sum: B('Trois sens pour une seule forme.', 'Three meanings for a single form.'),
    blocks: [
      { table: [[B('Sens', 'Meaning'), B('Type de verbe', 'Verb type'), B('Exemple', 'Example')], [B('action en cours', 'action in progress'), B('verbes qui durent', 'verbs with duration'), 'たべています'], [B('état résultant', 'resulting state'), B('verbes de changement', 'change-of-state verbs'), 'けっこんしています'], [B('habitude, métier', 'habit, occupation'), B('tous', 'any'), 'はたらいています']] },
      { ex: [['今、本を読んでいます。', B('Je suis en train de lire.', 'I’m reading right now.'), 'いま、ほんをよんでいます。'], ['結婚しています。', B('Je suis marié(e).', 'I’m married.'), 'けっこんしています。'], ['東京に住んでいます。', B('J’habite à Tokyo.', 'I live in Tokyo.'), 'とうきょうにすんでいます。'], ['窓が開いています。', B('La fenêtre est ouverte.', 'The window is open.'), 'まどがあいています。'], ['毎朝走っています。', B('Je cours tous les matins.', 'I run every morning.'), 'まいあさはしっています。']] },
      { p: B('Avec **知る**, **持つ**, **住む**, on utilise toujours ている pour l’état présent : 知っています (je sais). La négation de 知っています est **知りません**.', 'With **知る**, **持つ**, **住む**, ている is always used for the present state: 知っています (I know). The negative of 知っています is **知りません**.') },
      { p: B('**まだ … ていません** = « pas encore » : まだ食べていません (je n’ai pas encore mangé).', '**まだ … ていません** = “not yet”: まだ食べていません (I haven’t eaten yet).') },
      { tip: B('À l’oral, い tombe : 食べてる, 食べてます, 知ってる. Avec un verbe transitif, l’état résultant voulu se dit **てある** : 窓が開けてあります (on a ouvert la fenêtre, elle est ouverte).', 'In speech い drops: 食べてる, 食べてます, 知ってる. With a transitive verb, an intended resulting state is **てある**: 窓が開けてあります (the window has been opened and left so).') },
    ],
  },
  {
    id: 'nai', cat: 'gram', glyph: 'ない', title: B('Les formes neutres : ない et た', 'The plain forms: ない and た'),
    sum: B('Le tableau complet du style familier.', 'The full table of the plain style.'),
    blocks: [
      { p: B('Les formes **neutres** servent entre proches, mais surtout **à l’intérieur des phrases** : devant と思う, から, とき, un nom… Il faut les connaître même pour parler poliment.', 'The **plain** forms are used among friends, but above all **inside sentences**: before と思う, から, とき, a noun… You need them even to speak politely.') },
      { table: [['', B('Affirmatif', 'Affirmative'), B('Négatif', 'Negative')], [B('Verbe, non passé', 'Verb, non-past'), 'たべる / のむ', 'たべない / のまない'], [B('Verbe, passé', 'Verb, past'), 'たべた / のんだ', 'たべなかった / のまなかった'], [B('Adjectif en い', 'い adjective'), 'たかい / たかかった', 'たかくない / たかくなかった'], [B('Adjectif en な, nom', 'な adjective, noun'), 'しずかだ / しずかだった', 'しずかじゃない / じゃなかった']] },
      { p: B('**ない** : pour les **godan**, le dernier son en u passe en **a** (のむ → のまない, かく → かかない), et **う devient わ** (かう → かわない). Ichidan : る → ない. Irréguliers : する → **しない**, くる → **こない**, ある → **ない**.', '**ない**: for **godan** verbs, the final u sound becomes **a** (のむ → のまない, かく → かかない), and **う becomes わ** (かう → かわない). Ichidan: る → ない. Irregular: する → **しない**, くる → **こない**, ある → **ない**.') },
      { ex: [['今日は行かない。', B('Je n’y vais pas aujourd’hui.', 'I’m not going today.'), 'きょうはいかない。'], ['昨日は何も食べなかった。', B('Hier, je n’ai rien mangé.', 'I ate nothing yesterday.'), 'きのうはなにもたべなかった。'], ['この映画は面白くない。', B('Ce film n’est pas intéressant.', 'This film isn’t interesting.'), 'このえいがはおもしろくない。'], ['彼は学生じゃない。', B('Il n’est pas étudiant.', 'He isn’t a student.'), 'かれはがくせいじゃない。']] },
      { tip: B('**いい** (bon) se conjugue sur よい : よくない, よかった, よくなかった. C’est l’unique adjectif irrégulier.', '**いい** (good) conjugates on よい: よくない, よかった, よくなかった. It is the only irregular adjective.') },
    ],
  },
  {
    id: 'permission', cat: 'gram', glyph: 'ても', title: B('Permission, interdiction, obligation', 'Permission, prohibition, obligation'),
    sum: B('てもいい, てはいけない, なければならない, なくてもいい.', 'てもいい, てはいけない, なければならない, なくてもいい.'),
    blocks: [
      { table: [[B('Forme', 'Form'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['てもいいです', B('on peut, il est permis de', 'may, it’s OK to'), 'はいってもいいです'], ['てはいけません', B('il ne faut pas', 'must not'), 'はいってはいけません'], ['なければなりません', B('il faut', 'must, have to'), 'いかなければなりません'], ['なくてもいいです', B('ce n’est pas la peine de', 'don’t have to'), 'いかなくてもいいです'], ['ないでください', B('ne faites pas, s’il vous plaît', 'please don’t'), 'いかないでください']] },
      { ex: [['ここに座ってもいいですか。', B('Je peux m’asseoir ici ?', 'May I sit here?'), 'ここにすわってもいいですか。'], ['ここでたばこを吸ってはいけません。', B('Il est interdit de fumer ici.', 'You must not smoke here.'), 'ここでたばこをすってはいけません。'], ['明日早く起きなければなりません。', B('Je dois me lever tôt demain.', 'I have to get up early tomorrow.'), 'あしたはやくおきなければなりません。'], ['急がなくてもいいです。', B('Pas besoin de se presser.', 'There’s no need to hurry.'), 'いそがなくてもいいです。']] },
      { p: B('À l’oral, on raccourcit : **なければならない → なきゃ**, **なくてはいけない → なくちゃ**, **てはいけない → ちゃだめ**, **てもいい → ていい**.', 'In speech these are shortened: **なければならない → なきゃ**, **なくてはいけない → なくちゃ**, **てはいけない → ちゃだめ**, **てもいい → ていい**.') },
      { ex: [['もう帰らなきゃ。', B('Il faut que je rentre.', 'I’ve got to go home.'), 'もうかえらなきゃ。'], ['これ、食べていい？', B('Je peux manger ça ?', 'Can I eat this?'), 'これ、たべていい？']] },
      { tip: B('Pour refuser poliment une permission, on évite てはいけません et l’on dit plutôt **すみません、ちょっと…**', 'To refuse permission politely, avoid てはいけません and say **すみません、ちょっと…** instead.') },
    ],
  },
  {
    id: 'potentiel', cat: 'gram', glyph: 'れる', title: B('Pouvoir : la forme potentielle', 'Can: the potential form'),
    sum: B('食べられる, 飲める, できる et ことができる.', '食べられる, 飲める, できる and ことができる.'),
    blocks: [
      { table: [[B('Groupe', 'Group'), B('Règle', 'Rule'), B('Exemple', 'Example')], ['godan', 'u → eru', 'のむ → のめる、かく → かける'], ['ichidan', 'る → られる', 'たべる → たべられる'], ['する', '', 'できる'], ['くる', '', 'こられる']] },
      { p: B('Le potentiel se conjugue comme un verbe ichidan (のめます, のめない, のめた). L’objet se marque de préférence avec **が** : 日本語**が**話せます.', 'The potential conjugates like an ichidan verb (のめます, のめない, のめた). The object is preferably marked with **が**: 日本語**が**話せます.') },
      { ex: [['日本語が少し話せます。', B('Je parle un peu japonais.', 'I can speak a little Japanese.'), 'にほんごがすこしはなせます。'], ['漢字が読めません。', B('Je ne sais pas lire les kanji.', 'I can’t read kanji.'), 'かんじがよめません。'], ['明日来られますか。', B('Vous pouvez venir demain ?', 'Can you come tomorrow?'), 'あしたこられますか。'], ['ここで切符が買えます。', B('On peut acheter des billets ici.', 'You can buy tickets here.'), 'ここできっぷがかえます。']] },
      { p: B('Autre tournure, plus formelle : forme du dictionnaire + **ことができます**.', 'Another, more formal pattern: dictionary form + **ことができます**.') },
      { ex: [['ピアノを弾くことができます。', B('Je sais jouer du piano.', 'I can play the piano.'), 'ぴあのをひくことができます。']] },
      { tip: B('À l’oral, beaucoup disent 食べ**れ**る, 見**れ**る (sans ら). **見える** et **聞こえる** signifient « être visible / audible » sans effort : 山が見えます (on voit la montagne).', 'In speech many people say 食べ**れ**る, 見**れ**る (dropping ら). **見える** and **聞こえる** mean “be visible / audible” without effort: 山が見えます (the mountain is visible).') },
    ],
  },
  {
    id: 'particules-plus', cat: 'gram', glyph: 'もと', title: B('Les autres particules', 'The other particles'),
    sum: B('も, と, や, から/まで, へ, より, だけ, しか, の, ね/よ.', 'も, と, や, から/まで, へ, より, だけ, しか, の, ね/よ.'),
    blocks: [
      { table: [[B('Particule', 'Particle'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['も', B('aussi, même', 'also, even'), 'わたしも'], ['と', B('et (liste fermée) ; avec', 'and (closed list); with'), 'パンとたまご'], ['や', B('et … entre autres', 'and … among others'), 'パンやたまご'], ['から … まで', B('de … à', 'from … to'), '９じから５じまで'], ['へ', B('vers (direction)', 'towards'), 'にほんへ'], ['より', B('que (comparaison)', 'than'), 'バスより'], ['だけ', B('seulement', 'only'), 'みずだけ'], ['しか + nég.', B('ne … que', 'nothing but'), 'みずしか のまない'], ['の', B('de ; nominalise', 'of, ’s; nominaliser'), 'わたしのほん'], ['で', B('lieu d’action ; moyen', 'place of action; means'), 'バスで'], ['に', B('destination, moment, destinataire', 'destination, time, recipient'), 'ともだちに'], ['か', B('ou ; question', 'or; question'), 'コーヒーかおちゃ']] },
      { ex: [['私も行きます。', B('Moi aussi, j’y vais.', 'I’m going too.'), 'わたしもいきます。'], ['友達と映画を見ました。', B('J’ai vu un film avec un ami.', 'I watched a film with a friend.'), 'ともだちとえいがをみました。'], ['九時から五時まで働きます。', B('Je travaille de 9 h à 17 h.', 'I work from 9 to 5.'), 'くじからごじまではたらきます。'], ['千円しかありません。', B('Je n’ai que 1 000 yens.', 'I only have 1,000 yen.'), 'せんえんしかありません。'], ['電車で行きます。', B('J’y vais en train.', 'I go by train.'), 'でんしゃでいきます。']] },
      { p: B('En fin de phrase : **ね** cherche l’accord (« n’est-ce pas ? »), **よ** apporte une information nouvelle (« je te le dis »), **よね** vérifie ce qu’on croit savoir, **かな** = « je me demande ».', 'At the end of a sentence: **ね** seeks agreement (“isn’t it?”), **よ** brings new information (“I’m telling you”), **よね** checks what you believe, **かな** = “I wonder”.') },
      { ex: [['いい天気ですね。', B('Il fait beau, n’est-ce pas ?', 'Nice weather, isn’t it?'), 'いいてんきですね。'], ['おいしいですよ。', B('C’est bon, je vous assure.', 'It’s good, you know.')], ['明日は休みだよね。', B('Demain c’est férié, pas vrai ?', 'Tomorrow’s a day off, right?'), 'あしたはやすみだよね。']] },
      { tip: B('も remplace は, が et を, mais s’ajoute aux autres : 東京**にも**行きます (je vais aussi à Tokyo).', 'も replaces は, が and を, but is added to the others: 東京**にも**行きます (I’m going to Tokyo too).') },
    ],
  },
  {
    id: 'liaisons', cat: 'gram', glyph: 'から', title: B('Relier deux phrases', 'Linking two clauses'),
    sum: B('から, ので, が, けど, のに, し, て.', 'から, ので, が, けど, のに, し, て.'),
    blocks: [
      { table: [[B('Mot', 'Word'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['から', B('parce que (subjectif)', 'because (subjective)'), 'あついから'], ['ので', B('comme, étant donné que (plus doux)', 'since (softer)'), 'あついので'], ['が', B('mais (soutenu)', 'but (formal)'), 'たかいですが'], ['けど / けれども', B('mais (courant)', 'but (everyday)'), 'たかいけど'], ['のに', B('alors que, bien que', 'even though'), 'べんきょうしたのに'], ['し', B('et en plus', 'and what’s more'), 'やすいし、おいしいし'], ['て / で', B('et, puis', 'and, then'), 'たべて、ねる'], ['ながら', B('tout en', 'while'), 'ききながら'], ['たり … たりする', B('faire entre autres', 'do things like'), 'よんだり、みたり']] },
      { ex: [['雨が降っているから、行きません。', B('Il pleut, donc je n’y vais pas.', 'It’s raining, so I’m not going.'), 'あめがふっているから、いきません。'], ['頭が痛いので、早く帰ります。', B('J’ai mal à la tête, je rentre tôt.', 'I have a headache, so I’ll go home early.'), 'あたまがいたいので、はやくかえります。'], ['日本語は難しいけど、楽しいです。', B('Le japonais est difficile, mais amusant.', 'Japanese is hard but fun.'), 'にほんごはむずかしいけど、たのしいです。'], ['勉強したのに、合格しなかった。', B('J’ai pourtant étudié, et j’ai échoué.', 'Even though I studied, I didn’t pass.'), 'べんきょうしたのに、ごうかくしなかった。'], ['休みの日は本を読んだり、映画を見たりします。', B('Les jours de repos, je lis, je regarde des films…', 'On days off I read, watch films and so on.'), 'やすみのひはほんをよんだり、えいがをみたりします。']] },
      { p: B('**ので** et **のに** se construisent sur la forme neutre ; avec un nom ou un adjectif en な, on ajoute **な** : 学生**な**ので, 静か**な**のに.', '**ので** and **のに** attach to the plain form; with a noun or a な adjective, add **な**: 学生**な**ので, 静か**な**のに.') },
      { tip: B('Finir une phrase par **が…** ou **けど…** sans rien ajouter est une façon très japonaise d’adoucir une demande : すみません、ちょっと聞きたいんですが…', 'Ending a sentence with **が…** or **けど…** and nothing more is a very Japanese way to soften a request: すみません、ちょっと聞きたいんですが…') },
    ],
  },
  {
    id: 'comparaison-ja', cat: 'gram', glyph: 'より', title: B('Comparer', 'Comparing'),
    sum: B('より, のほうが, いちばん, と同じ, ほど.', 'より, のほうが, いちばん, と同じ, ほど.'),
    blocks: [
      { p: B('**A は B より …** = « A est plus … que B ». Pour répondre à une question de choix, on dit **A のほうが …** (« c’est A qui est plus… »).', '**A は B より …** = “A is more … than B”. To answer a choice question, say **A のほうが …** (“A is the more … one”).') },
      { ex: [['東京は大阪より大きいです。', B('Tokyo est plus grande qu’Osaka.', 'Tokyo is bigger than Osaka.'), 'とうきょうはおおさかよりおおきいです。'], ['犬と猫とどちらが好きですか。', B('Tu préfères les chiens ou les chats ?', 'Which do you like better, dogs or cats?'), 'いぬとねことどちらがすきですか。'], ['猫のほうが好きです。', B('Je préfère les chats.', 'I like cats better.'), 'ねこのほうがすきです。']] },
      { p: B('Superlatif : **いちばん** (« le plus »), avec **の中で** (« parmi ») ou **で** pour un lieu. Égalité : **と同じ** (« pareil que »), **と同じくらい** (« à peu près autant »). Infériorité : **A は B ほど … ない** (« A n’est pas aussi … que B »).', 'Superlative: **いちばん** (“the most”), with **の中で** (“among”) or **で** for a place. Equality: **と同じ** (“the same as”), **と同じくらい** (“about as much as”). Inferiority: **A は B ほど … ない** (“A is not as … as B”).') },
      { ex: [['果物の中でりんごが一番好きです。', B('De tous les fruits, c’est la pomme que je préfère.', 'Of all fruits, I like apples best.'), 'くだもののなかでりんごがいちばんすきです。'], ['クラスで一番背が高いです。', B('C’est le plus grand de la classe.', 'He is the tallest in the class.'), 'くらすでいちばんせがたかいです。'], ['今日は昨日ほど寒くないです。', B('Il fait moins froid qu’hier.', 'It’s not as cold as yesterday.'), 'きょうはきのうほどさむくないです。']] },
      { tip: B('Pour comparer deux actions, on nominalise : 歩く**より**バスで行った**ほうが**速い (c’est plus rapide en bus qu’à pied).', 'To compare two actions, nominalise them: 歩く**より**バスで行った**ほうが**速い (going by bus is quicker than walking).') },
    ],
  },
  {
    id: 'compteurs-ja', cat: 'gram', glyph: '本枚', title: B('Les compteurs', 'Counters'),
    sum: B('つ, 人, 本, 枚, 個, 匹, 冊, 台, 回, 杯…', 'つ, 人, 本, 枚, 個, 匹, 冊, 台, 回, 杯…'),
    blocks: [
      { p: B('Pour compter, on ajoute un **compteur** au nombre, selon la forme ou la nature de l’objet. Le groupe se place après la particule : りんごを **みっつ** ください.', 'To count, add a **counter** to the number, depending on the shape or nature of the object. The group goes after the particle: りんごを **みっつ** ください.') },
      { table: [[B('Compteur', 'Counter'), B('Pour…', 'For…'), '1 · 2 · 3'], ['〜つ', B('objets en général (jusqu’à 10)', 'things in general (up to 10)'), 'ひとつ・ふたつ・みっつ'], ['人 (にん)', B('personnes', 'people'), 'ひとり・ふたり・さんにん'], ['本 (ほん)', B('objets longs', 'long objects'), 'いっぽん・にほん・さんぼん'], ['枚 (まい)', B('objets plats', 'flat objects'), 'いちまい・にまい・さんまい'], ['個 (こ)', B('petits objets', 'small objects'), 'いっこ・にこ・さんこ'], ['匹 (ひき)', B('petits animaux', 'small animals'), 'いっぴき・にひき・さんびき'], ['冊 (さつ)', B('livres', 'books'), 'いっさつ・にさつ・さんさつ'], ['台 (だい)', B('machines, véhicules', 'machines, vehicles'), 'いちだい・にだい・さんだい'], ['杯 (はい)', B('verres, bols', 'glasses, bowls'), 'いっぱい・にはい・さんばい'], ['回 (かい)', B('fois', 'times'), 'いっかい・にかい・さんかい'], ['歳 (さい)', B('âge', 'age'), 'いっさい・にさい・さんさい'], ['階 (かい)', B('étages', 'floors'), 'いっかい・にかい・さんがい']] },
      { p: B('Les sons changent surtout avec **1, 6, 8, 10** (いっ, ろっ, はっ, じゅっ) et **3** (ぼん, びき, ばい, がい). La question se pose avec **何** : なんにん, なんぼん, なんまい, et **いくつ** pour 〜つ.', 'Sounds change mostly with **1, 6, 8, 10** (いっ, ろっ, はっ, じゅっ) and **3** (ぼん, びき, ばい, がい). Ask with **何**: なんにん, なんぼん, なんまい, and **いくつ** for 〜つ.') },
      { ex: [['コーヒーを二つください。', B('Deux cafés, s’il vous plaît.', 'Two coffees, please.'), 'こーひーをふたつください。'], ['何人ですか。', B('Vous êtes combien ?', 'How many people?'), 'なんにんですか。'], ['ビールを三本飲みました。', B('J’ai bu trois bières.', 'I drank three beers.'), 'びーるをさんぼんのみました。'], ['週に二回、ジムに行きます。', B('Je vais à la salle deux fois par semaine.', 'I go to the gym twice a week.'), 'しゅうににかい、じむにいきます。']] },
      { tip: B('L’âge de 20 ans se dit **はたち**. Dans le doute, 〜つ fonctionne pour presque tous les objets jusqu’à dix.', 'The age of 20 is **はたち**. When in doubt, 〜つ works for almost any object up to ten.') },
    ],
  },
  {
    id: 'dates-ja', cat: 'gram', glyph: '曜日', title: B('La date, l’heure et la durée', 'Dates, time and duration'),
    sum: B('Jours, mois, heures et leurs lectures irrégulières.', 'Days, months, clock time and their irregular readings.'),
    blocks: [
      { table: [[B('Jour', 'Day'), B('Japonais', 'Japanese')], [B('lundi', 'Monday'), 'げつようび'], [B('mardi', 'Tuesday'), 'かようび'], [B('mercredi', 'Wednesday'), 'すいようび'], [B('jeudi', 'Thursday'), 'もくようび'], [B('vendredi', 'Friday'), 'きんようび'], [B('samedi', 'Saturday'), 'どようび'], [B('dimanche', 'Sunday'), 'にちようび']] },
      { p: B('Les mois sont **nombre + 月 (がつ)** : いちがつ, にがつ… Attention à **しがつ** (avril), **しちがつ** (juillet), **くがつ** (septembre). Les dix premiers jours du mois ont une lecture propre :', 'Months are **number + 月 (がつ)**: いちがつ, にがつ… Watch out for **しがつ** (April), **しちがつ** (July), **くがつ** (September). The first ten days of the month have their own readings:') },
      { table: [['1', '2', '3', '4', '5'], ['ついたち', 'ふつか', 'みっか', 'よっか', 'いつか'], ['6', '7', '8', '9', '10'], ['むいか', 'なのか', 'ようか', 'ここのか', 'とおか']] },
      { p: B('Ensuite : nombre + **にち**, sauf **じゅうよっか** (14), **はつか** (20), **にじゅうよっか** (24). Heures : **よじ** (4 h), **しちじ** (7 h), **くじ** (9 h). Minutes : ふん ou **ぷん** (いっぷん, さんぷん, ろっぷん, じゅっぷん) ; **はん** = et demie.', 'After that: number + **にち**, except **じゅうよっか** (14th), **はつか** (20th), **にじゅうよっか** (24th). Hours: **よじ** (4), **しちじ** (7), **くじ** (9). Minutes: ふん or **ぷん** (いっぷん, さんぷん, ろっぷん, じゅっぷん); **はん** = half past.') },
      { ex: [['今日は何曜日ですか。', B('Quel jour sommes-nous ?', 'What day is it today?'), 'きょうはなんようびですか。'], ['誕生日は四月二十日です。', B('Mon anniversaire est le 20 avril.', 'My birthday is 20 April.'), 'たんじょうびはしがつはつかです。'], ['午後三時半に会いましょう。', B('Voyons-nous à 15 h 30.', 'Let’s meet at 3:30 pm.'), 'ごごさんじはんにあいましょう。'], ['二時間勉強しました。', B('J’ai étudié deux heures.', 'I studied for two hours.'), 'にじかんべんきょうしました。'], ['どのくらいかかりますか。', B('Ça prend combien de temps ?', 'How long does it take?')]] },
      { tip: B('Durées : 〜時間 (heures), 〜分 (minutes), 〜日間 (jours), 〜週間 (semaines), 〜か月 (mois), 〜年 (ans). Repères : きのう, きょう, あした, あさって ; せんしゅう, こんしゅう, らいしゅう ; きょねん, ことし, らいねん.', 'Durations: 〜時間 (hours), 〜分 (minutes), 〜日間 (days), 〜週間 (weeks), 〜か月 (months), 〜年 (years). Anchors: きのう, きょう, あした, あさって; せんしゅう, こんしゅう, らいしゅう; きょねん, ことし, らいねん.') },
    ],
  },
  {
    id: 'devenir', cat: 'gram', glyph: 'なる', title: B('Devenir et rendre : なる et する', 'Becoming and making: なる and する'),
    sum: B('くなる, になる, くする, にする, ようになる.', 'くなる, になる, くする, にする, ようになる.'),
    blocks: [
      { table: [['', B('Devenir (なる)', 'Become (なる)'), B('Rendre (する)', 'Make (する)')], [B('Adjectif en い', 'い adjective'), 'たかくなる', 'たかくする'], [B('Adjectif en な', 'な adjective'), 'しずかになる', 'しずかにする'], [B('Nom', 'Noun'), 'せんせいになる', 'はんぶんにする']] },
      { ex: [['寒くなりました。', B('Il s’est mis à faire froid.', 'It has turned cold.'), 'さむくなりました。'], ['日本語が上手になりました。', B('Je suis devenu(e) bon(ne) en japonais.', 'My Japanese has got better.'), 'にほんごがじょうずになりました。'], ['医者になりたいです。', B('Je veux devenir médecin.', 'I want to become a doctor.'), 'いしゃになりたいです。'], ['部屋をきれいにしました。', B('J’ai rangé la chambre.', 'I tidied the room.'), 'へやをきれいにしました。'], ['音を小さくしてください。', B('Baissez le son, s’il vous plaît.', 'Please turn the volume down.'), 'おとをちいさくしてください。']] },
      { p: B('**〜にする** signifie aussi « choisir » : コーヒーにします (je prendrai un café). **ようになる** marque un changement de capacité ou d’habitude ; **ことにする** = « décider de », **ことになる** = « il a été décidé que ».', '**〜にする** also means “to choose”: コーヒーにします (I’ll have coffee). **ようになる** marks a change in ability or habit; **ことにする** = “decide to”, **ことになる** = “it has been decided that”.') },
      { ex: [['漢字が読めるようになりました。', B('J’arrive maintenant à lire les kanji.', 'I’ve become able to read kanji.'), 'かんじがよめるようになりました。'], ['毎日運動することにしました。', B('J’ai décidé de faire du sport tous les jours.', 'I’ve decided to exercise every day.'), 'まいにちうんどうすることにしました。'], ['来月、大阪に行くことになりました。', B('Il a été décidé que j’irai à Osaka le mois prochain.', 'It’s been arranged that I’ll go to Osaka next month.'), 'らいげつ、おおさかにいくことになりました。']] },
      { tip: B('Les adjectifs deviennent des adverbes de la même façon : はやい → **はやく** (vite), しずか → **しずかに** (calmement).', 'Adjectives become adverbs the same way: はやい → **はやく** (quickly), しずか → **しずかに** (quietly).') },
    ],
  },
];

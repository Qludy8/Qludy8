// Guide : règles de prononciation et de grammaire.
// Blocs d'une leçon :
//   { p: 'texte' }                       paragraphe (**gras** autorisé)
//   { ex: [[coréen, français, prononciation?], …] }  exemples à écouter ; la prononciation est en hangeul entre crochets
//   { tip: 'texte' }                     encadré « À retenir »
//   { table: [[en-tête…], [ligne…], …] } petit tableau

export const GUIDE_CATS = {
  pron: 'Prononciation',
  gram: 'Grammaire',
};

export const GUIDE = [
  // ================= PRONONCIATION =================
  {
    id: 'syllabe', cat: 'pron', glyph: '한', title: 'Lire une syllabe',
    sum: 'Comment les lettres s’assemblent en blocs.',
    blocks: [
      { p: 'Le coréen ne s’écrit pas lettre par lettre en ligne : les lettres sont regroupées en **blocs**, un bloc = une syllabe. Chaque bloc contient toujours **une consonne + une voyelle**, et parfois **une consonne finale** (le *batchim*).' },
      { table: [['Bloc', 'Lettres', 'Son'], ['가', 'ㄱ + ㅏ', 'ga'], ['한', 'ㅎ + ㅏ + ㄴ', 'han'], ['국', 'ㄱ + ㅜ + ㄱ', 'guk'], ['읽', 'ㅇ + ㅣ + ㄺ', 'ik']] },
      { p: 'On lit de **gauche à droite**, puis de **haut en bas**.' },
      { tip: 'Voyelle verticale (ㅏ ㅓ ㅣ…) → la consonne se place **à gauche** : 가. Voyelle horizontale (ㅗ ㅜ ㅡ…) → la consonne se place **au-dessus** : 고.' },
      { ex: [['가', 'syllabe « ga »'], ['고', 'syllabe « go »'], ['한국', 'la Corée'], ['사람', 'personne']] },
    ],
  },
  {
    id: 'ieung', cat: 'pron', glyph: 'ㅇ', title: 'La lettre ㅇ : muette ou « ng »',
    sum: 'Une même lettre, deux rôles selon sa place.',
    blocks: [
      { p: 'Une syllabe doit commencer par une consonne. Quand elle commence par un son de voyelle, on écrit **ㅇ, qui est alors muet**.' },
      { p: 'En **position finale**, ㅇ se prononce **« ng »**, comme dans le mot anglais *sing*.' },
      { ex: [['아이', 'enfant'], ['우유', 'lait'], ['강', 'rivière'], ['영어', 'anglais'], ['사랑', 'amour']] },
      { tip: 'ㅇ au début = rien. ㅇ à la fin = « ng ».' },
    ],
  },
  {
    id: 'series', cat: 'pron', glyph: 'ㄱㅋㄲ', title: 'Douces, aspirées et tendues',
    sum: 'La différence entre 가, 카 et 까.',
    blocks: [
      { p: 'Plusieurs consonnes existent en **trois versions**. Le français ne fait pas cette distinction, mais elle change le sens des mots.' },
      { table: [['Douce', 'Aspirée', 'Tendue'], ['ㄱ', 'ㅋ', 'ㄲ'], ['ㄷ', 'ㅌ', 'ㄸ'], ['ㅂ', 'ㅍ', 'ㅃ'], ['ㅈ', 'ㅊ', 'ㅉ'], ['ㅅ', '—', 'ㅆ']] },
      { p: '**Douce** : un léger souffle, son détendu. **Aspirée** : un souffle fort, comme si on soufflait une bougie. **Tendue** : aucun souffle, la gorge et la langue sont crispées ; c’est proche du « p », « t », « k » français.' },
      { ex: [['가', 'douce'], ['카', 'aspirée'], ['까', 'tendue'], ['달', 'lune'], ['탈', 'masque'], ['딸', 'fille (enfant)'], ['불', 'feu'], ['풀', 'herbe'], ['뿔', 'corne']] },
      { tip: 'Mets ta main devant ta bouche : beaucoup d’air pour l’aspirée, presque pas pour la douce, aucun pour la tendue.' },
    ],
  },
  {
    id: 'sonores', cat: 'pron', glyph: 'ㄱ', title: 'ㄱ ㄷ ㅂ ㅈ entre deux voyelles',
    sum: 'Pourquoi ㄱ se lit tantôt « k », tantôt « g ».',
    blocks: [
      { p: 'Les consonnes douces ㄱ ㄷ ㅂ ㅈ sont presque **sourdes au début d’un mot** (proches de « k, t, p, tch ») mais deviennent **sonores entre deux voyelles** (« g, d, b, dj »).' },
      { ex: [['고기', 'viande'], ['바다', 'mer'], ['아버지', 'père'], ['부부', 'couple marié']] },
      { tip: 'Dans 고기, le premier ㄱ sonne presque « k » et le second clairement « g ». C’est automatique : il suffit d’écouter et d’imiter.' },
    ],
  },
  {
    id: 'finales', cat: 'pron', glyph: '받침', title: 'Les consonnes finales (batchim)',
    sum: 'Seulement 7 sons possibles en fin de syllabe.',
    blocks: [
      { p: 'En fin de syllabe, de nombreuses consonnes s’écrivent, mais **seuls 7 sons existent**. La consonne n’est pas « relâchée » : la bouche se ferme sans souffle final.' },
      { table: [['Son', 'Lettres finales'], ['k', 'ㄱ ㅋ ㄲ'], ['n', 'ㄴ'], ['t', 'ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ'], ['l', 'ㄹ'], ['m', 'ㅁ'], ['p', 'ㅂ ㅍ'], ['ng', 'ㅇ']] },
      { ex: [['옷', 'vêtement', '옫'], ['낮', 'journée', '낟'], ['부엌', 'cuisine', '부억'], ['앞', 'devant', '압'], ['꽃', 'fleur', '꼳']] },
      { tip: 'ㅅ, ㅈ, ㅊ, ㅌ, ㅎ en finale sonnent tous comme un « t » retenu.' },
    ],
  },
  {
    id: 'liaison', cat: 'pron', glyph: '연음', title: 'La liaison',
    sum: 'Quand la consonne finale glisse vers la syllabe suivante.',
    blocks: [
      { p: 'Si une syllabe se termine par une consonne et que la suivante commence par **ㅇ muet**, la consonne finale **se déplace** et se prononce au début de la syllabe suivante, comme une liaison en français.' },
      { ex: [['한국어', 'coréen (langue)', '한구거'], ['음악', 'musique', '으막'], ['옷을', 'le vêtement (objet)', '오슬'], ['맛있어요', 'c’est délicieux', '마시써요'], ['읽어요', 'je lis', '일거요']] },
      { p: 'Avec une double consonne finale (ㄺ, ㄳ…), seule **la seconde** glisse : 읽어요 → [일거요].' },
      { tip: 'Le ㅇ final (« ng ») ne glisse jamais : 영어 se lit [영어].' },
    ],
  },
  {
    id: 'hieut', cat: 'pron', glyph: 'ㅎ', title: 'Les effets de ㅎ',
    sum: 'ㅎ renforce ou disparaît.',
    blocks: [
      { p: '**ㅎ + ㄱ ㄷ ㅈ** (ou l’inverse) → les deux fusionnent en consonne **aspirée** ㅋ ㅌ ㅊ.' },
      { ex: [['좋다', 'être bien', '조타'], ['축하해요', 'félicitations', '추카해요'], ['입학', 'entrée à l’école', '이팍'], ['놓고', 'en posant', '노코']] },
      { p: '**ㅎ final devant une voyelle** → il **disparaît**.' },
      { ex: [['좋아요', 'c’est bien', '조아요'], ['많이', 'beaucoup', '마니'], ['괜찮아요', 'ça va', '괜차나요']] },
      { tip: 'Ne prononce jamais le ㅎ final de 좋아요 : on dit « jo-a-yo ».' },
    ],
  },
  {
    id: 'nasal', cat: 'pron', glyph: '니다', title: 'La nasalisation',
    sum: 'Pourquoi 합니다 se prononce « ham-ni-da ».',
    blocks: [
      { p: 'Un son final **k, t, p** devant **ㄴ ou ㅁ** devient **nasal** : k → ng, t → n, p → m. C’est l’une des règles les plus fréquentes, car elle touche toutes les terminaisons en -ㅂ니다.' },
      { table: [['Avant ㄴ / ㅁ', 'devient'], ['k (ㄱ…)', 'ng (ㅇ)'], ['t (ㄷ ㅅ ㅆ…)', 'n (ㄴ)'], ['p (ㅂ ㅍ)', 'm (ㅁ)']] },
      { ex: [['합니다', 'je fais (formel)', '함니다'], ['감사합니다', 'merci', '감사함니다'], ['작년', 'l’année dernière', '장년'], ['국물', 'bouillon', '궁물'], ['있는', 'qui est / qui a', '인는']] },
      { tip: 'Tous les verbes formels en -습니다 se lisent « -seum-ni-da » : 먹습니다 → [먹씀니다].' },
    ],
  },
  {
    id: 'rieul', cat: 'pron', glyph: 'ㄹ', title: 'La lettre ㄹ : r ou l',
    sum: 'Un son entre le « r » et le « l ».',
    blocks: [
      { p: 'Entre deux voyelles, ㄹ est un **« r » battu**, très léger (la langue touche une fois le palais). En fin de syllabe, c’est un **« l »**.' },
      { ex: [['사랑', 'amour'], ['나라', 'pays'], ['서울', 'Séoul'], ['말', 'parole / cheval']] },
      { p: '**ㄴ + ㄹ** ou **ㄹ + ㄴ** → les deux deviennent **« ll »**. Après les autres consonnes, ㄹ se lit **ㄴ**.' },
      { ex: [['신라', 'royaume de Silla', '실라'], ['설날', 'Nouvel An lunaire', '설랄'], ['연락', 'contact', '열락'], ['심리', 'psychologie', '심니'], ['정류장', 'arrêt de bus', '정뉴장']] },
    ],
  },
  {
    id: 'tension', cat: 'pron', glyph: 'ㄲ', title: 'Les consonnes qui se durcissent',
    sum: '학교 se prononce « hak-kkyo ».',
    blocks: [
      { p: 'Après un son final **k, t ou p**, les consonnes douces ㄱ ㄷ ㅂ ㅅ ㅈ deviennent **tendues** (ㄲ ㄸ ㅃ ㅆ ㅉ). Cela ne se voit pas à l’écrit ni dans la romanisation, seulement à l’oral.' },
      { ex: [['학교', 'école', '학꾜'], ['식당', 'restaurant', '식땅'], ['학생', 'élève', '학쌩'], ['국밥', 'soupe au riz', '국빱'], ['잡지', 'magazine', '잡찌']] },
      { tip: 'Ça vient naturellement : après un « k » ou un « p » retenu, la consonne suivante sort plus sèchement.' },
    ],
  },
  {
    id: 'palatal', cat: 'pron', glyph: '같이', title: 'ㄷ / ㅌ devant 이',
    sum: '같이 se prononce « ga-tchi ».',
    blocks: [
      { p: 'Une finale **ㄷ** ou **ㅌ** suivie de **이** devient **ㅈ** ou **ㅊ**.' },
      { ex: [['같이', 'ensemble', '가치'], ['굳이', 'à tout prix', '구지'], ['해돋이', 'lever du soleil', '해도지']] },
    ],
  },
  {
    id: 'voyelles', cat: 'pron', glyph: 'ㅐㅔ', title: 'Les voyelles qui se ressemblent',
    sum: 'ㅐ et ㅔ, et les trois façons de lire ㅢ.',
    blocks: [
      { p: 'Dans le coréen d’aujourd’hui, **ㅐ et ㅔ** se prononcent presque pareil (un « è » / « é »). Même chose pour **ㅙ, ㅚ et ㅞ** (« ouè »). Le contexte permet de faire la différence.' },
      { ex: [['개', 'chien'], ['게', 'crabe'], ['왜', 'pourquoi'], ['외국', 'étranger']] },
      { p: '**ㅢ** se lit de trois façons : **« eu-i »** en début de mot, **« i »** après une consonne, et **« é »** pour la particule 의 (« de »).' },
      { ex: [['의사', 'médecin'], ['희망', 'espoir', '히망'], ['나의 친구', 'mon ami', '나에 친구']] },
    ],
  },
  {
    id: 'si', cat: 'pron', glyph: '시', title: 'ㅅ devant ㅣ : « shi »',
    sum: '시 ne se lit pas « si ».',
    blocks: [
      { p: 'Devant **ㅣ** (et ㅑ ㅕ ㅛ ㅠ), **ㅅ** se prononce **« sh »** (comme « ch » en français, mais plus doux).' },
      { ex: [['시간', 'temps, heure'], ['신발', 'chaussures'], ['시장', 'marché'], ['다시', 'encore']] },
    ],
  },
  {
    id: 'rythme', cat: 'pron', glyph: '♪', title: 'Rythme et intonation',
    sum: 'Pas d’accent tonique, des syllabes régulières.',
    blocks: [
      { p: 'Le coréen n’a **pas d’accent tonique** : chaque syllabe a à peu près la même durée et la même force, un peu comme en français.' },
      { p: 'Une **question** se reconnaît surtout à l’**intonation montante** à la fin, car la terminaison est souvent la même qu’à l’affirmative.' },
      { ex: [['밥 먹어요.', 'je mange.'], ['밥 먹어요?', 'tu manges ?']] },
      { tip: 'Écoute les phrases du générateur à vitesse lente (Réglages → vitesse de la voix) et répète-les en imitant la mélodie.' },
    ],
  },

  // ================= GRAMMAIRE =================
  {
    id: 'ordre', cat: 'gram', glyph: 'SOV', title: 'L’ordre des mots',
    sum: 'Le verbe est toujours à la fin.',
    blocks: [
      { p: 'En français, on dit **sujet – verbe – objet**. En coréen, l’ordre est **sujet – objet – verbe** : le verbe termine toujours la phrase.' },
      { table: [['Sujet', 'Objet', 'Verbe'], ['저는', '빵을', '먹어요'], ['je', 'du pain', 'mange']] },
      { p: 'Le moment et le lieu se placent généralement avant l’objet. Les **particules** indiquent le rôle de chaque mot : l’ordre est donc assez souple, sauf pour le verbe.' },
      { ex: [['저는 빵을 먹어요.', 'Je mange du pain.'], ['저는 어제 집에서 영화를 봤어요.', 'Hier, j’ai regardé un film à la maison.']] },
      { tip: 'On omet souvent le sujet quand il est évident : « 빵을 먹어요 » suffit pour dire « je mange du pain ».' },
    ],
  },
  {
    id: 'theme', cat: 'gram', glyph: '은는', title: 'Thème 은/는 et sujet 이/가',
    sum: 'Deux particules pour le sujet, deux nuances.',
    blocks: [
      { p: '**은/는** marque le **thème** : ce dont on parle, « quant à… ». **이/가** marque le **sujet grammatical**, souvent une information nouvelle ou mise en avant.' },
      { table: [['Après…', 'Thème', 'Sujet'], ['consonne', '은', '이'], ['voyelle', '는', '가']] },
      { ex: [['저는 학생이에요.', 'Je suis étudiant(e).'], ['책은 재미있어요.', 'Le livre (lui), il est intéressant.'], ['누가 왔어요?', 'Qui est venu ?'], ['친구가 왔어요.', 'C’est mon ami qui est venu.'], ['날씨가 좋아요.', 'Il fait beau.']] },
      { tip: 'Pour te présenter ou parler d’un sujet général : 은/는. Pour répondre à « qui ? / quoi ? » ou décrire une situation : 이/가.' },
    ],
  },
  {
    id: 'objet', cat: 'gram', glyph: '을를', title: 'Le complément d’objet 을/를',
    sum: 'Ce sur quoi porte l’action.',
    blocks: [
      { p: '**을** après une consonne, **를** après une voyelle. La particule se place après le nom qui subit l’action.' },
      { ex: [['책을 읽어요.', 'Je lis un livre.'], ['커피를 마셔요.', 'Je bois du café.'], ['한국어를 배워요.', 'J’apprends le coréen.']] },
      { tip: 'À l’oral, on supprime souvent 을/를 : « 커피 마셔요 ».' },
    ],
  },
  {
    id: 'lieu', cat: 'gram', glyph: '에', title: 'Le lieu : 에 ou 에서',
    sum: 'Aller à un endroit ou faire quelque chose à un endroit.',
    blocks: [
      { p: '**에** indique une **destination** (aller, venir), un **moment** ou l’endroit où l’on **se trouve** (있다). **에서** indique le lieu où se **déroule une action**, ou un point de départ (« de »).' },
      { ex: [['학교에 가요.', 'Je vais à l’école.'], ['집에 있어요.', 'Je suis à la maison.'], ['세 시에 만나요.', 'On se voit à 3 h.'], ['학교에서 공부해요.', 'J’étudie à l’école.'], ['프랑스에서 왔어요.', 'Je viens de France.']] },
      { tip: 'Bouger vers le lieu ou y être = 에. Agir sur place = 에서.' },
    ],
  },
  {
    id: 'etre', cat: 'gram', glyph: '이에요', title: '« Être » : 이에요 / 예요',
    sum: 'Dire ce qu’est quelque chose.',
    blocks: [
      { p: 'Pour dire « c’est… » ou « je suis… » suivi d’un nom, on ajoute **이에요** après une consonne et **예요** après une voyelle. La négation est **아니에요**, avec 이/가 sur le nom.' },
      { ex: [['학생이에요.', 'Je suis étudiant(e).'], ['의사예요.', 'Je suis médecin.'], ['이거 커피예요?', 'C’est du café ?'], ['학생이 아니에요.', 'Je ne suis pas étudiant(e).']] },
      { tip: 'Pour les adjectifs (« être grand », « être bon »), on n’utilise pas 이에요 : en coréen, les adjectifs se conjuguent comme des verbes (좋아요, 커요).' },
    ],
  },
  {
    id: 'present', cat: 'gram', glyph: '아요', title: 'Le présent poli : -아요 / -어요',
    sum: 'La conjugaison de base, à connaître par cœur.',
    blocks: [
      { p: 'On enlève **다** du verbe pour obtenir le **radical**, puis on regarde sa **dernière voyelle** :' },
      { table: [['Dernière voyelle', 'Terminaison', 'Exemple'], ['ㅏ ou ㅗ', '-아요', '살다 → 살아요'], ['autre', '-어요', '먹다 → 먹어요'], ['하다', '해요', '공부하다 → 공부해요']] },
      { p: 'Quand le radical finit par une voyelle, les deux voyelles **fusionnent** :' },
      { ex: [['가요', '가 + 아요 → je vais'], ['와요', '오 + 아요 → je viens'], ['마셔요', '마시 + 어요 → je bois'], ['배워요', '배우 + 어요 → j’apprends'], ['봐요', '보 + 아요 → je regarde']] },
      { tip: 'Le même mot sert au présent pour je, tu, il, nous… : 먹어요 = je mange, tu manges, il mange, selon le contexte.' },
    ],
  },
  {
    id: 'politesse', cat: 'gram', glyph: '요', title: 'Les niveaux de politesse',
    sum: 'Formel, poli ou familier : choisir selon la personne.',
    blocks: [
      { p: 'La terminaison du verbe change selon la personne à qui l’on parle.' },
      { table: [['Style', 'Exemple', 'Quand ?'], ['Formel', '먹습니다', 'travail, annonces, discours'], ['Poli', '먹어요', 'la plupart des situations'], ['Familier', '먹어', 'amis proches, plus jeunes']] },
      { p: 'Le **formel** se forme avec **-ㅂ니다** après une voyelle (갑니다) et **-습니다** après une consonne (먹습니다). Pour poser une question : -ㅂ니까 / -습니까. Le **familier** s’obtient en enlevant le 요 du style poli.' },
      { ex: [['감사합니다.', 'Merci (formel).'], ['고마워요.', 'Merci (poli).'], ['고마워.', 'Merci (familier).']] },
      { tip: 'Dans le doute, utilise le style poli en -요 : il ne vexe jamais personne.' },
    ],
  },
  {
    id: 'passe', cat: 'gram', glyph: '었', title: 'Le passé : -았어요 / -었어요',
    sum: 'Même règle des voyelles que le présent.',
    blocks: [
      { p: 'On reprend la forme du présent sans 요 et on ajoute **ㅆ** en consonne finale, puis **어요**.' },
      { table: [['Présent', 'Passé'], ['가요', '갔어요'], ['먹어요', '먹었어요'], ['해요', '했어요'], ['마셔요', '마셨어요']] },
      { ex: [['어제 영화를 봤어요.', 'Hier, j’ai regardé un film.'], ['밥을 먹었어요?', 'Tu as mangé ?']] },
      { tip: '« 밥 먹었어요? » (« tu as mangé ? ») est une salutation très courante en Corée.' },
    ],
  },
  {
    id: 'futur', cat: 'gram', glyph: '거예요', title: 'Le futur : -(으)ㄹ 거예요',
    sum: 'Parler de ce qu’on va faire.',
    blocks: [
      { p: 'Radical + **ㄹ 거예요** après une voyelle, + **을 거예요** après une consonne. Si le radical finit déjà par ㄹ, on ajoute seulement 거예요.' },
      { ex: [['내일 갈 거예요.', 'J’irai demain.'], ['피자를 먹을 거예요.', 'Je vais manger une pizza.'], ['케이크를 만들 거예요.', 'Je vais faire un gâteau.']] },
      { tip: 'Le familier est -(으)ㄹ 거야, le formel -(으)ㄹ 겁니다.' },
    ],
  },
  {
    id: 'negation', cat: 'gram', glyph: '안', title: 'La négation : 안 et -지 않다',
    sum: 'Deux façons de dire « ne… pas ».',
    blocks: [
      { p: '**Forme courte** : **안** juste avant le verbe. Pour les verbes « nom + 하다 », 안 se place avant 하다.' },
      { ex: [['안 먹어요.', 'Je ne mange pas.'], ['안 바빠요.', 'Je ne suis pas occupé(e).'], ['공부 안 해요.', 'Je n’étudie pas.']] },
      { p: '**Forme longue** : radical + **-지 않아요**. Elle est un peu plus soutenue et fonctionne avec tous les verbes.' },
      { ex: [['먹지 않아요.', 'Je ne mange pas.'], ['공부하지 않아요.', 'Je n’étudie pas.']] },
      { tip: 'Certains verbes ont leur propre contraire : 있다 → **없다** (ne pas avoir), 알다 → **모르다** (ne pas savoir), 맛있다 → **맛없다** (ne pas être bon).' },
    ],
  },
  {
    id: 'envie', cat: 'gram', glyph: '싶다', title: 'L’envie : -고 싶어요',
    sum: 'Dire ce qu’on veut faire.',
    blocks: [
      { p: 'Radical + **-고 싶어요** = « je veux / j’ai envie de… ». Pour parler de l’envie de **quelqu’un d’autre**, on utilise **-고 싶어해요**.' },
      { ex: [['한국에 가고 싶어요.', 'Je veux aller en Corée.'], ['뭐 먹고 싶어요?', 'Qu’est-ce que tu veux manger ?'], ['친구는 쉬고 싶어해요.', 'Mon ami veut se reposer.']] },
      { tip: 'Au passé : 가고 싶었어요 (« je voulais y aller »). Au négatif : 가고 싶지 않아요.' },
    ],
  },
  {
    id: 'questions', cat: 'gram', glyph: '뭐', title: 'Poser des questions',
    sum: 'Intonation et mots interrogatifs.',
    blocks: [
      { p: 'Une question oui/non garde la même forme que l’affirmation, avec une **intonation montante**. Les mots interrogatifs se placent là où serait la réponse.' },
      { table: [['Coréen', 'Français'], ['뭐 / 무엇', 'quoi'], ['누구', 'qui'], ['어디', 'où'], ['언제', 'quand'], ['왜', 'pourquoi'], ['어떻게', 'comment'], ['얼마', 'combien (prix)']] },
      { ex: [['어디에 가요?', 'Où vas-tu ?'], ['이거 뭐예요?', 'C’est quoi ?'], ['얼마예요?', 'Combien ça coûte ?'], ['왜 늦었어요?', 'Pourquoi es-tu en retard ?']] },
    ],
  },
  {
    id: 'irreguliers', cat: 'gram', glyph: 'ㅂㄷ', title: 'Les verbes irréguliers',
    sum: 'Les principales familles à reconnaître.',
    blocks: [
      { table: [['Famille', 'Dictionnaire', 'Présent poli'], ['ㅂ → 우', '맵다 (épicé)', '매워요'], ['ㄷ → ㄹ', '듣다 (écouter)', '들어요'], ['ㅡ disparaît', '바쁘다 (occupé)', '바빠요'], ['르 → ㄹㄹ', '모르다 (ignorer)', '몰라요'], ['ㄹ tombe', '만들다 (faire)', '만듭니다']] },
      { p: 'Ces changements n’apparaissent que devant une voyelle (-아요, -어요, -을…). Devant une consonne, le radical reste normal : 맵고, 듣고, 모르고.' },
      { ex: [['더워요', 'il fait chaud (덥다)'], ['걸어요', 'je marche (걷다)'], ['써요', 'j’écris (쓰다)'], ['빨라요', 'c’est rapide (빠르다)']] },
      { tip: 'Pas besoin de tout apprendre d’un coup : retiens les verbes courants un par un, la famille deviendra évidente.' },
    ],
  },
  {
    id: 'nombres', cat: 'gram', glyph: '일 하나', title: 'Les deux systèmes de nombres',
    sum: 'Sino-coréen ou coréen natif ?',
    blocks: [
      { table: [['', '1', '2', '3', '4', '5', '10'], ['Sino-coréen', '일', '이', '삼', '사', '오', '십'], ['Natif', '하나', '둘', '셋', '넷', '다섯', '열']] },
      { p: '**Sino-coréen** : dates, argent, minutes, numéros, étages. **Natif** : compter des objets ou des personnes, l’âge, les heures.' },
      { p: 'Devant un compteur, 하나, 둘, 셋 et 넷 raccourcissent en **한, 두, 세, 네**.' },
      { ex: [['사과 두 개', 'deux pommes'], ['세 시', 'trois heures'], ['삼십 분', 'trente minutes'], ['만 원', '10 000 wons'], ['스무 살', '20 ans']] },
      { tip: 'Pour l’heure, on mélange les deux : 세 시 삼십 분 = 3 h 30 (heures en natif, minutes en sino-coréen).' },
    ],
  },
];

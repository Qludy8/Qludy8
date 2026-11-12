// Guide du coréen, suite : prononciation et grammaire intermédiaires (leçons bilingues, voir guide.util.js).
import { B } from './guide.util.js';

export const GUIDE_KO_PLUS = [
  // ================= PRONONCIATION =================
  {
    id: 'double-batchim', cat: 'pron', glyph: '읽닭', title: B('Les doubles consonnes finales', 'Double final consonants'),
    sum: B('ㄺ, ㄻ, ㄼ, ㄶ… : laquelle des deux se prononce ?', 'ㄺ, ㄻ, ㄼ, ㄶ…: which of the two is pronounced?'),
    blocks: [
      { p: B('Onze syllabes finales s’écrivent avec **deux consonnes** (겹받침). Devant une pause ou une consonne, **une seule** se prononce ; devant une voyelle, la seconde fait la **liaison**.', 'Eleven finals are written with **two consonants** (겹받침). Before a pause or a consonant, **only one** is pronounced; before a vowel, the second one **links** to the next syllable.') },
      { table: [[B('Écrit', 'Written'), B('Se prononce', 'Pronounced'), B('Exemple', 'Example')], ['ㄳ', 'ㄱ', '몫 → 목'], ['ㄵ', 'ㄴ', '앉다 → 안따'], ['ㄶ', 'ㄴ', '많다 → 만타'], ['ㄼ', 'ㄹ', '여덟 → 여덜'], ['ㅀ', 'ㄹ', '싫다 → 실타'], ['ㅄ', 'ㅂ', '값 → 갑'], ['ㄺ', 'ㄱ', '닭 → 닥'], ['ㄻ', 'ㅁ', '삶 → 삼'], ['ㄿ', 'ㅂ', '읊다 → 읍따']] },
      { p: B('Règle pratique : c’est en général la **première** consonne qui reste, sauf pour **ㄺ, ㄻ, ㄿ** où c’est la **seconde**. Exceptions courantes : **밟다** se lit 밥따, et **ㄺ devant ㄱ** se lit ㄹ (읽고 → 일꼬).', 'Rule of thumb: the **first** consonant usually stays, except for **ㄺ, ㄻ, ㄿ**, where the **second** one does. Common exceptions: **밟다** is read 밥따, and **ㄺ before ㄱ** is read ㄹ (읽고 → 일꼬).') },
      { ex: [['닭', B('poulet', 'chicken'), '닥'], ['닭이', B('le poulet (sujet)', 'the chicken (subject)'), '달기'], ['읽어요', B('je lis', 'I read'), '일거요'], ['읽다', B('lire', 'to read'), '익따'], ['없어요', B('il n’y a pas', 'there isn’t'), '업써요'], ['앉으세요', B('asseyez-vous', 'please sit down'), '안즈세요'], ['많아요', B('il y en a beaucoup', 'there are many'), '마나요']] },
      { tip: B('Devant une voyelle, rien ne se perd : 읽어요 = 일거요. ㅎ, lui, disparaît : 많아요 = 마나요, 싫어요 = 시러요.', 'Before a vowel nothing is lost: 읽어요 = 일거요. ㅎ, however, disappears: 많아요 = 마나요, 싫어요 = 시러요.') },
    ],
  },
  {
    id: 'n-insertion', cat: 'pron', glyph: 'ㄴ+', title: B('Le ㄴ ajouté et l’assimilation ㄴ / ㄹ', 'Added ㄴ and ㄴ / ㄹ assimilation'),
    sum: B('Pourquoi 꽃잎 se lit « 꼰닙 » et 신라 « 실라 ».', 'Why 꽃잎 is read “꼰닙” and 신라 “실라”.'),
    blocks: [
      { p: B('Dans un **mot composé**, quand le premier élément finit par une consonne et que le second commence par **이, 야, 여, 요, 유**, un **ㄴ** s’intercale. La consonne précédente se nasalise alors normalement.', 'In a **compound word**, when the first part ends in a consonant and the second starts with **이, 야, 여, 요, 유**, an **ㄴ** is inserted. The preceding consonant is then nasalised as usual.') },
      { ex: [['꽃잎', B('pétale', 'petal'), '꼰닙'], ['한여름', B('plein été', 'midsummer'), '한녀름'], ['무슨 일', B('quelle affaire', 'what matter'), '무슨 닐'], ['서울역', B('gare de Séoul', 'Seoul Station'), '서울력'], ['할 일', B('chose à faire', 'thing to do'), '할 릴']] },
      { p: B('**ㄴ + ㄹ** ou **ㄹ + ㄴ** se prononcent en général **ㄹㄹ** : les deux sons se fondent.', '**ㄴ + ㄹ** or **ㄹ + ㄴ** are generally pronounced **ㄹㄹ**: the two sounds merge.') },
      { ex: [['신라', B('Silla (royaume)', 'Silla (kingdom)'), '실라'], ['연락', B('contact', 'contact'), '열락'], ['설날', B('Nouvel An lunaire', 'Lunar New Year'), '설랄'], ['한라산', B('mont Halla', 'Mount Halla'), '할라산']] },
      { tip: B('Dans certains mots sino-coréens formés avec un suffixe, ㄴ + ㄹ donne au contraire ㄴㄴ : 의견란 → 의견난, 생산량 → 생산냥.', 'In some Sino-Korean words built with a suffix, ㄴ + ㄹ gives ㄴㄴ instead: 의견란 → 의견난, 생산량 → 생산냥.') },
    ],
  },
  {
    id: 'ui', cat: 'pron', glyph: '의', title: B('Les trois prononciations de 의', 'The three pronunciations of 의'),
    sum: B('« ui », « i » ou « e » selon la place.', '“ui”, “i” or “e” depending on position.'),
    blocks: [
      { table: [[B('Position', 'Position'), B('Son', 'Sound'), B('Exemple', 'Example')], [B('début de mot', 'start of a word'), 'ui', '의사 → 의사'], [B('ailleurs dans le mot', 'elsewhere in the word'), 'i', '회의 → 회이'], [B('après une consonne', 'after a consonant'), 'i', '희망 → 히망'], [B('particule « de »', 'particle “of”'), 'e', '나의 → 나에']] },
      { ex: [['의사', B('médecin', 'doctor')], ['회의', B('réunion', 'meeting'), '회이'], ['무늬', B('motif', 'pattern'), '무니'], ['친구의 책', B('le livre de mon ami', 'my friend’s book'), '친구에 책'], ['민주주의의 의의', B('le sens de la démocratie', 'the meaning of democracy'), '민주주이에 의이']] },
      { tip: B('Le dernier exemple réunit les trois sons : c’est la phrase que les Coréens citent pour s’en souvenir.', 'The last example contains all three sounds: it is the phrase Koreans quote to remember them.') },
    ],
  },

  // ================= GRAMMAIRE (suite) =================
  {
    id: 'particules', cat: 'gram', glyph: '도만', title: B('Les autres particules', 'The other particles'),
    sum: B('도, 만, 부터/까지, 에게, (으)로, 와/과, 의, 밖에…', '도, 만, 부터/까지, 에게, (으)로, 와/과, 의, 밖에…'),
    blocks: [
      { table: [[B('Particule', 'Particle'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['도', B('aussi, même', 'also, even'), '저도 가요'], ['만', B('seulement', 'only'), '물만 마셔요'], ['부터 … 까지', B('de … à (temps)', 'from … to (time)'), '월요일부터 금요일까지'], ['에서 … 까지', B('de … à (lieu)', 'from … to (place)'), '집에서 학교까지'], ['에게 / 한테', B('à (quelqu’un)', 'to (someone)'), '친구한테 줘요'], ['에게서 / 한테서', B('de la part de', 'from (someone)'), '친구한테서 받았어요'], ['(으)로', B('vers, par, avec, en', 'towards, by, with'), '버스로 가요'], ['와/과, 하고, (이)랑', B('et, avec', 'and, with'), '빵과 우유'], ['의', B('de (possession)', 'of, ’s'), '친구의 집'], ['밖에 + nég.', B('ne … que', 'nothing but'), '하나밖에 없어요'], ['(이)나', B('ou ; pas moins de', 'or; as many as'), '커피나 차'], ['마다', B('chaque', 'every'), '날마다']] },
      { p: B('**도** et **만** remplacent 은/는, 이/가 et 을/를, mais **s’ajoutent** aux autres particules : 집에도 (à la maison aussi), 친구한테만 (seulement à mon ami).', '**도** and **만** replace 은/는, 이/가 and 을/를, but are **added** to the other particles: 집에도 (at home too), 친구한테만 (only to my friend).') },
      { p: B('**(으)로** : 로 après une voyelle ou ㄹ, 으로 après une autre consonne. Il indique la **direction** (오른쪽으로), le **moyen** (젓가락으로), la **matière** (나무로) ou un **changement** (학생으로).', '**(으)로**: 로 after a vowel or ㄹ, 으로 after any other consonant. It marks **direction** (오른쪽으로), **means** (젓가락으로), **material** (나무로) or a **change** (학생으로).') },
      { ex: [['저도 한국어를 배워요.', B('Moi aussi, j’apprends le coréen.', 'I’m learning Korean too.')], ['아홉 시부터 여섯 시까지 일해요.', B('Je travaille de 9 h à 18 h.', 'I work from 9 to 6.')], ['친구하고 영화를 봤어요.', B('J’ai vu un film avec un ami.', 'I watched a film with a friend.')], ['천 원밖에 없어요.', B('Je n’ai que 1 000 wons.', 'I only have 1,000 won.')], ['지하철로 왔어요.', B('Je suis venu(e) en métro.', 'I came by subway.')]] },
      { tip: B('와/과 est plutôt écrit, 하고 neutre, (이)랑 familier. 에게 est écrit, 한테 parlé ; pour une personne respectée on dit **께**.', '와/과 is rather written, 하고 neutral, (이)랑 casual. 에게 is written, 한테 spoken; for a respected person use **께**.') },
    ],
  },
  {
    id: 'connecteurs', cat: 'gram', glyph: '고', title: B('Relier deux phrases', 'Linking two clauses'),
    sum: B('-고, -지만, -아서/어서, -(으)니까, -(으)면, -는데.', '-고, -지만, -아서/어서, -(으)니까, -(으)면, -는데.'),
    blocks: [
      { p: B('En coréen, on relie deux propositions en remplaçant la terminaison du **premier verbe** par un connecteur. Seul le dernier verbe porte le temps et la politesse.', 'In Korean, two clauses are linked by replacing the ending of the **first verb** with a connective. Only the last verb carries tense and politeness.') },
      { table: [[B('Connecteur', 'Connective'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['-고', B('et, puis', 'and, then'), '먹고 자요'], ['-지만', B('mais', 'but'), '비싸지만 맛있어요'], ['-아서/어서', B('donc ; et ensuite', 'so; and then'), '바빠서 못 가요'], ['-(으)니까', B('puisque', 'since, because'), '비가 오니까 택시를 타요'], ['-(으)면', B('si, quand', 'if, when'), '시간이 있으면 와요'], ['-는데 / -(으)ㄴ데', B('mais ; contexte', 'but; background'), '가고 싶은데 시간이 없어요'], ['-거나', B('ou', 'or'), '책을 읽거나 영화를 봐요'], ['-(으)러', B('pour (aller faire)', '(go) in order to'), '밥 먹으러 가요']] },
      { p: B('**-아서/어서** ou **-(으)니까** ? Avec un **ordre** ou une **proposition**, seul **-(으)니까** est possible : 추우니까 문을 닫으세요. Et **-아서/어서** ne prend jamais le passé : 늦어서 죄송합니다 (et non 늦었어서).', '**-아서/어서** or **-(으)니까**? With a **command** or a **suggestion**, only **-(으)니까** works: 추우니까 문을 닫으세요. And **-아서/어서** never takes the past tense: 늦어서 죄송합니다 (not 늦었어서).') },
      { ex: [['숙제를 하고 텔레비전을 봤어요.', B('J’ai fait mes devoirs puis regardé la télé.', 'I did my homework and then watched TV.')], ['한국어는 어렵지만 재미있어요.', B('Le coréen est difficile mais intéressant.', 'Korean is hard but fun.')], ['배가 고파서 라면을 먹었어요.', B('J’avais faim, alors j’ai mangé des ramen.', 'I was hungry, so I ate ramen.')], ['시간이 없으니까 빨리 가요.', B('On n’a pas le temps, allons-y vite.', 'We have no time, so let’s go quickly.')], ['돈이 있으면 여행을 갈 거예요.', B('Si j’ai de l’argent, je partirai en voyage.', 'If I have money, I’ll travel.')], ['어제 백화점에 갔는데 사람이 많았어요.', B('Hier je suis allé(e) au grand magasin, et il y avait du monde.', 'I went to the department store yesterday and it was crowded.')]] },
      { tip: B('-는데 est partout à l’oral : il pose le décor avant de dire l’essentiel. Verbes : -는데 ; adjectifs : -(으)ㄴ데 ; passé : -았/었는데.', '-는데 is everywhere in speech: it sets the scene before the main point. Verbs: -는데; adjectives: -(으)ㄴ데; past: -았/었는데.') },
    ],
  },
  {
    id: 'pouvoir', cat: 'gram', glyph: '수', title: B('Pouvoir et savoir faire', 'Can and know how to'),
    sum: B('-(으)ㄹ 수 있다/없다, 못, -(으)ㄹ 줄 알다.', '-(으)ㄹ 수 있다/없다, 못, -(으)ㄹ 줄 알다.'),
    blocks: [
      { p: B('Radical + **-(으)ㄹ 수 있어요** = « pouvoir ». La négation est **-(으)ㄹ 수 없어요**, ou plus simplement **못** devant le verbe.', 'Stem + **-(으)ㄹ 수 있어요** = “can”. The negative is **-(으)ㄹ 수 없어요**, or more simply **못** before the verb.') },
      { ex: [['한국어를 할 수 있어요.', B('Je sais parler coréen.', 'I can speak Korean.')], ['오늘은 갈 수 없어요.', B('Je ne peux pas y aller aujourd’hui.', 'I can’t go today.')], ['매운 음식을 못 먹어요.', B('Je ne peux pas manger épicé.', 'I can’t eat spicy food.')], ['수영 못 해요.', B('Je ne sais pas nager.', 'I can’t swim.')]] },
      { p: B('**안** = je ne veux pas / je ne le fais pas ; **못** = je n’en suis pas capable ou les circonstances m’en empêchent. La forme longue de 못 est **-지 못해요**.', '**안** = I won’t / I don’t; **못** = I’m unable to, or circumstances prevent it. The long form of 못 is **-지 못해요**.') },
      { p: B('Pour un **savoir-faire appris**, on dit aussi **-(으)ㄹ 줄 알아요 / 몰라요**.', 'For a **learned skill**, you can also say **-(으)ㄹ 줄 알아요 / 몰라요**.') },
      { ex: [['운전할 줄 알아요?', B('Tu sais conduire ?', 'Do you know how to drive?')], ['김치를 만들 줄 몰라요.', B('Je ne sais pas faire le kimchi.', 'I don’t know how to make kimchi.')]] },
      { tip: B('못 + verbe en ㅎ, ㄴ ou ㅁ change de son : 못 해요 se lit 모태요, 못 먹어요 se lit 몬 머거요.', '못 + a verb starting with ㅎ, ㄴ or ㅁ changes sound: 못 해요 is read 모태요, 못 먹어요 is read 몬 머거요.') },
    ],
  },
  {
    id: 'obligation', cat: 'gram', glyph: '야', title: B('Devoir, avoir le droit, ne pas devoir', 'Must, may, must not'),
    sum: B('-아/어야 하다, -아/어도 되다, -(으)면 안 되다.', '-아/어야 하다, -아/어도 되다, -(으)면 안 되다.'),
    blocks: [
      { table: [[B('Forme', 'Form'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['-아/어야 해요 (돼요)', B('devoir', 'must, have to'), '가야 해요'], ['-아/어도 돼요', B('avoir le droit de', 'may, it’s OK to'), '가도 돼요'], ['-(으)면 안 돼요', B('ne pas devoir', 'must not'), '가면 안 돼요'], ['안 -아/어도 돼요', B('ne pas être obligé', 'don’t have to'), '안 가도 돼요'], ['-지 않아도 돼요', B('ne pas être obligé', 'don’t have to'), '가지 않아도 돼요']] },
      { ex: [['내일 일찍 일어나야 해요.', B('Je dois me lever tôt demain.', 'I have to get up early tomorrow.')], ['여기 앉아도 돼요?', B('Je peux m’asseoir ici ?', 'May I sit here?')], ['여기서 사진을 찍으면 안 돼요.', B('Il ne faut pas prendre de photos ici.', 'You must not take photos here.')], ['걱정하지 않아도 돼요.', B('Tu n’as pas besoin de t’inquiéter.', 'You don’t need to worry.')]] },
      { tip: B('-아/어야 해요 et -아/어야 돼요 sont interchangeables ; 돼요 est plus courant à l’oral. Les voyelles suivent la règle du présent : 가야, 먹어야, 해야.', '-아/어야 해요 and -아/어야 돼요 are interchangeable; 돼요 is more common in speech. Vowels follow the present-tense rule: 가야, 먹어야, 해야.') },
    ],
  },
  {
    id: 'imperatif', cat: 'gram', glyph: '세요', title: B('Demander, proposer, interdire', 'Requests, suggestions, prohibitions'),
    sum: B('-(으)세요, -지 마세요, -(으)ㄹ까요, -(으)ㅂ시다, -자.', '-(으)세요, -지 마세요, -(으)ㄹ까요, -(으)ㅂ시다, -자.'),
    blocks: [
      { table: [[B('Forme', 'Form'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['-(으)세요', B('faites… (poli)', 'please do'), '앉으세요'], ['-지 마세요', B('ne faites pas…', 'please don’t'), '가지 마세요'], ['-아/어 주세요', B('faites… pour moi', 'please do … for me'), '도와주세요'], ['-(으)ㄹ까요?', B('et si on… ? / voulez-vous que je… ?', 'shall we…? / shall I…?'), '갈까요?'], ['-(으)ㅂ시다', B('faisons… (formel)', 'let’s (formal)'), '갑시다'], ['-아/어요', B('faisons… (poli)', 'let’s (polite)'), '같이 가요'], ['-자', B('faisons… (familier)', 'let’s (casual)'), '가자'], ['-아/어', B('fais… (familier)', 'do (casual)'), '먹어']] },
      { ex: [['여기에 이름을 쓰세요.', B('Écrivez votre nom ici.', 'Please write your name here.')], ['걱정하지 마세요.', B('Ne vous inquiétez pas.', 'Please don’t worry.')], ['천천히 말해 주세요.', B('Parlez lentement, s’il vous plaît.', 'Please speak slowly.')], ['커피 마실까요?', B('On prend un café ?', 'Shall we have coffee?')], ['문을 열까요?', B('Voulez-vous que j’ouvre la porte ?', 'Shall I open the door?')], ['내일 같이 점심 먹자.', B('Déjeunons ensemble demain.', 'Let’s have lunch together tomorrow.')]] },
      { tip: B('Certains verbes ont une forme spéciale en -(으)세요 : 먹다 → **드세요**, 자다 → **주무세요**, 있다 → **계세요**. « 안녕히 계세요 » et « 안녕히 가세요 » viennent de là.', 'Some verbs have a special -(으)세요 form: 먹다 → **드세요**, 자다 → **주무세요**, 있다 → **계세요**. “안녕히 계세요” and “안녕히 가세요” come from this.') },
    ],
  },
  {
    id: 'progressif', cat: 'gram', glyph: '있다', title: B('En train de… et état résultant', 'In progress and resulting state'),
    sum: B('-고 있다 pour l’action en cours, -아/어 있다 pour l’état.', '-고 있다 for ongoing action, -아/어 있다 for a state.'),
    blocks: [
      { p: B('**-고 있어요** : l’action est **en cours**. Avec les verbes d’habillement (입다, 쓰다, 신다), il décrit aussi ce qu’on **porte**.', '**-고 있어요**: the action is **in progress**. With clothing verbs (입다, 쓰다, 신다) it also describes what one **is wearing**.') },
      { ex: [['지금 밥을 먹고 있어요.', B('Je suis en train de manger.', 'I’m eating right now.')], ['친구를 기다리고 있었어요.', B('J’attendais un ami.', 'I was waiting for a friend.')], ['안경을 쓰고 있어요.', B('Il porte des lunettes.', 'He is wearing glasses.')]] },
      { p: B('**-아/어 있어요** : le **résultat** d’une action qui dure. Il ne s’emploie qu’avec des verbes sans objet (앉다, 서다, 열리다, 켜지다…).', '**-아/어 있어요**: the lasting **result** of an action. It is only used with verbs that take no object (앉다, 서다, 열리다, 켜지다…).') },
      { ex: [['의자에 앉아 있어요.', B('Il est assis sur la chaise.', 'He is sitting on the chair.')], ['문이 열려 있어요.', B('La porte est ouverte.', 'The door is open.')], ['불이 켜져 있어요.', B('La lumière est allumée.', 'The light is on.')]] },
      { tip: B('앉고 있어요 = il est en train de s’asseoir ; 앉아 있어요 = il est assis. La forme honorifique est -고 계세요.', '앉고 있어요 = he is in the act of sitting down; 앉아 있어요 = he is seated. The honorific form is -고 계세요.') },
    ],
  },
  {
    id: 'comparaison', cat: 'gram', glyph: '보다', title: B('Comparer', 'Comparing'),
    sum: B('보다, 더, 덜, 제일/가장, 처럼, 만큼.', '보다, 더, 덜, 제일/가장, 처럼, 만큼.'),
    blocks: [
      { p: B('**A가 B보다 (더) …** = « A est plus … que B ». **보다** se place après l’élément de comparaison ; **더** (plus) est facultatif, **덜** signifie « moins ».', '**A가 B보다 (더) …** = “A is more … than B”. **보다** follows the thing compared against; **더** (more) is optional, **덜** means “less”.') },
      { ex: [['서울이 부산보다 커요.', B('Séoul est plus grande que Busan.', 'Seoul is bigger than Busan.')], ['어제보다 더 추워요.', B('Il fait plus froid qu’hier.', 'It’s colder than yesterday.')], ['이게 덜 매워요.', B('Celui-ci est moins épicé.', 'This one is less spicy.')]] },
      { p: B('Superlatif : **제일** (courant) ou **가장** (plus soutenu) devant l’adjectif. Ressemblance : **처럼** / **같이** (« comme »). Égalité : **만큼** (« autant que »).', 'Superlative: **제일** (everyday) or **가장** (more formal) before the adjective. Likeness: **처럼** / **같이** (“like”). Equality: **만큼** (“as much as”).') },
      { ex: [['한국 음식 중에서 불고기가 제일 맛있어요.', B('De tous les plats coréens, le bulgogi est le meilleur.', 'Of all Korean dishes, bulgogi is the best.')], ['가수처럼 노래해요.', B('Elle chante comme une chanteuse.', 'She sings like a singer.')], ['저도 형만큼 키가 커요.', B('Je suis aussi grand que mon frère.', 'I’m as tall as my older brother.')]] },
      { tip: B('« Parmi » se dit **중에서** : 과일 중에서 (parmi les fruits). Pour un lieu ou un groupe, **에서** suffit : 반에서 제일 (le plus… de la classe).', '“Among” is **중에서**: 과일 중에서 (among fruits). For a place or a group, **에서** is enough: 반에서 제일 (the most … in the class).') },
    ],
  },
  {
    id: 'compteurs', cat: 'gram', glyph: '개명', title: B('Les compteurs', 'Counters'),
    sum: B('개, 명, 마리, 권, 잔, 병, 장, 대, 번…', '개, 명, 마리, 권, 잔, 병, 장, 대, 번…'),
    blocks: [
      { p: B('Pour compter, on dit **nom + nombre natif + compteur** : 사과 두 개. Le compteur dépend de ce qu’on compte.', 'To count, say **noun + native number + counter**: 사과 두 개. The counter depends on what is being counted.') },
      { table: [[B('Compteur', 'Counter'), B('Pour…', 'For…'), B('Exemple', 'Example')], ['개', B('objets en général', 'things in general'), '사과 세 개'], ['명 / 분', B('personnes (분 : respect)', 'people (분: respectful)'), '학생 두 명'], ['마리', B('animaux', 'animals'), '고양이 한 마리'], ['권', B('livres', 'books'), '책 네 권'], ['잔', B('verres, tasses', 'glasses, cups'), '커피 한 잔'], ['병', B('bouteilles', 'bottles'), '물 두 병'], ['장', B('feuilles, billets', 'sheets, tickets'), '표 두 장'], ['대', B('véhicules, machines', 'vehicles, machines'), '차 한 대'], ['벌', B('vêtements', 'clothes'), '옷 한 벌'], ['켤레', B('paires (chaussures)', 'pairs (shoes)'), '신발 한 켤레'], ['살', B('âge', 'age'), '스무 살'], ['번', B('fois', 'times'), '한 번']] },
      { p: B('Devant un compteur : 하나 → **한**, 둘 → **두**, 셋 → **세**, 넷 → **네**, 스물 → **스무**. À partir de 100, on utilise les nombres sino-coréens.', 'Before a counter: 하나 → **한**, 둘 → **두**, 셋 → **세**, 넷 → **네**, 스물 → **스무**. From 100 upwards, Sino-Korean numbers are used.') },
      { p: B('Avec les nombres **sino-coréens** : 원 (wons), 분 (minutes), 층 (étage), 번 (numéro), 년 (année), 월 (mois), 일 (jour), 인분 (portion).', 'With **Sino-Korean** numbers: 원 (won), 분 (minutes), 층 (floor), 번 (number), 년 (year), 월 (month), 일 (day), 인분 (serving).') },
      { ex: [['커피 두 잔 주세요.', B('Deux cafés, s’il vous plaît.', 'Two coffees, please.')], ['몇 명이에요?', B('Vous êtes combien ?', 'How many people?')], ['불고기 이 인분 주세요.', B('Deux portions de bulgogi, s’il vous plaît.', 'Two servings of bulgogi, please.')], ['삼 층에 있어요.', B('C’est au 3e étage.', 'It’s on the 3rd floor.')]] },
      { tip: B('**번** change de sens selon le système : 세 번 = trois fois (natif), 삼 번 = numéro trois (sino-coréen). « Combien » devant un compteur se dit **몇**.', '**번** changes meaning with the number system: 세 번 = three times (native), 삼 번 = number three (Sino-Korean). “How many” before a counter is **몇**.') },
    ],
  },
  {
    id: 'dates', cat: 'gram', glyph: '요일', title: B('La date, l’heure et la durée', 'Dates, time and duration'),
    sum: B('Jours, mois, heures, et combien de temps.', 'Days, months, clock time and how long.'),
    blocks: [
      { table: [[B('Jour', 'Day'), B('Coréen', 'Korean')], [B('lundi', 'Monday'), '월요일'], [B('mardi', 'Tuesday'), '화요일'], [B('mercredi', 'Wednesday'), '수요일'], [B('jeudi', 'Thursday'), '목요일'], [B('vendredi', 'Friday'), '금요일'], [B('samedi', 'Saturday'), '토요일'], [B('dimanche', 'Sunday'), '일요일']] },
      { p: B('La date va du **plus grand au plus petit** : année, mois, jour, avec les nombres sino-coréens. Deux mois sont irréguliers : **유월** (juin) et **시월** (octobre).', 'Dates go from **largest to smallest**: year, month, day, with Sino-Korean numbers. Two months are irregular: **유월** (June) and **시월** (October).') },
      { ex: [['이천이십육 년 삼 월 십오 일', B('le 15 mars 2026', '15 March 2026')], ['오늘이 무슨 요일이에요?', B('Quel jour sommes-nous ?', 'What day is it today?')], ['생일이 언제예요?', B('C’est quand, ton anniversaire ?', 'When is your birthday?')], ['오후 두 시 반에 만나요.', B('On se voit à 14 h 30.', 'Let’s meet at 2:30 pm.')]] },
      { p: B('**Durée** : 시간 (heures, natif : 두 시간), 분 (minutes), 일 (jours : 삼 일), 주일 / 주 (semaines), 달 (mois, natif : 한 달) ou 개월 (mois, sino-coréen : 삼 개월), 년 (ans). **동안** signifie « pendant ».', '**Duration**: 시간 (hours, native: 두 시간), 분 (minutes), 일 (days: 삼 일), 주일 / 주 (weeks), 달 (months, native: 한 달) or 개월 (months, Sino-Korean: 삼 개월), 년 (years). **동안** means “for, during”.') },
      { ex: [['두 시간 동안 공부했어요.', B('J’ai étudié pendant deux heures.', 'I studied for two hours.')], ['한국에 일 년 살았어요.', B('J’ai vécu un an en Corée.', 'I lived in Korea for a year.')], ['얼마나 걸려요?', B('Ça prend combien de temps ?', 'How long does it take?')]] },
      { tip: B('Repères utiles : 어제 (hier), 오늘, 내일 (demain), 모레 (après-demain) ; 지난주, 이번 주, 다음 주 ; 작년, 올해, 내년. 오전 = matin, 오후 = après-midi.', 'Useful anchors: 어제 (yesterday), 오늘, 내일 (tomorrow), 모레 (the day after); 지난주, 이번 주, 다음 주; 작년, 올해, 내년. 오전 = am, 오후 = pm.') },
    ],
  },
  {
    id: 'adjectifs', cat: 'gram', glyph: '게', title: B('Adjectifs et adverbes', 'Adjectives and adverbs'),
    sum: B('Les adjectifs se conjuguent ; -게 en fait des adverbes.', 'Adjectives conjugate; -게 turns them into adverbs.'),
    blocks: [
      { p: B('En coréen, un adjectif est un **verbe descriptif** : 크다 = « être grand ». Il se conjugue comme un verbe (커요, 컸어요, 클 거예요) et se passe de « être ».', 'In Korean an adjective is a **descriptive verb**: 크다 = “to be big”. It conjugates like a verb (커요, 컸어요, 클 거예요) and needs no “to be”.') },
      { p: B('Devant un nom, il prend **-(으)ㄴ** : 큰 집 (une grande maison), 작은 방 (une petite chambre). Les adjectifs en 있다/없다 prennent **-는** : 맛있는 음식.', 'Before a noun it takes **-(으)ㄴ**: 큰 집 (a big house), 작은 방 (a small room). Adjectives in 있다/없다 take **-는**: 맛있는 음식.') },
      { p: B('**-게** transforme l’adjectif en **adverbe** : 크게 (fort, en grand), 맛있게 (avec appétit). **-아/어지다** exprime un **changement** : 추워졌어요 (il s’est mis à faire froid).', '**-게** turns the adjective into an **adverb**: 크게 (loudly, big), 맛있게 (deliciously). **-아/어지다** expresses a **change**: 추워졌어요 (it has become cold).') },
      { ex: [['예쁜 꽃을 샀어요.', B('J’ai acheté de jolies fleurs.', 'I bought pretty flowers.')], ['맛있게 드세요.', B('Bon appétit.', 'Enjoy your meal.')], ['크게 말해 주세요.', B('Parlez plus fort, s’il vous plaît.', 'Please speak louder.')], ['날씨가 따뜻해졌어요.', B('Le temps s’est réchauffé.', 'The weather has warmed up.')], ['한국어가 재미있어졌어요.', B('Le coréen est devenu intéressant.', 'Korean has become fun.')]] },
      { tip: B('Adverbes à connaître tels quels : 많이 (beaucoup), 조금 (un peu), 빨리 (vite), 천천히 (lentement), 자주 (souvent), 가끔 (parfois), 아주 / 너무 (très / trop), 벌써 (déjà), 아직 (encore).', 'Adverbs to learn as they are: 많이 (a lot), 조금 (a little), 빨리 (quickly), 천천히 (slowly), 자주 (often), 가끔 (sometimes), 아주 / 너무 (very / too), 벌써 (already), 아직 (still, yet).') },
    ],
  },
];

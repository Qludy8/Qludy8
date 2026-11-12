// Guide du coréen : grammaire avancée (leçons bilingues, voir guide.util.js).
import { B } from './guide.util.js';

export const GUIDE_KO_ADV = [
  {
    id: 'determinatif', cat: 'adv', glyph: '는', title: B('Qualifier un nom avec un verbe', 'Modifying a noun with a verb'),
    sum: B('L’équivalent des relatives : -는, -(으)ㄴ, -(으)ㄹ.', 'The equivalent of relative clauses: -는, -(으)ㄴ, -(으)ㄹ.'),
    blocks: [
      { p: B('Le coréen n’a pas de pronom relatif (« qui », « que »). La proposition se place **devant le nom**, et le verbe prend une terminaison qui indique le **temps**.', 'Korean has no relative pronoun (“who”, “that”). The clause goes **before the noun**, and the verb takes an ending that shows the **tense**.') },
      { table: [['', B('Verbe d’action', 'Action verb'), B('Adjectif', 'Adjective')], [B('Passé', 'Past'), '먹은 (-(으)ㄴ)', '—'], [B('Présent', 'Present'), '먹는 (-는)', '작은 (-(으)ㄴ)'], [B('Futur', 'Future'), '먹을 (-(으)ㄹ)', '작을 (-(으)ㄹ)'], [B('Souvenir', 'Recollection'), '먹던 (-던)', '작던 (-던)']] },
      { ex: [['제가 읽는 책', B('le livre que je lis', 'the book I’m reading')], ['어제 본 영화', B('le film que j’ai vu hier', 'the film I saw yesterday')], ['내일 만날 사람', B('la personne que je verrai demain', 'the person I’ll meet tomorrow')], ['한국에서 온 친구', B('un ami venu de Corée', 'a friend who came from Korea')], ['제가 자주 가던 식당', B('le restaurant où j’allais souvent', 'the restaurant I used to go to')]] },
      { p: B('Dans la proposition, le sujet prend **이/가** (ou 의), jamais 은/는. Les irréguliers s’appliquent : 듣다 → 들은, 만들다 → 만든 / 만드는 / 만들, 춥다 → 추운.', 'Inside the clause the subject takes **이/가** (or 의), never 은/는. Irregulars apply: 듣다 → 들은, 만들다 → 만든 / 만드는 / 만들, 춥다 → 추운.') },
      { tip: B('Cette structure sert de base à de très nombreuses expressions : -는 것 (le fait de), -(으)ㄴ 후에 (après), -(으)ㄹ 때 (quand), -는 동안 (pendant que).', 'This structure underlies a great many expressions: -는 것 (the act of), -(으)ㄴ 후에 (after), -(으)ㄹ 때 (when), -는 동안 (while).') },
    ],
  },
  {
    id: 'nominalisation', cat: 'adv', glyph: '기', title: B('Transformer un verbe en nom', 'Turning a verb into a noun'),
    sum: B('-는 것, -기 et -(으)ㅁ.', '-는 것, -기 and -(으)ㅁ.'),
    blocks: [
      { p: B('**-는 것** (souvent contracté en **-는 거**) = « le fait de… ». C’est la forme la plus courante. Avec les particules : 것이 → **게**, 것을 → **걸**, 것은 → **건**.', '**-는 것** (often contracted to **-는 거**) = “the act of …”. It is the most common form. With particles: 것이 → **게**, 것을 → **걸**, 것은 → **건**.') },
      { ex: [['요리하는 것을 좋아해요.', B('J’aime cuisiner.', 'I like cooking.')], ['한국어를 배우는 게 재미있어요.', B('Apprendre le coréen, c’est amusant.', 'Learning Korean is fun.')], ['제 취미는 사진을 찍는 거예요.', B('Mon passe-temps, c’est la photo.', 'My hobby is taking photos.')]] },
      { p: B('**-기** forme un nom d’activité et s’emploie dans des expressions figées :', '**-기** forms an activity noun and is used in set expressions:') },
      { table: [[B('Expression', 'Expression'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['-기 전에', B('avant de', 'before'), '자기 전에'], ['-기 때문에', B('parce que', 'because'), '바쁘기 때문에'], ['-기 위해(서)', B('afin de', 'in order to'), '합격하기 위해서'], ['-기(가) 쉽다 / 어렵다', B('facile / difficile à', 'easy / hard to'), '읽기 어려워요'], ['-기로 하다', B('décider de', 'decide to'), '가기로 했어요'], ['-기 시작하다', B('commencer à', 'start to'), '비가 오기 시작했어요'], ['-기를 바라다', B('souhaiter que', 'hope that'), '행복하기를 바라요']] },
      { p: B('**-(으)ㅁ** est la nominalisation **écrite et formelle**, pour un fait accompli : 알림 (notification), 도움 (aide), 믿음 (confiance), 슬픔 (tristesse).', '**-(으)ㅁ** is the **written, formal** nominaliser, for an accomplished fact: 알림 (notification), 도움 (help), 믿음 (trust), 슬픔 (sadness).') },
      { tip: B('Les listes de tâches et les panneaux utilisent -기 : 읽기, 쓰기, 듣기, 말하기 (lecture, écriture, écoute, expression orale).', 'To-do lists and signs use -기: 읽기, 쓰기, 듣기, 말하기 (reading, writing, listening, speaking).') },
    ],
  },
  {
    id: 'honorifiques', cat: 'adv', glyph: '시', title: B('Les formes honorifiques', 'Honorific forms'),
    sum: B('-(으)시-, 께서, les verbes et noms de respect.', '-(으)시-, 께서, respectful verbs and nouns.'),
    blocks: [
      { p: B('La politesse (-요, -ㅂ니다) s’adresse à la personne **à qui l’on parle**. L’honorifique, lui, élève la personne **dont on parle** : un aîné, un professeur, un client. On insère **-(으)시-** après le radical.', 'Politeness (-요, -ㅂ니다) is aimed at the person you are **talking to**. The honorific instead raises the person you are **talking about**: an elder, a teacher, a customer. Insert **-(으)시-** after the stem.') },
      { table: [[B('Forme', 'Form'), '가다', '읽다'], [B('Présent poli', 'Polite present'), '가세요', '읽으세요'], [B('Passé', 'Past'), '가셨어요', '읽으셨어요'], [B('Futur', 'Future'), '가실 거예요', '읽으실 거예요'], [B('Formel', 'Formal'), '가십니다', '읽으십니다']] },
      { p: B('Quelques verbes et noms ont une **forme de respect** à part :', 'A few verbs and nouns have a separate **respect form**:') },
      { table: [[B('Neutre', 'Plain'), B('Respect', 'Respectful'), B('Sens', 'Meaning')], ['먹다 / 마시다', '드시다, 잡수시다', B('manger / boire', 'eat / drink')], ['자다', '주무시다', B('dormir', 'sleep')], ['있다', '계시다', B('être là', 'be (somewhere)')], ['말하다', '말씀하시다', B('parler', 'speak')], ['죽다', '돌아가시다', B('mourir', 'pass away')], ['아프다', '편찮으시다', B('être malade', 'be unwell')], ['이름', '성함', B('nom', 'name')], ['나이', '연세', B('âge', 'age')], ['집', '댁', B('maison', 'home')], ['밥', '진지', B('repas', 'meal')], ['사람', '분', B('personne', 'person')]] },
      { p: B('Les particules changent aussi : 이/가 → **께서**, 은/는 → **께서는**, 에게 → **께**. À l’inverse, on s’abaisse soi-même avec **저** (au lieu de 나), **드리다** (donner), **뵙다** (voir), **여쭙다** (demander).', 'Particles change too: 이/가 → **께서**, 은/는 → **께서는**, 에게 → **께**. Conversely, you lower yourself with **저** (instead of 나), **드리다** (give), **뵙다** (see), **여쭙다** (ask).') },
      { ex: [['할머니께서 주무세요.', B('Grand-mère dort.', 'Grandmother is sleeping.')], ['선생님, 어디에 가세요?', B('Professeur, où allez-vous ?', 'Teacher, where are you going?')], ['성함이 어떻게 되세요?', B('Quel est votre nom ?', 'May I have your name?')], ['부모님께 선물을 드렸어요.', B('J’ai offert un cadeau à mes parents.', 'I gave my parents a present.')], ['처음 뵙겠습니다.', B('Enchanté(e) (première rencontre).', 'Pleased to meet you.')]] },
      { tip: B('On n’utilise jamais -(으)시- pour parler de soi. Et 있다 a deux honorifiques : **계시다** pour « être là » (선생님이 계세요), **있으시다** pour « avoir » (시간이 있으세요?).', 'Never use -(으)시- about yourself. And 있다 has two honorifics: **계시다** for “be present” (선생님이 계세요), **있으시다** for “have” (시간이 있으세요?).') },
    ],
  },
  {
    id: 'intention', cat: 'adv', glyph: '겠', title: B('Intention, promesse, supposition', 'Intention, promise, conjecture'),
    sum: B('-(으)려고 하다, -(으)ㄹ게요, -(으)ㄹ래요, -겠-.', '-(으)려고 하다, -(으)ㄹ게요, -(으)ㄹ래요, -겠-.'),
    blocks: [
      { table: [[B('Forme', 'Form'), B('Nuance', 'Nuance'), B('Exemple', 'Example')], ['-(으)ㄹ 거예요', B('futur neutre, prévision', 'neutral future, prediction'), '갈 거예요'], ['-(으)려고 해요', B('avoir l’intention de', 'intend to'), '가려고 해요'], ['-(으)ㄹ게요', B('promesse faite à l’autre', 'promise to the listener'), '갈게요'], ['-(으)ㄹ래요', B('ce dont j’ai envie ; « tu veux… ? »', 'what I feel like; “want to…?”'), '갈래요'], ['-겠-', B('volonté ferme ; supposition', 'firm intent; conjecture'), '가겠습니다'], ['-(으)ㄹ까 해요', B('je songe à', 'I’m thinking of'), '갈까 해요']] },
      { p: B('**-(으)ㄹ게요** tient compte de l’interlocuteur : c’est une réponse, un engagement. Il ne s’emploie qu’à la **première personne** et jamais dans une question.', '**-(으)ㄹ게요** takes the listener into account: it is a response, a commitment. It is used only in the **first person** and never in a question.') },
      { ex: [['제가 할게요.', B('Je m’en occupe.', 'I’ll do it.')], ['내일 전화할게요.', B('Je t’appelle demain (promis).', 'I’ll call you tomorrow.')], ['뭐 마실래요?', B('Tu veux boire quoi ?', 'What would you like to drink?')], ['저는 커피 마실래요.', B('Moi, je prendrai un café.', 'I’ll have a coffee.')], ['내년에 한국에 가려고 해요.', B('J’ai l’intention d’aller en Corée l’an prochain.', 'I intend to go to Korea next year.')]] },
      { p: B('**-겠-** exprime aussi une **supposition** à partir de ce qu’on voit ou entend, et figure dans des formules figées.', '**-겠-** also expresses a **guess** based on what you see or hear, and appears in set phrases.') },
      { ex: [['맛있겠다!', B('Ça a l’air bon !', 'That looks delicious!')], ['피곤하시겠어요.', B('Vous devez être fatigué(e).', 'You must be tired.')], ['알겠습니다.', B('C’est compris.', 'Understood.')], ['잘 먹겠습니다.', B('Formule avant de manger.', 'Said before eating.')], ['처음 뵙겠습니다.', B('Enchanté(e).', 'Pleased to meet you.')]] },
      { tip: B('-(으)려고 seul signifie « pour, dans le but de » : 책을 사려고 서점에 갔어요 (je suis allé à la librairie pour acheter un livre).', '-(으)려고 on its own means “in order to”: 책을 사려고 서점에 갔어요 (I went to the bookshop to buy a book).') },
    ],
  },
  {
    id: 'experience', cat: 'adv', glyph: '보다', title: B('Essayer, avoir déjà fait', 'Trying and past experience'),
    sum: B('-아/어 보다, -(으)ㄴ 적이 있다, et les verbes auxiliaires.', '-아/어 보다, -(으)ㄴ 적이 있다, and auxiliary verbs.'),
    blocks: [
      { p: B('**-아/어 보다** = « essayer de, faire pour voir ». Au passé, **-아/어 봤어요** signifie « j’ai déjà fait ». **-(으)ㄴ 적이 있어요 / 없어요** insiste sur l’expérience.', '**-아/어 보다** = “try doing, do and see”. In the past, **-아/어 봤어요** means “I have done before”. **-(으)ㄴ 적이 있어요 / 없어요** stresses the experience.') },
      { ex: [['이거 먹어 보세요.', B('Goûtez ça.', 'Try this.')], ['한번 입어 봐도 돼요?', B('Je peux l’essayer ?', 'May I try it on?')], ['김치를 먹어 봤어요?', B('Tu as déjà mangé du kimchi ?', 'Have you ever eaten kimchi?')], ['한국에 간 적이 있어요.', B('Je suis déjà allé(e) en Corée.', 'I have been to Korea.')], ['그런 말은 들은 적이 없어요.', B('Je n’ai jamais entendu ça.', 'I’ve never heard such a thing.')]] },
      { p: B('D’autres **verbes auxiliaires** se construisent de la même façon, sur la forme en -아/어 :', 'Other **auxiliary verbs** are built the same way, on the -아/어 form:') },
      { table: [[B('Forme', 'Form'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['-아/어 버리다', B('finir complètement (regret, soulagement)', 'do completely (regret, relief)'), '잊어버렸어요'], ['-아/어 놓다 / 두다', B('faire à l’avance, laisser en l’état', 'do in advance, leave as is'), '예약해 놓았어요'], ['-아/어 가다', B('aller en…, continuer', 'keep on, go on …ing'), '다 끝나 가요'], ['-아/어 오다', B('avoir fait jusqu’ici', 'have been …ing up to now'), '십 년 동안 일해 왔어요'], ['-고 말다', B('finir par (malgré soi)', 'end up (unintentionally)'), '울고 말았어요'], ['-아/어 내다', B('parvenir à', 'manage to'), '참아 냈어요']] },
      { ex: [['지갑을 잃어버렸어요.', B('J’ai perdu mon portefeuille.', 'I’ve lost my wallet.')], ['표를 미리 사 놓았어요.', B('J’ai acheté les billets à l’avance.', 'I bought the tickets in advance.')], ['숙제를 다 해 버렸어요.', B('J’ai fini tous mes devoirs.', 'I got all my homework done.')]] },
      { tip: B('가 봤어요 s’emploie pour une expérience quelconque ; 간 적이 있어요 pour quelque chose de notable. On ne dit pas -(으)ㄴ 적이 있다 pour un geste quotidien.', '가 봤어요 fits any experience; 간 적이 있어요 is for something notable. Don’t use -(으)ㄴ 적이 있다 for everyday routines.') },
    ],
  },
  {
    id: 'donner', cat: 'adv', glyph: '주다', title: B('Rendre service : -아/어 주다', 'Doing favours: -아/어 주다'),
    sum: B('주다, 드리다, 받다 et le sens de l’action.', '주다, 드리다, 받다 and the direction of the action.'),
    blocks: [
      { p: B('**-아/어 주다** indique qu’une action est faite **au bénéfice de quelqu’un**. Vers une personne à respecter, on emploie **-아/어 드리다**.', '**-아/어 주다** shows that an action is done **for someone’s benefit**. Towards a person you respect, use **-아/어 드리다**.') },
      { table: [[B('Forme', 'Form'), B('Sens', 'Meaning')], ['-아/어 주세요', B('faites … pour moi, s’il vous plaît', 'please do … for me')], ['-아/어 줄래요? / 주시겠어요?', B('tu veux bien… ? / voudriez-vous… ?', 'will you…? / would you…?')], ['-아/어 줄게요', B('je vais le faire pour toi', 'I’ll do it for you')], ['-아/어 드릴까요?', B('voulez-vous que je… ?', 'shall I … for you?')], ['-아/어 줘서 고마워요', B('merci d’avoir…', 'thank you for …ing')]] },
      { ex: [['사진 좀 찍어 주시겠어요?', B('Pourriez-vous nous prendre en photo ?', 'Would you take a photo for us?')], ['제가 도와 드릴게요.', B('Je vais vous aider.', 'Let me help you.')], ['친구가 한국어를 가르쳐 줬어요.', B('Mon ami m’a appris le coréen.', 'My friend taught me Korean.')], ['와 줘서 고마워요.', B('Merci d’être venu(e).', 'Thanks for coming.')], ['이것 좀 들어 줄래?', B('Tu peux me tenir ça ?', 'Can you hold this for me?')]] },
      { p: B('**받다** (recevoir) s’emploie avec **에게서 / 한테서** : 친구한테서 선물을 받았어요. Avec une personne respectée : **께** 받았어요.', '**받다** (to receive) is used with **에게서 / 한테서**: 친구한테서 선물을 받았어요. With a respected person: **께** 받았어요.') },
      { tip: B('**좀** adoucit une demande, comme « un peu » : 물 좀 주세요 est plus aimable que 물 주세요.', '**좀** softens a request, like “a bit”: 물 좀 주세요 is gentler than 물 주세요.') },
    ],
  },
  {
    id: 'temps-clauses', cat: 'adv', glyph: '때', title: B('Quand, avant, après, pendant', 'When, before, after, while'),
    sum: B('-(으)ㄹ 때, -기 전에, -(으)ㄴ 후에, -(으)면서, -자마자…', '-(으)ㄹ 때, -기 전에, -(으)ㄴ 후에, -(으)면서, -자마자…'),
    blocks: [
      { table: [[B('Forme', 'Form'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['-(으)ㄹ 때', B('quand', 'when'), '어릴 때'], ['-았/었을 때', B('quand (action achevée)', 'when (completed)'), '도착했을 때'], ['-기 전에', B('avant de', 'before'), '먹기 전에'], ['-(으)ㄴ 후에 / 다음에', B('après avoir', 'after'), '먹은 후에'], ['-고 나서', B('une fois … fait', 'once … is done'), '먹고 나서'], ['-(으)면서', B('tout en', 'while (same subject)'), '음악을 들으면서'], ['-는 동안', B('pendant que', 'during, while'), '기다리는 동안'], ['-자마자', B('dès que', 'as soon as'), '일어나자마자'], ['-(으)ㄴ 지', B('depuis que', 'since (time elapsed)'), '온 지 일 년'], ['-(으)ㄹ 때까지', B('jusqu’à ce que', 'until'), '올 때까지']] },
      { ex: [['시간이 있을 때 책을 읽어요.', B('Quand j’ai le temps, je lis.', 'When I have time, I read.')], ['자기 전에 이를 닦아요.', B('Je me brosse les dents avant de dormir.', 'I brush my teeth before sleeping.')], ['수업이 끝난 후에 만나요.', B('Voyons-nous après le cours.', 'Let’s meet after class.')], ['음악을 들으면서 공부해요.', B('J’étudie en écoutant de la musique.', 'I study while listening to music.')], ['집에 도착하자마자 잤어요.', B('Je me suis endormi(e) dès mon arrivée.', 'I fell asleep as soon as I got home.')], ['한국에 온 지 삼 년이 됐어요.', B('Cela fait trois ans que je suis en Corée.', 'It’s been three years since I came to Korea.')]] },
      { tip: B('Avec un nom : 식사 전에 (avant le repas), 수업 후에 (après le cours), 방학 때 (pendant les vacances), 방학 동안 (durant les vacances).', 'With a noun: 식사 전에 (before the meal), 수업 후에 (after class), 방학 때 (at holiday time), 방학 동안 (during the holidays).') },
    ],
  },
  {
    id: 'cause', cat: 'adv', glyph: '때문', title: B('La cause et le but', 'Cause and purpose'),
    sum: B('때문에, -기 때문에, 덕분에, -느라고, -(으)려고, -도록.', '때문에, -기 때문에, 덕분에, -느라고, -(으)려고, -도록.'),
    blocks: [
      { table: [[B('Forme', 'Form'), B('Nuance', 'Nuance'), B('Exemple', 'Example')], ['nom + 때문에', B('à cause de', 'because of'), '비 때문에'], ['-기 때문에', B('parce que (appuyé)', 'because (emphatic)'), '바쁘기 때문에'], ['nom + 덕분에', B('grâce à', 'thanks to'), '친구 덕분에'], ['-느라고', B('trop occupé à … pour', 'because I was busy …ing'), '일하느라고'], ['-(으)ㄴ/는 바람에', B('du fait que (imprévu, négatif)', 'as a result of (unexpected, bad)'), '늦게 일어나는 바람에'], ['-(으)려고', B('pour, dans le but de', 'in order to'), '사려고'], ['-기 위해(서)', B('afin de (soutenu)', 'in order to (formal)'), '배우기 위해서'], ['-도록', B('de façon que', 'so that'), '늦지 않도록']] },
      { ex: [['비 때문에 못 갔어요.', B('Je n’ai pas pu y aller à cause de la pluie.', 'I couldn’t go because of the rain.')], ['선생님 덕분에 합격했어요.', B('J’ai réussi grâce à mon professeur.', 'I passed thanks to my teacher.')], ['숙제를 하느라고 못 잤어요.', B('Je n’ai pas dormi, occupé(e) à faire mes devoirs.', 'I couldn’t sleep because I was doing homework.')], ['버스를 놓치는 바람에 늦었어요.', B('J’ai raté le bus, du coup je suis en retard.', 'I missed the bus, so I was late.')], ['늦지 않도록 일찍 출발하세요.', B('Partez tôt pour ne pas être en retard.', 'Leave early so that you’re not late.')]] },
      { p: B('Rappel : **-아서/어서** est la cause la plus neutre, **-(으)니까** la seule possible avec un ordre ou une proposition, **-기 때문에** la plus appuyée et la plus écrite.', 'Reminder: **-아서/어서** is the most neutral cause, **-(으)니까** the only one possible with a command or suggestion, **-기 때문에** the most emphatic and written.') },
      { tip: B('-느라고 exige le même sujet dans les deux propositions et une conséquence négative. Pour répondre à « pourquoi ? », on dit simplement **-아서/어서요** ou **-거든요**.', '-느라고 requires the same subject in both clauses and a negative outcome. To answer “why?”, simply say **-아서/어서요** or **-거든요**.') },
    ],
  },
  {
    id: 'conjecture', cat: 'adv', glyph: '같다', title: B('Supposer et donner son impression', 'Guessing and giving an impression'),
    sum: B('-(으)ㄴ/는 것 같다, -아/어 보이다, -나 보다, -(으)ㄹ지도 모르다.', '-(으)ㄴ/는 것 같다, -아/어 보이다, -나 보다, -(으)ㄹ지도 모르다.'),
    blocks: [
      { p: B('**것 같다** = « on dirait que, je crois que ». La terminaison devant 것 suit les règles du déterminatif.', '**것 같다** = “it seems, I think”. The ending before 것 follows the noun-modifier rules.') },
      { table: [['', B('Verbe', 'Verb'), B('Adjectif', 'Adjective')], [B('Passé', 'Past'), '온 것 같아요', '좋았던 것 같아요'], [B('Présent', 'Present'), '오는 것 같아요', '좋은 것 같아요'], [B('Futur', 'Future'), '올 것 같아요', '좋을 것 같아요']] },
      { ex: [['비가 올 것 같아요.', B('On dirait qu’il va pleuvoir.', 'It looks like it’s going to rain.')], ['그 사람은 학생인 것 같아요.', B('Je crois que c’est un étudiant.', 'I think that person is a student.')], ['좀 비싼 것 같아요.', B('Ça me semble un peu cher.', 'It seems a bit expensive.')]] },
      { table: [[B('Forme', 'Form'), B('Nuance', 'Nuance'), B('Exemple', 'Example')], ['-아/어 보이다', B('avoir l’air (à la vue)', 'look (by appearance)'), '피곤해 보여요'], ['-나 보다 / -(으)ㄴ가 보다', B('il faut croire que (indice)', 'it must be that (evidence)'), '자나 봐요'], ['-(으)ㄹ지도 모르다', B('il se peut que', 'might'), '올지도 몰라요'], ['-(으)ㄹ 텐데', B('ça doit…, alors', 'it must be…, so'), '바쁠 텐데'], ['-(으)ㄹ까요?', B('je me demande si', 'I wonder if'), '맛있을까요?'], ['-겠-', B('ça doit être…', 'that must be'), '재미있겠어요']] },
      { ex: [['오늘 기분이 좋아 보여요.', B('Tu as l’air de bonne humeur aujourd’hui.', 'You look happy today.')], ['불이 꺼져 있어요. 집에 없나 봐요.', B('C’est éteint. Il ne doit pas être chez lui.', 'The lights are off. He must not be home.')], ['내일은 늦을지도 몰라요.', B('Je serai peut-être en retard demain.', 'I might be late tomorrow.')]] },
      { tip: B('-(으)ㄴ/는 것 같아요 sert aussi à **adoucir une opinion** : 좀 어려운 것 같아요 est plus poli que 어려워요.', '-(으)ㄴ/는 것 같아요 also **softens an opinion**: 좀 어려운 것 같아요 is more polite than 어려워요.') },
    ],
  },
  {
    id: 'rapporte', cat: 'adv', glyph: '다고', title: B('Le discours rapporté', 'Reported speech'),
    sum: B('-다고, -냐고, -(으)라고, -자고 하다 et leurs contractions.', '-다고, -냐고, -(으)라고, -자고 하다 and their contractions.'),
    blocks: [
      { p: B('Pour rapporter des paroles, on met la phrase à la **forme neutre** suivie d’une marque qui dépend de son type, puis **하다** (ou 말하다, 묻다, 듣다…).', 'To report speech, put the sentence in the **plain form** followed by a marker that depends on its type, then **하다** (or 말하다, 묻다, 듣다…).') },
      { table: [[B('Type', 'Type'), B('Marque', 'Marker'), B('Exemple', 'Example')], [B('affirmation, verbe', 'statement, verb'), '-ㄴ/는다고', '간다고 / 먹는다고 해요'], [B('affirmation, adjectif', 'statement, adjective'), '-다고', '바쁘다고 해요'], [B('affirmation, nom', 'statement, noun'), '-(이)라고', '학생이라고 해요'], [B('passé', 'past'), '-았/었다고', '갔다고 해요'], [B('futur', 'future'), '-(으)ㄹ 거라고', '갈 거라고 해요'], [B('question', 'question'), '-냐고', '어디 가냐고 물었어요'], [B('ordre', 'command'), '-(으)라고', '오라고 했어요'], [B('interdiction', 'prohibition'), '-지 말라고', '가지 말라고 했어요'], [B('proposition', 'suggestion'), '-자고', '같이 가자고 했어요']] },
      { ex: [['민수 씨가 내일 온다고 했어요.', B('Minsu a dit qu’il viendrait demain.', 'Minsu said he’s coming tomorrow.')], ['친구가 이 영화가 재미있다고 했어요.', B('Mon ami a dit que ce film était bien.', 'My friend said this film is good.')], ['의사가 쉬라고 했어요.', B('Le médecin m’a dit de me reposer.', 'The doctor told me to rest.')], ['이름이 뭐냐고 물었어요.', B('Il m’a demandé mon nom.', 'He asked what my name was.')], ['저는 마르크라고 합니다.', B('Je m’appelle Marc.', 'My name is Marc.')]] },
      { p: B('À l’oral, **-다고 해요** se contracte en **-대요**, **-(이)라고 해요** en **-(이)래요**, **-냐고 해요** en **-냬요**, **-(으)라고 해요** en **-(으)래요**, **-자고 해요** en **-재요**.', 'In speech, **-다고 해요** contracts to **-대요**, **-(이)라고 해요** to **-(이)래요**, **-냐고 해요** to **-냬요**, **-(으)라고 해요** to **-(으)래요**, **-자고 해요** to **-재요**.') },
      { ex: [['내일 비가 온대요.', B('Il paraît qu’il pleuvra demain.', 'They say it will rain tomorrow.')], ['그 식당이 맛있대요.', B('Il paraît que ce restaurant est bon.', 'I hear that restaurant is good.')], ['엄마가 빨리 오래요.', B('Maman dit de venir vite.', 'Mum says to come quickly.')]] },
      { tip: B('« Donne-moi » rapporté devient **달라고** : 물을 달라고 했어요 (il m’a demandé de l’eau).', 'A reported “give me” becomes **달라고**: 물을 달라고 했어요 (he asked me for water).') },
    ],
  },
  {
    id: 'passif', cat: 'adv', glyph: '이히', title: B('Passif et causatif', 'Passive and causative'),
    sum: B('Les suffixes 이/히/리/기, -아/어지다, -게 하다.', 'The suffixes 이/히/리/기, -아/어지다, -게 하다.'),
    blocks: [
      { p: B('Le **passif** se forme, pour un nombre limité de verbes, avec un suffixe **-이-, -히-, -리-, -기-** qu’il faut apprendre avec chaque verbe. L’agent se marque par **에게 / 한테** ou **에 의해**.', 'The **passive** is formed, for a limited set of verbs, with a suffix **-이-, -히-, -리-, -기-** that must be learned with each verb. The agent is marked with **에게 / 한테** or **에 의해**.') },
      { table: [[B('Actif', 'Active'), B('Passif', 'Passive'), B('Sens', 'Meaning')], ['보다', '보이다', B('être visible', 'be seen')], ['쓰다', '쓰이다', B('être écrit, utilisé', 'be written, used')], ['잡다', '잡히다', B('être attrapé', 'be caught')], ['먹다', '먹히다', B('être mangé', 'be eaten')], ['열다', '열리다', B('s’ouvrir', 'be opened')], ['듣다', '들리다', B('s’entendre', 'be heard')], ['팔다', '팔리다', B('se vendre', 'be sold')], ['안다', '안기다', B('être pris dans les bras', 'be hugged')], ['끊다', '끊기다', B('être coupé', 'be cut off')]] },
      { p: B('Autres passifs : **-아/어지다** (만들어지다, 지어지다), et pour les verbes en 하다 : **되다** (사용되다), **받다** (사랑받다), **당하다** (subir : 사고를 당하다).', 'Other passives: **-아/어지다** (만들어지다, 지어지다), and for 하다 verbs: **되다** (사용되다), **받다** (사랑받다), **당하다** (suffer: 사고를 당하다).') },
      { ex: [['여기서 산이 보여요.', B('D’ici, on voit la montagne.', 'You can see the mountain from here.')], ['문이 안 열려요.', B('La porte ne s’ouvre pas.', 'The door won’t open.')], ['소리가 잘 안 들려요.', B('On n’entend pas bien.', 'I can’t hear well.')], ['이 건물은 백 년 전에 지어졌어요.', B('Ce bâtiment a été construit il y a cent ans.', 'This building was built a hundred years ago.')]] },
      { p: B('Le **causatif** (« faire faire ») utilise **-이-, -히-, -리-, -기-, -우-, -추-** pour certains verbes, ou **-게 하다** pour tous.', 'The **causative** (“make someone do”) uses **-이-, -히-, -리-, -기-, -우-, -추-** for certain verbs, or **-게 하다** for all of them.') },
      { table: [[B('Verbe', 'Verb'), B('Causatif', 'Causative'), B('Sens', 'Meaning')], ['먹다', '먹이다', B('nourrir', 'feed')], ['입다', '입히다', B('habiller', 'dress (someone)')], ['알다', '알리다', B('informer', 'inform')], ['웃다', '웃기다', B('faire rire', 'make laugh')], ['자다', '재우다', B('endormir', 'put to sleep')], ['서다', '세우다', B('arrêter, dresser', 'stop, stand up')], ['낮다', '낮추다', B('abaisser', 'lower')]] },
      { ex: [['아이에게 밥을 먹였어요.', B('J’ai donné à manger à l’enfant.', 'I fed the child.')], ['선생님이 학생들을 웃겼어요.', B('Le professeur a fait rire les élèves.', 'The teacher made the students laugh.')], ['엄마가 저를 일찍 자게 했어요.', B('Maman m’a fait coucher tôt.', 'Mum made me go to bed early.')]] },
      { tip: B('Certains suffixes servent aux deux : 보이다 = « être vu » et « montrer ». C’est la présence d’un objet en 을/를 qui tranche.', 'Some suffixes do both jobs: 보이다 = “be seen” and “show”. The presence of an object in 을/를 settles it.') },
    ],
  },
  {
    id: 'fins', cat: 'adv', glyph: '네요', title: B('Les nuances de fin de phrase', 'Sentence-ending nuances'),
    sum: B('-네요, -군요, -지요, -거든요, -잖아요, -는데요.', '-네요, -군요, -지요, -거든요, -잖아요, -는데요.'),
    blocks: [
      { p: B('Une grande part du ton passe par la terminaison. Ces formes s’ajoutent au radical et changent ce que la phrase « fait » plus que ce qu’elle dit.', 'A great deal of tone is carried by the ending. These forms attach to the stem and change what the sentence “does” more than what it says.') },
      { table: [[B('Forme', 'Form'), B('Effet', 'Effect'), B('Exemple', 'Example')], ['-네요', B('surprise, constat sur le moment', 'surprise, on-the-spot remark'), '맛있네요!'], ['-군요 / -는군요', B('découverte (plus posé)', 'realisation (more reserved)'), '그렇군요'], ['-지요 (죠)', B('« n’est-ce pas ? », évidence', '“isn’t it?”, shared knowledge'), '춥죠?'], ['-거든요', B('explication, « c’est que… »', 'explanation, “you see…”'), '바쁘거든요'], ['-잖아요', B('« tu sais bien que »', '“as you know”'), '말했잖아요'], ['-는데요 / -(으)ㄴ데요', B('réponse en suspens, attend une suite', 'trailing reply, invites a response'), '지금 없는데요'], ['-(으)ㄹ걸요', B('« je parie que »', '“I bet”'), '아마 올걸요'], ['-더라고요', B('« j’ai constaté que »', '“I found that”'), '맛있더라고요']] },
      { ex: [['한국어를 잘하시네요!', B('Vous parlez bien coréen, dites donc !', 'Your Korean is good!')], ['오늘 날씨가 좋죠?', B('Il fait beau aujourd’hui, hein ?', 'Nice weather today, isn’t it?')], ['못 가요. 내일 시험이 있거든요.', B('Je ne peux pas. C’est que j’ai un examen demain.', 'I can’t go. I have an exam tomorrow, you see.')], ['제가 어제 말했잖아요.', B('Je te l’ai dit hier, enfin.', 'I told you yesterday, didn’t I.')], ['그 식당에 가 봤는데 맛있더라고요.', B('J’ai testé ce restaurant, c’était bon.', 'I tried that restaurant and found it was good.')]] },
      { tip: B('-지요 s’emploie aussi pour proposer poliment (같이 가시죠) ou confirmer une évidence (그렇죠 = « exactement »).', '-지요 is also used for polite suggestions (같이 가시죠) or to confirm the obvious (그렇죠 = “exactly”).') },
    ],
  },
  {
    id: 'neutre', cat: 'adv', glyph: 'ㄴ다', title: B('Le style neutre et l’écrit', 'The plain style and written Korean'),
    sum: B('-ㄴ다 / -는다, -다, -(으)ㄴ가 : journaux, livres, journal intime.', '-ㄴ다 / -는다, -다, -(으)ㄴ가: newspapers, books, diaries.'),
    blocks: [
      { p: B('Les livres, les articles, les dissertations et les journaux intimes s’écrivent au **style neutre** (해라체), qui ne s’adresse à personne en particulier. C’est aussi la base du discours rapporté.', 'Books, articles, essays and diaries are written in the **plain style** (해라체), addressed to no one in particular. It is also the basis of reported speech.') },
      { table: [['', B('Verbe', 'Verb'), B('Adjectif', 'Adjective'), B('Nom', 'Noun')], [B('Présent', 'Present'), '간다 / 먹는다', '크다', '학생이다'], [B('Passé', 'Past'), '갔다 / 먹었다', '컸다', '학생이었다'], [B('Futur', 'Future'), '갈 것이다', '클 것이다', '학생일 것이다'], [B('Négatif', 'Negative'), '가지 않는다', '크지 않다', '학생이 아니다'], [B('Question', 'Question'), '가는가? / 가니?', '큰가?', '학생인가?'], [B('Ordre', 'Command'), '가라 / 가거라', '—', '—'], [B('Proposition', 'Suggestion'), '가자', '—', '—']] },
      { ex: [['나는 매일 아침 커피를 마신다.', B('Je bois du café chaque matin.', 'I drink coffee every morning.')], ['오늘은 날씨가 맑다.', B('Aujourd’hui, le temps est clair.', 'The weather is clear today.')], ['서울은 한국의 수도이다.', B('Séoul est la capitale de la Corée.', 'Seoul is the capital of Korea.')], ['어제 친구를 만났다.', B('Hier, j’ai vu un ami.', 'I met a friend yesterday.')]] },
      { p: B('À l’écrit, **나** remplace 저, **이다** n’est pas contracté, et l’on préfère 와/과, 에게, -(으)며 (au lieu de -고), -(으)나 (au lieu de -지만), -(으)므로 (au lieu de -아서).', 'In writing, **나** replaces 저, **이다** is not contracted, and 와/과, 에게, -(으)며 (instead of -고), -(으)나 (instead of -지만), -(으)므로 (instead of -아서) are preferred.') },
      { tip: B('À l’oral, ce même style sert d’exclamation pour soi-même : 맛있다! (c’est bon !), 춥다! (qu’il fait froid !), 예쁘다! (c’est joli !).', 'In speech, the same style serves as an exclamation to oneself: 맛있다! (delicious!), 춥다! (it’s cold!), 예쁘다! (pretty!).') },
    ],
  },
  {
    id: 'conditions', cat: 'adv', glyph: '면', title: B('Conditions et concessions', 'Conditions and concessions'),
    sum: B('-(으)면, -ㄴ/는다면, -아/어도, -(으)려면, -았/었으면 좋겠다.', '-(으)면, -ㄴ/는다면, -아/어도, -(으)려면, -았/었으면 좋겠다.'),
    blocks: [
      { table: [[B('Forme', 'Form'), B('Sens', 'Meaning'), B('Exemple', 'Example')], ['-(으)면', B('si, quand', 'if, when'), '비가 오면'], ['-ㄴ/는다면', B('si jamais (hypothèse)', 'if (hypothetical)'), '복권에 당첨된다면'], ['-았/었다면', B('si … avait (irréel passé)', 'if … had (unreal past)'), '알았다면'], ['-(으)려면', B('si on veut…', 'if you want to'), '가려면'], ['-아/어도', B('même si', 'even if'), '비가 와도'], ['아무리 -아/어도', B('avoir beau', 'no matter how'), '아무리 바빠도'], ['-(으)ㄹ수록', B('plus … plus', 'the more … the more'), '하면 할수록'], ['-았/었으면 좋겠다', B('j’aimerais que', 'I wish, I hope'), '쉬었으면 좋겠어요'], ['-아/어야', B('seulement si', 'only if'), '먹어야 살아요']] },
      { ex: [['시청에 가려면 몇 번 버스를 타야 해요?', B('Pour aller à la mairie, quel bus faut-il prendre ?', 'Which bus do I take to get to City Hall?')], ['비가 와도 갈 거예요.', B('J’irai même s’il pleut.', 'I’ll go even if it rains.')], ['아무리 바빠도 밥은 먹어야죠.', B('Si occupé qu’on soit, il faut bien manger.', 'However busy you are, you have to eat.')], ['한국어는 하면 할수록 재미있어요.', B('Plus on pratique le coréen, plus c’est intéressant.', 'The more Korean you do, the more fun it gets.')], ['내일 날씨가 좋았으면 좋겠어요.', B('J’espère qu’il fera beau demain.', 'I hope the weather is nice tomorrow.')], ['미리 알았다면 도와줬을 거예요.', B('Si je l’avais su, je t’aurais aidé(e).', 'If I had known, I would have helped.')]] },
      { tip: B('-(으)면 couvre à la fois « si » et « quand » : 집에 도착하면 전화해 주세요 (appelez-moi quand vous arrivez). Pour une action déjà réalisée, on dit -(으)니까 ou -았/었을 때.', '-(으)면 covers both “if” and “when”: 집에 도착하면 전화해 주세요 (call me when you get home). For an action already done, use -(으)니까 or -았/었을 때.') },
    ],
  },
];

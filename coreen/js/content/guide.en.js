// Korean guide in English (same lessons and examples as guide.js).

export const GUIDE_EN = [
  // ================= PRONUNCIATION =================
  {
    id: 'syllabe', cat: 'pron', glyph: '한', title: 'Reading a syllable',
    sum: 'How letters are grouped into blocks.',
    blocks: [
      { p: 'Korean isn’t written letter by letter in a line: letters are grouped into **blocks**, one block = one syllable. Each block always contains **a consonant + a vowel**, and sometimes **a final consonant** (the *batchim*).' },
      { table: [['Block', 'Letters', 'Sound'], ['가', 'ㄱ + ㅏ', 'ga'], ['한', 'ㅎ + ㅏ + ㄴ', 'han'], ['국', 'ㄱ + ㅜ + ㄱ', 'guk'], ['읽', 'ㅇ + ㅣ + ㄺ', 'ik']] },
      { p: 'Read from **left to right**, then from **top to bottom**.' },
      { tip: 'Vertical vowel (ㅏ ㅓ ㅣ…) → the consonant goes **on the left**: 가. Horizontal vowel (ㅗ ㅜ ㅡ…) → the consonant goes **on top**: 고.' },
      { ex: [['가', 'syllable “ga”'], ['고', 'syllable “go”'], ['한국', 'Korea'], ['사람', 'person']] },
    ],
  },
  {
    id: 'ieung', cat: 'pron', glyph: 'ㅇ', title: 'The letter ㅇ: silent or “ng”',
    sum: 'One letter, two roles depending on its place.',
    blocks: [
      { p: 'A syllable must start with a consonant. When it starts with a vowel sound, you write **ㅇ, which is then silent**.' },
      { p: 'In **final position**, ㅇ is pronounced **“ng”**, as in *sing*.' },
      { ex: [['아이', 'child'], ['우유', 'milk'], ['강', 'river'], ['영어', 'English'], ['사랑', 'love']] },
      { tip: 'ㅇ at the start = nothing. ㅇ at the end = “ng”.' },
    ],
  },
  {
    id: 'series', cat: 'pron', glyph: 'ㄱㅋㄲ', title: 'Plain, aspirated and tense',
    sum: 'The difference between 가, 카 and 까.',
    blocks: [
      { p: 'Several consonants come in **three versions**. English doesn’t make this distinction, but it changes the meaning of words.' },
      { table: [['Plain', 'Aspirated', 'Tense'], ['ㄱ', 'ㅋ', 'ㄲ'], ['ㄷ', 'ㅌ', 'ㄸ'], ['ㅂ', 'ㅍ', 'ㅃ'], ['ㅈ', 'ㅊ', 'ㅉ'], ['ㅅ', '—', 'ㅆ']] },
      { p: '**Plain**: a light breath, relaxed sound. **Aspirated**: a strong puff of air, as if blowing out a candle. **Tense**: no air at all, throat and tongue tightened, like the “p” in “spin”.' },
      { ex: [['가', 'plain'], ['카', 'aspirated'], ['까', 'tense'], ['달', 'moon'], ['탈', 'mask'], ['딸', 'daughter'], ['불', 'fire'], ['풀', 'grass'], ['뿔', 'horn']] },
      { tip: 'Hold your hand in front of your mouth: lots of air for aspirated, a little for plain, none for tense.' },
    ],
  },
  {
    id: 'sonores', cat: 'pron', glyph: 'ㄱ', title: 'ㄱ ㄷ ㅂ ㅈ between two vowels',
    sum: 'Why ㄱ sounds like “k” sometimes and “g” other times.',
    blocks: [
      { p: 'The plain consonants ㄱ ㄷ ㅂ ㅈ are almost **voiceless at the start of a word** (close to “k, t, p, ch”) but become **voiced between two vowels** (“g, d, b, j”).' },
      { ex: [['고기', 'meat'], ['바다', 'sea'], ['아버지', 'father'], ['부부', 'married couple']] },
      { tip: 'In 고기, the first ㄱ sounds almost like “k” and the second clearly like “g”. It happens naturally: just listen and imitate.' },
    ],
  },
  {
    id: 'finales', cat: 'pron', glyph: '받침', title: 'Final consonants (batchim)',
    sum: 'Only 7 possible sounds at the end of a syllable.',
    blocks: [
      { p: 'Many consonants can be written at the end of a syllable, but **only 7 sounds exist** there. The consonant isn’t “released”: the mouth closes with no final puff.' },
      { table: [['Sound', 'Final letters'], ['k', 'ㄱ ㅋ ㄲ'], ['n', 'ㄴ'], ['t', 'ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ'], ['l', 'ㄹ'], ['m', 'ㅁ'], ['p', 'ㅂ ㅍ'], ['ng', 'ㅇ']] },
      { ex: [['옷', 'clothes', '옫'], ['낮', 'daytime', '낟'], ['부엌', 'kitchen', '부억'], ['앞', 'front', '압'], ['꽃', 'flower', '꼳']] },
      { tip: 'ㅅ, ㅈ, ㅊ, ㅌ, ㅎ at the end all sound like a held-back “t”.' },
    ],
  },
  {
    id: 'liaison', cat: 'pron', glyph: '연음', title: 'Linking',
    sum: 'When the final consonant slides into the next syllable.',
    blocks: [
      { p: 'If a syllable ends in a consonant and the next one starts with a **silent ㅇ**, the final consonant **moves over** and is pronounced at the start of the next syllable.' },
      { ex: [['한국어', 'Korean (language)', '한구거'], ['음악', 'music', '으막'], ['옷을', 'the clothes (object)', '오슬'], ['맛있어요', 'it’s delicious', '마시써요'], ['읽어요', 'I read', '일거요']] },
      { p: 'With a double final consonant (ㄺ, ㄳ…), only **the second one** slides over: 읽어요 → [일거요].' },
      { tip: 'A final ㅇ (“ng”) never slides: 영어 is read [영어].' },
    ],
  },
  {
    id: 'hieut', cat: 'pron', glyph: 'ㅎ', title: 'What ㅎ does',
    sum: 'ㅎ strengthens or disappears.',
    blocks: [
      { p: '**ㅎ + ㄱ ㄷ ㅈ** (or the reverse) → they merge into the **aspirated** consonant ㅋ ㅌ ㅊ.' },
      { ex: [['좋다', 'to be good', '조타'], ['축하해요', 'congratulations', '추카해요'], ['입학', 'school admission', '이팍'], ['놓고', 'putting down', '노코']] },
      { p: '**Final ㅎ before a vowel** → it **disappears**.' },
      { ex: [['좋아요', 'it’s good', '조아요'], ['많이', 'a lot', '마니'], ['괜찮아요', 'it’s okay', '괜차나요']] },
      { tip: 'Never pronounce the final ㅎ of 좋아요: say “jo-a-yo”.' },
    ],
  },
  {
    id: 'nasal', cat: 'pron', glyph: '니다', title: 'Nasalization',
    sum: 'Why 합니다 sounds like “ham-ni-da”.',
    blocks: [
      { p: 'A final **k, t, p** sound before **ㄴ or ㅁ** becomes **nasal**: k → ng, t → n, p → m. It’s one of the most frequent rules, since it affects every -ㅂ니다 ending.' },
      { table: [['Before ㄴ / ㅁ', 'becomes'], ['k (ㄱ…)', 'ng (ㅇ)'], ['t (ㄷ ㅅ ㅆ…)', 'n (ㄴ)'], ['p (ㅂ ㅍ)', 'm (ㅁ)']] },
      { ex: [['합니다', 'I do (formal)', '함니다'], ['감사합니다', 'thank you', '감사함니다'], ['작년', 'last year', '장년'], ['국물', 'broth', '궁물'], ['있는', 'that is / that has', '인는']] },
      { tip: 'Every formal verb in -습니다 sounds like “-seum-ni-da”: 먹습니다 → [먹씀니다].' },
    ],
  },
  {
    id: 'rieul', cat: 'pron', glyph: 'ㄹ', title: 'The letter ㄹ: r or l',
    sum: 'A sound between “r” and “l”.',
    blocks: [
      { p: 'Between two vowels, ㄹ is a very light **flapped “r”** (the tongue taps the roof of the mouth once). At the end of a syllable, it’s an **“l”**.' },
      { ex: [['사랑', 'love'], ['나라', 'country'], ['서울', 'Seoul'], ['말', 'word / horse']] },
      { p: '**ㄴ + ㄹ** or **ㄹ + ㄴ** → both become **“ll”**. After other consonants, ㄹ is read **ㄴ**.' },
      { ex: [['신라', 'Silla kingdom', '실라'], ['설날', 'Lunar New Year', '설랄'], ['연락', 'contact', '열락'], ['심리', 'psychology', '심니'], ['정류장', 'bus stop', '정뉴장']] },
    ],
  },
  {
    id: 'tension', cat: 'pron', glyph: 'ㄲ', title: 'Consonants that tense up',
    sum: '학교 sounds like “hak-kkyo”.',
    blocks: [
      { p: 'After a final **k, t or p** sound, the plain consonants ㄱ ㄷ ㅂ ㅅ ㅈ become **tense** (ㄲ ㄸ ㅃ ㅆ ㅉ). You can’t see it in writing or romanization, only hear it.' },
      { ex: [['학교', 'school', '학꾜'], ['식당', 'restaurant', '식땅'], ['학생', 'student', '학쌩'], ['국밥', 'rice soup', '국빱'], ['잡지', 'magazine', '잡찌']] },
      { tip: 'It comes naturally: after a held-back “k” or “p”, the next consonant comes out sharper.' },
    ],
  },
  {
    id: 'palatal', cat: 'pron', glyph: '같이', title: 'ㄷ / ㅌ before 이',
    sum: '같이 sounds like “ga-chi”.',
    blocks: [
      { p: 'A final **ㄷ** or **ㅌ** followed by **이** becomes **ㅈ** or **ㅊ**.' },
      { ex: [['같이', 'together', '가치'], ['굳이', 'insistently', '구지'], ['해돋이', 'sunrise', '해도지']] },
    ],
  },
  {
    id: 'voyelles', cat: 'pron', glyph: 'ㅐㅔ', title: 'Vowels that sound alike',
    sum: 'ㅐ and ㅔ, and the three ways to read ㅢ.',
    blocks: [
      { p: 'In today’s Korean, **ㅐ and ㅔ** sound almost the same (“e” as in “bed”). Same for **ㅙ, ㅚ and ㅞ** (“we”). Context tells them apart.' },
      { ex: [['개', 'dog'], ['게', 'crab'], ['왜', 'why'], ['외국', 'foreign country']] },
      { p: '**ㅢ** has three readings: **“eu-i”** at the start of a word, **“i”** after a consonant, and **“e”** for the particle 의 (“of”).' },
      { ex: [['의사', 'doctor'], ['희망', 'hope', '히망'], ['나의 친구', 'my friend', '나에 친구']] },
    ],
  },
  {
    id: 'si', cat: 'pron', glyph: '시', title: 'ㅅ before ㅣ: “shi”',
    sum: '시 isn’t read “si”.',
    blocks: [
      { p: 'Before **ㅣ** (and ㅑ ㅕ ㅛ ㅠ), **ㅅ** is pronounced **“sh”**.' },
      { ex: [['시간', 'time, hour'], ['신발', 'shoes'], ['시장', 'market'], ['다시', 'again']] },
    ],
  },
  {
    id: 'rythme', cat: 'pron', glyph: '♪', title: 'Rhythm and intonation',
    sum: 'No word stress, even syllables.',
    blocks: [
      { p: 'Korean has **no word stress**: every syllable has roughly the same length and strength. Don’t stress one syllable like in English.' },
      { p: 'A **question** is mostly recognized by the **rising intonation** at the end, since the ending is often the same as a statement.' },
      { ex: [['밥 먹어요.', 'I’m eating.'], ['밥 먹어요?', 'Are you eating?']] },
      { tip: 'Listen to generated sentences at a slow speed (Settings → voice speed) and repeat them, copying the melody.' },
    ],
  },

  // ================= GRAMMAR =================
  {
    id: 'ordre', cat: 'gram', glyph: 'SOV', title: 'Word order',
    sum: 'The verb always comes last.',
    blocks: [
      { p: 'English says **subject – verb – object**. Korean says **subject – object – verb**: the verb always ends the sentence.' },
      { table: [['Subject', 'Object', 'Verb'], ['저는', '빵을', '먹어요'], ['I', 'bread', 'eat']] },
      { p: 'Time and place usually come before the object. **Particles** show each word’s role, so the order is fairly flexible, except for the verb.' },
      { ex: [['저는 빵을 먹어요.', 'I eat bread.'], ['저는 어제 집에서 영화를 봤어요.', 'Yesterday, I watched a movie at home.']] },
      { tip: 'The subject is often dropped when it’s obvious: “빵을 먹어요” is enough to say “I eat bread”.' },
    ],
  },
  {
    id: 'theme', cat: 'gram', glyph: '은는', title: 'Topic 은/는 and subject 이/가',
    sum: 'Two subject particles, two nuances.',
    blocks: [
      { p: '**은/는** marks the **topic**: what you’re talking about, “as for…”. **이/가** marks the **grammatical subject**, often new or emphasized information.' },
      { table: [['After…', 'Topic', 'Subject'], ['consonant', '은', '이'], ['vowel', '는', '가']] },
      { ex: [['저는 학생이에요.', 'I’m a student.'], ['책은 재미있어요.', 'The book (as for it) is interesting.'], ['누가 왔어요?', 'Who came?'], ['친구가 왔어요.', 'My friend is the one who came.'], ['날씨가 좋아요.', 'The weather is nice.']] },
      { tip: 'To introduce yourself or talk about a general topic: 은/는. To answer “who? / what?” or describe a situation: 이/가.' },
    ],
  },
  {
    id: 'objet', cat: 'gram', glyph: '을를', title: 'The object particle 을/를',
    sum: 'What the action is done to.',
    blocks: [
      { p: '**을** after a consonant, **를** after a vowel. The particle goes after the noun receiving the action.' },
      { ex: [['책을 읽어요.', 'I read a book.'], ['커피를 마셔요.', 'I drink coffee.'], ['한국어를 배워요.', 'I learn Korean.']] },
      { tip: 'In speech, 을/를 is often dropped: “커피 마셔요”.' },
    ],
  },
  {
    id: 'lieu', cat: 'gram', glyph: '에', title: 'Places: 에 or 에서',
    sum: 'Going somewhere or doing something somewhere.',
    blocks: [
      { p: '**에** marks a **destination** (go, come), a **time** or where something **is** (있다). **에서** marks where an **action takes place**, or a starting point (“from”).' },
      { ex: [['학교에 가요.', 'I go to school.'], ['집에 있어요.', 'I’m at home.'], ['세 시에 만나요.', 'Let’s meet at 3.'], ['학교에서 공부해요.', 'I study at school.'], ['프랑스에서 왔어요.', 'I’m from France.']] },
      { tip: 'Moving toward a place or being there = 에. Doing something there = 에서.' },
    ],
  },
  {
    id: 'etre', cat: 'gram', glyph: '이에요', title: '“To be”: 이에요 / 예요',
    sum: 'Saying what something is.',
    blocks: [
      { p: 'To say “it’s…” or “I am…” followed by a noun, add **이에요** after a consonant and **예요** after a vowel. The negative is **아니에요**, with 이/가 on the noun.' },
      { ex: [['학생이에요.', 'I’m a student.'], ['의사예요.', 'I’m a doctor.'], ['이거 커피예요?', 'Is this coffee?'], ['학생이 아니에요.', 'I’m not a student.']] },
      { tip: 'Don’t use 이에요 with adjectives (“to be big”, “to be good”): Korean adjectives conjugate like verbs (좋아요, 커요).' },
    ],
  },
  {
    id: 'present', cat: 'gram', glyph: '아요', title: 'Polite present: -아요 / -어요',
    sum: 'The basic conjugation to know by heart.',
    blocks: [
      { p: 'Remove **다** from the verb to get the **stem**, then look at its **last vowel**:' },
      { table: [['Last vowel', 'Ending', 'Example'], ['ㅏ or ㅗ', '-아요', '살다 → 살아요'], ['other', '-어요', '먹다 → 먹어요'], ['하다', '해요', '공부하다 → 공부해요']] },
      { p: 'When the stem ends in a vowel, the two vowels **merge**:' },
      { ex: [['가요', '가 + 아요 → I go'], ['와요', '오 + 아요 → I come'], ['마셔요', '마시 + 어요 → I drink'], ['배워요', '배우 + 어요 → I learn'], ['봐요', '보 + 아요 → I watch']] },
      { tip: 'The same word works for I, you, he, we…: 먹어요 = I eat, you eat, he eats, depending on context.' },
    ],
  },
  {
    id: 'politesse', cat: 'gram', glyph: '요', title: 'Politeness levels',
    sum: 'Formal, polite or casual: choose by who you’re talking to.',
    blocks: [
      { p: 'The verb ending changes depending on who you’re speaking to.' },
      { table: [['Style', 'Example', 'When?'], ['Formal', '먹습니다', 'work, announcements, speeches'], ['Polite', '먹어요', 'most situations'], ['Casual', '먹어', 'close friends, younger people']] },
      { p: 'The **formal** style uses **-ㅂ니다** after a vowel (갑니다) and **-습니다** after a consonant (먹습니다). For a question: -ㅂ니까 / -습니까. The **casual** style is the polite form without 요.' },
      { ex: [['감사합니다.', 'Thank you (formal).'], ['고마워요.', 'Thank you (polite).'], ['고마워.', 'Thanks (casual).']] },
      { tip: 'When in doubt, use the polite -요 style: it never offends anyone.' },
    ],
  },
  {
    id: 'passe', cat: 'gram', glyph: '었', title: 'Past: -았어요 / -었어요',
    sum: 'Same vowel rule as the present.',
    blocks: [
      { p: 'Take the present form without 요, add **ㅆ** as a final consonant, then **어요**.' },
      { table: [['Present', 'Past'], ['가요', '갔어요'], ['먹어요', '먹었어요'], ['해요', '했어요'], ['마셔요', '마셨어요']] },
      { ex: [['어제 영화를 봤어요.', 'Yesterday, I watched a movie.'], ['밥을 먹었어요?', 'Have you eaten?']] },
      { tip: '“밥 먹었어요?” (“have you eaten?”) is a very common greeting in Korea.' },
    ],
  },
  {
    id: 'futur', cat: 'gram', glyph: '거예요', title: 'Future: -(으)ㄹ 거예요',
    sum: 'Talking about what you’re going to do.',
    blocks: [
      { p: 'Stem + **ㄹ 거예요** after a vowel, + **을 거예요** after a consonant. If the stem already ends in ㄹ, just add 거예요.' },
      { ex: [['내일 갈 거예요.', 'I’ll go tomorrow.'], ['피자를 먹을 거예요.', 'I’m going to eat pizza.'], ['케이크를 만들 거예요.', 'I’m going to make a cake.']] },
      { tip: 'Casual: -(으)ㄹ 거야. Formal: -(으)ㄹ 겁니다.' },
    ],
  },
  {
    id: 'negation', cat: 'gram', glyph: '안', title: 'Negation: 안 and -지 않다',
    sum: 'Two ways to say “not”.',
    blocks: [
      { p: '**Short form**: **안** right before the verb. For “noun + 하다” verbs, 안 goes before 하다.' },
      { ex: [['안 먹어요.', 'I don’t eat.'], ['안 바빠요.', 'I’m not busy.'], ['공부 안 해요.', 'I don’t study.']] },
      { p: '**Long form**: stem + **-지 않아요**. A bit more formal, and it works with every verb.' },
      { ex: [['먹지 않아요.', 'I don’t eat.'], ['공부하지 않아요.', 'I don’t study.']] },
      { tip: 'Some verbs have their own opposite: 있다 → **없다** (not to have), 알다 → **모르다** (not to know), 맛있다 → **맛없다** (to taste bad).' },
    ],
  },
  {
    id: 'envie', cat: 'gram', glyph: '싶다', title: 'Wanting: -고 싶어요',
    sum: 'Saying what you want to do.',
    blocks: [
      { p: 'Stem + **-고 싶어요** = “I want to…”. For **someone else’s** wish, use **-고 싶어해요**.' },
      { ex: [['한국에 가고 싶어요.', 'I want to go to Korea.'], ['뭐 먹고 싶어요?', 'What do you want to eat?'], ['친구는 쉬고 싶어해요.', 'My friend wants to rest.']] },
      { tip: 'Past: 가고 싶었어요 (“I wanted to go”). Negative: 가고 싶지 않아요.' },
    ],
  },
  {
    id: 'questions', cat: 'gram', glyph: '뭐', title: 'Asking questions',
    sum: 'Intonation and question words.',
    blocks: [
      { p: 'A yes/no question keeps the same form as a statement, with **rising intonation**. Question words go where the answer would be.' },
      { table: [['Korean', 'English'], ['뭐 / 무엇', 'what'], ['누구', 'who'], ['어디', 'where'], ['언제', 'when'], ['왜', 'why'], ['어떻게', 'how'], ['얼마', 'how much (price)']] },
      { ex: [['어디에 가요?', 'Where are you going?'], ['이거 뭐예요?', 'What is this?'], ['얼마예요?', 'How much is it?'], ['왜 늦었어요?', 'Why are you late?']] },
    ],
  },
  {
    id: 'irreguliers', cat: 'gram', glyph: 'ㅂㄷ', title: 'Irregular verbs',
    sum: 'The main families to recognize.',
    blocks: [
      { table: [['Family', 'Dictionary', 'Polite present'], ['ㅂ → 우', '맵다 (spicy)', '매워요'], ['ㄷ → ㄹ', '듣다 (listen)', '들어요'], ['ㅡ drops', '바쁘다 (busy)', '바빠요'], ['르 → ㄹㄹ', '모르다 (not know)', '몰라요'], ['ㄹ drops', '만들다 (make)', '만듭니다']] },
      { p: 'These changes only happen before a vowel (-아요, -어요, -을…). Before a consonant, the stem stays regular: 맵고, 듣고, 모르고.' },
      { ex: [['더워요', 'it’s hot (덥다)'], ['걸어요', 'I walk (걷다)'], ['써요', 'I write (쓰다)'], ['빨라요', 'it’s fast (빠르다)']] },
      { tip: 'No need to learn them all at once: learn common verbs one by one and the families will become obvious.' },
    ],
  },
  {
    id: 'nombres', cat: 'gram', glyph: '일 하나', title: 'The two number systems',
    sum: 'Sino-Korean or native Korean?',
    blocks: [
      { table: [['', '1', '2', '3', '4', '5', '10'], ['Sino-Korean', '일', '이', '삼', '사', '오', '십'], ['Native', '하나', '둘', '셋', '넷', '다섯', '열']] },
      { p: '**Sino-Korean**: dates, money, minutes, phone numbers, floors. **Native**: counting things or people, age, hours.' },
      { p: 'Before a counter, 하나, 둘, 셋 and 넷 shorten to **한, 두, 세, 네**.' },
      { ex: [['사과 두 개', 'two apples'], ['세 시', 'three o’clock'], ['삼십 분', 'thirty minutes'], ['만 원', '10,000 won'], ['스무 살', '20 years old']] },
      { tip: 'Telling the time mixes both: 세 시 삼십 분 = 3:30 (hours in native, minutes in Sino-Korean).' },
    ],
  },
];

// Japanese guide in English (same lessons and examples as guide.ja.js).

export const GUIDE_JA_EN = [
  // ================= PRONUNCIATION =================
  {
    id: 'ecritures', cat: 'pron', glyph: 'あア字', title: 'Three writing systems',
    sum: 'Hiragana, katakana and kanji: what each one is for.',
    blocks: [
      { p: 'Japanese mixes **three scripts** in the same sentence. **Hiragana** is used for grammar (particles, endings) and common words. **Katakana** is used for foreign words and names. **Kanji** (Chinese characters) carry the meaning of words.' },
      { table: [['Script', 'Example', 'Use'], ['Hiragana', 'たべます', 'grammar, common words'], ['Katakana', 'コーヒー', 'foreign words'], ['Kanji', '食', 'word meaning']] },
      { ex: [['私はコーヒーを飲みます。', 'I drink coffee.', 'わたしはこーひーをのみます。']] },
      { tip: 'Start with hiragana: with them you can already write everything. The small characters above kanji (furigana) show how to read them.' },
    ],
  },
  {
    id: 'voyelles', cat: 'pron', glyph: 'あいう', title: 'The five vowels',
    sum: 'Simple, regular sounds.',
    blocks: [
      { p: 'Japanese has only **five vowels**: a, i, u, e, o. They always sound the same. **u** is light, with barely rounded lips, and **e** sounds like the “e” in “pet”.' },
      { p: 'Each kana stands for **one syllable** (except ん and small characters), and each syllable lasts about the same time.' },
      { ex: [['あい', 'love'], ['いえ', 'house'], ['うえ', 'above'], ['あおい', 'blue']] },
      { tip: 'Don’t turn vowels into diphthongs: “e” is never “ay”, “o” is never “ow”.' },
    ],
  },
  {
    id: 'dakuten', cat: 'pron', glyph: 'か゛', title: 'The small marks ゛ and ゜',
    sum: 'How か becomes が.',
    blocks: [
      { p: 'Two small strokes **゛ (dakuten)** make the consonant **voiced**: k → g, s → z, t → d, h → b. A small circle **゜ (handakuten)**, only on the は row, gives a **p**.' },
      { table: [['Base', '゛', '゜'], ['か ka', 'が ga', '—'], ['さ sa', 'ざ za', '—'], ['た ta', 'だ da', '—'], ['は ha', 'ば ba', 'ぱ pa']] },
      { ex: [['かき', 'persimmon'], ['かぎ', 'key'], ['はん', 'half'], ['ぱん', 'bread (in hiragana)']] },
    ],
  },
  {
    id: 'tsu', cat: 'pron', glyph: 'っ', title: 'Small っ: double consonants',
    sum: 'A short pause that changes the meaning.',
    blocks: [
      { p: 'A **small っ** (or ッ in katakana) marks a **one-beat pause** before the next consonant, which is doubled in rōmaji.' },
      { ex: [['きて', 'come', 'きて'], ['きって', 'stamp', 'きって'], ['がっこう', 'school'], ['ちょっと', 'a little'], ['ざっし', 'magazine']] },
      { tip: 'Count the beats: き-っ-て has three, き-て only two.' },
    ],
  },
  {
    id: 'longues', cat: 'pron', glyph: 'ー', title: 'Long vowels',
    sum: 'おばさん or おばあさん: aunt or grandmother.',
    blocks: [
      { p: 'A vowel can last **two beats**. In hiragana, you add a vowel (ああ, いい, うう); **おう** and **えい** are usually pronounced “ō” and “ē”. In katakana, you use the bar **ー**.' },
      { ex: [['おばさん', 'aunt'], ['おばあさん', 'grandmother'], ['とうきょう', 'Tokyo'], ['せんせい', 'teacher'], ['ラーメン', 'ramen']] },
      { tip: 'Lengthening a vowel or not changes the word: take your time on long vowels.' },
    ],
  },
  {
    id: 'yoon', cat: 'pron', glyph: 'きゃ', title: 'ん and combined sounds',
    sum: 'きゃ, しょ, ちゅ… and the “n” that counts as a beat.',
    blocks: [
      { p: 'A kana ending in **i** followed by a **small ゃ, ゅ or ょ** makes one syllable: き + ゃ = **kya**, し + ょ = **sho**.' },
      { p: '**ん** is a nasal “n” that counts as **a full beat**.' },
      { ex: [['きゃく', 'customer'], ['しゃしん', 'photo'], ['びょういん', 'hospital'], ['びよういん', 'hair salon'], ['ほんや', 'bookstore']] },
      { tip: 'びょういん (hospital) and びよういん (hair salon) differ only by the size of よ!' },
    ],
  },
  {
    id: 'particules', cat: 'pron', glyph: 'はへを', title: 'The particles は, へ and を',
    sum: 'Three kana that are read differently.',
    blocks: [
      { p: 'When used as **particles**, three kana change pronunciation: **は → wa**, **へ → e**, **を → o**.' },
      { ex: [['わたしは', 'as for me'], ['がっこうへ', 'toward school'], ['パンを', 'bread (object)']] },
      { tip: 'In a regular word, は is read “ha”: はな (flower), はし (bridge).' },
    ],
  },
  {
    id: 'muettes', cat: 'pron', glyph: 'です', title: 'Vowels that fade',
    sum: 'です often sounds like “dess”.',
    blocks: [
      { p: 'The vowels **i** and **u** become almost **silent** between two voiceless consonants (k, s, t, h, p) or at the end of a sentence after them.' },
      { ex: [['です', 'it is'], ['します', 'I do'], ['すき', 'to like'], ['ひと', 'person']] },
      { tip: 'Listen carefully: すき sounds like “ski”, です like “dess”.' },
    ],
  },
  {
    id: 'accent', cat: 'pron', glyph: '♪', title: 'Pitch accent',
    sum: 'A melody, not stress.',
    blocks: [
      { p: 'Japanese has no stress accent like English, but a **pitch accent**: some syllables are **higher**, others **lower**. Words spelled the same way can be told apart this way.' },
      { ex: [['雨', 'rain', 'あめ'], ['飴', 'candy', 'あめ'], ['橋', 'bridge', 'はし'], ['箸', 'chopsticks', 'はし']] },
      { tip: 'No need to memorize it all at first: copy the melody of the sentences you hear in the app.' },
    ],
  },

  // ================= GRAMMAR =================
  {
    id: 'ordre', cat: 'gram', glyph: 'SOV', title: 'Word order',
    sum: 'Verb last, particles after words.',
    blocks: [
      { p: 'As in Korean, the order is **subject – object – verb**: the verb always ends the sentence. Each word is followed by a **particle** that shows its role.' },
      { table: [['Subject', 'Object', 'Verb'], ['私は', 'パンを', '食べます'], ['I', 'bread', 'eat']] },
      { ex: [['私はパンを食べます。', 'I eat bread.'], ['私は昨日家で映画を見ました。', 'Yesterday, I watched a movie at home.']] },
      { tip: 'The subject is often dropped when it’s obvious: “パンを食べます” is enough.' },
    ],
  },
  {
    id: 'wa-ga', cat: 'gram', glyph: 'はが', title: 'Topic は and subject が',
    sum: 'The most famous nuance in Japanese.',
    blocks: [
      { p: '**は (wa)** introduces the **topic**: what you’re talking about, “as for…”. **が (ga)** marks the **subject**, often new or emphasized information.' },
      { ex: [['私は学生です。', 'I’m a student.'], ['誰が来ましたか？', 'Who came?'], ['友達が来ました。', 'My friend is the one who came.'], ['天気がいいです。', 'The weather is nice.']] },
      { tip: 'With 好き (to like) and a few other words, the thing you like takes が: パンが好きです.' },
    ],
  },
  {
    id: 'wo', cat: 'gram', glyph: 'を', title: 'The object particle を',
    sum: 'What the action is done to.',
    blocks: [
      { p: '**を** (pronounced “o”) goes after the noun receiving the action.' },
      { ex: [['本を読みます。', 'I read a book.'], ['コーヒーを飲みます。', 'I drink coffee.'], ['日本語を勉強します。', 'I study Japanese.']] },
      { tip: 'A few verbs take に instead of を: 友達に会います (meet a friend), バスに乗ります (take the bus).' },
    ],
  },
  {
    id: 'ni-de', cat: 'gram', glyph: 'にで', title: 'Places: に or で',
    sum: 'Going somewhere or doing something there.',
    blocks: [
      { p: '**に** marks a **destination**, a specific **time** or where something **is**. **で** marks where an **action takes place**.' },
      { ex: [['学校に行きます。', 'I go to school.'], ['三時に会います。', 'Let’s meet at 3.'], ['家にいます。', 'I’m at home.'], ['学校で勉強します。', 'I study at school.']] },
      { tip: 'Moving toward a place or being there = に. Doing something there = で.' },
    ],
  },
  {
    id: 'desu', cat: 'gram', glyph: 'です', title: '“To be”: です',
    sum: 'Saying what something is, politely.',
    blocks: [
      { p: 'Noun + **です** = “it is… / I am…”. Negative: **じゃないです** (or ではありません, more formal). Past: **でした**.' },
      { ex: [['学生です。', 'I’m a student.'], ['これは水ですか？', 'Is this water?'], ['学生じゃないです。', 'I’m not a student.'], ['雨でした。', 'It was raining.']] },
      { tip: 'In casual speech, です becomes だ, or simply disappears.' },
    ],
  },
  {
    id: 'masu', cat: 'gram', glyph: 'ます', title: 'The polite ます form',
    sum: 'Conjugating the three verb groups.',
    blocks: [
      { p: 'Verbs fall into three groups. Replace the end of the verb with **ます**:' },
      { table: [['Group', 'Dictionary', 'ます form'], ['ichidan (-る)', '食べる', '食べます'], ['godan (-u → -i)', '飲む', '飲みます'], ['godan', '行く', '行きます'], ['irregular', 'する', 'します'], ['irregular', '来る', '来ます (きます)']] },
      { p: 'For **godan** verbs, the final **u** sound becomes **i**: む → み, く → き, う → い, る → り.' },
      { ex: [['毎日コーヒーを飲みます。', 'I drink coffee every day.'], ['明日行きます。', 'I’ll go tomorrow.']] },
      { tip: 'Some -る verbs are godan: 帰る → 帰ります, 乗る → 乗ります. You learn them as you go.' },
    ],
  },
  {
    id: 'temps', cat: 'gram', glyph: 'ました', title: 'Polite past and negative',
    sum: 'ました, ません, ませんでした.',
    blocks: [
      { table: [['', 'Affirmative', 'Negative'], ['Non-past', '食べます', '食べません'], ['Past', '食べました', '食べませんでした']] },
      { p: 'Japanese has **no future tense**: the **non-past** form covers present and future. A word like **明日** (tomorrow) is enough to place the action.' },
      { ex: [['昨日映画を見ました。', 'Yesterday, I watched a movie.'], ['肉を食べません。', 'I don’t eat meat.'], ['明日学校に行きます。', 'Tomorrow, I’ll go to school.']] },
    ],
  },
  {
    id: 'familier', cat: 'gram', glyph: 'る', title: 'Casual style',
    sum: 'Among friends: dictionary form, ない, た.',
    blocks: [
      { p: 'With close friends, you don’t use ます. Use the **dictionary form** (non-past), **〜ない** (negative) and **〜た** (past).' },
      { table: [['Polite', 'Casual'], ['食べます', '食べる'], ['食べません', '食べない'], ['食べました', '食べた'], ['飲みました', '飲んだ'], ['行きました', '行った']] },
      { p: 'The **た** form of godan verbs depends on the last syllable: む → **んだ**, く → **いた**, う / つ / る → **った**, す → **した**. Exception: 行く → **行った**.' },
      { tip: 'A casual question just uses rising intonation: 食べる？' },
    ],
  },
  {
    id: 'adjectifs', cat: 'gram', glyph: 'い・な', title: 'い and な adjectives',
    sum: 'Two families that conjugate differently.',
    blocks: [
      { p: '**い** adjectives conjugate themselves: replace い with **くない** (negative) or **かった** (past). **な** adjectives behave like nouns, with です.' },
      { table: [['', 'い: 高い', 'な: 静か'], ['Present', '高いです', '静かです'], ['Negative', '高くないです', '静かじゃないです'], ['Past', '高かったです', '静かでした']] },
      { ex: [['このかばんは高いです。', 'This bag is expensive.'], ['昨日は寒かったです。', 'It was cold yesterday.'], ['私は幸せです。', 'I’m happy.']] },
      { tip: 'Exception: いい (good) becomes よくない and よかった.' },
    ],
  },
  {
    id: 'tai', cat: 'gram', glyph: 'たい', title: 'Wanting: 〜たいです',
    sum: 'Saying what you want to do.',
    blocks: [
      { p: 'ます stem + **たい** = “I want to…”. たい conjugates like an い adjective: たくない, たかった. For **someone else’s** wish, say **〜たがっています**.' },
      { ex: [['日本に行きたいです。', 'I want to go to Japan.'], ['何を食べたいですか？', 'What do you want to eat?'], ['寝たくないです。', 'I don’t want to sleep.'], ['友達は休みたがっています。', 'My friend wants to rest.']] },
    ],
  },
  {
    id: 'questions', cat: 'gram', glyph: 'か', title: 'Asking questions',
    sum: 'か and question words.',
    blocks: [
      { p: 'In polite style, add **か** at the end of the sentence. Question words go where the answer would be.' },
      { table: [['Japanese', 'English'], ['何 (なに / なん)', 'what'], ['誰 (だれ)', 'who'], ['どこ', 'where'], ['いつ', 'when'], ['どうして', 'why'], ['いくら', 'how much (price)']] },
      { ex: [['どこに行きますか？', 'Where are you going?'], ['これは何ですか？', 'What is this?'], ['いくらですか？', 'How much is it?']] },
    ],
  },
  {
    id: 'nombres', cat: 'gram', glyph: '一つ', title: 'Numbers and counters',
    sum: 'いち, ひとつ, ひとり…',
    blocks: [
      { table: [['', '1', '2', '3', '4', '5', '10'], ['Numbers', 'いち', 'に', 'さん', 'よん', 'ご', 'じゅう'], ['Things (〜つ)', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'とお']] },
      { p: 'To count, add a **counter** that depends on what you count: 〜人 (people), 〜枚 (flat things), 〜時 (hours)… Everyday objects often use **〜つ**.' },
      { ex: [['りんごを二つください。', 'Two apples, please.'], ['三時です。', 'It’s 3 o’clock.'], ['一人です。', 'I’m alone. / One person.']] },
      { tip: 'Careful: one person is ひとり, two people ふたり, then さんにん, よにん…' },
    ],
  },
];

// Outils hangeul : décomposition des syllabes, particules, conjugaison et romanisation.

const BASE = 0xac00;
export const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
export const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
export const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export const isSyllable = (ch) => {
  const c = ch.codePointAt(0);
  return c >= BASE && c <= 0xd7a3;
};

export function decompose(ch) {
  const i = ch.codePointAt(0) - BASE;
  return { cho: Math.floor(i / 588), jung: Math.floor((i % 588) / 28), jong: i % 28 };
}

export const compose = (cho, jung, jong = 0) => String.fromCodePoint(BASE + cho * 588 + jung * 28 + jong);

function lastSyllableIndex(word) {
  for (let i = word.length - 1; i >= 0; i--) if (isSyllable(word[i])) return i;
  return -1;
}

/** Le mot se termine-t-il par une consonne finale (batchim) ? */
export function hasBatchim(word) {
  const i = lastSyllableIndex(word);
  return i >= 0 && decompose(word[i]).jong !== 0;
}

/** Ajoute la bonne variante d'une particule : particle('사과', '을', '를') → '사과를'. */
export const particle = (word, afterConsonant, afterVowel) => word + (hasBatchim(word) ? afterConsonant : afterVowel);

/** Remplace la consonne finale de la dernière syllabe : withBatchim('먹어', 'ㅆ') → '먹었'. */
export function withBatchim(word, jamo) {
  const i = lastSyllableIndex(word);
  const d = decompose(word[i]);
  return word.slice(0, i) + compose(d.cho, d.jung, JONG.indexOf(jamo)) + word.slice(i + 1);
}

/** Radical de la forme formelle : 먹 → 먹습, 가 → 갑, 만들 → 만듭. */
export function formalStem(stem) {
  const i = lastSyllableIndex(stem);
  const d = decompose(stem[i]);
  if (d.jong === 0 || JONG[d.jong] === 'ㄹ') return withBatchim(stem, 'ㅂ');
  return stem + '습';
}

/**
 * Conjugue un verbe ou adjectif.
 * v = { stem: '먹', a: '먹어', f: '먹을' }  (a : forme en 아/어, f : forme du futur en (으)ㄹ)
 * tense : present | past | future ; style : polite | formal | casual ; question : booléen
 */
export function conjugate(v, tense, style, question = false) {
  const end = question ? '?' : '.';
  if (tense === 'past') {
    const p = withBatchim(v.a, 'ㅆ');
    if (style === 'formal') return p + (question ? '습니까' : '습니다') + end;
    if (style === 'casual') return p + '어' + end;
    return p + '어요' + end;
  }
  if (tense === 'future') {
    if (style === 'formal') return v.f + (question ? ' 겁니까' : ' 겁니다') + end;
    if (style === 'casual') return v.f + ' 거야' + end;
    return v.f + ' 거예요' + end;
  }
  if (style === 'formal') return formalStem(v.stem) + (question ? '니까' : '니다') + end;
  if (style === 'casual') return v.a + end;
  return v.a + '요' + end;
}

// ---------- Romanisation (romanisation révisée, règles phonétiques principales) ----------

const R_CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const R_JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
// Son d'une consonne finale prononcée seule.
const FINAL = { ㄱ: 'k', ㄲ: 'k', ㅋ: 'k', ㄳ: 'k', ㄺ: 'k', ㄴ: 'n', ㄵ: 'n', ㄶ: 'n', ㄷ: 't', ㅅ: 't', ㅆ: 't', ㅈ: 't', ㅊ: 't', ㅌ: 't', ㅎ: 't', ㄹ: 'l', ㄼ: 'l', ㄽ: 'l', ㄾ: 'l', ㅀ: 'l', ㅁ: 'm', ㄻ: 'm', ㅂ: 'p', ㅍ: 'p', ㄿ: 'p', ㅄ: 'p', ㅇ: 'ng', '': '' };
// Consonne finale suivie d'une voyelle : [reste en finale, consonne qui passe à la syllabe suivante].
const LIAISON = { ㄳ: ['ㄱ', 'ㅅ'], ㄵ: ['ㄴ', 'ㅈ'], ㄶ: ['ㄴ', ''], ㄺ: ['ㄹ', 'ㄱ'], ㄻ: ['ㄹ', 'ㅁ'], ㄼ: ['ㄹ', 'ㅂ'], ㄽ: ['ㄹ', 'ㅅ'], ㄾ: ['ㄹ', 'ㅌ'], ㄿ: ['ㄹ', 'ㅍ'], ㅀ: ['ㄹ', ''], ㅄ: ['ㅂ', 'ㅅ'], ㅎ: ['', ''] };
const NASAL = { k: 'ng', t: 'n', p: 'm' };
const ASPIRATE = { ㄱ: 'k', ㄷ: 't', ㅈ: 'ch', ㅂ: 'p' };

function romanizeWord(word) {
  const syl = [...word].map((ch) => (isSyllable(ch) ? decompose(ch) : ch));
  // Copie mutable : initiale (jamo) / voyelle (index) / finale (jamo)
  const s = syl.map((x) => (typeof x === 'string' ? x : { i: CHO[x.cho], v: x.jung, f: JONG[x.jong] }));
  let out = '';
  for (let k = 0; k < s.length; k++) {
    const cur = s[k];
    if (typeof cur === 'string') { out += cur; continue; }
    const next = typeof s[k + 1] === 'object' ? s[k + 1] : null;
    let init = cur.i === 'ㄹ' && k > 0 && typeof s[k - 1] === 'object' && s[k - 1].f && s[k - 1].f !== 'ㄹ' && s[k - 1].f !== '' ? 'n' : R_CHO[CHO.indexOf(cur.i)];
    if (cur._init !== undefined) init = cur._init;
    let fin = cur.f;
    let finalSound = FINAL[fin] ?? '';
    if (next && fin) {
      if (next.i === 'ㅇ') {
        // Liaison : la consonne finale devient l'initiale de la syllabe suivante.
        if (fin !== 'ㅇ') {
          const [stay, move] = LIAISON[fin] ?? ['', fin];
          finalSound = stay ? FINAL[stay] : '';
          if (move) next._init = move === 'ㄹ' ? 'r' : R_CHO[CHO.indexOf(move)];
          else next._init = '';
        }
      } else if (fin === 'ㅎ' && ASPIRATE[next.i]) {
        finalSound = '';
        next._init = ASPIRATE[next.i];
      } else if (next.i === 'ㅎ' && ['k', 't', 'p'].includes(finalSound)) {
        next._init = finalSound === 't' ? 't' : finalSound;
        finalSound = '';
      } else if ((next.i === 'ㄴ' || next.i === 'ㅁ') && NASAL[finalSound]) {
        finalSound = NASAL[finalSound];
      } else if (finalSound === 'l' && next.i === 'ㄴ') {
        next._init = 'l';
      } else if (finalSound === 'n' && next.i === 'ㄹ') {
        finalSound = 'l';
        next._init = 'l';
      } else if (finalSound === 'l' && next.i === 'ㄹ') {
        next._init = 'l';
      }
    }
    out += init + R_JUNG[cur.v] + finalSound;
  }
  return out;
}

export const romanize = (text) => text.split(/(\s+)/).map((w) => (/\s/.test(w) ? w : romanizeWord(w))).join('');

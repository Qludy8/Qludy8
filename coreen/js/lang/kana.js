// Kana japonais : tableaux hiragana / katakana et conversion en rōmaji (Hepburn).

const L = (fr, en) => ({ fr, en });

const BASE = [
  ['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o'],
  ['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko'],
  ['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so'],
  ['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to'],
  ['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no'],
  ['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho'],
  ['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo'],
  ['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo'],
  ['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro'],
  ['わ', 'wa'], ['を', 'wo'], ['ん', 'n'],
];
const DAKUTEN = [
  ['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go'],
  ['ざ', 'za'], ['じ', 'ji'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo'],
  ['だ', 'da'], ['ぢ', 'ji'], ['づ', 'zu'], ['で', 'de'], ['ど', 'do'],
  ['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo'],
  ['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po'],
];
const YOON = [
  ['きゃ', 'kya'], ['きゅ', 'kyu'], ['きょ', 'kyo'], ['しゃ', 'sha'], ['しゅ', 'shu'], ['しょ', 'sho'],
  ['ちゃ', 'cha'], ['ちゅ', 'chu'], ['ちょ', 'cho'], ['にゃ', 'nya'], ['にゅ', 'nyu'], ['にょ', 'nyo'],
  ['ひゃ', 'hya'], ['ひゅ', 'hyu'], ['ひょ', 'hyo'], ['みゃ', 'mya'], ['みゅ', 'myu'], ['みょ', 'myo'],
  ['りゃ', 'rya'], ['りゅ', 'ryu'], ['りょ', 'ryo'], ['ぎゃ', 'gya'], ['ぎゅ', 'gyu'], ['ぎょ', 'gyo'],
  ['じゃ', 'ja'], ['じゅ', 'ju'], ['じょ', 'jo'], ['びゃ', 'bya'], ['びゅ', 'byu'], ['びょ', 'byo'],
  ['ぴゃ', 'pya'], ['ぴゅ', 'pyu'], ['ぴょ', 'pyo'],
];

/** Hiragana → katakana (et inversement). */
export const toKata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
export const toHira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

// Conseils de prononciation pour les sons qui piègent les francophones / anglophones.
const TIPS = {
  u: L('« ou » très léger, lèvres peu arrondies', 'a light “oo”, lips barely rounded'),
  e: L('« é »', '“e” as in “pet”'),
  shi: L('« chi » (comme « chic »)', '“she”'),
  chi: L('« tchi »', '“chee” as in “cheese”'),
  tsu: L('« tsou », comme dans « tsunami »', '“tsu” as in “tsunami”'),
  fu: L('entre « f » et « h », lèvres à peine serrées', 'between “f” and “h”, lips barely together'),
  ra: L('« r » battu, presque un « l »', 'flapped “r”, close to an “l”'),
  wo: L('se prononce « o » ; sert surtout de particule d’objet', 'pronounced “o”; mostly used as the object particle'),
  n: L('« n » nasal, compte comme une syllabe entière', 'nasal “n”, counts as a full beat'),
  ha: L('« ha » ; se lit « wa » quand c’est la particule de thème', '“ha”; read “wa” as the topic particle'),
  he: L('« hé » ; se lit « é » quand c’est la particule de direction', '“he”; read “e” as the direction particle'),
  ji: L('« dji »', '“jee”'),
  zu: L('« dzou »', '“dzoo”'),
  ja: L('« dja »', '“ja” as in “jar”'),
};
const tip = (r) => TIPS[r] || TIPS[r.slice(0, 2)] || L(`« ${r} »`, `“${r}”`);
// Chaque son regroupe sa forme hiragana (j) et katakana (j2).
const item = ([k, r]) => ({ j: k, j2: toKata(k), r, say: k, tip: tip(r) });

// sym : symbole affiché devant le libellé dans les onglets.
export const KANA_SETS = {
  base: { sym: 'あ', label: L('Kana de base', 'Basic kana'), items: BASE.map(item) },
  voiced: { sym: 'が', label: L('Sons voisés', 'Voiced sounds'), items: DAKUTEN.map(item), decoys: BASE.map(item) },
  combo: { sym: 'きゃ', label: L('Sons combinés', 'Combined sounds'), items: YOON.map(item) },
};

// ---------- Rōmaji (Hepburn modifié) ----------
const MAP = new Map([...BASE, ...DAKUTEN, ...YOON]);
MAP.set('を', 'o');
// Katakana étendus (mots étrangers) : ファ, ティ, ウェ, ヴ…
for (const [k, r] of [['ふぁ', 'fa'], ['ふぃ', 'fi'], ['ふぇ', 'fe'], ['ふぉ', 'fo'], ['てぃ', 'ti'], ['でぃ', 'di'], ['とぅ', 'tu'], ['どぅ', 'du'], ['でゅ', 'dyu'],
  ['うぃ', 'wi'], ['うぇ', 'we'], ['うぉ', 'wo'], ['しぇ', 'she'], ['じぇ', 'je'], ['ちぇ', 'che'], ['ゔぁ', 'va'], ['ゔぃ', 'vi'], ['ゔぇ', 've'], ['ゔぉ', 'vo'], ['ゔ', 'vu']]) MAP.set(k, r);
const SMALL = { ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o' };

/** Convertit une chaîne en kana (hiragana ou katakana) en rōmaji. */
export function kanaToRomaji(input) {
  const s = toHira(input);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    const ch = s[i];
    if (ch === 'っ') {
      // Consonne doublée : っか → kka, っち → tchi
      const next = MAP.get(s.slice(i + 1, i + 3)) || MAP.get(s[i + 1]) || '';
      out += next.startsWith('ch') ? 't' : next[0] || '';
      continue;
    }
    if (ch === 'ー') {
      // Voyelle longue en katakana : on répète la dernière voyelle
      const m = out.match(/[aeiou](?=[^aeiou]*$)/);
      out += m ? m[0] : '';
      continue;
    }
    if (ch === 'ん') {
      const next = s[i + 1];
      out += next && /[あいうえおやゆよ]/.test(next) ? "n'" : 'n';
      continue;
    }
    if (MAP.has(two)) {
      out += MAP.get(two);
      i++;
      continue;
    }
    if (MAP.has(ch)) out += MAP.get(ch);
    else if (SMALL[ch]) out = out.replace(/[aeiou]$/, '') + SMALL[ch];
    else if (ch === '。') out += '.';
    else if (ch === '？') out += '?';
    else if (ch === '、') out += ',';
    else if (ch === '「') out += '“';
    else if (ch === '」') out += '”';
    else out += ch;
  }
  return out;
}

const PARTICLE_ROM = { は: 'wa', へ: 'e', を: 'o', への: 'e no' };
export const particleRomaji = (p) => PARTICLE_ROM[p] ?? kanaToRomaji(p);

// Clavier à l'écran : hangeul (disposition coréenne à deux jeux, les lettres s'assemblent en syllabes)
// et kana (tableau des cinquante sons, avec ゛ ゜ et les petits signes).
import { CHO, JUNG, JONG, compose, isSyllable, decompose } from './hangul.js';
import { toKata, toHira } from './lang/kana.js';

// ---------- Hangeul : assemblage des lettres ----------
const V_PAIR = { ㅗㅏ: 'ㅘ', ㅗㅐ: 'ㅙ', ㅗㅣ: 'ㅚ', ㅜㅓ: 'ㅝ', ㅜㅔ: 'ㅞ', ㅜㅣ: 'ㅟ', ㅡㅣ: 'ㅢ' };
const F_PAIR = { ㄱㅅ: 'ㄳ', ㄴㅈ: 'ㄵ', ㄴㅎ: 'ㄶ', ㄹㄱ: 'ㄺ', ㄹㅁ: 'ㄻ', ㄹㅂ: 'ㄼ', ㄹㅅ: 'ㄽ', ㄹㅌ: 'ㄾ', ㄹㅍ: 'ㄿ', ㄹㅎ: 'ㅀ', ㅂㅅ: 'ㅄ' };
const V_SPLIT = Object.fromEntries(Object.entries(V_PAIR).map(([k, v]) => [v, [...k]]));
const F_SPLIT = Object.fromEntries(Object.entries(F_PAIR).map(([k, v]) => [v, [...k]]));
const isV = (j) => JUNG.includes(j);
const isC = (j) => CHO.includes(j);

/** Suite de lettres tapées → texte en syllabes : ㅎㅏㄴㄱㅡㄹ → 한글. Les autres caractères (espace…) passent tels quels. */
export function assemble(keys) {
  let out = '';
  let i = 0;
  const vowelAt = (k) => {
    // voyelle simple ou composée (ㅗ + ㅏ → ㅘ)
    const a = keys[k];
    const pair = V_PAIR[a + (keys[k + 1] || '')];
    return pair ? [pair, 2] : [a, 1];
  };
  while (i < keys.length) {
    const a = keys[i];
    if (isC(a) && isV(keys[i + 1])) {
      const [v, n] = vowelAt(i + 1);
      i += 1 + n;
      let f = '';
      const c1 = keys[i];
      // Une consonne ne devient finale que si elle n'ouvre pas la syllabe suivante.
      if (c1 && JONG.includes(c1) && c1 !== '' && !isV(keys[i + 1])) {
        f = c1;
        i++;
        const pair = F_PAIR[c1 + (keys[i] || '')];
        if (pair && !isV(keys[i + 1])) {
          f = pair;
          i++;
        }
      }
      out += compose(CHO.indexOf(a), JUNG.indexOf(v), JONG.indexOf(f));
    } else if (isV(a)) {
      const [v, n] = vowelAt(i);
      out += v;
      i += n;
    } else {
      out += a;
      i++;
    }
  }
  return out;
}

/** Texte → lettres une à une (pour reprendre la saisie après un indice). */
export function disassemble(text) {
  const keys = [];
  for (const ch of text) {
    if (!isSyllable(ch)) {
      keys.push(...(V_SPLIT[ch] || [ch]));
      continue;
    }
    const d = decompose(ch);
    keys.push(CHO[d.cho], ...(V_SPLIT[JUNG[d.jung]] || [JUNG[d.jung]]));
    if (d.jong) keys.push(...(F_SPLIT[JONG[d.jong]] || [JONG[d.jong]]));
  }
  return keys;
}

// ---------- Kana : marques et petits signes ----------
const PLAIN = 'かきくけこさしすせそたちつてとはひふへほ';
const VOICED = 'がぎぐげござじずぜぞだぢづでどばびぶべぼ';
const HALF_FROM = 'はひふへほ';
const HALF = 'ぱぴぷぺぽ';
const BIG = 'つやゆよあいうえお';
const SMALL = 'っゃゅょぁぃぅぇぉ';

/** Applique ゛, ゜ ou « petit » au dernier signe (une seconde pression l'enlève). */
export function modifyKana(text, mark) {
  if (!text) return text;
  const last = text.at(-1);
  const kata = /[ァ-ヶ]/.test(last);
  let h = toHira(last);
  const swap = (from, to) => {
    const a = from.indexOf(h);
    const b = to.indexOf(h);
    if (a >= 0) h = to[a];
    else if (b >= 0) h = from[b];
    else return false;
    return true;
  };
  let ok;
  if (mark === '゛') {
    if (HALF.includes(h)) h = HALF_FROM[HALF.indexOf(h)];
    ok = swap(PLAIN, VOICED);
  } else if (mark === '゜') {
    if (VOICED.includes(h) && HALF_FROM.includes(PLAIN[VOICED.indexOf(h)])) h = PLAIN[VOICED.indexOf(h)];
    ok = swap(HALF_FROM, HALF);
  } else ok = swap(BIG, SMALL);
  return ok ? text.slice(0, -1) + (kata ? toKata(h) : h) : text;
}

// ---------- Dispositions ----------
const KO_ROWS = [
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['⇧', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', '⌫'],
];
const KO_SHIFT = { ㅂ: 'ㅃ', ㅈ: 'ㅉ', ㄷ: 'ㄸ', ㄱ: 'ㄲ', ㅅ: 'ㅆ', ㅐ: 'ㅒ', ㅔ: 'ㅖ' };
// Clavier d'ordinateur (AZERTY ou QWERTY : on lit la position de la touche, pas la lettre).
const KO_CODES = { KeyQ: 'ㅂ', KeyW: 'ㅈ', KeyE: 'ㄷ', KeyR: 'ㄱ', KeyT: 'ㅅ', KeyY: 'ㅛ', KeyU: 'ㅕ', KeyI: 'ㅑ', KeyO: 'ㅐ', KeyP: 'ㅔ', KeyA: 'ㅁ', KeyS: 'ㄴ', KeyD: 'ㅇ', KeyF: 'ㄹ', KeyG: 'ㅎ', KeyH: 'ㅗ', KeyJ: 'ㅓ', KeyK: 'ㅏ', KeyL: 'ㅣ', KeyZ: 'ㅋ', KeyX: 'ㅌ', KeyC: 'ㅊ', KeyV: 'ㅍ', KeyB: 'ㅠ', KeyN: 'ㅜ', KeyM: 'ㅡ' };

// Colonnes あ か さ た な は ま や ら わ ; lignes a i u e o.
const JA_ROWS = [
  ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'],
  ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', '゛', 'り', 'を'],
  ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る', 'ん'],
  ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', '゜', 'れ', 'ー'],
  ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', '小'],
];

// Clavier latin, pour écrire la romanisation : AZERTY en français, QWERTY en anglais.
const LATIN = {
  azerty: [[...'azertyuiop'], [...'qsdfghjklm'], [...'wxcvbn', '’', '⌫']],
  qwerty: [[...'qwertyuiop'], [...'asdfghjkl'], [...'zxcvbnm', '’', '⌫']],
};

/**
 * Installe un clavier dans `host`.
 * kind : 'ko', 'ja' ou 'latin' (layout : 'azerty' | 'qwerty') ; kata : commencer en katakana ; onChange(texte) ; onEnter()
 * Renvoie { value, set(texte), clear(), lock(bool) }.
 */
export function mountKeyboard(host, { kind, layout = 'azerty', kata = false, space = false, onChange, onEnter }) {
  let keys = []; // coréen : lettres tapées ; japonais : signes
  let shift = false;
  let locked = false;
  const value = () => (kind === 'ko' ? assemble(keys) : keys.join(''));
  const emit = () => onChange?.(value());

  function draw() {
    if (kind === 'latin') {
      host.innerHTML = `<div class="kb kb-latin">${LATIN[layout].map((row, n) => `<div class="kb-row ${n === 1 && row.length < 10 ? 'inset' : ''}">${row.map((k) => (k === '⌫'
        ? '<button class="kb-key fn" data-fn="back" aria-label="⌫">⌫</button>'
        : `<button class="kb-key" data-k="${k === '’' ? "'" : k}">${k}</button>`)).join('')}</div>`).join('')}</div>`;
    } else if (kind === 'ko') {
      host.innerHTML = `<div class="kb kb-ko ${shift ? 'shift' : ''}">${KO_ROWS.map((row) => `<div class="kb-row">${row.map((k) => {
        if (k === '⇧') return `<button class="kb-key fn ${shift ? 'on' : ''}" data-fn="shift" aria-label="Shift">⇧</button>`;
        if (k === '⌫') return '<button class="kb-key fn" data-fn="back" aria-label="⌫">⌫</button>';
        const c = shift && KO_SHIFT[k] ? KO_SHIFT[k] : k;
        return `<button class="kb-key kr ${shift && KO_SHIFT[k] ? 'alt' : ''}" data-k="${c}">${c}</button>`;
      }).join('')}</div>`).join('')}${space ? '<div class="kb-row"><button class="kb-key fn wide" data-k=" " aria-label="Espace">␣</button></div>' : ''}</div>`;
    } else {
      host.innerHTML = `<div class="kb kb-ja">${JA_ROWS.map((row) => `<div class="kb-row">${row.map((k) => {
        if ('゛゜小'.includes(k)) return `<button class="kb-key fn kr" data-mark="${k}" aria-label="${k}">${k === '゛' ? '″' : k === '゜' ? '°' : k}</button>`;
        const c = kata ? toKata(k) : k;
        return `<button class="kb-key kr" data-k="${c}">${c}</button>`;
      }).join('')}</div>`).join('')}
        <div class="kb-row"><button class="kb-key fn wide kr" data-fn="kata">${kata ? 'あ ひらがな' : 'ア カタカナ'}</button><button class="kb-key fn wide" data-fn="back" aria-label="⌫">⌫</button></div></div>`;
    }
  }

  function press(k) {
    keys.push(k);
    if (shift) {
      shift = false;
      draw();
    }
    emit();
  }
  function back() {
    keys.pop();
    emit();
  }
  function mark(m) {
    const before = keys.join('');
    const after = modifyKana(before, m);
    if (after !== before) {
      keys = [...after];
      emit();
    }
  }

  host.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.kb-key');
    if (!b || locked) return;
    e.preventDefault(); // pas de sélection de texte ni de perte de focus
    if (b.dataset.fn === 'shift') {
      shift = !shift;
      draw();
    } else if (b.dataset.fn === 'back') back();
    else if (b.dataset.fn === 'kata') {
      kata = !kata;
      draw();
    } else if (b.dataset.mark) mark(b.dataset.mark);
    else press(b.dataset.k);
    b.classList.add('hit');
    setTimeout(() => b.classList.remove('hit'), 120);
  });

  // Clavier d'ordinateur
  const onKey = (e) => {
    if (!host.isConnected) return document.removeEventListener('keydown', onKey);
    if (locked || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Backspace') { e.preventDefault(); return back(); }
    if (e.key === 'Enter') { e.preventDefault(); return onEnter?.(); }
    if (kind === 'latin') {
      if (/^[a-zA-Z']$/.test(e.key)) press(e.key.toLowerCase());
    } else if (kind === 'ko') {
      if (e.key === ' ' && space) { e.preventDefault(); return press(' '); }
      if (/^[ㄱ-ㅣ]$/.test(e.key)) return press(e.key);
      const j = KO_CODES[e.code];
      if (j) press(e.shiftKey && KO_SHIFT[j] ? KO_SHIFT[j] : j);
    } else if (/^[ぁ-ゖァ-ヶー]$/.test(e.key)) press(e.key);
  };
  document.addEventListener('keydown', onKey);

  draw();
  return {
    get value() { return value(); },
    set(text) {
      keys = kind === 'ko' ? disassemble(text) : [...text];
      emit();
    },
    clear() {
      keys = [];
      emit();
    },
    lock(v) {
      locked = v;
      host.classList.toggle('kb-locked', v);
    },
  };
}

/** Zone de saisie complète : la ligne de réponse au-dessus du clavier. */
export function mountTyping(host, { kind, layout, kata, space, placeholder = '', onEnter, onChange }) {
  host.innerHTML = `
    <div class="type-zone">
      <div class="type-box ${kind === 'latin' ? 'latin' : 'kr'}" aria-live="polite"><span class="type-text"></span><i class="caret"></i><span class="type-ph">${placeholder}</span></div>
      <div class="kb-host"></div>
    </div>`;
  const box = host.querySelector('.type-box');
  const text = host.querySelector('.type-text');
  const kb = mountKeyboard(host.querySelector('.kb-host'), {
    kind, layout, kata, space, onEnter,
    onChange(v) {
      text.textContent = v;
      box.classList.toggle('filled', !!v);
      box.classList.remove('bad');
      onChange?.(v);
    },
  });
  return { kb, box, get value() { return kb.value; } };
}

/** Compare deux réponses sans tenir compte des espaces, de la ponctuation ni de hiragana / katakana. */
export const normAnswer = (s) => toHira(String(s)).replace(/[\s.,!?。、？！~〜・…'"’“”「」()（）]/g, '');

/** Compare deux romanisations : sans majuscules, espaces, apostrophes ni tirets. */
export const normRoman = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');

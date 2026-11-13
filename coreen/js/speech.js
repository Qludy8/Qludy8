// Exercices à voix haute : le téléphone écoute (reconnaissance vocale du navigateur) et on vérifie
// que ce qu'il a compris correspond bien au mot attendu. Si l'appareil ne sait pas écouter, ces exercices
// sont remplacés par d'autres.
import { get } from './store.js';
import { course } from './course.js';
import { normAnswer } from './keyboard.js';

const Rec = () => (typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null);
let blocked = false; // micro refusé ou indisponible pendant cette séance

/** L'appareil sait-il écouter, et l'option est-elle activée ? */
export const listenSupported = () => !!Rec();
export const canListen = () => listenSupported() && !blocked && get().settings.speech !== false;
/** À appeler quand l'utilisateur ne peut pas parler maintenant : plus d'exercice oral jusqu'au prochain lancement. */
export const muteSpeech = () => { blocked = true; };

/**
 * Écoute une prise de parole. onResult(propositions) reçoit ce que le téléphone a compris (plusieurs hypothèses).
 * onError(code) : « denied » (micro refusé), « silence » (rien entendu), « error ».
 * Renvoie { stop() }.
 */
export function listen({ onResult, onError, onEnd }) {
  const R = Rec();
  if (!R) { onError?.('error'); return { stop() {} }; }
  const rec = new R();
  rec.lang = course().tts;
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 6;
  let done = false;
  rec.onresult = (e) => {
    done = true;
    const alts = [];
    for (const res of e.results) for (const a of res) if (a.transcript.trim()) alts.push(a.transcript.trim());
    onResult(alts);
  };
  rec.onerror = (e) => {
    done = true;
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { blocked = true; onError?.('denied'); }
    else if (e.error === 'no-speech' || e.error === 'aborted') onError?.('silence');
    else onError?.('error');
  };
  rec.onend = () => {
    if (!done) onError?.('silence');
    onEnd?.();
  };
  try { rec.start(); } catch { onError?.('error'); }
  return { stop() { try { rec.stop(); } catch { /* déjà arrêté */ } } };
}

/** Distance d'édition entre deux chaînes. */
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}
const similarity = (a, b) => (Math.max(a.length, b.length) ? 1 - distance(a, b) / Math.max(a.length, b.length) : 0);

/**
 * Ce qui a été entendu correspond-il à l'un des textes attendus ?
 * On compare l'écriture, puis la prononciation (romanisation) : 같이 et 가치 se disent pareil.
 * Renvoie { ok, heard, score (0 à 1) }.
 */
export function matchSpoken(alts, targets) {
  const C = course();
  const rom = (s) => { try { return C.romanize(s).toLowerCase().replace(/[^a-z]/g, ''); } catch { return ''; } };
  const want = targets.map(normAnswer).filter(Boolean);
  let best = { ok: false, heard: alts[0] || '', score: 0 };
  for (const alt of alts) {
    const a = normAnswer(alt);
    if (!a) continue;
    for (const w of want) {
      let score = similarity(a, w);
      if (a.includes(w) && a.length <= w.length + 3) score = 1; // un mot de liaison en plus ne compte pas
      const ra = rom(a);
      const rw = rom(w);
      if (ra && rw && !/[一-龯]/.test(a + w)) score = Math.max(score, similarity(ra, rw));
      // Mot court : il faut l'entendre presque exactement ; mot long : on tolère un petit écart.
      const need = w.length <= 2 ? 0.99 : w.length <= 4 ? 0.74 : 0.7;
      if (score > best.score) best = { ok: score >= need, heard: alt, score };
    }
  }
  return best;
}

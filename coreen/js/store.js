// Données de l'utilisateur, conservées uniquement sur le téléphone (localStorage).

const KEY = 'haru.v1';
const DAY = 86400000;

const DEFAULTS = () => ({
  xp: 0,
  days: {}, // 'AAAA-MM-JJ' → XP gagnés ce jour-là
  goal: 30,
  srs: {}, // id du mot → { b: boîte 0-5, due: jour, ok, ko }
  journal: [], // phrases enregistrées
  daily: {}, // 'AAAA-MM-JJ' → nombre de phrases du défi réussies
  best: {}, // records (ex. temps du jeu des paires)
  settings: { roman: true, sound: true, haptics: true, rate: 0.85, theme: 'auto', krLarge: false, motion: true, autoplay: true, quizLen: 10 },
  read: {}, // leçons du guide déjà lues
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = DEFAULTS();
      const s = JSON.parse(raw);
      return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) } };
    }
  } catch { /* stockage indisponible : on repart de zéro */ }
  return DEFAULTS();
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* navigation privée, quota… */ }
}

export const get = () => state;

export function reset() {
  state = DEFAULTS();
  save();
}

// ---------- Dates ----------
export function dayKey(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export const dayNumber = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY);

// ---------- XP, niveau, série ----------
export function addXp(n) {
  state.xp += n;
  const k = dayKey();
  state.days[k] = (state.days[k] || 0) + n;
  save();
}

export const todayXp = () => state.days[dayKey()] || 0;

/** Niveau n atteint à 25·(n-1)² XP. */
export function level(xp = state.xp) {
  const lv = Math.floor(Math.sqrt(xp / 25)) + 1;
  const start = 25 * (lv - 1) ** 2;
  const next = 25 * lv ** 2;
  return { lv, progress: (xp - start) / (next - start), toNext: next - xp };
}

/** Jours consécutifs avec l'objectif quotidien atteint (aujourd'hui compte s'il est atteint). */
export function streak() {
  let n = 0;
  const d = new Date();
  if ((state.days[dayKey(d)] || 0) < state.goal) d.setDate(d.getDate() - 1);
  while ((state.days[dayKey(d)] || 0) >= state.goal) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ---------- Répétition espacée (boîtes de Leitner) ----------
const INTERVALS = [0, 1, 2, 4, 8, 16];

export function review(id, correct) {
  const today = dayNumber();
  const c = state.srs[id] || { b: 0, due: today, ok: 0, ko: 0 };
  if (correct) {
    c.b = Math.min(5, c.b + 1);
    c.ok++;
  } else {
    c.b = Math.max(0, c.b - 2);
    c.ko++;
  }
  c.due = today + INTERVALS[c.b];
  state.srs[id] = c;
  save();
}

export const box = (id) => state.srs[id]?.b ?? -1;

/** Choisit n mots : d'abord ceux à revoir, puis des nouveaux, puis les autres. */
export function pickForReview(words, n, random = Math.random) {
  const today = dayNumber();
  const shuffle = (a) => a.map((x) => [random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const due = shuffle(words.filter((w) => state.srs[w.id] && state.srs[w.id].due <= today)).sort((a, b) => state.srs[a.id].b - state.srs[b.id].b);
  const fresh = shuffle(words.filter((w) => !state.srs[w.id]));
  const rest = shuffle(words.filter((w) => state.srs[w.id] && state.srs[w.id].due > today));
  return [...due, ...fresh, ...rest].slice(0, n);
}

export const dueCount = (words) => {
  const today = dayNumber();
  return words.filter((w) => state.srs[w.id] && state.srs[w.id].due <= today).length;
};

export const mastered = () => Object.values(state.srs).filter((c) => c.b >= 3).length;

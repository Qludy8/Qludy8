// Données de l'utilisateur, conservées uniquement sur le téléphone (localStorage).
// Structure : réglages communs + une progression séparée par langue apprise (coréen, japonais).

const KEY = 'haru.v1';
const DAY = 86400000;

const SETTINGS = () => ({
  roman: true, sound: true, haptics: true, rate: 0.85, theme: 'auto', krLarge: false, motion: true,
  autoplay: true, quizLen: 10, fullscreenTap: false, lang: 'fr', course: null,
});
const COURSE = () => ({
  xp: 0,
  days: {}, // 'AAAA-MM-JJ' → XP gagnés ce jour-là
  srs: {}, // id du mot → { b: boîte 0-5, due: jour, ok, ko }
  journal: [], // phrases enregistrées
  daily: {}, // 'AAAA-MM-JJ' → nombre de phrases du défi réussies
  best: {}, // records (ex. temps du jeu des paires)
  read: {}, // leçons du guide déjà lues
  steps: {}, // parcours « Premiers pas » : étapes terminées
});
const ROOT = () => ({ v: 2, goal: 30, settings: SETTINGS(), courses: { ko: COURSE(), ja: COURSE() } });

let root = load();
let state; // progression du cours actif (avec accès à settings et goal)
selectCourse(root.settings.course || 'ko');

/** Charge les données ; convertit l'ancien format (coréen seul) sans rien perdre. */
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch { /* stockage indisponible : on repart de zéro */ }
  return ROOT();
}

export function normalize(s) {
  const r = ROOT();
  if (s.v === 2) {
    r.goal = s.goal ?? r.goal;
    r.settings = { ...r.settings, ...(s.settings || {}) };
    for (const k of Object.keys(r.courses)) r.courses[k] = { ...COURSE(), ...(s.courses?.[k] || {}) };
    return r;
  }
  // Ancien format : tout appartenait au cours de coréen.
  r.goal = s.goal ?? r.goal;
  r.settings = { ...r.settings, ...(s.settings || {}), course: 'ko' };
  const { settings, goal, ...rest } = s;
  r.courses.ko = { ...COURSE(), ...rest };
  return r;
}

function bind(c) {
  Object.defineProperty(c, 'settings', { get: () => root.settings, enumerable: false, configurable: true });
  Object.defineProperty(c, 'goal', { get: () => root.goal, set: (v) => { root.goal = v; }, enumerable: false, configurable: true });
  return c;
}

/** Active la progression d'un cours. */
export function selectCourse(id) {
  root.courses[id] ||= COURSE();
  state = bind(root.courses[id]);
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(root)); } catch { /* navigation privée, quota… */ }
}

export const get = () => state;
export const exportAll = () => JSON.stringify(root);

/** Restaure une sauvegarde (nouveau ou ancien format). Lève une erreur si le fichier est invalide. */
export function importAll(data) {
  if (!data || typeof data !== 'object' || !(data.v === 2 ? data.courses : typeof data.xp === 'number')) throw new Error('invalid');
  root = normalize(data);
  selectCourse(root.settings.course || 'ko');
  save();
}

export function reset() {
  const keep = { lang: root.settings.lang, course: root.settings.course };
  root = ROOT();
  Object.assign(root.settings, keep);
  selectCourse(keep.course || 'ko');
  save();
}

// ---------- Dates ----------
// Marque une étape du parcours « Premiers pas » comme terminée.
export function markStep(k) {
  state.steps ||= {};
  if (state.steps[k]) return;
  state.steps[k] = true;
  save();
}

export function dayKey(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export const dayNumber = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY);

// ---------- XP, niveau, série ----------
export function addXp(n) {
  const before = level().lv;
  const k = dayKey();
  const dayBefore = state.days[k] || 0;
  state.xp += n;
  state.days[k] = dayBefore + n;
  save();
  // Événements pour les célébrations (niveau gagné, objectif du jour atteint)
  const after = level().lv;
  if (after > before) dispatchEvent(new CustomEvent('haru:levelup', { detail: after }));
  if (dayBefore < root.goal && state.days[k] >= root.goal) dispatchEvent(new CustomEvent('haru:goal', { detail: streak() }));
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
  if ((state.days[dayKey(d)] || 0) < root.goal) d.setDate(d.getDate() - 1);
  while ((state.days[dayKey(d)] || 0) >= root.goal) {
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

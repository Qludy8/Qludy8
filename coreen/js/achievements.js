// Succès : des badges à paliers (bronze → diamant), pour le plaisir de les voir évoluer.
import * as store from './store.js';
import { course } from './course.js';
import { roadState } from './road.js';

const L = (fr, en) => ({ fr, en });
export const TIERS = [L('Bronze', 'Bronze'), L('Argent', 'Silver'), L('Or', 'Gold'), L('Platine', 'Platinum'), L('Diamant', 'Diamond')];

// value(x) : valeur actuelle ; steps : seuils des cinq paliers ; lower : un score plus petit est meilleur (chrono).
// g : pastille [coréen, japonais] ; desc : {n} est remplacé par le seuil du prochain palier.
const DEFS = [
  { id: 'streak', g: ['매일', '毎日'], title: L('Régularité', 'Consistency'), desc: L('Atteindre l’objectif du jour {n} jours de suite', 'Hit the daily goal {n} days in a row'), steps: [3, 7, 14, 30, 60], value: (x) => Math.max(store.stat('streak'), store.streak()) },
  { id: 'days', g: ['날', '日'], title: L('Assiduité', 'Dedication'), desc: L('Étudier pendant {n} jours', 'Study on {n} days'), steps: [3, 10, 30, 75, 150], value: (x) => Object.values(x.st.days).filter((v) => v > 0).length },
  { id: 'xp', g: ['경험', '経験'], title: L('Collection d’XP', 'XP collector'), desc: L('Gagner {n} XP', 'Earn {n} XP'), steps: [100, 500, 1500, 4000, 10000], value: (x) => x.st.xp },
  { id: 'words', g: ['단어', '単語'], title: L('Vocabulaire', 'Vocabulary'), desc: L('Maîtriser {n} mots', 'Master {n} words'), steps: [10, 50, 150, 350, 600], value: () => store.mastered() },
  { id: 'lessons', g: ['공부', '勉強'], title: L('Rat de bibliothèque', 'Bookworm'), desc: L('Lire {n} leçons du guide', 'Read {n} guide lessons'), steps: [5, 15, 25, 40, 50], value: (x) => Object.keys(x.st.read || {}).length },
  { id: 'modules', g: ['길', '道'], title: L('Sur la route', 'On the road'), desc: L('Terminer {n} modules du parcours', 'Complete {n} modules'), steps: [1, 5, 12, 25, 40], value: (x) => x.R.units.filter((u) => u.complete).length },
  { id: 'plat', g: ['백금', '白金'], title: L('Platine', 'Platinum'), desc: L('Réussir l’examen de {n} modules', 'Pass the exam of {n} modules'), steps: [1, 3, 8, 18, 35], value: (x) => x.R.units.filter((u) => u.plat).length },
  { id: 'stars', g: ['별', '星'], title: L('Pluie d’étoiles', 'Star shower'), desc: L('Récolter {n} étoiles dans le parcours', 'Collect {n} stars on the path'), steps: [10, 40, 100, 220, 400], value: (x) => x.R.starCount },
  { id: 'traced', g: ['붓', '筆'], title: L('Calligraphe', 'Calligrapher'), desc: L('Tracer {n} signes de mémoire', 'Trace {n} characters from memory'), steps: [10, 40, 120, 300, 700], value: () => store.stat('traced') },
  { id: 'typed', g: ['타자', '入力'], title: L('Dactylo', 'Typist'), desc: L('Écrire {n} bonnes réponses au clavier', 'Type {n} correct answers'), steps: [20, 100, 300, 800, 2000], value: () => store.stat('typed') },
  { id: 'dictation', g: ['귀', '耳'], title: L('Oreille fine', 'Sharp ear'), desc: L('Réussir {n} dictées', 'Get {n} dictations right'), steps: [10, 50, 150, 400, 1000], value: () => store.stat('dictation') },
  { id: 'phrases', g: ['문장', '文'], title: L('Bâtisseur de phrases', 'Sentence builder'), desc: L('Reconstituer ou écrire {n} phrases', 'Rebuild or write {n} sentences'), steps: [5, 25, 75, 200, 500], value: () => store.stat('phrases') },
  { id: 'perfect', g: ['만점', '満点'], title: L('Sans faute', 'Flawless'), desc: L('Finir {n} séries sans aucune erreur', 'Finish {n} sets without a single mistake'), steps: [1, 5, 15, 40, 100], value: () => store.stat('perfect') },
  { id: 'combo', g: ['연속', '連続'], title: L('En série', 'On a roll'), desc: L('Enchaîner {n} bonnes réponses', 'Chain {n} correct answers'), steps: [5, 10, 20, 35, 50], value: () => store.stat('combo') },
  { id: 'final', g: ['종합', '総合'], title: L('Examen final', 'Final exam'), desc: L('Obtenir {n} % à l’examen final', 'Score {n}% on the final exam'), steps: [50, 65, 80, 90, 100], unit: ' %', value: (x) => x.st.final?.best || 0 },
  { id: 'daily', g: ['오늘', '今日'], title: L('Défi quotidien', 'Daily challenger'), desc: L('Relever {n} défis du jour', 'Complete {n} daily challenges'), steps: [1, 7, 20, 50, 100], value: (x) => Object.keys(x.st.daily || {}).length },
  { id: 'journal', g: ['공책', '手帳'], title: L('Carnet bien rempli', 'Full notebook'), desc: L('Enregistrer {n} phrases dans le carnet', 'Save {n} sentences to the notebook'), steps: [1, 5, 15, 30, 60], value: (x) => x.st.journal.length },
  { id: 'pairs', g: ['번개', '稲妻'], title: L('Éclair', 'Lightning'), desc: L('Finir le jeu des paires en moins de {n} s', 'Finish the pairs game in under {n} s'), steps: [45, 30, 22, 16, 12], unit: ' s', lower: true, value: (x) => (x.st.best?.pairs ? Math.round(x.st.best.pairs / 100) / 10 : 0) },
];

/** État de chaque succès : valeur, palier atteint (0 à 5), prochain seuil, avancement vers ce seuil. */
export function achievements() {
  const x = { st: store.get(), R: roadState() };
  const ja = course().id === 'ja';
  return DEFS.map((d) => {
    const value = d.value(x);
    const reached = (s) => (d.lower ? value > 0 && value <= s : value >= s);
    let tier = 0;
    while (tier < d.steps.length && reached(d.steps[tier])) tier++;
    const next = d.steps[tier] ?? null;
    const prev = tier ? d.steps[tier - 1] : d.lower ? d.steps[0] * 2 : 0;
    let progress = 1;
    if (next != null) {
      if (d.lower) progress = value > 0 ? Math.max(0, Math.min(1, (prev - value) / (prev - next))) : 0;
      else progress = Math.max(0, Math.min(1, (value - prev) / (next - prev)));
    }
    return { ...d, glyph: d.g[ja ? 1 : 0], value, tier, next, progress };
  });
}

/** Paliers franchis depuis la dernière vérification (et les mémorise). silent : mémoriser sans rien annoncer. */
export function newTiers(silent = false) {
  const st = store.get();
  st.ach ||= {};
  const fresh = [];
  for (const a of achievements()) {
    if (a.tier > (st.ach[a.id] || 0)) {
      fresh.push(a);
      st.ach[a.id] = a.tier;
    }
  }
  if (fresh.length) store.save();
  return silent ? [] : fresh;
}

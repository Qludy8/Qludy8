// Cours actif (coréen ou japonais) et langue de l'interface (français ou anglais).
import { KO } from './lang/ko.js';
import { JA } from './lang/ja.js';
import * as store from './store.js';
import { STRINGS } from './content/strings.js';

export const COURSES = { ko: KO, ja: JA };

export const course = () => COURSES[store.get().settings.course] || KO;
export const hasCourse = () => !!COURSES[store.get().settings.course];

export function setCourse(id) {
  store.get().settings.course = id;
  store.selectCourse(id);
  store.save();
}

// ---------- Traductions de l'interface ----------
export const lang = () => (store.get().settings.lang === 'en' ? 'en' : 'fr');

/** Texte de l'interface : t('clé', { variable }) ; la clé elle-même s'affiche si elle manque. */
export function t(key, vars) {
  const d = STRINGS[lang()][key] ?? STRINGS.fr[key] ?? key;
  return vars ? d.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : d;
}

/** Valeur bilingue { fr, en } → texte dans la langue de l'interface. */
export const tr = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang()] ?? o.fr);

/** Traduction d'un mot du lexique. */
export const gloss = (w) => (lang() === 'en' ? w.en || w.fr : w.fr);

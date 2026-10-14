// Langues : français (source) et anglais.
// · t(texteFrançais, { n })        → texte traduit (« {n} » est remplacé) (le français sert de clé ; repli sur le français)
// · L(obj, champ)                   → champ anglais d'une donnée : fr → en, desc → descEn, clsFr → clsEn, n → nEn
// · tr(message)                     → traduit un message libre venu du serveur (erreurs, notifications), via motifs
// · fmt(n) / locale()               → nombres au format de la langue
// Le serveur reste en français ; c'est le navigateur qui traduit.
import { EN, EN_PATTERNS } from './lang/en.js';

export const LANGS = [{ key: 'fr', label: 'Français', short: 'FR' }, { key: 'en', label: 'English', short: 'EN' }];
let lang = 'fr';

export function setLang(l) { lang = l === 'en' ? 'en' : 'fr'; }
export const getLang = () => lang;
export const locale = () => (lang === 'en' ? 'en-US' : 'fr-FR');
export const fmt = (n, opts) => Number(n).toLocaleString(locale(), opts);

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : s);
export function t(fr, vars) {
  return fill(lang === 'en' ? (EN[fr] ?? fr) : fr, vars);
}

const enField = (f) => (f === 'fr' ? 'en' : `${f.replace(/Fr$/, '')}En`);
export function L(o, field = 'fr') {
  if (!o) return '';
  return (lang === 'en' && o[enField(field)]) || o[field];
}

// motifs compilés une fois : [RegExp, remplacement] ; « {x} » capture n'importe quel texte
const PAT = EN_PATTERNS.map(([fr, en]) => {
  const names = [];
  const src = fr.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{(\w+)\\?\}/g, (_, k) => { names.push(k); return '(.+?)'; });
  return [new RegExp(`^${src}$`), en, names];
});
export function tr(msg) {
  if (lang !== 'en' || msg == null) return msg;
  const s = String(msg);
  if (EN[s] != null) return EN[s];
  for (const [re, en, names] of PAT) {
    const m = s.match(re);
    if (m) return fill(en, Object.fromEntries(names.map((k, i) => [k, tr(m[i + 1])])));
  }
  return s;
}

// navigateur : langue mémorisée, sinon celle du navigateur
if (typeof window !== 'undefined') {
  let saved = null;
  try { saved = localStorage.getItem('mugigo_lang'); } catch { /* stockage indisponible */ }
  setLang(saved || (navigator.language || 'fr').slice(0, 2));
  document.documentElement.lang = lang;
}
export function switchLang(l) {
  try { localStorage.setItem('mugigo_lang', l); } catch { /* stockage indisponible */ }
  location.reload();
}

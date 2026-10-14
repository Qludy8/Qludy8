// Dictionnaire anglais : chaque fichier couvre une partie du jeu (clé = texte français exact).
import { EN_APP } from './en-app.js';
import { EN_PAGES } from './en-pages.js';
import { EN_UI } from './en-ui.js';
import { EN_DATA, EN_SERVER, EN_SERVER_PATTERNS } from './en-data.js';

export const EN = { ...EN_DATA, ...EN_SERVER, ...EN_UI, ...EN_PAGES, ...EN_APP };
export const EN_PATTERNS = [...EN_SERVER_PATTERNS];

// Armes disposant d'un rendu 3D (images produites par scripts/render3d/build.py dans public/img/weapons).
// Les autres gardent le dessin vectoriel.
// à incrémenter à chaque nouvelle image d'arme : force les navigateurs à recharger les fichiers
export const IMG_V = 4;
export const HAS_3D = new Set(['vyrex9', 'quasar', 'orrin6', 'zephra', 'rhoden', 'taluk', 'lumen', 'longshade', 'gorgon', 'bastion',
  'nightfang', 'marrow', 'halcyon', 'ridgeback', 'tern', 'hookjaw', 'vespera']);

// Armes importées depuis une image (scripts/import-weapon.py) : cadre de l'arme dans l'espace 1000 × 360
// et inclinaison dans la carte (les couteaux dessinés sont inclinés de −24° par défaut).
export const PHOTO = {
  rhoden: { box: [41, 39.5, 917.5, 280.5] },
  vyrex9: { box: [271.5, 21.5, 456, 316.5] },
  longshade: { box: [40.5, 60.5, 918.5, 238.5] },
  nightfang: { box: [264, 21.5, 471.5, 316.5], tilt: 0 },
};

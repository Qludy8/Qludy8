// Images des armes : importées depuis des images détourées (scripts/import-weapon.py, zones de peinture
// dans scripts/weapon-zones.json), fichiers public/img/weapons/<arme>.photo.*
export const IMG_V = 5;
export const HAS_3D = new Set(['vyrex9', 'quasar', 'orrin6', 'zephra', 'rhoden', 'taluk', 'lumen', 'longshade', 'gorgon', 'bastion',
  'nightfang', 'marrow', 'halcyon', 'ridgeback', 'tern', 'hookjaw', 'vespera']);

// Armes importées depuis une image (scripts/import-weapon.py) : cadre de l'arme dans l'espace 1000 × 360
// et inclinaison dans la carte (les couteaux dessinés sont inclinés de −24° par défaut).
export const PHOTO = {
  rhoden: { box: [41, 39.5, 917.5, 280.5] },
  vyrex9: { box: [271.5, 21.5, 456, 316.5] },
  longshade: { box: [40.5, 60.5, 918.5, 238.5] },
  nightfang: { box: [264, 21.5, 471.5, 316.5], tilt: 0 },
  quasar: { box: [222.5, 21.5, 554.5, 316.5] },
  orrin6: { box: [177.5, 22, 644.5, 316] },
  zephra: { box: [98.5, 21.5, 802.5, 316.5] },
  taluk: { box: [129, 21.5, 741, 316.5] },
  lumen: { box: [40, 73.5, 919.5, 212.5] },
  gorgon: { box: [40, 89, 919.5, 181] },
  bastion: { box: [113, 22, 773, 316] },
  marrow: { box: [41, 52, 917.5, 255], tilt: -20 },
  halcyon: { box: [40.5, 81.5, 918, 196.5], tilt: -20 },
  ridgeback: { box: [41, 37.5, 917.5, 285], tilt: -20 },
  tern: { box: [41, 100.5, 918, 157.5], tilt: -20 },
  hookjaw: { box: [41, 85, 917.5, 189.5], tilt: -20 },
  vespera: { box: [40.5, 119, 918.5, 121.5], tilt: -20 },
};

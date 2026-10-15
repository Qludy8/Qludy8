# Masques de peinture par zones pour les armes importées (voir weapon-zones.json) :
# la silhouette de <arme>.photo.base.webp est multipliée par la valeur de chaque zone
# (1 = skin plein, 0.5 = skin atténué, 0 = matière d'origine conservée).
# usage : python weapon-zones.py <dossier des images> [arme…]
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

out = Path(sys.argv[1])
zones = json.loads((Path(__file__).parent / 'weapon-zones.json').read_text())
keys = sys.argv[2:] or [k for k in zones if not k.startswith('_')]
S = 2
for key in keys:
    z = zones[key]
    alpha = np.asarray(Image.open(out / f'{key}.photo.base.webp').convert('RGBA'))[..., 3].astype(np.float32) / 255
    val = Image.new('L', (alpha.shape[1], alpha.shape[0]), round(z['default'] * 255))
    d = ImageDraw.Draw(val)
    for v, poly in z['zones']:
        d.polygon([(x * S, y * S) for x, y in poly], fill=round(v * 255))
    v = np.asarray(val).astype(np.float32) / 255
    rgba = np.dstack([v, v, v, alpha])
    Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').save(out / f'{key}.photo.mask.png', optimize=True)
    print(key, 'ok')

# Importe une image d'arme (PNG détouré, fond transparent) dans le moteur de rendu du jeu.
# Produit, dans l'espace 1000 × 360 des skins (×2 : 2000 × 720) :
#   <arme>.photo.base.webp   l'image d'origine (visible là où la peinture du skin s'écaille)
#   <arme>.photo.light.webp  éclairage tiré de la photo (multiplié par la texture du skin)
#   <arme>.photo.spec.webp   reflets (les zones les plus claires de la photo)
#   <arme>.photo.mask.png    zones peintes par le skin (ici toute la silhouette)
# et affiche les cadres à reporter dans public/js/art/weapons3d.js.
#
# usage : python import-weapon.py image.png <arme> <dossier_sortie> [--rotate DEG] [--flip]
import sys, json
import numpy as np
from PIL import Image

args = sys.argv[1:]
rot = 0.0; flip = False
if '--rotate' in args: i = args.index('--rotate'); rot = float(args[i + 1]); del args[i:i + 2]
if '--flip' in args: args.remove('--flip'); flip = True
src, key, out = args

W, H, S = 1000, 360, 2           # espace des skins, suréchantillonnage
im = Image.open(src).convert('RGBA')
if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
if rot: im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
im = im.crop(im.getbbox())

# mise à l'échelle : l'arme tient dans 92 % × 88 % de l'espace, centrée
k = min(W * 0.92 / im.width, H * 0.88 / im.height)
w, h = round(im.width * k * S), round(im.height * k * S)
im = im.resize((w, h), Image.LANCZOS)
canvas = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
ox, oy = (W * S - w) // 2, (H * S - h) // 2
canvas.alpha_composite(im, (ox, oy))
a = np.asarray(canvas).astype(np.float32) / 255
rgb, alpha = a[..., :3], a[..., 3]
inside = alpha > 0.5

# éclairage : luminance de la photo, étirée sur la silhouette (le skin garde le relief et les détails)
lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
lo, hi = np.percentile(lum[inside], [2, 98])
l = np.clip((lum - lo) / max(hi - lo, 1e-3), 0, 1)
light = 0.32 + 0.68 * l ** 0.85
# reflets : seulement les zones les plus claires
p90, p995 = np.percentile(lum[inside], [88, 99.5])
spec = np.clip((lum - p90) / max(p995 - p90, 1e-3), 0, 1) ** 1.4

def save(arr, name, mode='RGBA'):
    Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8), mode).save(f'{out}/{key}.photo.{name}', 'WEBP' if name.endswith('webp') else 'PNG', quality=90)
canvas.save(f'{out}/{key}.photo.base.webp', 'WEBP', quality=90, method=6)
save(np.dstack([light, light, light, alpha]), 'light.webp')
save(np.dstack([spec, spec, spec, alpha]), 'spec.webp')
mask = Image.fromarray((np.dstack([np.ones_like(alpha)] * 3 + [alpha]) * 255).astype(np.uint8), 'RGBA')
mask.save(f'{out}/{key}.photo.mask.png', optimize=True)

ys, xs = np.nonzero(inside)
box = [round(xs.min() / S, 1), round(ys.min() / S, 1), round((xs.max() - xs.min()) / S, 1), round((ys.max() - ys.min()) / S, 1)]
print(json.dumps({key: {'box': box}}))

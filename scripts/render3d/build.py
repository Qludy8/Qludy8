# Rendu 3D des armes (Blender / Cycles) pour Mugigo.
# Reconstruit chaque arme en volume à partir de ses profils 2D (public/js/art/weapons.js, exportés en JSON),
# puis produit, dans l'espace 1000 × 360 des skins (2× : 2000 × 720) :
#   <arme>.base.webp   rendu complet ; les zones peintes y sont en acier nu (visible quand la peinture s'écaille)
#   <arme>.light.webp  éclairage diffus des zones peintes (multiplié par la texture du skin)
#   <arme>.spec.webp   reflets spéculaires des zones peintes (ajoutés en « screen »)
#   <arme>.mask.png    masque des zones peintes
#
# usage : python build.py parts.json out_dir [modèle …] [--samples N] [--scale S]
import sys, os, json, math, re
import bpy, bmesh
import numpy as np
from mathutils import Vector

args = [a for a in sys.argv[1:]]
samples = 96
scale = 2
if '--samples' in args: i = args.index('--samples'); samples = int(args[i + 1]); del args[i:i + 2]
if '--scale' in args: i = args.index('--scale'); scale = float(args[i + 1]); del args[i:i + 2]
parts_file, out_dir, *only = args
DATA = json.load(open(parts_file))
os.makedirs(out_dir, exist_ok=True)

W, H = 1000, 360

# ───────────────────────── chemins SVG → polygones
TOK = re.compile(r'[MmLlHhVvQqTtCcSsAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?')

def flatten(d, seg=10):
    toks = TOK.findall(d)
    i, cmd = 0, None
    x = y = sx = sy = 0.0
    subs, cur = [], []
    def num():
        nonlocal i
        v = float(toks[i]); i += 1; return v
    while i < len(toks):
        t = toks[i]
        if re.match(r'[A-Za-z]', t): cmd = t; i += 1
        if cmd in 'Zz':
            if cur: subs.append(cur); cur = []
            x, y = sx, sy
            continue
        rel = cmd.islower(); c = cmd.upper()
        if c == 'M':
            nx, ny = num(), num()
            if rel: nx += x; ny += y
            if cur: subs.append(cur)
            cur = [(nx, ny)]; x, y = sx, sy = nx, ny
            cmd = 'l' if rel else 'L'
        elif c == 'L':
            nx, ny = num(), num()
            if rel: nx += x; ny += y
            cur.append((nx, ny)); x, y = nx, ny
        elif c == 'H':
            nx = num(); nx = nx + x if rel else nx
            cur.append((nx, y)); x = nx
        elif c == 'V':
            ny = num(); ny = ny + y if rel else ny
            cur.append((x, ny)); y = ny
        elif c == 'Q':
            qx, qy, nx, ny = num(), num(), num(), num()
            if rel: qx += x; qy += y; nx += x; ny += y
            for k in range(1, seg + 1):
                u = k / seg
                cur.append(((1 - u) ** 2 * x + 2 * (1 - u) * u * qx + u * u * nx, (1 - u) ** 2 * y + 2 * (1 - u) * u * qy + u * u * ny))
            x, y = nx, ny
        elif c == 'C':
            c1x, c1y, c2x, c2y, nx, ny = [num() for _ in range(6)]
            if rel: c1x += x; c1y += y; c2x += x; c2y += y; nx += x; ny += y
            for k in range(1, seg + 1):
                u = k / seg; v = 1 - u
                cur.append((v ** 3 * x + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u ** 3 * nx, v ** 3 * y + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u ** 3 * ny))
            x, y = nx, ny
        elif c == 'A':
            rx, ry, rot, large, sweep, nx, ny = [num() for _ in range(7)]
            if rel: nx += x; ny += y
            cur.extend(arc_points(x, y, rx, ry, rot, int(large), int(sweep), nx, ny))
            x, y = nx, ny
        else:
            raise ValueError('commande SVG non gérée : ' + cmd)
    if cur: subs.append(cur)
    # nettoyage : points dupliqués consécutifs, sous-chemins dégénérés
    out = []
    for s in subs:
        pts = [s[0]]
        for p in s[1:]:
            if abs(p[0] - pts[-1][0]) > 1e-6 or abs(p[1] - pts[-1][1]) > 1e-6: pts.append(p)
        if len(pts) > 1 and abs(pts[0][0] - pts[-1][0]) < 1e-6 and abs(pts[0][1] - pts[-1][1]) < 1e-6: pts.pop()
        out.append(pts)
    return out

def arc_points(x1, y1, rx, ry, phi, fa, fs, x2, y2, seg=24):
    # conversion SVG arc → centre (W3C F.6.5)
    phi = math.radians(phi); cp, sp = math.cos(phi), math.sin(phi)
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    rx, ry = abs(rx), abs(ry)
    lam = x1p ** 2 / rx ** 2 + y1p ** 2 / ry ** 2
    if lam > 1: rx *= math.sqrt(lam); ry *= math.sqrt(lam)
    num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
    den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    co = math.sqrt(max(0, num / den)) * (-1 if fa == fs else 1)
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx = cp * cxp - sp * cyp + (x1 + x2) / 2
    cy = sp * cxp + cp * cyp + (y1 + y2) / 2
    def ang(ux, uy, vx, vy):
        a = math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a
    t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not fs and dt > 0: dt -= 2 * math.pi
    elif fs and dt < 0: dt += 2 * math.pi
    pts = []
    for k in range(1, seg + 1):
        t = t1 + dt * k / seg
        pts.append((cx + rx * math.cos(t) * cp - ry * math.sin(t) * sp, cy + rx * math.cos(t) * sp + ry * math.sin(t) * cp))
    return pts

def bbox(polys):
    xs = [p[0] for s in polys for p in s]; ys = [p[1] for s in polys for p in s]
    return min(xs), min(ys), max(xs), max(ys)

def area(s):
    return 0.5 * sum(s[i][0] * s[(i + 1) % len(s)][1] - s[(i + 1) % len(s)][0] * s[i][1] for i in range(len(s)))

# ───────────────────────── scène
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, base=(0.5, 0.5, 0.5), metal=0.0, rough=0.5, coat=0.0, bump=None, emission=None, holdout=False, spec=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; Lk = nt.links
    N.clear()
    out = N.new('ShaderNodeOutputMaterial')
    if holdout:
        h = N.new('ShaderNodeHoldout'); Lk.new(h.outputs[0], out.inputs[0]); return m
    if emission is not None:
        e = N.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*emission, 1); e.inputs['Strength'].default_value = 1
        Lk.new(e.outputs[0], out.inputs[0]); return m
    b = N.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*base, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if spec is not None: b.inputs['Specular IOR Level'].default_value = spec
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.08
    Lk.new(b.outputs[0], out.inputs[0])
    if bump:
        kind, scale_, strength = bump
        tc = N.new('ShaderNodeTexCoord')
        if kind == 'noise':
            tx = N.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = scale_; tx.inputs['Detail'].default_value = 8
        elif kind == 'checker':
            tx = N.new('ShaderNodeTexChecker'); tx.inputs['Scale'].default_value = scale_
        elif kind == 'scratch':
            # micro-rayures : bruit étiré horizontalement
            mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.02, 1, 1)
            Lk.new(tc.outputs['Object'], mp.inputs['Vector'])
            tx = N.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = scale_; tx.inputs['Detail'].default_value = 10
            Lk.new(mp.outputs['Vector'], tx.inputs['Vector'])
        if kind != 'scratch': Lk.new(tc.outputs['Object'], tx.inputs['Vector'])
        bm = N.new('ShaderNodeBump'); bm.inputs['Strength'].default_value = strength
        Lk.new(tx.outputs['Fac'] if 'Fac' in tx.outputs else tx.outputs[0], bm.inputs['Height'])
        Lk.new(bm.outputs['Normal'], b.inputs['Normal'])
    if name.startswith('wood'):
        # veinage : ondes étirées
        tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.05, 1.2, 1)
        wv = N.new('ShaderNodeTexWave'); wv.inputs['Scale'].default_value = 0.6; wv.inputs['Distortion'].default_value = 6; wv.inputs['Detail'].default_value = 4
        ramp = N.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color = (0.10, 0.035, 0.012, 1); ramp.color_ramp.elements[1].color = (0.32, 0.13, 0.05, 1)
        Lk.new(tc.outputs['Object'], mp.inputs['Vector']); Lk.new(mp.outputs['Vector'], wv.inputs['Vector'])
        Lk.new(wv.outputs['Fac'], ramp.inputs['Fac']); Lk.new(ramp.outputs['Color'], b.inputs['Base Color'])
    return m

def materials(paint_mode):
    M = {
        'poly':   mat('poly', (0.05, 0.052, 0.056), 0, 0.5, bump=('noise', 0.35, 0.08)),
        'rubber': mat('rubber', (0.025, 0.025, 0.027), 0, 0.85, bump=('noise', 0.6, 0.12)),
        'metal':  mat('metal', (0.3, 0.31, 0.33), 1, 0.34, bump=('scratch', 0.4, 0.05)),
        'metal2': mat('metal2', (0.36, 0.37, 0.39), 1, 0.3, bump=('scratch', 0.4, 0.05)),
        'steel':  mat('steel', (0.78, 0.79, 0.8), 1, 0.16),
        'brass':  mat('brass', (0.85, 0.6, 0.25), 1, 0.25),
        'wood':   mat('wood', (0.25, 0.1, 0.04), 0, 0.42, coat=0.4),
        'glass':  mat('glass', (0.01, 0.02, 0.03), 0.2, 0.04, coat=1.0),
        'hole':   mat('hole', (0.004, 0.004, 0.005), 0, 0.9),
        'tex':    mat('tex', (0.03, 0.032, 0.035), 0, 0.7, bump=('checker', 4.5, 0.6)),
        'line':   mat('line', (0.01, 0.01, 0.012), 0, 0.8),
    }
    if paint_mode == 'bare':
        M['paint'] = mat('paint', (0.6, 0.61, 0.62), 1, 0.33, bump=('scratch', 0.5, 0.08))
    else:
        # passes de la peinture : tout le reste est masqué (holdout, garde l'occultation)
        #  diffuse : blanc mat sans reflet → éclairage pur ; gloss : noir verni → reflets seuls
        if paint_mode == 'diffuse':
            M['paint'] = mat('paint', (1, 1, 1), 0, 1.0, spec=0.0)
        else:
            M['paint'] = mat('paint', (0, 0, 0), 0, 0.38, coat=0.15, spec=0.5)
        for k in list(M):
            if k != 'paint': M[k] = mat(k + '_h', holdout=True)
    return M

# demi-épaisseurs (unités 1000 × 360) par matériau ; les couteaux sont bien plus fins
DEPTH = {'paint': 22, 'poly': 21, 'rubber': 19, 'wood': 21, 'metal': 13, 'metal2': 4, 'steel': 3, 'brass': 3, 'glass': 3, 'hole': 1, 'tex': 1.2, 'line': 0.6}
DEPTH_KNIFE = {'paint': 3.2, 'poly': 9, 'rubber': 9, 'wood': 9, 'metal': 7, 'metal2': 2, 'steel': 1.6, 'brass': 1.6, 'glass': 1.5, 'hole': 0.6, 'tex': 0.8, 'line': 0.4}
OVERLAY = {'metal2', 'steel', 'brass', 'glass', 'hole', 'tex', 'line'}

def to3(p):  # SVG → Blender (y vers le haut)
    return (p[0], -p[1])

def curve_object(name, polys, depth, bevel, material, z0=0.0):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '2D'; cu.fill_mode = 'BOTH'
    cu.extrude = max(0.01, depth - bevel); cu.bevel_depth = bevel; cu.bevel_resolution = 6
    cu.resolution_u = 1
    for s in polys:
        if len(s) < 3: continue
        sp = cu.splines.new('POLY'); sp.points.add(len(s) - 1)
        for k, p in enumerate(s):
            x, y = to3(p); sp.points[k].co = (x, y, 0, 1)
        sp.use_cyclic_u = True; sp.use_smooth = True
    ob = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(ob)
    ob.location.z = z0
    ob.data.materials.append(material)
    return ob

def cylinder(name, x0, x1, yc, r, material, z0=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=r, depth=x1 - x0, location=((x0 + x1) / 2, -yc, z0), rotation=(0, math.pi / 2, 0))
    ob = bpy.context.active_object; ob.name = name
    bpy.ops.object.shade_smooth()
    bev = ob.modifiers.new('bev', 'BEVEL'); bev.width = min(1.2, r * 0.25); bev.segments = 3
    ob.data.materials.append(material)
    return ob

def tube(name, polys, r, material, z0=0.0):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 4
    for s in polys:
        sp = cu.splines.new('POLY'); sp.points.add(len(s) - 1)
        for k, p in enumerate(s):
            x, y = to3(p); sp.points[k].co = (x, y, z0, 1)
    ob = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(ob)
    ob.data.materials.append(material)
    return ob

def is_bar(polys):
    # pièce métallique fine et allongée (canon, tube, tige) → cylindre
    if len(polys) != 1 or len(polys[0]) > 8: return None
    x0, y0, x1, y1 = bbox(polys)
    w, h = x1 - x0, y1 - y0
    if h <= 24 and w >= 3.2 * h and abs(abs(area(polys[0])) - w * h) < 0.12 * w * h:
        return x0, x1, (y0 + y1) / 2, h / 2
    return None

# ───────────────────────── volumes « gonflés » (champ de hauteur selon la distance au bord)
RES = 0.5                      # unité SVG par cellule de grille
GW, GH = int(W / RES), int(H / RES)

def raster(polys):
    from PIL import Image, ImageDraw
    acc = np.zeros((GH, GW), dtype=bool)
    for s in polys:
        if len(s) < 3: continue
        im = Image.new('L', (GW, GH), 0)
        ImageDraw.Draw(im).polygon([(x / RES, y / RES) for x, y in s], fill=255)
        acc ^= np.asarray(im) > 127          # règle pair-impair (évidements)
    return acc

def stroke(polys, width):
    from PIL import Image, ImageDraw
    im = Image.new('L', (GW, GH), 0); dr = ImageDraw.Draw(im)
    for s in polys:
        if len(s) >= 2: dr.line([(x / RES, y / RES) for x, y in s], fill=255, width=max(1, int(width / RES)))
    return np.asarray(im) > 127

# profils : arrondi des bords (rayon R en unités) + léger bombé au centre
PROFILE = {
    'paint': (14, 0.4), 'poly': (14, 0.35), 'rubber': (14, 0.4), 'wood': (16, 0.4),
    'metal': (6, 0.08), 'metal2': (2.2, 0.05), 'steel': (1.5, 0.05), 'brass': (1.5, 0.05), 'glass': (3, 0.3), 'tex': (1.2, 0.02),
}

def heightfield(mask, D, R, crown, knife_blade=False):
    from scipy.ndimage import distance_transform_edt, gaussian_filter
    dist = distance_transform_edt(np.pad(mask, 1))[1:-1, 1:-1] * RES
    if knife_blade:
        # émouture : biseau en V jusqu'au dos de la lame
        m = max(dist.max(), 1e-3)
        h = D * np.clip(dist / (m * 0.85), 0, 1) ** 0.75
    else:
        R = max(0.5, min(R, dist.max()))
        u = np.clip(dist / R, 0, 1)
        h = D * np.sqrt(1 - (1 - u) ** 2) * (1 - crown)
        m = max(dist.max(), 1e-3)
        # bombé lissé (sans arête le long de l'axe médian)
        cr = gaussian_filter(np.clip(dist / m, 0, 1) ** 0.6, sigma=max(2.0, m * 0.35 / RES))
        h += D * crown * cr / max(cr.max(), 1e-3)
    h = gaussian_filter(h, 0.6) * mask
    return h

def grid_mesh(name, mask, z, material):
    ys, xs = np.nonzero(mask)
    if len(xs) < 4: return None
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    sub = mask[y0:y1 + 2, x0:x1 + 2] if False else mask[y0:y1 + 1, x0:x1 + 1]
    zz = z[y0:y1 + 1, x0:x1 + 1]
    hh, ww = sub.shape
    idx = -np.ones((hh, ww), dtype=np.int64)
    vy, vx = np.nonzero(sub)
    idx[vy, vx] = np.arange(len(vx))
    verts = np.stack([(vx + x0) * RES, -(vy + y0) * RES, zz[vy, vx]], axis=1)
    a = idx[:-1, :-1]; b = idx[:-1, 1:]; c = idx[1:, 1:]; d = idx[1:, :-1]
    ok = (a >= 0) & (b >= 0) & (c >= 0) & (d >= 0)
    faces = np.stack([a[ok], d[ok], c[ok], b[ok]], axis=1)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(verts)); me.vertices.foreach_set('co', verts.astype(np.float32).ravel())
    me.loops.add(len(faces) * 4); me.loops.foreach_set('vertex_index', faces.astype(np.int32).ravel())
    me.polygons.add(len(faces)); me.polygons.foreach_set('loop_start', np.arange(0, len(faces) * 4, 4, dtype=np.int32))
    me.polygons.foreach_set('use_smooth', np.ones(len(faces), dtype=bool))
    me.update(calc_edges=True); me.validate()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    ob.data.materials.append(material)
    return ob

def build(model, paint_mode):
    spec = DATA[model]
    knife = spec['cls'] == 'knife'
    D = DEPTH_KNIFE if knife else DEPTH
    M = materials(paint_mode)
    top = np.zeros((GH, GW), dtype=np.float32)      # hauteur de la surface déjà construite
    for idx, p in enumerate(spec['parts']):
        k, d = p['k'], p['d']
        if k == 'hi': continue
        polys = flatten(d)
        name = f'{model}_{idx}_{k}'
        if k in ('line', 'wire'):
            lines = [s for s in polys if len(s) >= 2]
            if not lines: continue
            if k == 'line':
                # gravure : trait sombre posé sur la surface (hauteur locale)
                mk = stroke(lines, 1.6) & (top > 0.5)      # seulement sur une surface existante
                z = np.where(mk, top + 0.15, 0)
                grid_mesh(name, mk, z, M['line'])
            else:
                tube(name, lines, 4.5 if not knife else 3, M['metal'], z0=0)
            continue
        polys = [s for s in polys if len(s) >= 3]
        if not polys: continue
        if k == 'metal' and not knife:
            bar = is_bar(polys)
            if bar:
                x0, x1, yc, r = bar
                cylinder(name, x0, x1, yc, r, M[k], z0=0)
                # le cylindre compte dans la surface (pour poser ce qui le recouvre)
                mk = raster(polys); top = np.where(mk, np.maximum(top, r), top)
                continue
        mk = raster(polys)
        if not mk.any(): continue
        if k in ('hole', 'shade'):
            # évidement (ou zone ombrée) : fond sombre en retrait de la surface
            z = np.where(mk, np.maximum(top - (2.5 if k == 'hole' else 0.8), 0.2), 0)
            grid_mesh(name, mk, z, M['hole']); continue
        R, crown = PROFILE.get(k, (6, 0.1))
        h = heightfield(mk, D[k], R, crown, knife_blade=(knife and k == 'paint'))
        if k in OVERLAY:
            base = np.where(mk, top, 0)
            # base lissée sur l'empreinte pour éviter les marches
            z = base.max() * 0 + base + h + 0.2
        else:
            z = h + 0.02 * idx
        z = np.where(mk, z, 0).astype(np.float32)
        grid_mesh(name, mk, z, M[k])
        top = np.where(mk, np.maximum(top, z), top)

def lights_and_camera():
    sc = bpy.context.scene
    # monde : dégradé clair en haut, sombre en bas (reflets de studio sur le métal)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    N = w.node_tree.nodes; Lk = w.node_tree.links
    bg = N['Background']
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.45; ramp.color_ramp.elements[0].color = (0.015, 0.016, 0.02, 1)
    ramp.color_ramp.elements[1].position = 0.62; ramp.color_ramp.elements[1].color = (0.55, 0.57, 0.62, 1)
    mr = N.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -1; mr.inputs['From Max'].default_value = 1
    Lk.new(tc.outputs['Generated'], sep.inputs[0])
    Lk.new(N.new('ShaderNodeTexCoord').outputs['Normal'], sep.inputs[0]) if False else None
    vec = N.new('ShaderNodeTexCoord')
    sep2 = N.new('ShaderNodeSeparateXYZ'); Lk.new(vec.outputs['Generated'], sep2.inputs[0])
    Lk.new(sep2.outputs['Z'], ramp.inputs['Fac'])
    Lk.new(ramp.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 0.35

    def area_light(name, loc, rot, size, energy, color=(1, 1, 1), shape='RECTANGLE', sy=None):
        ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy; ld.color = color; ld.shape = shape
        ld.size = size; ld.size_y = sy or size
        ob = bpy.data.objects.new(name, ld); bpy.context.collection.objects.link(ob)
        ob.location = loc; ob.rotation_euler = rot
        return ob
    cx, cy = W / 2, -H / 2
    # clé : grande boîte à lumière au-dessus, légèrement devant
    area_light('key', (cx - 150, cy + 700, 260), (math.radians(-68), math.radians(-8), 0), 1600, 1.3e6, sy=500)
    # bande fine au-dessus : liseré lumineux sur les arêtes supérieures
    area_light('strip', (cx, cy + 600, 120), (math.radians(-82), 0, 0), 1600, 4.0e5, sy=60)
    # douche douce de face
    area_light('fill', (cx - 500, cy - 60, 900), (math.radians(4), math.radians(-28), 0), 900, 0.7e5, sy=600)
    # contre-jour bleuté en bas
    area_light('rim', (cx, cy - 520, -200), (math.radians(-235), 0, 0), 1500, 3.0e5, color=(0.75, 0.85, 1.0), sy=300)

    cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = W
    cam = bpy.data.objects.new('cam', cam_d); bpy.context.collection.objects.link(cam)
    tilt = math.radians(9)          # légère plongée : on voit le dessus des pièces
    cam.location = (cx, cy + 2000 * math.sin(tilt), 2000 * math.cos(tilt))
    cam.rotation_euler = (-tilt, 0, 0)
    sc.camera = cam
    sc.render.resolution_x = int(W * scale); sc.render.resolution_y = int(H * scale)
    cam_d.sensor_fit = 'HORIZONTAL'
    cam_d.clip_start = 1; cam_d.clip_end = 5000

def render_setup():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.cycles.max_bounces = 6
    sc.render.threads_mode = 'AUTO'

def save_webp(arr, path, alpha=True):
    from PIL import Image
    a = np.clip(arr, 0, 1)
    img = Image.fromarray((a * 255 + 0.5).astype(np.uint8), 'RGBA' if alpha else 'RGB')
    img.save(path, 'WEBP', quality=88, method=6)

def pixels(img):
    w, h = img.size
    a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    return a[::-1]

def render_pass(model, mode):
    reset(); render_setup(); build(model, mode); lights_and_camera()
    sc = bpy.context.scene
    if mode != 'bare':
        sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
        sc.cycles.samples = max(32, samples // 2)
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    tmp = os.path.join(out_dir, f'_{model}.{mode}.png')
    sc.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    from PIL import Image
    im = Image.open(tmp).convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255.0
    os.remove(tmp)
    return a

def render_model(model):
    from PIL import Image
    base = render_pass(model, 'bare')
    save_webp(base, os.path.join(out_dir, f'{model}.base.webp'))
    diff = render_pass(model, 'diffuse')
    gloss = render_pass(model, 'gloss')
    alpha = diff[..., 3]
    lum = diff[..., :3].mean(axis=2)
    # éclairage → gris normalisé : le 98e centile de la zone peinte vaut 1
    ref = np.percentile(lum[alpha > 0.5], 98) if (alpha > 0.5).any() else 1
    light = np.clip(lum / max(ref, 1e-3), 0, 1) ** 0.9
    save_webp(np.dstack([light, light, light, alpha]), os.path.join(out_dir, f'{model}.light.webp'))
    gl = gloss[..., :3].mean(axis=2)
    gref = np.percentile(gl[alpha > 0.5], 99.5) if (alpha > 0.5).any() else 1
    g = np.clip(gl / max(gref, 1e-3), 0, 1) ** 1.6
    save_webp(np.dstack([g, g, g, alpha]), os.path.join(out_dir, f'{model}.spec.webp'))
    m = (np.clip(alpha, 0, 1) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(m, 'L').save(os.path.join(out_dir, f'{model}.mask.png'), optimize=True)

models = only or [m for m in DATA if not os.path.exists(os.path.join(out_dir, f'{m}.mask.png'))]
for m in models:
    print('──', m, flush=True)
    render_model(m)
print('fini', flush=True)

#!/usr/bin/env python3
"""Construit le catalogue de Gēmu : des milliers de jeux vidéo réels, classés par popularité et qualité.

Sources (aucune image n'est créée ni retouchée, tout vient du jeu lui-même) :
  * SteamSpy : liste des jeux Steam les plus possédés, avec leurs avis.
  * API publique du magasin Steam (IStoreBrowseService/GetItems) : affiche officielle du jeu
    (« library capsule » 600×900), captures d'écran en jeu, studio, franchise, date, tags, note.
  * Wikipédia (API REST) pour les grands jeux absents de Steam (Nintendo, PlayStation, arcade,
    mobile…) listés dans scripts/hors-steam.txt : jaquette officielle de l'article.

Usage :
  python3 scripts/build-catalog.py --fetch      # télécharge ce qui manque dans le cache, puis construit
  python3 scripts/build-catalog.py              # reconstruit depuis le cache seulement
Cache : .cache/catalog (ou --cache DOSSIER). Sortie : catalog/games.json et catalog/details.json.
"""
import argparse, glob, hashlib, html, json, math, os, re, sys, time, unicodedata
import urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'GemuCatalogBuilder/1.0 (jeu de cartes non commercial)'}

# --- réglages -------------------------------------------------------------------------------
MIN_REVIEWS = 500            # avis Steam minimum pour entrer au catalogue
# jeux très connus absents des listes SteamSpy (Dota 2, Overwatch 2…)
EXTRA_APPIDS = [570, 2357570, 1085660, 236390, 444090, 230410, 8930, 289070, 7670, 400, 220, 70, 50, 130, 4000, 10, 240, 20920, 22380, 377160]
SEXUAL_TAGS = {12095, 6650, 24904, 9130}   # contenu sexuel, nudité, NSFW, hentai
BLOCK_WORDS = re.compile(r'\b(hentai|nsfw|waifu|succubus|nekopara|playtest|demo|test server|dedicated server|soundtrack|sdk|benchmark|wallpaper)\b', re.I)
CUTS = [('M', 0.03), ('L', 0.10), ('E', 0.25), ('R', 0.50), ('U', 0.75), ('C', 1.0)]
GENRES = {   # identique à shared/config.js
    'action': [19, 1646, 4106], 'aventure': [21, 3834, 1695], 'rpg': [122, 4231, 4434, 1754],
    'tir': [1663, 1774, 3814], 'strategie': [9, 1676, 1741, 1708], 'simulation': [599, 12472, 4328, 1100687],
    'horreur': [1667, 1721, 3978, 1659], 'inde': [492], 'plateforme': [1625, 1628], 'course': [699, 701, 1644],
    'survie': [1662, 1702, 1100689, 7332], 'roguelike': [1716, 3959, 42804], 'combat': [1743],
    'multi': [128, 1775, 3878], 'anime': [4085], 'casse': [1664],
}
# Genres des jeux hors Steam, par univers (les autres reçoivent « aventure » par défaut).
OFFSTEAM_GENRES = {
    'The Legend of Zelda': ['aventure', 'action'], 'Super Mario': ['plateforme', 'aventure'], 'Paper Mario': ['rpg', 'aventure'],
    'Mario & Luigi': ['rpg'], 'Mario Kart': ['course', 'multi'], 'Mario Party': ['multi', 'casse'], 'Luigi\'s Mansion': ['aventure', 'horreur'],
    'Donkey Kong': ['plateforme'], 'Super Smash Bros.': ['combat', 'multi'], 'Animal Crossing': ['simulation'], 'Splatoon': ['tir', 'multi'],
    'Metroid': ['action', 'plateforme'], 'Kirby': ['plateforme'], 'Yoshi': ['plateforme'], 'Star Fox': ['tir', 'action'], 'F-Zero': ['course'],
    'Pikmin': ['strategie'], 'Fire Emblem': ['strategie', 'rpg'], 'Xenoblade': ['rpg', 'anime'], 'Bayonetta': ['action'], 'Astral Chain': ['action'],
    'Wii': ['course', 'multi'], 'Ring Fit': ['course'], 'Nintendogs': ['simulation'], 'Brain Age': ['casse'], 'Tomodachi': ['simulation'],
    'Professeur Layton': ['casse', 'aventure'], 'Ace Attorney': ['casse', 'aventure'], 'Golden Sun': ['rpg'], 'Mother': ['rpg'],
    'Advance Wars': ['strategie'], 'Punch-Out!!': ['combat'], 'Duck Hunt': ['tir'], 'Excite': ['course'], 'Kid Icarus': ['action'],
    'Mario Sports': ['course', 'multi'], 'Arms': ['combat'], '1-2-Switch': ['multi'], 'Clubhouse Games': ['casse', 'multi'],
    'Mario + Rabbids': ['strategie'], 'Pokémon': ['rpg', 'aventure'], 'Bloodborne': ['action', 'rpg', 'horreur'], 'Souls': ['action', 'rpg'],
    'Gran Turismo': ['course'], 'Astro Bot': ['plateforme'], 'Ghost of Tsushima': ['action', 'aventure'], 'Uncharted': ['action', 'aventure'],
    'The Last of Us': ['action', 'aventure', 'horreur'], 'Crash Bandicoot': ['plateforme'], 'Spyro': ['plateforme'], 'Jak and Daxter': ['plateforme', 'action'],
    'Ratchet & Clank': ['plateforme', 'tir'], 'Sly Cooper': ['plateforme'], 'Team Ico': ['aventure'], 'Gravity Rush': ['action'], 'Killzone': ['tir'],
    'Resistance': ['tir'], 'LittleBigPlanet': ['plateforme'], 'Dreams': ['simulation'], 'inFAMOUS': ['action'], 'God of War': ['action'],
    'Metal Gear': ['action', 'aventure'], 'Silent Hill': ['horreur'], 'Resident Evil': ['horreur', 'action'], 'Final Fantasy': ['rpg'],
    'Kingdom Hearts': ['rpg', 'action'], 'Chrono': ['rpg'], 'Dragon Quest': ['rpg'], 'Tekken': ['combat'], 'Soulcalibur': ['combat'],
    'Ridge Racer': ['course'], 'Tony Hawk\'s': ['course'], 'Medal of Honor': ['tir'], 'PaRappa': ['casse'], 'Ape Escape': ['plateforme'],
    'MediEvil': ['action'], 'Twisted Metal': ['course', 'action'], 'Syphon Filter': ['tir'], 'Legend of Dragoon': ['rpg'], 'Xenogears': ['rpg'],
    'Suikoden': ['rpg'], 'Vagrant Story': ['rpg'], 'Halo': ['tir'], 'Fable': ['rpg'], 'Gears of War': ['tir'], 'Forza': ['course'],
    'Banjo-Kazooie': ['plateforme'], 'Conker': ['plateforme'], 'James Bond': ['tir'], 'Perfect Dark': ['tir'], 'Viva Piñata': ['simulation'],
    'Kameo': ['action'], 'Jet Set Radio': ['action'], 'Sonic': ['plateforme'], 'Streets of Rage': ['combat'], 'Phantasy Star': ['rpg', 'multi'],
    'Virtua Fighter': ['combat'], 'Out Run': ['course'], 'Space Invaders': ['tir'], 'Pac-Man': ['casse'], 'Galaxian': ['tir'], 'Asteroids': ['tir'],
    'Pong': ['course'], 'Breakout': ['casse'], 'Centipede': ['tir'], 'Frogger': ['casse'], 'Dig Dug': ['casse'], 'Q*bert': ['casse'],
    'Defender': ['tir'], 'Street Fighter': ['combat'], 'Mortal Kombat': ['combat'], 'NBA Jam': ['course'], 'TMNT': ['combat'],
    'Les Simpson': ['combat'], 'Bomberman': ['multi', 'casse'], 'Tetris': ['casse'], 'Mega Man': ['plateforme', 'action'],
    'Castlevania': ['plateforme', 'action'], 'Contra': ['tir'], 'Ninja Gaiden': ['action'], 'Mana': ['rpg'], 'Ice Climber': ['plateforme'],
    'Wario': ['plateforme'], 'WarioWare': ['casse'], 'Fortnite': ['tir', 'multi'], 'Minecraft': ['survie', 'aventure'],
    'League of Legends': ['strategie', 'multi'], 'Valorant': ['tir', 'multi'], 'Warcraft': ['strategie', 'rpg'], 'StarCraft': ['strategie'],
    'Diablo': ['rpg', 'action'], 'Blizzard': ['strategie', 'multi'], 'Genshin Impact': ['rpg', 'anime'], 'Honkai': ['rpg', 'anime'],
    'Zenless Zone Zero': ['action', 'anime'], 'Roblox': ['multi', 'simulation'], 'Clash': ['strategie', 'multi'], 'Brawl Stars': ['action', 'multi'],
    'Candy Crush': ['casse'], 'Angry Birds': ['casse'], 'Subway Surfers': ['course'], 'Temple Run': ['course'], 'Fruit Ninja': ['casse'],
    'Plants vs. Zombies': ['strategie'], 'Flappy Bird': ['casse'], 'Monument Valley': ['casse'], 'Alto': ['course'], 'Free Fire': ['tir', 'multi'],
    'PUBG': ['tir', 'multi'], 'Call of Duty': ['tir', 'multi'], 'Honor of Kings': ['strategie', 'multi'], 'Mobile Legends': ['strategie', 'multi'],
    'Hay Day': ['simulation'], 'Grand Theft Auto': ['action', 'aventure'], 'Need for Speed': ['course'], 'Burnout': ['course'],
    'Spider-Man': ['action'], 'SSX': ['course'], 'TimeSplitters': ['tir'], 'Ty': ['plateforme'], 'Dragon Ball': ['combat', 'anime'],
    'Naruto': ['combat', 'anime'], 'Guitar Hero': ['casse', 'multi'], 'Rock Band': ['casse', 'multi'], 'Just Dance': ['multi'],
    'SingStar': ['multi'], 'Buzz!': ['multi', 'casse'], 'Pro Evolution Soccer': ['course'], 'EA Sports FC': ['course'], 'Bully': ['action'],
    'Manhunt': ['action', 'horreur'],
}

def platform_key(p):
    p = p.lower()
    if 'mobile' in p and 'pc' not in p.split('/')[0]: return 'mobile'
    if any(k in p for k in ('switch', 'wii', 'nintendo', 'nes', 'game boy', 'gamecube', '3ds', ' ds')) or p.startswith('ds'): return 'nintendo'
    if 'playstation' in p or 'ps vita' in p: return 'playstation'
    if 'xbox' in p: return 'xbox'
    if any(k in p for k in ('arcade', 'mega drive', 'mega-cd', 'dreamcast', 'msx')): return 'retro'
    if 'mobile' in p: return 'mobile'
    return 'pc'

def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'[™®©]', '', s)
    return re.sub(r'[^a-z0-9]+', '', s)

EDITION = re.compile(r"[\s:\-–—]*(\((19|20)\d\d\)|game of the year( edition)?|goty( edition)?|definitive edition|enhanced edition|complete edition|"
                     r"gold edition|deluxe edition|special edition|anniversary edition|remastered|remaster|director'?s cut|hd|vr|classic)\s*$", re.I)

def base_key(name):
    # une seule carte par jeu : les rééditions (GOTY, Definitive, VR, Remastered…) comptent comme le même jeu
    prev = None
    while prev != name:
        prev, name = name, EDITION.sub('', name).strip()
    return norm(name)

def clean_name(s):
    s = re.sub(r'\s*[™®©]+', '', s).strip()
    s = re.sub(r'\s+(Version originale|Version améliorée|Legacy Edition)$', '', s)
    return re.sub(r'\s{2,}', ' ', s)

def get_json(url, tries=6):
    for k in range(tries):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(60 if e.code == 429 else 3 * (k + 1))
        except Exception:
            time.sleep(3 * (k + 1))
    raise RuntimeError('échec : ' + url)

# --- téléchargement ---------------------------------------------------------------------------
def fetch_steamspy(cache, pages):
    for p in range(pages):
        f = f'{cache}/ss{p}.json'
        if os.path.exists(f): continue
        print('SteamSpy page', p, flush=True)
        json.dump(get_json(f'https://steamspy.com/api.php?request=all&page={p}'), open(f, 'w'))
        time.sleep(61)   # SteamSpy : 1 requête « all » par minute

def load_steamspy(cache):
    apps = {}
    for f in sorted(glob.glob(f'{cache}/ss*.json')): apps.update(json.load(open(f)))
    return apps

def fetch_items(cache, ids):
    os.makedirs(f'{cache}/items', exist_ok=True)
    done = {it.get('id') for f in glob.glob(f'{cache}/items/*.json') for it in json.load(open(f))}
    todo = [i for i in ids if i not in done]
    for n in range(0, len(todo), 50):
        chunk = todo[n:n + 50]
        q = {'ids': [{'appid': i} for i in chunk], 'context': {'language': 'french', 'country_code': 'FR'},
             'data_request': {'include_assets': True, 'include_screenshots': True, 'include_reviews': True,
                              'include_basic_info': True, 'include_release': True, 'include_tag_count': 8}}
        url = 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?' + urllib.parse.urlencode({'input_json': json.dumps(q)})
        items = get_json(url)['response'].get('store_items', [])
        json.dump(items, open(f'{cache}/items/{chunk[0]}_{n}.json', 'w'))
        time.sleep(0.4)

def fetch_tags(cache):
    f = f'{cache}/tags_fr.json'
    if not os.path.exists(f):
        json.dump(get_json('https://api.steampowered.com/IStoreService/GetTagList/v1/?language=french'), open(f, 'w'))

def wiki_file(cache, lang, title):
    return f'{cache}/wiki/{lang}-' + hashlib.md5(title.encode()).hexdigest() + '.json'

def fetch_wiki(cache, entries, delay=4.0):
    # Wikipédia limite fortement le débit : on avance lentement, et ce qui échoue sera repris au prochain lancement.
    os.makedirs(f'{cache}/wiki', exist_ok=True)
    fails = 0
    for lang in ('en', 'fr'):
        for e in entries:
            title = e['wiki'] if lang == 'en' else e['name']
            f = wiki_file(cache, lang, title)
            if os.path.exists(f): continue
            url = f'https://{lang}.wikipedia.org/api/rest_v1/page/summary/' + urllib.parse.quote(title.replace(' ', '_'), safe='') + '?redirect=true'
            try:
                d = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())
            except urllib.error.HTTPError as err:
                if err.code == 404:
                    d = {'missing': True}
                else:
                    fails += 1
                    print(f'Wikipédia {err.code} ({title}), pause…', flush=True)
                    time.sleep(90 if err.code == 429 else 10)
                    continue
            except Exception:
                fails += 1
                time.sleep(10)
                continue
            json.dump(d, open(f, 'w'))
            time.sleep(delay)
    if fails: print(f'{fails} pages Wikipédia à reprendre : relancez --fetch plus tard.')

def load_offsteam():
    out = []
    for line in open(f'{ROOT}/scripts/hors-steam.txt', encoding='utf-8'):
        line = line.strip()
        if not line or line.startswith('#'): continue
        wiki, name, year, plat, dev, uni, pop, pct = line.split('|')
        out.append({'wiki': wiki, 'name': name, 'year': int(year), 'platform': plat, 'dev': dev, 'uni': uni, 'pop': int(pop), 'pct': int(pct)})
    return out

# --- construction -----------------------------------------------------------------------------
def score(reviews, pct):
    # popularité (échelle log) + qualité (pourcentage d'avis positifs lissé)
    pos = reviews * pct / 100
    smooth = (pos + 20 * 0.75) / (reviews + 20) * 100
    return 2.0 * math.log10(max(reviews, 1)) + (smooth - 80) / 7


CORP = re.compile(r"\b(games?|digital|official|entertainment|interactive|studios?|productions?|software|publishing|inc|ltd|corporation|llc|gmbh|network|originals|spotlight|labs?|media|group|ea play|playstation studios|ea sports|franchise)\b", re.I)
SUFFIX = re.compile(r"(,?\s+(inc\.?|ltd\.?|llc|gmbh|s\.a\.|s\.r\.l\.|corp\.?|corporation|co\.,?\s*ltd\.?|limited))+$", re.I)

def clean_company(s):
    s = html.unescape(s or '').strip()
    s = SUFFIX.sub('', s).strip(' ,.')
    return s

def assign_univers(games):
    """Univers (album) de chaque jeu : sa série quand Steam ou la liste hors Steam en donne une vraie
    (pas un éditeur), y compris par le début du titre (« Fallout: New Vegas » → Fallout), sinon son studio."""
    def valid(g, f):
        if not f: return False
        k = norm(f)
        if not k or k in {norm(x) for x in [g['dev'], *g.get('pubs', [])] if x}: return False
        return not CORP.search(f)
    for g in games:
        f = html.unescape(g['franchise'] or '')
        f = re.sub(r'\s+Franchise$', '', f, flags=re.I).strip()
        g['series'] = f if (g.get('wiki') or valid(g, f)) else ''
    # nom affiché d'une série : la variante la plus lisible (pas tout en capitales)
    names = {}
    for g in games:
        if g['series']: names.setdefault(norm(g['series']), []).append(g['series'])
    display = {k: sorted(set(v), key=lambda x: (x.isupper(), -v.count(x)))[0] for k, v in names.items()}
    # séries reconnues au début du titre (au moins 4 caractères, suivies d'un séparateur)
    prefixes = sorted({d for k, d in display.items() if len(names[k]) >= 2 and len(k) >= 4}, key=len, reverse=True)
    for g in games:
        if not g['series']:
            for d in prefixes:
                t = g['name']
                rest = t[len(d):]
                # « Fallout 4 », « Fallout: New Vegas », « Quake II » oui ; « Kingdom Rush » non
                if t.lower().startswith(d.lower()) and (rest == '' or re.match(r'^(\s*[:\-–—]|\s+(\d|[IVX]+\b))', rest)):
                    g['series'] = d
                    break
    count = {}
    for g in games:
        if g['series']: count[norm(g['series'])] = count.get(norm(g['series']), 0) + 1
    for g in games:
        k = norm(g['series'])
        if g['series'] and count[k] >= 2: g['univers'] = display[k]
        else: g['univers'] = clean_company(g['dev']) or clean_company(g.get('pubs', [''])[0] if g.get('pubs') else '') or g['name']
    # même univers écrit différemment (« IDEA FACTORY » / « Idea Factory ») : une seule orthographe
    variants = {}
    for g in games: variants.setdefault(norm(g['univers']), []).append(g['univers'])
    best = {k: sorted(set(v), key=lambda x: (x.isupper(), -v.count(x)))[0] for k, v in variants.items()}
    for g in games: g['univers'] = best[norm(g['univers'])]

STEAM_CDN = 'steam/apps/'

def build(cache):
    tags_fr = {t['tagid']: t['name'] for t in json.load(open(f'{cache}/tags_fr.json'))['response']['tags']}
    genre_of = {tid: g for g, ids in GENRES.items() for tid in ids}
    items = [i for f in glob.glob(f'{cache}/items/*.json') for i in json.load(open(f))]
    # à nom égal (rééditions, versions), la plus populaire l'emporte
    items.sort(key=lambda i: -(((i.get('reviews') or {}).get('summary_filtered') or {}).get('review_count', 0)))
    games, details, seen = [], {}, set()
    for it in items:
        if it.get('type') != 0 or not it.get('success') or not it.get('name'): continue
        rv = (it.get('reviews') or {}).get('summary_filtered') or {}
        n, pct = rv.get('review_count', 0), rv.get('percent_positive', 0)
        if n < MIN_REVIEWS: continue
        tagids = it.get('tagids') or []
        if set(it.get('content_descriptorids') or []) & {3, 4}: continue
        if set(tagids[:3]) & SEXUAL_TAGS and n < 40000: continue
        name = clean_name(it['name'])
        if BLOCK_WORDS.search(name): continue
        if re.search(r'[぀-ヿ㐀-鿿가-힯Ѐ-ӿ]', name) and n < 20000: continue
        a = it.get('assets') or {}
        base = a.get('asset_url_format', '').split('${FILENAME}')[0]
        if not base.startswith(STEAM_CDN): continue
        shots = [s['filename'].split('?')[0] for s in ((it.get('screenshots') or {}).get('all_ages_screenshots') or [])][:4]
        cap, cap2 = a.get('library_capsule'), a.get('library_capsule_2x')
        if cap:
            art, art2 = base + cap, base + (cap2 or cap)
        elif shots:
            art = art2 = shots[0]
        else:
            continue
        key = base_key(name)
        if key in seen: continue
        seen.add(key)
        bi = it.get('basic_info') or {}
        devs = [clean_name(d['name']) for d in bi.get('developers') or []]
        pubs = [clean_name(d['name']) for d in bi.get('publishers') or []]
        fr = [clean_name(d['name']) for d in bi.get('franchises') or []]
        rel = it.get('release') or {}
        ts = rel.get('original_release_date') or rel.get('steam_release_date') or 0
        year = time.gmtime(ts).tm_year if ts else None
        gs = []
        for t in tagids:
            g = genre_of.get(t)
            if g and g not in gs: gs.append(g)
        appid = it['appid']
        games.append({'id': f's{appid}', 'name': name, 'reviews': n, 'pct': pct, 'year': year,
                      'dev': devs[0] if devs else (pubs[0] if pubs else ''), 'franchise': fr[0] if fr else '', 'pubs': pubs,
                      'genres': gs[:4], 'art': art, 'art2': art2, 'plat': 'pc', 'steam': appid})
        details[f's{appid}'] = {'desc': (bi.get('short_description') or '').strip(), 'shots': shots,
                                'devs': devs, 'pubs': pubs, 'tags': [tags_fr[t] for t in tagids if t in tags_fr][:8],
                                'label': rv.get('review_score_label', ''), 'url': f'https://store.steampowered.com/app/{appid}'}
    # jeux absents de Steam
    for k, e in enumerate(load_offsteam()):
        key = base_key(e['name'])
        if key in seen or base_key(re.sub(r'\s*\([^)]*\)$', '', e['wiki'])) in seen:
            print('déjà sur Steam :', e['name']); continue
        en = json.load(open(wiki_file(cache, 'en', e['wiki']))) if os.path.exists(wiki_file(cache, 'en', e['wiki'])) else {}
        frw = json.load(open(wiki_file(cache, 'fr', e['name']))) if os.path.exists(wiki_file(cache, 'fr', e['name'])) else {}
        img = (en.get('originalimage') or {}).get('source') or (frw.get('originalimage') or {}).get('source')
        if img: img = img.split('?')[0]
        if en.get('missing'):
            print('article Wikipédia introuvable :', e['wiki']); continue
        # sans image en cache (Wikipédia limité), le navigateur la récupère lui-même depuis l'article
        seen.add(key)
        gid = 'w' + hashlib.md5(e['wiki'].encode()).hexdigest()[:8]
        desc = ''
        if frw.get('type') == 'standard' and frw.get('extract'):
            desc = frw['extract']
        elif en.get('extract'):
            desc = en['extract']
        games.append({'id': gid, 'name': e['name'], 'reviews': e['pop'], 'pct': e['pct'], 'year': e['year'], 'dev': e['dev'],
                      'franchise': e['uni'], 'genres': OFFSTEAM_GENRES.get(e['uni'], ['aventure']), 'art': img or '', 'art2': img or '',
                      'plat': platform_key(e['platform']), 'platform': e['platform'], 'wiki': e['wiki']})
        page = (frw.get('content_urls') or {}).get('desktop', {}).get('page') if frw.get('type') == 'standard' else None
        details[gid] = {'desc': desc, 'shots': [], 'devs': [e['dev']], 'pubs': [], 'tags': [], 'label': '',
                        'url': page or (en.get('content_urls') or {}).get('desktop', {}).get('page', ''), 'lang': 'fr' if page else 'en'}

    # classement : #0001 = le plus populaire et le mieux noté
    for g in games: g['score'] = score(g['reviews'], g['pct'])
    games.sort(key=lambda g: -g['score'])
    total = len(games)
    by_reviews = sorted(games, key=lambda g: g['reviews'])
    for i, g in enumerate(by_reviews): g['popp'] = max(1, min(99, round(100 * (i + 1) / total)))
    assign_univers(games)
    out = []
    for i, g in enumerate(games):
        frac = (i + 0.5) / total
        rar = next(r for r, c in CUTS if frac <= c)
        uni = g['univers']
        rec = {'n': i + 1, 'id': g['id'], 't': g['name'], 'r': rar, 'u': uni, 'd': clean_company(g['dev']), 'y': g['year'],
               'g': g['genres'], 'p': g['popp'], 'q': g['pct'], 'v': g['reviews'], 'pl': g['plat']}
        rec['i'] = compact(g['art'])
        if g['art2'] != g['art']: rec['j'] = compact(g['art2'])
        if g.get('platform'): rec['pf'] = g['platform']
        if g.get('steam'): rec['s'] = g['steam']
        if g.get('wiki'): rec['wk'] = g['wiki']
        out.append(rec)
        details[g['id']]['shots'] = [compact(s) for s in details[g['id']]['shots']]
    # « saga » : univers d'au moins 3 jeux
    ucount = {}
    for r in out: ucount[r['u']] = ucount.get(r['u'], 0) + 1
    for r in out:
        if ucount[r['u']] >= 3: r['sg'] = 1
    return out, details

def compact(url):
    # Adresses raccourcies, reconstruites par le jeu (public/js/catalog.js)
    if url.startswith(STEAM_CDN): return url[len(STEAM_CDN):]
    return url.replace('https://upload.wikimedia.org/wikipedia/', 'w:')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fetch', action='store_true')
    ap.add_argument('--cache', default=f'{ROOT}/.cache/catalog')
    ap.add_argument('--pages', type=int, default=10)
    a = ap.parse_args()
    os.makedirs(a.cache, exist_ok=True)
    if a.fetch:
        fetch_steamspy(a.cache, a.pages)
        apps = load_steamspy(a.cache)
        fetch_items(a.cache, [int(k) for k, v in apps.items() if v.get('positive', 0) + v.get('negative', 0) >= 300] + EXTRA_APPIDS)
        fetch_tags(a.cache)
        fetch_wiki(a.cache, load_offsteam())
    games, details = build(a.cache)
    os.makedirs(f'{ROOT}/catalog', exist_ok=True)
    with open(f'{ROOT}/catalog/games.json', 'w', encoding='utf-8') as f:
        f.write('[\n' + ',\n'.join(json.dumps(g, ensure_ascii=False, separators=(',', ':')) for g in games) + '\n]\n')
    with open(f'{ROOT}/catalog/details.json', 'w', encoding='utf-8') as f:
        json.dump(details, f, ensure_ascii=False, separators=(',', ':'))
    rc = {}
    for g in games: rc[g['r']] = rc.get(g['r'], 0) + 1
    print(f'{len(games)} jeux :', ' · '.join(f'{r} {rc.get(r, 0)}' for r in 'CUREL M'.replace(' ', '')))

if __name__ == '__main__':
    main()

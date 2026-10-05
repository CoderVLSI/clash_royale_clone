#!/usr/bin/env python3
"""Generate card portraits NINE AT A TIME: one image = a 3x3 sheet of cards, sliced into godot/assets/art/cards/<id>.jpg.

One image costs the same whether it holds 1 or 9 cards, so 94 cards ~ 11 images (~$0.40 on the cheapest model) instead of 94.
Safety: sequential, no retries (a retry would be billed again), pre-flight balance check against OpenRouter's $1 image floor,
hard --max-spend cap, and the cost reported by each response is summed.

    python3 tools/art/gen_card_sheets.py --dry-run
    python3 tools/art/gen_card_sheets.py --max-spend 0.60 [--only hog_rider,ice_spirit,...] [--first-test]
"""
import os, sys, io, json, base64, argparse, urllib.request, urllib.error
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from card_descriptions import DESC

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'godot', 'assets', 'art', 'cards')
RAW = '/tmp/art_raw'
MODEL = os.environ.get('ART_MODEL', 'google/gemini-3.1-flash-lite-image')
FLOOR = 1.0
EST_PER_IMAGE = 0.045            # includes margin over the ~$0.034 observed price
GRID = 9
PRIORITY = ['hog_rider', 'ice_spirit', 'battle_ram', 'magic_archer', 'princess']

import colorsys
HERO_DESC = {
 'hero_wizard': "a HERO wizard: stern dark-haired mustached wizard with spiky blond-grey lightning-shaped hair, glowing yellow eyes, blue-and-gold robes with white fur collar, crackling golden lightning around his hands, heroic dramatic pose",
 'hero_electro_wizard': "a HERO electro wizard: stern mustached wizard with spiky golden-blond lightning-shaped hair, glowing yellow eyes, black zigzag mustache and beard, blue robe with gold trim and gold arm rings, crackling cyan electricity between his hands, heroic dramatic pose",
 'hero_magic_archer': "a HERO magic archer: a hooded archer in glowing teal and gold armor with a huge luminous energy bow, holographic decoy copy behind him, heroic dramatic pose, golden hero aura",
}
def hue_name(hexcol):
    r, g, b = [int(hexcol[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    h *= 360
    for lim, n in ((20, 'red'), (50, 'orange'), (70, 'golden yellow'), (160, 'green'), (200, 'cyan'), (260, 'blue'), (300, 'purple'), (340, 'magenta'), (361, 'red')):
        if h < lim:
            return n

def evo_desc(c, byid):
    if c['id'] in HERO_DESC:
        return HERO_DESC[c['id']]
    base = next((x for x in byid.values() if x.get('evolvesTo') == c['id']), None)
    d = DESC.get(base['id']) if base else None
    col = hue_name(c.get('evolutionAuraColor', '#b66cff'))
    return f"an EVOLVED, more powerful, upgraded version of: {d or c['name']} -- radiating a glowing {col} energy aura with sparkling power particles, intensified glowing details, menacing heroic pose"

def key():
    return os.environ['OPENROUTER_API_KEY']

def balance():
    r = urllib.request.Request("https://openrouter.ai/api/v1/credits", headers={"Authorization": "Bearer " + key()})
    d = json.load(urllib.request.urlopen(r, timeout=20))['data']
    return d['total_credits'] - d['total_usage']

def sheet_prompt(cards):
    lines = []
    for i, c in enumerate(cards):
        lines.append(f"Panel {i + 1} (row {i // 3 + 1}, column {i % 3 + 1}): {DESC.get(c['id']) or c['name']}")
    return ("A sheet of exactly 9 separate stylized glossy 3D-cartoon mobile strategy game card illustrations arranged in a perfect 3-column by 3-row grid. "
            "Each panel is an equal vertical 3:4 portrait, separated from its neighbours by a thick solid pure black line (gutter) and no panel overlaps another. "
            "In every panel the subject is large, centered and fully inside the panel, dynamic pose, rich saturated colors, thick clean outlines, dramatic rim lighting, "
            "softly blurred fantasy arena background with a different color mood per panel. Draw each subject EXACTLY as described. "
            + " ".join(lines) + " No text, no letters, no numbers, no borders or frames inside the panels, no watermark.")

def generate(prompt):
    body = {"model": MODEL, "messages": [{"role": "user", "content": prompt}], "modalities": ["image", "text"],
            "max_tokens": 1600, "image_config": {"aspect_ratio": "3:4"}}
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=json.dumps(body).encode(),
                                 headers={"Authorization": "Bearer " + key(), "Content-Type": "application/json"})
    r = json.load(urllib.request.urlopen(req, timeout=300))
    imgs = r['choices'][0]['message'].get('images', [])
    if not imgs:
        raise RuntimeError('no image returned')
    img = Image.open(io.BytesIO(base64.b64decode(imgs[0]['image_url']['url'].split(',', 1)[1]))).convert('RGB')
    return img, float(r.get('usage', {}).get('cost', EST_PER_IMAGE))

def _dark_bands(profile, n):
    """Find n-1 gutter positions: strongest dark minima of the 1-D brightness profile, away from the edges."""
    w = len(profile)
    k = max(3, w // 90)
    sm = np.convolve(profile, np.ones(k) / k, mode='same')
    cuts = []
    for j in range(1, n):
        lo, hi = int(w * (j / n - 0.09)), int(w * (j / n + 0.09))
        cuts.append(lo + int(np.argmin(sm[lo:hi])))
    return cuts

def slice_sheet(img, rows=3, cols=3):
    a = np.asarray(img.convert('L')).astype(np.float32)
    H, W = a.shape
    xs = [0] + _dark_bands(a.mean(axis=0), cols) + [W]
    ys = [0] + _dark_bands(a.mean(axis=1), rows) + [H]
    cells = []
    for r in range(rows):
        for c in range(cols):
            x0, x1, y0, y1 = xs[c], xs[c + 1], ys[r], ys[r + 1]
            pad = 6                                   # trim the black gutter line
            cells.append(img.crop((x0 + pad, y0 + pad, x1 - pad, y1 - pad)))
    return cells

def save_card(cell, cid):
    w, h = cell.size
    tw = int(h * 3 / 4)
    if w > tw:
        cell = cell.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
    elif w < tw:
        th = int(w * 4 / 3)
        cell = cell.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
    cell.resize((256, 341), Image.LANCZOS).save(os.path.join(OUT, cid + '.jpg'), quality=86, optimize=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--max-spend', type=float, default=0.60)
    ap.add_argument('--only', default='')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--evo', action='store_true', help='generate evolution + hero portraits instead of base cards')
    ap.add_argument('--first-test', action='store_true', help='generate just ONE sheet, then stop so you can inspect it')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True); os.makedirs(RAW, exist_ok=True)
    allc = json.load(open(os.path.join(ROOT, 'godot', 'data', 'cards.json')))
    byid = {c['id']: c for c in allc}
    if a.evo:
        cards = [c for c in allc if c.get('evolution') or c.get('rarity') == 'hero']
        for c in cards:
            DESC[c['id']] = evo_desc(c, byid)
    else:
        cards = [c for c in allc if not c.get('isToken')]
    seen = set(); cards = [c for c in cards if not (c['id'] in seen or seen.add(c['id']))]
    if a.only:
        want = a.only.split(','); cards = [c for c in cards if c['id'] in want]
    todo = [c for c in cards if not os.path.exists(os.path.join(OUT, c['id'] + '.jpg'))]
    todo.sort(key=lambda c: PRIORITY.index(c['id']) if c['id'] in PRIORITY else 99)
    sheets = [todo[i:i + GRID] for i in range(0, len(todo), GRID)]
    est = len(sheets) * EST_PER_IMAGE
    bal = balance()
    print(f"{len(todo)} cards -> {len(sheets)} sheets, est ${est:.2f}; balance ${bal:.2f}; model {MODEL}")
    if a.dry_run:
        for i, s in enumerate(sheets):
            print(f"  sheet {i + 1}: {[c['id'] for c in s]}")
        return
    budget = min(a.max_spend, est)
    if bal < FLOOR + budget:
        print(f"Refusing to start: need balance >= ${FLOOR + budget:.2f} (image floor ${FLOOR:.2f} + planned ${budget:.2f}). Top up and re-run.")
        return
    spent = 0.0
    for i, group in enumerate(sheets):
        if spent + EST_PER_IMAGE > a.max_spend:
            print(f"Stopping: next sheet could exceed --max-spend ${a.max_spend:.2f} (spent ${spent:.3f})"); break
        try:
            img, cost = generate(sheet_prompt(group))
        except urllib.error.HTTPError as e:
            print(f"sheet {i + 1}: HTTP {e.code} - stopping (no retry, to avoid double billing)"); break
        except Exception as e:
            print(f"sheet {i + 1}: {e} - stopping"); break
        spent += cost
        img.save(os.path.join(RAW, f'sheet_{i + 1}.png'))
        cells = slice_sheet(img)
        for c, cell in zip(group, cells):
            save_card(cell, c['id'])
        print(f"sheet {i + 1}/{len(sheets)}: {[c['id'] for c in group]}  cost ${cost:.3f}  total ${spent:.3f}  (raw saved to {RAW}/sheet_{i + 1}.png)", flush=True)
        if a.first_test:
            print("First-test mode: stopping after one sheet. Inspect the cards, then run again without --first-test."); break
    print(f"DONE. Spent ${spent:.3f}. Balance now ~${balance():.2f} (the credits endpoint can lag).")

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Generate the lobby background and the UI icon sheet with OpenRouter, then post-process them.

    python3 tools/art/gen_ui_art.py --bg --icons          (OPENROUTER_API_KEY from the environment)

* lobby background: 9:16 image -> godot/assets/art/ui/lobby_bg.jpg
* icon sheet: 4x3 grid on a flat green key colour -> sliced, chroma-keyed -> godot/assets/art/ui/<name>.png
Both requests are sequential and the script refuses to run if the account balance is below --min-balance.
"""
import os, sys, json, base64, io, argparse, urllib.request, urllib.error
from PIL import Image
import numpy as np

KEY = os.environ['OPENROUTER_API_KEY']
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'godot', 'assets', 'art', 'ui')
MODEL = os.environ.get('ART_MODEL', 'google/gemini-3.1-flash-lite-image')
ICON_NAMES = ['coin', 'gem', 'trophy', 'crown', 'chest', 'drop', 'shop', 'decks', 'battle', 'social', 'events', 'chat']

BG_PROMPT = ("Mobile strategy game main-menu background, vertical 9:16, stylized glossy 3D-cartoon fantasy arena courtyard at dusk: "
             "a grand blue and gold castle gate in the distance, glowing torches and banners, purple-blue sky with soft clouds and stars, "
             "polished stone floor in the foreground, soft depth of field, calm composition with the centre kept relatively clear for UI. "
             "No characters, no text, no letters, no logos, no watermark.")
ICON_PROMPT = ("A clean sprite sheet of exactly 12 separate mobile-game UI icons arranged in a perfect 4 columns by 3 rows grid, "
               "each icon centered in its own equal cell with generous empty margins, stylized glossy 3D-cartoon style, thick dark outlines, vivid colors, "
               "all on a perfectly flat solid pure bright green (#00FF00) background with no shadows on the background. "
               "Row 1 left to right: shiny gold coin, blue diamond gem, golden trophy cup, golden crown. "
               "Row 2: wooden treasure chest with gold trim, glossy pink-purple elixir droplet, shopping bag with a star, a fan of three playing cards. "
               "Row 3: two crossed swords, two friendly person silhouettes (social), a banner flag with a star (events), a white speech bubble with three dots. "
               "No text, no letters, no numbers.")

def balance():
    d = json.load(urllib.request.urlopen(urllib.request.Request("https://openrouter.ai/api/v1/credits", headers={"Authorization": "Bearer " + KEY}), timeout=20))['data']
    return d['total_credits'] - d['total_usage']

def gen(prompt, aspect):
    body = {"model": MODEL, "messages": [{"role": "user", "content": prompt}], "modalities": ["image", "text"],
            "max_tokens": 1600, "image_config": {"aspect_ratio": aspect}}
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=json.dumps(body).encode(),
                                 headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    r = json.load(urllib.request.urlopen(req, timeout=240))
    imgs = r['choices'][0]['message'].get('images', [])
    if not imgs:
        raise SystemExit('no image: ' + str(r['choices'][0]['message'].get('content'))[:200])
    print('reported cost', r.get('usage', {}).get('cost'))
    return Image.open(io.BytesIO(base64.b64decode(imgs[0]['image_url']['url'].split(',', 1)[1]))).convert('RGB')

def chroma_key(im):
    a = np.asarray(im).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = (g > 150) & (g - r > 70) & (g - b > 70)
    # soft edge: partially green pixels get partial alpha, and spill is removed
    gd = np.clip((g - np.maximum(r, b)) / 120.0, 0, 1)
    alpha = np.where(green, 0.0, 1.0 - np.clip(gd * 1.4 - 0.15, 0, 1))
    g2 = np.minimum(g, np.maximum(r, b) + 10)
    out = np.dstack([r, g2, b, (alpha * 255).astype(np.int32)]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def slice_icons(sheet):
    w, h = sheet.size
    cw, ch = w / 4, h / 3
    for i, name in enumerate(ICON_NAMES):
        c, r = i % 4, i // 4
        cell = sheet.crop((int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch)))
        k = chroma_key(cell)
        bbox = k.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        if bbox:
            k = k.crop(bbox)
        s = max(k.size)
        sq = Image.new('RGBA', (s, s), (0, 0, 0, 0))
        sq.paste(k, ((s - k.size[0]) // 2, (s - k.size[1]) // 2), k)
        sq.resize((128, 128), Image.LANCZOS).save(os.path.join(OUT, name + '.png'))
        print('icon', name)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bg', action='store_true'); ap.add_argument('--icons', action='store_true')
    ap.add_argument('--min-balance', type=float, default=0.09)
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if a.bg:
        b = balance(); print('balance', round(b, 3))
        if b < a.min_balance: raise SystemExit('balance too low')
        im = gen(BG_PROMPT, '9:16'); im.save('/tmp/lobby_bg_raw.png')
        w, h = im.size; print('bg size', im.size)
        tw = 540; im = im.resize((tw, int(h * tw / w)), Image.LANCZOS)
        im.save(os.path.join(OUT, 'lobby_bg.jpg'), quality=82, optimize=True)
    if a.icons:
        b = balance(); print('balance', round(b, 3))
        if b < a.min_balance: raise SystemExit('balance too low')
        sheet = gen(ICON_PROMPT, '4:3'); sheet.save('/tmp/icon_sheet_raw.png'); print('sheet size', sheet.size)
        slice_icons(sheet)
    print('balance after', round(balance(), 3))

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Generate card portrait art with OpenRouter (google/gemini-3.1-flash-image) for every playable card.

Reads OPENROUTER_API_KEY from the environment (never written to disk). Resumable (skips existing files),
parallel, and stops before exceeding --max-spend USD. Output: godot/assets/art/cards/<card id>.jpg (256x341).
    python3 tools/art/gen_card_art.py --max-spend 10 [--only knight,giant]
"""
import os, sys, json, base64, urllib.request, urllib.error, io, argparse, threading, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CARDS = os.path.join(ROOT, 'godot', 'data', 'cards.json')
OUT = os.path.join(ROOT, 'godot', 'assets', 'art', 'cards')
RAW = '/tmp/art_raw'
MODEL = os.environ.get('ART_MODEL', 'google/gemini-3.1-flash-image')
BG = {'common': 'cool steel-blue and teal', 'rare': 'warm orange and amber', 'epic': 'deep purple and magenta',
      'legendary': 'shimmering emerald green and gold', 'champion': 'radiant golden', 'hero': 'cyan and electric blue'}
DEFAULT_DECK_IDS = ['mother_witch', 'elixir_golem', 'ice_golem', 'ice_spirit', 'skeletons', 'fireball', 'zap', 'hog_rider',
                    'goblin_barrel', 'princess', 'knight', 'dart_goblin', 'inferno_tower', 'rocket', 'arrows', 'pekka', 'bandit',
                    'battle_ram', 'electro_wizard', 'magic_archer', 'poison', 'royal_ghost', 'golem', 'night_witch', 'baby_dragon',
                    'mega_minion', 'lightning', 'elite_barbarians', 'mini_pekka', 'giant', 'prince', 'archers', 'spear_goblins', 'minions', 'valkyrie']

def prompt_for(c):
    name = c['name']
    kind = {'spell': 'a magical spell effect illustration (no character, show the spell itself erupting)',
            'building': 'a defensive structure/building in an arena, seen at a slight angle',
            'flying': 'a flying creature or unit in mid-air', 'ground': 'a character or creature'}.get(c['type'], 'a character')
    if c.get('count', 1) > 1 and c['type'] != 'spell':
        kind += f", shown as a small group of {c['count']}" if c['count'] <= 4 else ', shown as a big swarm'
    return (f"Stylized glossy 3D-cartoon mobile strategy game card illustration of \"{name}\" - {kind}. "
            f"Vertical 3:4 portrait, subject large and centered with a dynamic pose, rich saturated colors, thick clean outlines, "
            f"dramatic rim lighting, softly blurred fantasy arena background in {BG.get(c.get('rarity','common'))} tones. "
            f"No text, no letters, no numbers, no border, no frame, no watermark.")

spent = 0.0
lock = threading.Lock()

def call(c, key):
    body = {"model": MODEL, "messages": [{"role": "user", "content": prompt_for(c)}], "modalities": ["image", "text"], "max_tokens": 1600}
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=json.dumps(body).encode(),
                                 headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    r = json.load(urllib.request.urlopen(req, timeout=180))
    imgs = r['choices'][0]['message'].get('images', [])
    if not imgs:
        raise RuntimeError('no image returned: ' + str(r['choices'][0]['message'].get('content'))[:120])
    data = base64.b64decode(imgs[0]['image_url']['url'].split(',', 1)[1])
    return data, float(r.get('usage', {}).get('cost', 0.067))

def process(c, key, max_spend):
    global spent
    cid = c['id']
    dest = os.path.join(OUT, cid + '.jpg')
    if os.path.exists(dest):
        return cid, 'skip', 0.0
    with lock:
        if spent >= max_spend:
            return cid, 'budget', 0.0
    for attempt in range(6):
        try:
            data, cost = call(c, key)
            with lock:
                spent += cost
            open(os.path.join(RAW, cid + '.png'), 'wb').write(data)
            im = Image.open(io.BytesIO(data)).convert('RGB')
            w, h = im.size
            tw = int(h * 3 / 4)                      # centre-crop to 3:4 if needed
            if w > tw:
                im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
            im = im.resize((256, 341), Image.LANCZOS)
            im.save(dest, quality=86, optimize=True)
            return cid, 'ok', cost
        except urllib.error.HTTPError as e:
            err = f'HTTP {e.code}'
            # 402 = OpenRouter in-flight budget (small balance): wait for earlier requests to settle
            time.sleep(25 if e.code == 402 else 3 + attempt * 3)
        except Exception as e:
            err = str(e)
            time.sleep(2 + attempt * 3)
    return cid, 'fail: ' + err, 0.0

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--max-spend', type=float, default=10.0)
    ap.add_argument('--only', default='')
    ap.add_argument('--workers', type=int, default=4)
    a = ap.parse_args()
    key = os.environ['OPENROUTER_API_KEY']
    os.makedirs(OUT, exist_ok=True); os.makedirs(RAW, exist_ok=True)
    cards = [c for c in json.load(open(CARDS)) if not c.get('isToken')]
    if a.only:
        want = a.only.split(','); cards = [c for c in cards if c['id'] in want]
    order = {cid: i for i, cid in enumerate(DEFAULT_DECK_IDS)}
    cards.sort(key=lambda c: order.get(c['id'], 999))
    ok = fail = 0
    with ThreadPoolExecutor(a.workers) as ex:
        futs = [ex.submit(process, c, key, a.max_spend) for c in cards]
        for f in as_completed(futs):
            cid, st, cost = f.result()
            if st == 'ok': ok += 1
            elif st.startswith('fail'): fail += 1
            print(f"{cid}: {st} (${cost:.3f}) | spent ${spent:.2f}", flush=True)
    print(f"DONE ok={ok} fail={fail} spent=${spent:.2f}")

if __name__ == '__main__':
    main()

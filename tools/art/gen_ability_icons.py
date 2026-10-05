#!/usr/bin/env python3
"""Generates round ability-button icons (hero + champion abilities), 9 per image sheet, sliced to godot/assets/art/abilities/<unit id>.jpg.
    python3 tools/art/gen_ability_icons.py [--max-spend 0.15] [--dry-run]"""
import os, sys, io, json, base64, argparse, urllib.request, urllib.error
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import gen_card_sheets as G

ROOT = G.ROOT
OUT = os.path.join(ROOT, 'godot', 'assets', 'art', 'abilities')
ICONS = {
 'hero_knight': "Triumphant Taunt: a gleaming steel-and-gold knight shield with three bold golden shout rays bursting from it",
 'hero_giant': "Heroic Hurl: a huge orange fist hurling a tiny flailing figure through the air with speed lines",
 'hero_mini_pekka': "Breakfast Boost: a tall stack of fluffy pancakes with melting butter and syrup, steam rising, a fork on the side",
 'hero_musketeer': "Trusty Turret: a small stone-and-iron turret cannon firing a stream of bullets with muzzle flash",
 'hero_ice_golem': "Snowstorm: a swirling blue-white snowstorm cyclone full of snowflakes and ice shards",
 'hero_goblins': "Banner Brigade: a tattered green war banner flag on a pole with two crossed daggers beneath it",
 'hero_mega_minion': "Wounding Warp: a blue winged minion fist punching out of a purple glowing teleport portal",
 'hero_barbarian_single': "Rowdy Reroll: a wooden barrel with an angry face rolling fast with two sets of motion-blur arrows",
 'hero_bowler': "Stone Swish: a big grey boulder flying through the air with long dust trails and a lobbing arc",
 'hero_tombstone': "Regal Revival: a cracked tombstone with a glowing purple royal crown rising out of it, purple flames",
 'hero_balloon': "Coffin Cadet: a small wooden coffin with a grinning skeleton cadet popping out holding a black bomb",
 'hero_dark_prince': "Destructive Dismount: a spiked dark shield slamming the ground, big cracks and flying rocks with a purple shockwave",
 'hero_valkyrie': "Wild Whirlwind: a double-bladed axe spinning in a circular red whirlwind of slashes",
 'hero_berserker': "Savage Survival: an enraged red face with glowing eyes and two crossed axes surrounded by flames",
 'hero_ice_wizard': "Frosty Fella: a cute smiling snowman wearing a scarf surrounded by sharp ice crystals",
 'hero_wizard': "Fiery Flight: a wizard's fireball with blazing fiery wings",
 'hero_magic_archer': "Triple Threat: three glowing cyan magic arrows fanned out, a ghostly decoy silhouette behind",
 'hero_electro_wizard': "Surging Strikes: two clenched hands shooting twin beams of crackling blue lightning",
 'golden_knight': "Golden Knight dash chain: a golden knight helmet with a glowing golden sword streak chaining between three targets",
 'skeleton_king': "Soul Summoning: a skull wearing a crown with green ghostly souls swirling out",
 'archer_queen': "Cloaking: a crowned archer queen's purple hooded cloak half transparent, with a crossbow bolt",
 'monk': "Pensive Protection: a glowing golden open palm projecting a circular golden shield barrier",
 'mighty_miner': "Explosive Escape: a mining drill with a bomb dropping and a dust cloud, orange explosion",
 'little_prince': "Royal Rescue: a tiny crowned prince's silhouette with a stone guardian knight rising behind him, blue magic",
 'boss_bandit': "Getaway: a masked bandit dash blur with a smoke cloud, a stolen gold coin bag and dagger",
 'goblinstein': "Lightning Link: two green monsters connected by a bright crackling yellow-blue lightning bolt link",
}

def prompt(items):
    lines = [f"Icon {i + 1} (row {i // 3 + 1}, column {i % 3 + 1}): {d}" for i, (_, d) in enumerate(items)]
    return ("A sheet of exactly 9 separate glossy 3D-cartoon mobile game ABILITY ICONS arranged in a perfect 3-column by 3-row grid of equal squares, separated by thick solid pure black gutter lines. "
            "Each icon is a bold, simple, instantly readable emblem centered in its square on a vivid saturated colored radial-gradient background, thick clean dark outline, glossy highlights, "
            "dramatic rim light, designed to be cropped into a circular button. Draw each EXACTLY as described. " + " ".join(lines) +
            " No text, no letters, no numbers, no watermark.")

def generate(pr):
    body = {"model": G.MODEL, "messages": [{"role": "user", "content": pr}], "modalities": ["image", "text"],
            "max_tokens": 1600, "image_config": {"aspect_ratio": "1:1"}}
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=json.dumps(body).encode(),
                                 headers={"Authorization": "Bearer " + G.key(), "Content-Type": "application/json"})
    r = json.load(urllib.request.urlopen(req, timeout=300))
    imgs = r['choices'][0]['message'].get('images', [])
    if not imgs:
        raise RuntimeError('no image')
    img = Image.open(io.BytesIO(base64.b64decode(imgs[0]['image_url']['url'].split(',', 1)[1]))).convert('RGB')
    return img, float(r.get('usage', {}).get('cost', G.EST_PER_IMAGE))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--max-spend', type=float, default=0.15); ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True); os.makedirs(G.RAW, exist_ok=True)
    todo = [(k, v) for k, v in ICONS.items() if not os.path.exists(os.path.join(OUT, k + '.jpg'))]
    sheets = [todo[i:i + 9] for i in range(0, len(todo), 9)]
    bal = G.balance()
    print(f"{len(todo)} icons -> {len(sheets)} sheets, est ${len(sheets) * G.EST_PER_IMAGE:.2f}; balance ${bal:.2f}")
    if a.dry_run or not sheets:
        return
    if bal < G.FLOOR + min(a.max_spend, len(sheets) * G.EST_PER_IMAGE):
        print('balance too low'); return
    spent = 0.0
    for n, grp in enumerate(sheets):
        if spent + G.EST_PER_IMAGE > a.max_spend:
            print('stopping: spend cap'); break
        try:
            img, cost = generate(prompt(grp))
        except Exception as e:
            print('sheet failed, no retry:', e); break
        spent += cost
        img.save(os.path.join(G.RAW, f'abil_{n + 1}.png'))
        for (k, _), cell in zip(grp, G.slice_sheet(img)):
            w, h = cell.size
            s = min(w, h)
            cell = cell.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((128, 128), Image.LANCZOS)
            cell.save(os.path.join(OUT, k + '.jpg'), quality=85, optimize=True)
        print(f"sheet {n + 1}/{len(sheets)} ${cost:.3f} total ${spent:.3f}: {[k for k, _ in grp]}", flush=True)
    print(f'DONE spent ${spent:.3f}')

if __name__ == '__main__':
    main()

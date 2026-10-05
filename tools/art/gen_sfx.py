#!/usr/bin/env python3
"""Generate game sound effects + music loops with the ElevenLabs sound-generation API.

Reads ELEVENLABS_API_KEY from the environment. Resumable, and stops when the remaining credit balance drops
below --reserve (the free tier only has ~10k credits/month). Output: godot/assets/audio/<name>.mp3
"""
import os, sys, json, urllib.request, urllib.error, argparse, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'godot', 'assets', 'audio')
KEY = os.environ['ELEVENLABS_API_KEY']

# (file name, prompt, seconds, loop)
SFX = [
    ("ui_click", "Short crisp cartoon game UI button click, bright and satisfying", 0.5, False),
    ("ui_confirm", "Positive game menu confirm chime, two quick rising notes, mobile game", 0.8, False),
    ("card_pick", "Soft card pick up swipe whoosh, light paper snap, mobile card game", 0.5, False),
    ("card_deploy", "Troop deployment: magical summon thud with a quick sparkle burst, fantasy strategy game", 1.0, False),
    ("sword_hit", "Heavy sword clang hit with a short metallic ring, game sound effect", 0.6, False),
    ("arrow_shot", "Single arrow shot, bow twang and quick whoosh, game sound effect", 0.5, False),
    ("cannon_boom", "Small cartoon cannon shot boom with a short smoke puff, game sound effect", 1.0, False),
    ("magic_bolt", "Wizard magic bolt cast, quick sparkly zap whoosh, fantasy game", 0.8, False),
    ("unit_death", "Cartoon unit defeated pop poof with a tiny puff of smoke, game sound effect", 0.6, False),
    ("tower_hit", "Stone tower being hit, dull heavy impact with small rock debris, game sound effect", 0.7, False),
    ("tower_destroyed", "Medieval stone tower collapsing and exploding, big crumbling crash, game sound effect", 2.0, False),
    ("king_tower_fall", "Massive king tower exploding and collapsing, epic crash with deep boom and debris", 2.5, False),
    ("spell_fireball", "Fireball spell impact, fiery explosion whoosh with crackle, fantasy mobile game", 1.5, False),
    ("spell_zap", "Quick electric zap spell, crackling lightning burst, game sound effect", 1.0, False),
    ("spell_arrows", "Volley of many arrows raining down, rapid whooshes and thuds, game sound effect", 1.2, False),
    ("spell_poison", "Bubbling green poison cloud spell, gurgling toxic bubbles, game sound effect", 1.5, False),
    ("spell_freeze", "Ice freeze spell, crystalline crackling freeze burst, game sound effect", 1.2, False),
    ("spell_rage", "Rage spell cast, powerful rising purple energy surge with a growl, game sound effect", 1.2, False),
    ("spell_heal", "Healing spell, gentle magical chime sparkle shimmer, game sound effect", 1.0, False),
    ("ability_activate", "Champion ability activation, heroic power burst whoosh with a metallic ring", 1.2, False),
    ("evolution_ready", "Power up evolution ready chime, magical rising sparkle, mobile game", 1.2, False),
    ("elixir_double", "Double elixir alert, rising bright warning chime with a whoosh, mobile game", 1.5, False),
    ("overtime", "Overtime alarm, dramatic horn stab with a tense rising hit, mobile strategy game", 1.5, False),
    ("battle_start", "Epic battle start horn and drum hit, medieval fantasy, short fanfare", 2.0, False),
    ("victory", "Triumphant victory fanfare, bright brass and cheering, short mobile game win jingle", 3.0, False),
    ("defeat", "Sad defeat sting, low descending brass and a deflating trombone, short mobile game lose jingle", 2.5, False),
    ("chest_open", "Treasure chest opening with a creak and a magical sparkly reveal, game sound effect", 2.0, False),
    ("coins", "Handful of gold coins collected, bright jingle, mobile game", 1.0, False),
    ("jump_land", "Heavy rider charging jump landing thud with a short grunt, game sound effect", 0.8, False),
    ("bridge_cross", "Wooden bridge footsteps stomp, a few heavy steps on planks, game sound effect", 1.0, False),
]
MUSIC = [
    ("music_battle", "Upbeat epic medieval fantasy orchestral battle music, driving drums, brass and strings, looping, mobile strategy game", 20.0, True),
    ("music_lobby", "Calm heroic fantasy menu music, warm strings and light percussion, cheerful, looping, mobile strategy game", 20.0, True),
]

def credits():
    r = urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription", headers={"xi-api-key": KEY})
    d = json.load(urllib.request.urlopen(r, timeout=30))
    return d['character_limit'] - d['character_count']

def gen(name, prompt, secs, loop):
    body = {"text": prompt, "duration_seconds": secs, "prompt_influence": 0.55}
    if loop:
        body["loop"] = True
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_22050_32", data=json.dumps(body).encode(),
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=120).read()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--reserve', type=int, default=300)
    ap.add_argument('--music', action='store_true')
    ap.add_argument('--only', default='')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    items = SFX + (MUSIC if a.music else [])
    if a.only:
        items = [i for i in SFX + MUSIC if i[0] in a.only.split(',')]
    start = credits(); print("credits remaining:", start, flush=True)
    n = 0
    for name, prompt, secs, loop in items:
        dest = os.path.join(OUT, name + '.mp3')
        if os.path.exists(dest):
            continue
        if n % 5 == 0:
            left = credits()
            if left < a.reserve:
                print(f"STOP: only {left} credits left (reserve {a.reserve})"); break
        for attempt in range(5):
            try:
                data = gen(name, prompt, secs, loop)
                open(dest, 'wb').write(data)
                print(f"{name}: ok {len(data)//1024} KB", flush=True)
                break
            except urllib.error.HTTPError as e:
                body = e.read()[:160]
                if e.code == 429:
                    time.sleep(6 + attempt * 6)      # rate limited: back off and retry
                    continue
                print(f"{name}: HTTP {e.code} {body}", flush=True)
                if e.code in (401, 402, 403):
                    sys.exit(1)
                break
            except Exception as e:
                print(f"{name}: ERR {e}", flush=True)
                time.sleep(3)
        n += 1
        time.sleep(1.5)
    try:
        print("credits remaining:", credits())
    except Exception:
        pass

if __name__ == '__main__':
    main()

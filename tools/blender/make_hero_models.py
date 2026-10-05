"""Hero models: each hero card gets the base card's model dressed as a Hero (golden armour, shoulder pauldrons, chest gem,
a floating diamond above the head, golden aura ring) plus a few new token models (Trusty Turret, Tomb Queen, Frosty snowman).
Run: /opt/blenv/bin/python tools/blender/make_hero_models.py [hero_id ...]"""
import os, sys, json
_argv = sys.argv[:]
sys.argv = [_argv[0]]
exec(open('/home/user/clash_royale_clone/tools/blender/make_evolved_models.py').read().split("\nif __name__ == '__main__':\n")[0])
sys.argv = _argv

reg(HERO_G=(1.0, 0.7, 0.12), HERO_GD=(0.62, 0.38, 0.06), HERO_DK=(0.22, 0.2, 0.28), E_HERO=(1.0, 0.75, 0.2))

HERO_BASE = {'hero_knight': 'knight', 'hero_giant': 'giant', 'hero_mini_pekka': 'mini_pekka', 'hero_musketeer': 'musketeer', 'hero_ice_golem': 'ice_golem',
             'hero_goblins': 'sword_goblins', 'hero_mega_minion': 'mega_minion', 'hero_bowler': 'bowler', 'hero_tombstone': 'tombstone', 'hero_balloon': 'balloon',
             'hero_dark_prince': 'dark_prince', 'hero_valkyrie': 'valkyrie', 'hero_berserker': 'berserker', 'hero_ice_wizard': 'ice_wizard', 'hero_barbarian_single': 'barbarians'}

def heroify(parts, cid):
    for o in parts:
        nm = o.material_slots[0].material.name if o.material_slots else ''
        if nm in SWAP and nm not in ('E_SWORD',):
            o.data.materials.clear()
            o.data.materials.append(material('HERO_DK' if nm in ('STEEL_D', 'DSTEEL', 'ARMOR_D', 'GREEN_D', 'BLUE_D', 'PURP_D', 'NAVY') else 'HERO_GD'))
        elif nm in ('E_SWORD',):
            o.data.materials.clear(); o.data.materials.append(material('E_HERO'))
    lo, hi = part_bbox(parts)
    H = max(hi.z, 0.6)
    W = max(abs(lo.x), abs(hi.x), 0.4)
    Dy = max(abs(lo.y), abs(hi.y), 0.4)
    R = max(W, Dy) + 0.3
    ex = [_T_light('E_HERO', R, 0.06, 0, 0, 0.07), _T_light('HERO_G', R * 0.8, 0.04, 0, 0, 0.1)]
    upright = H > max(W, Dy) * 1.1
    if upright:
        for sx in (-1, 1):
            ex += [S('HERO_G', 0.2, sx * (W * 0.85), 0, H * 0.7, 1, 1, 0.8), K('HERO_G', 0.07, 0.3, sx * (W * 0.85), 0, H * 0.7 + 0.2)]
        ex += [S('E_HERO', 0.13, 0, Dy * 0.55 + 0.05, H * 0.58, 1, 0.6, 1.1), B('HERO_G', 0.5, 0.06, 0.1, 0, Dy * 0.5, H * 0.45)]
    # floating diamond above the head (the hero card's gem)
    ex += [S('E_HERO', 0.17, 0, 0, H + 0.55, 0.8, 0.8, 1.5), _T_light('HERO_G', 0.24, 0.03, 0, 0, H + 0.55, Z, 0, 0)]
    for i in range(4):
        a = math.tau * i / 4 + 0.7
        ex.append(_S_light('E_HERO', 0.09, math.cos(a) * R, math.sin(a) * R, 0.4 + 0.4 * i))
    return parts + ex

M2 = {}
def token(fn):
    M2[fn.__name__] = fn
    return fn

@token
def hero_turret():
    p = [B('STEEL_D', 0.9, 0.9, 0.2, 0, 0, 0.1), Y('DSTEEL', 0.34, 0.5, 0, 0, 0.45, seg=10), S('DSTEEL_L', 0.38, 0, 0, 0.85), Y('DARK', 0.1, 0.8, 0, 0.5, 0.85, -Z, 0, 0), Y('STEEL', 0.12, 0.1, 0, 0.92, 0.85, -Z, 0, 0),
         B('TEAM', 0.3, 0.05, 0.2, 0, 0.3, 0.5), B('E_HERO', 0.5, 0.06, 0.06, 0, 0.0, 1.1)]
    return p

@token
def tomb_queen():
    p = [Y('PURP_D', 0.5, 1.3, 0, 0, 0.75, r2=0.3, seg=10), Y('ROBE_P', 0.55, 0.5, 0, 0, 0.3, r2=0.5, seg=10), B('TEAM', 0.5, 0.3, 0.1, 0, 0, 1.15), B('PURP_D', 0.15, 0.15, 0.6, -0.4, 0.1, 1.2, -0.3), B('PURP_D', 0.15, 0.15, 0.6, 0.4, 0.3, 1.3, -0.8)]
    p += [S('BONE', 0.26, 0, 0.04, 1.85), B('DARK', 0.1, 0.06, 0.1, -0.1, 0.24, 1.9), B('DARK', 0.1, 0.06, 0.1, 0.1, 0.24, 1.9), S('E_HERO', 0.04, -0.1, 0.28, 1.9), S('E_HERO', 0.04, 0.1, 0.28, 1.9)]
    p += crown(1.88, 0.26, 'HERO_G') + [B('STONE_D', 0.3, 0.3, 0.6, 0.7, 0.4, 0.5), B('STONE_D', 0.36, 0.1, 0.16, 0.7, 0.4, 0.85)] + item_staff(skull=True, hx=-0.6, hy=0.4, hz=0.8, L=2.2)
    return p

@token
def frosty_snowman():
    return [S('WHITE_S', 0.7, 0, 0, 0.7), S('WHITE_S', 0.5, 0, 0, 1.5), S('WHITE_S', 0.35, 0, 0, 2.1), K('FIRE', 0.07, 0.35, 0, 0.35, 2.1, -Z, 0, 0), S('DARK', 0.05, -0.12, 0.3, 2.2), S('DARK', 0.05, 0.12, 0.3, 2.2),
            S('DARK', 0.05, 0, 0.45, 1.5), S('DARK', 0.05, 0, 0.5, 1.2), Y('WOOD', 0.04, 0.9, -0.7, 0, 1.5, 0, 0, 0.9), Y('WOOD', 0.04, 0.9, 0.7, 0, 1.5, 0, 0, -0.9), B('TEAM', 0.7, 0.2, 0.1, 0, 0.0, 1.8),
            T('E_BLUE', 0.9, 0.05, 0, 0, 0.1, 0, 0, 0)]

if __name__ == '__main__':
    todo = sys.argv[1:] or list(HERO_BASE) + list(M2)
    sc = json.load(open(os.path.join(OUT, 'batch2.json')))
    for cid in todo:
        reset()
        try:
            if cid in HERO_BASE:
                globals()['_barbarian'] = globals()['_barbarian_b2']
                parts = heroify(builder(HERO_BASE[cid])(), cid)
                path, tris = finish2(cid, parts, 1.12)
            else:
                path, tris = finish2(cid, M2[cid](), 1.0)
                sc[cid] = 1.3 if cid != 'hero_turret' else 1.0
            print(cid, os.path.getsize(path) // 1024, 'KB', tris, 'tris')
        except Exception as e:
            import traceback; traceback.print_exc(); print('FAILED', cid, e)
    json.dump(sc, open(os.path.join(OUT, 'batch2.json'), 'w'))

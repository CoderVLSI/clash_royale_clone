"""Distinct models for every evolved card: the base card's builder + an evolution upgrade
(recoloured armour in the evolution's aura colour, glowing blades/crystals, shoulder spikes, a crest, an aura ring and orbs).
Run:  /opt/blenv/bin/python tools/blender/make_evolved_models.py [evolved_id ...]
Output: godot/assets/models/cards/<evolved id>.glb (+ scales appended to batch2.json)."""
import os, sys, json, colorsys
_argv = sys.argv[:]
sys.argv = [_argv[0]]
exec(open('/home/user/clash_royale_clone/tools/blender/make_card_models2.py').read().split("if __name__ == '__main__':")[0])
sys.argv = _argv
import mathutils

CARDS_JSON = json.load(open('/home/user/clash_royale_clone/godot/data/cards.json'))
BY_ID = {c['id']: c for c in CARDS_JSON}
ALIAS = {'skeleton_army': 'skeletons'}
SWAP = {'STEEL', 'STEEL_D', 'METAL', 'DSTEEL', 'DSTEEL_L', 'ARMOR', 'ARMOR_D', 'CLOTH', 'BLUE_M', 'BLUE_S', 'BLUE_D', 'BLUE_L', 'GREEN_C', 'GREEN_D', 'ROBE', 'ROBE_P', 'RED', 'PLAID',
        'PURPLE_H', 'NAVY', 'TINT', 'BROWN_R', 'GREY_B', 'STONE_T', 'WHITE_S', 'PURP_D', 'CRYS', 'ORANGE_D', 'YELLOW', 'E_SWORD', 'PINK', 'SKIN_G'}
SWAP -= {'SKIN_G', 'PINK'}   # keep skin / hog colours recognisable

import re as _re
_src1 = open('/home/user/clash_royale_clone/tools/blender/make_card_models.py').read()
_m = _re.search(r"def _barbarian\(x, y, face=0\.0\):.*?\n    return q\n", _src1, _re.S)
_ns = {}
exec(_m.group(0), globals(), _ns)
_barbarian_b1 = _ns['_barbarian']
_barbarian_b2 = globals()['_barbarian']

def _T_light(m, R, r, x, y, z, rx=0, ry=0, rz=0):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=(x, y, z), rotation=(rx, ry, rz), major_segments=14, minor_segments=4)
    return _finish(bpy.context.active_object, m, 'torus')

def _S_light(m, r, x, y, z, sx=1, sy=1, sz=1):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=6, ring_count=4, location=(x, y, z))
    o = bpy.context.active_object
    o.scale = (sx, sy, sz)
    return _finish(o, m, 'sph')

def builder(base_id):
    base_id = ALIAS.get(base_id, base_id)
    if base_id in M:
        return M[base_id][0]
    return CARDS.get(base_id)

def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def part_bbox(parts):
    lo = mathutils.Vector((1e9,) * 3); hi = mathutils.Vector((-1e9,) * 3)
    for o in parts:
        for c in o.bound_box:
            v = o.matrix_world @ mathutils.Vector(c)
            for i in range(3):
                lo[i] = min(lo[i], v[i]); hi[i] = max(hi[i], v[i])
    return lo, hi

def evolve(parts, cid, idx):
    rgb = hexrgb(BY_ID[cid].get('evolutionAuraColor', '#b66cff'))
    h, s, v = colorsys.rgb_to_hsv(*rgb)
    main = colorsys.hsv_to_rgb(h, 0.55, 0.55)
    dark = colorsys.hsv_to_rgb(h, 0.6, 0.3)
    reg(**{'EV_' + cid: main, 'EVD_' + cid: dark, 'E_' + cid: rgb})
    EV, EVD, EE = 'EV_' + cid, 'EVD_' + cid, 'E_' + cid
    for o in parts:
        nm = o.material_slots[0].material.name if o.material_slots else ''
        if nm in SWAP:
            new = EE if nm == 'E_SWORD' else (EVD if nm in ('STEEL_D', 'DSTEEL', 'ARMOR_D', 'GREEN_D', 'BLUE_D', 'PURP_D', 'NAVY') else EV)
            o.data.materials.clear(); o.data.materials.append(material(new))
    lo, hi = part_bbox(parts)
    H = max(hi.z, 0.6)
    W = max(abs(lo.x), abs(hi.x), 0.4)
    Dy = max(abs(lo.y), abs(hi.y), 0.4)
    R = max(W, Dy) + 0.35
    upright = H > max(W, Dy) * 1.15
    extra = [_T_light(EE, R, 0.05, 0, 0, 0.07)]
    for i in range(4):
        a = math.tau * i / 4 + 0.4
        extra.append(_S_light(EE, 0.11, math.cos(a) * R, math.sin(a) * R, 0.35 + H * 0.25 * i))
    if upright:
        for sx in (-1, 1):
            extra += [K(EE, 0.11, 0.5, sx * (W * 0.9 + 0.05), 0, H * 0.72, 0, sx * 0.9, 0, 6), K(EV, 0.09, 0.35, sx * (W * 0.85), 0.1, H * 0.62, 0.5, sx * 0.9, 0, 6)]
        extra.append(_S_light(EE, 0.14, 0, Dy * 0.55 + 0.05, H * 0.58, 1, 0.6, 1.1))
    crest = idx % 6
    ztop = H + 0.05
    if crest == 0:
        for i in range(5):
            extra.append(K(EE, 0.07, 0.3, -0.24 + i * 0.12, 0, ztop + 0.08))
    elif crest == 1:
        extra.append(_T_light(EE, 0.28, 0.035, 0, 0, ztop + 0.3, 0.0, 0, 0))
    elif crest == 2:
        extra += [K(EE, 0.14, 0.55, 0, 0, ztop + 0.3), K('E_YELLOW', 0.07, 0.3, 0, 0, ztop + 0.22)]
    elif crest == 3:
        extra += [K(EE, 0.08, 0.5, -0.22, 0, ztop + 0.15, 0, -0.6, 0), K(EE, 0.08, 0.5, 0.22, 0, ztop + 0.15, 0, 0.6, 0)]
    elif crest == 4:
        extra += [S(EE, 0.16, 0, 0, ztop + 0.4, 0.8, 0.8, 1.4), _T_light(EVD, 0.22, 0.03, 0, 0, ztop + 0.4, Z, 0, 0)]
    else:
        for i in range(3):
            extra.append(K(EE, 0.05, 0.4, -0.18 + i * 0.18, 0, ztop + 0.2, 0, 0, (i - 1) * 0.3))
    return parts + extra

def base_of(cid):
    c = BY_ID[cid]
    for v in CARDS_JSON:
        if v.get('evolvesTo') == cid:
            return v['id']
    return None

if __name__ == '__main__':
    evo = [c['id'] for c in CARDS_JSON if c.get('evolution')]
    todo = sys.argv[1:] or evo
    scales = json.load(open(os.path.join(OUT, 'batch2.json')))
    for n, cid in enumerate(evo):
        if cid not in todo:
            continue
        b = base_of(cid)
        fn = builder(b) if b else None
        if fn is None:
            print('NO BUILDER', cid, b)
            continue
        reset()
        try:
            globals()['_barbarian'] = _barbarian_b1 if b == 'battle_ram' else _barbarian_b2
            parts = evolve(fn(), cid, n)
            path, tris = finish2(cid, parts, 1.1)
            print(cid, '<-', b, os.path.getsize(path) // 1024, 'KB', tris, 'tris')
        except Exception as e:
            import traceback; traceback.print_exc(); print('FAILED', cid, e)

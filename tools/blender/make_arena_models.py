"""Arena-themed models: pig towers (princess + king) and forest props (pine, rock, log).
Run through the Blender MCP:  exec(open('/home/user/clash_royale_clone/tools/blender/make_arena_models.py').read())
Same conventions as make_models.py (origin on the ground, facing Blender +Y, TEAM/TINT slots recoloured in Godot)."""
SKIP_AUTORUN = True
exec(open('/home/user/clash_royale_clone/tools/blender/make_models.py').read())

def pig_body(s, armored=False):
    p = []
    p.append(box('STONE', (3.7 * s, 3.7 * s, 0.22), (0, 0, 0.11), name='plinth'))
    p.append(sph('PINK', 1.3 * s, (0, 0, 1.2 * s + 0.2), (1.1, 1.0, 0.85), name='body'))
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.append(cyl('PINK_D', 0.28 * s, 0.55 * s, (sx * 0.78 * s, sy * 0.7 * s, 0.4 * s), seg=8, name='foot'))
    # head
    p.append(sph('PINK', 0.9 * s, (0, 1.3 * s, 1.35 * s + 0.1), name='head'))
    p.append(cyl('PINK_D', 0.44 * s, 0.4 * s, (0, 2.0 * s, 1.2 * s + 0.1), (HALF_PI, 0, 0), seg=10, name='snout'))
    for sx in (-1, 1):
        p.append(sph('DARK', 0.07 * s, (sx * 0.15 * s, 2.22 * s, 1.22 * s + 0.1), name='nostril'))
        p.append(sph('WHITE', 0.2 * s, (sx * 0.42 * s, 1.85 * s, 1.85 * s + 0.1), name='eye'))
        p.append(sph('DARK', 0.1 * s, (sx * 0.42 * s, 2.03 * s, 1.85 * s + 0.1), name='pupil'))
        p.append(cone('BONE', 0.12 * s, 0.45 * s, (sx * 0.5 * s, 1.95 * s, 0.95 * s + 0.1), (-HALF_PI * 0.6, 0, sx * 0.3), seg=6, name='tusk'))
        p.append(cone('PINK_D', 0.3 * s, 0.4 * s, (sx * 0.62 * s, 1.15 * s, 2.15 * s + 0.1), (0.3, 0, sx * 0.5), seg=4, name='ear'))
    return p

def build_pig(king):
    s = 1.55 if king else 1.0
    parts = pig_body(s)
    if king:
        # armoured shell + face slits (like the reference king pig), wings, gold crown rider
        parts.append(box('ARMOR', (2.7 * s, 2.0 * s, 1.1 * s), (0, -0.1 * s, 2.15 * s + 0.2), name='shell'))
        parts.append(box('ARMOR_D', (2.8 * s, 2.1 * s, 0.18 * s), (0, -0.1 * s, 2.72 * s + 0.2), name='shell_top'))
        for i in range(3):
            parts.append(box('DARK', (0.42 * s, 0.1, 0.5 * s), ((i - 1) * 0.75 * s, 0.98 * s, 2.2 * s + 0.2), name='slit'))
        for sx in (-1, 1):
            parts.append(box('WHITE', (1.5 * s, 0.1, 0.5 * s), (sx * 1.9 * s, -0.5 * s, 3.4 * s), (0, sx * -0.5, sx * 0.25), name='wing'))
        parts.append(box('TEAM', (1.0 * s, 0.7 * s, 0.9 * s), (0, -0.2 * s, 3.3 * s), name='robe'))
        parts.append(sph('SKIN', 0.3 * s, (0, -0.2 * s, 4.0 * s), name='king_head'))
        parts.append(cyl('GOLD', 0.34 * s, 0.25 * s, (0, -0.2 * s, 4.28 * s), seg=6, r2=0.22 * s, name='crown'))
        parts.append(box('TEAM', (1.2 * s, 0.1, 0.9 * s), (0, -1.35 * s, 3.2 * s), name='banner'))
    else:
        parts.append(box('TEAM', (1.7 * s, 1.5 * s, 0.22), (0, -0.15 * s, 2.45 * s), name='saddle'))
        parts.append(box('WOOD', (1.8 * s, 1.6 * s, 0.1), (0, -0.15 * s, 2.28 * s), name='saddle_base'))
        parts.append(box('TEAM', (0.5 * s, 0.35 * s, 0.6 * s), (0, -0.2 * s, 2.9 * s), name='rider_body'))
        parts.append(sph('SKIN', 0.2 * s, (0, -0.2 * s, 3.35 * s), name='rider_head'))
        parts.append(cyl('DARK', 0.23 * s, 0.14 * s, (0, -0.2 * s, 3.5 * s), seg=8, name='rider_hair'))
        parts.append(box('DARK', (0.08, 0.7 * s, 0.08), (0.28 * s, 0.1 * s, 3.0 * s), name='crossbow'))
        parts.append(box('DARK', (0.08, 0.08, 1.4 * s), (-0.95 * s, -0.6 * s, 3.2 * s), name='pole'))
        parts.append(box('TEAM', (0.6 * s, 0.05, 0.4 * s), (-0.95 * s, -0.6 * s, 3.8 * s), name='flag'))
    return parts

def pine():
    p = [cyl('BARK', 0.3, 1.0, (0, 0, 0.5), seg=6, name='trunk')]
    for i, (r, h, z, m) in enumerate([(1.6, 1.6, 1.6, 'PINE_D'), (1.3, 1.5, 2.6, 'PINE_L'), (0.95, 1.4, 3.6, 'PINE_D'), (0.6, 1.2, 4.5, 'PINE_L')]):
        p.append(cone(m, r, h, (0, 0, z), seg=7, name='tier'))
    return p

def rock():
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0, location=(0, 0, 0.5))
    o = bpy.context.active_object
    o.scale = (1.1, 0.9, 0.7)
    _finish(o, 'ROCK', 'rock')
    return [o]

def log():
    p = [cyl('BARK', 0.55, 3.2, (0, 0, 0.55), (0, HALF_PI, 0.25), seg=8, name='log')]
    for sx in (-1, 1):
        p.append(cyl('WOOD_L', 0.48, 0.05, (sx * 1.6 * math.cos(0.25), sx * 1.6 * math.sin(0.25) * -1, 0.55), (0, HALF_PI, 0.25), seg=8, name='ring'))
    return p

out = {}
reset(); out['tower_princess'] = finish_model('tower_princess', build_pig(False))
reset(); out['tower_king'] = finish_model('tower_king', build_pig(True))
reset(); out['pine'] = finish_model('pine', pine())
reset(); out['rock'] = finish_model('rock', rock())
reset(); out['log'] = finish_model('log', log())
for k, (pth, t) in out.items():
    print(k, os.path.getsize(pth), 'bytes', t, 'tris')

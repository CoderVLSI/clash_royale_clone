"""Chest models (Body + Lid objects in one GLB, lid origin at the hinge) for the lobby / chest opening.
Run:  /opt/blenv/bin/python tools/blender/make_chest_models.py
Output: godot/assets/models/chests/<TYPE>.glb  (SILVER, GOLD, GIANT, MAGICAL, SUPER_MAGICAL, CROWN)."""
import os, sys, math
ONLY = []
exec(open('/home/user/clash_royale_clone/tools/blender/make_card_models.py').read())
reg(CH_SILVER=(0.78, 0.82, 0.88), CH_SILVER_D=(0.5, 0.54, 0.62), CH_GOLD=(1.0, 0.78, 0.15), CH_GOLD_D=(0.75, 0.5, 0.08), CH_WOOD_S=(0.42, 0.28, 0.17), CH_WOOD_G=(0.55, 0.32, 0.12),
    CH_WOOD_B=(0.5, 0.17, 0.1), CH_PURPLE=(0.4, 0.17, 0.62), CH_PURPLE_D=(0.25, 0.1, 0.42), CH_NAVY=(0.12, 0.2, 0.5), CH_NAVY_D=(0.07, 0.12, 0.32), CH_BLACK=(0.15, 0.1, 0.18),
    E_LIGHT=(1.0, 0.92, 0.55), E_VIOLET=(0.8, 0.4, 1.0), E_SKY=(0.4, 0.85, 1.0))
OUTC = '/home/user/clash_royale_clone/godot/assets/models/chests'
os.makedirs(OUTC, exist_ok=True)

SPEC = {  # wood, wood trim, band, band dark, gem, scale, extras
    'SILVER':        dict(wood='CH_WOOD_S', band='CH_SILVER', band_d='CH_SILVER_D', gem='STEEL', sc=1.0),
    'GOLD':          dict(wood='CH_WOOD_G', band='CH_GOLD', band_d='CH_GOLD_D', gem='E_ORANGE', sc=1.0),
    'GIANT':         dict(wood='CH_WOOD_B', band='STEEL_D', band_d='DARK', gem='CH_GOLD', sc=1.35, studs=True),
    'MAGICAL':       dict(wood='CH_PURPLE', band='CH_GOLD', band_d='CH_GOLD_D', gem='E_MAGENTA', sc=1.1, crystals='E_VIOLET'),
    'SUPER_MAGICAL': dict(wood='CH_NAVY', band='CH_SILVER', band_d='E_SKY', gem='E_SKY', sc=1.2, crystals='E_SKY', halo=True),
    'CROWN':         dict(wood='CH_WOOD_G', band='CH_GOLD', band_d='CH_GOLD_D', gem='E_GOLD', sc=1.0, crown=True),
}
W, D, H = 2.0, 1.3, 0.85      # body width (x), depth (y), height (z)
R = D / 2                     # lid radius
HINGE = (0, -D / 2, H)

def body(sp):
    p = [B(sp['wood'], W, D, H, 0, 0, H / 2), B(sp['band_d'], W + 0.12, D + 0.12, 0.14, 0, 0, 0.07),
         B('E_LIGHT', W - 0.25, D - 0.25, 0.05, 0, 0, H + 0.01)]
    for sx in (-0.72, 0.72):
        p += [B(sp['band'], 0.22, D + 0.1, H + 0.02, sx, 0, H / 2), B(sp['band_d'], 0.26, D + 0.14, 0.1, sx, 0, H - 0.05)]
    p += [B(sp['band'], W + 0.1, 0.1, 0.12, 0, D / 2 + 0.04, H - 0.12)]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p += [S(sp['band'], 0.12, sx * (W / 2 + 0.02), sy * (D / 2 + 0.02), 0.12), S(sp['band'], 0.12, sx * (W / 2 + 0.02), sy * (D / 2 + 0.02), H - 0.05)]
    if sp.get('studs'):
        for i in range(5):
            p += [S('CH_GOLD', 0.07, -0.8 + i * 0.4, D / 2 + 0.07, 0.25), S('CH_GOLD', 0.07, -0.8 + i * 0.4, D / 2 + 0.07, 0.55)]
    return p

def lid(sp):
    # half-cylinder along X (rotate cylinder axis Z -> X), lower half buried in a box
    p = [Y(sp['wood'], R, W, 0, 0, H, 0, Z, 0, seg=14), B(sp['wood'], W, D, 0.3, 0, 0, H + 0.1)]
    p += [Y(sp['band_d'], R + 0.06, W + 0.14, 0, 0, H, 0, Z, 0, seg=14, r2=R + 0.06)]
    for sx in (-0.72, 0.72):
        p.append(Y(sp['band'], R + 0.1, 0.24, sx, 0, H, 0, Z, 0, seg=14))
    # bottom half of the lid cylinders is hidden inside the body; add a lock plate and gem on the front
    p += [B(sp['band'], 0.5, 0.1, 0.5, 0, D / 2 + 0.02, H - 0.15), S(sp['gem'], 0.14, 0, D / 2 + 0.1, H - 0.1, 1, 0.6, 1.2), B('DARK', 0.07, 0.05, 0.14, 0, D / 2 + 0.14, H - 0.28)]
    if sp.get('crystals'):
        for i, (x, h) in enumerate(((-0.55, 0.55), (0.0, 0.8), (0.55, 0.55), (-0.25, 0.4), (0.3, 0.4))):
            p.append(K(sp['crystals'], 0.13, h, x, -0.05 + (i % 2) * 0.1, H + R + h / 2 - 0.05, 0, 0, 0.0, 5))
    if sp.get('crown'):
        p += [B('CH_GOLD', 0.8, 0.3, 0.2, 0, 0, H + R + 0.1)]
        for i in range(5):
            p.append(K('CH_GOLD', 0.09, 0.3, -0.32 + i * 0.16, 0, H + R + 0.35))
    if sp.get('halo'):
        p.append(T('E_SKY', 0.9, 0.04, 0, 0, H + R + 0.6, 0.2, 0, 0))
    return p

def export(name, sp):
    reset()
    parts_b = body(sp)
    parts_l = lid(sp)
    def join(parts, oname, origin=None):
        bpy.ops.object.select_all(action='DESELECT')
        for q in parts:
            q.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]
        bpy.ops.object.join()
        o = bpy.context.active_object
        o.name = oname
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        for poly in o.data.polygons:
            poly.use_smooth = False
        if origin:
            bpy.context.scene.cursor.location = origin
            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True)
            bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        return o
    ob = join(parts_b, 'Body')
    ol = join(parts_l, 'Lid', HINGE)
    for o in (ob, ol):
        o.scale = (sp['sc'],) * 3
    ol.location = tuple(c * sp['sc'] for c in HINGE)
    bpy.ops.object.select_all(action='SELECT')
    path = os.path.join(OUTC, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT', export_yup=True)
    print(name, os.path.getsize(path) // 1024, 'KB')

for _n, _sp in SPEC.items():
    export(_n, _sp)

"""Generates the low-poly game models (GLB) for the Godot port.

Run inside Blender (or the bpy module), e.g. through the Blender MCP `execute_blender_code` tool:
    exec(open('/home/user/clash_royale_clone/tools/blender/make_models.py').read())

Conventions (read by godot/scripts/model_factory.gd):
  * Origin at the feet, model faces Blender +Y  (-> Godot -Z, the "forward" of a unit).
  * Material slots named TINT (card colour) and TEAM (blue/red team colour) are recoloured at runtime;
    every other material (SKIN, METAL, WOOD, BONE, GOLD, GREEN, DARK, CLOTH) keeps its authored colour.
  * Units are ~2 m tall at scale 1.0; Godot scales them by hit points.
"""
import bpy, math, os

OUT = '/home/user/clash_royale_clone/godot/assets/models'
os.makedirs(OUT, exist_ok=True)

PALETTE = {
    'TINT': (0.80, 0.25, 0.25, 1), 'TEAM': (0.18, 0.49, 0.88, 1), 'SKIN': (0.94, 0.78, 0.62, 1),
    'METAL': (0.72, 0.76, 0.82, 1), 'WOOD': (0.45, 0.30, 0.16, 1), 'BONE': (0.93, 0.92, 0.86, 1),
    'GOLD': (0.96, 0.77, 0.10, 1), 'GREEN': (0.37, 0.75, 0.29, 1), 'DARK': (0.14, 0.14, 0.17, 1),
    'CLOTH': (0.55, 0.40, 0.70, 1), 'STONE': (0.73, 0.70, 0.64, 1), 'STONE_D': (0.55, 0.52, 0.47, 1),
    'FIRE': (1.00, 0.45, 0.10, 1), 'WHITE': (0.97, 0.97, 0.97, 1),
}
_mats = {}

def material(name):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = PALETTE[name]
    bsdf.inputs['Roughness'].default_value = 0.8
    if name == 'FIRE':
        bsdf.inputs['Emission Color'].default_value = PALETTE[name]
        bsdf.inputs['Emission Strength'].default_value = 1.5
    m.diffuse_color = PALETTE[name]
    _mats[name] = m
    return m

def _finish(obj, mat, name):
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(material(mat))
    return obj

def box(mat, size, loc=(0, 0, 0), rot=(0, 0, 0), name='box'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = size
    return _finish(o, mat, name)

def cyl(mat, r, h, loc=(0, 0, 0), rot=(0, 0, 0), seg=10, r2=None, name='cyl'):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=r if r2 is None else r2, depth=h, location=loc, rotation=rot)
    return _finish(bpy.context.active_object, mat, name)

def sph(mat, r, loc=(0, 0, 0), scale=(1, 1, 1), name='sph'):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=10, ring_count=6, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    return _finish(o, mat, name)

def cone(mat, r, h, loc=(0, 0, 0), rot=(0, 0, 0), seg=8, name='cone'):
    return cyl(mat, r, h, loc, rot, seg, 0.0, name)

def finish_model(name, parts):
    """Join parts into one mesh object (multi-material), shade flat, export GLB."""
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for poly in obj.data.polygons:
        poly.use_smooth = False
    path = os.path.join(OUT, name + '.glb')
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
                              export_materials='EXPORT', export_yup=True)
    tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    bpy.data.objects.remove(obj, do_unlink=True)
    return path, tris

def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

HALF_PI = math.pi / 2

# ---------------------------------------------------------------------------------------- characters
def humanoid(head_extra, weapon, torso_scale=1.0, with_shield=False, legs='DARK'):
    s = torso_scale
    parts = [
        box(legs, (0.26 * s, 0.28 * s, 0.7 * s), (-0.17 * s, 0, 0.35 * s), name='legL'),
        box(legs, (0.26 * s, 0.28 * s, 0.7 * s), (0.17 * s, 0, 0.35 * s), name='legR'),
        box('TINT', (0.62 * s, 0.38 * s, 0.75 * s), (0, 0, 1.08 * s), name='torso'),
        box('TEAM', (0.66 * s, 0.42 * s, 0.12 * s), (0, 0, 0.78 * s), name='belt'),
        sph('SKIN', 0.27 * s, (0, 0, 1.68 * s), name='head'),
        box('SKIN', (0.16 * s, 0.16 * s, 0.55 * s), (-0.42 * s, 0.05, 1.12 * s), name='armL'),
        box('SKIN', (0.16 * s, 0.16 * s, 0.55 * s), (0.42 * s, 0.1, 1.15 * s), (-0.5, 0, 0), name='armR'),
    ]
    parts += head_extra(s)
    parts += weapon(s)
    if with_shield:
        parts.append(box('TEAM', (0.1 * s, 0.5 * s, 0.6 * s), (-0.55 * s, 0.1, 1.1 * s), name='shield'))
        parts.append(box('GOLD', (0.12 * s, 0.14 * s, 0.14 * s), (-0.61 * s, 0.1, 1.1 * s), name='boss'))
    return parts

def helmet(s):
    return [cyl('METAL', 0.3 * s, 0.26 * s, (0, 0, 1.78 * s), name='helm'), box('TEAM', (0.07 * s, 0.07 * s, 0.3 * s), (0, 0, 2.02 * s), name='plume'),
            box('DARK', (0.34 * s, 0.05 * s, 0.07 * s), (0, 0.24 * s, 1.7 * s), name='visor')]

def hood(s):
    return [cone('TINT', 0.33 * s, 0.55 * s, (0, -0.02, 1.9 * s), name='hood')]

def wizard_hat(s):
    return [cyl('CLOTH', 0.45 * s, 0.05 * s, (0, 0, 1.86 * s), name='brim'), cone('CLOTH', 0.3 * s, 0.75 * s, (0, 0, 2.28 * s), name='hat')]

def goblin_ears(s):
    return [box('GREEN', (0.9 * s, 0.07 * s, 0.14 * s), (0, 0, 1.7 * s), name='ears')]

def sword(s):
    return [box('METAL', (0.07 * s, 0.07 * s, 0.95 * s), (0.42 * s, 0.55, 1.35 * s), (HALF_PI * 0.0, 0, 0), name='blade'),
            box('WOOD', (0.3 * s, 0.08 * s, 0.08 * s), (0.42 * s, 0.4, 1.05 * s), name='guard')]

def bow(s):
    return [cyl('WOOD', 0.04 * s, 1.0 * s, (0.42 * s, 0.5, 1.2 * s), name='bow'), box('BONE', (0.02, 0.02, 0.9 * s), (0.42 * s, 0.42, 1.2 * s), name='string')]

def staff(s):
    return [cyl('WOOD', 0.04 * s, 1.7 * s, (0.46 * s, 0.35, 1.0 * s), name='staff'), sph('FIRE', 0.15 * s, (0.46 * s, 0.35, 1.9 * s), name='orb')]

def club(s):
    return [cyl('WOOD', 0.07 * s, 1.0 * s, (0.42 * s, 0.45, 1.3 * s), name='club'), sph('WOOD', 0.17 * s, (0.42 * s, 0.45, 1.85 * s), name='clubhead')]

def dagger(s):
    return [box('METAL', (0.05 * s, 0.05 * s, 0.4 * s), (0.42 * s, 0.45, 1.2 * s), name='dagger')]

def gun(s):
    return [box('DARK', (0.1 * s, 0.9 * s, 0.1 * s), (0.4 * s, 0.5, 1.25 * s), name='gun')]

def build_all():
    out = {}
    # warrior family
    reset(); out['warrior'] = finish_model('warrior', humanoid(helmet, sword, 1.0, True))
    reset(); out['ranger'] = finish_model('ranger', humanoid(hood, bow, 0.95))
    reset(); out['gunner'] = finish_model('gunner', humanoid(hood, gun, 0.95))
    reset()
    parts = humanoid(wizard_hat, staff, 0.95)
    parts[0].name = 'legL'
    out['mage'] = finish_model('mage', parts)
    reset(); out['goblin'] = finish_model('goblin', humanoid(goblin_ears, dagger, 0.6))
    reset()
    sk = humanoid(lambda s: [], dagger, 0.8, False, 'BONE')
    out['skeleton'] = finish_model('skeleton', sk)
    # brute (giant / golem / pekka)
    reset()
    brute = [
        box('DARK', (0.5, 0.5, 0.9), (-0.3, 0, 0.45), name='legL'), box('DARK', (0.5, 0.5, 0.9), (0.3, 0, 0.45), name='legR'),
        box('TINT', (1.3, 0.8, 1.2), (0, 0, 1.5), name='torso'), box('TEAM', (1.34, 0.84, 0.18), (0, 0, 0.95), name='belt'),
        box('SKIN', (0.4, 0.4, 1.2), (-0.9, 0.05, 1.3), name='armL'), box('SKIN', (0.4, 0.4, 1.2), (0.9, 0.05, 1.3), name='armR'),
        sph('SKIN', 0.34, (0, 0.05, 2.35), name='head'), box('DARK', (0.6, 0.1, 0.16), (0, 0.3, 2.4), name='brow'),
    ]
    out['brute'] = finish_model('brute', brute)
    # flyer (dragon / minion / balloon-ish)
    reset()
    fly = [
        sph('TINT', 0.5, (0, 0, 0), (1.0, 1.4, 0.85), name='body'), sph('TINT', 0.3, (0, 0.8, 0.15), name='head'),
        cone('GOLD', 0.1, 0.35, (0, 1.12, 0.12), (-HALF_PI, 0, 0), name='snout'),
        box('TINT', (1.2, 0.5, 0.06), (-0.95, 0.05, 0.15), (0, 0, 0.25), name='wingL'), box('TINT', (1.2, 0.5, 0.06), (0.95, 0.05, 0.15), (0, 0, -0.25), name='wingR'),
        cone('TINT', 0.15, 0.8, (0, -0.95, -0.05), (HALF_PI, 0, 0), name='tail'), box('TEAM', (0.2, 0.2, 0.2), (0, 0, 0.5), name='mark'),
    ]
    out['flyer'] = finish_model('flyer', fly)
    # beast (hog / ram)
    reset()
    beast = [
        box('TINT', (0.9, 1.6, 0.8), (0, 0, 0.8), name='body'), sph('TINT', 0.45, (0, 0.95, 0.9), name='head'), box('GOLD', (0.14, 0.14, 0.14), (-0.28, 1.35, 0.8), name='tuskL'),
        box('GOLD', (0.14, 0.14, 0.14), (0.28, 1.35, 0.8), name='tuskR'),
        box('DARK', (0.2, 0.2, 0.5), (-0.28, 0.6, 0.25), name='f1'), box('DARK', (0.2, 0.2, 0.5), (0.28, 0.6, 0.25), name='f2'),
        box('DARK', (0.2, 0.2, 0.5), (-0.28, -0.6, 0.25), name='f3'), box('DARK', (0.2, 0.2, 0.5), (0.28, -0.6, 0.25), name='f4'),
        sph('SKIN', 0.24, (0, -0.1, 1.5), name='rider'), box('TEAM', (0.4, 0.3, 0.5), (0, -0.1, 1.2), name='riderbody'),
    ]
    out['beast'] = finish_model('beast', beast)
    # building (cannon / generic)
    reset()
    bld = [
        box('STONE_D', (1.9, 1.9, 0.35), (0, 0, 0.18), name='base'), cyl('WOOD', 0.7, 0.9, (0, 0, 0.8), seg=10, name='body'),
        cyl('DARK', 0.2, 1.3, (0, 0.55, 1.25), (-HALF_PI, 0, 0), name='barrel'), cone('TEAM', 0.9, 0.7, (0, 0, 1.55), name='roof'),
    ]
    out['building'] = finish_model('building', bld)
    # spirit (small kamikaze blobs)
    reset()
    spirit = [sph('TINT', 0.45, (0, 0, 0.5), (1, 1, 1.05), name='body'), cone('FIRE', 0.2, 0.5, (0, 0, 1.1), name='flame'),
              sph('DARK', 0.07, (-0.15, 0.4, 0.62), name='eyeL'), sph('DARK', 0.07, (0.15, 0.4, 0.62), name='eyeR')]
    out['spirit'] = finish_model('spirit', spirit)
    # towers
    reset()
    pt = [box('STONE_D', (3.6, 3.6, 0.5), (0, 0, 0.25), name='plinth'), cyl('STONE', 1.35, 2.6, (0, 0, 1.8), seg=10, r2=1.2, name='body'),
          cyl('STONE_D', 1.75, 0.5, (0, 0, 3.3), seg=10, r2=1.45, name='deck')]
    for i in range(8):
        a = math.tau * i / 8
        pt.append(box('STONE', (0.5, 0.5, 0.55), (math.cos(a) * 1.55, math.sin(a) * 1.55, 3.75), (0, 0, a), name='merlon'))
    pt += [cone('TEAM', 1.25, 1.3, (0, 0, 4.25), seg=8, name='roof'), box('DARK', (0.1, 0.1, 1.0), (0, 0, 5.2), name='pole'), box('TEAM', (0.7, 0.05, 0.4), (0.35, 0, 5.4), name='flag')]
    out['tower_princess'] = finish_model('tower_princess', pt)
    reset()
    kt = [box('STONE_D', (5.2, 5.2, 0.6), (0, 0, 0.3), name='plinth'), cyl('STONE', 1.95, 3.8, (0, 0, 2.5), seg=12, r2=1.75, name='body'),
          cyl('STONE_D', 2.5, 0.6, (0, 0, 4.7), seg=12, r2=2.1, name='deck')]
    for i in range(10):
        a = math.tau * i / 10
        kt.append(box('STONE', (0.7, 0.7, 0.7), (math.cos(a) * 2.25, math.sin(a) * 2.25, 5.3), (0, 0, a), name='merlon'))
    kt += [cone('TEAM', 1.9, 2.0, (0, 0, 6.1), seg=8, name='roof'), box('GOLD', (1.2, 0.5, 0.55), (0, 0, 7.4), name='crownbase'), sph('GOLD', 0.4, (0, 0, 8.0), name='gem'),
           cyl('DARK', 0.4, 2.3, (0, 1.7, 5.3), (-HALF_PI, 0, 0), name='cannon')]
    out['tower_king'] = finish_model('tower_king', kt)
    return out

res = build_all()
for k, (p, t) in res.items():
    print(k, os.path.getsize(p), 'bytes', t, 'tris')

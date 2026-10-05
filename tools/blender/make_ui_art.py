"""Renders the UI icon set and the lobby background with Blender (Cycles, CPU) for the Godot port.

Run through the Blender MCP / bpy:
    RENDER = ['coin']            # optional: only these (icons + 'bg'); default = everything
    exec(open('/home/user/clash_royale_clone/tools/blender/make_ui_art.py').read())
Outputs: godot/assets/art/ui/<icon>.png (256x256, transparent) and lobby_bg.jpg (540x1170).
"""
import bpy, math, os, random
from mathutils import Vector

OUT = '/home/user/clash_royale_clone/godot/assets/art/ui'
os.makedirs(OUT, exist_ok=True)
H = math.pi / 2

def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for b in list(c):
            c.remove(b)

def mat(color, metal=0.0, rough=0.4, emit=0.0, name=None):
    m = bpy.data.materials.new(name or 'm')
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if emit > 0:
        b.inputs['Emission Color'].default_value = (*color, 1)
        b.inputs['Emission Strength'].default_value = emit
    return m

GOLD = lambda: mat((1.0, 0.72, 0.12), 0.9, 0.28)
GOLD_D = lambda: mat((0.75, 0.48, 0.05), 0.9, 0.35)

def put(o, m, name='p'):
    o.name = name
    o.data.materials.clear()
    o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    return o

def box(m, size, loc, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = size
    return put(o, m)

def cyl(m, r, h, loc, rot=(0, 0, 0), r2=None, seg=24):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=r if r2 is None else r2, depth=h, location=loc, rotation=rot)
    return put(bpy.context.active_object, m)

def sph(m, r, loc, scale=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=seg // 2, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    return put(o, m)

def torus(m, R, r, loc, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot, major_segments=32, minor_segments=12)
    return put(bpy.context.active_object, m)

def setup_render(w, h, samples, transparent):
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = samples
    try:
        s.cycles.use_denoising = True
    except Exception:
        pass
    s.render.resolution_x, s.render.resolution_y = w, h
    s.render.resolution_percentage = 100
    s.render.film_transparent = transparent
    s.render.image_settings.file_format = 'PNG' if transparent else 'JPEG'
    s.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    try:
        s.view_settings.view_transform = 'Standard'
    except Exception:
        pass

def icon_scene():
    s = bpy.context.scene
    w = s.world or bpy.data.worlds.new('W')
    s.world = w
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (0.9, 0.93, 1.0, 1)
    bg.inputs['Strength'].default_value = 0.9
    cam = bpy.data.cameras.new('cam')
    cam.type = 'ORTHO'
    cam.ortho_scale = 2.9
    co = bpy.data.objects.new('cam', cam)
    s.collection.objects.link(co)
    co.location = (0, -8, 0.0)
    co.rotation_euler = (H, 0, 0)
    s.camera = co
    for nm, loc, e, size in (('key', (-3, -5, 4), 600, 4.0), ('rim', (4, -2, 3), 250, 3.0)):
        l = bpy.data.lights.new(nm, 'AREA')
        l.energy = e
        l.size = size
        lo = bpy.data.objects.new(nm, l)
        s.collection.objects.link(lo)
        lo.location = loc
        d = (Vector((0, 0, 0)) - Vector(loc)).normalized()
        lo.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

# ----------------------------------------------------------------------------- icon builders (face the camera at -Y)
def b_coin():
    cyl(GOLD(), 1.0, 0.2, (0, 0, 0), (H, 0, 0))
    torus(GOLD_D(), 0.95, 0.07, (0, -0.1, 0), (H, 0, 0))
    cyl(GOLD_D(), 0.7, 0.04, (0, -0.11, 0), (H, 0, 0))
    torus(GOLD(), 0.45, 0.06, (0, -0.14, 0), (H, 0, 0))

def b_gem():
    m = mat((0.15, 0.55, 1.0), 0.0, 0.1, 0.6)
    cyl(m, 1.0, 0.5, (0, 0, 0.45), (0, 0, 0), r2=0.62, seg=8)
    cyl(m, 0.62, 0.9, (0, 0, -0.25), (math.pi, 0, 0), r2=0.0, seg=8)
    cyl(mat((0.7, 0.9, 1.0), 0, 0.05, 1.5), 0.3, 0.05, (-0.1, -0.5, 0.5), (H, 0, 0), r2=0.1, seg=8)

def b_trophy():
    cyl(GOLD(), 0.55, 1.0, (0, 0, 0.55), (0, 0, 0), r2=0.9)
    cyl(GOLD_D(), 0.14, 0.5, (0, 0, -0.2), (0, 0, 0))
    box(mat((0.35, 0.22, 0.1), 0, 0.6), (1.1, 0.5, 0.25), (0, 0, -0.55))
    box(GOLD(), (0.7, 0.04, 0.12), (0, -0.27, -0.55))
    torus(GOLD(), 0.38, 0.08, (-0.95, 0, 0.6), (H, 0, 0))
    torus(GOLD(), 0.38, 0.08, (0.95, 0, 0.6), (H, 0, 0))
    sph(mat((1, 0.95, 0.7), 0, 0.2, 1.2), 0.2, (0, -0.45, 0.65), (1, 0.3, 1))

def b_crown():
    cyl(GOLD(), 0.95, 0.5, (0, 0, -0.45), (0, 0, 0), r2=1.0)
    gem_cols = [(0.9, 0.1, 0.2), (0.15, 0.6, 1.0), (0.2, 0.85, 0.35), (0.15, 0.6, 1.0), (0.9, 0.1, 0.2)]
    for i, gx in enumerate((-0.85, -0.42, 0.0, 0.42, 0.85)):
        hgt = 1.15 if i == 2 else 0.9
        cyl(GOLD(), 0.22, hgt, (gx, 0, -0.2 + hgt / 2.0), (0, 0, 0), r2=0.08, seg=6)
        sph(mat(gem_cols[i], 0, 0.1, 0.8), 0.14, (gx, 0, -0.2 + hgt + 0.1))
    for gx in (-0.55, 0, 0.55):
        sph(mat((0.9, 0.1, 0.2), 0, 0.1, 0.8), 0.12, (gx, -0.5, -0.45))

def b_chest():
    wood = mat((0.5, 0.28, 0.1), 0, 0.6)
    box(wood, (1.7, 1.1, 0.85), (0, 0, -0.3))
    lid = cyl(wood, 0.55, 1.7, (0, 0, 0.12), (0, H, 0), seg=20)
    lid.scale = (1, 1.0, 1.0)
    lid.location.z = 0.12
    for gx in (-0.65, 0.65):
        box(GOLD(), (0.14, 1.2, 1.5), (gx, 0, -0.02))
    box(GOLD(), (0.3, 0.12, 0.38), (0, -0.62, 0.05))
    sph(mat((0.15, 0.1, 0.05)), 0.07, (0, -0.7, 0.05))

def b_drop():
    m = mat((0.9, 0.2, 0.85), 0.0, 0.12, 0.35)
    sph(m, 0.78, (0, 0, -0.3))
    cyl(m, 0.74, 1.15, (0, 0, 0.55), (0, 0, 0), r2=0.0)
    sph(mat((1, 0.9, 1), 0, 0.1, 1.4), 0.17, (-0.28, -0.55, -0.1), (0.7, 0.3, 1.1))

def b_shop():
    red = mat((0.85, 0.15, 0.2), 0, 0.45)
    cyl(red, 1.0, 1.3, (0, 0, -0.1), (0, 0, math.radians(45)), r2=0.75, seg=4)
    torus(GOLD_D(), 0.35, 0.06, (0, 0, 0.75), (H, 0, 0))
    star = cyl(GOLD(), 0.3, 0.06, (0, -0.55, -0.1), (H, 0, 0), r2=0.3, seg=5)
    cyl(mat((1, 0.95, 0.6), 0, 0.3, 0.5), 0.18, 0.08, (0, -0.58, -0.1), (H, 0, 0), seg=5)

def b_decks():
    cols = [(0.85, 0.2, 0.3), (0.2, 0.5, 0.95), (0.95, 0.75, 0.15)]
    for i, (c, a) in enumerate(zip(cols, (22, 0, -22))):
        o = box(mat(c, 0, 0.35), (0.95, 0.04, 1.35), (math.sin(math.radians(a)) * -0.3, -0.05 * i, -0.0))
        o.rotation_euler = (0, math.radians(-a), 0)
        box(mat((1, 1, 1), 0, 0.3), (0.65, 0.05, 0.95), (math.sin(math.radians(a)) * -0.3, -0.07 * i - 0.01, 0.0)).rotation_euler = (0, math.radians(-a), 0)

def b_battle():
    for a in (40, -40):
        r = math.radians(a)
        box(mat((0.85, 0.88, 0.95), 1.0, 0.18), (0.2, 0.06, 1.9), (0, 0, 0.1)).rotation_euler = (0, r, 0)
        gx, gz = math.sin(r) * -0.62, math.cos(r) * -0.62 + 0.1
        o = box(GOLD(), (0.75, 0.1, 0.14), (gx, 0, gz + 0.1))
        o.rotation_euler = (0, r, 0)
        hx, hz = math.sin(r) * -0.92, math.cos(r) * -0.92 + 0.1
        cyl(mat((0.4, 0.22, 0.1)), 0.07, 0.4, (hx, 0, hz), (0, r, 0))
        sph(GOLD(), 0.13, (math.sin(r) * -1.18, 0, math.cos(r) * -1.18 + 0.1))

def b_social():
    for x, c in ((-0.45, (0.2, 0.5, 0.95)), (0.45, (0.95, 0.65, 0.15))):
        sph(mat((1.0, 0.82, 0.65), 0, 0.5), 0.34, (x, 0, 0.55))
        cyl(mat(c, 0, 0.45), 0.55, 0.95, (x, 0.0, -0.4), (0, 0, 0), r2=0.3)

def b_events():
    cyl(mat((0.45, 0.28, 0.1)), 0.07, 2.0, (-0.6, 0, 0.0))
    box(mat((0.85, 0.15, 0.2), 0, 0.5), (1.3, 0.04, 0.95), (0.1, 0, 0.5))
    cyl(GOLD(), 0.32, 0.06, (0.1, -0.05, 0.5), (H, 0, 0), seg=5)
    sph(GOLD(), 0.12, (-0.6, 0, 1.05))
    box(mat((0.45, 0.28, 0.1)), (0.8, 0.5, 0.15), (-0.6, 0, -1.0))

def b_chat():
    sph(mat((0.97, 0.97, 1.0), 0, 0.35), 1.0, (0, 0, 0.1), (1.0, 0.3, 0.7))
    cyl(mat((0.97, 0.97, 1.0), 0, 0.35), 0.3, 0.5, (-0.45, 0, -0.7), (H, 0, math.radians(180)), r2=0.0, seg=3)
    for x in (-0.4, 0, 0.4):
        sph(mat((0.15, 0.17, 0.25)), 0.11, (x, -0.3, 0.12))

ICONS = {'coin': b_coin, 'gem': b_gem, 'trophy': b_trophy, 'crown': b_crown, 'chest': b_chest, 'drop': b_drop, 'shop': b_shop,
         'decks': b_decks, 'battle': b_battle, 'social': b_social, 'events': b_events, 'chat': b_chat}

def render_icon(name):
    reset()
    setup_render(256, 256, 40, True)
    icon_scene()
    ICONS[name]()
    bpy.context.scene.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)

# ----------------------------------------------------------------------------- lobby background
def render_bg():
    reset()
    setup_render(540, 1170, 40, True)
    s = bpy.context.scene
    rng = random.Random(5)
    # sky
    w = bpy.data.worlds.new('W')
    s.world = w
    w.use_nodes = True
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    mp = nt.nodes.new('ShaderNodeMapRange')
    mp.inputs['From Min'].default_value = -0.2
    mp.inputs['From Max'].default_value = 1.0
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    el = ramp.color_ramp.elements
    el[0].position, el[0].color = 0.0, (0.22, 0.10, 0.32, 1)
    el[1].position, el[1].color = 1.0, (0.02, 0.04, 0.18, 1)
    for pos, col in ((0.17, (1.0, 0.52, 0.28, 1)), (0.30, (0.78, 0.36, 0.55, 1)), (0.55, (0.20, 0.22, 0.60, 1))):
        e = el.new(pos)
        e.color = col
    bgn = nt.nodes.new('ShaderNodeBackground')
    bgn.inputs['Strength'].default_value = 1.0
    nt.links.new(geo.outputs['Incoming'], sep.inputs[0])
    nt.links.new(sep.outputs['Z'], mp.inputs['Value'])
    nt.links.new(mp.outputs['Result'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bgn.inputs[0])
    out = nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(bgn.outputs[0], out.inputs[0])
    # stone floor tiles
    for ix in range(-9, 10):
        for iz in range(0, 26):
            t = rng.uniform(0.0, 1.0)
            c = (0.20 + 0.10 * t, 0.19 + 0.09 * t, 0.26 + 0.11 * t)
            box(mat(c, 0, 0.8), (1.92, 0.12, 1.92), (ix * 2.0, iz * 2.0, -0.06)).location.y = iz * 2.0
    # castle: wall with arch opening, towers, glow
    stone = mat((0.55, 0.52, 0.6), 0, 0.85)
    stone_d = mat((0.4, 0.38, 0.47), 0, 0.85)
    wy = 30.0
    box(stone, (5.0, 2.0, 9.0), (-4.5, wy, 4.5))
    box(stone, (5.0, 2.0, 9.0), (4.5, wy, 4.5))
    box(stone, (4.2, 2.0, 4.0), (0, wy, 7.0))
    box(mat((1.0, 0.5, 0.12), 0, 0.5, 5.0), (4.4, 0.2, 5.0), (0, wy + 3.0, 2.5))
    for sx in (-1, 1):
        cyl(stone_d, 2.6, 15.0, (sx * 9.0, wy - 1.0, 7.5), seg=16)
        cyl(mat((0.2, 0.35, 0.9), 0, 0.4), 3.2, 5.0, (sx * 9.0, wy - 1.0, 17.5), r2=0.0, seg=16)
        for k in range(3):
            box(mat((1.0, 0.8, 0.4), 0, 0.5, 4.0), (0.7, 0.2, 1.4), (sx * 9.0 - sx * 0.2, wy - 3.5, 7.0 + k * 3.2))
        box(mat((0.15, 0.3, 0.85), 0, 0.6), (1.6, 0.1, 5.0), (sx * 4.2, wy - 1.2, 7.0))
        box(GOLD(), (1.7, 0.12, 0.3), (sx * 4.2, wy - 1.25, 4.4))
    # battlements
    for i in range(-8, 9):
        box(stone, (1.1, 2.0, 1.1), (i * 1.4, wy, 9.55))
    # torches + warm lights
    for sx in (-1, 1):
        for ty in (8.0, 16.0):
            cyl(mat((0.3, 0.2, 0.1)), 0.12, 2.6, (sx * 6.0, ty, 1.3), seg=8)
            sph(mat((1.0, 0.55, 0.12), 0, 0.3, 14.0), 0.34, (sx * 6.0, ty, 2.8))
            l = bpy.data.lights.new('t', 'POINT')
            l.energy = 2200
            l.color = (1.0, 0.6, 0.25)
            lo = bpy.data.objects.new('t', l)
            s.collection.objects.link(lo)
            lo.location = (sx * 6.0, ty, 3.2)
    # moon-ish fill light
    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy = 1.8
    sun.color = (0.7, 0.75, 1.0)
    so = bpy.data.objects.new('sun', sun)
    s.collection.objects.link(so)
    so.rotation_euler = (math.radians(55), 0, math.radians(30))
    # camera: portrait, slightly low, looking at the gate
    cam = bpy.data.cameras.new('cam')
    cam.lens = 24
    co = bpy.data.objects.new('cam', cam)
    s.collection.objects.link(co)
    co.location = (0, -3, 3.4)
    tgt = Vector((0, wy, 7.5))
    co.rotation_euler = (tgt - co.location).to_track_quat('-Z', 'Y').to_euler()
    s.camera = co
    s.render.filepath = '/tmp/lobby_fg.png'
    bpy.ops.render.render(write_still=True)

todo = globals().get('RENDER') or list(ICONS) + ['bg']
for t in todo:
    render_bg() if t == 'bg' else render_icon(t)
    print('rendered', t)

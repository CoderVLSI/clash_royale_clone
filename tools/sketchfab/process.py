"""Shrinks a Sketchfab GLB for the game: one mesh, origin at the base centre, scaled to a target size, decimated, base-colour/emission
textures only (downsized and brightened), no metal/normal maps (the game has no environment reflections).
usage: GAIN=1.6 /opt/blenv/bin/python process.py in.glb out.glb target_size axis(x|y|z|max) max_faces tex_px
axis picks which model dimension target_size refers to (blender axes: y = depth, z = height; 'h' = height)."""
import bpy, sys, os
from mathutils import Vector, Matrix
src, dst, size, axis, max_faces, tex_px = sys.argv[-6:]
size = float(size); max_faces = int(max_faces); tex_px = int(tex_px)
gain = float(os.environ.get("GAIN", "1.0"))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in bpy.context.scene.objects:
    o.select_set(o.type == "MESH")
bpy.context.view_layer.objects.active = meshes[0]
for o in meshes:
    mw = o.matrix_world.copy()
    o.parent = None
    o.matrix_world = mw
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != "MESH":
        bpy.data.objects.remove(o)
bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
faces = len(ob.data.polygons)
if faces > max_faces:
    m = ob.modifiers.new("d", "DECIMATE"); m.ratio = max_faces / faces
    bpy.ops.object.modifier_apply(modifier=m.name)
cs = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
mn = Vector((min(c.x for c in cs), min(c.y for c in cs), min(c.z for c in cs)))
mx = Vector((max(c.x for c in cs), max(c.y for c in cs), max(c.z for c in cs)))
dim = mx - mn
ref = {"x": dim.x, "y": dim.y, "z": dim.z, "h": dim.z, "max": max(dim)}[axis]
k = size / ref
ob.data.transform(Matrix.Translation(Vector((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z))))
ob.data.transform(Matrix.Scale(k, 4))
used = set()
for mat in bpy.data.materials:
    if not mat.use_nodes:
        continue
    nt = mat.node_tree
    for n in nt.nodes:
        if n.type != "BSDF_PRINCIPLED":
            continue
        n.inputs["Metallic"].default_value = 0.0
        n.inputs["Roughness"].default_value = 0.85
        for name in ("Normal", "Roughness", "Metallic"):
            for l in list(n.inputs[name].links):
                nt.links.remove(l)
        if os.environ.get("NOEMIT"):
            for name in ("Emission Color", "Emission"):
                if name in n.inputs:
                    for l in list(n.inputs[name].links):
                        nt.links.remove(l)
        for name in ("Base Color", "Emission Color"):
            if name in n.inputs:
                for l in n.inputs[name].links:
                    if l.from_node.type == "TEX_IMAGE" and l.from_node.image:
                        used.add((l.from_node.image, name))
for img, name in used:
    s = min(img.size[0], tex_px)
    img.scale(s, max(1, int(img.size[1] * s / img.size[0])))
    if name == "Base Color" and gain != 1.0:
        px = list(img.pixels)
        for i in range(0, len(px), 4):
            px[i] = min(1.0, px[i] * gain); px[i + 1] = min(1.0, px[i + 1] * gain); px[i + 2] = min(1.0, px[i + 2] * gain)
        img.pixels = px
for img in bpy.data.images:
    if img.size[0] > tex_px:
        img.scale(tex_px, max(1, int(img.size[1] * tex_px / img.size[0])))
while len(ob.data.uv_layers) > 1:
    ob.data.uv_layers.remove(ob.data.uv_layers[len(ob.data.uv_layers) - 1])
bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", export_image_format="JPEG", export_jpeg_quality=65, export_yup=True,
                          export_apply=True, export_animations=False)
print("OUT faces", len(ob.data.polygons), "dim", [round(v * k, 2) for v in dim])

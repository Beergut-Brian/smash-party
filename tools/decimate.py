"""Shrink an AI-generated (or any) model into a game-ready .glb for Smash Party.

Run headless with Blender 3.6+ / 4.x:
  blender -b -P tools/decimate.py -- IN.glb OUT.glb [--tris 20000] [--length 4.5] [--wheels]

What it does
  1. Imports IN (.glb/.gltf/.obj/.fbx).
  2. Decimates every mesh proportionally so the whole model is under --tris triangles.
  3. Scales it so the longest horizontal side is --length units (cars ~4.5, props: pass their size).
  4. Centers it on X/Z and sets the bottom at y=0 (wheels rest on the ground).
  5. Exports OUT as .glb with textures embedded (PNG, max 1024px).
Forward should be +Z in-game. If a model comes out facing the wrong way, fix it with
"rotateY" in assets/cars/cars.json rather than re-exporting.
--wheels renames meshes whose name contains "wheel"/"tire"/"tyre" to "wheel_N" so they spin in-game.
"""
import sys, bpy, bmesh
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(argv) < 2:
    sys.exit("usage: blender -b -P tools/decimate.py -- IN OUT [--tris N] [--length L] [--wheels]")
src, dst = argv[0], argv[1]
def opt(name, default):
    return type(default)(argv[argv.index(name) + 1]) if name in argv else default
max_tris, length, wheels = opt("--tris", 20000), opt("--length", 4.5), "--wheels" in argv

bpy.ops.wm.read_factory_settings(use_empty=True)
ext = src.lower().rsplit(".", 1)[-1]
if ext in ("glb", "gltf"): bpy.ops.import_scene.gltf(filepath=src)
elif ext == "obj": bpy.ops.wm.obj_import(filepath=src)
elif ext == "fbx": bpy.ops.import_scene.fbx(filepath=src)
else: sys.exit("unsupported input: " + ext)

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
def tri_count(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)
total = sum(tri_count(o) for o in meshes)
print(f"[decimate] {len(meshes)} meshes, {total} tris -> target {max_tris}")

if total > max_tris:
    ratio = max_tris / total
    for o in meshes:
        m = o.modifiers.new("dec", "DECIMATE"); m.ratio = ratio; m.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=m.name)
print(f"[decimate] now {sum(tri_count(o) for o in meshes)} tris")

if wheels:
    n = 0
    for o in meshes:
        if any(k in o.name.lower() for k in ("wheel", "tire", "tyre")):
            o.name = f"wheel_{n}"; n += 1

# bounds in world space (Blender is Z-up; glTF export converts to Y-up)
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
size = mx - mn
scale = length / max(size.x, size.y, 1e-6)
root = bpy.data.objects.new("root", None); bpy.context.scene.collection.objects.link(root)
for o in bpy.context.scene.objects:
    if o is not root and o.parent is None:
        o.parent = root
root.location = Vector((-(mn.x + mx.x) / 2 * scale, -(mn.y + mx.y) / 2 * scale, -mn.z * scale))
root.scale = (scale, scale, scale)

# downscale big textures
for img in bpy.data.images:
    if img.size[0] > 1024 or img.size[1] > 1024:
        f = 1024 / max(img.size); img.scale(int(img.size[0] * f), int(img.size[1] * f))

bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", export_image_format="AUTO", export_apply=True)
print(f"[decimate] wrote {dst}  (scale {scale:.3f}, length {length})")

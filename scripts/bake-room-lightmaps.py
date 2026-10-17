"""Bake day/night diffuse lightmaps for the optimized room.

Run headless:
  blender -b assets/blender/portfolio-room-optimized.blend --python scripts/bake-room-lightmaps.py -- [state ...]

Bakes every mesh tagged with the `lightmap_atlas` custom property ('shell' or 'props') into
assets/blender/lightmaps/LM_<atlas>_<state>.exr using the `Lightmap` UV layer.
Day = frame 1 (blind open, daylight on), night = frame 23 (blind closed, lamp on).
"""
import os
import sys
import time

import bpy

STATES = {"day": 1, "night": 23}
SIZES = {"shell": 2048, "props": 2048}
SAMPLES = 96

args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else list(STATES)
resume = "--resume" in args
args = [arg for arg in args if arg != "--resume"] or list(STATES)
assert all(state in STATES for state in args), args
out_dir = os.path.join(os.path.dirname(bpy.data.filepath), "lightmaps")
os.makedirs(out_dir, exist_ok=True)

scene = bpy.data.scenes["PortfolioRoom"]
cache = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".cache", "optix"))
os.makedirs(cache, exist_ok=True)
os.environ.setdefault("OPTIX_CACHE_PATH", cache)
scene.render.engine = "CYCLES"
scene.cycles.samples = SAMPLES
scene.cycles.device = "CPU"
preferences = bpy.context.preferences.addons["cycles"].preferences
available = preferences.get_device_types(bpy.context)
backend = next((item[0] for keyword in ("optix", "cuda") for item in available if keyword in item[0].lower()), None)
if backend:
    preferences.compute_device_type = backend
    devices = preferences.get_devices_for_type(backend)
    accelerated = [device for device in devices if device.type == backend]
    if accelerated:
        for device in devices:
            device.use = device in accelerated
        choices = scene.cycles.bl_rna.properties["device"].enum_items
        scene.cycles.device = next(item.identifier for item in choices if item.identifier.lower() == "gpu")
        print(f"[bake] {backend}: {', '.join(device.name for device in accelerated)}", flush=True)
bake = scene.render.bake
bake.use_pass_direct = True
bake.use_pass_indirect = True
bake.use_pass_color = False
bake.margin = 6


def bake_atlas(atlas, state):
    path = os.path.join(out_dir, f"LM_{atlas}_{state}.exr")
    if resume and os.path.isfile(path) and os.path.getmtime(path) >= os.path.getmtime(bpy.data.filepath):
        print(f"[bake] keep completed {atlas} {state}", flush=True)
        return
    objs = [o for o in scene.objects if o.get("lightmap_atlas") == atlas and not o.get("lightmap_decal")]
    size = SIZES[atlas]
    img = bpy.data.images.new(f"LM_{atlas}_{state}", size, size, float_buffer=True)
    added = []
    for mat in {m for o in objs for m in o.data.materials if m}:
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = img
        mat.node_tree.nodes.active = node
        added.append((mat.node_tree, node))
    for o in scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
        o.data.uv_layers.active = o.data.uv_layers["Lightmap"]
    bpy.context.view_layer.objects.active = objs[0]
    started = time.time()
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True)
    for tree, node in added:
        tree.nodes.remove(node)
    img.filepath_raw = path
    img.file_format = "OPEN_EXR"
    img.save()
    print(f"[bake] {atlas} {state} {size}px {time.time() - started:.0f}s -> {path}", flush=True)


# Decals (text, button symbols) read the base surface's texels; they must not shadow them.
decals = [o for o in scene.objects if o.get("lightmap_decal")]
for o in decals:
    o.hide_render = True
for state in args:
    scene.frame_set(STATES[state])
    for atlas in ("shell", "props"):
        bake_atlas(atlas, state)
print("[bake] done", flush=True)

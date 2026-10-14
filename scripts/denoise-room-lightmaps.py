"""Denoise baked lightmap EXRs in place with Blender's OpenImageDenoise compositor node.

Run: blender -b --python scripts/denoise-room-lightmaps.py
Writes lightmaps/<name>_dn.exr next to each baked map.
"""
import os

import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, "assets", "blender", "lightmaps")
scene = bpy.context.scene
scene.render.use_compositing = True
scene.render.image_settings.file_format = "OPEN_EXR"
scene.render.image_settings.color_depth = "32"

tree = bpy.data.node_groups.new("LM_Denoise", "CompositorNodeTree")
try:
    scene.compositing_node_group = tree
except AttributeError:
    scene.use_nodes = True
    tree = scene.node_tree
    tree.nodes.clear()
img_node = tree.nodes.new("CompositorNodeImage")
den = tree.nodes.new("CompositorNodeDenoise")
for name, val in (("prefilter", "ACCURATE"), ("use_hdr", True), ("quality", "HIGH")):
    if hasattr(den, name):
        setattr(den, name, val)
out = None
try:
    out = tree.nodes.new("NodeGroupOutput")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    tree.links.new(den.outputs[0], out.inputs[0])
except Exception:
    out = tree.nodes.new("CompositorNodeComposite")
    tree.links.new(den.outputs[0], out.inputs[0])
tree.links.new(img_node.outputs[0], den.inputs[0])

for f in sorted(os.listdir(src)):
    if not f.endswith(".exr") or f.endswith("_dn.exr"):
        continue
    img = bpy.data.images.load(os.path.join(src, f))
    img_node.image = img
    scene.render.resolution_x, scene.render.resolution_y = img.size
    scene.render.resolution_percentage = 100
    scene.render.filepath = os.path.join(src, f[:-4] + "_dn.exr")
    bpy.ops.render.render(write_still=True)
    print(f"[denoise] {f}", flush=True)

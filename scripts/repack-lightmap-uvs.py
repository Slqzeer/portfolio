"""Repack the `Lightmap` UVs of each atlas at one texel density, filling the atlas.

Smart project had left the props atlas 15 % full and wildly uneven (window 173 px/m, coffee
table 37, bookshelf 27), and the rug sat in the shell atlas at 20 px/m. The rug moves to props;
every atlas gets average_islands_scale (same density everywhere) and a concave pack.
Run on the optimized blend, then decal-lightmap-uvs.py, then re-bake:
  blender -b assets/blender/portfolio-room-optimized.blend --python scripts/repack-lightmap-uvs.py
"""
import math

import bpy

SIZES = {"shell": 2048, "props": 4096}
MARGIN_PX = 4  # bilinear filtering needs 2 px; the bake margin fills the rest

scene = bpy.data.scenes["PortfolioRoom"]
bpy.data.objects["Rug"]["lightmap_atlas"] = "props"


def density(o, size):
    uv = o.data.uv_layers["Lightmap"].data
    a3 = a2 = 0.0
    for p in o.data.polygons:
        vs = [o.matrix_world @ o.data.vertices[i].co for i in p.vertices]
        pts = [uv[i].uv * size for i in p.loop_indices]
        for i in range(1, len(vs) - 1):
            a3 += (vs[i] - vs[0]).cross(vs[i + 1] - vs[0]).length / 2
            a2 += abs((pts[i] - pts[0]).cross(pts[i + 1] - pts[0])) / 2
    return a2, a3


for atlas, size in SIZES.items():
    objs = [o for o in scene.objects if o.type == "MESH" and o.get("lightmap_atlas") == atlas]
    for o in scene.objects:
        o.select_set(o in objs)
    bpy.context.view_layer.objects.active = objs[0]
    for o in objs:
        o.data.uv_layers.active = o.data.uv_layers["Lightmap"]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(
        shape_method="CONCAVE", rotate=True, margin_method="FRACTION", margin=MARGIN_PX / size
    )
    bpy.ops.object.mode_set(mode="OBJECT")
    a2 = a3 = 0.0
    for o in objs:
        d2, d3 = density(o, size)
        a2, a3 = a2 + d2, a3 + d3
        o.data.uv_layers.active = o.data.uv_layers[0]
        o.data.uv_layers[0].active_render = True
    print(f"[repack] {atlas}: {len(objs)} meshes, {a2 / size / size:.0%} full, "
          f"{math.sqrt(a2 / a3):.0f} px/m", flush=True)
bpy.ops.wm.save_mainfile()

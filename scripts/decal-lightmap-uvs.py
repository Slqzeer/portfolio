"""Give thin decals (text, button symbols) the lightmap of the surface they sit on.

Smart-project packs each letter as its own sub-texel island in the 4096² props atlas, so the
runtime sampled the black padding around it (black letters on the diploma, invisible controller
symbols). Each decal face now takes the `Lightmap` UV of the nearest point on its base surface,
which is the light it really receives. Decals are tagged `lightmap_decal` so the bake hides them
(otherwise each letter would read its own contact shadow on the paper); re-bake after a first run.
Run on the optimized blend after any `Lightmap` UV regeneration:
  blender -b assets/blender/portfolio-room-optimized.blend --python scripts/decal-lightmap-uvs.py
"""
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

# decal -> (base surface, lift in metres before looking for the nearest base point)
DECALS = {
    "Diploma_Assembly__MAT_Diploma_Ink_White": ("Diploma_Print", 0.0),
    "Diploma_Assembly__MAT_Diploma_Ink_Soft": ("Diploma_Print", 0.0),
    "ContactCard_Assembly__MAT_ContactCard_Ink": ("ContactCard_Poster", 0.0),
    "ContactCard_Assembly__MAT_ContactCard_InkGrey": ("ContactCard_Poster", 0.0),
    # the button caps sit in holes; the shell beside them is shaded by the caps, so take
    # the lit top surface of the controller just above each cap
    "Controller_FaceButtons": ("Controller_Assembly__MAT_Pad_Plastic", 0.02),
}

for decal_name, (base_name, lift) in DECALS.items():
    decal, base = bpy.data.objects[decal_name], bpy.data.objects[base_name]
    # bake-room-lightmaps.py hides decals, so they don't shadow the base texels they read
    decal["lightmap_decal"] = base_name
    base.data.calc_loop_triangles()
    tris = base.data.loop_triangles
    world = [base.matrix_world @ v.co for v in base.data.vertices]
    bvh = BVHTree.FromPolygons(world, [t.vertices for t in tris])
    base_uv = base.data.uv_layers["Lightmap"].data
    uv = decal.data.uv_layers["Lightmap"].data
    worst = 0.0
    for poly in decal.data.polygons:
        # one UV per face: a letter is far smaller than a texel, and a face spanning two
        # base islands would otherwise interpolate across the atlas
        centre = decal.matrix_world @ poly.center + Vector((0, 0, lift))
        hit, _, index, dist = bvh.find_nearest(centre)
        worst = max(worst, dist)
        tri = tris[index]
        corners = [world[i] for i in tri.vertices]
        uvs = [base_uv[i].uv.to_3d() for i in tri.loops]
        target = barycentric_transform(hit, *corners, *uvs).to_2d()
        for i in poly.loop_indices:
            uv[i].uv = target
    print(f"[decal] {decal_name} -> {base_name}: {len(decal.data.polygons)} faces, "
          f"max distance {worst * 1000:.1f} mm", flush=True)
bpy.ops.wm.save_mainfile()

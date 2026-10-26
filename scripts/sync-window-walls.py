"""Copy the approved wall outlines, window, blind and garden view from the master into the optimized blend.

Run on the pre-sync optimized blend, then re-bake the lightmaps (the Lightmap UVs are regenerated):
  blender -b assets/blender/refined/portfolio-room-optimized.blend --python scripts/sync-window-walls.py -- <abs master.blend> <abs graded view.png>
The graded view is TEX_WindowView exported from the master. Verify every touched object's world bounds
against the master before baking: appended objects have no evaluated matrix_world until linked.
"""
import sys

import bpy
from bpy_extras import anim_utils
from mathutils import Matrix

master, view_png = sys.argv[sys.argv.index("--") + 1 :]
D = bpy.data
scene = D.scenes["PortfolioRoom"]
scene.frame_set(1)

WALLS = ["Wall_Back_Bottom", "Wall_Back_Left", "Wall_Back_Right", "Wall_Back_Top", "Wall_Right",
         "Wall_Top_Back", "Wall_Top_Right", "Wall_End_Back", "Wall_End_Right"]
WINDOW = ["ASSET_Window_Reveal", "ASSET_Window_Frame", "ASSET_Window_Sash_Left", "ASSET_Window_Sash_Right",
          "ASSET_Window_Sill", "ASSET_Window_Glass_Left", "ASSET_Window_Glass_Right"]
BLIND = [f"Blind_Slat_{i:02d}" for i in range(1, 20)] + [f"Blind_Cord_{i:02d}" for i in range(1, 4)] + ["Blind_Headrail"]

# 1. drop what gets replaced, plus the legacy white window that was still exported to the GLB
drop = ["Room_Walls__MAT_Review_Wall_BlueGrey", "Room_Walls__MAT_Review_Wall_Trim_Dark",
        "Window_Glass", "Window_Frame_Top", "Window_Frame_Bottom", "Window_Frame_Left", "Window_Frame_Right",
        "Window_Frame_Middle", "Window_Sill"] + [o.name for o in D.objects["ASSET_Window_Candidate"].children]
for n in drop:
    if n in D.objects:
        D.objects.remove(D.objects[n])

# 2. append the master objects under temporary names
existing_mats = {m.name for m in D.materials}
before = {o.name for o in D.objects}
with D.libraries.load(master, link=False) as (src, dst):
    dst.objects = WALLS + WINDOW + BLIND
src = {n: o for n, o in zip(WALLS + WINDOW + BLIND, dst.objects)}
for o in list(src.values()):
    o.name = "SRC_" + o.name
# reuse this file's materials instead of the appended .001 copies
for m in list(D.materials):
    base = m.name.rsplit(".", 1)[0]
    if m.name not in existing_mats and base != m.name and base in existing_mats:
        m.user_remap(D.materials[base])
        D.materials.remove(m)


def place(o, parent, coll):
    scene.collection.objects.link(o) if not o.users_collection else None
    for c in o.users_collection:
        c.objects.unlink(o)
    D.collections[coll].objects.link(o)
    # appended objects have no evaluated matrix_world yet; rebuild it from the parent chain
    o.parent = parent
    o.matrix_world = parent.matrix_world @ o.matrix_parent_inverse @ o.matrix_basis
    bpy.context.view_layer.update()


def apply_mods(o):
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def join(objs, name):
    for o in scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = objs[0].data.name = name
    return objs[0]


# appended objects' world matrices are relative to their master parents; parents share names and transforms
for n, o in src.items():
    master_parent = D.objects.get(n in WALLS and "Room_Walls" or n in WINDOW and "ASSET_Window_Candidate" or "CTL_Curtains")
    o.parent = master_parent
# parents pulled in by the append are no longer needed
for o in [o for o in D.objects if o.name not in before and o not in src.values()]:
    D.objects.remove(o)

# 3. walls: apply bevels, join by material, bake into the shell atlas
walls_parent = D.objects["Room_Walls"]
for n in WALLS:
    place(src[n], walls_parent, "RoomShell")
    apply_mods(src[n])
groups = {}
for n in WALLS:
    groups.setdefault(src[n].data.materials[0].name, []).append(src[n])
for mat, objs in groups.items():
    o = join(objs, f"Room_Walls__{mat}")
    o["lightmap_atlas"] = "shell"

# 4. window: separate parts, frame/sill/reveal baked into props, glass unbaked
win_parent = D.objects["ASSET_Window_Candidate"]
for n in WINDOW:
    o = src[n]
    place(o, win_parent, "Review_Window")
    o.matrix_world = Matrix.Identity(4)  # master window parts carry world-space vertices
    bpy.context.view_layer.update()
    apply_mods(o)
    o.name = o.data.name = n
    if "Glass" not in n:
        o["lightmap_atlas"] = "props"

# 5. blind: take the master meshes, rest locations and keyframes onto the existing animated objects
for n in BLIND:
    s, t = src[n], D.objects[n]
    old = t.data
    t.data = s.data
    t.location = s.location
    if s.animation_data and t.animation_data:
        sb = anim_utils.action_get_channelbag_for_slot(s.animation_data.action, s.animation_data.action_slot)
        tb = anim_utils.action_get_channelbag_for_slot(t.animation_data.action, t.animation_data.action_slot)
        for sf in sb.fcurves:
            tf = tb.fcurves.find(sf.data_path, index=sf.array_index)
            for sk, tk in zip(sf.keyframe_points, tf.keyframe_points):
                tk.co, tk.handle_left, tk.handle_right = sk.co, sk.handle_left, sk.handle_right
            tf.update()
    D.objects.remove(s)
    if old.users == 0:
        D.meshes.remove(old)
for a in [a for a in D.actions if a.users == 0]:
    D.actions.remove(a)

# 6. garden view: graded texture and lower glow
img = D.images["TEX_WindowView"]
img.filepath_raw = view_png
img.source = "FILE"
img.reload()
img.pack()
img.filepath_raw = ""
nt = D.materials["MAT_WindowView"].node_tree
for f in anim_utils.action_get_channelbag_for_slot(nt.animation_data.action, nt.animation_data.action_slot).fcurves:
    for k in f.keyframe_points:
        if k.co.y > 1:
            k.co.y = k.handle_left.y = k.handle_right.y = 2.0
    f.update()

# 7. regenerate the Lightmap UVs per atlas so the new and old meshes share one non-overlapping layout
for atlas in ("shell", "props"):
    objs = [o for o in scene.objects if o.get("lightmap_atlas") == atlas]
    for o in scene.objects:
        o.select_set(False)
    for o in objs:
        if "Lightmap" not in o.data.uv_layers:
            o.data.uv_layers.new(name="Lightmap")
        o.data.uv_layers.active = o.data.uv_layers["Lightmap"]
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=0.004)
    bpy.ops.object.mode_set(mode="OBJECT")
    for o in objs:
        o.data.uv_layers.active = o.data.uv_layers[0]
        o.data.uv_layers[0].active_render = True
    print(f"[sync] {atlas}: {len(objs)} meshes", flush=True)

bpy.ops.wm.save_mainfile()
print("[sync] saved", [o.name for o in win_parent.children], flush=True)

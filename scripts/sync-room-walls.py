"""Copy the single-piece back wall, the right wall, the reseated baseboards and the sun blocker
from the master into the optimized blend, then regenerate the shell Lightmap UVs.

Run on the optimized blend, then re-bake the lightmaps:
  blender -b assets/blender/refined/portfolio-room-optimized.blend --python scripts/sync-room-walls.py -- <abs master.blend>
"""
import sys

import bpy
from mathutils import Vector

master = sys.argv[sys.argv.index("--") + 1]
D = bpy.data
scene = D.scenes["PortfolioRoom"]
WALLS = ["Wall_Back", "Wall_Right", "Baseboard_Back", "Baseboard_Right"]

for n in ["Room_Walls__MAT_Review_Wall_BlueGrey", "Room_Walls__MAT_Review_Baseboard"]:
    D.objects.remove(D.objects[n])

existing_mats = {m.name for m in D.materials}
before = {o.name for o in D.objects}
with D.libraries.load(master, link=False) as (src, dst):
    dst.objects = WALLS + ["SHADOW_Side_Left"]
src = dict(zip(WALLS + ["SHADOW_Side_Left"], dst.objects))
for m in list(D.materials):
    base = m.name.rsplit(".", 1)[0]
    if m.name not in existing_mats and base != m.name and base in existing_mats:
        m.user_remap(D.materials[base])
        D.materials.remove(m)

# sun blocker: take the master mesh; the object keeps its light linking here
blocker = D.objects["SHADOW_Side_Left"]
blocker.data = src.pop("SHADOW_Side_Left").data
D.objects.remove(D.objects["SHADOW_Side_Left.001"])

# appended objects have no evaluated matrix_world; rebuild it from the parent chain (same transforms here)
parent = D.objects["Room_Walls"]
for o in [o for o in D.objects if o.name not in before and o not in src.values()]:
    D.objects.remove(o)
for o in src.values():
    for c in o.users_collection:
        c.objects.unlink(o)
    D.collections["RoomShell"].objects.link(o)
    world = parent.matrix_world @ o.matrix_parent_inverse @ o.matrix_basis
    o.parent = parent
    o.matrix_world = world
bpy.context.view_layer.update()


def select(objs):
    for o in scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


groups = {}
for o in src.values():
    select([o])
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    groups.setdefault(o.data.materials[0].name, []).append(o)
for mat, objs in groups.items():
    select(objs)
    bpy.ops.object.join()
    o = objs[0]
    o.name = o.data.name = f"Room_Walls__{mat}"
    o["lightmap_atlas"] = "shell"
    bb = [o.matrix_world @ Vector(v) for v in o.bound_box]
    print("[sync]", o.name, [round(min(p[i] for p in bb), 3) for i in range(3)],
          [round(max(p[i] for p in bb), 3) for i in range(3)], flush=True)

objs = [o for o in scene.objects if o.get("lightmap_atlas") == "shell"]
for o in objs:
    if "Lightmap" not in o.data.uv_layers:
        o.data.uv_layers.new(name="Lightmap")
    o.data.uv_layers.active = o.data.uv_layers["Lightmap"]
select(objs)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, scale_to_bounds=False)
bpy.ops.uv.pack_islands(margin=0.004)
bpy.ops.object.mode_set(mode="OBJECT")
for o in objs:
    o.data.uv_layers.active = o.data.uv_layers[0]
    o.data.uv_layers[0].active_render = True
print(f"[sync] shell: {len(objs)} meshes", flush=True)
bpy.ops.wm.save_mainfile()

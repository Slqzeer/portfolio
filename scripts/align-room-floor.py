"""Make the floor, its dark slab and the baseboards end flush with the walls' outer footprint.

The planks stopped 11 cm short of the walls' outer faces, the slab overhung everything by 4 cm,
and the baseboards stopped 2 cm short of the wall end caps. Run on the master and the optimized
blend (same object names, except the optimized blend joins the baseboards), then re-bake:
  blender -b assets/blender/refined/portfolio-room.blend --python scripts/align-room-floor.py
  blender -b assets/blender/refined/portfolio-room-optimized.blend --python scripts/align-room-floor.py
"""
import bpy
from mathutils import Vector

# Outer footprint of the walls: Wall_End_Back / Wall_End_Right caps and the walls' outer faces.
X0, Y0, X1, Y1 = -6.02, -4.62, 3.71, 5.11
TARGETS = {
    "Floor": {"x0": X0, "y0": Y0, "x1": X1, "y1": Y1},
    "Floor_Base": {"x0": X0, "y0": Y0, "x1": X1, "y1": Y1},
    "Baseboard_Back": {"x0": X0},
    "Baseboard_Right": {"y0": Y0},
    "Room_Walls__MAT_Review_Baseboard": {"x0": X0, "y0": Y0},
}
EDGE = 0.05  # vertices this close to a side move with it (keeps bevels intact)


def world_bounds(o):
    pts = [o.matrix_world @ v.co for v in o.data.vertices]
    return [min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]


for name, sides in TARGETS.items():
    o = bpy.data.objects.get(name)
    if o is None:
        continue
    lo, hi = world_bounds(o)
    inv = o.matrix_world.inverted()
    for v in o.data.vertices:
        p = o.matrix_world @ v.co
        for side, target in sides.items():
            axis = "xy".index(side[0])
            edge = lo[axis] if side[1] == "0" else hi[axis]
            if abs(p[axis] - edge) <= EDGE:
                p[axis] += target - edge
        v.co = inv @ p
    o.data.update()
    lo2, hi2 = world_bounds(o)
    print(f"[align] {name} {[round(c, 3) for c in lo]}..{[round(c, 3) for c in hi]} -> "
          f"{[round(c, 3) for c in lo2]}..{[round(c, 3) for c in hi2]}", flush=True)
bpy.ops.wm.save_mainfile()

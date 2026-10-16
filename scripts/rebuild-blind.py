"""Rebuild the venetian blind slats and cords so the night state is fully closed.

Runs in the open file (master or optimized); it does not save:
  blender -b assets/blender/<file>.blend --python scripts/rebuild-blind.py --python-expr "import bpy; bpy.ops.wm.save_mainfile()"
Blind_Slat_01 is the template (shared mesh, parent CTL_Curtains). Each slat and cord gets its own
`Curtain_Blind_*` action, which the runtime `Curtain_` clip filter scrubs with the transition.
Day: slats flat, stacked under the headrail. Night: dropped to the sill by frame 17, then tilted
closed by frame 22.6 so neighbouring slats overlap without intersecting.
"""
import math

import bpy

COUNT = 37
TOP_Z = 4.55  # Blind_Slat_01 centre; clears the headrail (bottom 4.60) when tilted closed
DAY_PITCH = 0.025
NIGHT_PITCH = 0.0715  # lowest slat clears the sill when closed
CLOSED_TILT = math.radians(-80)  # 8 cm slat covers 8.0 cm > pitch; slats stay 12 mm apart
SLAT_THICKNESS = 0.008
DROP_AT_14 = 0.775  # share of the drop done when the tilt starts (unchanged timing)
CORD_TOP_Z = 4.7
FRAMES = (1, 14, 17, 22.6)

D = bpy.data
template = D.objects["Blind_Slat_01"]

# thinner slats: scale the shared mesh about its centre
mesh = template.data
zs = [v.co.z for v in mesh.vertices]
centre, half = (max(zs) + min(zs)) / 2, (max(zs) - min(zs)) / 2
for v in mesh.vertices:
    v.co.z = centre + (v.co.z - centre) * (SLAT_THICKNESS / 2) / half

for obj in [o for o in D.objects if o.name.startswith("Blind_Slat_") and o is not template]:
    D.objects.remove(obj)
for action in [a for a in D.actions if a.name.startswith("Curtain_Blind_")]:
    D.actions.remove(action)


def lowest(pitch):
    return TOP_Z - (COUNT - 1) * pitch


for i in range(COUNT):
    obj = template if i == 0 else template.copy()
    if i:
        obj.name = f"Blind_Slat_{i + 1:02d}"
        for collection in template.users_collection:
            collection.objects.link(obj)
    obj.animation_data_clear()
    day, night = TOP_Z - i * DAY_PITCH, TOP_Z - i * NIGHT_PITCH
    mid = day + DROP_AT_14 * (night - day)
    name = f"Curtain_Blind_{obj.name}"
    x, y = obj.location.x, obj.location.y
    for frame, z in zip(FRAMES, (day, mid, night, night)):
        obj.location = (x, y, z)
        obj.keyframe_insert("location", frame=frame)
    for frame, tilt in zip((1, 14, 22.6), (0, 0, CLOSED_TILT)):
        obj.rotation_euler = (tilt, 0, 0)
        obj.keyframe_insert("rotation_euler", frame=frame)
    obj.animation_data.action.name = name

for n in range(1, 4):
    cord = D.objects[f"Blind_Cord_{n:02d}"]
    cord.animation_data_clear()
    for frame, length in zip((1, 17, 22.6), (CORD_TOP_Z - lowest(DAY_PITCH),) + (CORD_TOP_Z - lowest(NIGHT_PITCH),) * 2):
        cord.scale = (1, 1, length)
        cord.keyframe_insert("scale", frame=frame)
    cord.animation_data.action.name = f"Curtain_Blind_{cord.name}"

bpy.context.scene.frame_set(1)
print(f"[blind] {COUNT} slats, day bottom {lowest(DAY_PITCH):.3f}, night bottom {lowest(NIGHT_PITCH):.3f}", flush=True)

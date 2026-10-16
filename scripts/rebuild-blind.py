"""Rebuild the venetian blind slats and cords so the night state is fully closed.

Runs in the open file (master or optimized); it does not save:
  blender -b assets/blender/<file>.blend --python scripts/rebuild-blind.py --python-expr "import bpy; bpy.ops.wm.save_mainfile()"
Blind_Slat_01 is the template (shared mesh, parent CTL_Curtains). Each slat and cord gets its own
`Curtain_Blind_*` action, which the runtime `Curtain_` clip filter scrubs with the transition.
Day: slats flat, stacked under the headrail. Night: the stack eases down to the sill by frame 17,
slats peeling off its top as their ladder spacing runs out, and the cords end on the bottom slat
every frame. All slats tilt together from frame 6 to 22.6, so they are closed without intersecting.
Keys are baked on every frame (linear) so the GLB plays exactly what is computed here.
"""
import math

import bpy

COUNT = 37
TOP_Z = 4.55  # Blind_Slat_01 centre; clears the headrail (bottom 4.60) when tilted closed
DAY_PITCH = 0.025
NIGHT_PITCH = 0.0715  # lowest slat clears the sill when closed
CLOSED_TILT = math.radians(-80)  # 8 cm slat covers 8.0 cm > pitch; slats stay 12 mm apart
SLAT_THICKNESS = 0.008
CORD_TOP_Z = 4.7
FRAMES = [*range(1, 23), 22.6]
DROP = (1, 17)
TILT = (6, 22.6)

D = bpy.data
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
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


def ease(frame, span):
    t = min(max((frame - span[0]) / (span[1] - span[0]), 0), 1)
    return t * t * (3 - 2 * t)


def bottom_z(frame):
    return lowest(DAY_PITCH) + (lowest(NIGHT_PITCH) - lowest(DAY_PITCH)) * ease(frame, DROP)


def slat_z(i, frame):
    # rides the falling stack until its ladder rung catches it at the night pitch
    return max(TOP_Z - i * NIGHT_PITCH, bottom_z(frame) + (COUNT - 1 - i) * DAY_PITCH)


def tilt(frame):
    return CLOSED_TILT * ease(frame, TILT)


# parallel slats stay clear while their perpendicular gap exceeds the thickness
for step in range(int(FRAMES[-1] * 10) + 1):
    f = 1 + step / 10
    gap = min(slat_z(i, f) - slat_z(i + 1, f) for i in range(COUNT - 1)) * math.cos(tilt(f))
    assert gap > SLAT_THICKNESS + 0.002, (f, gap)


def bake(obj, path, values):
    for frame, value in zip(FRAMES, values):
        setattr(obj, path, value)
        obj.keyframe_insert(path, frame=frame)


for i in range(COUNT):
    obj = template if i == 0 else template.copy()
    if i:
        obj.name = f"Blind_Slat_{i + 1:02d}"
        for collection in template.users_collection:
            collection.objects.link(obj)
    obj.animation_data_clear()
    x, y = obj.location.x, obj.location.y
    bake(obj, "location", [(x, y, slat_z(i, f)) for f in FRAMES])
    bake(obj, "rotation_euler", [(tilt(f), 0, 0) for f in FRAMES])
    obj.animation_data.action.name = f"Curtain_Blind_{obj.name}"

for n in range(1, 4):
    cord = D.objects[f"Blind_Cord_{n:02d}"]
    cord.animation_data_clear()
    bake(cord, "scale", [(1, 1, CORD_TOP_Z - bottom_z(f)) for f in FRAMES])
    cord.animation_data.action.name = f"Curtain_Blind_{cord.name}"

bpy.context.scene.frame_set(1)
print(f"[blind] {COUNT} slats, day bottom {lowest(DAY_PITCH):.3f}, night bottom {lowest(NIGHT_PITCH):.3f}", flush=True)

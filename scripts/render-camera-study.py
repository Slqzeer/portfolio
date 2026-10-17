"""Render four camera-study stills headlessly; never save the Blender scene."""
import json
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector

root = Path(__file__).resolve().parents[1]
review = root / "assets/reviews"
snapshot = json.loads((review / "camera-scene-snapshot.json").read_text(encoding="utf-8"))
report = json.loads((review / "camera-path-review.json").read_text(encoding="utf-8"))
anchors = {a["name"]: a for a in snapshot["anchors"]}
route = next(r for r in report["routes"] if r["target"] == "CAM_Anchor_Monitor")
nodes = [anchors[name] for name in route["anchors"]]
weights = [max(0.5, (Vector(b["position"]) - Vector(a["position"])).length) for a, b in zip(nodes, nodes[1:])]
minimum = report["travel"]["minimumLegSeconds"]
total = report["travel"]["focusSeconds"]
durations = [minimum + (total - minimum * len(weights)) * w / sum(weights) for w in weights]
assert abs(sum(durations) - total) < 1e-6

scene = bpy.context.scene
assert scene.render.engine == "CYCLES"
camera = scene.camera.copy()
camera.data = scene.camera.data.copy()
camera.name = "CAM_Review_Monitor"
scene.collection.objects.link(camera)
scene.camera = camera
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
formats = scene.render.image_settings.bl_rna.properties["file_format"].enum_items
scene.render.image_settings.file_format = next(item.identifier for item in formats if item.identifier.lower() == "png")
scene.cycles.samples = 12
scene.frame_set(1)
for label, fraction in [("overview", 0), ("approach", 0.5), ("desk-clearance", 0.8), ("monitor", 1)]:
    elapsed = fraction * total
    index = 0
    while index < len(durations) - 1 and elapsed > durations[index]:
        elapsed -= durations[index]
        index += 1
    a, b = nodes[index:index + 2]
    t = min(1, max(0, elapsed / durations[index]))
    t = t * t * t * (t * (t * 6 - 15) + 10)
    camera.location = Vector(a["position"]).lerp(Vector(b["position"]), t)
    camera.rotation_mode = "QUATERNION"
    camera.rotation_quaternion = Quaternion(a["quaternion_wxyz"]).slerp(Quaternion(b["quaternion_wxyz"]), t)
    camera.data.ortho_scale = a["ortho_scale"] + (b["ortho_scale"] - a["ortho_scale"]) * t
    scene.render.filepath = str(review / f"camera-study-{label}.png")
    bpy.ops.render.render(write_still=True)
    print(f"[camera-study] {label}: {scene.render.filepath}", flush=True)

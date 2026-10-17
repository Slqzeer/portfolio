"""Read-only camera/geometry snapshot for scripts/review-camera-paths.mjs.

Run with Blender's master scene and --python scripts/snapshot-room-cameras.py.
Writes review data only; never saves or changes the Blender file.
"""
import json
from pathlib import Path

import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
assert Path(bpy.data.filepath).resolve() == root / "assets/blender/portfolio-room.blend"
meshes = []
anchors = []
for obj in bpy.context.scene.objects:
    if obj.name == "CAM_Overview" or obj.name.startswith("CAM_Anchor_"):
        anchors.append({
            "name": obj.name,
            "position": list(obj.matrix_world.translation),
            "quaternion_wxyz": list(obj.matrix_world.to_quaternion()),
            "ortho_scale": obj.get("ortho_scale", getattr(obj.data, "ortho_scale", None)),
        })
    if obj.type != "MESH" or obj.hide_render or obj.name.startswith("SHADOW_"):
        continue
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    meshes.append({
        "name": obj.name,
        "min": [min(p[axis] for p in points) for axis in range(3)],
        "max": [max(p[axis] for p in points) for axis in range(3)],
    })
output = root / "assets/reviews/camera-scene-snapshot.json"
output.write_text(json.dumps({
    "source": "assets/blender/portfolio-room.blend",
    "coordinates": "Blender world, Z up",
    "anchors": anchors,
    "mesh_bounds": meshes,
}, indent=2) + "\n", encoding="utf-8")
print(f"Camera snapshot: {len(anchors)} anchors, {len(meshes)} mesh bounds -> {output}")

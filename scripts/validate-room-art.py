"""Check personalized text content and its fit in the actual framed surfaces."""
import json
import bpy
from mathutils import Vector

scene = bpy.context.scene
scene.frame_set(1)
bpy.context.view_layer.update()
problems = []
for obj in scene.objects:
    if obj.type != "FONT":
        continue
    assert "Prénom Nom" not in obj.data.body and "prenom.nom@email" not in obj.data.body, obj.name
    paper_name = "ContactCard_Poster" if obj.name.startswith("ContactCard_") else "Diploma_Print" if obj.name.startswith("Diploma_") else None
    if not paper_name:
        continue
    paper = scene.objects[paper_name]
    inverse = paper.matrix_world.inverted()
    paper_corners = [Vector(point) for point in paper.bound_box]
    text_corners = [inverse @ obj.matrix_world @ Vector(point) for point in obj.bound_box]
    spans = [max(point[axis] for point in paper_corners)-min(point[axis] for point in paper_corners) for axis in range(3)]
    axes = sorted(range(3), key=lambda axis:spans[axis] * paper.matrix_world.col[axis].to_3d().length, reverse=True)[:2]
    for axis in axes:
        low, high = min(p[axis] for p in paper_corners), max(p[axis] for p in paper_corners)
        tolerance = .02 / paper.matrix_world.col[axis].to_3d().length
        if min(p[axis] for p in text_corners) < low-tolerance or max(p[axis] for p in text_corners) > high+tolerance:
            problems.append({"text":obj.name,"axis":axis,"bounds":[low,high],"text_bounds":[min(p[axis] for p in text_corners),max(p[axis] for p in text_corners)]})
print(json.dumps({"text_fit_issues":problems},ensure_ascii=False),flush=True)
assert not problems, "Text must fit its frame"

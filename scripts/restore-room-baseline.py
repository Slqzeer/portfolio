"""Restore the original Blender art, keeping personalized text and authored hover clips.

blender -b --threads 4 --python scripts/restore-room-baseline.py
Writes isolated baseline sources; neither the originals nor art-v2 are overwritten.
"""
from pathlib import Path
import hashlib
import json
import bpy
from mathutils import Matrix

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/blender/baseline"
OUT.mkdir(exist_ok=True)
REVIEW = ROOT / "assets/reviews"

# These are reactions, not ambient loops. All return to their original pose.
HOVERS = {
    "volleyball": ("INT_Volleyball", "location", 2, .07),
    "controller": ("INT_Controller", "rotation_euler", 0, .025),
    "bookshelf": ("Shelf_BookStack", "rotation_euler", 2, .012),
    "monitor": ("INT_Monitor", "rotation_euler", 2, .008),
    "smartphone": ("INT_Smartphone", "rotation_euler", 0, .018),
    "education": ("INT_Diploma", "rotation_euler", 1, .004),
    "contact": ("INT_ContactCard", "rotation_euler", 1, .004),
    "server": ("EMIT_Rack_Side_00_ACT1", "scale", 0, .12),
}

# The art-v2 copy is used only for its approved personal text, never its art.
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "assets/blender/art-v2/portfolio-room.blend"))
bpy.context.scene.frame_set(1)
records = []
for obj in bpy.context.scene.objects:
    if obj.type != "FONT":
        continue
    records.append({
        "name": obj.name, "body": obj.data.body, "font": obj.data.font.name,
        "matrix": [list(row) for row in obj.matrix_world],
        "properties": {key: getattr(obj.data, key) for key in (
            "size", "align_x", "align_y", "space_character", "space_word", "extrude", "bevel_depth")},
        "materials": [material.name for material in obj.data.materials],
    })
assert any(record["body"] == "Martin Couturier" for record in records)

report = {"baseline_commit": "bdf94b2", "sources": [], "hover_clips": {}}
for filename in ("portfolio-room.blend", "portfolio-room-optimized.blend"):
    source = ROOT / "assets/blender" / filename
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    scene.frame_set(1)
    anchors = {obj.name: [list(row) for row in obj.matrix_world] for obj in scene.objects
               if obj.name.startswith(("CAM_", "INT_", "CTL_"))}
    # Remove only old lettering; retain the frames, original geometry and UVs.
    for obj in list(scene.objects):
        if obj.name.startswith("IDLE_Monitor_Code_") or obj.name.startswith((
            "Diploma_Assembly__MAT_Diploma_Ink", "ContactCard_Assembly__MAT_ContactCard_Ink")):
            bpy.data.objects.remove(obj, do_unlink=True)
    for record in records:
        old = bpy.data.objects.get(record["name"])
        if old:
            bpy.data.objects.remove(old, do_unlink=True)
        data = bpy.data.curves.new(record["name"], type="FONT")
        data.body = record["body"]
        if bpy.data.fonts.get(record["font"]):
            data.font = bpy.data.fonts[record["font"]]
        for key, value in record["properties"].items():
            setattr(data, key, value)
        for name in record["materials"]:
            data.materials.append(bpy.data.materials[name])
        obj = bpy.data.objects.new(record["name"], data)
        scene.collection.objects.link(obj)
        parent_name = "Monitor_Assembly" if record["name"].startswith("IDLE_") else (
            "ContactCard_Assembly" if record["name"].startswith("Contact") else "Diploma_Assembly")
        obj.parent = bpy.data.objects[parent_name]
        obj.matrix_parent_inverse = obj.parent.matrix_world.inverted()
        obj.matrix_world = Matrix(record["matrix"])

    for id, (name, path, axis, amount) in HOVERS.items():
        obj = bpy.data.objects[name]
        assert not obj.animation_data or not obj.animation_data.action, name
        base = getattr(obj, path)[axis]
        for frame, offset in ((1, 0), (5, amount), (13, 0)):
            getattr(obj, path)[axis] = base + offset
            obj.keyframe_insert(data_path=path, index=axis, frame=frame)
        obj.animation_data.action.name = f"Hover_{id}"
        scene.frame_set(5)
        assert abs(getattr(obj, path)[axis] - (base + amount)) < 1e-5
        scene.frame_set(13)
        assert abs(getattr(obj, path)[axis] - base) < 1e-5
        report["hover_clips"][id] = {"target": name, "property": path, "axis": axis,
                                     "amplitude": amount, "frames": [1, 5, 13]}
    scene.frame_set(1)
    bpy.context.view_layer.update()
    for name, matrix in anchors.items():
        current = bpy.data.objects[name].matrix_world
        assert max(abs(current[row][col] - matrix[row][col]) for row in range(4) for col in range(4)) < 1e-5, name
    assert not any("prenom.nom@" in obj.data.body or obj.data.body == "Prénom Nom"
                   for obj in scene.objects if obj.type == "FONT")
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / filename))
    assert hashlib.sha256(source.read_bytes()).hexdigest() == source_hash
    report["sources"].append({"original": str(source.relative_to(ROOT)), "sha256": source_hash,
                               "output": str((OUT / filename).relative_to(ROOT))})
    print(f"[baseline] {filename}: original art, {len(records)} text objects, {len(HOVERS)} hover clips", flush=True)

(REVIEW / "room-baseline-check.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
# Render the editable master for review before exporting anything to the browser.
bpy.ops.wm.open_mainfile(filepath=str(OUT / "portfolio-room.blend"))
scene = bpy.context.scene
scene.render.resolution_x = 960
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.use_compositing = False
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
for label, frame in (("day", 1), ("night", 23)):
    scene.frame_set(frame)
    scene.render.filepath = str(REVIEW / f"room-baseline-{label}.png")
    bpy.ops.render.render(write_still=True)
    print(f"[baseline] reviewed {label}", flush=True)

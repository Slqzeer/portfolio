"""Render the revised room and architectural junction; no source is saved."""
from pathlib import Path
import sys
import bpy
from mathutils import Vector
root = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
scene.render.resolution_x = 1100
scene.render.resolution_y = 760
scene.render.resolution_percentage = 100
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.use_compositing = False
formats = scene.render.image_settings.bl_rna.properties["file_format"].enum_items
scene.render.image_settings.file_format = next(item.identifier for item in formats if item.identifier.lower() == "png")
scene.render.image_settings.color_mode = "RGBA"
args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['day','night','junction']
for label, frame in [("day", 1), ("night", 23)]:
    if label not in args:
        continue
    scene.frame_set(frame)
    scene.render.filepath = str(root / "assets/reviews" / f"room-art-v2-{label}.png")
    bpy.ops.render.render(write_still=True)
    print(f"[review] {label}", flush=True)

if 'junction' not in args:
    raise SystemExit(0)
scene.frame_set(1)
camera = scene.camera.copy()
camera.data = camera.data.copy()
scene.collection.objects.link(camera)
scene.camera = camera
camera.location = (-.5,-8,2.5)
camera.rotation_euler = (Vector((3.49,-3.8,.25)) - camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale = 2.2
scene.render.resolution_x = scene.render.resolution_y = 760
scene.render.filepath = str(root / 'assets/reviews/room-shell-junction.png')
bpy.ops.render.render(write_still=True)
print('[review] wall / baseboard / floor junction', flush=True)

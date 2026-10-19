"""Render transparent overview posters without saving or changing the Blender source.

blender -b assets/blender/living/portfolio-room.blend --threads 4 --python scripts/render-room-posters.py
"""
from pathlib import Path
import sys
import bpy

root = Path(__file__).resolve().parents[1]
output=Path(sys.argv[sys.argv.index('--')+1]).resolve() if '--' in sys.argv else root/'public/assets/room'
output.mkdir(parents=True,exist_ok=True)
scene = bpy.context.scene
camera = bpy.data.objects["CAM_Overview"].copy()
camera.data = camera.data.copy()
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.ortho_scale = 18.5
scene.render.resolution_x = 800
scene.render.resolution_y = 700
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.use_compositing = False
formats = scene.render.image_settings.bl_rna.properties["file_format"].enum_items
scene.render.image_settings.file_format = next(item.identifier for item in formats if item.identifier.lower() == "png")
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
for name, frame in [("day", 1), ("night", 23)]:
    scene.frame_set(frame)
    scene.render.filepath = str(output / f"room-overview-{name}.png")
    bpy.ops.render.render(write_still=True)
    print(f"[poster] {scene.render.filepath}", flush=True)

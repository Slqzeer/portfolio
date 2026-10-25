"""Render the room's reflection probes (equirectangular HDR, day and night) for the runtime.

Run: blender -b assets/blender/refined/portfolio-room-optimized.blend --python scripts/render-room-env.py
Writes public/assets/room/env/env_day.hdr (frame 1) and env_night.hdr (frame 23). The probe camera
sits above the room centre looking down Blender +X, so the image centre is three.js +X and no
runtime rotation is needed.
"""
import math
import os
import sys

import bpy

STATES = {"day": 1, "night": 23}
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_dir = os.path.join(root, "public", "assets", "room", "env")
if '--' in sys.argv:
    out_dir=os.path.abspath(sys.argv[sys.argv.index('--')+1])
os.makedirs(out_dir, exist_ok=True)

scene = bpy.data.scenes["PortfolioRoom"]
cam_data = bpy.data.cameras.new("ENV_Probe")
cam_data.type = "PANO"
cam_data.panorama_type = "EQUIRECTANGULAR"
cam = bpy.data.objects.new("ENV_Probe", cam_data)
scene.collection.objects.link(cam)
# above the tallest furniture (rack top 4.73 m): a nearby object would fill the probe
cam.location = (-1.15, 0.25, 5.0)
cam.rotation_euler = (math.radians(90), 0, math.radians(-90))

scene.camera = cam
scene.render.engine = "CYCLES"
scene.cycles.samples = 128
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1024, 512
scene.render.resolution_percentage = 100
scene.render.use_compositing = False
scene.render.image_settings.file_format = "HDR"
scene.render.film_transparent = False
for state, frame in STATES.items():
    scene.frame_set(frame)
    scene.render.filepath = os.path.join(out_dir, f"env_{state}.hdr")
    bpy.ops.render.render(write_still=True, scene=scene.name)
    print(f"[env] {state} -> {scene.render.filepath}", flush=True)

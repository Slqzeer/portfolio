"""Render-test Blender's aperture with the room and holdout cards hidden.

This tests the garden materials themselves, including material-preview's camera
matrix path. Run against either refined Blender source; no scene is saved.
"""
from pathlib import Path
import json
import bpy
import numpy as np
from mathutils import Vector

root=Path(__file__).resolve().parents[1]
s=bpy.context.scene;s.frame_set(1)
s.render.engine='CYCLES';s.cycles.samples=4
s.render.resolution_x=96;s.render.resolution_y=96;s.render.resolution_percentage=100
s.render.film_transparent=True;s.render.use_compositing=False
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA'
for obj in s.objects:
 if obj.type=='MESH':obj.hide_render=not obj.get('exterior_surface',False)
cam=bpy.data.objects.new('Aperture_Test',bpy.data.cameras.new('Aperture_Test'))
s.collection.objects.link(cam);s.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=1
checks={}
for name,position,target,visible in [
 ('window',(-2.4,3,3.3),(-2.4,7,3.3),True),
 ('beside-window',(2,3,3.3),(2,7,3.3),False),
 ('outside-room',(-2.4,6,3.3),(-2.4,9,3.3),False),
]:
 cam.location=position;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 path=root/'.cache'/f'garden-aperture-{name}.png';s.render.filepath=str(path)
 bpy.ops.render.render(write_still=True)
 im=bpy.data.images.load(str(path),check_existing=False)
 alpha=np.array(im.pixels[:]).reshape(-1,4)[:,3]
 fraction=float(np.mean(alpha>.1));checks[name]=fraction
 assert fraction>.95 if visible else fraction==0, (name,fraction)
print('[garden visibility] '+json.dumps(checks),flush=True)
report_path=root/'assets/reviews/garden-visibility-check.json'
report_path.parent.mkdir(parents=True,exist_ok=True)
report_path.write_text(json.dumps(checks,indent=2))

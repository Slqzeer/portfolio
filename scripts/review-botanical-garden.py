from pathlib import Path
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'assets/reviews';REVIEW.mkdir(parents=True,exist_ok=True)
s=bpy.context.scene;s.frame_set(1)
s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.use_denoising=True
p=bpy.context.preferences.addons['cycles'].preferences
try:
 p.compute_device_type='OPTIX';devices=p.get_devices_for_type('OPTIX')
 for d in devices:d.use=d.type=='OPTIX'
 if any(d.type=='OPTIX' for d in devices):s.cycles.device='GPU'
except TypeError:pass
s.render.resolution_x=1400;s.render.resolution_y=1000;s.render.resolution_percentage=100
s.render.film_transparent=False;s.render.use_compositing=False
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA'
cam=bpy.data.objects.new('Garden_Review',bpy.data.cameras.new('Garden_Review'))
s.collection.objects.link(cam);s.camera=cam;cam.data.type='ORTHO'
apertures=[]
for mat in bpy.data.materials:
 if mat.get('garden_window_aperture'):
  output=next(n for n in mat.node_tree.nodes if n.type=='OUTPUT_MATERIAL')
  apertures.append((mat,output,output.inputs['Surface'].links[0].from_socket))
for name,position,target,scale in [('botanical-garden-blender',(-6.9,6.0,6.2),(-.8,8.2,.8),10.4),('botanical-garden-window',(-2.1,2.72,3.46),(-1.65,7.2,.16),4.6)]:
 for mat,output,clipped in apertures:
  surface=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED').outputs['BSDF'] if name=='botanical-garden-blender' else clipped
  mat.node_tree.links.new(surface,output.inputs['Surface'])
 for o in s.objects:
  if o.name.startswith('SHADOW_Garden_Portal_'):o.hide_render=name=='botanical-garden-blender'
 cam.location=position;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
 s.render.filepath=str(REVIEW/f'{name}.png')
 bpy.ops.render.render(write_still=True)

"""Render Blender close-ups, with lighting held independently of the ambient timeline."""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'assets/reviews';REVIEW.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
night='night' in args
scene.frame_set(23 if night else 1)
for obj in scene.objects:
    if obj.type=='LIGHT' or obj.name.startswith(('Blind_Slat_','Blind_Cord_0')):
        obj.animation_data_clear()
scene.world.animation_data_clear()
scene.world.node_tree.animation_data_clear()
for mat in bpy.data.materials:
    if mat.node_tree and mat.node_tree.animation_data and mat.node_tree.animation_data.action:
        if not mat.node_tree.animation_data.action.name.startswith('AmbientMaterial_'):
            mat.node_tree.animation_data.action=None
scene.animation_data_clear();scene['screen_night']=night
camera=scene.camera.copy();camera.data=camera.data.copy()
scene.collection.objects.link(camera);scene.camera=camera
scene.cycles.samples=32;scene.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type='OPTIX'
    devices=prefs.get_devices_for_type('OPTIX')
    if any(d.type=='OPTIX' for d in devices):
        for d in devices:d.use=d.type=='OPTIX'
        scene.cycles.device='GPU'
except TypeError:pass
scene.render.use_compositing=False;scene.render.resolution_percentage=100
scene.render.resolution_x=1000;scene.render.resolution_y=700
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.image_settings.color_depth='8'
scene.render.film_transparent=True
views={
    'controller':(130,(-3.5,-1.8,2.9),(-3.1,-.45,1.1),1.2),
    'screens':(1,(-2.3,-.3,3.8),(-2.6,3.9,2.15),4.8),
    'monitor':(1,(-1.95,2.0,2.65),(-1.95,4.02,2.60),2.3),
    'typing':(235,(-1.95,2.0,2.65),(-1.95,4.02,2.60),2.3),
    'phone':(210,(-.25,2.6,3.6),(-.25,3.85,1.54),.9),
    'shelf':(1,(.6,-4.8,4.0),(2.75,-2.65,2.35),1.6),
    'window':(220,(-2.4,-.5,3.6),(-2.4,5.5,3.2),5.4),
}
requested=[a for a in args if a!='night'] or ['screens','phone','shelf','window']
for name in requested:
    frame,position,target,scale=views[name]
    scene.frame_set(frame);scene['screen_night']=night
    camera.location=position;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=scale
    scene.render.filepath=str(REVIEW/f'room-refined-{name}-{"night" if night else "day"}.png')
    bpy.ops.render.render(write_still=True)
    print('[review] '+scene.render.filepath,flush=True)

"""Render authored ambient states in daylight, without changing saved sources."""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'assets/reviews'
REVIEW.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
requested = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
scene.frame_set(23 if requested==['night'] else 1)
curtains = {o.name: o.matrix_basis.copy() for o in scene.objects if o.name.startswith(('Blind_Cord_0','Blind_Slat_'))}
lights = {o.name:(o.data.energy, tuple(o.data.color)) for o in scene.objects if o.type=='LIGHT'}
backgrounds = [(n, n.inputs['Strength'].default_value) for n in scene.world.node_tree.nodes if n.type=='BACKGROUND']
window = next(n for n in bpy.data.materials['MAT_WindowView'].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
window_day = window.inputs['Emission Strength'].default_value
# Rendering evaluates the timeline again: detach only the day/night actions in
# this disposable process so the ambient review remains in daylight.
for name in curtains:
    bpy.data.objects[name].animation_data_clear()
for obj in scene.objects:
    if obj.type=='LIGHT':
        obj.data.animation_data_clear()
scene.world.animation_data_clear()
scene.world.node_tree.animation_data_clear()
for material in bpy.data.materials:
    if material.node_tree and material.node_tree.animation_data and material.node_tree.animation_data.action and not material.node_tree.animation_data.action.name.startswith('AmbientMaterial_'):
        material.node_tree.animation_data_clear()
camera = scene.camera.copy()
camera.data = camera.data.copy()
scene.collection.objects.link(camera)
scene.camera = camera
scene.cycles.samples = 32
scene.cycles.use_denoising = True
preferences=bpy.context.preferences.addons['cycles'].preferences
try:
    preferences.compute_device_type='OPTIX'
    devices=preferences.get_devices_for_type('OPTIX')
    if any(device.type=='OPTIX' for device in devices):
        for device in devices:
            device.use=device.type=='OPTIX'
        scene.cycles.device='GPU'
except TypeError:
    pass
scene.render.use_compositing = False
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

views = {
    'overview': (1, None, None, 19),
    'night': (23, None, None, 19),
    'window': (220, (-2.4,-.5,3.6), (-2.4,5.5,3.2), 5.4),
    'screens': (450, (-2.3,-.3,3.8), (-2.6,3.9,2.15), 4.8),
    'phone': (210, (-.25,2.6,3.6), (-.25,3.85,1.54), .9),
    'controller': (130, (-3.5,-1.8,2.9), (-3.1,-.45,1.1), 1.2),
    'corner': (1, (-.5,0,4.2), (3.49,4.89,4.8), 2.8),
}
requested = requested or [name for name in views if name!='night']
for label in requested:
    frame, position, target, scale = views[label]
    scene.frame_set(frame)
    for name,matrix in curtains.items():
        bpy.data.objects[name].matrix_basis = matrix
    for name,(energy,color) in lights.items():
        bpy.data.objects[name].data.energy = energy
        bpy.data.objects[name].data.color = color
    for node,strength in backgrounds:
        node.inputs['Strength'].default_value = strength
    window.inputs['Emission Strength'].default_value = window_day
    if position:
        camera.location = position
        camera.rotation_euler = (Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    else:
        camera.matrix_world = bpy.data.objects['CAM_Overview'].matrix_world.copy()
    camera.data.type='ORTHO'
    camera.data.ortho_scale=scale
    scene.render.resolution_x=1100
    scene.render.resolution_y=800
    scene.render.filepath=str(REVIEW/f'room-living-{label}.png')
    bpy.ops.render.render(write_still=True)
    print(f'[review] {label} at frame {frame}',flush=True)

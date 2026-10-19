"""Author motion in both refined blends, then copy only those clips into the GLB.

blender -b --threads 4 --python scripts/upgrade-room-motion.py
Geometry, packed artwork, lightmaps and camera anchors are retained byte-for-byte.
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix

sys.path.insert(0, str(Path(__file__).resolve().parent))
from glb_patch import GlbPatch

ROOT = Path(__file__).resolve().parents[1]
FPS = 24
END = 385


def key(obj, path, samples, name):
    for frame, value in samples:
        setattr(obj, path, value)
        obj.keyframe_insert(data_path=path, frame=frame)
    action = obj.animation_data.action
    previous = bpy.data.actions.get(name)
    if previous and previous != action and previous.users == 0:
        bpy.data.actions.remove(previous)
    action.name = name


def author():
    targets = []
    window = bpy.data.objects['EMIT_WindowView'].data.materials[0]
    strength = next(n for n in window.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Emission Strength']
    for frame, value in ((1, 1.1), (24, .0275)):
        strength.default_value = value
        strength.keyframe_insert(data_path='default_value', frame=frame)
    for obj in [o for o in bpy.context.scene.objects if o.name.startswith('Exterior_Foliage_')]:
        i = int(obj.name.rsplit('_', 1)[1])
        obj.animation_data_clear()
        phase = i * .47
        samples = []
        for frame in range(1, END + 1, 4):
            t = (frame - 1) / (END - 1) * math.tau
            sway = .022 * (math.sin(2*t + phase) - math.sin(phase))
            flutter = .008 * (math.sin(5*t + phase) - math.sin(phase))
            samples.append((frame, (flutter, sway, sway * .18)))
        key(obj, 'rotation_euler', samples, f'Ambient_Exterior_Foliage_{i:02d}')
        targets.append((obj, 'rotation', END))
    breeze = bpy.data.objects['Blind_Breeze']
    breeze.animation_data_clear()
    key(breeze, 'location', [(f, (.006 * math.sin((f-1)/(END-1)*math.tau*2), 0, 0))
                             for f in range(1, END+1, 4)], 'Ambient_Blind_Breeze')
    targets.append((breeze, 'translation', END))
    controller = bpy.data.objects['Controller_Assembly']
    rest = controller.rotation_euler.copy()
    controller.animation_data_clear()
    key(controller, 'rotation_euler', [(1, rest), (6, (rest.x+.035, rest.y, rest.z-.018)),
                                      (12, (rest.x-.016, rest.y, rest.z+.009)),
                                      (19, rest), (25, rest)], 'Focus_controller')
    targets.append((controller, 'rotation', 25))
    power = bpy.data.objects['EMIT_Controller_Power']
    tree = power.data.materials[0].node_tree
    tree.animation_data_clear()
    strength = next(n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Emission Strength']
    samples = [(1, 0), (4, 0), (9, 2.4), (13, .18), (20, 1.8), (25, 1.8)]
    for frame, value in samples:
        strength.default_value = value
        strength.keyframe_insert(data_path='default_value', frame=frame)
    tree.animation_data.action.name = 'FocusMaterial_controller'
    curve = next(c for layer in tree.animation_data.action.layers for strip in layer.strips
                 for bag in strip.channelbags for c in bag.fcurves)
    power['blender_emission'] = json.dumps({'group': 'controller', 'trigger': 'focus',
        'fps': FPS, 'base': 1.8, 'end': 25,
        'keys': [(f, max(0, float(curve.evaluate(f)))) for f in range(1, 26)]})
    bpy.context.scene.frame_set(1)
    return targets


def sync(targets, path=ROOT / 'public/assets/room/portfolio-room.glb'):
    patch = GlbPatch(path)
    gltf = patch.gltf
    nodes = gltf['nodes']
    by_name = {n['name']: i for i, n in enumerate(nodes) if 'name' in n}

    basis = Matrix.Rotation(-math.pi/2, 4, 'X')
    for obj, channel, end in targets:
        i = by_name[obj.name]
        parent_inverse = patch.parent_inverse(i)
        values = []
        for f in range(1, end+1):
            bpy.context.scene.frame_set(f)
            pose = (parent_inverse @ basis @ obj.matrix_world @ basis.inverted()).decompose()
            v = pose[1 if channel == 'rotation' else 0]
            values.extend((v.x,v.y,v.z,v.w) if channel == 'rotation' else v)
        name = obj.animation_data.action.name
        gltf['animations'] = [a for a in gltf['animations'] if a['name'] != name]
        gltf['animations'].append({'name': name,
            'channels': [{'sampler': 0, 'target': {'node': i, 'path': channel}}],
            'samplers': [{'input': patch.add_accessor([(f-1)/FPS for f in range(1,end+1)],1),
                          'output': patch.add_accessor(values,4 if channel=='rotation' else 3),
                          'interpolation': 'LINEAR'}]})
    power = nodes[by_name['EMIT_Controller_Power']]
    power['extras']['blender_emission'] = bpy.data.objects['EMIT_Controller_Power']['blender_emission']
    window = next(m for m in gltf['materials'] if m['name'] == 'MAT_WindowView')
    # glTF omits strength when its authored value is the default of one.
    window.setdefault('extensions', {}).setdefault('KHR_materials_emissive_strength', {})['emissiveStrength'] = 1.1
    patch.write()
    print(f'[motion] synced {len(targets)} authored clips and controller startup curve', flush=True)


if __name__ == '__main__':
    for filename in ('portfolio-room.blend', 'portfolio-room-optimized.blend'):
        path = ROOT / 'assets/blender/refined' / filename
        bpy.ops.wm.open_mainfile(filepath=str(path))
        bpy.context.scene.frame_set(1)
        targets = author()
        bpy.ops.wm.save_as_mainfile(filepath=str(path))
    sync(targets)

"""Copy Blender's original 24-frame curtain sequence into an exported room GLB.

Run in the source Blender scene after export. Only curtain tracks are replaced;
meshes, materials, lighting and other animations keep their exported data.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix

sys.path.insert(0, str(Path(__file__).resolve().parent))
from glb_patch import GlbPatch


def sync_curtain_clips(path):
    path = Path(path)
    patch = GlbPatch(path)
    gltf = patch.gltf
    nodes = gltf['nodes']

    scene = bpy.context.scene
    fps = scene.render.fps / scene.render.fps_base
    # The original day/night sequence is frames 1–24, separate from ambient loops.
    frames = range(1, 25)
    targets = {c['target']['node'] for a in gltf['animations'] if a['name'].startswith('Curtain_') for c in a['channels']}
    basis = Matrix.Rotation(-math.pi / 2, 4, 'X')
    parent_inverse = {i: patch.parent_inverse(i) for i in targets}
    samples = {i: [] for i in targets}
    saved_frame = scene.frame_current
    # Wind belongs to its own parent clip, never to the sampled blind movement.
    breeze = bpy.data.objects.get('Blind_Breeze')
    breeze_action = breeze.animation_data.action if breeze and breeze.animation_data else None
    breeze_basis = breeze.matrix_basis.copy() if breeze else None
    if breeze_action:
        breeze.animation_data.action = None
        breeze.location = (0, 0, 0)
    try:
        for frame in frames:
            scene.frame_set(frame)
            for i in targets:
                authored = basis @ bpy.data.objects[nodes[i]['name']].matrix_world @ basis.inverted()
                samples[i].append((parent_inverse[i] @ authored).decompose())
    finally:
        if breeze_action:
            breeze.animation_data.action = breeze_action
            breeze.matrix_basis = breeze_basis
        scene.frame_set(saved_frame)
    times = patch.add_accessor([(f - 1) / fps for f in frames], 1)
    for clip in gltf['animations']:
        if not clip['name'].startswith('Curtain_'):
            continue
        clip['samplers'] = []
        for channel in clip['channels']:
            target = channel['target']
            component = {'translation': 0, 'rotation': 1, 'scale': 2}[target['path']]
            values = [pose[component] for pose in samples[target['node']]]
            flat = [v for value in values for v in ((value.x, value.y, value.z, value.w) if component == 1 else value)]
            channel['sampler'] = len(clip['samplers'])
            clip['samplers'].append({'input': times, 'output': patch.add_accessor(flat, 4 if component == 1 else 3), 'interpolation': 'LINEAR'})
    patch.write()
    print(f'[curtains] copied {len(targets)} objects, frames 1–24 at {fps:g} fps to {path}', flush=True)


if __name__ == '__main__':
    destination = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else Path(__file__).resolve().parents[1] / 'public/assets/room/portfolio-room.glb'
    sync_curtain_clips(destination)

"""Copy Blender's original 24-frame curtain sequence into an exported room GLB.

Run in the source Blender scene after export. Only curtain tracks are replaced;
meshes, materials, lighting and other animations keep their exported data.
"""
import json
import math
import struct
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion, Vector


def sync_curtain_clips(path):
    path = Path(path)
    raw = path.read_bytes()
    json_size = struct.unpack_from('<I', raw, 12)[0]
    gltf = json.loads(raw[20:20 + json_size])
    binary = bytearray(raw[28 + json_size:])
    nodes = gltf['nodes']
    parents = {child: i for i, node in enumerate(nodes) for child in node.get('children', [])}

    def world(index):
        node = nodes[index]
        local = (Matrix([node['matrix'][i:i + 4] for i in range(0, 16, 4)]).transposed()
                 if 'matrix' in node else Matrix.LocRotScale(
                     Vector(node.get('translation', (0, 0, 0))),
                     Quaternion((node.get('rotation', (0, 0, 0, 1))[3], *node.get('rotation', (0, 0, 0, 1))[:3])),
                     Vector(node.get('scale', (1, 1, 1)))))
        return world(parents[index]) @ local if index in parents else local

    def accessor(values, width):
        binary.extend(b'\0' * (-len(binary) % 4))
        offset = len(binary)
        binary.extend(struct.pack('<' + 'f' * len(values), *values))
        view = len(gltf['bufferViews'])
        gltf['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(values) * 4})
        index = len(gltf['accessors'])
        gltf['accessors'].append({'bufferView': view, 'componentType': 5126,
                                  'count': len(values) // width, 'type': {1: 'SCALAR', 3: 'VEC3', 4: 'VEC4'}[width],
                                  'min': [min(values[i::width]) for i in range(width)],
                                  'max': [max(values[i::width]) for i in range(width)]})
        return index

    scene = bpy.context.scene
    fps = scene.render.fps / scene.render.fps_base
    # The original day/night sequence is frames 1–24, separate from ambient loops.
    frames = range(1, 25)
    targets = {c['target']['node'] for a in gltf['animations'] if a['name'].startswith('Curtain_') for c in a['channels']}
    basis = Matrix.Rotation(-math.pi / 2, 4, 'X')
    parent_inverse = {i: world(parents[i]).inverted() if i in parents else Matrix.Identity(4) for i in targets}
    samples = {i: [] for i in targets}
    saved_frame = scene.frame_current
    try:
        for frame in frames:
            scene.frame_set(frame)
            for i in targets:
                authored = basis @ bpy.data.objects[nodes[i]['name']].matrix_world @ basis.inverted()
                samples[i].append((parent_inverse[i] @ authored).decompose())
    finally:
        scene.frame_set(saved_frame)
    times = accessor([(f - 1) / fps for f in frames], 1)
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
            clip['samplers'].append({'input': times, 'output': accessor(flat, 4 if component == 1 else 3), 'interpolation': 'LINEAR'})
    gltf['buffers'][0]['byteLength'] = len(binary)
    encoded = json.dumps(gltf, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    binary.extend(b'\0' * (-len(binary) % 4))
    path.write_bytes(struct.pack('<III', 0x46546C67, 2, 28 + len(encoded) + len(binary))
                     + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
                     + struct.pack('<II', len(binary), 0x004E4942) + binary)
    print(f'[curtains] copied {len(targets)} objects, frames 1–24 at {fps:g} fps to {path}', flush=True)


if __name__ == '__main__':
    import sys
    destination = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else Path(__file__).resolve().parents[1] / 'public/assets/room/portfolio-room.glb'
    sync_curtain_clips(destination)

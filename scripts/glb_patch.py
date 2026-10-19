"""Patch the room's single-buffer GLB while preserving existing binary data."""
import json
import math
import os
import struct
import tempfile
from pathlib import Path


def _decode(raw):
    if len(raw) < 12:
        raise ValueError('Truncated GLB header')
    magic, version, length = struct.unpack_from('<III', raw)
    if magic != 0x46546C67 or version != 2 or length != len(raw):
        raise ValueError('Invalid GLB header or length')
    chunks = []
    offset = 12
    while offset < length:
        if offset + 8 > length:
            raise ValueError('Truncated GLB chunk header')
        size, kind = struct.unpack_from('<II', raw, offset)
        offset += 8
        if size % 4 or offset + size > length:
            raise ValueError('Invalid GLB chunk bounds or alignment')
        chunks.append((kind, raw[offset:offset + size]))
        offset += size
    if [kind for kind, _ in chunks] != [0x4E4F534A, 0x004E4942]:
        raise ValueError('Expected room GLB JSON and BIN chunks')
    gltf = json.loads(chunks[0][1])
    binary = bytearray(chunks[1][1])
    buffers = gltf.get('buffers', [])
    if len(buffers) != 1 or 'uri' in buffers[0]:
        raise ValueError('Expected one embedded room buffer')
    size = buffers[0]['byteLength']
    if size < 0 or not size <= len(binary) <= size + 3:
        raise ValueError('Invalid embedded buffer length')
    _validate(gltf, size)
    return gltf, binary


def _validate(gltf, size):
    views = gltf.get('bufferViews', [])
    for view in views:
        offset, length = view.get('byteOffset', 0), view['byteLength']
        if view.get('buffer', 0) != 0 or offset < 0 or length < 0 or offset + length > size:
            raise ValueError('Buffer view extends outside the room buffer')
    accessors = gltf.get('accessors', [])
    for accessor in accessors:
        if accessor['count'] < 1:
            raise ValueError('Empty GLB accessor')
        if 'bufferView' in accessor:
            index = accessor['bufferView']
            if not 0 <= index < len(views):
                raise ValueError('Invalid accessor buffer view')
            width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}.get(accessor['type'])
            component = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}.get(accessor['componentType'])
            if width is None or component is None:
                raise ValueError('Unsupported room accessor format')
            view = views[index]
            offset = accessor.get('byteOffset', 0)
            stride = view.get('byteStride', width * component)
            end = offset + (accessor['count'] - 1) * stride + width * component
            if offset < 0 or (view.get('byteOffset', 0) + offset) % component or end > view['byteLength']:
                raise ValueError('Accessor extends outside its buffer view or is misaligned')
    for clip in gltf.get('animations', []):
        samplers = clip['samplers']
        for sampler in samplers:
            if any(not 0 <= sampler[key] < len(accessors) for key in ('input', 'output')):
                raise ValueError('Invalid animation accessor')
        for channel in clip['channels']:
            if not 0 <= channel['sampler'] < len(samplers):
                raise ValueError('Invalid animation sampler')
            if not 0 <= channel['target']['node'] < len(gltf.get('nodes', [])):
                raise ValueError('Invalid animation target')


class GlbPatch:
    def __init__(self, path):
        self.path = Path(path)
        self.gltf, self._binary = _decode(self.path.read_bytes())
        self._parents = {}
        nodes = self.gltf.get('nodes', [])
        for index, node in enumerate(nodes):
            for child in node.get('children', []):
                if not 0 <= child < len(nodes) or child in self._parents:
                    raise ValueError('Invalid room node parent')
                self._parents[child] = index
        for index in self._parents:
            seen = set()
            while index in self._parents:
                if index in seen:
                    raise ValueError('Cyclic room node hierarchy')
                seen.add(index)
                index = self._parents[index]

    def parent_inverse(self, index):
        # Blender supplies the same matrix implementation used during authoring.
        from mathutils import Matrix, Quaternion, Vector

        def world(index):
            node = self.gltf['nodes'][index]
            q = node.get('rotation', (0, 0, 0, 1))
            local = (Matrix([node['matrix'][i:i + 4] for i in range(0, 16, 4)]).transposed()
                     if 'matrix' in node else Matrix.LocRotScale(
                         Vector(node.get('translation', (0, 0, 0))),
                         Quaternion((q[3], *q[:3])), Vector(node.get('scale', (1, 1, 1)))))
            return world(self._parents[index]) @ local if index in self._parents else local

        return world(self._parents[index]).inverted() if index in self._parents else Matrix.Identity(4)

    def add_accessor(self, values, width):
        if width not in (1, 3, 4) or not values or len(values) % width:
            raise ValueError('Expected complete scalar, vector or quaternion samples')
        if any(not math.isfinite(value) for value in values):
            raise ValueError('Non-finite animation sample')
        packed = struct.pack('<' + 'f' * len(values), *values)
        self._binary.extend(b'\0' * (-len(self._binary) % 4))
        offset = len(self._binary)
        self._binary.extend(packed)
        views = self.gltf.setdefault('bufferViews', [])
        view = len(views)
        views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(packed)})
        accessors = self.gltf.setdefault('accessors', [])
        index = len(accessors)
        accessors.append({'bufferView': view, 'componentType': 5126,
                          'count': len(values) // width, 'type': {1: 'SCALAR', 3: 'VEC3', 4: 'VEC4'}[width],
                          'min': [min(values[i::width]) for i in range(width)],
                          'max': [max(values[i::width]) for i in range(width)]})
        return index

    def write(self):
        self.gltf['buffers'][0]['byteLength'] = len(self._binary)
        encoded = json.dumps(self.gltf, separators=(',', ':'), allow_nan=False).encode()
        encoded += b' ' * (-len(encoded) % 4)
        binary = self._binary + b'\0' * (-len(self._binary) % 4)
        raw = (struct.pack('<III', 0x46546C67, 2, 28 + len(encoded) + len(binary))
               + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
               + struct.pack('<II', len(binary), 0x004E4942) + binary)
        _decode(raw)
        staged = None
        try:
            # Same-directory replacement keeps an incomplete patch off the destination.
            with tempfile.NamedTemporaryFile(dir=self.path.parent, prefix=self.path.stem + '-', suffix='.glb', delete=False) as file:
                staged = Path(file.name)
                file.write(raw)
                file.flush()
                os.fsync(file.fileno())
            _decode(staged.read_bytes())
            os.replace(staged, self.path)
        finally:
            if staged is not None:
                staged.unlink(missing_ok=True)

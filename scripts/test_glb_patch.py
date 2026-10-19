"""Run with Python, or Blender --background --python-exit-code 1 --python this-file."""
import importlib.util
import json
import math
import runpy
import shutil
import struct
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from glb_patch import GlbPatch


def make_glb(gltf, binary=b'abcd'):
    encoded = json.dumps(gltf).encode()
    encoded += b' ' * (-len(encoded) % 4)
    binary += b'\0' * (-len(binary) % 4)
    return (struct.pack('<III', 0x46546C67, 2, 28 + len(encoded) + len(binary))
            + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
            + struct.pack('<II', len(binary), 0x004E4942) + binary)


def binary_chunk(raw):
    return raw[28 + struct.unpack_from('<I', raw, 12)[0]:]


class GlbPatchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'room.glb'
        self.document = {
            'asset': {'version': '2.0'}, 'buffers': [{'byteLength': 4}],
            'nodes': [{'name': 'Parent', 'children': [1], 'translation': [2, 3, 4]}, {'name': 'Child'}],
            'meshes': [{'primitives': [{'extensions': {'KHR_draco_mesh_compression': {'bufferView': 0, 'attributes': {}}}}]}],
            'bufferViews': [{'buffer': 0, 'byteOffset': 0, 'byteLength': 4}],
            'accessors': [{'bufferView': 0, 'componentType': 5126, 'type': 'SCALAR', 'count': 1}],
            'animations': [{'name': 'Untouched', 'channels': [{'sampler': 0, 'target': {'node': 1, 'path': 'translation'}}],
                            'samplers': [{'input': 0, 'output': 0}]}],
        }
        self.original = make_glb(self.document)
        self.path.write_bytes(self.original)

    def test_round_trip_preserves_geometry_and_untouched_clips(self):
        room = GlbPatch(self.path)
        times = room.add_accessor([0, 1], 1)
        positions = room.add_accessor([0, 0, 0, 2, 3, 4], 3)
        rotations = room.add_accessor([0, 0, 0, 1, 0, 1, 0, 0], 4)
        room.gltf['animations'].append({
            'name': 'Patched', 'channels': [{'sampler': 0, 'target': {'node': 1, 'path': 'translation'}}],
            'samplers': [{'input': times, 'output': positions, 'interpolation': 'LINEAR'}],
        })
        room.write()
        raw = self.path.read_bytes()
        loaded = GlbPatch(self.path)
        self.assertEqual(struct.unpack_from('<I', raw, 8)[0], len(raw))
        self.assertEqual(binary_chunk(raw)[:4], b'abcd')
        self.assertEqual(loaded.gltf['meshes'], self.document['meshes'])
        self.assertEqual(loaded.gltf['animations'][0], self.document['animations'][0])
        for index, values in [(times, (0, 1)), (positions, (0, 0, 0, 2, 3, 4)), (rotations, (0, 0, 0, 1, 0, 1, 0, 0))]:
            accessor = loaded.gltf['accessors'][index]
            view = loaded.gltf['bufferViews'][accessor['bufferView']]
            self.assertEqual(view['byteOffset'] % 4, 0)
            self.assertEqual(struct.unpack_from('<' + 'f' * len(values), binary_chunk(raw), view['byteOffset']), values)

    def test_rejects_malformed_containers(self):
        bad_magic = bytearray(self.original)
        struct.pack_into('<I', bad_magic, 0, 0)
        bad_chunk = bytearray(self.original)
        struct.pack_into('<I', bad_chunk, 12, len(self.original) * 2)
        wrong_kind = bytearray(self.original)
        struct.pack_into('<I', wrong_kind, 16, 0)
        for raw in (b'', self.original[:-1], bad_magic, bad_chunk, wrong_kind):
            with self.subTest(raw=raw[:12]):
                self.path.write_bytes(raw)
                with self.assertRaises(ValueError):
                    GlbPatch(self.path)

    def test_failed_validation_preserves_destination(self):
        room = GlbPatch(self.path)
        room.gltf['bufferViews'][0]['byteLength'] = 1000
        with self.assertRaises(ValueError):
            room.write()
        self.assertEqual(self.path.read_bytes(), self.original)
        room = GlbPatch(self.path)
        room.gltf['animations'][0]['samplers'][0]['input'] = 9999
        with self.assertRaises(ValueError):
            room.write()
        self.assertEqual(self.path.read_bytes(), self.original)

    def test_failed_replacement_preserves_destination_and_removes_staging_file(self):
        room = GlbPatch(self.path)
        room.add_accessor([0, 1], 1)
        with patch('glb_patch.os.replace', side_effect=OSError('locked destination')):
            with self.assertRaises(OSError):
                room.write()
        self.assertEqual(self.path.read_bytes(), self.original)
        self.assertEqual(list(self.path.parent.iterdir()), [self.path])

    def test_rejects_invalid_samples_and_hierarchies(self):
        room = GlbPatch(self.path)
        for values, width in [([], 1), ([0, 1], 3), ([math.nan], 1), ([math.inf], 1), ([0, 1], 2)]:
            with self.assertRaises(ValueError):
                room.add_accessor(values, width)
        for children in ([0], [999]):
            self.document['nodes'][1]['children'] = children
            self.path.write_bytes(make_glb(self.document))
            with self.assertRaises(ValueError):
                GlbPatch(self.path)

    @unittest.skipUnless(importlib.util.find_spec('bpy'), 'Blender required')
    def test_blender_patch_callers_preserve_exported_geometry_and_other_clips(self):
        import bpy
        root = Path(__file__).resolve().parents[1]
        source = root / 'public/assets/room/portfolio-room.glb'
        shutil.copyfile(source, self.path)
        original_raw = self.path.read_bytes()
        original = GlbPatch(self.path).gltf
        bpy.ops.wm.open_mainfile(filepath=str(root / 'assets/blender/refined/portfolio-room-optimized.blend'))
        curtains = runpy.run_path(str(root / 'scripts/sync-curtain-clips.py'))
        curtains['sync_curtain_clips'](self.path)
        motion = runpy.run_path(str(root / 'scripts/upgrade-room-motion.py'))
        targets = [(bpy.data.objects['Controller_Assembly'], 'rotation', 25),
                   (bpy.data.objects['Blind_Breeze'], 'translation', 385)]
        motion['sync'](targets, self.path)
        loaded = GlbPatch(self.path).gltf
        self.assertEqual(loaded['meshes'], original['meshes'])
        original_binary = binary_chunk(original_raw)
        self.assertEqual(binary_chunk(self.path.read_bytes())[:len(original_binary)], original_binary)
        changed = {obj.animation_data.action.name for obj, _, _ in targets}
        untouched = {clip['name']: clip for clip in original['animations']
                     if not clip['name'].startswith('Curtain_') and clip['name'] not in changed}
        self.assertEqual({clip['name']: clip for clip in loaded['animations'] if clip['name'] in untouched}, untouched)
        self.assertIn('KHR_materials_emissive_strength',
                      next(material for material in loaded['materials'] if material['name'] == 'MAT_WindowView')['extensions'])

    @unittest.skipUnless(importlib.util.find_spec('mathutils'), 'Blender mathutils required')
    def test_parent_transforms_cover_matrix_trs_and_root(self):
        from mathutils import Matrix, Vector
        self.document['nodes'] = [
            {'matrix': [0, 2, 0, 0, -2, 0, 0, 0, 0, 0, 2, 0, 2, 3, 4, 1], 'children': [1]},
            {'translation': [1, 0, 0], 'children': [2]}, {},
        ]
        self.path.write_bytes(make_glb(self.document))
        room = GlbPatch(self.path)
        world = Matrix(((0, -2, 0, 2), (2, 0, 0, 3), (0, 0, 2, 4), (0, 0, 0, 1))) @ Matrix.Translation((1, 0, 0))
        point = Vector((3, 4, 5, 1))
        restored = room.parent_inverse(2) @ (world @ point)
        for actual, expected in zip(restored, point):
            self.assertAlmostEqual(actual, expected)
        self.assertEqual(room.parent_inverse(0), Matrix.Identity(4))


if __name__ == '__main__':
    unittest.main(argv=[__file__])

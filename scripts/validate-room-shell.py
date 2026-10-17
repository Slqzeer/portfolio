"""Check closed architectural meshes, ray hits and unchanged camera/interaction transforms."""
from pathlib import Path
import json
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
reports = {}


def probe(obj, origin, direction, expected):
    hit, point, normal, face = obj.ray_cast(Vector(origin), Vector(direction))
    if expected is None:
        assert not hit, (obj.name, 'window opening obstructed', tuple(point))
    else:
        assert hit and (point-Vector(expected)).length < .0001, (obj.name, tuple(point), expected)
    return list(point) if hit else None


for filename in ('portfolio-room.blend','portfolio-room-optimized.blend'):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/blender'/filename))
    transforms = {o.name:o.matrix_world.copy() for o in bpy.context.scene.objects if o.name.startswith(('CAM_', 'INT_'))}
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/blender/art-v2'/filename))
    objects = {name:bpy.data.objects[name] for name in ('Wall_Envelope','Baseboard_Continuous','Floor','Floor_Base')}
    report = {'meshes':{}, 'probes':{}}
    for name,obj in objects.items():
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        assert all(edge.is_manifold for edge in bm.edges), (name,'open boundary')
        volume = bm.calc_volume(signed=True)
        assert volume > 0, (name,'inverted normals')
        assert not any(face.use_smooth for face in obj.data.polygons), (name,'rounded planar normals')
        assert 'Lightmap' in obj.data.uv_layers, name
        assert all(-.0001 <= component <= 1.0001 for loop in obj.data.uv_layers['Lightmap'].data for component in loop.uv), name
        points = [obj.matrix_world @ v.co for v in obj.data.vertices]
        bounds = [[round(fn(p[i] for p in points),5) for i in range(3)] for fn in (min,max)]
        report['meshes'][name] = {'bounds':bounds,'volume':round(volume,6),'faces':len(obj.data.polygons),'bevel':obj['architectural_bevel_m']}
        bm.free()
    wall,base,floor,foundation = objects.values()
    probes = report['probes']
    probes['right wall'] = probe(wall, (3,4,.5), (1,0,0), (3.49,4,.5))
    probes['back wall'] = probe(wall, (2,4,.5), (0,1,0), (2,4.89,.5))
    probes['right baseboard'] = probe(base, (3,4,.08), (1,0,0), (3.465,4,.08))
    probes['back baseboard'] = probe(base, (2,4,.08), (0,1,0), (2,4.865,.08))
    probes['window opening'] = probe(wall, (-2,4,3), (0,1,0), None)
    probes['floor level'] = probe(floor, (-5,-3,1), (0,0,-1), (-5,-3,0))
    probes['foundation contact'] = probe(foundation, (-5,-3,0), (0,0,-1), (-5,-3,-.025))
    wb,fb = report['meshes']['Wall_Envelope']['bounds'], report['meshes']['Floor']['bounds']
    assert wb[0][:2] == fb[0][:2] and wb[1][:2] == fb[1][:2], 'outer footprint mismatch'
    assert wb[0][2] == fb[1][2] == 0, 'wall / floor gap'
    for name, matrix in transforms.items():
        actual = bpy.data.objects[name].matrix_world
        assert max(abs(a-b) for row_a,row_b in zip(matrix,actual) for a,b in zip(row_a,row_b)) < .00001, name
    report['preservedCameraAndInteractionTransforms'] = len(transforms)
    reports[filename] = report
    print('[shell-check]', filename, len(objects), 'closed meshes;',len(probes),'ray probes;',len(transforms),'preserved transforms', flush=True)
path = ROOT/'assets/reviews/room-shell-check.json'
path.write_text(json.dumps(reports,indent=2)+'\n')

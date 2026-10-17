"""Rebuild the architectural envelope in both art-v2 sources, never the originals.

Run after refine-room-art.py. Export and rebake all maps after this script: shell UVs change.
The inner wall planes and window opening stay fixed, as do furniture and camera transforms.
"""
from pathlib import Path
import itertools
import bpy
import bmesh
from mathutils import Matrix

ROOT = Path(__file__).resolve().parents[1]
X0, X1, Y0, Y1 = -6.02, 3.71, -4.62, 5.11
INNER_X, INNER_Y, HEIGHT = 3.49, 4.89, 5.84
WINDOW = (-4.48, -.32, 1.9, 4.73)
PLINTH_HEIGHT, PLINTH_DEPTH = .16, .025


def select(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def create_mesh(name, vertices, faces, material, parent, bevel):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.dissolve_limit(bm, angle_limit=.0001, verts=list(bm.verts), edges=list(bm.edges))
    assert all(edge.is_manifold for edge in bm.edges), name
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.data.collections['RoomShell'].objects.link(obj)
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()
    obj.matrix_world = Matrix.Identity(4)
    mesh.materials.append(bpy.data.materials[material])
    obj['lightmap_atlas'] = 'shell'
    obj['architectural_bevel_m'] = bevel
    select([obj])
    modifier = obj.modifiers.new('Millimetre edge relief', 'BEVEL')
    modifier.width = bevel
    modifier.segments = 2
    # Apply identically in both sources; keep large planar faces flat, without rounded normals.
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in mesh.polygons:
        polygon.use_smooth = False
    mesh.uv_layers.new(name='UVMap')
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.004)
    bpy.ops.object.mode_set(mode='OBJECT')
    return obj


def prism(name, polygon, bottom, top, material, parent, bevel):
    count = len(polygon)
    vertices = [(x,y,z) for z in (bottom,top) for x,y in polygon]
    faces = [tuple(reversed(range(count))), tuple(range(count,count*2))]
    faces += [(i, (i+1)%count, (i+1)%count+count, i+count) for i in range(count)]
    return create_mesh(name, vertices, faces, material, parent, bevel)


def walls(parent):
    # Boundary faces of occupied orthogonal cells form one closed L-shaped wall with a window.
    axes = ([X0, WINDOW[0], WINDOW[1], INNER_X, X1], [Y0, INNER_Y, Y1], [0, WINDOW[2], WINDOW[3], HEIGHT])
    cells = set()
    for index in itertools.product(*(range(len(axis)-1) for axis in axes)):
        x,y,z = [(axes[i][j]+axes[i][j+1])/2 for i,j in enumerate(index)]
        if y < INNER_Y and x < INNER_X:
            continue
        if y >= INNER_Y and WINDOW[0] < x < WINDOW[1] and WINDOW[2] < z < WINDOW[3]:
            continue
        cells.add(index)
    vertices, faces, lookup = [], [], {}
    for cell in sorted(cells):
        for axis in range(3):
            others = [i for i in range(3) if i != axis]
            for sign in (-1,1):
                neighbor = tuple(value + (sign if i == axis else 0) for i,value in enumerate(cell))
                if neighbor in cells:
                    continue
                face = []
                for a,b in ((0,0),(1,0),(1,1),(0,1)):
                    point = list(cell)
                    point[axis] += int(sign > 0)
                    point[others[0]] += a
                    point[others[1]] += b
                    position = tuple(axes[i][j] for i,j in enumerate(point))
                    if position not in lookup:
                        lookup[position] = len(vertices)
                        vertices.append(position)
                    face.append(lookup[position])
                faces.append(face)
    return create_mesh('Wall_Envelope', vertices, faces, 'MAT_Review_Wall_BlueGrey', parent, .003)


def finish_materials():
    # The exposed foundation is a thin, matte architectural cut instead of a dark rounded pedestal.
    material = bpy.data.materials['MAT_Review_Floor_Edge_Dark']
    shader = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    for link in list(shader.inputs['Base Color'].links):
        material.node_tree.links.remove(link)
    shader.inputs['Base Color'].default_value = (.25,.28,.25,1)
    shader.inputs['Roughness'].default_value = .86
    material = bpy.data.materials['MAT_Review_Baseboard']
    shader = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    for link in list(shader.inputs['Base Color'].links):
        material.node_tree.links.remove(link)
    shader.inputs['Base Color'].default_value = (.58,.60,.53,1)
    shader.inputs['Roughness'].default_value = .78
    # Keep the existing elongated oak grain, add actual board boundaries and restrained board variation.
    material = bpy.data.materials['MAT_Review_Floor_LightWood']
    tree = material.node_tree
    shader = next(node for node in tree.nodes if node.type == 'BSDF_PRINCIPLED')
    if not tree.nodes.get('RoomFloor_Planks'):
        grain = shader.inputs['Base Color'].links[0].from_socket
        coordinates = next(node for node in tree.nodes if node.type == 'TEX_COORD')
        mapping = tree.nodes.new('ShaderNodeMapping')
        mapping.inputs['Scale'].default_value = (X1-X0,Y1-Y0,1)
        tree.links.new(coordinates.outputs['Generated'], mapping.inputs['Vector'])
        boards = tree.nodes.new('ShaderNodeTexBrick')
        boards.name = 'RoomFloor_Planks'
        boards.offset = .5
        boards.offset_frequency = 2
        boards.inputs['Scale'].default_value = 1
        boards.inputs['Brick Width'].default_value = 2.2
        boards.inputs['Row Height'].default_value = .26
        boards.inputs['Mortar Size'].default_value = .0025
        boards.inputs['Mortar Smooth'].default_value = .0008
        boards.inputs['Color1'].default_value = (.90,.92,.92,1)
        boards.inputs['Color2'].default_value = (1.04,1.02,.98,1)
        boards.inputs['Mortar'].default_value = (.24,.22,.18,1)
        tree.links.new(mapping.outputs['Vector'], boards.inputs['Vector'])
        mix = tree.nodes.new('ShaderNodeMixRGB')
        mix.blend_type = 'MULTIPLY'
        mix.inputs[0].default_value = 1
        tree.links.new(grain, mix.inputs[1])
        tree.links.new(boards.outputs['Color'], mix.inputs[2])
        tree.links.new(mix.outputs[0], shader.inputs['Base Color'])


for filename in ('portfolio-room.blend', 'portfolio-room-optimized.blend'):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/blender/art-v2'/filename))
    scene = bpy.context.scene
    scene.frame_set(1)
    for obj in list(scene.objects):
        if obj.type == 'MESH' and (obj.name.startswith(('Wall_', 'Baseboard_', 'Room_Walls__')) or obj.name in ('Floor','Floor_Base')):
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.context.view_layer.update()
    wall = walls(bpy.data.objects['Room_Walls'])
    baseboard = prism('Baseboard_Continuous', [(X0,INNER_Y-PLINTH_DEPTH),(INNER_X-PLINTH_DEPTH,INNER_Y-PLINTH_DEPTH),(INNER_X-PLINTH_DEPTH,Y0),(INNER_X,Y0),(INNER_X,INNER_Y),(X0,INNER_Y)], 0, PLINTH_HEIGHT, 'MAT_Review_Baseboard', bpy.data.objects['Room_Walls'], .001)
    footprint = [(X0,Y0),(X1,Y0),(X1,Y1),(X0,Y1)]
    floor = prism('Floor', footprint, -.025, 0, 'MAT_Review_Floor_LightWood', bpy.data.objects['Room_Floor'], .001)
    foundation = prism('Floor_Base', footprint, -.145, -.025, 'MAT_Review_Floor_Edge_Dark', bpy.data.objects['Room_Floor'], .0015)
    finish_materials()
    objects = [wall,baseboard,floor,foundation]
    for obj in objects:
        obj.data.uv_layers.new(name='Lightmap')
        obj.data.uv_layers.active = obj.data.uv_layers['Lightmap']
    select(objects)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.004, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=.004)
    bpy.ops.object.mode_set(mode='OBJECT')
    for obj in objects:
        obj.data.uv_layers.active = obj.data.uv_layers[0]
        obj.data.uv_layers[0].active_render = True
    bpy.ops.wm.save_mainfile()
    print('[shell] rebuilt', filename, flush=True)

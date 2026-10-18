"""Author the living room in Blender, preserving the approved baseline palette.

blender -b --threads 4 --python scripts/animate-room.py
Outputs independent editable/optimized sources under assets/blender/living/.
"""
from pathlib import Path
import json
import math
import random
import bpy
import bmesh
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/blender/living'
OUT.mkdir(exist_ok=True)
FPS = 24
END = 769  # A quiet, authored 32-second cycle; no web-generated motion.


def material(name, color, emission=0, roughness=.65):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    node = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Emission Color'].default_value = (*color, 1)
    node.inputs['Emission Strength'].default_value = emission
    return mat


def mesh(name, vertices, faces, mat, parent=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    data.materials.append(mat)
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    return obj


def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    return obj


def key(obj, path, frames, name, constant=False):
    for frame, value in frames:
        setattr(obj, path, value)
        obj.keyframe_insert(data_path=path, frame=frame)
    action = obj.animation_data.action
    action.name = name
    if constant:
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        if curve.data_path != path:
                            continue
                        for point in curve.keyframe_points:
                            point.interpolation = 'CONSTANT'


def emission(obj, events, group):
    """Exportable bridge for shader curves unsupported by core glTF animations."""
    mat = obj.data.materials[0]
    node = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    socket = node.inputs['Emission Strength']
    base = float(socket.default_value)
    assert base > 0, obj.name
    values = [(1, base), *events, (END, base)]
    for frame, value in values:
        socket.default_value = value
        socket.keyframe_insert(data_path='default_value', frame=frame)
    mat.node_tree.animation_data.action.name = f'AmbientMaterial_{obj.name}'
    # Values are the actual authored Blender strengths, relative to frame 1.
    action = mat.node_tree.animation_data.action
    curves = [curve for layer in action.layers for strip in layer.strips
              for bag in strip.channelbags for curve in bag.fcurves
              if curve.data_path == socket.path_from_id('default_value')]
    assert len(curves) == 1, obj.name
    samples = sorted(set(range(1, END+1, 2)) | {frame for frame, _ in values})
    obj['blender_emission'] = json.dumps({'group': group, 'fps': FPS, 'base': base,
                                        'keys': [(frame, float(curves[0].evaluate(frame))) for frame in samples], 'end': END})


def continuous_wall():
    """Same wall dimensions/opening, with a welded interior corner."""
    scene = bpy.context.scene
    for obj in list(scene.objects):
        if obj.name in ('Wall_Back', 'Wall_Right', 'Room_Walls__MAT_Review_Wall_BlueGrey'):
            bpy.data.objects.remove(obj, do_unlink=True)
    axes = [[-6, -4.48, -.32, 3.49, 3.71], [-4.6, 4.89, 5.11], [0, 1.9, 4.73, 5.8]]
    cells = set()
    for x in range(4):
        for y in range(2):
            for z in range(3):
                if (y == 1 and not (x == 1 and z == 1)) or x == 3:
                    cells.add((x, y, z))
    vertices, faces, indices = [], [], {}
    for cell in sorted(cells):
        for axis in range(3):
            for sign in (-1, 1):
                neighbor = list(cell)
                neighbor[axis] += sign
                if tuple(neighbor) in cells:
                    continue
                others = [i for i in range(3) if i != axis]
                face = []
                for a, b in ((0, 0), (1, 0), (1, 1), (0, 1)):
                    p = list(cell)
                    p[axis] += int(sign > 0)
                    p[others[0]] += a
                    p[others[1]] += b
                    co = tuple(axes[i][n] for i, n in enumerate(p))
                    if co not in indices:
                        indices[co] = len(vertices)
                        vertices.append(co)
                    face.append(indices[co])
                faces.append(face)
    wall = mesh('Wall_Continuous', vertices, faces, bpy.data.materials['MAT_Review_Wall_BlueGrey'], bpy.data.objects['Room_Walls'])
    bm = bmesh.new()
    bm.from_mesh(wall.data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.dissolve_limit(bm, angle_limit=.0001, verts=list(bm.verts), edges=list(bm.edges))
    assert all(edge.is_manifold for edge in bm.edges), 'Wall corner must be welded'
    bm.to_mesh(wall.data)
    bm.free()
    wall['lightmap_atlas'] = 'shell'
    # Repack the shell together: its previous atlas cannot fit the welded wall.
    shell = []
    for obj in scene.objects:
        if obj.type != 'MESH':
            continue
        parent = obj
        while parent and parent.name not in ('Room_Walls', 'Room_Floor'):
            parent = parent.parent
        if parent or obj.get('lightmap_atlas') == 'shell':
            obj['lightmap_atlas'] = 'shell'
            if not obj.data.uv_layers:
                obj.data.uv_layers.new(name='UVMap')
            if 'Lightmap' not in obj.data.uv_layers:
                obj.data.uv_layers.new(name='Lightmap')
            obj.data.uv_layers.active = obj.data.uv_layers['Lightmap']
            shell.append(obj)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in shell:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = wall
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.006)
    bpy.ops.uv.pack_islands(margin=.006)
    bpy.ops.object.mode_set(mode='OBJECT')
    for obj in shell:
        obj.data.uv_layers.active = obj.data.uv_layers[0]
        obj.data.uv_layers[0].active_render = True
    return len(wall.data.vertices)


def exterior():
    scene = bpy.context.scene
    backdrop = bpy.data.objects['EMIT_WindowView']
    # Bring the garden down and close to the aperture, behind the existing glass.
    for vertex in backdrop.data.vertices:
        world = backdrop.matrix_world @ vertex.co
        world.x = -4.65 + (world.x + 4.8) / 8.3 * 4.55
        world.y = 5.85
        world.z = 1.25 + (world.z - .6) / 4.4 * 3.3
        vertex.co = backdrop.matrix_world.inverted() @ world
    # Preserve the original garden image as the far layer, add real foreground leaves.
    mat_leaf = material('MAT_Exterior_Leaves', (.075, .22, .085), .45)
    mat_leaf_light = material('MAT_Exterior_Leaves_Light', (.18, .32, .095), .45)
    bark = material('MAT_Exterior_Stems', (.09,.075,.035), .2)
    root = empty('Exterior_Garden')
    rng = random.Random(27)
    for index in range(5):
        branch = empty(f'Exterior_Branch_{index:02d}', root)
        branch.location = (-4.2 + index * .78, 5.45 + (index % 2) * .12, 1.9)
        stem_vertices, stem_faces = [], []
        height=1.05+(index%3)*.18
        for ring in range(15):
            t=ring/14
            for side in range(6):
                angle=side*math.tau/6
                stem_vertices.append((math.sin(t*2.8)*.11+math.cos(angle)*.006,math.sin(angle)*.006,.12+t*height))
            if ring:
                for side in range(6):
                    a=(ring-1)*6+side
                    b=(ring-1)*6+(side+1)%6
                    stem_faces.append((a,b,b+6,a+6))
        mesh(f'Exterior_Stem_{index:02d}',stem_vertices,stem_faces,bark,branch)
        vertices, faces = [], []
        for leaf in range(14):
            t = leaf / 13
            x = math.sin(t*2.8)*.11
            z = .12 + t * (1.05 + (index % 3) * .18)
            y = 0
            length = rng.uniform(.12, .21)*(-1 if leaf%2 else 1)
            start = len(vertices)
            vertices.extend([(x,y,z),(x+length*.5,y,z+.075),(x+length,y,z+.09),(x+length*.58,y,z+.015),(x+length*.55,y-.022,z+.05)])
            faces.extend([(start,start+1,start+4),(start+1,start+2,start+4),(start+2,start+3,start+4),(start+3,start,start+4)])
        mesh(f'Exterior_Leaves_{index:02d}', vertices, faces, mat_leaf if index % 2 else mat_leaf_light, branch)
        key(branch, 'rotation_euler', [(1,(0,0,0)), (97,(0,0,0)), (145,(0,.035,0)), (193,(0,-.018,0)), (265,(0,0,0)), (505,(0,0,0)), (553,(0,-.025,0)), (625,(0,.015,0)), (END,(0,0,0))], f'Ambient_Exterior_Wind_{index:02d}')
    birdmat = material('MAT_Exterior_Bird', (.028, .045, .055), .35)
    bird = empty('Exterior_Bird', root)
    mesh('Exterior_Bird_Body', [(-.04,0,0),(.06,0,0),(0,-.025,.028),(0,.025,-.018)], [(0,1,2),(0,3,1),(0,2,3),(1,3,2)], birdmat, bird)
    for index, sign in enumerate((-1,1)):
        wing = mesh(f'Exterior_Bird_Wing_{index}', [(0,0,0),(sign*.19,.01,.025),(sign*.11,.012,-.018)], [(0,1,2)], birdmat, bird)
        key(wing, 'rotation_euler', [(frame,(0,math.sin(frame*.7)*.42,0)) for frame in range(1,END+1,3)], f'Ambient_Exterior_Wing_{index}')
    key(bird, 'location', [(1,(-4.15,5.4,3.7)),(192,(-4.15,5.4,3.7)),(193,(-4.15,5.4,3.3)),(253,(-.7,5.4,3.48)),(254,(-4.15,5.4,3.7)),(END,(-4.15,5.4,3.7))], 'Ambient_Exterior_Bird_Flight')
    for layer in bird.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    if curve.data_path=='location':
                        for point in curve.keyframe_points:
                            if point.co.x<=192:
                                point.interpolation='LINEAR'
    key(bird, 'scale', [(1,(.00001,)*3),(192,(.00001,)*3),(193,(1,)*3),(253,(1,)*3),(254,(.00001,)*3),(END,(.00001,)*3)], 'Ambient_Exterior_Bird_Flight', True)
    # Breeze wrappers never compete with the existing child day/night transforms.
    ctl = bpy.data.objects['CTL_Curtains']
    slats = empty('Blind_Breeze', ctl)
    for obj in list(ctl.children):
        if obj.name.startswith('Blind_Slat_'):
            inverse=obj.matrix_parent_inverse.copy()
            obj.parent = slats  # Identity wrapper: existing action coordinates stay valid.
            obj.matrix_parent_inverse=inverse
    key(slats, 'location', [(1,(0,0,0)),(97,(0,0,0)),(145,(.006,0,0)),(193,(-.003,0,0)),(265,(0,0,0)),(END,(0,0,0))], 'Ambient_Blind_Breeze')
    for index in range(1,4):
        cord = bpy.data.objects[f'Blind_Cord_{index:02d}']
        pivot = empty(f'Blind_Cord_Breeze_{index}', ctl)
        inverse=cord.matrix_parent_inverse.copy()
        cord.parent = pivot
        cord.matrix_parent_inverse=inverse
        key(pivot, 'location', [(1,(0,0,0)),(97,(0,0,0)),(145,(.012-index*.002,0,0)),(193,(-.006,0,0)),(265,(0,0,0)),(END,(0,0,0))], f'Ambient_Blind_Cord_{index}')


def surface_frame(screen, name):
    # Reuse the screen's UV orientation so overlays remain on its actual surface.
    uv = screen.data.uv_layers[0]
    corners = {}
    for poly in screen.data.polygons:
        for loop_index in poly.loop_indices:
            point = uv.data[loop_index].uv
            corners[(round(point.x),round(point.y))] = screen.data.vertices[screen.data.loops[loop_index].vertex_index].co.copy()
    p, u, v = corners[(0,0)], corners[(1,0)]-corners[(0,0)], corners[(0,1)]-corners[(0,0)]
    normal = u.cross(v).normalized()
    transform = Matrix(((u.x,v.x,normal.x,p.x),(u.y,v.y,normal.y,p.y),(u.z,v.z,normal.z,p.z),(0,0,0,1)))
    obj = empty(name, screen)
    obj.matrix_local = transform
    obj.location += normal * .0008
    obj['screen_text_aspect'] = v.length/u.length
    return obj


def text(name, body, parent, position, size, mat):
    data = bpy.data.curves.new(name, 'FONT')
    data.body = body
    data.size = size
    font = bpy.data.fonts.get('Consolas')
    if font:
        data.font = font
    data.materials.append(mat)
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = position
    ancestor = parent
    while ancestor and 'screen_text_aspect' not in ancestor:
        ancestor = ancestor.parent
    if ancestor:
        obj.scale.x = ancestor['screen_text_aspect']
    return obj


def screen_activity():
    ink = material('MAT_Activity_Text', (.36,.85,.66), 1.2)
    dark = material('MAT_Activity_Background', (.008,.027,.035), .65)
    for target, start in (('Monitor_Screen',193),('Laptop_Screen',337)):
        frame = surface_frame(bpy.data.objects[target], f'{target}_Activity')
        panel = empty(f'{target}_Terminal', frame)
        panel.location = (.08,.09,.001)
        mesh(f'{target}_Terminal_Background', [(0,0,0),(.77,0,0),(.77,.23,0),(0,.23,0)], [(0,1,2,3)], dark, panel)
        lines = ['> pytest tests/backend', 'collecting quality checks', 'test_api ... PASSED', '# illustrative run']
        for row, line in enumerate(lines):
            x = .025
            for word_index, word in enumerate(line.split(' ')):
                obj = text(f'{target}_Typing_{row}_{word_index}', word, panel, (x,.18-row*.048,.001), .036, ink)
                at = start + row*30 + word_index*7
                visible=tuple(obj.scale)
                hidden=tuple(value*.00001 for value in visible)
                key(obj,'scale',[(1,visible),(49,visible),(50,hidden),(at-1,hidden),(at,visible),(END,visible)],f'Ambient_Screen_{target}_{row}_{word_index}',True)
                x += (len(word)+1)*.036*.61*frame['screen_text_aspect']
    phone = surface_frame(bpy.data.objects['EMIT_Smartphone'], 'Phone_Notifications')
    cardmat = material('MAT_Notification_Card',(.035,.075,.09),.8)
    light = material('MAT_Notification_Text',(.73,.9,.91),1)
    for index, (title, body, start) in enumerate((('ClassPulse','Backend review',169),('GitHub','New activity',481))):
        card = empty(f'Phone_Notification_{index}', phone)
        card.location = (.06,.3,.002)
        mesh(f'Phone_Notification_Card_{index}',[(0,0,0),(.88,0,0),(.88,.2,0),(0,.2,0)],[(0,1,2,3)],cardmat,card)
        text(f'Phone_Notification_Title_{index}',title,card,(.04,.125,.001),.05,light)
        text(f'Phone_Notification_Body_{index}',body,card,(.04,.045,.001),.036,light)
        key(card,'location',[(1,(.06,.28,.002)),(start,(.06,.28,.002)),(start+18,(.06,.42,.002)),(start+90,(.06,.42,.002)),(start+110,(.06,.58,.002)),(END,(.06,.58,.002))],f'Ambient_Phone_Notification_{index}')
        key(card,'scale',[(1,(.00001,)*3),(start-1,(.00001,)*3),(start,(1,)*3),(start+110,(1,)*3),(start+111,(.00001,)*3),(END,(.00001,)*3)],f'Ambient_Phone_Notification_{index}',True)


def device_lights():
    scene = bpy.context.scene
    for index,obj in enumerate(sorted((o for o in scene.objects if o.name.startswith('EMIT_Rack_')),key=lambda o:o.name)):
        if 'PWR' in obj.name or 'FAULT' in obj.name:
            continue
        # Separate materials keep the authored bursts independent.
        obj.data.materials[0] = obj.data.materials[0].copy()
        node = next(n for n in obj.data.materials[0].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        base = node.inputs['Emission Strength'].default_value
        events=[]
        for burst in range(4):
            frame = 49 + (index*29+burst*167)%650
            events.extend([(frame,base*.22),(frame+3,base*1.5),(frame+6,base*.22),(frame+10,base),(frame+20,base)])
        emission(obj,sorted(events), 'rack')
    touch = bpy.data.objects['Controller_Touchpad']
    center = sum((touch.matrix_world@Vector(c) for c in touch.bound_box),Vector())/8
    center += bpy.data.objects['Controller_Assembly'].matrix_world.to_3x3()@Vector((0,-.052,.004))
    bpy.ops.mesh.primitive_torus_add(major_segments=20,minor_segments=6,location=center,major_radius=.018,minor_radius=.003)
    power = bpy.context.object
    power.name = 'EMIT_Controller_Power'
    power.data.materials.append(material('MAT_Controller_Power',(.08,.38,.85),1.8))
    power.parent = bpy.data.objects['Controller_Assembly']
    power.matrix_parent_inverse = power.parent.matrix_world.inverted()
    emission(power,[(121,.12),(130,2.4),(139,.12),(148,1.8),(481,.12),(490,2.4),(499,.12),(508,1.8)],'controller')


reports=[]
for filename in ('portfolio-room.blend','portfolio-room-optimized.blend'):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/blender/baseline'/filename))
    scene=bpy.context.scene
    scene.frame_set(1)
    anchors={o.name:[list(row) for row in o.matrix_world] for o in scene.objects if o.name.startswith(('CAM_','INT_','CTL_'))}
    blind_poses={}
    for frame in (1,23):
        scene.frame_set(frame)
        blind_poses[frame]={o.name:o.matrix_world.copy() for o in scene.objects if o.name.startswith(('Blind_Slat_','Blind_Cord_0'))}
    scene.frame_set(1)
    wall_vertices=continuous_wall()
    exterior()
    screen_activity()
    device_lights()
    for frame,poses in blind_poses.items():
        scene.frame_set(frame)
        for name,before in poses.items():
            after=bpy.data.objects[name].matrix_world
            assert max(abs(after[i][j]-before[i][j]) for i in range(4) for j in range(4))<1e-5, f'Breeze parenting shifted {name}'
    scene.frame_set(1)
    bpy.context.view_layer.update()
    for name,before in anchors.items():
        after=bpy.data.objects[name].matrix_world
        assert max(abs(after[i][j]-before[i][j]) for i in range(4) for j in range(4))<1e-5,name
    scene['web_exposure_day']=1.0
    scene['web_exposure_night']=1.0
    scene.frame_end=END
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/filename))
    reports.append({'source':filename,'wall_vertices':wall_vertices,'material_curves':sum('blender_emission' in o for o in scene.objects),'ambient_actions':len([a for a in bpy.data.actions if a.name.startswith('Ambient_')])})
    print('[living] '+json.dumps(reports[-1]),flush=True)
(ROOT/'assets/reviews/room-living-source-check.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')

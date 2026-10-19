"""Refine the living Blender sources first; export only after reviewing these files.

blender -b --threads 4 --python scripts/refine-device-assets.py
"""
from pathlib import Path
import ast
import json
import math
import random

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/blender/living'
DEST = ROOT / 'assets/blender/refined'
DEST.mkdir(exist_ok=True)
ART = DEST / 'surfaces'
LAYOUT = json.loads((ART / 'layout.json').read_text())
# Reuse only function definitions; never execute the baseline rebuild on import.
helper_path=ROOT / 'scripts/animate-room.py'
tree=ast.parse(helper_path.read_text())
helpers=ast.Module(body=[node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name in {'material','mesh','empty','key'}],type_ignores=[])
assert len(helpers.body)==4, 'Missing Blender authoring helpers'
exec(compile(helpers, str(ROOT / 'scripts/animate-room.py'), 'exec'), globals())
END=769


def remove_tree(obj):
    for child in list(obj.children):
        remove_tree(child)
    bpy.data.objects.remove(obj, do_unlink=True)


def linear_color(hex_value):
    rgb = [int(hex_value[i:i+2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb)


def image_material(name, filename):
    mat = material(name, (0, 0, 0), 1)
    node = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    image = bpy.data.images.load(str(ART / filename), check_existing=True)
    image.pack()
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = image
    mat.node_tree.links.new(tex.outputs['Color'], node.inputs['Emission Color'])
    return mat


def surface_frame(screen, name):
    # Fit every UV corner: rounded phone corners cannot define a rectangle by rounding UVs.
    uv = screen.data.uv_layers[0]
    samples, positions = [], []
    for loop in screen.data.loops:
        samples.append([*uv.data[loop.index].uv, 1])
        positions.append(list(screen.data.vertices[loop.vertex_index].co))
    axes = np.linalg.lstsq(np.array(samples), np.array(positions), rcond=None)[0]
    u, v, p = map(Vector, axes)
    normal = u.cross(v).normalized()
    obj = empty(name, screen)
    obj.matrix_local = Matrix(((u.x,v.x,normal.x,p.x),(u.y,v.y,normal.y,p.y),(u.z,v.z,normal.z,p.z),(0,0,0,1)))
    obj.location += normal * .0005
    obj['screen_text_aspect'] = v.length / u.length
    residual = np.max(np.abs(np.array(samples) @ axes - np.array(positions)))
    assert residual < 1e-5, (screen.name, residual)
    return obj


def panel(name, parent, mat, x=0, y=0, w=1, h=1, z=.001, radius=0):
    vertices=[]
    if radius:
        # Radius is measured along the physical width, independent of screen aspect.
        aspect = parent.get('screen_text_aspect', 2.17)
        ry = radius / aspect
        for cx,cy,start in ((w-radius,h-ry,0),(radius,h-ry,90),(radius,ry,180),(w-radius,ry,270)):
            for i in range(7):
                angle=math.radians(start+i*15)
                vertices.append((cx+radius*math.cos(angle),cy+ry*math.sin(angle),0))
    else:
        vertices=[(0,0,0),(w,0,0),(w,h,0),(0,h,0)]
    obj=mesh(name,vertices,[tuple(range(len(vertices)))],mat,parent)
    obj.location=(x,y,z)
    uv=obj.data.uv_layers.new(name='UVMap')
    for loop in obj.data.loops:
        co=obj.data.vertices[loop.vertex_index].co
        uv.data[loop.index].uv=(co.x/w,co.y/h)
    return obj


def theme_visibility(obj, theme):
    obj['screen_theme'] = theme
    obj['device_surface'] = True
    for path in ('hide_render','hide_viewport'):
        driver=obj.driver_add(path).driver
        var=driver.variables.new();var.name='night';var.targets[0].id_type='SCENE'
        var.targets[0].id=bpy.context.scene;var.targets[0].data_path='["screen_night"]'
        driver.expression='1-night' if theme=='night' else 'night'


def palette_material(name, role):
    values={theme:linear_color(LAYOUT['palettes'][theme][role]) for theme in ('day','night')}
    mat=material(name, (0,0,0), 1)
    node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    for i in range(3):
        driver=node.inputs['Emission Color'].driver_add('default_value', i).driver
        var=driver.variables.new();var.name='night';var.targets[0].id_type='SCENE'
        var.targets[0].id=bpy.context.scene;var.targets[0].data_path='["screen_night"]'
        driver.expression=f'{values["day"][i]}*(1-night)+{values["night"][i]}*night'
    mat['screen_palette'] = json.dumps(values)
    return mat


def editor(screen, device):
    frame=surface_frame(screen,f'{screen.name}_Editor')
    frame['screen_device']=device
    for theme in ('day','night'):
        mat=image_material(f'MAT_Editor_{device}_{theme}',f'{device}-{theme}.png')
        obj=panel(f'Editor_{device}_{theme}',frame,mat)
        theme_visibility(obj,theme)
    start=193 if device=='monitor' else 337
    line=LAYOUT[device]['line'];x,y,w,h=line['x'],1-line['y']-line['h'],line['w'],line['h']
    maskmat=palette_material(f'MAT_Editor_{device}_Mask','bg')
    mask=panel(f'Editor_{device}_TypingMask',frame,maskmat,x,y,w,h,.002)
    mask['device_surface']=True; mask['screen_mask']=True
    # Character-sized steps use Blender's timeline; the web only plays the exported clip.
    steps=line['characters']
    locations=[(1,(x+w,y,.002)),(49,(x+w,y,.002)),(50,(x,y,.002)),(start-1,(x,y,.002))]
    scales=[(1,(.00001,1,1)),(49,(.00001,1,1)),(50,(1,1,1)),(start-1,(1,1,1))]
    for i in range(1,steps+1):
        at=start+i*3+(12 if i>12 else 0)+(9 if i>25 else 0)
        locations.append((at,(x+w*i/steps,y,.002)))
        scales.append((at,(max(.00001,1-i/steps),1,1)))
    end=locations[-1][0]
    locations.append((END,locations[-1][1]));scales.append((END,scales[-1][1]))
    key(mask,'location',locations,f'Ambient_Editor_{device}_Typing',True)
    key(mask,'scale',scales,f'Ambient_Editor_{device}_Typing',True)
    cursor=panel(f'Editor_{device}_Cursor',frame,palette_material(f'MAT_Editor_{device}_Cursor','accent'),x,y,.0015,h,.003)
    cursor['device_surface']=True;cursor['screen_mask']=True
    key(cursor,'location',[(f,(p[0],p[1],.003)) for f,p in locations],f'Ambient_Editor_{device}_Cursor',True)
    key(cursor,'scale',[(1,(.00001,)*3),(50,(1,)*3),(end,(1,)*3),(end+24,(.00001,)*3),(END,(.00001,)*3)],f'Ambient_Editor_{device}_Cursor',True)
    terminal=LAYOUT[device]['terminal']
    for row in range(2):
        ty=1-terminal['y']-(row+1)*terminal['rowHeight']
        cover=panel(f'Editor_{device}_TerminalMask_{row}',frame,maskmat,terminal['x'],ty,terminal['w'],terminal['rowHeight'],.002)
        cover['device_surface']=True;cover['screen_mask']=True
        key(cover,'scale',[(1,(.00001,1,1)),(49,(.00001,1,1)),(50,(1,1,1)),(end+35+row*22,(1,1,1)),(end+36+row*22,(.00001,1,1)),(END,(.00001,1,1))],f'Ambient_Editor_{device}_Terminal_{row}',True)
    # Replace the old painted interface as well as the now-removed floating overlays.
    screen.data.materials.clear()
    screen.data.materials.append(material(f'MAT_{device}_Screen_Base',(0,0,0)))


def phone():
    screen=bpy.data.objects['EMIT_Smartphone']
    frame=surface_frame(screen,'Phone_Surface')
    for theme in ('day','night'):
        # Keep the rounded outline and original UV mapping of the physical display.
        obj=screen.copy();obj.data=screen.data.copy();obj.animation_data_clear()
        bpy.context.scene.collection.objects.link(obj);obj.name=f'Phone_Display_{theme}'
        obj.data.materials.clear();obj.data.materials.append(image_material(f'MAT_Phone_{theme}',f'phone-{theme}.png'))
        theme_visibility(obj,theme)
    screen.data.materials.clear();screen.data.materials.append(material('MAT_Phone_Black',(0,0,0)))
    screen.hide_render=True;screen.hide_viewport=True;screen['device_hidden_base']=True
    for index,start in ((0,169),(1,481)):
        card=empty(f'Phone_Notification_{index}',frame)
        card.location=(.06,.45,.002)
        for theme in ('day','night'):
            card_height=.88*(160/520)/frame['screen_text_aspect']
            obj=panel(f'Phone_Notification_{index}_{theme}',card,image_material(f'MAT_Notification_{index}_{theme}',f'notification-{index}-{theme}.png'),w=.88,h=card_height,radius=.025)
            theme_visibility(obj,theme)
        initial=1 if index==0 else .00001
        key(card,'scale',[(1,(initial,)*3),(start-1,(initial,)*3),(start,(1,)*3),(start+142,(1,)*3),(start+143,(.00001,)*3),(END-24,(.00001,)*3),(END,(initial,)*3)],f'Ambient_Phone_Notification_{index}',True)
        key(card,'location',[(1,(.06,.45,.002)),(start,(.06,.475,.002)),(start+18,(.06,.45,.002)),(start+124,(.06,.45,.002)),(start+142,(.06,.475,.002)),(END,(.06,.45,.002))],f'Ambient_Phone_Notification_{index}')


def foliage():
    random.seed(41)
    root=empty('Exterior_Garden')
    mats=[material('MAT_Garden_Sage',(.10,.19,.085),.45),material('MAT_Garden_Olive',(.16,.235,.095),.45)]
    for index in range(10):
        left=index<5
        branch=empty(f'Exterior_Foliage_{index:02d}',root)
        branch.location=((-4.32 if left else -.48)+random.uniform(-.2,.2),5.4+(index%3)*.13,1.9+random.uniform(-.15,.15))
        vertices=[];faces=[]
        for leaf in range(24):
            angle=random.uniform(0,math.tau)
            height=random.uniform(.12,2.1)
            spread=.15+.25*(1-height/2.4)
            center=Vector((math.cos(angle)*spread,random.uniform(-.12,.12),height))
            long=Vector((random.uniform(-.08,.08),random.uniform(-.02,.02),random.uniform(.08,.12)))
            side=Vector((.045,0,random.uniform(-.01,.01)))
            base=len(vertices)
            vertices.append(tuple(center+Vector((0,-.018,0))))
            for segment in range(12):
                angle=segment*math.tau/12
                vertices.append(tuple(center+long*math.cos(angle)+side*math.sin(angle)))
            faces.extend((base,base+1+segment,base+1+(segment+1)%12) for segment in range(12))
        obj=mesh(f'Exterior_Leaves_{index:02d}',vertices,faces,mats[index%2],branch)
        obj.data.materials[0].use_backface_culling=False
        delay=index*7
        key(branch,'rotation_euler',[(1,(0,0,0)),(97+delay,(0,0,0)),(157+delay,(0,.012*(-1 if left else 1),0)),(229+delay,(0,-.006,0)),(313+delay,(0,0,0)),(END,(0,0,0))],f'Ambient_Exterior_Foliage_{index:02d}')


def shelf_corner():
    obj=bpy.data.objects['Bookshelf_Carcass']
    bm=bmesh.new();bm.from_mesh(obj.data)
    # Side panels originally reached through the top board, duplicating its exposed corners.
    remaining=set(bm.verts);changed=0
    while remaining:
        stack=[remaining.pop()];part=[]
        while stack:
            v=stack.pop();part.append(v)
            for edge in v.link_edges:
                other=edge.other_vert(v)
                if other in remaining: remaining.remove(other);stack.append(other)
        world=[obj.matrix_world@v.co for v in part]
        if min(p.z for p in world)<.001 and max(p.z for p in world)>2.55:
            for vert,p in zip(part,world):
                if p.z>1.28:
                    # Translate the whole top bevel together; flattening it collapses its faces.
                    p.z-=.0704;vert.co=obj.matrix_world.inverted()@p;changed+=1
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    assert all(edge.is_manifold for edge in bm.edges)
    assert all(face.calc_area()>1e-12 for face in bm.faces), 'Collapsed shelf bevel'
    bm.to_mesh(obj.data);bm.free()
    assert changed>=8, changed
    obj['corner_repaired']='Side panels meet the underside of the top board; no exposed overlapping faces.'


def controller_status():
    power=bpy.data.objects['EMIT_Controller_Power']
    # Match the physical centre button, not an offset from the touchpad.
    for vertex in power.data.vertices:
        vertex.co *= .0048/.018
    power.matrix_parent_inverse=Matrix.Identity(4)
    power.location=(0,-.004,.0414)
    power.rotation_euler=(0,0,0)
    power.scale=(1,1,1)
    power['status_button_aligned']=True
    bpy.context.view_layer.update()
    local=power.parent.matrix_world.inverted()@power.matrix_world.translation
    assert (local-Vector((0,-.004,.0414))).length<1e-5
    assert max(v.co.length for v in power.data.vertices)<.006


for filename in ('portfolio-room.blend','portfolio-room-optimized.blend'):
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/filename))
    scene=bpy.context.scene;scene.frame_set(1)
    anchors={o.name:o.matrix_world.copy() for o in scene.objects if o.name.startswith(('CAM_','INT_','CTL_'))}
    for name in ('Exterior_Garden','Monitor_Screen_Activity','Laptop_Screen_Activity','Phone_Notifications'):
        obj=bpy.data.objects.get(name)
        if obj:remove_tree(obj)
    for obj in list(scene.objects):
        if obj.name.startswith('IDLE_Monitor_'):remove_tree(obj)
    for action in list(bpy.data.actions):
        if not action.users:bpy.data.actions.remove(action)
    scene['screen_night']=False
    for frame,value in ((1,False),(12,False),(13,True),(END,True)):
        scene['screen_night']=value;scene.keyframe_insert(data_path='["screen_night"]',frame=frame)
    editor(bpy.data.objects['Monitor_Screen'],'monitor')
    editor(bpy.data.objects['Laptop_Screen'],'laptop')
    phone();foliage();shelf_corner();controller_status()
    scene.frame_set(1);bpy.context.view_layer.update()
    for name,matrix in anchors.items():
        assert max(abs(matrix[i][j]-bpy.data.objects[name].matrix_world[i][j]) for i in range(4) for j in range(4))<1e-5,name
    bpy.ops.wm.save_as_mainfile(filepath=str(DEST/filename))
    print('[refinement] Saved '+filename,flush=True)

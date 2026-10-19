"""Author the botanical garden in Blender; no image cards or ball canopies.

Run in the editable scene with build(), or run this file in background Blender
to update both refined sources. The room's original anchors are preserved.
"""
from pathlib import Path
import math
import random
import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
END = 769


def material(name, colour, roughness=.85):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    output=mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
    node=mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    mat.node_tree.links.new(node.outputs['BSDF'],output.inputs['Surface'])
    node.inputs['Base Color'].default_value = (*colour, 1)
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Emission Color'].default_value = (*colour, 1)
    node.inputs['Emission Strength'].default_value = 0
    mat.diffuse_color=(*colour,1)
    return mat


def textured(name, colour, kind, roughness=.92):
    """Packed, tileable colour/normal maps, shared by Blender and glTF."""
    mat=material(name,colour,roughness)
    rng=np.random.default_rng(37)
    size=1024 if kind=='lawn' else 512
    yy,xx=np.mgrid[0:size,0:size]/size
    noise=np.zeros((size,size),dtype=np.float32)
    for cells,weight in [(4,.35),(13,.24),(39,.18),(113,.10)]:
        grid=rng.random((cells,cells))
        u=xx*cells;v=yy*cells
        i=u.astype(int);j=v.astype(int)
        a=u-i;b=v-j;a=a*a*(3-2*a);b=b*b*(3-2*b)
        noise+=weight*((1-b)*((1-a)*grid[j%cells,i%cells]+a*grid[j%cells,(i+1)%cells])+b*((1-a)*grid[(j+1)%cells,i%cells]+a*grid[(j+1)%cells,(i+1)%cells]))
    fine=rng.random((size,size))
    height=noise*.8+fine*.08
    tint=.6+noise*.85+fine*.10
    if kind in ('bark','wood'):
        grain=np.sin(xx*math.tau*(85 if kind=='bark' else 110)+np.sin(yy*math.tau*3)*2+noise*12)
        height+=np.maximum(grain,.0)**9*(.32 if kind=='bark' else .10)
        tint*=.85+.2*grain
    if kind=='lawn':
        # Mottled earth, fine thatch and short blades rather than a green plane.
        strand=np.sin(xx*math.tau*310+noise*20+yy*math.tau*7)
        tint*=.8+.22*strand
        height+=strand*.07
    if kind=='stone':
        veins=np.abs(np.sin(xx*math.tau*3+yy*math.tau*5+noise*18))
        tint*=.72+.28*np.minimum(veins*8,1)
        height+=fine*.08
    rgb=np.clip(np.array(colour)[None,None,:]*tint[:,:,None],0,1)
    if kind=='lawn':
        dry=np.clip((noise-.47)*3,0,.48)[:,:,None]
        rgb=rgb*(1-dry)+np.array([.085,.066,.028])*dry
        rgb*=.48
        # A dense undergrowth texture carries the thousands of fine blades that
        # would be wasteful as web geometry. Each blade has a dark root and tip.
        count=28000
        bx=rng.uniform(0,size,count);by=rng.uniform(0,size,count)
        angle=rng.uniform(0,math.tau,count);length=rng.uniform(7,24,count)
        brightness=rng.uniform(.28,1.5,count)
        blade_colour=np.array([.041,.073,.014])[None,:]*brightness[:,None]
        for step in range(22):
            t=step/22
            px=((bx+np.cos(angle)*length*t+np.sin(t*math.pi)*2)%size).astype(int)
            py=((by+np.sin(angle)*length*t)%size).astype(int)
            rgb[py,px]=blade_colour*(.38+.62*math.sin(t*math.pi))
            height[py,px]=.55+.3*math.sin(t*math.pi)
    # Image pixel arrays are linear; the image node supplies the native texture.
    def packed(suffix,pixels):
        old=bpy.data.images.get(name+suffix)
        if old:bpy.data.images.remove(old)
        image=bpy.data.images.new(name+suffix,size,size)
        image.colorspace_settings.name='sRGB' if suffix=='_Albedo' else 'Non-Color'
        if suffix=='_Albedo':pixels=np.where(pixels<=.0031308,pixels*12.92,1.055*pixels**(1/2.4)-.055)
        image.pixels.foreach_set(np.dstack((pixels,np.ones((size,size)))).astype(np.float32).ravel())
        image.pack()
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
        return tex
    node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    tex=packed('_Albedo',rgb)
    mat.node_tree.links.new(tex.outputs['Color'],node.inputs['Base Color'])
    dx=(np.roll(height,-1,1)-np.roll(height,1,1))*1.4
    dy=(np.roll(height,-1,0)-np.roll(height,1,0))*1.4
    normals=np.dstack((-dx,-dy,np.ones((size,size))))
    normals/=np.linalg.norm(normals,axis=2)[:,:,None]
    normal=packed('_Normal',normals*.5+.5)
    mapping=mat.node_tree.nodes.new('ShaderNodeNormalMap')
    mat.node_tree.links.new(normal.outputs['Color'],mapping.inputs['Color'])
    mat.node_tree.links.new(mapping.outputs['Normal'],node.inputs['Normal'])
    mat['garden_texture']=kind
    return mat


def aperture_material(mat):
    """Clip camera rays in Blender's material viewport as well as final renders.

    Incoming is the surface-to-camera ray in world space for both camera types.
    Other rays retain the garden for natural lighting and shadowing.
    """
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    for node in list(nodes):
        if node.get('garden_aperture_node'):nodes.remove(node)
    existing=set(nodes)
    output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL')
    surface=next(n for n in nodes if n.type=='BSDF_PRINCIPLED').outputs['BSDF']
    geo=nodes.new('ShaderNodeNewGeometry')
    pos=nodes.new('ShaderNodeSeparateXYZ');ray=nodes.new('ShaderNodeSeparateXYZ')
    links.new(geo.outputs['Position'],pos.inputs[0]);links.new(geo.outputs['Incoming'],ray.inputs[0])
    def mathnode(op,a,b):
        n=nodes.new('ShaderNodeMath');n.operation=op
        for i,val in enumerate((a,b)):
            if isinstance(val,(int,float)):n.inputs[i].default_value=val
            else:links.new(val,n.inputs[i])
        return n.outputs[0]
    t=mathnode('DIVIDE',mathnode('SUBTRACT',5.14,pos.outputs['Y']),ray.outputs['Y'])
    x=mathnode('ADD',pos.outputs['X'],mathnode('MULTIPLY',ray.outputs['X'],t))
    z=mathnode('ADD',pos.outputs['Z'],mathnode('MULTIPLY',ray.outputs['Z'],t))
    inside=mathnode('GREATER_THAN',t,0)
    for op,a,b in [('GREATER_THAN',x,-4.48),('LESS_THAN',x,-.32),('GREATER_THAN',z,1.9),('LESS_THAN',z,4.73)]:
        inside=mathnode('MULTIPLY',inside,mathnode(op,a,b))
    path=nodes.new('ShaderNodeLightPath')
    origin=nodes.new('ShaderNodeVectorTransform');origin.vector_type='POINT'
    origin.convert_from='CAMERA';origin.convert_to='WORLD';origin.inputs[0].default_value=(0,0,0)
    camera=nodes.new('ShaderNodeSeparateXYZ');links.new(origin.outputs[0],camera.inputs[0])
    inside=mathnode('MULTIPLY',inside,mathnode('LESS_THAN',camera.outputs['Y'],5.14))
    mask=mathnode('MULTIPLY',path.outputs['Is Camera Ray'],mathnode('SUBTRACT',1,inside))
    # Holdout terminates rejected rays immediately; transparent rays through a
    # dense crown can otherwise hit the bounce limit and leave black specks.
    transparent=nodes.new('ShaderNodeHoldout');mix=nodes.new('ShaderNodeMixShader')
    links.new(mask,mix.inputs[0]);links.new(surface,mix.inputs[1]);links.new(transparent.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],output.inputs['Surface'])
    mat['garden_window_aperture']=True
    for node in set(nodes)-existing:node['garden_aperture_node']=True


def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    return obj


class Batch:
    def __init__(self):
        self.vertices, self.faces, self.indices = [], [], []
        self.leaves = 0

    def face(self, points, mat=0):
        start=len(self.vertices)
        self.vertices.extend(tuple(p) for p in points)
        self.faces.append(tuple(range(start,start+len(points))))
        self.indices.append(mat)

    def leaf(self, p, direction, width, mat=0):
        d=Vector(direction)
        normal=d.cross(Vector((.24,.6,1))).normalized()
        side=d.normalized().cross(normal).normalized()*width
        p=Vector(p)
        start=len(self.vertices)
        # Curved oval lamina, tapered petiole, central vein and a gently drooping tip.
        for row in range(5):
            t=row/4;half=math.sin(math.pi*t)**.8
            centre=p+d*t+normal*(math.sin(math.pi*t)*d.length*.09-t*t*d.length*.08)
            self.vertices.extend(tuple(centre+side*half*s+normal*(1-abs(s))*half*d.length*.045) for s in (-1,0,1))
        for row in range(4):
            for col in range(2):
                a=start+row*3+col
                self.faces.append((a,a+1,a+4,a+3));self.indices.append(mat)
        self.leaves+=1

    def blade(self,p,d,width,mat=0):
        p=Vector(p);d=Vector(d);side=Vector((d.z,0,-d.x)).normalized()*width
        self.face([p-side,p+side,p+d*.55+side*.55,p+d*.55-side*.55],mat)
        self.face([p+d*.55-side*.55,p+d*.55+side*.55,p+d+Vector((.015,0,0))],mat)
        self.leaves+=1

    def tube(self, a, b, radius, mat=0, sides=7):
        a,b=Vector(a),Vector(b)
        axis=(b-a).normalized()
        u=axis.cross(Vector((.1,1,.2))).normalized()
        v=axis.cross(u).normalized()
        start=len(self.vertices)
        for t in (0,.33,.66,1):
            centre=a.lerp(b,t)+u*(math.sin(t*math.pi)*radius*.5)
            r=radius*(1-.65*t)
            self.vertices.extend(tuple(centre+r*(u*math.cos(j*math.tau/sides)+v*math.sin(j*math.tau/sides))) for j in range(sides))
        for ring in range(3):
            for j in range(sides):
                self.faces.append((start+ring*sides+j,start+ring*sides+(j+1)%sides,start+(ring+1)*sides+(j+1)%sides,start+(ring+1)*sides+j));self.indices.append(mat)

    def object(self, name, parent, mats):
        mesh=bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices,[],self.faces);mesh.update()
        obj=bpy.data.objects.new(name,mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent=parent
        for mat in mats: mesh.materials.append(mat)
        for polygon,index in zip(mesh.polygons,self.indices):
            polygon.material_index=index;polygon.use_smooth=True
        uv=mesh.uv_layers.new(name='SurfaceUV')
        for poly in mesh.polygons:
            axis=max(range(3),key=lambda i:abs(poly.normal[i]))
            axes=[i for i in range(3) if i!=axis]
            for loop in poly.loop_indices:
                v=mesh.vertices[mesh.loops[loop].vertex_index].co
                uv.data[loop].uv=(v[axes[0]]*.85,v[axes[1]]*.85)
        obj['exterior_surface']=True
        if self.leaves:obj['botanical_leaf_count']=self.leaves
        return obj


def box(name, parent, position, size, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj=bpy.context.object;obj.name=name;obj.parent=parent
    obj.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat);obj['exterior_surface']=True
    if bevel:
        mod=obj.modifiers.new('Soft worn edges','BEVEL');mod.width=bevel;mod.segments=2
    return obj


def animate(obj, path, samples, name):
    obj.animation_data_clear()
    for frame,value in samples:
        setattr(obj,path,value);obj.keyframe_insert(data_path=path,frame=frame)
    previous=bpy.data.actions.get(name)
    if previous and previous.users==0:bpy.data.actions.remove(previous)
    obj.animation_data.action.name=name
    for layer in obj.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:curve.modifiers.new('CYCLES')


def wind(obj, index):
    phase=index*.47
    animate(obj,'rotation_euler',[(f,(.003*(math.sin((f-1)/(END-1)*math.tau*4+phase)-math.sin(phase)),.012*(math.sin((f-1)/(END-1)*math.tau*3+phase)-math.sin(phase)),0)) for f in range(1,END+1,4)],f'Ambient_Exterior_Foliage_{index:02d}')


def tree(root, index, position, scale, mats, bark, rng):
    parent=empty(f'Exterior_Foliage_{index:02d}',root);parent.location=position
    wood,leaves=Batch(),Batch()
    wood.tube((0,0,0),(.06,-.04,2.2*scale),.075*scale)
    for primary in range(10):
        angle=primary*2.399+rng.uniform(-.2,.2)
        start=Vector((.03,0,(.65+primary*.095)*scale))
        end=Vector((math.cos(angle)*(.7+primary*.018)*scale,math.sin(angle)*.63*scale,(1.8+rng.random()*.7)*scale))
        wood.tube(start,end,.032*scale)
        for secondary in range(6):
            t=.32+secondary*.12
            a=start.lerp(end,t)
            angle2=angle+rng.uniform(-1.1,1.1)
            b=a+Vector((math.cos(angle2)*.47*scale,math.sin(angle2)*.45*scale,rng.uniform(.15,.42)*scale))
            wood.tube(a,b,.009*scale)
            for twig in range(4):
                tip=b+Vector((rng.uniform(-.24,.24)*scale,rng.uniform(-.25,.25)*scale,rng.uniform(-.07,.28)*scale))
                base=a.lerp(b,.55+twig*.12)
                wood.tube(base,tip,.003*scale,sides=5)
                for leaf in range(23):
                    p=base.lerp(tip,(leaf+.5)/23)+Vector((rng.uniform(-.12,.12)*scale,rng.uniform(-.12,.12)*scale,rng.uniform(-.07,.07)*scale))
                    az=rng.uniform(0,math.tau)
                    length=rng.uniform(.045,.095)*scale
                    d=Vector((math.cos(az)*length,math.sin(az)*length,rng.uniform(-.04,.07)*scale))
                    leaves.leaf(p,d,length*.28,rng.randrange(len(mats)))
    wood.object(f'Exterior_Branching_Trunk_{index:02d}',parent,[bark])
    leaves.object(f'Exterior_Botanical_Crown_{index:02d}',parent,mats)
    wind(parent,index)


def shrub(root,index,position,radius,mats,rng,flowers=None):
    parent=empty(f'Exterior_Planting_{index:02d}',root);parent.location=position
    batch=Batch();blooms=Batch()
    for stem in range(85):
        az=rng.uniform(0,math.tau);r=math.sqrt(rng.random())*radius
        top=Vector((math.cos(az)*r,math.sin(az)*r,rng.uniform(.25,.62)*radius*2))
        base=Vector((top.x*.45,top.y*.45,0))
        batch.tube(base,top,.002,sides=4)
        for i in range(12):
            p=base.lerp(top,(i+1)/12)
            angle=az+i*2.4;length=rng.uniform(.045,.09)
            batch.leaf(p,(math.cos(angle)*length,math.sin(angle)*length,.012),length*.18,rng.randrange(len(mats)))
        if flowers:
            for h in range(5):
                p=top+Vector((0,0,h*.018))
                for petal in range(4):
                    angle=petal*math.pi/2
                    blooms.leaf(p,(math.cos(angle)*.025,math.sin(angle)*.025,.018),.011,rng.randrange(len(flowers)))
    batch.object(f'Exterior_Shrub_{index:02d}',parent,mats)
    if flowers:blooms.object(f'Exterior_Lavender_{index:02d}',parent,flowers)
    animate(parent,'rotation_euler',[(f,(.012*math.sin((f-1)/(END-1)*math.tau*5+index),.006*math.sin((f-1)/(END-1)*math.tau*3+index),0)) for f in range(1,END+1,4)],f'Ambient_Exterior_Planting_{index:02d}')


def underplant(root,mats,rng):
    ferns=Batch();grasses=Batch()
    for x,y in [(-3.9,6.4),(-2.9,7.7),(-2.3,8.6),(-3.7,9.4),(-1.1,9.8),(-.7,6.7),(.55,7.9),(1.8,8.3),(2.4,9.5),(.25,9.4)]:
        for frond in range(9):
            angle=rng.uniform(0,math.tau);length=rng.uniform(.32,.62)
            direction=Vector((math.cos(angle),math.sin(angle),0))
            origin=Vector((x,y,.20))
            def spine(t):return origin+direction*length*t+Vector((0,0,length*.65*math.sin(t*2.3)))
            for j in range(11):
                t=.08+j*.08;p=spine(t)
                ferns.tube(spine(max(0,t-.08)),p,.0014,sides=3)
                for sign in (-1,1):
                    side=Vector((-direction.y,direction.x,.1))*sign
                    d=(side*.78+direction*.4)*(math.sin(t*math.pi)**.6)*length*.22
                    ferns.leaf(p,d,d.length*.15,rng.randrange(len(mats)))
        for blade in range(35):
            angle=rng.uniform(0,math.tau);length=rng.uniform(.12,.34)
            grasses.blade((x+rng.uniform(-.10,.10),y+rng.uniform(-.10,.10),.19),(math.cos(angle)*length*.6,math.sin(angle)*length*.6,length),.004,rng.randrange(len(mats)))
    ferns.object('Exterior_Fern_Underplanting',root,mats)
    grasses.object('Exterior_Ornamental_Grasses',root,mats)


def portal():
    mat=bpy.data.materials.get('MAT_Garden_Portal_Holdout') or bpy.data.materials.new('MAT_Garden_Portal_Holdout')
    mat.use_nodes=True;mat.node_tree.nodes.clear()
    out=mat.node_tree.nodes.new('ShaderNodeOutputMaterial');hold=mat.node_tree.nodes.new('ShaderNodeHoldout')
    mat.node_tree.links.new(hold.outputs[0],out.inputs['Surface'])
    for name,x0,x1,z0,z1 in [('Left',-80,-4.48,-80,80),('Right',-.32,80,-80,80),('Below',-4.48,-.32,-80,1.9),('Above',-4.48,-.32,4.73,80)]:
        mesh=bpy.data.meshes.new('Garden_Aperture_'+name)
        mesh.from_pydata([(x0,5.14,z0),(x1,5.14,z0),(x1,5.14,z1),(x0,5.14,z1)],[],[(0,1,2,3)])
        obj=bpy.data.objects.new('SHADOW_Garden_Portal_'+name,mesh);bpy.context.scene.collection.objects.link(obj)
        mesh.materials.append(mat)
        obj.visible_shadow=False;obj.visible_diffuse=False;obj.visible_glossy=False
        obj.hide_set(True)


def combine_static(root):
    # Preserve loose stone/slat geometry while avoiding a draw call per piece.
    for prefix in ('Exterior_Wall_Stone_', 'Exterior_Bench_Seat_', 'Exterior_Bench_Back_'):
        parts=[o for o in root.children if o.type=='MESH' and o.name.startswith(prefix)]
        groups={mat:[o for o in parts if o.data.materials[0]==mat] for mat in {o.data.materials[0] for o in parts}}
        for group in groups.values():
            count=sum(o.get('garden_piece_count',1) for o in group)
            if len(group)==1:continue
            bpy.ops.object.select_all(action='DESELECT')
            for obj in group:obj.select_set(True)
            bpy.context.view_layer.objects.active=group[0]
            bpy.ops.object.join()
            group[0]['garden_piece_count']=count


def compose_window_views():
    """Arrange existing assets for both the oblique overview and desk cameras.

    Their window rays land on different ground areas. Keep both areas green;
    small mulch pockets stay underneath plants, with the path at the left edge.
    This is also an idempotent layout pass for the live, editable Blender scene.
    """
    root=bpy.data.objects['Exterior_Garden']
    anchors={o.name:o.matrix_world.copy() for o in bpy.context.scene.objects if o.name.startswith(('CAM_','INT_','CTL_'))}
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith('Exterior_Planting_Bed_') or obj.name in ('Exterior_Fern_Underplanting','Exterior_Ornamental_Grasses'):
            bpy.data.objects.remove(obj,do_unlink=True)
    positions=[(-3.8,6.9,.4),(-2.65,7.3,.38),(-1.7,7.85,.44),(-.15,6.45,.39),(.9,7.6,.45),(1.5,8.65,.42),(-.2,9.1,.65),(2.5,9.6,.7)]
    soil=bpy.data.materials['MAT_Garden_Soil']
    for i,(x,y,r) in enumerate(positions):
        parent=bpy.data.objects[f'Exterior_Planting_{i:02d}'];parent.location=(x,y,.2)
        bed=Batch()
        bed.face([(math.cos(j*math.tau/16)*r*.62,math.sin(j*math.tau/16)*r*.62,-.004) for j in range(16)])
        bed.object(f'Exterior_Planting_Bed_{i:02d}',parent,[soil])
    for index,position,scale in [(0,(-3.25,6.95,.19),1.05),(5,(-.25,7.35,.19),.76)]:
        tree=bpy.data.objects[f'Exterior_Foliage_{index:02d}'];tree.location=position;tree.scale=(scale,)*3
    for obj in root.children:
        if obj.name.startswith('Exterior_Path_Stone_'):
            obj.location=(-2.2,1.1,0)
        if obj.name.startswith('Exterior_Bench_'):
            if 'garden_before_composition' not in obj:obj['garden_before_composition']=tuple(obj.location)
            obj.location=Vector(obj['garden_before_composition'])+Vector((-3.4,.2,0))
    underplant(root,[bpy.data.materials['MAT_Garden_Leaf_'+str(i)] for i in range(4)],random.Random(42))
    bpy.data.objects['EMIT_WindowView']['garden_composition']='lawn-and-layered-planting'
    bpy.context.view_layer.update()
    for name,before in anchors.items():
        assert all(abs(bpy.data.objects[name].matrix_world[i][j]-before[i][j])<1e-6 for i in range(4) for j in range(4)),name
    assert sum(o.get('botanical_leaf_count',0) for o in bpy.context.scene.objects)>12000
    print('[garden] camera composition: continuous lawn, compact mulch, layered planting, side path',flush=True)


def build():
    scene=bpy.context.scene;scene.frame_set(1)
    anchors={o.name:o.matrix_world.copy() for o in scene.objects if o.name.startswith(('CAM_','INT_','CTL_'))}
    root=bpy.data.objects.get('Exterior_Garden') or empty('Exterior_Garden')
    for obj in list(scene.objects):
        if (obj.name.startswith('Exterior_') and obj!=root) or obj.name.startswith('SHADOW_Garden_Portal_'):
            bpy.data.objects.remove(obj,do_unlink=True)
    rng=random.Random(821)
    sky=bpy.data.objects['EMIT_WindowView']
    mesh=bpy.data.meshes.new('Garden_Sky_Backdrop');mesh.from_pydata([(-16,22,-12),(20,22,-12),(20,22,16),(-16,22,16)],[],[(0,1,2,3)])
    mat=sky.data.materials[0];sky.data=mesh;mesh.materials.append(mat)
    sky['exterior_mode']='geometry';sky['garden_detail']='botanical';sky['exterior_surface']=True
    greens=[material('MAT_Garden_Leaf_'+str(i),c,.68) for i,c in enumerate([(.014,.040,.008),(.026,.064,.012),(.047,.091,.020),(.066,.105,.026)])]
    bark=textured('MAT_Garden_Bark',(.060,.044,.028),'bark')
    soil=textured('MAT_Garden_Soil',(.042,.029,.018),'soil')
    lawnmats=[material('MAT_Garden_Grass_'+str(i),c) for i,c in enumerate([(.026,.056,.010),(.047,.077,.018),(.083,.092,.029)])]
    turf=textured('MAT_Garden_Turf',(.043,.067,.015),'lawn')
    stone=[textured('MAT_Garden_Limestone_'+str(i),c,'stone') for i,c in enumerate([(.19,.178,.15),(.24,.225,.19),(.15,.146,.125)])]
    purple=[material('MAT_Garden_Lavender_'+str(i),c) for i,c in enumerate([(.058,.035,.085),(.11,.073,.14),(.18,.13,.20)])]
    earth=Batch()
    def ground(x,y):return .18+.008*math.sin(x*3+y)*math.sin(y*2.7)
    for ix in range(44):
        for iy in range(26):
            x=-6+ix*.25;y=5.3+iy*.25
            earth.face([(a,b,ground(a,b)) for a,b in [(x,y),(x+.25,y),(x+.25,y+.25),(x,y+.25)]])
    earth.object('Exterior_Lawn_Ground',root,[turf])
    blades=Batch()
    for i in range(17000):
        x=rng.uniform(-5.7,4.6);y=rng.uniform(5.5,11.3)
        pathx=-2.5+(y-5.5)*.31+.13*math.sin(y*1.3)
        if abs(x-pathx)<.34:continue
        for j in range(2):
            h=rng.uniform(.025,.065);w=rng.uniform(.001,.002)
            blades.blade((x+rng.uniform(-.02,.02),y,ground(x,y)),(rng.uniform(-.018,.018),rng.uniform(-.018,.018),h),w,rng.randrange(3))
    blades.object('Exterior_Grass_Blades',root,lawnmats)
    for i in range(11):
        y=5.6+i*.47;x=-2.5+(y-5.5)*.31+.13*math.sin(y*1.3)
        paver=Batch();outline=[]
        for j in range(7):
            angle=j*math.tau/7+rng.uniform(-.10,.10)
            outline.append((x+math.cos(angle)*rng.uniform(.26,.33),y+math.sin(angle)*rng.uniform(.17,.21)))
        paver.face([(a,b,.21+rng.uniform(-.003,.003)) for a,b in outline])
        for j in range(7):
            a,b=outline[j];c,d=outline[(j+1)%7]
            paver.face([(a,b,.18),(c,d,.18),(c,d,.21),(a,b,.21)])
        p=paver.object(f'Exterior_Path_Stone_{i:02d}',root,[stone[i%3]])
        mod=p.modifiers.new('Chipped stone edges','BEVEL');mod.width=.006;mod.segments=2
    mortar=textured('MAT_Garden_Mortar',(.09,.084,.068),'soil')
    box('Exterior_Garden_Wall_Mortar',root,(-.6,10.65,.83),(10.5,.24,1.3),mortar)
    for row in range(8):
        x=-5.9;col=0
        while x<4.6:
            width=rng.uniform(.22,.65)
            obj=box(f'Exterior_Wall_Stone_{row:02d}_{col:02d}',root,(x+width/2,10.49+rng.uniform(-.015,.015),.27+row*.155),(width-.014,.14,rng.uniform(.129,.143)),stone[rng.randrange(3)],.009)
            obj.rotation_euler.y=rng.uniform(-.018,.018)
            x+=width;col+=1
    box('Exterior_Garden_Wall_Coping',root,(-.6,10.65,1.51),(10.6,.42,.12),stone[1],.03)
    for side in (0,1):
        bed=Batch();points=[]
        for i in range(23):
            y=5.7+i*.21
            x=(-3.3 if side==0 else -.55)+.22*math.sin(y*1.2)+.12*math.cos(y*2.1)
            points.append((x,y,.19))
        edge=-5.8 if side==0 else 4.6
        bed.face([(edge,5.7,.19),*points,(edge,10.32,.19)])
        bed.object(f'Exterior_Planting_Bed_{side:02d}',root,[soil])
    for i,(x,y,r) in enumerate([(-4.4,6.4,.4),(-3.9,7.4,.38),(-3.35,8.45,.44),(-.05,6.9,.39),(.3,7.65,.45),(1.1,8.6,.42),(-4.1,9.4,.65),(1.7,9.7,.7)]):
        shrub(root,i,(x,y,.2),r,greens,rng,purple if i%2==0 else None)
    tree(root,0,(-3.8,6.7,.19),.86,greens,bark,rng)
    tree(root,5,(.8,8.5,.19),1.1,greens,bark,rng)
    underplant(root,greens,random.Random(42))
    wood=textured('MAT_Garden_Weathered_Wood',(.095,.074,.048),'wood')
    metal=material('MAT_Garden_Bench_Iron',(.025,.03,.025),.5)
    for i in range(5):box(f'Exterior_Bench_Seat_{i}',root,(-.1,9.3+i*.085,.67),(1.55,.067,.055),wood,.012)
    for i in range(4):box(f'Exterior_Bench_Back_{i}',root,(-.1,9.71,.85+i*.10),(1.55,.055,.075),wood,.012)
    for x in (-.70,.50):
        box('Exterior_Bench_Leg',root,(x,9.38,.43),(.055,.4,.48),metal,.009)
    combine_static(root)
    compose_window_views()
    portal()
    for mat in {m for obj in scene.objects if obj.get('exterior_surface') and obj.type=='MESH' for m in obj.data.materials}:
        aperture_material(mat)
    sky['garden_finish']='natural-stone-and-turf'
    scene.frame_set(1);bpy.context.view_layer.update()
    for name,before in anchors.items():
        assert all(abs(bpy.data.objects[name].matrix_world[i][j]-before[i][j])<1e-6 for i in range(4) for j in range(4)),name
    leaves=sum(o.get('botanical_leaf_count',0) for o in scene.objects)
    assert leaves>12000 and not any(o.name.startswith('Exterior_Canopy_') for o in scene.objects)
    scene['garden_leaf_count']=leaves
    print(f'[garden] {leaves} individual leaves, stone path, lawn, beds, masonry wall and bench',flush=True)


if __name__=='__main__':
    for filename in ('portfolio-room.blend','portfolio-room-optimized.blend'):
        path=ROOT/'assets/blender/refined'/filename
        bpy.ops.wm.open_mainfile(filepath=str(path));build()
        bpy.ops.wm.save_as_mainfile(filepath=str(path))

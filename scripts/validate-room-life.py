"""Validate the actual Blender geometry and authored animation states before export."""
from pathlib import Path
import json
import bpy
import bmesh
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene
scene.frame_set(1)
slat=bpy.data.objects['Blind_Slat_37']
assert abs(slat.matrix_world.translation.x+2.4)<1e-4 and abs(slat.matrix_world.translation.y-4.925)<1e-4, 'Blind shifted horizontally after breeze parenting'
wall=bpy.data.objects['Wall_Continuous']
bm=bmesh.new()
bm.from_mesh(wall.data)
assert all(edge.is_manifold for edge in bm.edges), 'Open or split wall corner'
bm.free()
background=bpy.data.objects['EMIT_WindowView']
points=[background.matrix_world@Vector(corner) for corner in background.bound_box]
assert max(point.z for point in points)<4.6, 'Garden image rises beyond the window'
assert max(point.x for point in points)<0, 'Garden image extends toward the right corner'
assert max(point.y for point in points)<6, 'Garden image is too far behind the wall'
for name in ('Blind_Slat_37','Blind_Cord_01'):
    obj=bpy.data.objects[name]
    scene.frame_set(1)
    before=obj.matrix_world.copy()
    scene.frame_set(23)
    assert any(abs(obj.matrix_world[i][j]-before[i][j])>.01 for i in range(4) for j in range(4)), f'Missing day/night animation: {name}'
assert not bpy.data.objects.get('Exterior_Bird'), 'Legacy bird still exists'
foliage=bpy.data.objects['Exterior_Foliage_00']
scene.frame_set(1)
assert abs(foliage.rotation_euler.y)<1e-6
scene.frame_set(157)
assert abs(foliage.rotation_euler.y)>.005
card=bpy.data.objects['Phone_Notification_0']
scene.frame_set(1)
assert card.scale.x>.9, 'Rest pose must retain one readable notification'
scene.frame_set(178)
assert card.scale.x>.9
before=card.location.y
scene.frame_set(185)
assert card.location.y<before, 'Notification should settle smoothly into its slot'
for frame in range(1,770,7):
    scene.frame_set(frame)
    assert .05<=card.location.x<=.07 and .44<=card.location.y<=.48, 'Notification escapes its display slot'
mask=bpy.data.objects['Editor_monitor_TypingMask']
scene.frame_set(100)
assert mask.scale.x>.9
scene.frame_set(400)
assert mask.scale.x<.001
for frame,night in ((1,False),(23,True)):
    scene.frame_set(frame)
    assert bpy.data.objects['Editor_monitor_day'].hide_render==night
    assert bpy.data.objects['Editor_monitor_night'].hide_render!=night
    assert bpy.data.objects['Editor_monitor_day'].hide_viewport==night
    assert bpy.data.objects['Editor_monitor_night'].hide_viewport!=night
assert bpy.data.objects['Bookshelf_Carcass'].get('corner_repaired')
power=bpy.data.objects['EMIT_Controller_Power']
node=next(node for node in power.data.materials[0].node_tree.nodes if node.type=='BSDF_PRINCIPLED')
scene.frame_set(130)
on=node.inputs['Emission Strength'].default_value
scene.frame_set(139)
assert node.inputs['Emission Strength'].default_value<on/5
curves=[json.loads(obj['blender_emission']) for obj in scene.objects if 'blender_emission' in obj]
assert len(curves)>80
for curve in curves:
    assert curve['base']>0 and curve['fps']==24
    assert curve['keys'][0][0]==1 and curve['keys'][-1][0]==769
    assert abs(curve['keys'][0][1]-curve['keys'][-1][1])<1e-4
scene.frame_set(1)
report={'source':bpy.data.filepath,'wall_manifold':True,'background_top':max(point.z for point in points),
        'emission_curves':len(curves),'checks':['blind day/night','cord day/night','foliage wind','phone alignment and settling','screen typing','editor themes','bookshelf corner','controller blink','loop endpoints']}
(ROOT/'assets/reviews/room-refined-animation-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('[validate] '+json.dumps(report),flush=True)

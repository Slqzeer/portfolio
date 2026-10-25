"""Export the optimized room to the runtime GLB (headless).

Run: blender -b assets/blender/refined/portfolio-room-optimized.blend --python scripts/export-room-glb.py
Removes the Blender-only shadow blockers, then exports cameras, punctual lights, extras, actions,
and both UV sets (TEXCOORD_0 = material UVs, TEXCOORD_1 = `Lightmap`) with WebP textures.
Meshes are Draco-compressed (14-bit UVs keep lightmap texels exact); the decoder ships in public/draco/.
glTF cannot carry procedural shaders, so procedural base colors are baked to textures first; the
exporter writes the sheen tint without its weight, so the weight is folded into the tint.
"""
import os
import json
import sys

import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
output = os.path.join(root, "public", "assets", "room", "portfolio-room.glb")
if '--' in sys.argv:
    output = os.path.abspath(sys.argv[sys.argv.index('--')+1])
os.makedirs(os.path.dirname(output), exist_ok=True)
scene = bpy.data.scenes["PortfolioRoom"]
for obj in [o for o in scene.objects if o.name.startswith("SHADOW_")]:
    bpy.data.objects.remove(obj)
# Blender clips camera rays in its materials; the runtime uses the same aperture
# in GLSL. Export the original PBR surface, not the Blender-only ray nodes.
for mat in bpy.data.materials:
    if mat.get('garden_window_aperture'):
        nodes=mat.node_tree.nodes
        bsdf=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
        surface_output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL')
        mat.node_tree.links.new(bsdf.outputs['BSDF'],surface_output.inputs['Surface'])
for obj in scene.objects:
    if obj.type == "MESH" and "Lightmap" in obj.data.uv_layers:
        obj.data.uv_layers[0].active_render = True
        obj.data.uv_layers.active = obj.data.uv_layers[0]

BAKED_BASE_COLORS = {"MAT_Review_Floor_LightWood": 4096, "MAT_Review_Desk_Wood": 2048, "MAT_Sofa_Fabric": 2048, "MAT_Rug_Wool": 2048}
scene.render.engine = "CYCLES"
scene.cycles.samples = 1
for name, size in BAKED_BASE_COLORS.items():
    material = bpy.data.materials[name]
    nodes = material.node_tree.nodes
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    image = bpy.data.images.new(f"TEX_{name[4:]}", size, size)
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.image = image
    nodes.active = image_node
    users = [o for o in scene.objects if o.type == "MESH" and material.name in o.data.materials]
    bpy.ops.object.select_all(action="DESELECT")
    for obj in users:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = users[0]
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, margin=8)
    image.pack()
    material.node_tree.links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
    print(f"[export] baked {name} -> {image.name} ({size}px, {len(users)} mesh)", flush=True)
    # Procedural bump is otherwise lost in glTF: retain Blender's wood/fabric relief.
    if bsdf.inputs["Normal"].is_linked:
        normal = bpy.data.images.new(f"TEX_{name[4:]}_Normal", min(size, 2048), min(size, 2048))
        normal.colorspace_settings.name = 'Non-Color'
        normal_image = nodes.new('ShaderNodeTexImage')
        normal_image.image = normal
        nodes.active = normal_image
        bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', margin=8)
        normal.pack()
        normal_map = nodes.new('ShaderNodeNormalMap')
        material.node_tree.links.new(normal_image.outputs['Color'], normal_map.inputs['Color'])
        material.node_tree.links.new(normal_map.outputs['Normal'], bsdf.inputs['Normal'])
        print(f"[export] retained Blender bump for {name}", flush=True)
for material in bpy.data.materials:
    bsdf = material.node_tree and next(
        (n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None
    )
    if bsdf and bsdf.inputs["Sheen Weight"].default_value > 0:
        weight = bsdf.inputs["Sheen Weight"].default_value
        tint = bsdf.inputs["Sheen Tint"].default_value
        bsdf.inputs["Sheen Tint"].default_value = (*(c * weight for c in tint[:3]), 1)
        bsdf.inputs["Sheen Weight"].default_value = 1
scene.frame_set(1)
for obj in scene.objects:
    curve = json.loads(obj['blender_emission']) if obj.get('blender_emission') else None
    if curve and curve.get('trigger') == 'focus':
        # Export the rated colour; the web mixer samples the authored off/start/on curve.
        tree = obj.data.materials[0].node_tree
        tree.animation_data_clear()
        next(n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Emission Strength'].default_value = curve['base']
# Both Blender-authored themes must travel in the GLB. The website selects the
# matching surface; hide_render drivers are only for reviewing/baking in Blender.
for obj in scene.objects:
    if obj.get('screen_theme'):
        obj.animation_data_clear()
        obj.hide_render = False
        obj.hide_viewport = False
    if obj.get('device_hidden_base'):
        obj.hide_render = False
        obj.hide_viewport = False
bpy.ops.export_scene.gltf(
    filepath=output,
    export_format="GLB",
    use_active_scene=True,
    export_apply=True,
    export_texcoords=True,
    export_cameras=True,
    export_lights=True,
    export_extras=True,
    export_animations=True,
    # Cyclic idle clips must rest at frame 1, rather than one sample before the loop.
    export_current_frame=True,
    export_frame_range=False,
    export_animation_mode="ACTIONS",
    export_image_format="WEBP",
    export_image_quality=95,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=14,
)
import runpy
sync = runpy.run_path(os.path.join(root, 'scripts', 'sync-curtain-clips.py'))
sync['sync_curtain_clips'](output)
print("[export] done", flush=True)

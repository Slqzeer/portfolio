"""Export the optimized room to the runtime GLB (headless).

Run: blender -b assets/blender/portfolio-room-optimized.blend --python scripts/export-room-glb.py
Removes the Blender-only shadow blockers, then exports cameras, punctual lights, extras, actions,
and both UV sets (TEXCOORD_0 = material UVs, TEXCOORD_1 = `Lightmap`) with WebP textures.
Meshes are Draco-compressed (14-bit UVs keep lightmap texels exact); the decoder ships in public/draco/.
"""
import os

import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scene = bpy.data.scenes["PortfolioRoom"]
for obj in [o for o in scene.objects if o.name.startswith("SHADOW_")]:
    bpy.data.objects.remove(obj)
for obj in scene.objects:
    if obj.type == "MESH" and "Lightmap" in obj.data.uv_layers:
        obj.data.uv_layers[0].active_render = True
        obj.data.uv_layers.active = obj.data.uv_layers[0]
scene.frame_set(1)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(root, "public", "assets", "room", "portfolio-room.glb"),
    export_format="GLB",
    use_active_scene=True,
    export_apply=True,
    export_texcoords=True,
    export_cameras=True,
    export_lights=True,
    export_extras=True,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_image_format="WEBP",
    export_image_quality=88,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=14,
)
print("[export] done", flush=True)

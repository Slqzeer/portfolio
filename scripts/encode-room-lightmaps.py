"""Encode baked HDR lightmaps (EXR) into 8-bit sRGB PNGs for the web.

Run: blender -b --python scripts/encode-room-lightmaps.py
Each texel is divided by a per-map scale (the 99.5th percentile, so highlights don't crush the rest)
and stored sRGB-encoded; the runtime decodes sRGB -> linear and multiplies by `lightMapIntensity = scale`.
Scales are written to lightmaps/scales.json.
"""
import json
import os
import sys

import bpy
import numpy as np

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, "assets", "blender", "living", "lightmaps")
if "--" in sys.argv:
    src = os.path.abspath(sys.argv[sys.argv.index("--") + 1])
runtime = os.path.join(root, "public", "assets", "room", "lightmaps")
if '--' in sys.argv and len(sys.argv)>sys.argv.index('--')+2:
    runtime=os.path.abspath(sys.argv[sys.argv.index('--')+2])
os.makedirs(runtime,exist_ok=True)
scales = {}
for name in sorted(f[:-4] for f in os.listdir(src) if f.endswith(".exr") and not f.endswith("_dn.exr")):
    denoised = os.path.join(src, name + "_dn.exr")
    img = bpy.data.images.load(denoised if os.path.exists(denoised) else os.path.join(src, name + ".exr"))
    # Furniture contact shadows need 4K; the simpler shell stays at 2K.
    maximum = 4096 if name.startswith('LM_props_') else 2048
    if max(img.size) > maximum:
        factor = maximum / max(img.size)
        img.scale(round(img.size[0] * factor), round(img.size[1] * factor))
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    rgb = px.reshape(h, w, 4)[..., :3]
    lum = rgb.max(axis=2)
    covered = lum > 1e-5
    scale = float(np.percentile(lum[covered], 99.5)) if covered.any() else 1.0
    v = np.clip(rgb / scale, 0, 1)
    srgb = np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
    out = bpy.data.images.new(name + "_8bit", w, h, alpha=False)
    out.colorspace_settings.name = "Non-Color"
    flat = np.dstack([srgb, np.ones((h, w))]).astype(np.float32).ravel()
    out.pixels.foreach_set(flat)
    out.filepath_raw = os.path.join(src, name + ".png")
    out.file_format = "PNG"
    out.save()
    formats = bpy.types.Image.bl_rna.properties["file_format"].enum_items
    out.file_format = next(item.identifier for item in formats if item.identifier.lower() == "webp")
    out.filepath_raw = os.path.join(runtime, name + ".webp")
    out.save()
    scales[name] = round(scale, 5)
    print(f"[encode] {name} {w}x{h} scale={scale:.4f} coverage={covered.mean():.2%}", flush=True)
with open(os.path.join(src, "scales.json"), "w") as f:
    json.dump(scales, f, indent=2)
    f.write("\n")
with open(os.path.join(runtime, "scales.json"), "w") as f:
    json.dump(scales, f, indent=2)
    f.write("\n")

"""Encode baked HDR lightmaps (EXR) into 8-bit sRGB PNGs for the web.

Run: blender -b --python scripts/encode-room-lightmaps.py
Each texel is divided by a per-map scale (the 99.5th percentile, so highlights don't crush the rest)
and stored sRGB-encoded; the runtime decodes sRGB -> linear and multiplies by `lightMapIntensity = scale`.
Scales are written to lightmaps/scales.json.
"""
import json
import os

import bpy
import numpy as np

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, "assets", "blender", "lightmaps")
scales = {}
for name in sorted(f[:-4] for f in os.listdir(src) if f.endswith(".exr") and not f.endswith("_dn.exr")):
    denoised = os.path.join(src, name + "_dn.exr")
    img = bpy.data.images.load(denoised if os.path.exists(denoised) else os.path.join(src, name + ".exr"))
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
    scales[name] = round(scale, 5)
    print(f"[encode] {name} {w}x{h} scale={scale:.4f} coverage={covered.mean():.2%}", flush=True)
with open(os.path.join(src, "scales.json"), "w") as f:
    json.dump(scales, f, indent=2)

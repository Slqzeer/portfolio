"""Replace TEX_Rug_Wool with a seamless 1024² tile repeated 4 × 3 over the rug.

The old texture was 1024 × 768 per-pixel noise stretched over the 6.4 × 4.7 m rug (6 mm
"tufts"), so close-ups showed square pixels. The tile keeps its colour, mottling and grain
contrast (measured from the old image) but is FFT-filtered noise, which tiles seamlessly.
Run on the master and the optimized blend (same rug), then re-export:
  blender -b assets/blender/refined/portfolio-room.blend --python scripts/rebuild-rug-texture.py
  blender -b assets/blender/refined/portfolio-room-optimized.blend --python scripts/rebuild-rug-texture.py
"""
import bpy
import numpy as np

SIZE = 1024
REPEAT = (4, 3)  # tile ≈ 1.6 m, grain ≈ 2.5 mm
rng = np.random.default_rng(7)

old = bpy.data.images["TEX_Rug_Wool"]
if old.get("tiled"):
    raise SystemExit("[rug] already rebuilt")
w, h = old.size
px = np.empty(w * h * 4, np.float32)
old.pixels.foreach_get(px)
rgb = px.reshape(h, w, 4)[..., :3]  # linear


def blur(a, sigma):
    f = np.fft.fftfreq(a.shape[0])[:, None] ** 2 + np.fft.fftfreq(a.shape[1])[None, :] ** 2
    k = np.exp(-2 * (np.pi * sigma) ** 2 * f)
    return np.stack([np.fft.ifft2(np.fft.fft2(a[..., c]) * k).real for c in range(a.shape[2])], -1)


low = blur(rgb, 24)
mean = rgb.mean((0, 1))
low_std = (low - mean).std((0, 1))
high_std = (rgb - low).std((0, 1))


def band_noise(sigma_px, size=SIZE):
    """Periodic gaussian-filtered noise, unit std."""
    n = blur(rng.standard_normal((size, size, 1)), sigma_px)[..., 0]
    return (n - n.mean()) / n.std()


# mottling: same scale in metres as before (the tile is 1/4 of the rug wide)
mottle = band_noise(24 * SIZE / w / REPEAT[0] * 4)
grain = band_noise(0.8)
fibre = band_noise(0.6)  # a little independent chroma, like heathered wool
tile = (mean + mottle[..., None] * low_std + grain[..., None] * high_std
        + fibre[..., None] * high_std * np.array([0.15, 0.1, -0.1]))
tile = np.clip(tile, 0, 1)

new = bpy.data.images.new("TEX_Rug_Wool_Tile", SIZE, SIZE)
new.colorspace_settings.name = old.colorspace_settings.name
new.pixels.foreach_set(np.dstack([tile, np.ones((SIZE, SIZE))]).astype(np.float32).ravel())
new.pack()
old.user_remap(new)
bpy.data.images.remove(old)
new.name = "TEX_Rug_Wool"
new["tiled"] = True

me = bpy.data.objects["Rug"].data
uv = me.uv_layers["UVMap"].data
for loop in uv:
    loop.uv = (loop.uv[0] * REPEAT[0], loop.uv[1] * REPEAT[1])
print(f"[rug] mean {mean.round(3)} mottle {low_std.round(3)} grain {high_std.round(3)}", flush=True)
bpy.ops.wm.save_mainfile()

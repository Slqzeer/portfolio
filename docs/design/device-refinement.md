# Device surfaces and exterior refinement

19 October 2026. Assets are authored and reviewed in Blender before integration.

The current editable and optimized sources are in `assets/blender/refined/`.
The earlier `living` sources remain intact. `surfaces/` contains the reproducible
editor, lock-screen and notification artwork packed into both new blends.

## Result

- Monitor and laptop use complete VS Code-style workspaces in the site's cream/green
  and dark green palettes. No floating terminal or legacy text overlays remain.
- Blender authors the final code line's character-by-character reveal, cursor and
  subsequent terminal results. Focus pauses those clips and hides their masks,
  exposing complete, stable code. Leaving focus resumes at the saved clip time.
- Theme selection changes the exported surfaces and mask colours independently of
  animation time. Reduced motion shows the completed workspace and one phone card.
- Phone surfaces use an affine fit of all UV samples, including rounded corners.
  Each notification includes its own aligned artwork and stays within one slot;
  the lock-screen background contains no competing painted notifications.
- Layered foliage replaces the bird and tall sparse stems. Its intermittent breeze
  is authored in Blender and stops at night.
- Bookshelf side panels meet the underside of the top board instead of overlapping
  its exposed corners. The optimized model retains its bevel geometry.

## Reproduction

1. `node scripts/draw-device-surfaces.mjs` generates the bitmap UI artwork.
2. `blender -b --threads 4 --python scripts/refine-device-assets.py` builds both
   refined sources from the preserved living sources.
3. Run `scripts/validate-room-life.py` on the optimized blend. Run
   `scripts/review-device-assets.py` on a refined blend, optionally with
   `-- monitor phone shelf window` or `-- night monitor phone`, and inspect the PNGs.
4. Export the optimized blend with `scripts/export-room-glb.py -- <staging GLB>`.
   Both themes are included; Blender's render-visibility drivers are cleared only
   in the disposable export process. The browser selects meshes using their extras.
5. Bake both lighting states with `scripts/bake-room-lightmaps.py`. Denoise with
   `scripts/denoise-room-lightmaps.py -- assets/blender/refined/lightmaps`, then encode
   with `scripts/encode-room-lightmaps.py -- assets/blender/refined/lightmaps <staging lightmaps>`.
6. Render reflection probes with `scripts/render-room-env.py -- <staging env>` and
   overview PNGs with `scripts/render-room-posters.py -- <staging root>`.
7. Integrate the staged GLB, lighting maps and calibration, reflection probes and
   overview PNGs together into `public/assets/room/`.

The GLB contract checks both editor surfaces and their artwork, authored clips,
the corner repair, legacy-layer removal, and the original camera/control contract.
Runtime tests cover theme changes, focus pause/resume, and reduced motion.

## Validation

Build and GLB contract passed, with 126 unit tests and all 16 browser scenarios
verified across the main run and targeted reruns. Nine desktop/mobile visual
cases report no JavaScript errors or horizontal overflow. All ten integrated
runtime files match their staged exports by SHA-256; the scene contains 343
nodes and 72 clips. Reports and screenshots are in `assets/reviews/room-refined-*`.

Physical mobile-device performance was not benchmarked. Changes are local;
production deployment was not performed.

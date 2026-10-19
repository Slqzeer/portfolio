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

## Controller and transparent details follow-up

Both refined Blender sources place the controller's emissive status ring around
its existing centre button. `controller_status()` in the refinement script
reproduces the placement and size; the source and GLB validators enforce it.
The GLB and both overview posters were re-exported. Existing lightmaps and
reflection probes are retained: the casing, UVs, room geometry and lighting
remain unchanged; only the small emissive ring moved.

The controller now has a clickable dot on desktop and mobile. Detail cards keep
their opaque theme surface, rounded corners, border and shadow. The rectangular
area behind each card is transparent so the room is visible around its edges.
The room renders behind them, while an
invisible `.room-frame` reserves the clear area for camera framing and shares
the slide animation's clock. Cards use the site's normal day/night text palette.

Build, Blender checks, GLB contract, 128 unit tests and six focused browser cases
pass. Browser coverage includes controller clicks in both themes at 1440px and
390px, closing back to the room, and synchronised panel/camera transitions at
both widths. Visual evidence and hashes are in `assets/reviews/controller-details-check.json`
and `room-controller-panel-*`. Browser checks used Chromium with GPU rendering;
the software-rendered headless shell timed out. Physical phones were not tested.

## Focus startup and project previews

The refined blends now contain a 16-second continuous foliage/breeze cycle and
`Focus_controller`, a one-second startup gesture. The controller's shader curve
uses `trigger: "focus"`: the browser keeps it off during overview and camera
travel, plays startup on arrival, and holds its final glow until focus ends.
Reduced motion applies the final on/off state immediately. The blind retains
its authored poses and easing with a 1.4Ã— travel duration; exterior materials
fade to a cooler night palette with the room lighting.

Run `scripts/upgrade-room-motion.py` in background Blender to reproduce these
changes in both refined sources and copy the affected clips into the GLB.
The existing geometry, camera anchors, lightmaps and reflections are retained.
The exporter keeps the controller's rated colour available for focus playback;
overview posters explicitly keep that focus-only light off.

Project screenshots live in `public/assets/projects/` and are declared with
bilingual descriptions in `portfolioContent.ts`. ClassPulse uses the supplied
`assets/project/classpulse/homepage.png` and a session capture from its local
project's `docs/screenshots/03-session-question.png`. Portfolio screenshots are
captured from the running site with `node scripts/capture-project-previews.mjs <local URL>`.
Category/project selection reveals the selected project's images; numbered
controls switch captures and update both themed monitor surfaces in 3D.
Leaving monitor focus restores the editor artwork. Image loads cancelled by
rapid selection cannot overwrite the latest preview, and their textures are
disposed when released.

## Blender garden and window visibility

`scripts/replace-window-garden.py` authors the garden in both refined Blender
sources. The master is open in the live Blender session. The garden has two
branching trees with curved oval leaves, lavender, ferns, ornamental grasses,
curved soil beds, a textured lawn, irregular flagstones, weathered limestone
masonry and a slatted wooden bench. Packed colour and normal textures travel
with the GLB. Static masonry and bench slats are joined by material while
retaining their editable loose mesh parts.

The 60,118 leaf/grass shapes replace the spherical canopies, cloud props,
scenery photograph and vines. Tree and planting wind remains authored as
32-second Blender actions, pauses at night and in hidden tabs, and rests for
reduced motion. The room's original interaction and camera anchors are checked
before saving.

Every exterior material clips camera rays against the window aperture in
Blender, including the material viewport. Rejected rays use holdout shading to
avoid black specks from transparency bounce limits in dense foliage. A camera
outside the window plane cannot see the garden. The website applies the same
ray/aperture test from the renderer's current camera matrices, so transitions
have no stale camera uniforms. It supports orthographic and perspective views.
The exporter strips the Blender-only ray nodes and preserves the PBR textures.
glTF multi-material groups carry the exterior tag on their parent, so room
preparation propagates it to every child primitive before selecting lighting
and applying the aperture. The browser test renders the actual exported garden
through that preparation path, in addition to checking the shader in isolation.

Run `scripts/review-botanical-garden.py` for the native inspection and through-
window images. `scripts/validate-garden-visibility.py` tests the materials alone
with the room and holdout cards hidden: the window view is opaque, while views
beside the window and outside the room have no garden pixels. The equivalent
browser test also checks both camera projections and a return to the window.
Overview posters and portfolio self screenshots use the exported garden.

The garden layout is composed for the actual overview, desk and monitor camera
rays. Broad soil strips are replaced by continuous lawn and compact mulch
pockets beneath plants. The lower tree canopy and staggered shrubs fill both
window views; the path and bench sit to the side. `compose_window_views()` can
update that arrangement in the live Blender scene without rebuilding the room
or changing its camera anchors.

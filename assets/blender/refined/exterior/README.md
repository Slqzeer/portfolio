# Botanical garden in Blender

The active garden is authored in `scripts/replace-window-garden.py` and saved in
both refined `.blend` files. The editable master is also open in the live Blender
session, with the viewport looking through the room camera.

The garden contains two trees with branching trunks and individual curved leaf
meshes, lavender, ferns, ornamental grasses, small mulch pockets, an irregular
flagstone path, a masonry boundary wall and a weathered wooden bench. Packed
colour and normal textures retain the turf, soil, stone, bark and wood detail
in Blender and the website. There are 60,118 individual leaf
and grass-blade shapes; no spherical canopy meshes or scenery photographs are
used. Static masonry and slats are joined by material for the web export, while
retaining loose editable geometry in Blender.

`compose_window_views()` places the planting for the different sightlines of
the default, desk and monitor cameras. Continuous lawn replaces the broad soil
strips, low tree foliage frames the window, and the path and bench sit to one
side. The room cameras themselves retain their original poses.

The garden occupies real depth outside the room. Camera-ray material masking
clips it to the window in Blender's material viewport and rendered cameras,
including cameras positioned outside the room. Four holdout surfaces also
preserve the transparent room silhouette. The web material applies the same
aperture using the renderer's camera matrices; it creates none of the assets.
Wind clips on the trees and planting beds are authored and editable in Blender.

Generate native Blender review images with `scripts/review-botanical-garden.py`.
Its exterior inspection image explicitly bypasses the mask without saving that
change. `scripts/validate-garden-visibility.py` render-tests the garden materials
alone from the window, beside it and outside the room. The browser equivalent
also tests orthographic/perspective cameras and returning to the window view.
`garden-day.png` is an unused earlier comparison asset.

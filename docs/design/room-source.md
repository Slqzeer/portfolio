# Interactive room source

Status: **implemented in Blender and exported as the runtime GLB**

## Visual reference

Penpot is the approved source of truth for room composition and interaction annotations.

- Instance: <https://penpot.taildf6cd4.ts.net>
- File ID: `222559c6-1a87-800d-8008-c3780ad3f78d`
- Page: `Portfolio — Pièce canonique` (`222559c6-1a87-800d-8008-c3780ad3f78e`)
- Board: `Canva — migration fidèle — 1920×1080` (`6b785803-9d96-8041-8008-c380eb623863`)
- Structure: Canva HD room asset, 95 editable native elements, and 6 semantic hotspots
- Source capture: `assets/references/canva-room-current.png`; HD room asset: `assets/references/canva-room.png`
- Updated composition asset: `assets/references/canva-room-updated.png`
- Reviewed Penpot board export: `assets/references/penpot-room.png` (1920×1080; SHA-256 `de0c56a2d603cf6845d85faf0dd315aa55ffdb11c28eeba6d8eb32fcb02c7ec3`)
- Dark composition asset: `assets/references/canva-room-updated-night.png`
- Dark composition board: `Canva — migration fidèle — mode sombre — 1920×1080` (`0e1dca44-00fb-8039-8008-c389fc1a4327`)
- Day/night board: `Canva — États jour / nuit — 1920×1080` (`0e1dca44-00fb-8039-8008-c386a24a79ef`), sourced from Canva page `PB0t5GKtxrdXyD6x`
- Interactive inventory board: `Canva — Inventaire interactif — 1920×1080` (`0e1dca44-00fb-8039-8008-c386a35ab053`), sourced from Canva page `PBxZGj9ln7xdLGlT`
- Source captures: `assets/references/canva-day-night-current.png` and `assets/references/canva-interactive-inventory-current.png`
- Review: structure and 1920×1080 PNG export verified on 2026-10-09
- Dark-state contract: curtains closed, natural light off, purple lamp on, transition metadata set to 900 ms
- Archive: the earlier schematic board is retained with the `ARCHIVE —` prefix

The original Canva exports remain as migration sources and visual receipts. Figma is no longer part of the production source chain.

## Production assets

- Editable master: `assets/blender/portfolio-room.blend`
- Web-optimized derivative: `assets/blender/portfolio-room-optimized.blend`
- Runtime scene: `public/assets/room/portfolio-room.glb`
- Loading posters: `public/assets/room/room-poster-day.webp` and `room-poster-night.webp`
- Overview camera: `CAM_Overview`
- Collections: `RoomShell`, `StaticDecor`, `InteractiveObjects`, `Controls`, `Lights`, `Animations`

The master preserves editable objects. The optimized derivative joins compatible static, single-material meshes while preserving every interactive node, control, camera anchor, light, and animated object. This reduced Blender mesh objects from 214 to 145; the runtime GLB contains 168 named nodes and weighs 2.26 MB.

## Stable scene contract

| Function | Mesh/control node | Camera anchor |
| --- | --- | --- |
| Monitor | `INT_Monitor` | `CAM_Anchor_Monitor` |
| Homelab | `INT_Homelab` | `CAM_Anchor_Homelab` |
| Diploma | `INT_Diploma` | `CAM_Anchor_Diploma` |
| Volleyball | `INT_Volleyball` | `CAM_Anchor_Volleyball` |
| Controller | `INT_Controller` | `CAM_Anchor_Controller` |
| Smartphone | `INT_Smartphone` | `CAM_Anchor_Smartphone` |
| Bookshelf | `INT_Bookshelf` | `CAM_Anchor_Bookshelf` |
| Contact card | `INT_ContactCard` | `CAM_Anchor_ContactCard` |
| Curtains | `CTL_Curtains` | none |
| Language flag | `CTL_Flag` | none |

Run `npm run assets:check` after any Blender export. The validator rejects missing or renamed contract nodes before deployment.

## Lighting and animation

Frame 1 is the day state: curtains open, daylight active, artificial lamps off. Frame 18 removes daylight without introducing light behind the curtains. Frame 24 closes the curtains and turns the lamp on. The flag and monitor cursor have subtle idle animation clips.

Export as GLB with transforms applied and cameras, lights, and animations enabled. Blender area lights are recreated by `RoomLighting` at runtime because glTF does not preserve them consistently.

## Validation snapshot

- Room floor: approved on 2026-10-10 from `assets/references/room_floor.png`; the Blender assembly has a 12.00 × 10.00 m light procedural wood surface at `z=0` over a 12.08 × 10.08 × 0.26 m dark base, with the former slab and twelve decorative plank-line meshes removed.
- Room walls: approved on 2026-10-10 from `assets/references/room_walls.png`; the Blender assembly is 12.00 × 10.00 × 5.80 m with full-length light baseboards, dark top/exposed-edge trim, and eight manifold box meshes under `Room_Walls` in `RoomShell`.
- Window: approved on 2026-10-10 from `assets/references/window.png`; the transparent two-pane assembly sits in a true wall opening, with its frame, sill, mullion, blind, and cords retained as separate editable parts. Accepted render: `assets/reviews/window-placement-overview.png`.
- Desk table: approved on 2026-10-10 from `assets/references/desk_table.png`; the seven-part light-wood and black-metal assembly measures 5.10 × 1.80 × 1.51 m at world location `(-2.35, 3.75, 0.00)` (shifted +0.40 m in x on 2026-10-11 so its left end sits just left of the window, matching Penpot; desk contents, monitor, smartphone, chair, and their camera anchors moved with it; accepted render `assets/reviews/desk-zone-shift-overview.png`). Accepted renders: `assets/reviews/desk-table-placement-local.png` and `assets/reviews/desk-table-placement-overview.png`.
- Office chair: model and placement approved on 2026-10-11 from `assets/references/office_chair.png`; 45-part black assembly under `ASSET_OfficeChair` (rounded molded back frame, opaque perforated mesh, T lumbar, S-curve spine, T arms, five-star base with twin casters) at world location `(-1.90, 1.90, 0.00)`, rotation `Z 180°`, scale `2.5`, bounds 1.78 × 1.81 × 3.23 m, 0.17 m clear of the desk edge and grounded at `z=0`. Accepted renders: `assets/reviews/office-chair-isolated-candidate.png`, `assets/reviews/office-chair-placement-local.png`, and `assets/reviews/office-chair-placement-overview.png`.
- Monitor: model and placement approved on 2026-10-11 from `assets/references/monitor.png`; graphite thin-bezel display with rounded back housing, slanted neck, and rounded metal base under `INT_Monitor → Monitor_Assembly` at world location `(-1.95, 4.05, 1.51)`, scale `3.6`, bounds 2.21 × 0.68 × 1.72 m, grounded on the desk top. `Monitor_Screen` carries the packed 2048 × 1152 `TEX_Monitor_IDE` texture (explorer, tabs, gutter, outline, terminal, status bar as real text); the editor code is 23 editable Consolas text objects `IDLE_Monitor_Code_00…22` with per-token syntax materials `MAT_Code_*`, kept separate for later typing animation. `IDLE_Monitor_Cursor` keeps its blink action at the end of line 23. Accepted renders: `assets/reviews/monitor-isolated-candidate.png`, `assets/reviews/monitor-placement-local.png`, and `assets/reviews/monitor-placement-overview.png`.
- Large floor plant: model and placement approved on 2026-10-11 from `assets/references/large_potted_plant.png`; four-object assembly under `ASSET_FloorPlant` (lathed wood-grain pot with packed `TEX_Plant_Pot_Wood`, mounded soil, seven canes, 71 folded lanceolate leaves in one mesh with packed `TEX_Plant_Leaf`, ≈5.2k triangles) at world location `(-5.58, 3.95, 0.00)`, rotation `Z 105°`, scale `1.7`, height 2.40 m below the contact card. Thirteen leaves were turned about their stems in the room copy so no leaf intersects the desk, back wall, or floor edge. Accepted renders: `assets/reviews/large-plant-isolated-candidate.png`, `assets/reviews/large-plant-placement-local.png`, `assets/reviews/large-plant-placement-overview.png`, and `assets/reviews/desk-zone-shift-local.png`.
- Laptop: model and placement approved on 2026-10-11 from the Penpot crop `assets/references/penpot-crops/laptop.png` (no dedicated reference PNG); silver aluminium 14" laptop with rounded base and lid, hinge, trackpad, packed `TEX_Laptop_Keyboard` (full labelled layout) and `TEX_Laptop_Screen` (notebook with pandas/matplotlib code and score chart), lid on `Laptop_Lid_Pivot` opened 110°. Placed under `INT_Desk → Laptop` at world location `(-3.32, 3.62, 1.51)`, scale `3.4`, yaw `39.5°` so the screen faces the chair; no geometric intersection with monitor, keyboard, mouse, or desk plant. Accepted renders: `assets/reviews/laptop-isolated-candidate.png`, `assets/reviews/laptop-placement-local.png`, and `assets/reviews/laptop-placement-overview.png`.
- Keyboard: model and placement approved on 2026-10-11 from the Penpot crop `assets/references/penpot-crops/keyboard.png`; slim graphite wedge body with 78 beveled keycaps (≈3.4k triangles) and packed `TEX_Keyboard_Legends` labelling every key. Placed under `INT_Desk → Keyboard` at world location `(-1.95, 3.20, 1.51)`, scale `3.4`, centred in front of the monitor and chair; no geometric intersection with monitor, mouse, or laptop. Accepted renders: `assets/reviews/keyboard-isolated-candidate.png`, `assets/reviews/keyboard-placement-local.png`, and `assets/reviews/keyboard-placement-overview.png`.
- Mouse: model and placement approved on 2026-10-11 from `assets/references/mouse-exemple.jpg` (Logitech B100-style) cross-checked with `assets/references/penpot-crops/mouse.png`; charcoal top shell with integrated left/right buttons split by a single centre seam, ribbed wheel in a raised oval bezel, thin darker base band, dark inner core showing through every gap (≈8.1k triangles, 7 objects). Placed under `INT_Desk → Mouse` at world location `(-0.95, 3.20, 1.51)`, scale `3.4`, yaw `160°` (buttons toward the monitor, angled to the chair); no geometric intersection with keyboard, smartphone, or monitor. Accepted renders: `assets/reviews/mouse-isolated-candidate.png`, `assets/reviews/mouse-reference-comparison.png`, `assets/reviews/mouse-placement-local.png`, and `assets/reviews/mouse-placement-overview.png`.
- Smartphone: model and placement approved on 2026-10-11 from the Penpot crop `assets/references/penpot-crops/smartphone.png`; rounded light-silver frame, black front glass, and `EMIT_Smartphone` display with its own `MAT_Phone_Screen` (black glass base, emissive packed `TEX_Phone_Screen` lock screen: 09:41, GitHub PR notification, calendar card) so the runtime notification pulse stays isolated. Placed under `INT_Smartphone → Smartphone_Assembly` at world location `(-0.25, 3.85, 1.51)`, scale `3.4`, yaw `-27°` (user-adjusted to face the chair); no geometric intersection with mouse or monitor. Accepted renders: `assets/reviews/smartphone-isolated-candidate.png`, `assets/reviews/smartphone-placement-local.png`, and `assets/reviews/smartphone-placement-overview.png`.
- Desk plant: model and placement approved on 2026-10-11 from the Penpot crop `assets/references/penpot-crops/desk_plant.png`; rounded matte taupe ceramic pot with rolled rim, dark soil, and a three-tier rosette of 27 arching lanceolate leaves with packed `TEX_DeskPlant_Leaf` (≈2k triangles, 3 objects). Placed under `INT_Desk → Desk_Plant` at world location `(-4.60, 4.05, 1.51)`, scale `3.4`, pot 0.12 m inside the desk's left edge; no geometric intersection with laptop, monitor, window, or floor plant. Accepted renders: `assets/reviews/desk-plant-isolated-candidate.png`, `assets/reviews/desk-plant-placement-local.png`, and `assets/reviews/desk-plant-placement-overview.png`.
- Contact card: model and placement approved on 2026-10-11 from the Penpot crop `assets/references/penpot-crops/contact_card.png`; dark-navy mitred frame, off-white mat, and A4 poster with packed `TEX_ContactCard` (person, mail, LinkedIn, GitHub icons). All wording is editable Segoe UI text objects: `ContactCard_Name`, `ContactCard_Role`, and `ContactCard_{Email,LinkedIn,GitHub}_{Label,Value}`, currently the sample-content placeholders (select, Tab, type, Tab). Placed under `INT_ContactCard → ContactCard_Assembly` flush on the back wall at world location `(-5.27, 4.89, 2.52)` (user-adjusted), scale `3.4`, bounds 0.88 × 0.07 × 1.18 m, 0.12 m above the floor plant. Accepted renders: `assets/reviews/contact-card-isolated-candidate.png`, `assets/reviews/contact-card-placement-local.png`, and `assets/reviews/contact-card-placement-overview.png`.
- Penpot-aligned Blender desk zone: re-accepted asset by asset on 2026-10-11; desk shifted +0.40 m in x, laptop and smartphone turned toward the chair, keyboard centred under the monitor, mouse right of the keyboard, desk plant at the left end, contact card above the floor plant; the mug and under-desk tower remain absent. Per-item crops in `assets/references/penpot-crops/` record the Penpot source for assets without a dedicated reference.
- Desk-zone validation (2026-10-11, BVH on evaluated meshes): no intersection between any pair of desk table, laptop, keyboard, mouse, desk plant, monitor, smartphone, contact card, chair, and floor plant except surface contact; every desk item's lowest point is exactly the desk top `z=1.51`, chair and floor plant rest at `z=0`, and only the contact card touches a wall (its back face on `y=4.89`).
- Desk interaction contract: `INT_Desk` holds five desk-surface assemblies (`Desk_Table`, `Laptop`, `Keyboard`, `Mouse`, `Desk_Plant`; 32 objects); `INT_Monitor` (33 objects incl. `Monitor_Screen`, `IDLE_Monitor_Code_00…22`, `IDLE_Monitor_Cursor`), `INT_Smartphone` (4 objects incl. `EMIT_Smartphone`), and `INT_ContactCard` (12 objects) remain independent roots.
- Blender Outliner: `StaticDecor` holds 71 objects nested under `Desk`, `Chair`, `Living_Area`, `Floor_Plant`, and `Rug`; each rebuilt asset has its isolated original kept as `Candidate_*` in its `REVIEW_*` scene.
- First useful render: 2317 ms in headless Chromium
- Draw calls: 144 desktop, 21 at 390 × 844
- Observed FPS: 41 mobile; 7 desktop under the headless software renderer

The mobile target is met. Desktop FPS must be confirmed on a physical GPU because headless Chromium's software-rendered result is not representative. Further mesh merging is deferred until that measurement shows a real bottleneck.

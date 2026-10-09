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

- Penpot-aligned Blender desk zone: accepted from `CAM_Overview` on 2026-10-09; 5.10 × 1.80 × 0.12 m desktop, chair facing the desk, laptop left, monitor central, smartphone right, contact card above the reduced floor plant, and no under-desk tower
- Desk interaction contract: `INT_Desk` contains 19 desk-surface children; `INT_Monitor`, `INT_Smartphone`, and `INT_ContactCard` remain independent roots; surface, grounding, and clearance assertions passed
- First useful render: 2317 ms in headless Chromium
- Draw calls: 144 desktop, 21 at 390 × 844
- Observed FPS: 41 mobile; 7 desktop under the headless software renderer

The mobile target is met. Desktop FPS must be confirmed on a physical GPU because headless Chromium's software-rendered result is not representative. Further mesh merging is deferred until that measurement shows a real bottleneck.

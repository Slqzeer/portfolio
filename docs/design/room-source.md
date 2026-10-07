# Interactive room source

Status: **implemented in Blender and exported as the runtime GLB**

## Visual reference

Canva remains the approved visual direction for the room.

- Design ID: `DAHXRbROrBI`
- Shared view: <https://canva.link/gqx5yi3auudqj5a>
- Edit link: <https://www.canva.com/d/Hy2EbjsPEIPOa6D>
- Pages: vision, isometric composition, day/night rule, object inventory, responsive/accessibility principles

The Figma file [Portfolio — Chambre interactive — Production](https://www.figma.com/design/mESnsD8GuPIigFtJiQ29Ki) is retained only as an HTML/layout reference. It is not the source of the room geometry.

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

- Canva-aligned Blender render: visually inspected after optimization
- First useful render: 2317 ms in headless Chromium
- Draw calls: 144 desktop, 21 at 390 × 844
- Observed FPS: 41 mobile; 7 desktop under the headless software renderer

The mobile target is met. Desktop FPS must be confirmed on a physical GPU because headless Chromium's software-rendered result is not representative. Further mesh merging is deferred until that measurement shows a real bottleneck.

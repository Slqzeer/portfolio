# Canva room source

Status: **Superseded for runtime production by the approved Blender/GLB pipeline**

The existing Canva-aligned Figma frames remain valid visual references and temporary fallback artwork. New room geometry, lighting, camera anchors, and physical animations are authored in Blender according to `docs/superpowers/specs/2026-10-07-interactive-3d-room-design.md`.

Retrieved: 2026-10-07

## Source

- Design ID: `DAHXRbROrBI`
- Title: `Portfolio Data & IA`
- Shared URL: <https://canva.link/gqx5yi3auudqj5a>
- Canva edit URL: <https://www.canva.com/d/Hy2EbjsPEIPOa6D>
- Canva view URL: <https://www.canva.com/d/DKimTilzbisQ2Ee>
- Coordinate system: `1920 × 1080` on every page

| Page | Canva page ID | Current purpose |
| --- | --- | --- |
| 1 | `PBSzpNCRtmBSxtxR` | Vision and principles |
| 2 | `PBJZjL4025zP7qR5` | Annotated isometric-room composition |
| 3 | `PB0t5GKtxrdXyD6x` | Day/night concept and lighting rule |
| 4 | `PBxZGj9ln7xdLGlT` | Interactive-object inventory |
| 5 | `PBjmj5fc8SMLVXMm` | Responsive, accessibility, and data principles |

## Production inspection

The composition is visually approved as a concept, but it is not yet an implementable layered scene.

- Page 2 exposes the room as one central bitmap fill (`MAHXRTy1NY0`) at `left 524.78`, `top 157.24`, `width 915.22`, `height 856.20`. The other fills are annotation graphics rather than isolated room objects.
- Page 3 exposes the day and night rooms as large bitmap compositions. The window, curtains, natural light, and artificial lamps are not independent state layers.
- Page 4 documents nine interactive objects. The window/curtain theme control required by the product specification is not present as a tenth production object.
- Canva provides reliable bounds for the existing fills, but the current connector cannot split a flattened bitmap into transparent semantic layers.

Therefore `roomGeometry.ts` and `public/assets/room/` must not be produced from guessed positions or redrawn substitutes. Doing so would violate Canva's role as the visual source of truth.

## Figma production source

- File: [Portfolio — Chambre interactive — Production](https://www.figma.com/design/mESnsD8GuPIigFtJiQ29Ki)
- File key: `mESnsD8GuPIigFtJiQ29Ki`
- Review wrapper: `2:33`
- Day frame: `3:4` (`Artwork / Room Day`: `9:2`)
- Night frame: `3:6` (`Artwork / Room Night`: `9:13`)
- Coordinate system: `1920 × 1080`
- Source policy: Canva remains the approved concept reference; Figma is the editable production source.

The first Figma interpretation was rejected because its flat frontal composition differed too much from Canva's isometric 3D room. It must not be integrated.

The approved revision uses two transparent 1536 × 1024 PNG renders that closely preserve Canva's isometric composition and rendered style. Figma holds the exact 1920 × 1080 presentation placement plus ten identically positioned semantic hotspot frames. Day uses open curtains, natural light, and artificial lamps off. Night uses closed curtains, no window-emitted light, and artificial lamps on.

## Production asset contract

| State | Repository asset | Figma image node |
| --- | --- | --- |
| Day | `/assets/room/room-day.png` | `9:2` |
| Night | `/assets/room/room-night.png` | `9:13` |

Hotspot bounds come from the Figma production frames and are normalized from 1920 × 1080 in `src/room/roomGeometry.ts`. Each geometry entry records its Figma node reference so artwork and interaction coordinates can be replaced together.

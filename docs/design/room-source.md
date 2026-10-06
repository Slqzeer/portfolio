# Canva room source

Status: **Figma production handoff approved — connection pending**

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

## Required handoff

Choose one of these paths before implementation continues:

1. **Recommended — Figma production handoff:** recreate the approved Canva composition as named, exportable layers for the room shell, ten interactive objects, open/closed curtains, day/night window, lamps off/on, flags, and decoration. Canva remains the approved concept reference.
2. **Canva manual production bundle:** restructure the Canva file manually and provide separate transparent SVG/PNG/WebP exports plus a `1920 × 1080` placement manifest for the same layers.

The Figma handoff was approved on 2026-10-07. The next implementation step begins when the Figma connection is active, then pauses again for explicit visual approval of the production frames before assets and geometry enter the codebase.

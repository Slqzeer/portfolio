# Interactive 3D Room Design

Date: 2026-10-07  
Status: approved design  
Supersedes: the 2.5D room, camera, visual-production, idle-animation, and technical-stack sections of `2026-10-07-interactive-portfolio-design.md`

## Goal

Replace the flattened 2.5D room with a detailed, warm isometric 3D bedroom that stays faithful to the approved Canva composition. The room is the primary portfolio interface; React HTML remains responsible for bilingual editorial content, navigation, accessibility, and shareable application state.

## Sources of truth

- Canva remains the artistic reference for composition, silhouettes, palette, room proportions, and object placement.
- Blender becomes the technical source for room geometry, materials, lighting, camera anchors, and physical animation clips.
- Figma is limited to HTML panels, typography, and reusable interface components.
- `src/content/portfolioContent.ts` remains the only source for personal data and French/English copy.
- `src/room/sceneManifest.ts` maps portfolio functions to stable Blender node names and behaviors.

The approved Canva room export is placed behind the locked Blender overview camera. Blockout and final renders are compared by overlay so the 3D scene cannot silently drift into a different composition.

## Scene contract

The Blender source contains these top-level collections:

- `RoomShell`: walls, floor, window frame, ceiling details;
- `StaticDecor`: furniture and non-functional decoration;
- `InteractiveObjects`: objects that open portfolio content;
- `Controls`: curtains and language flag;
- `Lights`: daylight, artificial lighting, screen and rack emitters;
- `Animations`: camera anchors and animated helpers.

Exported interactive nodes use stable names:

| Portfolio function | Blender node | Action |
| --- | --- | --- |
| Data and AI projects | `INT_Monitor` | Focus camera and open projects |
| Homelab | `INT_Homelab` | Focus camera and open homelab |
| Education and experience | `INT_Diploma` | Focus camera and open experience |
| Personal qualities | `INT_Volleyball` | Focus camera and open volleyball |
| Game development | `INT_Controller` | Focus camera and open game-development projects |
| Daily applications | `INT_Smartphone` | Focus camera and open experiments |
| Current explorations | `INT_Bookshelf` | Focus camera and open exploring |
| Contact and social links | `INT_ContactCard` | Focus camera and open contact |
| Day/night control | `CTL_Curtains` | Toggle lighting locally; never move camera |
| Language control | `CTL_Flag` | Toggle locale locally; never move camera |

Every focusable content node has a matching `CAM_Anchor_<Name>` empty in Blender. `CAM_Overview` defines the overview pose. This keeps framing decisions in Blender instead of duplicating coordinates in TypeScript.

All decor is modeled, but only the ten nodes above receive interaction handlers. Static meshes may be joined for rendering efficiency; interactive nodes, curtains, flag, animated screen surfaces, and rack-light groups remain separate.

## Camera

The overview uses the Canva-aligned isometric composition. While no object is focused, pointer movement applies a smooth, delayed parallax to the camera rig:

- maximum horizontal translation: 14 px equivalent at the reference viewport;
- maximum vertical translation: 8 px equivalent;
- maximum pitch and yaw: 1.25 degrees;
- interpolation factor: 0.075 per animation frame;
- pointer exit returns smoothly to the overview pose.

These values live in one configuration object. Pointer parallax is disabled on touch layouts, under `prefers-reduced-motion`, and during directed camera travel.

Selecting a content object moves the camera from its current pose to the matching Blender anchor with a smooth eased interpolation. Closing restores `CAM_Overview`. Only one object may be focused at a time. Curtains and flag never trigger camera travel.

## Lighting

### Day

- Curtains are open.
- Natural light enters through the window.
- Artificial room lighting is off.
- The HTML interface uses the light theme.

### Night

- Curtains are closed.
- No light or glow comes from behind the curtains.
- The room lamp is the principal light source.
- Screen and homelab emitters remain subtle secondary sources.
- The HTML interface uses the dark theme.

The curtain clip and light intensities cross-fade over roughly one second. Theme state remains persisted through the existing preference mechanism.

## Idle motion

Blender owns physical clips such as the small open-curtain movement. React Three Fiber owns procedural runtime motion:

- slow code movement and a blinking terminal cursor on the monitor;
- asynchronous homelab activity lights;
- slight screen-emission variation;
- an occasional subtle smartphone notification;
- the approved pointer-follow camera motion.

Furniture, diploma, volleyball, and other resting props do not move without a physical reason. Idle work pauses when the tab is hidden. Reduced motion freezes non-essential loops while preserving state indicators.

## Interaction and content

Hovering or keyboard-focusing a functional object gives restrained feedback. Clicking a content object starts camera travel and opens the existing React detail panel. `Escape`, the visible close action, background dismissal, and browser Back return to the overview and restore focus.

On narrow screens, camera framing is retained and the detail panel becomes a bottom sheet. Pointer parallax is absent. The structured HTML navigation exposes the same destinations independently of WebGL.

The GLB contains no portfolio copy. Titles, descriptions, projects, links, and translations stay in the typed content module and are rendered as real HTML. The flag changes locale without opening a detail panel. The curtains change theme without opening a detail panel.

## Loading and fallback

The room poster appears immediately. The GLB loads behind it and replaces it with a short cross-fade when ready. A failed load, unavailable WebGL context, or unsupported device leaves the poster and complete HTML navigation usable.

Initial performance targets:

- optimized GLB target below 8 MB; review required above 12 MB;
- 60 FPS on a recent desktop and stable 30 FPS on a representative mobile device;
- no visible camera hitch during focus travel;
- one main GLB, unless measurements show that splitting it improves first use;
- no post-processing stack in the initial implementation.

Repeated homelab elements use instancing where practical. Static ambient occlusion is baked into materials; only the lights needed for day/night behavior remain dynamic. Texture compression and mesh optimization are introduced only when the measured bundle exceeds the target.

## Accessibility and URL state

- The 3D canvas is presentation, not the sole navigation mechanism.
- Every functional object has a localized accessible HTML equivalent.
- Keyboard focus, visible focus state, focus restoration, and `Escape` behavior remain supported.
- `prefers-reduced-motion` removes parallax and replaces camera travel with a short state transition.
- The current locale and focused content remain representable in the URL.
- Changing locale updates the document language.
- Searchable portfolio content remains in the DOM rather than baked into textures.

## Acceptance criteria

- The overview composition clearly matches the approved Canva room when overlaid.
- All listed decor is modeled, including the controller, smartphone, detailed homelab, EPITA diploma, volleyball, flag, curtains, contact card, and bookshelf.
- Only functional objects respond to pointer or keyboard input.
- The approved smooth pointer-follow behavior works in the overview and stops during focus travel.
- Content objects use real camera movement; curtains and flag do not.
- Closed curtains emit no window light and activate the artificial lamp.
- Monitor, homelab, curtains, and smartphone provide restrained idle motion.
- French/English content remains centralized and editable without Blender.
- The poster and structured navigation remain usable when 3D loading fails.
- Unit, component, browser, build, and asset-contract checks pass in CI.

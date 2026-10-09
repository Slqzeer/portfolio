# Room Alignment Design

Date: 2026-10-07  
Status: approved
Supersedes: conflicting room-layout, object-interaction, camera, lighting, and delivery rules in `2026-10-07-interactive-3d-room-design.md` and `2026-10-07-interactive-portfolio-design.md`

## Goal

Bring Penpot, Blender, and the website back into one coherent room design without shipping the work as one large branch. The approved Penpot composition is the visual source of truth. Blender realizes it in 3D, and the website consumes the exported scene without redefining object placement.

## Source-of-truth chain

The synchronization order is one-way:

`approved Penpot → aligned Blender → validated GLB → website`

- Penpot owns composition, proportions, silhouettes, palette, object placement, and interaction annotations.
- Blender owns geometry, materials, lighting, camera anchors, and physical animation clips.
- The GLB preserves stable named nodes and anchors.
- TypeScript owns interaction state, bilingual content, URL state, accessibility, and runtime animation control.

A downstream stage cannot redefine an upstream visual decision. Each stage receives a visual review before the next stage starts.

## Canonical room composition

The Penpot board `6b785803-9d96-8041-8008-c380eb623863` on page `222559c6-1a87-800d-8008-c3780ad3f78e` is the base composition. It reproduces the Canva page direction with the original HD room asset, dark palette, callouts, typography, and connectors. Its room proportions and camera-facing layout are the approved reference.

The approved additions and replacements are:

- The contact card sits above a slightly smaller floor plant to the left of the desk.
- The laptop remains on the left side of the desk.
- The main screen remains central on the desk.
- The smartphone sits on the desk to the right of the main screen.
- There is no desktop tower under the desk.
- The server rack remains in the rear corner of the room.
- The bookshelf remains on the right side of the room and is visibly filled.
- The language flag occupies the wall area above the bookshelf, replacing the small wall cabinet/shelf and its books.
- The flag displays the currently active language: France for French and the United Kingdom for English.
- The volleyball sits on the floor to the left of the coffee table.
- The controller sits on the left side of the coffee table.
- The coffee-table plant sits on the right side.
- All other coffee-table objects are removed.

The Blender scene, not Penpot, currently needs these corrections:

- enlarge and flatten the desk to match Penpot, removing the extra slope;
- rotate the chair so it faces the desk;
- match the Penpot floor plant at the left of the desk;
- match the Penpot screen silhouette and proportions;
- move and redesign the server rack to match the rear-corner reference;
- recreate the diploma as a recognizable blue-and-white EPITA diploma and place it as shown in Penpot;
- fill, position, and reshape the bookshelf to match Penpot;
- place the purple lamp and its light origin as shown in Penpot;
- reposition and reshape the sofa to match Penpot;
- resize and reposition the cushions so they remain fully inside the sofa;
- match the coffee table and its plant to Penpot;
- move the controller from its current location to the left side of the coffee table;
- add or expose the approved contact card and volleyball placement.

## Scene contract

The current stable nodes remain unless this specification changes their role. The Blender and TypeScript contracts add a desk focus zone:

| Function                              | Blender node      | Camera anchor            | Behavior                                     |
| ------------------------------------- | ----------------- | ------------------------ | -------------------------------------------- |
| Desk project zone                     | `INT_Desk`        | `CAM_Anchor_Desk`        | Enter or leave desk focus; no detail panel   |
| Data, AI, and software projects       | `INT_Monitor`     | `CAM_Anchor_Monitor`     | Available from desk focus; opens projects    |
| Personal applications and experiments | `INT_Smartphone`  | `CAM_Anchor_Smartphone`  | Available from desk focus; opens experiments |
| Game-development projects             | `INT_Controller`  | `CAM_Anchor_Controller`  | Direct selection from the overview           |
| Homelab                               | `INT_Homelab`     | `CAM_Anchor_Homelab`     | Direct selection from the overview           |
| Education and experience              | `INT_Diploma`     | `CAM_Anchor_Diploma`     | Direct selection from the overview           |
| Personal qualities                    | `INT_Volleyball`  | `CAM_Anchor_Volleyball`  | Direct selection from the overview           |
| Current explorations                  | `INT_Bookshelf`   | `CAM_Anchor_Bookshelf`   | Direct selection from the overview           |
| Contact and social links              | `INT_ContactCard` | `CAM_Anchor_ContactCard` | Direct selection from the overview           |
| Day/night control                     | `CTL_Curtains`    | none                     | Toggle the synchronized lighting transition  |
| Language control                      | `CTL_Flag`        | none                     | Toggle locale without camera travel          |

`CAM_Overview` remains the default pose. All interactive nodes, controls, and camera anchors stay separate during mesh optimization.

## Interaction and URL state

The default overview exposes the desk zone, controller, homelab, diploma, volleyball, bookshelf, contact card, curtains, and flag.

Selecting the desk creates a nested interaction flow:

1. The camera travels to `CAM_Anchor_Desk` without opening a detail panel.
2. The monitor and smartphone receive the active emphasis in this view.
3. Selecting the monitor opens Data/AI and software projects.
4. Selecting the smartphone opens personal applications and experiments.
5. Closing either detail returns to desk focus.
6. Closing desk focus returns to the overview.

The controller remains independent of the desk and opens game-development projects directly from the overview.

URL state preserves deep links. A direct monitor or smartphone URL reconstructs the desk context before opening its detail. `Escape`, the visible close control, browser Back, and accessible controls follow the same hierarchy: detail → desk → overview.

Keyboard users receive the same destinations and hierarchy as pointer users. The HTML control list remains usable when WebGL is unavailable.

## Camera behavior

The overview camera moves higher and is reframed so no approved Penpot element is cropped at the reference desktop viewport. Mobile uses its own verified framing rather than scaling the desktop pose blindly.

Every focus anchor is adjusted in Blender and visually validated. A valid focus view must:

- keep the selected object clearly visible;
- include enough surrounding context to preserve spatial orientation;
- leave room for the adjacent desktop detail panel or mobile bottom sheet;
- avoid framing mostly empty wall, floor, or off-scene space;
- return smoothly to its parent view.

Camera travel uses eased interpolation and never competes with pointer parallax. Parallax remains disabled on touch layouts, under reduced motion, and during directed travel.

## Lighting and animation

The curtain clip drives one normalized day/night transition lasting between **0.8 and 1.0 seconds**.

For day to night:

1. The curtains visibly begin closing.
2. Natural daylight fades during the curtain movement.
3. As the curtains approach the closed position, the purple lamp and secondary emitters rise gradually.
4. The HTML theme completes its cross-fade with the room.

Night to day runs the sequence in reverse. Additional curtain toggles are ignored until the active transition completes so visual and application state cannot diverge. Under `prefers-reduced-motion`, the same final state is applied immediately.

The required ambient motion is deliberately small:

- smooth camera travel between overview, desk, and object anchors;
- restrained hover and keyboard-focus feedback without object displacement;
- monitor code movement and blinking cursor;
- asynchronous server activity lights;
- occasional smartphone notification;
- synchronized curtains, natural light, purple lamp, secondary emitters, and HTML theme.

Idle animation pauses while the document is hidden. Reduced motion freezes non-essential loops while preserving state indicators. Static furniture and resting props do not move without a physical reason.

## Incremental delivery policy

This work must not be implemented or pushed as one large branch. It is delivered as the following ordered, independently reviewable increments:

1. specification and source-of-truth contract;
2. Penpot canonical composition migration;
3. Penpot independent visual review;
4. Blender desk zone: desk, chair, screen, laptop, smartphone, left plant, and contact card;
5. Blender rear and right zones: server, bookshelf, flag, diploma, and lamp;
6. Blender living zone: sofa, cushions, coffee table, controller, table plant, and volleyball;
7. Blender overview and focus camera anchors;
8. Blender curtain, lighting, and physical animation clips;
9. optimized GLB export and named-node validation;
10. website desk interaction hierarchy and URL state;
11. website camera, lighting, and ambient runtime animation;
12. responsive, accessibility, fallback, and performance validation.

Each increment has its own branch, focused verification, visual evidence where applicable, and commit. An increment is reviewed before work begins on the next one. External Penpot edits are recorded in the matching repository increment with file, page, and board identifiers plus an exported review image.

## Validation

Visual stages use the approved Penpot export behind the locked Blender camera. Each affected zone receives a before/after capture, and the final overview receives an opacity overlay against Penpot.

The GLB validator rejects missing or renamed contract nodes and anchors. Website tests cover:

- overview → desk → monitor → desk → overview;
- overview → desk → smartphone → desk → overview;
- direct controller selection;
- Back and `Escape` through the nested hierarchy;
- valid direct URLs and invalid hashes;
- every camera target selecting the expected anchor;
- the 0.8–1.0 second curtain and lighting sequence;
- repeated toggle protection;
- reduced-motion and hidden-tab behavior;
- mobile framing and bottom-sheet presentation;
- GLB failure with usable poster and HTML controls.

Final acceptance requires the room to match Penpot at the overview, every focused object to remain visible, all required animations to run, and the existing format, unit, build, asset, and browser checks to pass.

## External tooling and limits

The connected Penpot and Blender tools are sufficient for inspecting and updating the approved sources. Paid 3D generation is not required for the initial correction pass; existing geometry should be edited or rebuilt with Blender primitives where practical. The Penpot MCP plugin window must remain open while external design changes are made.

# Room Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild each room asset from its dedicated image reference, place it against the approved Penpot composition only after asset approval, then align Blender, the exported GLB, and the website through independently reviewed increments.

**Architecture:** The individual reference PNG owns each asset's shape, materials, and recognizable details; the approved Penpot board owns scale, placement, orientation, and composition. For every asset, finish and review the isolated model first, then place it in the editable Blender master, render a Penpot comparison, and stop for user approval before touching the next asset. After the full master is approved, validate and export one GLB, then adapt the existing manifest-driven React flow. Keep one active room-object ID as the current leaf; declare `desk` as the parent of `monitor` and `smartphone` in the scene manifest.

**Tech Stack:** Penpot, Blender 5.1+, GLB/glTF 2.0, React 19, TypeScript, React Three Fiber, Three.js, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-07-room-alignment-design.md`

## Global Constraints

- Source order is `asset reference PNGs + Penpot → Blender → GLB → website`; downstream stages never redefine approved asset appearance or placement.
- For asset appearance, the matching `assets/references/<asset>.png` is authoritative; for scene composition, `assets/references/penpot-room.png` is authoritative.
- Process exactly one asset at a time: isolated model review → user approval → scene placement → Penpot comparison review → user approval. Do not begin the next asset while either gate is open.
- Asset approval covers geometry and materials. Placement approval separately covers transform, scale, grounding, overlap, and appearance from `CAM_Overview`.
- Save the Blender master after every approved placement and record the reference, accepted render, dimensions, and world transform in `docs/design/room-source.md`.
- If an object has no dedicated reference PNG, preserve its current model and use Penpot only for placement; request a dedicated reference before rebuilding its appearance.
- Penpot file `222559c6-1a87-800d-8008-c3780ad3f78d`, page `222559c6-1a87-800d-8008-c3780ad3f78e`, board `6b785803-9d96-8041-8008-c380eb623863` is the external source record.
- Keep one GLB, the existing React state approach, and the existing dependencies. Add no router, state library, animation library, or paid generated asset.
- Keep every current `INT_*`, `CTL_*`, `CAM_Anchor_*`, `LIGHT_*`, `EMIT_*`, and idle node stable; add `INT_Desk`, `CAM_Anchor_Desk`, `Flag_FR`, and `Flag_EN`.
- The day/night transition lasts exactly `0.9` seconds, within the approved 0.8–1.0 second range.
- Each task uses its named branch, is pushed and reviewed separately, and is merged before the next task branches from updated `main`.
- Each branch must pass its listed checks before push. Do not batch multiple tasks into one branch or one final push.
- Preserve keyboard access, the HTML/WebGL fallback, reduced motion, hidden-tab pause, bilingual labels, and mobile bottom-sheet behavior.
- Baseline specification commit is `3067a26`.

## Review Focus

- Each isolated model must match the silhouette, proportions, principal materials, and recognizable details of its dedicated PNG before it enters the room.
- Each placed asset must be reviewed with a local crop and the full `CAM_Overview` render against Penpot.
- Any later change that moves, rescales, rematerials, or replaces an approved asset reopens that asset's placement review.
- A direct `#room/monitor` or `#room/smartphone` load must retain `desk` as its close target; pin this in Task 9 application tests.
- Browser Back and `Escape` must traverse `detail → desk → overview` without skipping or duplicating history; pin this in Tasks 9 and 12.
- Repeated curtain clicks inside 900 ms must not reverse or desynchronize the room and HTML theme; pin this in Task 11.
- A missing GLB or WebGL failure must leave the poster and the complete contextual HTML controls usable; pin this in Task 12.
- At 390 × 844, overview and focus views must keep their subject visible while the bottom sheet is open; pin this in Tasks 10 and 12.

---

## File Map

- `assets/references/canva-room.png`: legacy migration reference retained for history.
- `assets/references/canva-room-updated.png`: corrected canonical room composition derived from the Canva visual direction.
- `assets/references/canva-room-updated-night.png`: matching dark-mode composition with closed curtains and synchronized practical lighting.
- `assets/references/canva-day-night-current.png`: Canva day/night source receipt.
- `assets/references/canva-interactive-inventory-current.png`: Canva interactive-object inventory receipt.
- `assets/references/penpot-room.png`: canonical Penpot export at 1920 × 1080.
- `assets/references/room_walls.png`, `room_floor.png`, `window.png`, `area_rug.png`: architectural and floor references.
- `assets/references/desk_table.png`, `office_chair.png`, `monitor.png`, `large_potted_plant.png`: desk-zone references.
- `assets/references/server_rack.png`, `bookshelf.png`, `french_flag_frame.png`, `table_lamp.png`: rear/right-zone references.
- `assets/references/sofa.png`, `coffee_table.png`, `game_controller.png`, `volleyball.png`: living-zone references.
- `assets/blender/portfolio-room.blend`: editable Blender master changed and approved one asset at a time.
- `assets/blender/portfolio-room-optimized.blend`: optimized derivative produced only after the master is approved.
- `public/assets/room/portfolio-room.glb`: runtime scene.
- `public/assets/room/room-poster-day.webp`, `room-poster-night.webp`: loading and failure posters from the approved overview.
- `docs/design/room-source.md`: external page IDs, scene contract, validation receipts, and asset measurements.
- `src/content/types.ts`, `src/content/portfolioContent.ts`: `desk` ID and bilingual accessible label.
- `src/room/sceneManifest.ts`: node, anchor, action, and parent relationship for every scene function.
- `src/app/App.tsx`, `src/app/appState.ts`: nested focus navigation and guarded lighting toggle.
- `src/room/AccessibleRoomControls.tsx`: context-aware fallback controls.
- `src/room/RoomCanvas.tsx`, `src/room/RoomModel.tsx`, `src/room/CameraRig.tsx`: locale-driven flag, responsive camera, and scene interaction.
- `src/room/RoomLighting.tsx`, `src/room/RoomIdle.tsx`: synchronized 0.9-second transition and visible ambient motion.
- `scripts/glb-contract.mjs`, `scripts/validate-room-glb.mjs`: exported-node contract.
- `src/**/*.test.ts?(x)`, `scripts/glb-contract.test.ts`, `tests/e2e/portfolio.spec.ts`: focused unit, component, asset, and browser checks.

### Task 1: Migrate the canonical composition to Penpot

**Branch:** `room/01-penpot-migration`

**Files:**

- Create: `assets/references/penpot-room.png`
- Modify: `docs/design/room-source.md`
- External: Penpot page `222559c6-1a87-800d-8008-c3780ad3f78e`, board `6b785803-9d96-8041-8008-c380eb623863`

**Interfaces:**

- Consumes: approved composition in the spec and the legacy Canva export.
- Produces: one editable 1920 × 1080 Penpot reference used by every later task.

- [x] **Step 1: Create one canonical Penpot board**

Use native editable shapes and semantic group names. Keep the room scene and interaction legend on a single 1920 × 1080 board.

- [x] **Step 2: Apply the approved composition**

Keep the server in the rear corner and the bookshelf on the right. Add the contact card above the smaller left-of-desk plant; keep laptop left and screen central; place the smartphone right of the screen; remove the under-desk tower; place volleyball left of the coffee table; place controller left and plant right on the coffee table; remove other table objects; place the current-language flag above the bookshelf.

- [x] **Step 3: Add the interaction contract**

Document desk focus, monitor Data/IA projects, smartphone experiments, controller game projects, locale-driven flag behavior, and the synchronized 0.9-second curtain/light transition.

### Task 2: Review and record the Penpot source

**Branch:** `room/02-penpot-review`

**Files:**

- Create: `assets/references/penpot-room.png`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: Task 1 Penpot board.
- Produces: a reviewed source receipt and exported reference for Blender comparisons.

- [x] **Step 1: Review structure and visual output independently**

Inspect semantic groups, export the board, and verify all approved placements, labels, and board bounds. The migration review passed with no blocking, important, or minor findings.

- [x] **Step 2: Save the export and receipt on the dedicated branch**

Export the reviewed board to `assets/references/penpot-room.png`, record its identifiers and review result in `room-source.md`, then commit only those two files before Blender work begins.

### Task 3: Rebuild and place the Blender shell and desk assets

**Branch:** `room/03-blender-desk-zone`

**Files:**

- Modify: `assets/blender/portfolio-room.blend`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: approved Penpot export plus `room_walls.png`, `room_floor.png`, `window.png`, `desk_table.png`, `office_chair.png`, `monitor.png`, and `large_potted_plant.png`.
- Produces: approved shell and desk assets, `INT_Desk`, and the desk-area interactive children required by later code.

- [ ] **Step 1: Create the branch and inspect the live master**

Run: `git switch main && git pull --ff-only && git switch -c room/03-blender-desk-zone`. Open `portfolio-room.blend`; use Blender scene info and a camera render to record the current shell and desk-zone bounds. Do not alter an approved object while working on a later one.

- [ ] **Step 2: Rebuild and review the room walls**

Match `room_walls.png` in an isolated collection. Render the same three-quarter view and stop for user review. After approval, place and scale the walls from Penpot, render a local crop plus full overview, and stop again for placement approval.

- [ ] **Step 3: Rebuild and review the room floor**

Match `room_floor.png` in isolation, including thickness and wood direction. After model approval, place it from Penpot, verify wall contact and visible floor bounds, render both comparison views, and stop for placement approval.

- [ ] **Step 4: Rebuild and review the window**

Match `window.png` in isolation with a simple web-suitable construction. After model approval, place it from Penpot, verify recess, wall contact, and curtain clearance, render both comparison views, and stop for placement approval.

- [ ] **Step 5: Rebuild and review the desk**

Match `desk_table.png` in isolation, including the flat wood top and rectangular dark legs. After model approval, place and scale it from Penpot, then stop for placement approval. Create `INT_Desk` around its interaction surface without renaming `INT_Monitor`, `INT_Smartphone`, or `INT_ContactCard`.

- [ ] **Step 6: Rebuild and review the office chair**

Match `office_chair.png` in isolation, prioritizing its mesh back, armrests, five-star base, and casters. After model approval, place it facing the desk from Penpot, verify floor contact and desk clearance, render both comparison views, and stop for placement approval.

- [ ] **Step 7: Rebuild and review the monitor**

Match `monitor.png` in isolation, preserving `INT_Monitor` as the stable pick root. After model approval, place it centrally on the desk from Penpot, verify surface contact and screen visibility, render both comparison views, and stop for placement approval.

- [ ] **Step 8: Rebuild and review the large floor plant**

Match `large_potted_plant.png` in isolation with a web-suitable leaf count. After model approval, place and scale it left of the desk from Penpot, verify floor and desk clearance, render both comparison views, and stop for placement approval.

- [ ] **Step 9: Place desk-zone assets without dedicated references**

Preserve the existing laptop, smartphone, contact card, keyboard, and mouse models. Place them from Penpot: laptop left, monitor central, smartphone right, contact card above the floor plant; remove the under-desk tower. Stop for one composition review because these assets are not being rebuilt.

- [ ] **Step 10: Validate, document, commit, push, and stop**

Query `INT_Desk`, `INT_Monitor`, `INT_Smartphone`, and `INT_ContactCard` for bounds, children, and transforms. Confirm no modified object intersects the desk, wall, or floor unintentionally. Record every accepted asset and placement in `room-source.md`, then run: `git add assets/blender/portfolio-room.blend docs/design/room-source.md && git commit -m "art: align Blender desk zone" && git push -u origin room/03-blender-desk-zone`.

### Task 4: Correct the Blender rear and right zones

**Branch:** `room/04-blender-rear-zone`

**Files:**

- Modify: `assets/blender/portfolio-room.blend`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: Task 3 master plus `server_rack.png`, `bookshelf.png`, `french_flag_frame.png`, and `table_lamp.png`.
- Produces: aligned homelab, bookshelf, language flag variants, EPITA diploma, and purple lamp.

- [ ] **Step 1: Create the branch after Task 3 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/04-blender-rear-zone`.

- [ ] **Step 2: Rebuild and review the server rack**

Match `server_rack.png` in isolation, preserving `INT_Homelab` and separate runtime light/emitter nodes. After model approval, place it in the rear corner from Penpot, render a local crop plus full overview, and stop for placement approval.

- [ ] **Step 3: Rebuild and review the bookshelf**

Match `bookshelf.png` in isolation, including the filled shelves, while preserving `INT_Bookshelf`. After model approval, place it on the right from Penpot, render both comparison views, and stop for placement approval.

- [ ] **Step 4: Rebuild and review the framed flag**

Match `french_flag_frame.png` in isolation. After model approval, remove the small wall shelf and books, then place the frame above the bookshelf from Penpot. Under `CTL_Flag`, keep `Flag_FR` and `Flag_EN` at identical bounds; review the French appearance now and defer the English texture swap to the runtime task.

- [ ] **Step 5: Rebuild and review the purple lamp**

Match `table_lamp.png` in isolation, preserving the emissive surface and `LIGHT_Lamp`. After model approval, place it from Penpot, render the day and night local crop plus full overview, and stop for placement approval.

- [ ] **Step 6: Place the diploma without rebuilding it**

Preserve the current `INT_Diploma` model because no dedicated diploma reference exists. Place it from Penpot and stop for review. Rebuild its artwork only after a dedicated reference is added.

- [ ] **Step 7: Validate, save, document, commit, and push**

Render the rear/right zone and inspect `INT_Homelab`, `INT_Bookshelf`, `INT_Diploma`, `CTL_Flag`, `Flag_FR`, `Flag_EN`, and `LIGHT_Lamp`. Save, then run: `git add assets/blender/portfolio-room.blend docs/design/room-source.md && git commit -m "art: align Blender rear zone" && git push -u origin room/04-blender-rear-zone`. Stop for review.

### Task 5: Correct the Blender living zone

**Branch:** `room/05-blender-living-zone`

**Files:**

- Modify: `assets/blender/portfolio-room.blend`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: Task 4 master plus `sofa.png`, `coffee_table.png`, `game_controller.png`, `volleyball.png`, and `area_rug.png`.
- Produces: individually approved sofa, contained cushions, coffee table, controller, plant, volleyball, and rug.

- [ ] **Step 1: Create the branch after Task 4 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/05-blender-living-zone`.

- [ ] **Step 2: Rebuild and review the area rug**

Match `area_rug.png` in isolation. After model approval, place and scale it from Penpot, verify floor contact, render both comparison views, and stop for placement approval.

- [ ] **Step 3: Rebuild and review the sofa**

Match `sofa.png` in isolation, including three seat/back sections and two contained cushions. After model approval, place it from Penpot, verify every cushion remains inside the sofa bounds, render both comparison views, and stop for placement approval.

- [ ] **Step 4: Rebuild and review the coffee table**

Match `coffee_table.png` in isolation. After model approval, place it from Penpot, verify rug and sofa clearance, render both comparison views, and stop for placement approval.

- [ ] **Step 5: Rebuild and review the controller**

Match `game_controller.png` in isolation with enough silhouette and control detail to remain recognizable at overview distance, preserving `INT_Controller`. After model approval, place it on the left of the coffee table from Penpot, render both comparison views, and stop for placement approval.

- [ ] **Step 6: Rebuild and review the volleyball**

Match `volleyball.png` in isolation, including the blue/yellow panel pattern, preserving `INT_Volleyball`. After model approval, place it on the floor left of the coffee table, verify rug, sofa, and table clearance, render both comparison views, and stop for placement approval.

- [ ] **Step 7: Place the table plant and remove extras**

Preserve the existing small table-plant model because no dedicated reference exists. Place it on the right of the coffee table from Penpot, remove every other table object, render both comparison views, and stop for placement approval.

- [ ] **Step 8: Validate, save, document, commit, and push**

Render the living zone, inspect object bounds for overlap and grounding, save, then run: `git add assets/blender/portfolio-room.blend docs/design/room-source.md && git commit -m "art: align Blender living zone" && git push -u origin room/05-blender-living-zone`. Stop for review.

### Task 6: Reframe every Blender camera anchor

**Branch:** `room/06-blender-cameras`

**Files:**

- Modify: `assets/blender/portfolio-room.blend`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: approved full Blender composition.
- Produces: corrected `CAM_Overview`, new `CAM_Anchor_Desk`, and usable focus anchors for every detail node.

- [ ] **Step 1: Create the branch after Task 5 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/06-blender-cameras`.

- [ ] **Step 2: Raise and align `CAM_Overview`**

Match the Penpot overview while keeping every approved object inside the desktop frame and leaving no unnecessary empty border.

- [ ] **Step 3: Add and frame the desk anchor**

Create `CAM_Anchor_Desk` so the screen and smartphone are both legible and the controller is not presented as a desk choice.

- [ ] **Step 4: Reframe all detail anchors**

Adjust Monitor, Smartphone, Controller, Homelab, Diploma, Volleyball, Bookshelf, and ContactCard anchors. Each target must dominate its frame while preserving local context and panel clearance.

- [ ] **Step 5: Produce the camera contact sheet**

Capture overview plus all nine focus views. Reject any frame showing mostly wall, floor, or off-scene space.

- [ ] **Step 6: Save, document, commit, and push**

Record the accepted camera list in `room-source.md`, then run: `git add assets/blender/portfolio-room.blend docs/design/room-source.md && git commit -m "art: correct Blender camera anchors" && git push -u origin room/06-blender-cameras`. Stop for review.

### Task 7: Author the Blender curtain and lighting transition

**Branch:** `room/07-blender-lighting`

**Files:**

- Modify: `assets/blender/portfolio-room.blend`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: approved geometry and `LIGHT_Daylight`, `LIGHT_Window`, `LIGHT_Lamp` anchors.
- Produces: `Curtain_*` clips with 0.9-second duration and verified day/night endpoints.

- [ ] **Step 1: Create the branch after Task 6 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/07-blender-lighting`.

- [ ] **Step 2: Rebuild the curtain clips**

Animate both curtains from fully open to fully closed over 0.9 seconds. The movement must be visible from `CAM_Overview` and must not expose light behind a closed curtain.

- [ ] **Step 3: Verify the lighting anchors and emitters**

Keep the purple lamp origin at `LIGHT_Lamp`, daylight at `LIGHT_Daylight`, window fill at `LIGHT_Window`, and all `EMIT_*` meshes separate for runtime control.

- [ ] **Step 4: Inspect animation frames**

Capture open, midpoint, and closed frames. Confirm the curtains move continuously, close completely, and do not intersect the window or each other.

- [ ] **Step 5: Save, document, commit, and push**

Record clip names and duration, then run: `git add assets/blender/portfolio-room.blend docs/design/room-source.md && git commit -m "art: synchronize curtains and lighting" && git push -u origin room/07-blender-lighting`. Stop for review.

### Task 8: Optimize and export the approved runtime assets

**Branch:** `room/08-glb-export`

**Files:**

- Modify: `assets/blender/portfolio-room-optimized.blend`
- Modify: `public/assets/room/portfolio-room.glb`
- Modify: `public/assets/room/room-poster-day.webp`
- Modify: `public/assets/room/room-poster-night.webp`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: approved master from Task 7.
- Produces: one optimized GLB plus matching day/night posters; stable nodes remain separate.

- [ ] **Step 1: Create the branch after Task 7 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/08-glb-export`.

- [ ] **Step 2: Build the optimized derivative**

Join only compatible static single-material meshes. Preserve all `INT_*`, `CTL_*`, `CAM_*`, `LIGHT_*`, `EMIT_*`, `Flag_FR`, `Flag_EN`, animated curtains, monitor surfaces, and server lights.

- [ ] **Step 3: Export GLB and posters**

Export the GLB with cameras, lights, and animations enabled. Render day and night posters through `CAM_Overview` using the same aspect and framing as the site.

- [ ] **Step 4: Run existing asset and build checks**

Run: `npm run assets:check && npm run build`  
Expected: both exit 0; the old contract nodes remain intact while the new nodes are present as extras.

- [ ] **Step 5: Measure and record the asset**

Record GLB bytes, named-node count, mesh count, animation names/durations, and poster dimensions in `room-source.md`. Keep the GLB below 8 MB; stop for review above 12 MB.

- [ ] **Step 6: Commit, push, and stop for review**

Run: `git add assets/blender/portfolio-room-optimized.blend public/assets/room/portfolio-room.glb public/assets/room/room-poster-day.webp public/assets/room/room-poster-night.webp docs/design/room-source.md && git commit -m "art: export aligned room assets" && git push -u origin room/08-glb-export`  
Expected: the branch contains only approved optimized/runtime assets and their receipt. Stop before runtime code changes.

### Task 9: Add the desk hierarchy and locale flag to the runtime contract

**Branch:** `room/09-desk-navigation`

**Files:**

- Modify: `src/content/types.ts`
- Modify: `src/content/portfolioContent.ts`
- Modify: `src/content/portfolioContent.test.ts`
- Modify: `src/room/sceneManifest.ts`
- Modify: `src/room/sceneManifest.test.ts`
- Modify: `scripts/glb-contract.mjs`
- Modify: `scripts/glb-contract.test.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/room/hashNavigation.ts`
- Modify: `src/room/AccessibleRoomControls.tsx`
- Modify: `src/room/AccessibleRoomControls.test.tsx`
- Modify: `src/room/RoomScene.tsx`
- Modify: `src/room/RoomScene.test.tsx`
- Modify: `src/room/RoomCanvas.tsx`
- Modify: `src/room/RoomModel.tsx`
- Modify: `src/room/RoomModel.test.tsx`
- Modify: `src/room/hashNavigation.test.ts`
- Modify: `tests/e2e/portfolio.spec.ts`

**Interfaces:**

- Produces: `RoomObjectId` including `'desk'`; `SceneAction` including `'focus-zone'`; `SceneObjectDefinition.parentId?: RoomObjectId`; `parentRoomObjectId(id): RoomObjectId | null`; `roomObjectIdsForContext(activeObject): RoomObjectId[]`; `RoomHistoryState = {roomObjectId: RoomObjectId; parentId: RoomObjectId | null}`; locale-aware `RoomModel` flag visibility.
- Behavior: monitor and smartphone declare `parentId: 'desk'`; closing selects the declared parent, otherwise overview.

- [ ] **Step 1: Create the branch after Task 8 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/09-desk-navigation`.

- [ ] **Step 2: Write failing content, manifest, and GLB-contract tests**

Assert `desk → INT_Desk → CAM_Anchor_Desk → focus-zone`; monitor and smartphone parent to desk; `Flag_FR` and `Flag_EN` are required GLB nodes; the desk has non-empty French/English labels; every focus or focus-zone action has an anchor.

- [ ] **Step 3: Verify the contract tests fail**

Run: `npm test -- src/content/portfolioContent.test.ts src/room/sceneManifest.test.ts scripts/glb-contract.test.ts && npm run assets:check`  
Expected: FAIL on missing desk and flag-variant contract entries.

- [ ] **Step 4: Implement the minimal scene contract**

Add `desk` to `RoomObjectId` and `portfolioContent.roomObjects`. Add `focus-zone` and optional `parentId` to `SceneObjectDefinition`; add `parentRoomObjectId(id)`, `roomObjectIdsForContext(activeObject)`, and the desk/child definitions. Overview context returns top-level nodes only; desk or either child context adds monitor and smartphone while retaining top-level and global controls. Extend the GLB contract with `INT_Desk`, `CAM_Anchor_Desk`, `Flag_FR`, and `Flag_EN`.

- [ ] **Step 5: Write failing nested-navigation tests**

In `App.test.tsx`, assert overview desk click opens no dialog and sets `#room/desk`; monitor from desk opens projects; its close returns `#room/desk`; the next close clears the hash; direct `#room/monitor` closes to desk; controller opens game projects directly. In hash tests, pin `RoomHistoryState` recognition for internal selections versus direct external hashes. In accessible-controls tests, assert overview controls show top-level objects, desk context exposes monitor and smartphone, and a visible localized back button calls `onClose`.

- [ ] **Step 6: Implement nested navigation without new state**

Keep `activeObject` as the current leaf. In `App`, route a child selected outside its parent to the parent first and render `ObjectDetails` only for `action === 'focus'`. Push `RoomHistoryState` for in-app selections; close with browser Back when the state records the expected parent, otherwise replace a direct child URL with its parent hash. Pass `onClose` through `RoomScene` to `AccessibleRoomControls`, render its visible back button whenever a focus is active, and derive the remaining controls with `roomObjectIdsForContext`.

- [ ] **Step 7: Implement current-language flag visibility**

Pass `locale` through `RoomScene → RoomCanvas → RoomModel`. In `RoomModel`, set `Flag_FR.visible` for French and `Flag_EN.visible` for English; fail scene preparation if either named child is absent.

- [ ] **Step 8: Verify unit, component, asset, and browser behavior**

Run: `npm test -- src/content src/app src/room scripts/glb-contract.test.ts && npm run assets:check && npm run build && npm run test:e2e -- --grep "routes focus"`  
Expected: all pass.

- [ ] **Step 9: Commit, push, and stop for review**

Run: `git commit -am "feat: add nested desk navigation" && git push -u origin room/09-desk-navigation`.

### Task 10: Correct responsive runtime camera behavior

**Branch:** `room/10-camera-runtime`

**Files:**

- Modify: `src/room/CameraRig.tsx`
- Modify: `src/room/CameraRig.test.tsx`
- Modify: `src/room/RoomCanvas.tsx`
- Modify: `src/room/RoomCanvas.test.tsx`
- Modify: `src/room/sceneMotion.ts`
- Modify: `src/room/sceneMotion.test.ts`
- Modify: `tests/e2e/portfolio.spec.ts`

**Interfaces:**

- Produces: `DESKTOP_CAMERA_ZOOM = 65`, `MOBILE_CAMERA_ZOOM = 45`, `MOBILE_CAMERA_BREAKPOINT = 640`; pointer parallax disabled at or below the breakpoint and during any anchored focus.

- [ ] **Step 1: Create the branch after Task 9 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/10-camera-runtime`.

- [ ] **Step 2: Write failing camera tests**

Assert desk selects `CAM_Anchor_Desk`, every focus ID reports its expected anchor, width 390 applies zoom 45 and disables pointer follow, width 1280 applies zoom 65, and reduced motion snaps directly to the target.

- [ ] **Step 3: Verify the tests fail**

Run: `npm test -- src/room/CameraRig.test.tsx src/room/RoomCanvas.test.tsx src/room/sceneMotion.test.ts`  
Expected: FAIL on missing desk and responsive camera values.

- [ ] **Step 4: Implement responsive zoom and parallax gating**

Move the three constants to `sceneMotion.ts`. Read R3F viewport width in `CameraRig`, update the orthographic camera zoom and projection matrix, and allow pointer parallax only above 640 px while no anchor is active.

- [ ] **Step 5: Add browser camera assertions**

Cover overview, desk, monitor, smartphone, controller, and return navigation through `data-camera-target`; repeat overview and desk at 390 × 844 with the bottom sheet visible.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/room && npm run build && npm run test:e2e -- --grep "camera|mobile"`  
Expected: all pass. Commit with `git commit -am "fix: align responsive room cameras"`, push, and stop for review.

### Task 11: Synchronize runtime lighting and visible idle motion

**Branch:** `room/11-room-motion`

**Files:**

- Modify: `src/room/RoomLighting.tsx`
- Modify: `src/room/RoomLighting.test.tsx`
- Modify: `src/room/RoomIdle.tsx`
- Modify: `src/room/RoomIdle.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/styles/global.css`
- Modify: `tests/e2e/portfolio.spec.ts`

**Interfaces:**

- Produces: `LIGHTING_TRANSITION_SECONDS = 0.9`; one guarded curtain toggle; synchronized curtain, daylight, lamp, emitters, and HTML-theme progress.

- [ ] **Step 1: Create the branch after Task 10 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/11-room-motion`.

- [ ] **Step 2: Write failing transition and interaction tests**

Assert progress reaches 1 after 0.9 seconds, daylight falls before lamp rise, closed curtains have zero window light, a second click before 900 ms is ignored, a click after 900 ms starts the reverse transition, and reduced motion reaches the final frame immediately.

- [ ] **Step 3: Verify the tests fail**

Run: `npm test -- src/room/RoomLighting.test.tsx src/room/RoomIdle.test.tsx src/app/App.test.tsx`  
Expected: FAIL on explicit duration and repeat-click guard.

- [ ] **Step 4: Implement the 0.9-second transition**

Advance `RoomLighting` progress by `deltaSeconds / LIGHTING_TRANSITION_SECONDS`; retain the approved staged `lightingFrame`. Guard curtain interaction in `App` for 900 ms, bypassing motion delay under `prefers-reduced-motion`. Add the same 900 ms theme/background transition in CSS.

- [ ] **Step 5: Remove competing curtain idle transforms and verify ambient targets**

Delete the curtain rotation loop from `RoomIdle`. Keep visible monitor cursor/code emission, server LEDs, and smartphone notification; pause them for hidden documents and reduced motion.

- [ ] **Step 6: Add the browser timing journey**

Assert curtains enter transition, do not accept a second toggle before 900 ms, finish with night lamp/theme, reverse after completion, and apply immediately under reduced motion.

- [ ] **Step 7: Verify and commit**

Run: `npm test -- src/app src/room && npm run build && npm run test:e2e -- --grep "lighting|motion"`  
Expected: all pass. Commit with `git commit -am "feat: synchronize room motion and lighting"`, push, and stop for review.

### Task 12: Run final visual, accessibility, fallback, and performance acceptance

**Branch:** `room/12-room-acceptance`

**Files:**

- Modify: `tests/e2e/portfolio.spec.ts`
- Modify: `docs/design/room-source.md`
- Modify: `README.md`

**Interfaces:**

- Consumes: all merged room increments.
- Produces: complete regression journeys and a handoff recording measured acceptance.

- [ ] **Step 1: Create the branch after Task 11 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/12-room-acceptance`.

- [ ] **Step 2: Complete the end-to-end journeys**

Cover overview → desk → monitor → desk → overview; overview → desk → smartphone → desk → overview; direct controller; direct child hashes; invalid hashes; Back/Escape; current-language flag; day/night timing; mobile bottom sheet; reduced motion; hidden-tab pause; and GLB failure with contextual HTML controls.

- [ ] **Step 3: Run the complete automated verification**

Run: `npm run format:check && npm test && npm run assets:check && npm run build && npm run test:e2e`  
Expected: every command exits 0.

- [ ] **Step 4: Perform the visual acceptance pass**

Capture desktop day, desktop night, 390 × 844 overview, desk, and every focus anchor. Overlay the desktop overview with `penpot-room.png`; verify no approved object is cropped and no focus view shows mostly empty space.

- [ ] **Step 5: Record performance and handoff**

Record GLB size, named nodes, draw calls, desktop physical-GPU FPS, mobile FPS, first useful render, and all visual approvals in `room-source.md`. Update README with the new desk interaction and current-language flag behavior.

- [ ] **Step 6: Commit, push, and stop for final review**

Run: `git add tests/e2e/portfolio.spec.ts docs/design/room-source.md README.md && git commit -m "test: accept aligned interactive room" && git push -u origin room/12-room-acceptance`  
Expected: final acceptance branch contains tests and handoff only, not deferred feature work.

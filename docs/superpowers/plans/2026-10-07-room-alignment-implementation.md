# Room Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Canva, Figma, Blender, the exported GLB, and the website with the approved room composition and nested desk interaction, delivered through small independently reviewed branches.

**Architecture:** Work strictly downstream from the approved Canva source: synchronize Figma, correct the editable Blender master by room zone, validate and export one GLB, then adapt the existing manifest-driven React flow. Keep one active room-object ID as the current leaf; declare `desk` as the parent of `monitor` and `smartphone` in the scene manifest so closing and deep-link behavior are derived without a router or a new state library.

**Tech Stack:** Canva, Figma, Blender 5.1+, GLB/glTF 2.0, React 19, TypeScript, React Three Fiber, Three.js, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-07-room-alignment-design.md`

## Global Constraints

- Source order is `Canva → Figma → Blender → GLB → website`; downstream stages never redefine upstream placement.
- Canva design `DAHXRbROrBI`, composition page `PBJZjL4025zP7qR5`, day/night page `PB0t5GKtxrdXyD6x`, and inventory page `PBxZGj9ln7xdLGlT` are the external source records.
- Figma file `mESnsD8GuPIigFtJiQ29Ki`, page `0:1`, mirrors Canva; if MCP quota is exhausted, stop that task for user action instead of approximating.
- Keep one GLB, the existing React state approach, and the existing dependencies. Add no router, state library, animation library, or paid generated asset.
- Keep every current `INT_*`, `CTL_*`, `CAM_Anchor_*`, `LIGHT_*`, `EMIT_*`, and idle node stable; add `INT_Desk`, `CAM_Anchor_Desk`, `Flag_FR`, and `Flag_EN`.
- The day/night transition lasts exactly `0.9` seconds, within the approved 0.8–1.0 second range.
- Each task uses its named branch, is pushed and reviewed separately, and is merged before the next task branches from updated `main`.
- Each branch must pass its listed checks before push. Do not batch multiple tasks into one branch or one final push.
- Preserve keyboard access, the HTML/WebGL fallback, reduced motion, hidden-tab pause, bilingual labels, and mobile bottom-sheet behavior.
- Baseline specification commit is `3067a26`.

## Review Focus

- A direct `#room/monitor` or `#room/smartphone` load must retain `desk` as its close target; pin this in Task 9 application tests.
- Browser Back and `Escape` must traverse `detail → desk → overview` without skipping or duplicating history; pin this in Tasks 9 and 12.
- Repeated curtain clicks inside 900 ms must not reverse or desynchronize the room and HTML theme; pin this in Task 11.
- A missing GLB or WebGL failure must leave the poster and the complete contextual HTML controls usable; pin this in Task 12.
- At 390 × 844, overview and focus views must keep their subject visible while the bottom sheet is open; pin this in Tasks 10 and 12.

---

## File Map

- `assets/references/canva-room.png`: exported canonical Canva composition.
- `assets/references/figma-room.png`: Figma synchronization proof at the same 1920 × 1080 frame.
- `assets/blender/portfolio-room.blend`: editable Blender master changed zone by zone.
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

### Task 1: Update the canonical Canva composition

**Branch:** `room/01-canva-composition`

**Files:**

- Modify: `assets/references/canva-room.png`
- Modify: `docs/design/room-source.md`
- External: Canva design `DAHXRbROrBI`, pages 2–4

**Interfaces:**

- Consumes: approved composition in the spec.
- Produces: one approved 1920 × 1080 Canva reference used by every later task.

- [ ] **Step 1: Create the isolated branch from updated `main`**

Run: `git switch main && git pull --ff-only && git switch -c room/01-canva-composition`  
Expected: clean branch based on commit `3067a26` or its merged descendant.

- [ ] **Step 2: Update Canva composition page 2**

Keep the server in the rear corner and the bookshelf on the right. Add the contact card above the smaller left-of-desk plant; keep laptop left and screen central; place the smartphone right of the screen; remove the under-desk tower; place volleyball left of the coffee table; place controller left and plant right on the coffee table; remove other table objects; replace the wall cabinet/books above the bookshelf with the current-language flag.

- [ ] **Step 3: Synchronize Canva day/night and inventory pages**

Apply the same object arrangement to page 3 day/night states and page 4 inventory. Preserve the current desk, chair, sofa, cushions, server corner, bookshelf location, palette, and room proportions.

- [ ] **Step 4: Export and visually verify the canonical reference**

Export composition page 2 at 1920 × 1080 to `assets/references/canva-room.png`. Check every placement against the spec and obtain visual approval before continuing.

- [ ] **Step 5: Record the Canva receipt**

Update `docs/design/room-source.md` with design ID, page IDs, edit/view links, export dimensions, retrieval date, and the approved object-placement list.

- [ ] **Step 6: Commit, push, and stop for review**

Run: `git add assets/references/canva-room.png docs/design/room-source.md && git commit -m "design: align canonical Canva room" && git push -u origin room/01-canva-composition`  
Expected: one visual-source commit; do not begin Task 2 until this branch is reviewed and merged.

### Task 2: Synchronize the Figma production page

**Branch:** `room/02-figma-sync`

**Files:**

- Create: `assets/references/figma-room.png`
- Modify: `docs/design/room-source.md`
- External: Figma file `mESnsD8GuPIigFtJiQ29Ki`, page `0:1`

**Interfaces:**

- Consumes: Task 1 `canva-room.png`.
- Produces: a Figma room frame matching Canva and preserving the existing HTML-panel/typography role.

- [ ] **Step 1: Create the branch after Task 1 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/02-figma-sync`

- [ ] **Step 2: Confirm Figma access before mutation**

Load `figma:figma-use`, inspect page `0:1`, and confirm the edit quota. If the Starter-plan limit remains active, stop and ask for quota renewal or a manual user edit; do not create a substitute file.

- [ ] **Step 3: Mirror the approved Canva frame**

Reproduce the Task 1 composition at 1920 × 1080. Keep HTML panel and typography components separate from the room-art frame. Use France/United Kingdom variants for the current-language flag.

- [ ] **Step 4: Compare and export**

Export the room frame to `assets/references/figma-room.png`. Overlay it at 50% opacity with `canva-room.png`; object silhouettes and placements must coincide, allowing only Figma annotations outside the production frame.

- [ ] **Step 5: Record the Figma receipt and verify review**

Add file key, page/node IDs, export dimensions, comparison date, and approval result to `room-source.md`.

- [ ] **Step 6: Commit, push, and stop for review**

Run: `git add assets/references/figma-room.png docs/design/room-source.md && git commit -m "design: synchronize Figma room" && git push -u origin room/02-figma-sync`

### Task 3: Correct the Blender desk zone

**Branch:** `room/03-blender-desk-zone`

**Files:**

- Modify: `assets/blender/portfolio-room.blend`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: approved Canva/Figma frames.
- Produces: `INT_Desk`, corrected desk furniture, and the desk-area interactive children required by later code.

- [ ] **Step 1: Create the branch and inspect the live master**

Run: `git switch main && git pull --ff-only && git switch -c room/03-blender-desk-zone`. Open `portfolio-room.blend`; use Blender scene info and a camera render to record the current desk-zone bounds.

- [ ] **Step 2: Correct only the desk-zone geometry**

Flatten and enlarge the desk to the Canva dimensions; face the chair toward it; keep the laptop left; correct the central screen; place smartphone right of the screen; remove the under-desk tower; shrink the left floor plant; place the contact card above that plant.

- [ ] **Step 3: Establish stable desk roots**

Create `INT_Desk` around the desk interaction surface without renaming `INT_Monitor`, `INT_Smartphone`, or `INT_ContactCard`. Keep those three nodes independently pickable.

- [ ] **Step 4: Validate the zone visually and structurally**

Render through `CAM_Overview`, compare the desk zone with Canva/Figma, and query the four `INT_*` roots for bounds, children, and transforms. No modified object may intersect the desk surface or floor unintentionally.

- [ ] **Step 5: Save, document, commit, push, and stop**

Save the master, add the visual-review result to `room-source.md`, then run: `git add assets/blender/portfolio-room.blend docs/design/room-source.md && git commit -m "art: align Blender desk zone" && git push -u origin room/03-blender-desk-zone`.

### Task 4: Correct the Blender rear and right zones

**Branch:** `room/04-blender-rear-zone`

**Files:**

- Modify: `assets/blender/portfolio-room.blend`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: Task 3 master.
- Produces: aligned homelab, bookshelf, language flag variants, EPITA diploma, and purple lamp.

- [ ] **Step 1: Create the branch after Task 3 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/04-blender-rear-zone`.

- [ ] **Step 2: Align the rear corner and bookshelf**

Move and reshape `INT_Homelab` to the rear corner. Preserve the bookshelf on the right, fill it, and align its silhouette to Canva.

- [ ] **Step 3: Replace the wall shelf with language variants**

Remove the small wall cabinet/shelf and books above the bookshelf. Under `CTL_Flag`, create child meshes `Flag_FR` and `Flag_EN` at the approved position; both occupy identical bounds and only one will be visible at runtime.

- [ ] **Step 4: Correct diploma and lamp**

Rebuild the `INT_Diploma` visual as blue-and-white EPITA artwork and place it from Canva. Move the purple lamp and `LIGHT_Lamp` to the approved position without changing the stable light name.

- [ ] **Step 5: Validate, save, document, commit, and push**

Render the rear/right zone and inspect `INT_Homelab`, `INT_Bookshelf`, `INT_Diploma`, `CTL_Flag`, `Flag_FR`, `Flag_EN`, and `LIGHT_Lamp`. Save, then run: `git add assets/blender/portfolio-room.blend docs/design/room-source.md && git commit -m "art: align Blender rear zone" && git push -u origin room/04-blender-rear-zone`. Stop for review.

### Task 5: Correct the Blender living zone

**Branch:** `room/05-blender-living-zone`

**Files:**

- Modify: `assets/blender/portfolio-room.blend`
- Modify: `docs/design/room-source.md`

**Interfaces:**

- Consumes: Task 4 master.
- Produces: aligned sofa, contained cushions, coffee table, controller, plant, and volleyball.

- [ ] **Step 1: Create the branch after Task 4 is merged**

Run: `git switch main && git pull --ff-only && git switch -c room/05-blender-living-zone`.

- [ ] **Step 2: Match the sofa and cushions**

Align the sofa to Canva. Resize and reposition every cushion so its world bounds remain inside the sofa bounds.

- [ ] **Step 3: Match the coffee table contents**

Correct the table silhouette and placement. Put `INT_Controller` on the left and the small plant on the right; remove all other table objects.

- [ ] **Step 4: Place the volleyball**

Move `INT_Volleyball` to the floor left of the coffee table, visibly clear of the rug, sofa, and table geometry.

- [ ] **Step 5: Validate, save, document, commit, and push**

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

Match the Canva overview while keeping every approved object inside the desktop frame and leaving no unnecessary empty border.

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

Capture desktop day, desktop night, 390 × 844 overview, desk, and every focus anchor. Overlay the desktop overview with `canva-room.png`; verify no approved object is cropped and no focus view shows mostly empty space.

- [ ] **Step 5: Record performance and handoff**

Record GLB size, named nodes, draw calls, desktop physical-GPU FPS, mobile FPS, first useful render, and all visual approvals in `room-source.md`. Update README with the new desk interaction and current-language flag behavior.

- [ ] **Step 6: Commit, push, and stop for final review**

Run: `git add tests/e2e/portfolio.spec.ts docs/design/room-source.md README.md && git commit -m "test: accept aligned interactive room" && git push -u origin room/12-room-acceptance`  
Expected: final acceptance branch contains tests and handoff only, not deferred feature work.

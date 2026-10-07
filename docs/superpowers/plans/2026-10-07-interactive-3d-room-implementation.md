# Interactive 3D Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current flattened room with the approved Canva-faithful Blender scene, real camera motion, functional object interactions, day/night lighting, and restrained idle animation without losing the existing bilingual and accessible portfolio.

**Architecture:** Blender owns one named-node GLB containing geometry, materials, lights, clips, and camera anchors. React Three Fiber renders that scene and handles camera, picking, and procedural motion; the existing React reducer, typed content, URL state, and HTML panels remain authoritative for portfolio behavior and copy. A static poster and structured HTML navigation remain available before, without, or after a WebGL failure.

**Tech Stack:** Vite 8, React 19, TypeScript, Three.js, React Three Fiber, Drei, Blender, GLB/glTF, plain CSS, Vitest, Testing Library, Playwright, GitHub Actions, Vercel

**Spec:** `docs/superpowers/specs/2026-10-07-interactive-3d-room-design.md`

## Global Constraints

- Canva remains the visual source of truth; Blender is the source of runtime geometry, materials, lights, clips, and camera anchors.
- Keep personal data and both languages in `src/content/portfolioContent.ts`; do not bake editorial copy into textures or the GLB.
- Use one main GLB initially, target less than 8 MB, and require review above 12 MB.
- Preserve the Node range `^20.19.0 || >=22.12.0` and pin frontend dependencies in `package-lock.json`.
- Use stable Blender node names from the specification and fail asset validation when required nodes or anchors are missing.
- Model the complete decor; bind input handlers only to the ten functional nodes.
- Curtains and flag perform local actions without camera travel or detail panels.
- Content objects use directed camera travel; pointer-follow is active only in overview on pointer-capable, non-reduced-motion devices.
- Use open curtains plus natural light for day; use closed opaque curtains plus artificial lamp light for night, with no light behind the curtains.
- Keep the existing HTML navigation, keyboard access, focus restoration, hash navigation, mobile bottom sheet, reduced-motion behavior, and poster fallback.
- Do not add a state library, animation library, post-processing stack, runtime LOD system, or multiple GLBs without a measured need.

## Review Focus

- Missing, corrupt, or renamed GLB nodes must show the poster fallback and a readable diagnostic instead of a blank room — pinned in Tasks 2 and 4.
- Pointer leave, focus travel, touch input, and reduced motion must all stop parallax and return to a valid camera pose — pinned in Task 5.
- Rapid clicks, browser Back, `Escape`, and control-object clicks must never leave two active panels or move the camera for curtains/flag — pinned in Task 7.
- Night mode must set window light to zero before the artificial lamp reaches its target intensity — pinned in Task 6.
- Hidden tabs and reduced motion must stop non-essential frame work while leaving static state indicators correct — pinned in Task 6.

---

## File Structure

- `assets/references/canva-room.png`: approved high-resolution Canva composition used by the Blender camera.
- `assets/blender/portfolio-room.blend`: editable 3D source.
- `public/assets/room/portfolio-room.glb`: exported runtime scene.
- `public/assets/room/room-poster-day.webp`, `room-poster-night.webp`: immediate and failure-state posters.
- `scripts/glb-contract.mjs`, `scripts/validate-room-glb.mjs`: dependency-free GLB node-contract parser and repository check.
- `src/room/sceneManifest.ts`: portfolio ID, Blender node, camera anchor, and action mapping.
- `src/room/sceneMotion.ts`: centralized pointer and camera interpolation constants plus pure frame-rate-independent math.
- `src/room/RoomCanvas.tsx`: WebGL boundary, Suspense, readiness, and failure fallback.
- `src/room/RoomModel.tsx`: GLB binding, functional-node events, and hover/focus feedback.
- `src/room/CameraRig.tsx`: overview parallax and directed anchor travel.
- `src/room/RoomLighting.tsx`: day/night light and curtain clip coordination.
- `src/room/RoomIdle.tsx`: monitor, rack, screen, and smartphone procedural motion.
- `src/room/RoomScene.tsx`: HTML/3D composition and accessible interaction bridge.
- `src/app/App.tsx`: existing application state and action routing.
- Existing detail, content, preference, hash, and project modules remain in place.

### Task 1: Lock the scene manifest and smartphone content ID

**Files:**
- Create: `src/room/sceneManifest.ts`
- Create: `src/room/sceneManifest.test.ts`
- Modify: `src/content/types.ts`
- Modify: `src/content/portfolioContent.ts`
- Modify: `src/content/portfolioContent.test.ts`
- Modify: tests and components that currently use `notebook`

**Interfaces:**
- Produces: `SceneAction = "focus" | "toggle-lighting" | "toggle-locale"`.
- Produces: `SceneObjectDefinition { id: RoomObjectId; nodeName: string; cameraAnchorName?: string; action: SceneAction }`.
- Produces: `sceneManifest: Record<RoomObjectId, SceneObjectDefinition>`.
- Replaces: room object ID `notebook` with `smartphone` everywhere.

- [ ] **Step 1: Write failing manifest tests**

Assert the exact ten IDs, exact node names from the specification, `CAM_Anchor_*` presence for all eight `focus` objects, and absence of camera anchors for `window` and `flag`. Assert every content ID has exactly one manifest entry.

- [ ] **Step 2: Run the focused tests**

Run: `npm test -- src/room/sceneManifest.test.ts src/content/portfolioContent.test.ts`  
Expected: FAIL because `sceneManifest` and the `smartphone` ID do not exist.

- [ ] **Step 3: Implement the manifest and rename the ID**

Keep the manifest literal and typed; do not create a registry builder. Map `smartphone` to `INT_Smartphone`, `focus`, and `CAM_Anchor_Smartphone`.

- [ ] **Step 4: Run unit and type checks**

Run: `npm test -- src/room/sceneManifest.test.ts src/content/portfolioContent.test.ts && npm run build`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "refactor(room): define 3d scene contract"
```

### Task 2: Produce and validate the Blender scene

**Files:**
- Create: `assets/references/canva-room.png`
- Create: `assets/blender/portfolio-room.blend`
- Create: `public/assets/room/portfolio-room.glb`
- Create: `public/assets/room/room-poster-day.webp`
- Create: `public/assets/room/room-poster-night.webp`
- Create: `scripts/glb-contract.mjs`
- Create: `scripts/glb-contract.test.ts`
- Create: `scripts/validate-room-glb.mjs`
- Modify: `package.json`
- Modify: `docs/design/room-source.md`

**Interfaces:**
- Consumes: exact `nodeName` and `cameraAnchorName` values from Task 1.
- Produces: `readGlbNodeNames(buffer: ArrayBuffer) -> Set<string>` and `REQUIRED_ROOM_NODES`.
- Produces: npm script `assets:check` validating the exported GLB against `sceneManifest`'s documented contract.
- Produces: one GLB with `CAM_Overview`, eight focus anchors, ten functional nodes, day/night lights, curtain actions, and idle-animation targets.

- [ ] **Step 1: Write failing GLB contract tests**

Use a minimal in-memory GLB fixture. Assert valid headers expose node names; truncated data, a bad magic value, a missing JSON chunk, and missing required nodes each produce an explicit error. Import `sceneManifest` and assert its exported node and anchor names exactly match `REQUIRED_ROOM_NODES` so the validator cannot drift from runtime code.

- [ ] **Step 2: Run the parser test**

Run: `npm test -- scripts/glb-contract.test.ts`  
Expected: FAIL because the parser does not exist.

- [ ] **Step 3: Implement the dependency-free GLB contract parser and CLI check**

Parse only the GLB header and JSON chunk needed to read `json.nodes[].name`. Keep binary validation bounded and reject chunk lengths outside the supplied buffer.

- [ ] **Step 4: Run the parser test**

Run: `npm test -- scripts/glb-contract.test.ts`  
Expected: PASS.

- [ ] **Step 5: Build the Canva-aligned Blender blockout**

Create the six approved collections, align and lock `CAM_Overview` against `assets/references/canva-room.png`, and place every major object before adding detail. Produce an overlay comparison that confirms room bounds, furniture placement, window, desk, sofa, homelab, and wall objects match the reference.

- [ ] **Step 6: Model and name the complete scene**

Finish the controller, smartphone, detailed homelab, EPITA diploma, volleyball, flag, curtains, contact card, bookshelf, monitor, furniture, and remaining decor. Keep only functional objects, curtain pieces, flag, screen surface, rack lights, and animation helpers separate.

- [ ] **Step 7: Author materials, lights, clips, and anchors**

Create the day and night lighting states, ensure closed curtains are opaque with no window emitter, create curtain clips and idle targets, then frame each focus object with its named camera anchor.

- [ ] **Step 8: Export and validate**

Export the GLB and day/night posters, then run: `npm run assets:check`  
Expected: PASS with all required nodes and anchors listed; GLB below 8 MB preferred and never accepted above 12 MB without review.

- [ ] **Step 9: Commit**

```bash
git add assets public/assets/room scripts package.json docs/design/room-source.md
git commit -m "feat(assets): add canva-aligned blender room"
```

### Task 3: Add the minimal React Three Fiber boundary

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/room/RoomCanvas.tsx`
- Create: `src/room/RoomCanvas.test.tsx`
- Modify: `src/room/RoomScene.tsx`
- Modify: `src/room/room.css`

**Interfaces:**
- Produces: `RoomCanvasProps { lighting: Lighting; activeObject: RoomObjectId | null; onInteract(id: RoomObjectId): void; onReady(): void; onError(error: Error): void }`.
- Produces: a Canvas/Suspense boundary that keeps the matching poster visible until the GLB is ready and after a WebGL or asset failure.

- [ ] **Step 1: Install the renderer dependencies**

Run: `npm install three @react-three/fiber @react-three/drei && npm install -D @types/three`  
Expected: dependency resolution succeeds with React 19 and the lockfile changes once.

- [ ] **Step 2: Write failing boundary tests**

Mock the R3F Canvas. Assert the day/night poster renders before readiness, disappears after `onReady`, and remains with a readable fallback when `onError` fires.

- [ ] **Step 3: Run the focused test**

Run: `npm test -- src/room/RoomCanvas.test.tsx`  
Expected: FAIL because `RoomCanvas` does not exist.

- [ ] **Step 4: Implement the minimal Canvas boundary**

Use one `<Canvas>` and React `Suspense`; do not add post-processing, controls, a loader package, or a second canvas.

- [ ] **Step 5: Run the focused test and build**

Run: `npm test -- src/room/RoomCanvas.test.tsx && npm run build`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/room
git commit -m "feat(room): add 3d canvas boundary"
```

### Task 4: Bind GLB nodes to portfolio interactions

**Files:**
- Create: `src/room/RoomModel.tsx`
- Create: `src/room/RoomModel.test.tsx`
- Modify: `src/room/RoomCanvas.tsx`
- Modify: `src/room/RoomScene.tsx`
- Modify: `src/room/room.css`
- Remove after replacement: `src/room/roomGeometry.ts`, `src/room/RoomArtwork.tsx`, obsolete geometry/artwork tests

**Interfaces:**
- Consumes: `sceneManifest` from Task 1 and `/assets/room/portfolio-room.glb` from Task 2.
- Produces: `RoomModelProps { activeObject: RoomObjectId | null; onInteract(id: RoomObjectId): void; onReady(): void }`.
- Produces: pointer handlers only on manifest nodes; decorative GLB nodes never receive handlers.

- [ ] **Step 1: Write failing model-binding tests**

Mock `useGLTF` with required and decorative nodes. Assert each manifest node calls `onInteract` with the correct ID, decoration does nothing, missing required nodes call the boundary error path, and hover affects only the dedicated functional-object material.

- [ ] **Step 2: Run the focused test**

Run: `npm test -- src/room/RoomModel.test.tsx`  
Expected: FAIL because the model binding does not exist.

- [ ] **Step 3: Implement direct manifest binding**

Load the GLB once, resolve nodes by exact name, attach pointer events to the ten functional nodes, stop propagation on handled input, and set the canvas cursor to `pointer` only while a functional node is hovered.

- [ ] **Step 4: Replace flattened artwork composition**

Make `RoomScene` host `RoomCanvas` and the poster fallback. Delete normalized Figma/Canva hotspot geometry only after its tests and imports have been replaced.

- [ ] **Step 5: Run room tests and build**

Run: `npm test -- src/room && npm run build`  
Expected: PASS with no import of `roomGeometry`, `RoomArtwork`, or image hotspots.

- [ ] **Step 6: Commit**

```bash
git add src/room
git commit -m "feat(room): bind portfolio actions to glb nodes"
```

### Task 5: Implement camera anchors and smooth pointer follow

**Files:**
- Create: `src/room/sceneMotion.ts`
- Create: `src/room/sceneMotion.test.ts`
- Create: `src/room/CameraRig.tsx`
- Create: `src/room/CameraRig.test.tsx`
- Modify: `src/room/RoomCanvas.tsx`

**Interfaces:**
- Produces: `sceneMotion` constants for 14 px-equivalent horizontal travel, 8 px-equivalent vertical travel, 1.25-degree rotation, and base interpolation `0.075`.
- Produces: `frameLerpFactor(deltaSeconds: number, base = 0.075) -> number`, defined so `frameLerpFactor(1 / 60) === 0.075`.
- Produces: `CameraRigProps { activeObject: RoomObjectId | null; anchors: Record<string, Object3D>; reducedMotion: boolean; pointerEnabled: boolean }`.

- [ ] **Step 1: Write failing motion-math tests**

Assert 60 Hz returns `0.075`, equal elapsed time gives equivalent interpolation across 30/60/120 Hz within tolerance, bounds clamp to `[-1, 1]`, and returning the target to zero converges without overshoot.

- [ ] **Step 2: Run the math test**

Run: `npm test -- src/room/sceneMotion.test.ts`  
Expected: FAIL because the motion module does not exist.

- [ ] **Step 3: Implement delta-independent interpolation**

Use `1 - (1 - base) ** (deltaSeconds * 60)` and keep all approved amplitude values in the exported `sceneMotion` object.

- [ ] **Step 4: Write failing CameraRig behavior tests**

Mock `useFrame`. Assert overview pointer input changes the target, pointer leave returns it to zero, selecting a focus object ignores pointer targets and travels toward its Blender anchor, and window/flag cannot supply focus anchors.

- [ ] **Step 5: Implement the camera rig**

Read `CAM_Overview` and the selected `CAM_Anchor_*` transform from the loaded scene. Lerp position and slerp quaternion in `useFrame`; apply subtle parallax only around the overview pose and stop it during travel.

- [ ] **Step 6: Run motion tests and build**

Run: `npm test -- src/room/sceneMotion.test.ts src/room/CameraRig.test.tsx && npm run build`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/room
git commit -m "feat(room): add directed camera and pointer parallax"
```

### Task 6: Implement day/night lighting and idle motion

**Files:**
- Create: `src/room/RoomLighting.tsx`
- Create: `src/room/RoomLighting.test.tsx`
- Create: `src/room/RoomIdle.tsx`
- Create: `src/room/RoomIdle.test.tsx`
- Modify: `src/room/RoomCanvas.tsx`
- Modify: `src/room/useIdleRoom.ts`
- Modify: `src/room/useIdleRoom.test.ts`

**Interfaces:**
- Produces: `RoomLightingProps { lighting: Lighting; scene: Object3D; animations: AnimationClip[]; reducedMotion: boolean }`.
- Produces: `RoomIdleProps { scene: Object3D; paused: boolean; reducedMotion: boolean }`.
- Consumes: existing visibility and reduced-motion pause state from `useIdleRoom`.

- [ ] **Step 1: Write failing lighting tests**

Assert day opens curtains, enables daylight, and disables the lamp. Assert night closes curtains, sets window/backlight intensity to zero before raising the lamp, and leaves only subtle screen/rack emitters active.

- [ ] **Step 2: Write failing idle tests**

Assert monitor, rack, screen variation, curtain idle, and smartphone notification update while active; hidden tabs and reduced motion suppress non-essential updates; volleyball, diploma, furniture, and decor never receive idle transforms.

- [ ] **Step 3: Run the focused tests**

Run: `npm test -- src/room/RoomLighting.test.tsx src/room/RoomIdle.test.tsx src/room/useIdleRoom.test.ts`  
Expected: FAIL because the 3D controllers do not exist.

- [ ] **Step 4: Implement lighting with existing application state**

Drive named Blender lights and curtain clips from the existing `Lighting` union. Use a one-second transition only when motion is allowed; reduced motion applies final values immediately.

- [ ] **Step 5: Implement bounded idle updates**

Update only named idle targets in `useFrame`. Use deterministic offset rhythms for rack LEDs and a long bounded interval for the smartphone notification; do not create a general animation scheduler.

- [ ] **Step 6: Run room tests and build**

Run: `npm test -- src/room && npm run build`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/room
git commit -m "feat(room): add physical lighting and idle motion"
```

### Task 7: Route controls, panels, keyboard, and history correctly

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/room/RoomScene.tsx`
- Modify: `src/room/RoomScene.test.tsx`
- Create: `src/room/AccessibleRoomControls.tsx`
- Create: `src/room/AccessibleRoomControls.test.tsx`
- Modify: `src/details/details.css`
- Modify: `src/styles/global.css`
- Remove after replacement: `src/room/FocusView.tsx`, `src/room/FocusView.test.tsx`

**Interfaces:**
- `RoomScene` emits one `onInteract(id: RoomObjectId)` callback for pointer and keyboard paths.
- `App` routes `focus` to hash plus selected object, `toggle-lighting` to lighting only, and `toggle-locale` to locale only.
- `AccessibleRoomControls` consumes `sceneManifest`, localized labels, active object, and the same `onInteract` callback.

- [ ] **Step 1: Write failing application-routing tests**

Assert monitor/contact/etc. update hash and open exactly one panel; curtains change lighting without hash, panel, or camera focus; flag changes locale and document language without hash, panel, or camera focus; rapid selections leave only the last focus active; Back and `Escape` restore overview and focus.

- [ ] **Step 2: Write failing accessible-control tests**

Assert all ten localized controls are keyboard reachable with visible focus behavior, use the same action callback as 3D objects, and remain usable when the Canvas reports an error.

- [ ] **Step 3: Run the focused tests**

Run: `npm test -- src/app/App.test.tsx src/room/RoomScene.test.tsx src/room/AccessibleRoomControls.test.tsx`  
Expected: FAIL on the new action-routing behavior.

- [ ] **Step 4: Implement action routing once in `App`**

Resolve the manifest entry and dispatch exactly one action path. Do not duplicate curtain or flag special cases in `RoomModel`, `RoomScene`, and `App`.

- [ ] **Step 5: Replace CSS focus transforms with 3D focus state**

Remove `FocusView`; keep `ObjectDetails` as HTML. Delay only its visual entrance until camera travel begins, with zero delay under reduced motion. Preserve the existing narrow-screen bottom sheet.

- [ ] **Step 6: Add the accessible room controls**

Render native localized buttons using the manifest order and the same action router. The conventional header navigation remains unchanged.

- [ ] **Step 7: Run application tests and build**

Run: `npm test && npm run build`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(app): route 3d room actions accessibly"
```

### Task 8: Verify browser behavior, budgets, CI, and documentation

**Files:**
- Modify: `tests/e2e/portfolio.spec.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `docs/design/room-source.md`
- Modify: `docs/architecture/technical-stack.md`
- Delete: superseded runtime PNG assets only after the new WebP posters are exercised

**Interfaces:**
- Adds `npm run assets:check` to CI before the production build.
- Leaves Vercel deployment on the existing Git integration; no deployment secret is added.

- [ ] **Step 1: Update browser tests before final integration**

Cover: GLB-ready transition; poster fallback on forced asset failure; pointer-follow changes overview and settles back; content-object focus; curtains/flag without camera travel; day/night light attributes; browser Back and `Escape`; keyboard controls; narrow bottom sheet; reduced motion; French/English; hidden-tab idle pause.

- [ ] **Step 2: Run the browser suite and record failures**

Run: `npm run test:e2e`  
Expected: any mismatch fails before final fixes.

- [ ] **Step 3: Add the asset contract to CI**

Run `npm run assets:check` after `npm ci` and before tests/build. Keep the single required `verify` job name unchanged so branch protection remains valid.

- [ ] **Step 4: Measure the production scene**

Record GLB transfer size, first useful render, draw calls, and desktop/mobile frame rate in `docs/design/room-source.md`. Optimize only a measured miss: static mesh joining and instancing first, texture or mesh compression second, scene splitting/LOD last.

- [ ] **Step 5: Remove superseded 2.5D files and update documentation**

Delete only files with no remaining imports. Document Blender export settings, required node names, poster generation, size results, and the Canva overlay validation.

- [ ] **Step 6: Run the full verification gate**

Run: `npm run format:check && npm run assets:check && npm test && npm run build && npm run test:e2e`  
Expected: every command exits 0.

- [ ] **Step 7: Inspect the production build**

Run: `npm run preview -- --host 127.0.0.1`  
Expected: day and night render correctly; every functional object, camera move, idle animation, mobile panel, language switch, fallback, and browser navigation behavior matches the specification.

- [ ] **Step 8: Commit**

```bash
git add .github README.md docs tests package.json public src scripts assets
git commit -m "test(room): verify 3d portfolio experience"
```

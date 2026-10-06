# Interactive Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the bilingual interactive isometric-room portfolio defined in the approved design.

**Architecture:** A static Vite/React application reads all editorial data from one typed module. The room is a layered visual component driven by a small reducer for locale, lighting, selected object, project filter, and introduction state; URL hashes expose shareable object views without a router. Native CSS and Web Animations provide camera, lighting, and idle motion with accessible fallbacks.

**Tech Stack:** Vite 8, React, TypeScript, plain CSS, Vitest, Testing Library, Playwright, Prettier, GitHub Actions, Vercel

**Spec:** `docs/superpowers/specs/2026-10-07-interactive-portfolio-design.md`

## Global Constraints

- Keep personal data, translations, links, projects, timeline entries, and room labels in `src/content/portfolioContent.ts`.
- Treat Canva design `DAHXRbROrBI` as the visual source of truth. Room proportions, object silhouettes, colors, layer order, and day/night variants must come from its approved production pages rather than being invented in code.
- Normalize Canva's 1920 by 1080 production coordinates into percentages. If Canva cannot provide separable production assets or reliable layer geometry, stop before room implementation and ask for a Canva export bundle or approval to move that handoff to Figma.
- Ship French and English together; missing localized values must fail tests and type checking.
- Do not add Next.js, Tailwind CSS, a router, an i18n library, a state library, Three.js, or an animation library in v1.
- Use Node `^20.19.0 || >=22.12.0`, the engine range published by Vite 8.0.10; record the chosen runtime in `.node-version` and GitHub Actions.
- Render every room hotspot as a native button with a localized accessible name and a visible focus state.
- Use natural daylight only with open curtains; with closed curtains the window is dark, artificial lights are on, and the dark theme is active.
- Use contextual zoom on wide screens and a bottom sheet on narrow screens.
- Respect `prefers-reduced-motion`, pause idle work in hidden tabs, and keep touch targets at least 44 by 44 CSS pixels.
- Mark all initial personal content as sample data and keep empty external destinations disabled rather than broken.
- Deploy previews from branches and production from `main` through Vercel's Git integration.

## Review Focus

- Corrupt or unavailable local storage falls back to French/day without preventing interaction — pinned in Task 3.
- Canva coordinates and exported assets cannot drift from the approved 1920 by 1080 production page — pinned in Task 4.
- Missing room artwork preserves geometry and exposes a readable object label — pinned in Task 5.
- Unknown hashes, rapid object changes, and browser Back always end on a valid single active object or the room overview — pinned in Task 7.
- Reduced motion and hidden-tab state suppress non-essential idle work and discovery hints — pinned in Task 9.

---

## File Structure

- `.node-version`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`: runtime, toolchain, and application entry configuration.
- `src/main.tsx`, `src/styles/global.css`: browser entry and global tokens/reset.
- `src/content/types.ts`, `src/content/portfolioContent.ts`: domain types and the only editable portfolio content source.
- `src/app/App.tsx`, `src/app/appState.ts`, `src/app/preferences.ts`: composition, reducer, persistence, and URL-independent application state.
- `src/components/SiteHeader.tsx`, `src/components/IntroCard.tsx`: conventional navigation and first-screen introduction.
- `docs/design/room-source.md`, `src/room/roomGeometry.ts`, `public/assets/room/*`: Canva source provenance, normalized production geometry, and approved exported layers.
- `src/room/roomObjects.ts`, `src/room/RoomScene.tsx`, `src/room/RoomArtwork.tsx`, `src/room/RoomAsset.tsx`, `src/room/room.css`: room metadata, hotspots, approved artwork composition, asset fallback, and layout.
- `src/room/hashNavigation.ts`, `src/room/FocusView.tsx`, `src/room/useIdleRoom.ts`: shareable focus state, camera transform, and idle controller.
- `src/details/ObjectDetails.tsx`, `src/details/ProjectGallery.tsx`, `src/details/details.css`: contextual content and project exploration.
- `src/**/*.test.ts?(x)`, `src/test/setup.ts`: unit and component checks colocated with the owning module.
- `tests/e2e/portfolio.spec.ts`, `playwright.config.ts`: browser journeys across wide, narrow, keyboard, and reduced-motion modes.
- `.github/workflows/ci.yml`: formatting, type, unit, build, and browser checks.

### Task 1: Vite foundation and test harness

**Files:**
- Create: `.node-version`, `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/styles/global.css`, `src/test/setup.ts`, `src/app/App.test.tsx`

**Interfaces:**
- Produces: `App(): JSX.Element`; npm scripts `dev`, `build`, `preview`, `test`, `test:watch`, `format`, `format:check`.

- [ ] **Step 1: Create the minimal React/TypeScript/Vite configuration**

Use Vite 8.0.10 with its published Node engine range, React TypeScript, strict TypeScript, `jsdom` for Vitest, and Prettier. `build` must run `tsc -b && vite build`; `test` must run `vitest run`.

- [ ] **Step 2: Install dependencies and record `package-lock.json`**

Run: `npm install`  
Expected: exit 0 and one lockfile generated.

- [ ] **Step 3: Write the failing application smoke test**

`App.test.tsx` renders `<App />` and expects a `main` landmark and the text `Portfolio Data & IA`.

- [ ] **Step 4: Run the test and verify the initial failure**

Run: `npm test -- src/app/App.test.tsx`  
Expected: FAIL because `App` does not yet render the required landmark and heading.

- [ ] **Step 5: Implement the minimal application shell**

Create `App(): JSX.Element`, mount it from `main.tsx`, and add only the global font, color tokens, reset, and focus token needed by the smoke test.

- [ ] **Step 6: Verify the foundation**

Run: `npm test -- src/app/App.test.tsx && npm run build && npm run format:check`  
Expected: all commands exit 0.

- [ ] **Step 7: Commit**

`git commit -m "build: initialize React portfolio"`

### Task 2: Typed bilingual content model

**Files:**
- Create: `src/content/types.ts`, `src/content/portfolioContent.ts`, `src/content/portfolioContent.test.ts`

**Interfaces:**
- Produces: `Locale = 'fr' | 'en'`; `RoomObjectId`; `ProjectCategory`; `PortfolioContent`; `portfolioContent: PortfolioContent`; `localize(value: LocalizedText, locale: Locale): string`.

- [ ] **Step 1: Write failing content-contract tests**

Assert that every localized field has non-empty `fr` and `en` values, every room object points to an existing detail section, project IDs are unique, `isSample` is `true`, and `localize({fr:'Bonjour', en:'Hello'}, 'en')` returns `Hello`.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/content/portfolioContent.test.ts`  
Expected: FAIL because the types, data, and helper do not exist.

- [ ] **Step 3: Implement types and sample content**

Define the exact unions and interfaces required by the spec, then add concise fictional content for identity, internship availability, social links, skills, projects, homelab, timeline, volleyball, exploration topics, contacts, and all room objects.

- [ ] **Step 4: Verify content and types**

Run: `npm test -- src/content/portfolioContent.test.ts && npm run build`  
Expected: PASS and build exit 0.

- [ ] **Step 5: Commit**

`git commit -m "feat(content): add bilingual portfolio data"`

### Task 3: Application state, preferences, header, and introduction

**Files:**
- Create: `src/app/appState.ts`, `src/app/appState.test.ts`, `src/app/preferences.ts`, `src/app/preferences.test.ts`
- Create: `src/components/SiteHeader.tsx`, `src/components/IntroCard.tsx`
- Modify: `src/app/App.tsx`, `src/styles/global.css`

**Interfaces:**
- Consumes: `Locale`, `RoomObjectId`, `ProjectCategory`, `portfolioContent` from Task 2.
- Produces: `Lighting = 'day' | 'night'`; `AppState`; `AppAction`; `appReducer(state, action): AppState`; `readPreferences(storage): PersistedPreferences`; `writePreferences(storage, value): void`.

- [ ] **Step 1: Write failing reducer and persistence tests**

Cover locale change, intro minimization, category change, invalid stored JSON, unavailable storage throwing on read/write, and fallback to `{locale:'fr', lighting:'day'}`.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/app/appState.test.ts src/app/preferences.test.ts`  
Expected: FAIL because the reducer and preference helpers do not exist.

- [ ] **Step 3: Implement the reducer and safe persistence boundary**

Keep `AppState` limited to `locale`, `lighting`, `activeObject`, `projectCategory`, and `introExpanded`. Catch storage exceptions inside `preferences.ts`; components must not access `localStorage` directly.

- [ ] **Step 4: Implement the first-screen shell**

Render localized conventional navigation, GitHub/LinkedIn/CV controls, internship badge, introduction copy, and `Explore` action. Empty sample destinations render as disabled controls with a localized replacement label.

- [ ] **Step 5: Add component assertions and verify**

Extend `App.test.tsx` to assert the internship badge, locale toggle, minimized introduction, and disabled sample links.  
Run: `npm test -- src/app src/components`  
Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -m "feat(app): add portfolio shell and preferences"`

### Task 4: Canva production geometry and asset contract

**Files:**
- Create: `docs/design/room-source.md`, `src/room/roomGeometry.ts`, `src/room/roomGeometry.test.ts`
- Create: `public/assets/room/` with the approved room shell, objects, curtains, window states, lamp states, flag states, and decorative layers exported from Canva

**Interfaces:**
- Consumes: Canva design `DAHXRbROrBI`, approved composition page, and approved day/night state page.
- Produces: `CANVA_DESIGN_ID = 'DAHXRbROrBI'`; `CANVA_PAGE_SIZE = {width: 1920, height: 1080}`; `RoomGeometry`; `roomGeometry`; stable asset filenames used by Task 5.

- [ ] **Step 1: Inspect the Canva source and record provenance**

Use the Canva integration to retrieve the current page IDs, dimensions, editable element bounds, and thumbnails. Record the design ID, edit URL, production page IDs, 1920 by 1080 coordinate system, and retrieval date in `room-source.md`.

- [ ] **Step 2: Turn the approved concept into production pages in Canva**

Refine the composition and day/night pages so the room shell and every interactive object are separate named elements with final silhouettes, colors, layer order, and both required lighting states. Do not reinterpret the room in code. Present the production pages to the user and obtain explicit visual approval before continuing.

- [ ] **Step 3: Confirm Canva can provide the implementation handoff**

Export or download each approved layer as SVG where faithful, otherwise transparent WebP/PNG. If the Canva connection cannot provide separable files and exact bounds, stop and ask the user either for a Canva export bundle or permission to use Figma for this handoff; do not silently redraw or approximate assets.

- [ ] **Step 4: Write the failing geometry-contract test**

Assert every `RoomObjectId` has a Canva element reference, normalized `x`, `y`, `width`, `height`, focus transform, layer index, and existing asset path; assert conversion of `{left:960, top:540, width:192, height:108}` becomes `{x:50, y:50, width:10, height:10}`.

- [ ] **Step 5: Verify the geometry test fails**

Run: `npm test -- src/room/roomGeometry.test.ts`
Expected: FAIL because the normalized Canva manifest does not exist.

- [ ] **Step 6: Encode the approved Canva geometry and assets**

Implement `roomGeometry` by transcribing the approved Canva element bounds into normalized percentages and linking each record to its exported layer. `room-source.md` must map every code entry back to a Canva page and element ID.

- [ ] **Step 7: Verify the production contract**

Run: `npm test -- src/room/roomGeometry.test.ts && npm run build`
Expected: PASS, every referenced asset exists, and build exits 0.

- [ ] **Step 8: Commit**

`git commit -m "feat(room): add Canva geometry and assets"`

### Task 5: Layered room and accessible objects

**Files:**
- Create: `src/room/roomObjects.ts`, `src/room/RoomScene.tsx`, `src/room/RoomScene.test.tsx`, `src/room/RoomArtwork.tsx`, `src/room/RoomAsset.tsx`, `src/room/RoomAsset.test.tsx`, `src/room/room.css`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `RoomObjectId`, localized room metadata, and `activeObject` from Tasks 2–3; `roomGeometry` and approved Canva assets from Task 4.
- Produces: `RoomObjectDefinition`; `roomObjects`; `RoomScene({locale, lighting, activeObject, onSelect, onToggleLighting})`; `RoomAsset({src, label, className})`.

- [ ] **Step 1: Write failing room contract tests**

Assert one native button per object ID, localized accessible names, 44px minimum hotspot style token, `onSelect(id)` behavior, and a labeled fallback when `RoomAsset` receives an image error.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/room/RoomScene.test.tsx src/room/RoomAsset.test.tsx`  
Expected: FAIL because room modules do not exist.

- [ ] **Step 3: Define object geometry and focus metadata**

Each `RoomObjectDefinition` contains `id`, Canva-derived percentage `hotspot`, `focusTransform`, `tabOrder`, and visual-state keys. Keep editorial strings and duplicated coordinates out of this file.

- [ ] **Step 4: Compose the approved Canva room layers**

Implement `RoomArtwork.tsx` by composing the exact Task 4 asset manifest and layer order: window, curtains, desk, monitor, server, volleyball, diploma, controller, phone, bookshelf, contact card, flag, clock, lamp, and restrained decor. Geometry and design come from Canva; code only makes the approved layers responsive and stateful.

- [ ] **Step 5: Overlay accessible object controls and fallback handling**

Render hotspots above the artwork, preserve the specified tab order, and keep decorative SVG hidden from assistive technology.

- [ ] **Step 6: Verify room behavior**

Run: `npm test -- src/room && npm run build`  
Expected: PASS and build exit 0.

- [ ] **Step 7: Commit**

`git commit -m "feat(room): add accessible isometric scene"`

### Task 6: Curtain-driven lighting and theme

**Files:**
- Modify: `src/app/appState.ts`, `src/app/appState.test.ts`, `src/app/App.tsx`
- Modify: `src/room/RoomScene.tsx`, `src/room/RoomScene.test.tsx`, `src/room/RoomArtwork.tsx`, `src/room/room.css`, `src/styles/global.css`

**Interfaces:**
- Consumes: `Lighting` and `AppState` from Task 3.
- Produces: action `{type:'toggleLighting'}`; `data-lighting` on the application root.

- [ ] **Step 1: Write failing lighting tests**

Assert day means curtains open, natural-light layer visible, lamp layer off, and light tokens active; night means curtains closed, window-dark layer visible, lamp layer on, and dark tokens active. Assert the persisted preference updates.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/app/appState.test.ts src/room/RoomScene.test.tsx`  
Expected: FAIL on missing lighting transitions and visual state.

- [ ] **Step 3: Implement the single lighting state transition**

Window and curtain controls dispatch the same action. Derive every visual and theme change from `lighting`; do not maintain separate curtain, window, lamp, or theme booleans.

- [ ] **Step 4: Verify lighting and persistence**

Run: `npm test -- src/app src/room`  
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(room): synchronize curtains and lighting"`

### Task 7: Hash navigation and contextual immersive zoom

**Files:**
- Create: `src/room/hashNavigation.ts`, `src/room/hashNavigation.test.ts`, `src/room/FocusView.tsx`, `src/room/FocusView.test.tsx`
- Create: `src/details/ObjectDetails.tsx`, `src/details/details.css`
- Modify: `src/app/App.tsx`, `src/app/appState.ts`, `src/room/RoomScene.tsx`, `src/room/room.css`

**Interfaces:**
- Produces: `parseRoomHash(hash, validIds): RoomObjectId | null`; `hashForObject(id): string`; `FocusView({definition, children})`; `ObjectDetails({objectId, locale, onClose})`.

- [ ] **Step 1: Write failing hash and focus tests**

Cover valid hashes, unknown hashes returning `null`, selection replacement under rapid repeated clicks, Back returning to overview, one active detail card, `Escape` close, and focus restoration to the triggering button.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/room/hashNavigation.test.ts src/room/FocusView.test.tsx`  
Expected: FAIL because navigation and focus modules do not exist.

- [ ] **Step 3: Implement hash synchronization and focus lifecycle**

Use `history.pushState` for selection, `popstate` for Back, and the object definition's `focusTransform` for camera state. Invalid hashes dispatch overview state.

- [ ] **Step 4: Implement contextual detail presentation**

Show the detail card beside the focused object on wide screens and as a bottom sheet below the breakpoint defined in `room.css`. Keep the room visible and reduce contrast only on non-selected objects.

- [ ] **Step 5: Verify interaction behavior**

Run: `npm test -- src/room src/details && npm run build`  
Expected: PASS and build exit 0.

- [ ] **Step 6: Commit**

`git commit -m "feat(room): add immersive object focus"`

### Task 8: Portfolio detail content and project filtering

**Files:**
- Create: `src/details/ProjectGallery.tsx`, `src/details/ProjectGallery.test.tsx`, `src/details/ObjectDetails.test.tsx`
- Modify: `src/details/ObjectDetails.tsx`, `src/details/details.css`

**Interfaces:**
- Consumes: `portfolioContent`, `Locale`, `RoomObjectId`, `ProjectCategory`.
- Produces: `ProjectGallery({projects, locale, activeCategory, onCategoryChange})` and complete object-to-content rendering.

- [ ] **Step 1: Write failing detail tests**

Assert project filters, project detail fields, homelab topology, timeline entries, volleyball story, exploration topics, contact actions, visible sample-data labels, disabled empty links, and safe attributes on populated external links.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/details`  
Expected: FAIL because complete detail rendering and filters do not exist.

- [ ] **Step 3: Implement data-driven detail sections**

Map object IDs to focused view components while keeping copy in `portfolioContent.ts`. Use the same data for room access and conventional navigation targets.

- [ ] **Step 4: Implement project filter and detail flow**

Keep category state in `App`; project detail expansion may remain local to `ProjectGallery`. Do not add a router or global state dependency.

- [ ] **Step 5: Verify details and links**

Run: `npm test -- src/details src/content && npm run build`  
Expected: PASS and build exit 0.

- [ ] **Step 6: Commit**

`git commit -m "feat(details): add portfolio stories and projects"`

### Task 9: Calm idle animation controller

**Files:**
- Create: `src/room/useIdleRoom.ts`, `src/room/useIdleRoom.test.ts`
- Modify: `src/room/RoomScene.tsx`, `src/room/RoomArtwork.tsx`, `src/room/room.css`

**Interfaces:**
- Produces: `useIdleRoom({objectIds, delayMs: 8000}): {hintedObject: RoomObjectId | null; ambientPaused: boolean}`.

- [ ] **Step 1: Write failing fake-timer tests**

Assert no hint before 8000 ms, one hint at 8000 ms, input cancellation and timer reset, rotation without immediate repetition, hidden-document pause, visible-document resume, and total non-essential suppression when reduced motion is enabled.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/room/useIdleRoom.test.ts`  
Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement one idle boundary**

Listen to pointer, keyboard, touch, scroll, visibility, and media-query changes inside the hook. Return state only; keep visual animations in CSS.

- [ ] **Step 4: Add approved ambient motion**

Implement monitor cursor/activity, occasional server LEDs, open-curtain drift, sparse daytime dust, steady nighttime lamp breathing, real-time clock movement, and one slow decorative motion. Use long offset durations and no layout-changing transforms.

- [ ] **Step 5: Verify idle logic and reduced motion**

Run: `npm test -- src/room/useIdleRoom.test.ts src/room/RoomScene.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -m "feat(room): add accessible idle ambience"`

### Task 10: Browser validation, CI, and deployment handoff

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/portfolio.spec.ts`, `.github/workflows/ci.yml`, `src/content/noscript.ts`, `src/content/noscript.test.ts`
- Modify: `package.json`, `package-lock.json`, `vite.config.ts`, `index.html`, `README.md`

**Interfaces:**
- Produces: npm script `test:e2e`; CI checks `format`, `test`, `build`, `e2e`.

- [ ] **Step 1: Add Playwright and write failing browser journeys**

Cover first-screen room and internship badge, keyboard object selection and focus restoration, valid/invalid hashes and Back, day/night visual state, locale persistence, project filtering, mobile bottom sheet, reduced motion, and idle cancellation. For the missing-asset journey, replace one `[data-room-asset]` image source in the page with an invalid URL, dispatch its `error` event, and assert the labeled fallback remains in the same layer.

- [ ] **Step 2: Run the journeys and capture initial failures**

Run: `npm run test:e2e`  
Expected: at least one FAIL before final responsive/accessibility corrections.

- [ ] **Step 3: Fix only observed integration gaps**

Adjust responsive CSS, accessible names/focus behavior, fallback presentation, and metadata until the journeys pass. Implement `buildNoscriptMarkup(content: PortfolioContent): string` in `src/content/noscript.ts`; inject its contact/CV/social markup from `portfolioContent` through Vite's `transformIndexHtml` hook so no personal value is duplicated in `index.html`. Test that empty destinations are omitted and populated destinations are HTML-escaped.

- [ ] **Step 4: Add CI**

Configure GitHub Actions on pushes and pull requests with a Node version satisfying `.node-version`; run `npm ci`, `npm run format:check`, `npm test`, `npm run build`, install Playwright Chromium, and run `npm run test:e2e`.

- [ ] **Step 5: Run the complete local verification**

Run: `npm run format:check && npm test && npm run build && npm run test:e2e`  
Expected: all commands exit 0 with no failed tests.

- [ ] **Step 6: Verify Vercel Git integration**

Confirm the connected project uses framework preset Vite, build command `npm run build`, output directory `dist`, preview deployments for branches/PRs, and production branch `main`. Protect `main` so the CI workflow is required before merge. Do not add `vercel.json` unless automatic detection fails.

- [ ] **Step 7: Update project handoff documentation**

Document local commands, the single content-edit file, asset replacement rules, Canva design link, environment-free deployment, and how to replace sample links/CV.

- [ ] **Step 8: Commit**

`git commit -m "ci: verify and deploy portfolio"`

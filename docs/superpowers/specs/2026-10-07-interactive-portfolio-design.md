# Interactive Portfolio Design

Date: 2026-10-07  
Status: approved design

## Purpose

Build a bilingual French/English portfolio for a computer engineering student specializing in Data and Artificial Intelligence. The experience must feel personal and memorable without becoming harder for a recruiter to navigate than a conventional portfolio.

The primary interface is a warm, modern isometric bedroom. Every meaningful object opens a facet of the profile. A persistent conventional navigation provides the same information directly. The portfolio prominently states availability for an end-of-study internship starting in February 2027.

All personal content begins as clearly identified sample data and is replaced from one typed configuration file.

## Experience principles

- Make the room the interface, not decorative artwork behind ordinary cards.
- Keep essential information accessible without requiring exploration.
- Prefer short cards, visual hierarchy, and progressive disclosure over long copy.
- Use restrained transitions and avoid cyberpunk clichés, excessive glow, and continuous animation.
- Preserve keyboard access, reduced-motion behavior, contrast, and mobile usability.
- Keep the implementation static, fast, and maintainable.

## Entry experience

The room is visible immediately on the first screen. A compact introductory card overlays part of the scene and contains:

- the profile title: computer engineer, Data and AI;
- a short, authentic introduction;
- a visible internship availability badge for February 2027;
- an `Explore the room` action;
- direct GitHub, LinkedIn, contact, projects, and CV actions.

Activating `Explore the room` minimizes the introduction and gives the room full visual priority. The sticky conventional navigation remains available from the first render.

## Room and object map

The room is a layered 2.5D composition. Each interactive item is a native button visually aligned with its object.

| Object | Destination | Core content |
| --- | --- | --- |
| Main monitor | Data, AI, and projects | Featured work, stacks, case studies, project filters |
| Server, NAS, or mini tower | Homelab | Services, Linux, Docker, virtualization, monitoring, infrastructure diagram |
| Volleyball | Sport and personal qualities | Teamwork, consistency, discipline, perseverance |
| EPITA diploma or academic book | Education and experience | Timeline, specialization, important experiences |
| Controller or secondary screen | Game development | Projects, engines, technical and creative learning |
| Smartphone, tablet, or notebook | Personal applications | Prototypes, utilities, and learning experiments |
| Bookshelf | Currently Exploring | Local LLMs, RAG, agents, MLOps, Kubernetes, distributed systems, self-hosted AI, game architecture |
| Card, envelope, or phone | Contact | Email, GitHub, LinkedIn, CV, internship availability |
| Flag | Language | Toggle between French and English |
| Window and curtains | Theme | Toggle between day/light and night/dark states |

The scene may use additional non-interactive decoration, but interactive objects must remain visually identifiable without constant motion.

## Lighting and theme state

The room has two coherent lighting states:

### Day

- Curtains are open.
- Natural daylight enters through the window.
- Artificial room lighting is off.
- The interface uses its light theme.

### Night

- Curtains are closed.
- The window emits no light and appears dark.
- Artificial room lighting is on.
- The interface uses its dark theme.

Clicking the window or curtains switches between these states. The theme preference is stored locally when storage is available.

## Object exploration

Object exploration uses contextual immersive zoom:

1. The visitor selects an object.
2. The room pans and scales toward it in roughly 450 ms.
3. Non-selected objects remain visible with reduced contrast.
4. A contextual detail card appears next to the focused object.
5. Closing the card restores the previous camera position and returns focus to the triggering object.

Only one object is active at a time. `Escape`, the visible Back action, and browser Back close the current exploration. The active object is synchronized with a shareable hash such as `/#homelab`. Unknown hashes return to the room overview.

On narrow screens, the scene centers the selected object before presenting the detail card as a bottom sheet. With reduced motion enabled, camera and card state changes are immediate rather than animated.

## Conventional navigation

The sticky navigation exposes Home, About, Projects, Homelab, Experience, and Contact. GitHub, LinkedIn, and CV actions remain visible where space permits and move into the mobile menu on narrow screens.

This navigation targets the same content as the room objects; it does not maintain a duplicate content model.

## Projects

Projects are filterable by Data and AI, Software, Homelab, Game Development, and Experiments. Each summary provides a name, category, short description, stack, status, GitHub link, and optional demo link.

A project detail view covers the problem, solution, architecture, stack, difficulties, and learning. Sample projects must be visibly fictional until replaced with real content.

## Content model

A single typed `portfolioContent.ts` module owns:

- identity and internship availability;
- social, email, CV, and contact links;
- French and English strings;
- skills and exploration topics;
- projects and project details;
- education and experience timeline;
- homelab description and services;
- volleyball and personal narrative;
- room-object labels and content references.

Components receive content through typed props. Geometry and assets stay separate from editorial data so content changes do not require editing the room implementation.

## Application architecture

- `App` owns locale, theme, active object, and project category.
- `RoomScene` renders visual layers and camera transforms.
- `InteractiveObject` renders each accessible hotspot and its visible focus state.
- `FocusView` maps an active object to the scene pan and scale values.
- `DetailCard` renders the selected object's content without knowing room geometry.
- `StructuredNavigation` exposes the conventional route through the same content.
- `ProjectGallery` filters and displays project summaries and detail views.

URL hashes synchronize the selected object without a routing dependency. React state handles the small state graph; no external state library is required.

## Technical stack

The v1 stack is locked to:

- Vite;
- React;
- TypeScript;
- plain CSS with custom properties;
- layered SVG and transparent WebP/AVIF assets;
- native CSS transitions and Web Animations API;
- React state and context only where state is shared;
- a typed French/English content object;
- Vercel deployment connected to GitHub.

The detailed rationale, exclusions, and upgrade thresholds live in [`docs/architecture/technical-stack.md`](../../architecture/technical-stack.md).

## Visual production workflow

Canva is the shared design source for moodboards, composition, object inventory, and review. Higgsfield may generate visual references and controlled variations, but generated concept images are not used as one flattened final interface.

Final interactive objects must exist as stable layers with predictable bounds. Figma is introduced only if Canva cannot express precise interactive layers, responsive variants, or reusable component states. Blender is outside the current scope and is reconsidered only for a validated requirement involving true 3D geometry or camera movement.

## Responsive behavior

- Desktop and wide tablet layouts show the full room, contextual card, and navigation together.
- Narrow layouts preserve the room as the visual entry point, center the selected object, and use a bottom sheet for detail.
- Touch targets remain at least 44 by 44 CSS pixels even when the visible object is smaller.
- The room may crop decor at narrow sizes but cannot crop the active object or primary controls.
- The structured navigation remains a complete alternative on every viewport.

## Accessibility

- Interactive objects use native buttons with localized accessible names.
- Focus styles remain visible in both themes.
- Keyboard order follows a predictable room-object sequence rather than absolute screen coordinates.
- Focus returns to the triggering object after a detail card closes.
- Dialog-like cards use appropriate labeling and focus containment only while modal behavior is required on mobile.
- Reduced-motion preferences remove camera travel and non-essential transitions.
- Theme colors meet readable contrast requirements.
- Decorative visual layers are hidden from assistive technology.

## Error and fallback behavior

- Missing visual assets display a restrained labeled placeholder without breaking room geometry.
- Missing translation keys fail type checking and therefore block CI.
- Invalid or obsolete hashes return to the room overview.
- Local storage failures leave the current in-memory locale and theme usable.
- External links open in a new tab with `noopener noreferrer`.
- A short `noscript` message provides direct contact, CV, GitHub, and LinkedIn links when JavaScript is unavailable.

## Validation

GitHub CI verifies formatting, TypeScript, tests, and the production build. Browser smoke tests cover:

- opening and closing an object;
- browser Back and `Escape` behavior;
- focus restoration and keyboard navigation;
- curtain-driven light/dark state;
- French/English switching;
- project filtering;
- narrow-screen object focus and bottom sheet behavior;
- reduced-motion behavior;
- missing-asset fallback.

Vercel provides preview deployments for branches and pull requests. Production deploys from `main` only after required checks pass. Direct Vercel deployment remains a manual recovery path.

## Acceptance criteria

- The first screen shows the room, profile, internship availability, and primary actions.
- Every room object in the object map is keyboard accessible and opens the correct content.
- The day/night interaction follows the approved curtain, window, and artificial-light logic.
- Object selection produces the approved contextual zoom on desktop and bottom sheet on mobile.
- French and English cover all visitor-facing content.
- All personal data can be replaced through the central typed content module.
- The conventional navigation reaches the same content without requiring room exploration.
- The project builds successfully and the defined browser smoke tests pass in CI.
- A successful update to `main` creates a Vercel production deployment.

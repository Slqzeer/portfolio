# Technical Stack Decision

Status: **locked for the interactive 3D room release**
Date: 2026-10-07

## Product constraints

The portfolio is a bilingual, static, interactive experience built around an isometric bedroom. Objects in the room open portfolio content; physical elements also control global interface state, such as curtains for light/dark mode and a flag for French/English.

The lighting state is explicit: open curtains enable the light theme through natural daylight while artificial lights stay off; closed curtains block all light from the window, enable the dark theme, and turn on the room's artificial lighting.

Object exploration uses a contextual immersive zoom. Selecting an object pans and scales the room toward it while keeping the surrounding scene visible, then reveals an adjacent content card. On narrow screens, the same card becomes a bottom sheet after the object is centered.

The room is visible on the first screen. A compact introductory card overlays it with the profile, internship availability, and an "Explore" action; activating it minimizes the introduction and gives the room full visual priority. The conventional navigation remains visible from the start.

Personal information, links, projects, skills, translations, and availability must be editable from one central typed content file. The scene must remain usable on mobile, with a conventional navigation path for visitors who do not want to explore it.

## Locked stack

| Area | Choice | Reason |
| --- | --- | --- |
| Build tool | Vite | Small static output, fast local development, no server requirement. |
| UI | React | A natural fit for independent interactive objects, panels, and shared room state. |
| Language | TypeScript | Protects the centralized content schema and bilingual keys from silent mistakes. |
| Styling | Plain CSS with custom properties | Direct control of the bespoke room composition, responsive breakpoints, and day/night tokens without a utility abstraction. |
| Scene | Three.js through React Three Fiber | Provides real camera movement, object picking, dynamic lighting, and GLB integration inside React. |
| 3D helpers | `@react-three/drei` | Reuses maintained GLB-loading and scene utilities instead of local wrappers. |
| 3D authoring | Blender | Owns geometry, materials, lighting, camera anchors, and physical clips. |
| Asset format | One named-node GLB/glTF scene | Preserves replaceable objects and a stable runtime contract. |
| State | React state and context only where shared | Enough for theme, locale, selected object, filters, and modal state; no external state library. |
| Localization | Typed `fr`/`en` content object | Two languages do not justify a localization dependency. |
| Animation | Blender clips, R3F `useFrame`, and CSS | Separates physical 3D motion, procedural scene motion, and HTML transitions. |
| Testing | Small unit/component checks plus browser-level smoke tests | Protects interaction state, keyboard access, responsive layout, and language/theme switching. |
| Deployment | Vercel connected to GitHub | Pushes produce preview deployments; the production branch publishes automatically. |

## Current 3D production pipeline

1. **Canva** remains the visual source for composition, palette, silhouettes, and placement.
2. **Blender** owns geometry, materials, lighting, camera anchors, and physical animation clips.
3. **Figma** is limited to HTML panels, typography, and reusable interface components.
4. **Higgsfield** may provide concept references but never final geometry.
5. The approved Canva export is aligned behind the locked Blender overview camera; blockout and final renders are compared by overlay.
6. Blender exports `public/assets/room/portfolio-room.glb` plus day/night fallback posters.

The `.blend` source is versioned at `assets/blender/portfolio-room.blend`. Functional objects and camera anchors keep the stable names defined by the approved 3D-room specification. Editorial copy never enters the GLB.

Start with one GLB, joined static decor, instanced repeated homelab parts, baked ambient occlusion, and only the lights required by day/night behavior. Add texture compression, mesh compression, file splitting, or LOD only after measurements show the initial asset misses its targets.

## Deployment decision

The preferred path is the Vercel Git integration:

- pull requests and non-production branches receive preview deployments;
- `main` deploys automatically after checks pass;
- Vercel owns the deployment step, so GitHub Actions only needs to run quality checks;
- no long-lived Vercel token is required in the repository for the standard path.

Direct deployment remains a recovery/manual option through the Vercel integration or CLI. It is not the primary CI design because it would require managing credentials and duplicating Vercel's native Git workflow.

## Deliberately excluded from v1

| Technology | Why excluded | Add when |
| --- | --- | --- |
| Next.js | No server rendering, backend, or dynamic content requirement. | A blog, CMS preview, server routes, or per-page dynamic metadata becomes necessary. |
| Tailwind CSS | The interface is a bespoke spatial composition rather than a repeated utility-driven application UI. | The project grows into many conventional screens with repeated layout patterns. |
| Anime.js or Motion | Native CSS and Web Animations cover the planned transitions. | Coordinated timelines, complex sequencing, or gesture physics become hard to maintain natively. |
| Post-processing stack | It adds cost without solving an approved requirement. | A tested visual target specifically requires it and performance remains within budget. |
| Multiple GLBs or runtime LOD | They add loading and synchronization complexity. | Profiling shows the single optimized scene misses mobile targets. |
| Global state library | The state graph is small and local. | Cross-page state becomes complex enough that React state produces measurable coordination problems. |
| react-i18next | Only two static languages are planned. | Pluralization, locale-aware message formatting, remote translations, or more languages are introduced. |
| CMS / database | Content changes are developer-managed and deploy with the site. | A non-technical editor needs independent publishing. |

## Upgrade rules

An excluded tool is added only when a concrete requirement exceeds the current stack. Any upgrade must preserve keyboard access, reduced-motion behavior, mobile performance, the static fallback, and the single-source content model.

Idle ambience uses Blender clips for physical motion, R3F `useFrame` for procedural scene state, and CSS for HTML transitions. It pauses in hidden tabs and removes non-essential motion under `prefers-reduced-motion`. A separate animation library is justified only if measured coordination complexity exceeds these tools.

## Required external access

- Canva: connected for the shared visual design board.
- Higgsfield: connected for concept generation.
- GitHub: repository access is required for pushing changes and configuring or observing CI.
- Vercel: project access is required to connect the repository and manage deployments.
- Figma: connected for HTML interface panels and reusable components, not room geometry.
- Blender: required for the room source, camera anchors, lighting, and GLB export.

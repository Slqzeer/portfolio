# Technical Stack Decision

Status: **locked for the first portfolio release**  
Date: 2026-10-06

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
| Scene | Layered SVG and transparent raster assets in HTML | Keeps objects independently clickable and animatable while avoiding a 3D runtime. |
| State | React state and context only where shared | Enough for theme, locale, selected object, filters, and modal state; no external state library. |
| Localization | Typed `fr`/`en` content object | Two languages do not justify a localization dependency. |
| Animation | CSS transitions and Web Animations API | Native, accessible, and sufficient for curtains, lighting, hover feedback, and panel transitions. |
| Testing | Small unit/component checks plus browser-level smoke tests | Protects interaction state, keyboard access, responsive layout, and language/theme switching. |
| Deployment | Vercel connected to GitHub | Pushes produce preview deployments; the production branch publishes automatically. |

## Visual production pipeline

1. **Canva** — shared moodboard, composition board, palette, object inventory, and review notes.
2. **Higgsfield** — concept exploration and controlled visual variations, not final unsliced interface artwork.
3. **Figma, deferred** — introduce it only if Canva can no longer express precise interactive layers, responsive variants, or reusable component states.
4. **Blender, excluded for the current scope** — reconsider it only if a validated requirement needs true 3D geometry or camera movement.
5. Export final visual elements as optimized SVG where practical, otherwise transparent WebP/AVIF layers with PNG fallbacks only when required.

Generated concept images are references. Final interactive objects must be separated into stable layers with predictable bounds and states.

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
| Three.js / React Three Fiber | A WebGL scene would increase asset, performance, accessibility, and mobile complexity. | Real camera movement, dynamic 3D lighting, or free object rotation becomes a validated product requirement. |
| Global state library | The state graph is small and local. | Cross-page state becomes complex enough that React state produces measurable coordination problems. |
| react-i18next | Only two static languages are planned. | Pluralization, locale-aware message formatting, remote translations, or more languages are introduced. |
| CMS / database | Content changes are developer-managed and deploy with the site. | A non-technical editor needs independent publishing. |

## Upgrade rules

An excluded tool is added only when a concrete requirement exceeds the current stack. Visual polish alone is not enough justification for a new runtime dependency. Any upgrade must preserve keyboard access, reduced-motion behavior, mobile performance, and the single-source content model.

Idle ambience follows the same native-animation decision. Long-running decorative loops use CSS; discovery hints start after about eight seconds of inactivity, stop on input, pause in hidden tabs, and disappear under `prefers-reduced-motion`. An animation library is justified only if measured coordination complexity exceeds these native capabilities.

## Required external access

- Canva: connected for the shared visual design board.
- Higgsfield: connected for concept generation.
- GitHub: repository access is required for pushing changes and configuring or observing CI.
- Vercel: project access is required to connect the repository and manage deployments.
- Figma: deferred; connect only when precise interactive layers, responsive variants, or reusable component states exceed Canva's role.
- Blender: not required for the current 2.5D layered scene.

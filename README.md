# Portfolio interactif

Portfolio bilingue React/Vite construit autour d’une chambre isométrique interactive.

## Développement

Node `24.12.0` est déclaré dans `.node-version`.

```sh
npm ci
npm run dev
npm run format:check
npm test
npm run build
npm run test:e2e
```

## Remplacer le contenu

Toutes les informations personnelles, traductions, disponibilités, projets et destinations de liens se trouvent dans `src/content/portfolioContent.ts`. Remplacer notamment les valeurs d’exemple, puis passer `isSample` à `false`. Un lien vide reste désactivé dans l’interface et absent du fallback sans JavaScript.

## Remplacer les visuels

- Référence de composition : [Canva](https://www.canva.com/d/Hy2EbjsPEIPOa6D)
- Source Blender éditable : `assets/blender/portfolio-room.blend`
- Source Blender optimisée : `assets/blender/portfolio-room-optimized.blend`
- Scène web : `public/assets/room/portfolio-room.glb`
- Posters de secours : `public/assets/room/room-poster-day.webp` et `room-poster-night.webp`
- Contrat des objets : `src/room/sceneManifest.ts`

Après une modification Blender, conserver les noms `INT_*`, `CTL_*` et `CAM_Anchor_*`, exporter le GLB, puis exécuter `npm run assets:check`. Canva reste la référence visuelle ; Figma sert aux panneaux HTML et à la typographie.

## Déploiement

Le projet ne requiert aucune variable d’environnement. Sur Vercel, utiliser le preset Vite, la commande `npm run build` et le dossier de sortie `dist`. Les branches et pull requests produisent des previews ; `main` est la branche de production. GitHub Actions exécute formatage, tests, build et tests navigateur avant fusion.

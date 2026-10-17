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

## Contenu

Toutes les informations personnelles, traductions, projets et destinations de liens se trouvent dans `src/content/portfolioContent.ts`. Le contenu présente Martin Couturier, ClassPulse, ce portfolio et l’expérience fullstack CACIB. La configuration réelle du homelab, les dates du parcours et les coordonnées supplémentaires restent à renseigner. Les liens vides sont masqués et absents du fallback sans JavaScript.

Le bouton **Lecture rapide** ouvre les mêmes contenus immédiatement sans attendre la 3D. Les six repères dans la chambre, la navigation principale et le menu **Toutes les rubriques** partagent les mêmes destinations. Le réglage manuel des mouvements est conservé localement ; la préférence système reste prioritaire.

## Remplacer les visuels

- Référence de composition : [Canva](https://www.canva.com/d/Hy2EbjsPEIPOa6D)
- Source Blender éditable actuelle : `assets/blender/art-v2/portfolio-room.blend`
- Source Blender optimisée actuelle : `assets/blender/art-v2/portfolio-room-optimized.blend`
- Les deux sources précédentes restent conservées dans `assets/blender/`.
- Scène web : `public/assets/room/portfolio-room.glb`
- Posters transparents de secours et de lecture : `public/assets/room/room-overview-day.png` et `room-overview-night.png`, régénérés par `scripts/render-room-posters.py` sans enregistrer le master Blender
- Contrat des objets : `src/room/sceneManifest.ts`

Après une modification Blender, conserver les noms `INT_*`, `CTL_*` et `CAM_Anchor_*`, exporter le GLB, puis exécuter `npm run assets:check`. Canva reste la référence visuelle ; Figma sert aux panneaux HTML et à la typographie.

La [finition des assets et des ambiances](docs/design/room-art-direction.md) décrit les matières, les animations, les contrôles de réduction des mouvements et la chaîne de recalcul des éclairages.

## Déploiement

Le projet ne requiert aucune variable d’environnement. Sur Vercel, utiliser le preset Vite, la commande `npm run build` et le dossier de sortie `dist`. Les branches et pull requests produisent des previews ; `main` est la branche de production. GitHub Actions exécute formatage, tests, build et tests navigateur avant fusion.

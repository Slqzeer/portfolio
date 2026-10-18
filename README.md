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
- Source Blender éditable actuelle : `assets/blender/living/portfolio-room.blend`
- Source Blender optimisée actuelle : `assets/blender/living/portfolio-room-optimized.blend`
- Les sources d’origine restent conservées dans `assets/blender/` ; `art-v2` est une expérience non validée conservée pour comparaison.
- Scène web : `public/assets/room/portfolio-room.glb`
- Posters transparents de secours et de lecture : `public/assets/room/room-overview-day.png` et `room-overview-night.png`, régénérés par `scripts/render-room-posters.py` sans enregistrer le master Blender
- Contrat des objets : `src/room/sceneManifest.ts`

Blender est la source de vérité : modifier et vérifier les assets, matières, éclairages et animations dans Blender avant l’export. Conserver les noms `INT_*`, `CTL_*` et `CAM_Anchor_*` ainsi que les clips `Hover_*`, `Ambient_*` et `Curtain_*`, exporter le GLB et recalculer les éclairages associés, puis exécuter `npm run assets:check`. Les interactions web lisent les clips et courbes exportés ; elles ne créent pas les mouvements de la scène.

La [chambre vivante et la fidélité du rendu](docs/design/room-life.md) décrit les animations, les normales, le cadrage et la chaîne d’export actuelle. Le [retour ciblé à la scène d’origine](docs/design/room-baseline-restore.md) et la [passe art-v2](docs/design/room-art-direction.md) restent documentés pour comparaison.

## Déploiement

Le projet ne requiert aucune variable d’environnement. Sur Vercel, utiliser le preset Vite, la commande `npm run build` et le dossier de sortie `dist`. Les branches et pull requests produisent des previews ; `main` est la branche de production. GitHub Actions exécute formatage, tests, build et tests navigateur avant fusion.

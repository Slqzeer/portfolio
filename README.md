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

Toutes les informations personnelles, traductions, projets et destinations de liens se trouvent dans `src/content/portfolioContent.ts`. Le contenu présente Martin Couturier, sa formation EPITA–SCIA, sa recherche de stage IA/Data, Advanced RAG Knowledge Assistant, ClassPulse, ce portfolio, le homelab et l’expérience fullstack CACIB. Les détails et dates de l’expérience CACIB ainsi que le CV restent à renseigner. Les liens vides sont masqués et absents du fallback sans JavaScript.

La barre compacte rassemble les commandes : **Explorer** donne accès aux rubriques et aux objets ; **Réglages** contient l’ambiance, les animations, la langue et la **Lecture rapide**, disponible sans attendre la 3D. Les animations sont actives par défaut, y compris lorsque le système réduit les mouvements. Un arrêt choisi explicitement reste mémorisé dans le navigateur. Les mouvements se mettent en pause en lecture et lorsque l’onglet est masqué.

## Remplacer les visuels

Current device surfaces and exterior pipeline: [Blender refinement](docs/design/device-refinement.md).

- Référence de composition : [Canva](https://www.canva.com/d/Hy2EbjsPEIPOa6D)
- Source Blender éditable actuelle : `assets/blender/refined/portfolio-room.blend`
- Source Blender optimisée actuelle : `assets/blender/refined/portfolio-room-optimized.blend`
- Les sources d’origine restent conservées dans `assets/blender/` ; `art-v2` est une expérience non validée conservée pour comparaison.
- Scène web : `public/assets/room/portfolio-room.glb`
- Posters transparents de secours et de lecture : `public/assets/room/room-overview-day.png` et `room-overview-night.png`, régénérés par `scripts/render-room-posters.py` sans enregistrer le master Blender
- Contrat des objets : `src/room/sceneManifest.ts`

Blender est la source de vérité : modifier et vérifier les assets, matières, éclairages et animations dans Blender avant l’export. Conserver les noms `INT_*`, `CTL_*` et `CAM_Anchor_*` ainsi que les clips `Hover_*`, `Ambient_*` et `Curtain_*`, exporter le GLB et recalculer les éclairages associés, puis exécuter `npm run assets:check`. Les interactions web lisent les clips et courbes exportés ; elles ne créent pas les mouvements de la scène.

La [chambre vivante et la fidélité du rendu](docs/design/room-life.md) décrit les animations, les normales, le cadrage et la chaîne d’export actuelle. Le [retour ciblé à la scène d’origine](docs/design/room-baseline-restore.md) et la [passe art-v2](docs/design/room-art-direction.md) restent documentés pour comparaison.

## Déploiement

Première version : https://martin-couturier-portfolio.vercel.app

Le projet ne requiert aucune variable d’environnement. `vercel.json` fixe le preset Vite, la commande `npm run build` et le dossier de sortie `dist`. `.vercelignore` exclut les sources Blender et les fichiers de travail des uploads CLI ; les assets web de `public/assets/` restent inclus.

Pour publier les modifications locales depuis la racine du projet :

```sh
npx --yes vercel@latest login
npx --yes vercel@latest link --project portfolio
npx --yes vercel@latest deploy --prod
```

La première publication a été effectuée par CLI. La connexion au dépôt `Slqzeer/portfolio` nécessite encore l’ajout de GitHub dans les connexions de compte Vercel, puis `npx --yes vercel@latest git connect`. Une fois le dépôt connecté, les branches et pull requests produisent des previews ; `main` est la branche de production. GitHub Actions est configuré pour exécuter formatage, tests, build et tests navigateur.

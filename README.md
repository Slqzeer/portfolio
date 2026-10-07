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
- Source de production : [Figma](https://www.figma.com/design/mESnsD8GuPIigFtJiQ29Ki)
- Images jour/nuit : `public/assets/room/room-day.png` et `public/assets/room/room-night.png`
- Géométrie et cadrages : `src/room/roomGeometry.ts`

Conserver les dimensions `1536 × 1024`, la transparence et le cadrage lors du remplacement des images. Si la position d’un objet change, mettre à jour son hotspot et son cadrage dans Figma puis dans `roomGeometry.ts`.

## Déploiement

Le projet ne requiert aucune variable d’environnement. Sur Vercel, utiliser le preset Vite, la commande `npm run build` et le dossier de sortie `dist`. Les branches et pull requests produisent des previews ; `main` est la branche de production. GitHub Actions exécute formatage, tests, build et tests navigateur avant fusion.

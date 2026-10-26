# Source de la chambre 3D

La source de production est `assets/blender/refined/portfolio-room.blend`. Le fichier `portfolio-room-optimized.blend` du même dossier est son dérivé destiné à l’export web. Les anciennes variantes de conception et les rendus de revue sont conservés par l’historique Git, pas dans l’arborescence courante.

## Contrat de scène

- Blender possède la géométrie, les matériaux, les éclairages, les ancres caméra et les animations physiques.
- Les nœuds interactifs gardent les préfixes `INT_`, `CTL_` et `CAM_Anchor_` attendus par `src/room/sceneManifest.ts`.
- Les clips `Hover_*`, `Ambient_*`, `Focus_*` et `Curtain_*` restent séparés afin que le runtime puisse les mettre en pause ou les relire indépendamment.
- Le master éditable ne doit jamais être remplacé par le dérivé optimisé.
- Les contenus éditoriaux vivent dans `src/content/portfolioContent.ts`; les textes purement décoratifs intégrés au décor peuvent rester dans Blender.

## Export courant

1. Modifier et enregistrer le master éditable.
2. Reporter les changements nécessaires dans le dérivé optimisé sans renommer les nœuds contractuels.
3. Recalculer les lightmaps si la géométrie, les UV ou l’éclairage changent.
4. Exécuter `scripts/export-room-glb.py` depuis Blender sur le dérivé optimisé.
5. Régénérer les environnements et posters avec `scripts/render-room-env.py` et `scripts/render-room-posters.py` lorsque le rendu change.
6. Exécuter `npm run assets:check`, `npm test` et `npm run build`.

Les EXR, PNG de cuisson, caches Blender et captures de revue sont des artefacts locaux ignorés. Seuls le GLB, les lightmaps WebP, les environnements HDR et les posters réellement chargés par l’application sont versionnés dans `public/assets/room/`.

## Sources visuelles

Les images de `assets/references/` sont des entrées de conception, pas des assets runtime. Elles sont conservées parce qu’elles définissent les silhouettes, proportions, matériaux et compositions qui permettent de reprendre le travail dans Blender.

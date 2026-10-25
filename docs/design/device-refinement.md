# Surfaces des appareils et extérieur

Les sources actuelles sont les deux fichiers de `assets/blender/refined/`. Les variantes intermédiaires ayant servi à construire cette version ont été retirées du dépôt courant et restent accessibles dans l’historique Git.

## Surfaces des appareils

`scripts/draw-device-surfaces.mjs` régénère les images d’éditeur, d’écran verrouillé et de notifications stockées dans `assets/blender/refined/surfaces/`. Le moniteur, le portable et le téléphone exposent des variantes jour/nuit sélectionnées par le runtime. Les animations de saisie, de curseur, de résultats et de notifications sont créées dans Blender puis exportées dans le GLB.

Les captures de projets utilisées dans l’interface vivent dans `public/assets/projects/` et sont déclarées avec leurs descriptions bilingues dans `src/content/portfolioContent.ts`. `scripts/capture-project-previews.mjs` peut régénérer les aperçus du portfolio depuis un serveur local.

## Jardin et fenêtre

Le jardin est une géométrie Blender exportée avec ses textures PBR. Le runtime applique le même masque d’ouverture que Blender afin que l’extérieur ne soit visible qu’à travers la fenêtre, y compris pendant les mouvements de caméra. Les animations de végétation se mettent en pause la nuit, dans un onglet masqué et lorsque les mouvements sont désactivés.

## Pipeline

1. Modifier les sources `refined` et, si nécessaire, régénérer les surfaces avec `draw-device-surfaces.mjs`.
2. Valider le dérivé optimisé avec `scripts/validate-room-life.py`.
3. Exporter le GLB avec `scripts/export-room-glb.py`.
4. Si l’éclairage change, cuire, débruiter et encoder les lightmaps avec `bake-room-lightmaps.py`, `denoise-room-lightmaps.py` et `encode-room-lightmaps.py`.
5. Régénérer les sondes et posters avec `render-room-env.py` et `render-room-posters.py`.
6. Intégrer ensemble le GLB et ses assets d’éclairage dans `public/assets/room/`, puis exécuter les validations du dépôt.

Les captures et rapports de revue sont générés localement dans `assets/reviews/`, qui est ignoré par Git.

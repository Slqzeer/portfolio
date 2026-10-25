# Chambre vivante, export Blender et fidélité du rendu

La chambre de production se trouve dans `assets/blender/refined/`. Elle conserve une navigation `ROOM → FOCUS → INTERACT`, deux ambiances lumineuses et des animations physiques exportées depuis Blender.

## Animations

- Le store utilise les clips `Curtain_*`; le runtime les lit dans les deux sens pour passer du jour à la nuit.
- Les clips `Ambient_*` animent avec des pauses la végétation, les voyants, les notifications et les écrans.
- Les clips `Focus_*` démarrent à l’arrivée de la caméra et gardent leur pose finale pendant la consultation.
- Les clips `Hover_*` restent des réactions courtes et indépendantes.

Les animations se suspendent lorsque l’onglet est masqué, en lecture rapide ou quand le visiteur désactive les mouvements. Le mode réduit applique directement une pose stable et lisible.

## Éclairage et matières

Les états jour et nuit utilisent des lightmaps séparées, des sondes HDR et des posters issus de la même source Blender. Les matériaux procéduraux nécessaires au web sont cuits avant l’export. Les courbes d’émission non représentables directement en glTF sont stockées dans les extras puis converties en pistes runtime.

## Production

À partir de Blender 5.1 :

1. ouvrir `assets/blender/refined/portfolio-room.blend` pour l’édition ;
2. synchroniser le dérivé `portfolio-room-optimized.blend` lorsque la géométrie ou les clips changent ;
3. exécuter `scripts/validate-room-life.py` sur le dérivé ;
4. exporter avec `scripts/export-room-glb.py` ;
5. recalculer lightmaps, environnements et posters si leur source a changé ;
6. lancer `npm run assets:check`, `npm test` et `npm run build`.

`scripts/sync-curtain-clips.py`, appelé par l’exporteur, remplace uniquement les pistes du store par les matrices échantillonnées dans Blender. Les captures de vérification restent locales dans `assets/reviews/`.

Les performances finales doivent être validées sur un téléphone et un GPU physiques ; un navigateur automatisé en rendu logiciel ne constitue pas un benchmark matériel.

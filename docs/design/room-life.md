# Chambre vivante, export Blender et fidélité du rendu

18 octobre 2026. Cette passe part de `ce5e3b8` et des sources `baseline`. Elle conserve la palette bleu-gris/bleu/violet, les contenus de Martin et la navigation ROOM → FOCUS → INTERACT. Les originaux, `baseline` et l’expérience non validée `art-v2` sont conservés.

## Sources et corrections

Les sources actuelles sont `assets/blender/living/portfolio-room.blend` et `portfolio-room-optimized.blend`. `scripts/animate-room.py` les reconstruit depuis `baseline`, sans modifier les fichiers de départ. Il vérifie la conservation des matrices des caméras, contrôles et racines interactives.

Les deux murs ont les mêmes dimensions et la même ouverture, mais constituent un maillage fermé et soudé dans l’angle. Les normales restent planes. Cela retire la jointure artificielle ; la différence naturelle d’éclairement entre deux murs perpendiculaires reste visible. Les plinthes, le socle, les meubles et leurs matières sont conservés. Les UV de lumière de l’enveloppe sont recalculés après cette correction.

L’ajout des parents de souffle conserve explicitement les matrices d’inverse de parentage du store. Les contrôles comparent toutes les lames et tous les cordons à `baseline` aux deux poses jour/nuit ; le contrat GLB vérifie aussi le placement mondial exporté. Cela évite qu’un store animé ferme en hauteur tout en laissant une bande ouverte sur le côté.

Le plan de jardin est rapproché de Y = 6,4 à 5,85 et son sommet abaissé de Z = 5 à 4,55. Sa largeur est ramenée de 8,3 à 4,55 m pour le contenir derrière la fenêtre. L’image existante sert de fond distant ; cinq tiges et leurs feuilles en géométrie, ainsi qu’un petit oiseau avec des ailes séparées, ajoutent de la profondeur et du mouvement.

## Séquences créées dans Blender

Les cycles durent 32 secondes. Ils contiennent des pauses, et non un mouvement continu de tous les objets.

| Élément | Séquence |
| --- | --- |
| Store | Clips d’ouverture/fermeture jour/nuit conservés et relus en environ 0,9 s ; pose réellement vérifiée par les tests. Le mode mouvements réduits applique la pose finale directement. |
| Store et cordons | Un souffle de quelques millimètres, avec des objets parents séparés pour ne pas concurrencer les clips du store. Suspendu la nuit. |
| Jardin | Souffles espacés sur les feuilles ; oiseau visible vers 8–10,5 s avec battement d’ailes, puis absent jusqu’au cycle suivant. Suspendu la nuit. |
| Manette | Petit témoin bleu sur le bouton d’allumage, avec deux brèves séquences de clignotement par cycle. |
| Rack | Activités décalées sur les voyants réseau/disques/activité. Quatre petites salves par voyant et par cycle ; les voyants d’alimentation restent constants et les défauts ne sont pas simulés. Les couleurs existantes sont conservées. |
| Téléphone | Deux cartes de démonstration, ClassPulse et GitHub, apparaissent à des moments distincts et glissent dans l’écran, puis disparaissent. Aucune notification réelle n’est lue ou envoyée. |
| Écran principal et portable | Deux terminaux se remplissent progressivement, mot par mot, à des moments différents. La mention « illustrative run » indique que le résultat affiché est une illustration. |

Les réactions `Hover_*` de la passe précédente sont conservées. La pause en onglet masqué suspend le temps des clips ; la reprise limite la première avancée pour éviter un saut. Les mouvements réduits arrêtent les actions et rétablissent la pose de repos : pas d’oiseau ni de notification fugitive, texte lisible et voyants stables.

Les transformations sont exportées en clips glTF. Les courbes d’intensité des shaders sont échantillonnées depuis leurs véritables courbes Blender et transportées dans les extras `blender_emission`. `blenderMaterialClips` les transforme en pistes natives du même `AnimationMixer`, sans inventer de sinusoïde ni de rythme côté web. Cette adaptation évite d’ajouter une dépendance uniquement pour les animations de matières que le glTF standard ne transporte pas directement.

## Qualité et cadrage

L’export précédent ne conservait pas le bump procédural du bois et des tissus. L’exporteur cuit maintenant leurs normales tangentes avant d’exporter le GLB. La couleur du parquet passe à 4K ; bureau, canapé et tapis à 2K, avec des textures WebP de qualité 95. Le relief et les couleurs viennent des matières Blender existantes.

Les éclairages directs et indirects sont recalculés à 128 échantillons : atlas de mobilier 4K et enveloppe 2K, puis débruités. Les deux environnements de réflexion et les posters sont recalculés depuis la même source. L’exposition web est lue depuis les extras Blender, à 1 pour cette passe ; le multiplicateur de jour à 1,6 est retiré pour éviter de délaver les matières et les ombres. Le mélange continu des deux ambiances reste en place.

Le cadrage général est rapproché d’environ 10 %, avec un léger rognage possible des coupes architecturales en haut et en bas. Les vues de consultation gardent leur cadrage et leurs trajets. Les repères de 7 px gardent leurs boutons accessibles de 44 px.

La [référence Bruno Simon](https://bruno-simon.com/) a été consultée, ainsi que son [code de rendu](https://github.com/brunosimon/folio-2025/blob/main/sources/Game/Rendering.js). Le travail porte ici sur la fidélité des matières, la lumière, les détails animés et la place de la pièce dans l’écran. Le moteur et la navigation du portfolio restent ceux du projet ; aucune équivalence de rendu ou de performance avec cette référence n’est affirmée.

## Production et vérification

Le runtime précédent et les fichiers de code concernés sont sauvegardés dans `.cache/reviews/room-life/before/`. Les nouveaux exports sont préparés dans `.cache/reviews/room-life/runtime/`, puis intégrés ensemble pour éviter d’associer un nouveau maillage aux anciennes cartes UV de lumière.

Avec Blender 5.1, exécuter dans l’ordre :

1. `scripts/animate-room.py` depuis un processus Blender vide.
2. Sur le master `living`, `scripts/review-room-life.py` ; examiner les captures `assets/reviews/room-living-*.png` avant l’export. Ce processus fige l’ambiance au jour pour examiner les séquences, sans enregistrer ces changements dans le master.
3. Sur le dérivé optimisé, `scripts/validate-room-life.py`, puis `scripts/export-room-glb.py`. Le premier argument après `--`, s’il est fourni à l’exporteur, choisit le chemin du GLB de préparation.
4. Sur le même dérivé, `scripts/bake-room-lightmaps.py`, puis `scripts/denoise-room-lightmaps.py -- <dossier living/lightmaps>` et `scripts/encode-room-lightmaps.py -- <dossier living/lightmaps> <dossier runtime/lightmaps>`.
5. `scripts/render-room-env.py -- <dossier runtime/env>` sur le dérivé, puis `scripts/render-room-posters.py -- <dossier runtime>` sur le master.
6. Intégrer le GLB, les quatre lightmaps et leur calibration, les deux environnements et les deux posters ; lancer `npm run assets:check`, le build, les tests unitaires et les tests navigateur.

`assets:check` exige les cibles, les clips ambiants, les normales et les courbes de matières. Il vérifie aussi que la longue timeline ambiante n’a pas étiré les clips jour/nuit. `validate-room-life.py` vérifie le maillage fermé et des états réels : store ouvert/fermé, oiseau absent/présent, notification en déplacement, texte révélé et témoin allumé/atténué.

La dernière trajectoire de l’oiseau passe sous le store. Les matrices de tous les objets aux frames de cuisson 1 et 23 ont été comparées avant/après cet ajustement et sont identiques ; ce changement d’animation seul conserve donc les éclairages calculés. Le rapport est `assets/reviews/room-living-bird-check.json`.

## Validation finale

### Fidélité du store à Blender

Le bouton « Animations » reflète le réglage effectif. Par défaut, le site respecte le système ; un choix explicite `full` permet de réactiver les transitions malgré une préférence système réduite, et reste mémorisé après rechargement. Les pauses en onglet masqué et le mode lecture restent prioritaires. Les échelles des lightmaps sont chargées en JSON à l’URL `/assets/room/lightmaps/scales.json`, sans importer un module depuis `public`.

Les lames utilisent l’éclairage diffus de l’environnement, conservant les différences entre leurs faces et rendant leur inclinaison visible. La lumière uniforme appliquée aux autres petits éléments sans atlas masquait ce relief et faisait lire le store comme un panneau plein. Le store garde une variation lumineuse continue entre le jour et la nuit.

`scripts/sync-curtain-clips.py`, appelé après l’export GLB, reprend les matrices évaluées des 37 lames et des trois cordons sur la séquence d’origine, images 1 à 24 à 24 images/s. Il conserve les parents du modèle web et ne remplace que les pistes `Curtain_*`. Le site parcourt ces pistes à leur vitesse native, sans ajouter d’accélération aux courbes Blender. L’ouverture relit la même séquence en sens inverse. Le contrat GLB compare des poses intermédiaires et l’inclinaison finale avec les valeurs relevées dans la scène Blender d’origine.

- Build et contrat GLB réussis : 382 nœuds, 87 clips, dont 38 ambiants, et 93 courbes de matières ; GLB de 6 533 360 octets.
- 116 tests unitaires réussis dans 24 fichiers (`npx vitest run --maxWorkers=2 --testTimeout=20000`).
- Neuf scénarios de navigation/accessibilité réussis. Après l’intégration finale, les deux scénarios d’animation et le scénario de disposition desktop/mobile ont été repassés avec succès (`--timeout=60000`, facteur de test lent appliqué).
- Les tests vérifient la hauteur, la largeur et la profondeur du store fermé, le passage de l’oiseau sous le store, les changements réels de luminosité des voyants, les notifications, l’écriture et l’arrêt pour les mouvements réduits. Aucune erreur JavaScript/WebGL n’est relevée dans le scénario d’animation.
- Les dix fichiers runtime intégrés correspondent à leurs exports de préparation par empreinte SHA-256. Les sources `baseline` sont conservées à l’identique. Les rapports sont dans `assets/reviews/room-living-*-check.json` et les journaux dans `.cache/reviews/room-life/`.
- Formatage ciblé et `git diff --check` réussis. Le formatage global, avec ses avertissements préexistants, n’a pas été relancé.

Captures vérifiées : [desktop](../../assets/reviews/portfolio-living-overview-desktop.png), [nuit](../../assets/reviews/portfolio-living-overview-night.png), [mobile](../../assets/reviews/portfolio-living-overview-mobile.png), [petit mobile](../../assets/reviews/portfolio-living-overview-small-mobile.png), [projets](../../assets/reviews/portfolio-living-projects-desktop.png) et [ambiance animée](../../assets/reviews/portfolio-living-ambient.png).

La qualité visuelle finale et les performances sur téléphone physique restent à apprécier sur le matériel cible. Les mesures de Chromium en rendu logiciel ne constituent pas un benchmark mobile.

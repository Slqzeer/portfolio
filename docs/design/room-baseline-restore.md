# Retour à la scène Blender d’origine

Cette passe est conservée comme historique. La production actuelle prolonge cette base avec [les animations et le rendu de la chambre vivante](room-life.md), sans reprendre la palette expérimentale `art-v2`.

17 octobre 2026. La variante `art-v2` est une expérience non validée. Le retour demandé porte sur la scène, pas sur l’interface ni sur les contenus.

## Version identifiée avant restauration

La référence est le commit `bdf94b2` : sources `assets/blender/portfolio-room.blend` et `portfolio-room-optimized.blend`, GLB de 308 nœuds, murs bleu-gris, canapé et tapis bleus, lampe violette. Les captures `assets/reviews/portfolio-redesign-*` montrent cette scène avec l’interface personnalisée. Les captures `portfolio-room-v2-*` montrent la variante rejetée.

Avant toute écriture, les fichiers web concernés ont été copiés dans `.cache/reviews/room-baseline-restore/before/` ; `checkpoint.json` en contient les empreintes. Aucune restauration globale Git n’a été faite. Les sources d’origine et `art-v2` sont conservées.

Pendant l’intervention, HEAD est passé de `bdf94b2` à `775578f` par une opération extérieure à cette passe. Aucun commit ni reset n’a été exécuté ici ; la référence de restauration reste explicitement `bdf94b2`, indépendamment de ce changement de HEAD.

## Sources actuelles

Blender est la source de vérité pour la géométrie, les matières, les éclairages et les animations. Les fichiers utilisés pour cette restauration sont :

- `assets/blender/baseline/portfolio-room.blend` : master éditable.
- `assets/blender/baseline/portfolio-room-optimized.blend` : dérivé exportable.
- `public/assets/room/portfolio-room.glb` : export de ce dérivé.

`scripts/restore-room-baseline.py` recrée ces deux copies à partir des originaux. Il reprend uniquement les textes personnalisés de `art-v2`, conserve les matières d’origine et crée les clips de survol. Le rapport `assets/reviews/room-baseline-check.json` contient les empreintes des originaux, les amplitudes et les contrôles. Les caméras, contrôles et racines interactives gardent leur pose de repos.

Les quatre lightmaps, leur calibration et les deux environnements sont restaurés ensemble depuis `bdf94b2`, ainsi que les intensités d’exposition et la couleur de la lampe côté web. Le mélange continu jour/nuit et l’application immédiate en mode mouvements réduits sont conservés. Les posters transparents sont recalculés depuis le master personnalisé ; les anciennes cartes d’éclairage restent cohérentes avec la géométrie d’origine, les textes seuls ayant changé.

## Interactions

Les repères visibles mesurent 7 px, sans numéro ni halo permanent ; leur bouton conserve une cible de 44 × 44 px. L’information légère apparaît au survol de l’objet ou du repère, et au focus clavier. Le curseur change sans recolorer les matériaux de la scène.

Huit clips `Hover_<id>` sont créés dans Blender, puis lus une seule fois sur le web : petit bond du ballon (7 cm), très légère inclinaison de la manette, de l’écran, du téléphone et des cadres, mouvement discret de la pile de livres et pulsation de taille d’un voyant vert du rack. Chaque clip revient à sa pose initiale. Ils constituent une première proposition à examiner, pas une direction visuelle approuvée. L’allumage de la manette, les changements de contenu d’écran, les séquences de voyants et le mouvement d’un classeur individuel restent à concevoir dans Blender.

Les oscillations procédurales des plantes et cordons, le déplacement du code, les variations d’émission des écrans et voyants et les particules ajoutées côté web sont retirés. Le curseur d’écran utilise son clip Blender existant. Les animations sont suspendues dans un onglet masqué ; les mouvements réduits rétablissent la pose de repos et suppriment les réactions.

La navigation ROOM → FOCUS → INTERACT, le contenu de Martin, le français/anglais, les panneaux HTML, Échap/Retour, la restauration du focus et la lecture rapide sont conservés.

## Reproduire et vérifier

Avec Blender 5.1, depuis la racine :

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b --threads 4 --python scripts/restore-room-baseline.py
```

Examiner `assets/reviews/room-baseline-day.png` et `room-baseline-night.png` avant d’exporter :

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b assets/blender/baseline/portfolio-room-optimized.blend --threads 4 --python scripts/export-room-glb.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b assets/blender/baseline/portfolio-room.blend --threads 4 --python scripts/render-room-posters.py
npm run assets:check
npm test
npm run test:e2e
```

Pour reproduire les cartes d’origine, extraire explicitement `public/assets/room/lightmaps/` et `public/assets/room/env/` du commit `bdf94b2`. Après toute future modification de géométrie, matières ou éclairage dans Blender, recalculer les cartes et environnements depuis la même source avant l’intégration.

## Résultats de validation

- Rendus Blender jour/nuit examinés avant l’export ; huit amplitudes et retours au repos vérifiés dans Blender sur les deux sources.
- Contrat GLB valide : 318 nœuds nommés et les huit clips attendus, 3 234 352 octets.
- Les deux sources d’origine, les quatre lightmaps, la calibration et les deux environnements sont identiques par SHA-256 à `bdf94b2`.
- Build réussi. `npx vitest run --maxWorkers=2 --testTimeout=20000` : 112 tests réussis dans 23 fichiers. Un premier passage sous charge atteignait le délai par défaut de cinq secondes dans le test de langue ; ses 13 tests d’interface passent aussi isolément.
- Les neuf scénarios Chromium sont validés : huit au passage complet, puis le scénario de navigation bureau/écran/lumière/langue repassé seul en 49,6 s avec `--timeout=60000` (le scénario est marqué lent et dispose donc de 180 s). Le passage complet atteignait son délai cumulé de 90 s sur le dernier clic de ce scénario.
- Neuf trajets de caméra contrôlés, segments configurés libres avec une marge de 0,12 ; cela ne garantit pas l’absence de toute occlusion de cadrage.
- Formatage ciblé et `git diff --check` réussis. Le contrôle global de formatage avec ses avertissements préexistants n’a pas été relancé.

Captures du navigateur : [accueil ordinateur](../../assets/reviews/portfolio-baseline-overview-desktop.png), [mobile](../../assets/reviews/portfolio-baseline-overview-mobile.png), [nuit](../../assets/reviews/portfolio-baseline-overview-night.png), [focus clavier](../../assets/reviews/portfolio-baseline-hover.png) et [projets](../../assets/reviews/portfolio-baseline-projects-desktop.png). Les journaux sont dans `.cache/reviews/room-baseline-restore/`.

Les performances sur téléphone physique et la validation esthétique de ces réactions par Martin restent à faire.

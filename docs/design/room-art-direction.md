# Chambre : matières, ambiance et visibilité

**Passe expérimentale archivée, non validée.** La scène livrée revient désormais à la version Blender d’origine, en conservant les contenus personnalisés. Voir [le retour ciblé à la référence](room-baseline-restore.md). Les paragraphes ci-dessous décrivent l’expérience `art-v2`, pas la direction actuelle. Ne pas relancer ses scripts de reconstruction pour produire le site courant.

17 octobre 2026. Cette passe répond au retour sur les assets, l’absence de vie et la cohérence des thèmes. Elle conserve l’agencement et les repères de caméra existants.

## Assets et palette

La source actuelle est `assets/blender/art-v2/portfolio-room.blend`, accompagnée de sa version optimisée. Les deux fichiers d’origine sont conservés. `scripts/refine-room-art.py`, puis `scripts/refine-room-shell.py`, permettent de reconstruire la révision depuis ces sources.

### Enveloppe architecturale

Les murs et leurs anciennes pièces de couronnement sont remplacés par un volume en L fermé, avec une ouverture de fenêtre traversante. Les plans intérieurs, la fenêtre, les meubles et les caméras gardent leurs coordonnées. Les grandes faces restent planes, sans normales lissées qui arrondiraient artificiellement leurs jonctions.

Les plinthes forment également un seul volume continu dans l’angle : hauteur 16 cm, projection 2,5 cm, au lieu de 30 et 12 cm dans la source. Les reliefs d’arêtes passent à 1 mm pour les plinthes, 3 mm pour les murs et 1 mm pour le parquet. Le socle passe de 34 à 14,5 cm au total, avec une tranche mate plus claire. Les empreintes extérieures sont communes aux murs, au parquet et au socle. Le dessus du parquet et le pied des murs se rejoignent à Z = 0.

Le parquet conserve son veinage, avec des lames de 2,2 m sur 26 cm, une variation de teinte modérée et des joints de 2,5 mm. Ce détail est cuit dans sa texture de couleur. Les UV de lumière de toute l’enveloppe sont régénérés ; les quatre cartes d’éclairage sont recalculées après cette modification.

`scripts/validate-room-shell.py` contrôle les volumes fermés, les normales, les empreintes, sept intersections réelles par rayons (dont l’ouverture de fenêtre) et la conservation des transformations des caméras et points interactifs. Le rapport est dans `assets/reviews/room-shell-check.json`. Le gros plan `assets/reviews/room-shell-junction.png` permet d’inspecter la jonction mur / plinthe / parquet.

Les murs passent du bleu gris à un enduit sauge, le canapé à un tissu vert profond et le tapis à une teinte lin bordée de vert. Le rack adopte un graphite moins opaque. La lampe abandonne ses surfaces et son émission violettes au profit d’une matière crème et d’une émission ambrée. Les textures procédurales de tissu sont conservées dans Blender et cuites pour le GLB.

Les textes des cadres et de l’écran sont personnalisés : Martin Couturier, liens fournis, formation en cours et illustration d’une vérification de backend Python / FastAPI. Le diplôme ne prétend plus avoir été obtenu ; le faux e-mail est retiré. Le script de validation vérifie les textes et leur encombrement dans les cadres, sur les deux sources.

## Animations réelles

Les feuillages des trois plantes pivotent très légèrement autour de leur base, sans déplacer les pots. Les cibles proviennent des noms effectivement exportés. Les anciennes cibles `Curtain_Left` et `Curtain_Right`, absentes du GLB, sont remplacées par les cordons existants du store.

Le code de l’écran reçoit un mouvement discret qui s’arrête pendant sa consultation. Le curseur clignote, les voyants du serveur ont des activités décalées tandis que les voyants d’alimentation restent constants, et le téléphone reçoit une brève variation lumineuse espacée. Un ensemble de 28 particules près de la fenêtre ajoute un seul appel de rendu, sans ombres supplémentaires.

Les mouvements utilisent un temps local suspendu lorsque l’onglet est masqué ; le retour ne saute pas à une nouvelle phase. L’option de réduction des mouvements rétablit les plantes dans une pose neutre et supprime les particules. Les déplacements sont calculés dans la boucle de rendu sans mise à jour React à chaque image.

## Deux ambiances cohérentes

**Atelier** associe la lumière naturelle, les matières sauge et lin et l’interface ivoire. **Soir** conserve les mêmes matières, avec un éclairage ambré et une interface vert sombre. Le réglage affiche le nom de l’ambiance active. Les étiquettes des projets, compétences et du homelab restent visibles sur grand écran ; les autres apparaissent au survol ou au focus.

Le changement d’ambiance mélange les deux cartes d’éclairage dans le shader au lieu d’éteindre la pièce à mi-transition. Les cordons et les lames du store suivent la même progression. L’abat-jour devient lumineux le soir. Les mouvements réduits appliquent directement l’état demandé.

Les éclairages directs et indirects sont recalculés depuis la source révisée, à 96 échantillons et 2K pour chacun des deux atlas. Les cartes d’irradiance livrées au navigateur sont plafonnées à 2K. Les constantes d’intensité sont lues depuis le JSON produit par l’encodeur, afin d’éviter un décalage manuel après une nouvelle cuisson.

## Reproduire

Depuis la racine du dépôt, utiliser Blender 5.1. Reconstruire les matières avec `scripts/refine-room-art.py`, puis la géométrie et les UV d’enveloppe avec `scripts/refine-room-shell.py`. Contrôler les sources avec `scripts/validate-room-art.py` et `scripts/validate-room-shell.py`. Puis, sur la source optimisée révisée :

1. `scripts/export-room-glb.py` : géométrie, textes et textures de matière.
2. `scripts/bake-room-lightmaps.py -- --resume` : éclairage des deux ambiances ; une cuisson achevée plus récente que le fichier Blender peut être conservée.
3. `scripts/denoise-room-lightmaps.py -- <chemin absolu vers assets/blender/art-v2/lightmaps>`.
4. `scripts/encode-room-lightmaps.py -- <même chemin>` : cartes WebP et calibration dans `public/assets/room/lightmaps`.
5. `scripts/render-room-env.py` : réflexions des deux ambiances.
6. Sur le master révisé, `scripts/render-room-posters.py` : secours et mode lecture.

Ces scripts tournent dans des processus Blender distincts ; ils n’enregistrent pas les modifications temporaires de cuisson dans le master. Le cache OptiX peut être placé dans le dossier de travail via `OPTIX_CACHE_PATH`, conformément à l’[API NVIDIA](https://raytracing-docs.nvidia.com/optix9/api/group__optix__host__api__device__context.html).

Les tests vérifient les mouvements sur les cibles exportées, leur arrêt, la reprise, les shaders d’ambiance et les parcours déjà présents. Les performances sur un téléphone physique restent à mesurer.

## Validation locale

Le build et le contrat du GLB passent (317 nœuds nommés). Les 103 tests unitaires passent. Les neuf scénarios Chromium passent ; les deux scénarios de rendu et de disposition sont repassés après la correction de l’émission glTF de la lampe et du menu mobile. Les six liens tiennent à 320 px en français et en anglais, et les commandes de scène ne se chevauchent pas.

Les captures finales sont disponibles en [vue générale](../../assets/reviews/portfolio-room-v2-overview-desktop.png), [ambiance Soir](../../assets/reviews/portfolio-room-v2-overview-night.png), [mobile 320 px](../../assets/reviews/portfolio-room-v2-overview-small-mobile.png) et [gros plan architectural](../../assets/reviews/room-shell-junction.png). Les deux sources Blender passent les contrôles géométriques décrits plus haut.

Le formatage des fichiers modifiés est conforme. `npm run format:check` signale encore 19 fichiers préexistants hors de cette passe (configuration, utilitaires et tests). Les journaux locaux de cette révision sont regroupés dans `.cache/reviews/room-art-v2/`.

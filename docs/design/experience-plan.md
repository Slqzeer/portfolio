# Portfolio immersif — plan de conception

Création : 16 octobre 2026. Mise à jour : 17 octobre 2026. Statut : base de scène confirmée et navigation implémentée, puis refonte éditoriale et personnalisation de l’application. Les fichiers Blender et le GLB restent inchangés. Voir la [refonte de l’interface et ses captures](interface-redesign.md) pour l’état le plus récent ; les sections ci-dessous conservent l’étude de conception initiale.

## Avancement du prototype — 17 octobre

Le parcours vue générale → écran → projets HTML → retour est implémenté. Le menu et le clic sur l’écran sélectionnent directement la destination ; le passage caméra par le bureau reste une étape de trajectoire, sans second clic imposé. Les trois états `ROOM`, `FOCUS` et `INTERACT` sont explicites. Une arrivée identifiée ouvre le contenu ; une ancienne arrivée est ignorée après changement de sélection. Échap annule aussi une approche en cours. Le retour retrouve le contexte précédent lorsqu’il existe dans l’historique, sinon la vue générale, puis restaure le focus clavier.

Les autres destinations existantes réutilisent ce mécanisme ; leurs contenus et leur mise en scène ne constituent pas encore une extension éditoriale finalisée. Les mouvements réduits suppriment le trajet animé. En cas d’échec de la scène, les contenus HTML restent accessibles immédiatement.

L’accueil est plus compact sur ordinateur. Les commandes de la chambre tiennent dans une bande défilante, avec Retour en première position lors d’un focus. Le panneau occupe un espace distinct de la scène : colonne sur ordinateur et feuille inférieure sur mobile. À l’accueil mobile, la chambre et la carte d’identité disposent aussi de zones séparées.

L’inspection Blender et le contrôle conservateur de ses volumes ont révélé que l’approche directe du téléphone coupe le dossier du fauteuil. Les trajets écran/téléphone passent donc par `CAM_Anchor_Desk`. Les neuf routes configurées passent le contrôle des segments contre les boîtes englobantes des maillages, élargies de 0,12 unité de scène. Ce contrôle porte sur le centre de caméra à l’état jour, pas sur tout son champ de vision ni sur les occlusions.

Les chemins partagent les mêmes repères et reviennent sur leurs segments en cas d’interruption. Les durées configurables sont 1,1 s à l’aller, 0,9 s au retour et 1,4 s pour un trajet entre plusieurs zones ; un segment conserve au moins 220 ms lorsque le budget total le permet.

Voir l’[étude des cadrages et les captures du prototype](camera-study.md), le [plan de dessus](../../assets/reviews/camera-navigation-plan.svg) et le [rapport géométrique](../../assets/reviews/camera-path-review.json).

## Intention et point de départ

Le visiteur découvre un espace personnel, comprend immédiatement qui l’occupe et choisit librement entre explorer les objets et lire les informations professionnelles. Les deux chemins donnent accès aux mêmes contenus HTML.

Base confirmée le 17 octobre 2026 : les fichiers Blender et les rendus versionnés représentent bien la chambre du brief. L’utilisateur précise qu’il s’agit d’un aperçu très avancé, encore améliorable, et autorise les changements utiles. La composition et les cadrages existants sont donc un point de départ, pas un résultat final figé.

Les améliorations peuvent porter sur les cadrages, les trajectoires, l’éclairage, les matériaux, les zones de clic et, si une occlusion le justifie, la position d’un meuble ou d’un objet. Conserver l’identité de la chambre et privilégier des ajustements localisés. Comparer chaque changement visuellement avant/après et préserver la source éditable. L’autorisation d’améliorer la scène ne change pas l’ordre demandé : conception, puis prototype limité, puis extension.

Le dépôt contient déjà les deux fichiers Blender, le GLB, les posters jour/nuit et des rendus de chaque caméra. Il contient aussi une application React/Three.js fonctionnelle dans sa structure. Il ne s’agit donc pas de repartir d’une chambre générique.

Éléments examinés : `assets/reviews/runtime-camera-contact-sheet.png`, le poster jour actuel, le JSON du GLB, `src/room/sceneManifest.ts`, `CameraRig.tsx`, `RoomModel.tsx`, `src/app/appState.ts`, `App.tsx`, le contenu éditorial et les documents existants. Les rendus enregistrés peuvent précéder les dernières corrections ; ils servent à l’analyse de composition, pas à certifier le rendu actuel du navigateur.

Mesures du fichier présent : GLB de 2 996 824 octets, 308 nœuds nommés, 218 entrées de maillage, 194 matériaux, 34 textures et 41 animations. Le dossier public de la chambre totalise 5 166 785 octets, hors décodeurs et application ; tous ses fichiers ne sont pas nécessairement chargés au premier affichage. Le nombre de maillages n’est pas un nombre de draw calls. `npm run assets:check` passe ; il vérifie le contrat de noms, pas les collisions ni les performances.

## Phase 1 — lecture de la chambre réelle

La scène visible est une pièce semi-ouverte à deux murs : bureau sous la fenêtre à gauche, rack dans l’angle, diplôme au mur, bibliothèque à droite, canapé au premier plan, table basse et ballon sur le tapis. Aucun lit n’est visible dans le poster examiné. Ne pas ajouter de meuble pour satisfaire une métaphore de navigation.

| Élément constaté | Rôle proposé | Vigilance de composition |
| --- | --- | --- |
| Écran et bureau | Projets ; bureau comme vue de contexte facultative | Le fauteuil masque une partie du bureau ; le téléphone est trop petit pour constituer un accès essentiel en vue générale. |
| Rack homelab | Infrastructure, réalisations et apprentissages techniques | Éviter un rapprochement qui coupe tout le rack ; préserver sa silhouette et laisser de la place au panneau. |
| Diplôme | Formation et expériences, distinguées dans le contenu | Le texte doit exister en HTML ; le cadre seul ne permet pas de lire un parcours. |
| Bibliothèque | Compétences et sujets approfondis | Le canapé masque partiellement le bas depuis la vue générale ; approcher par le côté ouvert de la pièce. |
| Carte de contact encadrée | Coordonnées et liens | Petite et proche de la plante ; prévoir une zone de clic dédiée et l’accès Contact dans le menu. |
| Manette et ballon | Création de jeux et personnalité sportive | Petits objets bas ; éviter les vues rasantes et les zooms qui suppriment tout contexte. |
| Smartphone | Applications personnelles, conformément au contenu existant | Ne pas lui attribuer aussi le contact sans choix éditorial explicite. |
| Store et drapeau | Ambiance jour/nuit et langue | Actions immédiates, avec équivalents HTML ; aucune obligation de comprendre ces métaphores. |

Conserver le bois clair, les murs bleutés, le textile bleu foncé et l’accent violet. L’écran et les voyants rendent l’espace vivant ; ils ne doivent pas attirer davantage que l’objet survolé. Garder les plantes, le fauteuil et le canapé comme décor. N’animer les objets posés que si l’action a un sens physique.

Priorités UX visibles dans la planche enregistrée : agrandir la place donnée à la chambre au premier écran, réduire la densité des commandes superposées, et empêcher qu’un panneau de contenu masque l’objet qu’il présente. Commencer par l’interface et les cadrages ; si une occlusion persiste, comparer un léger repositionnement du fauteuil ou du canapé avant de retenir un changement de mobilier.

Livrable de cette phase : inventaire ci-dessus, captures jour/nuit et carte des objets avec leurs zones cliquables. Les occlusions indiquées sont des risques visuels ; les intersections géométriques restent à vérifier en mouvement.

## Phase 2 — navigation et cadrages

### Vue générale

Conserver `CAM_Overview`, déjà exportée comme caméra orthographique. Dans le GLB inspecté, sa translation locale est environ `(-18.936, 16.106, 20.000)` et son `ortho_scale` vaut `21.2523`. Ce sont des valeurs de référence dans l’espace exporté glTF, pas des coordonnées à recopier telles quelles dans Blender. À l’exécution, lire sa transformation mondiale.

Ce choix préserve l’aspect de maquette et la composition existante. Sa limite est une profondeur moins photographique qu’en perspective. Le FOV de 35–45° envisagé dans le brief ne s’applique pas à cette projection : le cadrage dépend de l’échelle orthographique et du ratio d’affichage. Une variante perspective devra être comparée visuellement avant de remplacer ce choix.

Garder d’abord la parallaxe existante de ±1,25° comme référence. Pour la petite rotation demandée, tester un glisser limité à ±8° horizontalement et ±3° verticalement autour du cadrage initial ; ces limites sont proposées, pas validées contre les murs. Pas de déplacement libre. Sur téléphone, privilégier les objets et le menu ; aucun geste complexe n’est nécessaire. La caméra est immobile lorsque les mouvements sont réduits.

### Repères à conserver

| Destination | Repère existant | Échelle orthographique actuelle | Intention à valider |
| --- | --- | --- | --- |
| Bureau | `CAM_Anchor_Desk` | 7,4 | Conserver l’ensemble écran/laptop/accessoires. |
| Projets | `CAM_Anchor_Monitor` | 3,6 | Écran principal lisible comme objet, panneau à côté. |
| Homelab | `CAM_Anchor_Homelab` | 7,6 | Montrer les équipements et leur contexte. |
| Parcours | `CAM_Anchor_Diploma` | 4,2 | Cadre entier avec marge, texte professionnel dans le panneau. |
| Compétences | `CAM_Anchor_Bookshelf` | 6,2 | Reliures visibles sans cacher la zone utile derrière le canapé. |
| Contact | `CAM_Anchor_ContactCard` | 2,9 | Carte entière ; coordonnées cliquables en HTML. |
| Jeux | `CAM_Anchor_Controller` | 2,2 | Manette et portion de table, pas un gros plan désorientant. |
| Volley | `CAM_Anchor_Volleyball` | 2,6 | Ballon et repère de sol. |
| Applications | `CAM_Anchor_Smartphone` | 1,8 | Téléphone reconnu sans dépendre du texte de sa texture. |

Les valeurs existent déjà ; aucune nouvelle position de focus n’est inventée. Elles devront être revues avec l’espace occupé par l’interface. Sur ordinateur, réserver une colonne de lecture et cadrer l’objet dans l’espace restant. Sur mobile, garder l’objet dans la partie supérieure et ouvrir une feuille de contenu défilante en bas. Adapter le cadrage au rectangle visible plutôt que simplement recadrer une image 16:9.

### Trajets et états

Trois états publics suffisent : `ROOM`, `FOCUS`, `INTERACT`. `FOCUS` représente aussi le trajet retour, avec une direction et une destination ; le chargement et les erreurs appartiennent à la disponibilité de la scène, pas à cette navigation.

```text
ROOM → sélection → FOCUS aller → arrivée → INTERACT
INTERACT → Retour / Échap → FOCUS retour → arrivée → ROOM
```

Le menu et les objets émettent la même sélection. Le lien Projets va directement à l’écran. La vue Bureau reste un arrêt facultatif d’exploration ; elle ne doit pas imposer un second clic au recruteur. Cela diffère du comportement contextuel actuel de `selectionTarget`, à ajuster seulement au prototype.

Pendant `FOCUS`, un seul module écrit la caméra. Désactiver glisser, parallaxe et nouveaux clics d’objets. Le menu reste disponible : une nouvelle destination annule le trajet courant et repart de la pose courante avec un nouveau trajet validé. Échap annule l’aller et engage le retour. Une fin d’animation ancienne ne doit jamais ouvrir le mauvais panneau : chaque trajet porte un identifiant, seule l’arrivée du trajet courant est acceptée.

Base de mise en scène : trajet aller de 1,1 seconde, retour de 0,9 seconde, courbe avec accélération puis décélération, réaction visuelle de 180 ms. Ces durées restent configurables. Ouvrir le panneau à l’arrivée effective, pas après un délai indépendant. La caméra actuelle utilise un amortissement continu ; cela ne constitue pas encore cette séquence à durée finie.

Pour chaque destination, examiner le trajet depuis la vue générale, le retour et les interruptions. Ajouter uniquement si nécessaire des repères intermédiaires `PATH_<destination>_01`, etc., dans la zone libre. Tester en priorité fauteuil/bureau, angle du rack, canapé/bibliothèque et approche de la table. Une interpolation douce ou une courbe ne garantit aucune absence de collision. Pour passer entre deux destinations sans trajet direct vérifié, repasser par le trajet de dégagement et le cadrage général ; préserver ce détour dans la validation UX.

Au retour, restaurer la dernière pose générale sûre et le focus clavier sur le déclencheur. Avec mouvements réduits, appliquer directement la pose finale et afficher le contenu sans translation animée. Si la 3D est indisponible, la sélection ouvre immédiatement le même contenu HTML.

Livrable : planche de cadrages avec panneau simulé, tracés des trajets et captures intermédiaires, au minimum en 16:9 et en portrait mobile.

## Phase 3 — scénario des interactions

Règle commune aux destinations : survol et focus clavier affichent le même libellé et une accentuation discrète ; le clic ou Entrée lance le trajet vers le repère de la table précédente ; le panneau est révélé après stabilisation. Retour et Échap ferment le contenu puis engagent le trajet inverse. Le libellé ne dépend jamais du survol sur tactile.

| Objet / rôle | Réaction proposée et mise en scène au clic | Interface révélée |
| --- | --- | --- |
| Écran / projets | Luminance légèrement relevée en 180 ms ; approche vers `CAM_Anchor_Monitor`. Ne pas fabriquer un clip d’ouverture absent de la scène. | Liste courte de projets puis détail : problème, contribution personnelle, résultat, visuels, technologies et liens réels. |
| Rack / homelab | Mettre en évidence les voyants existants ; approche gardant le rack identifiable, sans ouvrir automatiquement sa porte. | Architecture, services, contraintes et réalisations. |
| Diplôme / parcours | Accentuer le cadre, sans déplacer le diplôme ; approche frontale légèrement oblique. | Formation et expériences dans deux sous-sections clairement nommées. |
| Bibliothèque / compétences | Accentuer une zone cohérente de classeurs ; cadrage suffisamment large pour garder le meuble. Pas d’animation de livre sans clip prévu. | Compétences groupées avec liens vers les projets qui les démontrent ; sujets actuellement explorés ensuite. |
| Carte / contact | Accentuation du cadre ; approche sans que la plante occupe le premier plan. | E-mail, LinkedIn, GitHub et CV ; ne publier que des liens fournis et vérifiés. |
| Manette / jeux | Réaction brève, manette restant posée ; approche oblique au-dessus de la table. | Réalisations liées au jeu, contribution et liens. |
| Ballon / personnalité | Accentuation discrète ; aucun rebond permanent. | Court récit personnel et lien éventuel avec le travail collectif. |
| Téléphone / applications | Courte impulsion lumineuse ; approche par-dessus le bureau. | Expérimentations personnelles. Ne pas lancer une notification à chaque visite de la rubrique. |
| Bureau / contexte facultatif | Survol du plateau utile, pas de toutes ses décorations ; passage à `CAM_Anchor_Desk`. | Repères vers écran et téléphone, sans panneau obligatoire ni étape imposée depuis le menu. |
| Store / ambiance | Action immédiate, sans focus caméra ; synchroniser descente, orientation des lames, disparition de la lumière naturelle et éclairage artificiel. | État Jour/Nuit dans un bouton HTML ; durée de référence 900 ms. |
| Drapeau / langue | Action immédiate, sans focus caméra ; actualiser aussi les libellés et la langue du document. | Bouton Français/English toujours disponible. |

Les associations restent des propositions éditoriales. Le contenu actuel est explicitement marqué `isSample: true` : il ne prouve ni les compétences, ni le diplôme, ni les réalisations personnelles.

Ambiance retenue : curseur de l’écran, activité asynchrone du rack et notification rare du téléphone. Mettre en pause hors onglet visible ; réduire les mouvements non essentiels selon la préférence système et un réglage explicite. Ajouter les surprises seulement après validation du parcours professionnel. Le son reste désactivé par défaut ; afficher son contrôle uniquement quand une ambiance sonore existe.

Livrable : fiche validée pour chaque destination avec libellé, réaction, trajet, panneau et retour. Le tableau constitue la première version de ces fiches.

## Architecture cible et contrat Blender/web

Conserver les modules existants et concentrer chaque responsabilité :

| Module existant | Responsabilité et interface cible |
| --- | --- |
| `app/appState.ts` | Décider de l’état de navigation à partir d’une sélection, d’une annulation ou d’une arrivée. Ne contient pas de coordonnées. |
| `room/sceneManifest.ts` | Relier identifiant, objet visuel, zone de clic, repère caméra, trajet, animation éventuelle et contenu. |
| `room/CameraRig.tsx` | Recevoir une destination et la préférence de mouvement ; gérer trajet et annulation ; signaler une seule arrivée valide. |
| `room/RoomModel.tsx` | Charger la scène, résoudre les noms et remonter les interactions ; aucune copie éditoriale. |
| `room/RoomLighting.tsx`, `RoomIdle.tsx` | Gérer les états lumineux et l’ambiance ; ne pas déplacer la caméra. |
| `details/` et `content/` | Afficher les informations HTML, indépendamment du chargement WebGL. |

Cette répartition permet au menu, au clavier et aux objets d’utiliser une petite interface commune sans reproduire la gestion des trajets dans chaque objet. React et le reducer existant suffisent pour cette phase ; aucune nécessité démontrée d’ajouter Zustand ou GSAP.

Exemple de déclaration à concevoir, sans implémentation :

```text
id                 monitor
nodeName           INT_Monitor
hitAreaName        HIT_Monitor                 [à créer si nécessaire]
cameraAnchorName   CAM_Anchor_Monitor
routeId            overview-to-monitor         [à valider]
transitionMs       1100
animation          aucune animation physique requise
reaction           accentuation de l’écran, 180 ms
contentId          projects
```

La géométrie et les poses appartiennent à Blender ; durées, logique de navigation et contenu appartiennent au web. Garder `ortho_scale` dans les propriétés des repères existants. Ne pas recopier les mêmes coordonnées dans plusieurs fichiers.

Organisation à prolonger : collections `RoomShell`, `StaticDecor`, `InteractiveObjects`, `Controls`, `Lights`, `Animations`, puis collections dédiées aux repères et aux zones de clic si cela facilite l’édition. Une collection Blender organise le travail ; utiliser des parents Empty pour la hiérarchie qui doit réellement être retrouvée dans le GLB.

Pour préparer un cadrage : composer d’abord avec une caméra de travail dans Blender, viser le point d’intérêt avec une marge pour le panneau, puis reporter la pose sur le repère nommé existant. Relever aussi une variante portrait si l’adaptation automatique échoue. Ne pas renommer les `CAM_Anchor_*` au profit des exemples du brief. L’adapter d’import actuel corrige déjà la différence d’orientation entre les Empty de caméra et la caméra exportée ; éviter une seconde conversion des axes dans le code des objets.

Les volumes `HIT_*`, lorsqu’ils sont nécessaires, sont des maillages simples, séparés du modèle et non fusionnés à l’optimisation. Ils restent présents à l’export, puis deviennent non dessinés mais raycastables au chargement. Ne pas compter sur des objets supprimés par un filtre d’export, ni sur `visible=false` comme stratégie implicite d’interaction. Donner une priorité aux sous-objets du bureau et décider explicitement si un décor devant une cible bloque le clic. R3F transmet les événements à plusieurs intersections ; la propagation doit donc être contrôlée. [Documentation des événements R3F](https://r3f.docs.pmnd.rs/api/events).

Pipeline à conserver : master éditable → dérivé optimisé → script `scripts/export-room-glb.py` → validation du contrat → contrôle visuel navigateur. Exporter caméras, animations, propriétés personnalisées et UV utiles. Les propriétés personnalisées passent dans les `extras` glTF. Préserver les pivots animés ; stabiliser les échelles sur le dérivé sans appliquer aveuglément les transformations des objets animés. glTF utilise +Y vertical : laisser l’exporteur réaliser la conversion. [Documentation Blender glTF](https://docs.blender.org/manual/en/5.1/addons/import_export/scene_gltf2.html).

Les 41 clips présents sont un curseur et 40 clips du store. Ne pas annoncer des animations de livre, tiroir ou manette déjà disponibles. Jouer les clips physiques par un mixer attaché à la scène réellement affichée ; piloter ensemble les clips du store, y compris lors d’une inversion en cours. À la sortie, libérer les actions et écouteurs. Les clips chargés sont accessibles dans le résultat glTF ; un `AnimationMixer` permet leur lecture. [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html).

Conserver les lightmaps jour/nuit, les UV secondaires et les corrections de couleurs existantes. Les lumières Area et l’éclairage World de Blender ne sont pas transportés comme tels par glTF ; le rendu web doit être contrôlé avec ses lightmaps et son éclairage propre. Ne pas ajouter un éclairage ambiant global sans vérifier les doubles contributions. [Lumières dans l’export glTF Blender](https://docs.blender.org/manual/en/5.3/addons/scene_gltf2.html).

## Phase 4 — prototype limité et vérifiable

Faire évoluer la base présente sur un seul parcours : vue générale → écran → projets HTML → retour. Charger le GLB existant et utiliser le menu ainsi que le clic sur l’écran. Implémenter les trois états, une transition finie, l’annulation et le retour avant d’étendre aux autres destinations.

Critères de sortie :

- Projets est accessible en une action depuis le menu, et via l’écran en exploration.
- Le panneau ne s’ouvre qu’à l’arrivée ; aucun conflit de caméra en cas de double clic, sélection rapide ou Échap pendant le trajet.
- Le trajet aller et retour ne traverse pas les volumes du mobilier ; les poses intermédiaires sont revues avec la scène actuelle.
- Le panneau contient des textes HTML lisibles, des liens, un bouton Retour et un focus visible ; la fermeture restaure le focus.
- Le parcours reste accessible au clavier et à un doigt, avec mouvements réduits et sans WebGL.
- Le cadrage reste utile à 390 × 844 et en paysage ; panneau et objet ne se masquent pas.
- Les performances sont mesurées sur un ordinateur et un mobile physiques identifiés. Objectifs de travail : 60 FPS sur ordinateur récent, 30 FPS stables sur mobile de référence. Ce ne sont pas des résultats obtenus pendant cette analyse.

Commencer par profiler les 194 matériaux et les draw calls avant d’optimiser davantage la géométrie. Draco et les textures WebP sont déjà présents : éviter de les proposer comme travaux encore à faire. Mesurer le transfert complet et la mémoire GPU, car la taille du GLB compressé ne les représente pas. Réduire d’abord la résolution de rendu sur mobile si nécessaire ; décider ensuite de la compression GPU, d’atlas ou de simplifications selon les mesures. Garder le poster et les contenus utilisables pendant le chargement ou l’échec.

## Phase 5 — extension progressive

Après validation du parcours écran, étendre dans cet ordre : contact et parcours, compétences/bibliothèque et homelab, manette/ballon/téléphone, puis ambiance et éventuelles découvertes. Chaque ajout doit réutiliser sélection, arrivée et retour, sans nouvelle logique de navigation indépendante.

Prévoir un accès direct Compétences dans le menu. Le menu actuel n’en propose pas et « À propos » mène au ballon : préciser ce dernier contenu avant de le présenter comme une biographie complète. Conserver les liens directs et le retour navigateur, et définir leur comportement pendant une transition.

## Éléments nécessaires pour affiner

Déjà disponibles : master et dérivé Blender, GLB, noms d’objets, repères, clips, posters et rendus de contrôle. La scène de référence et son caractère encore améliorable sont confirmés ; inutile de redemander ces fichiers ou cette confirmation.

À confirmer ou fournir pour la suite :

1. Les associations éditoriales, particulièrement bibliothèque = compétences + explorations et téléphone = applications personnelles.
2. Les contenus réels : identité, rôle visé, 2–4 projets prioritaires avec contribution et résultats, parcours, compétences, coordonnées et CV. Les exemples actuels ne sont pas publiables comme faits personnels.
3. Le cadrage d’accueil préféré : carte d’identité compacte avec grande chambre, ou accueil partagé comme aujourd’hui. Proposition initiale : carte plus compacte.
4. Le téléphone et le navigateur cibles pour le budget de performance.

À produire depuis la scène, sans demander à l’utilisateur de refaire ce que les fichiers permettent : vue de dessus avec volumes de passage, repères et axes locaux, planches des cadrages avec panneaux superposés, captures portrait et séquences intermédiaires des trajets. Ces vues permettront de fixer les positions de caméra et les éventuels points de passage sans deviner la disposition de la chambre.

La première analyse était documentaire. Elle est maintenant complétée par une inspection de Blender, des rendus intermédiaires et un prototype testé avec le GLB dans Chromium. Aucun meuble, matériau ou fichier Blender n’a été modifié. Les mesures de performances sur un ordinateur et un téléphone physiques restent à effectuer ; les résultats du navigateur automatisé ne les remplacent pas.

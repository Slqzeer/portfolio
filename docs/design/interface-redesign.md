# Interface du portfolio

L’interface superpose une carte d’introduction compacte à la chambre, puis laisse davantage de place à la scène pendant l’exploration. Les fiches entrent durant le mouvement de caméra : depuis la droite sur ordinateur et depuis le bas sur mobile.

## Navigation et accessibilité

- **Explorer** regroupe les destinations de la chambre.
- **Réglages** regroupe l’ambiance, la langue, les animations et la lecture rapide.
- Les repères HTML suivent les objets du GLB tout en restant accessibles au clavier.
- La fermeture restaure le contrôle d’origine, y compris après un remontage du repère.
- La lecture rapide démonte WebGL et expose immédiatement les mêmes contenus HTML.
- Les panneaux sortants sont retirés de la navigation clavier et des lecteurs d’écran pendant leur transition.

## Présentation

La palette ivoire, vert profond et terre cuite complète les titres à empattements. Le texte de disponibilité est mis en avant sur l’accueil et renvoie directement au contact. La chambre reste visible dès le premier écran et la navigation conventionnelle demeure disponible sans interaction 3D.

Les catégories de projet vides sont masquées. Chaque projet peut fournir plusieurs captures déclarées dans le contenu bilingue. Les liens absents ne sont pas présentés comme des actions utilisables.

## Validation

Les tests couvrent le chargement et son échec, le clavier, l’historique, les trajets, le thème, la langue, les préférences de mouvement, la lecture rapide et les dispositions mobiles. Les captures de revue sont générées localement et ne sont plus versionnées.

Le module 3D reste chargé séparément de l’interface. Vite signale sa taille ; une nouvelle stratégie de découpage ou des LOD ne sont justifiés que si des mesures sur le matériel cible montrent un problème concret.

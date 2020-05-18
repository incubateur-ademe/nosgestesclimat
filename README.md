# ecolab-data

Ici résident les modèles de calcul et les données de de https://ecolab.ademe.fr.

:bulb: Pour l'instant, vous n'y trouverez que les modèles de simulation climat personnelle annuelle. Ils sont en cours de développement, pas encore validés. Suivront les données de ecolab-transport, et éventuellement les données de la base agribalyse nouvelle génération.

## ecolab-climat

Le modèle est déployé à chaque changement sur :anchor: l'adresse de démo [ecolab-climat.netlify.app](https://ecolab-climat.netlify.app/).

### code de l'interface

Le code du simulateur est pour l'instant sur un autre dépôt [ici](https://github.com/laem/futureco/pull/65).  Il sera bientôt transféré sur `betagouv/ecolab-climat`. C'est un clone de laem/futureco, lui-même un clone de betagouv/mon-entreprise. 

Il repose sur le nouveau langage de programmation `publicodes` documenté sur https://publi.codes, qui est en mai 2020 en train d'être publié comme une bibliothèque à part entière indépendante de mon-entreprise.fr.

## Ecriture des modèles du simulateur

Le modèle climat est écrit dans un français le plus lisible possible : 

```yaml
# Premier extrait 
douche . litres par minute:
  unité: l/minute
  formule:
    variations:
      - si: pomme de douche économe
        alors: 9
      - sinon: 18

# Deuxième extrait 
transport . avion . coefficient de forçage radiatif:
  description: >
    Le forçage radiatif, c'est la capacité d'une émission de gaz à rechauffer la
    terre.
    Un vol émet du CO₂, mais aussi d'autres gaz, ainsi que de la vapeur libérée en haute altitude. Le forçage radiatif de ces émissions est conséquent et doit donc être pris en compte, mais c'est une estimation très compliquée.
    L'effet de la vapeur d'eau est temporaire : elle disparaît à court-terme par rapport au CO₂ qui reste très longtemps présent. Son effet n'en reste pas moins massif.
  formule: 2
  références:
    - https://www.carbonindependent.org/sources_aviation.html
    - http://www.bilans-ges.ademe.fr/forum/viewtopic.php?f=20&t=4009&sid=dea7e08c81c2f723b803d27e7e2a8797
    - https://fr.wikipedia.org/wiki/Impact_climatique_du_transport_a%C3%A9rien#Pond%C3%A9ration_des_%C3%A9missions

```

:pen: Voici [un petit guide pour contribuer](https://github.com/laem/futureco-data/blob/master/CONTRIBUTING.md).

Tous les modèles sont pour l'instant dans le [fichier co2.yaml](https://github.com/betagouv/ecolab-climat/blob/master/co2.yaml).


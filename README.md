# Ecolab-data

Ici résident les modèles de calcul et les données de de https://ecolab.ademe.fr.

:bulb: Pour l'instant, vous n'y trouverez que les modèles de simulation climat personnelle annuelle. Ils sont en cours de développement, pas encore validés.

Suivront les données de ecolab-transport, et éventuellement les données de la base agribalyse nouvelle génération.


Ils sont écrits dans un français le plus lisible possible : 

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

Tous les modèles sont pour l'instant dans le [fichier co2.yaml](https://github.com/laem/futureco-data/blob/master/co2.yaml).

Les modèles sont écrits dans le langage https://publi.codes, dont la documentation est sur le site.

Le code source (qui fait tourner les modèles et les présente sur un site) sera lui aussi [ouvert et participatif](https://github.com/betagouv/ecolab-climat).

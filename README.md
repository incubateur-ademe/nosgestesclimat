# futureco-data

Ici résident les modèles de calcul de https://futur.eco.

Ils sont écrits dans un français le plus lisible possible : 

```yaml

douche . litres par minute:
  unité: l/minute
  formule:
    variations:
      - si: pomme de douche économe
        alors: 9
      - sinon: 18

```

Tous les modèles sont dans le [fichier co2.yaml](https://github.com/laem/futureco-data/blob/master/co2.yaml).

Les modèles sont écrits dans le langage https://publi.codes.

Le code source (qui fait tourner les modèles et les présente sur un site) est lui aussi [ouvert et participatif](https://github.com/laem/futureco).

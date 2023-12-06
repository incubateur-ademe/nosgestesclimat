<div align="center">
  <h3 align="center">
	<big>Nos Gestes Climat</big>
  </h3>
  <p align="center">
   <a href="https://github.com/incubateur-ademe/nosgestesclimat/issues">Report Bug</a>
   •
   <a href="https://nogestesclimat.fr">nosgestesclimat.fr</a>
   •
   <a href="https://github.com/incubateur-ademe/nosgestesclimat-site-nextjs">Code du site</a>
  </p>

<!-- ![CI][ci-link] ![NPM][npm-link] -->

Modèle de calcul de l'empreinte climat personnelle.

</div>

## Utilisation

Vous pouvez parcourir le modèle grâce à ça [documentation en
ligne](https://nosgestesclimat.fr/documentation) ou bien utiliser le paquet npm
`@incubateur-ademe/nosgestesclimat` :

```sh
yarn add @incubateur-ademe/nosgestesclimat
```

```ts
import { rules } from '@incubateur-ademe/nosgestesclimat'
import Engine from 'publicodes'

const engine = new Engine(rules)
console.log(engine.evaluate('bilan'))
```

## Écriture des modèles du simulateur

Le modèle d'empreinte climat personnelle est écrit dans un français le plus
lisible possible :

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
  note: |
    Plus d'informations ici:
    - https://www.carbonindependent.org/sources_aviation.html
    - http://www.bilans-ges.ademe.fr/forum/viewtopic.php?f=20&t=4009&sid=dea7e08c81c2f723b803d27e7e2a8797
    - https://fr.wikipedia.org/wiki/Impact_climatique_du_transport_a%C3%A9rien#Pond%C3%A9ration_des_%C3%A9missions
```

:pen: Suivez [le guide pour
contribuer](https://github.com/incubateur-ademe/nosgestesclimat/blob/master/CONTRIBUTING.md).

Tous les modèles sont dans [le dossier
`data`](https://github.com/incubateur-ademe/nosgestesclimat/tree/master/data).

Ils reposent sur le nouveau langage de programmation
[`publicodes`](https://publi.codes) et développé dans le cadre de
https://beta.gouv.fr.

## Développement

### CI

Le projet utilise plusieurs GitHub Actions pour automatiser les tâches de
développement.

Pour chaque _pull request_, les actions suivantes sont exécutées :

- `upload-compilation-result.yaml` : compile les modèles et les personas (`yarn compile`) et exécute
  les tests (`yarn test:personas` et `yarn test:optim`)
- `pr-updater.yaml` : utilise l'artifact généré par
  `upload-compilation-result.yaml` pour mettre à jour la PR avec les résultats
  de la compilation et des tests

Pour chaque _push_ sur la branche `master`, le workflow `packaging.yaml` est exécuté.
Si la version du paquet npm est incrémentée, alors :

- une nouvelle _release_ GitHub est créée
- la version française du modèle (le résultat de `yarn build`) est publiée dans
  une nouvelle version du paquet npm
  [`@incubateur-ademe/nosgestesclimat`](https://www.npmjs.com/package/@incubateur-ademe/nosgestesclimat)
- toutes les versions ainsi que les personas (le résultat de `yarn compile`)
  sont _push_ dans une nouvelle branche dans le dépôt
  [`nosgestesclimat-api`](https://github.com/incubateur-ademe/nosgestesclimat-api)

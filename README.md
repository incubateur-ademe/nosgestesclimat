<div align="center">
  <h3 align="center">
	<big>Nos Gestes Climat</big>
  </h3>
  <p align="center">
   <a href="https://github.com/incubateur-ademe/nosgestesclimat/issues">Report Bug</a>
   •
   <a href="https://nosgestesclimat.fr">nosgestesclimat.fr</a>
   •
   <a href="https://github.com/incubateur-ademe/nosgestesclimat-site-nextjs">Code du site</a>
  </p>

<!-- ![CI][ci-link] ![NPM][npm-link] -->

Modèle de calcul de l'empreinte climat personnelle.

</div>

## Utilisation

> [!WARNING]
> Le modèle Nos Gestes Climat est open source. Néanmoins, certaines données sont soumises à des conditions d'utilisation spécifiques. Par essence, le modèle publicodes ne cache aucun facteur d'émission mais les données issues d'ecoinvent ne peuvent pas être réutilisées librement, l'ADEME ne disposant pas de la proppriété intellectuelle de cette donnée (voir [mentions légales](https://nosgestesclimat.fr/mentions-legales-base-empreinte)). Ces conditions sont rappelées au niveau des règles concernées.

Vous pouvez parcourir le modèle grâce à sa [documentation en
ligne](https://nosgestesclimat.fr/documentation) ou bien utiliser le paquet npm
`@incubateur-ademe/nosgestesclimat` :

```sh
pnpm add @incubateur-ademe/nosgestesclimat
```

Chaque modèle régional peut être importé séparément en anglais ou en français en suivant la structure suivante :

```ts
import rules from '@incubateur-ademe/nosgestesclimat/co2-model.<REGION>-lang.<LOCALE>.json'
```

Exemple d'utilisation :

```ts
import rules from '@incubateur-ademe/nosgestesclimat/public/co2-model.FR-lang.fr.json'
import Engine from 'publicodes'

const engine = new Engine(rules)
console.log(engine.evaluate('bilan'))
```

Il est possible également de créer un nouveau modèle de calcul publicodes à partir des règles du modèle Nos Gestes Climat.

Pour cela, il est possible d'utiliser la CLI `publicodes`:

```sh
npx publicodes init mon-nouveau-modèle
```

Puis d'importer les règles que l'on souhaite utiliser en installant le paquet `@incubateur-ademe/nosgestesclimat` (comme dans le projet [Ekofest](https://github.com/ekofest/publicodes-evenements)) :

```yaml
importer!:
  depuis:
    nom: '@incubateur-ademe/nosgestesclimat'
  dans: ngc
  les règles:
    - alimentation . plats . végétalien . empreinte carbone
    - alimentation . plats . végétarien . empreinte carbone
    - alimentation . plats . viande blanche . empreinte carbone
    - alimentation . plats . viande rouge . empreinte carbone
    - alimentation . plats . poisson gras . empreinte carbone
    - alimentation . plats . poisson blanc . empreinte carbone
```

## Écriture des modèles du simulateur en bref

Le modèle d'empreinte climat personnelle est écrit dans un français le plus
lisible possible, poar exemple, pour l'électricité du logement :

```yaml
logement . électricité:
  icônes: ⚡
  formule: empreinte / habitants

logement . électricité . empreinte:
  formule: consommation totale * empreinte au kWh
  description: |
    L'empreinte de l'électricité du logement est la somme des empreintes de l'électricité du réseau et de l'électricité produite par les panneaux photovoltaïques.
```

Toutes les règles du modèle sont dans [le dossier
`data`](https://github.com/incubateur-ademe/nosgestesclimat/tree/master/data).

Ils reposent sur le langage de programmation
[`publicodes`](https://publi.codes).

## Développement

La branche par défaut du dépôt est `preprod`, notre branche de développement.

`master` est la branche depuis laquelle code est versionné et publié sur NPM.

### QuickDoc

Pour faciliter le développement, nous avons mis en place un outil de
développement local. Cet outil permet de visualiser la documentation (basée sur
[`@publicodes/react-ui`](https://publi.codes/docs/api/react-ui)) et les
résultats de la compilation des modèles et des personas, ainsi que comparer les
résultats avec les versions en production.

```bash
# installe les dépendances
pnpm && cd quick-doc && pnpm i

# lance le serveur de développement en charge de compiler les modèles et les personas
pnpm dev

# lance le client de la documentation
pnpm doc
```

### CI

Le projet utilise plusieurs GitHub Actions pour automatiser les tâches de
développement.

Pour chaque _pull request_, les actions suivantes sont exécutées :

- `upload-compilation-result.yaml` : compile les modèles et les personas (`pnpm compile`) et exécute
  les tests (`pnpm test:personas` et `pnpm test:optim`)
- `pr-updater.yaml` : utilise l'artifact généré par
  `upload-compilation-result.yaml` pour mettre à jour la PR avec les résultats
  de la compilation et des tests

Pour chaque _push_ sur la branche `master`, le workflow `packaging.yaml` est exécuté.
Si la version du paquet npm est incrémentée, alors :

- une nouvelle _release_ GitHub est créée
- le modèle est publié dans
  une nouvelle version du paquet npm
  [`@incubateur-ademe/nosgestesclimat`](https://www.npmjs.com/package/@incubateur-ademe/nosgestesclimat)

### Site

Pour lancer l'app en local, rendez-vous [côté site](https://github.com/incubateur-ademe/nosgestesclimat-site-nextjs) !

A noter que le dépôt [nosgestesclimat-site](https://github.com/incubateur-ademe/nosgestesclimat-site-nextjs) était utilisé avant la refonte Next et n'est aujourd'hui plus maintenu. Néanmoins, nous le gardons pour la richesse de ses issues.

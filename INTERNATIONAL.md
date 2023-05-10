# International (FR)

> 🇬🇧 This guide is also available in english [below](#international-en)

L'internationalisation de Nos Gestes Climat est complexe : il n'est pas seulement question de simple traduction linguistique mais de la mise en place d'une solution permettant d'adapter la langue et le modèle de calcul en fonction du pays.

N'hésitez pas à contribuer et surtout à nous contacter si besoin à l'adresse contact@nosgestesclimat.fr ou directement dans une issue Github !

## Tutoriel : un nouveau modèle de calcul pour mon pays / ma région

**Etape 1 :** Github est une plateforme dédiée au code et aux discussions. [Cette page](https://github.com/datagir/nosgestesclimat/blob/master/CONTRIBUTING.md) vous explique les rudiments du langage utilisé pour la mise en place du modèle de calcul. Pour contribuer, inutile d'être développeur, le langage est intuitif et notre infrastructure vous permet de publier une version de votre modèle directement sans se plonger dans le code du site.

**Etape 2 :** Github est une plateforme particulièrement intéressante pour la gestion des versions du code. Pour commencer votre déclinaison, créer votre compte Github et rendez vous sur le dépôt "nosgestesclimat" : https://github.com/datagir/nosgestesclimat.

**Etape 3 :** Rendez-vous dans le dossier `data/i18n/models` contenant les modèles des régions supportées par Nos Gestes Climat !

Il faut savoir que ces fichiers contiennent de règles de calcul (format yaml) correspondant aux règles du modèle de base français (dans le dossier `data`).

### Votre modèle n'est pas encore supporté dans NGC ?

Créez le votre : votre fichier doit être nommé avec le code de votre pays suivi de l'extension `.yaml`, par exemple pour le Belgique, `UK-fr.yaml` (pour le modèle en français). Commencez ensuite par écrire votre première règle : `params` contenant les caractéristiques de votre région (les attributes nom et code sont obligatoires) :

Exemple pour la Grande Bretagne:

```yaml
params:
  code: UK
  nom: Royaume-Uni
  gentilé: anglaise
  drapeau: GB
```

Suivez ensuite les étapes du point suivant pour avancer sur votre modèle.

### Vous souhaitez proposer un changement pour un modèle déjà existant ?

Vous pouvez vous rendre dans le fichier correspondant à votre région (selon son code et langue d'écriture du modèle).

L'idée est ensuite de réecrire dans ce fichier les règles du modèle "de base", français, que vous souhaitez modifier en veillant à reporter **exactement** les clés du modèle (= nom des règles).

Par exemple, le mix électrique est défini dans la règle `intensité électricité` du fichier `data/divers/commun.yaml`. Pour modifier sa valeur et son titre dans le modèle nouvellement créé, il faut réécrire cette règle avec les bons attributs qui viendront écraser ceux du modèle français lors de la compilation.

Exemple pour la Grande Bretagne:

```yaml
intensité électricité:
  titre: Intensité carbone du mix électrique du Royaume-Uni
  formule: 0.236
  note: |
    [Electricity Map](https://app.electricitymaps.com/map) vue 5 ans, 2022
```

> **Note**
> Sachez que le code du modèle peut contenir certaines subtilités (notamment pour la gestions des questions "Mosaïques"), n'hésitez pas à nous contacter si vous bloquez !

Attention, pour que vos modifications soient prises en compte pour les anglophones, il est nécessaire de créer un fichier jumeau `XX-en-us.yaml` contenant les règles identiques à votre fichier `XX-fr.yaml` mais traduites. Vous pouvez utilisez le script `scripts/i18n/translateRegionModel.js` pour traduire automatiquement votre fichier. Attention, le fichier traduit précédemment sera écraser. Si des améliorations de la traductions automatiques ont été faites auparavant, pensez à jeter à oeil aux diffs. (Documentation dans le [wiki](https://github.com/datagir/nosgestesclimat/wiki/Translation#translateregionmodeljs))

### Points d'attention

- Pensez à traduire votre fichier (cf paraphe précédent)
- Il est plus facile de contribuer en faisant "tourner" le simulateur sur votre machine afin de voir vos modifications du modèle en temps réel (Voir le [guide de contribution](https://github.com/datagir/nosgestesclimat/blob/master/CONTRIBUTING.md)).

**Etape 4 :** Vous êtes satisfait de votre modification ? Faites une PR.

Une PR ? _Une Pull Request_ : cette manip vous permet d'envoyer une demande d'ajouts de vos modifications vers le code source du projet. Vous apparaissez ensuite dans la liste des PR en cours et vos modifications futures y seront affichées.

Si vous faites des erreurs dans l'écriture de vos règles, pas de panique, un commentaire apparaitra pour vous les signaler.

**Etape 5 :** Votre version du modèle est maintenant reliée au code source et donc au site Nos Gestes Climat (via cette PR). Votre site est en ligne à l'adresse suivante : `https://nosgestesclimat.fr/simulateur/bilan?PR={NUMERO DE VOTRE PR ICI}`

**Etape 6 :** L'équipe Nos Gestes Climat est active sur Github et pourra répondre à vos questions. L'objectif est de proposer une version du modèle propre à un pays ou une région. Lorsque votre modèle sera validé, nous le mettrons en ligne sur nosgestesclimat.fr. Ainsi, si les utilisateurs se connectent depuis le pays ou la région pour lequel/laquelle le modèle a été créé, ils verront la version correspondante.

# International (EN)

The internationalization of "Nos Gestes Climat" is complex : it is not only a question of language translation but
also to put in place a solution to adapt the calculation and language depending on the country an user is connecting
from.

Please, do not hesitate to contribute and to contact us if needed at `contact@nosgestesclimat.fr` or with a GitHub issue.

## Tutorial : A new calculation model for my country / region

**Step 1 :**
GitHub is a dedicated platform for code and discussion.
[This page](https://github.com/datagir/nosgestesclimat/blob/master/CONTRIBUTING.md) explains you (in french) basics of
the language used for the calculation models. You do not need to be a developper in order to contribute, this language
is intuitive and our infrastructure allows you to publish a version of your model without having to go through all the
website code.

**Step 2 :** GitHub is a particularly interesting platform for managing code versions. To start your own version, create
an account on GitHub and find our repository : [datagir/nosgestesclimat](https://github.com/datagir/nosgestesclimat)

**Step 3 :** You can then find the different models we support for the diverse regions and countries in the directory :
`data/i18n/models`

> **Note**  
> Those files contains calculation rules (in yaml format) which are linked to the french model (available in the
> `/data/` directory).

### Your model is not yet supported in NGC ?

You can create your own !  
Your file should be named with the country-code (uppercase), dash-separated with the language code (lowercase) and the
extension `.yaml`, for instance: for the United-Kingdom, in english the file is named `UK-en-us.yaml` (`UK` being the
country code of the United Kingdom and `en-us` being the language code). You can then start writing your own rule.

> **Warning**  
> The `params` section contains the caracteristic of your region and is mandatory. You should at least indicate the
> `nom` (name) and `code` attributes. The `gentilé` (demonym) and `drapeau` (flag) attributes are optionnal.

Example :

```yaml
params:
  code: UK
  nom: United Kingdom
  gentilé: British
  drapeau: GB
```

You can then follow the steps below to improve your model.

### Propose a change on an existing model

1. Open the corresponding file for the region (according to the country/language codes).

2. Rewrite the file according to the rules declared in the base model (french).

   > **Warning**
   > Be careful to report the keys of the french model **exactly** as-is. Otherwise the translation
   > will not be operational. You can copy-paste them in order to be sure they are exactly the same.

   For instance, the carbon intensity of the electricity mix is defined in the rule `intensité électricité` of the file
   `data/divers/commun.yaml`. To edit that value and title in the newly created model, you should re-write this rule
   with the new attributes.

   Example for the UK:

   ```yaml
   intensité électricité:
     titre: Climate intensity of United-Kingdom's electricity mix
     formule: 0.236
     note: |
       [Electricity Map](https://app.electricitymaps.com/map) view 5 years, 2022
   ```

> **Note**
> The model's code may contain minor subtilities (in particular in order to generate 'Mosaics'), do not hesitate to ask
> for help if you don't understand something.

For your modifications to be taken into account, it is necessary to have both file `XX-fr.yaml` and `XX-en-us.yaml` (for french and english language) containing the rules identical to the twin file but translated. You can use the `scripts/i18n/translateRegionModel.js` script to automatically translate your file. Be carefull, the previously translated file will be overwritten. If translation improvements have been made before, take a look at the diffs. (Documentation in the [wiki](https://github.com/datagir/nosgestesclimat/wiki/Translation#translateregionmodeljs))

### Remarks

- Think about translating your region model (see previous section)
- You can (and should) contribute with running the simulator locally in order to see what modifications you brought in
  real time. (See the [contribution guide (FR)](https://github.com/datagir/nosgestesclimat/blob/master/CONTRIBUTING.md))

### Finally

**Step 4 :**
When you are happy with your modifications, make a PR (
[guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request))

Review your modifications before to publish it. But don't worry : if you broke something, you will see a comment with
details of what doesn't work anymore. Someone will also review your edits before they are merged in production.

**Step 5 :**
Your version of the model is now linked to the website of "nosgestesclimat". You can see your modifications live at the
following address `https://nosgestesclimat.fr/simulateur/bilan?PR={PR-ID}`. (Replace `{PR-ID}` with the id of your PR.)

**Step 6 :**
Our team will review your changes and they will be able to answer your questions. The goal is to propose a version of
the model for each country/region. When your changes will be validated, it will be deployed and online on our website.
Any person that will connect from the specific country, you made a model for, will see your version.

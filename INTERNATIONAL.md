# International

> 🇬🇧 This guide is also available in english [here](/INTERNATIONAL.en.md)

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

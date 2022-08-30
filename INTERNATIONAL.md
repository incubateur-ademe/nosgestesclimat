# International

> For now, Nos Gestes Climat website and model programming language Publi.codes are only available in French. We intend to provide international solution of Nos Gestes Climat to help you to adapt the calculator to your country within few weeks. We are testing a multi-model version for francophones, that's why this guide is written in French.

L'internationalisation de Nos Gestes Climat est complexe : il n'est pas seulement question de simple traduction linguistique mais de la mise en place d'une solution permettant d'adapter la langue et le modèle de calcul en fonction du pays.

Toutes les réflexions sont visibles ici :

- https://github.com/datagir/nosgestesclimat/issues/1385
- https://github.com/datagir/nosgestesclimat-site/issues/470

N'hésitez pas à contribuer !

## Tutoriel : un nouveau modèle de calcul pour mon pays / ma région

**Etape 1 :** Github est une plateforme dédiée au code et aux discussions. [Cette page](https://github.com/datagir/nosgestesclimat/blob/master/CONTRIBUTING.md) vous explique les rudiments du langage utilisé pour la mise en place du modèle de calcul. Pour contribuer, inutile d'être développeur, le langage est intuitif et notre infrastructure vous permet de publier une version de votre modèle directement sans se plonger dans le code du site.

**Etape 2 :** Github est une plateforme particulièrement intéressante pour la gestion des versions du code. Pour commencer votre déclinaison, créer votre compte Github et rendez vous sur le dépôt "nosgestesclimat" : https://github.com/datagir/nosgestesclimat.

Réalisez ensuitre un _fork_ :

![fork](https://user-images.githubusercontent.com/55186402/187473855-57274d05-5678-4f83-9274-ad11e024b7f9.gif)

C'est une copie du code source vers votre espace. Vous pouvez alors modifier le code de votre coté.

**Etape 3 :** RDV dans le dossier Data et lancez-vous dans votre première modification !

![commit](https://user-images.githubusercontent.com/55186402/187473938-aedc3076-eabd-4198-828b-80c34431e325.gif)

**Etape 4 :** Vous êtes satisfait de votre modification ? Faites une PR.

Une PR ? Une Pull Request : cette manip vous permet d'envoyer vos modifications vers le code source du projet. Vous apparaissez ensuite dans la liste des PR en cours et vos modifications futures seront reliées à cette PR.

![PR](https://user-images.githubusercontent.com/55186402/187473975-493ec81e-3c2b-423d-a37d-8f228a993b88.gif)

Si vous faites des erreurs dans l'écriture de vos règles, pas de panique, un commentaire apparaitra pour vous les signaler.

**Etape 5 :** Votre version du modèle est maintenant reliée au code source et donc au site Nos Gestes Climat (via cette PR). Votre site est en ligne à l'adresse suivante : https://nosgestesclimat.fr/simulateur/bilan?PR={NUMERO DE VOTRE PR ICI : 1348}

**Etape 6 :** L'équipe Nos Gestes Climat est active sur Github et pourra répondre à vos question. L'objectif est de proposer une version du modèle propre à un pays ou une région. Lorsque votre modèle sera valider, nous le mettrons en ligne sur nosgestesclimat.fr. Ainsi, si les utilisateurs se connectent depuis le pays ou la région pour lequel/laquelle le modèle a été créé, ils verront la version correspondante.

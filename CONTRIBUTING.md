<h1 align="center">Contribuer à nosgestesclimat</h1>

<div align="center">

Bienvenue 👋 !

Ce dépôt contient un modèle d'empreinte carbone personnelle annuelle, écrit en YAML. Pas de panique, ce n'est pas sorcier, on vous explique en 5 minutes ce que ça veut dire et comment y contribuer.

Ce modèle pose des questions sur les aspects de la vie d'un individu et ses choix de consommation qui conduisent à émettre des gaz à effet de serre (GES) mesurés en CO2e. L'objectif n'est pas d'en faire une comptabilité parfaite, mais la plus représentative en posant un nombre de questions qui reste acceptable pour tous, à hauteur de l'engagement personnel moyen aujourd'hui dans les années 2020.

## ✒️ Les textes

Sans rentrer dans le calcul, il y a plein de textes à améliorer ! Un exemple facile pour commencer : voici [le texte de la question sur la surface du logement](https://github.com/datagir/nosgestesclimat/blob/master/data/logement/logement.publicodes#L49). Autre exemple : [le texte d'aide de la question "Votre logement est-il un appartement ?" ](https://github.com/datagir/nosgestesclimat/blob/master/data/logement/logement.publicodes#L82).

Mais ce n'est pas tout ! Il y a aussi des articles de textes entiers, comme [l'action "éco-conduite"](https://github.com/datagir/nosgestesclimat/blob/master/documentation/actions-plus/transport%20.%20%C3%A9co-conduite.md).

Du côté du site (le dépôt "nosgestesclimat-site"), il y a aussi la [FAQ](https://github.com/datagir/nosgestesclimat-site/blob/master/source/sites/publicodes/FAQ.yaml) par exemple.

Comment modifier ces textes ? Rendez-vous dans la section ["🏗️ En pratique" ci-dessous](https://github.com/datagir/nosgestesclimat/blob/master/CONTRIBUTING.md#%EF%B8%8F-en-pratique).

</div>

---

<!-- vim-markdown-toc GitLab -->

- [✒️ Les textes](#️-les-textes)
- [💾 Les modèles carbone](#-les-modèles-carbone)
- [🔣 Le langage d'écriture des modèles](#-le-langage-décriture-des-modèles)
- [🏗️ En pratique](#️-en-pratique)
  - [Avant tout : vérifier que votre question n'est pas déjà posée](#avant-tout--vérifier-que-votre-question-nest-pas-déjà-posée)
  - [Si vous n'avez que ⌛ 2 minutes pour faire une remarque](#si-vous-navez-que--2-minutes-pour-faire-une-remarque)
  - [Si vous voulez participer à l'amélioration du modèle \[⌛ 20 minutes\]](#si-vous-voulez-participer-à-lamélioration-du-modèle--20-minutes)
  - [Si vous voulez construire vous-même de nouveaux modèles \[⌛ 1 heure ou 2\]](#si-vous-voulez-construire-vous-même-de-nouveaux-modèles--1-heure-ou-2)
  - [Vous voulez contribuer comme un pro](#vous-voulez-contribuer-comme-un-pro)
    - [Sans rien installer sur votre machine \[⌛ \< 15 minutes de mise en place\]](#sans-rien-installer-sur-votre-machine---15-minutes-de-mise-en-place)
    - [En adoptant les outils et pratiques des développeurs](#en-adoptant-les-outils-et-pratiques-des-développeurs)

<!-- vim-markdown-toc -->

---

## 💾 Les modèles carbone

Peu importe la qualité des contributions, nous accueillons tout : un brouillon de calcul en français peut suffire... tant que les modèles carbone proposés _reposent sur des données bien sourcées_.

Par exemple, pour créer un modèle pour la trottinette électrique partagée, il faudrait idéalement réaliser une analyse de cycle de vie complète qui comprendrait :

- le matériel lui-même (batterie, trottinette en métal, composants en plastique) et sa durée de vie estimée
- l'entretien, le recyclage, l'acheminement depuis la Chine
- l'électricité et le geste de recharge, parfois par camion, parfois en utilisant les trottinettes elles-mêmes !
- ...

Évidemment, les modèles ne seront pas publiés directement en production, l'équipe Datagir et ses partenaires experts se saisira des propositions pour les enrichir et finalement les valider :)

À noter : tout modèle publié ici est publié sous la license MIT. Les modèles sont donc réutilisables librement par tout un chacun :free:

## 🔣 Le langage d'écriture des modèles

Le langage est décrit et documenté sur https://publi.codes. Il est développé par l'État dans le cadre du projet [mon-entreprise](https://github.com/betagouv/mon-entreprise).

N'hésitez pas à poser des questions sur le langage ou la contribution en créant une nouvelle _issue_, nous serons ravis d'y répondre.

## 🏗️ En pratique

### Avant tout : vérifier que votre question n'est pas déjà posée

Il y a de grandes chances que ce soit déjà le cas : direction [l'onglet _issues_](https://github.com/datagir/nosgestesclimat/issues), et son moteur de recherche. La pile est déjà bien remplie !

### Si vous n'avez que ⌛ 2 minutes pour faire une remarque

Si vous avez un compte Github, [créez simplement une issue](https://github.com/datagir/nosgestesclimat/issues/new) qui parle de votre idée ou correction et qui contient le calcul ou les interrogations en français.

S'il s'agit de corriger un texte, n'hésitez pas à nous proposer une suggestion, ça accélérera le traitement.

Sinon, écrivez-nous sur [notre formulaire de retour](https://nosgestesclimat.fr/contact).

### Si vous voulez participer à l'amélioration du modèle [⌛ 20 minutes]

Tous les textes, par exemple le texte d'une question ou le texte d'une suggestion de saisie, sont stockés dans une [collection de fichiers textes](https://github.com/datagir/nosgestesclimat/tree/master/data), classés par grande catégorie (logement, alimentation, etc.). C'est un langage très accessible que vous pouvez modifier directement. Pour cela il vous faut un compte Github, qui peut se créer gratuitement en 2-3 minutes.

Puis suivez ces étapes :

- rendez-vous sur l'un des modèles classés par grande catégorie [ici](https://github.com/datagir/nosgestesclimat/tree/master/data). Sélectionnez-en une, par exemple _numérique.publicodes_. Cliquez sur l'icône ✏ en haut à droite, vous êtes en mode édition !
- cliquez n'importe où dans le contenu du fichier, puis tapez Ctrl-F (pour lancer une recherche), cherchez le texte à modifier (par exemple "Quel est l'age de votre smartphone"), modifiez directement le texte sur cette page (corriger "age" en "âge")
- puis cliquez sur le bouton vert 🟩 `Propose file change`. Sur la page qui s'affiche - intitulée "Comparing changes" - cliquez sur le bouton vert `Create pull request`
- une fois la _pull request_ ouverte, un rapport sera automatiquement posté en commentaire ayant pour but de s'assurer qu'il n'y ai pas d'erreurs lors de l'interprétation du modèle ou qu'il ne manque pas de [traductions](https://github.com/datagir/nosgestesclimat/tree/master/docs/translation.md).
- 🎉 Bravo, l'équipe verra votre contribution et la validera si elle est parfaite. Sinon, on en discutera ensemble 🙂.
- Ce n'est pas tout ! Vous pouvez maintenant tester le site comme si vos changements avaient été validés 😎 : une fois votre pull request (PR) créée, allez sur https://nosgestesclimat.fr/, ajoutez à la fin de l'adresse dans votre navigateur `?PR=X` où X est le numéro de votre pull request (juste après le # dans le titre de votre PR).

### Si vous voulez construire vous-même de nouveaux modèles [⌛ 1 heure ou 2]

Il vous suffit de suivre les étapes ci-dessus, puis d'ajouter plusieurs nouvelles règles de calcul et questions, en s'inspirant de l'existant et en suivant la documentation du langage [publicodes](https://publi.codes).

> Il faut comprendre publicodes comme une sorte de tableur mais dans un fichier texte. Plutôt que des cases graphiques A1, B13, on nomme des variables, qui sont soit des _questions_ à l'utilisateur, soit des _formules de calcul_ qui combinent les réponses à ces questions pour calculer de nouveaux chiffres intéressants.

Même si vous avez produit du _pseudo code_, c'est à dire un semblant d'algorithme explicite mais qui ne compile pas, c'est déjà super 🦾. Cela dit, c'est encore mieux si vous pouvez le voir en action vous-même sur une branche de déploiement (voir le dernier item de la section précédente).

Pour bien comprendre comment le langage marche, et tester vous-même vos propres formules, nous avons mis en place un _bac à sable_ : une page Web avec un éditeur de texte dans lequel vous pouvez saisir vos formules et vérifier qu'elles fonctionnent. [Rendez-vous ici ⛱️](https://publi.codes/studio/).

Par défaut, vous aurez une formule toute bête qui somme des carottes et des champignons, que vous pouvez modifier pour multiplier des facteurs d'émission par des distance par exemple.

![](https://i.imgur.com/VhqpVuc.png)

Vous pouvez par exemple transformer cet exemple de modèle pour que le prix de l'avocat soit une question avec une valeur par défaut :

```yaml
prix . avocat:
  question: Quel prix pour tes avocats gros ?
  par défaut: 2€/avocat
```

> 💡 Pour faciliter la relecture par les autres contributeurs et l'équipe, la discussion et les itérations, mieux vaut faire une PR (_Pull request_, proposition de changements) par sujet. Par exemple, faite une PR pour votre proposition "ajouter la moto au simulateur". Faites-en une autre pour votre proposition "amélioration des données d'empreinte de construction des véhicules électriques".

### Vous voulez contribuer comme un pro

#### Sans rien installer sur votre machine [⌛ < 15 minutes de mise en place]

Grâce à Gitpod, vous aurez en quelques minutes un environnement de travail dans votre navigateur qui vous permet de modifier les modèles carbone et de voir en un rafraichissement de page comment ils impactent l'interface de NGC. C'est parti !

- Cliquez sur le bouton suivant (**à ne faire qu'une fois, ensuite vous le réutiliserez puisqu'il sera ajouter à votre dashboard [Gitpod](https://gitpod.io/workspaces)**) : [![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/datagir/nosgestesclimat-site/)
- Un nouvel onglet s'ouvre, vous avez accès à tout un environnement de développement, appelé Visual Studio Code, qui est un standard aujourd'hui parmi les développeurs Web. Pour afficher l'ensemble des fichiers du workspace, cliquez sur le menu en haut à gauche, puis File, Open folder... et sélectionnez /workspace/. Vous pouvez ensuite naviguer dans les fichiers, les modifier, puis envoyer vos changements sur git via l'onglet (vertical) "Source control".
- Vous verrez dans ces onglets la liste des fichiers modifiés, appellée "Changes". Pour faire votre 1er commit, vous devez ajouter des fichiers en cliquant sur "+" à droite du fichier. Vous avez alors des "stages changes". Écrivez un message de commit, puis validez !
- C'est bien beau de pouvoir faire des changements, mais comment être sur qu'ils _compilent_, c'est à dire que leur forme est correcte, et que leur fond l'est aussi, ce qui vous demande de voir l'impact qu'ont vos changements sur l'interface NGC ?
- En bas, vous avez le "terminal", la ligne de commande. Normalement, l'application est déjà lancée, vous n'avez rien à faire dans le terminal !
- Dans le cas ou vous ne voyez pas écrit "compiled successfully" ou que rien n'a été lancé, suivez ces instructions:
- Vérifiez que vous êtes dans le dossier 'nosgestes-climat-site' via la commande `pwd`. Si vous n'y êtes, déplacez vous via la commande `cd`.
- Lancez : `yarn && yarn start` : la commande `yarn` installe les dépendances du site, puis `yarn start` lance la compilation et le serveur ; ⏳️ attendez un peu que ça se passe
- Vous verrez normalement un dialogue en bas à droite disant "A service is available on port 8080", cliquez sur le bouton "Open browser". Si vous ne voyez pas cette fenêtre, rdv dans l'onglet "Remote Explorer" et cloquez sur la planète (open browser) à droite du port 8080.
- Si tout s'est bien passé, vous avez le site qui tourne _avec votre version du modèle climat_, que vous pouvez modifier à votre guise. Après un changement du modèle dans votre environnement de développement (ajoutez 1000 à la somme de `bilan.publicodes`) par exemple, faites Ctrl-S (sauvegarder) puis allez voir l'onglet du site ouvert juste avant et faites F5 : le calcul aura changé de 1000 😀
- Vous pouvez aussi changer les textes des questions : la fonction recherche dans le menu à gauche peut-être utile pour retrouver facilement l'endroit dans le code qui correspond au texte que vous souhaité modifier !

#### En adoptant les outils et pratiques des développeurs

Rien ne remplace l'outillage complet : pour travailler sur ces modèles YAML et voir vos changements mettre à jour l'interface de simulation (sans F5, c'est magique), il faut adopter la méthode de travail d'un développeur Web.

Il va falloir se documenter pour comprendre ce qu'est [_git_](https://openclassrooms.com/fr/courses/1233741-gerez-vos-codes-source-avec-git), clôner ce dépôt vers un dossier nommé "nosgestesclimat", puis clôner [nosgestesclimat-site](https://github.com/datagir/nosgestesclimat-site) à la même racine, entrer dans ecolab-climat et faire `yarn && yarn start`. Vous pourrez alors modifier les fichiers .publicodes et voir en temps réel les résultats des calculs et simulations changer et poser de nouvelles questions :sparkles: .

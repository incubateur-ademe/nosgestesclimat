<h1 align="center">Contribuer à nosgestesclimat</h1>

<div align="center">

Bienvenue 👋 !

Ce dépôt contient un modèle d'empreinte carbone personnelle annuelle, écrit en YAML. Pas de panique, ce n'est pas sorcier, on vous explique en 5 minutes ce que ça veut dire et comment y contribuer.

Ce modèle pose des questions sur les aspects de la vie d'un individu et ses choix de consommation qui conduisent à émettre des gaz à effet de serre (GES) mesurés en CO2e. L'objectif n'est pas d'en faire une comptabilité parfaite, mais la plus représentative en posant un nombre de questions qui reste acceptable pour tous, à hauteur de l'engagement personnel moyen aujourd'hui dans les années 2020.

Ce guide vous donnera les bases pour contribuer sur le projet. Vous pouvez également visiter [notre wiki](https://accelerateur-transition-ecologique-ademe.notion.site/c57ea7dfc6214660a2d6a6a3addb88bd?v=d60b4b87e8ea4bee8e3c501bea75afc9) pour davantage de ressources.

</div>

---

<!-- vim-markdown-toc GitLab -->

- [💾 Les modèles carbone](#-les-modèles-carbone)
- [🔣 Le langage d'écriture des modèles](#-le-langage-décriture-des-modèles)
- [🏗️ En pratique](#️-en-pratique)
  - [Avant tout : vérifier que votre question n'est pas déjà posée](#avant-tout--vérifier-que-votre-question-nest-pas-déjà-posée)
  - [Si vous n'avez que ⌛ 2 minutes pour faire une remarque](#si-vous-navez-que--2-minutes-pour-faire-une-remarque)
  - [Si vous voulez participer à l'amélioration du modèle \[⌛ 20 minutes\]](#si-vous-voulez-participer-à-lamélioration-du-modèle--20-minutes)
  - [Si vous voulez construire vous-même de nouveaux modèles \[⌛ 1 heure ou 2\]](#si-vous-voulez-construire-vous-même-de-nouveaux-modèles--1-heure-ou-2)
  - [Si vous voulez contribuer comme un pro](#si-vous-voulez-contribuer-comme-un-pro)

<!-- vim-markdown-toc -->

---

## 💾 Les modèles carbone

Peu importe la qualité des contributions, nous accueillons tout : un brouillon de calcul en français peut suffire... tant que les modèles carbone proposés _reposent sur des données bien sourcées_.

Par exemple, pour créer un modèle pour la trottinette électrique partagée, il faudrait idéalement réaliser une analyse de cycle de vie complète qui comprendrait :

- le matériel lui-même (batterie, trottinette en métal, composants en plastique) et sa durée de vie estimée
- l'entretien, le recyclage, l'acheminement depuis la Chine
- l'électricité et le geste de recharge, parfois par camion, parfois en utilisant les trottinettes elles-mêmes !
- ...

Évidemment, les modèles ne seront pas publiés directement en production, l'équipe Nos Gestes Climat se saisira des propositions pour les enrichir et finalement les valider 😉

À noter : tout modèle publié ici est publié sous la license MIT. Les modèles sont donc réutilisables librement par tout un chacun :free:

## 🔣 Le langage d'écriture des modèles

Le langage est décrit et documenté sur https://publi.codes. Il est développé par l'État dans le cadre du projet [mon-entreprise](https://github.com/betagouv/mon-entreprise).

N'hésitez pas à poser des questions sur le langage ou la contribution en créant une nouvelle _issue_, nous serons ravis d'y répondre.

## 🏗️ En pratique

### Avant tout : vérifier que votre question n'est pas déjà posée

Il y a de grandes chances que ce soit déjà le cas : direction [l'onglet _issues_](https://github.com/incubateur-ademe/nosgestesclimat/issues), et son moteur de recherche. La pile est déjà bien remplie !

Vous pouvez également consulter [notre FAQ](https://nosgestesclimat.fr/questions-frequentes).

### Si vous n'avez que ⌛ 2 minutes pour faire une remarque

Si vous avez un compte Github, [créez simplement une issue](https://github.com/incubateur-ademe/nosgestesclimat/issues/new) qui parle de votre idée ou correction et qui contient le calcul ou les interrogations en français.

S'il s'agit de corriger un texte, n'hésitez pas à nous proposer une suggestion, ça accélérera le traitement.

Sinon, écrivez-nous sur [notre formulaire de retour](https://nosgestesclimat.fr/contact).

### Si vous voulez participer à l'amélioration du modèle [⌛ 20 minutes]

Tous les textes, par exemple le texte d'une question ou le texte d'une suggestion de saisie, sont stockés dans une [collection de fichiers textes](https://github.com/incubateur-ademe/nosgestesclimat/tree/master/data), classés par grande catégorie (logement, alimentation, etc.). C'est un langage très accessible que vous pouvez modifier directement. Pour cela il vous faut un compte Github, qui peut se créer gratuitement en 2-3 minutes.

Puis suivez ces étapes :

- rendez-vous sur l'un des modèles classés par grande catégorie [ici](https://github.com/incubateur-ademe/nosgestesclimat/tree/master/data). Sélectionnez-en une, par exemple _numérique.publicodes_. Cliquez sur l'icône ✏ en haut à droite, vous êtes en mode édition !
- cliquez n'importe où dans le contenu du fichier, puis tapez Ctrl-F (pour lancer une recherche), cherchez le texte à modifier (par exemple "Quel est l'age de votre smartphone"), modifiez directement le texte sur cette page (corriger "age" en "âge")
- puis cliquez sur le bouton vert 🟩 `Propose file change`. Sur la page qui s'affiche - intitulée "Comparing changes" - cliquez sur le bouton vert `Create pull request`
- une fois la _pull request_ ouverte, un rapport sera automatiquement posté en commentaire ayant pour but de s'assurer qu'il n'y ai pas d'erreurs lors de l'interprétation du modèle.
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

### Si vous voulez contribuer comme un pro

Rien ne remplace l'outillage complet : pour travailler sur ces modèles YAML et voir vos changements mettre à jour l'interface de simulation (sans F5, c'est magique), il faut adopter la méthode de travail d'un développeur Web.

Vous pouvez dans un premier temps, lancer la "quick doc", [directement dans ce dépôt](https://github.com/incubateur-ademe/nosgestesclimat/blob/cd8329dda8659658142114ccb3d29437e7ea2933/quick-doc/README.md).

Pour faire tourner le site complet en local, il va falloir se documenter pour comprendre ce qu'est [_git_](https://openclassrooms.com/fr/courses/1233741-gerez-vos-codes-source-avec-git), cloner ce dépôt sur votre machine, puis cloner [nosgestesclimat-site-nextjs](https://github.com/incubateur-ademe/nosgestesclimat-site-nextjs).

Le site utlise le modèle sous forme d'un paquet. Vous pouvez donc utilisez [`yarn link`](https://classic.yarnpkg.com/lang/en/docs/cli/link/) afin d'utiliser le paquet du modèle en local depuis le site.

A utiliser de cette manière côté modèle :

```bash
yarn link
```

Puis, côté site :

```bash
yarn link @incubateur-ademe/nosgestesclimat
```

Vous pourrez alors modifier les fichiers `.publicodes` et voir en temps réel les résultats des calculs et simulations changer et poser de nouvelles questions :sparkles:.

Il faut lancer, côté modèle :

```bash
yarn compile
```

Puis, côté site :

```bash
yarn dev
```

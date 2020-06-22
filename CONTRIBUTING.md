# Contribuer à ecolab-data

Bienvenue 👋 ! 

Ce dépôt contient un modèle d'empreinte carbone personnelle annuelle, écrit en YAML dans un fichier unique, co2.yaml. 

L'objectif de ce modèle est de poser des questions sur les aspects de la vie d'un individu qui émettent le plus de carbone. L'objectif n'est pas d'en faire une comptabilité parfaite, mais la plus représentative en posant un nombre de question qui reste acceptable pour tous, à hauteur de l'engagement personnel moyen aujourd'hui en 2020.

## 💾 Les modèles carbone

Peu importe la qualité des contributions, nous accueillons tout : un brouillon de calcul en français peut suffire... tant que les modèles carbone proposés *reposent sur données sourcées*. 


Par exemple, pour créer un modèle pour la trottinette électrique partagée, il faudrait idéalement réaliser une analyse de cycle de vie complète qui comprendrait : 

- le matériel lui-meme (batterie, trottinette en métal, composants en plastique) et sa durée de vie estimée
- l'entretien, le recyclage, l'acheminement depuis la Chine
- l'électricité et le geste de recharge, parfois par camion, parfois en utilisant les trottinettes elles-memes ! 
- ...

Evidemment, les modèles ne seront pas publiés directement en production, l'équipe Ecolab et ses partenaires experts se saisira des propositions pour les enrichir :)


A noter : tout modèle publié ici est publié sous la license MIT. Les modèles sont donc réutilisables librement par tout un chacun :-)

## 🔣 Le langage d'écriture des modèles

Le langage est décrit sur https://publi.codes. Il est développé par l'Etat dans le cadre du projet [mon-entreprise](https://github.com/betagouv/mon-entreprise). Il est actuellement en train d'être documenté et extrait comme un projet autonome. Il est assez hétérodoxe, en témoigne ce fichier unique qui ressemble plus à une base de données qu'à un dépôt de code classique. N'hésitez pas à poser des questions sur le langage ou la contribution en créant une nouvelle *issue*, nous serons ravi d'y répondre.


## 🏗️ En pratique

### Si vous n'avez que 2 minutes pour faire une remarque

Si vous avez un compte Github, [créez simplement une issue](https://github.com/laem/ecolab-data/issues/new) qui parle de votre idée ou correction et qui contient le calcul ou les interrogations en français.

Sinon, écrivez-nous à contact@ecolab.beta.gouv.fr.

### Si vous voulez participer à l'amélioration du modèle

Tous les textes, par exemple le texte d'une question ou le texte d'une suggestion de saisie, sont stockés dans un fichier texte, gros mais facile à lire. C'est un langage très accessible que vous pouvez modifier directement. Pour cela il vous faut un compte Github, qui peut se créer gratuitement en 2-3 minutes.
 
Puis suivez ces étapes : 

- rendez-vous sur le fichier texte en question [ici](https://github.com/betagouv/ecolab-data/blob/master/co2.yaml). Cliquez sur l'icône ✏ en haut à droite, vous êtes en mode édition
- cliquez n'importe où dans le contenu du fichier, puis tapez Ctrl-F (pour lancer une recherche), cherchez le texte à modifier (par exemple "Quel est l'age de votre smartphone"), modifiez directement le texte sur cette page (corriger "age" en "âge")
- puis cliquez sur le bouton vert 🟩 `Propose file change`. Sur la page qui s'affiche intitulée "Comparing changes", cliquez sur le bouton vert `Create pull request`
- 🎉 Bravo, l'équipe verra votre contribution et la validera si elle est parfaite. Sinon, on en discutera ensemble 🙂.

- Ce n'est pas tout ! Vous pouvez maintenant tester le site comme si vos changements avaient été validés 😎 : une fois votre pull request (PR) créée, allez sur https://ecolab.ademe.fr/apps/micmac, ajoutez à la fin de l'adresse dans votre navigateur `?branch=X` où X est le numéro de votre pull request (juste après le # dans le titre de votre PR).

### Vous êtes développeur - vous voulez découvrir le langage de publication

Nous travaillons à un environnement Web de développement, vous pouvez en avoir un avant goût sur le [studio publicodes](https://publi.codes/studio). 

Pour travailler sur ces modèles YAML et voir vos changements mettre à jour l'interface de simulation (sans F5, c'est magique), il faut cloner ce dépôt vers un dossier nommé "ecolab-data", puis cloner [ecolab-climat](https://github.com/betagouv/ecolab-climat) à la même racine, entrer dans ecolab-climat et faire `yarn && yarn start`.

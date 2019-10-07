# Contribuer 

Bienvenue 👋 ! Ce dépôt contient des modèles d'empreinte carbone de nos gestes quotidiens écrits en YAML dans un fichier unique, co2.yaml. 

## 💾 Les modèles carbone

Peu importe la qualité des contributions, nous acceuillons tout : un brouillon de calcul en français peut suffire... tant que les modèles carbone proposés *reposent sur données sourcées*. 

Par exemple, pour créer un modèle pour la trottinette électrique partagée, il faudrait idéalement réaliser une analyse de cycle de vie complète qui comprendrait : 

- le matériel lui-meme (batterie, trottinette en métal, composants en plastique) et sa durée de vie estimée
- l'entretien, le recyclage, l'acheminement depuis la Chine
- l'électricité et le geste de recharge, parfois par camion, parfois en utilisant les trottinettes elles-memes ! 
- ...

Ici, nous prenons le parti qu'*il vaut mieux créer une première version simple du modèle* qu'attendre un an ou payer un consultant 1000€ pour obtenir toutes les données et un modèle parfait. Ce modèle inspirera les prochains contributeurs qui l'amélioreront successivement.

Le temps nous est compté ! Le but, c'est d'informer les citoyens au plus vite. Chaque modèle publié sur ce dépôt permettra aux utilisateurs d'améliorer leur compréhension de l'impact climat via le simulateur qui sera automatiquement publié sur https://futur.eco.

> Dans notre exemple de la trottinette, la 1ère version du calcul aujourd'hui en ligne ne prend en compte que le matériel lui-même, car des calculs d'ordre de grandeur ont déterminé que vu sa faible durée de vie, il représente l'essentiel de l'empreinte carbone. L'électricité en France est décarbonée; les tours de recharge s'effectuent de façon mutualisée pour toute une série de trottinette dont l'usage sur 1km est du meme ordre de grandeur qu'une voiture; nous n'avons pas d'infos sur le recyclage, etc.

A noter : tout modèle publié ici est publié sous la license MIT. Les modèles sont donc réutilisables librement par tout un chacun :-)

## 🔣 Le langage d'écriture des modèles

Le langage est décrit sur https://publi.codes. Il est développé par l'Etat dans le cadre du projet [mon-entreprise](https://github.com/betagouv/mon-entreprise). Il est actuellement en train d'être documenté et extrait comme un projet autonome. Il est assez hétérodoxe, en témoigne ce fichier unique ressemble plus à une base de données qu'à un dépôt de code classique. N'hésitez pas à poser des questions en créant une nouvelle *issues*, nous serons ravi d'y répondre.


## 🏗️ En pratique

### Vous n'êtes pas développeur / vous n'avez que 15 minutes devant vous

Si vous avez un compte Github, [créez simplement une issue](https://github.com/laem/futureco-data/issues/new) qui parle de votre idée et qui contient le calcul en français.
Si vous n'en avez pas, rendez-vous sur https://futur.eco/contribuer/, notre robot se charger de créer une *issue* à votre place. 

### Vous êtes développeur - vous voulez découvrir le langage de publication

Bientôt, il sera possible de contribuer aux modèles directement sur https:/futur.eco. En attendant, voici comment procéder pour publier un modèle "qui compile".

```
git clone git@github.com:laem/futureco.git
cd futureco
yarn && yarn start
```

Puis dans une autre fenêtre de votre terminal :

```
cd .. # Il est important de cloner les deux dépôts l'un à côté de l'autre
git clone git@github.com:laem/futureco-data.git
```

Il vous suffit ensuite de modifier le fichier `co2.yaml`, et les changements seront automatiquement pris en compte sur `http://localhost:8080/publicodes`. 

Il peut être difficile de s'y retrouver dans le fichier YAML unique, l'astuce est alors de s'aider de la page [`/documentation`](https://futur.eco/documentation) qui liste tous les modèles. Elle est accessible sur les pages `/simulation` en tapant `Ctrl-K`.

Une PR sur laem/futureco-data permettra finalement d'intégrer ces changements sur https://futur.eco.


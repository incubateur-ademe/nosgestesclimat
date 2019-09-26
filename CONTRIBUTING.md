Ce dépot contient dans un fichier unique des modèles d'empreinte carbone de nos gestes quotidiens écrits en YAML.

Le langage est décrit sur https://publi.codes. Il est développé par l'Etat dans le cadre du projet [mon-entreprise](https://github.com/betagouv/mon-entreprise), et pour l'instant la documentation est trop peu développée.

Ainsi, peu importe la qualité des contributions ici : un brouillon de calcul en français peut suffire... tant que les modèles carbone proposés reposent sur des bases sourcées.

Par exemple, pour créer un modèle pour la trottinette électrique partagée, il faudrait idéalement réaliser une analyse de cycle de vie complète qui comprendrait : 

- le matériel lui-meme (batterie, trottinette en métal, composants en plastique) et sa durée de vie estimée
- l'entretien, le recyclage, l'acheminement depuis la Chine
- l'électricité et le geste de recharge, parfois par camion, parfois en utilisant les trottinettes elles-memes ! 
- ...

Ici, nous prenons le parti qu'il vaut mieux créer une première version du modèle simple qu'attendre un an ou payer un consultant 1000€ pour obtenir toutes les données.

Le but, c'est d'informer les citoyens au plus vite via le simulateur simple que sera automatiquement publié sur https://futur.eco.

Dans notre exemple de la trottinette, la 1ère version du calcul aujourd'hui en ligne ne prend en compte que le matériel lui-meme, car des études ont déterminé que vu sa faible durée de vie, il repréesente l'essentiel de l'empreinte carbone. L'électricité en France est décarbonée; les tours de recharge s'effectuent de façon mutualisée pour toute une série de trottinette dont l'usage sur 1km est du meme ordre de grandeur qu'une voiture; nous n'avons pas d'infos sur le recyclage, etc.


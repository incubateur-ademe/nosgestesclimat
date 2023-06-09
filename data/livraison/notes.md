# Notes modèle "Impact Livraison"

## Quelques interrogations

### Emballage

- Pour la surface de la sphère, d'où vient le coefficient d'ajustement ?

### Transport livraison

- Pour le calcul des tonnes.km associées au colis un facteur "chargement moyen" semble avoir été introduit inutilement dans la formule.

### Plateformes

- On calcule le nombre de colis par m2 d'entrepôt sur tout sa durée de vie pour en déduire la part d'empreint de la construction de l'entrepôt qui doit être attribuée à un colis. L'empreinte de l'entrepôt est donnée en gCO2e/m2/an. On a un facteur "durée de vie de l'entrepôt" qui semble être en trop. A moins que l'unité donnée pour l'empreinte de l'entrepôt est en gCO2e/m2.
- Pas de source pour la consommation élec des entrepôts et plus gloablement, peu de sources primaires.

### Entrepot

### Point de retrait

```
livraison colis . empreinte point de retrait . infrastructures . nombre de colis par m2:
  formule: empreinte point de retrait . durée de vie * 365 * empreinte point de retrait . nombre de colis par m2 / 24
  note: D'ou vient ce facteur (1 / 24) ? Pourquoi n'y a t-il pas le nombre de jours dans l'équation ?
```

### Déplacement consommateur

Différence entre AU et EL pour la voiture (infrastructures)

## Les scénarios

**Objectif:** Connaitre les paramètres d'entrée des scénarios (e nombre de plateformes, les distances entre les plateformes, le mode de transport)

-> Pour le moment, implémentation des scénarios de l'excel mais de nombreuses questions notamment sur le fait qu'ils ne s'adressent pas forcément au grand public.

> Ex: Pas de scénario "Express" visiblement (dans l'excel je ne vois pas l'avion pour le fret) mais on a le scénario “livraison rapide” qui présente une étape de moins que le scénario “livraison à domicile” et donc l'empreinte est plus faible ! De même on a “achat en magasin” qui est presque identique à “click and collect” (emballage en moins) ..

> On a également des valeurs par défaut mais sans vraiment justification : pourquoi cette taille de magasin ? Pourquoi considérer que pour un achat en magasin, par défaut c'est “voiture” et pour “click and collect” c'est moyenne de plusieurs modes de déplacements

## Par rapport aux maquettes

- "Le trajet est mutualisé avec un autre trajet" -> Par défaut, si distance réelle allouée au colis = 70% de la distance parcourue au total pour le trajet (le paramètre est la variable `livraison colis . déplacement consommateur . allocation du trajet au colis`). Par ailleurs, quel est l'intérêt du motif associé ? Comment le motif entre dans le calcul ?

- "Vos articles viennent de loin (transport en avion)" -> Je ne vois pas d'emblée cette option dans les scénarios de l'excel, mais on peut créer un scénario avec. Reste à savoir la distance à parcourir.

- "Vos articles sont envoyés en livraison express" -> Je ne sais pas comment faire la différence par rapport au deuxième point et même comment caractériser (étapes + paramètres) une livraison express.

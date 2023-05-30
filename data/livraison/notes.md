# Notes modèle "Impact Livraison"

## Emballage

- Pour la surface de la sphère, d'où vient le coefficient d'ajustement ?

## Transport livraison

- Pour le calcul des tonnes.km associées au colis un facteur "chargement moyen" semble avoir été introduit inutilement dans la formule.
- A revoir, autre question dans le modèle.

## Plateformes

- On calcule le nombre de colis par m2 d'entrepôt sur tout sa durée de vie pour en déduire la part d'empreint de la construction de l'entrepôt qui doit être attribuée à un colis. L'empreinte de l'entrepôt est donnée en gCO2e/m2/an. On a un facteur "durée de vie de l'entrepôt" qui semble être en trop.
- Pas de source pour la consommation élec des entrepôts.

## Entrepot

```
livraison colis . empreinte entrepot . nombre de colis par m2:
  formule: volume de stockage par m2 / (informations . volume * 4)
  note: D'où vient le facteur 4 ?
```

## Point de retrait

```
livraison colis . empreinte point de retrait . infrastructures . nombre de colis par m2:
  formule: empreinte point de retrait . durée de vie * 365 * empreinte point de retrait . nombre de colis par m2 / 24
  note: D'ou vient ce facteur (1 / 24) ? Pourquoi n'y a t-il pas le nombre de jours dans l'équation ?
```

## Déplacement consommateur

Différence entre AU et EL pour la voiture (infrastructures)

# Test à la main des catégories:

- Emballage : OK

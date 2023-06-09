import { testOf } from './utils'

const testColis= (publiProp, descr, inputs, output) => {
  testOf('data/livraison/livraison colis.yaml', publiProp, descr, inputs, output)
}

testColis(
  'livraison colis . scénario . domicile',
  "Pour une livraison à domicile, l'empreinte est donnée par la somme de : commande en ligne, emballage, entrepot stockage, transport inter plateformes, plateformes, transport livraison",
  {   
    "commande en ligne": 1,
    "emballage": 2,
    "entrepot stockage": 3,
    "transport inter plateformes": 4,
    "plateformes": 5,
    "transport livraison": 6
  },
  21
)

testColis(
  'livraison colis . scénario . point de retrait',
  "Pour une livraison en point de retrait, l'empreinte est la même qu'en livraison à domicile, mais en plus, on rajoute le point de retrait et le déplacement consommateur",
  {   
    "commande en ligne": 1,
    "emballage": 2,
    "entrepot stockage": 3,
    "transport inter plateformes": 4,
    "plateformes": 5,
    "transport livraison": 6,
    "point de retrait": 7,
    "déplacement consommateur": 8,
  },
  36
)

testColis(
  'livraison colis . scénario . click and collect',
  "Pour une livraison en click and collect, l'empreinte est la même qu'en livraison à domicile, mais en plus, on rajoute le magasin et le déplacement consommateur",
  {   
    "commande en ligne": 1,
    "emballage": 2,
    "entrepot stockage": 3,
    "transport inter plateformes": 4,
    "plateformes": 5,
    "transport livraison": 6,
    "magasin": 7,
    "déplacement consommateur": 8,
  },
  36
)

testColis(
  'livraison colis . scénario . magasin traditionnel',
  "Pour une livraison en magasin traditionnel, l'empreinte est la somme de : entrepot stockage, transport inter plateformes, plateformes, magasin, déplacement consommateur",
  {   
    "entrepot stockage": 1,
    "transport inter plateformes": 2,
    "plateformes": 3,
    "magasin": 4,
    "déplacement consommateur": 5,
  },
  15
)

testColis(
  'livraison colis . informations . volume',
  "Volume du colis : pour la grand consommation, le volume d'un colis est de 45000 cm3",
  {   
    "catégorie": "'grande consommation'",
  },
  45000
)

testColis(
  'livraison colis . informations . volume',
  "Volume du colis : pour l'habillement, le volume d'un colis est de 10000 cm3",
  {   
    "catégorie": "'habillement'",
  },
  10000
)

testColis(
  'livraison colis . informations . volume',
  "Volume du colis : pour un bien culturel, le volume d'un colis est de 750 cm3",
  {   
    "catégorie": "'culturel'",
  },
  750
)

testColis(
  'livraison colis . informations . volume',
  "Volume du colis : pour un équipements volumineux, le volume d'un colis est de 300000 cm3",
  {   
    "catégorie": "'équipements volumineux'",
  },
  300000
)

testColis(
  'livraison colis . informations . volume',
  "Volume du colis : pour tout autre produit, le volume considéré est de 90000 cm3",
  {   
    "catégorie": "'autre'",
  },
  90000
)

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

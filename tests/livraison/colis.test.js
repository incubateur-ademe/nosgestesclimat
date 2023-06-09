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

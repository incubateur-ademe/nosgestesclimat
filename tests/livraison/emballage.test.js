import { testOf } from './utils'

const testEmballage = (publiProp, descr, inputs, output) => {
  testOf('data/livraison/emballage.yaml', publiProp, descr, inputs, output)
}

testEmballage(
  'livraison colis . emballage',
  'poids, multiplié par l\'empreinte, avec virgule flottante',
  { 'poids emballage': 2.5, 'empreinte carton': 4 },
  10
)

testEmballage(
  'livraison colis . emballage',
  'poids, multiplié par l\'empreinte, sans virgule flottante',
  { 'poids emballage': 80, 'empreinte carton': 2 },
  160
)

testEmballage(
  'livraison colis . empreinte carton',
  'constante, en gCO2e/g',
  {},
  1.29
)

testEmballage(
  'livraison colis . emballage . poids emballage . surface',
  'Surface d\'emballage, addition de la surface de la sphère et d\'un ajustement, cas 1',
  { 'surface sphère': 12, 'ajustement': 2 },
  14
)

testEmballage(
  'livraison colis . emballage . poids emballage . surface',
  'Surface d\'emballage, addition de la surface de la sphère et d\'un ajustement, cas 2',
  { 'surface sphère': 3, 'ajustement': 9 },
  12
)


import { testOf } from './utils'

const testEmballage = (publiProp, descr, inputs, output) => {
	testOf('data/livraison/*.publicodes', publiProp, descr, inputs, output)
}

testEmballage(
	'livraison colis . emballage',
	"poids, multiplié par l'empreinte, avec virgule flottante",
	{
		'livraison colis . emballage . poids emballage': 2.5,
		'livraison colis . emballage . empreinte carton': 4,
	},
	10
)

testEmballage(
	'livraison colis . emballage',
	"poids, multiplié par l'empreinte, sans virgule flottante",
	{
		'livraison colis . emballage . poids emballage': 80,
		'livraison colis . emballage . empreinte carton': 2,
	},
	160
)

testEmballage(
	'livraison colis . empreinte carton',
	'constante, en gCO2e/g',
	{},
	1.29
)

testEmballage(
	'livraison colis . emballage . poids emballage',
	'surface * densité, cas 1',
	{
		'livraison colis . emballage . poids emballage . surface': 80,
		'livraison colis . emballage . poids emballage . densité': 2,
	},
	160
)

testEmballage(
	'livraison colis . emballage . poids emballage',
	'surface * densité, cas 2',
	{
		'livraison colis . emballage . poids emballage . surface': 2.5,
		'livraison colis . emballage . poids emballage . densité': 4,
	},
	10
)

testEmballage(
	'livraison colis . emballage . poids emballage . surface',
	"Surface d'emballage, addition de la surface de la sphère et d'un ajustement, cas 1",
	{
		'livraison colis . emballage . poids emballage . surface . surface sphère': 12,
		'livraison colis . emballage . poids emballage . surface . ajustement': 2,
	},
	14
)

testEmballage(
	'livraison colis . emballage . poids emballage . surface',
	"Surface d'emballage, addition de la surface de la sphère et d'un ajustement, cas 2",
	{
		'livraison colis . emballage . poids emballage . surface . surface sphère': 3,
		'livraison colis . emballage . poids emballage . surface . ajustement': 9,
	},
	12
)

testEmballage(
	'livraison colis . emballage . poids emballage . surface . surface sphère . pi',
	'constante universelle',
	{},
	3.14159265
)

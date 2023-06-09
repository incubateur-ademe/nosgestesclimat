import { testOf } from './utils'

const testColis = (publiProp, descr, inputs, output) => {
	testOf('data/livraison/*.yaml', publiProp, descr, inputs, output)
}

testColis(
	'livraison colis . scénario . domicile',
	"Pour une livraison à domicile, l'empreinte est donnée par la somme de : commande en ligne, emballage, entrepot stockage, transport inter plateformes, plateformes, transport livraison",
	{
		'livraison colis . commande en ligne': 1,
		'livraison colis . emballage': 2,
		'livraison colis . entrepot stockage': 3,
		'livraison colis . transport inter plateformes': 4,
		'livraison colis . plateformes': 5,
		'livraison colis . transport livraison': 6,
	},
	21
)

testColis(
	'livraison colis . scénario . point de retrait',
	"Pour une livraison en point de retrait, l'empreinte est la même qu'en livraison à domicile, mais en plus, on rajoute le point de retrait et le déplacement consommateur",
	{
		'livraison colis . commande en ligne': 1,
		'livraison colis . emballage': 2,
		'livraison colis . entrepot stockage': 3,
		'livraison colis . transport inter plateformes': 4,
		'livraison colis . plateformes': 5,
		'livraison colis . transport livraison': 6,
		'livraison colis . point de retrait': 7,
		'livraison colis . déplacement consommateur': 8,
	},
	36
)

testColis(
	'livraison colis . scénario . click and collect',
	"Pour une livraison en click and collect, l'empreinte est la même qu'en livraison à domicile, mais en plus, on rajoute le magasin et le déplacement consommateur",
	{
		'livraison colis . commande en ligne': 1,
		'livraison colis . emballage': 2,
		'livraison colis . entrepot stockage': 3,
		'livraison colis . transport inter plateformes': 4,
		'livraison colis . plateformes': 5,
		'livraison colis . transport livraison': 6,
		'livraison colis . magasin': 7,
		'livraison colis . déplacement consommateur': 8,
	},
	36
)

testColis(
	'livraison colis . scénario . magasin traditionnel',
	"Pour une livraison en magasin traditionnel, l'empreinte est la somme de : entrepot stockage, transport inter plateformes, plateformes, magasin, déplacement consommateur",
	{
		'livraison colis . entrepot stockage': 1,
		'livraison colis . transport inter plateformes': 2,
		'livraison colis . plateformes': 3,
		'livraison colis . magasin': 4,
		'livraison colis . déplacement consommateur': 5,
	},
	15
)

testColis(
	'livraison colis . informations . volume',
	"Volume du colis : pour la grand consommation, le volume d'un colis est de 45000 cm3",
	{
		'livraison colis . informations . catégorie': "'grande consommation'",
	},
	45000
)

testColis(
	'livraison colis . informations . volume',
	"Volume du colis : pour l'habillement, le volume d'un colis est de 10000 cm3",
	{
		'livraison colis . informations . catégorie': "'habillement'",
	},
	10000
)

testColis(
	'livraison colis . informations . volume',
	"Volume du colis : pour un bien culturel, le volume d'un colis est de 750 cm3",
	{
		'livraison colis . informations . catégorie': "'culturel'",
	},
	750
)

testColis(
	'livraison colis . informations . volume',
	"Volume du colis : pour un équipements volumineux, le volume d'un colis est de 300000 cm3",
	{
		'livraison colis . informations . catégorie': "'équipements volumineux'",
	},
	300000
)

testColis(
	'livraison colis . informations . volume',
	'Volume du colis : pour tout autre produit, le volume considéré est de 90000 cm3',
	{
		'livraison colis . informations . catégorie': "'autre'",
	},
	90000
)

testColis(
	'livraison colis . informations . volume',
	'Volume du colis : pour tout autre produit, le volume considéré est de 90000 cm3',
	{
		'livraison colis . informations . catégorie': "'autre'",
	},
	90000
)

testColis(
	'livraison colis . informations . poids',
	'Poids du colis : grande consommation, 20kg',
	{
		'livraison colis . informations . catégorie': "'grande consommation'",
	},
	20
)

testColis(
	'livraison colis . informations . poids',
	'Poids du colis : habillement, 1.5kg',
	{
		'livraison colis . informations . catégorie': "'habillement'",
	},
	1.5
)

testColis(
	'livraison colis . informations . poids',
	'Poids du colis : culturel, 200g',
	{
		'livraison colis . informations . catégorie': "'culturel'",
	},
	0.2
)

testColis(
	'livraison colis . informations . poids',
	'Poids du colis : équipements volumineux, 70kg',
	{
		'livraison colis . informations . catégorie': "'équipements volumineux'",
	},
	70
)

testColis(
	'livraison colis . informations . poids',
	'Poids du colis : pour tout autre produit, le poids considéré est de 18kg',
	{
		'livraison colis . informations . catégorie': "'autre'",
	},
	18
)

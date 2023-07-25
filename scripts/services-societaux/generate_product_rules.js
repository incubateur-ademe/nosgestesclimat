const utils = require('./utils')

const empreinte_par_branche = utils.readYAML(
	'data/empreinte SDES/empreinte par branche.publicodes'
)

const répartition_autres_produits = utils.readYAML(
	'scripts/services-societaux/input/répartition_autres_produits.yaml'
)

const products_sum = Object.keys(répartition_autres_produits)
const subProducts_sum = Object.fromEntries(products_sum.map((key) => [key, []]))

const rulesToAdd = {}

const data = Object.entries(empreinte_par_branche).map(
	([ruleName, ruleNode]) => {
		if (
			!ruleName.includes('par hab') ||
			ruleName.includes('services publics') ||
			ruleName.includes('services marchands')
		) {
			return [ruleName, ruleNode]
		}
		const code_CPA = ruleName.split(' . ')[1].slice(0, 3)
		products_sum.map((subProduct) => {
			const répartition = répartition_autres_produits[subProduct][code_CPA]
			if (répartition) {
				const ruleName = `empreinte branche . ${code_CPA} par hab . ${subProduct}`
				rulesToAdd[ruleName] = {
					titre: `${répartition.ratio} ${ruleNode.titre}`,
					description: répartition.justification,
					formule: `${code_CPA} par hab * ratio ${subProduct}`,
					unité: 'kgCO2e',
				}
				ruleNode['avec'] = {
					...ruleNode['avec'],
					[`ratio ${subProduct}`]: répartition.ratio,
				}
				subProducts_sum[subProduct].push(ruleName)
			}
		})
		return [ruleName, ruleNode]
	}
)

const dataObject = Object.assign(Object.fromEntries(data), rulesToAdd)

const produits_object = {
	'divers . autres produits': {
		titre: 'Produits manufacturés neufs',
		abréviation: 'autres prod.',
		icônes: '📦',
		formule: { somme: products_sum },
		unité: 'kgCO2e',
		description: `A compléter.`,
	},
}

products_sum.map((product) => {
	produits_object[`divers . ${product}`] = {
		formule: { somme: subProducts_sum[product] },
		unité: 'kgCO2e',
	}
})

const messageGénérationAuto = `# Ce fichier a été généré automatiquement via le script 'scripts/generate_product_rules.js' dans le dépôt nosgestesclimat. 
# Le fichier permettant de modifier les données importantes de répartition et justification de ces produits
# est 'scripts/services-societaux/input/répartition_autres_produits.yaml'. Pour en savoir plus, n'hésitez pas à parcourir notre guide !\n\n`

utils.writeYAML(
	'data/empreinte SDES/empreinte par branche.publicodes',
	dataObject,
	`# Ce fichier a été généré automatiquement via le script 'scripts/generate_services_rules.js' dans le dépôt nosgestesclimat. 
# Le fichier permettant de modifier les données importantes de répartition et justification des services sociétaux
# est 'scripts/services-societaux/input/répartition_services_sociétaux.yaml'. Pour en savoir plus, n'hésitez pas à parcourir notre guide !\n\n`
)

utils.writeYAML(
	'data/divers/autres produits.publicodes',
	produits_object,
	messageGénérationAuto
)

console.log(
	'\x1b[32m',
	'- La règle `data/empreinte SDES/empreinte par branche.publicodess` a été mise à jour avec succès, la règle `divers/autres produits.publicodes` a été écrite avec succès.',
	'\x1b[0m'
)

console.warn('\x1b[33m', 'Veillez à bien vérifier les diff.', '\x1b[0m')

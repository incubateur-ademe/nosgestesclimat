const utils = require('./utils')

const readFile = utils.readJSON(
	'scripts/services-societaux/output/liste_SDES_traitée.json'
)

const analyseNAF = utils.readJSON(
	'scripts/services-societaux/output/analyse_CA_NAF.json'
)

const répartition = utils.readYAML(
	'scripts/services-societaux/input/répartition_NAF.yaml'
)

const titres = utils.readYAML(
	'scripts/services-societaux/input/titres_raccourcis.yaml'
)

const SP_sum = []
const SM_sum = []

const findNumber = /\d{2}/

const data = readFile.map(({ code_CPA, ...att }) => {
	const ruleCPA = `naf . ${code_CPA}`
	const ruleCPAparHab = `naf . ${code_CPA} par hab`
	const titre = att['Libellé CPA']
	const titre_raccourci = titres[code_CPA] || titre
	const composition = analyseNAF[+code_CPA.match(findNumber)]?.composition || []
	const description = composition.reduce((str, obj) => {
		const subDescription =
			obj.description.length > 1 &&
			obj.description.reduce((subStr, subObj) => {
				return subStr + `\n	- ${subObj.libellé} (${subObj.part})`
			}, '')
		const newStr = `\n- **${obj.libellé} (${obj.part})**`
		const newStrWithSub = subDescription ? newStr + subDescription : newStr
		return str + newStrWithSub
	}, '')
	const object = {
		[ruleCPA]: {
			titre: titre_raccourci,
			formule:
				att[
					'Émissions contenues dans les biens et services adressés à la demande finale de la France'
				],
			unité: 'ktCO2e',
			description: `${titre}\n${description}`,
		},
		[ruleCPAparHab]: {
			titre: `${titre_raccourci} par habitant`,
			formule: `${code_CPA} * 1000000 kgCO2e/ktCO2e / population`,
			unité: 'kgCO2e',
			description: `${titre} par habitant\n${description}`,
		},
	}
	const répartition_SP = répartition['services publics'][code_CPA]
	const répartition_SM = répartition['services marchands'][code_CPA]
	if (répartition_SP || répartition_SM) {
		const objavec = {}
		object[[ruleCPAparHab]]['avec'] = {}
		if (répartition_SP) {
			const ruleNameSP = `naf . ${code_CPA} par hab . services publics`
			objavec['ratio services publics'] = répartition_SP.ratio
			object[ruleNameSP] = {
				titre: `${répartition_SP.ratio} ${titre_raccourci}`,
				description: répartition_SP.justification,
				formule: `${code_CPA} par hab * ratio services publics`,
				unité: 'kgCO2e',
			}
			SP_sum.push(ruleNameSP)
		}
		if (répartition_SM) {
			const ruleNameSM = `naf . ${code_CPA} par hab . services marchands`
			objavec['ratio services marchands'] = répartition_SM.ratio
			object[ruleNameSM] = {
				titre: `${répartition_SM.ratio} ${titre_raccourci}`,
				description: répartition_SM.justification,
				formule: `${code_CPA} par hab * ratio services marchands`,
				unité: 'kgCO2e',
			}
			SM_sum.push(ruleNameSM)
		}
		Object.assign(object[ruleCPAparHab]['avec'], objavec)
	}
	return object
})

const dataObject = Object.assign({}, ...data)

const SPobject = {
	'services publics': {
		titre: 'Services publics',
		couleur: '#0c2461',
		abréviation: 'Publics',
		icônes: '🏛',
		formule: { somme: SP_sum },
		unité: 'ktCO2e',
	},
}

const SMobject = {
	'services marchands': {
		titre: 'Services marchands',
		couleur: '#3c0c61',
		abréviation: 'Marchands',
		icônes: '✉️',
		formule: { somme: SM_sum },
		unité: 'ktCO2e',
	},
}

// console.log(yaml.stringify(dataObject))

const messageGénérationAuto = `# Ce fichier a été généré automatiquement via le script 'scripts/generateNAF_YAML.js' dans le dépôt nosgestesclimat. 
# Le fichier permettant de modifier les données importantes de répartition et justification des services sociétaux
# est 'scripts/données/répartition_NAF.yaml'. Pour en savoir plus, n'hésitez pas à parcourir notre guide !\n\n`

utils.writeYAML('data/naf/naf.yaml', dataObject, messageGénérationAuto)
utils.writeYAML(
	'data/services sociétaux/services publics.yaml',
	SPobject,
	messageGénérationAuto
)
utils.writeYAML(
	'data/services sociétaux/services marchands.yaml',
	SMobject,
	messageGénérationAuto
)

const fs = require('fs')
const yaml = require('yaml')

const sdesFileName = 'scripts/naf/données/liste_SDES_traitée.json'
const readFile = fs.readFileSync(sdesFileName, 'utf8')

const répartitionFileName = 'scripts/naf/données/répartition_NAF.yaml'
const readFileRépartition = fs.readFileSync(répartitionFileName, 'utf8')
const répartition = yaml.parse(readFileRépartition)

const analyseCANAFFileName = 'scripts/naf/données/analyse_CA_naf.json'
const readFileanalyseCANAF = fs.readFileSync(analyseCANAFFileName, 'utf8')
const analyseNAF = JSON.parse(readFileanalyseCANAF)

const titresFileName = 'scripts/naf/données/titres_raccourcis.yaml'
const readFiletitres = fs.readFileSync(titresFileName, 'utf8')
const titres = yaml.parse(readFiletitres)

const SP_sum = []
const SMS_sum = []

const findNumber = /\d{2}/

const data = JSON.parse(readFile).map(({ code_CPA, ...att }) => {
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
	const répartition_SMS = répartition['services marchands'][code_CPA]
	if (répartition_SP || répartition_SMS) {
		const objavec = {}
		object[[ruleCPAparHab]]['avec'] = {}
		if (répartition_SP) {
			const ruleNameSP = `naf . ${code_CPA} par hab . services publics`
			objavec['ratio services publics'] = répartition_SP
			object[ruleNameSP] = {
				titre: `${répartition_SP} ${titre_raccourci}`,
				formule: `${code_CPA} par hab * ratio services publics`,
				unité: 'kgCO2e',
			}
			SP_sum.push(ruleNameSP)
		}
		if (répartition_SMS) {
			const ruleNameSMS = `naf . ${code_CPA} par hab . services marchands`
			objavec['ratio services marchands'] = répartition_SMS
			object[ruleNameSMS] = {
				titre: `${répartition_SMS} ${titre_raccourci}`,
				formule: `${code_CPA} par hab * ratio services marchands`,
				unité: 'kgCO2e',
			}
			SMS_sum.push(ruleNameSMS)
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

const SMSobject = {
	'services marchands': {
		titre: 'Services marchands',
		couleur: '#3c0c61',
		abréviation: 'Marchands',
		icônes: '✉️',
		formule: { somme: SMS_sum },
		unité: 'ktCO2e',
	},
}

console.log(yaml.stringify(dataObject))
fs.writeFileSync('data/naf/naf.yaml', yaml.stringify(dataObject))
fs.writeFileSync(
	'data/services sociétaux/services publics.yaml',
	yaml.stringify(SPobject)
)
fs.writeFileSync(
	'data/services sociétaux/services marchands.yaml',
	yaml.stringify(SMSobject)
)

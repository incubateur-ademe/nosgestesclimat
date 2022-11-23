const fs = require('fs')
const yaml = require('yaml')

const sdesFileName = 'scripts/naf/données/liste_SDES_traitée.json'
const readFile = fs.readFileSync(sdesFileName, 'utf8')

const répartitionFileName = 'scripts/naf/données/répartition_NAF.yaml'
const readFileRépartition = fs.readFileSync(répartitionFileName, 'utf8')

const répartition = yaml.parse(readFileRépartition)

const SP_sum = []
const SMS_sum = []

const data = JSON.parse(readFile).map(({ code_CPA, ...att }) => {
	const ruleCPA = `naf . ${code_CPA}`
	const ruleCPAparHab = `naf . ${code_CPA} par hab`
	const object = {
		[ruleCPA]: {
			titre: att['Libellé CPA'],
			formule:
				att[
					'Émissions contenues dans les biens et services adressés à la demande finale de la France'
				],
			unité: 'ktCO2e',
		},
		[ruleCPAparHab]: {
			titre: att['Libellé CPA'],
			formule: `${code_CPA} * 1000000 / population`,
			unité: 'kgCO2e',
		},
	}
	const répartition_SP = répartition['services publics'][code_CPA]
	const répartition_SMS =
		répartition['services marchands et sociétaux'][code_CPA]
	if (répartition_SP || répartition_SMS) {
		const objavec = {}
		object[[ruleCPAparHab]]['avec'] = {}
		if (répartition_SP) {
			const ruleNameSP = `naf . ${code_CPA} par hab . services publics`
			objavec['ratio services publics'] = répartition_SP
			object[ruleNameSP] = {
				titre: `attribution SP ${att['Libellé CPA']}`,
				formule: `${code_CPA} par hab * ratio services publics`,
				unité: 'kgCO2e',
			}
			SP_sum.push(ruleNameSP)
		}
		if (répartition_SMS) {
			const ruleNameSMS = `naf . ${code_CPA} par hab . services marchands et sociétaux`
			objavec['ratio services marchands et sociétaux'] = répartition_SMS
			object[ruleNameSMS] = {
				titre: `attribution SMS ${att['Libellé CPA']}`,
				formule: `${code_CPA} par hab * ratio services marchands et sociétaux`,
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
	publics: {
		titre: 'Services publics',
		couleur: '#0c2461',
		abbréviation: 'serv. publ.',
		icônes: '🏛',
		formule: { somme: SP_sum },
		unité: 'ktCO2e',
	},
}

const SMSobject = {
	'marchands et sociétaux': {
		titre: 'Services marchands et sociétaux',
		couleur: '#0c2461',
		abbréviation: 'serv. march.',
		icônes: '✉️',
		formule: { somme: SMS_sum },
		unité: 'ktCO2e',
	},
}

// console.log(yaml.stringify(dataObject))
fs.writeFileSync('data/naf/naf.yaml', yaml.stringify(dataObject))
fs.writeFileSync('data/services publics/SP.yaml', yaml.stringify(SPobject))
fs.writeFileSync('data/services publics/SMS.yaml', yaml.stringify(SMSobject))

const fs = require('fs')
const yaml = require('yaml')

const sdesFileName = 'scripts/naf/données/liste_SDES_traitée.json'
const readFile = fs.readFileSync(sdesFileName, 'utf8')

const répartitionFileName = 'scripts/naf/données/répartition_NAF.yaml'
const readFileRépartition = fs.readFileSync(répartitionFileName, 'utf8')

const répartition = yaml.parse(readFileRépartition)

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
			formule: `${code_CPA} * 1000 / population`,
			unité: 'tCO2e',
		},
	}
	const répartition_SP = répartition['services publics'][code_CPA]
	const répartition_SMS =
		répartition['services marchands et sociétaux'][code_CPA]
	if (répartition_SP || répartition_SMS) {
		const objavec = {}
		object[[ruleCPAparHab]]['avec'] = {}
		if (répartition_SP) {
			objavec['services publics'] = répartition_SP
		}
		if (répartition_SMS) {
			objavec['services marchands et sociétaux'] = répartition_SMS
		}
		Object.assign(object[ruleCPAparHab]['avec'], objavec)
	}
	return object
})

const dataObject = Object.assign({}, ...data)

// console.log(yaml.stringify(dataObject))
fs.writeFileSync('data/naf/naf.yaml', yaml.stringify(dataObject))

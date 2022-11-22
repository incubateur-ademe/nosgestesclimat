const fs = require('fs')
const yaml = require('yaml')

const sdesFileName = 'scripts/naf/données/liste_SDES_traitée.json'
const readFile = fs.readFileSync(sdesFileName, 'utf8')

const répartitionFileName = 'scripts/naf/données/répartition_NAF.yaml'
const readFileRépartition = fs.readFileSync(répartitionFileName, 'utf8')

const répartition = yaml.parse(readFileRépartition)

const data = JSON.parse(readFile).map(({ code_CPA, ...att }) => {
	const object = {
		[code_CPA]: {
			libellé: att['Libellé CPA'],
			formule:
				att[
					'Émissions contenues dans les biens et services adressés à la demande finale de la France'
				],
			unité: 'ktCO2e',
		},
	}
	const répartition_SP = répartition['services publics'][code_CPA]
	if (répartition_SP) {
		object[code_CPA]['services publics'] = répartition_SP
	}
	const répartition_SMS =
		répartition['services marchands et sociétaux'][code_CPA]
	if (répartition_SMS) {
		object[code_CPA]['services marchands et sociétaux'] = répartition_SMS
	}
	return object
})

const dataObject = Object.assign({}, ...data)

console.log(yaml.stringify(dataObject))
fs.writeFileSync(
	'scripts/naf/données/test_yaml.yaml',
	yaml.stringify(dataObject)
)

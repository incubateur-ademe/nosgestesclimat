const fs = require('fs')
const yaml = require('yaml')

const sdesFileName = 'data/NAF/liste_SDES_traitée.json'
const readFile = fs.readFileSync(sdesFileName, 'utf8')

const répartitionFileName = 'data/NAF/répartition_NAF.yaml'
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
	return object
})

const dataObject = Object.assign({}, ...data)

// console.log(yaml.stringify(dataObject))
// fs.writeFileSync('data/NAF/test_yaml.yaml', yaml.stringify(dataObject))

const fs = require('fs')
const yaml = require('yaml')

// utils
const roundValue = (x) => Math.round(x * 100) / 100

// read files
const nafFileName = 'data/NAF/liste_NAF_level2.json'
const sdesFileName = 'data/NAF/liste_SDES.json'
const divisionNAFFileName = 'data/NAF/division_NAF.yaml'

const readNAF = fs.readFileSync(nafFileName, 'utf8')
const NAF_level2 = JSON.parse(readNAF)

const readDivision = fs.readFileSync(divisionNAFFileName, 'utf8')
const division_NAF = yaml.parse(readDivision)

const checkDivision = (division_NAF) => {
	Object.entries(division_NAF).map(([key, obj]) => {
		const checkSum = Object.values(obj).reduce((acc, att) => {
			if (att.part || att.part === 0) {
				if (att.part === 'défaut') {
					return true
				} else if (isNaN(att.part)) {
					throw new Error("L'attribut `part` doit être un nombre")
				} else {
					return acc + att.part
				}
			} else {
				return acc
			}
		}, null)
		if (!(checkSum === true || checkSum === 100)) {
			throw new Error(
				`La répartition des parts attribuées à chaque division doit couvrir 100% de ${key}`
			)
		}
	})
}

try {
	checkDivision(division_NAF)
	console.log(`✅ Le fichier`, divisionNAFFileName, `a été défini correctement`)
} catch (err) {
	console.log(
		`❌ Une erreur est survenue lors l'analyse du fichier`,
		divisionNAFFileName,
		':\n\n',
		err.message
	)
	exit(-1)
}

const readSDES = fs.readFileSync(sdesFileName, 'utf8')
const dataSDES = JSON.parse(readSDES)
	.map((obj) => {
		const CPA = obj['code_CPA'].split('CPA_')[1]
		const composition = CPA.split('_')
		if (composition.length === 1) {
			return {
				...obj,
				code_CPA: composition[0],
			}
		} else {
			const findNumber = /\d+/
			const findLetter = /[A-Z]/
			const letter = composition[0].match(findLetter)
			const indexes = composition.map((elt) => +elt.match(findNumber))
			const newComposition = Array.from(
				{ length: indexes[1] - indexes[0] + 1 },
				(_, i) => letter + String(indexes[0] + i).padStart(2, '0')
			)
			const compositionLength = newComposition.length
			const newObjects = newComposition.map((elt) => {
				const facteurPotentiel = division_NAF[CPA][elt].part
				const facteur =
					facteurPotentiel === 'défaut'
						? 1 / compositionLength
						: facteurPotentiel
				return {
					code_CPA: elt,
					'Libellé CPA': NAF_level2.find((obj) => obj.code_NAF === elt)[
						'libellé'
					],
					'Émissions contenues dans les biens et services adressés à la demande finale de la France':
						roundValue(
							obj[
								'Émissions contenues dans les biens et services adressés à la demande finale de la France'
							] * facteur
						),
					'émissions de la production intérieure (hors exportations)':
						roundValue(
							obj['émissions de la production intérieure (hors exportations)'] *
								facteur
						),
					'émissions associées aux importations': roundValue(
						obj['émissions associées aux importations'] * facteur
					),
				}
			})
			return newObjects
		}
	})
	.flat()

// fs.writeFileSync('data/NAF/liste_SDES_traitée.json', JSON.stringify(dataSDES))
// console.log(dataSDES)

const fs = require('fs')

const nafFileName = 'data/NAF/liste_NAF.json'
const sdesFileName = 'data/NAF/liste_SDES.json'

const readSDES = fs.readFileSync(sdesFileName, 'utf8')
const dataSDES = JSON.parse(readSDES)
	.map((obj) => {
		const composition = obj['code_CPA'].split('_')
		composition.shift()
		if (composition.length === 1) {
			return {
				code_CPA: composition[0],
				'Émissions contenues dans les biens et services adressés à la demande finale de la France':
					obj[
						'Émissions contenues dans les biens et services adressés à la demande finale de la France'
					],
				'émissions de la production intérieure (hors exportations)':
					obj['émissions de la production intérieure (hors exportations)'],
				'émissions associées aux importations':
					obj['émissions associées aux importations'],
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
			const facteur = newComposition.length
			const newObjects = newComposition.map((elt) => {
				return {
					code_CPA: elt,
					'Émissions contenues dans les biens et services adressés à la demande finale de la France':
						obj[
							'Émissions contenues dans les biens et services adressés à la demande finale de la France'
						] / facteur,
					'émissions de la production intérieure (hors exportations)':
						obj['émissions de la production intérieure (hors exportations)'] /
						facteur,
					'émissions associées aux importations':
						obj['émissions associées aux importations'] / facteur,
				}
			})
			return newObjects
		}
	})
	.flat()
fs.writeFileSync('data/NAF/liste_SDES_traitée.json', JSON.stringify(dataSDES))
console.log(dataSDES)
const readNAF = fs.readFileSync(nafFileName, 'utf8')
const data = JSON.parse(readNAF).reduce((memo, elt) => {
	const lastId = memo.length > 0 && memo[memo.length - 1].code_NAF
	const currentId = elt.id_1 + elt.id_2
	if (lastId !== currentId) {
		memo.push({
			code_NAF: currentId,
			description: elt.label_2,
			co2e: dataSDES.find((obj) => obj.code_CPA === currentId)
				? dataSDES.find((obj) => obj.code_CPA === currentId)[
						'Émissions contenues dans les biens et services adressés à la demande finale de la France'
				  ]
				: 0,
		})
	}
	return memo
}, [])

// console.log(data)
// fs.writeFileSync('data/NAF/liste_NAF2.json', json)

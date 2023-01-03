const utils = require('./utils')

const getGroupSum = (groupObj) => {
	let countS = 0
	const objLength = Object.keys(groupObj).length
	const sumCA = Object.values(groupObj).reduce((acc, elt) => {
		const ca = elt['ca']
		if (!ca) {
			elt['ca'] = 0
			return acc
		}
		if (ca === 'S') {
			countS++
			return acc
		}
		return acc + +ca
	}, 0)
	if (countS === objLength) return 'S'
	return sumCA
}

const getPart = (nafObj, sumCA) => {
	if (!sumCA || nafObj['ca'] === 'S') {
		return 'S'
	} else if (!+nafObj['ca']) {
		return 0
	}
	{
		return utils.roundValueToPercent(nafObj['ca'] / sumCA)
	}
}

// read files
const readSDES = utils.readJSON(
	'scripts/services-societaux/input/liste_SDES.json'
)
const division_NAF = utils.readJSON(
	'scripts/services-societaux/input/division_NAF.json'
)
const ca_branches = utils.readJSON(
	'scripts/services-societaux/input/ca_branches_2017.json'
)
const readNAF = utils.readJSON(
	'scripts/services-societaux/input/liste_NAF.json'
)

// Get list of NAF code level 2 as :
// [{
// 	"code_NAF": "A01",
// 	"libellé": "Culture et production animale, chasse et services annexes"
// },
// { "code_NAF": "A02", "libellé": "Sylviculture et exploitation forestière" },
// { "code_NAF": "A03", "libellé": "Pêche et aquaculture" },
// { "code_NAF": "B05", "libellé": "Extraction de houille et de lignite" },
// ...
// }]
const NAF_niveau2 = readNAF.reduce((memo, elt) => {
	const lastId = memo.length > 0 && memo[memo.length - 1].code_NAF
	const currentId = elt.id_1 + elt.id_2
	if (lastId !== currentId) {
		memo.push({
			code_NAF: currentId,
			libellé: elt.label_2,
		})
	}
	return memo
}, [])

const findNumber = /\d{2}/
Object.entries(division_NAF).map(([key, nafGroupObj]) => {
	Object.entries(nafGroupObj).map(([naf, nafObj]) => {
		const nafCode = naf.match(findNumber)[0]
		const findCa = ca_branches.find((obj) => obj.branche === nafCode)
		const ca = findCa && findCa['ca']
		nafObj['ca'] = ca //98 non présent dans 'ca_branches_2017'
	})
	Object.entries(nafGroupObj).map(([naf, nafObj]) => {
		const nafCA = getGroupSum(nafGroupObj)
		const part = getPart(nafObj, nafCA)
		nafObj['part'] = part
	})
	division_NAF[key] = nafGroupObj
})

const dataSDES = readSDES
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
			const newObjects = newComposition.map((elt) => {
				const facteur =
					division_NAF[CPA][elt].part === 'S'
						? 0
						: division_NAF[CPA][elt].part / 100
				return {
					code_CPA: elt,
					'Libellé CPA': NAF_niveau2.find((obj) => obj.code_NAF === elt)[
						'libellé'
					],
					'Émissions contenues dans les biens et services adressés à la demande finale de la France':
						utils.roundValue(
							obj[
								'Émissions contenues dans les biens et services adressés à la demande finale de la France'
							] * facteur
						),
					'émissions de la production intérieure (hors exportations)':
						utils.roundValue(
							obj['émissions de la production intérieure (hors exportations)'] *
								facteur
						),
					'émissions associées aux importations': utils.roundValue(
						obj['émissions associées aux importations'] * facteur
					),
				}
			})
			return newObjects
		}
	})
	.flat()

// console.log(dataSDES)
utils.writeJSON(
	'scripts/services-societaux/output/liste_SDES_traitée.json',
	dataSDES
)

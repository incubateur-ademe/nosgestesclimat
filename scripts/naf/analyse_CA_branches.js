const fs = require('fs')
const yaml = require('yaml')

// utils
const roundValuePoucent = (x) => Math.round(x * 100)

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
		return '0%'
	}
	{
		return `${roundValuePoucent(nafObj['ca'] / sumCA)}%`
	}
}

const sortJSON = (unordered) =>
	Object.keys(unordered)
		.sort()
		.reduce((obj, key) => {
			obj[+key] = unordered[key]
			return obj
		}, {})

// read files
const ca_branchesFilename = 'scripts/naf/données/ca_branches_2017.json'
const read_ca_branches = fs.readFileSync(ca_branchesFilename, 'utf8')
const ca_branches = JSON.parse(read_ca_branches)

const findNumber = /\d{2}/

const data = {}

const ca_lvl2 = Object.values(ca_branches).filter((obj) => {
	branche = obj['branche']
	const findCode = branche.length === 2 && branche.match(findNumber)
	return findCode && findCode[0]
})

Object.values(ca_lvl2).map((nafGroupObj) => {
	const nafCode = nafGroupObj['branche']
	const nafComposition = Object.values(ca_branches).filter((obj) => {
		const branche = obj['branche']
		const findChildren = new RegExp(`${nafCode}[0-9]`)
		const findCode = branche.length === 3 && branche.match(findChildren)
		return findCode
	})
	Object.values(nafComposition).map((nafObj) => {
		nafObj['part'] = ''
	})
	Object.values(nafComposition).map((nafObj) => {
		const nafSubCode = nafObj['branche']
		const nafSubComposition = Object.values(ca_branches).filter((obj) => {
			const branche = obj['branche']
			const findChildren = new RegExp(`${nafSubCode}[0-9]`)
			const findCode = branche.length === 4 && branche.match(findChildren)
			return findCode
		})
		const nafSubCA =
			nafObj['ca'] && nafObj['ca'] !== 'S'
				? +nafObj['ca']
				: getGroupSum(nafSubComposition)
		nafObj['ca'] = nafSubCA
		Object.values(nafSubComposition).map((nafObj) => {
			const part = getPart(nafObj, nafSubCA)
			nafObj['part'] = part
		})
		nafObj['description'] = nafSubComposition
	})
	const nafCA =
		nafGroupObj['ca'] && nafGroupObj['ca'] !== 'S'
			? +nafGroupObj['ca']
			: getGroupSum(nafComposition)
	nafGroupObj['ca'] = nafCA
	Object.values(nafComposition).map((nafObj) => {
		const part = getPart(nafObj, nafCA)
		nafObj['part'] = part
	})
	data[nafCode] = { ...nafGroupObj, composition: nafComposition }
	nafGroupObj['composition'] = nafComposition
})

// console.log(sortJSON(data))
fs.writeFileSync(
	'scripts/naf/données/analyse_CA_naf.json',
	JSON.stringify(sortJSON(data))
)

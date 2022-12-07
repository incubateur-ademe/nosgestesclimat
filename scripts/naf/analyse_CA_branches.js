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
	const partCAConnue = 1 - countS / objLength
	return sumCA / partCAConnue
}

const getPart = (nafObj, groupObj) => {
	if (nafObj['ca'] === 'S') {
		const objLength = Object.keys(groupObj).length
		return roundValuePoucent(1 / objLength)
	} else {
		const sumCA = getGroupSum(groupObj)
		return roundValuePoucent(nafObj['ca'] / sumCA)
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
		const part = getPart(nafObj, nafComposition)
		nafObj['part'] = `${part}%`
	})
	Object.values(nafComposition).map((nafObj) => {
		const nafSubCode = nafObj['branche']
		const nafSubComposition = Object.values(ca_branches).filter((obj) => {
			const branche = obj['branche']
			const findChildren = new RegExp(`${nafSubCode}[0-9]`)
			const findCode = branche.length === 4 && branche.match(findChildren)
			return findCode
		})
		Object.values(nafSubComposition).map((nafObj) => {
			const part = getPart(nafObj, nafSubComposition)
			nafObj['part'] = `${part}%`
		})
		nafObj['description'] = nafSubComposition
	})
	data[nafCode] = { ...nafGroupObj, composition: nafComposition }
	nafGroupObj['composition'] = nafComposition
})

console.log(sortJSON(data))
fs.writeFileSync('analyse_CA_naf.json', JSON.stringify(sortJSON(data)))

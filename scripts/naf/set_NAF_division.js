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
	return [sumCA, 1 - countS / objLength]
}

const getPart = (naf, groupObj) => {
	if (groupObj[naf]['ca'] === 'S') {
		const objLength = Object.keys(groupObj).length
		return roundValuePoucent(1 / objLength)
	} else {
		const [sumCA, ratioCA] = getGroupSum(groupObj)
		return roundValuePoucent((groupObj[naf]['ca'] / sumCA) * ratioCA)
	}
}

// read files
const ca_branchesFilename = 'scripts/naf/données/ca_branches_2017.json'
const division_NAFFilename = 'scripts/naf/données/division_NAF.json'

const read_ca_branches = fs.readFileSync(ca_branchesFilename, 'utf8')
const read_division = fs.readFileSync(division_NAFFilename, 'utf8')

const ca_branches = JSON.parse(read_ca_branches)
const division = JSON.parse(read_division)

const findNumber = /\d{2}/

// setPart to json division
Object.entries(division).map(([key, nafGroupObj]) => {
	Object.entries(nafGroupObj).map(([naf, nafObj]) => {
		const nafCode = naf.match(findNumber)[0]
		const findCa = ca_branches.find((obj) => obj.BRANCHE === nafCode)
		const ca = findCa && findCa["Chiffre d'affaires de la branche"]
		nafObj['ca'] = ca //98 non présent dans 'ca_branches_2017'
	})
	Object.entries(nafGroupObj).map(([naf, nafObj]) => {
		const part = getPart(naf, nafGroupObj)
		nafObj['part'] = part
	})
	division[key] = nafGroupObj
})

// console.log(division)
fs.writeFileSync(division_NAFFilename, JSON.stringify(division))

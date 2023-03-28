const fs = require('fs')
const { format, resolveConfig } = require('prettier')
const yaml = require('yaml')

const readJSON = (path) => {
	return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

const sortJSON = (unordered) =>
	Object.keys(unordered)
		.sort()
		.reduce((obj, key) => {
			obj[+key] = unordered[key]
			return obj
		}, {})

const writeJSON = (path, content, messageGénérationAuto = '') => {
	resolveConfig(process.cwd()).then((prettierConfig) =>
		fs.writeFileSync(
			path,
			format(messageGénérationAuto + JSON.stringify(content), {
				...prettierConfig,
				parser: 'json',
			})
		)
	)
}

//Duplicate of readYAML in i18n/utils.js
const readYAML = (path) => {
	return yaml.parse(fs.readFileSync(path, 'utf-8'))
}

//Duplicate of writeYAML in i18n/utils.js
const writeYAML = (
	path,
	content,
	messageGénérationAuto = '',
	blockQuote = 'literal'
) => {
	resolveConfig(process.cwd()).then((prettierConfig) =>
		fs.writeFileSync(
			path,
			format(
				messageGénérationAuto +
					yaml.stringify(content, {
						sortMapEntries: true,
						aliasDuplicateObjects: false,
						blockQuote,
						lineWidth: 0,
					}),
				{ ...prettierConfig, parser: 'yaml' }
			)
		)
	)
}

const roundValueToPercent = (x) => Math.round(x * 100)

const roundValue = (x) => Math.round(x * 100) / 100

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
		return roundValueToPercent(nafObj['ca'] / sumCA)
	}
}

module.exports = {
	readJSON,
	writeJSON,
	sortJSON,
	readYAML,
	writeYAML,
	roundValueToPercent,
	roundValue,
	getGroupSum,
	getPart,
}

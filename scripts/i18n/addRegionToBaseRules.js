/*
	Function used to combine translated attributes (e.g. questions, titles, notes) with
	the base rules.

	NOTE: this function is used by the RulesProvider.js file of the website.
*/

const cli = require('./cli.js')

const R = require('ramda')

const addRegionToBaseRules = (baseRules, translatedRules) => {
	const updateBaseRules = (key, val) => {
		if (R.path(key, baseRules)) {
			baseRules = R.assocPath(key, val, baseRules)
		} else {
			cli.printWarn(
				`[SKIPPED] - There is no "${key[1]}" attibute in the rule "${key[0]}" of base rules.`
			)
		}
	}
	Object.entries(translatedRules).forEach(([rule, attrs]) => {
		if (!Object.keys(baseRules).includes(rule)) {
			cli.printWarn(`[SKIPPED] - There is no rule "${rule}" in base rules.`)
			return baseRules
		}
		Object.entries(attrs)
			.filter(([attr, _]) => !attr.endsWith('.lock'))
			.forEach(([attr, transVal]) => {
				updateBaseRules([rule, attr], transVal)
			})
	})
	return baseRules
}

module.exports = {
	addRegionToBaseRules,
}

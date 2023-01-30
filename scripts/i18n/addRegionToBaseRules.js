/*
	Function used to combine translated attributes (e.g. questions, titles, notes) with
	the base rules.

	NOTE: this function is used by the RulesProvider.js file of the website.
*/

const R = require('ramda')

const addRegionToBaseRules = (baseRules, translatedRules) => {
	const updateBaseRules = (key, val) => {
		if (R.path(key, baseRules)) {
			baseRules = R.assocPath(key, val, baseRules)
		}
	}
	Object.entries(translatedRules).forEach(([rule, attrs]) => {
		if (!Object.keys(baseRules).includes(rule)) {
			return baseRules
		}
		Object.entries(attrs).forEach(([attr, transVal]) => {
			updateBaseRules([rule, attr], transVal)
		})
	})
	return baseRules
}

module.exports = {
	addRegionToBaseRules,
}

/*
	Function used to combine translated attributes (e.g. questions, titles, notes) with
	the base rules.

	NOTE: this function is used by the RulesProvider.js file of the website.
*/

const utils = require('./utils')

const addRegionToBaseRules = (baseRules, newRegionalRules) => {
	const updateBaseRules = (key, val) => {
		if (utils.path(key, baseRules)) {
			baseRules = utils.customAssocPath(key, val, baseRules)
		}
	}
	Object.entries(newRegionalRules).forEach(([rule, attrs]) => {
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
